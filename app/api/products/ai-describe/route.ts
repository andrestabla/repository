
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { SystemSettingsService } from '@/lib/settings'
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

        // --- Content Retrieval (Optional but recommended for accuracy) ---
        let fileContent = ""
        if (driveLink) {
            const driveId = extractDriveId(driveLink)
            if (driveId) {
                try {
                    fileContent = await getFileContent(driveId)
                    console.log(`[AI Describe] Content fetched successfully (${fileContent.length} chars)`)
                } catch (err) {
                    console.warn(`[AI Describe] Could not fetch Drive content for ${driveId}:`, err)
                }
            }
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
        Actúa como un ASISTENTE DE DOCUMENTACIÓN de alta precisión. Tu tarea es generar una descripción ESTRICTAMENTE OBJETIVA de un documento.
        
        REGLA CRÍTICA: 
        - NO emitas juicios de valor (ej: "excelente", "profesional", "increíble").
        - NO digas para qué sirve el documento o qué beneficios trae.
        - NO sugieras acciones futuras.
        - SOLO describe LO QUE HAY en el contenido. Si tienes el contenido del archivo, analiza qué secciones, datos o temas se tratan. Si solo tienes el título, describe lo que razonablemente contiene un documento con ese nombre de forma descriptiva.

        INPUT:
        - Título del Producto: "${title}"
        - Tipo de Archivo: "${type || 'Documento General'}"
        ${fileContent ? `- CONTENIDO DEL ARCHIVO (Fragmento): ${fileContent.substring(0, 3000)}` : ""}

        OUTPUT (JSON ONLY):
        Genera un objeto JSON con los siguientes campos:
        1. "description": Una descripción puramente descriptiva y objetiva de la temática y secciones del documento. (Mínimo 2 párrafos, máximo 800 caracteres).
        2. "tags": Un array de 5-8 etiquetas sustantivas que describan los temas tratados (ej: "Matriz de Competencias", "Estructura Organizacional", "Indicadores de Desempeño").
        3. "category": La categoría técnica más exacta según lo descrito.

        REGLAS DE FORMATO:
        - Tono: Neutral, descriptivo, enciclopédico.
        - Idioma: Español.
        `

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })

        const responseText = result.response.text()
        const data = JSON.parse(responseText)

        return NextResponse.json(data)

    } catch (error: any) {
        console.error("AI Describe Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
