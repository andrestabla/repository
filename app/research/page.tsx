import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import MethodologySPA from "@/components/MethodologySPA" // We reuse the SPA component or create a specific one? 
// Actually, it's better to create a specific layout or reuse MethodologySPA with a 'research' mode if possible, 
// OR create a standalone client component for this page to keep it clean. 
// Given the requirements, I'll build a specific client component for Research to keep it focused.

import ResearchSPA from "@/components/ResearchSPA"

export const dynamic = 'force-dynamic'

export default async function ResearchPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/api/auth/signin")
    }

    const researchItems = await prisma.contentItem.findMany({
        where: { type: 'Investigación' },
        orderBy: { title: 'asc' }
    })

    return <ResearchSPA initialItems={researchItems} session={session} />
}
