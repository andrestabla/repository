import prisma from '@/lib/prisma'
import MethodologySPA from '@/components/MethodologySPA'

export const dynamic = 'force-dynamic'

export default async function Page() {
  // Fetch initial data from Neon DB
  const contents = await prisma.contentItem.findMany({
    orderBy: { id: 'asc' }
  })

  // Pass data to the Client Component
  return <MethodologySPA initialData={contents} />
}
