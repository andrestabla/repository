import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { backfillMissingUserAuditLogs } from '@/lib/audit'

async function isAdmin() {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    return role === 'admin'
}

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

function parseLimit(raw: string | null) {
    if (!raw) return DEFAULT_LIMIT
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT
    return Math.min(parsed, MAX_LIMIT)
}

function parseBeforeId(raw: string | null) {
    if (!raw) return undefined
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined
    return parsed
}

function parseUserEmail(raw: string | null) {
    if (!raw || raw === 'all') return undefined
    return raw
}

export async function GET(req: NextRequest) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const backfilled = await backfillMissingUserAuditLogs()
        const { searchParams } = new URL(req.url)
        const userEmail = parseUserEmail(searchParams.get('userEmail'))
        const limit = parseLimit(searchParams.get('limit'))
        const beforeId = parseBeforeId(searchParams.get('beforeId'))

        const where = {
            ...(userEmail ? { userEmail } : {}),
            ...(beforeId ? { id: { lt: beforeId } } : {})
        }

        const logs = await prisma.systemLog.findMany({
            where,
            orderBy: { id: 'desc' },
            take: limit + 1,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        })

        const hasMore = logs.length > limit
        const pageLogs = hasMore ? logs.slice(0, limit) : logs
        const nextBeforeId = hasMore ? pageLogs[pageLogs.length - 1].id : null

        return NextResponse.json({
            logs: pageLogs,
            hasMore,
            nextBeforeId
        }, {
            headers: {
                'Cache-Control': 'no-store',
                'X-Audit-Backfilled-Users': String(backfilled)
            }
        })
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
