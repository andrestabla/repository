'use client'

import React, { useState, useEffect } from 'react'
import {
    LayoutDashboard,
    Database,
    ShieldCheck,
    TreePine,
    Grid3X3,
    Tag,
    Zap,
    LogOut,
    RefreshCw,
    Plus,
    FileText,
    Monitor,
    Package,
    BookOpen,
    Gem,
    Terminal,
    ChevronRight,
    Search,
    Trash2,
    Activity
} from 'lucide-react'
import { signIn, signOut } from "next-auth/react"
import AdminView from './AdminView'
import ContentForm, { ContentItem, ResearchSource } from './ContentForm'
import TaxonomyManager from './TaxonomyManager'
import ReleasesView from './ReleasesView'
import HeatmapView from './HeatmapView'
import QAView from './QAView'
import AnalyticsView from './AnalyticsView'
import CompilerChat from './CompilerChat'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

type UserRole = 'metodologo' | 'curador' | 'auditor' | 'admin' | 'guest' | 'pending'

type User = {
    role: UserRole
    name: string
    label: string
    avatar: string | React.ReactNode
    color: string
}

type Session = {
    user?: {
        name?: string | null
        email?: string | null
        image?: string | null
        role?: string
    }
}

type TaxonomyItem = {
    id: string
    name: string
    type: string
    active: boolean
    order: number
    parentId: string | null
    children?: TaxonomyItem[]
    parent?: TaxonomyItem
}

export default function MethodologySPA({
    initialData,
    initialResearch,
    initialTaxonomy,
    session
}: {
    initialData?: ContentItem[],
    initialResearch?: ResearchSource[],
    initialTaxonomy?: TaxonomyItem[],
    session: Session | null
}) {
    const pathname = usePathname()
    const router = useRouter()
    const currentView = pathname === '/' ? 'inventory' : pathname === '/inventario' ? 'inventory' : pathname.replace('/', '')

    const [user, setUser] = useState<User | null>(null)
    const [inventoryData, setInventoryData] = useState<ContentItem[]>(initialData || [])
    const [researchData, setResearchData] = useState<ResearchSource[]>(initialResearch || [])
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Initialize User from Session
    useEffect(() => {
        if (session?.user) {
            const role = (session.user.role?.toLowerCase() as UserRole) || 'curador'
            setUser({
                role: role,
                name: session.user.name || 'Usuario 4Shine',
                label: role === 'admin' ? 'Administrador' : role === 'metodologo' ? 'Metodólogo (Arquitecto)' : 'Constructor (Conectado)',
                avatar: session.user.image || null,
                color: role === 'admin' ? '#d73a49' : '#0969da'
            })
            // Role-based redirect on first login if at root
            if (pathname === '/') {
                router.push(role === 'admin' ? '/admin' : '/inventario')
            }
        }

        const stored = localStorage.getItem('theme') || 'light'
        if (stored === 'dark') document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
    }, [session])

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark')
        localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }

    const refreshData = async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch('/api/inventory')
            const data = await res.json()
            setInventoryData(data)
        } catch (e) {
            console.error("Failed to refresh", e)
        } finally {
            setIsRefreshing(false)
        }
    }

    if (!user) {
        return (
            <div className="fixed inset-0 bg-bg flex items-center justify-center transition-colors">
                <div className="text-center p-12 bg-panel border border-border rounded-2xl shadow-2xl max-w-sm w-full mx-4">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent animate-pulse">
                        <Terminal size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-text-main mb-2 tracking-tight">4Shine Builder</h2>
                    <p className="text-sm text-text-muted mb-8 leading-relaxed">Framework de Arquitectura Metodológica e Inventario de Activos.</p>
                    <button
                        onClick={() => signIn('google')}
                        className="w-full bg-accent text-white px-6 py-3.5 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-accent/20"
                    >
                        <RefreshCw size={20} className="animate-spin-slow" />
                        Acceder con Google Workspace
                    </button>
                    <p className="text-[10px] text-text-muted mt-8 uppercase tracking-[0.2em] font-bold opacity-40">System Release 1.2 Pro</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-bg transition-colors p-6 sm:p-10 animate-in fade-in duration-500">
            {currentView === 'taxonomy' && <TaxonomyManager initialData={initialTaxonomy as any} inventory={inventoryData} />}
            {currentView === 'releases' && <ReleasesView />}
            {currentView === 'analitica' && <AnalyticsView />}
            {currentView === 'inventory' && (
                <InventoryView
                    data={inventoryData}
                    role={user.role}
                    onRefresh={refreshData}
                    isRefreshing={isRefreshing}
                />
            )}
            {currentView === '' && (
                <InventoryView
                    data={inventoryData}
                    role={user.role}
                    onRefresh={refreshData}
                    isRefreshing={isRefreshing}
                />
            )}
            {currentView === 'gap-analysis' && <HeatmapViewWrapper inventory={inventoryData} taxonomy={initialTaxonomy || []} />}
            {currentView === 'generator' && <CompilerChat assets={inventoryData} research={researchData} />}
            {currentView === 'qa' && (user?.role === 'admin' || user?.role === 'auditor') && <QAView role={user.role} onRefresh={refreshData} />}
            {currentView === 'admin' && <AdminView />}
        </div>
    )
}

function NavHeader({ label }: { label: string }) {
    return <div className="text-[10px] font-black text-text-muted mb-2 tracking-[0.2em] ml-2 opacity-60">{label}</div>
}

function NavBtn({ id, label, icon, active, href }: { id: string, label: string, icon: React.ReactNode, active: boolean, href: string }) {
    return (
        <Link
            href={href}
            className={`w-full text-left p-3 rounded-xl text-[13px] font-bold flex items-center justify-between group transition-all
        ${active
                    ? 'bg-accent text-white shadow-xl shadow-accent/20 translate-x-1'
                    : 'text-text-muted hover:bg-accent/5 hover:text-accent border border-transparent'}
      `}
        >
            <div className="flex items-center gap-3">
                <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
                    {icon}
                </span>
                {label}
            </div>
            {active && <ChevronRight size={14} className="opacity-50" />}
        </Link>
    )
}

function HeatmapViewWrapper({ inventory, taxonomy }: { inventory: any[], taxonomy: any[] }) {
    const subcomponents = taxonomy.filter(t => t.type !== 'Pillar')
    const levels = ['Básico', 'En Desarrollo', 'Avanzado', 'Maestría']
    const heatmap: any = {}

    subcomponents.forEach(sub => {
        heatmap[sub.name] = {}
        levels.forEach(lvl => {
            const matches = inventory.filter(i =>
                (i.sub === sub.name || i.primaryPillar === sub.name) && i.maturity === lvl
            )
            const count = matches.length
            const hasValidated = matches.some(m => m.status === 'Validado' || m.status === 'Approved')
            heatmap[sub.name][lvl] = { count, status: count === 0 ? 'red' : hasValidated ? 'green' : 'yellow' }
        })
    })

    return <HeatmapView subcomponents={subcomponents} maturityLevels={levels} heatmap={heatmap} />
}

function InventoryView({ data, role, onRefresh, isRefreshing }: { data: ContentItem[], role: string, onRefresh: () => void, isRefreshing: boolean }) {
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Auto-sync selectedItem when data refreshes (Fixes "Not saving" visual bug)
    useEffect(() => {
        if (selectedItem) {
            const upToDateItem = data.find(i => i.id === selectedItem.id)
            if (upToDateItem) setSelectedItem(upToDateItem)
        }
    }, [data])

    // Filters State
    const [pillarFilter, setPillarFilter] = useState('')
    const [maturityFilter, setMaturityFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const filteredData = data.filter(i => {
        const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.id.toLowerCase().includes(searchTerm.toLowerCase())

        // Match if it is the primary pillar OR if it is in secondary pillars
        const matchesPillar = !pillarFilter ||
            (i as any).primaryPillar === pillarFilter ||
            ((i as any).secondaryPillars && (i as any).secondaryPillars.includes(pillarFilter))

        const matchesMaturity = !maturityFilter || i.maturity === maturityFilter
        const matchesStatus = !statusFilter || i.status === statusFilter
        return matchesSearch && matchesPillar && matchesMaturity && matchesStatus
    })

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este activo? Esta acción no se puede deshacer.')) return
        try {
            const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                setSelectedItem(null)
                onRefresh()
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) { alert('Error de red') }
    }

    const resetFilters = () => {
        setPillarFilter('')
        setMaturityFilter('')
        setStatusFilter('')
        setSearchTerm('')
    }

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-text-main tracking-tighter flex items-center gap-4">
                        Inventario de Activos
                        <button
                            onClick={onRefresh}
                            className={`p-2 rounded-full hover:bg-panel border border-border group transition-all ${isRefreshing ? 'animate-spin border-accent' : ''}`}
                        >
                            <RefreshCw size={20} className={isRefreshing ? 'text-accent' : 'text-text-muted group-hover:text-text-main'} />
                        </button>
                    </h2>
                    <p className="text-sm text-text-muted mt-2 font-medium">Gestiona y consulta el repositorio central de activos metodológicos.</p>
                </div>
                {(role === 'admin' || role === 'metodologo' || role === 'curador') && (
                    <button
                        onClick={() => { setSelectedItem(null); setShowForm(true); }}
                        className="bg-accent text-white px-6 py-3 rounded-2xl font-bold text-sm hover:brightness-110 hover:shadow-xl hover:shadow-accent/20 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-accent/10"
                    >
                        <Plus size={18} />
                        Crear Nuevo Activo
                    </button>
                )}
            </header>

            <div className="grid grid-cols-[380px_1fr] gap-8 h-[calc(100vh-280px)] min-h-[600px]">
                {/* Filter & List Panel */}
                <div className="bg-panel border border-border rounded-3xl flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-border bg-bg/50 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por título o ID..."
                                className="w-full bg-bg border border-border pl-10 pr-4 py-2.5 rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Metadata Filters */}
                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex gap-2">
                                <select
                                    value={pillarFilter}
                                    onChange={e => setPillarFilter(e.target.value)}
                                    className="flex-1 bg-bg border border-border rounded-lg p-2 text-[10px] font-bold text-text-muted outline-none focus:border-accent"
                                >
                                    <option value="">PILLAR: TODOS</option>
                                    {['Shine In', 'Shine Out', 'Shine Up', 'Shine On'].map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                </select>
                                <select
                                    value={maturityFilter}
                                    onChange={e => setMaturityFilter(e.target.value)}
                                    className="flex-1 bg-bg border border-border rounded-lg p-2 text-[10px] font-bold text-text-muted outline-none focus:border-accent"
                                >
                                    <option value="">NIVEL: TODOS</option>
                                    {['Básico', 'En Desarrollo', 'Avanzado', 'Maestría'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="flex-1 bg-bg border border-border rounded-lg p-2 text-[10px] font-bold text-text-muted outline-none focus:border-accent"
                                >
                                    <option value="">ESTADO: TODOS</option>
                                    {['Borrador', 'Revisión', 'Validado'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                                <button
                                    onClick={resetFilters}
                                    className="px-3 bg-panel border border-border rounded-lg text-[10px] font-black hover:text-accent transition-colors"
                                    title="Limpiar Filtros"
                                >
                                    LIMPIAR
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                        {filteredData.map((item: any) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`mx-3 mb-2 p-4 rounded-2xl border cursor-pointer transition-all group flex items-start gap-4 ${selectedItem?.id === item.id
                                    ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20 scale-[1.02]'
                                    : 'bg-bg border-border hover:border-accent/40 hover:bg-panel'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedItem?.id === item.id ? 'bg-white/20' : 'bg-panel group-hover:bg-accent/10 group-hover:text-accent'
                                    }`}>
                                    <FileText size={20} />
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <div className={`font-bold text-sm truncate ${selectedItem?.id === item.id ? 'text-white' : 'text-text-main group-hover:text-accent'}`}>{item.title}</div>
                                    <div className={`text-[10px] uppercase font-black tracking-widest mt-1.5 flex items-center gap-2 ${selectedItem?.id === item.id ? 'text-white/70' : 'text-text-muted'}`}>
                                        {item.id}
                                        <span className={`w-1 h-1 rounded-full ${selectedItem?.id === item.id ? 'bg-white/40' : 'bg-border'}`} />
                                        {item.status}
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`mt-3 transition-opacity ${selectedItem?.id === item.id ? 'opacity-50' : 'opacity-0'}`} />
                            </div>
                        ))}
                        {filteredData.length === 0 && (
                            <div className="p-12 text-center text-text-muted">
                                <Search size={32} className="mx-auto mb-4 opacity-20" />
                                <div className="italic font-medium">No se encontraron resultados</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Panel */}
                {selectedItem ? (
                    <div className="bg-panel border border-border rounded-3xl p-10 overflow-y-auto shadow-sm flex flex-col h-full ring-1 ring-border/50">
                        <div className="flex justify-between items-start mb-10 pb-8 border-b border-border/60">
                            <div className="max-w-[70%] text-left">
                                <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-3">CONSTRUCTOR DE METODOLOGÍA</div>
                                <h3 className="text-3xl font-black text-text-main leading-[1.1] tracking-tighter">{selectedItem.title}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowForm(true)}
                                    className={`px-5 py-2.5 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${selectedItem.status === 'Validado' && role !== 'admin'
                                        ? 'border-border text-text-muted hover:border-text-main hover:text-text-main'
                                        : 'border-accent text-accent hover:bg-accent hover:text-white'
                                        }`}
                                >
                                    {selectedItem.status === 'Validado' && role !== 'admin' ? 'Consultar Detalles' : 'Editar Metadatos'}
                                </button>
                                {role === 'admin' && selectedItem.status === 'Validado' && (
                                    <button
                                        onClick={async () => {
                                            const reason = prompt('Motivo obligatorio para revertir estado (God Mode):')
                                            if (!reason) return
                                            try {
                                                const res = await fetch('/api/inventory/upsert', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        ...selectedItem,
                                                        status: 'Borrador',
                                                        forceReason: reason
                                                    })
                                                })
                                                if (res.ok) {
                                                    alert('✅ Estado revertido a Borrador exitosamente.')
                                                    onRefresh()
                                                } else {
                                                    const err = await res.json()
                                                    alert('❌ Error: ' + err.error)
                                                }
                                            } catch (e) { alert('Error de red') }
                                        }}
                                        className="px-5 py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-orange-900/20"
                                    >
                                        ⚡ Revertir Estado
                                    </button>
                                )}
                                {(role === 'admin' || role === 'metodologo') && (
                                    <button
                                        onClick={() => handleDelete(selectedItem.id)}
                                        className="w-10 h-10 rounded-xl border border-danger/30 text-danger hover:bg-danger hover:text-white transition-all flex items-center justify-center shadow-lg shadow-danger/5"
                                        title="Eliminar Activo"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                            <DataPointCard icon={<LayoutDashboard size={18} />} label="Pilar Principal" value={(selectedItem as any).primaryPillar || ''} />
                            <DataPointCard icon={<Grid3X3 size={18} />} label="Subcomponente" value={selectedItem.sub || ''} />
                            <DataPointCard icon={<Monitor size={18} />} label="Nivel Madurez" value={selectedItem.maturity || ''} />
                            <DataPointCard icon={<ShieldCheck size={18} />} label="Estado de Calidad" value={selectedItem.status || ''} />
                        </div>

                        {(selectedItem as any).secondaryPillars && (selectedItem as any).secondaryPillars.length > 0 && (
                            <div className="mb-10 flex flex-wrap gap-2 items-center">
                                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mr-2">Pilares Secundarios:</span>
                                {(selectedItem as any).secondaryPillars.map((p: string) => (
                                    <span key={p} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] font-bold border border-accent/20">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex-1 bg-bg border border-border rounded-3xl overflow-hidden shadow-2xl relative group min-h-[400px]">
                            {selectedItem.driveId ? (
                                <>
                                    <iframe
                                        src={`https://drive.google.com/file/d/${selectedItem.driveId}/preview`}
                                        className="w-full h-full border-none"
                                        allow="autoplay"
                                    />
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={`https://drive.google.com/file/d/${selectedItem.driveId}/view`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-accent text-white rounded-xl shadow-xl hover:scale-110 transition-all flex items-center gap-2 font-bold text-xs"
                                        >
                                            <Zap size={14} fill="currentColor" />
                                            ABRIR EN DRIVE
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-text-muted bg-panel/30">
                                    <div className="w-20 h-20 bg-panel rounded-3xl flex items-center justify-center mb-4 text-text-muted/40 border border-border/50">
                                        <RefreshCw size={40} />
                                    </div>
                                    <div className="italic font-bold tracking-tight text-lg opacity-40">Sin vista previa disponible</div>
                                    <p className="text-sm mt-1 opacity-40">Carga un ID de Drive válido para visualizar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-panel/50 border-2 border-dashed border-border rounded-[40px] flex flex-col items-center justify-center text-text-muted italic h-full transition-colors group hover:border-accent/30 hover:bg-accent/5">
                        <div className="w-24 h-24 bg-bg border border-border rounded-[32px] flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:border-accent group-hover:text-accent transition-all text-text-muted/20">
                            <LayoutDashboard size={40} />
                        </div>
                        <div className="font-black tracking-tight text-xl opacity-40 group-hover:opacity-100 transition-opacity uppercase text-center max-w-sm px-10">
                            Selecciona un activo para visualizar su estructura
                        </div>
                    </div>
                )}

                {showForm && (
                    <ContentForm
                        initialData={selectedItem}
                        onClose={() => setShowForm(false)}
                        onSave={() => { setShowForm(false); onRefresh(); }}
                        readOnly={selectedItem?.status === 'Validado' && role !== 'admin'}
                    />
                )}
            </div>
        </div>
    )
}

function DataPointCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="bg-bg border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border-l-4 border-l-accent text-left">
            <div className="flex items-center gap-2 mb-2">
                <div className="text-accent opacity-50">{icon}</div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">{label}</label>
            </div>
            <div className="text-[14px] text-text-main font-bold truncate leading-tight">{value || 'No Definido'}</div>
        </div>
    )
}





