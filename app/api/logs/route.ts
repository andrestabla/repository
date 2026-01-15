import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function isAdmin() {
    const session = await getServerSession(authOptions)
    return (session?.user as any)?.role === 'admin'
}

export async function GET() {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const logs = await prisma.systemLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        })
        return NextResponse.json(logs)
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
