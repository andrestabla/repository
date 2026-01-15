'use client'

import React, { useState } from 'react'
import { X, Save, Globe, BookOpen, Quote, FileText, Link as LinkIcon, Edit3, Briefcase, Sparkles, ExternalLink, Maximize2 } from 'lucide-react'

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
        ...initialData
    })
    const [showIframe, setShowIframe] = useState(false)

    const handleSaveInternal = async () => {
        try {
            // Check if URL is present to enable iframe auto-show next time
            const res = await fetch('/api/research/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) onSave()
            else alert('Error guardando fuente')
        } catch (e) { alert('Network Error') }
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
                    <div className="flex items-center gap-2">
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

                {/* Content Split: Form vs Iframe */}
                <div className="flex-1 overflow-hidden flex">

                    {/* Main Form Scrollable */}
                    <div className={`flex-1 overflow-y-auto p-8 space-y-8 ${showIframe ? 'hidden lg:block lg:w-1/2 lg:flex-none border-r-4 border-border' : ''}`}>
                        {/* Basic Info */}
                        <div className="space-y-4">
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">ID</label>
                                    <input value={formData.id || 'N/A'} disabled className="w-full h-10 bg-black/5 border-2 border-transparent rounded-lg px-3 text-xs text-text-muted font-mono" placeholder="Auto-generado" />
                                </div>
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

                        {/* 4SHINE RELATION - HIGHLIGHTED */}
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
                                sandbox="allow-same-origin allow-scripts allow-forms" // Relaxed sandbox for compatibility
                            />
                            <div className="p-2 bg-yellow-50 text-[10px] text-yellow-700 text-center border-t border-yellow-200">
                                ¿No carga? Algunos sitios bloquean la incrustación. <a href={formData.url} target="_blank" className="underline font-bold">Abrir en pestaña nueva</a>.
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
        </div>
    )
}
