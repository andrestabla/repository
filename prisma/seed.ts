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
            name: 'Shine On',
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
        { id: '4S-P-001', title: 'Guía Fundamental de Networking', type: 'PDF', pillar: 'Shine Out', sub: 'Networking', level: 'Básico', status: 'Approved', complete: 100, ip: 'Propio', driveId: 'VALID_ID' },
        { id: '4S-V-020', title: 'Video: Elevator Pitch TED', type: 'Video', pillar: 'Shine In', sub: 'Comunicación', level: 'Intermedio', status: 'Review', complete: 90, ip: 'Tercero', driveId: 'VALID_ID' },
        { id: '4S-T-099', title: 'Matriz de Influencia Política', type: 'Herramienta', pillar: 'Shine Up', sub: 'Influencia', level: 'Avanzado', status: 'Draft', complete: 20, ip: 'Completar', driveId: null },
        { id: '4S-P-002', title: 'Checklist de LinkedIn', type: 'PDF', pillar: 'Shine Out', sub: 'Marca Personal', level: 'Básico', status: 'Approved', complete: 100, ip: 'Propio', driveId: 'VALID_ID' },
        { id: '4S-D-105', title: 'Manual Facilitador Módulo 1', type: 'Doc', pillar: 'Transversal', sub: 'General', level: 'N/A', status: 'Draft', complete: 40, ip: 'Propio', driveId: null }
    ]

    for (const c of contents) {
        await prisma.contentItem.upsert({
            where: { id: c.id },
            update: {
                title: c.title,
                type: c.type,
                pillar: c.pillar,
                sub: c.sub,
                level: c.level,
                status: c.status,
                ip: c.ip,
                completeness: c.complete,
                driveId: c.driveId
            },
            create: {
                id: c.id,
                title: c.title,
                type: c.type,
                pillar: c.pillar,
                sub: c.sub,
                level: c.level,
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
        update: { role: 'admin' },
        create: {
            email: adminEmail,
            name: 'Andres Tabla (Admin)',
            role: 'admin'
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
