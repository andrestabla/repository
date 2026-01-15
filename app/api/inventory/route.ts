import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const pillar = searchParams.get('pillar')

    const where: any = {}
    if (pillar) {
        where.OR = [
            { primaryPillar: pillar },
            { secondaryPillars: { has: pillar } }
        ]
    }

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

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role

    if (role !== 'admin' && role !== 'metodologo') {
        return NextResponse.json({ error: 'Unauthorized. Only Admin or Metodologo can delete assets.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'Missing asset ID' }, { status: 400 })
    }

    try {
        await prisma.contentItem.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
