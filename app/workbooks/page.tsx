
import prisma from '@/lib/prisma'
import { WorkbooksView } from '@/components/workbooks/WorkbooksView'

export const revalidate = 0

export default async function WorkbooksPage() {
    const workbooks = await prisma.workbook.findMany({
        orderBy: { updatedAt: 'desc' }
    })

    const serialized = workbooks.map(w => ({
        ...w,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
        metadata: w.metadata ? JSON.parse(JSON.stringify(w.metadata)) : {}
    }))

    return <WorkbooksView initialWorkbooks={serialized} />
}
