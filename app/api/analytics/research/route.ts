
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

// Helper for scoring evidence
const getEvidenceScore = (methodology: string | null): number => {
    if (!methodology) return 1
    const m = methodology.toLowerCase()
    if (m.includes('meta-análisis') || m.includes('meta-analysis')) return 5
    if (m.includes('sistemática') || m.includes('systematic')) return 4
    if (m.includes('longitudinal')) return 4
    if (m.includes('rct') || m.includes('experimental')) return 5
    if (m.includes('cuantitati') || m.includes('quantitative')) return 3
    if (m.includes('cualitati') || m.includes('qualitative')) return 3
    if (m.includes('teórico') || m.includes('conceptual') || m.includes('theoretical')) return 2
    return 1
}

// Helper to normalize methodology
const normalizeMethodology = (raw: string): string => {
    const lower = raw.toLowerCase()
    if (lower.includes('meta-análisis') || lower.includes('meta-analysis') || lower.includes('meta analysis')) return 'Meta-Analysis'
    if (lower.includes('sistemática') || lower.includes('systematic review') || lower.includes('slr')) return 'Systematic Review'
    if (lower.includes('cuantitati') || lower.includes('quantitative') || lower.includes('encuesta') || lower.includes('survey') || lower.includes('structural equation')) return 'Quantitative'
    if (lower.includes('cualitati') || lower.includes('qualitative') || lower.includes('entrevista') || lower.includes('interview') || lower.includes('focus group') || lower.includes('caso') || lower.includes('case study')) return 'Qualitative'
    if (lower.includes('mixto') || lower.includes('mixed')) return 'Mixed Methods'
    if (lower.includes('teórico') || lower.includes('conceptual') || lower.includes('theoretical')) return 'Theoretical/Conceptual'
    return 'Other'
}

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const research = await prisma.researchSource.findMany({
            include: {
                _count: {
                    select: { referencedBy: true }
                }
            }
        })

        // --- 2. COBERTURA CIENTÍFICA ---
        const pillars = ['Shine Within', 'Shine Out', 'Shine Up', 'Shine Beyond']

        // D. Distribución por Pilar
        const pillarCounts: Record<string, number> = { 'Shine Within': 0, 'Shine Out': 0, 'Shine Up': 0, 'Shine Beyond': 0 }

        // E. Heatmap: Pillar x Competence
        const pillarCompetenceMatrix: Record<string, Record<string, number>> = {}
        pillars.forEach(p => pillarCompetenceMatrix[p] = {})

        // F. Treemap: Pillar -> Competence -> Method
        const territoryTree: any = { name: "Research", children: [] }

        // --- 3. BALANCE METODOLÓGICO ---
        // G. Mix Metodológico
        const methodCounts: Record<string, number> = {}

        // H. Heatmap: Method x Pillar
        const methodPillarMatrix: Record<string, Record<string, number>> = {}

        // I. Índice de Evidencia (Top 20)
        const evidenceRanking = research.map(r => ({
            id: r.id,
            title: r.title,
            methodology: r.methodology || 'No definido',
            score: getEvidenceScore(r.methodology),
            citations: r._count.referencedBy
        })).sort((a, b) => b.score - a.score).slice(0, 20)


        // --- 4. GEOGRAFÍA & CULTURA ---
        // J. Geo Coverage
        const geoCounts: Record<string, number> = {}
        // K. Geo x Pillar
        const geoPillarMatrix: Record<string, Record<string, number>> = {}


        // --- 5. POBLACIÓN ---
        // L. Population segment
        const popCounts: Record<string, number> = {}
        // M. Population x Pillar
        const popPillarMatrix: Record<string, Record<string, number>> = {}


        // --- 6. SEMÁNTICA ---
        // N. Key Concepts
        const conceptCounts: Record<string, number> = {}

        // O. Co-occurrence Graph (Nodes & Edges)
        const conceptPairs: Record<string, number> = {}


        // --- ITERATE & AGGREGATE ---
        research.forEach(item => {
            const normalizedMethod = item.methodology ? normalizeMethodology(item.methodology) : 'Unknown'

            // Pillars
            item.pillars.forEach(p => {
                if (pillarCounts[p] !== undefined) pillarCounts[p]++

                // E. Pillar x Competence
                if (item.competence) {
                    item.competence.split(',').forEach(c => {
                        const comp = c.trim()
                        if (pillarCompetenceMatrix[p]) {
                            // Truncate logic
                            const safeComp = comp.length > 30 ? comp.substring(0, 30) + '...' : comp
                            pillarCompetenceMatrix[p][safeComp] = (pillarCompetenceMatrix[p][safeComp] || 0) + 1
                        }
                    })
                }

                // H. Method x Pillar (USING NORMALIZED)
                if (!methodPillarMatrix[normalizedMethod]) methodPillarMatrix[normalizedMethod] = {}
                methodPillarMatrix[normalizedMethod][p] = (methodPillarMatrix[normalizedMethod][p] || 0) + 1

                // K. Geo x Pillar
                if (item.geographicCoverage) {
                    const g = item.geographicCoverage.trim()
                    const safeGeo = g.length > 20 ? g.split(' ')[0] : g
                    if (!geoPillarMatrix[safeGeo]) geoPillarMatrix[safeGeo] = {}
                    geoPillarMatrix[safeGeo][p] = (geoPillarMatrix[safeGeo][p] || 0) + 1
                }

                // M. Pop x Pillar
                if (item.populationParams) {
                    const pop = item.populationParams.trim()
                    const safePop = pop.length > 25 ? pop.substring(0, 25) + '...' : pop
                    if (!popPillarMatrix[safePop]) popPillarMatrix[safePop] = {}
                    popPillarMatrix[safePop][p] = (popPillarMatrix[safePop][p] || 0) + 1
                }
            })

            // Method Mix (USING NORMALIZED)
            methodCounts[normalizedMethod] = (methodCounts[normalizedMethod] || 0) + 1

            // Geo
            if (item.geographicCoverage) {
                const g = item.geographicCoverage.trim()
                const safeGeo = g.length > 20 ? g.split(' ')[0] : g
                geoCounts[safeGeo] = (geoCounts[safeGeo] || 0) + 1
            }

            // Pop
            if (item.populationParams) {
                const pop = item.populationParams.trim()
                const safePop = pop.length > 25 ? pop.substring(0, 25) + '...' : pop
                popCounts[safePop] = (popCounts[safePop] || 0) + 1
            }

            // Concepts & Co-occurrence
            if (item.keyConcepts) {
                const concepts = item.keyConcepts.split(',').map(c => c.trim().toLowerCase()).filter(Boolean)
                concepts.forEach(c => {
                    conceptCounts[c] = (conceptCounts[c] || 0) + 1
                })

                // Generate pairs
                for (let i = 0; i < concepts.length; i++) {
                    for (let j = i + 1; j < concepts.length; j++) {
                        const pair = [concepts[i], concepts[j]].sort().join('|')
                        conceptPairs[pair] = (conceptPairs[pair] || 0) + 1
                    }
                }
            }
        })

        // -- FORMATTING DATA STRUCTURES --

        // Matrices to Recharts format (Array of objects)
        const formatMatrix = (matrix: Record<string, Record<string, number>>, xLabels: string[]) => {
            return Object.entries(matrix).map(([yLabel, xValues]) => {
                const row: any = { name: yLabel }
                xLabels.forEach(x => {
                    row[x] = xValues[x] || 0
                })
                return row
            })
        }

        // E. Pillar x Competence (Row=Competence, Cols=Pillars)
        // Need to invert the capture structure to ensure rows are Competences for better readability?
        // Or Row=Pillar is better? User asked "Pillars x Competence". Usually X axis is huge (Competences), so better Y=Competence, X=Pillar (Heatmap style).
        // Let's gather all unique competences
        const allCompetences = new Set<string>()
        Object.values(pillarCompetenceMatrix).forEach(row => Object.keys(row).forEach(c => allCompetences.add(c)))
        const pillarCompetenceData = Array.from(allCompetences).map(comp => {
            const row: any = { name: comp }
            pillars.forEach(p => {
                row[p] = pillarCompetenceMatrix[p]?.[comp] || 0
            })
            return row
        })

        // H. Method x Pillar (Row=Method, Cols=Pillars)
        const methodPillarData = formatMatrix(methodPillarMatrix, pillars)

        // K. Geo x Pillar
        const geoPillarData = formatMatrix(geoPillarMatrix, pillars)

        // M. Pop x Pillar
        const popPillarData = formatMatrix(popPillarMatrix, pillars)

        // O. Network Data
        const nodes = Object.entries(conceptCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30) // Top 30 concepts
            .map(([id, val]) => ({ id, val }))

        const topConcepts = new Set(nodes.map(n => n.id))
        const links = Object.entries(conceptPairs)
            .map(([pair, weight]) => {
                const [source, target] = pair.split('|')
                return { source, target, weight }
            })
            .filter(l => topConcepts.has(l.source) && topConcepts.has(l.target)) // Only links between top concepts

        // --- 7. TRAZABILIDAD ---
        // Q. Most Cited (using _count.referencedBy from Prisma include)
        const citationRanking = research
            .sort((a, b) => b._count.referencedBy - a._count.referencedBy)
            .slice(0, 10)
            .map(r => ({
                title: r.title,
                count: r._count.referencedBy
            }))


        return NextResponse.json({
            stats: {
                total: research.length,
                pillarDist: Object.entries(pillarCounts).map(([name, value]) => ({ name, value })),
                pillarCompetenceData,
                methodCounts: Object.entries(methodCounts).map(([name, value]) => ({ name, value })),
                methodPillarData,
                evidenceRanking,
                geoDist: Object.entries(geoCounts).map(([name, value]) => ({ name, value })),
                geoPillarData,
                popDist: Object.entries(popCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value })),
                popPillarData,
                conceptDensity: Object.entries(conceptCounts).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([text, value]) => ({ text, value })),
                conceptGraph: { nodes, links },
                citationRanking
            }
        })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
