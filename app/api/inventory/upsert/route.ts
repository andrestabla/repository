import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, title, type, pillar, sub, level, version, status, ip, completeness, driveId } = body

        if (!id || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const item = await prisma.contentItem.upsert({
            where: { id },
            update: { title, type, pillar, sub, level, version, status, ip, completeness, driveId },
            create: { id, title, type, pillar, sub, level, version: version || 'v1.0', status, ip, completeness, driveId },
        })

        return NextResponse.json(item)
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
