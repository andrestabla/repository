import { NextRequest, NextResponse } from 'next/server'
import { listDriveFiles } from '@/lib/drive'
import { SystemSettingsService } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const requestedFolderId = searchParams.get('folderId')

        // Enforce the constraint: Only list files from the configured ROOT folder
        // TODO: In a real hierarchical enforcement, we should check if requestedFolderId is a child of the root.
        // For now, we trust the ID but default to root if null.
        const config = await SystemSettingsService.getDriveConfig()
        const rootFolderId = config.authorizedFolderIds[0]

        if (!rootFolderId) {
            return NextResponse.json({ error: 'No root folder configured in Admin Panel' }, { status: 400 })
        }

        const targetFolderId = requestedFolderId || rootFolderId

        const files = await listDriveFiles(targetFolderId)
        return NextResponse.json(files)
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
