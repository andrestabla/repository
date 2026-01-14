'use client'

import React, { useState, useEffect } from 'react'

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
        <div className="max-w-5xl mx-auto py-4">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-[26px] font-bold text-white tracking-tighter">Gestión de Versiones (HU-M-03)</h2>
                    <p className="text-[13px] text-text-muted mt-1">Controla el ciclo de vida y la estabilidad de la metodología 4Shine.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-accent text-[#0d1117] px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-white transition-all shadow-[0_0_15px_rgba(56,139,253,0.3)]"
                >
                    + Nueva Versión
                </button>
            </header>

            {isLoading ? (
                <div className="text-center py-20 opacity-40 animate-pulse">Cargando historial de versiones...</div>
            ) : (
                <div className="grid gap-5">
                    {releases.map(release => (
                        <div key={release.id} className="bg-panel border border-border rounded-xl p-6 flex justify-between items-center hover:border-accent/40 transition-colors group">
                            <div className="flex gap-6 items-center">
                                <div className="text-center">
                                    <div className="text-[20px] font-black text-accent tracking-tighter">{release.tag}</div>
                                    <div className="text-[10px] text-text-muted font-mono uppercase">{new Date(release.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="h-10 w-[1px] bg-border/60"></div>
                                <div>
                                    <h4 className="m-0 text-[15px] font-semibold text-white">{release.description || 'Sin descripción'}</h4>
                                    <div className="flex gap-3 mt-1.5 items-center">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${release.status === 'Frozen' ? 'bg-danger/10 text-danger border-danger/30' :
                                                release.status === 'Active' ? 'bg-success/10 text-success border-success/30' :
                                                    'bg-warning/10 text-warning border-warning/30'
                                            }`}>
                                            {release.status === 'Frozen' ? '❄️ CONGELADA' : release.status === 'Active' ? '✅ ACTIVA' : '📝 BORRADOR'}
                                        </span>
                                        <span className="text-[11px] text-text-muted">
                                            📦 <span className="font-bold text-white">{release._count?.contents || 0}</span> activos asociados
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                {release.status !== 'Frozen' && (
                                    <>
                                        {release.status === 'Draft' && (
                                            <button onClick={() => handleUpdateStatus(release.id, 'Active')} className="bg-[#21262d] text-white px-3 py-1.5 rounded text-[11px] font-bold border border-white/10 hover:bg-[#30363d]">Activar</button>
                                        )}
                                        <button onClick={() => handleUpdateStatus(release.id, 'Frozen')} className="bg-danger/80 text-white px-3 py-1.5 rounded text-[11px] font-bold hover:bg-danger transition-colors">Congelar</button>
                                    </>
                                )}
                                {release.status === 'Frozen' && (
                                    <span className="text-[11px] text-danger font-bold italic">Edición Bloqueada</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
