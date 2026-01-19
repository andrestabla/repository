'use client'

import React, { useState } from 'react'
import { Search, Plus, Book, Trash2, Edit3, Filter } from 'lucide-react'
import GlossaryForm from './GlossaryForm'

export default function GlossarySPA({ initialItems }: any) {
    const [items, setItems] = useState(initialItems)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)

    const filteredItems = items.filter((item: any) =>
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
                        <div key={item.id} className="bg-card-bg border-2 border-transparent hover:border-accent rounded-[24px] p-6 hover:shadow-xl transition-all duration-300 group flex flex-col h-[280px]">

                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-xl font-bold tracking-tight text-text-main group-hover:text-accent transition-colors line-clamp-2">
                                    {item.term}
                                </h3>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingItem(item)} className="p-2 hover:bg-black/5 rounded-full text-text-muted">
                                        <Edit3 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-full text-red-400 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="text-sm text-text-muted leading-relaxed line-clamp-5 flex-1 mb-4 overflow-y-auto pr-2">
                                {renderWithLinks(item.definition)}
                            </div>

                            <div className="mt-auto pt-4 border-t border-border/50 flex flex-wrap gap-2">
                                {item.pillars?.map((p: string) => (
                                    <span key={p} className="text-[9px] font-black uppercase tracking-widest bg-accent/5 text-accent px-2 py-1 rounded-md">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

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
