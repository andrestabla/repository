import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const taxonomy = await prisma.taxonomy.findMany({
        include: {
            children: true
        },
        where: {
            parentId: null
        }
    })
    console.log(JSON.stringify(taxonomy, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
