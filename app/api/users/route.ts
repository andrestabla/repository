import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function isAdmin() {
    const session = await getServerSession(authOptions)
    // Cast to any to access custom role explicitly
    const role = (session?.user as any)?.role
    return role === 'admin'
}

export async function GET() {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(users)
}

export async function POST(req: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    try {
        const body = await req.json()
        const { email, role, name } = body

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        const user = await prisma.user.upsert({
            where: { email },
            update: { role, name },
            create: { email, role, name }
        })
        return NextResponse.json(user)
    } catch (e) {
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
        if (email === 'andrestablarico@gmail.com') return NextResponse.json({ error: 'Cannot delete super admin' }, { status: 403 })

        await prisma.user.delete({ where: { email } })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Error deleting user' }, { status: 500 })
    }
}
