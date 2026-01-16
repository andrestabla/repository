import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({ status: 'Analyze V2 [MINIMAL] Online' })
}

export async function POST(request: NextRequest) {
    return NextResponse.json({
        success: true,
        message: 'Analyze V2 [MINIMAL] is working. Code was stripped to isolate 405 error.'
    })
}
