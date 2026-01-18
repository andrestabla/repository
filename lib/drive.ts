
import { google } from 'googleapis'
import { SystemSettingsService } from './settings'

// Polyfill for pdf-parse compatibility in Next.js Server Environment
if (typeof global.DOMMatrix === 'undefined') {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix { }
}

// @ts-ignore
const pdf = require('pdf-parse')

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
            scopes: ['https://www.googleapis.com/auth/drive']
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

            if (typeof pdf !== 'function') {
                console.error('[Drive] pdf-parse is not a function:', typeof pdf, pdf)
                throw new Error('PDF parser (v1) initialization failed')
            }

            const data = await pdf(buffer)
            return data.text

        } else if (mimeType?.startsWith('text/')) {
            // Plain Text
            const res = await drive.files.get({
                fileId,
                alt: 'media'
            })
            return typeof res.data === 'string' ? res.data : JSON.stringify(res.data)

        } else if (mimeType === 'application/vnd.google-apps.presentation') {
            // Google Slides -> Export as Text
            const res = await drive.files.export({
                fileId,
                mimeType: 'text/plain'
            })
            return typeof res.data === 'string' ? res.data : ''

        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || // .docx
            mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
        ) {
            console.log(`[Drive] Downloading Office File ${fileId}...`)
            const res = await drive.files.get({
                fileId,
                alt: 'media'
            }, { responseType: 'arraybuffer' })

            if (!res.data) throw new Error('No receiving data from Drive')

            // @ts-ignore
            const buffer = Buffer.from(res.data as ArrayBuffer)
            console.log(`[Drive] Parsing Office File buffer (${buffer.length} bytes)...`)

            try {
                // @ts-ignore
                const officeParser = require('officeparser')

                // Use Promise API (v6+) which returns AST
                const ast = await officeParser.parseOffice(buffer)

                // Extract text from AST (check if it has toText method, or fallback)
                const text = (ast && typeof ast.toText === 'function')
                    ? ast.toText()
                    : (typeof ast === 'string' ? ast : JSON.stringify(ast))

                return text
            } catch (err: any) {
                console.error('[Drive] Office Parser Error:', err)
                throw new Error(`Failed to parse Office file: ${err.message}`)
            }
        }

        return ''
    } catch (e: any) {
        console.error('Error getting file content:', e)
        throw new Error(`[Drive Content Error] ${e.message || e}`)
    }
}

import fs from 'fs'
import path from 'path'
import os from 'os'
import { pipeline } from 'stream/promises'

export const downloadDriveFile = async (fileId: string): Promise<{ path: string, mimeType: string, originalName: string }> => {
    const drive = await getDriveClient()

    // 1. Get Metadata
    const meta = await drive.files.get({ fileId, fields: 'name, mimeType' })
    const fileName = meta.data.name || 'downloaded_file'
    const mimeType = meta.data.mimeType || 'application/octet-stream'

    // 2. Prepare Temp Path
    const tempPath = path.join(os.tmpdir(), `gemini_${fileId}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`)

    console.log(`[Drive] Downloading ${fileName} to ${tempPath}...`)

    // 3. Download Stream
    const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
    )

    // 4. Save to Disk
    await pipeline(res.data, fs.createWriteStream(tempPath))

    console.log(`[Drive] Download complete: ${tempPath}`)
    return { path: tempPath, mimeType, originalName: fileName }
}

export const uploadToDrive = async (filename: string, buffer: Buffer, mimeType: string, folderId: string): Promise<string> => {
    try {
        const drive = await getDriveClient()

        console.log(`[Drive] Uploading file: ${filename} to folder: ${folderId}`)

        const response = await drive.files.create({
            requestBody: {
                name: filename,
                parents: [folderId],
                description: 'Uploaded via 4Shine Methodology Builder'
            },
            media: {
                mimeType: mimeType,
                body: require('stream').Readable.from(buffer)
            },
            fields: 'id, webViewLink',
            supportsAllDrives: true,
            // @ts-ignore - some versions of the SDK might not have this in types but it's valid
            supportsTeamDrives: true
        })

        if (!response.data.id) {
            throw new Error('Failed to get Drive ID after upload')
        }

        return response.data.id
    } catch (error: any) {
        console.error('Drive Upload Error:', error)
        throw new Error(`[Drive Upload Error] ${error.message || error}`)
    }
}
