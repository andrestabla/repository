import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { id, term, definition, pillars, relatedCompetency, sourceType } = body

        if (!term || !definition) {
            return NextResponse.json({ error: 'Term and Definition required' }, { status: 400 })
        }

        // If ID is provided, use it for upsert. If not, try to match by term (since it's unique).
        // However, Prisma upsert requires a unique input for 'where'. 
        // If we have an ID, use it. If not, efficient way is to use term as unique key if we treat term as unique ID effectively.
        // But the previous code used id || 'new', implying it relies on 'create' triggering if ID not found.
        // Let's stick to the existing pattern but add the fields, ensuring we handle the case where ID might be missing but Term exists (update by term).

        let whereClause: any = { id: id || 'new' }
        if (!id && term) {
             // If no ID but we have term, try to find by term to update instead of creating duplicate (though term is unique, so create would fail)
             const existing = await prisma.glossaryTerm.findUnique({ where: { term } })
             if (existing) whereClause = { id: existing.id }
        }

        const result = await prisma.glossaryTerm.upsert({
            where: whereClause,
            create: {
                term,
                definition,
                pillars: pillars || [],
                relatedCompetency: relatedCompetency || null,
                sourceType: sourceType || null,
                source: 'Manual'
            },
            update: {
                term,
                definition,
                pillars: pillars || [],
                relatedCompetency: relatedCompetency || null,
                sourceType: sourceType || null,
                // Do not overwrite source if it was 'AI', unless we want to mark it as manually edited? 
                // Creating a simplified edit where we just update content.
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Glossary Upsert Error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
