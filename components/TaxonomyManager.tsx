'use client'

import React, { useState } from 'react'

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
                // Local update
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
                const newNode = await res.json()
                // Refresh full tree for simplicity or append locally
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
        <div className="bg-panel border border-border rounded-xl p-6 transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="m-0 text-[16px] font-semibold text-white tracking-tight">Arquitectura Estructural</h3>
                <button
                    onClick={() => handleAddNode(null, 'Pillar')}
                    className="bg-accent text-[#0d1117] px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-white transition-all active:scale-95"
                >
                    + Nuevo Pilar
                </button>
            </div>

            <div className="space-y-4">
                {data.map(pillar => (
                    <div key={pillar.id} className={`border border-border/60 rounded-lg p-4 bg-[#0d1117]/40 ${!pillar.active ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-accent font-bold text-[13px] flex items-center gap-2">
                                📂 {pillar.name}
                                {!pillar.active && <span className="text-[9px] bg-danger/20 text-danger border border-danger/30 px-1.5 py-0.5 rounded">Inactivo</span>}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditName(pillar.id, pillar.name)} className="text-[10px] text-text-muted hover:text-white">Editar</button>
                                <button onClick={() => handleToggleActive(pillar.id, pillar.active)} className="text-[10px] text-text-muted hover:text-white">{pillar.active ? 'Desactivar' : 'Activar'}</button>
                                <button onClick={() => handleAddNode(pillar.id, 'Component')} className="bg-border/60 text-white px-2 py-1 rounded text-[10px] hover:bg-border">+ Sub</button>
                            </div>
                        </div>

                        <ul className="list-none p-0 ml-4 space-y-2 border-l border-border/30 pl-4">
                            {pillar.children?.map(comp => (
                                <li key={comp.id} className={`flex justify-between items-center text-[12px] group ${!comp.active ? 'opacity-60' : ''}`}>
                                    <span className="text-text-muted hover:text-text cursor-pointer" onClick={() => handleEditName(comp.id, comp.name)}>
                                        {comp.active ? '🔹' : '⚪'} {comp.name}
                                    </span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleToggleActive(comp.id, comp.active)} className="text-[9px] text-text-muted hover:text-white">
                                            {comp.active ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                </li>
                            ))}
                            {(!pillar.children || pillar.children.length === 0) && (
                                <li className="text-[11px] italic text-text-muted opacity-40">Sin subcomponentes</li>
                            )}
                        </ul>
                    </div>
                ))}
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-panel border border-border p-4 rounded-lg shadow-xl animate-pulse">
                        Sincronizando Arquitectura...
                    </div>
                </div>
            )}
        </div>
    )
}
