
import prisma from "@/lib/prisma"

export type EmailConfig = {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
    senderName?: string
    senderEmail?: string
}

export type DriveConfig = {
    authorizedFolderIds: string[]
    serviceAccountJson?: string
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

    // --- Gemini ---
    static async getGeminiApiKey(): Promise < string | null > {
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'gemini_api_key' }
    })
        return setting?.value as string | null
}

    static async saveGeminiApiKey(key: string) {
    return prisma.systemSettings.upsert({
        where: { key: 'gemini_api_key' },
        update: { value: key },
        create: { key: 'gemini_api_key', value: key }
    })
}
}
