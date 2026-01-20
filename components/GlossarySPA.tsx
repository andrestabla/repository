'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Book, Trash2, Edit3, Filter, X, Settings, Save, Sparkles } from 'lucide-react'
import GlossaryForm from './GlossaryForm'

export default function GlossarySPA({ initialItems }: any) {
    const [items, setItems] = useState(initialItems)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [viewingItem, setViewingItem] = useState<any>(null)
    const [showSettings, setShowSettings] = useState(false)

    // Helper to render markdown links [Label](url)
    const renderWithLinks = (text: string) => {
        if (!text) return ''
        const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
        return parts.map((part, i) => {
            const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
            if (match) {
                return (
                    <a
                        key={i}
                        href={match[2]}
                        className="text-accent underline font-bold hover:text-indigo-600 transition-colors"
                    >
                        {match[1]}
                    </a>
                )
            }
            return part
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar término?')) return
        try {
            await fetch(`/api/glossary?id=${id}`, { method: 'DELETE' })
            setItems(items.filter((i: any) => i.id !== id))
        } catch (e) { alert('Error eliminando') }
    }

    const handleSaveComplete = () => {
        window.location.reload()
    }

    const filteredItems = items.filter((item: any) =>
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-accent/30 selection:text-accent pb-20">

            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b-4 border-border px-8 h-20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 text-white">
                        <Book size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight leading-none">GLOSARIO 4SHINE</h1>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Definiciones y Conceptos Clave</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Buscar término..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-64 h-10 bg-card-bg border-2 border-border rounded-full pl-10 pr-4 text-xs font-bold text-text-main focus:w-80 focus:border-accent transition-all outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 text-text-muted group-focus-within:text-accent transition-colors" size={16} />
                    </div>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="w-10 h-10 rounded-full bg-bg border-2 border-border hover:border-accent hover:text-accent flex items-center justify-center transition-all"
                        title="Configuración de IA"
                    >
                        <Settings size={18} />
                    </button>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="h-10 px-6 bg-text-main text-bg rounded-full text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-lg hover:shadow-accent/50 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Nuevo Término
                    </button>

                    <a href="/analitica" className="text-xs font-bold text-text-muted hover:text-accent transition-colors">
                        Volver
                    </a>
                </div>
            </nav>

            {/* Grid */}
            <main className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map((item: any) => (
                        <div
                            key={item.id}
                            onClick={() => setViewingItem(item)}
                            className="bg-card-bg border-2 border-transparent hover:border-accent rounded-[24px] p-6 hover:shadow-xl transition-all duration-300 group flex flex-col h-[280px] cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-xl font-bold tracking-tight text-text-main group-hover:text-accent transition-colors line-clamp-2">
                                    {item.term}
                                </h3>
                                <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingItem(item) }}
                                        className="p-2 hover:bg-black/5 rounded-full text-text-muted transition-colors"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                                        className="p-2 hover:bg-red-50 rounded-full text-red-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="text-sm text-text-muted leading-relaxed line-clamp-5 flex-1 mb-4 overflow-hidden mask-linear-fade">
                                {renderWithLinks(item.definition)}
                            </div>

                            <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                                <div className="flex flex-wrap gap-2">
                                    {item.pillars?.map((p: string) => (
                                        <span key={p} className="text-[9px] font-black uppercase tracking-widest bg-accent/5 text-accent px-2 py-1 rounded-md">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest group-hover:text-accent transition-colors">
                                    Ver Completo
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* View Modal */}
            {viewingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-bg w-full max-w-2xl rounded-[32px] border-4 border-border shadow-2xl flex flex-col overflow-hidden relative max-h-[90vh]">
                        <div className="h-20 border-b-4 border-border flex items-center justify-between px-8 bg-card-bg shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                    <Book size={20} />
                                </div>
                                <h2 className="text-lg font-black text-text-main tracking-tight">
                                    {viewingItem.term}
                                </h2>
                            </div>
                            <button onClick={() => setViewingItem(null)} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-text-muted transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            <div className="prose prose-sm max-w-none text-text-main leading-relaxed">
                                <div className="whitespace-pre-wrap text-base">
                                    {renderWithLinks(viewingItem.definition)}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-3">
                                {viewingItem.pillars?.map((p: string) => (
                                    <span key={p} className="text-xs font-black uppercase tracking-widest bg-accent/10 text-accent px-3 py-1.5 rounded-lg border border-accent/20">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <GlossarySettingsModal onClose={() => setShowSettings(false)} />
            )}

            {(isCreating || editingItem) && (
                <GlossaryForm
                    initialData={editingItem}
                    onClose={() => { setIsCreating(false); setEditingItem(null) }}
                    onSave={handleSaveComplete}
                />
            )}
        </div>
    )
}

function GlossarySettingsModal({ onClose }: { onClose: () => void }) {
    const [instructions, setInstructions] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetch('/api/glossary/settings')
            .then(r => r.json())
            .then(data => {
                setInstructions(data.instructions || '')
                setIsLoading(false)
            })
    }, [])

    const handleSave = async () => {
        await fetch('/api/glossary/settings', {
            method: 'POST',
            body: JSON.stringify({ instructions })
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-bg w-full max-w-lg rounded-[32px] border-4 border-border shadow-2xl flex flex-col overflow-hidden relative">
                <div className="h-16 border-b-4 border-border flex items-center justify-between px-8 bg-card-bg">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                            <Settings size={16} />
                        </div>
                        <h2 className="text-sm font-black text-text-main uppercase tracking-widest">
                            Configuración IA
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-text-muted transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-8">
                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                        <label className="block text-[10px] font-black text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Sparkles size={12} /> Instrucciones Globales (Contexto)
                        </label>
                        <textarea
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                            className="w-full h-32 bg-white border border-border rounded-lg p-3 text-xs text-text-main focus:border-accent outline-none resize-none"
                            placeholder="Ej: Define siempre con 3 párrafos. Usa un tono inspirador..."
                        />
                        <p className="text-[10px] text-text-muted mt-2">
                            Estas instrucciones se aplicarán a <strong>todos</strong> los términos generados a partir de ahora.
                        </p>
                    </div>
                </div>

                <div className="h-20 border-t-4 border-border px-8 flex items-center justify-end bg-card-bg">
                    <button
                        onClick={handleSave}
                        className="bg-accent text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-accent/20"
                    >
                        <Save size={16} />
                        Guardar Configuración
                    </button>
                </div>
            </div>
        </div>
    )
}
