import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const counts = await prisma.contentItem.groupBy({
        by: ['status'],
        _count: {
            id: true
        }
    })

    console.log('--- Content Status Distribution ---')
    counts.forEach(c => {
        console.log(`${c.status}: ${c._count.id}`)
    })

    const revisionItems = await prisma.contentItem.findMany({
        where: { status: 'Revisión' },
        select: { id: true, title: true, primaryPillar: true, sub: true, competence: true, behavior: true, secondaryPillars: true }
    })

    console.log(`\n--- Items in 'Revisión' (${revisionItems.length}) ---`)
    // Sample a few
    revisionItems.slice(0, 5).forEach(i => console.log(JSON.stringify(i, null, 2)))
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
