'use client';

import React, { useState, useEffect } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import { Book, ChevronRight, ChevronLeft, RefreshCw, Download, Sparkles, BrainCircuit, Loader2 } from 'lucide-react';
import { DB, SCALES, PILLAR_INFO, COMP_DEFINITIONS } from './DiagnosticsData';
import ReactMarkdown from 'react-markdown'; // Ensure this or simple renderer

// --- TYPES ---
interface UserState {
    username: string;
    role: string;
    answers: Record<number, number>; // questionId -> score
    currentIdx: number;
}

type Step = 'intro' | 'instructions' | 'quiz' | 'results';

const ITEMS_PER_PAGE = 6;

export default function DiagnosticsPage() {
    // --- STATE ---
    const [step, setStep] = useState<Step>('intro');
    const [userState, setUserState] = useState<UserState>({
        username: '',
        role: 'Director/C-Level',
        answers: {},
        currentIdx: 0,
    });

    // --- INIT / PERSISTENCE ---
    useEffect(() => {
        const saved = localStorage.getItem('4shine_full_v1');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setUserState(parsed);
            } catch (e) {
                console.error('Failed to load state', e);
            }
        }
    }, []);

    const saveState = (newState: UserState) => {
        setUserState(newState);
        localStorage.setItem('4shine_full_v1', JSON.stringify(newState));
    };

    const handleStart = () => {
        if (!userState.username.trim()) {
            alert('Por favor ingresa tu nombre.');
            return;
        }
        setStep('instructions');
    };

    const handleStartQuiz = () => {
        setStep('quiz');
        window.scrollTo(0, 0);
    };

    const handleReset = () => {
        if (confirm('¿Reiniciar todo? Se perderán tus respuestas.')) {
            localStorage.removeItem('4shine_full_v1');
            window.location.reload();
        }
    };

    const handleAnswer = (qId: number, val: number) => {
        const newAnswers = { ...userState.answers, [qId]: val };
        saveState({ ...userState, answers: newAnswers });
    };

    const handleNextPage = () => {
        const start = userState.currentIdx;
        const end = Math.min(start + ITEMS_PER_PAGE, DB.length);
        const pageItems = DB.slice(start, end);

        // Validate
        const missing = pageItems.find((i) => !userState.answers[i.id]);
        if (missing) {
            alert('Por favor responde todas las preguntas antes de continuar.');
            return;
        }

        if (end >= DB.length) {
            setStep('results');
        } else {
            saveState({ ...userState, currentIdx: end });
            window.scrollTo(0, 0);
        }
    };

    const handlePrevPage = () => {
        const newIdx = Math.max(0, userState.currentIdx - ITEMS_PER_PAGE);
        saveState({ ...userState, currentIdx: newIdx });
        window.scrollTo(0, 0);
    };

    const handleDemo = () => {
        if (confirm("¿Cargar datos de prueba? Se sobrescribirá tu progreso.")) {
            const demoAnswers: Record<number, number> = {};
            DB.forEach(q => {
                demoAnswers[q.id] = Math.floor(Math.random() * 3) + 2; // Random 2-4
            });
            setUserState({
                username: "Usuario Demo",
                role: "Invitado",
                answers: demoAnswers,
                currentIdx: DB.length
            });
            setStep('results');
        }
    };


    // --- RENDERERS ---

    if (step === 'intro') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[32px] p-8 md:p-12 max-w-3xl w-full text-center animate-in fade-in zoom-in duration-500">
                    <div className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                        Diagnóstico Ejecutivo 2026
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                        Sistema de Escalamiento Estratégico <span className="text-indigo-600">4Shine</span>
                    </h1>
                    <p className="text-slate-500 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                        Mapea tu madurez en los 4 pilares: <strong className="text-indigo-600">Within, Out, Up y Beyond</strong>.
                    </p>

                    <div className="max-w-sm mx-auto space-y-4 text-left">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                            <input
                                value={userState.username}
                                onChange={(e) => setUserState({ ...userState, username: e.target.value })}
                                className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Ej: Andrés Tabla"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Rol Actual</label>
                            <select
                                value={userState.role}
                                onChange={(e) => setUserState({ ...userState, role: e.target.value })}
                                className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all"
                            >
                                <option value="Director/C-Level">Director / C-Level</option>
                                <option value="Gerente">Gerente</option>
                                <option value="Lider de Equipo">Líder de Equipo</option>
                                <option value="Emprendedor">Emprendedor</option>
                                <option value="Consultor">Consultor / Coach</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-10 space-y-4">
                        <button
                            onClick={handleStart}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-indigo-200 hover:scale-105 transition-transform w-full max-w-sm"
                        >
                            Iniciar Diagnóstico
                        </button>
                        <button onClick={handleDemo} className="block w-full text-sm text-slate-400 hover:text-indigo-500 font-medium">
                            Ver Resultados Demo
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'instructions') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full">
                    <h2 className="text-2xl font-black text-slate-800 text-center mb-6">Antes de comenzar</h2>
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        {[
                            { icon: '⏱️', title: '20-25 Min', desc: 'Tómate tu tiempo.' },
                            { icon: '💡', title: 'Sinceridad', desc: 'No hay respuestas "correctas".' },
                            { icon: '📊', title: 'Sin Juicios', desc: 'Es un mapa, no un examen.' },
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                                <div className="text-3xl mb-2">{item.icon}</div>
                                <h3 className="font-bold text-slate-700 text-sm mb-1">{item.title}</h3>
                                <p className="text-xs text-slate-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setStep('intro')} className="px-6 py-2 text-slate-400 font-bold hover:text-slate-600">Volver</button>
                        <button onClick={handleStartQuiz} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:scale-105 transition-transform">
                            Comenzar Ahora
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'quiz') {
        const start = userState.currentIdx;
        const end = Math.min(start + ITEMS_PER_PAGE, DB.length);
        const items = DB.slice(start, end);
        const currentPillarKey = items[0].pillar;
        const pillarInfo = PILLAR_INFO[currentPillarKey];
        const progress = Math.round((start / DB.length) * 100);

        return (
            <div className="min-h-screen bg-slate-50 pb-20">
                {/* Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 px-6 py-4 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-black text-indigo-500 uppercase tracking-widest block mb-1">{pillarInfo.title}</span>
                        <h2 className="text-lg font-bold text-slate-800 leading-none">{pillarInfo.sub}</h2>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-slate-400 mb-1">{progress}% Completado</div>
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto p-6 space-y-6 mt-6">
                    {items.map((q) => (
                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2 py-1 rounded-md">#{q.id}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{q.comp}</span>
                            </div>
                            <p className="text-lg font-medium text-slate-800 mb-6 leading-relaxed">
                                {q.text}
                            </p>
                            <div className="grid grid-cols-5 gap-2">
                                {SCALES[q.scale].map((label, idx) => {
                                    const val = idx + 1;
                                    const isSelected = userState.answers[q.id] === val;
                                    return (
                                        <button
                                            key={val}
                                            onClick={() => handleAnswer(q.id, val)}
                                            className={`
                                        flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all min-h-[80px]
                                        ${isSelected
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-100 bg-white hover:border-slate-300'
                                                }
                                    `}
                                        >
                                            <span className={`text-xl font-black mb-1 ${isSelected ? 'text-indigo-600' : 'text-slate-200'}`}>{val}</span>
                                            <span className={`text-[10px] leading-tight text-center font-bold ${isSelected ? 'text-indigo-800' : 'text-slate-400'}`}>{label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-between pt-8">
                        <button
                            onClick={handlePrevPage}
                            disabled={start === 0}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={20} /> Anterior
                        </button>
                        <button
                            onClick={handleNextPage}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:scale-105 transition-transform"
                        >
                            {end >= DB.length ? 'Finalizar' : 'Siguiente'} <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'results') {
        return <ResultsView state={userState} onReset={handleReset} />;
    }

    return null;
}

// --- SUBCOMPONENT: AI ANALYSIS ---

function AiAnalysisSection({ username, role, scores, pillar }: { username: string, role: string, scores: any, pillar: string }) {
    const [reports, setReports] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [audioLoading, setAudioLoading] = useState(false);

    const report = reports[pillar]; // Get current report from cache

    // Reset audio when pillar changes (but keep text cache)
    useEffect(() => {
        if (speaking && audio) {
            audio.pause();
            setSpeaking(false);
        }
    }, [pillar]);

    useEffect(() => {
        return () => {
            if (audio) audio.pause();
        };
    }, [audio]);

    const cleanMarkdownForSpeech = (text: string) => {
        return text
            .replace(/[#*`_~]/g, '') // Remove symbols
            .replace(/\n\s*-\s/g, '. ') // Replace bullets with periods for pause
            .replace(/\n\n/g, '. ') // Double newlines to periods
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links to text
            .replace(/\s+/g, ' '); // Collapse whitespace
    };

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/diagnostics/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, role, scores, pillar })
            });
            const data = await res.json();
            if (data.report) {
                setReports(prev => ({ ...prev, [pillar]: data.report }));
            } else {
                alert(`Error: ${data.error || 'No se pudo generar el reporte.'}`);
            }
        } catch (e) {
            alert('Error de conexión al servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleSpeak = async () => {
        if (!report) return;

        if (speaking && audio) {
            audio.pause();
            setSpeaking(false);
            return;
        }

        if (audio && audio.src) {
            if (audio.paused) {
                audio.play();
                setSpeaking(true);
                return;
            }
        }

        setAudioLoading(true);
        try {
            const cleanText = cleanMarkdownForSpeech(report);
            const res = await fetch('/api/diagnostics/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText })
            });

            if (!res.ok) throw new Error("Audio error");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const newAudio = new Audio(url);

            newAudio.onended = () => setSpeaking(false);
            newAudio.play();

            setAudio(newAudio);
            setSpeaking(true);
        } catch (e) {
            alert("Error generando audio.");
        } finally {
            setAudioLoading(false);
        }
    };

    // Reset audio state when pillar changes (fresh start for audio)
    useEffect(() => {
        setAudio(null);
        setSpeaking(false);
    }, [pillar]);

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl border border-indigo-700/50 flex flex-col h-full print:break-inside-avoid">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg"><BrainCircuit className="text-indigo-300" /></div>
                    <div>
                        <h3 className="font-bold text-lg">AI Executive Coach</h3>
                        <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider">
                            {pillar === 'all' ? 'Visión Estratégica' : `Deep Dive: ${PILLAR_INFO[pillar as keyof typeof PILLAR_INFO]?.title || pillar}`}
                        </p>
                    </div>
                </div>
                {report && (
                    <button
                        onClick={handleSpeak}
                        disabled={audioLoading}
                        className={`p-2 rounded-full transition-colors ${speaking ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        title={speaking ? "Pausar" : "Escuchar Análisis"}
                    >
                        {audioLoading ? <Loader2 size={16} className="animate-spin" /> : (speaking ? <span className="animate-pulse">⏹️</span> : <span>🔊</span>)}
                    </button>
                )}
            </div>

            {!report ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4 min-h-[200px]">
                    <p className="text-slate-300 text-sm max-w-xs">
                        {pillar === 'all'
                            ? 'Genera un análisis estratégico y hoja de ruta basada en tus resultados globales.'
                            : 'Realiza un análisis profundo de este pilar para descubrir bloqueos y palancas de crecimiento.'}
                    </p>
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-indigo-900/50 transition-all flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                        {loading ? 'Analizando...' : 'Generar Análisis'}
                    </button>
                </div>
            ) : (
                <div className="prose prose-invert prose-sm max-w-none overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[500px]">
                    <ReactMarkdown>{report}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}

// --- SUBCOMPONENT: RESULTS VIEW ---

function ResultsView({ state, onReset }: { state: UserState, onReset: () => void }) {
    const [filter, setFilter] = useState<'all' | 'within' | 'out' | 'up' | 'beyond'>('all');

    // 1. Calculate Scores
    const scores = React.useMemo(() => {
        const pScores: Record<string, number[]> = { within: [], out: [], up: [], beyond: [] };
        const cScores: Record<string, number[]> = {};

        DB.forEach(q => {
            const val = state.answers[q.id] || 0;
            pScores[q.pillar].push(val);

            const cKey = `${q.pillar}|${q.comp}`;
            if (!cScores[cKey]) cScores[cKey] = [];
            cScores[cKey].push(val);
        });

        const pillarAvg: Record<string, number> = {};
        Object.keys(pScores).forEach(k => {
            const arr = pScores[k];
            pillarAvg[k] = arr.length ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 0;
        });

        const compList = Object.keys(cScores).map(k => {
            const [p, n] = k.split('|');
            const arr = cScores[k];
            const avg = parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
            return { pillar: p, name: n, score: avg };
        });

        const allVals = Object.values(state.answers);
        const globalAvg = allVals.length ? parseFloat((allVals.reduce((a, b) => a + b, 0) / allVals.length).toFixed(1)) : 0;

        return { pillarAvg, compList, globalAvg };
    }, [state]);

    const globalMsg = scores.globalAvg >= 4.5 ? "Sobresaliente" : scores.globalAvg >= 3.8 ? "Muy Bueno" : "En Desarrollo";

    // Recharts Data
    const radarData = [
        { subject: 'Within', A: scores.pillarAvg.within, fullMark: 5 },
        { subject: 'Out', A: scores.pillarAvg.out, fullMark: 5 },
        { subject: 'Beyond', A: scores.pillarAvg.beyond, fullMark: 5 },
        { subject: 'Up', A: scores.pillarAvg.up, fullMark: 5 },
    ];

    // Filter Logic
    const filteredComps = filter === 'all' ? scores.compList : scores.compList.filter(c => c.pillar === filter);
    const currentPillarTitle = filter === 'all' ? 'Visión General' : PILLAR_INFO[filter].title;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 print:bg-white print:pb-0 print:h-auto print:overflow-visible">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Book size={20} /></div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800">Reporte 4Shine</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{state.username}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><Download size={20} /></button>
                    <button onClick={onReset} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><RefreshCw size={20} /></button>
                </div>
            </div>

            <main className="max-w-5xl mx-auto p-8 print:p-0 print:max-w-none">

                {/* Hero Results */}
                <div className="text-center mb-12 print:mb-8 print:break-inside-avoid">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Índice Global de Liderazgo</p>
                    <div className="inline-block bg-white rounded-[32px] shadow-lg border border-slate-100 px-12 py-8 print:shadow-none print:border-none">
                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 mb-2">
                            {scores.globalAvg}
                        </div>
                        <div className={`text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full inline-block ${scores.globalAvg >= 4 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {globalMsg}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2 print:hidden">
                    {['all', 'within', 'out', 'up', 'beyond'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${filter === f
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                                }`}
                        >
                            {f === 'all' ? 'Visión General' : PILLAR_INFO[f as keyof typeof PILLAR_INFO].title}
                        </button>
                    ))}
                </div>

                {/* DYNAMIC CONTENT AREA */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">

                    {/* LEFT COLUMN: CHARTS */}
                    <div className="space-y-6">
                        {filter === 'all' ? (
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[400px] min-h-[400px] w-full print:break-inside-avoid">
                                <h3 className="text-center font-bold text-slate-700 mb-4">Radar de Competencias</h3>
                                <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                            <Radar name="Usuario" dataKey="A" stroke="#6366f1" strokeWidth={3} fill="#818cf8" fillOpacity={0.3} />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[400px] min-h-[400px] w-full print:break-inside-avoid">
                                <h3 className="text-center font-bold text-slate-700 mb-4">{currentPillarTitle}</h3>
                                <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={filteredComps}>
                                            <XAxis type="number" domain={[0, 5]} hide />
                                            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10, fill: '#64748b' }} />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 12 }} />
                                            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                                                {filteredComps.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={
                                                        filter === 'within' ? '#6366f1' :
                                                            filter === 'out' ? '#8b5cf6' :
                                                                filter === 'up' ? '#ec4899' : '#10b981'
                                                    } />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: AI COACH (Everywhere) */}
                    <div className="h-full">
                        <AiAnalysisSection
                            // Key removed to persist state
                            username={state.username}
                            role={state.role}
                            scores={scores}
                            pillar={filter}
                        />
                    </div>
                </div>

                {/* Detail Table */}
                <h3 className="font-bold text-slate-700 mb-4 print:mt-8">Detalle de Competencias</h3>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-12 shadow-sm print:shadow-none print:border-slate-300">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Competencia</th>
                                <th className="px-6 py-4 w-24 text-center">Puntaje</th>
                                <th className="px-6 py-4 w-32 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredComps.map((c, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 print:break-inside-avoid">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700">{c.name}</div>
                                        <div className="text-xs text-slate-400">{COMP_DEFINITIONS[c.name]}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-600">{c.score}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${c.score >= 4 ? 'bg-emerald-100 text-emerald-700' :
                                            c.score >= 2.5 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {c.score >= 4 ? 'Fortaleza' : c.score >= 2.5 ? 'Oportunidad' : 'Brecha'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-center print:hidden">
                    <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 transition-colors">
                        Descargar Reporte PDF
                    </button>
                    <p className="text-xs text-slate-400 mt-4">4Shine Leadership Diagnosis System © 2026</p>
                </div>
            </main>
        </div>
    );
}
