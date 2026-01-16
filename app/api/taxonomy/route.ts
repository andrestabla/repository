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
        // 1. Define Base Pillars (Level 1)
        const basePillars = ['Shine In', 'Shine Out', 'Shine Up', 'Shine On']
        let stats = { added: 0, exist: 0 }

        // Ensure Level 1 Exists
        for (const name of basePillars) {
            let pillar = await prisma.taxonomy.findFirst({ where: { name, type: 'Pillar' } })
            if (!pillar) {
                await prisma.taxonomy.create({ data: { name, type: 'Pillar', order: 0 } })
                stats.added++
            }
        }

        // 2. Fetch all ContentItems to Map Hierarchy
        const items = await prisma.contentItem.findMany({
            select: { primaryPillar: true, sub: true, competence: true, behavior: true },
            where: {
                primaryPillar: { in: basePillars } // Only sync valid pillars
            }
        })

        // Helper to find/create node
        const syncNode = async (name: string, type: string, parentId: string | null, order: number) => {
            if (!name) return null
            let node = await prisma.taxonomy.findFirst({
                where: { name, type, parentId }
            })
            if (!node) {
                node = await prisma.taxonomy.create({
                    data: { name, type, parentId, order }
                })
                stats.added++
            } else {
                stats.exist++
            }
            return node
        }

        for (const item of items) {
            // Level 1: Pillar
            const pillar = await prisma.taxonomy.findFirst({ where: { name: item.primaryPillar, type: 'Pillar' } })
            if (!pillar) continue

            // Level 2: Subcomponent (from 'sub')
            if (item.sub) {
                const subNode = await syncNode(item.sub, 'Subcomponent', pillar.id, 1)

                // Level 3: Competence (from 'competence')
                // Only if sub exists
                if (subNode && item.competence) {
                    const compNode = await syncNode(item.competence, 'Competence', subNode.id, 2)

                    // Level 4: Behavior (from 'behavior')
                    // Only if competence exists
                    if (compNode && item.behavior) {
                        await syncNode(item.behavior, 'Behavior', compNode.id, 3)
                    }
                }
            }
        }

        return NextResponse.json({ success: true, stats })

    } catch (error: any) {
        console.error('[Taxonomy Sync Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
