
import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SystemSettingsService } from '@/lib/settings'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { text, voice } = await req.json()
        if (!text) {
            return NextResponse.json({ error: 'Text content is required' }, { status: 400 })
        }

        const apiKey = await SystemSettingsService.getOpenAIApiKey()
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 500 })
        }

        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'tts-1',
                input: text,
                voice: voice || 'alloy', // Support dynamic voice, default to alloy
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            console.error('OpenAI TTS Error:', error)
            return NextResponse.json({ error: error.error?.message || 'Error generating audio' }, { status: response.status })
        }

        // Return the binary audio stream
        const audioBuffer = await response.arrayBuffer()

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.byteLength.toString(),
            }
        })

    } catch (error: any) {
        console.error('Audio Generation Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
