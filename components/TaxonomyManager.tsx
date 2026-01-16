'use client'

import React, { useState } from 'react'
import {
    Folder,
    FileText,
    PlusCircle,
    Edit2,
    Eye,
    EyeOff,
    ChevronRight,
    Loader2,
    Plus,
    Box,
    RefreshCw
} from 'lucide-react'

type TaxonomyItem = {
    id: string
    name: string
    type: string
    active: boolean
    order: number
    parentId: string | null
    children?: TaxonomyItem[]
}

export default function TaxonomyManager({ initialData }: { initialData: TaxonomyItem[] }) {
    const [data, setData] = useState<TaxonomyItem[]>(initialData)
    const [isLoading, setIsLoading] = useState(false)

    const handleToggleActive = async (id: string, current: boolean) => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/taxonomy', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, active: !current })
            })
            if (res.ok) {
                const updateTree = (nodes: TaxonomyItem[]): TaxonomyItem[] => {
                    return nodes.map(n => {
                        if (n.id === id) return { ...n, active: !current }
                        if (n.children) return { ...n, children: updateTree(n.children) }
                        return n
                    })
                }
                setData(updateTree(data))
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddNode = async (parentId: string | null, type: string) => {
        const name = window.prompt(`Nuevo ${type}:`)
        if (!name) return

        setIsLoading(true)
        try {
            const res = await fetch('/api/taxonomy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type, parentId })
            })
            if (res.ok) {
                window.location.reload()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditName = async (id: string, currentName: string) => {
        const name = window.prompt('Editar nombre:', currentName)
        if (!name || name === currentName) return

        setIsLoading(true)
        try {
            const res = await fetch('/api/taxonomy', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name })
            })
            if (res.ok) {
                const updateTree = (nodes: TaxonomyItem[]): TaxonomyItem[] => {
                    return nodes.map(n => {
                        if (n.id === id) return { ...n, name }
                        if (n.children) return { ...n, children: updateTree(n.children) }
                        return n
                    })
                }
                setData(updateTree(data))
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleSync = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/taxonomy', { method: 'PUT' })
            const data = await res.json()
            if (res.ok) {
                alert(`Sincronización completada.\nAgregados: ${data.stats.added}\nExistentes: ${data.stats.exist}`)
                window.location.reload()
            }
        } catch (err) {
            console.error(err)
            alert('Error al sincronizar')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-panel border border-border rounded-3xl p-8 shadow-sm text-left">
            <header className="flex justify-between items-center mb-10 border-b border-border pb-6">
                <div>
                    <h3 className="text-2xl font-black text-text-main tracking-tighter flex items-center gap-3">
                        Arquitectura Estructural
                        <Box size={20} className="text-accent opacity-50" />
                    </h3>
                    <p className="text-sm text-text-muted mt-1 font-medium italic">Define pilares y subcomponentes del framework 4Shine.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSync}
                        className="bg-panel border border-border text-text-muted hover:text-accent hover:border-accent px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                        title="Sincronizar Pilares desde Assets"
                    >
                        <RefreshCw size={14} />
                        Actualizar
                    </button>
                    <button
                        onClick={() => handleAddNode(null, 'Pillar')}
                        className="bg-gray-100 text-gray-400 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed flex items-center gap-2"
                        title="Los pilares base son fijos (4Shine)"
                        disabled
                    >
                        <Plus size={16} />
                        Agregar Pilar
                    </button>
                </div>
            </header>

            <div className="grid gap-6">
                {data.map(pillar => (
                    <div key={pillar.id} className={`group bg-bg border-2 border-border/40 rounded-3xl p-6 transition-all hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 ${!pillar.active ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-accent/5 text-accent rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                                    <Folder size={24} fill={pillar.active ? 'currentColor' : 'none'} fillOpacity={0.2} />
                                </div>
                                <div>
                                    <div className="font-black text-xl text-text-main flex items-center gap-3 tracking-tight">
                                        {pillar.name}
                                        {!pillar.active && (
                                            <span className="text-[9px] bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded-full uppercase font-black tracking-widest">Inactivo</span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-1 opacity-60">Pilar Maestría</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <IconButton icon={<Edit2 size={14} />} onClick={() => handleEditName(pillar.id, pillar.name)} />
                                <IconButton icon={pillar.active ? <EyeOff size={14} /> : <Eye size={14} />} onClick={() => handleToggleActive(pillar.id, pillar.active)} />
                                <button
                                    onClick={() => handleAddNode(pillar.id, 'Component')}
                                    className="bg-panel border border-border text-text-muted px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all flex items-center gap-2"
                                >
                                    <PlusCircle size={14} /> Subcomponente
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 ml-2 lg:ml-16">
                            {pillar.children?.map(level2 => (
                                <div key={level2.id} className="border border-border rounded-xl p-4 bg-panel/50">
                                    {/* LEVEL 2: SUBCOMPONENT */}
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-bold">L2</div>
                                            <span className="font-bold text-sm text-text-main">{level2.name}</span>
                                            <span className="text-[10px] text-text-muted uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-1.5 rounded">Subcomponente</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <IconButton icon={<Edit2 size={12} />} onClick={() => handleEditName(level2.id, level2.name)} />
                                            <IconButton icon={level2.active ? <EyeOff size={12} /> : <Eye size={12} />} onClick={() => handleToggleActive(level2.id, level2.active)} />
                                        </div>
                                    </div>

                                    {/* LEVEL 3: COMPETENCIA */}
                                    <div className="ml-8 border-l-2 border-border pl-4 grid gap-2">
                                        {level2.children?.map(level3 => (
                                            <div key={level3.id} className="group/l3">
                                                <div className="flex justify-between items-center py-2 hover:bg-black/5 rounded px-2 -ml-2 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center text-[9px] font-bold">L3</div>
                                                        <span className="text-sm font-medium text-text-main">{level3.name}</span>
                                                        <span className="text-[9px] text-text-muted uppercase tracking-widest opacity-50">Competencia</span>
                                                    </div>
                                                </div>

                                                {/* LEVEL 4: CONDUCTA */}
                                                <div className="ml-6 mt-1 space-y-1">
                                                    {level3.children?.map(level4 => (
                                                        <div key={level4.id} className="flex items-center gap-2 text-xs text-text-muted py-1 pl-2 border-l border-border hover:text-accent hover:border-accent transition-colors">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-accent" />
                                                            <span>{level4.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-bg/80 backdrop-blur-md flex items-center justify-center z-[100] transition-all">
                    <div className="bg-panel border border-border p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-6">
                        <Loader2 size={48} className="text-accent animate-spin" />
                        <div className="text-lg font-black text-text-main tracking-tighter uppercase tracking-widest">Sincronizando Arquitectura 4Shine</div>
                    </div>
                </div>
            )}
        </div>
    )
}

function IconButton({ icon, onClick }: { icon: React.ReactNode, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-10 h-10 rounded-xl bg-panel border border-border text-text-muted hover:border-accent hover:text-accent transition-all flex items-center justify-center hover:shadow-lg hover:shadow-accent/10 active:scale-90"
        >
            {icon}
        </button>
    )
}
