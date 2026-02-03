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

        // 0. Fetch Full Taxonomy Tree for Context
        const taxonomyTree = await prisma.taxonomy.findMany({
            where: { type: 'Pillar', active: true },
            include: {
                children: { // Sub
                    include: {
                        children: { // Comp
                            include: {
                                children: true // Behavior
                            }
                        }
                    }
                }
            }
        })

        // Build a simplified context string
        let taxonomyContext = "ESTRUCTURA METODOLÓGICA VÁLIDA (Debes seleccionar valores EXACTOS de esta lista):\n";
        taxonomyTree.forEach(p => {
            taxonomyContext += `\nPILAR: ${p.name}\n`;
            p.children.forEach(sub => {
                taxonomyContext += `  - Subcomponente: ${sub.name}\n`;
                sub.children.forEach(comp => {
                    taxonomyContext += `    * Competencia: ${comp.name}\n`;
                    const behaviors = comp.children.map(b => b.name).join(' | ');
                    taxonomyContext += `      > Conductas: ${behaviors.substring(0, 1000)}...\n`;
                });
            });
        });

        const prompt = `
            Eres la INTELIGENCIA ARTIFICIAL MAESTRA de la METODOLOGÍA 4SHINE. Tu razonamiento debe ser de NIVEL EJECUTIVO (C-Level).
            Analiza el contenido adjunto.

            ${taxonomyContext}
            
            ${dynamicContext}

            ${context ? `--- INSTRUCCIONES ESPECÍFICAS DE CONTEXTO ---\n${context}\n-------------------------------------------` : ''}

            --- REGLAS DE ORO DE ANÁLISIS ---
            0. **IDIOMA OBLIGATORIO**: TODO el contenido generado (summary, observations, relation4Shine, findings, etc.) DEBE estar en ESPAÑOL, incluso si el texto original está en inglés u otro idioma. TRADUCE Y ADAPTA si es necesario.
            1. SELECCIÓN DE PILAR OBLIGATORIA: Elige uno de los 4 pilares (Shine In, Shine Out, Shine Up, Shine Beyond) que mejor encaje.
            2. **TAXONOMÍA EXACTA**: Para "sub", "competence" y "behavior", DEBES usar una de las opciones listadas arriba que corresponda al Pilar seleccionado. NO INVENTES nombres. El texto debe coincidir carácter por carácter para que el sistema lo reconozca.
            3. CRITERIO DE EXPERTO: Si el contenido toca varios puntos, elige el más dominante.

            --- MANDATO DE OBSERVACIONES (OBLIGATORIO) ---
            El campo "observations" DEBE ser extenso (1000 a 2000 caracteres) y seguir esta estructura:
            1. [ANÁLISIS DE IMPACTO]: Explica cómo este contenido impacta al líder.
            2. [CONEXIÓN METODOLÓGICA]: Relaciona el contenido con el pilar.
            3. [GUÍA DEL FACILITADOR]: 5 pasos tácticos.
            4. [CONDUCTA OBSERVABLE]: Justifica por qué elegiste la conducta anterior.

            JSON STRUCTURE:
            {
              "title": "Título oficial de alto impacto",
              "summary": "Reseña fiel, técnica y detallada",
              "keyConcepts": "Lista de conceptos teóricos",
              "type": "PDF, Video, Audio, Toolkit, Test, Plantilla",
              "primaryPillar": "NOMBRE_EXACTO_DEL_PILAR",
              "secondaryPillars": ["Pilar Secundario 1"],
              "sub": "NOMBRE_EXACTO_DEL_SUBCOMPONENTE",
              "competence": "NOMBRE_EXACTO_DE_LA_COMPETENCIA",
              "behavior": "NOMBRE_EXACTO_DE_LA_CONDUCTA",
              "maturity": "Básico, En Desarrollo, Avanzado, Maestría",
              "targetRole": "Rol Objetivo",
              "duration": "90 min",
              "intervention": "Conciencia | Práctica | Herramienta | Evaluación",
              "moment": "Inicio | Refuerzo | Profundización | Cierre",
              "language": "Spanish (Latam)",
              "format": "Formato Técnico",
              "completeness": 90,
              "observations": "TEXTO_DE_ANÁLISIS_PROFUNDO"
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

    static async analyzeImage(imagePath: string, mimeType: string, context?: string) {
        const fs = require('fs')

        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found: ${imagePath}`)
        }

        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || null
        if (!apiKey) throw new Error("GEMINI_API_KEY no configurada.")

        // 1. Fetch Dynamic Context (RAG) - Same as analyzeContent
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

        // 2. Fetch Full Taxonomy Tree for Context
        const taxonomyTree = await prisma.taxonomy.findMany({
            where: { type: 'Pillar', active: true },
            include: {
                children: { // Sub
                    include: {
                        children: { // Comp
                            include: {
                                children: true // Behavior
                            }
                        }
                    }
                }
            }
        })

        // Build taxonomy context string
        let taxonomyContext = "ESTRUCTURA METODOLÓGICA VÁLIDA (Debes seleccionar valores EXACTOS de esta lista):\n";
        taxonomyTree.forEach(p => {
            taxonomyContext += `\nPILAR: ${p.name}\n`;
            p.children.forEach(sub => {
                taxonomyContext += `  - Subcomponente: ${sub.name}\n`;
                sub.children.forEach(comp => {
                    taxonomyContext += `    * Competencia: ${comp.name}\n`;
                    const behaviors = comp.children.map(b => b.name).join(' | ');
                    taxonomyContext += `      > Conductas: ${behaviors.substring(0, 1000)}...\n`;
                });
            });
        });

        const prompt = `
            Eres la INTELIGENCIA ARTIFICIAL MAESTRA de la METODOLOGÍA 4SHINE. Tu razonamiento debe ser de NIVEL EJECUTIVO (C-Level).
            Analiza la IMAGEN adjunta.

            ${taxonomyContext}
            
            ${dynamicContext}

            ${context ? `--- INSTRUCCIONES ESPECÍFICAS DE CONTEXTO ---\n${context}\n-------------------------------------------` : ''}

            --- REGLAS DE ORO DE ANÁLISIS ---
            0. **IDIOMA OBLIGATORIO**: TODO el contenido generado (summary, observations, relation4Shine, findings, etc.) DEBE estar en ESPAÑOL, incluso si el texto original está en inglés u otro idioma. TRADUCE Y ADAPTA si es necesario.
            1. SELECCIÓN DE PILAR OBLIGATORIA: Elige uno de los 4 pilares (Shine In, Shine Out, Shine Up, Shine Beyond) que mejor encaje.
            2. **TAXONOMÍA EXACTA**: Para "sub", "competence" y "behavior", DEBES usar una de las opciones listadas arriba que corresponda al Pilar seleccionado. NO INVENTES nombres. El texto debe coincidir carácter por carácter para que el sistema lo reconozca.
            3. CRITERIO DE EXPERTO: Si el contenido toca varios puntos, elige el más dominante.
            4. **ANÁLISIS DE IMAGEN**: Describe el contenido visual, identifica elementos clave, texto visible, diagramas, gráficos, y cualquier información relevante para la metodología 4Shine.

            --- MANDATO DE OBSERVACIONES (OBLIGATORIO) ---
            El campo "observations" DEBE ser extenso (1000 a 2000 caracteres) y seguir esta estructura:
            1. [DESCRIPCIÓN VISUAL]: Describe detalladamente qué se ve en la imagen.
            2. [ANÁLISIS DE IMPACTO]: Explica cómo este contenido visual impacta al líder.
            3. [CONEXIÓN METODOLÓGICA]: Relaciona el contenido con el pilar.
            4. [GUÍA DEL FACILITADOR]: 5 pasos tácticos para usar este recurso visual.
            5. [CONDUCTA OBSERVABLE]: Justifica por qué elegiste la conducta anterior.

            JSON STRUCTURE:
            {
              "title": "Título descriptivo de la imagen",
              "summary": "Descripción detallada del contenido visual",
              "keyConcepts": "Conceptos clave identificados en la imagen",
              "type": "PDF",
              "primaryPillar": "NOMBRE_EXACTO_DEL_PILAR",
              "secondaryPillars": ["Pilar Secundario 1"],
              "sub": "NOMBRE_EXACTO_DEL_SUBCOMPONENTE",
              "competence": "NOMBRE_EXACTO_DE_LA_COMPETENCIA",
              "behavior": "NOMBRE_EXACTO_DE_LA_CONDUCTA",
              "maturity": "Básico, En Desarrollo, Avanzado, Maestría",
              "targetRole": "Rol Objetivo",
              "intervention": "Conciencia | Práctica | Herramienta | Evaluación",
              "moment": "Inicio | Refuerzo | Profundización | Cierre",
              "language": "Spanish (Latam)",
              "format": "PNG, JPG, JPEG...",
              "completeness": 85,
              "observations": "TEXTO_DE_ANÁLISIS_PROFUNDO_CON_DESCRIPCIÓN_VISUAL"
            }

            Analiza la imagen y proporciona un análisis completo en formato JSON.
        `

        // Read image file and convert to base64
        const imageBuffer = fs.readFileSync(imagePath)
        const base64Image = imageBuffer.toString('base64')

        const modelsToTry = [
            "gemini-2.0-flash-exp", // Best for vision
            "gemini-2.0-flash",
            "gemini-1.5-flash-latest"
        ]

        let lastError = null

        for (const modelName of modelsToTry) {
            try {
                console.log(`[Gemini] Image Analysis attempting: ${modelName}...`)
                const genAI = new GoogleGenerativeAI(apiKey!)
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 2500,
                    }
                })

                const result = await model.generateContent([
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType
                        }
                    },
                    { text: prompt }
                ])

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
                console.error(`[Gemini] Image analysis failed on ${modelName}:`, error.message)
                continue
            }
        }

        throw new Error(`[Gemini All Models Failed] Último error: ${lastError?.message || lastError}`)
    }
}
