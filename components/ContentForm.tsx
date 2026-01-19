'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Fingerprint,
    Brain,
    Rocket,
    Zap,
    Users,
    Scale,
    FileText,
    Search,
    X,
    Cloud,
    Folder,
    Sparkles,
    CheckCircle2,
    ExternalLink,
    Loader2,
    Database,
    Tag,
    Clock,
    Globe,
    BookOpen,
    Terminal,
    ShieldCheck,
    Lock as LockIcon,
    History as HistoryIcon,
    ChevronRight,
    ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'

// --- TYPES ---
export type ResearchSource = {
    id: string
    title: string
    url?: string | null
    summary?: string | null
    keyConcepts?: string | null
    competence?: string | null
    geographicCoverage?: string | null
    populationParams?: string | null
    driveId?: string | null
    findings?: string | null
    pillars?: string[]
}

export type ContentItem = {
    id: string
    title: string
    type: string
    format?: string | null
    language?: string | null
    duration?: string | null
    year?: string | null
    source?: string | null

    pillar?: string // Legacy or temporary
    primaryPillar: string
    secondaryPillars: string[]
    sub?: string | null
    competence?: string | null
    behavior?: string | null
    maturity?: string | null // replacing level

    intervention?: string | null
    moment?: string | null
    prereqId?: string | null
    testId?: string | null
    variable?: string | null
    impactScore?: boolean | null
    outcomeType?: string | null

    trigger?: string | null
    recommendation?: string | null
    challengeType?: string | null
    evidenceRequired?: string | null
    nextContentId?: string | null

    targetRole?: string | null
    roleLevel?: string | null
    industry?: string | null
    vipUsage?: boolean | null
    publicVisibility?: boolean | null

    ipOwner?: string | null
    ipType?: string | null
    authorizedUse?: string | null
    confidentiality?: string | null
    reuseExternal?: boolean | null

    ip?: string | null // Legacy support
    level?: string | null // Legacy support

    driveId?: string | null
    version: string
    observations?: string | null
    transcription?: string | null

    status: string
    completeness: number
    createdAt?: Date | string
}

type DriveFile = {
    id: string
    name: string
    mimeType: string
}

type Props = {
    initialData?: ContentItem | null
    onClose: () => void
    onSave: () => void
    readOnly?: boolean
}

const TABS = [
    { id: 'identity', label: 'Identificación', icon: <Fingerprint size={14} /> },
    { id: 'classification', label: 'Clasificación', icon: <Brain size={14} /> },
    { id: 'trajectory', label: 'Trayectoria', icon: <Rocket size={14} /> },
    { id: 'activation', label: 'Activación', icon: <Zap size={14} /> },
    { id: 'audience', label: 'Audiencia', icon: <Users size={14} /> },
    { id: 'governance', label: 'Gob & IP', icon: <Scale size={14} /> },
    { id: 'context', label: 'Contexto', icon: <FileText size={14} /> },
    { id: 'transcription', label: 'Transcripción', icon: <Terminal size={14} /> },
]

// --- EXTRACTED COMPONENTS ---
const FormInput = ({ label, value, onChange, placeholder, icon, width = 'full', disabled = false, readOnly = false }: any) => (
    <div className={width === 'half' ? 'col-span-1' : 'col-span-2'}>
        <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mb-2 pl-1 italic">{label}</label>
        <div className="relative group">
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50 group-hover:text-accent transition-colors">{icon}</div>}
            <input
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className={`w-full bg-bg border-2 border-border rounded-xl p-3 text-sm text-text-main focus:border-accent outline-none transition-all ${icon ? 'pl-10' : ''} ${(disabled || readOnly) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:border-border/80'}`}
                placeholder={!readOnly ? placeholder : ''}
                disabled={disabled || readOnly}
            />
        </div>
    </div>
)

const FormMultiSelect = ({ label, value = [], onChange, options, readOnly = false }: any) => {
    const toggleOption = (opt: string) => {
        if (readOnly) return
        const newValues = value.includes(opt)
            ? value.filter((v: string) => v !== opt)
            : [...value, opt]
        onChange(newValues)
    }

    return (
        <div className="col-span-2">
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mb-3 pl-1 italic">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map((opt: string) => (
                    <button
                        key={opt}
                        onClick={() => toggleOption(opt)}
                        disabled={readOnly}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${value.includes(opt)
                            ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                            : 'bg-bg border-border text-text-muted hover:border-accent/40'
                            } ${readOnly ? 'cursor-default opacity-80' : ''}`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    )
}

const FormSelect = ({ label, value, onChange, options, icon, width = 'half', readOnly = false }: any) => (
    <div className={width === 'half' ? 'col-span-1' : 'col-span-2'}>
        <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mb-2 pl-1 italic">{label}</label>
        <div className="relative group">
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50 group-hover:text-accent transition-colors">{icon}</div>}
            <select
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                disabled={readOnly}
                className={`w-full bg-panel border-2 border-border rounded-xl p-3 text-sm text-text-main outline-none focus:border-accent transition-all appearance-none ${!readOnly ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${icon ? 'pl-10' : ''}`}
            >
                <option value="">{readOnly ? '' : 'Seleccionar...'}</option>
                {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
            {!readOnly && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted/40 group-hover:text-accent transition-colors">
                    <ChevronDown size={14} />
                </div>
            )}
        </div>
    </div>
)

export default function ContentForm({ initialData, onClose, onSave, readOnly = false }: Props) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('identity')

    const [formData, setFormData] = useState<Partial<ContentItem>>({
        id: '', title: '', type: 'PDF', version: 'v1.0', status: 'Borrador', completeness: 0,
        primaryPillar: 'Transversal', secondaryPillars: [], maturity: 'Básico', ipOwner: 'Propio',
        ...initialData
    })

    const isEdit = !!initialData

    // Drive Picker State
    const [showPicker, setShowPicker] = useState(false)
    const [pickerFiles, setPickerFiles] = useState<DriveFile[]>([])
    const [loadingPicker, setLoadingPicker] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)

    // Folder Navigation State
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [folderHistory, setFolderHistory] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'Inicio' }])

    // Derived States
    const [driveStatus, setDriveStatus] = useState<'idle' | 'validating' | 'valid'>('idle')
    const [isUploading, setIsUploading] = useState(false)

    // Taxonomy State
    const [taxonomyTree, setTaxonomyTree] = useState<any[]>([])
    const [pillarOptions, setPillarOptions] = useState<string[]>([])
    const [subOptions, setSubOptions] = useState<string[]>([])
    const [competenceOptions, setCompetenceOptions] = useState<string[]>([])
    const [behaviorOptions, setBehaviorOptions] = useState<string[]>([])

    // Fetch Taxonomy Tree
    useEffect(() => {
        fetch('/api/taxonomy/tree')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTaxonomyTree(data)
                    setPillarOptions(data.map((p: any) => p.name))
                }
            })
            .catch(err => console.error('Failed to load taxonomy:', err))
    }, [])

    // Cascading Logic
    useEffect(() => {
        if (!taxonomyTree.length) return

        // 1. Get current Pillar Node
        const currentPillarNode = taxonomyTree.find(p => p.name === formData.primaryPillar)

        if (currentPillarNode) {
            // Update Sub Options
            const subs = currentPillarNode.children?.map((c: any) => c.name) || []
            setSubOptions(subs)

            // 2. Get current Sub Node (if selected)
            const currentSubNode = currentPillarNode.children?.find((c: any) => c.name === formData.sub)

            if (currentSubNode) {
                // Update Comp Options
                const comps = currentSubNode.children?.map((c: any) => c.name) || []
                setCompetenceOptions(comps)

                // 3. Get current Comp Node (if selected)
                const currentCompNode = currentSubNode.children?.find((c: any) => c.name === formData.competence)

                if (currentCompNode) {
                    // Update Behavior Options
                    const behaviors = currentCompNode.children?.map((c: any) => c.name) || []
                    setBehaviorOptions(behaviors)
                } else {
                    setBehaviorOptions([])
                }

            } else {
                setCompetenceOptions([])
                setBehaviorOptions([])
            }
        } else {
            setSubOptions([])
            setCompetenceOptions([])
            setBehaviorOptions([])
        }
    }, [taxonomyTree, formData.primaryPillar, formData.sub, formData.competence])

    useEffect(() => {
        if (formData.driveId) setDriveStatus('valid')
    }, [formData.driveId])

    // --- HANDLERS ---
    const handleSaveInternal = async (overrideStatus?: string) => {
        try {
            const payload = { ...formData, status: overrideStatus || formData.status }
            const res = await fetch('/api/inventory/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (res.ok) onSave()
            else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) { alert('Network Error') }
    }

    const fetchDriveFiles = async (folderId?: string) => {
        setLoadingPicker(true)
        try {
            const url = folderId ? `/api/inventory/drive-files?folderId=${folderId}` : '/api/inventory/drive-files'
            const res = await fetch(url)
            const data = await res.json()
            if (Array.isArray(data)) setPickerFiles(data)
        } catch (e) { console.error(e) }
        setLoadingPicker(false)
    }

    const openPicker = async () => {
        if (readOnly) return
        setShowPicker(true)
        // Reset to root on open
        setCurrentFolderId(null)
        setFolderHistory([{ id: 'root', name: 'Inicio' }])
        fetchDriveFiles()
    }

    const handleFolderClick = (folder: DriveFile) => {
        setCurrentFolderId(folder.id)
        setFolderHistory(prev => [...prev, { id: folder.id, name: folder.name }])
        fetchDriveFiles(folder.id)
    }

    const handleBreadcrumbClick = (index: number) => {
        const target = folderHistory[index]
        const newHistory = folderHistory.slice(0, index + 1)
        setFolderHistory(newHistory)

        if (target.id === 'root') {
            setCurrentFolderId(null)
            fetchDriveFiles()
        } else {
            setCurrentFolderId(target.id)
            fetchDriveFiles(target.id)
        }
    }

    const selectFile = (file: DriveFile) => {
        setFormData(prev => ({ ...prev, driveId: file.id, title: prev.title || file.name })) // Auto-fill title if empty
        setShowPicker(false)
    }

    const handleAutoAnalyze = async (source: 'drive' | 'transcription' = 'drive') => {
        if (readOnly) return
        if (source === 'drive' && !formData.driveId) return alert('Primero selecciona un archivo de Drive')
        if (source === 'transcription' && !formData.transcription) return alert('Primero ingresa texto en la pestaña Transcripción')

        setAnalyzing(true)
        try {
            const body = source === 'drive'
                ? { driveId: formData.driveId }
                : { transcription: formData.transcription }

            const res = await fetch('/api/inventory/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            // Checks for HTTP Errors first
            if (!res.ok) {
                if (res.status === 504) throw new Error('Timeout: El video es demasiado pesado. Intenta un archivo más pequeño.')
                if (res.status === 413) throw new Error('El archivo es demasiado grande (413).')
                if (res.status === 405) throw new Error('Error 405: API Route Not Found.')

                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || `Error ${res.status}: Fallo en el servidor`)
            }

            const data = await res.json()

            // --- ASYNC VIDEO HANDLING ---
            if (data.async && data.contentId) {
                toast.loading('El video se está procesando en la nube (esto puede tomar varios minutos)...', { duration: 10000 })

                let attempts = 0
                const maxAttempts = 120 // 10 mins approx

                while (attempts < maxAttempts) {
                    attempts++
                    await new Promise(r => setTimeout(r, 5000)) // Wait 5s

                    const pollRes = await fetch('/api/inventory/poll', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contentId: data.contentId })
                    })

                    if (!pollRes.ok) continue

                    const pollData = await pollRes.json()

                    if (pollData.status === 'COMPLETED') {
                        toast.dismiss()
                        toast.success('¡Video procesado exitosamente!')

                        setTimeout(() => {
                            const targetId = pollData.data?.suggestedId || data.contentId
                            if (pollData.data) {
                                localStorage.setItem(`temp_content_${targetId}`, JSON.stringify(pollData.data))
                            }
                            router.push(`/dashboard/inventory/edit/${targetId}?new=true`)
                        }, 500)
                        return
                    }

                    if (pollData.status === 'ERROR') {
                        toast.dismiss()
                        throw new Error('Fallo en el procesamiento del video en la nube.')
                    }
                }
                toast.dismiss()
                throw new Error('Tiempo de espera agotado. El video sigue procesándose en segundo plano.')
            }
            // -----------------------------

            const json = data
            if (json.success && json.data) {
                applyMetadata(json.data)
                if (json.suggestedId) {
                    setFormData(prev => ({ ...prev, id: json.suggestedId }))
                }
                alert('✨ Análisis Completo: Metadatos sugeridos aplicados.')
            } else {
                throw new Error(json.error || 'No se pudo analizar el contenido.')
            }
        } catch (e: any) {
            console.error(e)
            alert(`🛑 Error al procesar: ${e.message}`)
        }
        setAnalyzing(false)
    }

    const applyMetadata = (data: any) => {
        setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
            type: data.type || prev.type,
            primaryPillar: data.primaryPillar || prev.primaryPillar,
            secondaryPillars: data.secondaryPillars || prev.secondaryPillars || [],
            sub: data.sub || prev.sub,
            competence: data.competence || prev.competence,
            maturity: data.maturity || prev.maturity,
            targetRole: data.targetRole || prev.targetRole,
            observations: data.observations || data.summary || prev.observations,
            transcription: data.transcription || prev.transcription,
            duration: data.duration || prev.duration,
            completeness: data.completeness || prev.completeness,
        }))
    }

    // --- HELPER HANDLER FOR UPDATING FIELDS ---
    const updateField = (field: keyof ContentItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-500 animate-in fade-in">
            <div className="bg-panel border border-border w-full max-w-5xl rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col h-[85vh] overflow-hidden group">
                {/* Header */}
                <div className="p-8 border-b border-border flex justify-between items-center bg-bg/80 backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                            <Database size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-text-main tracking-tighter">
                                {readOnly ? `Consultar Detalles: ${formData.id}` : (isEdit ? `Editar Activo: ${formData.id}` : 'Nuevo Activo Metodológico')}
                            </h2>
                            <p className="text-[11px] font-black text-text-muted uppercase tracking-widest mt-1 opacity-60">Configuración Centralizada de Metadatos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {formData.driveId && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-success/5 text-success border border-success/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                <Cloud size={14} /> Drive Conectado
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full border border-border hover:bg-panel hover:text-danger hover:border-danger/30 transition-all flex items-center justify-center"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Main Layout: Tabs + Content */}
                {/* Main Layout: Tabs + Content */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Mobile Tabs (Horizontal) */}
                    <div className="md:hidden w-full border-b border-border bg-bg/50 overflow-x-auto no-scrollbar py-2 px-4 flex items-center gap-2 shrink-0">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                    : 'text-text-muted bg-panel border border-border'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Desktop Sidebar Tabs */}
                    <div className="hidden md:block w-[260px] border-r border-border bg-bg/50 overflow-y-auto no-scrollbar py-6 px-3 space-y-2 shrink-0">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-widest flex items-center justify-between rounded-2xl transition-all group/tab ${activeTab === tab.id
                                    ? 'bg-accent text-white shadow-xl shadow-accent/20'
                                    : 'text-text-muted hover:bg-accent/5 hover:text-accent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover/tab:scale-110 opacity-60'}`}>{tab.icon}</span>
                                    {tab.label}
                                </div>
                                {activeTab === tab.id && <CheckCircle2 size={12} className="opacity-50" />}
                            </button>
                        ))}

                        {!readOnly && (
                            <div className="mt-10 mx-2 p-5 bg-panel border-2 border-dashed border-border rounded-3xl text-center group/ai">
                                <div className="w-10 h-10 bg-bg border border-border rounded-xl flex items-center justify-center mx-auto mb-3 text-accent group-hover/ai:scale-110 group-hover/ai:border-accent transition-all">
                                    <Sparkles size={18} />
                                </div>
                                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-relaxed mb-2">Asistente IA</div>
                                <p className="text-[9px] text-text-muted italic opacity-60 leading-relaxed mb-4">Analiza estructuras de Drive automáticamente.</p>
                                <button
                                    onClick={() => handleAutoAnalyze('drive')}
                                    disabled={analyzing || !formData.driveId}
                                    className="w-full bg-accent/10 text-accent border border-accent/20 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    {analyzing ? 'Procesando...' : 'Autocompletar (Drive)'}
                                </button>
                                <button
                                    onClick={() => handleAutoAnalyze('transcription')}
                                    disabled={analyzing || !formData.transcription}
                                    className="w-full mt-2 bg-purple-500/10 text-purple-600 border border-purple-500/20 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    {analyzing ? '...' : 'Analizar Transcripción'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-bg/20 no-scrollbar">
                        <div className="max-w-3xl mx-auto">

                            {activeTab === 'identity' && (
                                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="p-8 bg-accent/5 border border-accent/10 rounded-[32px] space-y-6">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-sm font-black text-accent uppercase tracking-widest flex items-center gap-2">
                                                <Cloud size={16} /> Vinculación de Archivo
                                            </h3>
                                            {!readOnly && (
                                                <button
                                                    onClick={openPicker}
                                                    className="bg-bg border border-border hover:border-accent text-text-main text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2"
                                                >
                                                    <Folder size={14} /> Explorar Drive
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative group/id">
                                            <Cloud className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40" size={16} />
                                            <input
                                                value={formData.driveId || ''}
                                                onChange={e => setFormData({ ...formData, driveId: e.target.value })}
                                                placeholder="ID de Google Drive..."
                                                disabled={readOnly}
                                                className={`w-full bg-bg border-2 border-border/60 rounded-2xl p-4 text-xs font-mono pl-12 focus:border-accent transition-all outline-none ${readOnly ? 'opacity-60' : 'hover:border-accent/40'}`}
                                            />
                                            {formData.driveId && (
                                                <a href={`https://drive.google.com/open?id=${formData.driveId}`} target="_blank" className="absolute right-4 top-1/2 -translate-y-1/2 text-accent hover:underline text-[10px] font-bold flex items-center gap-1">
                                                    Ver <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormInput label="Identificador Único" value={formData.id} onChange={(v: string) => updateField('id', v)} placeholder="4S-P-001" icon={<Tag size={16} />} disabled={isEdit} readOnly={readOnly} />
                                        <FormInput label="Título Oficial del Activo" value={formData.title} onChange={(v: string) => updateField('title', v)} placeholder="Manual Maestro..." icon={<BookOpen size={16} />} readOnly={readOnly} />

                                        <FormSelect label="Categoría Técnica" value={formData.type} onChange={(v: string) => updateField('type', v)} options={['PDF', 'Video', 'Audio', 'Toolkit', 'Test', 'Plantilla']} icon={<FileText size={16} />} readOnly={readOnly} />
                                        <FormInput label="Extensión / Formato" value={formData.format} onChange={(v: string) => updateField('format', v)} placeholder="PNG, PDF..." width="half" icon={<Terminal size={16} />} readOnly={readOnly} />

                                        <FormInput label="Lenguaje" value={formData.language} onChange={(v: string) => updateField('language', v)} placeholder="Spanish (Latam)" width="half" icon={<Globe size={16} />} readOnly={readOnly} />
                                        <FormInput label="Duración Estimada" value={formData.duration} onChange={(v: string) => updateField('duration', v)} placeholder="90 min" width="half" icon={<Clock size={16} />} readOnly={readOnly} />

                                        <FormInput label="Ciclo / Año" value={formData.year} onChange={(v: string) => updateField('year', v)} placeholder="2025" width="half" icon={<Tag size={16} />} readOnly={readOnly} />
                                        <FormInput label="Origen / Autor" value={formData.source} onChange={(v: string) => updateField('source', v)} placeholder="Propio" width="half" icon={<Users size={16} />} readOnly={readOnly} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'classification' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <FormSelect
                                        label="Pilar Metodológico Principal"
                                        value={formData.primaryPillar}
                                        onChange={(v: string) => {
                                            updateField('primaryPillar', v)
                                            // Reset downstream on change
                                            updateField('sub', '')
                                            updateField('competence', '')
                                            updateField('behavior', '')
                                        }}
                                        options={pillarOptions}
                                        width="full"
                                        icon={<Fingerprint size={16} />}
                                        readOnly={readOnly}
                                    />
                                    <FormMultiSelect label="Pilares de Apoyo (Secundarios)" value={formData.secondaryPillars} onChange={(v: string[]) => updateField('secondaryPillars', v)} options={pillarOptions} readOnly={readOnly} />

                                    <FormSelect
                                        label="Subcomponente"
                                        value={formData.sub}
                                        onChange={(v: string) => {
                                            updateField('sub', v)
                                            updateField('competence', '')
                                            updateField('behavior', '')
                                        }}
                                        options={subOptions}
                                        icon={<Database size={16} />}
                                        readOnly={readOnly || !formData.primaryPillar}
                                    />

                                    <FormSelect
                                        label="Competencia Clave"
                                        value={formData.competence}
                                        onChange={(v: string) => {
                                            updateField('competence', v)
                                            updateField('behavior', '')
                                        }}
                                        options={competenceOptions}
                                        icon={<Brain size={16} />}
                                        readOnly={readOnly || !formData.sub}
                                    />

                                    <FormSelect // Changed from Input to Select
                                        label="Conducta Observable"
                                        value={formData.behavior}
                                        onChange={(v: string) => updateField('behavior', v)}
                                        options={behaviorOptions}
                                        width="full"
                                        icon={<Users size={16} />}
                                        readOnly={readOnly || !formData.competence}
                                    />

                                    <FormSelect label="Escala de Madurez" value={formData.maturity} onChange={(v: string) => updateField('maturity', v)} options={['Básico', 'En Desarrollo', 'Avanzado', 'Maestría']} icon={<Zap size={16} />} readOnly={readOnly} />
                                </div>
                            )}

                            {activeTab === 'trajectory' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <FormSelect label="Modalidad de Intervención" value={formData.intervention} onChange={(v: string) => updateField('intervention', v)} options={['Conciencia', 'Práctica', 'Herramienta', 'Evaluación']} icon={<Rocket size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Momento del Journey" value={formData.moment} onChange={(v: string) => updateField('moment', v)} options={['Inicio', 'Refuerzo', 'Profundización', 'Cierre']} icon={<Clock size={16} />} readOnly={readOnly} />
                                    <FormInput label="ID Prerrequisito" value={formData.prereqId} onChange={(v: string) => updateField('prereqId', v)} placeholder="4S-000" width="half" icon={<LockIcon size={16} />} readOnly={readOnly} />
                                    <FormInput label="ID Test Predictivo" value={formData.testId} onChange={(v: string) => updateField('testId', v)} placeholder="T-01" width="half" icon={<CheckCircle2 size={16} />} readOnly={readOnly} />
                                    <FormInput label="Variable a Medir" value={formData.variable} onChange={(v: string) => updateField('variable', v)} placeholder="Networking..." width="full" icon={<Zap size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Tipo de Output" value={formData.outcomeType} onChange={(v: string) => updateField('outcomeType', v)} options={['Insight', 'Acción', 'Evidencia', 'Score']} icon={<FileText size={16} />} readOnly={readOnly} />
                                </div>
                            )}

                            {activeTab === 'activation' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <FormInput label="Disparador Lógico (Trigger)" value={formData.trigger} onChange={(v: string) => updateField('trigger', v)} placeholder="Score < 60%" width="full" icon={<Zap size={16} />} readOnly={readOnly} />
                                    <FormInput label="Regla de Recomendación" value={formData.recommendation} onChange={(v: string) => updateField('recommendation', v)} placeholder="IF logic..." width="full" icon={<Brain size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Naturaleza del Reto" value={formData.challengeType} onChange={(v: string) => updateField('challengeType', v)} options={['Reflexivo', 'Práctico', 'Aplicado']} icon={<Rocket size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Evidencia Necesaria" value={formData.evidenceRequired} onChange={(v: string) => updateField('evidenceRequired', v)} options={['Texto', 'Archivo', 'Video', 'No aplica']} icon={<FileText size={16} />} readOnly={readOnly} />
                                </div>
                            )}

                            {activeTab === 'audience' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <FormSelect label="Perfil Destinatario" value={formData.targetRole} onChange={(v: string) => updateField('targetRole', v)} options={['Líder', 'Mentor', 'Facilitador', 'Metodólogo']} width="full" icon={<Users size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Nivel Jerárquico" value={formData.roleLevel} onChange={(v: string) => updateField('roleLevel', v)} options={['Junior', 'Senior', 'Experto', 'C-Level']} icon={<LockIcon size={16} />} readOnly={readOnly} />
                                    <FormInput label="Segmento Industria" value={formData.industry} onChange={(v: string) => updateField('industry', v)} placeholder="Multisectorial" width="half" icon={<Globe size={16} />} readOnly={readOnly} />
                                </div>
                            )}

                            {activeTab === 'governance' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <FormInput label="Titular de Propiedad Intelectual" value={formData.ipOwner} onChange={(v: string) => updateField('ipOwner', v)} placeholder="4Shine Global" width="full" icon={<Scale size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Régimen de IP" value={formData.ipType} onChange={(v: string) => updateField('ipType', v)} options={['Derecho de autor', 'Know-how', 'Licencia', 'Adaptación']} icon={<Fingerprint size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Alcance de Uso" value={formData.authorizedUse} onChange={(v: string) => updateField('authorizedUse', v)} options={['Formación interna', 'Consultoría', 'Venta']} icon={<Globe size={16} />} readOnly={readOnly} />
                                    <FormSelect label="Nivel de Confidencialidad" value={formData.confidentiality} onChange={(v: string) => updateField('confidentiality', v)} options={['Baja', 'Media', 'Alta', 'Restringida']} icon={<ShieldCheck size={16} />} readOnly={readOnly} />
                                </div>
                            )}

                            {activeTab === 'context' && (
                                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                                            <FileText size={16} />
                                        </div>
                                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Observaciones Pedagógicas</h3>
                                    </div>
                                    <textarea
                                        value={formData.observations || ''}
                                        onChange={e => setFormData({ ...formData, observations: e.target.value })}
                                        className={`w-full h-80 bg-bg border-4 border-border rounded-[32px] p-8 text-sm text-text-main focus:border-accent outline-none resize-none transition-all shadow-inner leading-relaxed italic ${readOnly ? 'opacity-80' : ''}`}
                                        placeholder="Define aquí la intención didáctica, notas de facilitación y contexto técnico para el despliegue de este activo..."
                                        disabled={readOnly}
                                    ></textarea>
                                </div>
                            )}

                            {activeTab === 'transcription' && (
                                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                                            <Terminal size={16} />
                                        </div>
                                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Transcripción de Audio/Video</h3>
                                    </div>
                                    <div className="relative w-full h-[500px]">
                                        <textarea
                                            value={formData.transcription || ''}
                                            onChange={e => setFormData({ ...formData, transcription: e.target.value })}
                                            className="w-full h-full bg-bg border-4 border-border rounded-[32px] p-8 text-sm text-text-main/80 shadow-inner leading-relaxed font-mono focus:border-accent outline-none resize-none transition-all placeholder:text-text-muted/30"
                                            placeholder="No hay transcripción disponible. Importa un video o audio de Drive para generarla automáticamente, o pega aquí el texto manualmente..."
                                            disabled={readOnly}
                                        />
                                        {!formData.transcription && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30 text-center p-8">
                                                <Terminal size={48} className="mb-4 text-text-muted" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Footer */}
                {readOnly ? (
                    <div className="p-8 border-t border-border bg-bg flex justify-end px-12">
                        <button
                            onClick={onClose}
                            className="bg-accent text-white px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Cerrar Visualización
                        </button>
                    </div>
                ) : (
                    <div className="p-8 border-t border-border bg-bg flex justify-between items-center px-12">
                        <div className="flex items-center gap-6">
                            <div className="h-2 w-40 bg-border/40 rounded-full overflow-hidden">
                                <div className="bg-accent h-full transition-all duration-1000" style={{ width: `${formData.completeness}%` }}></div>
                            </div>
                            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">
                                Índice de Densidad de Datos: <span className="text-accent ml-1">{formData.completeness}%</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleSaveInternal('Borrador')}
                                className="px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-text-main border-2 border-transparent hover:border-border rounded-2xl transition-all"
                            >
                                Guardar Borrador
                            </button>
                            {formData.status === 'Borrador' && (
                                <button
                                    onClick={() => handleSaveInternal('Revisión')}
                                    className="bg-purple-600 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <ShieldCheck size={14} />
                                    Solicitar Revisión
                                </button>
                            )}
                            <button
                                onClick={() => handleSaveInternal()}
                                className="bg-accent text-white px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-accent/30 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {isEdit ? 'Guardar Cambios' : 'Confirmar Activo'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DRIVE PICKER MODAL OVERLAY */}
            {showPicker && (
                <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-2xl flex items-center justify-center p-12 transition-all animate-in zoom-in-95 duration-300">
                    <div className="bg-panel border border-border rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden">
                        <div className="p-8 border-b border-border flex justify-between items-center bg-bg/80 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                                    <Cloud size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-text-main tracking-tight text-xl">Drive Resource Explorer</h3>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">Navega el repositorio documental 4Shine</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPicker(false)}
                                className="w-8 h-8 rounded-full hover:bg-panel hover:text-danger transition-all flex items-center justify-center"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* BREADCRUMBS */}
                        <div className="px-8 py-3 border-b border-border bg-gray-50/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {folderHistory.map((item, idx) => (
                                <div key={item.id} className="flex items-center text-xs whitespace-nowrap">
                                    <button
                                        onClick={() => handleBreadcrumbClick(idx)}
                                        className={`hover:bg-gray-200 px-2 py-1 rounded-md transition-colors ${idx === folderHistory.length - 1 ? 'font-bold text-gray-800' : 'text-gray-500'}`}
                                    >
                                        {item.name}
                                    </button>
                                    {idx < folderHistory.length - 1 && <ChevronRight size={12} className="text-gray-400 mx-1" />}
                                </div>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                            {loadingPicker ? (
                                <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-30">
                                    <Loader2 size={32} className="animate-spin mb-4" />
                                    <div className="text-[10px] font-black uppercase tracking-widest">Sincronizando con Cloud Storage...</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {pickerFiles.map(file => {
                                        const isFolder = file.mimeType === 'application/vnd.google-apps.folder' || file.mimeType === 'application/vnd.google-apps.shortcut'

                                        return (
                                            <button
                                                key={file.id}
                                                onClick={() => isFolder ? handleFolderClick(file) : selectFile(file)}
                                                className="flex items-center justify-between p-4 hover:bg-accent/5 rounded-[20px] text-left group transition-all border border-transparent hover:border-accent/20"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${isFolder ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'bg-white border border-gray-200 text-gray-500'
                                                        }`}>
                                                        {isFolder ? <Folder size={20} fill="currentColor" className="opacity-80" /> : <FileText size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-text-main group-hover:text-accent tracking-tight transition-colors">{file.name}</div>
                                                        {!isFolder && <div className="text-[10px] font-mono text-text-muted opacity-60 mt-0.5">{file.id}</div>}
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-accent/10 opacity-0 group-hover:opacity-100 flex items-center justify-center text-accent transition-all">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </button>
                                        )
                                    })}
                                    {pickerFiles.length === 0 && (
                                        <div className="py-20 text-center text-text-muted italic opacity-40">
                                            Carpeta vacía.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
