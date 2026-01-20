'use client'

import React, { useState, useEffect } from 'react'
import {
    Search, FileText, ChevronRight, CheckCircle2, XCircle,
    ShieldCheck, Scale, Fingerprint, ExternalLink, AlertTriangle,
    Clock, RefreshCw, Eye, Lock
} from 'lucide-react'

type ContentItem = {
    id: string
    title: string
    type: string
    primaryPillar: string
    secondaryPillars: string[]
    sub?: string | null
    maturity?: string | null
    status: string
    ipOwner?: string | null
    ipType?: string | null
    confidentiality?: string | null
    driveId?: string | null
    observations?: string | null
    updatedAt: string
}

interface Props {
    role: string
    onRefresh: () => void
}

export default function QAView({ role, onRefresh }: Props) {
    const [data, setData] = useState<ContentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [rejectReason, setRejectReason] = useState('')
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    // Checklist state
    const [checks, setChecks] = useState({
        technical: false,
        methodological: false,
        integrity: false
    })

    // Auditor exclusive fields edit
    const [editIP, setEditIP] = useState({
        ipOwner: '',
        ipType: '',
        confidentiality: ''
    })

    useEffect(() => {
        fetchQueue()
    }, [])

    useEffect(() => {
        if (selectedItem) {
            setEditIP({
                ipOwner: selectedItem.ipOwner || '',
                ipType: selectedItem.ipType || '',
                confidentiality: selectedItem.confidentiality || ''
            })
            setChecks({ technical: false, methodological: false, integrity: false })
        }
    }, [selectedItem])

    const fetchQueue = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/inventory/list')
            const json = await res.json()
            if (Array.isArray(json)) {
                // Filter specifically for "Revisión"
                setData(json.filter(i => i.status === 'Revisión'))
            }
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    const handleVerdict = async (verdict: 'Approve' | 'Reject') => {
        if (!selectedItem) return
        if (verdict === 'Approve') {
            if (!checks.technical || !checks.methodological || !checks.integrity) {
                return alert('Debes completar el checklist de calidad antes de aprobar.')
            }
            if (editIP.ipOwner === 'Tercero' && !selectedItem.observations?.includes('Licencia')) {
                return alert('Alerta de Gobernanza: Si el IP es Tercero, debe especificarse la licencia en las observaciones.')
            }
        }

        setIsProcessing(true)
        try {
            const payload = {
                id: selectedItem.id,
                title: selectedItem.title,
                status: verdict === 'Approve' ? 'Validado' : 'Borrador',
                forceReason: verdict === 'Reject' ? `RECHAZO QA: ${rejectReason}` : 'APROBACIÓN QA AUDITOR',
                // Update IP fields if modified by auditor
                ipOwner: editIP.ipOwner,
                ipType: editIP.ipType,
                confidentiality: editIP.confidentiality
            }

            const res = await fetch('/api/inventory/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setSelectedItem(null)
                setShowRejectModal(false)
                setRejectReason('')
                fetchQueue()
                onRefresh()
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) { alert('Error de red') }
        setIsProcessing(false)
    }

    const filteredData = data.filter(i =>
        i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="grid grid-cols-[400px_1fr] gap-8 h-[calc(100vh-200px)] animate-in fade-in duration-500">
            {/* Review Queue (HU-A-01) */}
            <div className="bg-panel border border-border rounded-3xl flex flex-col overflow-hidden shadow-xl">
                <div className="p-6 border-b border-border bg-bg/40">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                            <Clock size={16} className="text-warning" /> Cola de Revisión
                        </h3>
                        <span className="bg-warning/10 text-warning px-2 py-1 rounded-lg text-[10px] font-black border border-warning/20">
                            {data.length} PENDIENTES
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar en revisión..."
                            className="w-full bg-bg border border-border pl-10 pr-4 py-2.5 rounded-xl text-xs text-text-main outline-none focus:border-accent transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
                    {loading ? (
                        <div className="p-8 text-center animate-pulse text-text-muted text-xs font-bold uppercase tracking-widest">
                            <RefreshCw className="animate-spin mx-auto mb-2 text-accent" size={20} />
                            Sincronizando...
                        </div>
                    ) : (
                        filteredData.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all group flex items-start gap-4 ${selectedItem?.id === item.id
                                    ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                                    : 'bg-bg border-border hover:border-accent/40'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedItem?.id === item.id ? 'bg-white/20' : 'bg-panel'
                                    }`}>
                                    <FileText size={18} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="text-xs font-bold truncate">{item.title}</div>
                                    <div className={`text-[9px] uppercase font-black tracking-widest mt-1 flex items-center gap-2 ${selectedItem?.id === item.id ? 'text-white/70' : 'text-text-muted'
                                        }`}>
                                        {item.id} • {item.primaryPillar}
                                    </div>
                                    {item.ipOwner === 'Tercero' && (
                                        <div className="flex items-center gap-1 mt-2 text-[8px] font-bold text-warning-text bg-warning/20 px-1.5 py-0.5 rounded-md w-fit border border-warning/30">
                                            <AlertTriangle size={8} /> REVISAR IP
                                        </div>
                                    )}
                                </div>
                                <ChevronRight size={14} className={`mt-2 ${selectedItem?.id === item.id ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Side-by-Side View (HU-A-02 & HU-A-03) */}
            <div className="bg-panel border border-border rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                {selectedItem ? (
                    <div className="flex flex-col h-full">
                        {/* Header Action Bar */}
                        <div className="p-6 border-b border-border bg-bg/30 flex justify-between items-center backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-text-main tracking-tight">{selectedItem.title}</h4>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">{selectedItem.id}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="bg-bg border border-border hover:border-danger hover:text-danger text-text-muted px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
                                >
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleVerdict('Approve')}
                                    disabled={isProcessing}
                                    className="bg-success text-white px-8 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-success/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle2 size={16} /> Aprobar y Publicar
                                </button>
                            </div>
                        </div>

                        {/* Split Main Area */}
                        <div className="flex-1 grid grid-cols-2 overflow-hidden">
                            {/* Metadata Audit Panel */}
                            <div className="p-8 overflow-y-auto no-scrollbar border-r border-border bg-bg/10 space-y-10">
                                {/* Checklist Section */}
                                <section>
                                    <h5 className="text-[10px] font-black text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Eye size={12} /> Checklist de Validación
                                    </h5>
                                    <div className="space-y-3">
                                        <CheckItem
                                            label="Calidad Técnica (Formatos, Resolución)"
                                            checked={checks.technical}
                                            onChange={() => setChecks(c => ({ ...c, technical: !c.technical }))}
                                        />
                                        <CheckItem
                                            label="Coherencia Metodológica 4Shine"
                                            checked={checks.methodological}
                                            onChange={() => setChecks(c => ({ ...c, methodological: !c.methodological }))}
                                        />
                                        <CheckItem
                                            label="Integridad y Accesibilidad de Archivo"
                                            checked={checks.integrity}
                                            onChange={() => setChecks(c => ({ ...c, integrity: !c.integrity }))}
                                        />
                                    </div>
                                </section>

                                {/* IP Governance Section (HU-A-03) */}
                                <section className="p-6 bg-accent/5 border border-accent/10 rounded-3xl space-y-6">
                                    <h5 className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2">
                                        <Scale size={14} /> Gobernanza de IP & Seguridad
                                    </h5>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <QAInput
                                                label="Titular IP"
                                                value={editIP.ipOwner}
                                                onChange={v => setEditIP(p => ({ ...p, ipOwner: v }))}
                                                options={['Propio', 'Tercero', 'Dominio Público', 'Mixto']}
                                            />
                                            <QAInput
                                                label="Régimen"
                                                value={editIP.ipType}
                                                onChange={v => setEditIP(p => ({ ...p, ipType: v }))}
                                                options={['Derecho de autor', 'Know-how', 'Licencia', 'Adaptación']}
                                            />
                                        </div>
                                        <QAInput
                                            label="Nivel de Confidencialidad"
                                            value={editIP.confidentiality}
                                            onChange={v => setEditIP(p => ({ ...p, confidentiality: v }))}
                                            options={['Baja', 'Media', 'Alta', 'Restringida']}
                                        />
                                    </div>
                                </section>

                                {/* Detail Summary */}
                                <section className="space-y-4">
                                    <h5 className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                        <Fingerprint size={12} /> Reseña Metodológica
                                    </h5>
                                    <div className="text-xs text-text-main leading-relaxed bg-bg border border-border p-4 rounded-2xl italic">
                                        {selectedItem.observations || "Sin observaciones específicas."}
                                    </div>
                                </section>
                            </div>

                            {/* Drive Preview Panel (HU-A-02) */}
                            <div className="bg-bg/40 relative group">
                                {selectedItem.driveId ? (
                                    <iframe
                                        src={`https://drive.google.com/file/d/${selectedItem.driveId}/preview`}
                                        className="w-full h-full border-none"
                                        allow="autoplay"
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center text-text-muted">
                                        <AlertTriangle size={48} className="mb-4 opacity-20" />
                                        <p className="text-[11px] font-black uppercase tracking-widest">Sin Archivo Vinculado</p>
                                        <p className="text-[10px] mt-2 max-w-[200px]">Este activo no tiene un ID de Drive válido para previsualización.</p>
                                    </div>
                                )}
                                <a
                                    href={`https://drive.google.com/open?id=${selectedItem.driveId}`}
                                    target="_blank"
                                    className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-20 text-center text-text-muted animate-in fade-in duration-700">
                        <Lock size={64} className="mb-6 opacity-10" />
                        <h4 className="text-sm font-black uppercase tracking-[0.3em]">Cámara de Calidad</h4>
                        <p className="text-[11px] mt-4 max-w-[280px] leading-relaxed">Selecciona un activo de la cola izquierda para iniciar el proceso de validación final.</p>
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-panel border border-border w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <XCircle className="text-danger" size={18} /> Motivo del Rechazo
                            </h4>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Indica al curador qué aspectos debe corregir..."
                                className="w-full h-32 bg-bg border border-border rounded-2xl p-4 text-xs text-text-main outline-none focus:border-danger transition-all resize-none"
                            />
                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="flex-1 bg-bg border border-border text-text-muted py-3 rounded-xl font-bold text-xs uppercase"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleVerdict('Reject')}
                                    disabled={!rejectReason || isProcessing}
                                    className="flex-1 bg-danger text-white py-3 rounded-xl font-bold text-xs uppercase shadow-lg shadow-danger/20 disabled:opacity-50"
                                >
                                    Rechazar Activo
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function CheckItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
    return (
        <label className="flex items-center gap-4 p-4 bg-bg border border-border rounded-2xl cursor-pointer hover:border-accent/40 transition-all group">
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'bg-success border-success text-white' : 'border-border group-hover:border-accent/50'
                }`}>
                {checked && <CheckCircle2 size={12} />}
            </div>
            <span className={`text-[11px] font-bold ${checked ? 'text-text-mainLine' : 'text-text-muted'}`}>{label}</span>
        </label>
    )
}

function QAInput({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: string[] }) {
    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest pl-1">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl p-3 text-[11px] font-bold text-text-main outline-none focus:border-accent appearance-none cursor-pointer"
            >
                <option value="">Seleccionar...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    )
}
