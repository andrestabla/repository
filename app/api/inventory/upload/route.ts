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
        try {
            if (mimeType === 'application/pdf') {
                const pdf = require('pdf-parse')
                const data = await pdf(buffer)
                extractedText = data.text
            } else if (mimeType.includes('text') || mimeType.includes('json')) {
                extractedText = buffer.toString('utf-8')
            }
        } catch (parseError) {
            console.error('[Upload API] Text extraction failed:', parseError)
            // Continue anyway, Gemini might not get text but we can still upload to Drive
        }

        // 2. IA Analysis
        let metadata = null
        if (extractedText) {
            try {
                metadata = await GeminiService.analyzeContent(extractedText)
            } catch (geminiError) {
                console.error('[Upload API] Gemini analysis failed:', geminiError)
            }
        }

        // 3. Upload to Drive
        let driveId = null
        try {
            const driveConfig = await SystemSettingsService.getDriveConfig()
            if (driveConfig.rootFolderId) {
                driveId = await uploadToDrive(filename, buffer, mimeType, driveConfig.rootFolderId)
            } else if (driveConfig.authorizedFolderIds?.length > 0) {
                // Fallback to first authorized folder if root is not explicitly set
                driveId = await uploadToDrive(filename, buffer, mimeType, driveConfig.authorizedFolderIds[0])
            } else {
                console.warn('[Upload API] No folder configured in settings')
            }
        } catch (driveError) {
            console.error('[Upload API] Drive upload failed:', driveError)
            // If upload fails, we still return metadata if we have it
        }

        return NextResponse.json({
            success: true,
            driveId,
            metadata,
            filename
        })

    } catch (error: any) {
        console.error('[Upload API Error]', error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}
