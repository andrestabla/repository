import { GoogleGenerativeAI } from "@google/generative-ai"
import { SystemSettingsService } from "./settings"

export class GeminiService {
    static async analyzeContent(text: string) {
        if (!text || text.length < 50) return null

        // Try different model variations
        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-pro",
        ]

        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || null
        if (!apiKey) throw new Error("GEMINI_API_KEY no configurada.")

        const prompt = `
            You are an expert Methodological Auditor. Your task is to analyze the following educational content text and extract structured metadata for our inventory system "4Shine".
            
            Taxonomy Context:
            - Pillars: "Shine Out" (Influence/Sales), "Shine In" (Personal/Inner), "Shine Up" (Leadership/Power), "Shine On" (Communication/Public).
            - Maturity: "Básico", "En Desarrollo", "Avanzado", "Maestría".
            - Roles: "Líder", "Mentor", "Facilitador".
            
            Return ONLY a valid JSON object (no markdown, no backticks) with the following fields and best-guess values based on the text. If a field is not clear, use null.
            
            {
              "title": "Suggested official title",
              "summary": "Short 1-sentence summary (mapped to observations)",
              "type": "PDF or Video or Toolkit",
              "pillar": "One of the 4 Pillars",
              "sub": "Sub-theme (e.g. Communication, Emotional Intelligence)",
              "competence": "Main competence worked",
              "maturity": "Estimated maturity level",
              "targetRole": "Primary target audience role",
              "duration": "Estimated duration in minutes (string, e.g. '120')"
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
                if (msg.includes('404') || msg.includes('not found')) continue
                throw error
            }
        }

        throw lastError
    }
}
