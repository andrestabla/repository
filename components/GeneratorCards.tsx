'use client'

import React, { useState } from 'react'
import { FileText, Table, FolderOpen, Terminal, Download, Loader2, Copy, X } from 'lucide-react'

type GenType = 'dossier' | 'matrix' | 'toolkit'

export default function GeneratorCards() {
    const [loading, setLoading] = useState(false)
    const [consoleLog, setConsoleLog] = useState<string[]>([])
    const [result, setResult] = useState<{ type: GenType, content: string } | null>(null)

    const generators = [
        {
            id: 'dossier',
            label: 'Dossier (PDF)',
            desc: 'Narrativa ejecutiva y resumen de impacto.',
            icon: <FileText size={20} className="text-blue-400" />
        },
        {
            id: 'matrix',
            label: 'Matriz (Excel)',
            desc: 'Tabla estructurada de trazabilidad.',
            icon: <Table size={20} className="text-green-400" />
        },
        {
            id: 'toolkit',
            label: 'Toolkit (ZIP)',
            desc: 'Estructura de carpetas y guía de implementación.',
            icon: <FolderOpen size={20} className="text-yellow-400" />
        }
    ]

    const addLog = (msg: string) => setConsoleLog(prev => [...prev.slice(-4), msg])

    const handleGenerate = async (type: GenType) => {
        setLoading(true)
        setResult(null)
        setConsoleLog([])

        try {
            addLog(`[INIT] Iniciando motor de compilación para: ${type.toUpperCase()}...`)
            addLog(`[DB] Consultando activos VALIDADOS en Neon (PostgreSQL)...`)

            // Simulating a slight delay for UX perception of "work"
            await new Promise(r => setTimeout(r, 800))
            addLog(`[AI] Conectando con Gemini 1.5 Pro (Context Window 1M)...`)

            const res = await fetch('/api/generator', {
                method: 'POST',
                body: JSON.stringify({ type })
            })

            if (!res.ok) throw new Error(await res.text())

            const data = await res.json()
            addLog(`[SUCCESS] Procesados ${data.count} activos exitosamente.`)
            setResult({ type, content: data.result })

        } catch (error: any) {
            addLog(`[ERROR] ${error.message}`)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (result) {
            navigator.clipboard.writeText(result.content)
            alert('Contenido copiado al portapapeles.')
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {generators.map((gen) => (
                    <div
                        key={gen.id}
                        onClick={() => !loading && handleGenerate(gen.id as GenType)}
                        className={`
                            bg-panel border border-border rounded-xl p-6 flex flex-col gap-4 cursor-pointer 
                            transition-all duration-300 group relative overflow-hidden
                            ${loading ? 'opacity-50 pointer-events-none' : 'hover:border-accent hover:-translate-y-1 hover:shadow-lg'}
                        `}
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            {gen.icon}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/5 rounded-lg border border-white/10 group-hover:bg-accent/10 group-hover:border-accent/30 transition-colors">
                                {gen.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm uppercase tracking-wide text-text-main">{gen.label}</h3>
                                <p className="text-[10px] text-text-muted mt-0.5 font-mono">v1.0 (Snapshot)</p>
                            </div>
                        </div>

                        <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                            {gen.desc}
                        </p>

                        <div className="mt-auto pt-4 border-t border-border flex justify-between items-center text-[10px] font-mono text-text-muted">
                            <span>AUTO-GENERADO</span>
                            <span className="text-accent group-hover:translate-x-1 transition-transform">INICIAR &rarr;</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Console / Output Area */}
            <div className="bg-black/80 rounded-xl border border-border overflow-hidden shadow-2xl backdrop-blur-sm min-h-[150px]">
                {/* Console Header */}
                <div className="bg-white/5 border-b border-border px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-blue-400">
                        <Terminal size={12} />
                        <span className="uppercase font-bold tracking-widest">Consola de Compilación</span>
                    </div>
                    <div className="flex gap-1.5 code-dots">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                </div>

                {/* Console Body */}
                <div className="p-6 font-mono text-xs space-y-2 max-h-[400px] overflow-y-auto">
                    {/* Idle State */}
                    {!loading && consoleLog.length === 0 && !result && (
                        <div className="text-center text-text-muted py-8 opacity-40">
                            Esperando instrucción de compilación...
                        </div>
                    )}

                    {/* Logs */}
                    {consoleLog.map((log, i) => (
                        <div key={i} className={`
                            ${log.includes('[ERROR]') ? 'text-red-400' :
                                log.includes('[SUCCESS]') ? 'text-green-400' : 'text-text-muted'}
                        `}>
                            <span className="opacity-50 mr-2">{new Date().toLocaleTimeString()}</span>
                            {log}
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="flex items-center gap-2 text-accent animate-pulse mt-4">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Procesando contexto con IA...</span>
                        </div>
                    )}

                    {/* Result View */}
                    {result && !loading && (
                        <div className="mt-6 border-t border-white/10 pt-6 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-white font-bold flex items-center gap-2">
                                    Resultado Generado: <span className="text-accent uppercase">{result.type}</span>
                                </h4>
                                <div className="flex gap-2">
                                    <button onClick={copyToClipboard} className="p-1.5 hover:bg-white/10 rounded-md text-text-muted hover:text-white transition-colors" title="Copiar">
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 text-text-muted overflow-auto max-h-[300px] whitespace-pre-wrap border border-white/5 text-[11px]">
                                {result.content}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
