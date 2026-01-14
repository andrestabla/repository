import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const taxonomy = await prisma.taxonomy.findMany({
        include: { children: true }
    })
    console.log(JSON.stringify(taxonomy, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
