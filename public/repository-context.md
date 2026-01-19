# Repository Context

This file contains a consolidated view of the codebase for use with LLMs.



# File: app/admin/page.tsx
```typescript
import prisma from '@/lib/prisma'
import MethodologySPA from '@/components/MethodologySPA'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function Page() {
    const session = await getServerSession(authOptions)

    const contents = await prisma.contentItem.findMany({
        orderBy: { id: 'asc' }
    })

    const taxonomy = await prisma.taxonomy.findMany({
        orderBy: { name: 'asc' }
    })

    return <MethodologySPA initialData={contents as any} initialTaxonomy={taxonomy as any} session={session as any} />
}

```


# File: app/analitica/inventario/page.tsx
```typescript
import AnalyticsView from '@/components/AnalyticsView'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Page() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/api/auth/signin")
    }

    return <AnalyticsView currentTab="inventory" />
}

```


# File: app/analitica/page.tsx
```typescript
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function Page() {
    redirect("/analitica/inventario")
}

```


# File: app/analitica/research/page.tsx
```typescript
import AnalyticsView from '@/components/AnalyticsView'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Page() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/api/auth/signin")
    }

    return <AnalyticsView currentTab="research" />
}

```


# File: app/api/admin/reanalyze-research/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { GeminiService } from '@/lib/gemini'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getFileContent } from '@/lib/drive'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

// Change to POST to accept body params and be semantic
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json().catch(() => ({}))
        const forceUpdate = body.force === true

        const researchItems = await prisma.researchSource.findMany()
        const results = []

        for (const item of researchItems) {
            // Updated Logic: Only skip if NOT forced AND has all fields
            if (!forceUpdate && item.competence && item.geographicCoverage && item.populationParams) {
                results.push({ id: item.id, status: 'skipped', title: item.title })
                continue
            }

            console.log(`[ReAnalyze] Processing: ${item.title} (${item.id}) [Force: ${forceUpdate}]`)
            let text = ''

            // 1. Fetch Content
            if (item.driveId) {
                try {
                    text = await getFileContent(item.driveId)
                } catch (e) {
                    console.error(`Error fetching drive ${item.driveId}`, e)
                }
            }

            if (!text && item.url) {
                try {
                    let targetUrl = item.url.trim()
                    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl

                    const res = await fetch(targetUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
                        }
                    })
                    if (res.ok) {
                        const html = await res.text()
                        text = `[CONTENT FROM URL: ${targetUrl}]\n\n` + html.replace(/<[^>]*>/g, ' ').substring(0, 30000)
                    }
                } catch (e) {
                    console.error(`Error fetching url ${item.url}`, e)
                }
            }

            if (!text && item.summary) {
                text = `[EXISTING SUMMARY]\n${item.summary}\n\n[EXISTING KEY CONCEPTS]\n${item.keyConcepts}\n\n[EXISTING FINDINGS]\n${item.findings}`
            }

            if (!text) {
                results.push({ id: item.id, status: 'failed_no_content', title: item.title })
                continue
            }

            // 2. Analyze
            const promptContext = `
            MODO: RE-ANÁLISIS DE FUENTE DE INVESTIGACIÓN EXISTENTE
            
            OBJETIVO: Extraer metadatos faltantes para analítica.
            POR FAVOR, ASEGURA COMPLETAR CRÍTICAMENTE ESTOS CAMPOS:
            - "competence": Competencias técnicas o de liderazgo (separadas por coma).
            - "geographicCoverage": Región geográfica del estudio (e.g. Global, LATAM, Europa, USA, Colombia).
            - "populationParams": Descripción de la muestra (e.g. 500 CEOs, Estudiantes de MBA, 20 Empresas Tech).
            
            (Mantén los otros campos consistentes si puedes mejorarlos, o devuélvelos igual).
            `

            try {
                const metadata = await GeminiService.analyzeContent(text, promptContext)

                if (metadata) {
                    await prisma.researchSource.update({
                        where: { id: item.id },
                        data: {
                            competence: metadata.competence,
                            geographicCoverage: metadata.geographicCoverage,
                            populationParams: metadata.populationParams,
                        }
                    })
                    results.push({ id: item.id, status: 'updated', updates: { competence: metadata.competence, geo: metadata.geographicCoverage, pop: metadata.populationParams } })
                }
            } catch (e) {
                console.error(`Gemini Error for ${item.id}`, e)
                results.push({ id: item.id, status: 'failed_gemini', error: String(e) })
            }

            // Artificial delay to avoid rate limits
            await new Promise(r => setTimeout(r, 2000))
        }

        return NextResponse.json({ success: true, results })
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}

```


# File: app/api/analytics/inventory/route.ts
```typescript

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

```


# File: app/api/analytics/research/route.ts
```typescript

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
        const pillars = ['Shine In', 'Shine Out', 'Shine Up', 'Shine Beyond']

        // D. Distribución por Pilar
        const pillarCounts: Record<string, number> = { 'Shine In': 0, 'Shine Out': 0, 'Shine Up': 0, 'Shine Beyond': 0 }

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

```


# File: app/api/analytics/route.ts
```typescript
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

```


# File: app/api/audio/generate/route.ts
```typescript

import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SystemSettingsService } from '@/lib/settings'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { text, voice } = await req.json()
        if (!text) {
            return NextResponse.json({ error: 'Text content is required' }, { status: 400 })
        }

        const apiKey = await SystemSettingsService.getOpenAIApiKey()
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 500 })
        }

        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'tts-1',
                input: text,
                voice: voice || 'alloy', // Support dynamic voice, default to alloy
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            console.error('OpenAI TTS Error:', error)
            return NextResponse.json({ error: error.error?.message || 'Error generating audio' }, { status: response.status })
        }

        // Return the binary audio stream
        const audioBuffer = await response.arrayBuffer()

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.byteLength.toString(),
            }
        })

    } catch (error: any) {
        console.error('Audio Generation Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

```


# File: app/api/auth/[...nextauth]/route.ts
```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

```


# File: app/api/generator/history/route.ts
```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        // For now we return all history, later filter by user if needed
        // Assuming 'anonymous' or user email was stored

        const history = await prisma.generationHistory.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        })

        return NextResponse.json(history)
    } catch (error) {
        console.error('Error fetching history:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 })
        }

        await prisma.generationHistory.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting history:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

```


# File: app/api/generator/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { GeminiService } from '@/lib/gemini'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Allow longer timeout for generation
export const maxDuration = 60

type CompilationType =
    | 'dossier'
    | 'matrix'
    | 'toolkit'
    | 'podcast'
    | 'video'
    | 'mindmap'
    | 'flashcards'
    | 'quiz'
    | 'infographic'
    | 'presentation'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        const userEmail = session?.user?.email || 'anonymous'

        const { type, message, selectedAssetIds, selectedResearchIds, tone, customInstructions } = await request.json() as {
            type: CompilationType,
            message?: string,
            selectedAssetIds?: string[],
            selectedResearchIds?: string[],
            tone?: string,
            customInstructions?: string
        }

        // 1. Fetch Assets (Inventory)
        let assets = await prisma.contentItem.findMany({
            where: { status: 'Validado' },
            select: { id: true, title: true, primaryPillar: true, observations: true }
        })

        if (selectedAssetIds && selectedAssetIds.length > 0) {
            assets = assets.filter(i => selectedAssetIds.includes(i.id))
        } else {
            assets = [] // If explicit selection is sent as empty, default to empty.
        }

        // 2. Fetch Research (External)
        let research: any[] = []
        if (selectedResearchIds && selectedResearchIds.length > 0) {
            research = await prisma.researchSource.findMany({
                where: { id: { in: selectedResearchIds } },
                select: { id: true, title: true, findings: true, summary: true, url: true }
            })
        }

        // 3. Validation: Must have at least one source (Asset OR Research)
        if (assets.length === 0 && research.length === 0) {
            return NextResponse.json({ result: "⚠️ No hay activos validos ni investigaciones seleccionadas. Por favor selecciona al menos una fuente." })
        }

        // 4. Prepare Context
        const inventoryContext = assets.map(i =>
            `[ASSET: ${i.id}] TÍTULO: "${i.title}" (Pilar: ${i.primaryPillar})\nRESUMEN: ${JSON.stringify(i.observations)}`
        ).join('\n\n')

        const researchContext = research.map(r =>
            `[RESEARCH: ${r.id}] TÍTULO: "${r.title}" (URL: ${r.url})\nHALLAZGOS: ${r.findings || r.summary || 'Sin resumen'}`
        ).join('\n\n')

        const combinedContext = `
        === INVENTARIO INTERNO (4SHINE) ===
        ${inventoryContext || 'Ninguno seleccionado.'}

        === INVESTIGACIÓN EXTERNA ===
        ${researchContext || 'Ninguna seleccionada.'}
        `

        // 4. API Key Strategy (OpenAI)
        const { OpenAIService } = await import('@/lib/openai')

        // 5. Construct Prompt (Done before calling service to pass it)
        let prompt = ""

        // INJECT CUSTOM SETTINGS
        let agentPersona = "Actúa como CONSULTOR EXPERTO"
        if (tone) agentPersona += ` con un tono ${tone.toUpperCase()}`
        if (customInstructions) agentPersona += `. INSTRUCCIONES ADICIONALES: ${customInstructions}`

        // PRIORITY: Check for restricted types FIRST.
        if (type === 'dossier') {
            prompt = `
            ${agentPersona}. Genera un ** DOSSIER EJECUTIVO **.

                ESTRUCTURA:
            1. ** Intro Ejecutiva **: Valor de la metodología(basado en lo seleccionado).
            2. ** Análisis de Activos **: Resumen narrativo citando las fuentes.
            3. ** Impacto **: Conductas esperadas.
            4. ** Cierre **: Next Steps.

            SOLICITUD ADICIONAL: "${message || ''}"

                CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'matrix') {
            prompt = `
            Actúa como ANALISTA DE DATOS.Genera una ** MATRIZ DE TRAZABILIDAD ** en Markdown Table.
                Columnas: ID | Título | Tipo(Asset / Research) | Concepto Clave

            SOLICITUD ADICIONAL: "${message || ''}"

            CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'toolkit') {
            prompt = `Actúa como ARQUITECTO.Diseña una ** ESTRUCTURA DE TOOLKIT ** en formato árbol. SOLICITUD ADICIONAL: "${message || ''}"`
        } else if (type === 'podcast') {
            prompt = `
            Actúa como GUIONISTA DE PODCAST "Deep Dive".
            Genera un GUION DE AUDIO(Host vs Experto) de 5 min discutiendo los activos seleccionados.
            Usa un tono ${tone || 'casual, sorprendente y analítico'}.
            ${customInstructions ? `INSTRUCCIONES ADICIONALES: ${customInstructions}` : ''}

                FORMATO:
            ** HOST:** ...
            ** EXPERTO:** ...
            
            SOLICITUD ADICIONAL: "${message || ''}"

            CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'video') {
            prompt = `
            Actúa como DIRECTOR CREATIVO.Genera un ** GUION VISUAL PARA VIDEO(StoryBoard Script) **.
            
            FORMATO TABLA:
            | TIEMPO | VISUAL(Escena) | AUDIO(Voz en off) |
            | --------| -----------------| --------------------|
            | 0:00 | ...             | ...                |

                OBJETIVO: Video resumen de alto impacto sobre los activos seleccionados.
                
            SOLICITUD ADICIONAL: "${message || ''}"

                    CONTEXTO:
            ${combinedContext}
            `
        } else if (type === 'mindmap') {
            prompt = `
            TU TAREA: Generar código de Mermaid.js para un diagrama de flujo.
            
            INPUT:
            ${combinedContext}

            OUTPUT ESPERADO:
            ÚNICAMENTE un bloque de código Markdown con el diagrama.
            
            EJEMPLO:
            \`\`\`mermaid
            graph TD
              A[Concepto] --> B(Detalle)
            \`\`\`

            REGLAS:
            1. NO expliques nada. Solo el código.
            2. Usa sintaxis "graph TD".
            3. Asegúrate de cerrar el bloque de código.
            `
        } else if (type === 'flashcards') {
            prompt = `
            TU TAREA: Extraer 5 conceptos clave y convertirlos en tarjetas de estudio.

            OUTPUT ESPERADO:
            {
              "type": "flashcards",
              "cards": [
                { "question": "¿Concepto?", "answer": "Definición", "source": "Contexto" }
              ]
            }

            INPUT:
            ${combinedContext}
            `
        } else if (type === 'quiz') {
            prompt = `
            TU TAREA: Crear un examen de 5 preguntas basado en el texto.

            OUTPUT ESPERADO:
            {
              "type": "quiz",
              "questions": [
                {
                  "question": "Pregunta",
                  "options": ["A","B","C","D"],
                  "correctAnswer": "A",
                  "explanation": "Por qué es A"
                }
              ]
            }

            INPUT:
            ${combinedContext}
            `
        } else if (type === 'infographic') {
            prompt = `
            TU TAREA: Estructurar la información para una infografía visual.

            OUTPUT ESPERADO:
            {
              "type": "infographic",
              "title": "Main Title",
              "intro": "Intro text",
              "sections": [
                 {
                    "title": "Section Title",
                    "content": "Short text",
                    "icon": "zap",
                    "stats": [ { "label": "Stat", "value": "100%" } ]
                 }
              ],
              "conclusion": "Closing text"
            }

            REGLAS:
            1. Usa iconos de Lucide (zap, users, trend, chart, target).
            2. "sections" debe tener contenido real.

            INPUT:
            ${combinedContext}
            `
        } else if (type === 'presentation') {
            prompt = `
            TU TAREA: Crear el esquema para una presentación de 7 diapositivas.

            OUTPUT ESPERADO:
            {
              "type": "presentation",
              "slides": [
                { "title": "Slide Title", "bullets": ["Point 1", "Point 2"], "visual": "Image description" }
              ]
            }

            INPUT:
            ${combinedContext}
            `
        } else {
            // DEFAULT: General Chat / Q&A
            prompt = `
            ${agentPersona}.
            Responde a la consulta del usuario basándote EXCLUSIVAMENTE en la información proporcionada en el CONTEXTO.
            Si la respuesta no está en el contexto, indícalo claramente. No inventes información.

            CONSULTA DEL USUARIO: "${message}"

            CONTEXTO:
            ${combinedContext}
            `
        }

        // --- SAFETY CHECK FOR JSON MODE ---
        // V3 CHANGE: Removing 'mindmap' from JSON mode to avoid hallwaycination of semantic objects.
        // We will parse the markdown manually for mindmaps.
        const jsonTypes = ['infographic', 'flashcards', 'quiz', 'presentation', 'matrix']
        if (jsonTypes.includes(type as string) && !prompt.toLowerCase().includes('json')) {
            prompt += `\n\nIMPORTANTE: ESTÁS EN MODO STRICT JSON. TU RESPUESTA DEBE SER EXCLUSIVAMENTE UN OBJETO JSON VÁLIDO.`
        }

        // 6. Generate (OpenAI)
        console.log("[Generator] Starting OpenAI generation...")
        let output = ""
        try {
            // Apply JSON mode to all structured types
            const options = jsonTypes.includes(type as string) ? {
                response_format: { type: "json_object" },
                temperature: 0.1 // FORCE DETERMINISTIC STRUCTURE
            } : undefined
            console.log(`[Generator] Sending prompt to OpenAI (Type: ${type}, JSON Mode: ${!!options})... Preamble: ${prompt.substring(0, 50)}`)

            output = await OpenAIService.generateContent(prompt, "gpt-4o", options) || "No response generated."
            console.log(`[Generator] Raw Output received: ${output.substring(0, 100)}...`)

            // CLEANING: JSON Sanitization
            if (jsonTypes.includes(type as string)) {
                // Remove Markdown code blocks if present
                output = output.replace(/```json/g, '').replace(/```/g, '').trim()
                // Validate if it is JSON
                try {
                    JSON.parse(output)
                    // If safe, we keep it clean.
                } catch (e) {
                    console.error("Generator Output was not valid JSON:", output.substring(0, 100))
                }
            } else if (type === 'mindmap') {
                // V3 PARSING: Extract Mermaid code from Markdown block
                const match = output.match(/```mermaid([\s\S]*?)```/)
                let mermaidCode = match ? match[1].trim() : output;

                // Construct the JSON expected by frontend
                output = JSON.stringify({
                    type: "mindmap",
                    mermaid: mermaidCode
                })
            }

        } catch (err: any) {
            console.error("[Generator] OpenAI Failed:", err)
            return NextResponse.json({ error: `OpenAI Error: ${err.message}` }, { status: 500 })
        }

        // 7. Persist History
        try {
            await prisma.generationHistory.create({
                data: {
                    user: userEmail, // Correct field name per schema
                    prompt: (message || `Generate ${type}`) +
                        (tone ? `\n[Tone: ${tone}]` : '') +
                        (customInstructions ? `\n[Instructions: ${customInstructions}]` : ''),
                    response: output,
                    type: type || 'chat',
                    assets: selectedAssetIds || [],
                    research: selectedResearchIds || []
                }
            })
        } catch (dbError) {
            console.error("Failed to save history:", dbError)
        }

        return NextResponse.json({
            result: output,
            count: assets.length + research.length
        })

    } catch (error) {
        console.error('Generator API Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

```


# File: app/api/glossary/generate/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { OpenAIService } from '@/lib/openai'

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { term } = await request.json()
        if (!term) return NextResponse.json({ error: 'Term required' }, { status: 400 })

        // 1. Fetch Context (Assets + Research)
        // Simple strategy: Fetch standard assets and perhaps search research if full search is available
        // For now, we reuse the validated assets strategy from OpenAIService but tailored for definition

        const validatedAssets = await prisma.contentItem.findMany({
            where: { status: 'Validado' },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: { title: true, primaryPillar: true, observations: true }
        })

        const researchItems = await prisma.researchSource.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, summary: true, findings: true, apa: true }
        })

        const context = `
        ACTIVE ASSETS CONTEXT:
        ${validatedAssets.map(a => `- ${a.title} (${a.primaryPillar}): ${a.observations?.substring(0, 200)}`).join('\n')}

        RESEARCH CONTEXT (Usa estos IDs para citar):
        ${researchItems.map(r => `- [ID: ${r.id}] ${r.title}: ${r.summary?.substring(0, 200)} (APA: ${r.apa})`).join('\n')}
        `

        const prompt = `
        Define el término "${term}" bajo el marco de la metodología 4Shine.
        Usa el contexto suministrado de Activos e Investigaciones para dar una definición precisa, académica y alineada con los pilares (Shine In, Out, Up, Beyond).
        
        REGLAS DE CITACIÓN (CRÍTICO):
        1. Si usas información del "RESEARCH CONTEXT", DEBES citar al autor usando formato APA 7.
        2. ADEMÁS, la cita debe ser un hipervínculo en formato Markdown que lleve a la fuente.
        3. Formato del Link: [Autor, Año](/research?id=ID_DE_LA_FUENTE)
        Ejemplo: "...como afirma [Smith, 2023](/research?id=clq...) en su estudio..."

        ${context}

        Responde ÚNICAMENTE con un JSON:
        {
            "definition": "Definición conceptual robusta con citas hipervinculadas (máx 500 caracteres).",
            "pillars": ["Shine In", "Shine Out"] // Pilares relacionados detectados
        }
        `

        const result = await OpenAIService.generateContent(prompt, "gpt-4o", { response_format: { type: "json_object" } })

        if (!result) throw new Error('AI Generation failed')

        const parsed = JSON.parse(result)

        return NextResponse.json(parsed)

    } catch (error: any) {
        console.error('Glossary AI Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

```


# File: app/api/glossary/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const terms = await prisma.glossaryTerm.findMany({
        orderBy: { term: 'asc' }
    })
    return NextResponse.json(terms)
}

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.glossaryTerm.delete({ where: { id } })
    return NextResponse.json({ success: true })
}

```


# File: app/api/glossary/upsert/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { id, term, definition, pillars } = body

        if (!term || !definition) {
            return NextResponse.json({ error: 'Term and Definition required' }, { status: 400 })
        }

        const result = await prisma.glossaryTerm.upsert({
            where: { id: id || 'new' },
            create: {
                term,
                definition,
                pillars: pillars || [],
                source: 'Manual'
            },
            update: {
                term,
                definition,
                pillars: pillars || [],
                source: 'Manual' // If edited manually, update source? Or keep original? Let's say Manual edit overrides.
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Glossary Upsert Error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

```


# File: app/api/health/route.ts
```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function isAdmin() {
    const session = await getServerSession(authOptions)
    return (session?.user as any)?.role === 'admin'
}

export async function GET() {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const health: any = {
        database: { status: 'loading', details: '' },
        drive: { status: 'loading', details: '' },
        gemini: { status: 'loading', details: '' }
    }

    // 1. Database Check
    try {
        await prisma.$queryRaw`SELECT 1`
        health.database = { status: 'healthy', details: 'Connected to Neon DB' }
    } catch (e) {
        health.database = { status: 'error', details: String(e) }
    }

    // 2. Drive Check (Simple check if config exists and service account is valid JSON)
    try {
        const settings = await prisma.systemSettings.findUnique({ where: { key: 'driveConfig' } })
        if (settings) {
            const config = settings.value as any
            if (config.serviceAccountJson) {
                JSON.parse(config.serviceAccountJson)
                health.drive = { status: 'healthy', details: 'Google Drive configuration valid' }
            } else {
                health.drive = { status: 'warning', details: 'Service Account JSON missing' }
            }
        } else {
            health.drive = { status: 'warning', details: 'No Drive settings found' }
        }
    } catch (e) {
        health.drive = { status: 'error', details: 'Invalid Service Account JSON' }
    }

    // 3. Gemini Check
    try {
        const settings = await prisma.systemSettings.findUnique({ where: { key: 'geminiApiKey' } })
        if (settings && (settings.value as any).key) {
            health.gemini = { status: 'healthy', details: 'API Key configured' }
        } else {
            health.gemini = { status: 'warning', details: 'API Key missing' }
        }
    } catch (e) {
        health.gemini = { status: 'error', details: String(e) }
    }

    return NextResponse.json(health)
}

```


# File: app/api/inventory/analyze/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getFileContent } from '@/lib/drive'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Origin': '*',
        },
    })
}

export async function POST(request: NextRequest) {
    // Auth Check
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { driveId, url, type, transcription: manualTranscription } = await request.json()

        if (!driveId && !url && !manualTranscription) {
            return NextResponse.json({ error: 'Drive ID, URL or Transcription required' }, { status: 400 })
        }

        console.log(`[Analyze] Fetching content for ${driveId || url}...`)

        let text = ''
        let transcription = null

        const { google } = require('googleapis')
        const { SystemSettingsService } = require('@/lib/settings')
        const config = await SystemSettingsService.getDriveConfig()
        const credentials = JSON.parse(config.serviceAccountJson)
        const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive'] })

        if (driveId) {
            const drive = google.drive({ version: 'v3', auth })
            const meta = await drive.files.get({ fileId: driveId, fields: 'mimeType, name, size' })
            const mimeType = meta.data.mimeType
            const size = parseInt(meta.data.size || '0')

            const MAX_SIZE_MB = 1000
            if (size > MAX_SIZE_MB * 1024 * 1024) {
                return NextResponse.json({
                    error: `El archivo supera el límite de ${MAX_SIZE_MB}MB.`
                }, { status: 400 })
            }

            if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
                console.log(`[Analyze] Processing Media: ${mimeType}`)
                const { downloadDriveFile } = require('@/lib/drive')
                const { GeminiService } = require('@/lib/gemini')
                const fs = require('fs')

                const localFile = await downloadDriveFile(driveId)
                try {
                    // Synchronous Transcribe
                    transcription = await GeminiService.transcribeMedia(localFile.path, localFile.mimeType)
                    text = `[TRANSCRIPTION OF VIDEO/AUDIO: ${localFile.originalName}]\n\n${transcription}`
                } finally {
                    if (fs.existsSync(localFile.path)) fs.unlinkSync(localFile.path)
                }
            } else {
                text = await getFileContent(driveId)
            }
        }

        if (url) {
            let targetUrl = url.trim()
            if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl
            console.log(`[Analyze] Analyzing URL: ${targetUrl}`)

            try {
                const res = await fetch(targetUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0...' }
                })
                if (!res.ok) throw new Error(`Status: ${res.status}`)
                const html = await res.text()
                text = `[CONTENT FROM URL: ${targetUrl}]\n\n` + html.replace(/<[^>]*>/g, ' ').substring(0, 30000)
            } catch (e) {
                text = `[URL_ACCESS_FAILED] ${targetUrl}\nFallback to Knowledge Base.`
            }
        }

        if (manualTranscription) {
            console.log(`[Analyze] Using Manual Transcription`)
            transcription = manualTranscription
            text = `[MANUAL TRANSCRIPTION PROVIDED]\n\n${manualTranscription}`
        }

        // Context
        let promptContext = ''
        if (type === 'Investigación') {
            promptContext = `MODO: ANÁLISIS DE FUENTE ACADÉMICA / INVESTIGACIÓN... (Completa 4Shine info)`
        }

        // Analyze
        const { GeminiService } = await import('@/lib/gemini')
        const metadata = await GeminiService.analyzeContent(text, promptContext)

        if (transcription) metadata.transcription = transcription

        let suggestedId = null
        if (metadata?.type) {
            const { IdGeneratorService } = require('@/lib/id-generator')
            suggestedId = await IdGeneratorService.generateId(metadata.type)
        }

        return NextResponse.json({ success: true, data: metadata, suggestedId })

    } catch (error: any) {
        console.error('[Analyze Error]', error)
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
    }
}

```


# File: app/api/inventory/drive-files/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { listDriveFiles } from '@/lib/drive'
import { SystemSettingsService } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const requestedFolderId = searchParams.get('folderId')

        // Enforce the constraint: Only list files from the configured ROOT folder
        // TODO: In a real hierarchical enforcement, we should check if requestedFolderId is a child of the root.
        // For now, we trust the ID but default to root if null.
        const config = await SystemSettingsService.getDriveConfig()
        const rootFolderId = config.authorizedFolderIds[0]

        if (!rootFolderId) {
            return NextResponse.json({ error: 'No root folder configured in Admin Panel' }, { status: 400 })
        }

        const targetFolderId = requestedFolderId || rootFolderId

        const files = await listDriveFiles(targetFolderId)
        return NextResponse.json(files)
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

```


# File: app/api/inventory/list/route.ts
```typescript

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const items = await prisma.contentItem.findMany({
            orderBy: { id: 'asc' },
        })
        return NextResponse.json(items)
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

```


# File: app/api/inventory/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const pillar = searchParams.get('pillar')

    const where: any = {}
    if (pillar) {
        where.OR = [
            { primaryPillar: pillar },
            { secondaryPillars: { has: pillar } }
        ]
    }

    try {
        const items = await prisma.contentItem.findMany({
            where,
            orderBy: { id: 'asc' },
        })
        return NextResponse.json(items)
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role

    if (role !== 'admin' && role !== 'metodologo') {
        return NextResponse.json({ error: 'Unauthorized. Only Admin or Metodologo can delete assets.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'Missing asset ID' }, { status: 400 })
    }

    try {
        await prisma.contentItem.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

```


# File: app/api/inventory/upload/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getFileContent, uploadToDrive } from '@/lib/drive'
import { GeminiService } from '@/lib/gemini'
import { SystemSettingsService } from '@/lib/settings'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = file.name
        const mimeType = file.type

        console.log(`[Upload API] Processing file: ${filename} (${mimeType}, ${buffer.length} bytes)`)

        // 1. Extract text (if possible) for Gemini analysis
        let extractedText = ""
        let extractionError = null
        try {
            if (mimeType === 'application/pdf') {
                // Polyfill for pdf-parse compatibility in Next.js Server Environment
                if (typeof (global as any).DOMMatrix === 'undefined') {
                    (global as any).DOMMatrix = class DOMMatrix { }
                }
                const pdf = require('pdf-parse')
                const data = await pdf(buffer)
                extractedText = data.text
                console.log(`[Upload API] PDF text extracted (${extractedText.length} chars)`)
            } else if (mimeType.includes('text') || mimeType.includes('json')) {
                extractedText = buffer.toString('utf-8')
                console.log(`[Upload API] Text file read (${extractedText.length} chars)`)
            }
        } catch (parseError: any) {
            extractionError = parseError.message || String(parseError)
            console.error('[Upload API] Text extraction failed:', parseError)
        }

        // 2. IA Analysis
        let metadata = null
        let geminiErrorDetail = null
        let suggestedId = null

        if (extractedText) {
            try {
                metadata = await GeminiService.analyzeContent(extractedText)
                if (metadata?.type) {
                    const { IdGeneratorService } = require('@/lib/id-generator')
                    suggestedId = await IdGeneratorService.generateId(metadata.type)
                }
            } catch (geminiError: any) {
                geminiErrorDetail = geminiError.message || String(geminiError)
                console.error('[Upload API] Gemini analysis failed:', geminiError)
            }
        }

        // 3. Upload to Drive
        let driveId = null
        let driveErrorDetail = null
        try {
            const driveConfig = await SystemSettingsService.getDriveConfig()
            const targetFolderId = driveConfig.rootFolderId || (driveConfig.authorizedFolderIds?.length > 0 ? driveConfig.authorizedFolderIds[0] : null)

            if (targetFolderId) {
                driveId = await uploadToDrive(filename, buffer, mimeType, targetFolderId)
            } else {
                driveErrorDetail = 'No target folder ID found in configuration'
                console.warn('[Upload API] No folder configured in settings')
            }
        } catch (driveError: any) {
            driveErrorDetail = driveError.message || String(driveError)
            console.error('[Upload API] Drive upload failed:', driveError)
        }

        return NextResponse.json({
            success: !!driveId || !!metadata,
            driveId,
            metadata,
            suggestedId,
            filename,
            debug: {
                extractionError,
                geminiError: geminiErrorDetail,
                driveError: driveErrorDetail
            }
        })

    } catch (error: any) {
        console.error('[Upload API Error]', error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}

```


# File: app/api/inventory/upsert/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { extractDriveId } from '@/lib/drive'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createLog } from "@/lib/audit"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email
    const role = (session?.user as any)?.role?.toUpperCase()

    try {
        const body = await request.json()
        let {
            id, title, type, format, language, duration, year, source,
            pillar, primaryPillar, secondaryPillars,
            sub, competence, behavior, maturity,
            intervention, moment, prereqId, testId, variable, impactScore, outcomeType,
            trigger, recommendation, challengeType, evidenceRequired, nextContentId,
            targetRole, roleLevel, industry, vipUsage, publicVisibility,
            ipOwner, ipType, authorizedUse, confidentiality, reuseExternal,
            driveId, version, observations, transcription,
            status, ip, level,
            forceReason // Special field for Admin bypass
        } = body

        if (!id || !title) {
            return NextResponse.json({ error: 'Missing required fields (ID or Title)' }, { status: 400 })
        }

        const finalPrimaryPillar = primaryPillar || pillar || 'Transversal'
        const finalSecondaryPillars = Array.isArray(secondaryPillars) ? secondaryPillars : []

        // 1. Authorization and State Machine check
        const existingItem = await prisma.contentItem.findUnique({ where: { id } })

        // RBAC: Only Auditor or Admin can set status to 'Validado'
        const normalizedRole = role?.toUpperCase()
        if (status === 'Validado' && normalizedRole !== 'ADMIN' && normalizedRole !== 'AUDITOR') {
            return NextResponse.json({ error: 'Permisos insuficientes: Solo un Auditor puede validar activos.' }, { status: 403 })
        }

        // Lock check for Validated items
        if (existingItem && existingItem.status === 'Validado' && role !== 'ADMIN') {
            return NextResponse.json({ error: 'Activo Validado: Solo administradores pueden modificarlo.' }, { status: 403 })
        }

        // Admin/Auditor Bypass Logging (HU-A-04 Reject/Approve reasons)
        if (forceReason) {
            await createLog('AUDIT_ACTION', userEmail || 'system', `Action: ${status} | Motivo: ${forceReason}`, id)
        } else if (existingItem && existingItem.status === 'Validado' && role === 'ADMIN') {
            return NextResponse.json({ error: 'Admin debe proveer un motivo para editar un activo validado.' }, { status: 400 })
        }

        // 2. Clean and Validate Drive ID
        let cleanDriveId: string | null | undefined = undefined
        if (driveId !== undefined) {
            cleanDriveId = extractDriveId(driveId)
        }

        // 3. Calculate Completeness
        const criticalFields = [
            title, type, finalPrimaryPillar, sub, maturity,
            targetRole, ipOwner, cleanDriveId, version
        ]
        const filledFields = criticalFields.filter(f => f && f !== 'Completar' && f !== '').length
        const totalFields = criticalFields.length
        const completeness = Math.round((filledFields / totalFields) * 100)

        // 4. Data Payload
        const dataPayload: any = {
            title,
            type: type || 'Documento', // Default to 'Documento' as per requirement
            format, language, duration, year, source,
            primaryPillar: finalPrimaryPillar,
            secondaryPillars: finalSecondaryPillars,
            sub, competence, behavior, maturity: maturity || level,
            intervention, moment, prereqId, testId, variable, impactScore, outcomeType,
            trigger, recommendation, challengeType, evidenceRequired, nextContentId,
            targetRole, roleLevel, industry, vipUsage, publicVisibility,
            ipOwner: ipOwner || ip,
            ipType, authorizedUse, confidentiality, reuseExternal,
            version: version || 'v1.0',
            observations,
            transcription,
            status: status || 'Borrador',
            completeness,
            level: maturity || level,
            ip: ipOwner || ip
        }

        if (cleanDriveId !== undefined) {
            dataPayload.driveId = cleanDriveId
        }

        const item = await prisma.contentItem.upsert({
            where: { id },
            update: dataPayload,
            create: { id, ...dataPayload },
        })

        // Log general update
        if (!forceReason) {
            await createLog(existingItem ? 'UPDATE_CONTENT' : 'CREATE_CONTENT', userEmail || 'system', `${item.title} [State: ${item.status}]`, id)
        }

        return NextResponse.json(item)
    } catch (error) {
        console.error('Upsert Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

```


# File: app/api/logs/route.ts
```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function isAdmin() {
    const session = await getServerSession(authOptions)
    return (session?.user as any)?.role === 'admin'
}

export async function GET() {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const logs = await prisma.systemLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        })
        return NextResponse.json(logs)
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}

```


# File: app/api/releases/route.ts
```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const releases = await prisma.methodologyRelease.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { contents: true } } }
        })
        return NextResponse.json(releases)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { tag, description } = await req.json()
        if (!tag) return NextResponse.json({ error: 'Tag is required' }, { status: 400 })

        const release = await prisma.methodologyRelease.create({
            data: {
                tag,
                description,
                status: 'Draft'
            }
        })
        return NextResponse.json(release)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, status, tag, description } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const release = await prisma.methodologyRelease.update({
            where: { id },
            data: { status, tag, description }
        })
        return NextResponse.json(release)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

```


# File: app/api/reports/gap-analysis/route.ts
```typescript
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

```


# File: app/api/research/upsert/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { id, title, apa, url, summary, keyConcepts, findings, methodology, relation4Shine, pillars, driveId, transcription, competence, geographicCoverage, populationParams } = body

        // Simple validation
        if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

        const result = await prisma.researchSource.upsert({
            where: { id: id || 'new' },
            update: {
                title, apa, url, summary,
                keyConcepts, findings, methodology, relation4Shine,
                pillars: pillars || [],
                driveId, transcription,
                competence, geographicCoverage, populationParams
            },
            create: {
                title, apa, url, summary,
                keyConcepts, findings, methodology, relation4Shine,
                pillars: pillars || [],
                driveId, transcription,
                competence, geographicCoverage, populationParams
            }
        })

        return NextResponse.json({ success: true, data: result })
    } catch (error) {
        console.error('Research Upsert Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

```


# File: app/api/settings/route.ts
```typescript

import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SystemSettingsService } from '@/lib/settings'

// GET: Retrieve all settings
export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    // 1. Auth Check (Admin Only)
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {
        const emailConfig = await SystemSettingsService.getEmailConfig()
        const driveConfig = await SystemSettingsService.getDriveConfig()
        const geminiApiKey = await SystemSettingsService.getGeminiApiKey()
        const openaiApiKey = await SystemSettingsService.getOpenAIApiKey()

        // Mask password for security when sending to Client
        const maskedEmailConfig = emailConfig ? {
            ...emailConfig,
            smtpPass: emailConfig.smtpPass ? '********' : ''
        } : null

        return NextResponse.json({
            emailConfig: maskedEmailConfig,
            driveConfig,
            geminiApiKey: geminiApiKey ? '********' : null, // Mask API Key
            openaiApiKey: openaiApiKey ? '********' : null  // Mask API Key
        })
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

// POST: Save settings
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    // 1. Auth Check (Admin Only)
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {

        const body = await req.json()

        // Handle direct config updates (from new UI sections)
        if (body.driveConfig) {
            await SystemSettingsService.saveDriveConfig(body.driveConfig)
            return NextResponse.json({ success: true })
        }

        if (body.geminiApiKey) {
            await SystemSettingsService.saveGeminiApiKey(body.geminiApiKey)
            return NextResponse.json({ success: true })
        }

        if (body.openaiApiKey) {
            await SystemSettingsService.saveOpenAIApiKey(body.openaiApiKey)
            return NextResponse.json({ success: true })
        }



        // Handle legacy type/data format (if still used by older parts)
        const { type, data } = body

        if (type === 'email') {
            // Handle Password: if it's '********', keep the old password
            if (data.smtpPass === '********') {
                const existing = await SystemSettingsService.getEmailConfig()
                if (existing) {
                    data.smtpPass = existing.smtpPass
                }
            }

            await SystemSettingsService.saveEmailConfig({
                smtpHost: data.smtpHost,
                smtpPort: Number(data.smtpPort),
                smtpUser: data.smtpUser,
                smtpPass: data.smtpPass,
                senderName: data.senderName, // Ensure these are saved
                senderEmail: data.senderEmail
            })
        } else if (type === 'drive') {
            // Legacy drive handler
            await SystemSettingsService.saveDriveConfig({
                authorizedFolderIds: data.authorizedFolderIds
                // Note: legacy handler doesn't support serviceAccountJson
            })
        } else {
            return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error saving settings:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
}

```


# File: app/api/settings/test-email/route.ts
```typescript

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendTestEmail } from '@/lib/mail'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    // Check if user is logged in
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    // @ts-ignore - role is added in session callback
    const isAdmin = session.user.role === 'admin' || session.user.email === 'andrestablarico@gmail.com'

    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { config } = body

        if (!config) {
            return NextResponse.json({ error: 'Missing configuration' }, { status: 400 })
        }

        // Send test email to the current admin user
        await sendTestEmail(session.user.email, config)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Failed to send test email:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

```


# File: app/api/taxonomy/route.ts
```typescript
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
        const basePillars = ['Shine In', 'Shine Out', 'Shine Up', 'Shine Beyond']
        let stats = { added: 0, exist: 0, deleted: 0 }

        // Ensure Level 1 Exists (And ONLY these exist)
        for (const name of basePillars) {
            let pillar = await prisma.taxonomy.findFirst({ where: { name, type: 'Pillar' } })
            if (!pillar) {
                await prisma.taxonomy.create({ data: { name, type: 'Pillar', order: 0 } })
                stats.added++
            }
        }

        // Cleanup: Remove any root pillar NOT in basePillars
        const invalidPillars = await prisma.taxonomy.deleteMany({
            where: {
                type: 'Pillar',
                name: { notIn: basePillars }
            }
        })
        if (invalidPillars.count > 0) {
            stats.deleted = invalidPillars.count
            console.log(`[Taxonomy Sync] Removed ${invalidPillars.count} invalid pillars.`)
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

```


# File: app/api/users/request/route.ts
```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendAccessRequestEmail } from '@/lib/mail'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    try {
        const email = session.user.email
        const name = session.user.name || 'Solicitante'

        // Check if already exists
        const existing = await prisma.user.findUnique({ where: { email } })

        if (existing) {
            return NextResponse.json({ message: 'User already exists', role: existing.role })
        }

        // Create as pending (inactive)
        await prisma.user.create({
            data: {
                email,
                name,
                role: 'CURADOR',
                isActive: false
            }
        })

        // Notify Admin
        await sendAccessRequestEmail(email, name)

        return NextResponse.json({ success: true, message: 'Solicitud enviada. Esperando aprobación del administrador.' })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Error requesting access' }, { status: 500 })
    }
}

```


# File: app/api/users/route.ts
```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function isAdmin() {
    const session = await getServerSession(authOptions)
    // Cast to any to access custom role explicitly
    const role = (session?.user as any)?.role
    return role === 'admin'
}

export async function GET() {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(users)
}

export async function POST(req: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    try {
        const body = await req.json()
        const { email, role, name, isActive } = body

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        // Sync with uppercase Enum
        const formattedRole = role ? role.toUpperCase() : undefined

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role: formattedRole as any,
                name,
                isActive: isActive !== undefined ? isActive : undefined
            },
            create: {
                email,
                role: formattedRole as any || 'CURADOR',
                name,
                isActive: isActive !== undefined ? isActive : true
            }
        })
        return NextResponse.json(user)
    } catch (e) {
        console.error('User creation error:', e)
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    try {
        const body = await req.json()
        const { email, role, isActive, name } = body

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        // Safety: Cannot deactivate super admin
        if (email === 'andrestablarico@gmail.com' && isActive === false) {
            return NextResponse.json({ error: 'Cannot deactivate super admin' }, { status: 403 })
        }

        const formattedRole = role ? role.toUpperCase() : undefined

        const user = await prisma.user.update({
            where: { email },
            data: {
                role: formattedRole as any,
                isActive,
                name
            }
        })
        return NextResponse.json(user)
    } catch (e) {
        console.error('User update error:', e)
        return NextResponse.json({ error: 'Error updating user' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
        if (email === 'andrestablarico@gmail.com') return NextResponse.json({ error: 'Cannot delete super admin' }, { status: 403 })

        await prisma.user.delete({ where: { email } })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Error deleting user' }, { status: 500 })
    }
}

```


# File: app/dashboard/loading.tsx
```typescript
import Loading from "@/components/ui/Loading";

export default function DashboardLoading() {
    return <Loading />;
}

```


# File: app/gap-analysis/page.tsx
```typescript
import prisma from '@/lib/prisma'
import MethodologySPA from '@/components/MethodologySPA'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function Page() {
    const session = await getServerSession(authOptions)

    const contents = await prisma.contentItem.findMany({
        orderBy: { id: 'asc' }
    })

    const taxonomy = await prisma.taxonomy.findMany({
        orderBy: { name: 'asc' }
    })

    return <MethodologySPA initialData={contents as any} initialTaxonomy={taxonomy as any} session={session as any} />
}

```


# File: app/generator/page.tsx
```typescript
import prisma from '@/lib/prisma'
import MethodologySPA from '@/components/MethodologySPA'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function Page() {
    const session = await getServerSession(authOptions)

    const contents = await prisma.contentItem.findMany({
        orderBy: { id: 'asc' }
    })

    const taxonomy = await prisma.taxonomy.findMany({
        orderBy: { name: 'asc' }
    })

    const research = await prisma.researchSource.findMany({
        orderBy: { createdAt: 'desc' }
    })

    // Map Prisma result to match the expected type if needed, or cast as any for now to speed up
    return <MethodologySPA initialData={contents as any} initialResearch={research as any} initialTaxonomy={taxonomy as any} session={session as any} />
}

```


# File: app/globals.css
```css
@import "tailwindcss";

:root {
  /* Light Theme Default */
  --bg: #ffffff;
  --panel: #f6f8fa;
  --border: #d0d7de;
  --text-main: #24292f;
  --text-muted: #57606a;

  /* Semantic Colors (Shared/Adjusted) */
  --accent: #0969da;
  /* Darker blue for light mode contrast */
  --success: #1a7f37;
  --warning: #9a6700;
  --danger: #cf222e;
  --purple: #8250df;

  --font-ui: 'Inter', sans-serif;
  --font-code: 'JetBrains Mono', monospace;
}

:root[class~="dark"] {
  /* Dark Theme Professional (Original) */
  --bg: #0d1117;
  --panel: #161b22;
  --border: #30363d;
  --text-main: #c9d1d9;
  --text-muted: #8b949e;

  --accent: #58a6ff;
  --success: #238636;
  --warning: #d29922;
  --danger: #da3633;
  --purple: #bc8cff;
}

@theme {
  --color-bg: var(--bg);
  --color-panel: var(--panel);
  --color-border: var(--border);
  --color-text-main: var(--text-main);
  --color-text-muted: var(--text-muted);
  --color-accent: var(--accent);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --color-purple: var(--purple);

  --font-ui: var(--font-ui);
  --font-code: var(--font-code);
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-main);
  height: 100vh;
  overflow: hidden;
}

/* Custom Utilities */
.glass {
  background: var(--panel-glass);
  backdrop-filter: blur(5px);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Scrollbar matches prototype */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

@keyframes progress-ind {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.animate-progress-ind {
  animation: progress-ind 1.5s infinite linear;
}
```


# File: app/glossary/page.tsx
```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import GlossarySPA from "@/components/GlossarySPA"

export const dynamic = 'force-dynamic'

export default async function GlossaryPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/api/auth/signin")
    }

    const glossaryItems = await prisma.glossaryTerm.findMany({
        orderBy: { term: 'asc' }
    })

    return <GlossarySPA initialItems={glossaryItems} />
}

```


# File: app/inventario/page.tsx
```typescript
import prisma from '@/lib/prisma'
import MethodologySPA from '@/components/MethodologySPA'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function Page() {
    const session = await getServerSession(authOptions)

    const contents = await prisma.contentItem.findMany({
        orderBy: { id: 'asc' }
    })

    const taxonomy = await prisma.taxonomy.findMany({
        orderBy: { name: 'asc' }
    })

    return <MethodologySPA initialData={contents as any} initialTaxonomy={taxonomy as any} session={session as any} />
}

```


# File: app/layout.tsx
```typescript
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Shell from '@/components/Shell'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-main' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: '4Shine • Methodology Builder (Internal)',
  description: 'Sistema de registro y generación de metodología 4Shine.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="es">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased h-screen overflow-hidden`}>
        <Shell session={session}>
          {children}
          <Toaster richColors position="bottom-right" />
        </Shell>
      </body>
    </html>
  )
}

```


# File: app/loading.tsx
```typescript
import Loading from "@/components/ui/Loading";

export default function LoadingPage() {
    return <Loading />;
}

```


# File: app/page.tsx
```typescript
import prisma from '@/lib/prisma'
import MethodologySPA from '@/components/MethodologySPA'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function Page() {
  const session = await getServerSession(authOptions)

  // Fetch initial data from Neon DB
  const contents = await prisma.contentItem.findMany({
    orderBy: { id: 'asc' }
  })

  const taxonomy = await prisma.taxonomy.findMany({
    orderBy: { name: 'asc' }
  })

  // Pass data to the Client Component
  return <MethodologySPA initialData={contents as any} initialTaxonomy={taxonomy as any} session={session as any} />
}

```


# File: app/qa/page.tsx
```typescript
import prisma from '@/lib/prisma'
import MethodologySPA from '@/components/MethodologySPA'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function Page() {
    const session = await getServerSession(authOptions)

    const contents = await prisma.contentItem.findMany({
        orderBy: { id: 'asc' }
    })

    const taxonomy = await prisma.taxonomy.findMany({
        orderBy: { name: 'asc' }
    })

    return <MethodologySPA initialData={contents as any} initialTaxonomy={taxonomy as any} session={session as any} />
}

```


# File: app/releases/page.tsx
```typescript
import prisma from '@/lib/prisma'
import MethodologySPA from '@/components/MethodologySPA'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function Page() {
    const session = await getServerSession(authOptions)

    const contents = await prisma.contentItem.findMany({
        orderBy: { id: 'asc' }
    })

    const taxonomy = await prisma.taxonomy.findMany({
        orderBy: { name: 'asc' }
    })

    return <MethodologySPA initialData={contents as any} initialTaxonomy={taxonomy as any} session={session as any} />
}

```


# File: app/research/page.tsx
```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import MethodologySPA from "@/components/MethodologySPA" // We reuse the SPA component or create a specific one? 
// Actually, it's better to create a specific layout or reuse MethodologySPA with a 'research' mode if possible, 
// OR create a standalone client component for this page to keep it clean. 
// Given the requirements, I'll build a specific client component for Research to keep it focused.

import ResearchSPA from "@/components/ResearchSPA"

export const dynamic = 'force-dynamic'

export default async function ResearchPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/api/auth/signin")
    }

    const researchItems = await prisma.researchSource.findMany({
        orderBy: { title: 'asc' }
    })

    return <ResearchSPA initialItems={researchItems} session={session} />
}

```


# File: app/taxonomy/page.tsx
```typescript
import prisma from '@/lib/prisma'
import MethodologySPA from '@/components/MethodologySPA'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function Page() {
    const session = await getServerSession(authOptions)

    const contents = await prisma.contentItem.findMany({
        orderBy: { id: 'asc' }
    })

    const taxonomyRaw = await prisma.taxonomy.findMany({
        orderBy: { order: 'asc' } // Ensure order is respected
    })

    const researchItems = await prisma.researchSource.findMany({
        orderBy: { title: 'asc' }
    })

    // Build Tree
    const taxonomyTree = taxonomyRaw.map(item => ({ ...item, children: [] as any[] }))
    const dataMap: any = {}
    taxonomyTree.forEach(item => dataMap[item.id] = item)

    const rootNodes: any[] = []
    taxonomyTree.forEach(item => {
        if (item.parentId && dataMap[item.parentId]) {
            dataMap[item.parentId].children.push(item)
        } else {
            rootNodes.push(item)
        }
    })

    // Sort pillars manually if needed, or rely on 'order'
    const shineOrder = ['Shine In', 'Shine Out', 'Shine Up', 'Shine Beyond']
    rootNodes.sort((a, b) => {
        const idxA = shineOrder.indexOf(a.name)
        const idxB = shineOrder.indexOf(b.name)
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        return a.order - b.order
    })

    return <MethodologySPA initialData={contents as any} initialTaxonomy={rootNodes as any} initialResearch={researchItems as any} session={session as any} />
}

```


# File: components/AdminView.tsx
```typescript
'use client'

import { useState, useEffect } from 'react'

type User = {
    email: string
    role: string
    name: string | null
    isActive: boolean
    createdAt: string
}

type EmailConfig = {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
    senderName?: string
    senderEmail?: string
}

type DriveConfig = {
    authorizedFolderIds: string[]
    serviceAccountJson?: string
}

type SystemLog = {
    id: number
    action: string
    details: string | null
    resourceId: string | null
    userEmail: string
    createdAt: string
    user?: { name: string | null, email: string }
}

type HealthInfo = {
    database: { status: string, details: string }
    drive: { status: string, details: string }
    gemini: { status: string, details: string }
}

export default function AdminView() {
    const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'health' | 'logs'>('users')

    // --- USERS STATE ---
    const [users, setUsers] = useState<User[]>([])
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [refreshUsers, setRefreshUsers] = useState(0)

    // Form inputs (Users)
    const [newEmail, setNewEmail] = useState('')
    const [newName, setNewName] = useState('')
    const [newRole, setNewRole] = useState('curador')

    // --- SETTINGS STATE ---
    const [emailConfig, setEmailConfig] = useState<EmailConfig>({ smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '' })
    const [driveConfig, setDriveConfig] = useState<DriveConfig>({ authorizedFolderIds: [] })
    const [geminiApiKey, setGeminiApiKey] = useState('')
    const [openaiApiKey, setOpenaiApiKey] = useState('')
    const [flikiApiKey, setFlikiApiKey] = useState('')
    const [loadingSettings, setLoadingSettings] = useState(false)
    const [refreshSettings, setRefreshSettings] = useState(0)
    const [newFolderId, setNewFolderId] = useState('')

    // --- HEALTH STATE ---
    const [health, setHealth] = useState<HealthInfo | null>(null)
    const [loadingHealth, setLoadingHealth] = useState(false)

    // --- LOGS STATE ---
    const [logs, setLogs] = useState<SystemLog[]>([])
    const [loadingLogs, setLoadingLogs] = useState(false)

    // Fetch Users
    useEffect(() => {
        if (activeTab === 'users') {
            fetch('/api/users')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setUsers(data)
                    setLoadingUsers(false)
                })
                .catch(err => { console.error(err); setLoadingUsers(false) })
        }
    }, [refreshUsers, activeTab])

    // Fetch Settings
    useEffect(() => {
        if (activeTab === 'settings') {
            setLoadingSettings(true)
            fetch('/api/settings')
                .then(res => res.json())
                .then(data => {
                    if (data.emailConfig) setEmailConfig(data.emailConfig)
                    if (data.driveConfig) setDriveConfig(data.driveConfig)
                    if (data.geminiApiKey) setGeminiApiKey(data.geminiApiKey)
                    if (data.openaiApiKey) setOpenaiApiKey(data.openaiApiKey)
                    if (data.flikiApiKey) setFlikiApiKey(data.flikiApiKey)
                    setLoadingSettings(false)
                })
                .catch(err => { console.error(err); setLoadingSettings(false) })
        }
    }, [activeTab, refreshSettings])

    // Fetch Health
    useEffect(() => {
        if (activeTab === 'health') {
            setLoadingHealth(true)
            fetch('/api/health')
                .then(res => res.json())
                .then(data => {
                    setHealth(data)
                    setLoadingHealth(false)
                })
                .catch(err => { console.error(err); setLoadingHealth(false) })
        }
    }, [activeTab])

    // Fetch Logs
    useEffect(() => {
        if (activeTab === 'logs') {
            setLoadingLogs(true)
            fetch('/api/logs')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setLogs(data)
                    setLoadingLogs(false)
                })
                .catch(err => { console.error(err); setLoadingLogs(false) })
        }
    }, [activeTab])

    // --- USER HANDLERS ---
    const handleUpdateUser = async (email: string, updates: Partial<User>) => {
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, ...updates })
            })
            if (res.ok) {
                setRefreshUsers(p => p + 1)
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) { alert('Error de red') }
    }

    const handleAddUser = async () => {
        if (!newEmail) return alert('Email requerido')
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, name: newName, role: newRole })
            })
            if (res.ok) {
                setNewEmail(''); setNewName(''); setRefreshUsers(p => p + 1); alert('Usuario agregado')
            } else {
                const err = await res.json(); alert('Error: ' + err.error)
            }
        } catch (e) { alert('Error de red') }
    }

    const handleApprove = async (email: string, name: string | null) => {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, role: 'curador' })
            })
            if (res.ok) setRefreshUsers(p => p + 1)
        } catch (e) { alert('Error') }
    }

    const handleDelete = async (email: string) => {
        if (!confirm('¿Eliminar acceso a ' + email + '?')) return
        try {
            const res = await fetch(`/api/users?email=${email}`, { method: 'DELETE' })
            if (res.ok) setRefreshUsers(p => p + 1)
            else { const err = await res.json(); alert('Error: ' + err.error) }
        } catch (e) { alert('Error de red') }
    }

    // --- SETTINGS HANDLERS ---
    const saveEmailConfig = async () => {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'email', data: emailConfig })
            })
            if (res.ok) alert('Configuración de correo guardada')
            else alert('Error al guardar')
        } catch (e) { alert('Error de red') }
    }

    const addFolder = async () => {
        if (!newFolderId) return
        const newList = [...driveConfig.authorizedFolderIds, newFolderId]
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'drive', data: { authorizedFolderIds: newList } })
            })
            if (res.ok) {
                setDriveConfig({ ...driveConfig, authorizedFolderIds: newList })
                setNewFolderId('')
            }
        } catch (e) { alert('Error') }
    }

    const removeFolder = async (id: string) => {
        const newList = driveConfig.authorizedFolderIds.filter(f => f !== id)
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'drive', data: { authorizedFolderIds: newList } })
            })
            if (res.ok) setDriveConfig({ ...driveConfig, authorizedFolderIds: newList })
        } catch (e) { alert('Error') }
    }

    // Filter lists
    const pendingUsers = users.filter(u => u.role === 'pending')
    const activeUsers = users.filter(u => u.role !== 'pending')

    return (
        <div className="p-8 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-3">
                🛡️ Panel de Administración
            </h2>

            {/* TABS */}
            <div className="flex border-b border-[var(--border)] mb-6">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'users'
                        ? 'border-[var(--accent)] text-[var(--text-main)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                >
                    Usuarios
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'settings'
                        ? 'border-[var(--accent)] text-[var(--text-main)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                >
                    Configuración
                </button>
                <button
                    onClick={() => setActiveTab('health')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'health'
                        ? 'border-[var(--accent)] text-[var(--text-main)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                >
                    Salud del Sistema
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'logs'
                        ? 'border-[var(--accent)] text-[var(--text-main)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                >
                    Logs
                </button>
            </div>

            {/* CONTENT: USERS */}
            {activeTab === 'users' && (
                <>
                    {/* Pending Requests */}
                    {pendingUsers.length > 0 && (
                        <div className="mb-8 border border-[var(--warning)] bg-[rgba(210,153,34,0.05)] rounded-lg overflow-hidden">
                            <div className="bg-[rgba(210,153,34,0.1)] p-3 border-b border-[var(--warning)] flex gap-2 items-center">
                                <span className="text-xl">🔔</span>
                                <h3 className="font-bold text-[var(--warning)]">Solicitudes Pendientes ({pendingUsers.length})</h3>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {pendingUsers.map(u => (
                                        <tr key={u.email} className="border-b border-[rgba(210,153,34,0.2)] last:border-0 hover:bg-[rgba(210,153,34,0.05)]">
                                            <td className="p-4">
                                                <div className="font-semibold text-[var(--text-main)]">{u.name || 'Sin nombre'}</div>
                                                <div className="text-[var(--text-muted)] text-xs">{u.email}</div>
                                            </td>
                                            <td className="p-4 text-right flex gap-2 justify-end">
                                                <button onClick={() => handleApprove(u.email, u.name)} className="bg-[var(--success)] text-white px-3 py-1.5 rounded text-xs font-semibold hover:brightness-110">✅ Aprobar</button>
                                                <button onClick={() => handleDelete(u.email)} className="bg-[var(--danger)] text-white px-3 py-1.5 rounded text-xs font-semibold hover:brightness-110">❌ Rechazar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Add User Form */}
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5 mb-8">
                        <h3 className="text-sm uppercase text-[var(--text-muted)] font-bold mb-4">Invitar Nuevo Usuario</h3>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Email (Gmail)</label>
                                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="usuario@gmail.com" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre</label>
                                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre Apellido" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                            </div>
                            <div className="w-[150px]">
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Rol</label>
                                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm">
                                    <option value="admin">Admin</option>
                                    <option value="metodologo">Metodólogo</option>
                                    <option value="curador">Curador</option>
                                    <option value="auditor">Auditor</option>
                                </select>
                            </div>
                            <button onClick={handleAddUser} className="bg-[var(--success)] text-white px-4 py-2 rounded text-sm font-semibold h-[38px] hover:brightness-110">Agregar</button>
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-[#1c2128] text-[var(--text-muted)]">
                                <tr>
                                    <th className="p-3 text-left">Usuario</th>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-left">Rol</th>
                                    <th className="p-3 text-left">Fecha Registro</th>
                                    <th className="p-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingUsers && <tr><td colSpan={5} className="p-5 text-center text-[var(--text-muted)]">Cargando...</td></tr>}
                                {activeUsers.map(u => (
                                    <tr key={u.email} className={`border-t border-[var(--border)] hover:bg-white/5 ${!u.isActive ? 'opacity-50 grayscale' : ''}`}>
                                        <td className="p-3">
                                            <div className="font-semibold text-[var(--text-main)]">{u.name || 'Sin nombre'}</div>
                                            <div className="text-[var(--text-muted)] text-xs">{u.email}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateUser(u.email, { isActive: !u.isActive })}
                                                    disabled={u.email === 'andrestablarico@gmail.com'}
                                                    className={`w-10 h-5 rounded-full transition-colors relative ${u.isActive ? 'bg-[var(--success)]' : 'bg-gray-600'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${u.isActive ? 'left-6' : 'left-1'}`} />
                                                </button>
                                                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">{u.isActive ? 'Activo' : 'Inactivo'}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <select
                                                value={u.role.toLowerCase()}
                                                onChange={(e) => handleUpdateUser(u.email, { role: e.target.value })}
                                                disabled={u.email === 'andrestablarico@gmail.com'}
                                                className="bg-bg border border-[var(--border)] rounded px-2 py-1 text-[10px] font-bold uppercase outline-none focus:border-[var(--accent)]"
                                            >
                                                <option value="admin">ADMIN</option>
                                                <option value="metodologo">METODOLOGO</option>
                                                <option value="curador">CURADOR</option>
                                                <option value="auditor">AUDITOR</option>
                                            </select>
                                        </td>
                                        <td className="p-3 text-[var(--text-muted)] text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="p-3 text-right">
                                            {u.email !== 'andrestablarico@gmail.com' && (
                                                <button onClick={() => handleDelete(u.email)} className="text-[var(--danger)] hover:underline text-xs">Revocar</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* CONTENT: SETTINGS */}
            {activeTab === 'settings' && (
                <div className="space-y-8">
                    {loadingSettings && <div className="text-[var(--text-muted)]">Cargando configuración...</div>}

                    {/* EMAIL CONFIG WIZARD */}
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">📧 Configuración de Correo</h3>
                                <p className="text-xs text-[var(--text-muted)] mt-1">Configura el servidor SMTP para enviar notificaciones.</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        if (!emailConfig.smtpHost) return alert('Configura primero el host SMTP');
                                        const btn = e.target as HTMLButtonElement;
                                        const originalText = btn.innerText;
                                        btn.innerText = 'Enviando...';
                                        btn.disabled = true;
                                        try {
                                            const res = await fetch('/api/settings/test-email', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ config: emailConfig })
                                            });
                                            if (res.ok) alert('✅ Correo de prueba enviado exitosamente a tu cuenta.');
                                            else { const err = await res.json(); alert('❌ Error: ' + err.error); }
                                        } catch (er) { alert('Error de red'); }
                                        btn.innerText = originalText;
                                        btn.disabled = false;
                                    }}
                                    className="bg-[#21262d] text-[var(--text-main)] px-3 py-1 rounded text-xs font-semibold hover:brightness-110 border border-[var(--border)]"
                                >
                                    📬 Probar Envío
                                </button>
                                <select
                                    onChange={(e) => {
                                        const provider = e.target.value;
                                        if (provider === 'gmail') {
                                            setEmailConfig(prev => ({ ...prev, smtpHost: 'smtp.gmail.com', smtpPort: 465, smtpUser: '' }));
                                        } else if (provider === 'outlook') {
                                            setEmailConfig(prev => ({ ...prev, smtpHost: 'smtp.office365.com', smtpPort: 587, smtpUser: '' }));
                                        }
                                    }}
                                    className="bg-bg border border-[var(--border)] rounded px-2 py-1 text-xs"
                                >
                                    <option value="custom">Presets: Personalizado</option>
                                    <option value="gmail">Gmail (Recomendado)</option>
                                    <option value="outlook">Outlook / Office 365</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Host SMTP</label>
                                <input value={emailConfig.smtpHost} onChange={e => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })} placeholder="smtp.gmail.com" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Puerto</label>
                                <input type="number" value={emailConfig.smtpPort} onChange={e => setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value) })} placeholder="465" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                            </div>

                            {/* SENDER CUSTOMIZATION */}
                            <div>
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Usuario (Email de envío)</label>
                                <input value={emailConfig.smtpUser} onChange={e => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })} placeholder="tu@email.com" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Contraseña de Aplicación</label>
                                <input type="password" value={emailConfig.smtpPass} onChange={e => setEmailConfig({ ...emailConfig, smtpPass: e.target.value })} placeholder="********" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                            </div>

                            {/* SENDER CUSTOMIZATION */}
                            <div className="col-span-2 pt-2 border-t border-[var(--border)] grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre del Remitente (Opcional)</label>
                                    <input value={emailConfig.senderName || ''} onChange={e => setEmailConfig({ ...emailConfig, senderName: e.target.value })} placeholder="Ej: Soporte TI" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--text-muted)] block mb-1">Email del Remitente (Opcional)</label>
                                    <input value={emailConfig.senderEmail || ''} onChange={e => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })} placeholder="Ej: no-reply@empresa.com" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Si se deja vacío, se usa el Usuario SMTP.</p>
                                </div>
                            </div>

                            <div className="col-span-2 p-3 bg-blue-900/20 border border-blue-900/50 rounded text-xs text-blue-200 mt-2">
                                💡 <strong>Tip para Gmail:</strong> Debes usar una <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline font-bold hover:text-[var(--text-main)]">Contraseña de Aplicación</a>. Si ingresas tu contraseña normal, fallará.
                            </div>
                        </div>
                        <button onClick={saveEmailConfig} className="bg-[var(--accent)] text-white px-4 py-2 rounded text-sm font-bold hover:brightness-110">Guardar Configuración SMTP</button>
                    </div>

                    {/* DRIVE CONFIG WIZARD */}
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5">
                        <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">📂 Carpetas Autorizadas (Google Drive)</h3>

                        <h3 className="text-sm font-bold text-[var(--text-main)] mb-2 flex items-center gap-2 mt-4">
                            🤖 Service Account (JSON de Credenciales)
                        </h3>
                        <div className="bg-bg p-4 rounded-lg border border-[var(--border)] mb-6">
                            <p className="text-xs text-[var(--text-muted)] mb-3">
                                Pega aquí el contenido del archivo JSON de tu Service Account. Este bot debe tener permiso de <strong>"Lector" o "Editor"</strong> sobre la carpeta raíz.
                            </p>
                            <textarea
                                className="w-full h-32 bg-black/50 border border-[var(--border)] rounded p-2 text-[10px] font-mono text-[var(--success)] focus:outline-none focus:border-[var(--accent)] resize-none"
                                placeholder='{ "type": "service_account", "project_id": "...", ... }'
                                value={driveConfig.serviceAccountJson || ''}
                                onChange={e => setDriveConfig({ ...driveConfig, serviceAccountJson: e.target.value })}
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={async () => {
                                        const jsonStr = driveConfig.serviceAccountJson || ''
                                        if (!jsonStr) {
                                            alert('❌ El campo JSON está vacío.')
                                            return
                                        }

                                        try {
                                            const parsed = JSON.parse(jsonStr)
                                            if (parsed.type !== 'service_account') {
                                                alert('⚠️ Advertencia: El JSON no parece ser de una Service Account (falta "type": "service_account"). Verifica que sea el archivo correcto.')
                                                // We allow saving anyway in case google changes format, but warn user.
                                            }

                                            // Save logic
                                            const res = await fetch('/api/settings', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ driveConfig: { ...driveConfig, serviceAccountJson: jsonStr } })
                                            })

                                            if (res.ok) alert('✅ Credenciales guardadas y JSON validado correctamente.')
                                            else alert('❌ Error al guardar en el servidor.')

                                        } catch (e) {
                                            alert('❌ Error de Sintaxis: El texto ingresado no es un JSON válido.\nVerifica comillas y llaves.')
                                        }
                                    }}
                                    className="bg-[var(--accent)] text-white px-4 py-2 rounded text-xs font-bold hover:brightness-110 flex items-center gap-2"
                                >
                                    💾 Guardar Credenciales
                                </button>
                            </div>
                        </div>

                        <div className="mb-6 p-4 bg-bg rounded border border-[var(--border)]">
                            <label className="text-xs text-[var(--text-muted)] block mb-2 font-bold">Asistente de Carpeta</label>
                            <div className="flex gap-2">
                                <input
                                    value={newFolderId}
                                    onChange={e => {
                                        const val = e.target.value;
                                        // Auto-extract ID from URL
                                        if (val.includes('drive.google.com')) {
                                            const match = val.match(/folders\/([-a-zA-Z0-9_]+)/);
                                            if (match && match[1]) {
                                                setNewFolderId(match[1]);
                                                return;
                                            }
                                        }
                                        setNewFolderId(val);
                                    }}
                                    placeholder="Pega aquí la URL de la carpeta o el ID..."
                                    className="flex-1 bg-bg border border-[var(--border)] rounded p-2 text-sm"
                                />
                                <button onClick={addFolder} className="bg-[var(--success)] text-white px-4 py-2 rounded text-sm font-bold hover:brightness-110">Agregar</button>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                Puedes pegar la URL completa (ej: <code>https://drive.google.com/drive/folders/1A2b3C...</code>) y nosotros extraeremos el ID automáticamente.
                            </p>
                        </div>

                        <div className="space-y-2">
                            {driveConfig.authorizedFolderIds.map(id => (
                                <div key={id} className="flex items-center justify-between bg-[#1c2128] p-3 rounded border border-[var(--border)]">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">📁</span>
                                        <div>
                                            <div className="font-mono text-xs text-[var(--text-main)] flex items-center gap-2">
                                                {id}
                                                <button
                                                    onClick={async () => {
                                                        // Simple format check visually for now, could be expanded to server ping
                                                        if (id.length > 20) alert('✅ Formato de ID válido. Asegúrate de que la carpeta sea "Pública" o compartida con la cuenta de servicio.');
                                                        else alert('⚠️ El ID parece demasiado corto.');
                                                    }}
                                                    className="text-[10px] bg-[#21262d] px-1.5 py-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                                    title="Verificar Acceso"
                                                >
                                                    🔍 Verificar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFolder(id)} className="text-[var(--danger)] text-xs hover:underline bg-bg px-2 py-1 rounded border border-[var(--border)]">Eliminar</button>
                                </div>
                            ))}
                            {driveConfig.authorizedFolderIds.length === 0 && (
                                <div className="text-center text-[var(--text-muted)] text-sm py-4 italic">No hay carpetas configuradas. Agrega una arriba.</div>
                            )}
                        </div>

                        {/* AI CONFIG WIZARD */}
                        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5">
                            <h3 className="text-lg font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">🧠 Inteligencia Artificial (Gemini)</h3>
                            <p className="text-xs text-[var(--text-muted)] mb-4">Configura la API Key de Google Gemini para habilitar el auto-análisis de documentos.</p>

                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="text-xs text-[var(--text-muted)] block mb-1 font-bold">Gemini API Key</label>
                                    <input
                                        type="password"
                                        placeholder={geminiApiKey ? '******** (Configurado)' : 'AIza...'}
                                        onChange={e => setGeminiApiKey(e.target.value)}
                                        className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!geminiApiKey) return alert('Ingresa una API Key válida')
                                        try {
                                            const res = await fetch('/api/settings', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ geminiApiKey })
                                            })
                                            if (res.ok) {
                                                alert('✅ API Key de Gemini guardada.')
                                                setGeminiApiKey('') // Clear input for security, UI shows placeholder
                                                // Refresh settings to get the "configured" state if we had one
                                                setRefreshSettings(p => p + 1)
                                            } else {
                                                alert('❌ Error al guardar.')
                                            }
                                        } catch (e) { alert('Error de red') }
                                    }}
                                    className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm font-bold h-[38px] shadow-lg shadow-purple-900/20"
                                >
                                    Guardar Key
                                </button>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                Puedes obtener una clave gratuita en <a href="https://aistudio.google.com/" target="_blank" className="underline hover:text-[var(--accent)]">Google AI Studio</a>.
                            </p>
                        </div>

                        {/* OPENAI CONFIG WIZARD */}
                        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5 mt-5">
                            <h3 className="text-lg font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">🧠 Inteligencia Artificial (OpenAI)</h3>
                            <p className="text-xs text-[var(--text-muted)] mb-4">Configura la API Key de OpenAI para habilitar el compilador avanzado (GPT-4o).</p>

                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="text-xs text-[var(--text-muted)] block mb-1 font-bold">OpenAI API Key</label>
                                    <input
                                        type="password"
                                        placeholder={openaiApiKey && openaiApiKey.includes('*') ? '******** (Configurado)' : 'sk-...'}
                                        onChange={e => setOpenaiApiKey(e.target.value)}
                                        className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!openaiApiKey) return alert('Ingresa una API Key válida')
                                        try {
                                            const res = await fetch('/api/settings', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ openaiApiKey })
                                            })
                                            if (res.ok) {
                                                alert('✅ API Key de OpenAI guardada.')
                                                setOpenaiApiKey('') // Clear input for security
                                                setRefreshSettings(p => p + 1)
                                            } else {
                                                alert('❌ Error al guardar.')
                                            }
                                        } catch (e) { alert('Error de red') }
                                    }}
                                    className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-bold h-[38px] shadow-lg shadow-green-900/20"
                                >
                                    Guardar Key
                                </button>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                Se requiere créditos o una cuenta activada en <a href="https://platform.openai.com/" target="_blank" className="underline hover:text-[var(--accent)]">OpenAI Platform</a>.
                            </p>
                        </div>



                    </div>
                </div>
            )}
            {/* CONTENT: HEALTH */}
            {activeTab === 'health' && (
                <div className="space-y-6">
                    <h3 className="text-sm uppercase text-[var(--text-muted)] font-bold mb-4">Estado de Salud de Integraciones</h3>
                    {loadingHealth && <div className="text-[var(--text-muted)]">Analizando servicios...</div>}
                    {health && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.entries(health).map(([service, info]) => (
                                <div key={service} className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="capitalize font-bold text-[var(--text-main)] text-sm">{service}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${info.status === 'healthy' ? 'bg-green-900/40 text-green-400' :
                                            info.status === 'warning' ? 'bg-yellow-900/40 text-yellow-400' :
                                                'bg-red-900/40 text-red-400'
                                            }`}>
                                            {info.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">{info.details}</p>
                                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${info.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                        <span className="text-[10px] text-[var(--text-muted)] uppercase">Live Check</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* CONTENT: LOGS */}
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    <h3 className="text-sm uppercase text-[var(--text-muted)] font-bold mb-4">Logs de Auditoría (Últimos 100)</h3>
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-[#1c2128] text-[var(--text-muted)]">
                                <tr>
                                    <th className="p-3 text-left">Fecha</th>
                                    <th className="p-3 text-left">Acción</th>
                                    <th className="p-3 text-left">Usuario</th>
                                    <th className="p-3 text-left">Detalles</th>
                                    <th className="p-3 text-left">ID Recurso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingLogs && <tr><td colSpan={5} className="p-5 text-center text-[var(--text-muted)]">Cargando logs...</td></tr>}
                                {logs.map(log => (
                                    <tr key={log.id} className="border-t border-[var(--border)] hover:bg-white/5 text-[11px]">
                                        <td className="p-3 text-[var(--text-muted)] whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-tighter ${log.action.includes('FORCE') ? 'bg-red-900/40 text-red-400 border border-red-800/50' :
                                                log.action.includes('DELETE') ? 'bg-orange-900/40 text-orange-400' :
                                                    'bg-blue-900/40 text-blue-400'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-semibold text-[var(--text-main)] truncate max-w-[120px]" title={log.userEmail}>{log.user?.name || log.userEmail.split('@')[0]}</div>
                                        </td>
                                        <td className="p-3 text-[var(--text-muted)] max-w-[250px] truncate" title={log.details || ''}>{log.details}</td>
                                        <td className="p-3 font-mono text-xs text-[var(--accent)]">{log.resourceId}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && !loadingLogs && (
                                    <tr><td colSpan={5} className="p-10 text-center italic text-[var(--text-muted)]">No se encontraron registros en la auditoría.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

```


# File: components/AnalyticsView.tsx
```typescript
'use client'

import React from 'react'
import { LayoutDashboard, BookOpen } from 'lucide-react'
import ResearchAnalytics from './ResearchAnalytics'
import InventoryAnalytics from './InventoryAnalytics'
import Link from 'next/link'

export default function AnalyticsView({ currentTab = 'inventory' }: { currentTab?: 'inventory' | 'research' }) {

    return (
        <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-accent/30 selection:text-accent pb-20">
            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b-4 border-border px-8 h-20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight leading-none">DASHBOARD DE IMPACTO</h1>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Métricas de Inventario e Investigación</p>
                    </div>
                </div>
            </nav>

            <main className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <div className="flex gap-4 mb-8">
                    <Link
                        href="/analitica/inventario"
                        className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${currentTab === 'inventory'
                            ? 'bg-text-main border-text-main text-bg'
                            : 'bg-card-bg border-border text-text-muted hover:border-text-main/20'
                            }`}
                    >
                        <LayoutDashboard size={14} /> Inventario de Activos
                    </Link>
                    <Link
                        href="/analitica/research"
                        className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${currentTab === 'research'
                            ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                            : 'bg-card-bg border-border text-text-muted hover:border-accent/30 hover:text-accent'
                            }`}
                    >
                        <BookOpen size={14} /> Investigación
                    </Link>
                </div>


                <div className="min-h-[500px]">
                    {currentTab === 'inventory' && <InventoryAnalytics />}
                    {currentTab === 'research' && <ResearchAnalytics />}
                </div>
            </main>
        </div>
    )
}

```


# File: components/CompilerChat.tsx
```typescript
import React, { useState, useRef, useEffect } from 'react'
import { Send, Terminal, Cpu, User, Sparkles, StopCircle, Bot, Loader2, Headphones, Database, Video, Network, FileText, Layers, HelpCircle, Image, Monitor, Table, Check, Globe, ChevronDown, Trash2, Maximize2, Minimize2, X, Download, Code, ZoomIn, ZoomOut, Settings, Mic, Volume2 } from 'lucide-react'

// ... existing code ...

import mermaid from 'mermaid'
import InfographicRenderer from './InfographicRenderer'

type Message = {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}


// Helper Component for Mermaid


// Enhanced Mermaid Component
const MermaidDiagram = ({ chart }: { chart: string }) => {
    const ref = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isZoomed, setIsZoomed] = useState(false)
    const [zoomLevel, setZoomLevel] = useState(1)

    useEffect(() => {
        if (chart) {
            setError(null)
            mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' })
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`

            try {
                mermaid.render(id, chart)
                    .then(({ svg }) => setSvg(svg))
                    .catch((e) => {
                        console.error("Mermaid render error:", e)
                        setError("Error visualizando diagrama. Mostrando código fuente.")
                    })
            } catch (e: any) {
                console.error("Mermaid sync error:", e)
                setError(e.message)
            }
        }
    }, [chart])

    const handleDownloadSVG = () => {
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'diagrama_4shine.svg'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleDownloadPNG = () => {
        const svgElement = ref.current?.querySelector('svg')
        if (!svgElement) return

        // 1. Get exact dimensions
        const box = svgElement.getBoundingClientRect()
        // Use intrinsic dimensions if available, else clientRect
        const width = box.width || parseInt(svgElement.getAttribute('width') || '0')
        const height = box.height || parseInt(svgElement.getAttribute('height') || '0')

        // 2. Clone and Prepare SVG
        const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement
        clonedSvg.setAttribute('width', width.toString())
        clonedSvg.setAttribute('height', height.toString())
        clonedSvg.style.backgroundColor = 'white'

        // 3. EMBED STYLES (Criticial for Mermaid/Canvas)
        const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style")
        let cssText = ""
        // Naive but effective: grab all styles to ensure mermaid classes are present
        const sheets = document.querySelectorAll('style, link[rel="stylesheet"]')
        sheets.forEach(sheet => {
            if (sheet.tagName === 'STYLE') {
                cssText += sheet.textContent + "\n"
            }
        })
        styleElement.textContent = cssText
        clonedSvg.insertBefore(styleElement, clonedSvg.firstChild)

        const data = (new XMLSerializer()).serializeToString(clonedSvg)
        const img = new window.Image()
        const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        img.onload = function () {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const scale = 2 // High Res

            canvas.width = width * scale
            canvas.height = height * scale

            if (ctx) {
                ctx.scale(scale, scale)
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0, width, height)
            }

            const pngUrl = canvas.toDataURL('image/png')
            const downloadLink = document.createElement('a')
            downloadLink.href = pngUrl
            downloadLink.download = 'diagrama_4shine.png'
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
            URL.revokeObjectURL(url)
        }
        img.src = url
    }

    if (error) {
        return (
            <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200 text-xs font-mono">
                <div className="text-red-500 font-bold mb-2">⚠️ {error}</div>
                <pre className="whitespace-pre-wrap text-gray-700">{chart}</pre>
            </div>
        )
    }

    const DiagramContent = () => (
        <div
            dangerouslySetInnerHTML={{ __html: svg }}
            className="w-full flex justify-center"
        />
    )

    return (
        <>
            {/* Standard View */}
            <div className="my-6 relative group" ref={ref}>
                <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

                    {/* Toolbar */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1.5 rounded-lg border border-gray-200 shadow-sm backdrop-blur-sm z-10">
                        <button onClick={handleDownloadSVG} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 tooltip-trigger" title="SVG">
                            <Code size={16} />
                        </button>
                        <button onClick={handleDownloadPNG} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-green-600 tooltip-trigger" title="PNG">
                            <Download size={16} />
                        </button>
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        <button onClick={() => { setIsZoomed(true); setZoomLevel(1); }} className="p-1.5 hover:bg-gray-100 rounded text-blue-500 hover:text-blue-700 tooltip-trigger" title="Ampliar">
                            <Maximize2 size={16} />
                        </button>
                    </div>

                    {/* Diagram */}
                    <div className="overflow-x-auto">
                        <DiagramContent />
                    </div>
                </div>
            </div>

            {/* Modal for Zoom */}
            {isZoomed && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden">

                        {/* Modal Header */}
                        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-gray-50/50 shrink-0">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-gray-700">Vista Detallada</h3>
                                {/* Zoom Controls */}
                                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md p-1">
                                    <button
                                        onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                        title="Reducir"
                                    >
                                        <ZoomOut size={16} />
                                    </button>
                                    <span className="text-xs font-mono w-12 text-center text-gray-500">{Math.round(zoomLevel * 100)}%</span>
                                    <button
                                        onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                        title="Aumentar"
                                    >
                                        <ZoomIn size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={handleDownloadPNG} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                                    <Download size={14} /> Descargar PNG
                                </button>
                                <div className="w-px h-4 bg-gray-300 mx-2" />
                                <button onClick={() => setIsZoomed(false)} className="p-2 hover:bg-gray-200/50 rounded-full text-gray-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body (Scrollable with Zoom) */}
                        <div className="flex-1 overflow-auto bg-graph-paper relative">
                            <div
                                className="min-w-full min-h-full flex items-center justify-center p-20 transition-transform duration-200 ease-out origin-center"
                                style={{ transform: `scale(${zoomLevel})` }}
                            >
                                <div className="bg-white shadow-sm p-4 rounded-lg border border-gray-100">
                                    <DiagramContent />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// --- SUB-COMPONENTS FOR TYPES ---

const FlashcardList = ({ cards }: { cards: any[] }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            {cards.map((card, idx) => (
                <div key={idx} className="bg-white dark:bg-[#1E1F20] p-6 rounded-xl border-2 border-indigo-100 dark:border-indigo-900/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[180px]">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Pregunta</div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{card.question}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Respuesta</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{card.answer}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

const QuizView = ({ questions }: { questions: any[] }) => {
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [showResults, setShowResults] = useState(false)

    return (
        <div className="space-y-6 my-6 max-w-2xl">
            {questions.map((q, idx) => {
                const isCorrect = answers[idx] === q.correctAnswer
                return (
                    <div key={idx} className={`p-6 rounded-2xl border-l-4 ${showResults ? (isCorrect ? 'border-l-emerald-500 bg-emerald-50/10' : 'border-l-red-500 bg-red-50/10') : 'border-l-blue-500 bg-white dark:bg-[#1E1F20]'} shadow-sm`}>
                        <p className="font-bold text-lg mb-4">{idx + 1}. {q.question}</p>
                        <div className="space-y-2">
                            {q.options.map((opt: string) => {
                                const optLetter = opt.charAt(0) // Assuming "A) Answer"
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => setAnswers(p => ({ ...p, [idx]: optLetter }))}
                                        disabled={showResults}
                                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors border ${answers[idx] === optLetter
                                            ? 'bg-blue-100 border-blue-500 text-blue-900'
                                            : 'hover:bg-gray-50 dark:hover:bg-white/5 border-gray-200 dark:border-gray-700'
                                            } ${showResults && q.correctAnswer === optLetter ? '!bg-emerald-100 !border-emerald-500 !text-emerald-900' : ''}`}
                                    >
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>
                        {showResults && (
                            <div className="mt-4 text-xs p-3 bg-black/5 rounded font-mono">
                                {isCorrect ? '✅ Correcto' : `❌ Correcto: ${q.correctAnswer}`}. {q.explanation}
                            </div>
                        )}
                    </div>
                )
            })}
            {!showResults && (
                <button onClick={() => setShowResults(true)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105">
                    Verificar Respuestas
                </button>
            )}
        </div>
    )
}

const PresentationView = ({ slides }: { slides: any[] }) => {
    const [current, setCurrent] = useState(0)
    return (
        <div className="my-6 bg-white dark:bg-[#1E1F20] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden aspect-video flex flex-col">
            <div className="flex-1 p-12 flex flex-col justify-center">
                <div className="uppercase tracking-widest text-xs font-bold text-blue-500 mb-4">Slide {current + 1} / {slides.length}</div>
                <h2 className="text-3xl md:text-4xl font-black mb-8 text-gray-900 dark:text-white">{slides[current].title}</h2>
                <ul className="space-y-4 mb-8">
                    {slides[current].bullets?.map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-lg text-gray-700 dark:text-gray-300">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            {b}
                        </li>
                    ))}
                </ul>
                {slides[current].visual && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg text-xs text-yellow-700 dark:text-yellow-400 italic">
                        📸 Sugerencia Visual: {slides[current].visual}
                    </div>
                )}
            </div>
            <div className="h-16 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
                <button
                    disabled={current === 0}
                    onClick={() => setCurrent(c => c - 1)}
                    className="p-2 hover:bg-black/5 rounded-full disabled:opacity-30"
                >
                    Anterior
                </button>
                <div className="flex gap-1">
                    {slides.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    ))}
                </div>
                <button
                    disabled={current === slides.length - 1}
                    onClick={() => setCurrent(c => c + 1)}
                    className="p-2 hover:bg-black/5 rounded-full disabled:opacity-30"
                >
                    Siguiente
                </button>
            </div>
        </div>
    )
}

const PodcastView = ({ script }: { script: string }) => {
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showConfig, setShowConfig] = useState(false)
    const [selectedVoice, setSelectedVoice] = useState('alloy')

    const voices = [
        { id: 'alloy', name: 'Alloy', desc: 'Neutral/Versátil' },
        { id: 'echo', name: 'Echo', desc: 'Masculino' },
        { id: 'fable', name: 'Fable', desc: 'Británico' },
        { id: 'onyx', name: 'Onyx', desc: 'Profundo' },
        { id: 'nova', name: 'Nova', desc: 'Femenino/Enérgico' },
        { id: 'shimmer', name: 'Shimmer', desc: 'Femenino/Claro' }
    ]

    const generateAudio = async () => {
        setLoading(true)
        setError(null)
        setShowConfig(false)
        try {
            const res = await fetch('/api/audio/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: script, voice: selectedVoice })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Error generando audio')
            }

            // Handle binary response (Blob)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            setAudioUrl(url)

        } catch (e: any) {
            console.error(e)
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-50 dark:bg-[#1E1F20] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Headphones className="text-pink-500" size={20} />
                    <h3 className="font-bold text-gray-700 dark:text-gray-200">Guion de Podcast Generado</h3>
                </div>
                {!audioUrl && (
                    <div className="relative">
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={12} className="animate-spin" /> : <Settings size={12} />}
                            {loading ? 'Generando...' : 'Generar Audio'}
                        </button>
                        {showConfig && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#252627] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-10">
                                <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-2">Selecciona una Voz</h4>
                                <div className="space-y-1 mb-3">
                                    {voices.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVoice(v.id)}
                                            className={`w-full text-left px-2 py-1.5 rounded text-xs flex justify-between items-center ${selectedVoice === v.id ? 'bg-pink-50 text-pink-600' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                        >
                                            <span>{v.name} <span className="opacity-50 text-[9px]">({v.desc})</span></span>
                                            {selectedVoice === v.id && <Check size={10} />}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={generateAudio} className="w-full py-1.5 bg-pink-600 text-white rounded text-xs font-bold hover:bg-pink-700">Confirmar</button>
                            </div>
                        )}
                        {showConfig && <div className="fixed inset-0 z-0" onClick={() => setShowConfig(false)} />}
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                    ⚠️ {error}
                </div>
            )}

            {audioUrl && (
                <div className="mb-6 p-4 bg-white dark:bg-black/20 rounded-xl border border-pink-100 dark:border-pink-900/30">
                    <div className="text-xs font-bold text-pink-500 mb-2 uppercase tracking-wide">Audio Generado</div>
                    <audio controls src={audioUrl} className="w-full h-8" />
                </div>
            )}

            <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-xs bg-transparent border-0 p-0 text-gray-600 dark:text-gray-400">
                    {script}
                </pre>
            </div>
        </div>
    )
}

export default function CompilerChat({ assets = [], research = [] }: { assets?: any[], research?: any[] }) {
    // ... (rest of component state) ...
    // ...
    // Jump to render logic:

    // 1. Initial State: Select ALL validated assets by default
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set())
    const [selectedResearchIds, setSelectedResearchIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (assets.length > 0) {
            const validated = assets.filter(a => a.status === 'Validado').map(a => a.id)
            setSelectedAssetIds(new Set(validated))
        }
    }, [assets])

    const toggleAsset = (id: string) => {
        const next = new Set(selectedAssetIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedAssetIds(next)
    }

    const toggleResearch = (id: string) => {
        const next = new Set(selectedResearchIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedResearchIds(next)
    }

    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [openSections, setOpenSections] = useState<Set<string>>(new Set(['inventory', 'research', 'history']))

    // Agent Configuration State
    const [showAgentSettings, setShowAgentSettings] = useState(false)
    const [agentConfig, setAgentConfig] = useState({
        tone: 'Profesional, Analítico y Directo',
        instructions: ''
    })

    const toggleSection = (section: string) => {
        const next = new Set(openSections)
        if (next.has(section)) next.delete(section)
        else next.add(section)
        setOpenSections(next)
    }

    const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('¿Estás seguro de que quieres eliminar este historial?')) return

        try {
            await fetch(`/api/generator/history?id=${id}`, { method: 'DELETE' })
            setHistory(prev => prev.filter(h => h.id !== id))
        } catch (error) {
            console.error('Failed to delete history', error)
        }
    }

    useEffect(() => {
        // Fetch History
        fetch('/api/generator/history')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setHistory(data)
            })
            .catch(err => console.error(err))
    }, [])

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    role: 'assistant',
                    content: 'Hola. Soy el Motor de Compilación 4Shine. Selecciona tus fuentes y elige un producto para generar.',
                    timestamp: new Date()
                }
            ])
        }
    }, [])
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async (overrideInput?: string, overrideType?: string) => {
        const textToSend = overrideInput || input
        if (!textToSend.trim() || loading) return

        const userMsg: Message = { role: 'user', content: textToSend, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        if (!overrideInput) setInput('')
        setLoading(true)

        // Detect Intent
        let type = overrideType
        if (!type) {
            const clean = textToSend.toLowerCase()
            if (clean.includes('dossier')) type = 'dossier'
            else if (clean.includes('overview') || clean.includes('podcast')) type = 'podcast'
            else if (clean.includes('video')) type = 'video'
            else if (clean.includes('mapa') || clean.includes('mind')) type = 'mindmap'
            else if (clean.includes('flashcard')) type = 'flashcards'
            else if (clean.includes('quiz') || clean.includes('examen')) type = 'quiz'
            else if (clean.includes('infograf')) type = 'infographic'
            else if (clean.includes('presenta')) type = 'presentation'
            else if (clean.includes('matriz') || clean.includes('tabla')) type = 'matrix'
        }

        try {
            const res = await fetch('/api/generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    type: type,
                    selectedAssetIds: Array.from(selectedAssetIds),
                    selectedResearchIds: Array.from(selectedResearchIds),
                    tone: agentConfig.tone,
                    customInstructions: agentConfig.instructions
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error en compilación')

            const aiMsg: Message = {
                role: 'assistant',
                content: data.result,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, aiMsg])

        } catch (error: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ **Error de Compilación:** ${error.message}`,
                timestamp: new Date()
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const studioOptions = [
        { label: 'Resumen de Audio', icon: <Headphones size={20} />, type: 'podcast', desc: 'Conversación tipo podcast' },
        { label: 'Video Briefing', icon: <Video className="text-green-500" size={20} />, type: 'video', desc: 'Guion visual para video' },
        { label: 'Mapa Mental', icon: <Network className="text-purple-500" size={20} />, type: 'mindmap', desc: 'Estructura jerárquica' },
        { label: 'Dossier Ejecutivo', icon: <FileText className="text-orange-500" size={20} />, type: 'dossier', desc: 'Informe estratégico' },
        { label: 'Tarjetas (Flashcards)', icon: <Layers className="text-red-400" size={20} />, type: 'flashcards', desc: 'Ayudas de estudio' },
        { label: 'Cuestionario (Quiz)', icon: <HelpCircle className="text-blue-400" size={20} />, type: 'quiz', desc: 'Evaluación de conocimientos' },
        { label: 'Infografía', icon: <Image className="text-pink-500" size={20} />, type: 'infographic', desc: 'Plan visual estructurado' },
        { label: 'Presentación', icon: <Monitor className="text-yellow-500" size={20} />, type: 'presentation', desc: 'Estructura de diapositivas' },
        { label: 'Tabla de Datos', icon: <Table className="text-blue-600" size={20} />, type: 'matrix', desc: 'Matriz de trazabilidad' },
    ]

    return (
        <div className="flex h-[calc(100vh-140px)] bg-[#F8F9FA] dark:bg-[#1E1F20] text-gray-900 dark:text-gray-100 font-sans transition-colors rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl relative">

            {/* LEFT PANEL: SOURCE SELECTION */}
            <div className="w-[300px] border-r border-border flex flex-col bg-bg hidden md:flex shrink-0">
                {/* 1. Inventory Sources */}
                <div
                    className="p-4 border-b border-border flex justify-between items-center bg-panel/50 cursor-pointer hover:bg-panel transition-colors"
                    onClick={() => toggleSection('inventory')}
                >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2 select-none">
                        <ChevronDown size={14} className={`transition-transform duration-200 ${openSections.has('inventory') ? '' : '-rotate-90'}`} />
                        Inventario ({selectedAssetIds.size})
                    </h3>
                    <div onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                if (selectedAssetIds.size > 0) setSelectedAssetIds(new Set())
                                else setSelectedAssetIds(new Set(assets.filter(a => a.status === 'Validado').map(a => a.id)))
                            }}
                            className="text-[10px] text-accent font-bold hover:underline"
                        >
                            {selectedAssetIds.size > 0 ? 'Ninguna' : 'Todas'}
                        </button>
                    </div>
                </div>
                {openSections.has('inventory') && (
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 border-b border-border min-h-[100px] max-h-[30vh] no-scrollbar">
                        {assets.filter(a => a.status === 'Validado').map(asset => (
                            <div
                                key={asset.id}
                                onClick={() => toggleAsset(asset.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 group hover:shadow-sm ${selectedAssetIds.has(asset.id)
                                    ? 'bg-accent/5 border-accent/20 translate-x-1'
                                    : 'bg-transparent border-transparent hover:bg-panel hover:translate-x-1'
                                    }`}
                            >
                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedAssetIds.has(asset.id) ? 'bg-accent border-accent' : 'border-border'
                                    }`}>
                                    {selectedAssetIds.has(asset.id) && <Check size={10} className="text-white" />}
                                </div>
                                <div className="flex-1">
                                    <div className={`text-xs font-semibold leading-tight ${selectedAssetIds.has(asset.id) ? 'text-accent' : 'text-text-main opacity-80'}`}>
                                        {asset.title}
                                    </div>
                                    <div className="text-[9px] text-text-muted mt-1 opacity-60">{asset.id}</div>
                                </div>
                            </div>
                        ))}
                        {assets.filter(a => a.status === 'Validado').length === 0 && (
                            <div className="text-center p-8 text-xs text-text-muted italic">
                                No hay activos validados.
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Research Sources */}
                <div
                    className="p-4 border-b border-border flex justify-between items-center bg-panel/50 cursor-pointer hover:bg-panel transition-colors"
                    onClick={() => toggleSection('research')}
                >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2 select-none">
                        <ChevronDown size={14} className={`transition-transform duration-200 ${openSections.has('research') ? '' : '-rotate-90'}`} />
                        Investigación ({selectedResearchIds.size})
                    </h3>
                    <div onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                if (selectedResearchIds.size > 0) setSelectedResearchIds(new Set())
                                else setSelectedResearchIds(new Set(research.map(r => r.id)))
                            }}
                            className="text-[10px] text-accent font-bold hover:underline"
                        >
                            {selectedResearchIds.size > 0 ? 'Ninguna' : 'Todas'}
                        </button>
                    </div>
                </div>
                {openSections.has('research') && (
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50/50 dark:bg-black/20 min-h-[100px] max-h-[30vh] no-scrollbar">
                        {research.map(item => (
                            <div
                                key={item.id}
                                onClick={() => toggleResearch(item.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 group hover:shadow-sm ${selectedResearchIds.has(item.id)
                                    ? 'bg-purple-500/10 border-purple-500/30 translate-x-1'
                                    : 'bg-transparent border-transparent hover:bg-panel hover:translate-x-1'
                                    }`}
                            >
                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedResearchIds.has(item.id) ? 'bg-purple-500 border-purple-500' : 'border-border'
                                    }`}>
                                    {selectedResearchIds.has(item.id) && <Check size={10} className="text-white" />}
                                </div>
                                <div className="flex-1">
                                    <div className={`text-xs font-semibold leading-tight ${selectedResearchIds.has(item.id) ? 'text-purple-600 dark:text-purple-400' : 'text-text-main opacity-80'}`}>
                                        {item.title}
                                    </div>
                                    <div className="text-[9px] text-text-muted mt-1 opacity-60 line-clamp-1">{item.url || 'Documento Drive'}</div>
                                </div>
                            </div>
                        ))}
                        {research.length === 0 && (
                            <div className="text-center p-8 text-xs text-text-muted italic">
                                Sin fuentes disponibles.
                            </div>
                        )}
                    </div>
                )}

                {/* 3. History (New Section) */}
                <div
                    className="p-4 border-b border-border flex justify-between items-center bg-panel/50 cursor-pointer hover:bg-panel transition-colors"
                    onClick={() => toggleSection('history')}
                >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2 select-none">
                        <ChevronDown size={14} className={`transition-transform duration-200 ${openSections.has('history') ? '' : '-rotate-90'}`} />
                        Historial Reciente
                    </h3>
                </div>
                {openSections.has('history') && (
                    <div className="flex-1 overflow-y-auto p-0 border-t border-border min-h-[100px] no-scrollbar">
                        {history.map((h: any) => (
                            <div
                                key={h.id}
                                className="p-4 border-b border-border hover:bg-black/5 cursor-pointer group transition-all hover:pl-5 relative"
                                onClick={() => {
                                    setMessages((prev) => [
                                        ...prev,
                                        { role: 'user', content: `(Historial) ${h.prompt}`, timestamp: new Date() },
                                        { role: 'assistant', content: h.response, timestamp: new Date() }
                                    ])
                                }}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-1.5 rounded">{h.type}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-text-muted">{new Date(h.createdAt).toLocaleDateString()}</span>
                                        <button
                                            onClick={(e) => handleDeleteHistory(h.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-text-muted hover:text-red-500 transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-text-main line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                                    {h.prompt}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col relative bg-white dark:bg-[#131314]">

                {/* Header */}
                <header className="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">✨</span>
                        <h1 className="font-medium text-sm tracking-tight text-gray-600 dark:text-gray-300">Notebook 4Shine Studio</h1>
                    </div>
                    <button
                        onClick={() => setShowAgentSettings(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        title="Configuración del Agente"
                    >
                        <Settings size={18} />
                    </button>
                </header>

                {/* Agent Settings Modal */}
                {showAgentSettings && (
                    <div className="absolute top-16 right-6 z-30 w-80 bg-white dark:bg-[#1E1F20] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                <Bot size={16} className="text-blue-500" /> Configuración de Agente
                            </h3>
                            <button onClick={() => setShowAgentSettings(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Tono de Respuesta</label>
                                <select
                                    value={agentConfig.tone}
                                    onChange={e => setAgentConfig(p => ({ ...p, tone: e.target.value }))}
                                    className="w-full text-xs p-2.5 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 outline-none focus:border-blue-500"
                                >
                                    <option>Profesional, Analítico y Directo</option>
                                    <option>Creativo, Inspirador y Visionario</option>
                                    <option>Casual, Cercano y Simplificado</option>
                                    <option>Académico, Riguroso y Detallado</option>
                                    <option>Socrático (Basado en preguntas)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Instrucciones de Sistema</label>
                                <textarea
                                    value={agentConfig.instructions}
                                    onChange={e => setAgentConfig(p => ({ ...p, instructions: e.target.value }))}
                                    placeholder="Ej: Prioriza fuentes de investigación sobre activos internos. Usa analogías deportivas..."
                                    className="w-full text-xs p-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 outline-none focus:border-blue-500 min-h-[80px] resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                            <button
                                onClick={() => setShowAgentSettings(false)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                                Guardar Preferencias
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-[5%] py-8 scroll-smooth">

                    {/* STUDIO GRID (Only show if no messages or just welcome message) */}
                    {messages.length <= 1 && (
                        <div className="max-w-4xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h2 className="text-2xl font-normal text-gray-800 dark:text-white mb-6">Crear nuevo</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {studioOptions.map((opt) => (
                                    <button
                                        key={opt.label}
                                        onClick={() => handleSend(`Generar ${opt.label}`, opt.type)}
                                        className="flex flex-col gap-3 p-4 rounded-2xl bg-white dark:bg-[#1E1F20] border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 text-left group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/30 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-colors">
                                            {opt.icon}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-gray-700 dark:text-gray-200">{opt.label}</div>
                                            <div className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MESSAGES */}
                    <div className="space-y-8 max-w-3xl mx-auto">
                        {messages.slice(1).map((msg, idx) => (
                            <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* Role Label */}
                                <div className="flex items-center gap-3 mb-2">
                                    {msg.role === 'assistant' ? (
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={14} className="text-blue-500" />
                                            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">AI Studio</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <User size={12} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Solicitud</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className={`text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 ${msg.role === 'user' ? 'font-medium text-lg ml-8' : 'ml-8'}`}>
                                    {msg.content.includes('```mermaid') ? (
                                        <div className="w-full">
                                            {msg.content.split('```mermaid')[0]}
                                            <MermaidDiagram chart={msg.content.split('```mermaid')[1].split('```')[0].trim()} />
                                            {msg.content.split('```').slice(2).join('')}
                                        </div>
                                    ) : (msg.content.trim().startsWith('{') || (msg.content.includes('"type"') && msg.content.includes('"sections"'))) ? (
                                        <div className="w-full">
                                            {/* Try to parse even if there is junk around */}
                                            {(() => {
                                                try {
                                                    // Clean potential markdown
                                                    const cleanJson = msg.content.replace(/```json/g, '').replace(/```/g, '').trim()
                                                    const data = JSON.parse(cleanJson)

                                                    // Renderers
                                                    if (data.type === 'mindmap' && data.mermaid) return <MermaidDiagram chart={data.mermaid} />
                                                    if (data.type === 'flashcards' && data.cards) return <FlashcardList cards={data.cards} />
                                                    if (data.type === 'quiz' && data.questions) return <QuizView questions={data.questions} />
                                                    if (data.type === 'presentation' && data.slides) return <PresentationView slides={data.slides} />

                                                    // Infographic Fallback
                                                    if (data.sections && data.sections.length > 0) {
                                                        return <InfographicRenderer data={data} />
                                                    }

                                                    // DEBUG FALLBACK: Show Raw JSON if structure is unrecognized
                                                    return (
                                                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                                            <div className="text-xs font-bold text-orange-600 mb-2">Estructura JSON No Reconocida (Debug v3.1 - Priority Fix):</div>
                                                            <pre className="text-[10px] font-mono whitespace-pre-wrap text-gray-700 bg-white p-2 rounded border border-orange-100">
                                                                {JSON.stringify(data, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )

                                                } catch (e) {
                                                    // Fallback to text if not really json
                                                    return msg.content.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)
                                                }
                                            })()}
                                        </div>
                                    ) : msg.content.includes('**HOST:**') || msg.content.includes('graph TD') || msg.content.includes('|') ? (
                                        msg.content.includes('**HOST:**') ? (
                                            <PodcastView script={msg.content} />
                                        ) : (
                                            <div className="bg-gray-50 dark:bg-[#1E1F20] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-sm">
                                                <pre className="whitespace-pre-wrap font-mono text-xs">{msg.content}</pre>
                                            </div>
                                        )
                                    ) : (
                                        msg.content.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="ml-8 flex items-center gap-3 animate-pulse opacity-80">
                                <img src="https://imageneseiconos.s3.us-east-1.amazonaws.com/iconos/loading.gif" alt="Loading..." className="w-6 h-6 object-contain" />
                                <span className="text-xs font-semibold text-blue-500 uppercase tracking-widest">Generando...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-20" />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 px-[15%] pointer-events-none sticky bottom-0 z-20">
                    <div className="pointer-events-auto relative shadow-2xl shadow-blue-500/10 rounded-3xl bg-white/90 dark:bg-[#1E1F20]/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/30 transition-all duration-300">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Haz una pregunta o describe lo que quieres generar..."
                            className="w-full bg-transparent border-none text-base p-4 pr-12 focus:ring-0 resize-none max-h-32 min-h-[56px] placeholder:text-gray-400 rounded-3xl"
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                        >
                            {loading ? <StopCircle size={18} /> : <Send size={18} />}
                        </button>
                    </div>
                    <div className="text-center mt-2 text-[10px] text-gray-400 font-medium pb-2">
                        Notebook 4Shine Studio • Model GPT-4o
                    </div>
                </div>
            </div>
        </div >
    )
}

```


# File: components/ContentForm.tsx
```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Fingerprint,
    Brain,
    Rocket,
    Zap,
    Users,
    Scale,
    FileText,
    Search,
    X,
    Cloud,
    Folder,
    Sparkles,
    CheckCircle2,
    ExternalLink,
    Loader2,
    Database,
    Tag,
    Clock,
    Globe,
    BookOpen,
    Terminal,
    ShieldCheck,
    Lock as LockIcon,
    History as HistoryIcon,
    ChevronRight,
    ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'

// --- TYPES ---
export type ResearchSource = {
    id: string
    title: string
    url?: string | null
    summary?: string | null
    keyConcepts?: string | null
    competence?: string | null
    geographicCoverage?: string | null
    populationParams?: string | null
    driveId?: string | null
    findings?: string | null
    pillars?: string[]
}

export type ContentItem = {
    id: string
    title: string
    type: string
    format?: string | null
    language?: string | null
    duration?: string | null
    year?: string | null
    source?: string | null

    pillar?: string // Legacy or temporary
    primaryPillar: string
    secondaryPillars: string[]
    sub?: string | null
    competence?: string | null
    behavior?: string | null
    maturity?: string | null // replacing level

    intervention?: string | null
    moment?: string | null
    prereqId?: string | null
    testId?: string | null
    variable?: string | null
    impactScore?: boolean | null
    outcomeType?: string | null

    trigger?: string | null
    recommendation?: string | null
    challengeType?: string | null
    evidenceRequired?: string | null
    nextContentId?: string | null

    targetRole?: string | null
    roleLevel?: string | null
    industry?: string | null
    vipUsage?: boolean | null
    publicVisibility?: boolean | null

    ipOwner?: string | null
    ipType?: string | null
    authorizedUse?: string | null
    confidentiality?: string | null
    reuseExternal?: boolean | null

    ip?: string | null // Legacy support
    level?: string | null // Legacy support

    driveId?: string | null
    version: string
    observations?: string | null
    transcription?: string | null

    status: string
    completeness: number
    createdAt?: Date | string
}

type DriveFile = {
    id: string
    name: string
    mimeType: string
}

type Props = {
    initialData?: ContentItem | null
    onClose: () => void
    onSave: () => void
    readOnly?: boolean
}

const TABS = [
    { id: 'identity', label: 'Identificación', icon: <Fingerprint size={14} /> },
    { id: 'classification', label: 'Clasificación', icon: <Brain size={14} /> },
    { id: 'trajectory', label: 'Trayectoria', icon: <Rocket size={14} /> },
    { id: 'activation', label: 'Activación', icon: <Zap size={14} /> },
    { id: 'audience', label: 'Audiencia', icon: <Users size={14} /> },
    { id: 'governance', label: 'Gob & IP', icon: <Scale size={14} /> },
    { id: 'context', label: 'Contexto', icon: <FileText size={14} /> },
    { id: 'transcription', label: 'Transcripción', icon: <Terminal size={14} /> },
]

// --- EXTRACTED COMPONENTS ---
const FormInput = ({ label, value, onChange, placeholder, icon, width = 'full', disabled = false, readOnly = false }: any) => (
    <div className={width === 'half' ? 'col-span-1' : 'col-span-2'}>
        <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mb-2 pl-1 italic">{label}</label>
        <div className="relative group">
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50 group-hover:text-accent transition-colors">{icon}</div>}
            <input
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className={`w-full bg-bg border-2 border-border rounded-xl p-3 text-sm text-text-main focus:border-accent outline-none transition-all ${icon ? 'pl-10' : ''} ${(disabled || readOnly) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:border-border/80'}`}
                placeholder={!readOnly ? placeholder : ''}
                disabled={disabled || readOnly}
            />
        </div>
    </div>
)

const FormMultiSelect = ({ label, value = [], onChange, options, readOnly = false }: any) => {
    const toggleOption = (opt: string) => {
        if (readOnly) return
        const newValues = value.includes(opt)
            ? value.filter((v: string) => v !== opt)
            : [...value, opt]
        onChange(newValues)
    }

    return (
        <div className="col-span-2">
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mb-3 pl-1 italic">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map((opt: string) => (
                    <button
                        key={opt}
                        onClick={() => toggleOption(opt)}
                        disabled={readOnly}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${value.includes(opt)
                            ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                            : 'bg-bg border-border text-text-muted hover:border-accent/40'
                            } ${readOnly ? 'cursor-default opacity-80' : ''}`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    )
}

const FormSelect = ({ label, value, onChange, options, icon, width = 'half', readOnly = false }: any) => (
    <div className={width === 'half' ? 'col-span-1' : 'col-span-2'}>
        <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mb-2 pl-1 italic">{label}</label>
        <div className="relative group">
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50 group-hover:text-accent transition-colors">{icon}</div>}
            <select
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                disabled={readOnly}
                className={`w-full bg-panel border-2 border-border rounded-xl p-3 text-sm text-text-main outline-none focus:border-accent transition-all appearance-none ${!readOnly ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${icon ? 'pl-10' : ''}`}
            >
                <option value="">{readOnly ? '' : 'Seleccionar...'}</option>
                {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
            {!readOnly && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted/40 group-hover:text-accent transition-colors">
                    <ChevronDown size={14} />
                </div>
            )}
        </div>
    </div>
)

export default function ContentForm({ initialData, onClose, onSave, readOnly = false }: Props) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('identity')

    const [formData, setFormData] = useState<Partial<ContentItem>>({
        id: '', title: '', type: 'PDF', version: 'v1.0', status: 'Borrador', completeness: 0,
        primaryPillar: 'Transversal', secondaryPillars: [], maturity: 'Básico', ipOwner: 'Propio',
        ...initialData
    })

    const isEdit = !!initialData

    // Drive Picker State
    const [showPicker, setShowPicker] = useState(false)
    const [pickerFiles, setPickerFiles] = useState<DriveFile[]>([])
    const [loadingPicker, setLoadingPicker] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)

    // Folder Navigation State
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [folderHistory, setFolderHistory] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'Inicio' }])

    // Derived States
    const [driveStatus, setDriveStatus] = useState<'idle' | 'validating' | 'valid'>('idle')
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        if (formData.driveId) setDriveStatus('valid')
    }, [formData.driveId])

    // --- HANDLERS ---
    const handleSaveInternal = async (overrideStatus?: string) => {
        try {
            const payload = { ...formData, status: overrideStatus || formData.status }
            const res = await fetch('/api/inventory/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (res.ok) onSave()
            else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) { alert('Network Error') }
    }

    const fetchDriveFiles = async (folderId?: string) => {
        setLoadingPicker(true)
        try {
            const url = folderId ? `/api/inventory/drive-files?folderId=${folderId}` : '/api/inventory/drive-files'
            const res = await fetch(url)
            const data = await res.json()
            if (Array.isArray(data)) setPickerFiles(data)
        } catch (e) { console.error(e) }
        setLoadingPicker(false)
    }

    const openPicker = async () => {
        if (readOnly) return
        setShowPicker(true)
        // Reset to root on open
        setCurrentFolderId(null)
        setFolderHistory([{ id: 'root', name: 'Inicio' }])
        fetchDriveFiles()
    }

    const handleFolderClick = (folder: DriveFile) => {
        setCurrentFolderId(folder.id)
        setFolderHistory(prev => [...prev, { id: folder.id, name: folder.name }])
        fetchDriveFiles(folder.id)
    }

    const handleBreadcrumbClick = (index: number) => {
        const target = folderHistory[index]
        const newHistory = folderHistory.slice(0, index + 1)
        setFolderHistory(newHistory)

        if (target.id === 'root') {
            setCurrentFolderId(null)
            fetchDriveFiles()
        } else {
            setCurrentFolderId(target.id)
            fetchDriveFiles(target.id)
        }
    }

    const selectFile = (file: DriveFile) => {
        setFormData(prev => ({ ...prev, driveId: file.id, title: prev.title || file.name })) // Auto-fill title if empty
        setShowPicker(false)
    }

    const handleAutoAnalyze = async (source: 'drive' | 'transcription' = 'drive') => {
        if (readOnly) return
        if (source === 'drive' && !formData.driveId) return alert('Primero selecciona un archivo de Drive')
        if (source === 'transcription' && !formData.transcription) return alert('Primero ingresa texto en la pestaña Transcripción')

        setAnalyzing(true)
        try {
            const body = source === 'drive'
                ? { driveId: formData.driveId }
                : { transcription: formData.transcription }

            const res = await fetch('/api/inventory/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            // Checks for HTTP Errors first
            if (!res.ok) {
                if (res.status === 504) throw new Error('Timeout: El video es demasiado pesado. Intenta un archivo más pequeño.')
                if (res.status === 413) throw new Error('El archivo es demasiado grande (413).')
                if (res.status === 405) throw new Error('Error 405: API Route Not Found.')

                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || `Error ${res.status}: Fallo en el servidor`)
            }

            const data = await res.json()

            // --- ASYNC VIDEO HANDLING ---
            if (data.async && data.contentId) {
                toast.loading('El video se está procesando en la nube (esto puede tomar varios minutos)...', { duration: 10000 })

                let attempts = 0
                const maxAttempts = 120 // 10 mins approx

                while (attempts < maxAttempts) {
                    attempts++
                    await new Promise(r => setTimeout(r, 5000)) // Wait 5s

                    const pollRes = await fetch('/api/inventory/poll', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contentId: data.contentId })
                    })

                    if (!pollRes.ok) continue

                    const pollData = await pollRes.json()

                    if (pollData.status === 'COMPLETED') {
                        toast.dismiss()
                        toast.success('¡Video procesado exitosamente!')

                        setTimeout(() => {
                            const targetId = pollData.data?.suggestedId || data.contentId
                            if (pollData.data) {
                                localStorage.setItem(`temp_content_${targetId}`, JSON.stringify(pollData.data))
                            }
                            router.push(`/dashboard/inventory/edit/${targetId}?new=true`)
                        }, 500)
                        return
                    }

                    if (pollData.status === 'ERROR') {
                        toast.dismiss()
                        throw new Error('Fallo en el procesamiento del video en la nube.')
                    }
                }
                toast.dismiss()
                throw new Error('Tiempo de espera agotado. El video sigue procesándose en segundo plano.')
            }
            // -----------------------------

            const json = data
            if (json.success && json.data) {
                applyMetadata(json.data)
                if (json.suggestedId) {
                    setFormData(prev => ({ ...prev, id: json.suggestedId }))
                }
                alert('✨ Análisis Completo: Metadatos sugeridos aplicados.')
            } else {
                throw new Error(json.error || 'No se pudo analizar el contenido.')
            }
        } catch (e: any) {
            console.error(e)
            alert(`🛑 Error al procesar: ${e.message}`)
        }
        setAnalyzing(false)
    }

    const applyMetadata = (data: any) => {
        setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
            type: data.type || prev.type,
            primaryPillar: data.primaryPillar || prev.primaryPillar,
            secondaryPillars: data.secondaryPillars || prev.secondaryPillars || [],
            sub: data.sub || prev.sub,
            competence: data.competence || prev.competence,
            maturity: data.maturity || prev.maturity,
            targetRole: data.targetRole || prev.targetRole,
            observations: data.observations || data.summary || prev.observations,
            transcription: data.transcription || prev.transcription,
            duration: data.duration || prev.duration,
            completeness: data.completeness || prev.completeness,
        }))
    }

    // --- HELPER HANDLER FOR UPDATING FIELDS ---
    const updateField = (field: keyof ContentItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-500 animate-in fade-in">
            <div className="bg-panel border border-border w-full max-w-5xl rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col h-[85vh] overflow-hidden group">
                {/* Header */}
                <div className="p-8 border-b border-border flex justify-between items-center bg-bg/80 backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                            <Database size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-text-main tracking-tighter">
                                {readOnly ? `Consultar Detalles: ${formData.id}` : (isEdit ? `Editar Activo: ${formData.id}` : 'Nuevo Activo Metodológico')}
                            </h2>
                            <p className="text-[11px] font-black text-text-muted uppercase tracking-widest mt-1 opacity-60">Configuración Centralizada de Metadatos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {formData.driveId && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-success/5 text-success border border-success/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                <Cloud size={14} /> Drive Conectado
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full border border-border hover:bg-panel hover:text-danger hover:border-danger/30 transition-all flex items-center justify-center"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Main Layout: Tabs + Content */}
                {/* Main Layout: Tabs + Content */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Mobile Tabs (Horizontal) */}
                    <div className="md:hidden w-full border-b border-border bg-bg/50 overflow-x-auto no-scrollbar py-2 px-4 flex items-center gap-2 shrink-0">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                    : 'text-text-muted bg-panel border border-border'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Desktop Sidebar Tabs */}
                    <div className="hidden md:block w-[260px] border-r border-border bg-bg/50 overflow-y-auto no-scrollbar py-6 px-3 space-y-2 shrink-0">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-widest flex items-center justify-between rounded-2xl transition-all group/tab ${activeTab === tab.id
                                    ? 'bg-accent text-white shadow-xl shadow-accent/20'
                                    : 'text-text-muted hover:bg-accent/5 hover:text-accent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover/tab:scale-110 opacity-60'}`}>{tab.icon}</span>
                                    {tab.label}
                                </div>
                                {activeTab === tab.id && <CheckCircle2 size={12} className="opacity-50" />}
                            </button>
                        ))}

                        {!readOnly && (
                            <div className="mt-10 mx-2 p-5 bg-panel border-2 border-dashed border-border rounded-3xl text-center group/ai">
                                <div className="w-10 h-10 bg-bg border border-border rounded-xl flex items-center justify-center mx-auto mb-3 text-accent group-hover/ai:scale-110 group-hover/ai:border-accent transition-all">
                                    <Sparkles size={18} />
                                </div>
                                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-relaxed mb-2">Asistente IA</div>
                                <p className="text-[9px] text-text-muted italic opacity-60 leading-relaxed mb-4">Analiza estructuras de Drive automáticamente.</p>
                                <button
                                    onClick={() => handleAutoAnalyze('drive')}
                                    disabled={analyzing || !formData.driveId}
                                    className="w-full bg-accent/10 text-accent border border-accent/20 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    {analyzing ? 'Procesando...' : 'Autocompletar (Drive)'}
                                </button>
                                <button
                                    onClick={() => handleAutoAnalyze('transcription')}
                                    disabled={analyzing || !formData.transcription}
                                    className="w-full mt-2 bg-purple-500/10 text-purple-600 border border-purple-500/20 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    {analyzing ? '...' : 'Analizar Transcripción'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-bg/20 no-scrollbar">
                        <div className="max-w-3xl mx-auto">

                            {activeTab === 'identity' && (
                                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="p-8 bg-accent/5 border border-accent/10 rounded-[32px] space-y-6">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-sm font-black text-accent uppercase tracking-widest flex items-center gap-2">
                                                <Cloud size={16} /> Vinculación de Archivo
                                            </h3>
                                            {!readOnly && (
                                                <button
                                                    onClick={openPicker}
                                                    className="bg-bg border border-border hover:border-accent text-text-main text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2"
                                                >
                                                    <Folder size={14} /> Explorar Drive
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative group/id">
                                            <Cloud className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40" size={16} />
                                            <input
                                                value={formData.driveId || ''}
                                                onChange={e => setFormData({ ...formData, driveId: e.target.value })}
                                                placeholder="ID de Google Drive..."
                                                disabled={readOnly}
                                                className={`w-full bg-bg border-2 border-border/60 rounded-2xl p-4 text-xs font-mono pl-12 focus:border-accent transition-all outline-none ${readOnly ? 'opacity-60' : 'hover:border-accent/40'}`}
                                            />
                                            {formData.driveId && (
                                                <a href={`https://drive.google.com/open?id=${formData.driveId}`} target="_blank" className="absolute right-4 top-1/2 -translate-y-1/2 text-accent hover:underline text-[10px] font-bold flex items-center gap-1">
                                                    Ver <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormInput label="Identificador Único" value={formData.id} onChange={(v: string) => updateField('id', v)} placeholder="4S-P-001" icon={<Tag size={16} />} disabled={isEdit} readOnly={readOnly} />
                                        <FormInput label="Título Oficial del Activo" value={formData.title} onChange={(v: string) => updateField('title', v)} placeholder="Manual Maestro..." icon={<BookOpen size={16} />} readOnly={readOnly} />

                                        <FormSelect label="Categoría Técnica" value={formData.type} onChange={(v: string) => updateField('type', v)} options={['PDF', 'Video', 'Audio', 'Toolkit', 'Test', 'Plantilla']} icon={<FileText size={16} />} readOnly={readOnly} />
                                        <FormInput label="Extensión / Formato" value={formData.format} onChange={(v: string) => updateField('format', v)} placeholder="PNG, PDF..." width="half" icon={<Terminal size={16} />} readOnly={readOnly} />

                                        <FormInput label="Lenguaje" value={formData.language} onChange={(v: string) => updateField('language', v)} placeholder="Spanish (Latam)" width="half" icon={<Globe size={16} />} readOnly={readOnly} />
                                        <FormInput label="Duración Estimada" value={formData.duration} onChange={(v: string) => updateField('duration', v)} placeholder="90 min" width="half" icon={<Clock size={16} />} readOnly={readOnly} />

                                        <FormInput label="Ciclo / Año" value={formData.year} onChange={(v: string) => updateField('year', v)} placeholder="2025" width="half" icon={<Tag size={16} />} readOnly={readOnly} />
                                        <FormInput label="Origen / Autor" value={formData.source} onChange={(v: string) => updateField('source', v)} placeholder="Propio" width="half" icon={<Users size={16} />} readOnly={readOnly} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'classification' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <FormSelect label="Pilar Metodológico Principal" value={formData.primaryPillar} onChange={(v: string) => updateField('primaryPillar', v)} options={['Shine In', 'Shine Out', 'Shine Up', 'Shine Beyond', 'Transversal']} width="full" icon={<Fingerprint size={16} />} readOnly={readOnly} />
                                    <FormMultiSelect label="Pilares de Apoyo (Secundarios)" value={formData.secondaryPillars} onChange={(v: string[]) => updateField('secondaryPillars', v)} options={['Shine In', 'Shine Out', 'Shine Up', 'Shine Beyond', 'Transversal']} readOnly={readOnly} />
                                    <FormInput label="Subcomponente" value={formData.sub} onChange={(v: string) => updateField('sub', v)} placeholder="Liderazgo, IA..." icon={<Database size={16} />} readOnly={readOnly} />
                                    <FormInput label="Competencia Clave" value={formData.competence} onChange={(v: string) => updateField('competence', v)} placeholder="Negociación" icon={<Brain size={16} />} readOnly={readOnly} />
                                    <FormInput label="Conducta Observable" value={formData.behavior} onChange={(v: string) => updateField('behavior', v)} placeholder="Aplica marcos ágiles..." width="full" icon={<Users size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Escala de Madurez" value={formData.maturity} onChange={(v: string) => updateField('maturity', v)} options={['Básico', 'En Desarrollo', 'Avanzado', 'Maestría']} icon={<Zap size={16} />} readOnly={readOnly} />
                                </div>
                            )}

                            {activeTab === 'trajectory' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <FormSelect label="Modalidad de Intervención" value={formData.intervention} onChange={(v: string) => updateField('intervention', v)} options={['Conciencia', 'Práctica', 'Herramienta', 'Evaluación']} icon={<Rocket size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Momento del Journey" value={formData.moment} onChange={(v: string) => updateField('moment', v)} options={['Inicio', 'Refuerzo', 'Profundización', 'Cierre']} icon={<Clock size={16} />} readOnly={readOnly} />
                                    <FormInput label="ID Prerrequisito" value={formData.prereqId} onChange={(v: string) => updateField('prereqId', v)} placeholder="4S-000" width="half" icon={<LockIcon size={16} />} readOnly={readOnly} />
                                    <FormInput label="ID Test Predictivo" value={formData.testId} onChange={(v: string) => updateField('testId', v)} placeholder="T-01" width="half" icon={<CheckCircle2 size={16} />} readOnly={readOnly} />
                                    <FormInput label="Variable a Medir" value={formData.variable} onChange={(v: string) => updateField('variable', v)} placeholder="Networking..." width="full" icon={<Zap size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Tipo de Output" value={formData.outcomeType} onChange={(v: string) => updateField('outcomeType', v)} options={['Insight', 'Acción', 'Evidencia', 'Score']} icon={<FileText size={16} />} readOnly={readOnly} />
                                </div>
                            )}

                            {activeTab === 'activation' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <FormInput label="Disparador Lógico (Trigger)" value={formData.trigger} onChange={(v: string) => updateField('trigger', v)} placeholder="Score < 60%" width="full" icon={<Zap size={16} />} readOnly={readOnly} />
                                    <FormInput label="Regla de Recomendación" value={formData.recommendation} onChange={(v: string) => updateField('recommendation', v)} placeholder="IF logic..." width="full" icon={<Brain size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Naturaleza del Reto" value={formData.challengeType} onChange={(v: string) => updateField('challengeType', v)} options={['Reflexivo', 'Práctico', 'Aplicado']} icon={<Rocket size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Evidencia Necesaria" value={formData.evidenceRequired} onChange={(v: string) => updateField('evidenceRequired', v)} options={['Texto', 'Archivo', 'Video', 'No aplica']} icon={<FileText size={16} />} readOnly={readOnly} />
                                </div>
                            )}

                            {activeTab === 'audience' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <FormSelect label="Perfil Destinatario" value={formData.targetRole} onChange={(v: string) => updateField('targetRole', v)} options={['Líder', 'Mentor', 'Facilitador', 'Metodólogo']} width="full" icon={<Users size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Nivel Jerárquico" value={formData.roleLevel} onChange={(v: string) => updateField('roleLevel', v)} options={['Junior', 'Senior', 'Experto', 'C-Level']} icon={<LockIcon size={16} />} readOnly={readOnly} />
                                    <FormInput label="Segmento Industria" value={formData.industry} onChange={(v: string) => updateField('industry', v)} placeholder="Multisectorial" width="half" icon={<Globe size={16} />} readOnly={readOnly} />
                                </div>
                            )}

                            {activeTab === 'governance' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <FormInput label="Titular de Propiedad Intelectual" value={formData.ipOwner} onChange={(v: string) => updateField('ipOwner', v)} placeholder="4Shine Global" width="full" icon={<Scale size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Régimen de IP" value={formData.ipType} onChange={(v: string) => updateField('ipType', v)} options={['Derecho de autor', 'Know-how', 'Licencia', 'Adaptación']} icon={<Fingerprint size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Alcance de Uso" value={formData.authorizedUse} onChange={(v: string) => updateField('authorizedUse', v)} options={['Formación interna', 'Consultoría', 'Venta']} icon={<Globe size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Nivel de Confidencialidad" value={formData.confidentiality} onChange={(v: string) => updateField('confidentiality', v)} options={['Baja', 'Media', 'Alta', 'Restringida']} icon={<ShieldCheck size={16} />} readOnly={readOnly} />
                                </div>
                            )}

                            {activeTab === 'context' && (
                                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                                            <FileText size={16} />
                                        </div>
                                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Observaciones Pedagógicas</h3>
                                    </div>
                                    <textarea
                                        value={formData.observations || ''}
                                        onChange={e => setFormData({ ...formData, observations: e.target.value })}
                                        className={`w-full h-80 bg-bg border-4 border-border rounded-[32px] p-8 text-sm text-text-main focus:border-accent outline-none resize-none transition-all shadow-inner leading-relaxed italic ${readOnly ? 'opacity-80' : ''}`}
                                        placeholder="Define aquí la intención didáctica, notas de facilitación y contexto técnico para el despliegue de este activo..."
                                        disabled={readOnly}
                                    ></textarea>
                                </div>
                            )}

                            {activeTab === 'transcription' && (
                                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                                            <Terminal size={16} />
                                        </div>
                                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Transcripción de Audio/Video</h3>
                                    </div>
                                    <div className="relative w-full h-[500px]">
                                        <textarea
                                            value={formData.transcription || ''}
                                            onChange={e => setFormData({ ...formData, transcription: e.target.value })}
                                            className="w-full h-full bg-bg border-4 border-border rounded-[32px] p-8 text-sm text-text-main/80 shadow-inner leading-relaxed font-mono focus:border-accent outline-none resize-none transition-all placeholder:text-text-muted/30"
                                            placeholder="No hay transcripción disponible. Importa un video o audio de Drive para generarla automáticamente, o pega aquí el texto manualmente..."
                                            disabled={readOnly}
                                        />
                                        {!formData.transcription && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30 text-center p-8">
                                                <Terminal size={48} className="mb-4 text-text-muted" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Footer */}
                {readOnly ? (
                    <div className="p-8 border-t border-border bg-bg flex justify-end px-12">
                        <button
                            onClick={onClose}
                            className="bg-accent text-white px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Cerrar Visualización
                        </button>
                    </div>
                ) : (
                    <div className="p-8 border-t border-border bg-bg flex justify-between items-center px-12">
                        <div className="flex items-center gap-6">
                            <div className="h-2 w-40 bg-border/40 rounded-full overflow-hidden">
                                <div className="bg-accent h-full transition-all duration-1000" style={{ width: `${formData.completeness}%` }}></div>
                            </div>
                            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">
                                Índice de Densidad de Datos: <span className="text-accent ml-1">{formData.completeness}%</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleSaveInternal('Borrador')}
                                className="px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-text-main border-2 border-transparent hover:border-border rounded-2xl transition-all"
                            >
                                Guardar Borrador
                            </button>
                            {formData.status === 'Borrador' && (
                                <button
                                    onClick={() => handleSaveInternal('Revisión')}
                                    className="bg-purple-600 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <ShieldCheck size={14} />
                                    Solicitar Revisión
                                </button>
                            )}
                            <button
                                onClick={() => handleSaveInternal()}
                                className="bg-accent text-white px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-accent/30 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {isEdit ? 'Guardar Cambios' : 'Confirmar Activo'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DRIVE PICKER MODAL OVERLAY */}
            {showPicker && (
                <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-2xl flex items-center justify-center p-12 transition-all animate-in zoom-in-95 duration-300">
                    <div className="bg-panel border border-border rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden">
                        <div className="p-8 border-b border-border flex justify-between items-center bg-bg/80 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                                    <Cloud size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-text-main tracking-tight text-xl">Drive Resource Explorer</h3>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">Navega el repositorio documental 4Shine</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPicker(false)}
                                className="w-8 h-8 rounded-full hover:bg-panel hover:text-danger transition-all flex items-center justify-center"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* BREADCRUMBS */}
                        <div className="px-8 py-3 border-b border-border bg-gray-50/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {folderHistory.map((item, idx) => (
                                <div key={item.id} className="flex items-center text-xs whitespace-nowrap">
                                    <button
                                        onClick={() => handleBreadcrumbClick(idx)}
                                        className={`hover:bg-gray-200 px-2 py-1 rounded-md transition-colors ${idx === folderHistory.length - 1 ? 'font-bold text-gray-800' : 'text-gray-500'}`}
                                    >
                                        {item.name}
                                    </button>
                                    {idx < folderHistory.length - 1 && <ChevronRight size={12} className="text-gray-400 mx-1" />}
                                </div>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                            {loadingPicker ? (
                                <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-30">
                                    <Loader2 size={32} className="animate-spin mb-4" />
                                    <div className="text-[10px] font-black uppercase tracking-widest">Sincronizando con Cloud Storage...</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {pickerFiles.map(file => {
                                        const isFolder = file.mimeType === 'application/vnd.google-apps.folder' || file.mimeType === 'application/vnd.google-apps.shortcut'

                                        return (
                                            <button
                                                key={file.id}
                                                onClick={() => isFolder ? handleFolderClick(file) : selectFile(file)}
                                                className="flex items-center justify-between p-4 hover:bg-accent/5 rounded-[20px] text-left group transition-all border border-transparent hover:border-accent/20"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${isFolder ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'bg-white border border-gray-200 text-gray-500'
                                                        }`}>
                                                        {isFolder ? <Folder size={20} fill="currentColor" className="opacity-80" /> : <FileText size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-text-main group-hover:text-accent tracking-tight transition-colors">{file.name}</div>
                                                        {!isFolder && <div className="text-[10px] font-mono text-text-muted opacity-60 mt-0.5">{file.id}</div>}
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-accent/10 opacity-0 group-hover:opacity-100 flex items-center justify-center text-accent transition-all">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </button>
                                        )
                                    })}
                                    {pickerFiles.length === 0 && (
                                        <div className="py-20 text-center text-text-muted italic opacity-40">
                                            Carpeta vacía.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

```


# File: components/GeneratorCards.tsx
```typescript
'use client'

import React, { useState } from 'react'
import { FileText, Table, FolderOpen, Terminal, Download, Loader2, Copy, X } from 'lucide-react'

type GenType = 'dossier' | 'matrix' | 'toolkit'

export default function GeneratorCards() {
    const [loading, setLoading] = useState(false)
    const [consoleLog, setConsoleLog] = useState<string[]>([])
    const [result, setResult] = useState<{ type: GenType, content: string } | null>(null)

    const generators = [
        {
            id: 'dossier',
            label: 'Dossier (PDF)',
            desc: 'Narrativa ejecutiva y resumen de impacto.',
            icon: <FileText size={20} className="text-blue-400" />
        },
        {
            id: 'matrix',
            label: 'Matriz (Excel)',
            desc: 'Tabla estructurada de trazabilidad.',
            icon: <Table size={20} className="text-green-400" />
        },
        {
            id: 'toolkit',
            label: 'Toolkit (ZIP)',
            desc: 'Estructura de carpetas y guía de implementación.',
            icon: <FolderOpen size={20} className="text-yellow-400" />
        }
    ]

    const addLog = (msg: string) => setConsoleLog(prev => [...prev.slice(-4), msg])

    const handleGenerate = async (type: GenType) => {
        setLoading(true)
        setResult(null)
        setConsoleLog([])

        try {
            addLog(`[INIT] Iniciando motor de compilación para: ${type.toUpperCase()}...`)
            addLog(`[DB] Consultando activos VALIDADOS en Neon (PostgreSQL)...`)

            // Simulating a slight delay for UX perception of "work"
            await new Promise(r => setTimeout(r, 800))
            addLog(`[AI] Conectando con Gemini 1.5 Pro (Context Window 1M)...`)

            const res = await fetch('/api/generator', {
                method: 'POST',
                body: JSON.stringify({ type })
            })

            if (!res.ok) throw new Error(await res.text())

            const data = await res.json()
            addLog(`[SUCCESS] Procesados ${data.count} activos exitosamente.`)
            setResult({ type, content: data.result })

        } catch (error: any) {
            addLog(`[ERROR] ${error.message}`)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (result) {
            navigator.clipboard.writeText(result.content)
            alert('Contenido copiado al portapapeles.')
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {generators.map((gen) => (
                    <div
                        key={gen.id}
                        onClick={() => !loading && handleGenerate(gen.id as GenType)}
                        className={`
                            bg-panel border border-border rounded-xl p-6 flex flex-col gap-4 cursor-pointer 
                            transition-all duration-300 group relative overflow-hidden
                            ${loading ? 'opacity-50 pointer-events-none' : 'hover:border-accent hover:-translate-y-1 hover:shadow-lg'}
                        `}
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            {gen.icon}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/5 rounded-lg border border-white/10 group-hover:bg-accent/10 group-hover:border-accent/30 transition-colors">
                                {gen.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm uppercase tracking-wide text-text-main">{gen.label}</h3>
                                <p className="text-[10px] text-text-muted mt-0.5 font-mono">v1.0 (Snapshot)</p>
                            </div>
                        </div>

                        <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                            {gen.desc}
                        </p>

                        <div className="mt-auto pt-4 border-t border-border flex justify-between items-center text-[10px] font-mono text-text-muted">
                            <span>AUTO-GENERADO</span>
                            <span className="text-accent group-hover:translate-x-1 transition-transform">INICIAR &rarr;</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Console / Output Area */}
            <div className="bg-black/80 rounded-xl border border-border overflow-hidden shadow-2xl backdrop-blur-sm min-h-[150px]">
                {/* Console Header */}
                <div className="bg-white/5 border-b border-border px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-blue-400">
                        <Terminal size={12} />
                        <span className="uppercase font-bold tracking-widest">Consola de Compilación</span>
                    </div>
                    <div className="flex gap-1.5 code-dots">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                </div>

                {/* Console Body */}
                <div className="p-6 font-mono text-xs space-y-2 max-h-[400px] overflow-y-auto">
                    {/* Idle State */}
                    {!loading && consoleLog.length === 0 && !result && (
                        <div className="text-center text-text-muted py-8 opacity-40">
                            Esperando instrucción de compilación...
                        </div>
                    )}

                    {/* Logs */}
                    {consoleLog.map((log, i) => (
                        <div key={i} className={`
                            ${log.includes('[ERROR]') ? 'text-red-400' :
                                log.includes('[SUCCESS]') ? 'text-green-400' : 'text-text-muted'}
                        `}>
                            <span className="opacity-50 mr-2">{new Date().toLocaleTimeString()}</span>
                            {log}
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="flex items-center gap-2 text-accent animate-pulse mt-4">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Procesando contexto con IA...</span>
                        </div>
                    )}

                    {/* Result View */}
                    {result && !loading && (
                        <div className="mt-6 border-t border-white/10 pt-6 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-white font-bold flex items-center gap-2">
                                    Resultado Generado: <span className="text-accent uppercase">{result.type}</span>
                                </h4>
                                <div className="flex gap-2">
                                    <button onClick={copyToClipboard} className="p-1.5 hover:bg-white/10 rounded-md text-text-muted hover:text-white transition-colors" title="Copiar">
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 text-text-muted overflow-auto max-h-[300px] whitespace-pre-wrap border border-white/5 text-[11px]">
                                {result.content}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

```


# File: components/GlossaryForm.tsx
```typescript
'use client'

import React, { useState } from 'react'
import { X, Save, Sparkles, Book, Layers, Loader2 } from 'lucide-react'

interface GlossaryTerm {
    id: string
    term: string
    definition: string
    pillars: string[]
    source?: string
}

interface Props {
    initialData?: GlossaryTerm
    onClose: () => void
    onSave: () => void
}

export default function GlossaryForm({ initialData, onClose, onSave }: Props) {
    const [formData, setFormData] = useState<Partial<GlossaryTerm>>({
        term: '',
        definition: '',
        pillars: [],
        ...initialData
    })
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        if (!formData.term) return alert('Ingresa un término primero.')
        setIsGenerating(true)
        try {
            const res = await fetch('/api/glossary/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term: formData.term })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setFormData(prev => ({
                ...prev,
                definition: data.definition,
                pillars: data.pillars || []
            }))
        } catch (e: any) {
            alert('Error generando definición: ' + e.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSaveInternal = async () => {
        try {
            const res = await fetch('/api/glossary/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) onSave()
            else alert('Error guardando')
        } catch (e) { alert('Network Error') }
    }

    const togglePillar = (pillar: string) => {
        setFormData(prev => {
            const current = prev.pillars || []
            const newPillars = current.includes(pillar)
                ? current.filter(p => p !== pillar)
                : [...current, pillar]
            return { ...prev, pillars: newPillars }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-bg w-full max-w-2xl rounded-[32px] border-4 border-border shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="h-16 border-b-4 border-border flex items-center justify-between px-8 bg-card-bg">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                            <Book size={16} />
                        </div>
                        <h2 className="text-sm font-black text-text-main uppercase tracking-widest">
                            {initialData ? 'Editar Término' : 'Nuevo Concepto'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-text-muted transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Término / Concepto</label>
                        <div className="flex gap-2">
                            <input
                                value={formData.term || ''}
                                onChange={e => setFormData({ ...formData, term: e.target.value })}
                                className="flex-1 h-12 bg-bg border-4 border-border rounded-xl px-4 text-lg font-bold text-text-main focus:border-accent outline-none"
                                placeholder="Ej: Liderazgo Resonante"
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !formData.term}
                                className={`px-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all
                                    ${isGenerating ? 'bg-gray-100 text-gray-400' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}
                                `}
                            >
                                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {isGenerating ? 'Generando...' : 'Generar con IA'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Definición (4Shine Context)</label>
                        <textarea
                            value={formData.definition || ''}
                            onChange={e => setFormData({ ...formData, definition: e.target.value })}
                            className="w-full h-40 bg-bg border-2 border-border rounded-xl p-4 text-sm text-text-main focus:border-accent outline-none resize-none leading-relaxed"
                            placeholder="Definición del concepto..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-accent uppercase tracking-widest pl-1 mb-2">Pilares Relacionados</label>
                        <div className="flex flex-wrap gap-2">
                            {['Shine In', 'Shine Out', 'Shine Up', 'Shine Beyond'].map((pillar) => {
                                const isSelected = formData.pillars?.includes(pillar)
                                return (
                                    <button
                                        key={pillar}
                                        onClick={() => togglePillar(pillar)}
                                        className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2
                                            ${isSelected
                                                ? 'bg-accent/10 border-accent text-accent'
                                                : 'bg-bg border-border text-text-muted hover:border-accent/50'
                                            }`}
                                    >
                                        {pillar}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="h-20 border-t-4 border-border px-8 flex items-center justify-end bg-card-bg">
                    <button
                        onClick={handleSaveInternal}
                        className="bg-accent text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-accent/20"
                    >
                        <Save size={16} />
                        Guardar Término
                    </button>
                </div>

            </div>
        </div>
    )
}

```


# File: components/GlossarySPA.tsx
```typescript
'use client'

import React, { useState } from 'react'
import { Search, Plus, Book, Trash2, Edit3, Filter, X } from 'lucide-react'
import GlossaryForm from './GlossaryForm'

export default function GlossarySPA({ initialItems }: any) {
    const [items, setItems] = useState(initialItems)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [viewingItem, setViewingItem] = useState<any>(null)

    const filteredItems = items.filter((item: any) =>
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar término?')) return
        try {
            await fetch(`/api/glossary?id=${id}`, { method: 'DELETE' })
            setItems(items.filter((i: any) => i.id !== id))
        } catch (e) { alert('Error eliminando') }
    }

    const handleSaveComplete = () => {
        window.location.reload()
    }

    // Helper to render markdown links [Label](url)
    const renderWithLinks = (text: string) => {
        if (!text) return ''
        const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
        return parts.map((part, i) => {
            const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
            if (match) {
                return (
                    <a
                        key={i}
                        href={match[2]}
                        className="text-accent underline font-bold hover:text-indigo-600 transition-colors"
                    >
                        {match[1]}
                    </a>
                )
            }
            return part
        })
    }

    return (
        <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-accent/30 selection:text-accent pb-20">

            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b-4 border-border px-8 h-20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 text-white">
                        <Book size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight leading-none">GLOSARIO 4SHINE</h1>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Definiciones y Conceptos Clave</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Buscar término..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-64 h-10 bg-card-bg border-2 border-border rounded-full pl-10 pr-4 text-xs font-bold text-text-main focus:w-80 focus:border-accent transition-all outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 text-text-muted group-focus-within:text-accent transition-colors" size={16} />
                    </div>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="h-10 px-6 bg-text-main text-bg rounded-full text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-lg hover:shadow-accent/50 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Nuevo Término
                    </button>

                    <a href="/analitica" className="text-xs font-bold text-text-muted hover:text-accent transition-colors">
                        Volver
                    </a>
                </div>
            </nav>

            {/* Grid */}
            <main className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map((item: any) => (
                        <div
                            key={item.id}
                            onClick={() => setViewingItem(item)}
                            className="bg-card-bg border-2 border-transparent hover:border-accent rounded-[24px] p-6 hover:shadow-xl transition-all duration-300 group flex flex-col h-[280px] cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-xl font-bold tracking-tight text-text-main group-hover:text-accent transition-colors line-clamp-2">
                                    {item.term}
                                </h3>
                                <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingItem(item) }}
                                        className="p-2 hover:bg-black/5 rounded-full text-text-muted transition-colors"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                                        className="p-2 hover:bg-red-50 rounded-full text-red-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="text-sm text-text-muted leading-relaxed line-clamp-5 flex-1 mb-4 overflow-hidden mask-linear-fade">
                                {renderWithLinks(item.definition)}
                            </div>

                            <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                                <div className="flex flex-wrap gap-2">
                                    {item.pillars?.map((p: string) => (
                                        <span key={p} className="text-[9px] font-black uppercase tracking-widest bg-accent/5 text-accent px-2 py-1 rounded-md">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest group-hover:text-accent transition-colors">
                                    Ver Completo
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* View Modal */}
            {viewingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-bg w-full max-w-2xl rounded-[32px] border-4 border-border shadow-2xl flex flex-col overflow-hidden relative max-h-[90vh]">
                        <div className="h-20 border-b-4 border-border flex items-center justify-between px-8 bg-card-bg shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                    <Book size={20} />
                                </div>
                                <h2 className="text-lg font-black text-text-main tracking-tight">
                                    {viewingItem.term}
                                </h2>
                            </div>
                            <button onClick={() => setViewingItem(null)} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-text-muted transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            <div className="prose prose-sm max-w-none text-text-main leading-relaxed">
                                <div className="whitespace-pre-wrap text-base">
                                    {renderWithLinks(viewingItem.definition)}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-3">
                                {viewingItem.pillars?.map((p: string) => (
                                    <span key={p} className="text-xs font-black uppercase tracking-widest bg-accent/10 text-accent px-3 py-1.5 rounded-lg border border-accent/20">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {(isCreating || editingItem) && (
                <GlossaryForm
                    initialData={editingItem}
                    onClose={() => { setIsCreating(false); setEditingItem(null) }}
                    onSave={handleSaveComplete}
                />
            )}
        </div>
    )
}

```


# File: components/HeatmapView.tsx
```typescript
'use client'

import React from 'react'
import {
    Grid3X3,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Info,
    ChevronDown
} from 'lucide-react'

type HeatmapProps = {
    subcomponents: any[]
    maturityLevels: string[]
    heatmap: Record<string, Record<string, { count: number, status: 'red' | 'yellow' | 'green' }>>
}

export default function HeatmapView({ subcomponents, maturityLevels, heatmap }: HeatmapProps) {
    return (
        <div className="max-w-7xl mx-auto text-left">
            <header className="mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                    <Grid3X3 size={28} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-text-main tracking-tighter">Monitoreo de Cobertura</h2>
                    <p className="text-sm text-text-muted mt-1 font-medium">Identifica brechas y gestiona la madurez de la competencia 4Shine.</p>
                </div>
            </header>

            <div className="bg-panel border border-border rounded-[32px] overflow-hidden shadow-2xl relative">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-panel/80 backdrop-blur-sm border-b border-border">
                                <th className="p-6 text-left text-[11px] font-black text-text-muted uppercase tracking-[0.2em] border-r border-border min-w-[240px]">
                                    <div className="flex items-center gap-2">
                                        Subcomponente <ChevronDown size={12} className="opacity-50" />
                                    </div>
                                </th>
                                {maturityLevels.map(lvl => (
                                    <th key={lvl} className="p-6 text-center text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{lvl}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {subcomponents.map(sub => (
                                <tr key={sub.id} className="border-b border-border/40 hover:bg-bg/40 transition-colors group">
                                    <td className="p-6 border-r border-border bg-panel/30">
                                        <div className="text-[14px] font-black text-text-main group-hover:text-accent transition-colors tracking-tight">{sub.name}</div>
                                        <div className="text-[9px] text-accent mt-1.5 font-black uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                            {sub.parent?.name || 'Top Level'}
                                        </div>
                                    </td>
                                    {maturityLevels.map(lvl => {
                                        const node = heatmap[sub.name]?.[lvl]
                                        if (!node) return <td key={lvl} className="p-4 text-center opacity-10">
                                            <div className="w-full h-12 rounded-xl bg-border/20" />
                                        </td>

                                        const { count, status } = node
                                        const bgClass = status === 'green' ? 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                                            : status === 'yellow' ? 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20'
                                                : 'bg-danger/10 text-danger border-danger/30 hover:bg-danger/20'

                                        return (
                                            <td key={lvl} className="p-4 text-center">
                                                <div className={`inline-flex flex-col items-center justify-center w-full min-h-[64px] rounded-2xl border transition-all hover:scale-[1.05] hover:shadow-xl active:scale-95 ${bgClass} cursor-pointer group/cell`}>
                                                    <span className="text-xl font-black tracking-tighter">{count}</span>
                                                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                        <span className="text-[8px] font-black uppercase tracking-widest">
                                                            {status === 'red' ? 'Solicitar' : 'Explorar'}
                                                        </span>
                                                        <ArrowRight size={8} />
                                                    </div>
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <LegendCard
                    icon={<CheckCircle2 size={16} />}
                    color="bg-success"
                    label="Validado"
                    desc="Al menos 1 contenido verificado por experto (V3)."
                />
                <LegendCard
                    icon={<AlertCircle size={16} />}
                    color="bg-warning"
                    label="En Proceso"
                    desc="Activos en etapa de borrador o revisión técnica activa."
                />
                <LegendCard
                    icon={<XCircle size={16} />}
                    color="bg-danger"
                    label="Brecha Crítica"
                    desc="Sin contenidos asociados o desactualizados (P0)."
                />
                <LegendCard
                    icon={<Info size={16} />}
                    color="bg-border"
                    label="Acción"
                    desc="Acceso rápido a flujos de curación o peticiones AI."
                />
            </div>
        </div>
    )
}

function LegendCard({ icon, color, label, desc }: { icon: React.ReactNode, color: string, label: string, desc: string }) {
    return (
        <div className="bg-panel border border-border p-6 rounded-3xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-accent/40">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-xl ${color} text-white flex items-center justify-center shadow-lg shadow-black/5`}>
                    {icon}
                </div>
                <span className="text-[13px] font-black text-text-main uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed font-medium">{desc}</p>
        </div>
    )
}

```


# File: components/InfographicRenderer.tsx
```typescript
import React from 'react'
import { Map, BarChart, PieChart, TrendingUp, Users, Target, CheckCircle, AlertTriangle, Lightbulb, Zap } from 'lucide-react'

// Icon mapping helper
const IconMap: any = {
    map: Map,
    chart: BarChart,
    pie: PieChart,
    trend: TrendingUp,
    users: Users,
    target: Target,
    check: CheckCircle,
    alert: AlertTriangle,
    idea: Lightbulb,
    zap: Zap
}

type InfographicData = {
    title: string;
    intro: string;
    sections: {
        title: string;
        content: string;
        icon?: string;
        stats?: { label: string; value: string }[];
        chart?: { type: 'bar' | 'pie'; data: { name: string; value: number }[] };
    }[];
    conclusion: string;
}

export default function InfographicRenderer({ data }: { data: InfographicData }) {
    if (!data) return null;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-6 font-sans">
            {/* HERDER */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-10 text-white">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{data.title}</h1>
                <p className="text-lg md:text-xl opacity-90 font-light leading-relaxed max-w-3xl">{data.intro}</p>
            </div>

            {/* SECTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-12 bg-slate-50 dark:bg-black/20">
                {(!data.sections || data.sections.length === 0) && (
                    <div className="col-span-full py-12 text-center opacity-50">
                        <AlertTriangle className="mx-auto mb-4 text-amber-500" size={48} />
                        <p className="text-xl font-bold mb-2">Generación Incompleta</p>
                        <p className="text-sm">La IA no generó secciones detalladas para este contenido. Intenta regenerar o agregar más contexto.</p>
                    </div>
                )}
                {data.sections?.map((section, idx) => {
                    const Icon = section.icon && IconMap[section.icon] ? IconMap[section.icon] : Zap
                    const isFullWidth = idx === (data.sections?.length || 0) - 1 && (data.sections?.length || 0) % 2 !== 0

                    return (
                        <div
                            key={idx}
                            className={`flex flex-col gap-4 bg-white dark:bg-[#1E1F20] p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow ${isFullWidth ? 'md:col-span-2' : ''}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{section.title}</h3>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                {section.content}
                            </p>

                            {/* STATS */}
                            {section.stats && section.stats.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    {section.stats.map((stat, sIdx) => (
                                        <div key={sIdx} className="bg-slate-50 dark:bg-black/30 p-3 rounded-lg text-center border border-slate-100 dark:border-slate-800">
                                            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                                                {stat.value}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* SIMPLE CHARTS */}
                            {section.chart && section.chart.data && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Datos Clave</h4>
                                    <div className="space-y-2">
                                        {section.chart.data.map((item, cIdx) => (
                                            <div key={cIdx} className="relative">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                                                    <span className="text-slate-500">{item.value}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                                                        style={{ width: `${Math.min(item.value, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* FOOTER */}
            <div className="p-8 md:p-10 bg-slate-900 text-white text-center">
                <div className="max-w-2xl mx-auto">
                    <h3 className="text-lg font-bold mb-3 opacity-90">Conclusión</h3>
                    <p className="text-sm opacity-70 leading-relaxed">{data.conclusion}</p>
                </div>
            </div>
        </div>
    )
}

```


# File: components/InventoryAnalytics.tsx
```typescript

'use client'

import React, { useState, useEffect } from 'react'
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Treemap, Cell, Legend, ScatterChart, Scatter, ZAxis,
    PieChart, Pie
} from 'recharts'
import { Loader2, LayoutDashboard, Target, Layers, ArrowRight, BookOpen } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

// Custom Content for Treemap
const CustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, name, value } = props;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: depth < 2 ? COLORS[index % COLORS.length] : 'none',
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {depth === 1 ? (
                <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={14}>
                    {name}
                </text>
            ) : null}
            {depth > 1 ? (
                <text x={x + 4} y={y + 18} fill="#fff" fontSize={8} fillOpacity={0.9}>
                    {name} ({value})
                </text>
            ) : null}
        </g>
    );
};

export default function InventoryAnalytics() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/analytics/inventory')
            .then(res => res.json())
            .then(json => {
                setData(json.stats)
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }, [])

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-accent" size={48} /></div>
    if (!data) return <div className="text-center p-12 text-text-muted">No hay suficientes datos para generar analítica.</div>

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* KPI HEADERS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[24px] p-6 text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <LayoutDashboard size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Activos Totales</span>
                    </div>
                    <div className="text-4xl font-black">{data.total}</div>
                </div>
                {/* Add more KPIs if needed */}
            </div>

            {/* SECTION 1: COBERTURA METODOLÓGICA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2.1 Radar: Cobertura por Pilar */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Target size={18} className="text-accent" />
                        Cobertura por Pilar (Radar)
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.pillarDist}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                                <Radar name="Activos" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-xs text-text-muted italic text-center">
                        Muestra el balance entre los 4 pilares Shine. Un polígono regular indica equilibrio.
                    </div>
                </div>

                {/* 2.2 Heatmap: Pilar x Madurez (Using Bar Stacked as proxy for readability or Custom Table) */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Layers size={18} className="text-orange-500" />
                        Madurez por Pilar
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.maturityMatrix} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Bar dataKey="Básico" stackId="a" fill="#82ca9d" />
                                <Bar dataKey="En Desarrollo" stackId="a" fill="#ffc658" />
                                <Bar dataKey="Avanzado" stackId="a" fill="#8884d8" />
                                <Bar dataKey="Maestría" stackId="a" fill="#FF8042" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 2.3 Treemap: Cobertura Taxonómica (ENHANCED VISIBILITY) */}
            <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">
                    Árbol de Cobertura Taxonómica (Treemap)
                </h3>
                {/* INCREASED HEIGHT FOR BETTER VISIBILITY */}
                <div className="h-[600px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={data.treeMap}
                            dataKey="size"
                            aspectRatio={4 / 3}
                            stroke="#fff"
                            fill="#8884d8"
                            content={<CustomizedContent />}
                        >
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                        </Treemap>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-xs text-text-muted text-center max-w-2xl mx-auto">
                    Este mapa muestra la densidad de activos por Subcomponente (Cajas Grandes) y Competencias (Cajas Pequeñas).
                    <br />
                    <strong>Tamaño</strong> = Cantidad de Activos. <strong>Color</strong> = Pilar Principal.
                </div>
            </div>

            {/* NEW SECTION: CATEGORÍA TÉCNICA */}
            <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Layers size={18} className="text-pink-500" />
                    Distribución por Categoría Técnica
                </h3>
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="h-80 flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.typeDist}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {data.typeDist?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Label */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pr-28">
                            <div className="text-3xl font-black text-text-main">{data.total}</div>
                            <div className="text-[10px] uppercase font-bold text-text-muted">Activos</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: DISEÑO PEDAGÓGICO */}
            <h2 className="text-xl font-bold mt-10 mb-6 flex items-center gap-2">
                <BookOpen className="text-blue-500" /> Diseño Pedagógico y Experiencia
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 3.1 Distribución por Intervención */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-6">Intervención</h3>
                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.interventionDist}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#00C49F" radius={[4, 4, 0, 0]}>
                                    {data.interventionDist.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3.2 Journey (Moment) */}
                <div className="lg:col-span-2 bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        Learning Journey <ArrowRight size={14} />
                    </h3>
                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.journeyDist}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" padding={{ left: 30, right: 30 }} />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3.3 Matrix: Roles y Niveles */}
            <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Matriz de Roles y Niveles</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="py-3 font-bold text-text-muted">Target Role</th>
                                <th className="py-3 font-bold text-center text-blue-500">Junior</th>
                                <th className="py-3 font-bold text-center text-green-500">Senior</th>
                                <th className="py-3 font-bold text-center text-purple-500">Manager</th>
                                <th className="py-3 font-bold text-center text-orange-500">C-Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.roleMatrix.map((row: any) => (
                                <tr key={row.role} className="border-b border-border/50 hover:bg-gray-50/50">
                                    <td className="py-3 font-medium">{row.role || 'Sin Definir'}</td>
                                    {['Junior', 'Senior', 'Manager', 'C-Level'].map(level => {
                                        const count = row[level]
                                        return (
                                            <td key={level} className="py-3 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${count === 0 ? 'bg-gray-100 text-gray-400' :
                                                    count < 3 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {count}
                                                </span>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

```


# File: components/MethodologySPA.tsx
```typescript
'use client'

import React, { useState, useEffect } from 'react'
import {
    LayoutDashboard,
    Database,
    ShieldCheck,
    TreePine,
    Grid3X3,
    Tag,
    Zap,
    LogOut,
    RefreshCw,
    Plus,
    FileText,
    Monitor,
    Package,
    BookOpen,
    Gem,
    Terminal,
    ChevronRight,
    Search,
    Trash2,
    Activity
} from 'lucide-react'
import { signIn, signOut } from "next-auth/react"
import AdminView from './AdminView'
import ContentForm, { ContentItem, ResearchSource } from './ContentForm'
import TaxonomyManager from './TaxonomyManager'
import ReleasesView from './ReleasesView'
import HeatmapView from './HeatmapView'
import QAView from './QAView'
import AnalyticsView from './AnalyticsView'
import CompilerChat from './CompilerChat'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type UserRole = 'metodologo' | 'curador' | 'auditor' | 'admin' | 'guest' | 'pending'

type User = {
    role: UserRole
    name: string
    label: string
    avatar: string | React.ReactNode
    color: string
}

type Session = {
    user?: {
        name?: string | null
        email?: string | null
        image?: string | null
        role?: string
    }
}

type TaxonomyItem = {
    id: string
    name: string
    type: string
    active: boolean
    order: number
    parentId: string | null
    children?: TaxonomyItem[]
    parent?: TaxonomyItem
}

export default function MethodologySPA({
    initialData,
    initialResearch,
    initialTaxonomy,
    session
}: {
    initialData?: ContentItem[],
    initialResearch?: ResearchSource[],
    initialTaxonomy?: TaxonomyItem[],
    session: Session | null
}) {
    const pathname = usePathname()
    const router = useRouter()
    const currentView = pathname === '/' ? 'inventory' : pathname === '/inventario' ? 'inventory' : pathname.replace('/', '')

    const [user, setUser] = useState<User | null>(null)
    const [inventoryData, setInventoryData] = useState<ContentItem[]>(initialData || [])
    const [researchData, setResearchData] = useState<ResearchSource[]>(initialResearch || [])
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Initialize User from Session
    useEffect(() => {
        if (session?.user) {
            const role = (session.user.role?.toLowerCase() as UserRole) || 'curador'
            setUser({
                role: role,
                name: session.user.name || 'Usuario 4Shine',
                label: role === 'admin' ? 'Administrador' : role === 'metodologo' ? 'Metodólogo (Arquitecto)' : 'Constructor (Conectado)',
                avatar: session.user.image || null,
                color: role === 'admin' ? '#d73a49' : '#0969da'
            })
            // Role-based redirect on first login if at root
            if (pathname === '/') {
                router.push(role === 'admin' ? '/admin' : '/inventario')
            }
        }

        const stored = localStorage.getItem('theme') || 'light'
        if (stored === 'dark') document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
    }, [session])

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark')
        localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }

    const refreshData = async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch('/api/inventory')
            const data = await res.json()
            setInventoryData(data)
        } catch (e) {
            console.error("Failed to refresh", e)
        } finally {
            setIsRefreshing(false)
        }
    }

    if (!user) {
        return (
            <div className="fixed inset-0 bg-bg flex items-center justify-center transition-colors">
                <div className="text-center p-12 bg-panel border border-border rounded-2xl shadow-2xl max-w-sm w-full mx-4">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent animate-pulse">
                        <Terminal size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-text-main mb-2 tracking-tight">4Shine Builder</h2>
                    <p className="text-sm text-text-muted mb-8 leading-relaxed">Framework de Arquitectura Metodológica e Inventario de Activos.</p>
                    <button
                        onClick={() => signIn('google')}
                        className="w-full bg-accent text-white px-6 py-3.5 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-accent/20"
                    >
                        <RefreshCw size={20} className="animate-spin-slow" />
                        Acceder con Google Workspace
                    </button>
                    <p className="text-[10px] text-text-muted mt-8 uppercase tracking-[0.2em] font-bold opacity-40">System Release 1.2 Pro</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-bg transition-colors p-6 sm:p-10 animate-in fade-in duration-500">
            {currentView === 'taxonomy' && <TaxonomyManager initialData={initialTaxonomy as any} inventory={inventoryData} research={researchData} />}
            {currentView === 'releases' && <ReleasesView />}
            {currentView === 'analitica' && <AnalyticsView />}
            {currentView === 'inventory' && (
                <InventoryView
                    data={inventoryData}
                    role={user.role}
                    onRefresh={refreshData}
                    isRefreshing={isRefreshing}
                />
            )}
            {currentView === '' && (
                <InventoryView
                    data={inventoryData}
                    role={user.role}
                    onRefresh={refreshData}
                    isRefreshing={isRefreshing}
                />
            )}
            {currentView === 'gap-analysis' && <HeatmapViewWrapper inventory={inventoryData} taxonomy={initialTaxonomy || []} />}
            {currentView === 'generator' && <CompilerChat assets={inventoryData} research={researchData} />}
            {currentView === 'qa' && (user?.role === 'admin' || user?.role === 'auditor') && <QAView role={user.role} onRefresh={refreshData} />}
            {currentView === 'admin' && <AdminView />}
        </div>
    )
}

function NavHeader({ label }: { label: string }) {
    return <div className="text-[10px] font-black text-text-muted mb-2 tracking-[0.2em] ml-2 opacity-60">{label}</div>
}

function NavBtn({ id, label, icon, active, href }: { id: string, label: string, icon: React.ReactNode, active: boolean, href: string }) {
    return (
        <Link
            href={href}
            className={`w-full text-left p-3 rounded-xl text-[13px] font-bold flex items-center justify-between group transition-all
        ${active
                    ? 'bg-accent text-white shadow-xl shadow-accent/20 translate-x-1'
                    : 'text-text-muted hover:bg-accent/5 hover:text-accent border border-transparent'}
      `}
        >
            <div className="flex items-center gap-3">
                <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
                    {icon}
                </span>
                {label}
            </div>
            {active && <ChevronRight size={14} className="opacity-50" />}
        </Link>
    )
}

function HeatmapViewWrapper({ inventory, taxonomy }: { inventory: any[], taxonomy: any[] }) {
    const subcomponents = taxonomy.filter(t => t.type !== 'Pillar')
    const levels = ['Básico', 'En Desarrollo', 'Avanzado', 'Maestría']
    const heatmap: any = {}

    subcomponents.forEach(sub => {
        heatmap[sub.name] = {}
        levels.forEach(lvl => {
            const matches = inventory.filter(i =>
                (i.sub === sub.name || i.primaryPillar === sub.name) && i.maturity === lvl
            )
            const count = matches.length
            const hasValidated = matches.some(m => m.status === 'Validado' || m.status === 'Approved')
            heatmap[sub.name][lvl] = { count, status: count === 0 ? 'red' : hasValidated ? 'green' : 'yellow' }
        })
    })

    return <HeatmapView subcomponents={subcomponents} maturityLevels={levels} heatmap={heatmap} />
}

function InventoryView({ data, role, onRefresh, isRefreshing }: { data: ContentItem[], role: string, onRefresh: () => void, isRefreshing: boolean }) {
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Deep Linking Support
    const searchParams = useSearchParams()
    const urlId = searchParams.get('id')

    // Auto-select item from URL or sync when data refreshes
    useEffect(() => {
        if (urlId && data.length > 0) {
            const target = data.find(i => i.id === urlId)
            if (target) setSelectedItem(target)
        } else if (selectedItem) {
            // Fix "Not saving" visual bug
            const upToDateItem = data.find(i => i.id === selectedItem.id)
            if (upToDateItem) setSelectedItem(upToDateItem)
        }
    }, [data, urlId])

    // Filters State
    const [pillarFilter, setPillarFilter] = useState('')
    const [maturityFilter, setMaturityFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [formatFilter, setFormatFilter] = useState('')
    const [sortOrder, setSortOrder] = useState('default')

    const filteredData = data.filter(i => {
        const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.id.toLowerCase().includes(searchTerm.toLowerCase())

        // Match if it is the primary pillar OR if it is in secondary pillars
        const matchesPillar = !pillarFilter ||
            (i as any).primaryPillar === pillarFilter ||
            ((i as any).secondaryPillars && (i as any).secondaryPillars.includes(pillarFilter))

        const matchesMaturity = !maturityFilter || i.maturity === maturityFilter
        const matchesStatus = !statusFilter || i.status === statusFilter
        const matchesType = !typeFilter || i.type === typeFilter
        const matchesFormat = !formatFilter || i.format === formatFilter

        return matchesSearch && matchesPillar && matchesMaturity && matchesStatus && matchesType && matchesFormat
    }).sort((a, b) => {
        if (sortOrder === 'newest') {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        }
        if (sortOrder === 'oldest') {
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        }
        return 0 // default order (by ID usually or preserved)
    })

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este activo? Esta acción no se puede deshacer.')) return
        try {
            const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                setSelectedItem(null)
                onRefresh()
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) { alert('Error de red') }
    }

    const resetFilters = () => {
        setPillarFilter('')
        setMaturityFilter('')
        setStatusFilter('')
        setTypeFilter('')
        setFormatFilter('')
        setSortOrder('default')
        setSearchTerm('')
    }

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-text-main tracking-tighter flex items-center gap-4">
                        Inventario de Activos
                        <button
                            onClick={onRefresh}
                            className={`p-2 rounded-full hover:bg-panel border border-border group transition-all ${isRefreshing ? 'animate-spin border-accent' : ''}`}
                        >
                            <RefreshCw size={20} className={isRefreshing ? 'text-accent' : 'text-text-muted group-hover:text-text-main'} />
                        </button>
                    </h2>
                    <p className="text-sm text-text-muted mt-2 font-medium">Gestiona y consulta el repositorio central de activos metodológicos.</p>
                </div>
                {(role === 'admin' || role === 'metodologo' || role === 'curador') && (
                    <button
                        onClick={() => { setSelectedItem(null); setShowForm(true); }}
                        className="bg-accent text-white px-6 py-3 rounded-2xl font-bold text-sm hover:brightness-110 hover:shadow-xl hover:shadow-accent/20 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-accent/10"
                    >
                        <Plus size={18} />
                        Crear Nuevo Activo
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 h-[calc(100vh-280px)] min-h-[600px]">
                {/* Filter & List Panel */}
                <div className={`bg-panel border border-border rounded-3xl flex flex-col overflow-hidden shadow-sm ${selectedItem ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-border bg-bg/50 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por título o ID..."
                                className="w-full bg-bg border border-border pl-10 pr-4 py-2.5 rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Metadata Filters */}
                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex gap-2">
                                <select
                                    value={pillarFilter}
                                    onChange={e => setPillarFilter(e.target.value)}
                                    className="flex-1 bg-bg border border-border rounded-lg p-2 text-[10px] font-bold text-text-muted outline-none focus:border-accent"
                                >
                                    <option value="">PILLAR: TODOS</option>
                                    {['Shine In', 'Shine Out', 'Shine Up', 'Shine Beyond'].map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                </select>
                                <select
                                    value={maturityFilter}
                                    onChange={e => setMaturityFilter(e.target.value)}
                                    className="flex-1 bg-bg border border-border rounded-lg p-2 text-[10px] font-bold text-text-muted outline-none focus:border-accent"
                                >
                                    <option value="">NIVEL: TODOS</option>
                                    {['Básico', 'En Desarrollo', 'Avanzado', 'Maestría'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                                </select>
                            </div>
                            {/* New Filters Row 1 */}
                            <div className="flex gap-2">
                                <select
                                    value={typeFilter}
                                    onChange={e => setTypeFilter(e.target.value)}
                                    className="flex-1 bg-bg border border-border rounded-lg p-2 text-[10px] font-bold text-text-muted outline-none focus:border-accent"
                                >
                                    <option value="">CATEGORÍA: TODAS</option>
                                    {Array.from(new Set(data.map(i => i.type).filter(Boolean))).sort().map(t => (
                                        <option key={t} value={t}>{t?.toUpperCase()}</option>
                                    ))}
                                </select>
                                <select
                                    value={formatFilter}
                                    onChange={e => setFormatFilter(e.target.value)}
                                    className="flex-1 bg-bg border border-border rounded-lg p-2 text-[10px] font-bold text-text-muted outline-none focus:border-accent"
                                >
                                    <option value="">FORMATO: TODOS</option>
                                    {Array.from(new Set(data.map(i => i.format).filter(Boolean))).sort().map(f => (
                                        <option key={f as string} value={f as string}>{(f as string).toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            {/* New Filters Row 2 */}
                            <div className="flex gap-2">
                                <select
                                    value={sortOrder}
                                    onChange={e => setSortOrder(e.target.value)}
                                    className="flex-1 bg-bg border border-border rounded-lg p-2 text-[10px] font-bold text-text-muted outline-none focus:border-accent"
                                >
                                    <option value="default">ORDEN: ID (DEF)</option>
                                    <option value="newest">MÁS RECIENTES</option>
                                    <option value="oldest">MÁS ANTIGUOS</option>
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="flex-1 bg-bg border border-border rounded-lg p-2 text-[10px] font-bold text-text-muted outline-none focus:border-accent"
                                >
                                    <option value="">ESTADO: TODOS</option>
                                    {['Borrador', 'Revisión', 'Validado'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                                <button
                                    onClick={resetFilters}
                                    className="px-3 bg-panel border border-border rounded-lg text-[10px] font-black hover:text-accent transition-colors"
                                    title="Limpiar Filtros"
                                >
                                    LIMPIAR
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                        {filteredData.map((item: any) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`mx-3 mb-2 p-4 rounded-2xl border cursor-pointer transition-all group flex items-start gap-4 ${selectedItem?.id === item.id
                                    ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20 scale-[1.02]'
                                    : 'bg-bg border-border hover:border-accent/40 hover:bg-panel'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedItem?.id === item.id ? 'bg-white/20' : 'bg-panel group-hover:bg-accent/10 group-hover:text-accent'
                                    }`}>
                                    <FileText size={20} />
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <div className={`font-bold text-sm truncate ${selectedItem?.id === item.id ? 'text-white' : 'text-text-main group-hover:text-accent'}`}>{item.title}</div>
                                    <div className={`text-[10px] uppercase font-black tracking-widest mt-1.5 flex items-center gap-2 ${selectedItem?.id === item.id ? 'text-white/70' : 'text-text-muted'}`}>
                                        {item.id}
                                        <span className={`w-1 h-1 rounded-full ${selectedItem?.id === item.id ? 'bg-white/40' : 'bg-border'}`} />
                                        {item.status}
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`mt-3 transition-opacity ${selectedItem?.id === item.id ? 'opacity-50' : 'opacity-0'}`} />
                            </div>
                        ))}
                        {filteredData.length === 0 && (
                            <div className="p-12 text-center text-text-muted">
                                <Search size={32} className="mx-auto mb-4 opacity-20" />
                                <div className="italic font-medium">No se encontraron resultados</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Panel */}
                <div className={`flex flex-col h-full overflow-hidden ${selectedItem ? 'flex' : 'hidden lg:flex'}`}>
                    {/* Mobile Back Button */}
                    <div className="lg:hidden mb-4">
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="flex items-center gap-2 text-text-muted hover:text-text-main font-bold text-xs uppercase tracking-widest"
                        >
                            <ChevronRight className="rotate-180" size={16} /> Volver al Inventario
                        </button>
                    </div>

                    {selectedItem ? (
                        <div className="bg-panel border border-border rounded-3xl p-6 md:p-10 overflow-y-auto shadow-sm flex flex-col h-full ring-1 ring-border/50">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-10 pb-8 border-b border-border/60 gap-4">
                                <div className="max-w-full md:max-w-[70%] text-left">
                                    <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-3">CONSTRUCTOR DE METODOLOGÍA</div>
                                    <h3 className="text-2xl md:text-3xl font-black text-text-main leading-[1.1] tracking-tighter">{selectedItem.title}</h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${selectedItem.status === 'Validado' && role !== 'admin'
                                            ? 'border-border text-text-muted hover:border-text-main hover:text-text-main'
                                            : 'border-accent text-accent hover:bg-accent hover:text-white'
                                            }`}
                                    >
                                        {selectedItem.status === 'Validado' && role !== 'admin' ? 'Consultar Detalles' : 'Editar Metadatos'}
                                    </button>
                                    {role === 'admin' && selectedItem.status === 'Validado' && (
                                        <button
                                            onClick={async () => {
                                                const reason = prompt('Motivo obligatorio para revertir estado (God Mode):')
                                                if (!reason) return
                                                try {
                                                    const res = await fetch('/api/inventory/upsert', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            ...selectedItem,
                                                            status: 'Borrador',
                                                            forceReason: reason
                                                        })
                                                    })
                                                    if (res.ok) {
                                                        alert('✅ Estado revertido a Borrador exitosamente.')
                                                        onRefresh()
                                                    } else {
                                                        const err = await res.json()
                                                        alert('❌ Error: ' + err.error)
                                                    }
                                                } catch (e) { alert('Error de red') }
                                            }}
                                            className="px-5 py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-orange-900/20"
                                        >
                                            ⚡ Revertir Estado
                                        </button>
                                    )}
                                    {(role === 'admin' || role === 'metodologo') && (
                                        <button
                                            onClick={() => handleDelete(selectedItem.id)}
                                            className="w-10 h-10 rounded-xl border border-danger/30 text-danger hover:bg-danger hover:text-white transition-all flex items-center justify-center shadow-lg shadow-danger/5"
                                            title="Eliminar Activo"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                                <DataPointCard icon={<LayoutDashboard size={18} />} label="Pilar Principal" value={(selectedItem as any).primaryPillar || ''} />
                                <DataPointCard icon={<Grid3X3 size={18} />} label="Subcomponente" value={selectedItem.sub || ''} />
                                <DataPointCard icon={<Monitor size={18} />} label="Nivel Madurez" value={selectedItem.maturity || ''} />
                                <DataPointCard icon={<ShieldCheck size={18} />} label="Estado de Calidad" value={selectedItem.status || ''} />
                            </div>

                            {(selectedItem as any).secondaryPillars && (selectedItem as any).secondaryPillars.length > 0 && (
                                <div className="mb-10 flex flex-wrap gap-2 items-center">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mr-2">Pilares Secundarios:</span>
                                    {(selectedItem as any).secondaryPillars.map((p: string) => (
                                        <span key={p} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] font-bold border border-accent/20">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex-1 bg-bg border border-border rounded-3xl overflow-hidden shadow-2xl relative group min-h-[400px]">
                                {selectedItem.driveId ? (
                                    <>
                                        <iframe
                                            src={`https://drive.google.com/file/d/${selectedItem.driveId}/preview`}
                                            className="w-full h-full border-none"
                                            allow="autoplay"
                                        />
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={`https://drive.google.com/file/d/${selectedItem.driveId}/view`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 bg-accent text-white rounded-xl shadow-xl hover:scale-110 transition-all flex items-center gap-2 font-bold text-xs"
                                            >
                                                <Zap size={14} fill="currentColor" />
                                                ABRIR EN DRIVE
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-text-muted bg-panel/30">
                                        <div className="w-20 h-20 bg-panel rounded-3xl flex items-center justify-center mb-4 text-text-muted/40 border border-border/50">
                                            <RefreshCw size={40} />
                                        </div>
                                        <div className="italic font-bold tracking-tight text-lg opacity-40">Sin vista previa disponible</div>
                                        <p className="text-sm mt-1 opacity-40">Carga un ID de Drive válido para visualizar.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-panel/50 border-2 border-dashed border-border rounded-[40px] flex flex-col items-center justify-center text-text-muted italic h-full transition-colors group hover:border-accent/30 hover:bg-accent/5">
                            <div className="w-24 h-24 bg-bg border border-border rounded-[32px] flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:border-accent group-hover:text-accent transition-all text-text-muted/20">
                                <LayoutDashboard size={40} />
                            </div>
                            <div className="font-black tracking-tight text-xl opacity-40 group-hover:opacity-100 transition-opacity uppercase text-center max-w-sm px-10">
                                Selecciona un activo para visualizar su estructura
                            </div>
                        </div>
                    )}
                </div>

                {showForm && (
                    <ContentForm
                        initialData={selectedItem}
                        onClose={() => setShowForm(false)}
                        onSave={() => { setShowForm(false); onRefresh(); }}
                        readOnly={selectedItem?.status === 'Validado' && role !== 'admin'}
                    />
                )}
            </div>
        </div>
    )
}

function DataPointCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="bg-bg border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border-l-4 border-l-accent text-left">
            <div className="flex items-center gap-2 mb-2">
                <div className="text-accent opacity-50">{icon}</div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">{label}</label>
            </div>
            <div className="text-[14px] text-text-main font-bold truncate leading-tight">{value || 'No Definido'}</div>
        </div>
    )
}






```


# File: components/QAView.tsx
```typescript
'use client'

import React, { useState, useEffect } from 'react'
import {
    Search, FileText, ChevronRight, CheckCircle2, XCircle,
    ShieldCheck, Scale, Fingerprint, ExternalLink, AlertTriangle,
    Clock, RefreshCw, Eye, Lock
} from 'lucide-react'

type ContentItem = {
    id: string
    title: string
    type: string
    primaryPillar: string
    secondaryPillars: string[]
    sub?: string | null
    maturity?: string | null
    status: string
    ipOwner?: string | null
    ipType?: string | null
    confidentiality?: string | null
    driveId?: string | null
    observations?: string | null
    updatedAt: string
}

interface Props {
    role: string
    onRefresh: () => void
}

export default function QAView({ role, onRefresh }: Props) {
    const [data, setData] = useState<ContentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [rejectReason, setRejectReason] = useState('')
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    // Checklist state
    const [checks, setChecks] = useState({
        technical: false,
        methodological: false,
        integrity: false
    })

    // Auditor exclusive fields edit
    const [editIP, setEditIP] = useState({
        ipOwner: '',
        ipType: '',
        confidentiality: ''
    })

    useEffect(() => {
        fetchQueue()
    }, [])

    useEffect(() => {
        if (selectedItem) {
            setEditIP({
                ipOwner: selectedItem.ipOwner || '',
                ipType: selectedItem.ipType || '',
                confidentiality: selectedItem.confidentiality || ''
            })
            setChecks({ technical: false, methodological: false, integrity: false })
        }
    }, [selectedItem])

    const fetchQueue = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/inventory/list')
            const json = await res.json()
            if (Array.isArray(json)) {
                // Filter specifically for "Revisión"
                setData(json.filter(i => i.status === 'Revisión'))
            }
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    const handleVerdict = async (verdict: 'Approve' | 'Reject') => {
        if (!selectedItem) return
        if (verdict === 'Approve') {
            if (!checks.technical || !checks.methodological || !checks.integrity) {
                return alert('Debes completar el checklist de calidad antes de aprobar.')
            }
            if (editIP.ipOwner === 'Tercero' && !selectedItem.observations?.includes('Licencia')) {
                return alert('Alerta de Gobernanza: Si el IP es Tercero, debe especificarse la licencia en las observaciones.')
            }
        }

        setIsProcessing(true)
        try {
            const payload = {
                id: selectedItem.id,
                title: selectedItem.title,
                status: verdict === 'Approve' ? 'Validado' : 'Borrador',
                forceReason: verdict === 'Reject' ? `RECHAZO QA: ${rejectReason}` : 'APROBACIÓN QA AUDITOR',
                // Update IP fields if modified by auditor
                ipOwner: editIP.ipOwner,
                ipType: editIP.ipType,
                confidentiality: editIP.confidentiality
            }

            const res = await fetch('/api/inventory/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setSelectedItem(null)
                setShowRejectModal(false)
                setRejectReason('')
                fetchQueue()
                onRefresh()
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) { alert('Error de red') }
        setIsProcessing(false)
    }

    const filteredData = data.filter(i =>
        i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="grid grid-cols-[400px_1fr] gap-8 h-[calc(100vh-200px)] animate-in fade-in duration-500">
            {/* Review Queue (HU-A-01) */}
            <div className="bg-panel border border-border rounded-3xl flex flex-col overflow-hidden shadow-xl">
                <div className="p-6 border-b border-border bg-bg/40">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                            <Clock size={16} className="text-warning" /> Cola de Revisión
                        </h3>
                        <span className="bg-warning/10 text-warning px-2 py-1 rounded-lg text-[10px] font-black border border-warning/20">
                            {data.length} PENDIENTES
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar en revisión..."
                            className="w-full bg-bg border border-border pl-10 pr-4 py-2.5 rounded-xl text-xs text-text-main outline-none focus:border-accent transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
                    {loading ? (
                        <div className="p-8 text-center animate-pulse text-text-muted text-xs font-bold uppercase tracking-widest">
                            <RefreshCw className="animate-spin mx-auto mb-2 text-accent" size={20} />
                            Sincronizando...
                        </div>
                    ) : (
                        filteredData.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all group flex items-start gap-4 ${selectedItem?.id === item.id
                                        ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                                        : 'bg-bg border-border hover:border-accent/40'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedItem?.id === item.id ? 'bg-white/20' : 'bg-panel'
                                    }`}>
                                    <FileText size={18} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="text-xs font-bold truncate">{item.title}</div>
                                    <div className={`text-[9px] uppercase font-black tracking-widest mt-1 flex items-center gap-2 ${selectedItem?.id === item.id ? 'text-white/70' : 'text-text-muted'
                                        }`}>
                                        {item.id} • {item.primaryPillar}
                                    </div>
                                    {item.ipOwner === 'Tercero' && (
                                        <div className="flex items-center gap-1 mt-2 text-[8px] font-bold text-warning-text bg-warning/20 px-1.5 py-0.5 rounded-md w-fit border border-warning/30">
                                            <AlertTriangle size={8} /> REVISAR IP
                                        </div>
                                    )}
                                </div>
                                <ChevronRight size={14} className={`mt-2 ${selectedItem?.id === item.id ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Side-by-Side View (HU-A-02 & HU-A-03) */}
            <div className="bg-panel border border-border rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                {selectedItem ? (
                    <div className="flex flex-col h-full">
                        {/* Header Action Bar */}
                        <div className="p-6 border-b border-border bg-bg/30 flex justify-between items-center backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white tracking-tight">{selectedItem.title}</h4>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">{selectedItem.id}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="bg-bg border border-border hover:border-danger hover:text-danger text-text-muted px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
                                >
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleVerdict('Approve')}
                                    disabled={isProcessing}
                                    className="bg-success text-white px-8 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-success/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle2 size={16} /> Aprobar y Publicar
                                </button>
                            </div>
                        </div>

                        {/* Split Main Area */}
                        <div className="flex-1 grid grid-cols-[450px_1fr] overflow-hidden">
                            {/* Metadata Audit Panel */}
                            <div className="p-8 overflow-y-auto no-scrollbar border-r border-border bg-bg/10 space-y-10">
                                {/* Checklist Section */}
                                <section>
                                    <h5 className="text-[10px] font-black text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Eye size={12} /> Checklist de Validación
                                    </h5>
                                    <div className="space-y-3">
                                        <CheckItem
                                            label="Calidad Técnica (Formatos, Resolución)"
                                            checked={checks.technical}
                                            onChange={() => setChecks(c => ({ ...c, technical: !c.technical }))}
                                        />
                                        <CheckItem
                                            label="Coherencia Metodológica 4Shine"
                                            checked={checks.methodological}
                                            onChange={() => setChecks(c => ({ ...c, methodological: !c.methodological }))}
                                        />
                                        <CheckItem
                                            label="Integridad y Accesibilidad de Archivo"
                                            checked={checks.integrity}
                                            onChange={() => setChecks(c => ({ ...c, integrity: !c.integrity }))}
                                        />
                                    </div>
                                </section>

                                {/* IP Governance Section (HU-A-03) */}
                                <section className="p-6 bg-accent/5 border border-accent/10 rounded-3xl space-y-6">
                                    <h5 className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2">
                                        <Scale size={14} /> Gobernanza de IP & Seguridad
                                    </h5>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <QAInput
                                                label="Titular IP"
                                                value={editIP.ipOwner}
                                                onChange={v => setEditIP(p => ({ ...p, ipOwner: v }))}
                                                options={['Propio', 'Tercero', 'Dominio Público', 'Mixto']}
                                            />
                                            <QAInput
                                                label="Régimen"
                                                value={editIP.ipType}
                                                onChange={v => setEditIP(p => ({ ...p, ipType: v }))}
                                                options={['Derecho de autor', 'Know-how', 'Licencia', 'Adaptación']}
                                            />
                                        </div>
                                        <QAInput
                                            label="Nivel de Confidencialidad"
                                            value={editIP.confidentiality}
                                            onChange={v => setEditIP(p => ({ ...p, confidentiality: v }))}
                                            options={['Baja', 'Media', 'Alta', 'Restringida']}
                                        />
                                    </div>
                                </section>

                                {/* Detail Summary */}
                                <section className="space-y-4">
                                    <h5 className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                        <Fingerprint size={12} /> Reseña Metodológica
                                    </h5>
                                    <div className="text-xs text-text-main leading-relaxed bg-bg border border-border p-4 rounded-2xl italic">
                                        {selectedItem.observations || "Sin observaciones específicas."}
                                    </div>
                                </section>
                            </div>

                            {/* Drive Preview Panel (HU-A-02) */}
                            <div className="bg-bg/40 relative group">
                                {selectedItem.driveId ? (
                                    <iframe
                                        src={`https://drive.google.com/file/d/${selectedItem.driveId}/preview`}
                                        className="w-full h-full border-none"
                                        allow="autoplay"
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center text-text-muted">
                                        <AlertTriangle size={48} className="mb-4 opacity-20" />
                                        <p className="text-[11px] font-black uppercase tracking-widest">Sin Archivo Vinculado</p>
                                        <p className="text-[10px] mt-2 max-w-[200px]">Este activo no tiene un ID de Drive válido para previsualización.</p>
                                    </div>
                                )}
                                <a
                                    href={`https://drive.google.com/open?id=${selectedItem.driveId}`}
                                    target="_blank"
                                    className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-20 text-center text-text-muted animate-in fade-in duration-700">
                        <Lock size={64} className="mb-6 opacity-10" />
                        <h4 className="text-sm font-black uppercase tracking-[0.3em]">Cámara de Calidad</h4>
                        <p className="text-[11px] mt-4 max-w-[280px] leading-relaxed">Selecciona un activo de la cola izquierda para iniciar el proceso de validación final.</p>
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-panel border border-border w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <XCircle className="text-danger" size={18} /> Motivo del Rechazo
                            </h4>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Indica al curador qué aspectos debe corregir..."
                                className="w-full h-32 bg-bg border border-border rounded-2xl p-4 text-xs text-text-main outline-none focus:border-danger transition-all resize-none"
                            />
                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="flex-1 bg-bg border border-border text-text-muted py-3 rounded-xl font-bold text-xs uppercase"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleVerdict('Reject')}
                                    disabled={!rejectReason || isProcessing}
                                    className="flex-1 bg-danger text-white py-3 rounded-xl font-bold text-xs uppercase shadow-lg shadow-danger/20 disabled:opacity-50"
                                >
                                    Rechazar Activo
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function CheckItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
    return (
        <label className="flex items-center gap-4 p-4 bg-bg border border-border rounded-2xl cursor-pointer hover:border-accent/40 transition-all group">
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'bg-success border-success text-white' : 'border-border group-hover:border-accent/50'
                }`}>
                {checked && <CheckCircle2 size={12} />}
            </div>
            <span className={`text-[11px] font-bold ${checked ? 'text-text-mainLine' : 'text-text-muted'}`}>{label}</span>
        </label>
    )
}

function QAInput({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: string[] }) {
    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest pl-1">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl p-3 text-[11px] font-bold text-text-main outline-none focus:border-accent appearance-none cursor-pointer"
            >
                <option value="">Seleccionar...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    )
}

```


# File: components/ReleasesView.tsx
```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { Plus, History, CheckCircle2, AlertCircle, Snowflake, Box, Lock, Loader2 } from 'lucide-react'

type Release = {
    id: string
    tag: string
    description: string | null
    status: 'Draft' | 'Active' | 'Frozen'
    createdAt: string
    _count?: { contents: number }
}

export default function ReleasesView() {
    const [releases, setReleases] = useState<Release[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchReleases = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/releases')
            const data = await res.json()
            setReleases(data)
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchReleases()
    }, [])

    const handleCreate = async () => {
        const tag = window.prompt('Tag de versión (ej: v1.0):')
        const description = window.prompt('Descripción corta (opcional):')
        if (!tag) return

        try {
            await fetch('/api/releases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag, description })
            })
            fetchReleases()
        } catch (err) {
            console.error(err)
        }
    }

    const handleUpdateStatus = async (id: string, status: string) => {
        if (!window.confirm(`¿Seguro que deseas cambiar el estado a ${status}?`)) return

        try {
            await fetch('/api/releases', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            })
            fetchReleases()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="max-w-5xl mx-auto py-8 text-left">
            <header className="flex justify-between items-end mb-12">
                <div>
                    <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-3">VERSIONAMIENTO ESTRATÉGICO</div>
                    <h2 className="text-4xl font-black text-text-main tracking-tighter">Gestión de Releases</h2>
                    <p className="text-sm text-text-muted mt-2 font-medium">Controla el ciclo de vida y la estabilidad de la arquitectura 4Shine.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-accent text-white px-6 py-3.5 rounded-2xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-accent/20 flex items-center gap-2 active:scale-95"
                >
                    <Plus size={18} />
                    Nueva Versión
                </button>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-text-muted opacity-40">
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <div className="font-bold tracking-tight">Recuperando linaje de versiones...</div>
                </div>
            ) : (
                <div className="grid gap-6">
                    {releases.map(release => (
                        <div key={release.id} className="bg-panel border border-border rounded-3xl p-8 flex justify-between items-center group hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/5 transition-all shadow-sm relative overflow-hidden">
                            {release.status === 'Frozen' && <div className="absolute top-0 left-0 w-1 h-full bg-danger" />}
                            {release.status === 'Active' && <div className="absolute top-0 left-0 w-1 h-full bg-success" />}

                            <div className="flex gap-8 items-center">
                                <div className="bg-bg border border-border rounded-2xl p-4 min-w-[100px] text-center shadow-inner">
                                    <div className="text-2xl font-black text-text-main tracking-tighter">{release.tag}</div>
                                    <div className="text-[9px] text-text-muted font-black uppercase tracking-widest mt-1">
                                        {new Date(release.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                                    </div>
                                </div>
                                <div className="h-12 w-[2px] bg-border/40 rounded-full"></div>
                                <div>
                                    <h4 className="text-lg font-black text-text-main tracking-tight group-hover:text-accent transition-colors">{release.description || 'Sin descripción técnica'}</h4>
                                    <div className="flex gap-4 mt-3 items-center">
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-black uppercase tracking-widest flex items-center gap-1.5 ${release.status === 'Frozen' ? 'bg-danger/10 text-danger border-danger/20' :
                                            release.status === 'Active' ? 'bg-success/10 text-success border-success/20' :
                                                'bg-warning/10 text-warning border-warning/20'
                                            }`}>
                                            {release.status === 'Frozen' && <Snowflake size={12} />}
                                            {release.status === 'Active' && <CheckCircle2 size={12} />}
                                            {release.status === 'Draft' && <AlertCircle size={12} />}
                                            {release.status === 'Frozen' ? 'Congelada' : release.status === 'Active' ? 'Activa' : 'Borrador'}
                                        </span>
                                        <span className="text-[11px] text-text-muted font-bold flex items-center gap-2">
                                            <Box size={14} className="opacity-50" />
                                            <span className="text-text-main font-black">{release._count?.contents || 0}</span> activos vinculados
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                {release.status !== 'Frozen' && (
                                    <>
                                        {release.status === 'Draft' && (
                                            <button
                                                onClick={() => handleUpdateStatus(release.id, 'Active')}
                                                className="bg-accent/10 text-accent border border-accent/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-sm"
                                            >
                                                Publicar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleUpdateStatus(release.id, 'Frozen')}
                                            className="bg-panel border border-border text-danger px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-danger hover:text-white transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <Lock size={12} />
                                            Congelar
                                        </button>
                                    </>
                                )}
                                {release.status === 'Frozen' && (
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-danger/40 italic">
                                        <Lock size={12} />
                                        Inmutable
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

```


# File: components/ResearchAnalytics.tsx
```typescript

'use client'

import React, { useState, useEffect } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ScatterChart, Scatter, ZAxis
} from 'recharts'
import { Loader2, Globe, Users, Brain, BookOpen, RefreshCw, Microscope, Link as LinkIcon, Layers } from 'lucide-react'

// Colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#ff7300'];

// --- CUSTOM HEATMAP COMPONENT (Matrix) ---
const HeatmapMatrix = ({ data, xLabels, title }: { data: any[], xLabels: string[], title: string }) => {
    if (!data || data.length === 0) return null;

    // Find max value for normalization
    let maxVal = 0;
    data.forEach(row => xLabels.forEach(x => maxVal = Math.max(maxVal, row[x] || 0)));

    const getColor = (val: number) => {
        if (val === 0) return 'bg-gray-50 text-gray-300';
        const intensity = Math.ceil((val / maxVal) * 5); // 1-5 scale
        switch (intensity) {
            case 1: return 'bg-blue-100 text-blue-700';
            case 2: return 'bg-blue-200 text-blue-800';
            case 3: return 'bg-blue-300 text-blue-900';
            case 4: return 'bg-blue-400 text-white';
            case 5: return 'bg-blue-600 text-white font-bold';
            default: return 'bg-gray-50';
        }
    }

    return (
        <div className="bg-card-bg border border-border rounded-[24px] p-6 shadow-sm overflow-hidden">
            <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-4 opacity-70">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr>
                            <th className="p-2 text-left text-text-muted font-normal italic">Competencia / Dimensión</th>
                            {xLabels.map(x => <th key={x} className="p-2 text-center text-text-main font-bold">{x.replace('Shine ', '')}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(row => (
                            <tr key={row.name} className="border-b border-border/30">
                                <td className="p-2 font-medium text-text-main/80 truncate max-w-[150px]" title={row.name}>{row.name}</td>
                                {xLabels.map(x => (
                                    <td key={x} className="p-1">
                                        <div className={`w-full h-8 rounded-md flex items-center justify-center transition-colors ${getColor(row[x])}`}>
                                            {row[x] > 0 ? row[x] : '-'}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// --- CUSTOM CIRCULAR GRAPH COMPONENT (Semantic Network) ---
const CircularConceptGraph = ({ nodes, links }: { nodes: any[], links: any[] }) => {
    if (!nodes.length) return null;
    const width = 400; // SVG viewBox size
    const height = 400;
    const radius = 160;
    const centerX = width / 2;
    const centerY = height / 2;

    // Position nodes in a circle
    const nodePos = nodes.map((n, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        return {
            ...n,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            color: COLORS[i % COLORS.length]
        }
    });

    const nodeIdMap = new Map(nodePos.map(n => [n.id, n]));

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-w-md mx-auto">
            {/* Links */}
            {links.map((l, i) => {
                const s = nodeIdMap.get(l.source);
                const t = nodeIdMap.get(l.target);
                if (!s || !t) return null;
                return (
                    <line
                        key={i}
                        x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                        stroke="#cbd5e1"
                        strokeWidth={Math.min(l.weight, 4)}
                        opacity={0.4}
                    />
                )
            })}
            {/* Nodes */}
            {nodePos.map((n, i) => (
                <g key={n.id}>
                    <circle cx={n.x} cy={n.y} r={Math.max(3, Math.min(n.val, 15))} fill={n.color} opacity={0.8} />
                    <text
                        x={n.x}
                        y={n.y}
                        dx={n.x > centerX ? 10 : -10}
                        dy={4}
                        textAnchor={n.x > centerX ? 'start' : 'end'}
                        fontSize={8}
                        fontWeight="bold"
                        fill="#475569"
                    >
                        {n.id}
                    </text>
                </g>
            ))}
        </svg>
    )
}


export default function ResearchAnalytics() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/analytics/research')
            .then(res => res.json())
            .then(json => {
                setData(json.stats)
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }, [])

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-accent" size={48} /></div>
    if (!data) return <div className="text-center p-12 text-text-muted">No data available</div>

    const PILLARS = ['Shine In', 'Shine Out', 'Shine Up', 'Shine Beyond']

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">

            {/* HEADER KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 text-white rounded-[24px] p-6 shadow-xl flex items-center justify-between">
                    <div>
                        <div className="text-xs font-black uppercase tracking-widest opacity-60">Total Fuentes</div>
                        <div className="text-4xl font-black">{data.total}</div>
                    </div>
                    <BookOpen size={32} className="opacity-20" />
                </div>
                <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Conceptos Clave</div>
                    <div className="text-4xl font-black text-slate-800">{data.conceptDensity?.length || 0}</div>
                </div>
                <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Regiones</div>
                    <div className="text-4xl font-black text-slate-800">{data.geoDist?.length || 0}</div>
                </div>
            </div>

            {/* SEC 2: COBERTURA CIENTÍFICA (Pilar Focus) */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Layers size={16} className="text-blue-600" /></div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">2. Cobertura Científica 4Shine</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Distribution Chart */}
                    <div className="bg-card-bg border border-border rounded-[24px] p-6 shadow-sm lg:col-span-1">
                        <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-4 opacity-70">Fuentes por Pilar</h3>
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.pillarDist}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                                    <YAxis />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {data.pillarDist.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Heatmap Matrix: Pillar x Competence */}
                    <div className="lg:col-span-2">
                        <HeatmapMatrix
                            title="Mapa de Evidencia: Competencia x Pilar"
                            data={data.pillarCompetenceData}
                            xLabels={PILLARS}
                        />
                    </div>
                </div>
            </section>

            {/* SEC 3: BALANCE METODOLÓGICO */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><Microscope size={16} className="text-purple-600" /></div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">3. Rigor Metodológico</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Method Mix */}
                    <div className="bg-card-bg border border-border rounded-[24px] p-6 shadow-sm">
                        <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-4 opacity-70">Mix Metodológico</h3>
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.methodCounts} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" paddingAngle={2}>
                                        {data.methodCounts?.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Evidence Ranking Top 10 */}
                    <div className="bg-card-bg border border-border rounded-[24px] p-6 shadow-sm overflow-hidden">
                        <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-4 opacity-70">Top 10: Índice de Evidencia</h3>
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                            {data.evidenceRanking.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${item.score >= 4 ? 'bg-emerald-500' : item.score === 3 ? 'bg-blue-400' : 'bg-slate-400'
                                        }`}>
                                        {item.score}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold truncate text-slate-700">{item.title}</div>
                                        <div className="text-[10px] text-slate-400 truncate">{item.methodology}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Method x Pillar Matrix (Full Width) */}
                    <div className="lg:col-span-2">
                        <HeatmapMatrix title="Matriz: Método x Pilar" data={data.methodPillarData} xLabels={PILLARS} />
                    </div>
                </div>
            </section>

            {/* SEC 4 & 5: GEOGRAFÍA & POBLACIÓN */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Geography */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"><Globe size={16} className="text-green-600" /></div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">4. Relevancia Geográfica</h2>
                    </div>
                    {/* Geo Charts */}
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-[24px] p-6 h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.geoDist} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <HeatmapMatrix title="Geo x Pilar" data={data.geoPillarData} xLabels={PILLARS} />
                    </div>
                </div>

                {/* Population */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><Users size={16} className="text-orange-600" /></div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">5. Poblaciones</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-[24px] p-6 h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.popDist} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <HeatmapMatrix title="Población x Pilar" data={data.popPillarData} xLabels={PILLARS} />
                    </div>
                </div>
            </section>

            {/* SEC 6: SEMÁNTICA */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center"><Brain size={16} className="text-pink-600" /></div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">6. Insights Semánticos (Red)</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[32px] p-8 aspect-square lg:aspect-video flex items-center justify-center relative overflow-hidden">
                        <div className="absolute top-4 left-6 text-xs text-text-muted font-bold uppercase">Grafo de Co-ocurrencia</div>
                        <CircularConceptGraph nodes={data.conceptGraph.nodes} links={data.conceptGraph.links} />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[24px] p-6">
                        <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-4 opacity-70">Ranking de Conceptos</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.conceptDensity.slice(0, 15).map((c: any, i: number) => (
                                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                                    {c.text} ({c.value})
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* SEC 7: TRAZABILIDAD */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center"><LinkIcon size={16} className="text-indigo-600" /></div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">7. Trazabilidad (Más Citados)</h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[24px] p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.citationRanking.map((cit: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="text-3xl font-black text-indigo-200">#{i + 1}</div>
                                <div>
                                    <div className=" font-bold text-slate-800 leading-tight">{cit.title}</div>
                                    <div className="text-xs text-indigo-500 font-bold mt-1">{cit.count} citas en inventario</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    )
}

```


# File: components/ResearchForm.tsx
```typescript
'use client'

import React, { useState } from 'react'
import { X, Save, Globe, BookOpen, Quote, FileText, Link as LinkIcon, Edit3, Briefcase, Sparkles, ExternalLink, Maximize2, Check, Zap, Paperclip, Cloud, Folder, ChevronRight, Loader2 } from 'lucide-react'

// Updated Interface matching ResearchSource model
interface ResearchSource {
    id: string
    title: string
    apa?: string
    url?: string
    summary?: string
    keyConcepts?: string
    findings?: string
    methodology?: string
    relation4Shine?: string
    pillars?: string[]
    driveId?: string
    transcription?: string
    competence?: string
    geographicCoverage?: string
    populationParams?: string
}

type DriveFile = {
    id: string
    name: string
    mimeType: string
}

interface Props {
    initialData?: ResearchSource
    onClose: () => void
    onSave: () => void
    readOnly?: boolean
}

export default function ResearchForm({ initialData, onClose, onSave, readOnly = false }: Props) {
    const [formData, setFormData] = useState<Partial<ResearchSource>>({
        title: '',
        apa: '',
        url: '',
        summary: '',
        keyConcepts: '',
        findings: '',
        methodology: '',
        relation4Shine: '',
        pillars: [],
        driveId: '',
        ...initialData
    })
    const [showIframe, setShowIframe] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // Drive Picker State
    const [showPicker, setShowPicker] = useState(false)
    const [pickerFiles, setPickerFiles] = useState<DriveFile[]>([])
    const [loadingPicker, setLoadingPicker] = useState(false)
    const [folderHistory, setFolderHistory] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'Inicio' }])

    // Helper to toggle pillar
    const togglePillar = (pillar: string) => {
        setFormData(prev => {
            const current = prev.pillars || []
            const newPillars = current.includes(pillar)
                ? current.filter(p => p !== pillar)
                : [...current, pillar]
            return { ...prev, pillars: newPillars }
        })
    }

    const fetchDriveFiles = async (folderId?: string) => {
        setLoadingPicker(true)
        try {
            const url = folderId ? `/api/inventory/drive-files?folderId=${folderId}` : '/api/inventory/drive-files'
            const res = await fetch(url)
            const data = await res.json()
            if (Array.isArray(data)) setPickerFiles(data)
        } catch (e) { console.error(e) }
        setLoadingPicker(false)
    }

    const openPicker = () => {
        if (readOnly) return
        setShowPicker(true)
        setFolderHistory([{ id: 'root', name: 'Inicio' }])
        fetchDriveFiles()
    }

    const handleFolderClick = (folder: DriveFile) => {
        setFolderHistory(prev => [...prev, { id: folder.id, name: folder.name }])
        fetchDriveFiles(folder.id)
    }

    const handleBreadcrumbClick = (index: number) => {
        const target = folderHistory[index]
        const newHistory = folderHistory.slice(0, index + 1)
        setFolderHistory(newHistory)

        if (target.id === 'root') {
            fetchDriveFiles()
        } else {
            fetchDriveFiles(target.id)
        }
    }

    const selectFile = (file: DriveFile) => {
        setFormData(prev => ({
            ...prev,
            driveId: file.id,
            title: prev.title || file.name.replace(/\.[^/.]+$/, "") // Auto-fill title removing extension
        }))
        setShowPicker(false)
    }

    const handleSaveInternal = async () => {
        try {
            const res = await fetch('/api/research/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) onSave()
            else alert('Error guardando fuente')
        } catch (e) { alert('Network Error') }
    }

    const handleAIAnalyze = async () => {
        if (!formData.url && !formData.driveId) {
            alert('Por favor agrega una URL o selecciona un archivo de Drive primero.')
            return
        }
        setIsAnalyzing(true)
        try {
            // New endpoint response structure should be handled here
            const res = await fetch('/api/inventory/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: formData.url,
                    driveId: formData.driveId,
                    type: 'Investigación' // Hint to backend
                })
            })
            const result = await res.json()
            if (result.error) throw new Error(result.error)

            // Map AI result to form (Adapt based on your analyze prompt output structure)
            const meta = result.data || {}
            setFormData(prev => ({
                ...prev,
                summary: meta.summary || prev.summary,
                keyConcepts: meta.keyConcepts || meta.concepts || prev.keyConcepts,
                findings: meta.findings || prev.findings,
                apa: meta.apa || prev.apa,
                methodology: meta.methodology || prev.methodology,
                relation4Shine: meta.relation4Shine || prev.relation4Shine, // If backend supports it
                title: prev.title || meta.title, // Auto-title if empty
                pillars: meta.pillars || prev.pillars, // If backend guesses pillars
                transcription: meta.transcription || prev.transcription,
                competence: meta.competence || prev.competence, // New
                geographicCoverage: meta.geographicCoverage || meta.geography || prev.geographicCoverage, // New
                populationParams: meta.populationParams || meta.population || prev.populationParams // New
            }))
        } catch (e: any) {
            alert('Error en análisis IA: ' + e.message)
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className={`bg-bg w-full ${showIframe ? 'max-w-[95vw]' : 'max-w-5xl'} h-[90vh] rounded-[32px] border-4 border-border shadow-2xl flex flex-col overflow-hidden relative transition-all duration-500`}>

                {/* Header */}
                <div className="h-16 border-b-4 border-border flex items-center justify-between px-8 bg-card-bg shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                            <BookOpen size={16} />
                        </div>
                        <h2 className="text-sm font-black text-text-main uppercase tracking-widest">
                            {initialData ? 'Editar Fuente' : 'Nueva Fuente'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {!readOnly && (
                            <button
                                onClick={handleAIAnalyze}
                                disabled={isAnalyzing}
                                className={`h-8 px-4 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all ${isAnalyzing ? 'opacity-50 cursor-wait' : 'shadow-lg shadow-indigo-500/30'}`}
                            >
                                <Sparkles size={14} className={isAnalyzing ? "animate-spin" : ""} />
                                {isAnalyzing ? 'Analizando...' : 'Autocompletar con IA'}
                            </button>
                        )}

                        {formData.url && (
                            <button onClick={() => setShowIframe(!showIframe)} className={`w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors ${showIframe ? 'text-accent' : 'text-text-muted'}`} title="Ver Navegador Web">
                                <Maximize2 size={18} />
                            </button>
                        )}
                        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-text-muted transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">

                    {/* Main Form Scrollable */}
                    <div className={`flex-1 overflow-y-auto p-8 space-y-8 ${showIframe ? 'hidden lg:block lg:w-1/2 lg:flex-none border-r-4 border-border' : ''}`}>

                        {/* Title */}
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Título</label>
                            <input
                                value={formData.title || ''}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full h-12 bg-bg border-4 border-border rounded-xl px-4 text-sm font-bold text-text-main focus:border-accent outline-none transition-all"
                                placeholder="Título del estudio..."
                                disabled={readOnly}
                            />
                        </div>

                        {/* Sources: URL & Drive */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">URL Pública</label>
                                <div className="relative flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            value={formData.url || ''}
                                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                                            className="w-full h-10 bg-bg border-2 border-border rounded-lg pl-9 px-3 text-xs text-blue-600 focus:border-accent outline-none transition-all"
                                            placeholder="https://..."
                                            disabled={readOnly}
                                        />
                                        <Globe size={14} className="absolute left-3 top-3 text-text-muted" />
                                    </div>
                                    {formData.url && (
                                        <a href={formData.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-card-bg border-2 border-border rounded-lg flex items-center justify-center hover:bg-black/5 text-text-muted">
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Archivo de Drive (ID)</label>
                                <div className="relative">
                                    <input
                                        value={formData.driveId || ''}
                                        onChange={e => setFormData({ ...formData, driveId: e.target.value })}
                                        className="w-full h-10 bg-bg border-2 border-border rounded-lg pl-9 px-3 text-xs text-text-main font-mono focus:border-accent outline-none transition-all"
                                        placeholder="ID de Archivo de Drive"
                                        disabled={readOnly}
                                    />
                                    <Paperclip size={14} className="absolute left-3 top-3 text-text-muted" />
                                </div>
                                <div className="mt-1 text-[10px] text-text-muted flex justify-end">
                                    <button onClick={openPicker} type="button" className="hover:text-accent font-bold flex items-center gap-1">
                                        <Folder size={10} /> Explorar Drive
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4SHINE PILLARS MULTI-SELECT */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-accent uppercase tracking-widest pl-1">Pilares Relacionados (4Shine)</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {['Shine In', 'Shine Out', 'Shine Up', 'Shine Beyond'].map((pillar) => {
                                    const isSelected = formData.pillars?.includes(pillar)
                                    return (
                                        <button
                                            key={pillar}
                                            onClick={() => !readOnly && togglePillar(pillar)}
                                            className={`h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2
                                                ${isSelected
                                                    ? 'bg-accent/10 border-accent text-accent shadow-sm'
                                                    : 'bg-bg border-border text-text-muted hover:border-accent/50'
                                                } ${readOnly ? 'cursor-default opacity-80' : ''}`}
                                        >
                                            {isSelected && <Check size={12} />}
                                            {pillar}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* APA Reference Block */}
                        <div className="bg-yellow-50/50 p-6 rounded-2xl border-l-4 border-yellow-400">
                            <div className="flex items-center gap-2 mb-3">
                                <Quote size={14} className="text-yellow-600" />
                                <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Referencia APA</h3>
                            </div>
                            <textarea
                                value={formData.apa || ''}
                                onChange={e => setFormData({ ...formData, apa: e.target.value })}
                                className="w-full bg-transparent border-none p-0 text-sm text-text-main font-serif italic placeholder:text-text-muted/50 focus:ring-0 resize-none"
                                placeholder="Autor, A. A. (Año)..."
                                rows={3}
                                disabled={readOnly}
                            />
                        </div>

                        {/* 4SHINE RELATION */}
                        <div className="bg-indigo-50/50 p-6 rounded-2xl border-l-4 border-indigo-400 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={14} className="text-indigo-600" />
                                <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Relación con 4Shine</h3>
                            </div>
                            <textarea
                                value={formData.relation4Shine || ''}
                                onChange={e => setFormData({ ...formData, relation4Shine: e.target.value })}
                                className="w-full bg-transparent border-none p-0 text-sm text-indigo-950/90 placeholder:text-indigo-900/40 focus:ring-0 resize-none font-medium leading-relaxed"
                                placeholder="¿Cómo sustenta este estudio nuestra metodología?..."
                                rows={3}
                                disabled={readOnly}
                            />
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Reseña Ejecutiva</label>
                                <textarea
                                    value={formData.summary || ''}
                                    onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                    className="w-full h-32 bg-bg border-2 border-border rounded-xl p-4 text-sm text-text-main focus:border-accent outline-none resize-none"
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-accent uppercase tracking-widest mb-2 pl-1 border-b border-border pb-1">Conceptos Clave</label>
                                <textarea
                                    value={formData.keyConcepts || ''}
                                    onChange={e => setFormData({ ...formData, keyConcepts: e.target.value })}
                                    className="w-full h-40 bg-bg border-2 border-border rounded-xl p-4 text-xs text-text-main focus:border-accent outline-none resize-none"
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 pl-1 border-b border-border pb-1">Hallazgos Importantes</label>
                                <textarea
                                    value={formData.findings || ''}
                                    onChange={e => setFormData({ ...formData, findings: e.target.value })}
                                    className="w-full h-40 bg-bg border-2 border-border rounded-xl p-4 text-xs text-text-main focus:border-accent outline-none resize-none"
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Competencia Clave</label>
                                    <input
                                        value={formData.competence || ''}
                                        onChange={e => setFormData({ ...formData, competence: e.target.value })}
                                        className="w-full h-10 bg-bg border-2 border-border rounded-lg px-4 text-xs text-text-main focus:border-accent outline-none"
                                        placeholder="Ej: Liderazgo Adaptativo"
                                        disabled={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Cobertura Geográfica</label>
                                    <input
                                        value={formData.geographicCoverage || ''}
                                        onChange={e => setFormData({ ...formData, geographicCoverage: e.target.value })}
                                        className="w-full h-10 bg-bg border-2 border-border rounded-lg px-4 text-xs text-text-main focus:border-accent outline-none"
                                        placeholder="Ej: LATAM, Global"
                                        disabled={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Población / Muestra</label>
                                    <input
                                        value={formData.populationParams || ''}
                                        onChange={e => setFormData({ ...formData, populationParams: e.target.value })}
                                        className="w-full h-10 bg-bg border-2 border-border rounded-lg px-4 text-xs text-text-main focus:border-accent outline-none"
                                        placeholder="Ej: 50 CEOs"
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Diferencial Metodológico</label>
                                <input
                                    value={formData.methodology || ''}
                                    onChange={e => setFormData({ ...formData, methodology: e.target.value })}
                                    className="w-full h-10 bg-bg border-2 border-border rounded-lg px-4 text-xs text-text-main focus:border-accent outline-none"
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Iframe View */}
                    {showIframe && formData.url && (
                        <div className="flex-1 bg-white border-l-4 border-border flex flex-col">
                            <div className="h-10 border-b border-gray-200 flex items-center px-4 bg-gray-50 text-xs text-gray-400 gap-2">
                                <Globe size={12} />
                                <span className="truncate">{formData.url}</span>
                            </div>
                            <iframe
                                src={formData.url}
                                className="w-full h-full"
                                title="Preview"
                                sandbox="allow-same-origin allow-scripts allow-forms"
                            />
                            <div className="p-2 bg-yellow-50 text-[10px] text-yellow-700 text-center border-t border-yellow-200">
                                ¿No carga? <a href={formData.url} target="_blank" className="underline font-bold">Abrir nueva pestaña</a>.
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="h-20 border-t-4 border-border px-8 flex items-center justify-between bg-card-bg shrink-0">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        Base de Conocimiento Relacional
                    </div>
                    {!readOnly && (
                        <button
                            onClick={handleSaveInternal}
                            className="bg-accent text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-accent/20"
                        >
                            <Save size={16} />
                            Guardar Fuente
                        </button>
                    )}
                </div>

            </div>

            {/* DRIVE PICKER MODAL OVERLAY */}
            {showPicker && (
                <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-2xl flex items-center justify-center p-12 transition-all animate-in zoom-in-95 duration-300">
                    <div className="bg-panel border border-border rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden">
                        <div className="p-8 border-b border-border flex justify-between items-center bg-bg/80 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                                    <Cloud size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-text-main tracking-tight text-xl">Explorador de Drive</h3>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">Selecciona el recurso a vincular</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPicker(false)}
                                className="w-8 h-8 rounded-full hover:bg-panel hover:text-danger transition-all flex items-center justify-center"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* BREADCRUMBS */}
                        <div className="px-8 py-3 border-b border-border bg-gray-50/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {folderHistory.map((item, idx) => (
                                <div key={item.id} className="flex items-center text-xs whitespace-nowrap">
                                    <button
                                        onClick={() => handleBreadcrumbClick(idx)}
                                        className={`hover:bg-gray-200 px-2 py-1 rounded-md transition-colors ${idx === folderHistory.length - 1 ? 'font-bold text-gray-800' : 'text-gray-500'}`}
                                    >
                                        {item.name}
                                    </button>
                                    {idx < folderHistory.length - 1 && <ChevronRight size={12} className="text-gray-400 mx-1" />}
                                </div>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                            {loadingPicker ? (
                                <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-30">
                                    <Loader2 size={32} className="animate-spin mb-4" />
                                    <div className="text-[10px] font-black uppercase tracking-widest">Cargando Archivos...</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {pickerFiles.map(file => {
                                        const isFolder = file.mimeType === 'application/vnd.google-apps.folder' || file.mimeType === 'application/vnd.google-apps.shortcut'

                                        return (
                                            <button
                                                key={file.id}
                                                onClick={() => isFolder ? handleFolderClick(file) : selectFile(file)}
                                                className="flex items-center justify-between p-4 hover:bg-accent/5 rounded-[20px] text-left group transition-all border border-transparent hover:border-accent/20"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${isFolder ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'bg-white border border-gray-200 text-gray-500'
                                                        }`}>
                                                        {isFolder ? <Folder size={20} fill="currentColor" className="opacity-80" /> : <FileText size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-text-main group-hover:text-accent tracking-tight transition-colors">{file.name}</div>
                                                        {!isFolder && <div className="text-[10px] font-mono text-text-muted opacity-60 mt-0.5">{file.id}</div>}
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-accent/10 opacity-0 group-hover:opacity-100 flex items-center justify-center text-accent transition-all">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </button>
                                        )
                                    })}
                                    {pickerFiles.length === 0 && (
                                        <div className="py-20 text-center text-text-muted italic opacity-40">
                                            Carpeta vacía o sin acceso.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

```


# File: components/ResearchSPA.tsx
```typescript
'use client'

import React, { useState, useMemo } from 'react'
import { Search, Plus, BookOpen, Quote, Globe, ArrowRight, Filter, X } from 'lucide-react'
import ResearchForm from './ResearchForm'

import { useSearchParams } from 'next/navigation'

export default function ResearchSPA({ initialItems, session }: any) {
    const [items, setItems] = useState(initialItems)
    const [searchTerm, setSearchTerm] = useState('')

    // FILTERS STATE
    const [authorSearch, setAuthorSearch] = useState('')
    const [selectedPillar, setSelectedPillar] = useState('')
    const [selectedYear, setSelectedYear] = useState('')
    const [selectedMethodology, setSelectedMethodology] = useState('')

    const searchParams = useSearchParams()
    const urlId = searchParams.get('id')

    // Auto-select item from URL if present
    const [selectedItem, setSelectedItem] = useState<any>(() => {
        if (urlId) {
            return initialItems.find((i: any) => i.id === urlId) || null
        }
        return null
    })
    const [isCreating, setIsCreating] = useState(false)

    // Derived Data for Filters
    const uniqueYears = useMemo(() => {
        const years = new Set<string>()
        items.forEach((item: any) => {
            const match = item.apa?.match(/\((\d{4})\)/)
            if (match) years.add(match[1])
        })
        return Array.from(years).sort().reverse()
    }, [items])

    // METHODOLOGY GROUPING LOGIC
    const getMethodologyClass = (methodology: string | undefined) => {
        if (!methodology) return 'Otros'
        const lower = methodology.toLowerCase()

        if (lower.includes('mixt') || lower.includes('mix')) return 'Mixta'
        if (
            lower.includes('cuant') || lower.includes('quant') ||
            lower.includes('encuesta') || lower.includes('survey') ||
            lower.includes('estadístic') || lower.includes('regresión') ||
            lower.includes('sem') || lower.includes('scale') || lower.includes('escala')
        ) return 'Cuantitativa'

        if (
            lower.includes('cual') || lower.includes('qual') ||
            lower.includes('entrevista') || lower.includes('interview') ||
            lower.includes('focus') || lower.includes('caso') || lower.includes('case') ||
            lower.includes('revisión') || lower.includes('review') || lower.includes('teóric')
        ) return 'Cualitativa'

        return 'Otros'
    }

    const methodologyOptions = ['Cualitativa', 'Cuantitativa', 'Mixta', 'Otros']

    // Filtering Logic
    const filteredItems = items.filter((item: any) => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.metadata?.key_concepts?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesAuthor = !authorSearch || (item.apa && item.apa.toLowerCase().includes(authorSearch.toLowerCase()))

        const matchesPillar = !selectedPillar || (item.pillars && item.pillars.includes(selectedPillar))

        const matchesYear = !selectedYear || (item.apa && item.apa.includes(`(${selectedYear})`))

        // Use classification for methodology matching
        const itemClass = getMethodologyClass(item.methodology)
        const matchesMethodology = !selectedMethodology || itemClass === selectedMethodology

        return matchesSearch && matchesAuthor && matchesPillar && matchesYear && matchesMethodology
    })

    const handleSave = () => {
        window.location.reload() // Simple reload to refresh data
    }

    const clearFilters = () => {
        setAuthorSearch('')
        setSelectedPillar('')
        setSelectedYear('')
        setSelectedMethodology('')
        setSearchTerm('')
    }

    return (
        <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-accent/30 selection:text-accent pb-20">

            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b-4 border-border px-8 py-4 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between shrink-0 w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 text-white">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight leading-none">BIBLIOTECA DE INVESTIGACIÓN</h1>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Fuentes y Sustento Epistemológico</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Buscar conceptos..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-64 h-10 bg-card-bg border-2 border-border rounded-full pl-10 pr-4 text-xs font-bold text-text-main focus:w-80 focus:border-accent transition-all outline-none placeholder:text-text-muted/50"
                            />
                            <Search className="absolute left-3 top-2.5 text-text-muted group-focus-within:text-accent transition-colors" size={16} />
                        </div>

                        <button
                            onClick={() => setIsCreating(true)}
                            className="h-10 px-6 bg-text-main text-bg rounded-full text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-lg hover:shadow-accent/50 flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Nueva Fuente
                        </button>

                        <a href="/analitica" className="text-xs font-bold text-text-muted hover:text-accent transition-colors">
                            Volver
                        </a>
                    </div>
                </div>

                {/* FILTERS BAR */}
                <div className="flex items-center gap-4 w-full overflow-x-auto no-scrollbar pb-2">
                    <div className="flex items-center gap-2 text-text-muted px-2 border-r border-border/50">
                        <Filter size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
                    </div>

                    {/* Author Filter */}
                    <input
                        value={authorSearch}
                        onChange={(e) => setAuthorSearch(e.target.value)}
                        placeholder="Autor (Apellido)..."
                        className="h-8 bg-card-bg border border-border rounded-lg px-3 text-xs focus:border-accent outline-none min-w-[140px]"
                    />

                    {/* Pillar Filter */}
                    <select
                        value={selectedPillar}
                        onChange={(e) => setSelectedPillar(e.target.value)}
                        className="h-8 bg-card-bg border border-border rounded-lg px-2 text-xs focus:border-accent outline-none cursor-pointer"
                    >
                        <option value="">Todos los Pilares</option>
                        <option value="Shine In">Shine In</option>
                        <option value="Shine Out">Shine Out</option>
                        <option value="Shine Up">Shine Up</option>
                        <option value="Shine Beyond">Shine Beyond</option>
                    </select>

                    {/* Year Filter */}
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="h-8 bg-card-bg border border-border rounded-lg px-2 text-xs focus:border-accent outline-none cursor-pointer"
                    >
                        <option value="">Todos los Años</option>
                        {uniqueYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    {/* Methodology Filter */}
                    <select
                        value={selectedMethodology}
                        onChange={(e) => setSelectedMethodology(e.target.value)}
                        className="h-8 bg-card-bg border border-border rounded-lg px-2 text-xs focus:border-accent outline-none cursor-pointer max-w-[200px]"
                    >
                        <option value="">Todas las Metodologías</option>
                        {methodologyOptions.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    {(authorSearch || selectedPillar || selectedYear || selectedMethodology || searchTerm) && (
                        <button
                            onClick={clearFilters}
                            className="h-8 px-3 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ml-auto"
                        >
                            <X size={12} /> Limpiar
                        </button>
                    )}
                </div>
            </nav>

            {/* Main Grid */}
            <main className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item: any) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="group relative bg-card-bg border-2 border-transparent hover:border-accent rounded-[24px] p-6 hover:shadow-2xl hover:shadow-accent/10 transition-all duration-300 cursor-pointer flex flex-col h-[320px]"
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-100/50">
                                    <Quote size={18} className="text-yellow-600" />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-bg border border-border text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    {item.status}
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold leading-tight mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                                {item.title}
                            </h3>

                            {/* Summary Excerpt */}
                            <p className="text-xs text-text-muted leading-relaxed line-clamp-4 mb-4 flex-1">
                                {item.metadata?.summary || item.observations || 'Sin resumen disponible.'}
                            </p>

                            {/* Footer / Concepts */}
                            <div className="mt-auto pt-4 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">
                                    {item.metadata?.key_concepts?.split(',').slice(0, 3).map((c: string, i: number) => (
                                        <span key={i} className="text-[10px] font-bold text-accent bg-accent/5 px-2 py-1 rounded-md">
                                            #{c.trim()}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center justify-end mt-3 text-[10px] font-bold text-text-muted group-hover:text-text-main transition-colors gap-1">
                                    VER DETALLES <ArrowRight size={12} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Modals */}
            {(selectedItem || isCreating) && (
                <ResearchForm
                    initialData={selectedItem}
                    onClose={() => { setSelectedItem(null); setIsCreating(false) }}
                    onSave={handleSave}
                    readOnly={false}
                />
            )}
        </div>
    )
}

```


# File: components/Shell.tsx
```typescript
'use client'

import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Terminal, RefreshCw } from 'lucide-react'
import { signIn } from "next-auth/react"

export default function Shell({ children, session }: { children: React.ReactNode, session: any }) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Simplified Login View if no session 
    // (Note: MethodologySPA previously handled this internally, but now Shell wraps everything)
    if (!session) {
        return (
            <div className="fixed inset-0 bg-bg flex items-center justify-center transition-colors">
                <div className="text-center p-12 bg-panel border border-border rounded-2xl shadow-2xl max-w-sm w-full mx-4">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent animate-pulse">
                        <Terminal size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-text-main mb-2 tracking-tight">4Shine Builder</h2>
                    <p className="text-sm text-text-muted mb-8 leading-relaxed">Framework de Arquitectura Metodológica e Inventario de Activos.</p>
                    <button
                        onClick={() => signIn('google')}
                        className="w-full bg-accent text-white px-6 py-3.5 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-accent/20"
                    >
                        <RefreshCw size={20} className="animate-spin-slow" />
                        Acceder con Google Workspace
                    </button>
                    <p className="text-[10px] text-text-muted mt-8 uppercase tracking-[0.2em] font-bold opacity-40">System Release 1.2 Pro</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-bg text-text-main font-ui">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-panel border-b border-border flex items-center justify-between px-4 z-40">
               <div className="flex items-center gap-3">
                   <button 
                       onClick={() => setMobileMenuOpen(true)}
                       className="p-2 -ml-2 text-text-muted hover:text-accent transition-colors"
                   >
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <line x1="3" y1="12" x2="21" y2="12"></line>
                           <line x1="3" y1="6" x2="21" y2="6"></line>
                           <line x1="3" y1="18" x2="21" y2="18"></line>
                       </svg>
                   </button>
                   <span className="font-bold text-lg">4Shine</span>
               </div>
               {session?.user?.image && (
                   <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full border border-border" />
               )}
            </header>

            {/* Mobile Sidebar Backdrop */}
            {mobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <Sidebar 
                session={session} 
                collapsed={collapsed} 
                setCollapsed={setCollapsed}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />
            
            <main className="flex-1 overflow-auto bg-bg relative transition-all duration-300 md:pt-0 pt-16">
                {children}
            </main>
        </div>
    )
}

```


# File: components/Sidebar.tsx
```typescript
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Database,
    ShieldCheck,
    TreePine,
    Grid3X3,
    Tag,
    Zap,
    Book,
    BookOpen,
    Monitor,
    Activity,
    ChevronLeft,
    ChevronRight,
    LogOut
} from 'lucide-react'
import { signOut } from "next-auth/react"

// ... imports remain the same

interface SidebarProps {
    session: any
    collapsed: boolean
    setCollapsed: (v: boolean) => void
    mobileMenuOpen?: boolean
    setMobileMenuOpen?: (v: boolean) => void
}

const NavBtn = ({ id, label, icon, active, href, collapsed, onClick }: any) => {
    if (collapsed) {
        return (
            <Link
                href={href}
                onClick={onClick}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group
                ${active ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:bg-accent/10 hover:text-accent'}`}
                title={label}
            >
                {icon}
                {active && <div className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-white/20 rounded-l-full" />}
            </Link>
        )
    }

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden
            ${active ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:bg-accent/10 hover:text-accent'}`}
        >
            <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                {icon}
            </div>
            <span className="font-bold text-sm tracking-tight">{label}</span>
            {active && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20" />}
        </Link>
    )
}

const NavHeader = ({ label, collapsed }: any) => {
    if (collapsed) return <div className="h-4 border-b border-border mx-2 my-2 opacity-30" />
    return (
        <div className="text-[10px] font-black text-text-muted opacity-40 uppercase tracking-[0.2em] px-4 mt-6 mb-2">
            {label}
        </div>
    )
}

export function Sidebar({ session, collapsed, setCollapsed, mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
    const pathname = usePathname()
    // Normalizing currentView logic as in original SPA
    const currentView = pathname === '/' ? 'inventory' : pathname === '/inventario' ? 'inventory' : pathname.replace('/', '')

    const userRole = session?.user?.role?.toLowerCase() || 'curador'
    const userName = session?.user?.name || 'Usuario'
    const userAvatar = session?.user?.image

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark')
        localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }

    // Initialize theme on mount
    useEffect(() => {
        const stored = localStorage.getItem('theme') || 'light'
        if (stored === 'dark') document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
    }, [])

    const handleNavClick = () => {
        if (setMobileMenuOpen) {
            setMobileMenuOpen(false)
        }
    }

    return (
        <aside
            className={`bg-panel border-r border-border flex flex-col transition-all duration-300 ease-in-out shadow-2xl z-50
            fixed md:relative inset-y-0 left-0 h-full
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${collapsed ? 'w-[80px] p-4 items-center' : 'w-[280px] p-6'}`}
        >
            {/* Header */}
            <div className={`flex items-center justify-between mb-8 ${collapsed ? 'flex-col gap-4' : ''}`}>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg shadow-accent/30 shrink-0">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    {!collapsed && (
                        <div className="animate-in fade-in duration-300">
                            <span className="text-xl font-black text-text-main tracking-tighter mr-2">4Shine</span>
                            <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-accent/20">Pro</span>
                        </div>
                    )}
                </div>

                {!collapsed ? (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden md:flex w-6 h-6 rounded-full bg-bg border border-border items-center justify-center text-text-muted hover:text-accent transition-colors"
                    >
                        <ChevronLeft size={14} />
                    </button>
                ) : (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden md:flex w-6 h-6 rounded-full bg-bg border border-border items-center justify-center text-text-muted hover:text-accent transition-colors"
                    >
                        <ChevronRight size={14} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className={`flex flex-col gap-1.5 flex-1 overflow-y-auto no-scrollbar ${collapsed ? 'items-center w-full' : ''}`}>
                {userRole === 'admin' && (
                    <>
                        <NavHeader label="SISTEMA" collapsed={collapsed} />
                        <NavBtn id="admin" label="Administración" icon={<ShieldCheck size={18} />} active={currentView === 'admin'} href="/admin" collapsed={collapsed} onClick={handleNavClick} />
                        {!collapsed && <div className="my-3 border-t border-border opacity-50" />}
                    </>
                )}

                <NavHeader label="OPERACIÓN" collapsed={collapsed} />
                <NavBtn id="analytics" label="Analítica" icon={<Activity size={18} />} active={pathname.startsWith('/analitica')} href="/analitica" collapsed={collapsed} onClick={handleNavClick} />
                <NavBtn id="inventory" label="Inventario" icon={<Database size={18} />} active={pathname === '/inventario' || pathname === '/'} href="/inventario" collapsed={collapsed} onClick={handleNavClick} />
                <NavBtn id="research" label="Investigación" icon={<BookOpen size={18} />} active={pathname.startsWith('/research')} href="/research" collapsed={collapsed} onClick={handleNavClick} />

                {(userRole === 'admin' || userRole === 'auditor') && (
                    <NavBtn id="qa" label="Calidad (QA)" icon={<ShieldCheck size={18} />} active={currentView === 'qa'} href="/qa" collapsed={collapsed} onClick={handleNavClick} />
                )}

                <div className="h-4" />

                <NavHeader label="ARQUITECTURA" collapsed={collapsed} />
                <NavBtn id="taxonomy" label="Taxonomía" icon={<TreePine size={18} />} active={currentView === 'taxonomy'} href="/taxonomy" collapsed={collapsed} onClick={handleNavClick} />
                <NavBtn id="glossary" label="Glosario" icon={<Book size={18} />} active={currentView === 'glossary'} href="/glossary" collapsed={collapsed} onClick={handleNavClick} />
                <NavBtn id="gaps" label="Heatmap" icon={<Grid3X3 size={18} />} active={currentView === 'gap-analysis'} href="/gap-analysis" collapsed={collapsed} onClick={handleNavClick} />
                <NavBtn id="releases" label="Versiones" icon={<Tag size={18} />} active={currentView === 'releases'} href="/releases" collapsed={collapsed} onClick={handleNavClick} />
                <NavBtn id="generator" label="Compilador" icon={<Zap size={18} />} active={currentView === 'generator'} href="/generator" collapsed={collapsed} onClick={handleNavClick} />
            </nav>

            {/* Footer */}
            <div className={`mt-4 pt-4 border-t border-border flex flex-col gap-2 ${collapsed ? 'items-center' : ''}`}>
                <button
                    onClick={toggleTheme}
                    className={`w-full rounded-xl border border-border bg-bg hover:bg-border/20 transition-colors flex items-center justify-center text-text-muted ${collapsed ? 'h-10 w-10 p-0' : 'h-10 gap-2'}`}
                    title="Alternar Tema"
                >
                    <Monitor size={16} />
                    {!collapsed && <span className="text-xs font-bold">Cambiar Tema</span>}
                </button>

                <div className={`bg-bg/50 border border-border rounded-2xl p-3 shadow-sm hover:shadow-md transition-all group flex items-center gap-3 ${collapsed ? 'justify-center w-10 p-0 h-10 overflow-hidden' : ''}`}>
                    <div className={`rounded-xl overflow-hidden border border-border ring-2 ring-accent/10 group-hover:ring-accent/20 transition-all shrink-0 ${collapsed ? 'w-full h-full' : 'w-10 h-10'}`}>
                        {userAvatar ? <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-accent/10 text-accent flex items-center justify-center font-bold">👤</div>}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-black text-text-main truncate leading-tight">{userName}</div>
                            <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider truncate">{userRole}</div>
                        </div>
                    )}
                    {!collapsed && (
                        <button onClick={() => signOut()} className="text-text-muted hover:text-danger transition-colors">
                            <LogOut size={14} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    )
}

```


# File: components/TaxonomyGraph.tsx
```typescript
'use client'

import React, { useEffect, useState } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'

cytoscape.use(dagre)

type TaxonomyItem = {
    id: string
    name: string
    type: string
    active: boolean
    order: number
    parentId: string | null
    children?: TaxonomyItem[]
    parent?: TaxonomyItem
}

export default function TaxonomyGraph({ taxonomy }: { taxonomy: TaxonomyItem[] }) {
    const [elements, setElements] = useState<any[]>([])
    const [cyRef, setCyRef] = useState<cytoscape.Core | null>(null)
    const [currentLayout, setCurrentLayout] = useState('dagre')

    useEffect(() => {
        if (!taxonomy || taxonomy.length === 0) return

        const nodes: any[] = []
        const edges: any[] = []

        // Recursive function to traverse taxonomic tree
        const processNode = (node: TaxonomyItem, parentId: string | null = null) => {
            // Determine node style based on type
            let nodeColor = '#666'
            let nodeSize = 30
            let fontSize = 10
            let label = node.name
            let shape = 'ellipse'

            if (node.type === 'Pillar') {
                nodeColor = '#7e22ce' // Purple (Accent)
                nodeSize = 80
                fontSize = 16
                label = node.name.toUpperCase()
                shape = 'hexagon'
            } else if (node.type === 'Subcomponent') { // Level 2
                nodeColor = '#3b82f6' // Blue
                nodeSize = 50
                fontSize = 12
            } else if (node.type === 'Competence') { // Level 3
                nodeColor = '#10b981' // Emerald
                nodeSize = 30
                fontSize = 10
            } else if (node.type === 'Behavior') { // Level 4
                nodeColor = '#f59e0b' // Amber
                nodeSize = 20
                fontSize = 9
            }

            // Add Node
            nodes.push({
                data: {
                    id: node.id,
                    label: label,
                    type: node.type,
                    color: nodeColor,
                    size: nodeSize,
                    fontSize: fontSize,
                    shape: shape
                }
            })

            // Add Edge from Parent
            if (parentId) {
                edges.push({
                    data: {
                        source: parentId,
                        target: node.id
                    }
                })
            }

            // Process Children
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => processNode(child, node.id))
            }
        }

        // Start processing from root nodes (Pillars)
        taxonomy.forEach(item => processNode(item))

        setElements([...nodes, ...edges])
    }, [taxonomy])

    // Update layout when changed
    useEffect(() => {
        if (cyRef && elements.length > 0) {
            const layoutConfig = getLayoutConfig(currentLayout)
            try {
                const layout = cyRef.layout(layoutConfig)
                layout.run()
            } catch (e) {
                console.error("Layout error:", e)
            }
        }
    }, [currentLayout, elements, cyRef])

    const getLayoutConfig = (name: string) => {
        if (name === 'dagre') {
            return {
                name: 'dagre',
                rankDir: 'TB',
                spacingFactor: 1.5,
                padding: 50,
                animate: true,
                animationDuration: 500
            }
        }
        if (name === 'cose') {
            return {
                name: 'cose',
                animate: true,
                animationDuration: 500,
                padding: 50,
                componentSpacing: 80,
                nodeOverlap: 20,
                refresh: 20,
                fit: true,
                gravity: 80,
                numIter: 1000,
                initialTemp: 200,
                coolingFactor: 0.95,
                minTemp: 1.0
            }
        }
        if (name === 'circle') return { name: 'circle', padding: 50, animate: true, animationDuration: 500 }
        if (name === 'breadthfirst') return { name: 'breadthfirst', padding: 50, animate: true, animationDuration: 500, spacingFactor: 1.5 }
        if (name === 'grid') return { name: 'grid', padding: 50, animate: true, animationDuration: 500 }
        return { name: 'grid' }
    }

    const style = [
        {
            selector: 'node',
            style: {
                'background-color': 'data(color)',
                'label': 'data(label)',
                'width': 'data(size)',
                'height': 'data(size)',
                'font-size': 'data(fontSize)',
                'font-weight': 'bold',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'text-outline-width': 2,
                'text-outline-color': '#000',
                'text-outline-opacity': 0.3,
                'overlay-padding': '8px',
                'z-index': 10,
                'shape': 'data(shape)',
                'text-wrap': 'wrap',
                'text-max-width': '100px',
                'shadow-blur': 10,
                'shadow-color': '#000',
                'shadow-opacity': 0.2
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 2,
                'line-color': '#cbd5e1', // Slate-300
                'target-arrow-color': '#cbd5e1',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'arrow-scale': 1.2,
                'opacity': 0.8
            }
        },
        {
            selector: 'node:selected',
            style: {
                'border-width': 4,
                'border-color': '#fff',
                'border-opacity': 1,
                'shadow-blur': 20,
                'shadow-color': 'data(color)',
                'shadow-opacity': 0.6
            }
        }
    ]

    const handleZoomIn = () => {
        if (cyRef) {
            cyRef.zoom({
                level: cyRef.zoom() * 1.2,
                position: { x: cyRef.width() / 2, y: cyRef.height() / 2 }
            })
        }
    }

    const handleZoomOut = () => {
        if (cyRef) {
            cyRef.zoom({
                level: cyRef.zoom() * 0.8,
                position: { x: cyRef.width() / 2, y: cyRef.height() / 2 }
            })
        }
    }

    const handleFit = () => {
        if (cyRef) cyRef.fit()
    }

    return (
        <div className="w-full h-full bg-panel rounded-3xl border border-border overflow-hidden relative shadow-inner group">
            {/* Legend Overlay */}
            <div className="absolute top-6 left-6 z-10 bg-bg/90 backdrop-blur-xl p-4 rounded-2xl border border-border shadow-lg text-xs transition-opacity opacity-80 hover:opacity-100">
                <div className="font-black uppercase tracking-widest text-text-muted mb-3 opacity-70">Leyenda</div>
                <div className="space-y-2">
                    <LegendItem color="bg-purple-600" label="Pilar (N1)" icon="hexagon" />
                    <LegendItem color="bg-blue-500" label="Subcomponente (N2)" />
                    <LegendItem color="bg-emerald-500" label="Competencia (N3)" />
                    <LegendItem color="bg-amber-500" label="Conducta (N4)" />
                </div>
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
                <div className="bg-bg/90 backdrop-blur-xl p-1.5 rounded-2xl border border-border shadow-lg flex flex-col gap-1">
                    <ControlButton onClick={handleZoomIn} label="+" title="Zoom In" />
                    <ControlButton onClick={handleZoomOut} label="-" title="Zoom Out" />
                    <ControlButton onClick={handleFit} label="⤢" title="Fit to Screen" />
                </div>

                <div className="bg-bg/90 backdrop-blur-xl p-1.5 rounded-2xl border border-border shadow-lg flex flex-col gap-1 mt-2">
                    <div className="text-[9px] font-black uppercase text-center text-text-muted py-1 opacity-50 tracking-widest">Layout</div>
                    <LayoutButton active={currentLayout === 'dagre'} onClick={() => setCurrentLayout('dagre')} label="Tree" />
                    <LayoutButton active={currentLayout === 'cose'} onClick={() => setCurrentLayout('cose')} label="Organic" />
                    <LayoutButton active={currentLayout === 'breadthfirst'} onClick={() => setCurrentLayout('breadthfirst')} label="Circle" />
                </div>
            </div>

            <CytoscapeComponent
                elements={elements}
                style={{ width: '100%', height: '100%' }}
                cy={(cy) => setCyRef(cy)}
                layout={getLayoutConfig(currentLayout)}
                stylesheet={style as any}
                minZoom={0.2}
                maxZoom={3}
                wheelSensitivity={0.3}
                className="bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-80"
            />
        </div>
    )
}

function LegendItem({ color, label, icon }: { color: string, label: string, icon?: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${color} ${icon === 'hexagon' ? 'clip-hexagon' : 'rounded-full'} shadow-sm`}></div>
            <span className="font-bold text-text-main">{label}</span>
        </div>
    )
}

function ControlButton({ onClick, label, title }: { onClick: () => void, label: string, title: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-panel hover:bg-accent hover:text-white text-text-muted font-bold transition-all active:scale-90"
        >
            {label}
        </button>
    )
}

function LayoutButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-12 py-1.5 text-[10px] font-bold rounded-lg transition-all ${active
                ? 'bg-accent text-white shadow-md'
                : 'text-text-muted hover:bg-panel hover:text-text-main'
                }`}
        >
            {label}
        </button>
    )
}

```


# File: components/TaxonomyManager.tsx
```typescript
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
    Folder,
    FileText,
    PlusCircle,
    Edit2,
    Eye,
    EyeOff,
    ChevronRight,
    Loader2,
    Plus,
    Box,
    RefreshCw,
    Link as LinkIcon,
    BookOpen,
    Share2,
    List
} from 'lucide-react'
import TaxonomyGraph from './TaxonomyGraph'

type ContentItem = {
    id: string
    title: string
    type: string
    primaryPillar: string
    sub?: string | null
    competence?: string | null
    behavior?: string | null
}

type ResearchItem = {
    id: string
    title: string
    pillars?: string[]
    competence?: string | null
}

type TaxonomyItem = {
    id: string
    name: string
    type: string
    active: boolean
    order: number
    parentId: string | null
    children?: TaxonomyItem[]
}

export default function TaxonomyManager({
    initialData,
    inventory = [],
    research = []
}: {
    initialData: TaxonomyItem[],
    inventory?: ContentItem[],
    research?: ResearchItem[]
}) {
    const [data, setData] = useState<TaxonomyItem[]>(initialData)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'list' | 'visual'>('list')

    const getLinkedAssets = (node: TaxonomyItem, level: 'Pillar' | 'Sub' | 'Comp' | 'Behavior') => {
        const invMatches = inventory.filter(item => {
            if (level === 'Pillar') return item.primaryPillar === node.name
            if (level === 'Sub') return item.sub === node.name
            if (level === 'Comp') return item.competence === node.name
            if (level === 'Behavior') return item.behavior === node.name
            return false
        })

        const resMatches = research.filter(item => {
            if (level === 'Pillar') return item.pillars && item.pillars.includes(node.name)
            // For sub/comp/behavior, we check if competence matches or loosely match text if needed.
            // Assuming strict mapping via competence for L3. 
            if (level === 'Comp') return item.competence === node.name
            return false
        })

        // Map to common interface for display
        return [
            ...invMatches.map(i => ({ ...i, source: 'inventory' as const })),
            ...resMatches.map(r => ({ ...r, source: 'research' as const, type: 'Investigación' }))
        ]
    }

    const handleToggleActive = async (id: string, current: boolean) => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/taxonomy', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, active: !current })
            })
            if (res.ok) {
                const updateTree = (nodes: TaxonomyItem[]): TaxonomyItem[] => {
                    return nodes.map(n => {
                        if (n.id === id) return { ...n, active: !current }
                        if (n.children) return { ...n, children: updateTree(n.children) }
                        return n
                    })
                }
                setData(updateTree(data))
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddNode = async (parentId: string | null, type: string) => {
        const name = window.prompt(`Nuevo ${type}:`)
        if (!name) return

        setIsLoading(true)
        try {
            const res = await fetch('/api/taxonomy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type, parentId })
            })
            if (res.ok) {
                window.location.reload()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditName = async (id: string, currentName: string) => {
        const name = window.prompt('Editar nombre:', currentName)
        if (!name || name === currentName) return

        setIsLoading(true)
        try {
            const res = await fetch('/api/taxonomy', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name })
            })
            if (res.ok) {
                const updateTree = (nodes: TaxonomyItem[]): TaxonomyItem[] => {
                    return nodes.map(n => {
                        if (n.id === id) return { ...n, name }
                        if (n.children) return { ...n, children: updateTree(n.children) }
                        return n
                    })
                }
                setData(updateTree(data))
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleSync = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/taxonomy', { method: 'PUT' })
            const data = await res.json()
            if (res.ok) {
                alert(`Sincronización completada.\nAgregados: ${data.stats.added}\nEliminados: ${data.stats.deleted}\nExistentes: ${data.stats.exist}`)
                window.location.reload()
            }
        } catch (err) {
            console.error(err)
            alert('Error al sincronizar')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-panel border border-border rounded-3xl p-8 shadow-sm text-left">
            <header className="flex justify-between items-center mb-10 border-b border-border pb-6">
                <div>
                    <h3 className="text-2xl font-black text-text-main tracking-tighter flex items-center gap-3">
                        Arquitectura Estructural
                        <Box size={20} className="text-accent opacity-50" />
                    </h3>
                    <p className="text-sm text-text-muted mt-1 font-medium italic">Define pilares y subcomponentes del framework 4Shine.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSync}
                        className="bg-panel border border-border text-text-muted hover:text-accent hover:border-accent px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                        title="Sincronizar Pilares desde Assets"
                    >
                        <RefreshCw size={14} />
                        Actualizar
                    </button>
                    <button
                        onClick={() => handleAddNode(null, 'Pillar')}
                        className="bg-gray-100 text-gray-400 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed flex items-center gap-2"
                        title="Los pilares base son fijos (4Shine)"
                        disabled
                    >
                        <Plus size={16} />
                        Agregar Pilar
                    </button>
                </div>
            </header>

            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'list'
                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                        : 'bg-bg border border-border text-text-muted hover:border-accent hover:text-accent'
                        }`}
                >
                    <List size={16} />
                    Listado Detallado
                </button>
                <button
                    onClick={() => setActiveTab('visual')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'visual'
                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                        : 'bg-bg border border-border text-text-muted hover:border-accent hover:text-accent'
                        }`}
                >
                    <Share2 size={16} />
                    Esquema Visual
                </button>
            </div>

            {activeTab === 'visual' ? (
                <div className="h-[600px] w-full animate-in fade-in duration-500">
                    <TaxonomyGraph taxonomy={data} />
                </div>
            ) : (
                <div className="grid gap-6 animate-in fade-in duration-500">
                    {data.map(pillar => (
                        <div key={pillar.id} className={`group bg-bg border-2 border-border/40 rounded-3xl p-6 transition-all hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 ${!pillar.active ? 'opacity-50 grayscale' : ''}`}>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-accent/5 text-accent rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                                        <Folder size={24} fill={pillar.active ? 'currentColor' : 'none'} fillOpacity={0.2} />
                                    </div>
                                    <div>
                                        <div className="font-black text-xl text-text-main flex items-center gap-3 tracking-tight">
                                            {pillar.name}
                                            {!pillar.active && (
                                                <span className="text-[9px] bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded-full uppercase font-black tracking-widest">Inactivo</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-1 opacity-60">Pilar Maestría</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <IconButton icon={<Edit2 size={14} />} onClick={() => handleEditName(pillar.id, pillar.name)} />
                                    <IconButton icon={pillar.active ? <EyeOff size={14} /> : <Eye size={14} />} onClick={() => handleToggleActive(pillar.id, pillar.active)} />
                                    <button
                                        onClick={() => handleAddNode(pillar.id, 'Component')}
                                        className="bg-panel border border-border text-text-muted px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all flex items-center gap-2"
                                    >
                                        <PlusCircle size={14} /> Subcomponente
                                    </button>
                                </div>
                            </div>

                            {/* Linked Assets for Pillar */}
                            <LinkedAssets assets={getLinkedAssets(pillar, 'Pillar')} />

                            <div className="flex flex-col gap-3 ml-2 lg:ml-16 mt-4">
                                {pillar.children?.map(level2 => (
                                    <div key={level2.id} className="border border-border rounded-xl p-4 bg-panel/50">
                                        {/* LEVEL 2: SUBCOMPONENT */}
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-bold">L2</div>
                                                <span className="font-bold text-sm text-text-main">{level2.name}</span>
                                                <span className="text-[10px] text-text-muted uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-1.5 rounded">Subcomponente</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <IconButton icon={<Edit2 size={12} />} onClick={() => handleEditName(level2.id, level2.name)} />
                                                <IconButton icon={level2.active ? <EyeOff size={12} /> : <Eye size={12} />} onClick={() => handleToggleActive(level2.id, level2.active)} />
                                            </div>
                                        </div>

                                        {/* Linked Assets for L2 */}
                                        <LinkedAssets assets={getLinkedAssets(level2, 'Sub')} />

                                        {/* LEVEL 3: COMPETENCIA */}
                                        <div className="ml-8 border-l-2 border-border pl-4 grid gap-2">
                                            {level2.children?.map(level3 => (
                                                <div key={level3.id} className="group/l3">
                                                    <div className="flex justify-between items-center py-2 hover:bg-black/5 rounded px-2 -ml-2 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center text-[9px] font-bold">L3</div>
                                                            <span className="text-sm font-medium text-text-main">{level3.name}</span>
                                                            <span className="text-[9px] text-text-muted uppercase tracking-widest opacity-50">Competencia</span>
                                                        </div>
                                                    </div>

                                                    {/* Linked Assets for L3 */}
                                                    <LinkedAssets assets={getLinkedAssets(level3, 'Comp')} />

                                                    {/* LEVEL 4: CONDUCTA */}
                                                    <div className="ml-6 mt-1 space-y-1">
                                                        {level3.children?.map(level4 => (
                                                            <div key={level4.id}>
                                                                <div className="flex items-center gap-2 text-xs text-text-muted py-1 pl-2 border-l border-border hover:text-accent hover:border-accent transition-colors">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-accent" />
                                                                    <span>{level4.name}</span>
                                                                </div>
                                                                {/* Linked Assets for L4 */}
                                                                <LinkedAssets assets={getLinkedAssets(level4, 'Behavior')} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isLoading && (
                <div className="fixed inset-0 bg-bg/80 backdrop-blur-md flex items-center justify-center z-[100] transition-all">
                    <div className="bg-panel border border-border p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-6">
                        <Loader2 size={48} className="text-accent animate-spin" />
                        <div className="text-lg font-black text-text-main tracking-tighter uppercase tracking-widest">Sincronizando Arquitectura 4Shine</div>
                    </div>
                </div>
            )}
        </div>
    )
}

function IconButton({ icon, onClick }: { icon: React.ReactNode, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-10 h-10 rounded-xl bg-panel border border-border text-text-muted hover:border-accent hover:text-accent transition-all flex items-center justify-center hover:shadow-lg hover:shadow-accent/10 active:scale-90"
        >
            {icon}
        </button>
    )
}

function LinkedAssets({ assets }: { assets: any[] }) {
    if (assets.length === 0) return null
    return (
        <div className="ml-8 mb-3 pl-2 border-l-2 border-accent/20">
            <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <LinkIcon size={10} className="text-accent" />
                Fuentes ({assets.length})
            </div>
            <div className="flex flex-wrap gap-2">
                {assets.map((a, i) => {
                    const isResearch = a.source === 'research'
                    const href = isResearch ? `/research?id=${a.id}` : `/inventario?id=${a.id}`
                    return (
                        <Link key={a.id + i} href={href} className="group/link block">
                            <div className={`text-[10px] items-center gap-1.5 inline-flex bg-bg border px-2.5 py-1.5 rounded-lg hover:shadow-sm transition-all truncate max-w-[200px] ${isResearch
                                ? 'border-yellow-200 text-yellow-700 hover:border-yellow-500 hover:text-yellow-600'
                                : 'border-border text-text-muted hover:border-accent hover:text-accent'
                                }`} title={a.title}>
                                {isResearch ? <BookOpen size={10} /> : <FileText size={10} className="opacity-50 group-hover/link:text-accent" />}
                                <span className="truncate max-w-[150px]">{a.title}</span>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

```


# File: components/WorldMap.tsx
```typescript
import React, { memo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Manual mapping of region keywords to ISO-3 numeric codes (simplified subset)
// Standard codes: USA=840, CAN=124, BRA=076, COL=170, etc.
// Since we don't want to maintain a massive map, we'll check against continents if possible, 
// or just mapping key major countries for the "Region" visual.

const MAPPING: Record<string, string[]> = {
    "na": ["840", "124", "484"], // USA, Canada, Mexico
    "sa": ["076", "170", "032", "152", "604", "862", "858", "068"], // Brazil, Colombia, Argentina, Chile, Peru, Venezuela, Uruguay, Bolivia
    "eu": ["250", "276", "380", "724", "826", "620", "528", "056", "372", "752", "246"], // France, DE, IT, ES, UK, PT, NL, BE, IE, SE, FI
    "as": ["156", "392", "356", "360", "410", "702", "764", "608"], // CN, JP, IN, ID, KR, SG, TH, PH
    "oc": ["036", "554"], // AU, NZ
    "af": ["710", "818", "566", "231"] // ZA, EG, NG, ET
};

const WorldMap = ({ data }: { data: { name: string, value: number }[] }) => {

    // Identify active zones
    const activeZones = new Set<string>();

    data.forEach(d => {
        const name = d.name.toLowerCase();
        // Global = All
        if (name.includes('global') || name.includes('world') || name.includes('mundial')) {
            ['na', 'sa', 'eu', 'as', 'oc', 'af'].forEach(k => activeZones.add(k));
        }

        // Regions
        if (name.includes('north america') || name.includes('usa') || name.includes('canada')) activeZones.add('na');
        if (name.includes('latam') || name.includes('south america')) activeZones.add('sa');
        if (name.includes('europe')) activeZones.add('eu');
        if (name.includes('asia')) activeZones.add('as');
        if (name.includes('africa')) activeZones.add('af');

        // Specific Countries override (basic check)
        if (name.includes('colombia')) activeZones.add('170');
        if (name.includes('canada')) activeZones.add('124');
    });

    // Helper to check if a country ISO is active
    const isActive = (geoId: string) => {
        // Direct ID match?
        if (activeZones.has(geoId)) return true;

        // In an active region?
        for (const zone of Array.from(activeZones)) {
            if (MAPPING[zone]?.includes(geoId)) return true;
        }
        return false;
    };

    return (
        <div className="w-full h-full" data-tip="">
            <ComposableMap projectionConfig={{ scale: 200, center: [0, 0] }} style={{ width: "100%", height: "100%" }}>
                <ZoomableGroup>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const isHighlighted = isActive(geo.id);
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={isHighlighted ? "#00C49F" : "#E5E7EB"}
                                        stroke="#D1D5DB"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none", transition: "all 250ms" },
                                            hover: { fill: isHighlighted ? "#00A885" : "#D1D5DB", outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
        </div>
    );
};

export default memo(WorldMap);

```


# File: components/ui/Loading.tsx
```typescript
import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-background/80 backdrop-blur-sm z-50">
      <div className="relative w-24 h-24">
        <Image
          src="https://imageneseiconos.s3.us-east-1.amazonaws.com/iconos/loading.gif"
          alt="Loading..."
          fill
          className="object-contain"
          unoptimized // Required for external GIFs if domains aren't configured
          priority
        />
      </div>
    </div>
  );
}

```


# File: lib/audit.ts
```typescript
import prisma from './prisma'

export async function createLog(action: string, email: string, details?: string, resourceId?: string) {
    try {
        await prisma.systemLog.create({
            data: {
                action,
                userEmail: email,
                details,
                resourceId
            }
        })
    } catch (e) {
        console.error('Failed to create audit log:', e)
    }
}

```


# File: lib/auth.ts
```typescript
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import prisma from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    theme: {
        colorScheme: "dark",
        brandColor: "#58a6ff",
        logo: "https://github.com/fluidicon.png",
    },
    callbacks: {
        async signIn({ user }) {
            try {
                if (!user.email) return false

                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email }
                })

                // Defensive check: only block if explicitly false
                if (dbUser && (dbUser as any).isActive === false) {
                    return false
                }
                return true
            } catch (err) {
                console.error("SignIn Callback Error:", err)
                return true // Allow login if DB is down? Or false? 
                // Let's allow for now to avoid complete lockout if it's a minor DB hiccup
            }
        },
        async session({ session }) {
            try {
                if (session.user?.email) {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: session.user.email }
                    })

                    if (dbUser) {
                        (session.user as any).role = String(dbUser.role).toLowerCase()
                            ; (session.user as any).isActive = (dbUser as any).isActive ?? true
                    } else if (session.user.email === 'andrestablarico@gmail.com') {
                        (session.user as any).role = 'admin'
                            ; (session.user as any).isActive = true
                    } else {
                        (session.user as any).role = 'guest'
                            ; (session.user as any).isActive = true
                    }
                }
            } catch (err) {
                console.error("Session Callback Error:", err)
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
}

```


# File: lib/drive.ts
```typescript

import { google } from 'googleapis'
import { SystemSettingsService } from './settings'

// Polyfill for pdf-parse compatibility in Next.js Server Environment
if (typeof global.DOMMatrix === 'undefined') {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix { }
}

// @ts-ignore
const pdf = require('pdf-parse')

/**
 * Utility functions for handling Google Drive links and IDs
 */

// Regex to extract file ID from common Google Drive URLs
const DRIVE_ID_REGEX = /[-\w]{25,}/

export const extractDriveId = (input: string): string | null => {
    if (!input) return null
    if (/^[-\w]{25,}$/.test(input)) return input
    const match = input.match(DRIVE_ID_REGEX)
    return match ? match[0] : null
}

export type DriveFile = {
    id: string
    name: string
    mimeType: string
    thumbnailLink?: string
    webViewLink?: string
}

async function getDriveClient() {
    const config = await SystemSettingsService.getDriveConfig()

    if (!config.serviceAccountJson) {
        throw new Error('Service Account config not found')
    }

    try {
        const credentials = JSON.parse(config.serviceAccountJson)
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive']
        })
        return google.drive({ version: 'v3', auth })
    } catch (e) {
        throw new Error('Invalid Service Account JSON')
    }
}

export const listDriveFiles = async (folderId: string): Promise<DriveFile[]> => {
    try {
        const drive = await getDriveClient()

        console.log(`[Real Drive API] Listing files for folder: ${folderId}`)

        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, thumbnailLink, webViewLink)',
            pageSize: 50,
            orderBy: 'name',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        })

        const files = res.data.files || []

        return files.map(f => ({
            id: f.id || '',
            name: f.name || 'Untitled',
            mimeType: f.mimeType || 'application/octet-stream',
            thumbnailLink: f.thumbnailLink || undefined,
            webViewLink: f.webViewLink || undefined
        }))

    } catch (error) {
        console.error("Drive API Error:", error)
        if (String(error).includes('Service Account')) {
            throw error
        }
        throw error
    }
}

export const getFileContent = async (fileId: string): Promise<string> => {
    const drive = await getDriveClient()

    // 1. Get File Metadata to check type
    const meta = await drive.files.get({ fileId, fields: 'mimeType, name' })
    const mimeType = meta.data.mimeType

    console.log(`[Drive] Fetching content for ${fileId} (${mimeType})`)

    try {
        if (mimeType === 'application/vnd.google-apps.document') {
            // Google Doc -> Export as Text
            const res = await drive.files.export({
                fileId,
                mimeType: 'text/plain'
            })
            return typeof res.data === 'string' ? res.data : ''
        } else if (mimeType === 'application/pdf') {
            // PDF -> Download -> Parse
            console.log(`[Drive] Downloading PDF ${fileId}...`)
            const res = await drive.files.get({
                fileId,
                alt: 'media'
            }, { responseType: 'arraybuffer' })

            if (!res.data) throw new Error('No receiving data from Drive')

            // @ts-ignore
            const buffer = Buffer.from(res.data as ArrayBuffer)
            console.log(`[Drive] Parsing PDF buffer (${buffer.length} bytes)...`)

            if (typeof pdf !== 'function') {
                console.error('[Drive] pdf-parse is not a function:', typeof pdf, pdf)
                throw new Error('PDF parser (v1) initialization failed')
            }

            const data = await pdf(buffer)
            return data.text

        } else if (mimeType?.startsWith('text/')) {
            // Plain Text
            const res = await drive.files.get({
                fileId,
                alt: 'media'
            })
            return typeof res.data === 'string' ? res.data : JSON.stringify(res.data)

        } else if (mimeType === 'application/vnd.google-apps.presentation') {
            // Google Slides -> Export as Text
            const res = await drive.files.export({
                fileId,
                mimeType: 'text/plain'
            })
            return typeof res.data === 'string' ? res.data : ''

        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || // .docx
            mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
        ) {
            console.log(`[Drive] Downloading Office File ${fileId}...`)
            const res = await drive.files.get({
                fileId,
                alt: 'media'
            }, { responseType: 'arraybuffer' })

            if (!res.data) throw new Error('No receiving data from Drive')

            // @ts-ignore
            const buffer = Buffer.from(res.data as ArrayBuffer)
            console.log(`[Drive] Parsing Office File buffer (${buffer.length} bytes)...`)

            try {
                // @ts-ignore
                const officeParser = require('officeparser')

                // Use Promise API (v6+) which returns AST
                const ast = await officeParser.parseOffice(buffer)

                // Extract text from AST (check if it has toText method, or fallback)
                const text = (ast && typeof ast.toText === 'function')
                    ? ast.toText()
                    : (typeof ast === 'string' ? ast : JSON.stringify(ast))

                return text
            } catch (err: any) {
                console.error('[Drive] Office Parser Error:', err)
                throw new Error(`Failed to parse Office file: ${err.message}`)
            }
        }

        return ''
    } catch (e: any) {
        console.error('Error getting file content:', e)
        throw new Error(`[Drive Content Error] ${e.message || e}`)
    }
}

import fs from 'fs'
import path from 'path'
import os from 'os'
import { pipeline } from 'stream/promises'

export const downloadDriveFile = async (fileId: string): Promise<{ path: string, mimeType: string, originalName: string }> => {
    const drive = await getDriveClient()

    // 1. Get Metadata
    const meta = await drive.files.get({ fileId, fields: 'name, mimeType' })
    const fileName = meta.data.name || 'downloaded_file'
    const mimeType = meta.data.mimeType || 'application/octet-stream'

    // 2. Prepare Temp Path
    const tempPath = path.join(os.tmpdir(), `gemini_${fileId}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`)

    console.log(`[Drive] Downloading ${fileName} to ${tempPath}...`)

    // 3. Download Stream
    const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
    )

    // 4. Save to Disk
    await pipeline(res.data, fs.createWriteStream(tempPath))

    console.log(`[Drive] Download complete: ${tempPath}`)
    return { path: tempPath, mimeType, originalName: fileName }
}

export const uploadToDrive = async (filename: string, buffer: Buffer, mimeType: string, folderId: string): Promise<string> => {
    try {
        const drive = await getDriveClient()

        console.log(`[Drive] Uploading file: ${filename} to folder: ${folderId}`)

        const response = await drive.files.create({
            requestBody: {
                name: filename,
                parents: [folderId],
                description: 'Uploaded via 4Shine Methodology Builder'
            },
            media: {
                mimeType: mimeType,
                body: require('stream').Readable.from(buffer)
            },
            fields: 'id, webViewLink',
            supportsAllDrives: true,
            // @ts-ignore - some versions of the SDK might not have this in types but it's valid
            supportsTeamDrives: true
        })

        if (!response.data.id) {
            throw new Error('Failed to get Drive ID after upload')
        }

        return response.data.id
    } catch (error: any) {
        console.error('Drive Upload Error:', error)
        throw new Error(`[Drive Upload Error] ${error.message || error}`)
    }
}

```


# File: lib/gemini.ts
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"
import { SystemSettingsService } from "./settings"
import prisma from "./prisma"

export class GeminiService {
    static async analyzeContent(text: string, context?: string) {
        if (!text || text.length < 50) return null

        // Upgrading to Pro models for higher reasoning and better observations
        const modelsToTry = [
            "gemini-2.0-flash", // Preferred for speed/reasoning balance
            "gemini-2.5-flash", // Latest experimental
            "gemini-1.5-flash-latest" // Fallback
        ]

        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || null
        if (!apiKey) throw new Error("GEMINI_API_KEY no configurada.")

        // 1. Fetch Dynamic Context (RAG)
        // We get examples of high-quality validated assets to guide the IA
        const validatedSamples = await prisma.contentItem.findMany({
            where: { status: 'Validado' },
            take: 5,
            select: {
                title: true,
                primaryPillar: true,
                secondaryPillars: true,
                sub: true,
                competence: true,
                behavior: true,
                observations: true
            }
        })

        const dynamicContext = validatedSamples.length > 0
            ? "\nEJEMPLOS DE ACTIVOS VALIDADOS (Referencia de Estilo y Nivel):\n" +
            validatedSamples.map(s => `
            - Título: ${s.title}
            - Pilar: ${s.primaryPillar} (${(s.secondaryPillars as string[]).join(', ')})
            - Sub: ${s.sub} | Competencia: ${s.competence}
            - Conducta: ${s.behavior}
            - Observación Clave: ${s.observations?.substring(0, 300)}...
            `).join('\n')
            : "";

        // Massive Context Injection
        const methodologyReference = `
        METODOLOGÍA 4SHINE DE CARMENZA ALARCÓN:
        - Propósito: Fortalecer liderazgo y marca personal ("Brillar").
        - Pilar 1: SHINE WITHIN (Dominio Interior). Subcomponentes: Autoconfianza, Inteligencia emocional, Propósito personal.
        - Pilar 2: SHINE OUT (Presencia y Proyección). Subcomponentes: Comunicación poderosa, Influencia positiva, Networking estratégico.
        - Pilar 3: SHINE UP (Visión y Estrategia). Subcomponentes: Política Organizacional, Liderazgo Estratégico, Negociación Avanzada, Gestión de Stakeholders.
        - Pilar 4: SHINE BEYOND (Trascendencia y Legado). Subcomponentes: Mentoría & Coaching, Innovación y Futuro, Sostenibilidad del Éxito, Transferencia de Conocimiento.
        Principios: Liderazgo de adentro hacia afuera, autenticidad, bienestar y resultados estratégicos.
        `;

        const prompt = `
            Eres la INTELIGENCIA ARTIFICIAL MAESTRA de la METODOLOGÍA 4SHINE. Tu razonamiento debe ser de NIVEL EJECUTIVO (C-Level).
            Analiza el contenido adjunto usando la siguiente GUÍA DE REFERENCIA:
            ${methodologyReference}

            ${dynamicContext}

            ${context ? `--- INSTRUCCIONES ESPECÍFICAS DE CONTEXTO ---\n${context}\n-------------------------------------------` : ''}

            --- REGLAS DE ORO DE ANÁLISIS ---
            0. **IDIOMA OBLIGATORIO**: TODO el contenido generado (summary, observations, relation4Shine, findings, etc.) DEBE estar en ESPAÑOL, incluso si el texto original está en inglés u otro idioma. TRADUCE Y ADAPTA si es necesario.
            1. SELECCIÓN DE PILAR OBLIGATORIA: DEBES elegir uno de los 4 pilares (Shine In, Shine Out, Shine Up, Shine Beyond) como "primaryPillar". Solo usa "Transversal" si el contenido es 100% administrativo, pero siempre prioriza la vinculación metodológica.
            2. RESEÑA FIEL: El campo "summary" NO debe ser genérico. Debe ser una reseña/resumen fiel y detallado de lo que realmente dice el archivo. Si es un video, describe la narrativa. Si es un toolkit, describe las herramientas.
            3. CRITERIO DE EXPERTO: Tus sugerencias de "sub", "competence" y "behavior" deben ser ultra-específicas al contenido analizado.

            --- MANDATO DE OBSERVACIONES (OBLIGATORIO) ---
            El campo "observations" DEBE ser extenso (1000 a 2000 caracteres) y seguir esta estructura interna:
            1. [ANÁLISIS DE IMPACTO]: Explica cómo este contenido específico desactiva creencias limitantes y activa el "brillo" del líder.
            2. [CONEXIÓN METODOLÓGICA]: Relaciona el contenido con el pilar principal y explica por qué se vincula también con los pilares secundarios sugeridos.
            3. [GUÍA DEL FACILITADOR]: Da 5 pasos tácticos para que un mentor use este material de forma transformadora.
            4. [CONDUCTA OBSERVABLE]: Describe cómo se verá el líder una vez que haya integrado este conocimiento.

            --- REGLAS DE COMPLETITUD (100% OBLIGATORIO) ---
            - Todos los campos del JSON deben estar presentes y completados con datos lógicos.
            - "type": PDF, Video, Audio, Toolkit, Test, Rúbrica, Workbook, Documento maestro.
            - "maturity": Básico, En Desarrollo, Avanzado, Maestría.
            - "primaryPillar": OBLIGATORIO (Shine In, Shine Out, Shine Up, o Shine Beyond).
            - "secondaryPillars": Array de strings con otros pilares relevantes.
            - "completeness": Siempre calcular un porcentaje de 0 a 100 basado en tu propio análisis.

            Return ONLY a valid JSON object.

            JSON STRUCTURE:
            {
              "title": "Título oficial de alto impacto",
              "summary": "Reseña fiel, técnica y detallada del contenido analizado",
              "keyConcepts": "Lista de conceptos teóricos o técnicos fundamentales definidos en el texto",
              "type": "CÓDIGO_TIPO",
              "primaryPillar": "Pilar Principal Seleccionado",
              "secondaryPillars": ["Pilar Secundario 1", "Pilar Secundario 2"],
              "sub": "Subcomponente Específico",
              "competence": "Competencia Maestra",
              "behavior": "Conducta Observable específica",
              "maturity": "Nivel de Madurez",
              "targetRole": "Rol Objetivo",
              "duration": "90",
              "intervention": "Conciencia | Práctica | Herramienta | Evaluación",
              "moment": "Inicio | Refuerzo | Profundización | Cierre",
              "language": "ES",
              "format": "Formato Técnico",
              "completeness": 100,
              "observations": "TEXTO_DE_ANÁLISIS_PROFUNDO_DENSE_Y_ESTRATÉGICO",
              "apa": "Si se solicita en contexto o es relevante paper: Cita APA 7",
              "findings": "Si se solicita en contexto: Hallazgos clave",
              "methodology": "Si se solicita en contexto: Metodología usada",
              "relation4Shine": "Si se solicita en contexto: Explicación específica de relación con 4Shine",
              "pillars": ["Shine In", "Shine Out"], // Si se solicita sugerencia de pilares multiples
              "competence": "Si es investigación: Competencia técnica abordada",
              "geographicCoverage": "Si es investigación: Alcance geográfico (Global, LATAM, etc.)",
              "populationParams": "Si es investigación: Muestra o perfil demográfico participante"
            }

            CONTENT TO ANALYZE:
            ${text.substring(0, 30000)} 
        `

        let lastError = null

        for (const modelName of modelsToTry) {
            try {
                console.log(`[Gemini] Executive Analysis attempting: ${modelName}...`)
                const genAI = new GoogleGenerativeAI(apiKey!)
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.3, // Maximum rigor, minimum randomness
                        maxOutputTokens: 2500,
                    }
                })
                const result = await model.generateContent(prompt)
                const response = await result.response
                const textResponse = response.text()

                const jsonText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim()
                const parsed = JSON.parse(jsonText)

                // Final check to prevent lazy output
                if (parsed.observations.length < 200) {
                    throw new Error("Respuesta de IA insuficiente bajo criterio de calidad.");
                }

                return parsed
            } catch (error: any) {
                lastError = error
                console.error(`[Gemini] Analysis failed or low quality on ${modelName}:`, error.message)
                continue
            }
        }

        throw new Error(`[Gemini All Models Failed] Último error: ${lastError?.message || lastError}`)
    }

    static async uploadMedia(filePath: string, mimeType: string) {
        const { GoogleAIFileManager } = require("@google/generative-ai/server");

        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || null
        if (!apiKey) throw new Error("GEMINI_API_KEY no configurada.")

        const fileManager = new GoogleAIFileManager(apiKey);

        console.log(`[Gemini] Uploading ${mimeType} to File API...`);
        const uploadResponse = await fileManager.uploadFile(filePath, {
            mimeType,
            displayName: "Asset Analysis Media",
        });

        console.log(`[Gemini] Upload complete: ${uploadResponse.file.uri} (Name: ${uploadResponse.file.name})`);

        return {
            uri: uploadResponse.file.uri,
            name: uploadResponse.file.name,
            mimeType: uploadResponse.file.mimeType,
            state: uploadResponse.file.state
        }
    }

    static async checkFileState(fileId: string) {
        const { GoogleAIFileManager } = require("@google/generative-ai/server");
        let apiKey = await SystemSettingsService.getGeminiApiKey() || process.env.GEMINI_API_KEY
        const fileManager = new GoogleAIFileManager(apiKey);
        const file = await fileManager.getFile(fileId);
        return file.state; // 'PROCESSING', 'ACTIVE', 'FAILED'
    }

    static async generateFromUri(uri: string, mimeType: string) {
        let apiKey = await SystemSettingsService.getGeminiApiKey() || process.env.GEMINI_API_KEY
        const genAI = new GoogleGenerativeAI(apiKey!)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        console.log(`[Gemini] Requesting analysis for URI: ${uri}...`);
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: mimeType,
                    fileUri: uri
                }
            },
            {
                text: `
                Act as a professional transcriber and analyst.
                1. Provide a FULL, ACCURATE TRANSCRIPTION of the audio/video.
                2. If there are visual slides, describe them briefly in brackets like [Slide: Title].
                3. Do not summarize yet, just transcribe faithfully.
                `
            }
        ]);

        return result.response.text();
    }

    static async transcribeMedia(filePath: string, mimeType: string): Promise<string> {
        // ... Legacy Wrapper for backward compatibility or small files ...
        const upload = await this.uploadMedia(filePath, mimeType)

        // Wait loop
        let state = upload.state
        while (state === 'PROCESSING') {
            await new Promise(resolve => setTimeout(resolve, 5000));
            state = await this.checkFileState(upload.name)
            if (state === 'FAILED') throw new Error('Video processing failed.')
        }

        return this.generateFromUri(upload.uri, upload.mimeType)
    }
}

```


# File: lib/id-generator.ts
```typescript
import prisma from './prisma'

const TYPE_PREFIXES: Record<string, string> = {
    'PDF': 'P',
    'Documento': 'P',
    'Video': 'V',
    'Audio': 'A',
    'Texto': 'T',
    'Artículo': 'T',
    'Toolkit': 'K',
    'Plantilla': 'K',
    'Test': 'E',
    'Evaluación': 'E',
    'Rúbrica': 'R',
    'Workbook': 'W',
    'Documento maestro': 'D'
}

export class IdGeneratorService {
    /**
     * Generates a unique ID following the pattern 4S-[Prefix]-[NNN]
     * Prefix depends on the Content Type.
     * NNN is a sequential number per type, never reused.
     */
    static async generateId(contentType: string): Promise<string> {
        // 1. Get Prefix
        // Normalize type (Gemini might return different strings)
        let prefix = 'X' // Default if type unknown

        for (const [key, val] of Object.entries(TYPE_PREFIXES)) {
            if (contentType?.toLowerCase().includes(key.toLowerCase())) {
                prefix = val
                break
            }
        }

        // 2. Manage sequence in SystemSettings to ensure "Never Reused"
        const settingsKey = 'id_sequences'
        const settings = await prisma.systemSettings.findUnique({ where: { key: settingsKey } })

        // Value format: { [prefix]: number }
        let sequences: Record<string, number> = (settings?.value as any) || {}

        const nextNumber = (sequences[prefix] || 0) + 1
        sequences[prefix] = nextNumber

        // Update the sequence in DB before returning
        await prisma.systemSettings.upsert({
            where: { key: settingsKey },
            update: { value: sequences },
            create: { key: settingsKey, value: sequences }
        })

        // 3. Format: 4S-[Prefix]-[000]
        const paddedNumber = nextNumber.toString().padStart(3, '0')
        return `4S-${prefix}-${paddedNumber}`
    }
}

```


# File: lib/mail.ts
```typescript

import nodemailer from 'nodemailer'
import { SystemSettingsService, EmailConfig } from './settings'

const getTransporter = async (overrideConfig?: EmailConfig) => {
    const config = overrideConfig || await SystemSettingsService.getEmailConfig()

    if (!config) {
        throw new Error('Email configuration not found in System Settings')
    }

    return nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465, // true for 465, false for other ports
        auth: {
            user: config.smtpUser,
            pass: config.smtpPass,
        },
    })
}

export async function sendAccessRequestEmail(userEmail: string, userName: string) {
    const adminEmail = 'andrestablarico@gmail.com'

    try {
        const config = await SystemSettingsService.getEmailConfig()
        if (!config) return

        const transporter = await getTransporter(config)

        // Determine sender: "Name <email>" or just email
        const fromName = config.senderName || 'Methodology Builder'
        const fromEmail = config.senderEmail || config.smtpUser
        const from = `"${fromName}" <${fromEmail}>`

        const mailOptions = {
            from,
            to: adminEmail,
            subject: `Nueva Solicitud de Acceso: ${userName}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Nueva Solicitud de Acceso</h2>
                    <p>Un usuario ha solicitado acceso a la plataforma Methodology Builder.</p>
                    <br/>
                    <p><strong>Nombre:</strong> ${userName}</p>
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <br/>
                    <p>Por favor, ingresa al panel de administración para Aprobar o Rechazar esta solicitud.</p>
                    <br/>
                    <a href="${process.env.NEXTAUTH_URL}/admin" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Panel de Admin</a>
                </div>
            `,
        }

        await transporter.sendMail(mailOptions)
        console.log(`Email notification sent to ${adminEmail} for user ${userEmail}`)
    } catch (error) {
        console.error('Error sending email notification:', error)
    }
}

export async function sendTestEmail(to: string, config: EmailConfig) {
    try {
        const transporter = await getTransporter(config)

        const fromName = config.senderName || 'Methodology Builder Test'
        const fromEmail = config.senderEmail || config.smtpUser
        const from = `"${fromName}" <${fromEmail}>`

        const mailOptions = {
            from,
            to,
            subject: `Prueba de Configuración de Correo`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>¡Configuración Exitosa!</h2>
                    <p>Este es un correo de prueba enviado desde Methodology Builder.</p>
                    <br/>
                    <p><strong>Configuración utilizada:</strong></p>
                    <ul>
                        <li>Host: ${config.smtpHost}</li>
                        <li>Puerto: ${config.smtpPort}</li>
                        <li>Usuario: ${config.smtpUser}</li>
                        <li>Remitente: ${from}</li>
                    </ul>
                </div>
            `,
        }

        await transporter.sendMail(mailOptions)
        return { success: true }
    } catch (error: any) {
        console.error('Error sending test email:', error)
        throw new Error(error.message || 'Error sending test email')
    }
}

```


# File: lib/openai.ts
```typescript
import OpenAI from 'openai'
import { SystemSettingsService } from "./settings"

export class OpenAIService {
    static async generateContent(prompt: string, model: string = "gpt-4o", options?: any) {
        let apiKey = await SystemSettingsService.getOpenAIApiKey()
        if (!apiKey) apiKey = process.env.OPENAI_API_KEY || null
        if (!apiKey) throw new Error("OPENAI_API_KEY no configurada.")

        const openai = new OpenAI({ apiKey })

        try {
            console.log(`[OpenAI] Generating with ${model}...`)
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: model,
                temperature: 0.4,
                max_tokens: 4096, // Reasonable limit for GPT-4o
                top_p: 0.95,
                ...options
            })

            return completion.choices[0].message.content
        } catch (error: any) {
            console.error(`[OpenAI] Generation failed:`, error.message)
            throw error
        }
    }
    static async analyzeContent(text: string, context?: string) {
        if (!text || text.length < 50) return null

        let apiKey = await SystemSettingsService.getOpenAIApiKey()
        if (!apiKey) apiKey = process.env.OPENAI_API_KEY || null
        if (!apiKey) throw new Error("OPENAI_API_KEY no configurada.")

        const prisma = (await import('@/lib/prisma')).default

        // 1. Fetch Dynamic Context (RAG)
        const validatedSamples = await prisma.contentItem.findMany({
            where: { status: 'Validado' },
            take: 3,
            select: {
                title: true,
                primaryPillar: true,
                sub: true,
                competence: true,
                behavior: true,
            }
        })

        const dynamicContext = validatedSamples.length > 0
            ? "\nEJEMPLOS DE ACTIVOS VALIDADOS (Referencia):\n" +
            validatedSamples.map((s: any) => `
            - Título: ${s.title}
            - Pilar: ${s.primaryPillar}
            - Sub: ${s.sub} | Competencia: ${s.competence}
            `).join('\n')
            : "";

        const prompt = `
            Eres la INTELIGENCIA ARTIFICIAL MAESTRA de la METODOLOGÍA 4SHINE. Tu razonamiento debe ser de NIVEL EJECUTIVO (C-Level).
            Analiza el contenido adjunto.

            ${dynamicContext}

            ${context ? `--- CONTEXTO ADICIONAL ---\n${context}\n-------------------------` : ''}

            --- REGLAS DE ORO ---
            0. **IDIOMA**: SIEMPRE ESPAÑOL.
            1. **PILARES**: Shine In, Shine Out, Shine Up, Shine Beyond. Prioriza uno.
            2. **CALIDAD**: Sé ultra-específico. Nada de generalidades.

            --- JSON OUTPUT OBLIGATORIO ---
            Responde ÚNICAMENTE con un objeto JSON válido. NO Markdown.
            
            Estructura JSON:
            {
              "title": "Título oficial sugerido",
              "summary": "Reseña técnica detallada",
              "type": "PDF | Video | Audio | Toolkit | Test",
              "primaryPillar": "Shine In | Shine Out | Shine Up | Shine Beyond",
              "secondaryPillars": ["Pilar 2"],
              "sub": "Subcomponente",
              "competence": "Competencia",
              "behavior": "Conducta Observable",
              "maturity": "Básico | En Desarrollo | Avanzado | Maestría",
              "targetRole": "Líder | Mentor",
              "duration": "90",
              "completeness": 100,
              "observations": "Análisis profundo de impacto y conexión metodológica.",
              "apa": "Cita APA 7 (si aplica)",
              "findings": "Hallazgos clave (si aplica)",
              "methodology": "Metodología (si aplica)",
              "relation4Shine": "Vinculación 4Shine (si aplica)"
            }

            CONTENT TO ANALYZE:
            ${text.substring(0, 50000)}
        `

        const openai = new OpenAI({ apiKey })

        try {
            console.log(`[OpenAI] Analyzing content with gpt-4o...`)
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o",
                temperature: 0.2, // Low temp for extraction
                response_format: { type: "json_object" } // Enforce JSON mode
            })

            const content = completion.choices[0].message.content
            if (!content) throw new Error("OpenAI returned empty content")

            return JSON.parse(content)

        } catch (error: any) {
            console.error(`[OpenAI] Analysis failed:`, error.message)
            throw error
        }
    }
}

```


# File: lib/prisma.ts
```typescript
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

```


# File: lib/settings.ts
```typescript

import prisma from "@/lib/prisma"

export type EmailConfig = {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
    senderName?: string
    senderEmail?: string
}

export type DriveConfig = {
    authorizedFolderIds: string[]
    rootFolderId?: string
    serviceAccountJson?: string
}

export class SystemSettingsService {

    // --- Email ---
    static async getEmailConfig(): Promise<EmailConfig | null> {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'email_config' }
        })
        return setting?.value as EmailConfig | null
    }

    static async saveEmailConfig(config: EmailConfig) {
        return prisma.systemSettings.upsert({
            where: { key: 'email_config' },
            update: { value: config },
            create: { key: 'email_config', value: config }
        })
    }

    // --- Drive ---
    static async getDriveConfig(): Promise<DriveConfig> {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'drive_config' }
        })
        return (setting?.value as DriveConfig) || { authorizedFolderIds: [] }
    }

    static async saveDriveConfig(config: DriveConfig) {
        return prisma.systemSettings.upsert({
            where: { key: 'drive_config' },
            update: { value: config },
            create: { key: 'drive_config', value: config }
        })
    }

    // --- Gemini ---
    static async getGeminiApiKey(): Promise<string | null> {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'gemini_api_key' }
        })
        return setting?.value as string | null
    }

    static async saveGeminiApiKey(key: string) {
        return prisma.systemSettings.upsert({
            where: { key: 'gemini_api_key' },
            update: { value: key },
            create: { key: 'gemini_api_key', value: key }
        })
    }

    // --- OpenAI ---
    static async getOpenAIApiKey(): Promise<string | null> {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'openai_api_key' }
        })
        return setting?.value as string | null
    }

    static async saveOpenAIApiKey(key: string) {
        return prisma.systemSettings.upsert({
            where: { key: 'openai_api_key' },
            update: { value: key },
            create: { key: 'openai_api_key', value: key }
        })
    }


}

```


# File: prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Methodology {
  id        String   @id @default(cuid())
  version   String   @unique
  status    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ContentItem {
  id               String              @id
  title            String
  type             String
  version          String
  status           String
  ip               String?
  completeness     Int                 @default(0)
  driveId          String?
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt
  level            String?
  sub              String?
  authorizedUse    String?
  behavior         String?
  challengeType    String?
  competence       String?
  confidentiality  String?
  duration         String?
  evidenceRequired String?
  fileUrl          String?
  format           String?
  impactScore      Boolean?
  industry         String?
  intervention     String?
  ipOwner          String?
  ipType           String?
  language         String?
  maturity         String?
  moment           String?
  nextContentId    String?
  observations     String?
  outcomeType      String?
  prereqId         String?
  publicVisibility Boolean?
  recommendation   String?
  reuseExternal    Boolean?
  roleLevel        String?
  source           String?
  targetRole       String?
  testId           String?
  trigger          String?
  uploadedAt       DateTime?
  variable         String?
  vipUsage         Boolean?
  year             String?
  releaseId        String?
  primaryPillar    String              @default("Transversal")
  secondaryPillars String[]            @default([])
  transcription    String?
  metadata         Json?
  geminiName       String?
  geminiUri        String?
  release          MethodologyRelease? @relation(fields: [releaseId], references: [id])
  researchSources  ResearchSource[]    @relation("ContentReferences")

  @@index([releaseId])
}

model ResearchSource {
  id                 String        @id @default(cuid())
  title              String
  apa                String?
  url                String?
  summary            String?
  keyConcepts        String?
  findings           String?
  methodology        String?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  relation4Shine     String?
  driveId            String?
  pillars            String[]      @default([])
  transcription      String?
  competence         String?
  geographicCoverage String?
  populationParams   String?
  referencedBy       ContentItem[] @relation("ContentReferences")
}

model MethodologyRelease {
  id          String        @id @default(cuid())
  tag         String        @unique
  description String?
  status      String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  contents    ContentItem[]
}

model Taxonomy {
  id       String     @id @default(cuid())
  name     String
  type     String
  parentId String?
  active   Boolean    @default(true)
  order    Int        @default(0)
  parent   Taxonomy?  @relation("TaxonomyHierarchy", fields: [parentId], references: [id])
  children Taxonomy[] @relation("TaxonomyHierarchy")
}

model User {
  email     String      @id
  name      String?
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  isActive  Boolean     @default(true)
  role      Role        @default(CURADOR)
  logs      SystemLog[]
}

model SystemLog {
  id         Int      @id @default(autoincrement())
  action     String
  details    String?
  resourceId String?
  userEmail  String
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userEmail], references: [email])
}

model Artifact {
  id      String   @id @default(cuid())
  name    String
  type    String
  lastGen DateTime @updatedAt
  link    String?
}

model SystemSettings {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
}

model GenerationHistory {
  id        String   @id @default(cuid())
  user      String?
  prompt    String
  response  String
  type      String
  assets    String[]
  createdAt DateTime @default(now())
  research  String[] @default([])
}

model GlossaryTerm {
  id         String   @id @default(cuid())
  term       String   @unique
  definition String
  pillars    String[] @default([])
  source     String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

enum Role {
  METODOLOGO
  CURADOR
  AUDITOR
  ADMIN
}

```


# File: prisma/seed.ts
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 1. Methodology
    const method = await prisma.methodology.upsert({
        where: { version: 'v1.0' },
        update: {},
        create: {
            version: 'v1.0',
            status: 'Borrador',
        },
    })
    console.log('Created Methodology:', method)

    // 2. Taxonomy (Pillars & Subcomponents)
    const taxonomyData = [
        {
            name: 'Shine In',
            subcomponents: ['Mentalidad & Mindset', 'Gestión Emocional', 'Propósito & Valores', 'Biohacking & Energía']
        },
        {
            name: 'Shine Out',
            subcomponents: ['Estrategia de Networking', 'Marca Personal Digital', 'Pitch & Storytelling', 'Comunicación de Impacto']
        },
        {
            name: 'Shine Up',
            subcomponents: ['Política Organizacional', 'Liderazgo Estratégico', 'Negociación Avanzada', 'Gestión de Stakeholders']
        },
        {
            name: 'Shine Beyond',
            subcomponents: ['Mentoría & Coaching', 'Innovación y Futuro', 'Sostenibilidad del Éxito', 'Transferencia de Conocimiento']
        }
    ]

    for (const p of taxonomyData) {
        const pillar = await prisma.taxonomy.upsert({
            where: { id: `p-${p.name.replace(/\s/g, '').toLowerCase()}` },
            update: { name: p.name, active: true },
            create: {
                id: `p-${p.name.replace(/\s/g, '').toLowerCase()}`,
                name: p.name,
                type: 'Pillar',
                active: true,
                order: 0
            }
        })

        for (const [index, s] of p.subcomponents.entries()) {
            await prisma.taxonomy.upsert({
                where: { id: `s-${s.replace(/\s/g, '').toLowerCase()}` },
                update: { name: s, active: true, parentId: pillar.id, order: index },
                create: {
                    id: `s-${s.replace(/\s/g, '').toLowerCase()}`,
                    name: s,
                    type: 'Component',
                    active: true,
                    parentId: pillar.id,
                    order: index
                }
            })
        }
    }

    // 3. Content Items from Prototype (New Dataset)
    const contents = [
        { id: '4S-P-001', title: 'Guía Fundamental de Networking', type: 'PDF', primaryPillar: 'Shine Out', secondaryPillars: [], sub: 'Networking', maturity: 'Básico', status: 'Approved', complete: 100, ip: 'Propio', driveId: 'VALID_ID' },
        { id: '4S-V-020', title: 'Video: Elevator Pitch TED', type: 'Video', primaryPillar: 'Shine In', secondaryPillars: [], sub: 'Comunicación', maturity: 'Intermedio', status: 'Review', complete: 90, ip: 'Tercero', driveId: 'VALID_ID' },
        { id: '4S-T-099', title: 'Matriz de Influencia Política', type: 'Herramienta', primaryPillar: 'Shine Up', secondaryPillars: [], sub: 'Influencia', maturity: 'Avanzado', status: 'Draft', complete: 20, ip: 'Completar', driveId: null },
        { id: '4S-P-002', title: 'Checklist de LinkedIn', type: 'PDF', primaryPillar: 'Shine Out', secondaryPillars: [], sub: 'Marca Personal', maturity: 'Básico', status: 'Approved', complete: 100, ip: 'Propio', driveId: 'VALID_ID' },
        { id: '4S-D-105', title: 'Manual Facilitador Módulo 1', type: 'Doc', primaryPillar: 'Transversal', secondaryPillars: [], sub: 'General', maturity: 'N/A', status: 'Draft', complete: 40, ip: 'Propio', driveId: null }
    ]

    for (const c of contents) {
        await prisma.contentItem.upsert({
            where: { id: c.id },
            update: {
                title: c.title,
                type: c.type,
                primaryPillar: c.primaryPillar,
                secondaryPillars: c.secondaryPillars,
                sub: c.sub,
                maturity: c.maturity,
                level: c.maturity,
                status: c.status,
                ip: c.ip,
                completeness: c.complete,
                driveId: c.driveId
            },
            create: {
                id: c.id,
                title: c.title,
                type: c.type,
                primaryPillar: c.primaryPillar,
                secondaryPillars: c.secondaryPillars,
                sub: c.sub,
                maturity: c.maturity,
                level: c.maturity,
                version: 'v1.0',
                status: c.status,
                ip: c.ip,
                completeness: c.complete,
                driveId: c.driveId,
            },
        })
    }
    // 4. Artifacts
    const artifacts = [
        { name: "Dossier Maestro", type: "PDF", lastGen: new Date() },
        { name: "Workbook Participante", type: "PDF", lastGen: new Date() },
        { name: "Guía de Facilitador", type: "Doc", lastGen: new Date() },
    ]
    for (const a of artifacts) {
        await prisma.artifact.create({
            data: a
        })
    }

    // 5. Seed Admin User
    const adminEmail = 'andrestablarico@gmail.com'
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: 'ADMIN' },
        create: {
            email: adminEmail,
            name: 'Andres Tabla (Admin)',
            role: 'ADMIN'
        }
    })
    console.log('Admin user seeded.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

```


# File: prisma/seed_research.ts
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 12 Records provided by user + Relation to 4Shine + Pillars
const records = [
    {
        title: "1. Liderazgo y Carácter del Líder (Crossan et al., 2017)",
        apa: "Crossan, M., Seijts, G., & Gandz, J. (2017). Toward a Framework of Leader Character in Organizations. Journal of Management Studies, 54(7), 986-1008.",
        url: "https://www.researchgate.net/publication/313473422_Toward_a_Framework_of_Leader_Character_in_Organizations",
        summary: "Artículo seminal que propone un marco conceptual integral sobre el carácter del líder (11 dimensiones lideradas por el Juicio).",
        concepts: "Carácter del líder, Virtudes, Juicio (prudence), Competencias, Liderazgo efectivo",
        findings: "El carácter es esencial y complementario a las competencias. Se identificó el Juicio como la dimensión central que orquesta a las demás.",
        methods: "Estudio multimétodo: grupos focales + encuestas 360° a casi 2000 ejecutivos.",
        rel4shine: "Fundamenta el pilar 'Esencia del Líder' en 4Shine. Valida que el carácter no es 'soft' sino estructural para el desempeño. El 'Juicio' corresponde a nuestra dimensión de Toma de Decisiones Consciente.",
        pillars: ["Shine In"]
    },
    {
        title: "2. Entrelazamiento Carácter-Competencia (Sturm, Vera & Crossan, 2017)",
        apa: "Sturm, R. E., Vera, D., & Crossan, M. (2017). The entanglement of leader character and leader competence and its impact on performance. The Leadership Quarterly, 28(3), 349-366.",
        url: "https://corescholar.libraries.wright.edu/cgi/viewcontent.cgi?article=1010&context=management",
        summary: "Estudio conceptual sobre el 'entrelazamiento' profundo entre carácter y competencia para un desempeño extraordinario sostenido.",
        concepts: "Entrelazamiento carácter-competencia, Learning-by-living, Desempeño extraordinario",
        findings: "Alto entrelazamiento genera performance superior largo plazo. Requiere aprendizaje por experiencia (vivencial).",
        methods: "Teórico-conceptual / Revisión interdisciplinaria.",
        rel4shine: "Sustenta la integración de 'Ser' (Carácter) y 'Hacer' (Competencia) que propone 4Shine. Refuerza que la excelencia técnica sin base ética es insostenible.",
        pillars: ["Shine In", "Shine Out"]
    },
    {
        title: "3. Carácter del Líder y Resultados en Colaboradores (Monzani et al., 2021)",
        apa: "Monzani, L., Seijts, G. H., & Crossan, M. m. (2021). Character matters: The network structure of leader character and its relation to follower positive outcomes. PLoS ONE, 16(9), e0255940.",
        url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0255940",
        summary: "Estudio cuantitativo de redes que muestra cómo el Juicio y el Ímpetu (Drive) conectan el carácter del líder con el bienestar de los seguidores.",
        concepts: "Network structure, Juicio (prudence), Ímpetu (drive), Resultados positivos del seguidor",
        findings: "Juicio es central. Juicio y Drive son los puentes clave para impactar el engagement y bienestar del equipo.",
        methods: "Cuantitativo: Análisis de Redes y CFA en 188 díadas líder-colaborador.",
        rel4shine: "Evidencia cómo el liderazgo impacta en el 'Engagement' y resultados del equipo, alineándose con nuestro pilar de 'Liderazgo de Alto Impacto' y bienestar organizacional.",
        pillars: ["Shine Out", "Shine In"]
    },
    {
        title: "4. Revisión Sistemática sobre Personal Branding (Gorbatov, Khapova & Lysova, 2018)",
        apa: "Gorbatov, S., Khapova, S. N., & Lysova, E. I. (2018). Personal branding: Interdisciplinary systematic review and research agenda. Frontiers in Psychology, 9, 2238.",
        url: "https://www.frontiersin.org/articles/10.3389/fpsyg.2018.02238/full",
        summary: "Revisión sistemática que integra definiciones y propone un modelo de inputs-procesos-resultados del personal branding.",
        concepts: "Marca personal, Personal branding, Nomología de marca, Modelo integrador",
        findings: "Definición integradora: proceso estratégico de gestión de impresiones basado en identidad única que aporta valor.",
        methods: "Revisión sistemática de >100 fuentes académicas.",
        rel4shine: "Base teórica para el pilar de 'Marca Personal'. Clarifica la diferencia entre autopromoción y gestión estratégica de la reputación basada en valor.",
        pillars: ["Shine Up"]
    },
    {
        title: "5. Marca Personal de Líderes en Redes (Venciūtė, Yue & Thelen, 2023)",
        apa: "Venciūtė, D., Yue, C. A., & Thelen, P. D. (2023). Leaders’ personal branding and communication on professional social media platforms. Journal of Brand Management, 30(1), 43-65.",
        url: "https://ideas.repec.org/a/pal/jobman/v30y2023i1d10.1057s41262-022-00293-6.html",
        summary: "Estudio cualitativo sobre cómo ejecutivos usan LinkedIn para beneficios personales y corporativos (reputación, talento).",
        concepts: "Marca personal ejecutiva, Presencia estratégica en redes, Motivaciones duales",
        findings: "Lideres motivados por legado y beneficio empresa. La autenticidad y visibilidad estratégica refuerzan la confianza.",
        methods: "Cualitativo: 25 entrevistas en profundidad a líderes senior.",
        rel4shine: "Justifica la necesidad de la 'Visibilidad Digital' en líderes modernos. Conecta la marca del líder con el Employer Branding (atracción de talento).",
        pillars: ["Shine Up", "Shine Beyond"]
    },
    {
        title: "6. Branding Personal del Dueño y Reputación (Situmorang & Salamah, 2018)",
        apa: "Situmorang, F. A. R., & Salamah, U. (2018). Analysis of personal branding and leadership branding company owner and company reputation. Jurnal InterAct, 7(2), 1-5.",
        url: "http://repository.atmajaya.ac.id/id/eprint/3001",
        summary: "Caso de estudio de cómo la marca personal filantrópica de un dueño ('Mr. T') se transfiere a la reputación corporativa.",
        concepts: "Marca personal del dueño, Liderazgo branding, Reputación corporativa",
        findings: "La marca personal del líder ES la marca de la empresa en estos contextos. Actos visibles (filantropía) generan confianza.",
        methods: "Estudio de caso cualitativo (Indonesia), análisis de contenido.",
        rel4shine: "Demuestra el efecto 'halo' de la marca personal del líder sobre la reputación corporativa, clave para dueños y empresarios.",
        pillars: ["Shine Up", "Shine Beyond"]
    },
    {
        title: "7. Modelo de Desarrollo del Carácter (Crossan et al., 2021)",
        apa: "Crossan, M., Mazutis, D., Seijts, G., & Byrne, A. (2021). Towards a model of leader character development: Insights from anatomy and music therapy. The Leadership Quarterly, 32(4), 101480.",
        url: "https://www.researchgate.net/publication/348616182_Towards_a_Model_of_Leader_Character_Development",
        summary: "Modelo holístico 'PABC' (Fisiología, Afecto, Comportamiento, Cognición) para desarrollar carácter, usando analogía musical.",
        concepts: "Desarrollo del carácter, Anatomía del carácter (PABC), Musicoterapia",
        findings: "Desarrollar carácter requiere alinear cuerpo, emoción, mente y hábito. Intervenciones como música pueden ejercitar el sistema completo.",
        methods: "Ensayo teórico conceptual transdisciplinario.",
        rel4shine: "Apoya metodología vivencial de 4Shine: el liderazgo no se aprende solo intelectualmente, requiere intervención en conductas, emociones y mentalidad (PABC).",
        pillars: ["Shine In"]
    },
    {
        title: "8. Presencia Ejecutiva y Employee Engagement (Chukwuma & Okonkwo, 2023)",
        apa: "Chukwuma, C., & Okonkwo, C. (2023). Executive presence and employee engagement: An empirical analogy. Journal of Management Information and Decision Sciences, 26(2), 100–112.",
        url: "https://www.abacademies.org/articles/executive-presence-and-employee-engagement-an-empirical-analogy-15638.html",
        summary: "Correlación empírica muy alta entre presencia ejecutiva (gravitas, comunicación) y el compromiso de empleados.",
        concepts: "Presencia ejecutiva (EP), Employee engagement, Gravitas",
        findings: "Relación casi perfecta (r=0.95). Líderes con presencia inspiran mayor dedicación y energía en sus equipos.",
        methods: "Cuantitativo: Encuesta a 74 gerentes, correlación y regresión.",
        rel4shine: "Evidencia estadística para el pilar de 'Presencia Ejecutiva' y 'Comunicación'. La forma (presencia, gravitas) fondo impacta resultados tangibles (engagement).",
        pillars: ["Shine Up", "Shine Out"]
    },
    {
        title: "9. Liderazgo Virtuoso para Inclusión (Grimani & Gotsis, 2020)",
        apa: "Grimani, A., & Gotsis, G. (2020). Fostering inclusive organizations through virtuous leadership. En The Routledge Companion to Inclusive Leadership.",
        url: "https://www.taylorfrancis.com/chapters/edit/10.4324/9780429449673-9/fostering-inclusive-organizations-virtuous-leadership-alexandra-grimani-george-gotsis",
        summary: "Marco conceptual de cómo las virtudes (humildad, justicia) fomentan inclusión natural al satisfacer pertenencia y unicidad.",
        concepts: "Liderazgo virtuoso, Liderazgo inclusivo, Resultados multinivel",
        findings: "El líder virtuoso es inclusivo por naturaleza (derriba barreras de ego). Satisface necesidades de pertenencia y autorrealización.",
        methods: "Revisión conceptual teórica.",
        rel4shine: "Vincula el liderazgo ético con la construcción de Culturas Inclusivas, un resultado esperado de aplicar 4Shine en equipos diversos.",
        pillars: ["Shine In", "Shine Out"]
    },
    {
        title: "10. Soft Skills e Innovación (Ballester-Miquel et al., 2026)",
        apa: "Ballester-Miquel, J. C., Pérez-Ruiz, P., et al. (2026). The role of soft skills in workplace innovation... Journal of Innovation & Knowledge, 11(1).",
        url: "https://www.sciencedirect.com/science/article/pii/S2444569X2500055X",
        summary: "Estudio cuantitativo que identifica Liderazgo y Resolución de Problemas como los soft skills top para la innovación.",
        concepts: "Soft skills, Innovación en el lugar de trabajo, Liderazgo influenciador, Problem-solving",
        findings: "Liderazgo es el driver #1 de innovación, seguido de Resolución de Problemas. Clave para ventaja competitiva.",
        methods: "Cuantitativo: PLS-SEM en 125 profesionales.",
        rel4shine: "Posiciona las 'Habilidades Blandas' (Soft Skills) como motor de rentabilidad e innovación, no solo como 'nice to have'.",
        pillars: ["Shine Out", "Shine Beyond"]
    },
    {
        title: "11. Liderazgo Inclusivo y Éxito de Proyectos (Javed et al., 2025)",
        apa: "Javed, W., Younis, A., & Noor, U. (2025). The impact of inclusive leadership on project success... Journal of Positive School Psychology.",
        url: "https://www.researchgate.net/publication/366961446_The_Impact_of_Inclusive_Leadership_on_Project_Success_A_Serial_Mediation_Analysis",
        summary: "Liderazgo inclusivo mejora éxito de proyectos mediado por engagement, potenciado por el autosacrificio del líder.",
        concepts: "Liderazgo inclusivo, Éxito de proyectos, Autosacrificio, Engagement mediador",
        findings: "Inclusión genera engagement -> éxito. El líder que 'se sacrifica' por el equipo potencia este efecto.",
        methods: "Cuantitativo: Modelo de mediación/moderación en serie (n=400).",
        rel4shine: "Conecta el liderazgo humano con el Éxito de Proyectos (KPis). Refuerza la idea de 'Liderazgo de Servicio' transversal a resultados.",
        pillars: ["Shine Out", "Shine Beyond"]
    },
    {
        title: "12. Beneficios del Executive Coaching (Longenecker & McCartney, 2020)",
        apa: "Longenecker, C. O., & McCartney, K. (2020). The benefits of executive coaching: Voices from the C-suite. Strategic HR Review.",
        url: "https://www.emerald.com/insight/content/doi/10.1108/SHR-11-2019-0086/full/html",
        summary: "Voces de 70 ejecutivos (C-suite) sobre beneficios del coaching: autoconciencia, control de ego, enfoque estratégico.",
        concepts: "Coaching ejecutivo, C-suite, Inteligencia emocional, Control del ego",
        findings: "Beneficios tangibles (enfoque, alineación) e intangibles (bajar la guardia, apoyo emocional, reducción de soledad).",
        methods: "Cualitativo: Entrevistas y focus groups a 70 ejecutivos.",
        rel4shine: "Valida científicamente la metodología de Coaching Ejecutivo como herramienta para C-Levels, mejorando autoconciencia y ROI.",
        pillars: ["Shine In", "Shine Up"]
    }
]

async function main() {
    console.log(`Start seeding research SOURCES...`)
    let count = 0

    // Clean previous records in ContentItem that were temporary (with ID starting with RES-)
    try {
        await prisma.contentItem.deleteMany({ where: { id: { startsWith: 'RES-' } } })
        console.log('Cleaned up simple ContentItem research records.')
    } catch (e) { console.log('Cleanup skipped or failed', e) }

    for (const r of records) {
        count++
        const id = `RS-${String(count).padStart(3, '0')}` // New ID scheme for ResearchSource

        await prisma.researchSource.upsert({
            where: { id },
            update: {
                title: r.title,
                apa: r.apa,
                url: r.url,
                summary: r.summary,
                keyConcepts: r.concepts,
                findings: r.findings,
                methodology: r.methods,
                relation4Shine: r.rel4shine,
                pillars: r.pillars || []
            },
            create: {
                id,
                title: r.title,
                apa: r.apa,
                url: r.url,
                summary: r.summary,
                keyConcepts: r.concepts,
                findings: r.findings,
                methodology: r.methods,
                relation4Shine: r.rel4shine,
                pillars: r.pillars || []
            }
        })
    }
    console.log(`Seeding finished. ${count} ResearchSource records processed.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

```


# File: types/officeparser.d.ts
```typescript
declare module 'officeparser' {
    export interface OfficeParserAST {
        toText(): string;
        // Add other properties if needed
    }

    export function parseOffice(
        file: string | Buffer | ArrayBuffer,
        config?: any
    ): Promise<OfficeParserAST>;

    export function parseOffice(
        file: string | Buffer | ArrayBuffer,
        callback: (ast: OfficeParserAST, err: any) => void
    ): void;
}

```


# File: types/react-cytoscapejs.d.ts
```typescript
declare module 'react-cytoscapejs' {
    import { Component } from 'react'
    import cytoscape from 'cytoscape'

    export interface CytoscapeComponentProps {
        id?: string;
        className?: string;
        style?: React.CSSProperties;
        stylesheet?: cytoscape.Stylesheet[];
        elements: cytoscape.ElementDefinition[];
        layout?: cytoscape.LayoutOptions;
        cy?: (cy: cytoscape.Core) => void;
        minZoom?: number;
        maxZoom?: number;
        userZoomingEnabled?: boolean;
        wheelSensitivity?: number;
    }

    export default class CytoscapeComponent extends Component<CytoscapeComponentProps> {
        static normalizeElements(data: any): any;
    }
}

declare module 'cytoscape-dagre';

```


# File: package.json
```json
{
  "name": "methodology-builder",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "@types/d3-scale": "^4.0.9",
    "@types/react-simple-maps": "^3.0.6",
    "cytoscape": "^3.33.1",
    "cytoscape-dagre": "^2.5.0",
    "d3-scale": "^4.0.2",
    "googleapis": "^170.0.0",
    "lucide-react": "^0.562.0",
    "mermaid": "^11.12.2",
    "next": "16.1.1",
    "next-auth": "^4.24.13",
    "nodemailer": "^7.0.12",
    "officeparser": "^6.0.4",
    "openai": "^6.16.0",
    "pdf-parse": "^1.1.1",
    "react": "19.2.3",
    "react-cytoscapejs": "^2.0.0",
    "react-dom": "19.2.3",
    "react-simple-maps": "^3.0.0",
    "recharts": "^3.6.0",
    "sonner": "^2.0.7"
  },
  "devDependencies": {
    "@prisma/client": "^5.22.0",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/nodemailer": "^7.0.5",
    "@types/react": "^19",
    "@types/react-cytoscapejs": "^1.2.6",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.1",
    "prisma": "^5.22.0",
    "tailwindcss": "^4",
    "tsx": "^4.21.0",
    "typescript": "^5"
  }
}

```


# File: next.config.ts
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;

```


# File: README.md
```md
# 4Shine Methodology Builder

**Internal Tool for 4Shine Methodology Management and Generation.**

This application allows the management of the 4Shine methodology inventory, taxonomy, and artifact generation.

## Features

- **Dashboard**: Real-time metrics and backlog tracking.
- **Inventario Maestro**: Centralized content management.
- **Taxonomía**: Hierarchical pillar visualization.
- **Gap Analysis**: Coverage reporting.
- **Gobernanza & IP**: IP validation and compliance.
- **Generador**: Document generation interface.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Neon (PostgreSQL)
- **ORM**: Prisma
- **Styling**: Tailwind CSS v4

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/andrestabla/repository.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup Database**:
   Configure `.env` with your Neon connection string:
   ```env
   DATABASE_URL="postgresql://..."
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## Deployment

Deployed on [Vercel](https://vercel.com/algoritmo-ts-projects/repository).

```
