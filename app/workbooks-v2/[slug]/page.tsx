import { notFound } from 'next/navigation'
import { WB1Step1Digital } from '@/components/workbooks-v2/WB1Step1Digital'
import { WB2Digital } from '@/components/workbooks-v2/WB2Digital'
import { WB3Digital } from '@/components/workbooks-v2/WB3Digital'
import { WB4Digital } from '@/components/workbooks-v2/WB4Digital'
import { WB5Digital } from '@/components/workbooks-v2/WB5Digital'
import { WB6Digital } from '@/components/workbooks-v2/WB6Digital'
import { WB7Digital } from '@/components/workbooks-v2/WB7Digital'
import { WB8Digital } from '@/components/workbooks-v2/WB8Digital'
import { WB9Digital } from '@/components/workbooks-v2/WB9Digital'
import { WB10Digital } from '@/components/workbooks-v2/WB10Digital'

export const revalidate = 0

export default async function WorkbookV2Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    if (slug === 'wb1') {
        return <WB1Step1Digital />
    }

    if (slug === 'wb2') {
        return <WB2Digital />
    }

    if (slug === 'wb3') {
        return <WB3Digital />
    }

    if (slug === 'wb4') {
        return <WB4Digital />
    }

    if (slug === 'wb5') {
        return <WB5Digital />
    }

    if (slug === 'wb6') {
        return <WB6Digital />
    }

    if (slug === 'wb7') {
        return <WB7Digital />
    }

    if (slug === 'wb8') {
        return <WB8Digital />
    }

    if (slug === 'wb9') {
        return <WB9Digital />
    }

    if (slug === 'wb10') {
        return <WB10Digital />
    }

    notFound()
}
