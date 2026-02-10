
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { WorkbookDetailView } from '@/components/workbooks/WorkbookDetailView'

export const revalidate = 0

export default async function WorkbookPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const workbook = await prisma.workbook.findFirst({
        where: {
            OR: [
                { id: slug },
                { slug: slug }
            ]
        }
    })

    if (!workbook) {
        notFound()
    }

    const serialized = {
        ...workbook,
        createdAt: workbook.createdAt.toISOString(),
        updatedAt: workbook.updatedAt.toISOString(),
        metadata: workbook.metadata ? JSON.parse(JSON.stringify(workbook.metadata)) : {}
    } as any

    return (
        <div className="min-h-screen bg-bg">
            <WorkbookDetailView workbook={serialized} />
        </div>
    )
}
