import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    return NextResponse.json({ message: 'POST works!' })
}

export async function GET(request: NextRequest) {
    return NextResponse.json({ message: 'GET works!' })
}
