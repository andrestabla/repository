
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Verifying Taxonomy Depth ---')
    const pillars = await prisma.taxonomy.findMany({
        where: { type: 'Pillar', active: true },
        include: {
            children: { // Sub
                include: {
                    children: { // Comp
                        include: {
                            _count: { select: { children: true } } // Behavior Count
                        }
                    }
                }
            }
        }
    })

    for (const pillar of pillars) {
        console.log(`Pillar: ${pillar.name}`)
        let totalSubs = pillar.children.length
        let totalComps = 0
        let totalBehaviors = 0

        pillar.children.forEach(sub => {
            totalComps += sub.children.length
            sub.children.forEach(comp => {
                totalBehaviors += comp._count.children
            })
        })

        console.log(`  Subs: ${totalSubs}`)
        console.log(`  Comps: ${totalComps}`)
        console.log(`  Behaviors: ${totalBehaviors}`)

        if (totalBehaviors === 0) {
            console.error(`  ⚠️ ALERT: No behaviors found for ${pillar.name}!`)
        } else {
            console.log(`  ✅ OK`)
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
