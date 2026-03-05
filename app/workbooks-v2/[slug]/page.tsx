import { notFound } from 'next/navigation'
import { WB1Step1Digital } from '@/components/workbooks-v2/WB1Step1Digital'

export const revalidate = 0

export default async function WorkbookV2Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    if (slug === 'wb1') {
        return <WB1Step1Digital />
    }

    notFound()
}
