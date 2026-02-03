
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { DriveUtils } from '@/lib/google'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { title, description, type, driveLink, embedCode, category, tags, pillar } = body

        // Re-extract drive ID if link changed
        const driveId = DriveUtils.extractId(driveLink)

        const updatedProduct = await prisma.strategicProduct.update({
            where: { id },
            data: {
                title,
                description,
                type,
                driveLink,
                driveId,
                embedCode,
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
