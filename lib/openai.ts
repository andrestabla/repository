import OpenAI from 'openai'
import { SystemSettingsService } from "./settings"

export class OpenAIService {
    static async generateContent(prompt: string, model: string = "gpt-4o") {
        let apiKey = await SystemSettingsService.getOpenAIApiKey()
        if (!apiKey) apiKey = process.env.OPENAI_API_KEY || null
        if (!apiKey) throw new Error("OPENAI_API_KEY no configurada.")

        const openai = new OpenAI({ apiKey })

        try {
            console.log(`[OpenAI] Generating with ${model}...`)
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: model,
                temperature: 0.4,
                max_tokens: 4096, // Reasonable limit for GPT-4o
                top_p: 0.95,
            })

            return completion.choices[0].message.content
        } catch (error: any) {
            console.error(`[OpenAI] Generation failed:`, error.message)
            throw error
        }
    }
}
