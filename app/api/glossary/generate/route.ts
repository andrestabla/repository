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
        // Simple strategy: Fetch standard assets and perhaps search research if full search is available
        // For now, we reuse the validated assets strategy from OpenAIService but tailored for definition

        const validatedAssets = await prisma.contentItem.findMany({
            where: { status: 'Validado' },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: { title: true, primaryPillar: true, observations: true }
        })

        const researchItems = await prisma.researchSource.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { title: true, summary: true, findings: true }
        })

        const context = `
        ACTIVE ASSETS CONTEXT:
        ${validatedAssets.map(a => `- ${a.title} (${a.primaryPillar}): ${a.observations?.substring(0, 200)}`).join('\n')}

        RESEARCH CONTEXT:
        ${researchItems.map(r => `- ${r.title}: ${r.summary?.substring(0, 200)}`).join('\n')}
        `

        const prompt = `
        Define el término "${term}" bajo el marco de la metodología 4Shine.
        Usa el contexto suministrado de Activos e Investigaciones para dar una definición precisa, académica y alineada con los pilares (Shine In, Out, Up, Beyond).
        
        ${context}

        Responde ÚNICAMENTE con un JSON:
        {
            "definition": "Definición conceptual robusta (máx 300 caracteres).",
            "pillars": ["Shine In", "Shine Out"] // Pilares relacionados detectados
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
