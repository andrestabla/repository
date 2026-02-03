
"use client"

import { FileText, Video, Mic, Layout, Eye, Tag, Link as LinkIcon, Box, Edit2, Trash2, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { ProductViewer } from './ProductViewer'

export interface Product {
    id: string;
    title: string;
    description: string | null;
    type: string;
    driveLink: string;
    driveId: string | null;
    embedCode: string | null;
    category: string | null;
    tags: string[];
    pillar: string | null;
    updatedAt: string | Date;
    versions?: any[];
}

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
    const [isViewerOpen, setIsViewerOpen] = useState(false)
    const [showActions, setShowActions] = useState(false)

    const getIcon = (type: string) => {
        const t = type.toLowerCase()
        if (t.includes('video')) return <Video className="text-pink-500" />
        if (t.includes('audio') || t.includes('podcast')) return <Mic className="text-purple-500" />
        if (t.includes('esquema') || t.includes('presentation')) return <Layout className="text-orange-500" />
        if (t.includes('herramienta')) return <Box className="text-emerald-500" />
        return <FileText className="text-indigo-500" />
    }

    return (
        <>
            <div className="group relative bg-panel border border-border hover:border-accent/50 rounded-xl p-5 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col h-full overflow-hidden">

                {/* Header / Icon */}
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-bg rounded-xl border border-border group-hover:scale-110 transition-transform duration-300 group-hover:bg-accent/10">
                        {getIcon(product.type)}
                    </div>

                    <div className="flex items-center gap-2">
                        {product.category && (
                            <span className="px-2.5 py-1 text-[10px] uppercase font-black tracking-widest bg-bg text-text-muted border border-border rounded-lg group-hover:border-accent/20 group-hover:text-accent transition-colors">
                                {product.category}
                            </span>
                        )}

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
                                            onClick={() => { onEdit(product); setShowActions(false); }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-text-main hover:bg-bg hover:text-accent transition-colors"
                                        >
                                            <Edit2 size={12} />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => { if (confirm('¿Eliminar producto?')) onDelete(product.id); setShowActions(false); }}
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
                        {product.title}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-3 mb-4 min-h-[48px] font-medium leading-relaxed">
                        {product.description || "Sin descripción disponible."}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {product.tags?.slice(0, 3).map(tag => (
                            <div key={tag} className="flex items-center text-[10px] font-bold text-text-muted bg-bg px-2 py-1 rounded-md border border-border/50">
                                <Tag size={10} className="mr-1 opacity-50" />
                                {tag}
                            </div>
                        ))}
                        {product.tags.length > 3 && (
                            <span className="text-[10px] text-text-muted px-1 py-1 font-bold">+{product.tags.length - 3}</span>
                        )}
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="pt-4 mt-auto border-t border-border flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        {product.pillar || 'General'}
                    </span>

                    <button
                        onClick={() => setIsViewerOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-text-main text-bg group-hover:bg-accent group-hover:text-white text-[10px] font-black rounded-lg transition-all uppercase tracking-wide"
                    >
                        <Eye size={12} />
                        Visualizar
                    </button>
                </div>
            </div>

            {/* Viewer Modal */}
            <ProductViewer
                id={product.id}
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                title={product.title}
                type={product.type}
                driveId={product.driveId}
                driveLink={product.driveLink}
                embedCode={product.embedCode}
            />
        </>
    )
}
