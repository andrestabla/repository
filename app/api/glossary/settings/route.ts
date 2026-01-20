import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'glossary_ai_instructions' }
        })
        return NextResponse.json({ instructions: setting ? (setting.value as any).text : '' })
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { instructions } = await request.json()
        await prisma.systemSettings.upsert({
            where: { key: 'glossary_ai_instructions' },
            create: {
                key: 'glossary_ai_instructions',
                value: { text: instructions }
            },
            update: {
                value: { text: instructions }
            }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error saving settings' }, { status: 500 })
    }
}
