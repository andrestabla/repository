
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const items = await prisma.contentItem.findMany({
            orderBy: { id: 'asc' },
        })
        return NextResponse.json(items)
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
