'use client'

import React, { useState, useMemo } from 'react'
import { Search, Plus, BookOpen, Quote, Globe, ArrowRight, Filter, X } from 'lucide-react'
import ResearchForm from './ResearchForm'

import { useSearchParams } from 'next/navigation'

export default function ResearchSPA({ initialItems, session }: any) {
    const [items, setItems] = useState(initialItems)
    const [searchTerm, setSearchTerm] = useState('')

    // FILTERS STATE
    const [authorSearch, setAuthorSearch] = useState('')
    const [selectedPillar, setSelectedPillar] = useState('')
    const [selectedYear, setSelectedYear] = useState('')
    const [selectedMethodology, setSelectedMethodology] = useState('')

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

    // Derived Data for Filters
    const uniqueYears = useMemo(() => {
        const years = new Set<string>()
        items.forEach((item: any) => {
            const match = item.apa?.match(/\((\d{4})\)/)
            if (match) years.add(match[1])
        })
        return Array.from(years).sort().reverse()
    }, [items])

    // METHODOLOGY GROUPING LOGIC
    const getMethodologyClass = (methodology: string | undefined) => {
        if (!methodology) return 'Otros'
        const lower = methodology.toLowerCase()

        if (lower.includes('mixt') || lower.includes('mix')) return 'Mixta'
        if (
            lower.includes('cuant') || lower.includes('quant') ||
            lower.includes('encuesta') || lower.includes('survey') ||
            lower.includes('estadístic') || lower.includes('regresión') ||
            lower.includes('sem') || lower.includes('scale') || lower.includes('escala')
        ) return 'Cuantitativa'

        if (
            lower.includes('cual') || lower.includes('qual') ||
            lower.includes('entrevista') || lower.includes('interview') ||
            lower.includes('focus') || lower.includes('caso') || lower.includes('case') ||
            lower.includes('revisión') || lower.includes('review') || lower.includes('teóric')
        ) return 'Cualitativa'

        return 'Otros'
    }

    const methodologyOptions = ['Cualitativa', 'Cuantitativa', 'Mixta', 'Otros']

    // Filtering Logic
    const filteredItems = items.filter((item: any) => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.metadata?.key_concepts?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesAuthor = !authorSearch || (item.apa && item.apa.toLowerCase().includes(authorSearch.toLowerCase()))

        const matchesPillar = !selectedPillar || (item.pillars && item.pillars.includes(selectedPillar))

        const matchesYear = !selectedYear || (item.apa && item.apa.includes(`(${selectedYear})`))

        // Use classification for methodology matching
        const itemClass = getMethodologyClass(item.methodology)
        const matchesMethodology = !selectedMethodology || itemClass === selectedMethodology

        return matchesSearch && matchesAuthor && matchesPillar && matchesYear && matchesMethodology
    })

    const handleSave = () => {
        window.location.reload() // Simple reload to refresh data
    }

    const clearFilters = () => {
        setAuthorSearch('')
        setSelectedPillar('')
        setSelectedYear('')
        setSelectedMethodology('')
        setSearchTerm('')
    }

    return (
        <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-accent/30 selection:text-accent pb-20">

            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b-4 border-border px-8 py-4 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between shrink-0 w-full">
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
                                placeholder="Buscar conceptos..."
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
                </div>

                {/* FILTERS BAR */}
                <div className="flex items-center gap-4 w-full overflow-x-auto no-scrollbar pb-2">
                    <div className="flex items-center gap-2 text-text-muted px-2 border-r border-border/50">
                        <Filter size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
                    </div>

                    {/* Author Filter */}
                    <input
                        value={authorSearch}
                        onChange={(e) => setAuthorSearch(e.target.value)}
                        placeholder="Autor (Apellido)..."
                        className="h-8 bg-card-bg border border-border rounded-lg px-3 text-xs focus:border-accent outline-none min-w-[140px]"
                    />

                    {/* Pillar Filter */}
                    <select
                        value={selectedPillar}
                        onChange={(e) => setSelectedPillar(e.target.value)}
                        className="h-8 bg-card-bg border border-border rounded-lg px-2 text-xs focus:border-accent outline-none cursor-pointer"
                    >
                        <option value="">Todos los Pilares</option>
                        <option value="Shine Within">Shine Within</option>
                        <option value="Shine Out">Shine Out</option>
                        <option value="Shine Up">Shine Up</option>
                        <option value="Shine Beyond">Shine Beyond</option>
                    </select>

                    {/* Year Filter */}
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="h-8 bg-card-bg border border-border rounded-lg px-2 text-xs focus:border-accent outline-none cursor-pointer"
                    >
                        <option value="">Todos los Años</option>
                        {uniqueYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    {/* Methodology Filter */}
                    <select
                        value={selectedMethodology}
                        onChange={(e) => setSelectedMethodology(e.target.value)}
                        className="h-8 bg-card-bg border border-border rounded-lg px-2 text-xs focus:border-accent outline-none cursor-pointer max-w-[200px]"
                    >
                        <option value="">Todas las Metodologías</option>
                        {methodologyOptions.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    {(authorSearch || selectedPillar || selectedYear || selectedMethodology || searchTerm) && (
                        <button
                            onClick={clearFilters}
                            className="h-8 px-3 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ml-auto"
                        >
                            <X size={12} /> Limpiar
                        </button>
                    )}
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
