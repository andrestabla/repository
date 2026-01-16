
import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SystemSettingsService } from '@/lib/settings'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { text } = await req.json()
        if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 })

        const apiKey = await SystemSettingsService.getFlikiApiKey()
        if (!apiKey) return NextResponse.json({ error: 'Fliki API Key not configured' }, { status: 503 })

        // Retrieve voice list to pick a default if needed, or just send text. 
        // According to docs, we need content. VoiceId might be optional or have a default.
        // We will try sending just content first.

        // Using the endpoint found in search.
        const response = await fetch('https://api.fliki.ai/v1/generate/text-to-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                content: text,
                // voiceId: '...' // Optional? Let's hope so or use a generic one if known.
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Fliki API Error:', errorText)
            return NextResponse.json({ error: `Fliki API Error: ${response.statusText}`, details: errorText }, { status: response.status })
        }

        const data = await response.json()
        // Response should contain audio_url based on search results.

        return NextResponse.json(data)

    } catch (error: any) {
        console.error('Audio generation error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
