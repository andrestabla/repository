
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Allow longer timeout for large detailed exports
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        console.log("📝 [NotebookLM Export] Starting Generation...")

        // 1. Fetch ALL Valid Assets with full details
        const assets = await prisma.contentItem.findMany({
            where: { status: 'Validado' },
            orderBy: [
                { primaryPillar: 'asc' },
                { sub: 'asc' }, // By component
                { title: 'asc' }
            ]
        })

        // 2. Fetch ALL Research
        const research = await prisma.researchSource.findMany({
            orderBy: { title: 'asc' }
        })

        // 3. Build Markdown content
        let md = `# Base de Conocimiento 4Shine (Exportación NotebookLM)
**Fecha:** ${new Date().toISOString().split('T')[0]}
**Total Activos:** ${assets.length}
**Total Investigaciones:** ${research.length}

---

# 1. INVENTARIO DE ACTIVOS (METODOLOGÍA)
Esta sección contiene todos los activos validados de la metodología 4Shine, organizados por Pilar y Componente.

`

        // Helper to group by Pillar -> Component
        const grouped: Record<string, Record<string, typeof assets>> = {}

        for (const asset of assets) {
            const pillar = asset.primaryPillar || 'Sin Pilar'
            const component = asset.sub || 'General' // 'sub' is the Component field

            if (!grouped[pillar]) grouped[pillar] = {}
            if (!grouped[pillar][component]) grouped[pillar][component] = []

            grouped[pillar][component].push(asset)
        }

        // Iterate and build hierarchy
        for (const pillar of Object.keys(grouped).sort()) {
            md += `## PILAR: ${pillar.toUpperCase()}\n\n`

            const components = grouped[pillar]
            for (const comp of Object.keys(components).sort()) {
                md += `### Componente: ${comp}\n\n`

                for (const asset of components[comp]) {
                    md += `#### [ACTIVO] ${asset.title}\n`
                    md += `- **ID:** ${asset.id}\n`
                    if (asset.competence) md += `- **Competencia:** ${asset.competence}\n`
                    if (asset.behavior) md += `- **Conducta:** ${asset.behavior}\n`
                    if (asset.maturity) md += `- **Nivel de Madurez:** ${asset.maturity}\n`

                    md += `\n**CONTENIDO / OBSERVACIONES:**\n`
                    // Clean content to avoid markdown breaking issues if any
                    const content = asset.observations || "Sin contenido detallado."
                    md += `${content}\n\n`
                    md += `---\n\n`
                }
            }
        }

        md += `\n\n# 2. FUENTES DE INVESTIGACIÓN\n`
        md += `Esta sección contiene evidencias científicas y fuentes externas.\n\n`

        for (const res of research) {
            md += `### [INVESTIGACIÓN] ${res.title}\n`
            if (res.apa) md += `- **Citation (APA):** ${res.apa}\n`
            if (res.url) md += `- **URL:** ${res.url}\n`

            md += `\n**RESUMEN / HALLAZGOS:**\n`
            const findings = res.findings || res.summary || "Sin detalles."
            md += `${findings}\n\n`
            md += `---\n\n`
        }

        console.log(`✅ [NotebookLM Export] Generated ${md.length} chars of Markdown.`)

        // Return as Text/Markdown download
        return new NextResponse(md, {
            status: 200,
            headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
                'Content-Disposition': `attachment; filename="4shine-knowledge-base-${new Date().toISOString().split('T')[0]}.md"`
            }
        })

    } catch (error: any) {
        console.error('❌ [NotebookLM Export] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
