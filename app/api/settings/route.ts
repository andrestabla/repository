
import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SystemSettingsService } from '@/lib/settings'

// GET: Retrieve all settings
export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    // 1. Auth Check (Admin Only)
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {
        const emailConfig = await SystemSettingsService.getEmailConfig()
        const driveConfig = await SystemSettingsService.getDriveConfig()

        // Mask password for security when sending to Client
        const maskedEmailConfig = emailConfig ? {
            ...emailConfig,
            smtpPass: emailConfig.smtpPass ? '********' : ''
        } : null

        return NextResponse.json({
            emailConfig: maskedEmailConfig,
            driveConfig
        })
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

// POST: Save settings
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    // 1. Auth Check (Admin Only)
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { type, data } = body

        if (type === 'email') {
            // Handle Password: if it's '********', keep the old password
            if (data.smtpPass === '********') {
                const existing = await SystemSettingsService.getEmailConfig()
                if (existing) {
                    data.smtpPass = existing.smtpPass
                }
            }

            await SystemSettingsService.saveEmailConfig({
                smtpHost: data.smtpHost,
                smtpPort: Number(data.smtpPort),
                smtpUser: data.smtpUser,
                smtpPass: data.smtpPass
            })
        } else if (type === 'drive') {
            await SystemSettingsService.saveDriveConfig({
                authorizedFolderIds: data.authorizedFolderIds
            })
        } else {
            return NextResponse.json({ error: 'Invalid setting type' }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error saving settings:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
}
