import { GoogleGenerativeAI } from "@google/generative-ai"
import { SystemSettingsService } from "./settings"

export class GeminiService {
    static async analyzeContent(text: string) {
        if (!text || text.length < 50) return null

        // Upgrading to Pro models for higher reasoning and better observations
        const modelsToTry = [
            "gemini-1.5-pro-latest",
            "gemini-1.5-pro",
            "gemini-2.0-flash", // Flash as fallback only
            "gemini-flash-latest"
        ]

        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || null
        if (!apiKey) throw new Error("GEMINI_API_KEY no configurada.")

        const prompt = `
            Eres un AUDITOR METODOLÓGICO SENIOR y EXPERTO MASTER en la METODOLOGÍA 4SHINE de Carmenza Alarcón.
            Tu misión es realizar un análisis de "Clase Maestra" sobre el contenido educativo adjunto. No aceptamos respuestas genéricas ni superficiales.

            --- MARCO METODOLÓGICO 4SHINE (Contexto) ---
            4Shine integra el liderazgo estratégico con la marca personal ejecutiva.
            1. SHINE WITHIN: Dominio interior, inteligencia emocional, propósito.
            2. SHINE OUT: Presencia ejecutiva, comunicación poderosa, influencia e impacto.
            3. SHINE UP: Visión estratégica, toma de decisiones, adaptabilidad al futuro.
            4. SHINE BEYOND: Trascendencia, mentoría, desarrollo de otros y legado.

            --- MANDATO DE OBSERVACIONES (CRÍTICO) ---
            El campo "observations" debe ser la joya de la corona de este análisis. 
            Debes escribir como si fueras la misma Carmenza Alarcón asesorando a un líder de alto nivel.
            REQUERIMIENTOS PARA OBSERVACIONES:
            1. Valor Estratégico: Explica EXACTAMENTE por qué este contenido es vital para el éxito del líder. No digas "es útil", di "este material rompe la barrera de X para lograr Y".
            2. Aplicación Práctica: Da instrucciones precisas al facilitador sobre cómo "activar" este contenido en una sesión real.
            3. Desglose de Competencias: Menciona explícitamente qué competencias del modelo 4Shine se están fortaleciendo y cómo.
            4. Tono: Profesional, inspirador, estratégico y de alto impacto.
            5. Extensión: Mínimo 4 párrafos densos y bien estructurados.

            --- REGLAS DE FORMATO ---
            1. TODO EN ESPAÑOL NEUTRO Y PROFESIONAL.
            2. El "type" debe ser: PDF, Video, Audio, Toolkit, Test, Rúbrica, Workbook, o Documento maestro.
            3. "maturity": Básico, En Desarrollo, Avanzado, Maestría.
            4. "targetRole": Líder, Mentor, Facilitador.

            Return ONLY a valid JSON object (no markdown, no backticks).

            JSON STRUCTURE:
            {
              "title": "Título oficial de alto impacto",
              "summary": "Resumen ejecutivo estratégico (1 frase)",
              "type": "CÓDIGO_TIPO",
              "pillar": "Pilar Principal",
              "sub": "Subcomponente",
              "competence": "Competencia Maestra",
              "behavior": "Conducta Observable que transforma",
              "maturity": "Nivel de Madurez",
              "targetRole": "Rol Objetivo",
              "duration": "90",
              "intervention": "Conciencia | Práctica | Herramienta | Evaluación",
              "moment": "Inicio | Refuerzo | Profundización | Cierre",
              "language": "ES",
              "format": "PDF | MP4 | etc",
              "observations": "ANÁLISIS METODOLÓGICO DE CLASE MAESTRA (Detalle profundo, estratégico y pedagógico. Mínimo 800 caracteres)"
            }

            CONTENT TO ANALYZE:
            ${text.substring(0, 30000)} 
        `

        let lastError = null

        for (const modelName of modelsToTry) {
            try {
                console.log(`[Gemini] Attempting High-Reasoning Model: ${modelName}...`)
                const genAI = new GoogleGenerativeAI(apiKey!)
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.4, // Lower temperature for more consistent reasoning
                        maxOutputTokens: 2048,
                    }
                })
                const result = await model.generateContent(prompt)
                const response = await result.response
                const textResponse = response.text()

                const jsonText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim()
                return JSON.parse(jsonText)
            } catch (error: any) {
                lastError = error
                const msg = error.message || String(error)
                console.error(`[Gemini] Failed ${modelName}:`, msg)
                if (msg.includes('404') || msg.includes('not found')) continue
                continue
            }
        }

        throw new Error(`[Gemini All Models Failed] Último error: ${lastError?.message || lastError}`)
    }
}
