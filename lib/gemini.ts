
import { GoogleGenerativeAI } from "@google/generative-ai"

const getApiKey = () => {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error("GEMINI_API_KEY is not set in environment variables.")
    return key
}

export class GeminiService {
    static async analyzeContent(text: string) {
        if (!text || text.length < 50) return null

        try {
            const genAI = new GoogleGenerativeAI(getApiKey())
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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
            ${text.substring(0, 15000)} 
            ` // Truncate to avoid limit if huge, though Flash handles 1M.

            const result = await model.generateContent(prompt)
            const response = await result.response
            const textResponse = response.text()

            // Clean markdown if present
            const jsonText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim()
            return JSON.parse(jsonText)
        } catch (error) {
            console.error("Gemini Analysis Error:", error)
            throw error
        }
    }
}
