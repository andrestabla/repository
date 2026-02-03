
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { DriveUtils } from '@/lib/google'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { title, description, type, driveLink, embedCode, category, tags, pillar, isNewVersion } = body

        // If isNewVersion is true, archive current state before updating
        if (isNewVersion) {
            const currentProduct = await prisma.strategicProduct.findUnique({
                where: { id },
                include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
            })

            if (currentProduct) {
                const nextNumber = (currentProduct.versions[0]?.versionNumber || 0) + 1
                await prisma.strategicProductVersion.create({
                    data: {
                        versionNumber: nextNumber,
                        driveLink: currentProduct.driveLink,
                        driveId: currentProduct.driveId,
                        embedCode: currentProduct.embedCode,
                        notes: currentProduct.description,
                        productId: id
                    }
                })
            }
        }

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
        console.error('Update Product Error:', error)
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
