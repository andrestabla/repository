import { google } from 'googleapis'
import { SystemSettingsService } from './settings'

/**
 * Utility functions for handling Google Drive links and IDs
 */

// Regex to extract file ID from common Google Drive URLs
const DRIVE_ID_REGEX = /[-\w]{25,}/

export const extractDriveId = (input: string): string | null => {
    if (!input) return null
    if (/^[-\w]{25,}$/.test(input)) return input
    const match = input.match(DRIVE_ID_REGEX)
    return match ? match[0] : null
}

export type DriveFile = {
    id: string
    name: string
    mimeType: string
    thumbnailLink?: string
    webViewLink?: string
}

async function getDriveClient() {
    const config = await SystemSettingsService.getDriveConfig()

    if (!config.serviceAccountJson) {
        throw new Error('Service Account config not found')
    }

    try {
        const credentials = JSON.parse(config.serviceAccountJson)
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly']
        })
        return google.drive({ version: 'v3', auth })
    } catch (e) {
        throw new Error('Invalid Service Account JSON')
    }
}

export const listDriveFiles = async (folderId: string): Promise<DriveFile[]> => {
    try {
        const drive = await getDriveClient()

        console.log(`[Real Drive API] Listing files for folder: ${folderId}`)

        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, thumbnailLink, webViewLink)',
            pageSize: 50,
            orderBy: 'name',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        })

        const files = res.data.files || []

        return files.map(f => ({
            id: f.id || '',
            name: f.name || 'Untitled',
            mimeType: f.mimeType || 'application/octet-stream',
            thumbnailLink: f.thumbnailLink || undefined,
            webViewLink: f.webViewLink || undefined
        }))

    } catch (error) {
        console.error("Drive API Error:", error)

        // If config is missing, fallback to empty to avoid crashing UI, but log error
        // Or rethrow if we want specific error handling in the route
        if (String(error).includes('Service Account')) {
            // Return mock data ONLY if really needed for dev, but user requested REAL.
            // Let's return empty with error signal in name if something critical fails?
            // Better to return empty list so the UI shows "No files" or error toast.
            throw error
        }

        throw error
    }
}
