import prisma from '@/lib/prisma'
import PublicDiamondView from '@/components/taxonomy/PublicDiamondView'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ focus: string }> }) {
    const { focus } = await params

    // Mapping focus slug to internal focus name
    const focusMap: Record<string, string> = {
        'General': 'ALL',
        'Shine-Within': 'Shine Within',
        'Shine-Out': 'Shine Out',
        'Shine-Up': 'Shine Up',
        'Shine-Beyond': 'Shine Beyond'
    }

    const internalFocus = focusMap[focus]
    if (!internalFocus) {
        notFound()
    }

    // Fetch Taxonomy Data
    const taxonomyRaw = await prisma.taxonomy.findMany({
        orderBy: { order: 'asc' }
    })

    // Fetch Inventory Data (to check gaps in the graph)
    const inventory = await prisma.contentItem.findMany({
        select: {
            id: true,
            title: true,
            primaryPillar: true,
            sub: true,
            competence: true,
            behavior: true
        }
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

    return (
        <PublicDiamondView
            taxonomy={rootNodes}
            inventory={inventory as any}
            focus={internalFocus as any}
        />
    )
}
