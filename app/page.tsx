import prisma from '@/lib/prisma'
import MethodologySPA from '@/components/MethodologySPA'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function Page() {
  const session = await getServerSession(authOptions)

  // Fetch initial data from Neon DB
  const contents = await prisma.contentItem.findMany({
    orderBy: { id: 'asc' }
  })

  const taxonomy = await prisma.taxonomy.findMany({
    orderBy: { name: 'asc' }
  })

  // Pass data to the Client Component
  return <MethodologySPA initialData={contents} initialTaxonomy={taxonomy} session={session} />
}
