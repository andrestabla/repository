
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Starting Taxonomy Fix: Shine Within -> Shine In')

    // 1. Fix Primary Pillar
    const primaryFix = await prisma.contentItem.updateMany({
        where: { primaryPillar: 'Shine Within' },
        data: { primaryPillar: 'Shine In' }
    })
    console.log(`✅ Updated ${primaryFix.count} Primary Pillars.`)

    // 2. Fix Secondary Pillars
    // Prisma doesn't support array element replacement in updateMany cleanly for all DBs,
    // so we iterate.
    const items = await prisma.contentItem.findMany({
        where: {
            secondaryPillars: { has: 'Shine Within' }
        },
        select: { id: true, secondaryPillars: true, title: true }
    })

    console.log(`📦 Found ${items.length} items with 'Shine Within' in secondary pillars.`)

    for (const item of items) {
        const newSecondaries = item.secondaryPillars.map(p => p === 'Shine Within' ? 'Shine In' : p)
        // Deduplicate just in case
        const uniqueSecondaries = [...new Set(newSecondaries)]

        await prisma.contentItem.update({
            where: { id: item.id },
            data: { secondaryPillars: uniqueSecondaries }
        })
        console.log(`   🔄 Fixed ${item.title.substring(0, 20)}...`)
    }

    // 3. Verify Integrity (Levels)
    console.log('\n🔍 Verifying Taxonomy Levels...')
    const incomplete = await prisma.contentItem.findMany({
        where: {
            OR: [
                { sub: null },
                { competence: null },
                { behavior: null },
                { secondaryPillars: { isEmpty: true } }
            ]
        },
        select: { id: true, title: true, sub: true, competence: true, behavior: true, secondaryPillars: true }
    })

    if (incomplete.length > 0) {
        console.warn(`⚠️ Found ${incomplete.length} items with missing levels or no secondary pillars:`)
        incomplete.forEach(i => {
            const missing = []
            if (!i.sub) missing.push('Sub')
            if (!i.competence) missing.push('Comp')
            if (!i.behavior) missing.push('Beh')
            if (!i.secondaryPillars || i.secondaryPillars.length === 0) missing.push('NoSecondaries')

            console.log(`   - ${i.title.substring(0, 30)}... [Missing: ${missing.join(', ')}]`)
        })
    } else {
        console.log('✅ All items have full taxonomy depth (Sub, Comp, Beh) and at least one secondary pillar.')
    }

}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
