
import { NextRequest, NextResponse } from 'next/server'
import { getFileContent } from '@/lib/drive'
import { GeminiService } from '@/lib/gemini'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    // Auth Check
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { driveId } = await request.json()

        if (!driveId) {
            return NextResponse.json({ error: 'Drive ID required' }, { status: 400 })
        }

        // 1. Get Text or Transcribe Content
        console.log(`[Analyze] Fetching content for ${driveId}...`)

        let text = ''
        let transcription = null

        // Check if file is video or audio
        const { google } = require('googleapis')
        const { SystemSettingsService } = require('@/lib/settings')
        const config = await SystemSettingsService.getDriveConfig()
        const credentials = JSON.parse(config.serviceAccountJson)
        const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive'] })
        if (driveId) {
            // 1. Get Text or Transcribe Content from Drive
            console.log(`[Analyze] Fetching content for ${driveId}...`)

            // Check if file is video or audio
            const { google } = require('googleapis')
            const { SystemSettingsService } = require('@/lib/settings')
            const config = await SystemSettingsService.getDriveConfig()
            const credentials = JSON.parse(config.serviceAccountJson)
            const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive'] })
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

                // B. Transcribe
                try {
                    transcription = await GeminiService.transcribeMedia(localFile.path, localFile.mimeType)
                    text = `[TRANSCRIPTION OF VIDEO/AUDIO: ${localFile.originalName}]\n\n${transcription}`
                } finally {
                    // Cleanup temp file
                    if (fs.existsSync(localFile.path)) fs.unlinkSync(localFile.path)
                }
            } else {
                // Text/Doc file
                text = await getFileContent(driveId)
            }
        }

        // --- NEW: URL HANDLING ---
        // If driveId looks like a URL, treat it as such (or add 'url' param to request body, 
        // but let's see if we can just reuse the field or add a check).
        // For clean architecture, we should support 'url' in body.

        if (url) {
            console.log(`[Analyze] Analyzing URL: ${url}`)
            // Simple fetch for now. For complex pages, we'd need Puppeteer (browser tool) but backend typically uses fetch/cheerio.
            // Or assume user pastes content. 
            // Better: Use Gemini 2.0 Web Search capabilities if available or just fetch HTML text.
            try {
                const res = await fetch(url)
                const html = await res.text()
                // Simple stripping using regex (Cheerio would be better but keeping deps low)
                text = html.replace(/<[^>]*>/g, ' ').substring(0, 30000)
                text = `[CONTENT FROM URL: ${url}]\n\n` + text
            } catch (e) {
                console.error('URL Fetch failed', e)
                return NextResponse.json({ error: 'Could not fetch URL content' }, { status: 400 })
            }
        } else if (!driveId) {
            return NextResponse.json({ error: 'Drive ID or URL required' }, { status: 400 })
        }
        // --- END NEW ---

        if (!text) {
            return NextResponse.json({ error: 'No text content found in file' }, { status: 404 })
        }

        // 2. Analyze with Gemini
        console.log(`[Analyze] Sending ${text.length} chars to Gemini...`)
        const metadata = await GeminiService.analyzeContent(text)

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
