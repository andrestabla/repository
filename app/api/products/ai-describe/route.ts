
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
        Actúa como un CONSULTOR EXPERTO Senior en Estrategia Organizacional, Desarrollo de Talento y la Metodología 4Shine. 
        Tu tarea es generar metadatos de ALTA PRECISIÓN y DETALLE para un nuevo "Producto Estratégico" que se integrará en el ecosistema de consultoría.

        CONTEXTO METODOLÓGICO (4Shine):
        - Shine Within: Autoliderazgo, propósito, bienestar y mentalidad.
        - Shine Out: Relaciones, comunicación, marca personal e impacto externo.
        - Shine Up: Liderazgo de equipos, gestión, networking y escalamiento.
        - Shine Beyond: Visión global, legado, innovación y trascendencia.

        INPUT:
        - Título del Producto: "${title}"
        - Tipo de Archivo: "${type || 'Documento General'}"

        OUTPUT (JSON ONLY):
        Genera un objeto JSON con los siguientes campos:
        1. "description": Una descripción detallada (mínimo 2-3 párrafos cortos o una estructura de puntos clara), profesional, precisa y con terminología ejecutiva. Debe explicar el valor estratégico del documento, a quién va dirigido y qué objetivos busca cumplir. (Aprox. 600-800 caracteres).
        2. "tags": Un array de 5 a 8 etiquetas (tags) estratégicas y técnicas que faciliten la indexación semántica (ej: "Liderazgo Situacional", "OKR Tracking", "Soft Skills Development").
        3. "category": Una categoría técnica específica (ej: "Framework Estratégico", "Dashboard de Seguimiento", "Guía de Implementación Metodológica").

        REGLAS DE ORO:
        - Tono: Altamente profesional, consultivo, nítido y sofisticado.
        - Idioma: Español.
        - Precisión: Si el título es específico, profundiza en esa temática. Si es general, infiere el valor estratégico basándote en estándares de la industria y la metodología 4Shine.
        - NO uses frases vacías como "Documento esencial para...". Usa frases de valor como "Provee un marco analítico para la optimización de...".
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
