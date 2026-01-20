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

        const { type, message, selectedAssetIds, selectedResearchIds, tone, customInstructions, useDeepSearch } = await request.json() as {
            type: CompilationType,
            message?: string,
            selectedAssetIds?: string[],
            selectedResearchIds?: string[],
            tone?: string,
            customInstructions?: string,
            useDeepSearch?: boolean
        }

        // ... (existing fetch logic remains unchanged) ...
        // ... (skip lines 37-81)

        // 4. API Key Strategy (OpenAI)
        const { OpenAIService } = await import('@/lib/openai')

        // 5. Construct Prompt
        let prompt = ""

        // INJECT CUSTOM SETTINGS
        let agentPersona = "Actúa como CONSULTOR EXPERTO"
        if (tone) agentPersona += ` con un tono ${tone.toUpperCase()}`
        if (customInstructions) agentPersona += `. INSTRUCCIONES ADICIONALES: ${customInstructions}`

        // DEEP SEARCH / OPEN CONTEXT MODIFIER
        let contextConstraint = ""
        if (useDeepSearch) {
            contextConstraint = `
             MODO BÚSQUEDA PROFUNDA ACTIVADO:
             1. Usa el CONTEXTO proporcionado como tu fuente principal y prioritaria.
             2. SI (y solo si) la respuesta no se encuentra en el contexto, ESTÁS AUTORIZADO a usar tu Conocimiento General, Entrenamiento y Datos Web para responder.
             3. Si usas información externa, indícalo sutilmente (ej: "Basado en conocimiento general del modelo...").
             `
        } else {
            contextConstraint = `
             MODO CONTEXTO ESTRICTO:
             Responde a la consulta del usuario basándote EXCLUSIVAMENTE en la información proporcionada en el CONTEXTO.
             Si la respuesta no está en el contexto, indícalo claramente. NO inventes información.
             `
        }

        // PRIORITY: Check for restricted types FIRST.
        if (type === 'dossier') {
            prompt = `
            ${agentPersona}. Genera un ** DOSSIER EJECUTIVO **.
            ${contextConstraint}

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
            // ... (Keep existing prompt structure but inject contextConstraint where appropriate)
            // For brevity, I will apply contextConstraint to the 'General Chat' mostly, or globally?
            // It's best to apply it to ALL types.
            prompt = `
            Actúa como ANALISTA DE DATOS.Genera una ** MATRIZ DE TRAZABILIDAD ** en Markdown Table.
            ${contextConstraint}
                Columnas: ID | Título | Tipo(Asset / Research) | Concepto Clave

            SOLICITUD ADICIONAL: "${message || ''}"

            CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'toolkit') {
            prompt = `Actúa como ARQUITECTO.Diseña una ** ESTRUCTURA DE TOOLKIT ** en formato árbol. ${contextConstraint} SOLICITUD ADICIONAL: "${message || ''}"`
        } else if (type === 'podcast') {
            prompt = `
            Actúa como GUIONISTA DE PODCAST "Deep Dive".
            Genera un GUION DE AUDIO(Host vs Experto) de 5 min discutiendo los activos seleccionados.
            Usa un tono ${tone || 'casual, sorprendente y analítico'}.
            ${customInstructions ? `INSTRUCCIONES ADICIONALES: ${customInstructions}` : ''}
            ${contextConstraint}

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
            ${contextConstraint}
            
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
            ${contextConstraint}
            
            INPUT:
            ${combinedContext}

            OUTPUT ESPERADO:
            ÚNICAMENTE un bloque de código Markdown con el diagrama.
            // ... (rest of mindmap prompt)
            `
        } else if (type === 'flashcards') {
            prompt = `
            TU TAREA: Extraer 5 conceptos clave y convertirlos en tarjetas de estudio.
            ${contextConstraint}
            // ...
            INPUT:
            ${combinedContext}
            `
        } else if (type === 'quiz') {
            prompt = `
            TU TAREA: Crear un examen de 5 preguntas basado en el texto.
            ${contextConstraint}
            // ...
            INPUT:
            ${combinedContext}
            `
        } else if (type === 'infographic') {
            prompt = `
            TU TAREA: Estructurar la información para una infografía visual.
            ${contextConstraint}
            // ...
            INPUT:
            ${combinedContext}
            `
        } else if (type === 'presentation') {
            prompt = `
            TU TAREA: Crear el esquema para una presentación de 7 diapositivas.
            ${contextConstraint}
            // ...
            INPUT:
            ${combinedContext}
            `
        } else {
            // DEFAULT: General Chat / Q&A
            prompt = `
            ${agentPersona}.
            ${contextConstraint}

            CONSULTA DEL USUARIO: "${message}"

            CONTEXTO:
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
                    prompt: (message || `Generate ${type}`) +
                        (tone ? `\n[Tone: ${tone}]` : '') +
                        (customInstructions ? `\n[Instructions: ${customInstructions}]` : ''),
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
