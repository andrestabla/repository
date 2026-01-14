
import { GoogleGenerativeAI } from "@google/generative-ai"
import { SystemSettingsService } from "./settings"

export class GeminiService {
    private static async getModel() {
        // Priority: DB Setting > Env Var
        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || null

        if (!apiKey) throw new Error("GEMINI_API_KEY no configurada (ni en DB ni en Env).")

        const genAI = new GoogleGenerativeAI(apiKey)

        // List of models to try in order of preference
        const modelsToTry = [
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash",
            "gemini-pro",
            "gemini-1.0-pro"
        ]

        let lastError = null
        for (const modelName of modelsToTry) {
            try {
                console.log(`[Gemini] Attempting to use model: ${modelName}`)
                const model = genAI.getGenerativeModel({ model: modelName })
                // Test the model with a tiny prompt to see if it exists/works
                // Note: We don't do a full call here, just return the model object.
                // The actual failure often happens during generation.
                return model
            } catch (err) {
                lastError = err
                console.warn(`[Gemini] Model ${modelName} not available, trying next...`)
            }
        }

        throw lastError || new Error("No available Gemini models found.")
    }

    static async analyzeContent(text: string) {
        if (!text || text.length < 50) return null

        // Try different model variations if generation fails with 404
        const modelsToTry = [
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash",
            "gemini-1.5-pro-latest",
            "gemini-pro"
        ]

        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || null
        if (!apiKey) throw new Error("GEMINI_API_KEY no configurada.")

        const genAI = new GoogleGenerativeAI(apiKey)

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
        for (const modelName of modelsToTry) {
            try {
                console.log(`[Gemini] Generation attempt with: ${modelName}`)
                const model = genAI.getGenerativeModel({ model: modelName })
                const result = await model.generateContent(prompt)
                const response = await result.response
                const textResponse = response.text()

                // Clean markdown if present
                const jsonText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim()
                return JSON.parse(jsonText)
            } catch (error: any) {
                lastError = error
                const errorMsg = error.message || String(error)
                console.error(`[Gemini] Error with ${modelName}:`, errorMsg)

                // If it's a 404, we try the next model
                if (errorMsg.includes('404') || errorMsg.includes('not found')) {
                    continue
                }
                // If it's another type of error, maybe retry once or throw
                throw error
            }
        }

        throw lastError
    }
}
