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
