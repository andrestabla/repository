
"use client"

import { X } from 'lucide-react'
import { useEffect } from 'react'
import { DriveUtils } from '@/lib/google'

interface ProductViewerProps {
    driveId: string | null;
    driveLink?: string; // Original URL to help determine optimal embed
    embedCode: string | null;
    title: string;
    type: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ProductViewer({ driveId, driveLink, embedCode, title, type, isOpen, onClose }: ProductViewerProps) {

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    if (!isOpen) return null

    // Determine content URL
    let contentUrl = ''
    if (driveId) {
        contentUrl = DriveUtils.getEmbedUrl(driveId, driveLink || '')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-6xl h-[90vh] bg-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-border">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-bg border-b border-border">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-text-main tracking-tight">{title}</h2>
                        <span className="text-xs text-text-muted font-bold uppercase tracking-wider">{type}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-border/20 hover:bg-border/40 rounded-full text-text-main transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-50 dark:bg-black/20 relative flex items-center justify-center">
                    {embedCode ? (
                        <div
                            className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
                            dangerouslySetInnerHTML={{ __html: embedCode }}
                        />
                    ) : contentUrl ? (
                        <iframe
                            src={contentUrl}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="autoplay"
                            title={title}
                        />
                    ) : (
                        <div className="text-text-muted text-sm font-medium">
                            No hay visualización disponible para este recurso.
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
