import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const drafts = await prisma.contentItem.findMany({
        where: { status: 'Borrador' },
        take: 5,
        select: { id: true, title: true, primaryPillar: true, sub: true, competence: true, behavior: true, secondaryPillars: true }
    })

    console.log(`\n--- Draft Items Sample ---`)
    drafts.forEach(i => console.log(JSON.stringify(i, null, 2)))
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
