import { NextRequest, NextResponse } from 'next/server'
import { listDriveFiles } from '@/lib/drive'
import { SystemSettingsService } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Enforce the constraint: Only list files from the configured ROOT folder
        const config = await SystemSettingsService.getDriveConfig()
        const rootFolderId = config.authorizedFolderIds[0]

        if (!rootFolderId) {
            return NextResponse.json({ error: 'No root folder configured in Admin Panel' }, { status: 400 })
        }

        const files = await listDriveFiles(rootFolderId)
        return NextResponse.json(files)
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
