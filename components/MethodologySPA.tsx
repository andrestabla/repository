'use client'

import React, { useState, useEffect } from 'react'
import { signIn, signOut } from "next-auth/react"
import AdminView from './AdminView'
import ContentForm, { ContentItem } from './ContentForm'
import TaxonomyManager from './TaxonomyManager'
import ReleasesView from './ReleasesView'
import HeatmapView from './HeatmapView'

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
    initialTaxonomy,
    session
}: {
    initialData: ContentItem[],
    initialTaxonomy: TaxonomyItem[],
    session: Session | null
}) {
    const [user, setUser] = useState<User | null>(null)
    const [currentView, setCurrentView] = useState('inventory')
    const [consoleLog, setConsoleLog] = useState<string[]>([])
    const [inventoryData, setInventoryData] = useState<ContentItem[]>(initialData)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Initialize User from Session
    useEffect(() => {
        if (session?.user) {
            const role = (session.user.role as UserRole) || 'curador'
            setUser({
                role: role,
                name: session.user.name || 'Usuario 4Shine',
                label: role === 'admin' ? 'Administrador' : role === 'metodologo' ? 'Metodólogo (Arquitecto)' : 'Constructor (Conectado)',
                avatar: session.user.image ? <img src={session.user.image} alt="avatar" className="w-full h-full rounded-full" /> : '👤',
                color: role === 'admin' ? '#d73a49' : '#58a6ff'
            })
            setCurrentView(role === 'admin' ? 'admin' : 'inventory')
        }

        const stored = localStorage.getItem('theme')
        if (stored === 'dark') document.documentElement.classList.add('dark')
    }, [session])

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

    const compileArtifact = async (releaseTag: string, artifactType: string) => {
        setConsoleLog([`> Inicializando Compilación: ${artifactType}...`])
        try {
            const res = await fetch('/api/generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ releaseTag, artifactType })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setConsoleLog(prev => [...prev, `> Versión Destino: ${releaseTag}`])
            setConsoleLog(prev => [...prev, `> Activos encontrados: ${data.metadata?.itemCount || 0}`])
            setConsoleLog(prev => [...prev, `> Generando estructura taxonómica... OK`])
            setConsoleLog(prev => [...prev, `> ÉXITO: ${artifactType} compilado.`])

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `4SHINE_${artifactType.replace(/\s/g, '_')}_${releaseTag}.json`
            a.click()
        } catch (err: any) {
            setConsoleLog(prev => [...prev, `> ERROR: Compilación fallida: ${err.message}`])
        }
    }

    if (!user) {
        return (
            <div className="fixed inset-0 bg-[#0d1117] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-bounce">🏗️</div>
                    <h2 className="text-xl font-bold text-white mb-6">4Shine Methodology Builder</h2>
                    <button onClick={() => signIn('google')} className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-all flex items-center gap-2">
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
                        Acceder con Google
                    </button>
                    <p className="text-text-muted text-[11px] mt-8 uppercase tracking-widest">v1.1 Advanced Architecture</p>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-[260px_1fr] h-screen overflow-hidden bg-[var(--bg)] text-[var(--text-main)] font-ui">
            <aside className="bg-[var(--panel)] border-r border-[var(--border)] flex flex-col p-5">
                <div className="text-lg font-bold text-[var(--text-main)] mb-8 flex items-center gap-2.5">
                    4Shine <span className="text-[10px] bg-[var(--border)] px-1.5 py-0.5 rounded font-code">PRO</span>
                </div>

                <nav className="flex flex-col gap-0.5 overflow-y-auto">
                    {user?.role === 'admin' && (
                        <>
                            <div className="text-[10px] uppercase text-text-muted mb-2 font-bold tracking-widest opacity-50">Admin</div>
                            <NavBtn id="admin" label="Usuarios" icon="🛡️" active={currentView === 'admin'} onClick={() => setCurrentView('admin')} />
                            <div className="my-4 border-t border-[var(--border)] opacity-30" />
                        </>
                    )}

                    <div className="text-[10px] uppercase text-text-muted mb-2 font-bold tracking-widest opacity-50">Curador</div>
                    <NavBtn id="inventory" label="Inventario" icon="🗃️" active={currentView === 'inventory'} onClick={() => setCurrentView('inventory')} />
                    <NavBtn id="qa" label="Revisión" icon="⚖️" active={currentView === 'qa'} onClick={() => setCurrentView('qa')} />

                    <div className="text-[10px] uppercase text-text-muted my-4 font-bold tracking-widest opacity-50">Metodólogo</div>
                    <NavBtn id="taxonomy" label="Taxonomía" icon="🌲" active={currentView === 'taxonomy'} onClick={() => setCurrentView('taxonomy')} />
                    <NavBtn id="gaps" label="Heatmap" icon="📊" active={currentView === 'gaps'} onClick={() => setCurrentView('gaps')} />
                    <NavBtn id="releases" label="Versiones" icon="🏷️" active={currentView === 'releases'} onClick={() => setCurrentView('releases')} />
                    <NavBtn id="generator" label="Compilador" icon="⚡" active={currentView === 'generator'} onClick={() => setCurrentView('generator')} />
                </nav>

                <div className="mt-auto border-t border-[var(--border)] pt-5">
                    <div className="flex gap-2.5 items-center mb-4">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-border">{user.avatar}</div>
                        <div className="overflow-hidden">
                            <div className="font-semibold text-[13px] truncate">{user.name}</div>
                            <div className="text-[11px] text-text-muted">{user.role.toUpperCase()}</div>
                        </div>
                    </div>
                    <button onClick={() => signOut()} className="w-full text-left text-danger text-[11px] hover:underline">Salir del sistema</button>
                    <div className="mt-4 text-[9px] text-text-muted opacity-30 text-center font-mono">4SHINE-BUILDER-V1.1-RELEASE</div>
                </div>
            </aside>

            <main className="overflow-y-auto p-10 bg-[#0d1117]/10">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {currentView === 'taxonomy' && <TaxonomyManager initialData={initialTaxonomy as any} />}
                    {currentView === 'releases' && <ReleasesView />}
                    {currentView === 'inventory' && (
                        <InventoryView
                            data={inventoryData}
                            role={user.role}
                            onRefresh={refreshData}
                            isRefreshing={isRefreshing}
                        />
                    )}
                    {currentView === 'gaps' && <HeatmapViewWrapper inventory={inventoryData} taxonomy={initialTaxonomy} />}
                    {currentView === 'generator' && <GeneratorDashboard compileArtifact={compileArtifact} consoleLog={consoleLog} />}
                    {currentView === 'qa' && <QAView data={inventoryData} />}
                    {currentView === 'admin' && <AdminView />}
                </div>
            </main>
        </div>
    )
}

function HeatmapViewWrapper({ inventory, taxonomy }: { inventory: any[], taxonomy: any[] }) {
    const subcomponents = taxonomy.filter(t => t.type !== 'Pillar')
    const levels = ['Básico', 'En Desarrollo', 'Avanzado', 'Maestría']
    const heatmap: any = {}

    subcomponents.forEach(sub => {
        heatmap[sub.name] = {}
        levels.forEach(lvl => {
            const matches = inventory.filter(i => i.sub === sub.name && i.maturity === lvl)
            const count = matches.length
            const hasValidated = matches.some(m => m.status === 'Validado' || m.status === 'Approved')
            heatmap[sub.name][lvl] = { count, status: count === 0 ? 'red' : hasValidated ? 'green' : 'yellow' }
        })
    })

    return <HeatmapView subcomponents={subcomponents} maturityLevels={levels} heatmap={heatmap} />
}

function NavBtn({ id, label, icon, active, onClick }: { id: string, label: string, icon: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-2.5 rounded-md text-[13px] font-medium flex items-center gap-3 transition-all
        ${active ? 'bg-accent/10 text-accent border border-accent/20' : 'text-text-muted hover:bg-white/5 hover:text-white border border-transparent'}
      `}
        >
            <span className="text-[16px]">{icon}</span> {label}
        </button>
    )
}

function InventoryView({ data, role, onRefresh, isRefreshing }: { data: ContentItem[], role: string, onRefresh: () => void, isRefreshing: boolean }) {
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
    const [showForm, setShowForm] = useState(false)

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    Inventario de Activos
                    <button onClick={onRefresh} className={`${isRefreshing ? 'animate-spin' : ''} text-lg`}>🔄</button>
                </h2>
                {role === 'curador' && (
                    <button onClick={() => { setSelectedItem(null); setShowForm(true); }} className="bg-success text-white px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 tracking-tight">+ Nuevo Activo</button>
                )}
            </header>

            <div className="grid grid-cols-[350px_1fr] gap-6 h-[calc(100vh-200px)]">
                <div className="bg-panel border border-border rounded-xl overflow-y-auto">
                    {data.map((item: any) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`p-4 border-b border-border cursor-pointer hover:bg-white/5 transition-colors ${selectedItem?.id === item.id ? 'bg-accent/5 border-l-4 border-l-accent' : ''}`}
                        >
                            <div className="font-bold text-sm text-white truncate">{item.title}</div>
                            <div className="text-[10px] text-text-muted font-mono mt-1">{item.id} | {item.status}</div>
                        </div>
                    ))}
                    {data.length === 0 && <div className="p-10 text-center text-text-muted italic opacity-40">No hay activos registrados</div>}
                </div>

                {selectedItem ? (
                    <div className="bg-panel border border-border rounded-xl p-8 overflow-y-auto">
                        <div className="flex justify-between items-start mb-8">
                            <h3 className="text-2xl font-bold text-white leading-tight">{selectedItem.title}</h3>
                            <button onClick={() => setShowForm(true)} className="text-accent text-sm hover:underline font-bold">Editar Metadatos</button>
                        </div>
                        <div className="grid grid-cols-2 gap-8 mb-8 bg-black/20 p-6 rounded-xl border border-white/5">
                            <DataPoint label="Pilar 4Shine" value={selectedItem.pillar} />
                            <DataPoint label="Subcomponente" value={selectedItem.sub} />
                            <DataPoint label="Nivel Madurez" value={selectedItem.maturity} />
                            <DataPoint label="Estado Actual" value={selectedItem.status} />
                        </div>
                        <div className="aspect-video bg-black rounded-lg border border-border overflow-hidden shadow-2xl">
                            {selectedItem.driveId ? (
                                <iframe src={`https://drive.google.com/file/d/${selectedItem.driveId}/preview`} className="w-full h-full border-none" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-30">
                                    <div className="text-4xl mb-2">☁️</div>
                                    <div className="italic">Vista previa no disponible</div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-panel border border-border rounded-xl flex items-center justify-center text-text-muted italic opacity-40">
                        Selecciona un activo de la lista para ver el detalle y previsualización
                    </div>
                )}
            </div>

            {showForm && (
                <ContentForm
                    initialData={selectedItem}
                    onClose={() => setShowForm(false)}
                    onSave={() => { setShowForm(false); onRefresh(); }}
                />
            )}
        </div>
    )
}

function DataPoint({ label, value }: { label: string, value: any }) {
    return (
        <div>
            <label className="text-[10px] uppercase text-text-muted font-bold tracking-widest block mb-1">{label}</label>
            <div className="text-[15px] text-white font-medium">{value || 'N/A'}</div>
        </div>
    )
}

function GeneratorDashboard({ compileArtifact, consoleLog }: { compileArtifact: (v: string, a: string) => void, consoleLog: string[] }) {
    const [selectedRelease, setSelectedRelease] = useState('v1.0')
    const [releases, setReleases] = useState<any[]>([])

    useEffect(() => {
        fetch('/api/releases').then(r => r.json()).then(data => {
            if (Array.isArray(data)) setReleases(data)
        })
    }, [])

    return (
        <div className="max-w-6xl">
            <header className="mb-8">
                <h2 className="text-[24px] font-bold text-white tracking-tight">Compilador de Metodología (HU-M-04)</h2>
                <div className="text-[13px] text-text-muted mt-1">Exporta la arquitectura completa y contenidos validados en un solo paquete.</div>
            </header>

            <div className="grid grid-cols-[1fr_2fr] gap-8">
                <div className="space-y-6">
                    <div className="bg-panel border border-border rounded-xl p-5 shadow-lg">
                        <label className="block text-[11px] font-bold text-text-muted uppercase mb-2 tracking-widest">Snapshot de Versión</label>
                        <select
                            value={selectedRelease}
                            onChange={(e) => setSelectedRelease(e.target.value)}
                            className="w-full bg-[#0d1117] border border-border p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-accent"
                        >
                            {releases.map(r => <option key={r.id} value={r.tag}>{r.tag} ({r.status})</option>)}
                            {releases.length === 0 && <option value="v1.0">v1.0 (Predeterminado)</option>}
                        </select>
                    </div>
                    <div className="bg-panel border border-border rounded-xl p-6 shadow-lg">
                        <h4 className="text-[14px] font-bold mb-4 uppercase tracking-widest text-text-muted">Seleccionar Artefacto</h4>
                        <div className="space-y-3">
                            <CompBtn label="Dossier Maestro (JSON)" icon="💎" onClick={() => compileArtifact(selectedRelease, 'Dossier Maestro')} />
                            <CompBtn label="Manual Facilitador (PDF)" icon="📖" onClick={() => compileArtifact(selectedRelease, 'Manual Facilitador')} />
                            <CompBtn label="Toolkit (ZIP)" icon="📦" onClick={() => compileArtifact(selectedRelease, 'Toolkit')} />
                        </div>
                    </div>
                </div>
                <div className="bg-black/90 border border-border rounded-xl p-6 font-mono text-[12px] h-[550px] overflow-y-auto scrollbar-thin shadow-2xl">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10 opacity-50">
                        <div className="w-2.5 h-2.5 rounded-full bg-danger"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-warning"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-success"></div>
                        <span className="ml-2 text-[10px]">compiler-output.log</span>
                    </div>
                    {consoleLog.length === 0 && <div className="text-text-muted opacity-30 italic">// El sistema está listo para la compilación de datos...</div>}
                    {consoleLog.map((line, i) => (
                        <div key={i} className={`mb-1 leading-relaxed ${line.includes('ÉXITO') ? 'text-success font-bold' : line.includes('ERROR') ? 'text-danger' : 'text-[#abb2bf]'}`}>
                            <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString()}]</span> {line}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function CompBtn({ label, icon, onClick }: { label: string, icon: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 p-3 bg-[#0d1117] border border-border/60 rounded-lg hover:border-accent group transition-all active:scale-[0.98]">
            <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-[12px] font-bold group-hover:text-white text-text-muted">{label}</span>
        </button>
    )
}

function QAView({ data }: { data: ContentItem[] }) {
    const reviewItems = data.filter(c => c.status === 'Review')
    return (
        <div className="max-w-4xl">
            <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">Módulo de Aseguramiento de Calidad (QA)</h2>
            <div className="grid gap-4">
                {reviewItems.map(item => (
                    <div key={item.id} className="bg-panel border border-border p-6 rounded-xl flex justify-between items-center group hover:border-accent/30 transition-all shadow-sm">
                        <div>
                            <div className="font-bold text-lg text-white group-hover:text-accent transition-colors">{item.title}</div>
                            <div className="text-xs text-text-muted mt-1 font-mono">{item.id} | {item.pillar} | {item.status}</div>
                        </div>
                        <button className="bg-accent/10 border border-accent/20 text-accent px-5 py-2.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-all hover:bg-accent hover:text-white">Audit Doc</button>
                    </div>
                ))}
                {reviewItems.length === 0 && (
                    <div className="bg-panel border border-dashed border-border p-20 text-center rounded-xl">
                        <div className="text-4xl mb-4 opacity-20">✅</div>
                        <div className="text-text-muted italic font-medium">No hay activos pendientes de revisión técnica. El inventario está al día.</div>
                    </div>
                )}
            </div>
        </div>
    )
}
