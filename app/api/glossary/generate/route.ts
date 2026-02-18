import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { OpenAIService } from '@/lib/openai'

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { term } = await request.json()
        if (!term) return NextResponse.json({ error: 'Term required' }, { status: 400 })

        // 1. Fetch Context (Assets + Research)
        const validatedAssets = await prisma.contentItem.findMany({
            where: { status: 'Validado' },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: { title: true, primaryPillar: true, observations: true }
        })

        const researchItems = await prisma.researchSource.findMany({
            take: 5, // Increased context window? Keep small for now or sort by relevance if possible (text search not available)
            // Ideally we'd search for relevant items, but random recent is "ok" for general context if no vector DB. 
            // Better: just generic recent context.
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, summary: true, findings: true, apa: true }
        })

        // 2. NEW: Fetch Taxonomy V2 (Active Hierarchy)
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

        // 3. Fetch Global Instructions
        const settings = await prisma.systemSettings.findUnique({
            where: { key: 'glossary_ai_instructions' }
        })
        const instructions = settings ? (settings.value as any).text : ''

        const context = `
        ACTIVE ASSETS CONTEXT (Practical Examples):
        ${validatedAssets.map((a: any) => `- ${a.title} (${a.primaryPillar}): ${a.observations?.substring(0, 200)}`).join('\n')}

        RESEARCH CONTEXT (Theoretical Backing):
        ${researchItems.map((r: any) => `- [ID: ${r.id}] ${r.title}: ${r.summary?.substring(0, 200)} (APA: ${r.apa})`).join('\n')}
        
        ${taxonomyContext}
        `

        // Add user instructions to prompt if present
        const instructionContext = instructions ? `
        INSTRUCCIONES ADICIONALES DEL USUARIO (GLOBAL CONFIG):
        "${instructions}"
        (Asegúrate de cumplir estrictamente con estas instrucciones en cuanto a tono, enfoque o contenido).
        ` : ''

        const prompt = `
        Define el término "${term}" bajo el marco de la metodología 4Shine.
        
        FUENTES DE INFORMACIÓN:
        1. Contexto de Activos: Úsalo para dar ejemplos prácticos de cómo se aplica.
        2. Contexto de Investigación: Úsalo para dar sustento teórico (cita fuentes si aplica).
        3. Taxonomía V2: Identifica a qué Pilar o Competencia pertenece este término.

        ${instructionContext}

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

        const result = await OpenAIService.generateContent(prompt, "gpt-4o", { response_format: { type: "json_object" } })

        if (!result) throw new Error('AI Generation failed')

        const parsed = JSON.parse(result)

        return NextResponse.json(parsed)

    } catch (error: any) {
        console.error('Glossary AI Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
