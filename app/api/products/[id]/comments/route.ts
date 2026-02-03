
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const comments = await prisma.strategicProductComment.findMany({
            where: { productId: id },
            orderBy: { createdAt: 'asc' }
        })
        return NextResponse.json(comments)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const { content } = await request.json()

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 })
        }

        const comment = await prisma.strategicProductComment.create({
            data: {
                content,
                productId: id,
                userEmail: session.user.email,
                userName: session.user.name || session.user.email
            }
        })

        return NextResponse.json(comment)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
