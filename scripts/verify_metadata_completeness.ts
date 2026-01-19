
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🕵️‍♀️ Verifying Metadata Completeness...')

    // Check for items with missing fields
    // primaryPillar is String (non-nullable), default "Transversal"
    // sub, competence, behavior are String? (nullable)
    const incompleteItems = await prisma.contentItem.findMany({
        where: {
            OR: [
                { primaryPillar: { equals: 'Transversal' } }, // Default value means not updated
                { primaryPillar: { equals: '' } },
                { sub: { equals: null } },
                { sub: { equals: '' } },
                { competence: { equals: null } },
                { competence: { equals: '' } },
                { behavior: { equals: null } },
                { behavior: { equals: '' } }
            ]
        },
        select: {
            id: true,
            title: true,
            primaryPillar: true,
            sub: true,
            competence: true,
            behavior: true
        }
    })

    const total = await prisma.contentItem.count()
    const completeCount = total - incompleteItems.length

    console.log(`\n📊 Status: ${completeCount}/${total} items are fully classified.`)

    if (incompleteItems.length > 0) {
        console.log(`\n⚠️ Found ${incompleteItems.length} incomplete items:`)
        incompleteItems.forEach(item => {
            console.log(` - [${item.id}] ${item.title}`)
            console.log(`   Missing: ${!item.primaryPillar ? 'Pillar ' : ''}${!item.sub ? 'Sub ' : ''}${!item.competence ? 'Comp ' : ''}${!item.behavior ? 'Beh' : ''}`)
        })
        process.exit(1) // Exit with error code
    } else {
        console.log('\n✅ SUCCESS: All content items have complete 4-level taxonomy metadata.')
        process.exit(0)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
