
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
