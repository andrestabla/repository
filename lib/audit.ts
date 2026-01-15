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
