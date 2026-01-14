
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendTestEmail } from '@/lib/mail'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    // Check if user is logged in
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    // @ts-ignore - role is added in session callback
    const isAdmin = session.user.role === 'admin' || session.user.email === 'andrestablarico@gmail.com'

    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { config } = body

        if (!config) {
            return NextResponse.json({ error: 'Missing configuration' }, { status: 400 })
        }

        // Send test email to the current admin user
        await sendTestEmail(session.user.email, config)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Failed to send test email:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
