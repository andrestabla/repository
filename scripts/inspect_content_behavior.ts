
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const contentItems = await prisma.contentItem.findMany({
        where: {
            behavior: { not: null }
        },
        take: 5,
        select: {
            id: true,
            title: true,
            behavior: true,
            primaryPillar: true
        }
    });

    console.log("Content Items with Behaviors:", JSON.stringify(contentItems, null, 2));

    if (contentItems.length > 0) {
        const behaviorValue = contentItems[0].behavior;
        // Check if it looks like a CUID or a sentence
        const isCuid = behaviorValue && behaviorValue.startsWith('c');
        console.log(`Behavior field looks like a CUID? ${isCuid}`);

        if (isCuid) {
            const taxonomyItem = await prisma.taxonomy.findUnique({
                where: { id: behaviorValue }
            });
            console.log("Corresponding Taxonomy Item:", taxonomyItem);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
