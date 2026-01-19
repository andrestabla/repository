import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PUBLIC_ACCESS_TOKEN = 'temporary_public_access'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (token !== PUBLIC_ACCESS_TOKEN) {
        return NextResponse.json({ error: 'Unauthorized access. Please provide a valid token.' }, { status: 401 })
    }

    try {
        const items = await prisma.contentItem.findMany({
            orderBy: { id: 'asc' },
        })
        return NextResponse.json(items)
    } catch (error) {
        console.error('Public API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
    }
}
