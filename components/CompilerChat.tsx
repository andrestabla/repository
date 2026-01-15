'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Terminal, Cpu, User, Sparkles, StopCircle, Bot, Loader2 } from 'lucide-react'

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

        try {
            const res = await fetch('/api/generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.content })
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
        "Crear Matriz de Trazabilidad JSON",
        "Diseñar Estructura de Toolkit",
        "Analizar Gaps Metodológicos"
    ]

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] bg-panel border border-border rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-bg/50 border-b border-border p-4 flex justify-between items-center backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20 text-accent">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                            Compiler AI
                            <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[9px] border border-green-500/20">ONLINE</span>
                        </h3>
                        <p className="text-[10px] text-text-muted font-mono">Gemini 1.5 Pro • Contexto Completo</p>
                    </div>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg/30">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shrink-0 shadow-lg shadow-accent/20 mt-1">
                                <Bot size={16} />
                            </div>
                        )}

                        <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                ? 'bg-white text-gray-900 rounded-tr-none font-medium'
                                : 'bg-panel border border-border text-text-main rounded-tl-none font-sans'
                            }`}>
                            {msg.content}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0 mt-1">
                                <User size={16} />
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4 items-center animate-pulse opacity-50">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="text-xs text-text-muted font-mono flex items-center gap-2">
                            <Loader2 size={12} className="animate-spin" />
                            Compilando respuesta...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-panel border-t border-border">
                {messages.length === 1 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {quickActions.map(action => (
                            <button
                                key={action}
                                onClick={() => { setInput(action); }}
                                className="px-3 py-1.5 rounded-lg border border-border bg-bg hover:border-accent hover:text-accent text-[10px] transition-colors text-text-muted font-medium"
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                )}

                <div className="relative group">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe el entregable que necesitas (ej: 'Genera un documento que explique el pilar Shine In')..."
                        className="w-full bg-bg border-2 border-border rounded-2xl p-4 pr-14 text-sm focus:border-accent outline-none transition-all resize-none shadow-inner"
                        rows={2}
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-accent text-white rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-accent/20"
                    >
                        {loading ? <StopCircle size={18} /> : <Send size={18} />}
                    </button>
                </div>
                <div className="text-[10px] text-center text-text-muted mt-3 opacity-40">
                    4Shine AI puede cometer errores. Verifica la información crítica.
                </div>
            </div>
        </div>
    )
}
