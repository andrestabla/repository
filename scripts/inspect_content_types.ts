
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const types = await prisma.contentItem.groupBy({
        by: ['type'],
        _count: {
            type: true
        }
    });

    console.log("Distinct ContentItem Types:", types);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
