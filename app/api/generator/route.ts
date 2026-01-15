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
        const { type, message, selectedAssetIds, selectedResearchIds } = await request.json() as {
            type: CompilationType,
            message?: string,
            selectedAssetIds?: string[],
            selectedResearchIds?: string[]
        }

        // 1. Fetch Assets (Inventory)
        let assets = await prisma.contentItem.findMany({
            where: { status: 'Validado' },
            select: { id: true, title: true, primaryPillar: true, observations: true }
        })

        if (selectedAssetIds && selectedAssetIds.length > 0) {
            assets = assets.filter(i => selectedAssetIds.includes(i.id))
        } else {
            assets = [] // If explicit selection is sent as empty, default to empty.
        }

        // 2. Fetch Research (External)
        let research: any[] = []
        if (selectedResearchIds && selectedResearchIds.length > 0) {
            research = await prisma.researchSource.findMany({
                where: { id: { in: selectedResearchIds } },
                select: { id: true, title: true, findings: true, summary: true, url: true }
            })
        }

        // 3. Validation: Must have at least one source (Asset OR Research)
        if (assets.length === 0 && research.length === 0) {
            return NextResponse.json({ result: "⚠️ No hay activos validos ni investigaciones seleccionadas. Por favor selecciona al menos una fuente." })
        }

        // 4. Prepare Context
        const inventoryContext = assets.map(i =>
            `[ASSET: ${i.id}] TÍTULO: "${i.title}" (Pilar: ${i.primaryPillar})\nRESUMEN: ${JSON.stringify(i.observations)}`
        ).join('\n\n')

        const researchContext = research.map(r =>
            `[RESEARCH: ${r.id}] TÍTULO: "${r.title}" (URL: ${r.url})\nHALLAZGOS: ${r.findings || r.summary || 'Sin resumen'}`
        ).join('\n\n')

        const combinedContext = `
        === INVENTARIO INTERNO (4SHINE) ===
        ${inventoryContext || 'Ninguno seleccionado.'}

        === INVESTIGACIÓN EXTERNA ===
        ${researchContext || 'Ninguna seleccionada.'}
        `

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
             Tienes acceso al siguiente inventario de activos seleccionados (${assets.length + research.length} fuentes).
             
             TU TAREA:
             Responde a la solicitud del usuario basándote EXCLUSIVAMENTE en los activos validados proporcionados.
             
             SOLICITUD DEL USUARIO:
        "${message}"
             
             PAUTAS ESTRICTAS:
        1. ** GROUNDING:** No inventes.Si no está en los activos, dilo.
             2. ** CITAS:** Cita las fuentes entre corchetes, ej: "[Fuente: Shine In Masterclass]".
             3. ** PREGUNTAS SUGERIDAS:** Al final, sugiere 3 preguntas de profundización.

             CONTEXTO DE FUENTES(Source of Truth):
             ${combinedContext}
        `
        } else if (type === 'dossier') {
            prompt = `
            Actúa como CONSULTOR ESTRATÉGICO.Genera un ** DOSSIER EJECUTIVO **.

            ESTRUCTURA:
        1. ** Intro Ejecutiva **: Valor de la metodología(basado en lo seleccionado).
            2. ** Análisis de Activos **: Resumen narrativo citando las fuentes.
            3. ** Impacto **: Conductas esperadas.
            4. ** Cierre **: Next Steps.

            CONTEXTO:
            ${combinedContext}
        `
        } else if (type === 'matrix') {
            prompt = `
            Actúa como ANALISTA DE DATOS.Genera una ** MATRIZ DE TRAZABILIDAD ** en Markdown Table.
            Columnas: ID | Título | Tipo(Asset / Research) | Concepto Clave

        CONTEXTO:
            ${combinedContext}
        `
        } else if (type === 'toolkit') {
            prompt = `Actúa como ARQUITECTO.Diseña una ** ESTRUCTURA DE TOOLKIT ** en formato árbol.`
        } else if (type === 'podcast') {
            prompt = `
            Actúa como GUIONISTA DE PODCAST "Deep Dive".
            Genera un GUION DE AUDIO(Host vs Experto) de 5 min discutiendo los activos seleccionados.
            Usa un tono, casual, sorprendente y analítico.

            FORMATO:
            ** HOST:** ...
            ** EXPERTO:** ...

        CONTEXTO:
            ${combinedContext}
        `
        } else if (type === 'video') {
            prompt = `
            Actúa como DIRECTOR CREATIVO.Genera un ** GUION VISUAL PARA VIDEO(StoryBoard Script) **.
            
            FORMATO TABLA:
            | TIEMPO | VISUAL(Escena) | AUDIO(Voz en off) |
            | --------| -----------------| --------------------|
            | 0:00 | ...             | ...                |

            OBJETIVO: Video resumen de alto impacto sobre los activos seleccionados.
                CONTEXTO:
            ${combinedContext}
        `
        } else if (type === 'mindmap') {
            prompt = `
            Actúa como EXPERTO EN VISUALIZACIÓN DE DATOS.
            Genera un ** MAPA MENTAL ** complejo sobre la metodología, basado en los activos.
            
            Usa sintaxis ** MERMAID ** (graph TD).

        IMPORTANTE:
            Tu respuesta debe contener EXCLUSIVAMENTE el bloque de código markdown.
            Empieza con \`\`\`mermaid y termina con \`\`\`.
            NO incluyas explicaciones, ni títulos, ni texto adicional. SOLO el código.
            
            CONTEXTO:
            ${combinedContext}
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
            ${combinedContext}
            `
        } else if (type === 'quiz') {
            prompt = `
            Actúa como EVALUADOR. Genera un **QUIZ DE 5 PREGUNTAS** opción múltiple.
            
            FORMATO:
            1. [Pregunta]
               a) ... b) ... c) ...
               *Respuesta Correcta: X (Explicación breve)*
            
            CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'infographic') {
            prompt = `
            Actúa como DISEÑADOR GRÁFICO.
            Describe la **ESTRUCTURA VISUAL PARA UNA INFOGRAFÍA** paso a paso.
            Sección 1: Título e Intro.
            Sección 2: Visualización de Datos.
            Sección 3: Conclusiones.
            
            CONTEXTO:
            ${combinedContext}
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
            ${combinedContext}
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
                    assets: selectedAssetIds || [],
                    research: selectedResearchIds || []
                }
            })
        } catch (dbError) {
            console.error("Failed to save history:", dbError)
        }

        return NextResponse.json({
            result: output,
            count: assets.length + research.length
        })

    } catch (error) {
        console.error('Generator API Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
