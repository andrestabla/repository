import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const POLL_INTERVAL_MS = 2000
const HEARTBEAT_INTERVAL_MS = 15000
const MAX_BATCH_SIZE = 100

async function isAdmin() {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    return role === 'admin'
}

function parseUserEmail(raw: string | null) {
    if (!raw || raw === 'all') return undefined
    return raw
}

function parseSinceId(raw: string | null) {
    if (!raw) return 0
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed) || parsed < 0) return 0
    return parsed
}

function toSseEvent(event: string, data: unknown) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(req: NextRequest) {
    if (!await isAdmin()) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    const { searchParams } = new URL(req.url)
    const userEmail = parseUserEmail(searchParams.get('userEmail'))
    let lastSeenId = parseSinceId(searchParams.get('sinceId'))

    const encoder = new TextEncoder()
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null
    let closed = false

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const close = () => {
                if (closed) return
                closed = true
                if (pollTimer) clearInterval(pollTimer)
                if (heartbeatTimer) clearInterval(heartbeatTimer)
                try {
                    controller.close()
                } catch {
                    // Controller can already be closed; no action needed.
                }
            }

            const sendEvent = (event: string, data: unknown) => {
                if (closed) return
                controller.enqueue(encoder.encode(toSseEvent(event, data)))
            }

            const sendHeartbeat = () => {
                if (closed) return
                controller.enqueue(encoder.encode(': heartbeat\n\n'))
            }

            const poll = async () => {
                if (closed) return
                try {
                    const logs = await prisma.systemLog.findMany({
                        where: {
                            ...(userEmail ? { userEmail } : {}),
                            ...(lastSeenId > 0 ? { id: { gt: lastSeenId } } : {})
                        },
                        orderBy: { id: 'asc' },
                        take: MAX_BATCH_SIZE,
                        include: {
                            user: {
                                select: { name: true, email: true }
                            }
                        }
                    })

                    if (logs.length === 0) return
                    lastSeenId = logs[logs.length - 1].id
                    sendEvent('logs', logs)
                } catch {
                    sendEvent('error', { message: 'No se pudieron obtener logs en tiempo real.' })
                }
            }

            sendEvent('connected', {
                ok: true,
                filter: userEmail ?? 'all',
                sinceId: lastSeenId
            })

            void poll()
            pollTimer = setInterval(() => { void poll() }, POLL_INTERVAL_MS)
            heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
            req.signal.addEventListener('abort', close, { once: true })
        },
        cancel() {
            closed = true
            if (pollTimer) clearInterval(pollTimer)
            if (heartbeatTimer) clearInterval(heartbeatTimer)
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    })
}
