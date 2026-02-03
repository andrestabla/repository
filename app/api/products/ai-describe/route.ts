
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { SystemSettingsService } from '@/lib/settings'
import prisma from '@/lib/prisma'
import { getFileContent, extractDriveId } from '@/lib/drive'

export const maxDuration = 30

export async function POST(request: NextRequest) {
    try {
        const { title, type, driveLink } = await request.json()

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }

        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || null

        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API Key not configured" }, { status: 500 })
        }

        // --- Content Retrieval ---
        let fileContent = ""
        if (driveLink) {
            const driveId = extractDriveId(driveLink)
            if (driveId) {
                try {
                    fileContent = await getFileContent(driveId)
                } catch (err) {
                    console.warn(`[AI Describe] Could not fetch Drive content for ${driveId}`)
                }
            }
        }

        // --- Context Retrieval (Taxonomy & Pillars) ---
        const [taxonomies, existingProducts] = await Promise.all([
            prisma.taxonomy.findMany({ select: { name: true }, take: 20 }),
            prisma.strategicProduct.findMany({ select: { pillar: true }, take: 50 })
        ])

        const validTaxonomies = taxonomies.map((t: { name: string }) => t.name).join(", ")
        const validPillars = Array.from(new Set(existingProducts.map((p: { pillar: string | null }) => p.pillar).filter(Boolean))).join(", ") || "Transversal, Estrategia, Operaciones, Cultura"

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
        Actúa como un ASISTENTE DE DOCUMENTACIÓN experto en el Sistema de Escalamiento 4Shine®. 
        Tu tarea es generar una descripción ESTRICTAMENTE OBJETIVA de un entregable basada en su título y contenido.

        CONTEXTO DE LA PLATAFORMA (Usa estos términos si son aplicables y relevantes):
        - Taxonomía/Conceptos clave: ${validTaxonomies}
        - Pilares aceptados: ${validPillars}

        REGLA CRÍTICA DE NO-ESPECULACIÓN: 
        - ABSOLUTAMENTE PROHIBIDO emitir juicios de valor (ej: "excelente", "profesional"), beneficios esperados o "para qué sirve".
        - NO inventes secciones si no tienes el contenido del archivo. Si solo tienes el título, describe de qué trata el tema general desde una perspectiva técnica y neutral.
        - Tono: Enciclopédico, frío, descriptivo e impersonal.

        INPUT:
        - Título: "${title}"
        - Tipo: "${type || 'Documento'}"
        ${fileContent ? `- CONTENIDO REAL (Fragmento): ${fileContent.substring(0, 3000)}` : ""}

        OUTPUT (JSON ONLY):
        {
          "description": "2 párrafos descriptivos de lo que EL DOCUMENTO ES O CONTIENE. Máx 800 chars.",
          "tags": ["Tag 1", "Tag 2", ...],
          "category": "La categoría técnica más precisa",
          "pillar": "El pilar más adecuado según el contexto de 4Shine"
        }
        `

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })

        const data = JSON.parse(result.response.text())

        return NextResponse.json(data)

    } catch (error: any) {
        console.error("AI Describe Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
