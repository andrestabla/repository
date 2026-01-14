import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Determine target version (e.g. v1.0)
        const version = 'v1.0'

        // Fetch all items for this version
        const items = await prisma.contentItem.findMany({
            where: { version } // or generally everything if version isn't strict constraint yet
        })

        // Aggregation Logic (Mocking real complex group-by for now or doing simple JS reduce)
        // Structure: { [Pillar]: { [Sub]: { [Level]: Status } } }
        // Ideally we fetch Taxonomy first to know what's missing

        // For now, return basic stats
        const total = items.length
        const approved = items.filter(i => i.status === 'Approved').length
        const coverage = total > 0 ? Math.round((approved / total) * 100) : 0

        return NextResponse.json({
            meta: { version, generatedAt: new Date() },
            stats: { total, approved, coverage },
            // Grouping by pillar for easier frontend consumption if needed
            items
        })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
