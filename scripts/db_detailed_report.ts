
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- INFORME DETALLADO DE INVENTARIO Y RELACIONES ---\n')

    // 1. INVENTARIO (ContentItem)
    const totalAssets = await prisma.contentItem.count()
    const validated = await prisma.contentItem.count({ where: { status: 'Validado' } })
    const review = await prisma.contentItem.count({ where: { status: 'Revisión' } })
    const draft = await prisma.contentItem.count({ where: { status: 'Borrador' } })

    console.log(`📦 CONTENT ITEMS (${totalAssets} totales)`)
    console.log(`   Estados: ✅ Validado: ${validated} | ⚠️ Revisión: ${review} | 📝 Borrador: ${draft}`)

    // Desglose por Tipo
    const byType = await prisma.contentItem.groupBy({ by: ['type'], _count: { id: true } })
    console.log('   Por Tipo:', byType.map(t => `${t.type}: ${t._count.id}`).join(', '))

    // Relaciones con Releases
    const withRelease = await prisma.contentItem.count({ where: { releaseId: { not: null } } })
    console.log(`   🔗 Vinculados a Release: ${withRelease} / ${totalAssets}`)

    // Relaciones con Investigación
    const withResearch = await prisma.contentItem.count({ where: { researchSources: { some: {} } } })
    console.log(`   🔗 Con Fuentes de Investigación: ${withResearch} / ${totalAssets}`)
    console.log('')

    // 2. INVESTIGACIÓN (ResearchSource)
    const totalResearch = await prisma.researchSource.count()
    console.log(`🔬 RESEARCH SOURCES (${totalResearch} totales)`)

    // Relaciones inversas (referencedBy)
    const usedResearch = await prisma.researchSource.count({ where: { referencedBy: { some: {} } } })
    console.log(`   🔗 Usadas en Inventario: ${usedResearch} / ${totalResearch}`)
    console.log('')

    // 3. RELEASES (MethodologyRelease)
    const totalReleases = await prisma.methodologyRelease.count()
    console.log(`🚀 RELEASES (${totalReleases} vrs)`)
    const releases = await prisma.methodologyRelease.findMany({ include: { _count: { select: { contents: true } } } })
    releases.forEach(r => {
        console.log(`   - [${r.tag}] ${r.status}: ${r._count.contents} items`)
    })
    console.log('')

    // 4. INTEGRIDAD Y HUÉRFANOS
    const orphanPillars = await prisma.contentItem.count({
        where: {
            NOT: { primaryPillar: { in: ['Shine In', 'Shine Out', 'Shine Up', 'Shine Beyond', 'Transversal'] } }
        }
    })
    console.log(`⚠️ ALERTAS DE INTEGRIDAD`)
    console.log(`   - Items con Pilar Inválido: ${orphanPillars}`)

    const driveMissing = await prisma.contentItem.count({ where: { driveId: null } })
    console.log(`   - Items sin Drive ID (sin archivo): ${driveMissing}`)

    console.log('\n----------------------------------------------------')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
