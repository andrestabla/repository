'use client'

import { useState, useEffect } from 'react'

// --- TYPES ---
export type ContentItem = {
    id: string
    title: string
    type: string
    format?: string | null
    language?: string | null
    duration?: string | null
    year?: string | null
    source?: string | null

    pillar: string
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

    status: string
    completeness: number
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
}

const TABS = [
    { id: 'identity', label: '1. Identificación', icon: '🆔' },
    { id: 'classification', label: '2. Clasificación', icon: '🧠' },
    { id: 'trajectory', label: '3. Trayectoria', icon: '🚀' },
    { id: 'activation', label: '4. Activación', icon: '⚡' },
    { id: 'audience', label: '5. Audiencia', icon: '👥' },
    { id: 'governance', label: '6. Gob & IP', icon: '⚖️' },
    { id: 'context', label: '7. Contexto', icon: '📝' },
]

export default function ContentForm({ initialData, onClose, onSave }: Props) {
    const [activeTab, setActiveTab] = useState('identity')

    const [formData, setFormData] = useState<Partial<ContentItem>>({
        id: '', title: '', type: 'PDF', version: 'v1.0', status: 'Borrador', completeness: 0,
        pillar: 'Shine Out', maturity: 'Básico', ipOwner: 'Propio',
        ...initialData
    })

    const isEdit = !!initialData

    // Drive Picker State
    const [showPicker, setShowPicker] = useState(false)
    const [pickerFiles, setPickerFiles] = useState<DriveFile[]>([])
    const [loadingPicker, setLoadingPicker] = useState(false)

    // Derived States
    const [driveStatus, setDriveStatus] = useState<'idle' | 'validating' | 'valid'>('idle')

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

    const openPicker = async () => {
        setShowPicker(true)
        setLoadingPicker(true)
        try {
            const res = await fetch('/api/inventory/drive-files')
            const data = await res.json()
            if (Array.isArray(data)) setPickerFiles(data)
        } catch (e) { console.error(e) }
        setLoadingPicker(false)
    }

    const selectFile = (file: DriveFile) => {
        setFormData(prev => ({ ...prev, driveId: file.id, title: prev.title || file.name })) // Auto-fill title if empty
        setShowPicker(false)
    }

    // --- RENDER HELPERS ---
    const Input = ({ label, field, placeholder, width = 'full' }: any) => (
        <div className={width === 'half' ? 'col-span-1' : 'col-span-2'}>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">{label}</label>
            <input
                value={(formData as any)[field] || ''}
                onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none"
                placeholder={placeholder}
            />
        </div>
    )

    const Select = ({ label, field, options, width = 'half' }: any) => (
        <div className={width === 'half' ? 'col-span-1' : 'col-span-2'}>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">{label}</label>
            <select
                value={(formData as any)[field] || ''}
                onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                className="w-full bg-panel border border-[var(--border)] rounded p-2 text-xs text-[var(--text-main)] outline-none"
            >
                <option value="">Seleccionar...</option>
                {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    )

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-panel border border-[var(--border)] w-full max-w-4xl rounded-xl shadow-2xl flex flex-col h-[85vh]">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-bg rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-[var(--text-main)]">
                            {isEdit ? `Editando: ${formData.id}` : 'Nuevo Activo Metodológico'}
                        </h2>
                        {formData.driveId && <span className="text-xs bg-green-900/30 text-green-400 border border-green-900/50 px-2 py-0.5 rounded-full">Drive Linked ✅</span>}
                    </div>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] px-3">✕</button>
                </div>

                {/* Main Layout: Tabs + Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-[200px] border-r border-[var(--border)] bg-bg overflow-y-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left px-4 py-3 text-xs font-semibold flex items-center gap-2 border-l-2 transition-colors ${activeTab === tab.id
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-main)]'
                                    : 'border-transparent text-[var(--text-muted)] hover:bg-white/5'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-bg/50">
                        <div className="max-w-2xl mx-auto space-y-6">

                            {/* 1. IDENTIFICATION */}
                            {activeTab === 'identity' && (
                                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                    <div className="col-span-2 p-4 bg-blue-900/10 border border-blue-900/30 rounded mb-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-sm font-bold text-blue-200">Archivo Original (Source)</h3>
                                            <button onClick={openPicker} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded font-bold shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105">
                                                📂 Abrir Drive Picker
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                value={formData.driveId || ''}
                                                onChange={e => setFormData({ ...formData, driveId: e.target.value })}
                                                placeholder="O pega el ID Manualmente..."
                                                className="flex-1 bg-black/30 border border-blue-900/30 rounded px-2 py-1 text-xs font-mono"
                                            />
                                            {formData.driveId && <a href={`https://drive.google.com/open?id=${formData.driveId}`} target="_blank" className="text-blue-400 text-xs flex items-center hover:underline">Ver ↗</a>}
                                        </div>
                                    </div>

                                    <Input label="ID Único (Inmutable)" field="id" placeholder="4S-P-001" />
                                    <Input label="Título Oficial" field="title" placeholder="Manual del Facilitador..." />

                                    <Select label="Tipo Contenido" field="type" options={['PDF', 'Video', 'Audio', 'Toolkit', 'Test', 'Plantilla']} />
                                    <Input label="Formato Técnico" field="format" placeholder="PDF, MP4, DOCCX" width="half" />

                                    <Input label="Idioma" field="language" placeholder="ES" width="half" />
                                    <Input label="Duración (min)" field="duration" placeholder="120" width="half" />
                                    <Input label="Año" field="year" placeholder="2025" width="half" />
                                    <Input label="Fuente" field="source" placeholder="Propio, Adaptación" width="half" />
                                </div>
                            )}

                            {/* 2. CLASSIFICATION */}
                            {activeTab === 'classification' && (
                                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                    <Select label="Pilar 4Shine" field="pillar" options={['Shine Out', 'Shine In', 'Shine Up', 'Shine On']} width="full" />
                                    <Input label="Subcomponente" field="sub" placeholder="Comunicación, Liderazgo..." />
                                    <Input label="Competencia Clave" field="competence" placeholder="Escucha Activa" />
                                    <Input label="Conducta Observable" field="behavior" placeholder="Hace preguntas poderosas..." width="full" />
                                    <Select label="Nivel Madurez" field="maturity" options={['Básico', 'En Desarrollo', 'Avanzado', 'Maestría']} />
                                </div>
                            )}

                            {/* 3. TRAJECTORY */}
                            {activeTab === 'trajectory' && (
                                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                    <Select label="Tipo Intervención" field="intervention" options={['Conciencia', 'Práctica', 'Herramienta', 'Evaluación']} />
                                    <Select label="Momento" field="moment" options={['Inicio', 'Refuerzo', 'Profundización', 'Cierre']} />
                                    <Input label="ID Prerrequisito" field="prereqId" placeholder="4S-P-000" width="half" />
                                    <Input label="ID Test Asociado" field="testId" placeholder="TEST-01" width="half" />

                                    <Input label="Variable Medida" field="variable" placeholder="Networking Capacity" width="full" />
                                    <Select label="Tipo Output" field="outcomeType" options={['Insight', 'Acción', 'Evidencia', 'Score']} />
                                </div>
                            )}

                            {/* 4. ACTIVATION */}
                            {activeTab === 'activation' && (
                                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                    <Input label="Disparador (Trigger)" field="trigger" placeholder="Score < 60%" width="full" />
                                    <Input label="Regla Recomendación" field="recommendation" placeholder="IF score low THEN recommend this" width="full" />
                                    <Select label="Tipo Reto" field="challengeType" options={['Reflexivo', 'Práctico', 'Aplicado']} />
                                    <Select label="Evidencia Req." field="evidenceRequired" options={['Texto', 'Archivo', 'Video', 'No aplica']} />
                                    <Input label="Siguiente Contenido ID" field="nextContentId" placeholder="4S-P-005" width="full" />
                                </div>
                            )}

                            {/* 5. AUDIENCE */}
                            {activeTab === 'audience' && (
                                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                    <Select label="Rol Objetivo" field="targetRole" options={['Líder', 'Mentor', 'Facilitador', 'Metodólogo']} width="full" />
                                    <Select label="Nivel Rol" field="roleLevel" options={['Junior', 'Senior', 'Experto', 'C-Level']} />
                                    <Input label="Industria" field="industry" placeholder="Transversal" width="half" />
                                </div>
                            )}

                            {/* 6. GOVERNANCE */}
                            {activeTab === 'governance' && (
                                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                    <Input label="Propietario IP" field="ipOwner" placeholder="Company Name" width="full" />
                                    <Select label="Tipo IP" field="ipType" options={['Derecho de autor', 'Know-how', 'Licencia', 'Adaptación']} />
                                    <Select label="Uso Autorizado" field="authorizedUse" options={['Formación interna', 'Consultoría', 'Venta']} />
                                    <Select label="Confidencialidad" field="confidentiality" options={['Baja', 'Media', 'Alta', 'Restringida']} />
                                </div>
                            )}

                            {/* 7. CONTEXT */}
                            {activeTab === 'context' && (
                                <div className="animate-fadeIn">
                                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Observaciones Metodológicas</label>
                                    <textarea
                                        value={formData.observations || ''}
                                        onChange={e => setFormData({ ...formData, observations: e.target.value })}
                                        className="w-full h-40 bg-bg border border-[var(--border)] rounded p-3 text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none resize-none"
                                        placeholder="Descripción pedagógica, intención de uso, notas para el facilitador..."
                                    ></textarea>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)] bg-bg rounded-b-xl flex justify-between items-center">
                    <div className="text-xs text-[var(--text-muted)]">
                        Completeness: <span className="font-bold text-[var(--text-main)]">{formData.completeness}% (Estimado)</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleSaveInternal('Borrador')} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent hover:border-[var(--border)] rounded">
                            Guardar Borrador
                        </button>
                        <button onClick={() => handleSaveInternal()} className="bg-[#238636] text-white px-6 py-2 rounded text-sm font-bold hover:brightness-110 shadow-lg shadow-green-900/20">
                            Guardar Activo
                        </button>
                    </div>
                </div>
            </div>

            {/* DRIVE PICKER MODAL OVERLAY */}
            {showPicker && (
                <div className="absolute inset-0 z-[60] bg-black/50 flex items-center justify-center p-8 backdrop-blur-sm">
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[70vh]">
                        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                            <h3 className="font-bold text-[var(--text-main)]">🗂️ Seleccionar de Drive</h3>
                            <button onClick={() => setShowPicker(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {loadingPicker ? (
                                <div className="p-8 text-center text-[var(--text-muted)] animate-pulse">Cargando archivos desde la nube...</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-1">
                                    {pickerFiles.map(file => (
                                        <button
                                            key={file.id}
                                            onClick={() => selectFile(file)}
                                            className="flex items-center gap-3 p-3 hover:bg-bg rounded text-left group transition-colors border border-transparent hover:border-[var(--border)]"
                                        >
                                            <div className="text-2xl">📄</div>
                                            <div>
                                                <div className="text-sm font-semibold text-[var(--text-main)] group-hover:text-blue-400">{file.name}</div>
                                                <div className="text-[10px] font-mono text-[var(--text-muted)]">{file.id}</div>
                                            </div>
                                        </button>
                                    ))}
                                    {pickerFiles.length === 0 && <div className="p-8 text-center text-[var(--text-muted)]">No se encontraron archivos en las carpetas autorizadas.</div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
