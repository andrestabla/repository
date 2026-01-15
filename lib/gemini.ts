import { GoogleGenerativeAI } from "@google/generative-ai"
import { SystemSettingsService } from "./settings"
import prisma from "./prisma"

export class GeminiService {
    static async analyzeContent(text: string) {
        if (!text || text.length < 50) return null

        // Upgrading to Pro models for higher reasoning and better observations
        const modelsToTry = [
            "gemini-2.0-flash", // Preferred for speed/reasoning balance
            "gemini-1.5-pro-latest",
            "gemini-1.5-pro"
        ]

        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || null
        if (!apiKey) throw new Error("GEMINI_API_KEY no configurada.")

        // 1. Fetch Dynamic Context (RAG)
        // We get examples of high-quality validated assets to guide the IA
        const validatedSamples = await prisma.contentItem.findMany({
            where: { status: 'Validado' },
            take: 5,
            select: {
                title: true,
                primaryPillar: true,
                secondaryPillars: true,
                sub: true,
                competence: true,
                behavior: true,
                observations: true
            }
        })

        const dynamicContext = validatedSamples.length > 0
            ? "\nEJEMPLOS DE ACTIVOS VALIDADOS (Referencia de Estilo y Nivel):\n" +
            validatedSamples.map(s => `
            - Título: ${s.title}
            - Pilar: ${s.primaryPillar} (${(s.secondaryPillars as string[]).join(', ')})
            - Sub: ${s.sub} | Competencia: ${s.competence}
            - Conducta: ${s.behavior}
            - Observación Clave: ${s.observations?.substring(0, 300)}...
            `).join('\n')
            : "";

        // Massive Context Injection
        const methodologyReference = `
        METODOLOGÍA 4SHINE DE CARMENZA ALARCÓN:
        - Propósito: Fortalecer liderazgo y marca personal ("Brillar").
        - Pilar 1: SHINE WITHIN (Dominio Interior). Subcomponentes: Autoconfianza, Inteligencia emocional, Propósito personal.
        - Pilar 2: SHINE OUT (Presencia y Proyección). Subcomponentes: Comunicación poderosa, Influencia positiva, Networking estratégico.
        - Pilar 3: SHINE UP (Visión y Estrategia). Subcomponentes: Política Organizacional, Liderazgo Estratégico, Negociación Avanzada, Gestión de Stakeholders.
        - Pilar 4: SHINE BEYOND (Trascendencia y Legado). Subcomponentes: Mentoría & Coaching, Innovación y Futuro, Sostenibilidad del Éxito, Transferencia de Conocimiento.
        Principios: Liderazgo de adentro hacia afuera, autenticidad, bienestar y resultados estratégicos.
        `;

        const prompt = `
            Eres la INTELIGENCIA ARTIFICIAL MAESTRA de la METODOLOGÍA 4SHINE. Tu razonamiento debe ser de NIVEL EJECUTIVO (C-Level).
            Analiza el contenido adjunto usando la siguiente GUÍA DE REFERENCIA:
            ${methodologyReference}

            ${dynamicContext}

            --- MANDATO DE OBSERVACIONES (OBLIGATORIO) ---
            El campo "observations" DEBE ser extenso (1000 a 2000 caracteres) y seguir esta estructura interna:
            1. [ANÁLISIS DE IMPACTO]: Explica cómo este contenido específico desactiva creencias limitantes y activa el "brillo" del líder.
            2. [CONEXIÓN METODOLÓGICA]: Relaciona el contenido con el pilar principal y explica por qué se vincula también con los pilares secundarios sugeridos.
            3. [GUÍA DEL FACILITADOR]: Da 5 pasos tácticos para que un mentor use este material de forma transformadora.
            4. [CONDUCTA OBSERVABLE]: Describe cómo se verá el líder una vez que haya integrado este conocimiento.

            --- REGLAS DE COMPLETITUD (100% OBLIGATORIO) ---
            - Todos los campos del JSON deben estar presentes y completados con datos lógicos.
            - "type": PDF, Video, Audio, Toolkit, Test, Rúbrica, Workbook, Documento maestro.
            - "maturity": Básico, En Desarrollo, Avanzado, Maestría.
            - "primaryPillar": El pilar más relevante (de los 4 definidos).
            - "secondaryPillars": Array de strings con otros pilares relevantes si aplica. Si no hay otros, usar [].
            - "completeness": Siempre calcular un porcentaje de 0 a 100 basado en tu propio análisis.

            Return ONLY a valid JSON object.

            JSON STRUCTURE:
            {
              "title": "Título oficial de alto impacto",
              "summary": "Resumen ejecutivo estratégico",
              "type": "CÓDIGO_TIPO",
              "primaryPillar": "Pilar Principal",
              "secondaryPillars": ["Pilar Secundario 1", "Pilar Secundario 2"],
              "sub": "Subcomponente",
              "competence": "Competencia Maestra",
              "behavior": "Conducta Observable específica",
              "maturity": "Nivel de Madurez",
              "targetRole": "Rol Objetivo",
              "duration": "90",
              "intervention": "Conciencia | Práctica | Herramienta | Evaluación",
              "moment": "Inicio | Refuerzo | Profundización | Cierre",
              "language": "ES",
              "format": "Formato Técnico",
              "completeness": 100,
              "observations": "TEXTO_DE_ANÁLISIS_PROFUNDO_DENSE_Y_ESTRATÉGICO"
            }

            CONTENT TO ANALYZE:
            ${text.substring(0, 30000)} 
        `

        let lastError = null

        for (const modelName of modelsToTry) {
            try {
                console.log(`[Gemini] Executive Analysis attempting: ${modelName}...`)
                const genAI = new GoogleGenerativeAI(apiKey!)
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.3, // Maximum rigor, minimum randomness
                        maxOutputTokens: 2500,
                    }
                })
                const result = await model.generateContent(prompt)
                const response = await result.response
                const textResponse = response.text()

                const jsonText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim()
                const parsed = JSON.parse(jsonText)

                // Final check to prevent lazy output
                if (parsed.observations.length < 200) {
                    throw new Error("Respuesta de IA insuficiente bajo criterio de calidad.");
                }

                return parsed
            } catch (error: any) {
                lastError = error
                console.error(`[Gemini] Analysis failed or low quality on ${modelName}:`, error.message)
                continue
            }
        }

        throw new Error(`[Gemini All Models Failed] Último error: ${lastError?.message || lastError}`)
    }
}
