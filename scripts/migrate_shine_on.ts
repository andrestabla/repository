
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting migration: Shine On -> Shine Beyond')

    // 1. Update Taxonomy
    // First check if 'Shine On' exists
    const oldPillar = await prisma.taxonomy.findFirst({
        where: { name: 'Shine On' }
    })

    if (oldPillar) {
        console.log('Updating Taxonomy Pillar: Shine On -> Shine Beyond')
        await prisma.taxonomy.update({
            where: { id: oldPillar.id },
            data: { name: 'Shine Beyond' }
        })
    } else {
        console.log('Taxonomy Pillar "Shine On" not found (might already be updated).')
    }

    // 2. Update ContentItems (Primary Pillar)
    const itemsWithPrimary = await prisma.contentItem.findMany({
        where: { primaryPillar: 'Shine On' }
    })
    console.log(`Found ${itemsWithPrimary.length} items with primaryPillar = "Shine On"`)
    for (const item of itemsWithPrimary) {
        await prisma.contentItem.update({
            where: { id: item.id },
            data: { primaryPillar: 'Shine Beyond' }
        })
    }

    // 3. Update ContentItems (Secondary Pillars)
    const itemsWithSecondary = await prisma.contentItem.findMany({
        where: { secondaryPillars: { has: 'Shine On' } }
    })
    console.log(`Found ${itemsWithSecondary.length} items with secondaryPillars including "Shine On"`)
    for (const item of itemsWithSecondary) {
        const newPillars = item.secondaryPillars.map(p => p === 'Shine On' ? 'Shine Beyond' : p)
        await prisma.contentItem.update({
            where: { id: item.id },
            data: { secondaryPillars: newPillars }
        })
    }

    // 4. Update ResearchSources (Pillars)
    const researchWithPillar = await prisma.researchSource.findMany({
        where: { pillars: { has: 'Shine On' } }
    })
    console.log(`Found ${researchWithPillar.length} research sources with pillars including "Shine On"`)
    for (const item of researchWithPillar) {
        const newPillars = item.pillars.map(p => p === 'Shine On' ? 'Shine Beyond' : p)
        await prisma.researchSource.update({
            where: { id: item.id },
            data: { pillars: newPillars }
        })
    }

    console.log('Migration complete.')
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
