import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { GeminiService } from '@/lib/gemini'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

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
        const session = await getServerSession(authOptions)
        const userEmail = session?.user?.email || 'anonymous'

        const { type, message, selectedAssetIds, selectedResearchIds, tone, customInstructions } = await request.json() as {
            type: CompilationType,
            message?: string,
            selectedAssetIds?: string[],
            selectedResearchIds?: string[],
            tone?: string,
            customInstructions?: string
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

        // INJECT CUSTOM SETTINGS
        let agentPersona = "Actúa como CONSULTOR EXPERTO"
        if (tone) agentPersona += ` con un tono ${tone.toUpperCase()}`
        if (customInstructions) agentPersona += `. INSTRUCCIONES ADICIONALES: ${customInstructions}`

        // PRIORITY: Check for restricted types FIRST.
        if (type === 'dossier') {
            prompt = `
            ${agentPersona}. Genera un ** DOSSIER EJECUTIVO **.

                ESTRUCTURA:
            1. ** Intro Ejecutiva **: Valor de la metodología(basado en lo seleccionado).
            2. ** Análisis de Activos **: Resumen narrativo citando las fuentes.
            3. ** Impacto **: Conductas esperadas.
            4. ** Cierre **: Next Steps.

            SOLICITUD ADICIONAL: "${message || ''}"

                CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'matrix') {
            prompt = `
            Actúa como ANALISTA DE DATOS.Genera una ** MATRIZ DE TRAZABILIDAD ** en Markdown Table.
                Columnas: ID | Título | Tipo(Asset / Research) | Concepto Clave

            SOLICITUD ADICIONAL: "${message || ''}"

            CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'toolkit') {
            prompt = `Actúa como ARQUITECTO.Diseña una ** ESTRUCTURA DE TOOLKIT ** en formato árbol. SOLICITUD ADICIONAL: "${message || ''}"`
        } else if (type === 'podcast') {
            prompt = `
            Actúa como GUIONISTA DE PODCAST "Deep Dive".
            Genera un GUION DE AUDIO(Host vs Experto) de 5 min discutiendo los activos seleccionados.
            Usa un tono ${tone || 'casual, sorprendente y analítico'}.
            ${customInstructions ? `INSTRUCCIONES ADICIONALES: ${customInstructions}` : ''}

                FORMATO:
            ** HOST:** ...
            ** EXPERTO:** ...
            
            SOLICITUD ADICIONAL: "${message || ''}"

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
                
            SOLICITUD ADICIONAL: "${message || ''}"

                    CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'mindmap') {
            prompt = `
            TU TAREA: Generar código de Mermaid.js para un diagrama de flujo.
            
            INPUT:
            ${combinedContext}

            OUTPUT ESPERADO:
            ÚNICAMENTE un bloque de código Markdown con el diagrama.
            
            EJEMPLO:
            \`\`\`mermaid
            graph TD
              A[Concepto] --> B(Detalle)
            \`\`\`

            REGLAS:
            1. NO expliques nada. Solo el código.
            2. Usa sintaxis "graph TD".
            3. Asegúrate de cerrar el bloque de código.
            `
        } else if (type === 'flashcards') {
            prompt = `
            TU TAREA: Extraer 5 conceptos clave y convertirlos en tarjetas de estudio.

            OUTPUT ESPERADO:
            {
              "type": "flashcards",
              "cards": [
                { "question": "¿Concepto?", "answer": "Definición", "source": "Contexto" }
              ]
            }

            INPUT:
            ${combinedContext}
            `
        } else if (type === 'quiz') {
            prompt = `
            TU TAREA: Crear un examen de 5 preguntas basado en el texto.

            OUTPUT ESPERADO:
            {
              "type": "quiz",
              "questions": [
                {
                  "question": "Pregunta",
                  "options": ["A","B","C","D"],
                  "correctAnswer": "A",
                  "explanation": "Por qué es A"
                }
              ]
            }

            INPUT:
            ${combinedContext}
            `
        } else if (type === 'infographic') {
            prompt = `
            TU TAREA: Estructurar la información para una infografía visual.

            OUTPUT ESPERADO:
            {
              "type": "infographic",
              "title": "Main Title",
              "intro": "Intro text",
              "sections": [
                 {
                    "title": "Section Title",
                    "content": "Short text",
                    "icon": "zap",
                    "stats": [ { "label": "Stat", "value": "100%" } ]
                 }
              ],
              "conclusion": "Closing text"
            }

            REGLAS:
            1. Usa iconos de Lucide (zap, users, trend, chart, target).
            2. "sections" debe tener contenido real.

            INPUT:
            ${combinedContext}
            `
        } else if (type === 'presentation') {
            prompt = `
            TU TAREA: Crear el esquema para una presentación de 7 diapositivas.

            OUTPUT ESPERADO:
            {
              "type": "presentation",
              "slides": [
                { "title": "Slide Title", "bullets": ["Point 1", "Point 2"], "visual": "Image description" }
              ]
            }

            INPUT:
            ${combinedContext}
            `
        }

        // --- SAFETY CHECK FOR JSON MODE ---
        // V3 CHANGE: Removing 'mindmap' from JSON mode to avoid hallwaycination of semantic objects.
        // We will parse the markdown manually for mindmaps.
        const jsonTypes = ['infographic', 'flashcards', 'quiz', 'presentation', 'matrix']
        if (jsonTypes.includes(type as string) && !prompt.toLowerCase().includes('json')) {
            prompt += `\n\nIMPORTANTE: ESTÁS EN MODO STRICT JSON. TU RESPUESTA DEBE SER EXCLUSIVAMENTE UN OBJETO JSON VÁLIDO.`
        }

        // 6. Generate (OpenAI)
        console.log("[Generator] Starting OpenAI generation...")
        let output = ""
        try {
            // Apply JSON mode to all structured types
            const options = jsonTypes.includes(type as string) ? {
                response_format: { type: "json_object" },
                temperature: 0.1 // FORCE DETERMINISTIC STRUCTURE
            } : undefined
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
            } else if (type === 'mindmap') {
                // V3 PARSING: Extract Mermaid code from Markdown block
                const match = output.match(/```mermaid([\s\S]*?)```/)
                let mermaidCode = match ? match[1].trim() : output;

                // Construct the JSON expected by frontend
                output = JSON.stringify({
                    type: "mindmap",
                    mermaid: mermaidCode
                })
            }

        } catch (err: any) {
            console.error("[Generator] OpenAI Failed:", err)
            return NextResponse.json({ error: `OpenAI Error: ${err.message}` }, { status: 500 })
        }

        // 7. Persist History
        try {
            await prisma.generationHistory.create({
                data: {
                    user: userEmail, // Correct field name per schema
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
