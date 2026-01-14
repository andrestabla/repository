
'use client'

import { useState, useEffect } from 'react'

type ContentItem = {
    id: string
    title: string
    type: string
    pillar: string
    sub?: string
    level?: string
    version: string
    status: string
    ip: string
    driveId?: string
    completeness: number
}

type Props = {
    initialData?: ContentItem | null
    onClose: () => void
    onSave: () => void
}

export default function ContentForm({ initialData, onClose, onSave }: Props) {
    const [formData, setFormData] = useState<Partial<ContentItem>>({
        id: '',
        title: '',
        type: 'PDF',
        pillar: 'Shine Out',
        sub: '',
        level: 'Básico',
        version: 'v1.0',
        status: 'Borrador',
        ip: 'Completar',
        driveId: '',
        ...initialData
    })

    // If editing, ID is read-only
    const isEdit = !!initialData

    const [driveInput, setDriveInput] = useState(initialData?.driveId || '')
    const [driveStatus, setDriveStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')

    // Handle Drive Input Logic for Smart Extraction
    const handleDriveBlur = () => {
        if (!driveInput) {
            setFormData(prev => ({ ...prev, driveId: '' }))
            setDriveStatus('idle')
            return
        }

        setDriveStatus('validating')

        // Simulate validation delay and extraction
        setTimeout(() => {
            // Regex from backend lib (duplicated here for immediate UI feedback, or call an API)
            // Ideally we'd call an API to validate, but for now we do client-side regex check
            // Supports: https://docs.google.com/document/d/FILE_ID/edit
            const DRIVE_ID_REGEX = /[-\w]{25,}/
            const match = driveInput.match(DRIVE_ID_REGEX)

            if (match) {
                const extractedId = match[0]
                // Only update if different
                setFormData(prev => ({ ...prev, driveId: extractedId }))
                setDriveStatus('valid')
                // Optional: Update input to show clean ID or keep URL but show checkmark
            } else {
                setDriveStatus('invalid')
                setFormData(prev => ({ ...prev, driveId: '' }))
            }
        }, 600)
    }

    const handleSubmit = async () => {
        try {
            const res = await fetch('/api/inventory/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                onSave() // Trigger parent refresh
            } else {
                const err = await res.json()
                alert('Error al guardar: ' + err.error)
            }
        } catch (error) {
            alert('Error de red')
        }
    }

    const handleHandover = async () => {
        if (!confirm('¿Enviar a Revisión? El registro se bloqueará hasta ser auditado.')) return;

        // Update status locally then submit
        const dataToSend = { ...formData, status: 'Revisión' }
        try {
            const res = await fetch('/api/inventory/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            })

            if (res.ok) {
                onSave()
            } else {
                const err = await res.json()
                alert('No se pudo enviar a revisión: ' + err.error)
            }
        } catch (error) {
            alert('Error de red')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#161b22] border border-[var(--border)] w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">
                        {isEdit ? `Editar Activo: ${formData.id}` : 'Indexar Nuevo Activo'}
                    </h2>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white">✕</button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">

                    {/* Block 1: Identification */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">ID Único</label>
                            <input
                                disabled={isEdit}
                                value={formData.id}
                                onChange={e => setFormData({ ...formData, id: e.target.value })}
                                className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm font-mono text-accent"
                                placeholder="Ej: 4S-P-001"
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Título Oficial</label>
                            <input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm text-white"
                                placeholder="Nombre descriptivo del activo"
                            />
                        </div>
                    </div>

                    {/* Block 2: Taxonomy */}
                    <div className="grid grid-cols-3 gap-4 p-3 bg-[#0d1117] rounded border border-[var(--border)]">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Pilar</label>
                            <select
                                value={formData.pillar}
                                onChange={e => setFormData({ ...formData, pillar: e.target.value })}
                                className="w-full bg-[#161b22] border border-[var(--border)] rounded p-2 text-xs"
                            >
                                <option>Shine Out</option>
                                <option>Shine In</option>
                                <option>Architecture</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Tipo</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-[#161b22] border border-[var(--border)] rounded p-2 text-xs"
                            >
                                <option>PDF</option>
                                <option>Video</option>
                                <option>Herramienta</option>
                                <option>Manual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Nivel</label>
                            <select
                                value={formData.level}
                                onChange={e => setFormData({ ...formData, level: e.target.value })}
                                className="w-full bg-[#161b22] border border-[var(--border)] rounded p-2 text-xs"
                            >
                                <option>Básico</option>
                                <option>Intermedio</option>
                                <option>Avanzado</option>
                            </select>
                        </div>
                    </div>

                    {/* Block 3: Tech & IP */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Subcomponente</label>
                            <input
                                value={formData.sub || ''}
                                onChange={e => setFormData({ ...formData, sub: e.target.value })}
                                className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm"
                                placeholder="Ej: Liderazgo"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Propiedad Intelectual</label>
                            <select
                                value={formData.ip}
                                onChange={e => setFormData({ ...formData, ip: e.target.value })}
                                className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm"
                            >
                                <option value="Completar">Seleccionar...</option>
                                <option value="Propio">Propio (Methodology)</option>
                                <option value="Tercero">Tercero (Licencia req.)</option>
                            </select>
                        </div>
                    </div>

                    {/* Block 4: Drive Link (Smart) */}
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1 flex items-center justify-between">
                            <span>Enlace a Google Drive / ID</span>
                            {driveStatus === 'validating' && <span className="text-blue-400">Validando...</span>}
                            {driveStatus === 'valid' && <span className="text-green-400">✅ Archivo Detectado</span>}
                            {driveStatus === 'invalid' && <span className="text-red-400">❌ Formato inválido</span>}
                        </label>
                        <div className="flex gap-2">
                            <input
                                value={driveInput}
                                onChange={e => setDriveInput(e.target.value)}
                                onBlur={handleDriveBlur}
                                className={`w-full bg-[#0d1117] border rounded p-2 text-sm font-mono transition-colors ${driveStatus === 'valid' ? 'border-green-500/50' :
                                        driveStatus === 'invalid' ? 'border-red-500/50' : 'border-[var(--border)]'
                                    }`}
                                placeholder="Pega el link de Drive aquí (https://docs.google.com/...)"
                            />
                        </div>
                        {formData.driveId && (
                            <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">ID Extraído: {formData.driveId}</div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)] flex justify-between items-center bg-[#0d1117] rounded-b-xl">
                    <div className="text-xs text-[var(--text-muted)]">
                        Completeness Score: <span className={`font-bold ${formData.completeness === 100 ? 'text-green-400' : 'text-orange-400'}`}>{formData.completeness}%</span>
                    </div>
                    <div className="flex gap-3">
                        {isEdit && formData.status === 'Borrador' && (
                            <button
                                onClick={handleHandover}
                                className="px-4 py-2 rounded text-sm font-semibold text-[var(--warning)] hover:bg-[var(--warning)]/10 border border-[var(--warning)]/30"
                            >
                                ✋ Enviar a Revisión
                            </button>
                        )}
                        <button onClick={handleSubmit} className="bg-[#238636] text-white px-6 py-2 rounded font-semibold text-sm hover:brightness-110 shadow-lg shadow-green-900/20">
                            Guardar {isEdit ? 'Cambios' : 'Borrador'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
