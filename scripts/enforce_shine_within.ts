
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Starting FINAL Taxonomy Fix: Enforcing "Shine Within"')

    // 1. Fix Taxonomy Node Name
    console.log('🌳 Fixing Taxonomy Node...')
    const shineInNode = await prisma.taxonomy.findFirst({
        where: { name: 'Shine In', type: 'Pillar' }
    })

    if (shineInNode) {
        await prisma.taxonomy.update({
            where: { id: shineInNode.id },
            data: { name: 'Shine Within' }
        })
        console.log('✅ Renamed "Shine In" -> "Shine Within" in Taxonomy table.')
    } else {
        const shineWithinNode = await prisma.taxonomy.findFirst({
            where: { name: 'Shine Within', type: 'Pillar' }
        })
        if (shineWithinNode) {
            console.log('✅ "Shine Within" already exists in Taxonomy.')
        } else {
            console.error('❌ Could not find "Shine In" OR "Shine Within" node! Taxonomy might be broken.')
        }
    }

    // 2. Fix ContentItem Primary Pillar
    console.log('📦 Fixing ContentItem Primary Pillars...')
    const primaryFix = await prisma.contentItem.updateMany({
        where: { primaryPillar: 'Shine In' },
        data: { primaryPillar: 'Shine Within' }
    })
    console.log(`✅ Updated ${primaryFix.count} Primary Pillars.`)

    // 3. Fix ContentItem Secondary Pillars
    console.log('📦 Fixing ContentItem Secondary Pillars...')
    const contentItems = await prisma.contentItem.findMany({
        where: { secondaryPillars: { has: 'Shine In' } }
    })
    for (const item of contentItems) {
        const newPillars = item.secondaryPillars.map(p => p === 'Shine In' ? 'Shine Within' : p)
        const unique = [...new Set(newPillars)] // dedupe
        await prisma.contentItem.update({
            where: { id: item.id },
            data: { secondaryPillars: unique }
        })
    }
    console.log(`✅ Updated ${contentItems.length} items with Shine In in secondary pillars.`)

    // 4. Fix ResearchSource Pillars
    console.log('📚 Fixing ResearchSource Pillars...')
    const researchItems = await prisma.researchSource.findMany({
        where: { pillars: { has: 'Shine In' } }
    })
    for (const item of researchItems) {
        const newPillars = item.pillars.map(p => p === 'Shine In' ? 'Shine Within' : p)
        const unique = [...new Set(newPillars)]
        await prisma.researchSource.update({
            where: { id: item.id },
            data: { pillars: unique }
        })
    }
    console.log(`✅ Updated ${researchItems.length} Research Sources.`)

    // 5. Fix GlossaryTerm Pillars
    console.log('📖 Fixing GlossaryTerm Pillars...')
    const glossaryItems = await prisma.glossaryTerm.findMany({
        where: { pillars: { has: 'Shine In' } }
    })
    for (const item of glossaryItems) {
        const newPillars = item.pillars.map(p => p === 'Shine In' ? 'Shine Within' : p)
        const unique = [...new Set(newPillars)]
        await prisma.glossaryTerm.update({
            where: { id: item.id },
            data: { pillars: unique }
        })
    }
    console.log(`✅ Updated ${glossaryItems.length} Glossary Terms.`)

    console.log('✨ Enforcement Complete. "Shine Within" is the law.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
