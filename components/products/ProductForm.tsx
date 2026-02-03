
"use client"

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2, Link as LinkIcon, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DriveUtils } from '@/lib/google'
import { DriveExplorerModal } from './DriveExplorerModal'
import { Product } from './ProductCard'

interface ProductFormProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialProduct?: Product
}

export function ProductForm({ isOpen, onClose, onSuccess, initialProduct }: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('Documento')
    const [sourceType, setSourceType] = useState<'drive' | 'embed' | 'url'>('drive')
    const [driveLink, setDriveLink] = useState('')
    const [embedCode, setEmbedCode] = useState('')
    const [category, setCategory] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [pillar, setPillar] = useState('Todos')
    const [isNewVersion, setIsNewVersion] = useState(false)

    const [isDriveExplorerOpen, setIsDriveExplorerOpen] = useState(false)

    // Populate form on edit mode
    useEffect(() => {
        if (initialProduct && isOpen) {
            setTitle(initialProduct.title || '')
            setDescription(initialProduct.description || '')
            setType(initialProduct.type || 'Documento')
            setDriveLink(initialProduct.driveLink || '')
            setEmbedCode(initialProduct.embedCode || '')
            setSourceType(initialProduct.embedCode ? 'embed' : (initialProduct.driveId ? 'drive' : 'url'))
            setCategory(initialProduct.category || '')
            setTags(initialProduct.tags || [])
            setPillar(initialProduct.pillar || 'Todos')
            setIsNewVersion(false)
        } else if (!isOpen) {
            // Reset when closing
            resetForm()
        }
    }, [initialProduct, isOpen])

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setType('Documento')
        setDriveLink('')
        setEmbedCode('')
        setSourceType('drive')
        setCategory('')
        setTags([])
        setPillar('Todos')
        setIsNewVersion(false)
    }

    const handleDriveSelect = (file: any) => {
        const url = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`
        setDriveLink(url)
        if (!title) setTitle(file.name)

        // Auto-detect type
        const inferred = DriveUtils.inferType(url)
        if (inferred === 'Presentación') setType('Esquema')
        else if (inferred === 'Hoja de Cálculo') setType('Herramienta')
        else if (inferred === 'Documento') setType('Documento')

        setIsDriveExplorerOpen(false)
    }

    if (!isOpen) return null

    const handleMagicDescribe = async () => {
        if (!title) return alert("Por favor ingresa un título primero.")

        setAiLoading(true)
        try {
            const res = await fetch('/api/products/ai-describe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, type, driveLink: sourceType === 'drive' ? driveLink : undefined })
            })
            const data = await res.json()

            if (data.error) throw new Error(data.error)

            if (data.description) setDescription(data.description)
            if (data.category && !category) setCategory(data.category)
            if (data.tags && data.tags.length > 0) setTags(data.tags)
            if (data.pillar && (pillar === 'Todos' || !pillar)) setPillar(data.pillar)

        } catch (error) {
            console.error(error)
            alert("Error generando descripción con IA")
        } finally {
            setAiLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const method = initialProduct ? 'PUT' : 'POST'
        const url = initialProduct ? `/api/products/${initialProduct.id}` : '/api/products'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    type,
                    category,
                    tags,
                    pillar,
                    driveLink: (sourceType === 'drive' || sourceType === 'url') ? driveLink : undefined,
                    embedCode: sourceType === 'embed' ? embedCode : undefined,
                    isNewVersion: initialProduct ? isNewVersion : false
                })
            })

            if (!res.ok) throw new Error('Failed to save')

            onSuccess()
            onClose()
            router.refresh()

        } catch (error) {
            alert('Error al guardar el producto')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-panel w-full max-w-2xl rounded-2xl border border-border shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 text-text-muted hover:text-text-main transition-colors">
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-black text-text-main mb-1 tracking-tight">
                    {initialProduct ? 'Editar Producto Estratégico' : 'Nuevo Producto Estratégico'}
                </h2>
                <p className="text-sm text-text-muted mb-6">
                    {initialProduct ? 'Actualiza la información de este entregable.' : 'Completa la información para registrar un nuevo entregable.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Title */}
                    <div>
                        <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Título del Documento</label>
                        <input
                            type="text"
                            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all placeholder:text-text-muted/50 font-medium"
                            placeholder="Ej: Playbook de Liderazgo 2026"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    {/* Source Selection Tabs */}
                    <div>
                        <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Fuente del Contenido</label>
                        <div className="flex bg-bg p-1 rounded-xl border border-border mb-3 w-fit">
                            <button
                                type="button"
                                onClick={() => setSourceType('drive')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sourceType === 'drive' ? 'bg-panel shadow-sm text-text-main border border-border/50' : 'text-text-muted hover:text-text-main'}`}
                            >
                                Google Drive
                            </button>
                            <button
                                type="button"
                                onClick={() => setSourceType('embed')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sourceType === 'embed' ? 'bg-panel shadow-sm text-text-main border border-border/50' : 'text-text-muted hover:text-text-main'}`}
                            >
                                Código Embed HTML
                            </button>
                            <button
                                type="button"
                                onClick={() => setSourceType('url')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sourceType === 'url' ? 'bg-panel shadow-sm text-text-main border border-border/50' : 'text-text-muted hover:text-text-main'}`}
                            >
                                Enlace Directo
                            </button>
                        </div>

                        {sourceType === 'drive' ? (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <input
                                    type="url"
                                    className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-accent outline-none"
                                    placeholder="https://drive.google.com/file/d/..."
                                    value={driveLink}
                                    onChange={e => {
                                        const val = e.target.value
                                        setDriveLink(val)
                                        // Auto-detect type
                                        const inferred = DriveUtils.inferType(val)
                                        if (inferred === 'Presentación') setType('Esquema')
                                        else if (inferred === 'Hoja de Cálculo') setType('Herramienta')
                                        else if (inferred === 'Documento') setType('Documento')
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsDriveExplorerOpen(true)}
                                    className="px-4 py-3 bg-bg border border-border rounded-xl text-text-muted hover:text-text-main hover:border-accent transition-all flex items-center gap-2 text-xs font-bold"
                                >
                                    <LinkIcon size={14} />
                                    Explorar
                                </button>
                            </div>
                        ) : sourceType === 'url' ? (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <input
                                    type="url"
                                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-accent outline-none"
                                    placeholder="https://ejemplo.com/recurso"
                                    value={driveLink}
                                    onChange={e => setDriveLink(e.target.value)}
                                    required
                                />
                                <p className="text-[10px] text-text-muted mt-2 ml-1">
                                    Cualquier sitio web que permita ser embebido se mostrará en el visor.
                                </p>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <textarea
                                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-accent outline-none min-h-[80px] font-mono text-xs"
                                    placeholder="<iframe src='...' ...></iframe>"
                                    value={embedCode}
                                    onChange={e => setEmbedCode(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Magic AI Button Row */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleMagicDescribe}
                            disabled={aiLoading || !title}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-white text-[10px] font-black tracking-wide hover:shadow-lg hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all uppercase"
                        >
                            {aiLoading ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                            {aiLoading ? "Analizando..." : "Generar Descripción con IA"}
                        </button>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Descripción</label>
                        <textarea
                            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-accent outline-none min-h-[100px]"
                            placeholder="Descripción del contenido..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Tipo</label>
                            <select
                                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-main outline-none focus:ring-2 focus:ring-accent appearance-none"
                                value={type}
                                onChange={e => setType(e.target.value)}
                            >
                                <option value="Documento">Documento</option>
                                <option value="Esquema">Esquema</option>
                                <option value="Video">Video</option>
                                <option value="Audio">Audio</option>
                                <option value="Herramienta">Herramienta</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Pilar</label>
                            <select
                                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-main outline-none focus:ring-2 focus:ring-accent appearance-none"
                                value={pillar}
                                onChange={e => setPillar(e.target.value)}
                            >
                                <option value="Todos">Todos</option>
                                <option value="Shine Within">Shine Within</option>
                                <option value="Shine Out">Shine Out</option>
                                <option value="Shine Up">Shine Up</option>
                                <option value="Shine Beyond">Shine Beyond</option>
                            </select>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Tags (Separados por coma)</label>
                        <input
                            type="text"
                            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-accent outline-none"
                            placeholder="Ej: Liderazgo, Q1, Reporte"
                            value={tags.join(', ')}
                            onChange={e => setTags(e.target.value.split(',').map(t => t.trim()))}
                        />
                    </div>

                    {initialProduct && (
                        <div className="flex items-center gap-2 p-3 bg-bg border border-border rounded-xl">
                            <input
                                type="checkbox"
                                id="isNewVersion"
                                checked={isNewVersion}
                                onChange={e => setIsNewVersion(e.target.checked)}
                                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                            />
                            <label htmlFor="isNewVersion" className="text-xs font-bold text-text-main cursor-pointer select-none">
                                Guardar como una nueva versión (v{(initialProduct as any).versions?.length + 1 || '?'} )
                            </label>
                        </div>
                    )}

                    <div className="pt-6 border-t border-border flex justify-end gap-3 mt-2">
                        <button type="button" onClick={onClose} className="px-5 py-3 text-text-muted font-bold hover:text-text-main text-xs uppercase tracking-wide transition-colors">Cancelar</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl flex items-center gap-2 text-xs uppercase tracking-wide shadow-lg shadow-accent/20 transition-all hover:scale-105"
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            {initialProduct ? 'Actualizar Producto' : 'Guardar Producto'}
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
