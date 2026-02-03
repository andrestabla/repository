
"use client"

import { useState, useEffect } from 'react'
import { Folder, File, X, ChevronRight, Loader2, Search, ArrowLeft } from 'lucide-react'

interface DriveFile {
    id: string
    name: string
    mimeType: string
    thumbnailLink?: string
    webViewLink?: string
}

interface DriveExplorerModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (file: DriveFile) => void
}

export function DriveExplorerModal({ isOpen, onClose, onSelect }: DriveExplorerModalProps) {
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState<DriveFile[]>([])
    const [history, setHistory] = useState<string[]>([])
    const [search, setSearch] = useState('')

    const currentFolderId = history.length > 0 ? history[history.length - 1] : null

    const fetchFiles = async (folderId: string | null = null) => {
        setLoading(true)
        try {
            const url = folderId ? `/api/inventory/drive-files?folderId=${folderId}` : '/api/inventory/drive-files'
            const res = await fetch(url)
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setFiles(data)
        } catch (error) {
            console.error('Error fetching drive files:', error)
        } finally {
            setLoading(true)
            // Small delay for smooth feel
            setTimeout(() => setLoading(false), 300)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchFiles(currentFolderId)
        }
    }, [isOpen, currentFolderId])

    const handleNavigate = (folderId: string) => {
        setHistory(prev => [...prev, folderId])
    }

    const handleBack = () => {
        setHistory(prev => prev.slice(0, -1))
    }

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-panel w-full max-w-3xl h-[600px] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-bg/50">
                    <div>
                        <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                            <Folder className="text-accent" size={20} />
                            Explorador de Google Drive
                        </h3>
                        <p className="text-xs text-text-muted mt-1">Navega por las carpetas autorizadas y selecciona un archivo.</p>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-border flex items-center gap-4 bg-bg/20">
                    {history.length > 0 && (
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-bg rounded-lg text-text-muted hover:text-text-main transition-all flex items-center gap-1 text-xs font-bold"
                        >
                            <ArrowLeft size={16} />
                            Atrás
                        </button>
                    )}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar en esta carpeta..."
                            className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-accent outline-none"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted gap-3">
                            <Loader2 className="animate-spin text-accent" size={32} />
                            <p className="text-sm font-medium">Cargando archivos...</p>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                            <Folder size={48} className="mb-4" />
                            <p className="text-sm">No se encontraron archivos en esta carpeta.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {filteredFiles.map((file) => {
                                const isFolder = file.mimeType === 'application/vnd.google-apps.folder'
                                return (
                                    <button
                                        key={file.id}
                                        onClick={() => isFolder ? handleNavigate(file.id) : onSelect(file)}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border hover:bg-bg/50 transition-all text-left group"
                                    >
                                        <div className={`p-2 rounded-lg ${isFolder ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {isFolder ? <Folder size={18} /> : <File size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-text-main truncate group-hover:text-accent transition-colors">{file.name}</p>
                                            <p className="text-[10px] text-text-muted uppercase tracking-wider">
                                                {isFolder ? 'Carpeta' : file.mimeType.split('.').pop()?.split('/').pop() || 'Archivo'}
                                            </p>
                                        </div>
                                        {isFolder && <ChevronRight size={14} className="text-text-muted group-hover:translate-x-1 transition-transform" />}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-bg/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text-main transition-colors uppercase tracking-wider"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}
