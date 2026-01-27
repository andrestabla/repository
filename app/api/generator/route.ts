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

        // 1. Fetch Assets (Inventory)
        let assets: any[] = []
        let research: any[] = []
        let glossary: any[] = []
        let taxonomy: any[] = []

        if (useDeepSearch) {
            console.log("[Generator] Deep Search ENABLED: Fetching FULL KNOWLEDGE BASE...")
            // 1.1 Fetch ALL Valid Assets
            assets = await prisma.contentItem.findMany({
                where: { status: 'Validado' },
                select: { id: true, title: true, primaryPillar: true, observations: true }
            })
            // 1.2 Fetch ALL Research
            research = await prisma.researchSource.findMany({
                select: { id: true, title: true, findings: true, summary: true, url: true }
            })
            // 1.3 Fetch ALL Glossary
            glossary = await prisma.glossaryTerm.findMany({
                select: { term: true, definition: true }
            })
            // 1.4 Fetch ALL Taxonomy
            taxonomy = await prisma.taxonomy.findMany({
                where: { active: true },
                select: { name: true, type: true, parent: { select: { name: true } } }
            })

        } else {
            console.log("[Generator] Standard Mode: Fetching specific items...")
            // 1. Standard Fetch (Selected Ids)
            assets = await prisma.contentItem.findMany({
                where: { status: 'Validado' },
                select: { id: true, title: true, primaryPillar: true, observations: true }
            })

            if (selectedAssetIds && selectedAssetIds.length > 0) {
                assets = assets.filter(i => selectedAssetIds.includes(i.id))
            } else {
                assets = []
            }

            // 2. Fetch Research (External)
            if (selectedResearchIds && selectedResearchIds.length > 0) {
                research = await prisma.researchSource.findMany({
                    where: { id: { in: selectedResearchIds } },
                    select: { id: true, title: true, findings: true, summary: true, url: true }
                })
            }
        }

        // 3. Validation: Must have at least one source (Asset OR Research)
        if (assets.length === 0 && research.length === 0 && !useDeepSearch) {
            return NextResponse.json({ result: "⚠️ No hay activos validos ni investigaciones seleccionadas. Por favor selecciona al menos una fuente." })
        }

        // 4. Prepare Context (With Token Safeguards)
        const MAX_CHARS_PER_ITEM = 800 // ~200 tokens per item
        const TOTAL_CTX_BUDGET = 90000 // Increased for Deep Search (~22k tokens)

        let currentChars = 0

        const safelyTruncate = (text: any, limit: number) => {
            const str = String(text || '')
            if (str.length <= limit) return str
            return str.substring(0, limit) + '... (truncado)'
        }

        const buildSafeContext = (items: any[], type: 'ASSET' | 'RESEARCH' | 'GLOSSARY' | 'TAXONOMY') => {
            let contextParts = []
            for (const item of items) {
                if (currentChars >= TOTAL_CTX_BUDGET) {
                    contextParts.push(`\n[SYSTEM]: ... Límite de contexto alcanzado. ${items.length - contextParts.length} items restantes omitidos.`)
                    break
                }

                // Construct Item String
                let content = ""
                if (type === 'ASSET') {
                    content = `[ASSET: ${item.id}] TÍTULO: "${item.title}" (Pilar: ${item.primaryPillar})\nRESUMEN: ${safelyTruncate(item.observations, MAX_CHARS_PER_ITEM)}`
                } else if (type === 'RESEARCH') {
                    const synopsis = item.findings || item.summary || 'Sin resumen'
                    content = `[RESEARCH: ${item.id}] TÍTULO: "${item.title}" (URL: ${item.url})\nHALLAZGOS: ${safelyTruncate(synopsis, MAX_CHARS_PER_ITEM)}`
                } else if (type === 'GLOSSARY') {
                    content = `[TERM]: ${item.term} | DEF: ${item.definition}`
                } else if (type === 'TAXONOMY') {
                    const parentInfo = item.parent ? `(Padre: ${item.parent.name})` : '(Raíz)'
                    content = `[TAX]: ${item.name} (${item.type}) ${parentInfo}`
                }

                contextParts.push(content)
                currentChars += content.length
            }
            return contextParts.join('\n\n')
        }

        // Priority Order for Deep Search Context
        const taxonomyContext = buildSafeContext(taxonomy, 'TAXONOMY')
        const glossaryContext = buildSafeContext(glossary, 'GLOSSARY')
        const inventoryContext = buildSafeContext(assets, 'ASSET')
        const researchContext = buildSafeContext(research, 'RESEARCH')

        const combinedContext = `
        === TAXONOMÍA ORGANIZACIONAL ===
        ${taxonomyContext || 'N/A'}

        === GLOSARIO DE TÉRMINOS ===
        ${glossaryContext || 'N/A'}

        === INVENTARIO DE ACTIVOS (4SHINE) ===
        ${inventoryContext || 'Ninguno.'}

        === FUENTES DE INVESTIGACIÓN ===
        ${researchContext || 'Ninguna.'}
        `

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
             MODO BÚSQUEDA PROFUNDA CIENTÍFICA (DEEP SEARCH):
             1. **INTEGRACIÓN DE CONOCIMIENTO**: Tu objetivo es responder de la manera más completa posible. Usa el CONTEXTO proporcionado (Glosario, Taxonomía, Investigaciones) como base.
             2. **MANEJO DE VACÍOS**: Si la respuesta exacta no está en el contexto, O si el usuario pregunta por un término que no existe textualmente (ej: "Presencia Estratégica" vs "Presencia Ejecutiva"):
                - USA tu conocimiento general para definir el concepto solicitado.
                - BUSCA y RELACIONA conceptos similares del contexto (ej: "En el glosario figura 'Presencia Ejecutiva', que se relaciona así...").
                - NO digas "no puedo responder". Rellena los vacíos con tu conocimiento experto, indicando siempre qué parte viene del contexto 4Shine y qué parte es conocimiento general.
             3. **CITAS**: Si usas información del contexto, cita la fuente (ej: [Glosario], [Taxonomía], [Investigación]).
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
