import { NextRequest, NextResponse } from 'next/server'
import { getFileContent } from '@/lib/drive'
// import { GeminiService } from '@/lib/gemini' // Dynamic import used inside POST to avoid huge bundle or circular deps logic if any
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    // Auth Check
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { driveId, url, type } = await request.json()

        if (!driveId && !url) {
            return NextResponse.json({ error: 'Drive ID or URL required' }, { status: 400 })
        }

        // ... (Content fetching logic remains the same) ...

        // 1. Get Text or Transcribe Content
        console.log(`[Analyze] Fetching content for ${driveId}...`)

        let text = ''
        let transcription = null

        // ... (Drive file handling) ...
        const { google } = require('googleapis')
        const { SystemSettingsService } = require('@/lib/settings')
        const config = await SystemSettingsService.getDriveConfig()
        const credentials = JSON.parse(config.serviceAccountJson)
        const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive'] })

        if (driveId) {
            const drive = google.drive({ version: 'v3', auth })
            const meta = await drive.files.get({ fileId: driveId, fields: 'mimeType, name' })
            const mimeType = meta.data.mimeType

            if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
                console.log(`[Analyze] Detected Media: ${mimeType}. Starting Transcription Pipeline...`)
                const { downloadDriveFile } = require('@/lib/drive')
                const { GeminiService } = require('@/lib/gemini')
                const fs = require('fs')

                // A. Download
                const localFile = await downloadDriveFile(driveId)
                try {
                    transcription = await GeminiService.transcribeMedia(localFile.path, localFile.mimeType)
                    text = `[TRANSCRIPTION OF VIDEO/AUDIO: ${localFile.originalName}]\n\n${transcription}`
                } finally {
                    if (fs.existsSync(localFile.path)) fs.unlinkSync(localFile.path)
                }
            } else {
                text = await getFileContent(driveId)
            }
        }

        // ... (URL handling) ...
        if (url) {
            // ... existing URL fallback logic ...
            let targetUrl = url.trim()
            if (!/^https?:\/\//i.test(targetUrl)) {
                targetUrl = 'https://' + targetUrl
            }

            console.log(`[Analyze] Analyzing URL: ${targetUrl}`)
            try {
                const res = await fetch(targetUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
                    }
                })

                if (!res.ok) throw new Error(`Status: ${res.status}`)

                const html = await res.text()
                text = html.replace(/<[^>]*>/g, ' ').substring(0, 30000)
                text = `[CONTENT FROM URL: ${targetUrl}]\n\n` + text
            } catch (e) {
                console.warn('URL Fetch failed, attempting Knowledge Fallback:', e)
                text = `
                [SYSTEM ERROR: ACCESS TO URL "${targetUrl}" WAS BLOCKED]
                
                INSTRUCTION FOR AI:
                The system could not scrape this URL directly (likely due to academic paywall or bot protection).
                HOWEVER, you are a sophisticated model with vast training data.
                1. Identify this resource solely from the URL (e.g., if it's an SSRN, DOI, or famous paper link).
                2. If you recognize it, perform the analysis based on your INTERNAL KNOWLEDGE of this paper.
                3. If you do not recognize it at all, return the JSON with "summary": "No se pudo acceder al contenido externo ni identificarlo en la base de conocimientos."
                
                URL TO ANALYZE: ${targetUrl}
                `
            }
        }

        // --- CONTEXT SENSITIVITY ---
        let promptContext = ''
        if (type === 'Investigación') {
            promptContext = `
            MODO: ANÁLISIS DE FUENTE ACADÉMICA / INVESTIGACIÓN
            
            NECESITO QUE TUS RESULTADOS ALIMENTEN UNA FICHA DE INVESTIGACIÓN.
            POR FAVOR, ASEGURA LLENAR LOS SIGUIENTES CAMPOS EN EL JSON:
            
            - "apa": La cita bibliográfica completa en formato APA 7.
            - "findings": Una sección detallada de hallazgos empíricos o teóricos del documento.
            - "methodology": Describe brevemente la metodología (Cualitativa, Cuantitativa, Revisión, etc.).
            - "keyConcepts": Lista de conceptos clave separados por comas.
            - "competence": Competencia técnica o de liderazgo principal que aborda el estudio.
            - "geographicCoverage": Región geográfica del estudio (e.g., Global, LATAM, USA, Europa).
            - "populationParams": Descripción breve de la muestra (e.g., 500 Ejecutivos, Estudiantes MBA, etc.).
            - "pillars": Array de Strings sugiriendo qué pilares 4Shine toca (Shine In, Shine Out, Shine Up, Shine On).
            - "relation4Shine": UN PÁRRAFO CRÍTICO explicando cómo este paper sustenta o valida científicamente los pilares seleccionados.
            
            (Mantén también el summary y el title en el JSON).
            `
        }

        // 2. Analyze with Gemini
        console.log(`[Analyze] Sending ${text.length} chars to Gemini with context: ${type}...`)
        const { GeminiService } = await import('@/lib/gemini')
        const metadata = await GeminiService.analyzeContent(text, promptContext)

        // Inject transcription into metadata if exists
        if (transcription) {
            metadata.transcription = transcription
        }

        let suggestedId = null
        if (metadata?.type) {
            const { IdGeneratorService } = require('@/lib/id-generator')
            suggestedId = await IdGeneratorService.generateId(metadata.type)
        }

        return NextResponse.json({ success: true, data: metadata, suggestedId })

    } catch (error: any) {
        console.error('Analysis API Error:', error)
        const msg = error?.message || String(error)
        console.error('[Analyze Error]', msg)

        return NextResponse.json({
            error: msg.includes('GEMINI_API_KEY') ? 'Gemini API Key not configured' : msg
        }, { status: 500 })
    }
}
