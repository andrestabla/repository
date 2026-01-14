
/**
 * Utility functions for handling Google Drive links and IDs
 */

// Regex to extract file ID from common Google Drive URLs
// Supports:
// - https://docs.google.com/document/d/FILE_ID/edit
// - https://drive.google.com/file/d/FILE_ID/view
// - https://drive.google.com/open?id=FILE_ID
const DRIVE_ID_REGEX = /[-\w]{25,}/

export const extractDriveId = (input: string): string | null => {
    if (!input) return null

    // If input is already an ID (alphanumeric, long enough), return it
    if (/^[-\w]{25,}$/.test(input)) {
        return input
    }

    // Attempt to extract from URL
    const match = input.match(DRIVE_ID_REGEX)
    return match ? match[0] : null
}

export const getDriveFileMetadata = async (fileId: string) => {
    // In a real implementation with Service Account properly set up:
    // const auth = new google.auth.GoogleAuth({ ... });
    // const service = google.drive({ version: 'v3', auth });
    // return await service.files.get({ fileId, fields: 'id, name, mimeType' });

    // current mock implementation for MVP validation
    // We check if it looks like a valid ID. 
    // If we had the service account creds in env, we'd ping the API.

    if (!fileId || fileId.length < 20) {
        throw new Error('Invalid Drive ID format')
    }

    // Mock success response
    return {
        id: fileId,
        name: 'Detected Drive File (Mock)',
        mimeType: 'application/vnd.google-apps.document'
    }
}

export type DriveFile = {
    id: string
    name: string
    mimeType: string
    thumbnailLink?: string
    webViewLink?: string
}

export const listDriveFiles = async (folderId?: string): Promise<DriveFile[]> => {
    // Mock implementation for the Picker
    // In real life, use google.drive.files.list({ q: `'${folderId}' in parents` })

    await new Promise(r => setTimeout(r, 800)) // Fake latency

    const mockFiles: DriveFile[] = [
        { id: '1A-mock-id-001', name: 'Manual del Facilitador M1.pdf', mimeType: 'application/pdf' },
        { id: '1A-mock-id-002', name: 'Presentación Ejecutiva.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
        { id: '1A-mock-id-003', name: 'Rubrica de Evaluación.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        { id: '1A-mock-id-004', name: 'Video Intro 4Shine.mp4', mimeType: 'video/mp4' },
        { id: '1A-mock-id-005', name: 'Workshop Structure.gdoc', mimeType: 'application/vnd.google-apps.document' },
    ]

    return mockFiles
}
