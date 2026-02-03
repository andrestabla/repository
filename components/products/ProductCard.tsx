
"use client"

import { FileText, Video, Mic, Layout, PlayCircle, Eye, Tag } from 'lucide-react'
import { useState } from 'react'
import { ProductViewer } from './ProductViewer'

export interface Product {
    id: string;
    title: string;
    description: string | null;
    type: string;
    driveId: string | null;
    category: string | null;
    tags: string[];
    pillar: string | null;
    updatedAt: string | Date;
}

export function ProductCard({ product }: { product: Product }) {
    const [isViewerOpen, setIsViewerOpen] = useState(false)

    const getIcon = (type: string) => {
        const t = type.toLowerCase()
        if (t.includes('video')) return <Video className="text-pink-400" />
        if (t.includes('audio') || t.includes('podcast')) return <Mic className="text-purple-400" />
        if (t.includes('presentation') || t.includes('ppt')) return <Layout className="text-orange-400" />
        return <FileText className="text-blue-400" />
    }

    return (
        <>
            <div className="group relative bg-slate-900/50 hover:bg-slate-800/80 border border-slate-700 hover:border-indigo-500/50 rounded-xl p-5 transition-all duration-300 backdrop-blur-sm flex flex-col h-full">

                {/* Header / Icon */}
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-slate-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                        {getIcon(product.type)}
                    </div>
                    {product.category && (
                        <span className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 rounded-md">
                            {product.category}
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-100 mb-2 leading-tight group-hover:text-indigo-300 transition-colors">
                        {product.title}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-3 mb-4 min-h-[60px]">
                        {product.description || "Sin descripción disponible."}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {product.tags.slice(0, 3).map(tag => (
                            <div key={tag} className="flex items-center text-xs text-slate-500 bg-slate-950/50 px-2 py-1 rounded">
                                <Tag size={10} className="mr-1 opacity-50" />
                                {tag}
                            </div>
                        ))}
                        {product.tags.length > 3 && (
                            <span className="text-xs text-slate-600 px-1 py-1">+{product.tags.length - 3}</span>
                        )}
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="pt-4 mt-auto border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-indigo-400 font-medium">
                        {product.pillar || 'General'}
                    </span>

                    <button
                        onClick={() => setIsViewerOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
                    >
                        <Eye size={14} />
                        VISUALIZAR
                    </button>
                </div>
            </div>

            {/* Viewer Modal */}
            <ProductViewer
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                title={product.title}
                type={product.type}
                driveId={product.driveId}
            />
        </>
    )
}
