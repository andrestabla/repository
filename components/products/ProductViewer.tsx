
"use client"

import { X, ArrowLeft, Send, MessageSquare, Loader2, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DriveUtils } from '@/lib/google'
import { useSession } from "next-auth/react"

interface Comment {
    id: string;
    content: string;
    userEmail: string;
    userName: string | null;
    createdAt: string | Date;
}

interface ProductViewerProps {
    id: string;
    driveId: string | null;
    driveLink?: string;
    embedCode: string | null;
    title: string;
    type: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ProductViewer({ id, driveId, driveLink, embedCode, title, type, isOpen, onClose }: ProductViewerProps) {
    const { data: session } = useSession()
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [isPosting, setIsPosting] = useState(false)
    const [isLoadingComments, setIsLoadingComments] = useState(false)

    // Detener scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            fetchComments()
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen, id])

    const fetchComments = async () => {
        setIsLoadingComments(true)
        try {
            const res = await fetch(`/api/products/${id}/comments`)
            const data = await res.json()
            setComments(data)
        } catch (error) {
            console.error('Error fetching comments:', error)
        } finally {
            setIsLoadingComments(false)
        }
    }

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || isPosting) return

        setIsPosting(true)
        try {
            const res = await fetch(`/api/products/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            })
            if (res.ok) {
                const comment = await res.json()
                setComments(prev => [...prev, comment])
                setNewComment('')
            }
        } catch (error) {
            console.error('Error posting comment:', error)
        } finally {
            setIsPosting(false)
        }
    }

    if (!isOpen) return null

    // Determine content URL
    let contentUrl = ''
    if (driveId) {
        contentUrl = DriveUtils.getEmbedUrl(driveId, driveLink || '')
    }

    return (
        <div className="fixed inset-0 z-[100] bg-bg flex flex-col animate-in fade-in duration-300">

            {/* Header / Top Bar */}
            <div className="h-16 border-b border-border bg-panel flex items-center justify-between px-6 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-bg rounded-lg text-text-muted hover:text-text-main transition-all flex items-center gap-2 text-sm font-bold active:scale-95"
                    >
                        <ArrowLeft size={18} />
                        Volver
                    </button>
                    <div className="h-6 w-[1px] bg-border mx-2" />
                    <div>
                        <h2 className="text-lg font-black text-text-main line-clamp-1 leading-none">{title}</h2>
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none mt-1 inline-block">{type}</span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="p-2 bg-bg hover:bg-border/20 rounded-full text-text-muted hover:text-text-main transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">

                {/* Visualizer (Left) */}
                <div className="flex-1 bg-gray-100/50 dark:bg-black/40 relative overflow-hidden group">
                    <div className="absolute inset-4 bg-white dark:bg-panel rounded-2xl shadow-xl border border-border overflow-hidden">
                        {embedCode ? (
                            <div
                                className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
                                dangerouslySetInnerHTML={{ __html: embedCode }}
                            />
                        ) : contentUrl ? (
                            <iframe
                                src={contentUrl}
                                className="absolute inset-0 w-full h-full border-0"
                                allow="autoplay"
                                title={title}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted gap-4">
                                <div className="p-8 bg-bg rounded-3xl border border-dashed border-border flex flex-col items-center">
                                    <MessageSquare size={48} className="opacity-20 mb-4" />
                                    <p className="text-sm font-bold">Vista previa no disponible</p>
                                    <p className="text-xs opacity-60 mt-1">Este tipo de archivo no admite previsualización directa.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Comments Sidebar (Right) */}
                <div className="w-[400px] border-l border-border bg-panel flex flex-col shrink-0 animate-in slide-in-from-right duration-500">
                    <div className="p-6 border-b border-border bg-bg/30">
                        <h3 className="text-sm font-black text-text-main flex items-center gap-2 uppercase tracking-wider">
                            <MessageSquare size={16} className="text-accent" />
                            Comentarios e Hilos
                        </h3>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {isLoadingComments ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="animate-spin text-accent" size={24} />
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-10">
                                <MessageSquare size={40} className="mb-4" />
                                <p className="text-sm font-bold">Aún no hay comentarios.</p>
                                <p className="text-xs mt-1">Sé el primero en iniciar una conversación sobre este producto.</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shrink-0 shadow-sm font-bold text-xs">
                                            {comment.userName?.charAt(0) || <User size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-black text-text-main truncate">
                                                    {comment.userName}
                                                </span>
                                                <span className="text-[10px] text-text-muted font-medium shrink-0">
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="bg-bg border border-border p-3 rounded-2xl rounded-tl-none group-hover:border-accent/30 transition-colors">
                                                <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 border-t border-border bg-bg/30">
                        <form onSubmit={handlePostComment} className="relative">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Escribe un comentario..."
                                className="w-full bg-panel border border-border rounded-2xl px-4 py-3 pb-12 text-sm text-text-main placeholder:text-text-muted focus:ring-2 focus:ring-accent outline-none transition-all resize-none h-24"
                            />
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isPosting}
                                    className="p-2 bg-accent text-white rounded-xl shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                                >
                                    {isPosting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    )
}
