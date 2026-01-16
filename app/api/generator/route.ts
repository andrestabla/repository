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

        // 4. API Key Strategy (OpenAI)
        const { OpenAIService } = await import('@/lib/openai')

        // 5. Construct Prompt (Done before calling service to pass it)
        let prompt = ""

        if (message) {
            prompt = `
             ACTÚA COMO UN ESTRATEGA SÉNIOR Y EXPERTO EN LIDERAZGO (NIVEL C-SUITE / NOTEBOOKLM).
             Tu objetivo es generar un análisis PROFUNDO, EXHAUSTIVO Y ESTRATÉGICO basado ÚNICAMENTE en las fuentes proporcionadas.

             TIENES ACCESO A:
             - ${assets.length} Activos de Inventario (Conocimiento Validado 4Shine).
             - ${research.length} Investigaciones Externas (Papers/Tendencias).

             FUENTES DISPONIBLES:
             ${combinedContext}

             INSTRUCCIÓN DE PROFUNDIDAD (DEEP DIVE):
             1. **IDIOMA:** EL RESULTADO DEBE ESTAR AL 100% EN ESPAÑOL. NO uses inglés.
             2. NO hagas resúmenes superficiales. Tu valor está en la SÍNTESIS DE ALTO NIVEL.
             3. Cruza información: ¿Cómo se complementa el activo X con el hallazgo Y de la investigación?
             4. Busca "Insights Ocultos": No te quedes en lo obvio. Deduce implicaciones estratégicas.
             5. EXHAUSTIVIDAD: Si el usuario pide un plan, detalla cada paso. Si pide un dossier, cubre todas las aristas.
             6. TONO: Profesional, inspirador, ejecutivo, riguroso.

             SOLICITUD DEL USUARIO:
             "${message}"

             REGLAS FORMATO:
             - Usa Markdown avanzado (negritas, tablas, citas en bloque).
             - Si citas una fuente, usa [Título Fuente] para referenciarla explícitamente.
             - Estructura tu respuesta con encabezados claros.
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
            Actúa como EXPERTO EN MERMAID.JS.
            Genera un JSON que contenga EXCLUSIVAMENTE el código para un diagrama de flujo (Mindmap).

            ESTRUCTURA JSON EXACTA (Respétala al 100%):
            {
              "type": "mindmap",
              "mermaid": "graph TD\\n  A[Concepto Principal] --> B(Concepto Secundario)\\n  B --> C{Detalle}"
            }

            REGLAS CRÍTICAS:
            1. NO uses claves como "mapa_mental", "content", "structure". Solo "type" y "mermaid".
            2. El valor de "mermaid" debe ser un STRING único con saltos de línea (\\n).
            3. NO devolvas un objeto anidado para el mapa. DEBE ser código Mermaid plano.

            CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'flashcards') {
            prompt = `
            Actúa como CREADOR DE FLASHCARDS.
            Genera un JSON con una lista de tarjetas de estudio.

            ESTRUCTURA JSON EXACTA:
            {
              "type": "flashcards",
              "cards": [
                { "question": "¿Qué es X?", "answer": "Es Y", "source": "Referencia" }
              ]
            }

            REGLAS CRÍTICAS:
            1. Usa la clave "cards" para el array. NO uses "sections" ni "items".
            2. Genera exactamente 5 tarjetas.

            CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'quiz') {
            prompt = `
            Actúa como PROFESOR EVALUADOR.
            Genera un JSON con un examen de opción múltiple.

            ESTRUCTURA JSON EXACTA:
            {
              "type": "quiz",
              "questions": [
                {
                  "question": "Pregunta",
                  "options": ["A","B","C","D"],
                  "correctAnswer": "A",
                  "explanation": "Razón"
                }
              ]
            }

            REGLAS CRÍTICAS:
            1. Usa la clave "questions". NO uses "sections".
            2. "correctAnswer" debe coincidir con una de las opciones.

            CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'infographic') {
            prompt = `
            Actúa como DISEÑADOR DE DATOS.
            Genera un JSON para una infografía.

            ESTRUCTURA JSON EXACTA:
            {
              "type": "infographic",
              "title": "Título",
              "intro": "Introducción",
              "sections": [
                 {
                    "title": "Sección",
                    "content": "Contenido",
                    "icon": "zap",
                    "stats": [ { "label": "Label", "value": "Val" } ]
                 }
              ],
              "conclusion": "Cierre"
            }

            REGLAS:
            1. "sections" NO debe estar vacío.
            2. Usa iconos de Lucide (zap, users, trend, chart, target).

            CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'presentation') {
            prompt = `
            Actúa como CONSULTOR DE PRESENTACIONES.
            Genera un JSON para diapositivas.

            ESTRUCTURA JSON EXACTA:
            {
              "type": "presentation",
              "slides": [
                { "title": "Título Slide", "bullets": ["Punto 1", "Punto 2"], "visual": "Descripción img" }
              ]
            }

            REGLAS CRÍTICAS:
            1. Usa la clave "slides". NO uses "sections".
            2. Genera 7 slides.

            CONTEXTO:
            ${combinedContext}
            `
        }

        // --- SAFETY CHECK FOR JSON MODE ---
        const jsonTypes = ['infographic', 'mindmap', 'flashcards', 'quiz', 'presentation', 'matrix']
        if (jsonTypes.includes(type as string) && !prompt.toLowerCase().includes('json')) {
            prompt += `\n\nIMPORTANTE: ESTÁS EN MODO STRICT JSON. TU RESPUESTA DEBE SER EXCLUSIVAMENTE UN OBJETO JSON VÁLIDO.`
        }

        // 6. Generate (OpenAI)
        console.log("[Generator] Starting OpenAI generation...")
        let output = ""
        try {
            // Apply JSON mode to all structured types
            const options = jsonTypes.includes(type as string) ? { response_format: { type: "json_object" } } : undefined
            console.log(`[Generator] Sending prompt to OpenAI (Type: ${type}, JSON Mode: ${!!options})... Preamble: ${prompt.substring(0, 50)}`)

            output = await OpenAIService.generateContent(prompt, "gpt-4o", options) || "No response generated."
            console.log(`[Generator] Raw Output received: ${output.substring(0, 100)}...`)

            // CLEANING: JSON Sanitization
            if (jsonTypes.includes(type as string)) {
                // Remove Markdown code blocks if present
                output = output.replace(/```json/g, '').replace(/```/g, '').trim()
                // Validate if it is JSON
                try {
                    JSON.parse(output)
                    // If safe, we keep it clean.
                } catch (e) {
                    console.error("Generator Output was not valid JSON:", output.substring(0, 100))
                }
            }

        } catch (err: any) {
            console.error("[Generator] OpenAI Failed:", err)
            return NextResponse.json({ error: `OpenAI Error: ${err.message}` }, { status: 500 })
        }

        // 7. Persist History
        try {
            await prisma.generationHistory.create({
                data: {
                    user: 'anonymous', // session is not available here, using anonymous default

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
