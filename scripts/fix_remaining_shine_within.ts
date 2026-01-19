
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Starting Deep Clean: Shine Within -> Shine In')

    // 1. Fix ResearchSource
    const researchItems = await prisma.researchSource.findMany({
        where: { pillars: { has: 'Shine Within' } }
    })
    console.log(`📚 Found ${researchItems.length} Research Sources to fix.`)

    for (const item of researchItems) {
        const newPillars = item.pillars.map(p => p === 'Shine Within' ? 'Shine In' : p)
        // Dedupe
        const unique = [...new Set(newPillars)]
        await prisma.researchSource.update({
            where: { id: item.id },
            data: { pillars: unique }
        })
    }
    console.log('✅ Research Sources updated.')

    // 2. Fix GlossaryTerm
    const glossaryItems = await prisma.glossaryTerm.findMany({
        where: { pillars: { has: 'Shine Within' } }
    })
    console.log(`📖 Found ${glossaryItems.length} Glossary Terms to fix.`)

    for (const item of glossaryItems) {
        const newPillars = item.pillars.map(p => p === 'Shine Within' ? 'Shine In' : p)
        const unique = [...new Set(newPillars)]
        await prisma.glossaryTerm.update({
            where: { id: item.id },
            data: { pillars: unique }
        })
    }
    console.log('✅ Glossary Terms updated.')

    // 3. Final Check
    const rCount = await prisma.researchSource.count({ where: { pillars: { has: 'Shine Within' } } })
    const gCount = await prisma.glossaryTerm.count({ where: { pillars: { has: 'Shine Within' } } })

    if (rCount === 0 && gCount === 0) {
        console.log('✨ All tables are clean.')
    } else {
        console.error(`⚠️ Still found: Research=${rCount}, Glossary=${gCount}`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
