
import OpenAI from 'openai'
import { SystemSettingsService } from './settings'

const EMBEDDING_MODEL = 'text-embedding-3-small'

export class EmbeddingsService {

    private static async getClient() {
        let apiKey = await SystemSettingsService.getOpenAIApiKey()
        if (!apiKey) apiKey = process.env.OPENAI_API_KEY || null
        if (!apiKey) throw new Error("OPENAI_API_KEY no configurada.")

        return new OpenAI({ apiKey })
    }

    static async generateEmbedding(text: string): Promise<number[]> {
        if (!text || text.length === 0) return []

        // Clean text (remove newlines, extra spaces)
        const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 8000)

        try {
            const openai = await this.getClient()
            const response = await openai.embeddings.create({
                model: EMBEDDING_MODEL,
                input: cleanText,
                encoding_format: 'float'
            })

            return response.data[0].embedding
        } catch (error: any) {
            console.error('[Embeddings] Error generating:', error.message)
            return []
        }
    }

    static cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) return 0

        let dotProduct = 0
        let normA = 0
        let normB = 0

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i]
            normA += vecA[i] * vecA[i]
            normB += vecB[i] * vecB[i]
        }

        if (normA === 0 || normB === 0) return 0
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
    }
}
