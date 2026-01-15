import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { extractDriveId } from '@/lib/drive'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createLog } from "@/lib/audit"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email
    const role = (session?.user as any)?.role

    try {
        const body = await request.json()
        let {
            id, title, type, format, language, duration, year, source,
            pillar, primaryPillar, secondaryPillars,
            sub, competence, behavior, maturity,
            intervention, moment, prereqId, testId, variable, impactScore, outcomeType,
            trigger, recommendation, challengeType, evidenceRequired, nextContentId,
            targetRole, roleLevel, industry, vipUsage, publicVisibility,
            ipOwner, ipType, authorizedUse, confidentiality, reuseExternal,
            driveId, version, observations,
            status, ip, level,
            forceReason // Special field for Admin bypass
        } = body

        if (!id || !title) {
            return NextResponse.json({ error: 'Missing required fields (ID or Title)' }, { status: 400 })
        }

        const finalPrimaryPillar = primaryPillar || pillar || 'Transversal'
        const finalSecondaryPillars = Array.isArray(secondaryPillars) ? secondaryPillars : []

        // 1. Authorization check for existing items
        const existingItem = await prisma.contentItem.findUnique({ where: { id } })

        if (existingItem && existingItem.status === 'Validado' && role !== 'admin') {
            return NextResponse.json({ error: 'Item is validated and locked. Only Admin can modify it.' }, { status: 403 })
        }

        if (existingItem && existingItem.status === 'Validado' && role === 'admin') {
            if (!forceReason) {
                return NextResponse.json({ error: 'Admin must provide a reason for force-editing a validated item.' }, { status: 400 })
            }
            await createLog('FORCE_EDIT', userEmail!, `Reason: ${forceReason}`, id)
        }

        // 2. Clean and Validate Drive ID
        const cleanDriveId = extractDriveId(driveId || '')

        // 3. Calculate Completeness
        const criticalFields = [
            title, type, finalPrimaryPillar, sub, maturity,
            targetRole, ipOwner, cleanDriveId, version
        ]
        const filledFields = criticalFields.filter(f => f && f !== 'Completar' && f !== '').length
        const totalFields = criticalFields.length
        const completeness = Math.round((filledFields / totalFields) * 100)

        // 4. Data Payload
        const dataPayload = {
            title, type, format, language, duration, year, source,
            primaryPillar: finalPrimaryPillar,
            secondaryPillars: finalSecondaryPillars,
            sub, competence, behavior, maturity: maturity || level,
            intervention, moment, prereqId, testId, variable, impactScore, outcomeType,
            trigger, recommendation, challengeType, evidenceRequired, nextContentId,
            targetRole, roleLevel, industry, vipUsage, publicVisibility,
            ipOwner: ipOwner || ip,
            ipType, authorizedUse, confidentiality, reuseExternal,
            driveId: cleanDriveId, version: version || 'v1.0', observations,
            status: status || 'Borrador',
            completeness,
            level: maturity || level,
            ip: ipOwner || ip
        }

        const item = await prisma.contentItem.upsert({
            where: { id },
            update: dataPayload,
            create: { id, ...dataPayload },
        })

        // Log general update if not handled by force-edit
        if (!existingItem || existingItem.status !== 'Validado') {
            await createLog(existingItem ? 'UPDATE_CONTENT' : 'CREATE_CONTENT', userEmail || 'system', `Title: ${title}`, id)
        }

        return NextResponse.json(item)
    } catch (error) {
        console.error('Upsert Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
