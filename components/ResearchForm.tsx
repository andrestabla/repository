'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, Globe, BookOpen, Quote, FileText, Link as LinkIcon, Edit3, Briefcase } from 'lucide-react'

interface ContentItem {
    id: string
    title: string
    type: string
    primaryPillar: string
    status: string
    metadata?: any
}

interface Props {
    initialData?: ContentItem
    onClose: () => void
    onSave: () => void
    readOnly?: boolean
}

export default function ResearchForm({ initialData, onClose, onSave, readOnly = false }: Props) {
    const [formData, setFormData] = useState<any>({
        id: '',
        title: '',
        type: 'Investigación',
        primaryPillar: 'Transversal',
        status: 'Validado',
        metadata: {
            apa: '',
            url: '',
            summary: '',
            key_concepts: '',
            findings: '',
            methodology: ''
        },
        ...initialData
    })

    // Helper to update nested metadata
    const updateMeta = (field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                [field]: value
            }
        }))
    }

    const handleSaveInternal = async () => {
        try {
            const res = await fetch('/api/inventory/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) onSave()
            else alert('Error guardando investigación')
        } catch (e) { alert('Network Error') }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-bg w-full max-w-4xl h-[90vh] rounded-[32px] border-4 border-border shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="h-16 border-b-4 border-border flex items-center justify-between px-8 bg-card-bg shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                            <BookOpen size={16} />
                        </div>
                        <h2 className="text-sm font-black text-text-main uppercase tracking-widest">
                            {initialData ? 'Editar Investigación' : 'Nueva Fuente'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-text-muted transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Título del Artículo / Libro</label>
                            <input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full h-12 bg-bg border-4 border-border rounded-xl px-4 text-sm font-bold text-text-main focus:border-accent outline-none transition-all"
                                placeholder="Ej: Liderazgo y Carácter del Líder..."
                                disabled={readOnly}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">ID Referencia</label>
                                <input value={formData.id} disabled className="w-full h-10 bg-black/5 border-2 border-transparent rounded-lg px-3 text-xs text-text-muted font-mono" placeholder="Auto-generado" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Enlace Público / Fuente</label>
                                <div className="relative">
                                    <input
                                        value={formData.metadata?.url || ''}
                                        onChange={e => updateMeta('url', e.target.value)}
                                        className="w-full h-10 bg-bg border-2 border-border rounded-lg pl-9 px-3 text-xs text-blue-600 focus:border-accent outline-none transition-all"
                                        placeholder="https://..."
                                        disabled={readOnly}
                                    />
                                    <Globe size={14} className="absolute left-3 top-3 text-text-muted" />
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
                            value={formData.metadata?.apa || ''}
                            onChange={e => updateMeta('apa', e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-sm text-text-main font-serif italic placeholder:text-text-muted/50 focus:ring-0 resize-none"
                            placeholder="Autor, A. A. (Año). Título... "
                            rows={3}
                            disabled={readOnly}
                        />
                    </div>

                    {/* Deep Analysis Fields */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Reseña Ejecutiva</label>
                            <textarea
                                value={formData.metadata?.summary || ''}
                                onChange={e => updateMeta('summary', e.target.value)}
                                className="w-full h-32 bg-bg border-2 border-border rounded-xl p-4 text-sm text-text-main focus:border-accent outline-none resize-none"
                                disabled={readOnly}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-accent uppercase tracking-widest mb-2 pl-1 border-b border-border pb-1">Conceptos Clave</label>
                            <textarea
                                value={formData.metadata?.key_concepts || ''}
                                onChange={e => updateMeta('key_concepts', e.target.value)}
                                className="w-full h-40 bg-bg border-2 border-border rounded-xl p-4 text-xs text-text-main focus:border-accent outline-none resize-none"
                                placeholder="Lista de conceptos..."
                                disabled={readOnly}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 pl-1 border-b border-border pb-1">Hallazgos Principales</label>
                            <textarea
                                value={formData.metadata?.findings || ''}
                                onChange={e => updateMeta('findings', e.target.value)}
                                className="w-full h-40 bg-bg border-2 border-border rounded-xl p-4 text-xs text-text-main focus:border-accent outline-none resize-none"
                                placeholder="Conclusiones del estudio..."
                                disabled={readOnly}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Metodología (Diferencial)</label>
                            <input
                                value={formData.metadata?.methodology || ''}
                                onChange={e => updateMeta('methodology', e.target.value)}
                                className="w-full h-10 bg-bg border-2 border-border rounded-lg px-4 text-xs text-text-main focus:border-accent outline-none"
                                disabled={readOnly}
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="h-20 border-t-4 border-border px-8 flex items-center justify-between bg-card-bg shrink-0">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        Módulo de Investigación y Epistemología
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
