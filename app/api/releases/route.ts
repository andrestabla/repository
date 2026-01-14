import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const releases = await prisma.methodologyRelease.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { contents: true } } }
        })
        return NextResponse.json(releases)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { tag, description } = await req.json()
        if (!tag) return NextResponse.json({ error: 'Tag is required' }, { status: 400 })

        const release = await prisma.methodologyRelease.create({
            data: {
                tag,
                description,
                status: 'Draft'
            }
        })
        return NextResponse.json(release)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, status, tag, description } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const release = await prisma.methodologyRelease.update({
            where: { id },
            data: { status, tag, description }
        })
        return NextResponse.json(release)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
