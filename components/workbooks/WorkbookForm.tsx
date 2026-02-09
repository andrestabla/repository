
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

                    {/* Dynamic Lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Objectives */}
                        <div className="bg-bg/30 p-4 rounded-xl border border-border">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Objetivos de Aprendizaje</label>
                                <button type="button" onClick={() => addListItem(setObjectives, objectives)} className="text-accent hover:bg-accent/10 p-1 rounded"><Plus size={14} /></button>
                            </div>
                            <div className="space-y-2">
                                {objectives.map((obj, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-text-muted text-xs font-mono pt-2">{i + 1}.</span>
                                        <input
                                            type="text"
                                            className="flex-1 bg-panel border border-border rounded-lg px-3 py-1.5 text-sm text-text-main focus:ring-1 focus:ring-accent outline-none"
                                            value={obj}
                                            onChange={e => handleListChange(i, e.target.value, setObjectives, objectives)}
                                            placeholder="Verbo de acción + resultado..."
                                        />
                                        <button type="button" onClick={() => removeListItem(i, setObjectives, objectives)} className="text-text-muted hover:text-red-500"><Trash size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Takeaways */}
                        <div className="bg-bg/30 p-4 rounded-xl border border-border">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Key Takeaways</label>
                                <button type="button" onClick={() => addListItem(setTakeaways, takeaways)} className="text-accent hover:bg-accent/10 p-1 rounded"><Plus size={14} /></button>
                            </div>
                            <div className="space-y-2">
                                {takeaways.map((item, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-text-muted text-xs font-mono pt-2">•</span>
                                        <input
                                            type="text"
                                            className="flex-1 bg-panel border border-border rounded-lg px-3 py-1.5 text-sm text-text-main focus:ring-1 focus:ring-accent outline-none"
                                            value={item}
                                            onChange={e => handleListChange(i, e.target.value, setTakeaways, takeaways)}
                                            placeholder="Punto clave..."
                                        />
                                        <button type="button" onClick={() => removeListItem(i, setTakeaways, takeaways)} className="text-text-muted hover:text-red-500"><Trash size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

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
