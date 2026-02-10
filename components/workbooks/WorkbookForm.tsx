
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
    isStandalone?: boolean
}

export function WorkbookForm({ isOpen, onClose, onSuccess, initialWorkbook, isStandalone }: WorkbookFormProps) {
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
    const [activeSection, setActiveSection] = useState(0)

    // Section Definitions for each Workbook type
    const SECTIONS = {
        'Workbook1': [
            { id: 'exito', label: '1. Éxito' },
            { id: 'rueda', label: '2. Rueda' },
            { id: 'smart', label: '3. SMART' },
            { id: 'carrera', label: '4. Carrera' },
            { id: 'brechas', label: '5. Brechas' },
            { id: 'pdei', label: '6. PDEI' },
            { id: '90dias', label: '7. 90 Días' }
        ],
        'Workbook2': [
            { id: 'emociones', label: '1. Emociones' },
            { id: 'identidad', label: '2. Identidad' },
            { id: 'creencias', label: '3. Creencias' },
            { id: 'dofa', label: '4. DOFA' },
            { id: 'decision', label: '5. Decisión' }
        ],
        'Workbook3': [
            { id: 'insumos', label: '1. Insumos' },
            { id: 'speech', label: '2. Speech' },
            { id: 'habitos', label: '3. Hábitos' }
        ],
        'Workbook4': [
            { id: 'perfil', label: '1. Perfil' },
            { id: 'miedos', label: '2. Miedos' },
            { id: 'mapa', label: '3. Mapa' },
            { id: 'accion', label: '4. Acción' }
        ],
        'Workbook5': [
            { id: 'termometro', label: '1. Termómetro' },
            { id: 'triggers', label: '2. Triggers' },
            { id: 'reencuadre', label: '3. Reencuadre' },
            { id: 'habitos', label: '4. Hábitos' }
        ],
        'Workbook6': [
            { id: 'ppt', label: '1. Propósito' },
            { id: 'promesa', label: '2. Promesa' },
            { id: 'audiencia', label: '3. Audiencia' },
            { id: 'usp', label: '4. USP' },
            { id: 'personalidad', label: '5. Personalidad' },
            { id: 'arquetipos', label: '6. Arquetipos' }
        ],
        'Workbook7': [
            { id: 'ecosistemas', label: '1. Ecosistemas' },
            { id: 'visibilidad', label: '2. Visibilidad' },
            { id: 'oferta', label: '3. Oferta' },
            { id: 'monetizacion', label: '4. Monetización' },
            { id: 'plan', label: '5. Plan 30-60-90' }
        ]
    }

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
            const result = await res.json()

            if (method === 'POST') {
                window.location.href = `/workbooks/${result.slug || result.id}`
            } else {
                onSuccess()
                if (!isStandalone) onClose()
                router.refresh()
            }

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

    if (!isOpen && !isStandalone) return null

    const content = (
        <div className={`bg-panel w-full max-w-4xl rounded-2xl border border-border shadow-2xl p-8 relative ${!isStandalone ? 'animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto' : ''}`}>

            {!isStandalone && (
                <button onClick={onClose} className="absolute top-6 right-6 text-text-muted hover:text-text-main transition-colors">
                    <X size={20} />
                </button>
            )}

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
                                    onChange={e => {
                                        setType(e.target.value)
                                        setActiveSection(0)
                                    }}
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
                {type !== 'General' && SECTIONS[type as keyof typeof SECTIONS] && (
                    <div className="pt-6 border-t border-border space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                    <Sparkles size={16} />
                                </div>
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Estructura del {type}</h3>
                            </div>
                            <div className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                                Página {activeSection + 1} de {SECTIONS[type as keyof typeof SECTIONS].length}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Section Navigation */}
                            <div className="flex md:flex-col gap-1 overflow-x-auto md:w-48 pb-2 md:pb-0">
                                {SECTIONS[type as keyof typeof SECTIONS].map((sec, idx) => (
                                    <button
                                        key={sec.id}
                                        type="button"
                                        onClick={() => setActiveSection(idx)}
                                        className={`
                                                whitespace-nowrap px-4 py-2 rounded-xl text-left text-xs font-bold transition-all
                                                ${activeSection === idx
                                                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                                : 'hover:bg-bg/80 text-text-muted hover:text-text-main'}
                                            `}
                                    >
                                        {sec.label}
                                    </button>
                                ))}
                            </div>

                            {/* Section Content Area */}
                            <div className="flex-1 bg-bg/30 p-6 rounded-2xl border border-border min-h-[300px]">

                                {/* Workbook 1 Sections */}
                                {type === 'Workbook1' && (
                                    <div className="space-y-6">
                                        {activeSection === 0 && ( /* Exito */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Definición de Éxito</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm min-h-[100px]" value={extraMetadata.exitoFrase || ''} onChange={e => setExtraMetadata({ ...extraMetadata, exitoFrase: e.target.value })} placeholder="Tu frase personal..." />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Evidencia Observable</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm min-h-[100px]" value={extraMetadata.exitoEvidencia || ''} onChange={e => setExtraMetadata({ ...extraMetadata, exitoEvidencia: e.target.value })} placeholder="¿Cómo sabrás que lo lograste?" />
                                                </div>
                                            </div>
                                        )}

                                        {activeSection === 1 && ( /* Rueda */
                                            <div className="grid grid-cols-2 gap-4">
                                                {['Salud', 'Finanzas', 'Relaciones', 'Familia', 'Trabajo', 'Contribución', 'Espíritu', 'Diversión'].map((area, i) => (
                                                    <div key={area} className="space-y-1">
                                                        <div className="flex justify-between">
                                                            <label className="text-[9px] font-bold text-text-muted uppercase">{area}</label>
                                                            <span className="text-[10px] font-mono text-accent">{(extraMetadata.wheel?.[i] || 50)}%</span>
                                                        </div>
                                                        <input
                                                            type="range" min="0" max="100"
                                                            className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                                                            value={extraMetadata.wheel?.[i] || 50}
                                                            onChange={e => {
                                                                const newWheel = [...(extraMetadata.wheel || [50, 50, 50, 50, 50, 50, 50, 50])]
                                                                newWheel[i] = parseInt(e.target.value)
                                                                setExtraMetadata({ ...extraMetadata, wheel: newWheel })
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeSection === 2 && ( /* SMART */
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Meta SMART</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-full min-h-[80px]" value={extraMetadata.metaSmart || ''} onChange={e => setExtraMetadata({ ...extraMetadata, metaSmart: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Meta Cualitativa</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-full min-h-[80px]" value={extraMetadata.metaCual || ''} onChange={e => setExtraMetadata({ ...extraMetadata, metaCual: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Checklist SMART</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.smartCheck || ''} onChange={e => setExtraMetadata({ ...extraMetadata, smartCheck: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Brecha / Gap</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.brecha || ''} onChange={e => setExtraMetadata({ ...extraMetadata, brecha: e.target.value })} />
                                                </div>
                                            </div>
                                        )}

                                        {activeSection === 3 && ( /* Carrera */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">A 1 Año</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.c1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, c1: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">A 3 Años</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.c3 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, c3: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">A 5 Años</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.c5 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, c5: e.target.value })} />
                                                </div>
                                            </div>
                                        )}

                                        {activeSection === 4 && ( /* Brechas */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Brecha de Conocimiento / Skill</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.g1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, g1: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Brecha de Mindset / Creencia</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.g2 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, g2: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Brecha de Redes / Entorno</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.g3 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, g3: e.target.value })} />
                                                </div>
                                            </div>
                                        )}

                                        {activeSection === 5 && ( /* PDEI */
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Hábito 1 (Detonante/Acción)</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.hab1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, hab1: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Hábito 2</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.hab2 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, hab2: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Acciones Clave del PDEI</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.pdeiAcciones || ''} onChange={e => setExtraMetadata({ ...extraMetadata, pdeiAcciones: e.target.value })} />
                                                </div>
                                            </div>
                                        )}

                                        {activeSection === 6 && ( /* 90 Dias */
                                            <div>
                                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Plan de Acción (Próximos 90 Días)</label>
                                                <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[250px]" value={extraMetadata.acciones90 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, acciones90: e.target.value })} placeholder="Metas volantes y fechas clave..." />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Workbook 2 Sections */}
                                {type === 'Workbook2' && (
                                    <div className="space-y-6">
                                        {activeSection === 0 && ( /* Emociones */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Emociones Hoy</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.emocionesHoy || ''} onChange={e => setExtraMetadata({ ...extraMetadata, emocionesHoy: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Anhelo vs Evitación</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.emocionAnhelo || ''} onChange={e => setExtraMetadata({ ...extraMetadata, emocionAnhelo: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 1 && ( /* Identidad */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Auto-definición (10 palabras)</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.autodefinicion10 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, autodefinicion10: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Asociaciones de Éxito</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.asociacionesExito || ''} onChange={e => setExtraMetadata({ ...extraMetadata, asociacionesExito: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 2 && ( /* Creencias */
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Frases Limitantes</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[120px]" value={extraMetadata.frasesLimitantes || ''} onChange={e => setExtraMetadata({ ...extraMetadata, frasesLimitantes: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Lenguaje Transformador</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[120px]" value={extraMetadata.lenguajeTransformador || ''} onChange={e => setExtraMetadata({ ...extraMetadata, lenguajeTransformador: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Costo de Inacción</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.perdidasCreencia || ''} onChange={e => setExtraMetadata({ ...extraMetadata, perdidasCreencia: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Beneficios del Cambio</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.beneficiosNuevas || ''} onChange={e => setExtraMetadata({ ...extraMetadata, beneficiosNuevas: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 3 && ( /* DOFA */
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Fortalezas</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-2 text-xs" rows={4} value={extraMetadata.dofa_fortalezas || ''} onChange={e => setExtraMetadata({ ...extraMetadata, dofa_fortalezas: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Oportunidades</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-2 text-xs" rows={4} value={extraMetadata.dofa_oportunidades || ''} onChange={e => setExtraMetadata({ ...extraMetadata, dofa_oportunidades: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Debilidades</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-2 text-xs" rows={4} value={extraMetadata.dofa_debilidades || ''} onChange={e => setExtraMetadata({ ...extraMetadata, dofa_debilidades: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Amenazas</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-2 text-xs" rows={4} value={extraMetadata.dofa_amenazas || ''} onChange={e => setExtraMetadata({ ...extraMetadata, dofa_amenazas: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 4 && ( /* Decisión */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Decisión Poderosa</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm font-bold text-accent" value={extraMetadata.decisionPoderosa || ''} onChange={e => setExtraMetadata({ ...extraMetadata, decisionPoderosa: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Impacto en mi Vida</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.comoCambioVida || ''} onChange={e => setExtraMetadata({ ...extraMetadata, comoCambioVida: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Workbook 3 Sections */}
                                {type === 'Workbook3' && (
                                    <div className="space-y-6">
                                        {activeSection === 0 && ( /* Insumos */
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Problema que resuelves</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.problema || ''} onChange={e => setExtraMetadata({ ...extraMetadata, problema: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Tu Diferencial</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.diferencial || ''} onChange={e => setExtraMetadata({ ...extraMetadata, diferencial: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Mercado / Nicho</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.mercado || ''} onChange={e => setExtraMetadata({ ...extraMetadata, mercado: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Metodología / Cómo</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.metodologia || ''} onChange={e => setExtraMetadata({ ...extraMetadata, metodologia: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 1 && ( /* Speech */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Elevator Speech Completo</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[120px] font-medium" value={extraMetadata.elevatorCompleto || ''} onChange={e => setExtraMetadata({ ...extraMetadata, elevatorCompleto: e.target.value })} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[9px] font-bold text-text-muted uppercase mb-1">Historia STAR</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-3 py-2 text-xs" rows={2} value={extraMetadata.historia || ''} onChange={e => setExtraMetadata({ ...extraMetadata, historia: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-bold text-text-muted uppercase mb-1">Call to Action (CTA)</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-3 py-2 text-xs" rows={2} value={extraMetadata.cta || ''} onChange={e => setExtraMetadata({ ...extraMetadata, cta: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 2 && ( /* Habitos */
                                            <div className="space-y-4">
                                                <div className="bg-panel p-4 rounded-xl border border-border">
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Hábito 1: Comunicación</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <input type="text" placeholder="¿Qué harás?" className="bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.hab1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, hab1: e.target.value })} />
                                                        <input type="text" placeholder="Acción concreta..." className="bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.accionHab1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, accionHab1: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="bg-panel p-4 rounded-xl border border-border">
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Hábito 2: Comunicación</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <input type="text" placeholder="¿Qué harás?" className="bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.hab2 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, hab2: e.target.value })} />
                                                        <input type="text" placeholder="Acción concreta..." className="bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.accionHab2 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, accionHab2: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Workbook 4 Sections */}
                                {type === 'Workbook4' && (
                                    <div className="space-y-6">
                                        {activeSection === 0 && ( /* Perfil */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Meta de Networking / Relaciones</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.metaRel || ''} onChange={e => setExtraMetadata({ ...extraMetadata, metaRel: e.target.value })} placeholder="¿Qué buscas lograr con tu red?" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Oferta de Valor Relevante</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.valorRel || ''} onChange={e => setExtraMetadata({ ...extraMetadata, valorRel: e.target.value })} placeholder="¿Cómo ayudas a los demás?" />
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 1 && ( /* Miedos */
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Peor Escenario (Miedo 1)</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.miedo1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, miedo1: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Racionalización (Miedo 2)</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.miedo2 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, miedo2: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 2 && ( /* Mapa */
                                            <div className="space-y-4">
                                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Lista de Contactos Estratégicos</label>
                                                <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-xs h-[100px]" value={extraMetadata.contacts || ''} onChange={e => setExtraMetadata({ ...extraMetadata, contacts: e.target.value })} placeholder="Nombre, Rol, Interés/Poder..." />
                                            </div>
                                        )}
                                        {activeSection === 3 && ( /* Accion */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Plan de Activación de Red</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[200px]" value={extraMetadata.activation || ''} onChange={e => setExtraMetadata({ ...extraMetadata, activation: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Workbook 5 Sections */}
                                {type === 'Workbook5' && (
                                    <div className="space-y-6">
                                        {activeSection === 0 && ( /* Termómetro */
                                            <div className="space-y-4">
                                                <p className="text-[10px] text-text-muted italic">Mapea 3 emociones clave y su evolución esperativa.</p>
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="grid grid-cols-3 gap-3 p-3 bg-panel rounded-xl border border-border">
                                                        <div>
                                                            <label className="text-[9px] font-bold text-text-muted uppercase">Emoción {i}</label>
                                                            <input type="text" className="w-full bg-bg border border-border rounded-lg px-2 py-1 text-xs" value={extraMetadata[`emo${i}`] || ''} onChange={e => setExtraMetadata({ ...extraMetadata, [`emo${i}`]: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold text-text-muted uppercase">Intensidad</label>
                                                            <input type="text" className="w-full bg-bg border border-border rounded-lg px-2 py-1 text-xs" value={extraMetadata[`emo${i}i`] || ''} onChange={e => setExtraMetadata({ ...extraMetadata, [`emo${i}i`]: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold text-text-muted uppercase">Nueva Intensidad</label>
                                                            <input type="text" className="w-full bg-bg border border-border rounded-lg px-2 py-1 text-xs" value={extraMetadata[`emo${i}n`] || ''} onChange={e => setExtraMetadata({ ...extraMetadata, [`emo${i}n`]: e.target.value })} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {activeSection === 1 && ( /* Triggers */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Triggers (Detonantes)</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.triggers || ''} onChange={e => setExtraMetadata({ ...extraMetadata, triggers: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Patrón de Reacción</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.patron || ''} onChange={e => setExtraMetadata({ ...extraMetadata, patron: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 2 && ( /* Reencuadre */
                                            <div className="space-y-4">
                                                <div className="p-4 bg-panel rounded-xl border border-border space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-text-muted uppercase">Situación + Pensamiento Automático</label>
                                                            <textarea className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" rows={2} value={extraMetadata.r1s || ''} onChange={e => setExtraMetadata({ ...extraMetadata, r1s: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-text-muted uppercase">Nueva Pregunta / Reencuadre</label>
                                                            <textarea className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" rows={2} value={extraMetadata.r1r || ''} onChange={e => setExtraMetadata({ ...extraMetadata, r1r: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-text-muted uppercase">Emoción Original</label>
                                                            <input type="text" className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.r1e || ''} onChange={e => setExtraMetadata({ ...extraMetadata, r1e: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-text-muted uppercase">Nueva Acción</label>
                                                            <input type="text" className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.r1a || ''} onChange={e => setExtraMetadata({ ...extraMetadata, r1a: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 3 && ( /* Habitos */
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Ancla Física</label>
                                                        <input type="text" className="w-full bg-panel border border-border rounded-xl px-4 py-2 text-sm" value={extraMetadata.ancla1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, ancla1: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Ancla Mental</label>
                                                        <input type="text" className="w-full bg-panel border border-border rounded-xl px-4 py-2 text-sm" value={extraMetadata.ancla2 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, ancla2: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="bg-panel p-4 rounded-xl border border-border">
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Micro-hábito de Calma</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input type="text" placeholder="Hábito..." className="bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.h1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, h1: e.target.value })} />
                                                        <input type="text" placeholder="Señal..." className="bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.h1t || ''} onChange={e => setExtraMetadata({ ...extraMetadata, h1t: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Workbook 6 Sections */}
                                {type === 'Workbook6' && (
                                    <div className="space-y-6">
                                        {activeSection === 0 && ( /* Propósito */
                                            <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 space-y-4">
                                                <label className="block text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 text-center">Propósito Personal Transformador (PPT)</label>
                                                <textarea
                                                    className="w-full bg-white border border-rose-200 rounded-xl px-5 py-4 text-lg font-black text-rose-900 text-center placeholder:text-rose-200"
                                                    value={extraMetadata.proposito || ''}
                                                    onChange={e => setExtraMetadata({ ...extraMetadata, proposito: e.target.value })}
                                                    placeholder="Tu gran POR QUÉ..."
                                                />
                                            </div>
                                        )}
                                        {activeSection === 1 && ( /* Promesa */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Nuestra Causa</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.causa || ''} onChange={e => setExtraMetadata({ ...extraMetadata, causa: e.target.value })} />
                                                </div>
                                                <div className="bg-panel p-4 rounded-xl border border-border space-y-3">
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Promesa de Valor</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[9px] font-bold text-text-muted uppercase">Estado Inicial (Antes)</label>
                                                            <textarea className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" rows={2} value={extraMetadata.antes1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, antes1: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold text-text-muted uppercase">Estado Final (Después)</label>
                                                            <textarea className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" rows={2} value={extraMetadata.despues1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, despues1: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[9px] font-bold text-text-muted uppercase">Método</label>
                                                            <input type="text" className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.metodo1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, metodo1: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold text-text-muted uppercase">Prueba / Evidencia</label>
                                                            <input type="text" className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.prueba1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, prueba1: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 2 && ( /* Audiencia */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Necesidad Profunda</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.necesidadAudiencia || ''} onChange={e => setExtraMetadata({ ...extraMetadata, necesidadAudiencia: e.target.value })} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Miedos de la Audiencia</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-xs" rows={4} value={extraMetadata.miedosAudiencia || ''} onChange={e => setExtraMetadata({ ...extraMetadata, miedosAudiencia: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Valores de la Audiencia</label>
                                                        <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-xs" rows={4} value={extraMetadata.valoresAudiencia || ''} onChange={e => setExtraMetadata({ ...extraMetadata, valoresAudiencia: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 3 && ( /* USP */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Diferencial (USP)</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.usp || ''} onChange={e => setExtraMetadata({ ...extraMetadata, usp: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Evidencia del USP</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.pruebasUsp || ''} onChange={e => setExtraMetadata({ ...extraMetadata, pruebasUsp: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 4 && ( /* Personalidad */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Límites de Personalidad</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.personalidadLimites || ''} onChange={e => setExtraMetadata({ ...extraMetadata, personalidadLimites: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Mini Bio (Brand Story)</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm min-h-[150px]" value={extraMetadata.historia || ''} onChange={e => setExtraMetadata({ ...extraMetadata, historia: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 5 && ( /* Arquetipos */
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                                    <label className="block text-[10px] font-black text-rose-600 uppercase mb-2">Arquetipo Principal</label>
                                                    <input type="text" className="w-full bg-white border border-rose-200 rounded-lg px-3 py-2 text-sm font-bold text-rose-900" value={extraMetadata.arq1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, arq1: e.target.value })} />
                                                </div>
                                                <div className="p-4 bg-panel rounded-2xl border border-border">
                                                    <label className="block text-[10px] font-black text-text-muted uppercase mb-2">Arquetipo Secundario</label>
                                                    <input type="text" className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm font-bold text-text-main" value={extraMetadata.arq2 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, arq2: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Workbook 7 Sections */}
                                {type === 'Workbook7' && (
                                    <div className="space-y-6">
                                        {activeSection === 0 && ( /* Ecosistemas */
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Ecosistemas Relevantes</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.ecosistemas || ''} onChange={e => setExtraMetadata({ ...extraMetadata, ecosistemas: e.target.value })} placeholder="Uno por línea..." />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Aliados Estratégicos</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm h-[100px]" value={extraMetadata.aliados || ''} onChange={e => setExtraMetadata({ ...extraMetadata, aliados: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 1 && ( /* Canales */
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-panel p-4 rounded-xl border border-border space-y-2">
                                                        <label className="block text-[10px] font-black text-text-muted uppercase mb-1">Canal 1</label>
                                                        <input type="text" placeholder="Canal..." className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.v1c || ''} onChange={e => setExtraMetadata({ ...extraMetadata, v1c: e.target.value })} />
                                                        <input type="text" placeholder="Acción..." className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.v1a || ''} onChange={e => setExtraMetadata({ ...extraMetadata, v1a: e.target.value })} />
                                                    </div>
                                                    <div className="bg-panel p-4 rounded-xl border border-border space-y-2">
                                                        <label className="block text-[10px] font-black text-text-muted uppercase mb-1">Canal 2</label>
                                                        <input type="text" placeholder="Canal..." className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.v2c || ''} onChange={e => setExtraMetadata({ ...extraMetadata, v2c: e.target.value })} />
                                                        <input type="text" placeholder="Acción..." className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.v2a || ''} onChange={e => setExtraMetadata({ ...extraMetadata, v2a: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Mensaje Central</label>
                                                    <textarea className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.mensajeCentral || ''} onChange={e => setExtraMetadata({ ...extraMetadata, mensajeCentral: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 2 && ( /* Propuesta */
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="bg-panel p-3 rounded-xl border border-border">
                                                        <label className="block text-[9px] font-bold text-text-muted uppercase mb-1">Nivel Básico</label>
                                                        <input type="text" placeholder="Promesa..." className="w-full bg-bg border border-border rounded-lg px-2 py-1 text-[10px]" value={extraMetadata.of1r || ''} onChange={e => setExtraMetadata({ ...extraMetadata, of1r: e.target.value })} />
                                                        <input type="text" placeholder="Precio..." className="w-full bg-bg border border-border rounded-lg px-2 py-1 text-[10px] mt-1" value={extraMetadata['of1$'] || ''} onChange={e => setExtraMetadata({ ...extraMetadata, 'of1$': e.target.value })} />
                                                    </div>
                                                    <div className="bg-panel p-3 rounded-xl border border-border">
                                                        <label className="block text-[9px] font-bold text-text-muted uppercase mb-1">Intermedio</label>
                                                        <input type="text" placeholder="Promesa..." className="w-full bg-bg border border-border rounded-lg px-2 py-1 text-[10px]" value={extraMetadata.of2r || ''} onChange={e => setExtraMetadata({ ...extraMetadata, of2r: e.target.value })} />
                                                        <input type="text" placeholder="Precio..." className="w-full bg-bg border border-border rounded-lg px-2 py-1 text-[10px] mt-1" value={extraMetadata['of2$'] || ''} onChange={e => setExtraMetadata({ ...extraMetadata, 'of2$': e.target.value })} />
                                                    </div>
                                                    <div className="bg-panel p-3 rounded-xl border border-border">
                                                        <label className="block text-[9px] font-bold text-text-muted uppercase mb-1">Premium</label>
                                                        <input type="text" placeholder="Promesa..." className="w-full bg-bg border border-border rounded-lg px-2 py-1 text-[10px]" value={extraMetadata.of3r || ''} onChange={e => setExtraMetadata({ ...extraMetadata, of3r: e.target.value })} />
                                                        <input type="text" placeholder="Precio..." className="w-full bg-bg border border-border rounded-lg px-2 py-1 text-[10px] mt-1" value={extraMetadata['of3$'] || ''} onChange={e => setExtraMetadata({ ...extraMetadata, 'of3$': e.target.value })} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">Ruta de Monetización</label>
                                                    <input type="text" className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm" value={extraMetadata.ruta || ''} onChange={e => setExtraMetadata({ ...extraMetadata, ruta: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                        {activeSection === 3 && ( /* Plan */
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="p-4 bg-panel rounded-2xl border border-border">
                                                        <label className="block text-[10px] font-black text-text-muted uppercase mb-2">30 Días</label>
                                                        <textarea placeholder="Acciones..." className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs mb-2" rows={3} value={extraMetadata.p30a1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, p30a1: e.target.value })} />
                                                        <input type="text" placeholder="Meta..." className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.p30r || ''} onChange={e => setExtraMetadata({ ...extraMetadata, p30r: e.target.value })} />
                                                    </div>
                                                    <div className="p-4 bg-panel rounded-2xl border border-border">
                                                        <label className="block text-[10px] font-black text-text-muted uppercase mb-2">60 Días</label>
                                                        <textarea placeholder="Acciones..." className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs mb-2" rows={3} value={extraMetadata.p60a1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, p60a1: e.target.value })} />
                                                        <input type="text" placeholder="Meta..." className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.p60r || ''} onChange={e => setExtraMetadata({ ...extraMetadata, p60r: e.target.value })} />
                                                    </div>
                                                    <div className="p-4 bg-panel rounded-2xl border border-border">
                                                        <label className="block text-[10px] font-black text-text-muted uppercase mb-2">90 Días</label>
                                                        <textarea placeholder="Acciones..." className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs mb-2" rows={3} value={extraMetadata.p90a1 || ''} onChange={e => setExtraMetadata({ ...extraMetadata, p90a1: e.target.value })} />
                                                        <input type="text" placeholder="Meta..." className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs" value={extraMetadata.p90r || ''} onChange={e => setExtraMetadata({ ...extraMetadata, p90r: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

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
    )

    if (isStandalone) return content

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            {content}
        </div>
    )
}
