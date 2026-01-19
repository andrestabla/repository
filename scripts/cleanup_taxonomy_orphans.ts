
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Starting Taxonomy Cleanup...')

    const VALID_PILLARS = ['Shine In', 'Shine Out', 'Shine Up', 'Shine Beyond']


    let iteration = 0
    while (true) {
        iteration++
        console.log(`\n--- Iteration ${iteration} ---`)

        const invalidRoots = await prisma.taxonomy.findMany({
            where: {
                parentId: null,
                name: { notIn: VALID_PILLARS }
            }
        })

        if (invalidRoots.length === 0) {
            console.log('✅ No invalid roots found. Taxonomy is clean.')
            break
        }

        console.log(`🔍 Found ${invalidRoots.length} invalid top-level nodes (orphans).`)
        // Log just names for brevity
        console.log('   Nodes:', invalidRoots.map(n => n.name).join(', '))

        console.log(`🗑️ Deleting ${invalidRoots.length} invalid roots...`)
        const erased = await prisma.taxonomy.deleteMany({
            where: {
                id: { in: invalidRoots.map(n => n.id) }
            }
        })
        console.log(`✅ Deleted ${erased.count} nodes.`)

        // Safety break
        if (iteration > 10) {
            console.error('⚠️ Max iterations reached. Something might be wrong.')
            break
        }
    }

}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
