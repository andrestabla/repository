import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { OpenAIService } from '@/lib/openai'

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { term, instructions } = await request.json()
        if (!term) return NextResponse.json({ error: 'Term required' }, { status: 400 })

        // 1. Fetch Context (Assets + Research)
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

        const context = `
        ACTIVE ASSETS CONTEXT:
        ${validatedAssets.map(a => `- ${a.title} (${a.primaryPillar}): ${a.observations?.substring(0, 200)}`).join('\n')}

        RESEARCH CONTEXT (Usa estos IDs para citar):
        ${researchItems.map(r => `- [ID: ${r.id}] ${r.title}: ${r.summary?.substring(0, 200)} (APA: ${r.apa})`).join('\n')}
        `

        // Add user instructions to prompt if present
        const instructionContext = instructions ? `
        INSTRUCCIONES ADICIONALES DEL USUARIO:
        "${instructions}"
        (Asegúrate de cumplir estrictamente con estas instrucciones en cuanto a tono, enfoque o contenido).
        ` : ''

        const prompt = `
        Define el término "${term}" bajo el marco de la metodología 4Shine.
        Usa el contexto suministrado de Activos e Investigaciones para dar una definición precisa, académica y alineada con los pilares (Shine Within, Out, Up, Beyond).
        ${instructionContext}

        REGLAS DE CITACIÓN (CRÍTICO):
        1. Si usas información del "RESEARCH CONTEXT", DEBES citar al autor usando formato APA 7.
        2. ADEMÁS, la cita debe ser un hipervínculo en formato Markdown que lleve a la fuente.
        3. Formato del Link: [Autor, Año](/research?id=ID_DE_LA_FUENTE)
        Ejemplo: "...como afirma [Smith, 2023](/research?id=clq...) en su estudio..."

        ${context}

        Responde ÚNICAMENTE con un JSON:
        {
            "definition": "Definición conceptual robusta con citas hipervinculadas (máx 500 caracteres).",
            "pillars": ["Shine Within", "Shine Out"] // Pilares relacionados detectados
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
