import prisma from '@/lib/prisma'
import MethodologySPA from '@/components/MethodologySPA'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function Page() {
    const session = await getServerSession(authOptions)

    const contents = await prisma.contentItem.findMany({
        orderBy: { id: 'asc' }
    })

    const taxonomy = await prisma.taxonomy.findMany({
        orderBy: { name: 'asc' }
    })

    const research = await prisma.researchSource.findMany({
        orderBy: { createdAt: 'desc' }
    })

    // Map Prisma result to match the expected type if needed, or cast as any for now to speed up
    return <MethodologySPA initialData={contents as any} initialResearch={research as any} initialTaxonomy={taxonomy as any} session={session as any} />
}
