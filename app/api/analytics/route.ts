import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const [totalItems, statusGroup, pillarGroup, recentItems] = await Promise.all([
            prisma.contentItem.count(),
            prisma.contentItem.groupBy({
                by: ['status'],
                _count: { status: true }
            }),
            prisma.contentItem.groupBy({
                by: ['primaryPillar'] as any,
                _count: { primaryPillar: true } as any
            }) as any,
            prisma.contentItem.findMany({
                take: 5,
                orderBy: { updatedAt: 'desc' },
                select: { id: true, title: true, status: true, updatedAt: true, primaryPillar: true } as any
            }) as any
        ])

        // Process Status for Charts
        const statusData = statusGroup.map(g => ({
            name: g.status,
            value: g._count.status
        }))

        // Process Pillars for Charts
        const pillarData = (pillarGroup as any[]).map(g => ({
            name: g.primaryPillar,
            value: g._count.primaryPillar
        }))

        // Calculate Validation Percentage
        const validatedCount = statusGroup.find(g => g.status === 'Validado')?._count.status || 0
        const validationRate = totalItems > 0 ? Math.round((validatedCount / totalItems) * 100) : 0

        return NextResponse.json({
            metrics: {
                total: totalItems,
                validationRate
            },
            charts: {
                status: statusData,
                pillars: pillarData
            },
            recent: recentItems
        })

    } catch (error) {
        console.error('Analytics API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
}
