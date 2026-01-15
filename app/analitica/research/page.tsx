import AnalyticsView from '@/components/AnalyticsView'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Page() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/api/auth/signin")
    }

    return <AnalyticsView currentTab="research" />
}
