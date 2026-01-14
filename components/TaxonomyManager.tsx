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
    Box
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
                <button
                    onClick={() => handleAddNode(null, 'Pillar')}
                    className="bg-accent text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-accent/20 transition-all flex items-center gap-2"
                >
                    <Plus size={16} />
                    Agregar Pilar
                </button>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-2 lg:ml-16">
                            {pillar.children?.map(comp => (
                                <div
                                    key={comp.id}
                                    className={`flex justify-between items-center p-4 rounded-2xl border transition-all hover:scale-[1.02] ${comp.active
                                            ? 'bg-panel border-border group-hover:border-accent/20'
                                            : 'bg-panel/40 border-dashed border-border opacity-60'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {comp.active ? <FileText size={14} className="text-accent shrink-0" /> : <EyeOff size={14} className="text-text-muted shrink-0" />}
                                        <span className="text-[13px] font-bold text-text-main truncate">{comp.name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEditName(comp.id, comp.name)} className="p-1.5 text-text-muted hover:text-accent transition-colors"><Edit2 size={12} /></button>
                                        <button onClick={() => handleToggleActive(comp.id, comp.active)} className="p-1.5 text-text-muted hover:text-accent transition-colors">
                                            {comp.active ? <EyeOff size={12} /> : <Eye size={12} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!pillar.children || pillar.children.length === 0) && (
                                <div className="text-[11px] italic text-text-muted opacity-40 p-4 bg-panel/30 border border-dashed border-border rounded-2xl flex items-center justify-center gap-2 col-span-full">
                                    <ChevronRight size={14} /> Sin subcomponentes asociados
                                </div>
                            )}
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
