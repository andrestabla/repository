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
        // ... prompt construction continues below ...


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
            Actúa como VISUAL DATA DESIGNER.
            Genera un JSON ESTRUCTURADO para una INFOGRAFÍA de alto impacto.

            IMPORTANTE: Tu respuesta DEBE contener la palabra "json" explícitamente en el cuerpo del mensaje para cumplir con los requisitos de la API.

            FORMATO JSON REQUERIDO:
            {
              "title": "Título llamativo",
              "intro": "Breve introducción visual",
              "sections": [
                 {
                    "title": "Encabezado Sección",
                    "content": " Texto explicativo conciso",
                    "icon": "zap | chart | trend | users | target",
                    "stats": [ { "label": "Dato", "value": "50%" } ],
                    "chart": { "type": "bar", "data": [ { "name": "A", "value": 80 }, { "name": "B", "value": 40 } ] }
                 }
              ],
              "conclusion": "Cierre impactante"
            }

            IMPORTANTE:
            - RESPUESTA DEBE SER ÚNICAMENTE EL JSON.
            - NO Markdown code blocks. Solo el JSON raw string.
            - Crea al menos 4 secciones.

            CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'presentation') {
            prompt = `
            Actúa como EXPERTO EN COMUNICACIÓN.
            Genera la estructura para una ** PRESENTACIÓN(Slide Deck) ** de 7 diapositivas.
            
            FORMATO POR SLIDE:
            ** SLIDE X: [Título] **
                - Bullet points del contenido.
            - Sugerencia visual(Imagen / Gráfico).

                CONTEXTO:
            ${combinedContext}
            `
        }

        // 6. Generate (OpenAI)
        console.log("[Generator] Starting OpenAI generation...")
        let output = ""
        try {
            const options = type === 'infographic' ? { response_format: { type: "json_object" } } : undefined
            output = await OpenAIService.generateContent(prompt, "gpt-4o", options) || "No response generated."

            // CLEANING: If type is infographic, we MUST ensure we have a clean JSON string
            if (type === 'infographic') {
                // Remove Markdown code blocks if present
                output = output.replace(/```json/g, '').replace(/```/g, '').trim()
                // Validate if it is JSON
                try {
                    JSON.parse(output)
                    // If safe, we keep it clean.
                } catch (e) {
                    console.error("Generator Output was not valid JSON:", output.substring(0, 100))
                    // Fallback to text if JSON fails? Or just let it be text so frontend shows error.
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
