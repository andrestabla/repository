import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Cleaning up taxonomy...')
    // Delete all children first due to FK constraints if any (handled by Prisma though)
    await prisma.taxonomy.deleteMany({
        where: { parentId: { not: null } }
    })
    // Delete all pillars
    await prisma.taxonomy.deleteMany({})
    console.log('Taxonomy cleaned.')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
