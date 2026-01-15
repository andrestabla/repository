import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { id, title, apa, url, summary, keyConcepts, findings, methodology, relation4Shine, pillars, driveId } = body

        // Simple validation
        if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

        const result = await prisma.researchSource.upsert({
            where: { id: id || 'new' }, // 'new' won't match, so it creates. If id present, updates.
            update: {
                title, apa, url, summary,
                keyConcepts, findings, methodology, relation4Shine,
                pillars: pillars || [],
                driveId
            },
            create: {
                title, apa, url, summary,
                keyConcepts, findings, methodology, relation4Shine,
                pillars: pillars || [],
                driveId
            }
        })

        return NextResponse.json({ success: true, data: result })
    } catch (error) {
        console.error('Research Upsert Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
