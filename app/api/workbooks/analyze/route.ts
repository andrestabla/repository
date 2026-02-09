
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getFileContent } from '@/lib/drive'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
    // Auth Check
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { driveId, text: manualText, workbookType } = body

        if (!driveId && !manualText) {
            return NextResponse.json({ error: 'Drive ID or Text required' }, { status: 400 })
        }

        console.log(`[Workbook Analyze] Processing type: ${workbookType || 'General'}...`)

        let textToAnalyze = ''

        if (driveId) {
            const { google } = require('googleapis')
            const { SystemSettingsService } = require('@/lib/settings')
            const config = await SystemSettingsService.getDriveConfig()
            const credentials = JSON.parse(config.serviceAccountJson)
            const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive'] })

            // Reuse getFileContent if possible, or simple fetch
            // But we need to handle PDF/Docs. getFileContent in lib/drive handles exports.
            try {
                textToAnalyze = await getFileContent(driveId)
            } catch (e: any) {
                console.error("Error fetching drive content", e)
                return NextResponse.json({ error: `Eror leyendo Drive: ${e.message}` }, { status: 500 })
            }
        } else {
            textToAnalyze = manualText
        }

        // Analyze
        // Use OpenAI as requested
        const { OpenAIService } = await import('@/lib/openai')
        const analysis = await OpenAIService.analyzeWorkbook(textToAnalyze, workbookType)

        return NextResponse.json({ success: true, data: analysis })

    } catch (error: any) {
        console.error('[Workbook Analyze Error]', error)
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
    }
}
