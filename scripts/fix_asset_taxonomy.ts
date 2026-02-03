import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Aliases map: Legacy/Wrong Name -> New Canonical Name (Level 2)
const ALIAS_MAP: Record<string, string> = {
    'comunicación poderosa': 'Comunicación de impacto',
    'gestión de carrera': 'Visión de futuro y estrategia',
    'marca personal': 'Identidad de liderazgo (identity ownership)',
    'shine in': 'Shine Within',
    'autoconfianza': 'Autoconfianza y autoliderazgo',
    'inteligencia emocional': 'Inteligencia emocional y regulación (self-regulation)',
    'propósito': 'Propósito y valores (integridad)',
    'aprendizaje': 'Aprendizaje y reflexión (self-awareness)',
    'biohacking': 'Gestión de energía y bienestar (biohacking)',
    'comunicación': 'Comunicación de impacto',
    'networking': 'Networking estratégico'
}

const COMP_TO_SUB_FIX: Record<string, string> = {
    'autenticidad': 'Propósito y valores (integridad)',
    'marca personal': 'Identidad de liderazgo (identity ownership)',
}

async function main() {
    console.log('🚀 Starting Advanced Taxonomy Fix 2.1 (Normalization)...\n')

    // 1. Build Canonical Maps
    const canonPillarMap = new Map<string, string>() // lowerComp -> PillarName
    const canonNameMap = new Map<string, string>()   // lowerComp -> CanonicalName

    const taxonomy = await prisma.taxonomy.findMany({
        where: { type: 'Pillar', active: true },
        include: { children: true }
    })

    taxonomy.forEach(p => {
        p.children.forEach(c => {
            const lower = c.name.trim().toLowerCase()
            canonPillarMap.set(lower, p.name)
            canonNameMap.set(lower, c.name.trim())
        })
    })

    // 2. Fetch Assets
    const items = await prisma.contentItem.findMany()
    let updatedCount = 0

    for (const item of items) {
        if (!item.sub) continue

        let currentSub = item.sub.trim()
        let currentComp = item.competence?.trim() || ''
        let currentPillar = item.primaryPillar
        let needsUpdate = false

        let lowerSub = currentSub.toLowerCase()
        let lowerComp = currentComp.toLowerCase()

        // --- STAGE 0: PROMOTION FIX ---
        if (COMP_TO_SUB_FIX[lowerSub]) {
            console.log(`   ⬆️  Promoting Sub "${currentSub}" to Competence`)
            currentComp = currentSub
            currentSub = COMP_TO_SUB_FIX[lowerSub]
            needsUpdate = true
            lowerSub = currentSub.toLowerCase()
        }

        if (currentComp && COMP_TO_SUB_FIX[lowerComp]) {
            const correctSub = COMP_TO_SUB_FIX[lowerComp]
            if (correctSub.toLowerCase() !== lowerSub) {
                console.log(`   twisted_right_wards_arrows  Realigning Parent Sub for Comp "${currentComp}": "${currentSub}" -> "${correctSub}"`)
                currentSub = correctSub
                needsUpdate = true
                lowerSub = currentSub.toLowerCase()
            }
        }

        // --- STAGE 1: ALIAS FIX ---
        if (ALIAS_MAP[lowerSub]) {
            currentSub = ALIAS_MAP[lowerSub]
            needsUpdate = true
            lowerSub = currentSub.toLowerCase() // Re-eval
        } else {
            for (const key in ALIAS_MAP) {
                if (lowerSub.includes(key) && !ALIAS_MAP[lowerSub]) {
                    currentSub = ALIAS_MAP[key]
                    needsUpdate = true
                    lowerSub = currentSub.toLowerCase()
                    break
                }
            }
        }

        // --- STAGE 2: PILLAR & NORMALIZATION FIX ---
        const targetPillar = canonPillarMap.get(lowerSub)
        const canonicalName = canonNameMap.get(lowerSub)

        if (targetPillar) {
            // Check Pillar
            if (currentPillar !== targetPillar) {
                console.log(`   📍 Moving Pillar for "${item.title}": ${currentPillar} -> ${targetPillar}`)
                currentPillar = targetPillar
                needsUpdate = true
            }
            // Normalization (Casing Fix)
            if (canonicalName && currentSub !== canonicalName) {
                console.log(`   ✨ Normalizing Name: "${currentSub}" -> "${canonicalName}"`)
                currentSub = canonicalName
                needsUpdate = true
            }
        }

        if (needsUpdate) {
            await prisma.contentItem.update({
                where: { id: item.id },
                data: {
                    primaryPillar: currentPillar,
                    sub: currentSub,
                    competence: currentComp
                }
            })
            updatedCount++
        }
    }

    console.log(`\n✅ Assets updated: ${updatedCount}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
