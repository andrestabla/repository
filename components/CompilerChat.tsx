import React, { useState, useRef, useEffect } from 'react'
import { Send, Terminal, Cpu, User, Sparkles, StopCircle, Bot, Loader2, Headphones, Database, Video, Network, FileText, Layers, HelpCircle, Image, Monitor, Table, Check, Globe, ChevronDown, Trash2, Maximize2, Minimize2, X, Download, Code, ZoomIn, ZoomOut, Settings, Mic, Volume2 } from 'lucide-react'

// ... existing code ...

import mermaid from 'mermaid'
import InfographicRenderer from './InfographicRenderer'

type Message = {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}


// Helper Component for Mermaid


// Enhanced Mermaid Component
const MermaidDiagram = ({ chart }: { chart: string }) => {
    const ref = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isZoomed, setIsZoomed] = useState(false)
    const [zoomLevel, setZoomLevel] = useState(1)

    useEffect(() => {
        if (chart) {
            setError(null)
            mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' })
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`

            try {
                mermaid.render(id, chart)
                    .then(({ svg }) => setSvg(svg))
                    .catch((e) => {
                        console.error("Mermaid render error:", e)
                        setError("Error visualizando diagrama. Mostrando código fuente.")
                    })
            } catch (e: any) {
                console.error("Mermaid sync error:", e)
                setError(e.message)
            }
        }
    }, [chart])

    const handleDownloadSVG = () => {
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'diagrama_4shine.svg'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleDownloadPNG = () => {
        const svgElement = ref.current?.querySelector('svg')
        if (!svgElement) return

        // 1. Get exact dimensions
        const box = svgElement.getBoundingClientRect()
        // Use intrinsic dimensions if available, else clientRect
        const width = box.width || parseInt(svgElement.getAttribute('width') || '0')
        const height = box.height || parseInt(svgElement.getAttribute('height') || '0')

        // 2. Clone and Prepare SVG
        const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement
        clonedSvg.setAttribute('width', width.toString())
        clonedSvg.setAttribute('height', height.toString())
        clonedSvg.style.backgroundColor = 'white'

        // 3. EMBED STYLES (Criticial for Mermaid/Canvas)
        const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style")
        let cssText = ""
        // Naive but effective: grab all styles to ensure mermaid classes are present
        const sheets = document.querySelectorAll('style, link[rel="stylesheet"]')
        sheets.forEach(sheet => {
            if (sheet.tagName === 'STYLE') {
                cssText += sheet.textContent + "\n"
            }
        })
        styleElement.textContent = cssText
        clonedSvg.insertBefore(styleElement, clonedSvg.firstChild)

        const data = (new XMLSerializer()).serializeToString(clonedSvg)
        const img = new window.Image()
        const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        img.onload = function () {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const scale = 2 // High Res

            canvas.width = width * scale
            canvas.height = height * scale

            if (ctx) {
                ctx.scale(scale, scale)
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0, width, height)
            }

            const pngUrl = canvas.toDataURL('image/png')
            const downloadLink = document.createElement('a')
            downloadLink.href = pngUrl
            downloadLink.download = 'diagrama_4shine.png'
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
            URL.revokeObjectURL(url)
        }
        img.src = url
    }

    if (error) {
        return (
            <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200 text-xs font-mono">
                <div className="text-red-500 font-bold mb-2">⚠️ {error}</div>
                <pre className="whitespace-pre-wrap text-gray-700">{chart}</pre>
            </div>
        )
    }

    const DiagramContent = () => (
        <div
            dangerouslySetInnerHTML={{ __html: svg }}
            className="w-full flex justify-center"
        />
    )

    return (
        <>
            {/* Standard View */}
            <div className="my-6 relative group" ref={ref}>
                <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

                    {/* Toolbar */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1.5 rounded-lg border border-gray-200 shadow-sm backdrop-blur-sm z-10">
                        <button onClick={handleDownloadSVG} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 tooltip-trigger" title="SVG">
                            <Code size={16} />
                        </button>
                        <button onClick={handleDownloadPNG} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-green-600 tooltip-trigger" title="PNG">
                            <Download size={16} />
                        </button>
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        <button onClick={() => { setIsZoomed(true); setZoomLevel(1); }} className="p-1.5 hover:bg-gray-100 rounded text-blue-500 hover:text-blue-700 tooltip-trigger" title="Ampliar">
                            <Maximize2 size={16} />
                        </button>
                    </div>

                    {/* Diagram */}
                    <div className="overflow-x-auto">
                        <DiagramContent />
                    </div>
                </div>
            </div>

            {/* Modal for Zoom */}
            {isZoomed && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden">

                        {/* Modal Header */}
                        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-gray-50/50 shrink-0">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-gray-700">Vista Detallada</h3>
                                {/* Zoom Controls */}
                                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md p-1">
                                    <button
                                        onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                        title="Reducir"
                                    >
                                        <ZoomOut size={16} />
                                    </button>
                                    <span className="text-xs font-mono w-12 text-center text-gray-500">{Math.round(zoomLevel * 100)}%</span>
                                    <button
                                        onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                        title="Aumentar"
                                    >
                                        <ZoomIn size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={handleDownloadPNG} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                                    <Download size={14} /> Descargar PNG
                                </button>
                                <div className="w-px h-4 bg-gray-300 mx-2" />
                                <button onClick={() => setIsZoomed(false)} className="p-2 hover:bg-gray-200/50 rounded-full text-gray-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body (Scrollable with Zoom) */}
                        <div className="flex-1 overflow-auto bg-graph-paper relative">
                            <div
                                className="min-w-full min-h-full flex items-center justify-center p-20 transition-transform duration-200 ease-out origin-center"
                                style={{ transform: `scale(${zoomLevel})` }}
                            >
                                <div className="bg-white shadow-sm p-4 rounded-lg border border-gray-100">
                                    <DiagramContent />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// --- SUB-COMPONENTS FOR TYPES ---

const FlashcardList = ({ cards }: { cards: any[] }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            {cards.map((card, idx) => (
                <div key={idx} className="bg-white dark:bg-[#1E1F20] p-6 rounded-xl border-2 border-indigo-100 dark:border-indigo-900/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[180px]">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Pregunta</div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{card.question}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Respuesta</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{card.answer}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

const QuizView = ({ questions }: { questions: any[] }) => {
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [showResults, setShowResults] = useState(false)

    return (
        <div className="space-y-6 my-6 max-w-2xl">
            {questions.map((q, idx) => {
                const isCorrect = answers[idx] === q.correctAnswer
                return (
                    <div key={idx} className={`p-6 rounded-2xl border-l-4 ${showResults ? (isCorrect ? 'border-l-emerald-500 bg-emerald-50/10' : 'border-l-red-500 bg-red-50/10') : 'border-l-blue-500 bg-white dark:bg-[#1E1F20]'} shadow-sm`}>
                        <p className="font-bold text-lg mb-4">{idx + 1}. {q.question}</p>
                        <div className="space-y-2">
                            {q.options.map((opt: string) => {
                                const optLetter = opt.charAt(0) // Assuming "A) Answer"
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => setAnswers(p => ({ ...p, [idx]: optLetter }))}
                                        disabled={showResults}
                                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors border ${answers[idx] === optLetter
                                            ? 'bg-blue-100 border-blue-500 text-blue-900'
                                            : 'hover:bg-gray-50 dark:hover:bg-white/5 border-gray-200 dark:border-gray-700'
                                            } ${showResults && q.correctAnswer === optLetter ? '!bg-emerald-100 !border-emerald-500 !text-emerald-900' : ''}`}
                                    >
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>
                        {showResults && (
                            <div className="mt-4 text-xs p-3 bg-black/5 rounded font-mono">
                                {isCorrect ? '✅ Correcto' : `❌ Correcto: ${q.correctAnswer}`}. {q.explanation}
                            </div>
                        )}
                    </div>
                )
            })}
            {!showResults && (
                <button onClick={() => setShowResults(true)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105">
                    Verificar Respuestas
                </button>
            )}
        </div>
    )
}

const PresentationView = ({ slides }: { slides: any[] }) => {
    const [current, setCurrent] = useState(0)
    return (
        <div className="my-6 bg-white dark:bg-[#1E1F20] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden aspect-video flex flex-col">
            <div className="flex-1 p-12 flex flex-col justify-center">
                <div className="uppercase tracking-widest text-xs font-bold text-blue-500 mb-4">Slide {current + 1} / {slides.length}</div>
                <h2 className="text-3xl md:text-4xl font-black mb-8 text-gray-900 dark:text-white">{slides[current].title}</h2>
                <ul className="space-y-4 mb-8">
                    {slides[current].bullets?.map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-lg text-gray-700 dark:text-gray-300">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            {b}
                        </li>
                    ))}
                </ul>
                {slides[current].visual && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg text-xs text-yellow-700 dark:text-yellow-400 italic">
                        📸 Sugerencia Visual: {slides[current].visual}
                    </div>
                )}
            </div>
            <div className="h-16 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
                <button
                    disabled={current === 0}
                    onClick={() => setCurrent(c => c - 1)}
                    className="p-2 hover:bg-black/5 rounded-full disabled:opacity-30"
                >
                    Anterior
                </button>
                <div className="flex gap-1">
                    {slides.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    ))}
                </div>
                <button
                    disabled={current === slides.length - 1}
                    onClick={() => setCurrent(c => c + 1)}
                    className="p-2 hover:bg-black/5 rounded-full disabled:opacity-30"
                >
                    Siguiente
                </button>
            </div>
        </div>
    )
}

const PodcastView = ({ script }: { script: string }) => {
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showConfig, setShowConfig] = useState(false)
    const [selectedVoice, setSelectedVoice] = useState('alloy')

    const voices = [
        { id: 'alloy', name: 'Alloy', desc: 'Neutral/Versátil' },
        { id: 'echo', name: 'Echo', desc: 'Masculino' },
        { id: 'fable', name: 'Fable', desc: 'Británico' },
        { id: 'onyx', name: 'Onyx', desc: 'Profundo' },
        { id: 'nova', name: 'Nova', desc: 'Femenino/Enérgico' },
        { id: 'shimmer', name: 'Shimmer', desc: 'Femenino/Claro' }
    ]

    const generateAudio = async () => {
        setLoading(true)
        setError(null)
        setShowConfig(false)
        try {
            const res = await fetch('/api/audio/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: script, voice: selectedVoice })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Error generando audio')
            }

            // Handle binary response (Blob)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            setAudioUrl(url)

        } catch (e: any) {
            console.error(e)
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-50 dark:bg-[#1E1F20] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Headphones className="text-pink-500" size={20} />
                    <h3 className="font-bold text-gray-700 dark:text-gray-200">Guion de Podcast Generado</h3>
                </div>
                {!audioUrl && (
                    <div className="relative">
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={12} className="animate-spin" /> : <Settings size={12} />}
                            {loading ? 'Generando...' : 'Generar Audio'}
                        </button>
                        {showConfig && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#252627] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-10">
                                <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-2">Selecciona una Voz</h4>
                                <div className="space-y-1 mb-3">
                                    {voices.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVoice(v.id)}
                                            className={`w-full text-left px-2 py-1.5 rounded text-xs flex justify-between items-center ${selectedVoice === v.id ? 'bg-pink-50 text-pink-600' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                        >
                                            <span>{v.name} <span className="opacity-50 text-[9px]">({v.desc})</span></span>
                                            {selectedVoice === v.id && <Check size={10} />}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={generateAudio} className="w-full py-1.5 bg-pink-600 text-white rounded text-xs font-bold hover:bg-pink-700">Confirmar</button>
                            </div>
                        )}
                        {showConfig && <div className="fixed inset-0 z-0" onClick={() => setShowConfig(false)} />}
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                    ⚠️ {error}
                </div>
            )}

            {audioUrl && (
                <div className="mb-6 p-4 bg-white dark:bg-black/20 rounded-xl border border-pink-100 dark:border-pink-900/30">
                    <div className="text-xs font-bold text-pink-500 mb-2 uppercase tracking-wide">Audio Generado</div>
                    <audio controls src={audioUrl} className="w-full h-8" />
                </div>
            )}

            <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-xs bg-transparent border-0 p-0 text-gray-600 dark:text-gray-400">
                    {script}
                </pre>
            </div>
        </div>
    )
}

export default function CompilerChat({ assets = [], research = [] }: { assets?: any[], research?: any[] }) {
    // ... (rest of component state) ...
    // ...
    // Jump to render logic:

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

    // Agent Configuration State
    const [showAgentSettings, setShowAgentSettings] = useState(false)
    const [agentConfig, setAgentConfig] = useState({
        tone: 'Profesional, Analítico y Directo',
        instructions: ''
    })

    // Deep Search Toggle
    const [useDeepSearch, setUseDeepSearch] = useState(false)
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const toggleSection = (section: string) => {
        const next = new Set(openSections)
        if (next.has(section)) next.delete(section)
        else next.add(section)
        setOpenSections(next)
    }

    const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
        // ... (existing code)
    }

    // ... (existing effects)

    const handleSend = async (overrideInput?: string, overrideType?: string) => {
        const textToSend = overrideInput || input
        if (!textToSend.trim() || loading) return

        const userMsg: Message = { role: 'user', content: textToSend, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        if (!overrideInput) setInput('')
        setLoading(true)

        // Detect Intent
        // ... (existing intent detection logic)
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
                    selectedResearchIds: Array.from(selectedResearchIds),
                    tone: agentConfig.tone,
                    customInstructions: agentConfig.instructions,
                    useDeepSearch: useDeepSearch // PASS FLAG
                })
            })
            // ... (rest of handler)
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
                    <button
                        onClick={() => setShowAgentSettings(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        title="Configuración del Agente"
                    >
                        <Settings size={18} />
                    </button>
                </header>

                {/* Agent Settings Modal */}
                {showAgentSettings && (
                    <div className="absolute top-16 right-6 z-30 w-80 bg-white dark:bg-[#1E1F20] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                <Bot size={16} className="text-blue-500" /> Configuración de Agente
                            </h3>
                            <button onClick={() => setShowAgentSettings(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Tono de Respuesta</label>
                                <select
                                    value={agentConfig.tone}
                                    onChange={e => setAgentConfig(p => ({ ...p, tone: e.target.value }))}
                                    className="w-full text-xs p-2.5 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 outline-none focus:border-blue-500"
                                >
                                    <option>Profesional, Analítico y Directo</option>
                                    <option>Creativo, Inspirador y Visionario</option>
                                    <option>Casual, Cercano y Simplificado</option>
                                    <option>Académico, Riguroso y Detallado</option>
                                    <option>Socrático (Basado en preguntas)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Instrucciones de Sistema</label>
                                <textarea
                                    value={agentConfig.instructions}
                                    onChange={e => setAgentConfig(p => ({ ...p, instructions: e.target.value }))}
                                    placeholder="Ej: Prioriza fuentes de investigación sobre activos internos. Usa analogías deportivas..."
                                    className="w-full text-xs p-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 outline-none focus:border-blue-500 min-h-[80px] resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                            <button
                                onClick={() => setShowAgentSettings(false)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                                Guardar Preferencias
                            </button>
                        </div>
                    </div>
                )}

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
                                    ) : (msg.content.trim().startsWith('{') || (msg.content.includes('"type"') && msg.content.includes('"sections"'))) ? (
                                        <div className="w-full">
                                            {/* Try to parse even if there is junk around */}
                                            {(() => {
                                                try {
                                                    // Clean potential markdown
                                                    const cleanJson = msg.content.replace(/```json/g, '').replace(/```/g, '').trim()
                                                    const data = JSON.parse(cleanJson)

                                                    // Renderers
                                                    if (data.type === 'mindmap' && data.mermaid) return <MermaidDiagram chart={data.mermaid} />
                                                    if (data.type === 'flashcards' && data.cards) return <FlashcardList cards={data.cards} />
                                                    if (data.type === 'quiz' && data.questions) return <QuizView questions={data.questions} />
                                                    if (data.type === 'presentation' && data.slides) return <PresentationView slides={data.slides} />

                                                    // Infographic Fallback
                                                    if (data.sections && data.sections.length > 0) {
                                                        return <InfographicRenderer data={data} />
                                                    }

                                                    // DEBUG FALLBACK: Show Raw JSON if structure is unrecognized
                                                    return (
                                                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                                            <div className="text-xs font-bold text-orange-600 mb-2">Estructura JSON No Reconocida (Debug v3.1 - Priority Fix):</div>
                                                            <pre className="text-[10px] font-mono whitespace-pre-wrap text-gray-700 bg-white p-2 rounded border border-orange-100">
                                                                {JSON.stringify(data, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )

                                                } catch (e) {
                                                    // Fallback to text if not really json
                                                    return msg.content.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)
                                                }
                                            })()}
                                        </div>
                                    ) : msg.content.includes('**HOST:**') || msg.content.includes('graph TD') || msg.content.includes('|') ? (
                                        msg.content.includes('**HOST:**') ? (
                                            <PodcastView script={msg.content} />
                                        ) : (
                                            <div className="bg-gray-50 dark:bg-[#1E1F20] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-sm">
                                                <pre className="whitespace-pre-wrap font-mono text-xs">{msg.content}</pre>
                                            </div>
                                        )
                                    ) : (
                                        msg.content.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="ml-8 flex items-center gap-3 animate-pulse opacity-80">
                                <img src="https://imageneseiconos.s3.us-east-1.amazonaws.com/iconos/loading.gif" alt="Loading..." className="w-6 h-6 object-contain" />
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
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setUseDeepSearch(!useDeepSearch)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${useDeepSearch
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-white dark:bg-black/20 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-blue-500'
                                    }`}
                                title={useDeepSearch ? 'Búsqueda Profunda: Activada' : 'Búsqueda Profunda: Desactivada'}
                            >
                                <Globe size={16} />
                                <span className="hidden sm:inline">Web / General</span>
                            </button>
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || loading}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                <span className="hidden sm:inline">Compilar</span>
                            </button>
                        </div>
                    </div>
                    <div className="text-center mt-2 text-[10px] text-gray-400 font-medium pb-2">
                        Notebook 4Shine Studio • Model GPT-4o
                    </div>
                </div>
            </div>
        </div >
    )
}
