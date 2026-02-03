
"use client"

import { useState } from 'react'
import { X, Sparkles, Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProductFormProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function ProductForm({ isOpen, onClose, onSuccess }: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('PDF')
    const [driveLink, setDriveLink] = useState('')
    const [category, setCategory] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [pillar, setPillar] = useState('Shine Within')

    if (!isOpen) return null

    const handleMagicDescribe = async () => {
        if (!title) return alert("Por favor ingresa un título primero.")

        setAiLoading(true)
        try {
            const res = await fetch('/api/products/ai-describe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, type })
            })
            const data = await res.json()

            if (data.error) throw new Error(data.error)

            if (data.description) setDescription(data.description)
            if (data.category && !category) setCategory(data.category)
            if (data.tags && data.tags.length > 0) setTags(data.tags)

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

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title, description, type, driveLink, category, tags, pillar
                })
            })

            if (!res.ok) throw new Error('Failed to create')

            // Reset and close
            setTitle('')
            setDescription('')
            setDriveLink('')
            setTags([])
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl p-6 relative">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                    <X />
                </button>

                <h2 className="text-2xl font-bold text-white mb-6">Nuevo Producto Estratégico</h2>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Título del Documento</label>
                        <input
                            type="text"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ej: Playbook de Liderazgo 2026"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    {/* Drive Link */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Link de Google Drive</label>
                        <input
                            type="url"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="https://drive.google.com/file/d/..."
                            value={driveLink}
                            onChange={e => setDriveLink(e.target.value)}
                            required
                        />
                    </div>

                    {/* Magic AI Button Row */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleMagicDescribe}
                            disabled={aiLoading || !title}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white text-xs font-bold hover:shadow-lg hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
                        >
                            {aiLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                            {aiLoading ? "ANALIZANDO..." : "GENERAR DESCRIPCIÓN CON IA"}
                        </button>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Descripción</label>
                        <textarea
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                            placeholder="Descripción del contenido..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tipo</label>
                            <select
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none"
                                value={type}
                                onChange={e => setType(e.target.value)}
                            >
                                <option value="PDF">Documento PDF</option>
                                <option value="Video">Video / Grabación</option>
                                <option value="Presentation">Presentación (Slides)</option>
                                <option value="Spreadsheet">Hoja de Cálculo</option>
                                <option value="Doc">Documento de Texto</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Pilar</label>
                            <select
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none"
                                value={pillar}
                                onChange={e => setPillar(e.target.value)}
                            >
                                <option value="Shine Within">Shine Within</option>
                                <option value="Shine Out">Shine Out</option>
                                <option value="Shine Up">Shine Up</option>
                                <option value="Shine Beyond">Shine Beyond</option>
                            </select>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tags (Separados por coma)</label>
                        <input
                            type="text"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ej: Liderazgo, Q1, Reporte"
                            value={tags.join(', ')}
                            onChange={e => setTags(e.target.value.split(',').map(t => t.trim()))}
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-3 text-slate-400 font-bold hover:text-white">Cancelar</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" />}
                            GUARDAR PRODUCTO
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
