import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function isAdmin() {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    return role === 'admin'
}

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 300

function parseLimit(raw: string | null) {
    if (!raw) return DEFAULT_LIMIT
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT
    return Math.min(parsed, MAX_LIMIT)
}

function parseUserEmail(raw: string | null) {
    if (!raw || raw === 'all') return undefined
    return raw
}

export async function GET(req: NextRequest) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const { searchParams } = new URL(req.url)
        const userEmail = parseUserEmail(searchParams.get('userEmail'))
        const limit = parseLimit(searchParams.get('limit'))

        const logs = await prisma.systemLog.findMany({
            where: userEmail ? { userEmail } : undefined,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        })
        return NextResponse.json(logs, {
            headers: {
                'Cache-Control': 'no-store'
            }
        })
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
