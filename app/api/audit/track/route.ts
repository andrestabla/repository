import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createLog } from '@/lib/audit'

function sanitizeAction(value: unknown) {
    if (typeof value !== 'string' || !value.trim()) return 'USER_EVENT'
    return value.trim().toUpperCase().slice(0, 64)
}

function sanitizeText(value: unknown, max = 1000) {
    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    if (!trimmed) return undefined
    return trimmed.slice(0, max)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email

    if (!email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json().catch(() => ({}))
        const action = sanitizeAction(body?.action)
        const details = sanitizeText(body?.details)
        const resourceId = sanitizeText(body?.resourceId, 191)

        await createLog(action, email, details, resourceId)
        return NextResponse.json({ ok: true })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
