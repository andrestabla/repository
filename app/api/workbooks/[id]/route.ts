import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/workbooks/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const workbook = await prisma.workbook.findFirst({
            where: {
                OR: [
                    { id },
                    { slug: id }
                ]
            }
        })

        if (!workbook) {
            return NextResponse.json({ error: 'Workbook not found' }, { status: 404 })
        }

        return NextResponse.json(workbook)
    } catch (error) {
        console.error('Error fetching workbook:', error)
        return NextResponse.json({ error: 'Failed to fetch workbook' }, { status: 500 })
    }
}

// PUT /api/workbooks/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()

        // Allowed fields to update
        const { title, description, metadata, status, content, type } = body

        // Find the workbook first to get its ID if slug was provided
        const existing = await prisma.workbook.findFirst({
            where: {
                OR: [{ id }, { slug: id }]
            }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Workbook not found' }, { status: 404 })
        }

        const workbook = await prisma.workbook.update({
            where: { id: existing.id },
            data: {
                title,
                description,
                metadata, // JSON update
                status,
                content,
                type
            } as any
        })

        return NextResponse.json(workbook)
    } catch (error) {
        console.error('Error updating workbook:', error)
        return NextResponse.json({ error: 'Failed to update workbook' }, { status: 500 })
    }
}

// DELETE /api/workbooks/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const existing = await prisma.workbook.findFirst({
            where: {
                OR: [{ id }, { slug: id }]
            }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Workbook not found' }, { status: 404 })
        }

        await prisma.workbook.delete({
            where: { id: existing.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting workbook:', error)
        return NextResponse.json({ error: 'Failed to delete workbook' }, { status: 500 })
    }
}
