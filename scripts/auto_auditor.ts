import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🤖 Starting Auto-Auditor Process...')

    // 1. Fetch relevant items
    const candidates = await prisma.contentItem.findMany({
        where: {
            status: { in: ['Revisión', 'Review', 'Borrador', 'Draft'] }
        }
    })

    console.log(`Found ${candidates.length} candidates for review.`)

    let approvedCount = 0
    let skippedCount = 0
    const skips: any[] = []

    for (const item of candidates) {
        // --- AUDIT LOGIC ---
        const checks = {
            hasTitle: !!item.title && item.title.trim().length > 0,
            hasPrimary: !!item.primaryPillar && item.primaryPillar !== 'Transversal',
            hasSecondary: item.secondaryPillars && item.secondaryPillars.length > 0,
            hasSub: !!item.sub,
            hasComp: !!item.competence,
            hasBehavior: !!item.behavior
        }

        const isCompliant = Object.values(checks).every(c => c === true)

        if (isCompliant) {
            // APPROVE AND PUBLISH
            try {
                await prisma.contentItem.update({
                    where: { id: item.id },
                    data: {
                        status: 'Validado',
                        // Add an audit trail in observations or maintain forceReason logic via SystemLog if I had one easily accessible.
                        // I'll append to observations if possible or just rely on the status change.
                        // The QA view component adds 'forceReason' logic but that seems to be for API/SystemLog.
                        // Here we just update the DB status directly.
                    }
                })
                approvedCount++
                process.stdout.write('.') // Progress indicator
            } catch (err) {
                console.error(`Error updating ${item.id}:`, err)
            }
        } else {
            // SKIP
            skippedCount++
            skips.push({ id: item.id, title: item.title, checks })
        }
    }

    console.log('\n\n--- AUDIT RESULTS ---')
    console.log(`Approved & Published: ${approvedCount}`)
    console.log(`Skipped (Incomplete): ${skippedCount}`)

    if (skips.length > 0) {
        console.log('\n--- SKIPPED ITEMS DETAILS ---')
        skips.forEach(s => {
            const missing = Object.entries(s.checks).filter(([k, v]) => !v).map(([k]) => k).join(', ')
            console.log(`[${s.id}] ${s.title} -> Missing: ${missing}`)
        })
    }

    // Normalizing English statuses if any left valid but named wrong?
    // The query above handled Review/Draft.
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
