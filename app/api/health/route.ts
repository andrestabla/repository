import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function isAdmin() {
    const session = await getServerSession(authOptions)
    return (session?.user as any)?.role === 'admin'
}

export async function GET() {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const health: any = {
        database: { status: 'loading', details: '' },
        drive: { status: 'loading', details: '' },
        gemini: { status: 'loading', details: '' }
    }

    // 1. Database Check
    try {
        await prisma.$queryRaw`SELECT 1`
        health.database = { status: 'healthy', details: 'Connected to Neon DB' }
    } catch (e) {
        health.database = { status: 'error', details: String(e) }
    }

    // 2. Drive Check (Simple check if config exists and service account is valid JSON)
    try {
        const settings = await prisma.systemSettings.findUnique({ where: { key: 'driveConfig' } })
        if (settings) {
            const config = settings.value as any
            if (config.serviceAccountJson) {
                JSON.parse(config.serviceAccountJson)
                health.drive = { status: 'healthy', details: 'Google Drive configuration valid' }
            } else {
                health.drive = { status: 'warning', details: 'Service Account JSON missing' }
            }
        } else {
            health.drive = { status: 'warning', details: 'No Drive settings found' }
        }
    } catch (e) {
        health.drive = { status: 'error', details: 'Invalid Service Account JSON' }
    }

    // 3. Gemini Check
    try {
        const settings = await prisma.systemSettings.findUnique({ where: { key: 'geminiApiKey' } })
        if (settings && (settings.value as any).key) {
            health.gemini = { status: 'healthy', details: 'API Key configured' }
        } else {
            health.gemini = { status: 'warning', details: 'API Key missing' }
        }
    } catch (e) {
        health.gemini = { status: 'error', details: String(e) }
    }

    return NextResponse.json(health)
}
