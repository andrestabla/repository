
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Helper to extract Drive ID
function extractDriveId(url: string): string | null {
    const regex = /[-\w]{25,}/;
    const match = url.match(regex);
    return match ? match[0] : null;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')

        const whereClause: any = {}
        if (type) whereClause.type = type

        const products = await prisma.strategicProduct.findMany({
            where: whereClause,
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json(products)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { title, description, type, driveLink, category, tags, pillar } = body

        // Auto-extract Drive ID if not provided but link is
        const driveId = extractDriveId(driveLink)

        const newProduct = await prisma.strategicProduct.create({
            data: {
                title,
                description,
                type,
                driveLink,
                driveId,
                category,
                tags: tags || [],
                pillar
            }
        })

        return NextResponse.json(newProduct)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
