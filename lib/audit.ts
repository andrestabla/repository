import prisma from './prisma'

export async function createLog(action: string, email: string, details?: string, resourceId?: string) {
    try {
        await prisma.systemLog.create({
            data: {
                action,
                userEmail: email,
                details,
                resourceId
            }
        })
    } catch (e) {
        console.error('Failed to create audit log:', e)
    }
}

export async function backfillMissingUserAuditLogs() {
    try {
        const usersWithoutLogs = await prisma.user.findMany({
            where: { logs: { none: {} } },
            select: {
                email: true,
                createdAt: true,
                isActive: true
            }
        })

        if (!usersWithoutLogs.length) return 0

        await prisma.systemLog.createMany({
            data: usersWithoutLogs.map(user => ({
                action: 'AUTH_LOGIN_BACKFILL',
                userEmail: user.email,
                details: user.isActive
                    ? 'Backfill automático: cuenta existente sin eventos históricos previos.'
                    : 'Backfill automático: cuenta inactiva existente sin eventos históricos previos.',
                resourceId: 'auth/backfill',
                createdAt: user.createdAt
            }))
        })

        return usersWithoutLogs.length
    } catch (e) {
        console.error('Failed to backfill audit logs:', e)
        return 0
    }
}

function getUtcDayRange(date = new Date()) {
    const start = new Date(date)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 1)
    return { start, end }
}

export async function createDailyAccessLog(email: string) {
    try {
        const { start, end } = getUtcDayRange()
        const exists = await prisma.systemLog.findFirst({
            where: {
                userEmail: email,
                action: 'AUTH_DAILY_ACCESS',
                createdAt: { gte: start, lt: end }
            },
            select: { id: true }
        })

        if (exists) return false

        await prisma.systemLog.create({
            data: {
                action: 'AUTH_DAILY_ACCESS',
                userEmail: email,
                details: 'Acceso diario detectado para sesión autenticada.',
                resourceId: 'auth/daily-access'
            }
        })

        return true
    } catch (e) {
        console.error('Failed to create daily access log:', e)
        return false
    }
}
