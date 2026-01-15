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
    const role = (session?.user as any)?.role?.toUpperCase()

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
            driveId, version, observations, transcription,
            status, ip, level,
            forceReason // Special field for Admin bypass
        } = body

        if (!id || !title) {
            return NextResponse.json({ error: 'Missing required fields (ID or Title)' }, { status: 400 })
        }

        const finalPrimaryPillar = primaryPillar || pillar || 'Transversal'
        const finalSecondaryPillars = Array.isArray(secondaryPillars) ? secondaryPillars : []

        // 1. Authorization and State Machine check
        const existingItem = await prisma.contentItem.findUnique({ where: { id } })

        // RBAC: Only Auditor or Admin can set status to 'Validado'
        const normalizedRole = role?.toUpperCase()
        if (status === 'Validado' && normalizedRole !== 'ADMIN' && normalizedRole !== 'AUDITOR') {
            return NextResponse.json({ error: 'Permisos insuficientes: Solo un Auditor puede validar activos.' }, { status: 403 })
        }

        // Lock check for Validated items
        if (existingItem && existingItem.status === 'Validado' && role !== 'ADMIN') {
            return NextResponse.json({ error: 'Activo Validado: Solo administradores pueden modificarlo.' }, { status: 403 })
        }

        // Admin/Auditor Bypass Logging (HU-A-04 Reject/Approve reasons)
        if (forceReason) {
            await createLog('AUDIT_ACTION', userEmail || 'system', `Action: ${status} | Motivo: ${forceReason}`, id)
        } else if (existingItem && existingItem.status === 'Validado' && role === 'ADMIN') {
            return NextResponse.json({ error: 'Admin debe proveer un motivo para editar un activo validado.' }, { status: 400 })
        }

        // 2. Clean and Validate Drive ID
        let cleanDriveId: string | null | undefined = undefined
        if (driveId !== undefined) {
            cleanDriveId = extractDriveId(driveId)
        }

        // 3. Calculate Completeness
        const criticalFields = [
            title, type, finalPrimaryPillar, sub, maturity,
            targetRole, ipOwner, cleanDriveId, version
        ]
        const filledFields = criticalFields.filter(f => f && f !== 'Completar' && f !== '').length
        const totalFields = criticalFields.length
        const completeness = Math.round((filledFields / totalFields) * 100)

        // 4. Data Payload
        const dataPayload: any = {
            title,
            type: type || 'Documento', // Default to 'Documento' as per requirement
            format, language, duration, year, source,
            primaryPillar: finalPrimaryPillar,
            secondaryPillars: finalSecondaryPillars,
            sub, competence, behavior, maturity: maturity || level,
            intervention, moment, prereqId, testId, variable, impactScore, outcomeType,
            trigger, recommendation, challengeType, evidenceRequired, nextContentId,
            targetRole, roleLevel, industry, vipUsage, publicVisibility,
            ipOwner: ipOwner || ip,
            ipType, authorizedUse, confidentiality, reuseExternal,
            version: version || 'v1.0',
            observations,
            transcription,
            status: status || 'Borrador',
            completeness,
            level: maturity || level,
            ip: ipOwner || ip
        }

        if (cleanDriveId !== undefined) {
            dataPayload.driveId = cleanDriveId
        }

        const item = await prisma.contentItem.upsert({
            where: { id },
            update: dataPayload,
            create: { id, ...dataPayload },
        })

        // Log general update
        if (!forceReason) {
            await createLog(existingItem ? 'UPDATE_CONTENT' : 'CREATE_CONTENT', userEmail || 'system', `${item.title} [State: ${item.status}]`, id)
        }

        return NextResponse.json(item)
    } catch (error) {
        console.error('Upsert Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
