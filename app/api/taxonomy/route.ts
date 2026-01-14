import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, type, parentId, order } = body

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and Type are required' }, { status: 400 })
        }

        const node = await prisma.taxonomy.create({
            data: {
                name,
                type,
                parentId: parentId || null,
                order: order || 0
            }
        })

        return NextResponse.json(node)
    } catch (error: any) {
        console.error('[Taxonomy API Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const { id, name, active, order } = body

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        const node = await prisma.taxonomy.update({
            where: { id },
            data: {
                name,
                active,
                order
            }
        })

        return NextResponse.json(node)
    } catch (error: any) {
        console.error('[Taxonomy API Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
