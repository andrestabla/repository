
"use client"

import { Book, Clock, Users, BarChart, Edit2, Trash2, MoreVertical, Eye } from 'lucide-react'
import { useState } from 'react'

export interface Workbook {
    id: string
    title: string
    description?: string | null
    status: string
    metadata: {
        objectives?: string[]
        audience?: string
        duration?: string
        difficulty?: string
        prerequisites?: string
        takeaways?: string[]
    } | null
    driveId?: string | null
    content?: string | null
    createdAt: string
    updatedAt: string
}

interface WorkbookCardProps {
    workbook: Workbook
    onEdit: (workbook: Workbook) => void
    onDelete: (id: string) => void
}

export function WorkbookCard({ workbook, onEdit, onDelete }: WorkbookCardProps) {
    const [showActions, setShowActions] = useState(false)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Publicado': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'Revisión': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
        }
    }

    return (
        <div className="group relative bg-panel border border-border hover:border-accent/50 rounded-xl p-5 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col h-full">

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-bg rounded-xl border border-border group-hover:scale-110 transition-transform duration-300 group-hover:bg-accent/10">
                    <Book className="text-accent" />
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-[10px] uppercase font-black tracking-widest border rounded-lg transition-colors ${getStatusColor(workbook.status)}`}>
                        {workbook.status}
                    </span>

                    <div className="relative">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="p-1.5 hover:bg-bg rounded-lg text-text-muted hover:text-text-main transition-colors"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {showActions && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                                <div className="absolute right-0 mt-2 w-32 bg-panel border border-border rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => { onEdit(workbook); setShowActions(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-text-main hover:bg-bg hover:text-accent transition-colors"
                                    >
                                        <Edit2 size={12} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('¿Eliminar workbook?')) onDelete(workbook.id); setShowActions(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                        Eliminar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                <h3 className="text-base font-black text-text-main mb-2 leading-tight group-hover:text-accent transition-colors line-clamp-2">
                    {workbook.title}
                </h3>
                <p className="text-xs text-text-muted line-clamp-3 mb-4 min-h-[48px] font-medium leading-relaxed">
                    {workbook.description || "Sin descripción disponible."}
                </p>

                {/* Metadata Chips */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {workbook.metadata?.duration && (
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold bg-bg px-2 py-1.5 rounded-lg border border-border/50">
                            <Clock size={10} className="text-accent" />
                            {workbook.metadata.duration}
                        </div>
                    )}
                    {workbook.metadata?.difficulty && (
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold bg-bg px-2 py-1.5 rounded-lg border border-border/50">
                            <BarChart size={10} className="text-accent" />
                            {workbook.metadata.difficulty}
                        </div>
                    )}
                </div>

                {workbook.metadata?.audience && (
                    <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold mb-2">
                        <Users size={10} className="text-accent" />
                        <span className="truncate">{workbook.metadata.audience}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="pt-4 mt-auto border-t border-border flex items-center justify-end">
                <button
                    onClick={() => { /* Open Detail View Future Implementation */ onEdit(workbook) }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-text-main text-bg group-hover:bg-accent group-hover:text-white text-[10px] font-black rounded-lg transition-all uppercase tracking-wide"
                >
                    <Eye size={12} />
                    Detalles
                </button>
            </div>
        </div>
    )
}
