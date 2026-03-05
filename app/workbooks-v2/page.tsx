import prisma from '@/lib/prisma'
import { WorkbooksView } from '@/components/workbooks/WorkbooksView'

export const revalidate = 0

export default async function WorkbooksV2Page() {
    const workbooks = await prisma.workbook.findMany({
        orderBy: { updatedAt: 'desc' }
    })

    const serialized = workbooks.map((w: any) => ({
        ...w,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
        metadata: w.metadata ? JSON.parse(JSON.stringify(w.metadata)) : {}
    }))

    return <WorkbooksView initialWorkbooks={serialized} moduleLabel="Workbooks v2" basePath="/workbooks-v2" />
}
