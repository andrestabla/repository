import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type GapStat = {
    pillar: string
    totalBehaviors: number
    coveredBehaviors: number
    coverage: number
    missing: Array<{
        pillar: string
        sub: string
        competence: string
        behavior: string
    }>
}

export async function GET(request: NextRequest) {
    try {
        console.log('📊 Starting Gap Analysis...')

        // 1. Fetch Full Taxonomy (Flat list is fine for correlation if we filter by types)
        // We rely on the structure: Pillar -> Sub -> Competence -> Behavior
        // But in the DB, Taxonomy is a recursive tree. 
        // A simpler approach given the flat nature of ContentItem metadata:
        // We need the DEFINITION of all Behaviors from the Taxonomy tables.
        // Assuming your Taxonomy table structure is recursive:

        // Fetch all potential Behaviors (Leaf nodes usually, or defined by type 'Conducta'?)
        // If type is not strictly 'Conducta', we might need to assume level 4.
        // Let's inspect the Hierarchy.

        // Alternative: Use the "Seed" source logic if DB taxonomy is complex to traverse strictly.
        // However, `prisma.taxonomy` should be the source of truth.

        // Fetch all taxonomy items to build the tree in memory or filter.
        const allNodes = await prisma.taxonomy.findMany({ where: { active: true } })

        // Build map for quick parent lookup
        const nodeMap = new Map(allNodes.map(n => [n.id, n]))

        // Identify "Behavior" nodes. 
        // If type field exists and is reliable:
        let behaviorNodes = allNodes.filter(n => n.type === 'Conducta' || n.type === 'Behavior')

        // Fallback if types aren't explicitly 'Conducta' (based on level depth or naming?):
        if (behaviorNodes.length === 0) {
            // Heuristic: Leaf nodes (nodes that are not parents to anyone)
            const parentIds = new Set(allNodes.map(n => n.parentId).filter(Boolean))
            behaviorNodes = allNodes.filter(n => !parentIds.has(n.id) && n.parentId)
        }

        // 2. Fetch Inventory
        const inventory = await prisma.contentItem.findMany({
            where: { status: 'Validado' },
            select: { primaryPillar: true, sub: true, competence: true, behavior: true }
        })

        // Create a signature set for existing content: "Pillar|Sub|Competence|Behavior"
        // Normalizing strings to avoid whitespace mismatch
        const coveredSignatures = new Set(inventory.map(i => {
            return `${i.primaryPillar?.trim()}|${i.sub?.trim()}|${i.competence?.trim()}|${i.behavior?.trim()}`.toLowerCase()
        }))

        // 3. Analyze Gaps
        const stats: Record<string, GapStat> = {}
        const globalMissing: GapStat['missing'] = []

        // Helper to trace back hierarchy to find Pillar, Sub, Competence
        const traceHierarchy = (node: any) => {
            let curr = node
            let path = []
            while (curr) {
                path.unshift(curr)
                curr = nodeMap.get(curr.parentId)
            }
            return path
        }

        for (const bNode of behaviorNodes) {
            const path = traceHierarchy(bNode)
            // Expect path: Pillar -> Sub -> Comp -> Behavior
            // Pillars usually top level.

            // Just extracting names for correlation
            if (path.length < 4) continue; // Skip if not full depth?

            const pillarName = path[0].name
            const subName = path[1].name
            const compName = path[2].name
            const behName = path[3].name // should be bNode.name

            // Init Stat Entry
            if (!stats[pillarName]) {
                stats[pillarName] = { pillar: pillarName, totalBehaviors: 0, coveredBehaviors: 0, coverage: 0, missing: [] }
            }

            stats[pillarName].totalBehaviors++

            // Check coverage
            // Note: DB ContentItem stores string values. Taxonomy stores string values. 
            // The match must be reasonably exact.

            const signature = `${pillarName.trim()}|${subName.trim()}|${compName.trim()}|${behName.trim()}`.toLowerCase()

            // Approximate matching if exact signature fails? 
            // For now, loose match on behavior text + pillar might be safer if hierarchy names changed?
            // Let's try full strict match first as per "Strict Taxonomy Sync".

            if (coveredSignatures.has(signature)) {
                stats[pillarName].coveredBehaviors++
            } else {
                // Check if behavior string ALONE matches anything in that pillar (more robust against sub/comp renames)
                const looseMatch = inventory.some(i =>
                    i.primaryPillar?.toLowerCase() === pillarName.toLowerCase() &&
                    i.behavior?.trim().toLowerCase() === behName.trim().toLowerCase()
                )

                if (looseMatch) {
                    stats[pillarName].coveredBehaviors++
                } else {
                    const diff = { pillar: pillarName, sub: subName, competence: compName, behavior: behName }
                    stats[pillarName].missing.push(diff)
                    globalMissing.push(diff)
                }
            }
        }

        // Calculate Percentages
        Object.values(stats).forEach(s => {
            s.coverage = s.totalBehaviors > 0 ? Math.round((s.coveredBehaviors / s.totalBehaviors) * 100) : 0
        })

        return NextResponse.json({
            stats: Object.values(stats),
            globalMissing,
            totalGaps: globalMissing.length,
            generatedAt: new Date()
        })

    } catch (error) {
        console.error('Gap Analysis Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
