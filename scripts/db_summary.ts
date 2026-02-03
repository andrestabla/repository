
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- RESUMEN DE BASE DE DATOS ---\n')

    // 1. Taxonomía
    const taxonomyCount = await prisma.taxonomy.count()
    const pillars = await prisma.taxonomy.findMany({
        where: { type: 'Pillar' },
        include: {
            children: {
                include: {
                    children: true // Competence
                }
            }
        }
    })

    console.log(`📌 TAXONOMÍA (${taxonomyCount} nodos totales)`)
    console.log(`   Pilares Base (${pillars.length}):`)
    pillars.forEach(p => {
        const subs = p.children.length
        const comps = p.children.reduce((acc, c) => acc + (c.children?.length || 0), 0)
        console.log(`   - ${p.name}: ${subs} Componentes, ${comps} Competencias`)
    })
    console.log('')

    // 2. Inventario (ContentItems)
    const totalAssets = await prisma.contentItem.count()
    const validatedAssets = await prisma.contentItem.count({ where: { status: 'Validado' } })
    const draftAssets = await prisma.contentItem.count({ where: { status: 'Borrador' } })

    console.log(`📄 INVENTARIO (${totalAssets} activos)`)
    console.log(`   - Validado: ${validatedAssets}`)
    console.log(`   - Borrador: ${draftAssets}`)
    console.log('   - Por Pilar:')

    for (const p of pillars) {
        const count = await prisma.contentItem.count({ where: { primaryPillar: p.name } })
        console.log(`     * ${p.name}: ${count}`)
    }
    console.log('')

    // 3. Investigación (ResearchSource)
    const totalResearch = await prisma.researchSource.count()
    console.log(`🔍 INVESTIGACIÓN (${totalResearch} fuentes)`)
    const researchItems = await prisma.researchSource.findMany({ take: 5 })
    researchItems.forEach(r => console.log(`   - ${r.title.substring(0, 50)}...`))

    console.log('\n-------------------------------')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
