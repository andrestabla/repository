
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Get distinct types
    const types = await prisma.taxonomy.groupBy({
        by: ['type'],
    });
    console.log("Distinct Types:", types);

    // Get top level items (Pillars usually)
    const roots = await prisma.taxonomy.findMany({
        where: {
            parentId: null,
            active: true,
        },
        include: {
            children: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    children: { // Grandchildren
                        select: {
                            id: true,
                            name: true,
                            type: true
                        }
                    }
                }
            }
        }
    });

    console.log("Root Items Hierarchy:", JSON.stringify(roots, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
