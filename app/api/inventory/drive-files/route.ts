
import { NextRequest, NextResponse } from 'next/server'
import { listDriveFiles } from '@/lib/drive'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const folderId = searchParams.get('folderId') || undefined

        const files = await listDriveFiles(folderId)
        return NextResponse.json(files)
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
