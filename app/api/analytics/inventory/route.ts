
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        // 1. Fetch all Inventory items
        const rawItems = await prisma.contentItem.findMany({
            select: {
                id: true,
                title: true,
                type: true, // Needed for distribution
                primaryPillar: true,
                maturity: true,
                intervention: true,
                moment: true,
                targetRole: true,
                roleLevel: true,
                // Nested structure for Taxonomy Tree
                sub: true,
                competence: true,
                behavior: true
            }
        })

        if (!rawItems || rawItems.length === 0) {
            return NextResponse.json({ stats: null, message: "No inventory data" })
        }

        // 2. Process Radar: Methodology Coverage (Pillars)
        const pillars = ['Shine In', 'Shine Out', 'Shine Up', 'Shine Beyond']
        const pillarDist = pillars.map(p => ({
            subject: p, // Radar uses 'subject' or 'name'
            A: rawItems.filter(i => i.primaryPillar === p).length,
            fullMark: Math.max(rawItems.length, 10) // Normalize somewhat
        }))

        // 3. Process Heatmap: Pillar vs Maturity
        const maturityLevels = ['Básico', 'En Desarrollo', 'Avanzado', 'Maestría']
        const maturityMatrix = pillars.map(p => {
            const counts: Record<string, number> = {}
            maturityLevels.forEach(m => {
                counts[m] = rawItems.filter(i => i.primaryPillar === p && i.maturity === m).length
            })
            return {
                name: p,
                ...counts
            }
        })

        // 4. Process Tree/Gaps: Hierarchy
        // Group by Pillar -> Sub -> Competence
        const treeMap: any = { name: '4Shine', children: [] }

        // Helper to find or create node
        const findOrCreate = (arr: any[], name: string) => {
            let node = arr.find((n: any) => n.name === name)
            if (!node) {
                node = { name, children: [] }
                arr.push(node)
            }
            return node
        }

        rawItems.forEach(item => {
            if (!item.primaryPillar) return
            const pNode = findOrCreate(treeMap.children, item.primaryPillar)

            if (item.sub) {
                const sNode = findOrCreate(pNode.children, item.sub)

                if (item.competence) {
                    const cNode = findOrCreate(sNode.children, item.competence)
                    // Leaves have value (size)
                    cNode.size = (cNode.size || 0) + 1
                } else {
                    sNode.size = (sNode.size || 0) + 1
                }
            } else {
                pNode.size = (pNode.size || 0) + 1
            }
        })

        // 4b. Identify Gaps (Simple list of Subs with count=0 isn't possible from JUST items, we need the taxonomy definition to know what is missing. 
        // For this iteration, we focus on what IS covered and maybe show low counts.)

        // 5. Process Bar: Intervention
        const interventions = ['Conciencia', 'Práctica', 'Aplicación'] // Deduce others?
        const interventionDist = interventions.map(type => ({
            name: type,
            value: rawItems.filter(i => i.intervention === type).length
        }))
        // Add "Otros/Sin Definir"
        const definedInts = new Set(interventions)
        const otherInts = rawItems.filter(i => !definedInts.has(i.intervention || '')).length
        if (otherInts > 0) interventionDist.push({ name: 'Sin Definir', value: otherInts })


        // 6. Process Line: Journey (Moment)
        const moments = ['Inicio', 'Desarrollo', 'Cierre', 'Transversal']
        const journeyDist = moments.map(m => ({
            name: m,
            count: rawItems.filter(i => i.moment === m).length
        }))

        // 7. Matrix: Roles vs Levels
        // This is tricky for a single chart. We can execute a Bubble chart format: { x: Role, y: Level, z: Count }
        const roleLevels = ['Junior', 'Senior', 'Manager', 'C-Level']
        const roles = Array.from(new Set(rawItems.map(i => i.targetRole).filter(Boolean))) as string[]

        const roleMatrix = roles.map(r => {
            const dataPoint: any = { role: r }
            roleLevels.forEach(l => {
                dataPoint[l] = rawItems.filter(i => i.targetRole === r && i.roleLevel === l).length
            })
            return dataPoint
        })

        // 8. Technical Category Distribution
        // Group by 'type' (PDF, Video, Toolkit, etc)
        const typeCounts: Record<string, number> = {}
        rawItems.forEach(i => {
            const t = i.type || 'Desconocido'
            typeCounts[t] = (typeCounts[t] || 0) + 1
        })
        const typeDist = Object.entries(typeCounts).map(([name, value]) => ({ name, value }))

        return NextResponse.json({
            stats: {
                total: rawItems.length,
                pillarDist,
                maturityMatrix,
                treeMap: treeMap.children,
                interventionDist,
                journeyDist,
                roleMatrix,
                typeDist, // New Field
                rawRoles: roles
            }
        })

    } catch (error) {
        console.error("Inventory Analytics Error", error)
        return NextResponse.json({ error: "Failed to fetch inventory stats" }, { status: 500 })
    }
}
