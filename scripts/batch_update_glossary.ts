
import { PrismaClient, Prisma } from '@prisma/client'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config()

const prisma = new PrismaClient()

async function main() {
    console.log("Starting Batch Glossary Update...")

    let apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        console.log("OPENAI_API_KEY not found in env. Checking SystemSettings...")
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'openai_api_key' }
        })
        if (setting && setting.value) {
            apiKey = setting.value as string
            console.log("API Key found in SystemSettings.")
        }
    }

    if (!apiKey) {
        console.error("Error: OPENAI_API_KEY is not set in env or db.")
        process.exit(1)
    }

    const openai = new OpenAI({ apiKey })

    // 1. Fetch Context (Assets + Research)
    console.log("Fetching Context...")
    const validatedAssets = await prisma.contentItem.findMany({
        where: { status: 'Validado' },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: { title: true, primaryPillar: true, observations: true }
    })

    const researchItems = await prisma.researchSource.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, summary: true, findings: true, apa: true }
    })

    // 2. Fetch Taxonomy V2 (Active Hierarchy)
    const taxonomyNodes = await prisma.taxonomy.findMany({
        where: { active: true },
        select: { name: true, type: true, parent: { select: { name: true } } }
    })

    // Build simple hierarchy text
    const pillars = taxonomyNodes.filter((n: any) => n.type === 'Pillar').map((n: any) => n.name)
    const competencies = taxonomyNodes.filter((n: any) => n.type === 'Competence').map((n: any) => `${n.name} (Sub: ${n.parent?.name})`)

    const taxonomyContext = `
    TAXONOMY V2 CONTEXT (Use to categorize):
    - PILLARS: ${pillars.join(', ')}
    - COMPETENCIES: ${competencies.slice(0, 50).join(', ')}... (partial list)
    `

    const context = `
    ACTIVE ASSETS CONTEXT (Practical Examples):
    ${validatedAssets.map((a: any) => `- ${a.title} (${a.primaryPillar}): ${a.observations?.substring(0, 200)}`).join('\n')}

    RESEARCH CONTEXT (Theoretical Backing):
    ${researchItems.map((r: any) => `- [ID: ${r.id}] ${r.title}: ${r.summary?.substring(0, 200)} (APA: ${r.apa})`).join('\n')}
    
    ${taxonomyContext}
    `

    // 3. Fetch All Glossary Terms
    const allTerms = await prisma.glossaryTerm.findMany()
    console.log(`Found ${allTerms.length} terms to update.`)

    // Load ALL embeddings into memory (for this scale it's fine)
    console.log("Loading embeddings for RAG...")

    const contentEmbeddings = await prisma.contentItem.findMany({
        // @ts-ignore
        where: { embedding: { not: Prisma.JsonNull } },
        // @ts-ignore
        select: { id: true, title: true, primaryPillar: true, observations: true, embedding: true }
    })

    const researchEmbeddings = await prisma.researchSource.findMany({
        // @ts-ignore
        where: { embedding: { not: Prisma.JsonNull } },
        // @ts-ignore
        select: { id: true, title: true, summary: true, apa: true, embedding: true }
    })

    console.log(`Loaded ${contentEmbeddings.length} content vectors and ${researchEmbeddings.length} research vectors.`)

    // Helper for cosine similarity
    function cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0, normA = 0, normB = 0
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i]
            normA += vecA[i] * vecA[i]
            normB += vecB[i] * vecB[i]
        }
        return (normA === 0 || normB === 0) ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
    }

    let successCount = 0
    let failureCount = 0

    for (const termRecord of allTerms) {
        console.log(`\nProcessing term: "${termRecord.term}"...`)

        // A. Generate embedding for the TERM
        let termEmbedding: number[] | null = null
        try {
            const embeddingResp = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: termRecord.term,
                encoding_format: 'float'
            })
            termEmbedding = embeddingResp.data[0].embedding
        } catch (e: any) {
            console.error(`  Failed to embed term: ${e.message}`)
            failureCount++
            continue
        }

        if (!termEmbedding) continue

        // B. Find Top 5 Related Assets
        const rankedAssets = contentEmbeddings.map(item => ({
            ...item,
            // @ts-ignore
            similarity: cosineSimilarity(termEmbedding!, item.embedding as number[])
        })).sort((a, b) => b.similarity - a.similarity).slice(0, 5)

        // C. Find Top 5 Related Research
        const rankedResearch = researchEmbeddings.map(item => ({
            ...item,
            // @ts-ignore
            similarity: cosineSimilarity(termEmbedding!, item.embedding as number[])
        })).sort((a, b) => b.similarity - a.similarity).slice(0, 5)

        console.log(`  Top Asset: ${rankedAssets[0]?.title} (${rankedAssets[0]?.similarity.toFixed(4)})`)
        console.log(`  Top Research: ${rankedResearch[0]?.title} (${rankedResearch[0]?.similarity.toFixed(4)})`)

        // D. Build Specific RAG Context
        const ragContext = `
        CONTEXTO DE ACTIVOS (Similares al término):
        ${rankedAssets.map((a: any) => `- ${a.title} (${a.primaryPillar}): ${a.observations?.substring(0, 300)}`).join('\n')}

        CONTEXTO DE INVESTIGACIÓN (Similares al término):
        ${rankedResearch.map((r: any) => `- [ID: ${r.id}] ${r.title}: ${r.summary?.substring(0, 300)} (APA: ${r.apa})`).join('\n')}
        
        ${taxonomyContext}
        `

        const prompt = `
        Define el término "${termRecord.term}" bajo el marco de la metodología 4Shine.
        
        FUENTES DE INFORMACIÓN (RAG ACTIVADO):
        1. Contexto de Activos: Estos son los activos MÁS RELEVANTES semánticamente encontrados en el inventario. Úsalos para dar ejemplos precisos.
        2. Contexto de Investigación: Estas son las fuentes científicas MÁS RELEVANTES. Úsalas para sustento teórico.
        3. Taxonomía V2: Clasifica el término correctamente.

        REGLAS DE CITACIÓN (CRÍTICO):
        1. Si usas información del "RESEARCH CONTEXT", DEBES citar al autor usando formato APA 7.
        2. ADEMÁS, la cita debe ser un hipervínculo en formato Markdown que lleve a la fuente.
        3. Formato del Link: [Autor, Año](/research?id=ID_DE_LA_FUENTE)
        Ejemplo: "...como afirma [Smith, 2023](/research?id=clq...) en su estudio..."

        ${ragContext}

        Responde ÚNICAMENTE con un JSON:
        {
            "definition": "Definición conceptual robusta (máx 500 caracteres). Integra explícitamente los hallazgos del contexto recuperado.",
            "pillars": ["Shine Within"], 
            "relatedCompetency": "Nombre de la competencia",
            "sourceType": "Teórico" // "Práctico", "Híbrido"
        }
        `

        try {
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o",
                temperature: 0.3,
                response_format: { type: "json_object" }
            })

            const content = completion.choices[0].message.content
            if (!content) throw new Error("Empty response from OpenAI")

            const parsed = JSON.parse(content)

            // Update Database
            await prisma.glossaryTerm.update({
                where: { id: termRecord.id },
                data: {
                    definition: parsed.definition,
                    pillars: parsed.pillars || [],
                    // @ts-ignore
                    relatedCompetency: parsed.relatedCompetency || null,
                    // @ts-ignore
                    sourceType: parsed.sourceType || 'Teórico'
                }
            })

            console.log(`  Saved: ${termRecord.term}`)
            successCount++

        } catch (error: any) {
            console.error(`  Failed generation: ${error.message}`)
            failureCount++
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 300))
    }

    console.log(`\nBatch RAG Update Complete. Success: ${successCount}, Failures: ${failureCount}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
