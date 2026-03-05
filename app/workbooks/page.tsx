
import prisma from '@/lib/prisma'
import { WorkbooksView } from '@/components/workbooks/WorkbooksView'

export const revalidate = 0

export default async function WorkbooksPage() {
    const workbooks = await prisma.workbook.findMany({
        orderBy: { updatedAt: 'desc' }
    })

    const serialized = workbooks.map((w: any) => ({
        ...w,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
        metadata: w.metadata ? JSON.parse(JSON.stringify(w.metadata)) : {}
    }))

    const v1Workbooks = serialized.filter((workbook: any) => workbook.metadata?.module !== 'v2')

    return <WorkbooksView initialWorkbooks={v1Workbooks} moduleLabel="Workbooks v1" basePath="/workbooks" moduleScope="v1" />
}
