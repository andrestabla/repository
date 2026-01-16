'use client'

import React, { useState } from 'react'
import { Search, Plus, BookOpen, Quote, Globe, ArrowRight } from 'lucide-react'
import ResearchForm from './ResearchForm'

import { useSearchParams } from 'next/navigation'

export default function ResearchSPA({ initialItems, session }: any) {
    const [items, setItems] = useState(initialItems)
    const [searchTerm, setSearchTerm] = useState('')
    const searchParams = useSearchParams()
    const urlId = searchParams.get('id')

    // Auto-select item from URL if present
    const [selectedItem, setSelectedItem] = useState<any>(() => {
        if (urlId) {
            return initialItems.find((i: any) => i.id === urlId) || null
        }
        return null
    })
    const [isCreating, setIsCreating] = useState(false)

    const filteredItems = items.filter((item: any) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.metadata?.key_concepts?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSave = () => {
        window.location.reload() // Simple reload to refresh data
    }

    return (
        <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-accent/30 selection:text-accent pb-20">

            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b-4 border-border px-8 h-20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 text-white">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight leading-none">BIBLIOTECA DE INVESTIGACIÓN</h1>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Fuentes y Sustento Epistemológico</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Buscar conceptos, autores..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-64 h-10 bg-card-bg border-2 border-border rounded-full pl-10 pr-4 text-xs font-bold text-text-main focus:w-80 focus:border-accent transition-all outline-none placeholder:text-text-muted/50"
                        />
                        <Search className="absolute left-3 top-2.5 text-text-muted group-focus-within:text-accent transition-colors" size={16} />
                    </div>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="h-10 px-6 bg-text-main text-bg rounded-full text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-lg hover:shadow-accent/50 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Nueva Fuente
                    </button>


                    <a href="/analitica" className="text-xs font-bold text-text-muted hover:text-accent transition-colors">
                        Volver
                    </a>
                </div>
            </nav>

            {/* Main Grid */}
            <main className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item: any) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="group relative bg-card-bg border-2 border-transparent hover:border-accent rounded-[24px] p-6 hover:shadow-2xl hover:shadow-accent/10 transition-all duration-300 cursor-pointer flex flex-col h-[320px]"
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-100/50">
                                    <Quote size={18} className="text-yellow-600" />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-bg border border-border text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    {item.status}
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold leading-tight mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                                {item.title}
                            </h3>

                            {/* Summary Excerpt */}
                            <p className="text-xs text-text-muted leading-relaxed line-clamp-4 mb-4 flex-1">
                                {item.metadata?.summary || item.observations || 'Sin resumen disponible.'}
                            </p>

                            {/* Footer / Concepts */}
                            <div className="mt-auto pt-4 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">
                                    {item.metadata?.key_concepts?.split(',').slice(0, 3).map((c: string, i: number) => (
                                        <span key={i} className="text-[10px] font-bold text-accent bg-accent/5 px-2 py-1 rounded-md">
                                            #{c.trim()}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center justify-end mt-3 text-[10px] font-bold text-text-muted group-hover:text-text-main transition-colors gap-1">
                                    VER DETALLES <ArrowRight size={12} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Modals */}
            {(selectedItem || isCreating) && (
                <ResearchForm
                    initialData={selectedItem}
                    onClose={() => { setSelectedItem(null); setIsCreating(false) }}
                    onSave={handleSave}
                    readOnly={false}
                />
            )}
        </div>
    )
}
