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
    static async analyzeContent(text: string, context?: string) {
        if (!text || text.length < 50) return null

        let apiKey = await SystemSettingsService.getOpenAIApiKey()
        if (!apiKey) apiKey = process.env.OPENAI_API_KEY || null
        if (!apiKey) throw new Error("OPENAI_API_KEY no configurada.")

        const prisma = (await import('@/lib/prisma')).default

        // 1. Fetch Dynamic Context (RAG)
        const validatedSamples = await prisma.contentItem.findMany({
            where: { status: 'Validado' },
            take: 3,
            select: {
                title: true,
                primaryPillar: true,
                sub: true,
                competence: true,
                behavior: true,
            }
        })

        const dynamicContext = validatedSamples.length > 0
            ? "\nEJEMPLOS DE ACTIVOS VALIDADOS (Referencia):\n" +
            validatedSamples.map((s: any) => `
            - Título: ${s.title}
            - Pilar: ${s.primaryPillar}
            - Sub: ${s.sub} | Competencia: ${s.competence}
            `).join('\n')
            : "";

        const prompt = `
            Eres la INTELIGENCIA ARTIFICIAL MAESTRA de la METODOLOGÍA 4SHINE. Tu razonamiento debe ser de NIVEL EJECUTIVO (C-Level).
            Analiza el contenido adjunto.

            ${dynamicContext}

            ${context ? `--- CONTEXTO ADICIONAL ---\n${context}\n-------------------------` : ''}

            --- REGLAS DE ORO ---
            0. **IDIOMA**: SIEMPRE ESPAÑOL.
            1. **PILARES**: Shine In, Shine Out, Shine Up, Shine Beyond. Prioriza uno.
            2. **CALIDAD**: Sé ultra-específico. Nada de generalidades.

            --- JSON OUTPUT OBLIGATORIO ---
            Responde ÚNICAMENTE con un objeto JSON válido. NO Markdown.
            
            Estructura JSON:
            {
              "title": "Título oficial sugerido",
              "summary": "Reseña técnica detallada",
              "type": "PDF | Video | Audio | Toolkit | Test",
              "primaryPillar": "Shine In | Shine Out | Shine Up | Shine Beyond",
              "secondaryPillars": ["Pilar 2"],
              "sub": "Subcomponente",
              "competence": "Competencia",
              "behavior": "Conducta Observable",
              "maturity": "Básico | En Desarrollo | Avanzado | Maestría",
              "targetRole": "Líder | Mentor",
              "duration": "90",
              "completeness": 100,
              "observations": "Análisis profundo de impacto y conexión metodológica.",
              "apa": "Cita APA 7 (si aplica)",
              "findings": "Hallazgos clave (si aplica)",
              "methodology": "Metodología (si aplica)",
              "relation4Shine": "Vinculación 4Shine (si aplica)"
            }

            CONTENT TO ANALYZE:
            ${text.substring(0, 50000)}
        `

        const openai = new OpenAI({ apiKey })

        try {
            console.log(`[OpenAI] Analyzing content with gpt-4o...`)
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o",
                temperature: 0.2, // Low temp for extraction
                response_format: { type: "json_object" } // Enforce JSON mode
            })

            const content = completion.choices[0].message.content
            if (!content) throw new Error("OpenAI returned empty content")

            return JSON.parse(content)

        } catch (error: any) {
            console.error(`[OpenAI] Analysis failed:`, error.message)
            throw error
        }
    }
}
