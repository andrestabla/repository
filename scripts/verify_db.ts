import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Database Integrity Check ---')

    // 1. Check Taxonomy
    const pillars = await prisma.taxonomy.count({ where: { type: 'Pillar' } })
    const components = await prisma.taxonomy.count({ where: { type: 'Component' } })
    const orphanedComponents = await prisma.taxonomy.count({
        where: { type: 'Component', parentId: null }
    })

    console.log(`Taxonomy: ${pillars} Pillars, ${components} Components.`)
    if (orphanedComponents > 0) console.error(`WARNING: ${orphanedComponents} components are orphaned!`)
    else console.log('✅ Taxonomy hierarchy is correct.')

    // 2. Check Content Items and Releases
    const contentCount = await prisma.contentItem.count()
    const releaseCount = await prisma.methodologyRelease.count()
    console.log(`Content Items: ${contentCount}`)
    console.log(`Releases: ${releaseCount}`)

    // 3. Check specific relationships (First Release contents)
    const firstRelease = await prisma.methodologyRelease.findFirst({
        include: { contents: true }
    })
    if (firstRelease) {
        console.log(`Release ${firstRelease.tag} has ${firstRelease.contents.length} items.`)
    }

    console.log('--- Integrity Check Complete ---')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
