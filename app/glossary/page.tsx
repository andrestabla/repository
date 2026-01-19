import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import GlossarySPA from "@/components/GlossarySPA"

export const dynamic = 'force-dynamic'

export default async function GlossaryPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/api/auth/signin")
    }

    const glossaryItems = await prisma.glossaryTerm.findMany({
        orderBy: { term: 'asc' }
    })

    return <GlossarySPA initialItems={glossaryItems} />
}
