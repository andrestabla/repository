import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        // For now we return all history, later filter by user if needed
        // Assuming 'anonymous' or user email was stored

        const history = await prisma.generationHistory.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        })

        return NextResponse.json(history)
    } catch (error) {
        console.error('Error fetching history:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
