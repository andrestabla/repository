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
        const { email, role, name, isActive } = body

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        // Sync with uppercase Enum
        const formattedRole = role ? role.toUpperCase() : undefined

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role: formattedRole as any,
                name,
                isActive: isActive !== undefined ? isActive : undefined
            },
            create: {
                email,
                role: formattedRole as any || 'CURADOR',
                name,
                isActive: isActive !== undefined ? isActive : true
            }
        })
        return NextResponse.json(user)
    } catch (e) {
        console.error('User creation error:', e)
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    try {
        const body = await req.json()
        const { email, role, isActive, name } = body

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        // Safety: Cannot deactivate super admin
        if (email === 'andrestablarico@gmail.com' && isActive === false) {
            return NextResponse.json({ error: 'Cannot deactivate super admin' }, { status: 403 })
        }

        const formattedRole = role ? role.toUpperCase() : undefined

        const user = await prisma.user.update({
            where: { email },
            data: {
                role: formattedRole as any,
                isActive,
                name
            }
        })
        return NextResponse.json(user)
    } catch (e) {
        console.error('User update error:', e)
        return NextResponse.json({ error: 'Error updating user' }, { status: 500 })
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
