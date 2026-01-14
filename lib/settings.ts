
import prisma from "@/lib/prisma"

export type EmailConfig = {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
}

export type DriveConfig = {
    authorizedFolderIds: string[]
}

export class SystemSettingsService {

    // --- Email ---
    static async getEmailConfig(): Promise<EmailConfig | null> {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'email_config' }
        })
        return setting?.value as EmailConfig | null
    }

    static async saveEmailConfig(config: EmailConfig) {
        return prisma.systemSettings.upsert({
            where: { key: 'email_config' },
            update: { value: config },
            create: { key: 'email_config', value: config }
        })
    }

    // --- Drive ---
    static async getDriveConfig(): Promise<DriveConfig> {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'drive_config' }
        })
        return (setting?.value as DriveConfig) || { authorizedFolderIds: [] }
    }

    static async saveDriveConfig(config: DriveConfig) {
        return prisma.systemSettings.upsert({
            where: { key: 'drive_config' },
            update: { value: config },
            create: { key: 'drive_config', value: config }
        })
    }
}
