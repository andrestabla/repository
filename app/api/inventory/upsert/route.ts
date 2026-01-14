import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { extractDriveId } from '@/lib/drive'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Destructure ALL possible fields
        let {
            id, title, type, format, language, duration, year, source, // 1. Identity
            pillar, sub, competence, behavior, maturity, // 2. Classification
            intervention, moment, prereqId, testId, variable, impactScore, outcomeType, // 3. Trajectory
            trigger, recommendation, challengeType, evidenceRequired, nextContentId, // 4. Activation
            targetRole, roleLevel, industry, vipUsage, publicVisibility, // 5. Audience
            ipOwner, ipType, authorizedUse, confidentiality, reuseExternal, // 6. Governance
            driveId, version, observations, // 7. Operation & 8. Context
            status, ip, level // Legacy/Control
        } = body

        if (!id || !title) {
            return NextResponse.json({ error: 'Missing required fields (ID or Title)' }, { status: 400 })
        }

        // 1. Clean and Validate Drive ID
        const cleanDriveId = extractDriveId(driveId || '')

        // 2. Calculate Completeness (0-100)
        // Weighted completeness based on layers? For now, we take a subset of "Critical" fields
        const criticalFields = [
            title, type, pillar, sub, maturity, // Classification
            targetRole, // Audience
            ipOwner, // Governance
            cleanDriveId, version // Operation
        ]

        const filledFields = criticalFields.filter(f => f && f !== 'Completar' && f !== '').length
        const totalFields = criticalFields.length
        const completeness = Math.round((filledFields / totalFields) * 100)

        // 3. Status Gatekeeper
        if (status === 'Revisión') {
            if (completeness < 100) {
                // Relax check for MVP: Only block if CRITICAL info missing? 
                // For now stick to strict logical: if completeness score isn't max, 
                // warn. But wait, user might not fill ALL optional fields. 
                // Let's assume completeness logic needs refining, but for now we trust the score.
                // Actually, let's just ensure Drive ID is there for Review.
            }
            if (!cleanDriveId && type !== 'Physical') { // Only digital assets need drive
                return NextResponse.json({ error: 'Cannot move to Review: Missing Drive File' }, { status: 400 })
            }
        }

        // 4. Upsert
        // Map legacy 'level' to 'maturity' if needed, or vice-versa
        // Map legacy 'ip' to 'ipOwner' or 'ipType' if needed

        const dataPayload = {
            title, type, format, language, duration, year, source,
            pillar, sub, competence, behavior, maturity: maturity || level, // Fallback
            intervention, moment, prereqId, testId, variable, impactScore, outcomeType,
            trigger, recommendation, challengeType, evidenceRequired, nextContentId,
            targetRole, roleLevel, industry, vipUsage, publicVisibility,
            ipOwner: ipOwner || ip, // Fallback
            ipType, authorizedUse, confidentiality, reuseExternal,
            driveId: cleanDriveId, version: version || 'v1.0', observations,
            status: status || 'Borrador',
            completeness,
            // Maintain legacy fields sync
            level: maturity || level,
            ip: ipOwner || ip
        }

        const item = await prisma.contentItem.upsert({
            where: { id },
            update: dataPayload,
            create: { id, ...dataPayload },
        })

        return NextResponse.json(item)
    } catch (error) {
        console.error('Upsert Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
