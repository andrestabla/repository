import React, { useState, useRef, useEffect } from 'react'
import { Send, Terminal, Cpu, User, Sparkles, StopCircle, Bot, Loader2, Headphones, Database, Video, Network, FileText, Layers, HelpCircle, Image, Monitor, Table, Check, Globe, ChevronDown, Trash2 } from 'lucide-react'

// ... existing code ...



type Message = {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}
import mermaid from 'mermaid'

// Helper Component for Mermaid
const MermaidDiagram = ({ chart }: { chart: string }) => {
    const ref = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState('')

    useEffect(() => {
        if (ref.current) {
            mermaid.initialize({ startOnLoad: false, theme: 'default' })
            mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart)
                .then(({ svg }) => setSvg(svg))
                .catch((e) => console.error("Mermaid error:", e))
        }
    }, [chart])

    return (
        <div className="my-4 p-4 bg-white rounded-xl border border-gray-200 overflow-x-auto flex justify-center" ref={ref}>
            <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
    )
}

export default function CompilerChat({ assets = [], research = [] }: { assets?: any[], research?: any[] }) {
    // 1. Initial State: Select ALL validated assets by default
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set())
    const [selectedResearchIds, setSelectedResearchIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (assets.length > 0) {
            const validated = assets.filter(a => a.status === 'Validado').map(a => a.id)
            setSelectedAssetIds(new Set(validated))
        }
    }, [assets])

    const toggleAsset = (id: string) => {
        const next = new Set(selectedAssetIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedAssetIds(next)
    }

    const toggleResearch = (id: string) => {
        const next = new Set(selectedResearchIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedResearchIds(next)
    }

    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [openSections, setOpenSections] = useState<Set<string>>(new Set(['inventory', 'research', 'history']))

    const toggleSection = (section: string) => {
        const next = new Set(openSections)
        if (next.has(section)) next.delete(section)
        else next.add(section)
        setOpenSections(next)
    }

    const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('¿Estás seguro de que quieres eliminar este historial?')) return

        try {
            await fetch(`/api/generator/history?id=${id}`, { method: 'DELETE' })
            setHistory(prev => prev.filter(h => h.id !== id))
        } catch (error) {
            console.error('Failed to delete history', error)
        }
    }

    useEffect(() => {
        // Fetch History
        fetch('/api/generator/history')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setHistory(data)
            })
            .catch(err => console.error(err))
    }, [])

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    role: 'assistant',
                    content: 'Hola. Soy el Motor de Compilación 4Shine. Selecciona tus fuentes y elige un producto para generar.',
                    timestamp: new Date()
                }
            ])
        }
    }, [])
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async (overrideInput?: string, overrideType?: string) => {
        const textToSend = overrideInput || input
        if (!textToSend.trim() || loading) return

        const userMsg: Message = { role: 'user', content: textToSend, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        if (!overrideInput) setInput('')
        setLoading(true)

        // Detect Intent
        let type = overrideType
        if (!type) {
            const clean = textToSend.toLowerCase()
            if (clean.includes('dossier')) type = 'dossier'
            else if (clean.includes('overview') || clean.includes('podcast')) type = 'podcast'
            else if (clean.includes('video')) type = 'video'
            else if (clean.includes('mapa') || clean.includes('mind')) type = 'mindmap'
            else if (clean.includes('flashcard')) type = 'flashcards'
            else if (clean.includes('quiz') || clean.includes('examen')) type = 'quiz'
            else if (clean.includes('infograf')) type = 'infographic'
            else if (clean.includes('presenta')) type = 'presentation'
            else if (clean.includes('matriz') || clean.includes('tabla')) type = 'matrix'
        }

        try {
            const res = await fetch('/api/generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    type: type,
                    selectedAssetIds: Array.from(selectedAssetIds),
                    selectedResearchIds: Array.from(selectedResearchIds)
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error en compilación')

            const aiMsg: Message = {
                role: 'assistant',
                content: data.result,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, aiMsg])

        } catch (error: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ **Error de Compilación:** ${error.message}`,
                timestamp: new Date()
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const studioOptions = [
        { label: 'Resumen de Audio', icon: <Headphones size={20} />, type: 'podcast', desc: 'Conversación tipo podcast' },
        { label: 'Video Briefing', icon: <Video className="text-green-500" size={20} />, type: 'video', desc: 'Guion visual para video' },
        { label: 'Mapa Mental', icon: <Network className="text-purple-500" size={20} />, type: 'mindmap', desc: 'Estructura jerárquica' },
        { label: 'Dossier Ejecutivo', icon: <FileText className="text-orange-500" size={20} />, type: 'dossier', desc: 'Informe estratégico' },
        { label: 'Tarjetas (Flashcards)', icon: <Layers className="text-red-400" size={20} />, type: 'flashcards', desc: 'Ayudas de estudio' },
        { label: 'Cuestionario (Quiz)', icon: <HelpCircle className="text-blue-400" size={20} />, type: 'quiz', desc: 'Evaluación de conocimientos' },
        { label: 'Infografía', icon: <Image className="text-pink-500" size={20} />, type: 'infographic', desc: 'Plan visual estructurado' },
        { label: 'Presentación', icon: <Monitor className="text-yellow-500" size={20} />, type: 'presentation', desc: 'Estructura de diapositivas' },
        { label: 'Tabla de Datos', icon: <Table className="text-blue-600" size={20} />, type: 'matrix', desc: 'Matriz de trazabilidad' },
    ]

    return (
        <div className="flex h-[calc(100vh-140px)] bg-[#F8F9FA] dark:bg-[#1E1F20] text-gray-900 dark:text-gray-100 font-sans transition-colors rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl relative">

            {/* LEFT PANEL: SOURCE SELECTION */}
            <div className="w-[300px] border-r border-border flex flex-col bg-bg hidden md:flex shrink-0">
                {/* 1. Inventory Sources */}
                <div
                    className="p-4 border-b border-border flex justify-between items-center bg-panel/50 cursor-pointer hover:bg-panel transition-colors"
                    onClick={() => toggleSection('inventory')}
                >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2 select-none">
                        <ChevronDown size={14} className={`transition-transform duration-200 ${openSections.has('inventory') ? '' : '-rotate-90'}`} />
                        Inventario ({selectedAssetIds.size})
                    </h3>
                    <div onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                if (selectedAssetIds.size > 0) setSelectedAssetIds(new Set())
                                else setSelectedAssetIds(new Set(assets.filter(a => a.status === 'Validado').map(a => a.id)))
                            }}
                            className="text-[10px] text-accent font-bold hover:underline"
                        >
                            {selectedAssetIds.size > 0 ? 'Ninguna' : 'Todas'}
                        </button>
                    </div>
                </div>
                {openSections.has('inventory') && (
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 border-b border-border min-h-[100px] max-h-[30vh] no-scrollbar">
                        {assets.filter(a => a.status === 'Validado').map(asset => (
                            <div
                                key={asset.id}
                                onClick={() => toggleAsset(asset.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 group hover:shadow-sm ${selectedAssetIds.has(asset.id)
                                    ? 'bg-accent/5 border-accent/20 translate-x-1'
                                    : 'bg-transparent border-transparent hover:bg-panel hover:translate-x-1'
                                    }`}
                            >
                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedAssetIds.has(asset.id) ? 'bg-accent border-accent' : 'border-border'
                                    }`}>
                                    {selectedAssetIds.has(asset.id) && <Check size={10} className="text-white" />}
                                </div>
                                <div className="flex-1">
                                    <div className={`text-xs font-semibold leading-tight ${selectedAssetIds.has(asset.id) ? 'text-accent' : 'text-text-main opacity-80'}`}>
                                        {asset.title}
                                    </div>
                                    <div className="text-[9px] text-text-muted mt-1 opacity-60">{asset.id}</div>
                                </div>
                            </div>
                        ))}
                        {assets.filter(a => a.status === 'Validado').length === 0 && (
                            <div className="text-center p-8 text-xs text-text-muted italic">
                                No hay activos validados.
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Research Sources */}
                <div
                    className="p-4 border-b border-border flex justify-between items-center bg-panel/50 cursor-pointer hover:bg-panel transition-colors"
                    onClick={() => toggleSection('research')}
                >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2 select-none">
                        <ChevronDown size={14} className={`transition-transform duration-200 ${openSections.has('research') ? '' : '-rotate-90'}`} />
                        Investigación ({selectedResearchIds.size})
                    </h3>
                    <div onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                if (selectedResearchIds.size > 0) setSelectedResearchIds(new Set())
                                else setSelectedResearchIds(new Set(research.map(r => r.id)))
                            }}
                            className="text-[10px] text-accent font-bold hover:underline"
                        >
                            {selectedResearchIds.size > 0 ? 'Ninguna' : 'Todas'}
                        </button>
                    </div>
                </div>
                {openSections.has('research') && (
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50/50 dark:bg-black/20 min-h-[100px] max-h-[30vh] no-scrollbar">
                        {research.map(item => (
                            <div
                                key={item.id}
                                onClick={() => toggleResearch(item.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 group hover:shadow-sm ${selectedResearchIds.has(item.id)
                                    ? 'bg-purple-500/10 border-purple-500/30 translate-x-1'
                                    : 'bg-transparent border-transparent hover:bg-panel hover:translate-x-1'
                                    }`}
                            >
                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedResearchIds.has(item.id) ? 'bg-purple-500 border-purple-500' : 'border-border'
                                    }`}>
                                    {selectedResearchIds.has(item.id) && <Check size={10} className="text-white" />}
                                </div>
                                <div className="flex-1">
                                    <div className={`text-xs font-semibold leading-tight ${selectedResearchIds.has(item.id) ? 'text-purple-600 dark:text-purple-400' : 'text-text-main opacity-80'}`}>
                                        {item.title}
                                    </div>
                                    <div className="text-[9px] text-text-muted mt-1 opacity-60 line-clamp-1">{item.url || 'Documento Drive'}</div>
                                </div>
                            </div>
                        ))}
                        {research.length === 0 && (
                            <div className="text-center p-8 text-xs text-text-muted italic">
                                Sin fuentes disponibles.
                            </div>
                        )}
                    </div>
                )}

                {/* 3. History (New Section) */}
                <div
                    className="p-4 border-b border-border flex justify-between items-center bg-panel/50 cursor-pointer hover:bg-panel transition-colors"
                    onClick={() => toggleSection('history')}
                >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2 select-none">
                        <ChevronDown size={14} className={`transition-transform duration-200 ${openSections.has('history') ? '' : '-rotate-90'}`} />
                        Historial Reciente
                    </h3>
                </div>
                {openSections.has('history') && (
                    <div className="flex-1 overflow-y-auto p-0 border-t border-border min-h-[100px] no-scrollbar">
                        {history.map((h: any) => (
                            <div
                                key={h.id}
                                className="p-4 border-b border-border hover:bg-black/5 cursor-pointer group transition-all hover:pl-5 relative"
                                onClick={() => {
                                    setMessages((prev) => [
                                        ...prev,
                                        { role: 'user', content: `(Historial) ${h.prompt}`, timestamp: new Date() },
                                        { role: 'assistant', content: h.response, timestamp: new Date() }
                                    ])
                                }}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-1.5 rounded">{h.type}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-text-muted">{new Date(h.createdAt).toLocaleDateString()}</span>
                                        <button
                                            onClick={(e) => handleDeleteHistory(h.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-text-muted hover:text-red-500 transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-text-main line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                                    {h.prompt}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col relative bg-white dark:bg-[#131314]">

                {/* Header */}
                <header className="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">✨</span>
                        <h1 className="font-medium text-sm tracking-tight text-gray-600 dark:text-gray-300">Notebook 4Shine Studio</h1>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-[5%] py-8 scroll-smooth">

                    {/* STUDIO GRID (Only show if no messages or just welcome message) */}
                    {messages.length <= 1 && (
                        <div className="max-w-4xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h2 className="text-2xl font-normal text-gray-800 dark:text-white mb-6">Crear nuevo</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {studioOptions.map((opt) => (
                                    <button
                                        key={opt.label}
                                        onClick={() => handleSend(`Generar ${opt.label}`, opt.type)}
                                        className="flex flex-col gap-3 p-4 rounded-2xl bg-white dark:bg-[#1E1F20] border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 text-left group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/30 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-colors">
                                            {opt.icon}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-gray-700 dark:text-gray-200">{opt.label}</div>
                                            <div className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MESSAGES */}
                    <div className="space-y-8 max-w-3xl mx-auto">
                        {messages.slice(1).map((msg, idx) => (
                            <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* Role Label */}
                                <div className="flex items-center gap-3 mb-2">
                                    {msg.role === 'assistant' ? (
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={14} className="text-blue-500" />
                                            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">AI Studio</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <User size={12} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Solicitud</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className={`text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 ${msg.role === 'user' ? 'font-medium text-lg ml-8' : 'ml-8'}`}>
                                    {msg.content.includes('```mermaid') ? (
                                        <div className="w-full">
                                            {msg.content.split('```mermaid')[0]}
                                            <MermaidDiagram chart={msg.content.split('```mermaid')[1].split('```')[0].trim()} />
                                            {msg.content.split('```').slice(2).join('')}
                                        </div>
                                    ) : msg.content.includes('**HOST:**') || msg.content.includes('graph TD') || msg.content.includes('|') ? (
                                        <div className="bg-gray-50 dark:bg-[#1E1F20] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-sm">
                                            <pre className="whitespace-pre-wrap font-mono text-xs">{msg.content}</pre>
                                        </div>
                                    ) : (
                                        msg.content.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="ml-8 flex items-center gap-3 animate-pulse opacity-50">
                                <Loader2 size={16} className="animate-spin text-blue-500" />
                                <span className="text-xs font-semibold text-blue-500 uppercase tracking-widest">Generando...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-20" />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 px-[15%] pointer-events-none sticky bottom-0 z-20">
                    <div className="pointer-events-auto relative shadow-2xl shadow-blue-500/10 rounded-3xl bg-white/90 dark:bg-[#1E1F20]/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/30 transition-all duration-300">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Haz una pregunta o describe lo que quieres generar..."
                            className="w-full bg-transparent border-none text-base p-4 pr-12 focus:ring-0 resize-none max-h-32 min-h-[56px] placeholder:text-gray-400 rounded-3xl"
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                        >
                            {loading ? <StopCircle size={18} /> : <Send size={18} />}
                        </button>
                    </div>
                    <div className="text-center mt-2 text-[10px] text-gray-400 font-medium pb-2">
                        Notebook 4Shine Studio • Model gemini-2.0-flash
                    </div>
                </div>
            </div>
        </div >
    )
}
