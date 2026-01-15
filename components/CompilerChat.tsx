'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Terminal, Cpu, User, Sparkles, StopCircle, Bot, Loader2, Headphones, Database } from 'lucide-react'

type Message = {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export default function CompilerChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hola. Soy el Motor de Compilación 4Shine. Tengo acceso a todos los activos validados del inventario. ¿Qué entregable o análisis necesitas generar hoy?',
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMsg: Message = { role: 'user', content: input, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        // Detect Intent for Quick Actions
        let type = undefined
        const cleanInput = userMsg.content.toLowerCase()
        if (cleanInput.includes('dossier')) type = 'dossier'
        else if (cleanInput.includes('Overview') || cleanInput.includes('podcast')) type = 'podcast'
        else if (cleanInput.includes('matriz') || cleanInput.includes('trazabilidad')) type = 'matrix'
        else if (cleanInput.includes('toolkit') || cleanInput.includes('estructura')) type = 'toolkit'

        try {
            const res = await fetch('/api/generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    type: type
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

    // Quick Actions
    const quickActions = [
        "Generar Dossier Ejecutivo",
        "Generar Podcast (Audio Overview)",
        "Crear Matriz de Trazabilidad JSON",
        "Analizar Gaps Metodológicos"
    ]

    // --- NotebookLM UI Components ---

    return (
        <div className="flex h-[calc(100vh-140px)] bg-[#F8F9FA] dark:bg-[#1E1F20] text-gray-900 dark:text-gray-100 font-sans transition-colors rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl relative">

            {/* LEFT PANEL: SOURCES (NotebookLM Style) */}
            <div className="w-[300px] border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-[#131314] hidden md:flex">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-semibold tracking-tight text-gray-500 uppercase flex items-center gap-2">
                        <Database size={14} />
                        Fuentes ({new Set(messages.flatMap(m => m.content.match(/\[Fuente:.*?\]/g) || [])).size} citadas)
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1F20] hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <div className="flex items-start gap-3">
                            <div className="mt-1 text-blue-500"><Terminal size={18} /></div>
                            <div>
                                <div className="text-xs font-bold text-gray-700 dark:text-gray-300">Inventario Validado</div>
                                <div className="text-[10px] text-gray-500 mt-1">Fuente de Verdad (4Shine)</div>
                            </div>
                        </div>
                    </div>

                    {/* Placeholder for dynamic source list if we had it passed down */}
                    <div className="text-xs text-center text-gray-400 mt-8 italic px-4">
                        El Asistente utiliza automáticamente todos los activos marcados como "Validado" en el inventario.
                    </div>
                </div>

                {/* Audio Overview Teaser */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                            <Headphones size={14} fill="currentColor" />
                        </div>
                        <div className="text-xs font-bold">Audio Overview</div>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3 leading-tight">Genera una conversación profunda tipo podcast sobre tu inventario.</p>
                    <button
                        onClick={() => setInput("Generar Podcast (Audio Overview)")}
                        className="w-full py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold shadow-sm hover:scale-[1.02] transition-transform"
                    >
                        Generar Guion
                    </button>
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            <div className="flex-1 flex flex-col relative bg-white dark:bg-[#131314]">

                {/* Header */}
                <header className="h-16 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">✨</span>
                        <h1 className="font-medium text-lg tracking-tight">Notebook 4Shine</h1>
                        <span className="bg-gray-100 dark:bg-gray-800 text-[10px] px-2 py-0.5 rounded-full font-bold text-gray-500 ml-2">EXPERIMENTAL</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-400">Gemini 2.0 Flash</div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500" />
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-[10%] py-8 space-y-8 scroll-smooth">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`animate-in fade-in slide-in-from-bottom-2 duration-500 ${msg.role === 'user' ? 'opacity-100' : ''}`}>

                            {/* Role Label */}
                            <div className="flex items-center gap-3 mb-2">
                                {msg.role === 'assistant' ? (
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={16} className="text-blue-500" />
                                        <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Respuesta</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <User size={12} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tú</span>
                                    </div>
                                )}
                            </div>

                            {/* Content Bubble (NotebookLM Style: No Bubble, Just Text) */}
                            <div className={`text-[15px] leading-7 text-gray-800 dark:text-gray-200 font-medium max-w-3xl ${msg.role === 'user' ? 'text-xl font-normal text-gray-500 dark:text-gray-400 ml-8' : 'ml-8'}`}>
                                {msg.content.includes('**HOST:**') ? (
                                    <div className="bg-gray-50 dark:bg-[#1E1F20] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-white dark:bg-black rounded-full shadow-sm"><Headphones size={16} /></div>
                                                <span className="font-bold text-sm">Audio Overview Script</span>
                                            </div>
                                            <div className="text-[10px] font-mono opacity-50">GENERADO POR AI</div>
                                        </div>
                                        <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap opacity-80 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                                            {msg.content}
                                        </div>
                                    </div>
                                ) : (
                                    msg.content.split('\n').map((line, i) => (
                                        <p key={i} className="mb-4">{line}</p>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="ml-8 flex items-center gap-3 animate-pulse opacity-50">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-100" />
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-200" />
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-widest">Analizando...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-20" />
                </div>

                {/* Input Area (Floating) */}
                <div className="absolute bottom-6 left-0 right-0 px-[10%] pointer-events-none">
                    <div className="pointer-events-auto max-w-3xl mx-auto bg-white dark:bg-[#1E1F20] rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-700 p-2 flex flex-col gap-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20">

                        {/* Selected Files / Context Indicators would go here */}

                        <div className="relative flex items-end gap-2 p-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Haz una pregunta sobre tus fuentes..."
                                className="w-full bg-transparent border-none text-base p-3 focus:ring-0 resize-none max-h-32 min-h-[56px] placeholder:text-gray-400"
                                rows={1}
                                disabled={loading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="p-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg"
                            >
                                {loading ? <StopCircle size={20} /> : <Send size={20} />}
                            </button>
                        </div>

                        {/* Quick Chips Inside Input */}
                        {messages.length === 1 && (
                            <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
                                {quickActions.map(action => (
                                    <button
                                        key={action}
                                        onClick={() => setInput(action)}
                                        className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="text-center mt-3 text-[10px] text-gray-400 font-medium">
                        Notebook 4Shine puede mostrar info inexacta, por favor verifica sus fuentes.
                    </div>
                </div>

            </div>
        </div>
    )
}
