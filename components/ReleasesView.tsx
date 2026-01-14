'use client'

import React, { useState, useEffect } from 'react'
import { Plus, History, CheckCircle2, AlertCircle, Snowflake, Box, Lock, Loader2 } from 'lucide-react'

type Release = {
    id: string
    tag: string
    description: string | null
    status: 'Draft' | 'Active' | 'Frozen'
    createdAt: string
    _count?: { contents: number }
}

export default function ReleasesView() {
    const [releases, setReleases] = useState<Release[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchReleases = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/releases')
            const data = await res.json()
            setReleases(data)
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchReleases()
    }, [])

    const handleCreate = async () => {
        const tag = window.prompt('Tag de versión (ej: v1.0):')
        const description = window.prompt('Descripción corta (opcional):')
        if (!tag) return

        try {
            await fetch('/api/releases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag, description })
            })
            fetchReleases()
        } catch (err) {
            console.error(err)
        }
    }

    const handleUpdateStatus = async (id: string, status: string) => {
        if (!window.confirm(`¿Seguro que deseas cambiar el estado a ${status}?`)) return

        try {
            await fetch('/api/releases', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            })
            fetchReleases()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="max-w-5xl mx-auto py-8 text-left">
            <header className="flex justify-between items-end mb-12">
                <div>
                    <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-3">VERSIONAMIENTO ESTRATÉGICO</div>
                    <h2 className="text-4xl font-black text-text-main tracking-tighter">Gestión de Releases</h2>
                    <p className="text-sm text-text-muted mt-2 font-medium">Controla el ciclo de vida y la estabilidad de la arquitectura 4Shine.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-accent text-white px-6 py-3.5 rounded-2xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-accent/20 flex items-center gap-2 active:scale-95"
                >
                    <Plus size={18} />
                    Nueva Versión
                </button>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-text-muted opacity-40">
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <div className="font-bold tracking-tight">Recuperando linaje de versiones...</div>
                </div>
            ) : (
                <div className="grid gap-6">
                    {releases.map(release => (
                        <div key={release.id} className="bg-panel border border-border rounded-3xl p-8 flex justify-between items-center group hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/5 transition-all shadow-sm relative overflow-hidden">
                            {release.status === 'Frozen' && <div className="absolute top-0 left-0 w-1 h-full bg-danger" />}
                            {release.status === 'Active' && <div className="absolute top-0 left-0 w-1 h-full bg-success" />}

                            <div className="flex gap-8 items-center">
                                <div className="bg-bg border border-border rounded-2xl p-4 min-w-[100px] text-center shadow-inner">
                                    <div className="text-2xl font-black text-text-main tracking-tighter">{release.tag}</div>
                                    <div className="text-[9px] text-text-muted font-black uppercase tracking-widest mt-1">
                                        {new Date(release.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                                    </div>
                                </div>
                                <div className="h-12 w-[2px] bg-border/40 rounded-full"></div>
                                <div>
                                    <h4 className="text-lg font-black text-text-main tracking-tight group-hover:text-accent transition-colors">{release.description || 'Sin descripción técnica'}</h4>
                                    <div className="flex gap-4 mt-3 items-center">
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-black uppercase tracking-widest flex items-center gap-1.5 ${release.status === 'Frozen' ? 'bg-danger/10 text-danger border-danger/20' :
                                            release.status === 'Active' ? 'bg-success/10 text-success border-success/20' :
                                                'bg-warning/10 text-warning border-warning/20'
                                            }`}>
                                            {release.status === 'Frozen' && <Snowflake size={12} />}
                                            {release.status === 'Active' && <CheckCircle2 size={12} />}
                                            {release.status === 'Draft' && <AlertCircle size={12} />}
                                            {release.status === 'Frozen' ? 'Congelada' : release.status === 'Active' ? 'Activa' : 'Borrador'}
                                        </span>
                                        <span className="text-[11px] text-text-muted font-bold flex items-center gap-2">
                                            <Box size={14} className="opacity-50" />
                                            <span className="text-text-main font-black">{release._count?.contents || 0}</span> activos vinculados
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                {release.status !== 'Frozen' && (
                                    <>
                                        {release.status === 'Draft' && (
                                            <button
                                                onClick={() => handleUpdateStatus(release.id, 'Active')}
                                                className="bg-accent/10 text-accent border border-accent/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-sm"
                                            >
                                                Publicar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleUpdateStatus(release.id, 'Frozen')}
                                            className="bg-panel border border-border text-danger px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-danger hover:text-white transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <Lock size={12} />
                                            Congelar
                                        </button>
                                    </>
                                )}
                                {release.status === 'Frozen' && (
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-danger/40 italic">
                                        <Lock size={12} />
                                        Inmutable
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
