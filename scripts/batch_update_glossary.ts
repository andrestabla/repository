
import { PrismaClient } from '@prisma/client'
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

    let successCount = 0
    let failureCount = 0

    for (const termRecord of allTerms) {
        console.log(`Updating term: ${termRecord.term}...`)

        const prompt = `
        Define el término "${termRecord.term}" bajo el marco de la metodología 4Shine.
        
        FUENTES DE INFORMACIÓN:
        1. Contexto de Activos: Úsalo para dar ejemplos prácticos de cómo se aplica.
        2. Contexto de Investigación: Úsalo para dar sustento teórico (cita fuentes si aplica).
        3. Taxonomía V2: Identifica a qué Pilar o Competencia pertenece este término.

        REGLAS DE CITACIÓN (CRÍTICO):
        1. Si usas información del "RESEARCH CONTEXT", DEBES citar al autor usando formato APA 7.
        2. ADEMÁS, la cita debe ser un hipervínculo en formato Markdown que lleve a la fuente.
        3. Formato del Link: [Autor, Año](/research?id=ID_DE_LA_FUENTE)
        Ejemplo: "...como afirma [Smith, 2023](/research?id=clq...) en su estudio..."

        ${context}

        Responde ÚNICAMENTE con un JSON:
        {
            "definition": "Definición conceptual robusta (máx 500 caracteres). Si aplica, incluye ejemplos prácticos del inventario.",
            "pillars": ["Shine Within"], // Pilares relacionados detectados de la Taxonomía
            "relatedCompetency": "Nombre de la competencia (si aplica)",
            "sourceType": "Teórico" // o "Práctico" o "Híbrido"
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
                    relatedCompetency: parsed.relatedCompetency || null,
                    sourceType: parsed.sourceType || 'Teórico'
                }
            })

            console.log(`  Target: ${termRecord.term} -> Success`)
            successCount++

        } catch (error: any) {
            console.error(`  Target: ${termRecord.term} -> Failed: ${error.message}`)
            failureCount++
        }

        // Small delay to be nice to rate limits
        await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`\nBatch Update Complete. Success: ${successCount}, Failures: ${failureCount}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
