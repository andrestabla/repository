
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const versions = await prisma.strategicProductVersion.findMany({
            where: { productId: id },
            orderBy: { versionNumber: 'desc' }
        })
        return NextResponse.json(versions)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const body = await request.json()

    try {
        // Find existing versions to determine next number
        const lastVersion = await prisma.strategicProductVersion.findFirst({
            where: { productId: id },
            orderBy: { versionNumber: 'desc' }
        })

        const nextNumber = (lastVersion?.versionNumber || 0) + 1

        const version = await prisma.strategicProductVersion.create({
            data: {
                versionNumber: nextNumber,
                driveLink: body.driveLink,
                driveId: body.driveId || null,
                embedCode: body.embedCode || null,
                notes: body.notes || null,
                productId: id
            }
        })

        return NextResponse.json(version)
    } catch (error) {
        console.error('Create Version Error:', error)
        return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
    }
}
