
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

        // 1. Get Text Content
        console.log(`[Analyze] Fetching text for ${driveId}...`)
        const text = await getFileContent(driveId)

        if (!text) {
            return NextResponse.json({ error: 'No text content found in file' }, { status: 404 })
        }

        // 2. Analyze with Gemini
        console.log(`[Analyze] Sending ${text.length} chars to Gemini...`)
        const metadata = await GeminiService.analyzeContent(text)

        return NextResponse.json({ success: true, data: metadata })

    } catch (error: any) {
        console.error('Analysis API Error:', error)
        const msg = String(error?.message || error)

        if (msg.includes('GEMINI_API_KEY')) {
            return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 })
        }

        return NextResponse.json({ error: 'Failed to analyze content' }, { status: 500 })
    }
}
