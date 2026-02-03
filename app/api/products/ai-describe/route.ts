
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { SystemSettingsService } from '@/lib/settings'

export const maxDuration = 30

export async function POST(request: NextRequest) {
    try {
        const { title, type } = await request.json()

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }

        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || null

        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API Key not configured" }, { status: 500 })
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
        Actúa como un CONSULTOR EXPERTO en Estrategia Organizacional y Metodología 4Shine.
        Tu tarea es generar metadatos profesionales para un nuevo "Producto Estratégico" que se cargará en el sistema.

        INPUT:
        - Título del Producto: "${title}"
        - Tipo de Archivo: "${type || 'Documento General'}"

        OUTPUT (JSON ONLY):
        Genera un objeto JSON con los siguientes campos:
        1. "description": Una descripción atractiva, profesional y ejecutiva de lo que probablemente contiene este documento basándote en su título. (Máximo 300 caracteres).
        2. "tags": Un array de 3 a 5 etiquetas (tags) cortas y relevantes para búsqueda (ej: "Liderazgo", "Mentoring", "Plantilla").
        3. "category": Una categoría sugerida (ej: "Herramientas", "Reportes", "Material Didáctico", "Grabaciones").

        Reglas:
        - Tono: Corporativo, Inspirador, Ejecutivo.
        - Idioma: Español.
        - NO inventes datos específicos, sé general pero profesional si el título es ambiguo.
        `

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" } // Force JSON
        })

        const responseText = result.response.text()
        const data = JSON.parse(responseText)

        return NextResponse.json(data)

    } catch (error: any) {
        console.error("AI Describe Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
