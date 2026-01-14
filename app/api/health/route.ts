import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const count = await prisma.contentItem.count()
        return NextResponse.json({ status: 'ok', database: 'connected', items: count })
    } catch (error) {
        return NextResponse.json({ status: 'error', database: 'disconnected', error: String(error) }, { status: 500 })
    }
}
