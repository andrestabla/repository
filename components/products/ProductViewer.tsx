
"use client"

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ProductViewerProps {
    driveId: string | null;
    title: string;
    type: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ProductViewer({ driveId, title, type, isOpen, onClose }: ProductViewerProps) {

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    if (!isOpen || !driveId) return null

    // Google Drive Preview URL
    const embedUrl = `https://drive.google.com/file/d/${driveId}/preview`

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-6xl h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-700">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
                        <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">{type}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-full text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-slate-950 relative">
                    <iframe
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="autoplay"
                        title={title}
                    />
                </div>

            </div>
        </div>
    )
}
