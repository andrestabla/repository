'use client'

import { useState, useEffect } from 'react'
import ContentForm from '@/components/ContentForm'

type ContentItem = {
    id: string
    title: string
    type: string
    pillar: string
    sub?: string
    level?: string
    version: string
    status: string
    ip: string | null
    driveId?: string | null
    completeness: number
}

// Client Component to manage modal state
export default function Inventory() {
    const [items, setItems] = useState<ContentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
    const [refresh, setRefresh] = useState(0)

    // Filter States
    const [filterPillar, setFilterPillar] = useState('Todos')
    const [filterStatus, setFilterStatus] = useState('Todos')

    useEffect(() => {
        fetch('/api/inventory/list') // Need to create a simple list API or use server action
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setItems(data)
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }, [refresh])

    // Derive displayed items
    const filteredItems = items.filter(item => {
        if (filterPillar !== 'Todos' && item.pillar !== filterPillar) return false
        if (filterStatus !== 'Todos') {
            if (filterStatus === 'Incompletos' && item.completeness === 100) return false;
            if (filterStatus === 'Borradores' && item.status !== 'Borrador') return false;
            if (filterStatus === 'Revisión' && item.status !== 'Revisión') return false;
        }
        return true
    })

    const handleEdit = (item: ContentItem) => {
        setEditingItem(item)
        setShowForm(true)
    }

    const handleNew = () => {
        setEditingItem(null)
        setShowForm(true)
    }

    const handleSave = () => {
        setRefresh(p => p + 1)
        setShowForm(false)
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-semibold text-white">Inventario Maestro (Source of Truth)</h2>
                <button
                    onClick={handleNew}
                    className="bg-[#238636] text-white border border-white/10 px-3.5 py-1.5 rounded-md text-[12px] font-semibold hover:bg-[#2ea043] transition-colors"
                >
                    + Indexar Nuevo
                </button>
            </div>

            <div className="bg-[#161b22] border border-[var(--border)] rounded-xl p-5 mb-5">
                <div className="flex gap-2.5 mb-4">
                    <input
                        placeholder="Buscar por ID, título o metadata..."
                        className="bg-[#0d1117] border border-[var(--border)] text-white px-2 py-2 rounded-md w-full max-w-[300px] text-[13px] outline-none focus:border-[var(--accent)]"
                    />
                    <select
                        className="bg-[#0d1117] border border-[var(--border)] text-white px-2 py-2 rounded-md w-full max-w-[150px] text-[13px] outline-none"
                        onChange={e => setFilterPillar(e.target.value)}
                    >
                        <option value="Todos">Todos los Pilares</option>
                        <option value="Shine Out">Shine Out</option>
                        <option value="Audio">Audio</option>
                    </select>
                    <select
                        className="bg-[#0d1117] border border-[var(--border)] text-white px-2 py-2 rounded-md w-full max-w-[150px] text-[13px] outline-none"
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="Todos">Estado: Todos</option>
                        <option value="Borradores">Borradores</option>
                        <option value="Incompletos">Incompletos (Warning)</option>
                        <option value="Revisión">En Revisión</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-[13px] border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border)] text-left">
                                <th className="text-[var(--text-muted)] py-2 px-3 font-medium w-[10%]">ID</th>
                                <th className="text-[var(--text-muted)] py-2 px-3 font-medium w-[30%]">Título</th>
                                <th className="text-[var(--text-muted)] py-2 px-3 font-medium">Versión</th>
                                <th className="text-[var(--text-muted)] py-2 px-3 font-medium">IP / Confid.</th>
                                <th className="text-[var(--text-muted)] py-2 px-3 font-medium text-center">Drive</th>
                                <th className="text-[var(--text-muted)] py-2 px-3 font-medium text-center">Data %</th>
                                <th className="text-[var(--text-muted)] py-2 px-3 font-medium">Estado</th>
                                <th className="text-[var(--text-muted)] py-2 px-3 font-medium">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={8} className="p-4 text-center text-[var(--text-muted)]">Cargando inventario...</td></tr>}
                            {filteredItems.map((item) => {
                                const hasDrive = !!item.driveId
                                const isComplete = item.completeness === 100
                                const statusColor = item.status === 'Aprobado' ? 'text-green-400 bg-green-900/20 border-green-900/50' :
                                    item.status === 'Revisión' ? 'text-purple-400 bg-purple-900/20 border-purple-900/50' :
                                        'text-gray-400 bg-gray-800/50 border-gray-700/50'

                                return (
                                    <tr key={item.id} className="border-b border-[var(--border)]/40 last:border-0 hover:bg-white/5 transition-colors">
                                        <td className="py-2.5 px-3 font-mono text-[var(--accent)]">{item.id}</td>
                                        <td className="py-2.5 px-3">
                                            <div className="font-semibold text-white">{item.title}</div>
                                            <div className="text-[11px] text-[var(--text-muted)]">{item.pillar} • {item.type}</div>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className="font-mono text-[11px] bg-purple-900/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-900/30">{item.version}</span>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            {item.ip === 'Completar' || !item.ip ? (
                                                <span className="text-[10px] bg-red-900/20 text-red-300 px-2 py-0.5 rounded border border-red-900/30">Falta IP</span>
                                            ) : (
                                                <span className="text-white">{item.ip}</span>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            {hasDrive ? (
                                                <a href={`https://drive.google.com/open?id=${item.driveId}`} target="_blank" className="text-xl hover:scale-110 block transition-transform text-blue-400" title="Ver archivo">📄</a>
                                            ) : (
                                                <span className="text-xl" title="Falta Archivo">⚠️ <span className="sr-only">Alerta</span></span>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                                <div
                                                    className={`h-1.5 rounded-full ${isComplete ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                    style={{ width: `${item.completeness}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.completeness}%</div>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusColor}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <button onClick={() => handleEdit(item)} className="bg-[#21262d] border border-[var(--border)] text-white px-3 py-1.5 rounded-md text-[12px] font-semibold hover:bg-[#30363d] transition-colors">
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <ContentForm
                    initialData={editingItem}
                    onClose={() => setShowForm(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    )
}
