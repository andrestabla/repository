import { GoogleGenerativeAI } from "@google/generative-ai"
import { SystemSettingsService } from "./settings"

export class GeminiService {
    static async analyzeContent(text: string) {
        if (!text || text.length < 50) return null

        // Try different model variations found in diagnostic
        const modelsToTry = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-flash-latest",
            "gemini-pro-latest",
            "gemini-1.5-flash",
            "gemini-pro"
        ]

        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || null
        if (!apiKey) throw new Error("GEMINI_API_KEY no configurada.")

        const prompt = `
            Eres un Auditor Metodológico experto en la METODOLOGÍA 4SHINE de Carmenza Alarcón.
            Tu tarea es analizar el contenido educativo adjunto y extraer metadatos exhaustivos y detallados para el sistema "4Shine Repository".

            --- CONTEXTO MAESTRO 4SHINE ---
            Propósito: Fortalecer liderazgo y marca personal ("Brillar").
            Estructura: 4 Pilares principales, cada uno con subcomponentes y competencias específicas.

            1. SHINE WITHIN (Brilla desde adentro) - Dominio interior.
               - Sub: Autoconfianza | Comp: Seguridad interna.
               - Sub: Inteligencia emocional | Comp: Autorregulación emocional.
               - Sub: Propósito personal | Comp: Claridad de propósito.

            2. SHINE OUT (Brilla hacia afuera) - Presencia y proyección.
               - Sub: Comunicación poderosa | Comp: Presencia y comunicación efectiva.
               - Sub: Influencia positiva | Comp: Persuasión e influencia ética.
               - Sub: Networking estratégico | Comp: Relacionamiento estratégico.

            3. SHINE UP (Brilla hacia arriba) - Visión y estrategia futura.
               - Sub: Visión de futuro | Comp: Pensamiento estratégico e innovador.
               - Sub: Toma de decisiones bajo presión | Comp: Decisión efectiva bajo presión.
               - Sub: Adaptabilidad | Comp: Liderazgo del cambio.

            4. SHINE BEYOND (Brilla más allá) - Trascendencia y legado.
               - Sub: Desarrollo de otros líderes | Comp: Mentoría y desarrollo de talento.
               - Sub: Impacto social y humano | Comp: Liderazgo consciente y ético.
               - Sub: Legado personal | Comp: Visión de legado.

            --- REGLAS DE ANÁLISIS ---
            1. Todos los campos de texto (title, summary, sub, competence, behavior, observations) DEBEN estar en ESPAÑOL.
            2. El "type" debe ser uno de los códigos técnicos: PDF, Video, Audio, Toolkit, Test, Rúbrica, Workbook, Documento maestro.
            3. "maturity" debe ser: Básico, En Desarrollo, Avanzado o Maestría.
            4. "targetRole" debe ser: Líder, Mentor, Facilitador.
            5. Extrae el "duration" estimado en minutos (solo número como string).
            6. "behavior" es una conducta observable que este contenido ayuda a desarrollar (ej. "Hace preguntas poderosas bajo presión").
            7. Intenta inferir "intervention" (Conciencia, Práctica, Herramienta, Evaluación) y "moment" (Inicio, Refuerzo, Profundización, Cierre).

            Return ONLY a valid JSON object (no markdown, no backticks).

            JSON STRUCTURE TO FILL:
            {
              "title": "Título oficial detallado en español",
              "summary": "Resumen ejecutivo de 1 frase en español",
              "type": "Código de tipo",
              "pillar": "Shine Within | Shine Out | Shine Up | Shine Beyond",
              "sub": "Subcomponente detectado",
              "competence": "Competencia clave asociada",
              "behavior": "Conducta observable detectada",
              "maturity": "Nivel de madurez sugerido",
              "targetRole": "Rol objetivo",
              "duration": "120",
              "intervention": "Tipo de intervención",
              "moment": "Momento del viaje",
              "language": "ES",
              "format": "Formato técnico inferido (ej. PDF, MP4)",
              "observations": "Notas pedagógicas adicionales en español"
            }

            CONTENT TO ANALYZE:
            ${text.substring(0, 30000)} 
        `

        let lastError = null

        // Strategy: Try models on default version, then maybe try different SDK approach
        for (const modelName of modelsToTry) {
            try {
                console.log(`[Gemini] Attempting ${modelName}...`)
                const genAI = new GoogleGenerativeAI(apiKey!)
                const model = genAI.getGenerativeModel({ model: modelName })
                const result = await model.generateContent(prompt)
                const response = await result.response
                const textResponse = response.text()

                const jsonText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim()
                return JSON.parse(jsonText)
            } catch (error: any) {
                lastError = error
                const msg = error.message || String(error)
                console.error(`[Gemini] Failed ${modelName}:`, msg)
                // If it's a 404, we continue to the next model
                if (msg.includes('404') || msg.includes('not found')) continue
                // If it's another error, we might want to stop or continue
                continue
            }
        }

        throw new Error(`[Gemini All Models Failed] Último error: ${lastError?.message || lastError}`)
    }
}
