'use client'

import React, { useState } from 'react'
import { X, Save, Sparkles, Book, Layers, Loader2 } from 'lucide-react'

interface GlossaryTerm {
    id: string
    term: string
    definition: string
    pillars: string[]
    source?: string
}

interface Props {
    initialData?: GlossaryTerm
    onClose: () => void
    onSave: () => void
}

export default function GlossaryForm({ initialData, onClose, onSave }: Props) {
    const [formData, setFormData] = useState<Partial<GlossaryTerm>>({
        term: '',
        definition: '',
        pillars: [],
        ...initialData
    })
    const [instructions, setInstructions] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        if (!formData.term) return alert('Ingresa un término primero.')
        setIsGenerating(true)
        try {
            const res = await fetch('/api/glossary/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    term: formData.term,
                    instructions // Pass instructions to API
                })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setFormData(prev => ({
                ...prev,
                definition: data.definition,
                pillars: data.pillars || []
            }))
        } catch (e: any) {
            alert('Error generando definición: ' + e.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSaveInternal = async () => {
        try {
            const res = await fetch('/api/glossary/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) onSave()
            else alert('Error guardando')
        } catch (e) { alert('Network Error') }
    }

    const togglePillar = (pillar: string) => {
        setFormData(prev => {
            const current = prev.pillars || []
            const newPillars = current.includes(pillar)
                ? current.filter(p => p !== pillar)
                : [...current, pillar]
            return { ...prev, pillars: newPillars }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-bg w-full max-w-2xl rounded-[32px] border-4 border-border shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="h-16 border-b-4 border-border flex items-center justify-between px-8 bg-card-bg">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                            <Book size={16} />
                        </div>
                        <h2 className="text-sm font-black text-text-main uppercase tracking-widest">
                            {initialData ? 'Editar Término' : 'Nuevo Concepto'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-text-muted transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Término / Concepto</label>
                        <div className="flex gap-2">
                            <input
                                value={formData.term || ''}
                                onChange={e => setFormData({ ...formData, term: e.target.value })}
                                className="flex-1 h-12 bg-bg border-4 border-border rounded-xl px-4 text-lg font-bold text-text-main focus:border-accent outline-none"
                                placeholder="Ej: Liderazgo Resonante"
                            />
                        </div>
                    </div>

                    {/* AI Instructions Field */}
                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                        <label className="block text-[10px] font-black text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Sparkles size={12} /> Instrucciones para la IA (Opcional)
                        </label>
                        <div className="flex gap-2">
                            <textarea
                                value={instructions}
                                onChange={e => setInstructions(e.target.value)}
                                className="flex-1 h-20 bg-white border border-border rounded-lg p-3 text-xs text-text-main focus:border-accent outline-none resize-none"
                                placeholder="Ej: Enfocarse en la gestión de equipos remotos... / Usar tono académico..."
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !formData.term}
                                className={`w-32 rounded-lg font-black uppercase tracking-widest text-[10px] flex flex-col items-center justify-center gap-2 transition-all
                                    ${isGenerating ? 'bg-gray-100 text-gray-400' : 'bg-accent text-white hover:brightness-110 shadow-lg shadow-accent/20'}
                                `}
                            >
                                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {isGenerating ? 'Generando...' : 'Generar'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 pl-1">Definición (Contexto 4Shine)</label>
                        <textarea
                            value={formData.definition || ''}
                            onChange={e => setFormData({ ...formData, definition: e.target.value })}
                            className="w-full h-40 bg-bg border-2 border-border rounded-xl p-4 text-sm text-text-main focus:border-accent outline-none resize-none leading-relaxed"
                            placeholder="Definición del concepto..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-accent uppercase tracking-widest pl-1 mb-2">Pilares Relacionados</label>
                        <div className="flex flex-wrap gap-2">
                            {['Shine Within', 'Shine Out', 'Shine Up', 'Shine Beyond'].map((pillar) => {
                                const isSelected = formData.pillars?.includes(pillar)
                                return (
                                    <button
                                        key={pillar}
                                        onClick={() => togglePillar(pillar)}
                                        className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2
                                            ${isSelected
                                                ? 'bg-accent/10 border-accent text-accent'
                                                : 'bg-bg border-border text-text-muted hover:border-accent/50'
                                            }`}
                                    >
                                        {pillar}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="h-20 border-t-4 border-border px-8 flex items-center justify-end bg-card-bg">
                    <button
                        onClick={handleSaveInternal}
                        className="bg-accent text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-accent/20"
                    >
                        <Save size={16} />
                        Guardar Término
                    </button>
                </div>

            </div>
        </div>
    )
}
