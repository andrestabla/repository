
"use client"

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2, Link as LinkIcon, Plus, Trash, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DriveUtils } from '@/lib/google'
import { DriveExplorerModal } from '@/components/products/DriveExplorerModal' // Reusing from products
import { Workbook } from './WorkbookCard'

interface WorkbookFormProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialWorkbook?: Workbook
}

export function WorkbookForm({ isOpen, onClose, onSuccess, initialWorkbook }: WorkbookFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [isDriveExplorerOpen, setIsDriveExplorerOpen] = useState(false)

    // Basic Info
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState('Borrador')
    const [type, setType] = useState('General')

    // Source
    const [driveId, setDriveId] = useState('')
    const [driveLink, setDriveLink] = useState('')

    // Metadata
    const [audience, setAudience] = useState('')
    const [duration, setDuration] = useState('')
    const [difficulty, setDifficulty] = useState('Básico')
    const [prerequisites, setPrerequisites] = useState('')

    // Lists
    const [objectives, setObjectives] = useState<string[]>([''])
    const [takeaways, setTakeaways] = useState<string[]>([''])
    const [extraMetadata, setExtraMetadata] = useState<any>({})

    useEffect(() => {
        if (initialWorkbook && isOpen) {
            setTitle(initialWorkbook.title)
            setDescription(initialWorkbook.description || '')
            setStatus(initialWorkbook.status)
            setType(initialWorkbook.type || 'General')
            setDriveId(initialWorkbook.driveId || '')
            setDriveLink(initialWorkbook.driveId ? `https://drive.google.com/file/d/${initialWorkbook.driveId}/view` : '')

            // Metadata
            const meta = initialWorkbook.metadata
            setAudience(meta?.audience || '')
            setDuration(meta?.duration || '')
            setDifficulty(meta?.difficulty || 'Básico')
            setPrerequisites(meta?.prerequisites || '')
            setObjectives(meta?.objectives && meta.objectives.length > 0 ? meta.objectives : [''])
            setTakeaways(meta?.takeaways && meta.takeaways.length > 0 ? meta.takeaways : [''])

            // Store everything else in extraMetadata
            const { objectives: _, takeaways: __, audience: ___, duration: ____, difficulty: _____, prerequisites: ______, ...rest } = meta || {}
            setExtraMetadata(rest)
        } else if (!isOpen) {
            resetForm()
        }
    }, [initialWorkbook, isOpen])

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setStatus('Borrador')
        setType('General')
        setDriveId('')
        setDriveLink('')
        setAudience('')
        setDuration('')
        setDifficulty('Básico')
        setPrerequisites('')
        setObjectives([''])
        setTakeaways([''])
        setExtraMetadata({})
    }

    const handleDriveSelect = (file: any) => {
        const url = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`
        setDriveLink(url)
        setDriveId(file.id)
        if (!title) setTitle(file.name)
        setIsDriveExplorerOpen(false)
    }

    const handleListChange = (index: number, value: string, setter: any, list: string[]) => {
        const newList = [...list]
        newList[index] = value
        setter(newList)
    }

    const addListItem = (setter: any, list: string[]) => {
        setter([...list, ''])
    }

    const removeListItem = (index: number, setter: any, list: string[]) => {
        const newList = list.filter((_, i) => i !== index)
        setter(newList.length ? newList : [''])
    }

    const handleAIAnalyze = async () => {
        if (!driveId) return alert("Selecciona un archivo de Drive primero para analizar.")

        setAiLoading(true)
        try {
            const res = await fetch('/api/workbooks/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driveId, workbookType: type })
            })
            const { data, error } = await res.json()
            if (error) throw new Error(error)

            if (data.title && !title) setTitle(data.title)
            if (data.description) setDescription(data.description)

            if (data.metadata) {
                if (data.metadata.audience) setAudience(data.metadata.audience)
                if (data.metadata.duration) setDuration(data.metadata.duration)
                if (data.metadata.difficulty) setDifficulty(data.metadata.difficulty)
                if (data.metadata.prerequisites) setPrerequisites(data.metadata.prerequisites)
                if (data.metadata.objectives) setObjectives(data.metadata.objectives)
                if (data.metadata.takeaways) setTakeaways(data.metadata.takeaways)

                // Preserve all other specialized fields
                const { audience: _, duration: __, difficulty: ___, prerequisites: ____, objectives: _____, takeaways: ______, ...rest } = data.metadata
                setExtraMetadata(rest)
            }

        } catch (error) {
            console.error(error)
            alert("Error en análisis IA")
        } finally {
            setAiLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const method = initialWorkbook ? 'PUT' : 'POST'
        const url = initialWorkbook ? `/api/workbooks/${initialWorkbook.id}` : '/api/workbooks'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    status,
                    type,
                    driveId,
                    metadata: {
                        ...extraMetadata,
                        objectives: objectives.filter(o => o.trim()),
                        takeaways: takeaways.filter(o => o.trim()),
                        audience,
                        duration,
                        difficulty,
                        prerequisites
                    }
                })
            })

            if (!res.ok) throw new Error('Failed to save')
            onSuccess()
            onClose()
            router.refresh()

        } catch (error) {
            alert('Error al guardar el workbook')
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        if (!initialWorkbook) return
        window.open(`/api/workbooks/${initialWorkbook.id}/export`, '_blank')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-panel w-full max-w-4xl rounded-2xl border border-border shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">

                <button onClick={onClose} className="absolute top-6 right-6 text-text-muted hover:text-text-main transition-colors">
                    <X size={20} />
                </button>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-text-main mb-1 tracking-tight">
                            {initialWorkbook ? 'Editar Workbook' : 'Nuevo Workbook Educativo'}
                        </h2>
                        <p className="text-sm text-text-muted">
                            {initialWorkbook ? 'Edita los metadatos y contenido.' : 'Define la estructura pedagógica del nuevo material.'}
                        </p>
                    </div>
                    {initialWorkbook && (
                        <button
                            type="button"
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 font-bold text-xs hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
                        >
                            <Download size={14} />
                            Exportar / Imprimir
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Source & AI */}
                    <div className="bg-bg/50 p-4 rounded-xl border border-border space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Documento Fuente (Google Drive)</label>
                            <button
                                type="button"
                                onClick={handleAIAnalyze}
                                disabled={aiLoading || !driveId}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-white text-[10px] font-black tracking-wide hover:shadow-lg disabled:opacity-50 transition-all uppercase"
                            >
                                {aiLoading ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                {aiLoading ? "Analizando..." : "Auto-completar con IA"}
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-accent outline-none text-sm"
                                placeholder="Selecciona un archivo..."
                                value={driveLink}
                                readOnly
                            />
                            <button
                                type="button"
                                onClick={() => setIsDriveExplorerOpen(true)}
                                className="px-4 py-3 bg-panel border border-border rounded-xl text-text-main hover:border-accent transition-all flex items-center gap-2 text-xs font-bold"
                            >
                                <LinkIcon size={14} />
                                Explorar
                            </button>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Título</label>
                                <input
                                    type="text"
                                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-accent outline-none font-bold"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Tipo de Workbook</label>
                                    <select
                                        className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-main outline-none focus:ring-2 focus:ring-accent text-sm font-bold"
                                        value={type}
                                        onChange={e => setType(e.target.value)}
                                    >
                                        <option value="General">General</option>
                                        <option value="Workbook1">Workbook 1 — Metas & PDI</option>
                                        <option value="Workbook2">Workbook 2 — Autoconfianza</option>
                                        <option value="Workbook3">Workbook 3 — Comunicación</option>
                                        <option value="Workbook4">Workbook 4 — Networking</option>
                                        <option value="Workbook5">Workbook 5 — Serenidad</option>
                                        <option value="Workbook6">Workbook 6 — Autenticidad I</option>
                                        <option value="Workbook7">Workbook 7 — Autenticidad II</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Estado</label>
                                    <select
                                        className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-main outline-none focus:ring-2 focus:ring-accent text-sm"
                                        value={status}
                                        onChange={e => setStatus(e.target.value)}
                                    >
                                        <option value="Borrador">Borrador</option>
                                        <option value="Revisión">Revisión</option>
                                        <option value="Publicado">Publicado</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Descripción</label>
                            <textarea
                                className="w-full h-[124px] bg-bg border border-border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-accent outline-none resize-none"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Audiencia</label>
                            <input type="text" className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text-main text-sm" value={audience} onChange={e => setAudience(e.target.value)} placeholder="Ej: Managers" />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Duración</label>
                            <input type="text" className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text-main text-sm" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Ej: 60 min" />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Dificultad</label>
                            <select className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text-main text-sm outline-none" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                                <option value="Básico">Básico</option>
                                <option value="Intermedio">Intermedio</option>
                                <option value="Avanzado">Avanzado</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Prerrequisitos</label>
                            <input type="text" className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text-main text-sm" value={prerequisites} onChange={e => setPrerequisites(e.target.value)} placeholder="Ninguno" />
                        </div>
                    </div>

                    {/* Dynamic Specialized Fields */}
                    {type !== 'General' && (
                        <div className="pt-6 border-t border-border space-y-8 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                    <Sparkles size={16} />
                                </div>
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Estructura del {type}</h3>
                            </div>

                            {/* Workbook 1: Metas & PDI */}
                            {type === 'Workbook1' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Definición de Éxito</label>
                                            <textarea
                                                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm"
                                                value={extraMetadata.exitoFrase || ''}
                                                onChange={e => setExtraMetadata({ ...extraMetadata, exitoFrase: e.target.value })}
                                                placeholder="Frase que define el éxito..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Meta SMART Principal</label>
                                            <textarea
                                                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm"
                                                value={extraMetadata.metaSmart || ''}
                                                onChange={e => setExtraMetadata({ ...extraMetadata, metaSmart: e.target.value })}
                                                placeholder="Para finales de..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Plan 90 Días</label>
                                            <textarea
                                                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm h-[130px]"
                                                value={extraMetadata.acciones90 || ''}
                                                onChange={e => setExtraMetadata({ ...extraMetadata, acciones90: e.target.value })}
                                                placeholder="Acciones críticas..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Workbook 2: Autoconfianza */}
                            {type === 'Workbook2' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Emociones Hoy</label>
                                        <textarea
                                            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm"
                                            value={extraMetadata.emocionesHoy || ''}
                                            onChange={e => setExtraMetadata({ ...extraMetadata, emocionesHoy: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Creencias Limitantes</label>
                                        <textarea
                                            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm"
                                            value={extraMetadata.frasesLimitantes || ''}
                                            onChange={e => setExtraMetadata({ ...extraMetadata, frasesLimitantes: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Decisión Poderosa</label>
                                        <input
                                            type="text"
                                            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-bold text-accent"
                                            value={extraMetadata.decisionPoderosa || ''}
                                            onChange={e => setExtraMetadata({ ...extraMetadata, decisionPoderosa: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Workbook 3: Comunicación */}
                            {type === 'Workbook3' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Problema que resuelves</label>
                                            <textarea className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.insumos?.problema || ''} onChange={e => setExtraMetadata({ ...extraMetadata, insumos: { ...extraMetadata.insumos, problema: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Tu Diferencial</label>
                                            <textarea className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.insumos?.diferencial || ''} onChange={e => setExtraMetadata({ ...extraMetadata, insumos: { ...extraMetadata.insumos, diferencial: e.target.value } })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Elevator Speech (60s)</label>
                                        <textarea
                                            className="w-full bg-bg border border-border rounded-xl px-4 py-4 text-sm font-medium leading-relaxed"
                                            value={extraMetadata.elevatorCompleto || ''}
                                            onChange={e => setExtraMetadata({ ...extraMetadata, elevatorCompleto: e.target.value })}
                                            rows={5}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Workbook 4: Networking */}
                            {type === 'Workbook4' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Meta de Networking</label>
                                        <textarea className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.metaRel || ''} onChange={e => setExtraMetadata({ ...extraMetadata, metaRel: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Oferta de Valor</label>
                                        <textarea className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.valorRel || ''} onChange={e => setExtraMetadata({ ...extraMetadata, valorRel: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {/* Workbook 5: Serenidad */}
                            {type === 'Workbook5' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Triggers (Detonantes)</label>
                                        <textarea className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.triggers || ''} onChange={e => setExtraMetadata({ ...extraMetadata, triggers: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Patrón de Reacción</label>
                                        <textarea className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.patron || ''} onChange={e => setExtraMetadata({ ...extraMetadata, patron: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Reencuadre Cognitivo</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <textarea placeholder="Situación..." className="bg-bg border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.r1s || ''} onChange={e => setExtraMetadata({ ...extraMetadata, r1s: e.target.value })} />
                                            <textarea placeholder="Nueva pregunta..." className="bg-bg border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.r1r || ''} onChange={e => setExtraMetadata({ ...extraMetadata, r1r: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Workbook 6: Autenticidad I */}
                            {type === 'Workbook6' && (
                                <div className="space-y-6">
                                    <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                                        <label className="block text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2 text-center">Propósito Personal Transformador (PPT)</label>
                                        <textarea
                                            className="w-full bg-white border border-rose-200 rounded-xl px-5 py-4 text-lg font-black text-rose-900 text-center placeholder:text-rose-200"
                                            value={extraMetadata.proposito || ''}
                                            onChange={e => setExtraMetadata({ ...extraMetadata, propositos: e.target.value })}
                                            placeholder="Tu gran POR QUÉ..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Diferencial (USP)</label>
                                            <textarea className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.usp || ''} onChange={e => setExtraMetadata({ ...extraMetadata, usp: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Arquetipos</label>
                                            <input type="text" className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm mb-2" placeholder="Principal" value={extraMetadata.arq1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, arq1: e.target.value })} />
                                            <input type="text" className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm" placeholder="Secundario" value={extraMetadata.arq2 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, arq2: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Workbook 7: Autenticidad II */}
                            {type === 'Workbook7' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Canal 1</label>
                                            <input type="text" className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm" value={extraMetadata.v1c || ''} onChange={e => setExtraMetadata({ ...extraMetadata, v1c: e.target.value })} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Acción</label>
                                            <input type="text" className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm" value={extraMetadata.v1a || ''} onChange={e => setExtraMetadata({ ...extraMetadata, v1a: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Frecuencia</label>
                                            <input type="text" className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm" value={extraMetadata.v1f || ''} onChange={e => setExtraMetadata({ ...extraMetadata, v1f: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Ecosistema Externo</label>
                                            <textarea className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.ecosistemaExterno || ''} onChange={e => setExtraMetadata({ ...extraMetadata, ecosistemaExterno: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Meta de Ingreso</label>
                                            <input type="text" className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-bold text-indigo-600" value={extraMetadata.metaIngreso || ''} onChange={e => setExtraMetadata({ ...extraMetadata, metaIngreso: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    <div className="pt-6 border-t border-border flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-3 text-text-muted font-bold hover:text-text-main text-xs uppercase tracking-wide transition-colors">Cancelar</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl flex items-center gap-2 text-xs uppercase tracking-wide shadow-lg shadow-accent/20 transition-all hover:scale-105"
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            {initialWorkbook ? 'Guardar Cambios' : 'Crear Workbook'}
                        </button>
                    </div>

                </form>

                <DriveExplorerModal
                    isOpen={isDriveExplorerOpen}
                    onClose={() => setIsDriveExplorerOpen(false)}
                    onSelect={handleDriveSelect}
                />
            </div>
        </div>
    )
}
