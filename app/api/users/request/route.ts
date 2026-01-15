import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendAccessRequestEmail } from '@/lib/mail'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    try {
        const email = session.user.email
        const name = session.user.name || 'Solicitante'

        // Check if already exists
        const existing = await prisma.user.findUnique({ where: { email } })

        if (existing) {
            return NextResponse.json({ message: 'User already exists', role: existing.role })
        }

        // Create as pending (inactive)
        await prisma.user.create({
            data: {
                email,
                name,
                role: 'CURADOR',
                isActive: false
            }
        })

        // Notify Admin
        await sendAccessRequestEmail(email, name)

        return NextResponse.json({ success: true, message: 'Solicitud enviada. Esperando aprobación del administrador.' })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Error requesting access' }, { status: 500 })
    }
}
