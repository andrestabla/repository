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

export async function PUT(req: Request) {
    try {
        // 1. Define Base Pillars
        const basePillars = ['Shine In', 'Shine Out', 'Shine Up', 'Shine On']
        let stats = { added: 0, exist: 0 }

        // 2. Ensure Base Pillars Exist
        for (const name of basePillars) {
            const exists = await prisma.taxonomy.findFirst({
                where: { name, type: 'Pillar' }
            })

            if (!exists) {
                await prisma.taxonomy.create({
                    data: { name, type: 'Pillar', order: 0 }
                })
                stats.added++
            } else {
                stats.exist++
            }
        }

        // 3. Scan ContentItems for used pillars (Auto-Discovery)
        const contentPillars = await prisma.contentItem.findMany({
            select: { primaryPillar: true },
            distinct: ['primaryPillar']
        })

        for (const item of contentPillars) {
            if (item.primaryPillar && !basePillars.includes(item.primaryPillar)) {
                // Check if it exists in Taxonomy
                const exists = await prisma.taxonomy.findFirst({
                    where: { name: item.primaryPillar, type: 'Pillar' }
                })

                if (!exists) {
                    await prisma.taxonomy.create({
                        data: { name: item.primaryPillar, type: 'Pillar', order: 99 } // Default to end
                    })
                    stats.added++
                }
            }
        }

        return NextResponse.json({ success: true, stats })

    } catch (error: any) {
        console.error('[Taxonomy Sync Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
