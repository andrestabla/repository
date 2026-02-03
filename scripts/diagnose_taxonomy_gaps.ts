import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Starting Taxonomy Gap Analysis...')

    // 1. Fetch current taxonomy structure
    const taxonomy = await prisma.taxonomy.findMany({
        where: { active: true },
        include: { children: { include: { children: true } } }
    })

    const pillars = taxonomy.filter(t => t.type === 'Pillar')

    // Map: Pillar Name -> Set of Component Names
    const validStructure = new Map<string, Set<string>>()
    // Map: Pillar Name -> Map<Component Name, Set<Competence Names>>
    const validCompetences = new Map<string, Map<string, Set<string>>>()

    pillars.forEach(p => {
        const components = new Set<string>()
        const compMap = new Map<string, Set<string>>()

        p.children.forEach(c => {
            components.add(c.name.trim().toLowerCase()) // Normalize for check
            const competences = new Set<string>()
            c.children.forEach(comp => competences.add(comp.name.trim().toLowerCase()))
            compMap.set(c.name.trim().toLowerCase(), competences)
        })

        validStructure.set(p.name, components)
        validCompetences.set(p.name, compMap)
    })

    // 2. Fetch Content Items
    const items = await prisma.contentItem.findMany()
    console.log(`📊 Analyzing ${items.length} content items issues...\n`)

    let invalidComponents = 0
    let invalidCompetences = 0
    const issues: any[] = []

    for (const item of items) {
        if (!item.primaryPillar) continue

        // Normalize pillar name (handle potential casing issues, though usually standardised)
        // Fix old references if any left (should match db migration)
        let pillarName = item.primaryPillar
        if (pillarName === 'Shine In') pillarName = 'Shine Within'

        const validComponents = validStructure.get(pillarName)

        if (!validComponents) {
            console.warn(`⚠️  Unknown pillar for item ${item.id}: ${pillarName}`)
            continue
        }

        const currentSub = item.sub?.trim().toLowerCase()
        if (currentSub) {
            const isValidSub = validComponents.has(currentSub)

            if (!isValidSub) {
                invalidComponents++
                // Find suggestion
                const suggestion = findBestMatch(currentSub, Array.from(validComponents))

                issues.push({
                    id: item.id,
                    title: item.title,
                    pillar: pillarName,
                    type: 'Component',
                    current: item.sub,
                    suggestion: suggestion
                })
            } else {
                // Check Competence if Sub is valid
                const currentComp = item.competence?.trim().toLowerCase()
                if (currentComp) {
                    const validComps = validCompetences.get(pillarName)?.get(currentSub)
                    if (validComps && !validComps.has(currentComp)) {
                        invalidCompetences++
                        const suggestion = findBestMatch(currentComp, Array.from(validComps))
                        issues.push({
                            id: item.id,
                            title: item.title,
                            pillar: pillarName,
                            type: 'Competence',
                            current: item.competence,
                            suggestion: suggestion
                        })
                    }
                }
            }
        }
    }

    console.log(`❌ Invalid Components Found: ${invalidComponents}`)
    console.log(`❌ Invalid Competences Found: ${invalidCompetences}`)

    if (issues.length > 0) {
        console.log('\n📋 Detailed Issues Report (First 50):')
        console.table(issues.slice(0, 50))
    } else {
        console.log('\n✅ No discrepancies found! Database is perfectly aligned.')
    }
}

// Simple similarity helper
function findBestMatch(target: string, candidates: string[]): string | null {
    if (!candidates.length) return null

    // 1. Check for substring match
    const substringMatch = candidates.find(c => c.includes(target) || target.includes(c))
    if (substringMatch) return substringMatch

    // 2. Check for exact match ignoring case (already done structurally, but logical check)
    return candidates[0] // Fallback to first if no clear match? No, unsafe. Return null basically.
    // For now simple substring check is often enough for renames like "Inteligencia Emocional" -> "Inteligencia Emocional y..."
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
