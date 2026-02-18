
import { PrismaClient, Prisma } from '@prisma/client'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
import { EmbeddingsService } from '../lib/embeddings'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config()

const prisma = new PrismaClient()

async function main() {
    console.log("Starting Taxonomy Backfill for Glossary...")

    let apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        const setting = await prisma.systemSettings.findUnique({ where: { key: 'openai_api_key' } })
        if (setting && setting.value) apiKey = setting.value as string
    }

    if (!apiKey) {
        console.error("Error: OPENAI_API_KEY is not set.")
        process.exit(1)
    }

    const openai = new OpenAI({ apiKey })

    // 1. Identify Missing Terms
    const taxonomyNodes = await prisma.taxonomy.findMany({
        where: {
            active: true,
            type: { in: ['Pillar', 'Subcomponent', 'Sub', 'Component', 'Competence', 'Comp'] }
        },
        select: { name: true, type: true }
    })
    const existingTerms = await prisma.glossaryTerm.findMany({ select: { term: true } })

    const existingSet = new Set(existingTerms.map(t => t.term.trim().toLowerCase()))

    // Filter nodes that are NOT in the glossary
    const missingNodes = taxonomyNodes.filter(node => !existingSet.has(node.name.trim().toLowerCase()))

    console.log(`\nAnalysis:`)
    console.log(`- Total Active Taxonomy Nodes: ${taxonomyNodes.length}`)
    console.log(`- Existing Glossary Terms: ${existingTerms.length}`)
    console.log(`- Missing Definitions: ${missingNodes.length}`)

    if (missingNodes.length === 0) {
        console.log("All taxonomy nodes are already defined. Exiting.")
        return
    }

    console.log(`\nStarting generation for ${missingNodes.length} terms...`)

    // 2. Load Embeddings for RAG
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

    console.log(`Context Loaded: ${contentEmbeddings.length} assets, ${researchEmbeddings.length} research items.`)

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

    // 3. Process Each Missing Term
    let successCount = 0
    let failureCount = 0

    for (const node of missingNodes) {
        const term = node.name.trim()
        console.log(`\nGenerating definition for: "${term}" (${node.type})...`)

        // A. Generate embedding for the TERM
        let termEmbedding: number[] | null = null
        try {
            const embeddingResp = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: term,
                encoding_format: 'float'
            })
            termEmbedding = embeddingResp.data[0].embedding
        } catch (e: any) {
            console.error(`  Failed to embed term: ${e.message}`)
            failureCount++
            continue
        }

        if (!termEmbedding) continue

        // B. RAG Retrieval
        const rankedAssets = contentEmbeddings.map(item => ({
            ...item,
            // @ts-ignore
            similarity: cosineSimilarity(termEmbedding!, item.embedding as number[])
        })).sort((a, b) => b.similarity - a.similarity).slice(0, 5)

        const rankedResearch = researchEmbeddings.map(item => ({
            ...item,
            // @ts-ignore
            similarity: cosineSimilarity(termEmbedding!, item.embedding as number[])
        })).sort((a, b) => b.similarity - a.similarity).slice(0, 5)

        // C. Build RAG Context
        const ragContext = `
        CONTEXTO DE ACTIVOS (Similares al término):
        ${rankedAssets.map((a: any) => `- ${a.title} (${a.primaryPillar}): ${a.observations?.substring(0, 300)}`).join('\n')}

        CONTEXTO DE INVESTIGACIÓN (Similares al término):
        ${rankedResearch.map((r: any) => `- [ID: ${r.id}] ${r.title}: ${r.summary?.substring(0, 300)} (APA: ${r.apa})`).join('\n')}
        `

        // D. Prompt
        const prompt = `
        Define el término "${term}" bajo el marco de la metodología 4Shine.
        Nota: Este término es parte de la Taxonomía oficial (Tipo: ${node.type}).

        FUENTES DE INFORMACIÓN (RAG ACTIVADO):
        1. Contexto de Activos: Ejemplos prácticos del inventario.
        2. Contexto de Investigación: Sustento teórico.
        
        REGLAS DE CITACIÓN (CRÍTICO):
        1. Si usas información del "RESEARCH CONTEXT", DEBES citar al autor usando formato APA 7.
        2. ADEMÁS, la cita debe ser un hipervínculo en formato Markdown: [Autor, Año](/research?id=ID_DE_LA_FUENTE)

        ${ragContext}

        Responde ÚNICAMENTE con un JSON:
        {
            "definition": "Definición conceptual robusta (máx 500 caracteres). Integra explícitamente los hallazgos del contexto recuperado.",
            "pillars": ["Shine Within"], 
            "relatedCompetency": "${node.type === 'Competence' ? term : 'Nombre de la competencia'}",
            "sourceType": "Teórico"
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

            // Save to Database (Check existence one last time to prevent race/error)
            const exists = await prisma.glossaryTerm.findUnique({ where: { term: term } })
            if (!exists) {
                await prisma.glossaryTerm.create({
                    data: {
                        term: term,
                        definition: parsed.definition,
                        pillars: parsed.pillars || [],
                        // @ts-ignore
                        relatedCompetency: parsed.relatedCompetency || null,
                        // @ts-ignore
                        sourceType: parsed.sourceType || 'Teórico'
                    }
                })
                console.log(`  Created: ${term}`)
                successCount++
            } else {
                console.log(`  Skipped (Duplicate): ${term}`)
            }

        } catch (error: any) {
            console.error(`  Failed generation: ${error.message}`)
            failureCount++
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`\nBackfill Complete. Created: ${successCount}, Failed: ${failureCount}`)
}

main()
    .catch((e) => {
        console.error(e)
        // process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
