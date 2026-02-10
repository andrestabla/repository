import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/workbooks
export async function GET(request: Request) {
    try {
        const workbooks = await prisma.workbook.findMany({
            orderBy: { updatedAt: 'desc' }
        })
        return NextResponse.json(workbooks)
    } catch (error) {
        console.error('Error fetching workbooks:', error)
        return NextResponse.json({ error: 'Failed to fetch workbooks' }, { status: 500 })
    }
}

// POST /api/workbooks
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { title, description, driveId, type, metadata } = body

        // Generate a unique slug
        const slug = (title || 'workbook')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 7)

        // Create the workbook
        const workbook = await prisma.workbook.create({
            data: {
                title,
                description,
                driveId,
                type,
                slug,
                status: 'Borrador',
                metadata: metadata || {
                    objectives: [],
                    audience: '',
                    duration: '',
                    difficulty: 'Básico',
                    prerequisites: '',
                    takeaways: []
                }
            } as any
        })

        // TODO: Trigger async AI analysis if driveId is present

        return NextResponse.json(workbook)
    } catch (error) {
        console.error('Error creating workbook:', error)
        return NextResponse.json({ error: 'Failed to create workbook' }, { status: 500 })
    }
}
