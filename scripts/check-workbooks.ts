
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.workbook.count();
  const workbooks = await prisma.workbook.findMany({
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  console.log(`Total Workbooks: ${count}`);
  console.log('Sample Workbooks:', JSON.stringify(workbooks, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
