import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { GeminiService } from '@/lib/gemini'
import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 60 // Allow longer timeout for generation

type CompilationType = 'dossier' | 'matrix' | 'toolkit'

export async function POST(request: NextRequest) {
    try {
        const { type, version, message } = await request.json() as { type: CompilationType, version?: string, message?: string }

        // 1. Fetch Validated Assets
        const whereClause: any = { status: 'Validado' }
        if (version) whereClause.version = version

        const items = await prisma.contentItem.findMany({
            where: whereClause,

        })

        if (items.length === 0) {
            return NextResponse.json({ error: 'No hay activos validados disponibles para compilar.' }, { status: 400 })
        }

        // 2. Prepare Context
        return NextResponse.json({ result: "⚠️ No hay activos validados seleccionados para generar contexto." })
    }

        // 3. Prepare Context
        const assetsContext = items.map(i =>
        `[ID: ${i.id}] TÍTULO: "${i.title}" (Pilar: ${i.primaryPillar})\nRESUMEN: ${JSON.stringify(i.observations)}`
    ).join('\n\n')

    // 3. Define Prompt based on Type
    let prompt = ''

    // Auth: Use System Settings first, then env var
    const { SystemSettingsService } = await import('@/lib/settings')
    let apiKey = await SystemSettingsService.getGeminiApiKey()
    if (!apiKey) apiKey = process.env.GEMINI_API_KEY || ''

    if (!apiKey) {
        return NextResponse.json({ error: 'Gemini API Key not configured in Settings or Environment' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) // Upgrading to 2.0 Flash (confirmed available)

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
            Actúa como EXPERTO EN VISUALIZACIÓN. Genera un **MAPA MENTAL** usando sintaxis MERMAID (graph TD).
            El nodo central es "Metodología 4Shine".
            
            REGLA: Devuelve SOLO el bloque de código Mermaid.
            
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

    // 4. Generate Content
    const result = await model.generateContent(prompt)
    const response = await result.response
    let output = response.text()

    // Clean JSON output if needed
    if (type === 'matrix') {
        output = output.replace(/```json/g, '').replace(/```/g, '').trim()
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
