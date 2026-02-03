
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Helper to extract Drive ID
function extractDriveId(url: string): string | null {
    const regex = /[-\w]{25,}/;
    const match = url.match(regex);
    return match ? match[0] : null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { title, description, type, driveLink, category, tags, pillar } = body

        // Re-extract drive ID if link changed
        const driveId = extractDriveId(driveLink)

        const updatedProduct = await prisma.strategicProduct.update({
            where: { id },
            data: {
                title,
                description,
                type,
                driveLink,
                driveId,
                category,
                tags,
                pillar
            }
        })

        return NextResponse.json(updatedProduct)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await prisma.strategicProduct.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
