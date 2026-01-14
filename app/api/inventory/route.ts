import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const pillar = searchParams.get('pillar')

    const where: any = {}
    if (pillar) where.pillar = pillar

    try {
        const items = await prisma.contentItem.findMany({
            where,
            orderBy: { id: 'asc' },
        })
        return NextResponse.json(items)
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
