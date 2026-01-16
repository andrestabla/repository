import { NextRequest, NextResponse } from 'next/server'
import { getFileContent } from '@/lib/drive'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
    // Auth Check
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { driveId, url, type } = await request.json()

        if (!driveId && !url) {
            return NextResponse.json({ error: 'Drive ID or URL required' }, { status: 400 })
        }

        // 1. Get Text or Transcribe Content
        console.log(`[Analyze] Fetching content for ${driveId || url}...`)

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
            const meta = await drive.files.get({ fileId: driveId, fields: 'mimeType, name, size' })
            const mimeType = meta.data.mimeType
            const size = parseInt(meta.data.size || '0')

            // Limit increased to 1000MB
            const MAX_SIZE_MB = 1000
            if (size > MAX_SIZE_MB * 1024 * 1024) {
                return NextResponse.json({
                    error: `El archivo (${(size / 1024 / 1024).toFixed(1)}MB) excede el límite de procesamiento.`
                }, { status: 400 })
            }

            if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
                console.log(`[Analyze] Detected Media: ${mimeType}. Starting Async Upload...`)
                const { downloadDriveFile } = require('@/lib/drive')
                const { GeminiService } = require('@/lib/gemini')
                const { IdGeneratorService } = require('@/lib/id-generator')
                const prisma = require('@/lib/prisma').default
                const fs = require('fs')

                // A. Download to Temp
                const localFile = await downloadDriveFile(driveId)

                try {
                    // B. Upload to Gemini
                    const upload = await GeminiService.uploadMedia(localFile.path, localFile.mimeType)

                    // C. Create Async Record
                    const newId = await IdGeneratorService.generateId('VIDEO')

                    const contentItem = await prisma.contentItem.create({
                        data: {
                            id: newId,
                            title: localFile.originalName || 'Video en Proceso',
                            type: 'Video',
                            version: '1.0',
                            status: 'PROCESANDO_VIDEO',
                            driveId: driveId,
                            geminiUri: upload.uri,
                            geminiName: upload.name
                        }
                    })

                    console.log(`[Analyze] Async Video Started. ID: ${newId}`)

                    return NextResponse.json({
                        success: true,
                        async: true,
                        contentId: newId,
                        message: "El video se está procesando. Esto puede tomar unos minutos."
                    })

                } finally {
                    if (fs.existsSync(localFile.path)) fs.unlinkSync(localFile.path)
                }
            } else {
                text = await getFileContent(driveId)
            }
        }

        // ... (URL handling) ...
        if (url) {
            let targetUrl = url.trim()
            if (!/^https?:\/\//i.test(targetUrl)) {
                targetUrl = 'https://' + targetUrl
            }

            console.log(`[Analyze] Analyzing URL: ${targetUrl}`)
            try {
                const res = await fetch(targetUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0...' }
                })
                if (!res.ok) throw new Error(`Status: ${res.status}`)
                const html = await res.text()
                text = html.replace(/<[^>]*>/g, ' ').substring(0, 30000)
                text = `[CONTENT FROM URL: ${targetUrl}]\n\n` + text
            } catch (e) {
                console.warn('URL Fetch failed', e)
                text = `[URL_ACCESS_FAILED] ${targetUrl}\nTry to analyze based on knowledge.`
            }
        }

        // --- CONTEXT --
        let promptContext = ''
        if (type === 'Investigación') {
            promptContext = `MODO: ANÁLISIS DE FUENTE ACADÉMICA...`
        }

        // 2. Analyze
        console.log(`[Analyze] Sending content to Gemini...`)
        const { GeminiService } = await import('@/lib/gemini')
        const metadata = await GeminiService.analyzeContent(text, promptContext)

        if (transcription) metadata.transcription = transcription

        let suggestedId = null
        if (metadata?.type) {
            const { IdGeneratorService } = require('@/lib/id-generator')
            suggestedId = await IdGeneratorService.generateId(metadata.type)
        }

        return NextResponse.json({ success: true, data: metadata, suggestedId })

    } catch (error: any) {
        console.error('Analysis API Error:', error)
        return NextResponse.json({
            error: error?.message || String(error)
        }, { status: 500 })
    }
}
