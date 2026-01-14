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

    // 2. Taxonomy (Pillars)
    const pillars = ['Shine In', 'Shine Out', 'Shine Up', 'Shine On']
    for (const p of pillars) {
        await prisma.taxonomy.create({
            data: {
                name: p,
                type: 'Pillar',
            },
        })
    }

    // 3. Content Items from Prototype
    const contents = [
        { id: "4S-P-001", title: "Networking Strategy Baseline", type: "PDF", pillar: "Shine Out", version: "v1.0", status: "Aprobado", ip: "Propio", completeness: 100, driveId: "XYZ_123" },
        { id: "4S-V-015", title: "Pitching Techniques", type: "Video", pillar: "Shine In", version: "v1.0", status: "Revisión", ip: "Propio", completeness: 85, driveId: "VID_555" },
        { id: "4S-T-102", title: "Stakeholder Matrix Template", type: "Herramienta", pillar: "Shine Up", version: "v0.9", status: "Obsoleto", ip: "Tercero", completeness: 100, driveId: "DOC_999" },
        { id: "4S-D-055", title: "Manual de Facilitador Módulo 1", type: "Manual", pillar: "Transversal", version: "v1.0", status: "Borrador", ip: "Propio", completeness: 40, driveId: null },
        { id: "4S-X-000", title: "NUEVO: Liderazgo Remoto", type: "PDF", pillar: "Shine On", version: "v1.0", status: "Borrador", ip: "Completar", completeness: 20, driveId: null },
    ]

    for (const c of contents) {
        await prisma.contentItem.upsert({
            where: { id: c.id },
            update: {},
            create: {
                id: c.id,
                title: c.title,
                type: c.type,
                pillar: c.pillar,
                version: c.version,
                status: c.status,
                ip: c.ip,
                completeness: c.completeness,
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
