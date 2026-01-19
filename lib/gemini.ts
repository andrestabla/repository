import { GoogleGenerativeAI } from "@google/generative-ai"
import { SystemSettingsService } from "./settings"
import prisma from "./prisma"

export class GeminiService {
    static async analyzeContent(text: string, context?: string) {
        if (!text || text.length < 50) return null

        // Upgrading to Pro models for higher reasoning and better observations
        const modelsToTry = [
            "gemini-2.0-flash", // Preferred for speed/reasoning balance
            "gemini-2.5-flash", // Latest experimental
            "gemini-1.5-flash-latest" // Fallback
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

            ${context ? `--- INSTRUCCIONES ESPECÍFICAS DE CONTEXTO ---\n${context}\n-------------------------------------------` : ''}

            --- REGLAS DE ORO DE ANÁLISIS ---
            0. **IDIOMA OBLIGATORIO**: TODO el contenido generado (summary, observations, relation4Shine, findings, etc.) DEBE estar en ESPAÑOL, incluso si el texto original está en inglés u otro idioma. TRADUCE Y ADAPTA si es necesario.
            1. SELECCIÓN DE PILAR OBLIGATORIA: DEBES elegir uno de los 4 pilares (Shine In, Shine Out, Shine Up, Shine Beyond) como "primaryPillar". Solo usa "Transversal" si el contenido es 100% administrativo, pero siempre prioriza la vinculación metodológica.
            2. RESEÑA FIEL: El campo "summary" NO debe ser genérico. Debe ser una reseña/resumen fiel y detallado de lo que realmente dice el archivo. Si es un video, describe la narrativa. Si es un toolkit, describe las herramientas.
            3. CRITERIO DE EXPERTO: Tus sugerencias de "sub", "competence" y "behavior" deben ser ultra-específicas al contenido analizado.

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
            - "primaryPillar": OBLIGATORIO (Shine In, Shine Out, Shine Up, o Shine Beyond).
            - "secondaryPillars": Array de strings con otros pilares relevantes.
            - "completeness": Siempre calcular un porcentaje de 0 a 100 basado en tu propio análisis.

            Return ONLY a valid JSON object.

            JSON STRUCTURE:
            {
              "title": "Título oficial de alto impacto",
              "summary": "Reseña fiel, técnica y detallada del contenido analizado",
              "keyConcepts": "Lista de conceptos teóricos o técnicos fundamentales definidos en el texto",
              "type": "CÓDIGO_TIPO",
              "primaryPillar": "Pilar Principal Seleccionado",
              "secondaryPillars": ["Pilar Secundario 1", "Pilar Secundario 2"],
              "sub": "Subcomponente Específico",
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
              "observations": "TEXTO_DE_ANÁLISIS_PROFUNDO_DENSE_Y_ESTRATÉGICO",
              "apa": "Si se solicita en contexto o es relevante paper: Cita APA 7",
              "findings": "Si se solicita en contexto: Hallazgos clave",
              "methodology": "Si se solicita en contexto: Metodología usada",
              "relation4Shine": "Si se solicita en contexto: Explicación específica de relación con 4Shine",
              "pillars": ["Shine In", "Shine Out"], // Si se solicita sugerencia de pilares multiples
              "competence": "Si es investigación: Competencia técnica abordada",
              "geographicCoverage": "Si es investigación: Alcance geográfico (Global, LATAM, etc.)",
              "populationParams": "Si es investigación: Muestra o perfil demográfico participante"
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

    static async uploadMedia(filePath: string, mimeType: string) {
        const { GoogleAIFileManager } = require("@google/generative-ai/server");

        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || null
        if (!apiKey) throw new Error("GEMINI_API_KEY no configurada.")

        const fileManager = new GoogleAIFileManager(apiKey);

        console.log(`[Gemini] Uploading ${mimeType} to File API...`);
        const uploadResponse = await fileManager.uploadFile(filePath, {
            mimeType,
            displayName: "Asset Analysis Media",
        });

        console.log(`[Gemini] Upload complete: ${uploadResponse.file.uri} (Name: ${uploadResponse.file.name})`);

        return {
            uri: uploadResponse.file.uri,
            name: uploadResponse.file.name,
            mimeType: uploadResponse.file.mimeType,
            state: uploadResponse.file.state
        }
    }

    static async checkFileState(fileId: string) {
        const { GoogleAIFileManager } = require("@google/generative-ai/server");
        let apiKey = await SystemSettingsService.getGeminiApiKey() || process.env.GEMINI_API_KEY
        const fileManager = new GoogleAIFileManager(apiKey);
        const file = await fileManager.getFile(fileId);
        return file.state; // 'PROCESSING', 'ACTIVE', 'FAILED'
    }

    static async generateFromUri(uri: string, mimeType: string) {
        let apiKey = await SystemSettingsService.getGeminiApiKey() || process.env.GEMINI_API_KEY
        const genAI = new GoogleGenerativeAI(apiKey!)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        console.log(`[Gemini] Requesting analysis for URI: ${uri}...`);
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: mimeType,
                    fileUri: uri
                }
            },
            {
                text: `
                Act as a professional transcriber and analyst.
                1. Provide a FULL, ACCURATE TRANSCRIPTION of the audio/video.
                2. If there are visual slides, describe them briefly in brackets like [Slide: Title].
                3. Do not summarize yet, just transcribe faithfully.
                `
            }
        ]);

        return result.response.text();
    }

    static async transcribeMedia(filePath: string, mimeType: string): Promise<string> {
        // ... Legacy Wrapper for backward compatibility or small files ...
        const upload = await this.uploadMedia(filePath, mimeType)

        // Wait loop
        let state = upload.state
        while (state === 'PROCESSING') {
            await new Promise(resolve => setTimeout(resolve, 5000));
            state = await this.checkFileState(upload.name)
            if (state === 'FAILED') throw new Error('Video processing failed.')
        }

        return this.generateFromUri(upload.uri, upload.mimeType)
    }
}
