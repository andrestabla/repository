import { NextRequest, NextResponse } from 'next/server'
import { getFileContent } from '@/lib/drive'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Origin': '*',
        },
    })
}

export async function POST(request: NextRequest) {
    // Auth Check
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { driveId, url, type, transcription: manualTranscription } = await request.json()

        if (!driveId && !url && !manualTranscription) {
            return NextResponse.json({ error: 'Drive ID, URL or Transcription required' }, { status: 400 })
        }

        console.log(`[Analyze] Fetching content for ${driveId || url}...`)

        let text = ''
        let transcription = null

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

            const MAX_SIZE_MB = 1000
            if (size > MAX_SIZE_MB * 1024 * 1024) {
                return NextResponse.json({
                    error: `El archivo supera el límite de ${MAX_SIZE_MB}MB.`
                }, { status: 400 })
            }

            if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
                console.log(`[Analyze] Processing Media: ${mimeType}`)
                const { downloadDriveFile } = require('@/lib/drive')
                const { GeminiService } = require('@/lib/gemini')
                const fs = require('fs')

                const localFile = await downloadDriveFile(driveId)
                try {
                    // Synchronous Transcribe
                    transcription = await GeminiService.transcribeMedia(localFile.path, localFile.mimeType)
                    text = `[TRANSCRIPTION OF VIDEO/AUDIO: ${localFile.originalName}]\n\n${transcription}`
                } finally {
                    if (fs.existsSync(localFile.path)) fs.unlinkSync(localFile.path)
                }
            } else if (mimeType.startsWith('image/')) {
                console.log(`[Analyze] Processing Image: ${mimeType}`)
                const { downloadDriveFile } = require('@/lib/drive')
                const { GeminiService } = require('@/lib/gemini')
                const fs = require('fs')

                const localFile = await downloadDriveFile(driveId)
                try {
                    // Analyze image with Gemini Vision
                    const metadata = await GeminiService.analyzeImage(localFile.path, localFile.mimeType, type === 'Investigación' ? `MODO: ANÁLISIS DE FUENTE ACADÉMICA / INVESTIGACIÓN... (Completa 4Shine info)` : '')

                    let suggestedId = null
                    if (metadata?.type) {
                        const { IdGeneratorService } = require('@/lib/id-generator')
                        suggestedId = await IdGeneratorService.generateId(metadata.type)
                    }

                    return NextResponse.json({ success: true, data: metadata, suggestedId })
                } finally {
                    if (fs.existsSync(localFile.path)) fs.unlinkSync(localFile.path)
                }
            } else {
                text = await getFileContent(driveId)
            }
        }

        if (url) {
            let targetUrl = url.trim()
            if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl
            console.log(`[Analyze] Analyzing URL: ${targetUrl}`)

            try {
                const res = await fetch(targetUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0...' }
                })
                if (!res.ok) throw new Error(`Status: ${res.status}`)
                const html = await res.text()
                text = `[CONTENT FROM URL: ${targetUrl}]\n\n` + html.replace(/<[^>]*>/g, ' ').substring(0, 30000)
            } catch (e) {
                text = `[URL_ACCESS_FAILED] ${targetUrl}\nFallback to Knowledge Base.`
            }
        }

        if (manualTranscription) {
            console.log(`[Analyze] Using Manual Transcription`)
            transcription = manualTranscription
            text = `[MANUAL TRANSCRIPTION PROVIDED]\n\n${manualTranscription}`
        }

        // Context
        let promptContext = ''
        if (type === 'Investigación') {
            promptContext = `MODO: ANÁLISIS DE FUENTE ACADÉMICA / INVESTIGACIÓN... (Completa 4Shine info)`
        }

        // Analyze
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
        console.error('[Analyze Error]', error)
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
    }
}
