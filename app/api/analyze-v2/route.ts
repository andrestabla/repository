import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const maxDuration = 300

export async function GET() {
    return NextResponse.json({ status: 'Analyze V2 [AUTH CHECK] Online' })
}

export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check - ISOLATION TEST
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Mock reading request body to prevent "uncaught" issues if body is stream
        try { await request.json() } catch (e) { }

        return NextResponse.json({
            success: true,
            message: 'Analyze V2 [AUTH PASSED] is working. Next step: Re-enable heavy libs.',
            user: session.user?.email
        })
    } catch (e: any) {
        console.error("Auth Crash:", e)
        return NextResponse.json({ error: `Auth Crash: ${e.message}` }, { status: 500 })
    }
}
