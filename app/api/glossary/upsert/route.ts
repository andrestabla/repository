import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { id, term, definition, pillars } = body

        if (!term || !definition) {
            return NextResponse.json({ error: 'Term and Definition required' }, { status: 400 })
        }

        const result = await prisma.glossaryTerm.upsert({
            where: { id: id || 'new' },
            create: {
                term,
                definition,
                pillars: pillars || [],
                source: 'Manual'
            },
            update: {
                term,
                definition,
                pillars: pillars || [],
                source: 'Manual' // If edited manually, update source? Or keep original? Let's say Manual edit overrides.
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Glossary Upsert Error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
