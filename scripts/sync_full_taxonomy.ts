import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface TaxonomyNode {
    name: string
    children: Map<string, TaxonomyNode>
    behaviors: string[]
}

async function main() {
    console.log('🚀 Starting Full Taxonomy Sync 2026...\n')

    // 1. Parse raw file
    const rawPath = path.join(process.cwd(), 'scripts/taxonomy_raw.txt')
    const fileContent = fs.readFileSync(rawPath, 'utf-8')
    const lines = fileContent.split('\n').filter(l => l.trim() !== '')

    // Tree structure: Pillar -> Component -> Competence -> Behaviors
    const tree = new Map<string, TaxonomyNode>()

    console.log(`📝 Parsing ${lines.length} lines of raw data...`)

    // Skip header if exists (check first line)
    let startIndex = 0
    if (lines[0].startsWith('Pilar')) startIndex = 1

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i]
        const parts = line.split('\t')

        // Expected format: Pilar | Componente | Competencia | Conducta | Observaciones
        // Note: Some lines might be empty or malformed
        if (parts.length < 4) continue

        const pillarName = parts[0].trim()
        const componentName = parts[1].trim()
        const competenceName = parts[2].trim()
        const behaviorName = parts[3].trim()

        if (!pillarName || !componentName || !competenceName || !behaviorName) continue

        // Build Tree
        if (!tree.has(pillarName)) {
            tree.set(pillarName, { name: pillarName, children: new Map(), behaviors: [] })
        }

        const pillarNode = tree.get(pillarName)!

        if (!pillarNode.children.has(componentName)) {
            pillarNode.children.set(componentName, { name: componentName, children: new Map(), behaviors: [] })
        }

        const componentNode = pillarNode.children.get(componentName)!

        if (!componentNode.children.has(competenceName)) {
            componentNode.children.set(competenceName, { name: competenceName, children: new Map(), behaviors: [] })
        }

        const competenceNode = componentNode.children.get(competenceName)!

        // Add behavior if not exists
        if (!competenceNode.behaviors.includes(behaviorName)) {
            competenceNode.behaviors.push(behaviorName)
        }
    }

    console.log('✅ Data parsed successfully. Tree structure built.')

    // 2. Sync with Database
    // Define the 4 main pillars we are managing
    const targetPillars = ['Shine Within', 'Shine Out', 'Shine Up', 'Shine Beyond']

    for (const pillarName of targetPillars) {
        console.log(`\n📌 Processing Pillar: ${pillarName}`)

        // Ensure Pillar exists
        let pillar = await prisma.taxonomy.findFirst({
            where: { name: pillarName, type: 'Pillar' }
        })

        if (!pillar) {
            console.log(`   - Creating main pillar: ${pillarName}`)
            pillar = await prisma.taxonomy.create({
                data: {
                    name: pillarName,
                    type: 'Pillar',
                    active: true,
                    order: targetPillars.indexOf(pillarName) + 1
                }
            })
        } else {
            console.log(`   - Pillar found: ${pillar.id}`)
        }

        // DELETE existing structure under this pillar to ensure clean slate
        // ID-based deletion to avoid foreign key issues if any (though currently none strictly enforcing cascade on logical structure)

        // Get all Subcomponents (Level 2)
        const subs = await prisma.taxonomy.findMany({
            where: { parentId: pillar.id }
        })

        for (const sub of subs) {
            // Get all Competences (Level 3)
            const comps = await prisma.taxonomy.findMany({
                where: { parentId: sub.id }
            })

            for (const comp of comps) {
                // Delete Behaviors (Level 4)
                await prisma.taxonomy.deleteMany({
                    where: { parentId: comp.id }
                })
            }

            // Delete Competences
            await prisma.taxonomy.deleteMany({
                where: { parentId: sub.id }
            })
        }

        // Delete Subcomponents
        await prisma.taxonomy.deleteMany({
            where: { parentId: pillar.id }
        })

        console.log(`   - 🗑️  Cleaned old structure for ${pillarName}`)

        // 3. Insert NEW structure
        const pillarData = tree.get(pillarName)
        if (!pillarData) {
            console.warn(`   ⚠️  No data found for ${pillarName} in raw file!`)
            continue
        }

        let componentOrder = 1
        for (const [compName, compData] of pillarData.children) {
            const subNode = await prisma.taxonomy.create({
                data: {
                    name: compName,
                    type: 'Sub',
                    parentId: pillar.id,
                    active: true,
                    order: componentOrder++
                }
            })
            // console.log(`      + Component: ${compName}`)

            let competenceOrder = 1
            for (const [competenceName, competenceData] of compData.children) {
                const compNode = await prisma.taxonomy.create({
                    data: {
                        name: competenceName,
                        type: 'Comp',
                        parentId: subNode.id,
                        active: true,
                        order: competenceOrder++
                    }
                })
                // console.log(`        + Competence: ${competenceName}`)

                let behaviorOrder = 1
                for (const behavior of competenceData.behaviors) {
                    await prisma.taxonomy.create({
                        data: {
                            name: behavior,
                            type: 'Behavior',
                            parentId: compNode.id,
                            active: true,
                            order: behaviorOrder++
                        }
                    })
                }
            }
        }
        console.log(`   ✅ Rebuilt structure for ${pillarName}`)
    }

    console.log('\n✨ Full Taxonomy Sync Complete!')
}

main()
    .catch((e) => {
        console.error('❌ Sync failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
