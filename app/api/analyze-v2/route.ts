import { NextRequest, NextResponse } from 'next/server'
import { getFileContent } from '@/lib/drive'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const maxDuration = 300 // 5 minutes

export async function GET() {
    return NextResponse.json({ status: 'Analyze V2 Online' })
}

export async function POST(request: NextRequest) {
    // 1. Critical: Auth Check (Fast fail)
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } catch (e) {
        console.error("Auth Error:", e)
        return NextResponse.json({ error: 'Auth Failed' }, { status: 500 })
    }

    try {
        const { driveId, url, type } = await request.json()

        if (!driveId && !url) {
            return NextResponse.json({ error: 'Drive ID or URL required' }, { status: 400 })
        }

        console.log(`[Analyze V2] Request received for ${driveId || url}. Loading Dynamic Modules...`)

        // 2. Dynamic Imports (Prevent Cold Start 405s)
        const { google } = require('googleapis')
        const { SystemSettingsService } = require('@/lib/settings')
        const { GeminiService } = require('@/lib/gemini') // Heavy module
        const { downloadDriveFile } = require('@/lib/drive')
        const fs = require('fs')

        console.log(`[Analyze V2] Modules Loaded. Fetching config...`)
        const config = await SystemSettingsService.getDriveConfig()
        const credentials = JSON.parse(config.serviceAccountJson)
        const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive'] })

        let text = ''
        let transcription = null

        if (driveId) {
            const drive = google.drive({ version: 'v3', auth })
            const meta = await drive.files.get({ fileId: driveId, fields: 'mimeType, name, size' })
            const mimeType = meta.data.mimeType
            const size = parseInt(meta.data.size || '0')

            // Limit: 1000MB
            const MAX_SIZE_MB = 1000
            if (size > MAX_SIZE_MB * 1024 * 1024) {
                return NextResponse.json({
                    error: `El archivo (${(size / 1024 / 1024).toFixed(1)}MB) excede el límite de procesamiento (${MAX_SIZE_MB}MB).`
                }, { status: 400 })
            }

            if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
                console.log(`[Analyze V2] Media Detected (${mimeType}). Downloading...`)

                // A. Download
                const localFile = await downloadDriveFile(driveId)
                try {
                    console.log(`[Analyze V2] Sending to Gemini for Transcription...`)
                    transcription = await GeminiService.transcribeMedia(localFile.path, localFile.mimeType)
                    text = `[TRANSCRIPTION OF VIDEO/AUDIO: ${localFile.originalName}]\n\n${transcription}`
                } finally {
                    if (fs.existsSync(localFile.path)) fs.unlinkSync(localFile.path)
                }
            } else {
                text = await getFileContent(driveId)
            }
        }

        // ... URL Handling (Simplified)
        if (url) {
            // (Keeping URL logic simple/standard)
            let targetUrl = url.trim()
            if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl

            try {
                const res = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
                if (!res.ok) throw new Error(`Status: ${res.status}`)
                const html = await res.text()
                text = `[CONTENT FROM URL: ${targetUrl}]\n\n` + html.replace(/<[^>]*>/g, ' ').substring(0, 30000)
            } catch (e) {
                text = `[URL Error] Could not fetch ${targetUrl}. Proceeding with general knowledge.`
            }
        }

        // --- CONTEXT ---
        let promptContext = ''
        if (type === 'Investigación') {
            promptContext = `MODO: ANÁLISIS DE FUENTE ACADÉMICA / INVESTIGACIÓN... (Standard prompt)`
        }

        // 3. Analyze
        console.log(`[Analyze V2] Analyzing ${text.length} chars...`)
        const metadata = await GeminiService.analyzeContent(text, promptContext)

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
        console.error('[Analyze V2 Error]', error)
        const msg = error?.message || String(error)
        return NextResponse.json({
            error: msg.includes('GEMINI_API_KEY') ? 'Gemini API Key not configured' : msg
        }, { status: 500 })
    }
}
