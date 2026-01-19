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

    const taxonomyRaw = await prisma.taxonomy.findMany({
        orderBy: { order: 'asc' } // Ensure order is respected
    })

    const researchItems = await prisma.researchSource.findMany({
        orderBy: { title: 'asc' }
    })

    // Build Tree
    const taxonomyTree = taxonomyRaw.map(item => ({ ...item, children: [] as any[] }))
    const dataMap: any = {}
    taxonomyTree.forEach(item => dataMap[item.id] = item)

    const rootNodes: any[] = []
    taxonomyTree.forEach(item => {
        if (item.parentId && dataMap[item.parentId]) {
            dataMap[item.parentId].children.push(item)
        } else {
            rootNodes.push(item)
        }
    })

    // Sort pillars manually if needed, or rely on 'order'
    const shineOrder = ['Shine Within', 'Shine Out', 'Shine Up', 'Shine Beyond']
    rootNodes.sort((a, b) => {
        const idxA = shineOrder.indexOf(a.name)
        const idxB = shineOrder.indexOf(b.name)
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        return a.order - b.order
    })

    return <MethodologySPA initialData={contents as any} initialTaxonomy={rootNodes as any} initialResearch={researchItems as any} session={session as any} />
}
