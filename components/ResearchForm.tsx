'use client'

import React, { useState } from 'react'
import { X, Save, Globe, BookOpen, Quote, FileText, Link as LinkIcon, Edit3, Briefcase, Sparkles, ExternalLink, Maximize2, Check, Zap, Paperclip, Cloud, Folder, ChevronRight, Loader2 } from 'lucide-react'

// Updated Interface matching ResearchSource model
interface ResearchSource {
    id: string
    title: string
    apa?: string
    url?: string
    summary?: string
    keyConcepts?: string
    findings?: string
    methodology?: string
    relation4Shine?: string
    pillars?: string[]
    driveId?: string
}

type DriveFile = {
    id: string
    name: string
    mimeType: string
}

interface Props {
    initialData?: ResearchSource
    onClose: () => void
    onSave: () => void
    readOnly?: boolean
}

export default function ResearchForm({ initialData, onClose, onSave, readOnly = false }: Props) {
    const [formData, setFormData] = useState<Partial<ResearchSource>>({
        title: '',
        apa: '',
        url: '',
        summary: '',
        keyConcepts: '',
        findings: '',
        methodology: '',
        relation4Shine: '',
        pillars: [],
        driveId: '',
        ...initialData
    })
    const [showIframe, setShowIframe] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // Drive Picker State
    const [showPicker, setShowPicker] = useState(false)
    const [pickerFiles, setPickerFiles] = useState<DriveFile[]>([])
    const [loadingPicker, setLoadingPicker] = useState(false)
    const [folderHistory, setFolderHistory] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'Inicio' }])

    // Helper to toggle pillar
    const togglePillar = (pillar: string) => {
        setFormData(prev => {
            const current = prev.pillars || []
            const newPillars = current.includes(pillar)
                ? current.filter(p => p !== pillar)
                : [...current, pillar]
            return { ...prev, pillars: newPillars }
        })
    }

    const fetchDriveFiles = async (folderId?: string) => {
        setLoadingPicker(true)
        try {
            const url = folderId ? `/api/inventory/drive-files?folderId=${folderId}` : '/api/inventory/drive-files'
            const res = await fetch(url)
            const data = await res.json()
            if (Array.isArray(data)) setPickerFiles(data)
        } catch (e) { console.error(e) }
        setLoadingPicker(false)
    }

    const openPicker = () => {
        if (readOnly) return
        setShowPicker(true)
        setFolderHistory([{ id: 'root', name: 'Inicio' }])
        fetchDriveFiles()
    }

    const handleFolderClick = (folder: DriveFile) => {
        setFolderHistory(prev => [...prev, { id: folder.id, name: folder.name }])
        fetchDriveFiles(folder.id)
    }

    const handleBreadcrumbClick = (index: number) => {
        const target = folderHistory[index]
        const newHistory = folderHistory.slice(0, index + 1)
        setFolderHistory(newHistory)

        if (target.id === 'root') {
            fetchDriveFiles()
        } else {
            fetchDriveFiles(target.id)
        }
    }

    const selectFile = (file: DriveFile) => {
        setFormData(prev => ({
            ...prev,
            driveId: file.id,
            title: prev.title || file.name.replace(/\.[^/.]+$/, "") // Auto-fill title removing extension
        }))
        setShowPicker(false)
    }

    const handleSaveInternal = async () => {
        try {
            const res = await fetch('/api/research/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) onSave()
            else alert('Error guardando fuente')
        } catch (e) { alert('Network Error') }
    }

    const handleAIAnalyze = async () => {
        if (!formData.url && !formData.driveId) {
            alert('Por favor agrega una URL o selecciona un archivo de Drive primero.')
            return
        }
        setIsAnalyzing(true)
        try {
            // New endpoint response structure should be handled here
            const res = await fetch('/api/inventory/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: formData.url,
                    driveId: formData.driveId,
                    type: 'Investigación' // Hint to backend
                })
            })
            const result = await res.json()
            if (result.error) throw new Error(result.error)

            // Map AI result to form (Adapt based on your analyze prompt output structure)
            const meta = result.data || {}
            setFormData(prev => ({
                ...prev,
                summary: meta.summary || prev.summary,
                keyConcepts: meta.keyConcepts || meta.concepts || prev.keyConcepts,
                findings: meta.findings || prev.findings,
                apa: meta.apa || prev.apa,
                methodology: meta.methodology || prev.methodology,
                relation4Shine: meta.relation4Shine || prev.relation4Shine, // If backend supports it
                title: prev.title || meta.title, // Auto-title if empty
                pillars: meta.pillars || prev.pillars // If backend guesses pillars
            }))
        } catch (e: any) {
            alert('Error en análisis IA: ' + e.message)
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className={`bg-bg w-full ${showIframe ? 'max-w-[95vw]' : 'max-w-5xl'} h-[90vh] rounded-[32px] border-4 border-border shadow-2xl flex flex-col overflow-hidden relative transition-all duration-500`}>

                {/* Header */}
                <div className="h-16 border-b-4 border-border flex items-center justify-between px-8 bg-card-bg shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                            <BookOpen size={16} />
                        </div>
                        <h2 className="text-sm font-black text-text-main uppercase tracking-widest">
                            {initialData ? 'Editar Fuente' : 'Nueva Fuente'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {!readOnly && (
                            <button
                                onClick={handleAIAnalyze}
                                disabled={isAnalyzing}
                                className={`h-8 px-4 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all ${isAnalyzing ? 'opacity-50 cursor-wait' : 'shadow-lg shadow-indigo-500/30'}`}
                            >
                                <Sparkles size={14} className={isAnalyzing ? "animate-spin" : ""} />
                                {isAnalyzing ? 'Analizando...' : 'Autocompletar con IA'}
                            </button>
                        )}

                        {formData.url && (
                            <button onClick={() => setShowIframe(!showIframe)} className={`w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors ${showIframe ? 'text-accent' : 'text-text-muted'}`} title="Ver Navegador Web">
                                <Maximize2 size={18} />
                            </button>
                        )}
                        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-text-muted transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">

                    {/* Main Form Scrollable */}
                    <div className={`flex-1 overflow-y-auto p-8 space-y-8 ${showIframe ? 'hidden lg:block lg:w-1/2 lg:flex-none border-r-4 border-border' : ''}`}>

                        {/* Title */}
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Título</label>
                            <input
                                value={formData.title || ''}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full h-12 bg-bg border-4 border-border rounded-xl px-4 text-sm font-bold text-text-main focus:border-accent outline-none transition-all"
                                placeholder="Título del estudio..."
                                disabled={readOnly}
                            />
                        </div>

                        {/* Sources: URL & Drive */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">URL Pública</label>
                                <div className="relative flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            value={formData.url || ''}
                                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                                            className="w-full h-10 bg-bg border-2 border-border rounded-lg pl-9 px-3 text-xs text-blue-600 focus:border-accent outline-none transition-all"
                                            placeholder="https://..."
                                            disabled={readOnly}
                                        />
                                        <Globe size={14} className="absolute left-3 top-3 text-text-muted" />
                                    </div>
                                    {formData.url && (
                                        <a href={formData.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-card-bg border-2 border-border rounded-lg flex items-center justify-center hover:bg-black/5 text-text-muted">
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Archivo de Drive (ID)</label>
                                <div className="relative">
                                    <input
                                        value={formData.driveId || ''}
                                        onChange={e => setFormData({ ...formData, driveId: e.target.value })}
                                        className="w-full h-10 bg-bg border-2 border-border rounded-lg pl-9 px-3 text-xs text-text-main font-mono focus:border-accent outline-none transition-all"
                                        placeholder="ID de Archivo de Drive"
                                        disabled={readOnly}
                                    />
                                    <Paperclip size={14} className="absolute left-3 top-3 text-text-muted" />
                                </div>
                                <div className="mt-1 text-[10px] text-text-muted flex justify-end">
                                    <button onClick={openPicker} type="button" className="hover:text-accent font-bold flex items-center gap-1">
                                        <Folder size={10} /> Explorar Drive
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4SHINE PILLARS MULTI-SELECT */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-accent uppercase tracking-widest pl-1">Pilares Relacionados (4Shine)</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['Shine In', 'Shine Out', 'Shine Up', 'Shine On'].map((pillar) => {
                                    const isSelected = formData.pillars?.includes(pillar)
                                    return (
                                        <button
                                            key={pillar}
                                            onClick={() => !readOnly && togglePillar(pillar)}
                                            className={`h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2
                                                ${isSelected
                                                    ? 'bg-accent/10 border-accent text-accent shadow-sm'
                                                    : 'bg-bg border-border text-text-muted hover:border-accent/50'
                                                } ${readOnly ? 'cursor-default opacity-80' : ''}`}
                                        >
                                            {isSelected && <Check size={12} />}
                                            {pillar}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* APA Reference Block */}
                        <div className="bg-yellow-50/50 p-6 rounded-2xl border-l-4 border-yellow-400">
                            <div className="flex items-center gap-2 mb-3">
                                <Quote size={14} className="text-yellow-600" />
                                <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Referencia APA</h3>
                            </div>
                            <textarea
                                value={formData.apa || ''}
                                onChange={e => setFormData({ ...formData, apa: e.target.value })}
                                className="w-full bg-transparent border-none p-0 text-sm text-text-main font-serif italic placeholder:text-text-muted/50 focus:ring-0 resize-none"
                                placeholder="Autor, A. A. (Año)..."
                                rows={3}
                                disabled={readOnly}
                            />
                        </div>

                        {/* 4SHINE RELATION */}
                        <div className="bg-indigo-50/50 p-6 rounded-2xl border-l-4 border-indigo-400 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={14} className="text-indigo-600" />
                                <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Relación con 4Shine</h3>
                            </div>
                            <textarea
                                value={formData.relation4Shine || ''}
                                onChange={e => setFormData({ ...formData, relation4Shine: e.target.value })}
                                className="w-full bg-transparent border-none p-0 text-sm text-indigo-950/90 placeholder:text-indigo-900/40 focus:ring-0 resize-none font-medium leading-relaxed"
                                placeholder="¿Cómo sustenta este estudio nuestra metodología?..."
                                rows={3}
                                disabled={readOnly}
                            />
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Reseña Ejecutiva</label>
                                <textarea
                                    value={formData.summary || ''}
                                    onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                    className="w-full h-32 bg-bg border-2 border-border rounded-xl p-4 text-sm text-text-main focus:border-accent outline-none resize-none"
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-accent uppercase tracking-widest mb-2 pl-1 border-b border-border pb-1">Conceptos Clave</label>
                                <textarea
                                    value={formData.keyConcepts || ''}
                                    onChange={e => setFormData({ ...formData, keyConcepts: e.target.value })}
                                    className="w-full h-40 bg-bg border-2 border-border rounded-xl p-4 text-xs text-text-main focus:border-accent outline-none resize-none"
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 pl-1 border-b border-border pb-1">Hallazgos Importantes</label>
                                <textarea
                                    value={formData.findings || ''}
                                    onChange={e => setFormData({ ...formData, findings: e.target.value })}
                                    className="w-full h-40 bg-bg border-2 border-border rounded-xl p-4 text-xs text-text-main focus:border-accent outline-none resize-none"
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Diferencial Metodológico</label>
                                <input
                                    value={formData.methodology || ''}
                                    onChange={e => setFormData({ ...formData, methodology: e.target.value })}
                                    className="w-full h-10 bg-bg border-2 border-border rounded-lg px-4 text-xs text-text-main focus:border-accent outline-none"
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Iframe View */}
                    {showIframe && formData.url && (
                        <div className="flex-1 bg-white border-l-4 border-border flex flex-col">
                            <div className="h-10 border-b border-gray-200 flex items-center px-4 bg-gray-50 text-xs text-gray-400 gap-2">
                                <Globe size={12} />
                                <span className="truncate">{formData.url}</span>
                            </div>
                            <iframe
                                src={formData.url}
                                className="w-full h-full"
                                title="Preview"
                                sandbox="allow-same-origin allow-scripts allow-forms"
                            />
                            <div className="p-2 bg-yellow-50 text-[10px] text-yellow-700 text-center border-t border-yellow-200">
                                ¿No carga? <a href={formData.url} target="_blank" className="underline font-bold">Abrir nueva pestaña</a>.
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="h-20 border-t-4 border-border px-8 flex items-center justify-between bg-card-bg shrink-0">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        Base de Conocimiento Relacional
                    </div>
                    {!readOnly && (
                        <button
                            onClick={handleSaveInternal}
                            className="bg-accent text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-accent/20"
                        >
                            <Save size={16} />
                            Guardar Fuente
                        </button>
                    )}
                </div>

            </div>

            {/* DRIVE PICKER MODAL OVERLAY */}
            {showPicker && (
                <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-2xl flex items-center justify-center p-12 transition-all animate-in zoom-in-95 duration-300">
                    <div className="bg-panel border border-border rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden">
                        <div className="p-8 border-b border-border flex justify-between items-center bg-bg/80 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                                    <Cloud size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-text-main tracking-tight text-xl">Explorador de Drive</h3>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">Selecciona el recurso a vincular</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPicker(false)}
                                className="w-8 h-8 rounded-full hover:bg-panel hover:text-danger transition-all flex items-center justify-center"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* BREADCRUMBS */}
                        <div className="px-8 py-3 border-b border-border bg-gray-50/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {folderHistory.map((item, idx) => (
                                <div key={item.id} className="flex items-center text-xs whitespace-nowrap">
                                    <button
                                        onClick={() => handleBreadcrumbClick(idx)}
                                        className={`hover:bg-gray-200 px-2 py-1 rounded-md transition-colors ${idx === folderHistory.length - 1 ? 'font-bold text-gray-800' : 'text-gray-500'}`}
                                    >
                                        {item.name}
                                    </button>
                                    {idx < folderHistory.length - 1 && <ChevronRight size={12} className="text-gray-400 mx-1" />}
                                </div>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                            {loadingPicker ? (
                                <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-30">
                                    <Loader2 size={32} className="animate-spin mb-4" />
                                    <div className="text-[10px] font-black uppercase tracking-widest">Cargando Archivos...</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {pickerFiles.map(file => {
                                        const isFolder = file.mimeType === 'application/vnd.google-apps.folder' || file.mimeType === 'application/vnd.google-apps.shortcut'

                                        return (
                                            <button
                                                key={file.id}
                                                onClick={() => isFolder ? handleFolderClick(file) : selectFile(file)}
                                                className="flex items-center justify-between p-4 hover:bg-accent/5 rounded-[20px] text-left group transition-all border border-transparent hover:border-accent/20"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${isFolder ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'bg-white border border-gray-200 text-gray-500'
                                                        }`}>
                                                        {isFolder ? <Folder size={20} fill="currentColor" className="opacity-80" /> : <FileText size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-text-main group-hover:text-accent tracking-tight transition-colors">{file.name}</div>
                                                        {!isFolder && <div className="text-[10px] font-mono text-text-muted opacity-60 mt-0.5">{file.id}</div>}
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-accent/10 opacity-0 group-hover:opacity-100 flex items-center justify-center text-accent transition-all">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </button>
                                        )
                                    })}
                                    {pickerFiles.length === 0 && (
                                        <div className="py-20 text-center text-text-muted italic opacity-40">
                                            Carpeta vacía o sin acceso.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
