import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const research = await prisma.researchSource.findMany()

        // 1. Density of Key Concepts
        const conceptCounts: Record<string, number> = {}
        research.forEach(item => {
            if (item.keyConcepts) {
                item.keyConcepts.split(',').forEach(c => {
                    const key = c.trim().toLowerCase()
                    if (key) conceptCounts[key] = (conceptCounts[key] || 0) + 1
                })
            }
        })
        const conceptDensity = Object.entries(conceptCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([text, value]) => ({ text, value }))

        // 2. Pillars Distribution
        const pillarCounts: Record<string, number> = { 'Shine In': 0, 'Shine Out': 0, 'Shine Up': 0, 'Shine On': 0 }
        research.forEach(item => {
            item.pillars.forEach(p => {
                if (pillarCounts[p] !== undefined) pillarCounts[p]++
            })
        })
        const pillarDist = Object.entries(pillarCounts).map(([name, value]) => ({ name, value }))

        // 3. Competence Distribution
        const competenceCounts: Record<string, number> = {}
        research.forEach(item => {
            if (item.competence) {
                const key = item.competence.trim()
                if (key) competenceCounts[key] = (competenceCounts[key] || 0) + 1
            }
        })
        const competenceDist = Object.entries(competenceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }))

        // 4. Geographic Coverage
        const geoCounts: Record<string, number> = {}
        research.forEach(item => {
            if (item.geographicCoverage) {
                const key = item.geographicCoverage.trim()
                if (key) geoCounts[key] = (geoCounts[key] || 0) + 1
            }
        })
        const geoDist = Object.entries(geoCounts).map(([name, value]) => ({ name, value }))

        // 5. Population / Sample
        const popCounts: Record<string, number> = {}
        research.forEach(item => {
            if (item.populationParams) {
                const key = item.populationParams.trim()
                if (key) popCounts[key] = (popCounts[key] || 0) + 1
            }
        })
        const popDist = Object.entries(popCounts).slice(0, 10).map(([name, value]) => ({ name, value }))


        return NextResponse.json({
            stats: {
                total: research.length,
                conceptDensity,
                pillarDist,
                competenceDist,
                geoDist,
                popDist
            }
        })
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
