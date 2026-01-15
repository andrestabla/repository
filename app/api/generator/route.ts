import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { GeminiService } from '@/lib/gemini'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getServerSession } from "next-auth/next"

// Allow longer timeout for generation
export const maxDuration = 60

type CompilationType =
    | 'dossier'
    | 'matrix'
    | 'toolkit'
    | 'podcast'
    | 'video'
    | 'mindmap'
    | 'flashcards'
    | 'quiz'
    | 'infographic'
    | 'presentation'

export async function POST(request: NextRequest) {
    try {
        const { type, version, message, selectedAssetIds } = await request.json() as {
            type: CompilationType,
            version?: string,
            message?: string,
            selectedAssetIds?: string[]
        }

        // 1. Fetch ALL Validated Assets first
        let items = await prisma.contentItem.findMany({
            where: { status: 'Validado' },
            select: { id: true, title: true, primaryPillar: true, sub: true, observations: true }
        })

        // 2. Filter by User Selection (if provided)
        // If selectedAssetIds is provided and not empty, filter items.
        // If it's empty but provided, it means user deselected everything -> Error.
        // If undefined, we might default to ALL (legacy behavior), but the UI sends the selection.
        if (selectedAssetIds) {
            if (selectedAssetIds.length === 0) {
                return NextResponse.json({ result: "⚠️ No hay activos validados seleccionados. Por favor selecciona al menos una fuente." })
            }
            items = items.filter(i => selectedAssetIds.includes(i.id))
        }

        if (items.length === 0) {
            return NextResponse.json({ result: "⚠️ No hay activos validados disponibles para ver." })
        }

        // 3. Prepare Context
        const assetsContext = items.map(i =>
            `[ID: ${i.id}] TÍTULO: "${i.title}" (Pilar: ${i.primaryPillar})\nRESUMEN: ${JSON.stringify(i.observations)}`
        ).join('\n\n')

        // 4. API Key Strategy
        const { SystemSettingsService } = await import('@/lib/settings')
        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || ''

        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 })
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        // 5. Construct Prompt
        let prompt = ""

        if (message) {
            prompt = `
             Actúa como un ASISTENTE DE INVESTIGACIÓN INTELIGENTE (estilo NotebookLM).
             Tienes acceso al siguiente inventario de activos seleccionados (${items.length} fuentes).
             
             TU TAREA:
             Responde a la solicitud del usuario basándote EXCLUSIVAMENTE en los activos validados proporcionados.
             
             SOLICITUD DEL USUARIO:
             "${message}"
             
             PAUTAS ESTRICTAS:
             1. **GROUNDING:** No inventes. Si no está en los activos, dilo.
             2. **CITAS:** Cita las fuentes entre corchetes, ej: "[Fuente: Shine In Masterclass]".
             3. **PREGUNTAS SUGERIDAS:** Al final, sugiere 3 preguntas de profundización.

             CONTEXTO DE ACTIVOS (Source of Truth):
             ${assetsContext}
             `
        } else if (type === 'dossier') {
            prompt = `
            Actúa como CONSULTOR ESTRATÉGICO. Genera un **DOSSIER EJECUTIVO**.
            
            ESTRUCTURA:
            1. **Intro Ejecutiva**: Valor de la metodología (basado en lo seleccionado).
            2. **Análisis de Activos**: Resumen narrativo citando las fuentes.
            3. **Impacto**: Conductas esperadas.
            4. **Cierre**: Next Steps.
            
            CONTEXTO:
            ${assetsContext}
            `
        } else if (type === 'matrix') {
            prompt = `
            Actúa como ANALISTA DE DATOS. Genera una **MATRIZ DE TRAZABILIDAD** en Markdown Table.
            Columnas: ID | Título | Pilar | Nivel | Concepto Clave
            
            CONTEXTO:
            ${assetsContext}
            `
        } else if (type === 'toolkit') {
            prompt = `Actúa como ARQUITECTO. Diseña una **ESTRUCTURA DE TOOLKIT** en formato árbol.`
        } else if (type === 'podcast') {
            prompt = `
            Actúa como GUIONISTA DE PODCAST "Deep Dive".
            Genera un GUION DE AUDIO (Host vs Experto) de 5 min discutiendo los activos seleccionados.
            Usa un tono, casual, sorprendente y analítico.
            
            FORMATO:
            **HOST:** ...
            **EXPERTO:** ...

            CONTEXTO:
            ${assetsContext}
            `
        } else if (type === 'video') {
            prompt = `
            Actúa como DIRECTOR CREATIVO. Genera un **GUION VISUAL PARA VIDEO (StoryBoard Script)**.
            
            FORMATO TABLA:
            | TIEMPO | VISUAL (Escena) | AUDIO (Voz en off) |
            |--------|-----------------|--------------------|
            | 0:00   | ...             | ...                |

            OBJETIVO: Video resumen de alto impacto sobre los activos seleccionados.
            CONTEXTO:
            ${assetsContext}
            `
        } else if (type === 'mindmap') {
            prompt = `
            Actúa como EXPERTO EN VISUALIZACIÓN DE DATOS.
            Genera un **MAPA MENTAL** complejo sobre la metodología, basado en los activos.
            
            Usa sintaxis **MERMAID** (graph TD).
            
            IMPORTANTE:
            Tu respuesta debe contener EXCLUSIVAMENTE el bloque de código markdown.
            Empieza con \`\`\`mermaid y termina con \`\`\`.
            NO incluyas explicaciones, ni títulos, ni texto adicional. SOLO el código.
            
            CONTEXTO:
            ${assetsContext}
            `
        } else if (type === 'flashcards') {
            prompt = `
            Actúa como PEDAGOGO. Genera 5 **TARJETAS DE ESTUDIO (Flashcards)** clave.
            
            FORMATO:
            ---
            **PREGUNTA:** ...
            **RESPUESTA:** ...
            **FUENTE:** [ID]
            ---

            CONTEXTO:
            ${assetsContext}
            `
        } else if (type === 'quiz') {
            prompt = `
            Actúa como EVALUADOR. Genera un **QUIZ DE 5 PREGUNTAS** opción múltiple.
            
            FORMATO:
            1. [Pregunta]
               a) ... b) ... c) ...
               *Respuesta Correcta: X (Explicación breve)*
            
            CONTEXTO:
            ${assetsContext}
            `
        } else if (type === 'infographic') {
            prompt = `
            Actúa como DISEÑADOR GRÁFICO.
            Describe la **ESTRUCTURA VISUAL PARA UNA INFOGRAFÍA** paso a paso.
            Sección 1: Título e Intro.
            Sección 2: Visualización de Datos.
            Sección 3: Conclusiones.
            
            CONTEXTO:
            ${assetsContext}
            `
        } else if (type === 'presentation') {
            prompt = `
            Actúa como EXPERTO EN COMUNICACIÓN.
            Genera la estructura para una **PRESENTACIÓN (Slide Deck)** de 7 diapositivas.
            
            FORMATO POR SLIDE:
            **SLIDE X: [Título]**
            - Bullet points del contenido.
            - Sugerencia visual (Imagen/Gráfico).
            
            CONTEXTO:
            ${assetsContext}
            `
        }

        // 6. Generate
        const result = await model.generateContent(prompt)
        const response = await result.response
        let output = response.text()

        // 7. Persist History
        try {
            await prisma.generationHistory.create({
                data: {
                    user: 'anonymous', // TODO: Add real user session
                    prompt: message || `Generate ${type}`,
                    response: output,
                    type: type || 'chat',
                    assets: selectedAssetIds || []
                }
            })
        } catch (dbError) {
            console.error("Failed to save history:", dbError)
        }

        return NextResponse.json({
            result: output,
            count: items.length
        })

    } catch (error) {
        console.error('Generator API Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
