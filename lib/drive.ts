
import { google } from 'googleapis'
import { SystemSettingsService } from './settings'

// Polyfill for pdf-parse compatibility in Next.js Server Environment
if (typeof global.DOMMatrix === 'undefined') {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix { }
}

// @ts-ignore
const { PDFParse } = require('pdf-parse')

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
        if (String(error).includes('Service Account')) {
            throw error
        }
        throw error
    }
}

export const getFileContent = async (fileId: string): Promise<string> => {
    const drive = await getDriveClient()

    // 1. Get File Metadata to check type
    const meta = await drive.files.get({ fileId, fields: 'mimeType, name' })
    const mimeType = meta.data.mimeType

    console.log(`[Drive] Fetching content for ${fileId} (${mimeType})`)

    try {
        if (mimeType === 'application/vnd.google-apps.document') {
            // Google Doc -> Export as Text
            const res = await drive.files.export({
                fileId,
                mimeType: 'text/plain'
            })
            return typeof res.data === 'string' ? res.data : ''
        } else if (mimeType === 'application/pdf') {
            // PDF -> Download -> Parse
            console.log(`[Drive] Downloading PDF ${fileId}...`)
            const res = await drive.files.get({
                fileId,
                alt: 'media'
            }, { responseType: 'arraybuffer' })

            if (!res.data) throw new Error('No receiving data from Drive')

            // @ts-ignore
            const buffer = Buffer.from(res.data as ArrayBuffer)
            console.log(`[Drive] Parsing PDF buffer (${buffer.length} bytes)...`)

            if (typeof PDFParse !== 'function') {
                console.error('[Drive] PDFParse is not a function/constructor:', typeof PDFParse, PDFParse)
                throw new Error('PDF parser initialization failed (v2)')
            }

            const parser = new PDFParse({ data: buffer })
            const data = await parser.getText()
            await parser.destroy()
            return data.text
        } else if (mimeType?.startsWith('text/')) {
            // Plain Text
            const res = await drive.files.get({
                fileId,
                alt: 'media'
            })
            return typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
        }

        return ''
    } catch (e: any) {
        console.error('Error getting file content:', e)
        throw new Error(`[Drive Content Error] ${e.message || e}`)
    }
}
