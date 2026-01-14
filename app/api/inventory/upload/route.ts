import { NextRequest, NextResponse } from 'next/server'
import { getFileContent, uploadToDrive } from '@/lib/drive'
import { GeminiService } from '@/lib/gemini'
import { SystemSettingsService } from '@/lib/settings'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = file.name
        const mimeType = file.type

        console.log(`[Upload API] Processing file: ${filename} (${mimeType}, ${buffer.length} bytes)`)

        // 1. Extract text (if possible) for Gemini analysis
        let extractedText = ""
        let extractionError = null
        try {
            if (mimeType === 'application/pdf') {
                // Polyfill for pdf-parse compatibility in Next.js Server Environment
                if (typeof (global as any).DOMMatrix === 'undefined') {
                    (global as any).DOMMatrix = class DOMMatrix { }
                }
                const pdf = require('pdf-parse')
                const data = await pdf(buffer)
                extractedText = data.text
                console.log(`[Upload API] PDF text extracted (${extractedText.length} chars)`)
            } else if (mimeType.includes('text') || mimeType.includes('json')) {
                extractedText = buffer.toString('utf-8')
                console.log(`[Upload API] Text file read (${extractedText.length} chars)`)
            }
        } catch (parseError: any) {
            extractionError = parseError.message || String(parseError)
            console.error('[Upload API] Text extraction failed:', parseError)
        }

        // 2. IA Analysis
        let metadata = null
        let geminiErrorDetail = null
        if (extractedText) {
            try {
                metadata = await GeminiService.analyzeContent(extractedText)
            } catch (geminiError: any) {
                geminiErrorDetail = geminiError.message || String(geminiError)
                console.error('[Upload API] Gemini analysis failed:', geminiError)
            }
        }

        // 3. Upload to Drive
        let driveId = null
        let driveErrorDetail = null
        try {
            const driveConfig = await SystemSettingsService.getDriveConfig()
            const targetFolderId = driveConfig.rootFolderId || (driveConfig.authorizedFolderIds?.length > 0 ? driveConfig.authorizedFolderIds[0] : null)

            if (targetFolderId) {
                driveId = await uploadToDrive(filename, buffer, mimeType, targetFolderId)
            } else {
                driveErrorDetail = 'No target folder ID found in configuration'
                console.warn('[Upload API] No folder configured in settings')
            }
        } catch (driveError: any) {
            driveErrorDetail = driveError.message || String(driveError)
            console.error('[Upload API] Drive upload failed:', driveError)
        }

        return NextResponse.json({
            success: true,
            driveId,
            metadata,
            filename,
            debug: {
                extractionError,
                geminiError: geminiErrorDetail,
                driveError: driveErrorDetail
            }
        })

    } catch (error: any) {
        console.error('[Upload API Error]', error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}
