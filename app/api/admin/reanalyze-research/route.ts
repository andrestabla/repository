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
