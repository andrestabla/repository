
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const taxonomyTree = await prisma.taxonomy.findMany({
            where: {
                type: 'Pillar',
                active: true
            },
            include: {
                children: { // Subcomponents
                    where: { active: true },
                    orderBy: { order: 'asc' },
                    include: {
                        children: { // Competences
                            where: { active: true },
                            orderBy: { order: 'asc' },
                            include: {
                                children: { // Behaviors
                                    where: { active: true },
                                    orderBy: { order: 'asc' }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                order: 'asc'
            }
        })

        return NextResponse.json(taxonomyTree)
    } catch (error) {
        console.error('Taxonomy Tree Error:', error)
        return NextResponse.json({ error: 'Failed to fetch taxonomy tree' }, { status: 500 })
    }
}
