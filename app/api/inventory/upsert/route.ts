import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { extractDriveId } from '@/lib/drive'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        let { id, title, type, pillar, sub, level, version, status, ip, driveId } = body

        if (!id || !title) {
            return NextResponse.json({ error: 'Missing required fields (ID or Title)' }, { status: 400 })
        }

        // 1. Clean and Validate Drive ID
        const cleanDriveId = extractDriveId(driveId || '')

        // 2. Calculate Completeness (0-100)
        // Fields that count towards completeness: title, type, pillar, sub, level, version, ip, driveId
        const requiredFields = [title, type, pillar, sub, level, version, ip, cleanDriveId]
        const filledFields = requiredFields.filter(f => f && f !== 'Completar' && f !== '').length
        const totalFields = requiredFields.length
        const completeness = Math.round((filledFields / totalFields) * 100)

        // 3. Status Gatekeeper
        // Cannot move to 'Revisión' (Review) if incompleto or missing file or IP is unset
        if (status === 'Revisión') {
            if (completeness < 100) {
                return NextResponse.json({
                    error: 'Cannot move to Review: Incomplete metadata (Completeness < 100%)'
                }, { status: 400 })
            }
            if (!cleanDriveId) {
                return NextResponse.json({
                    error: 'Cannot move to Review: Missing Drive File'
                }, { status: 400 })
            }
            if (!ip || ip === 'Completar') {
                return NextResponse.json({
                    error: 'Cannot move to Review: IP ownership not defined'
                }, { status: 400 })
            }
        }

        // 4. Upsert
        const item = await prisma.contentItem.upsert({
            where: { id },
            update: {
                title, type, pillar, sub, level, version, status,
                ip: ip || 'Completar',
                completeness,
                driveId: cleanDriveId
            },
            create: {
                id, title, type, pillar, sub, level,
                version: version || 'v1.0',
                status: status || 'Borrador',
                ip: ip || 'Completar',
                completeness,
                driveId: cleanDriveId
            },
        })

        return NextResponse.json(item)
    } catch (error) {
        console.error('Upsert Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
