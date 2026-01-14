import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { releaseTag, artifactType } = await req.json()

        if (!releaseTag) {
            return NextResponse.json({ error: 'Release version is required' }, { status: 400 })
        }

        // 1. Fetch the release
        const release = await prisma.methodologyRelease.findUnique({
            where: { tag: releaseTag },
            include: {
                contents: {
                    where: { status: 'Validado' }, // Only validated items go into official artifacts
                    orderBy: { id: 'asc' }
                }
            }
        })

        if (!release) {
            return NextResponse.json({ error: 'Release not found' }, { status: 404 })
        }

        // 2. Fetch taxonomy for structure
        const taxonomy = await prisma.taxonomy.findMany({
            where: { active: true },
            orderBy: { order: 'asc' }
        })

        // 3. Simple JSON Compilation Logic
        const dossier = {
            metadata: {
                release: release.tag,
                generatedAt: new Date().toISOString(),
                artifact: artifactType || 'Dossier Maestro v1.0',
                itemCount: release.contents.length
            },
            structure: taxonomy.filter(t => t.type === 'Pillar').map(p => ({
                pillar: p.name,
                components: taxonomy.filter(c => c.parentId === p.id).map(c => ({
                    name: c.name,
                    items: release.contents.filter(item => item.sub === c.name)
                }))
            }))
        }

        // In a real scenario, here we could generate a PDF or ZIP using libraries like jszip or pdfkit
        // For now, we return the master structure ready for the frontend to "download"

        return NextResponse.json(dossier)
    } catch (error: any) {
        console.error('[Generator Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
