
"use client"

import { WorkbookForm } from './WorkbookForm'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function WorkbookDetailView({ workbook }: { workbook: any }) {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-bg p-8">
            <div className="max-w-4xl mx-auto mb-8">
                <button
                    onClick={() => router.push('/workbooks')}
                    className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors font-bold text-sm uppercase tracking-wider"
                >
                    <ArrowLeft size={16} />
                    Volver a la lista
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                <WorkbookForm
                    isOpen={true}
                    onClose={() => { }}
                    onSuccess={() => {
                        // In standalone mode, we might just want to refresh data or stay put
                        router.refresh()
                    }}
                    initialWorkbook={workbook}
                    isStandalone={true}
                />
            </div>
        </div>
    )
}
