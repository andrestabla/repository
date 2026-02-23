'use client';

import React, { useState, useEffect } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
    PieChart, Pie
} from 'recharts';
import { Book, ChevronRight, ChevronLeft, RefreshCw, Download, Sparkles, BrainCircuit, Loader2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DB, SCALES, PILLAR_INFO, COMP_DEFINITIONS, Question } from './DiagnosticsData';
import ReactMarkdown from 'react-markdown';

// --- TYPES ---
interface UserState {
    username: string;
    role: string;
    answers: Record<string | number, string | number>; // questionId -> score or optionId
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
        const saved = localStorage.getItem('4shine_v2_data');
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
        localStorage.setItem('4shine_v2_data', JSON.stringify(newState));
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
            localStorage.removeItem('4shine_v2_data');
            window.location.reload();
        }
    };

    const handleAnswer = (qId: string | number, val: string | number) => {
        const newAnswers = { ...userState.answers, [qId]: val };
        saveState({ ...userState, answers: newAnswers });
    };

    const handleNextPage = () => {
        const start = userState.currentIdx;
        const end = Math.min(start + ITEMS_PER_PAGE, DB.length);
        const pageItems = DB.slice(start, end);

        // Validate
        const missing = pageItems.find((i) => userState.answers[i.id] === undefined);
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
            const demoAnswers: Record<string | number, string | number> = {};
            DB.forEach(q => {
                if (q.type === 'likert') {
                    demoAnswers[q.id] = Math.floor(Math.random() * 3) + 2; // Random 2-4
                } else {
                    const letters = ['A' as const, 'B' as const, 'C' as const, 'D' as const];
                    demoAnswers[q.id] = letters[Math.floor(Math.random() * 4)];
                }
            });
            setUserState({
                username: "Andrés (Prueba)",
                role: "Director / C-Level",
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
                    <div className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-100">
                        Diagnóstico 4Shine v2.0
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                        Evalúa tu <span className="text-indigo-600">Liderazgo Exponencial</span>
                    </h1>
                    <p className="text-slate-500 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                        Mapea tu madurez y juicio situacional en los 4 pilares: <strong className="text-indigo-600">Within, Out, Up y Beyond</strong>.
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
                <div className="bg-white rounded-[32px] shadow-xl p-8 md:p-12 max-w-2xl w-full border border-slate-100">
                    <h2 className="text-3xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4">Instrucciones Generales</h2>

                    <div className="space-y-6 mb-10">
                        <div className="flex gap-4">
                            <div className="bg-indigo-100 p-2 rounded-lg h-fit text-indigo-600"><CheckCircle2 size={24} /></div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-1">Reactivos Likert (Autoinforme)</h3>
                                <p className="text-slate-500 text-sm">Evalúa qué tan de acuerdo estás o con qué frecuencia realizas ciertas conductas, en escala de 1 a 5.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-indigo-100 p-2 rounded-lg h-fit text-indigo-600"><BrainCircuit size={24} /></div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-1">Juicio Situacional (SJT)</h3>
                                <p className="text-slate-500 text-sm">Selecciona la opción que consideres más adecuada ante situaciones críticas de liderazgo. Estas preguntas miden tu competencia práctica.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-slate-100 p-2 rounded-lg h-fit text-slate-600"><AlertTriangle size={24} /></div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-1">Honestidad Radical</h3>
                                <p className="text-slate-500 text-sm text-balance">No hay respuestas "correctas" teóricas. El valor real está en identificar tus brechas actuales.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4">
                        <button onClick={() => setStep('intro')} className="px-6 py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors">Volver</button>
                        <button onClick={handleStartQuiz} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">
                            Comenzar Diagnóstico
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
        const currentPillarKey = items[0]?.pillar || 'within';
        const pillarInfo = PILLAR_INFO[currentPillarKey as keyof typeof PILLAR_INFO];
        const progress = Math.round((start / DB.length) * 100);

        return (
            <div className="min-h-screen bg-slate-50 pb-20">
                {/* Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center bg-indigo-600 rounded-xl text-white font-bold text-sm shadow-md">4S</div>
                        <div>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">{pillarInfo?.title}</span>
                            <h2 className="text-sm md:text-md font-bold text-slate-800 leading-none">{pillarInfo?.sub}</h2>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-tighter">{progress}% Completado</div>
                        <div className="w-24 md:w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto p-6 space-y-8 mt-6">
                    {items.map((q) => (
                        <div key={q.id} className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-100 hover:border-indigo-100 transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="bg-slate-100 text-slate-500 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">Reactivo #{q.id}</span>
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{q.comp}</span>
                                </div>
                                <div className="text-[10px] font-black uppercase text-slate-300 border border-slate-100 px-2 py-0.5 rounded-full">
                                    {q.type === 'sjt' ? 'Escenario Situacional' : 'Autoinforme'}
                                </div>
                            </div>

                            <p className="text-xl md:text-2xl font-bold text-slate-800 mb-8 leading-tight">
                                {q.text}
                            </p>

                            {q.type === 'likert' ? (
                                <div>
                                    <div className="grid grid-cols-5 gap-2 md:gap-4">
                                        {[1, 2, 3, 4, 5].map((val) => {
                                            const isSelected = userState.answers[q.id] === val;
                                            const label = SCALES[q.scale || 'freq'][val - 1];
                                            return (
                                                <button
                                                    key={val}
                                                    onClick={() => handleAnswer(q.id, val)}
                                                    className={`
                                                        flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all min-h-[90px] md:min-h-[110px]
                                                        ${isSelected
                                                            ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                                                            : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white'
                                                        }
                                                    `}
                                                >
                                                    <span className={`text-2xl font-black mb-1 ${isSelected ? 'text-indigo-600Scale' : 'text-slate-300'}`}>{val}</span>
                                                    <span className={`text-[9px] md:text-[10px] leading-tight text-center font-bold px-1 ${isSelected ? 'text-indigo-800' : 'text-slate-400'}`}>
                                                        {label}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {q.options?.map((opt) => {
                                        const isSelected = userState.answers[q.id] === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleAnswer(q.id, opt.id)}
                                                className={`
                                                    w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200
                                                    ${isSelected
                                                        ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                                                        : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white'
                                                    }
                                                `}
                                            >
                                                <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center font-bold flex-shrink-0 border-2 transition-all ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                                                    {opt.id}
                                                </div>
                                                <span className={`text-sm md:text-md font-bold leading-tight ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>
                                                    {opt.text}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="flex items-center justify-between pt-12 pb-20">
                        <button
                            onClick={handlePrevPage}
                            disabled={start === 0}
                            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 disabled:opacity-0 transition-all border border-transparent hover:border-slate-300"
                        >
                            <ChevronLeft size={20} /> Anterior
                        </button>
                        <button
                            onClick={handleNextPage}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
                        >
                            {end >= DB.length ? 'Finalizar' : 'Siguiente Página'} <ChevronRight size={20} />
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

// --- SUBCOMPONENT: RESULTS VIEW ---

function ResultsView({ state, onReset }: { state: UserState, onReset: () => void }) {
    const [filter, setFilter] = useState<'all' | 'within' | 'out' | 'up' | 'beyond'>('all');
    const [reports, setReports] = useState<Record<string, string>>({});

    // 1. ADVANCED SCORING ENGINE
    const scoring = React.useMemo(() => {
        // Stats per pillar
        const pillars = {
            within: { likert: [] as number[], sjt: [] as number[] },
            out: { likert: [] as number[], sjt: [] as number[] },
            up: { likert: [] as number[], sjt: [] as number[] },
            beyond: { likert: [] as number[], sjt: [] as number[] }
        };

        const compScores: Record<string, number[]> = {};

        DB.forEach(q => {
            const ans = state.answers[q.id];
            if (q.type === 'likert') {
                const val = (ans as number) || 0;
                pillars[q.pillar].likert.push(val);

                const cKey = `${q.pillar}|${q.comp}`;
                if (!compScores[cKey]) compScores[cKey] = [];
                compScores[cKey].push(val);
            } else {
                const opt = q.options?.find(o => o.id === ans);
                const weight = opt ? opt.weight : 0;
                pillars[q.pillar].sjt.push(weight);
            }
        });

        // Calculate Pillar Percentages
        const calcPillarPct = (pKey: keyof typeof pillars) => {
            const p = pillars[pKey];
            const sumL = p.likert.reduce((a, b) => a + b, 0);
            const sumS = p.sjt.reduce((a, b) => a + b, 0);

            // Dynamic Likert normalization based on actual question count
            const numLikert = p.likert.length;
            const likertNorm = numLikert > 0 ? (sumL - numLikert) / (4 * numLikert) : 0;

            // SJT normalization (Sum / Max possible)
            // Within has 10 SJT items (max 30 pts), others have 3 (max 9 pts)
            const sjtMax = pKey === 'within' ? 30 : 9;
            const sjtNorm = sumS / sjtMax;

            const totalPct = ((likertNorm + sjtNorm) / 2) * 100;
            return {
                total: Math.round(totalPct),
                likert: Math.round(likertNorm * 100),
                sjt: Math.round(sjtNorm * 100)
            };
        };

        const pillarMetrics = {
            within: calcPillarPct('within'),
            out: calcPillarPct('out'),
            up: calcPillarPct('up'),
            beyond: calcPillarPct('beyond')
        };

        const globalIndex = Math.round((pillarMetrics.within.total + pillarMetrics.out.total + pillarMetrics.up.total + pillarMetrics.beyond.total) / 4);

        const compList = Object.keys(compScores).map(k => {
            const [p, n] = k.split('|');
            const arr = compScores[k];
            const avg = parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
            return { pillar: p, name: n, score: avg };
        });

        return { pillarMetrics, globalIndex, compList };
    }, [state]);

    // Data for charts
    const radarData = [
        { subject: 'Within', A: scoring.pillarMetrics.within.total, fullMark: 100 },
        { subject: 'Out', A: scoring.pillarMetrics.out.total, fullMark: 100 },
        { subject: 'Beyond', A: scoring.pillarMetrics.beyond.total, fullMark: 100 },
        { subject: 'Up', A: scoring.pillarMetrics.up.total, fullMark: 100 },
    ];

    // Intra-pillar Radar Data: Breaks down the selected pillar by competency
    const pillarRadarData = filter === 'all' ? [] : scoring.compList
        .filter(c => c.pillar === filter)
        .map(c => ({
            subject: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
            fullName: c.name,
            A: Math.round(((c.score - 1) / 4) * 100),
            fullMark: 100
        }));

    const getStatus = (val: number) => {
        if (val >= 71) return { label: 'Fortaleza', color: 'emerald' };
        if (val >= 41) return { label: 'Desarrollo', color: 'amber' };
        return { label: 'Brecha Crítica', color: 'rose' };
    };

    const globalStatus = getStatus(scoring.globalIndex);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 overflow-x-hidden">
            {/* Nav */}
            <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center bg-slate-900 rounded-xl text-white font-bold text-sm">4S</div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 leading-none">Resultados del Diagnóstico</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{state.username}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><Download size={20} /></button>
                    <button onClick={onReset} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><RefreshCw size={20} /></button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
                {/* Hero Summary */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-10">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                            <div className="w-48 h-48 rounded-full border-[10px] border-slate-50 flex flex-col items-center justify-center bg-white relative shadow-inner">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Score Global</span>
                                <span className="text-6xl font-black text-indigo-600 leading-none">{scoring.globalIndex}%</span>
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 bg-${globalStatus.color}-100 text-${globalStatus.color}-700 border border-${globalStatus.color}-200`}>
                                Nivel: {globalStatus.label}
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Resumen Ejecutivo</h2>
                            <p className="text-slate-500 leading-relaxed text-sm">
                                Tu madurez de liderazgo se sitúa en un nivel <strong>{globalStatus.label.toLowerCase()}</strong>.
                                La puntuación máxima posible es 100% en cada pilar, calculada mediante una combinación ponderada de autoevaluación y juicio situacional.
                            </p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><BrainCircuit size={120} /></div>
                        <div className="relative z-10">
                            <div className="bg-indigo-500/20 p-2 rounded-xl w-fit mb-6"><Sparkles className="text-indigo-300" /></div>
                            <h3 className="text-xl font-black mb-4 leading-tight">Hoja de Ruta Personalizada</h3>
                            <button
                                onClick={() => setFilter('all')}
                                className="w-full bg-white text-indigo-950 font-black py-4 rounded-2xl shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95"
                            >
                                Generar Informe AI
                            </button>
                            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest text-center mt-4">Powered by 4Shine AI</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {['all', 'within', 'out', 'up', 'beyond'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`
                                px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                                ${filter === f
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'
                                }
                            `}
                        >
                            {f === 'all' ? 'Visión General' : PILLAR_INFO[f as keyof typeof PILLAR_INFO].title}
                        </button>
                    ))}
                </div>

                {/* Grid Content */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Visual Analytics */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 min-h-[450px]">
                            <h3 className="text-center font-black text-slate-800 mb-8 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                <Info size={16} className="text-indigo-500" />
                                {filter === 'all' ? 'MAPPING GLOBAL' : `RED POR COMPONENTE: ${PILLAR_INFO[filter].title.toUpperCase()}`}
                            </h3>

                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={filter === 'all' ? radarData : pillarRadarData}>
                                        <PolarGrid stroke="#f1f5f9" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: '800' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name="Score" dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#6366f1" fillOpacity={0.15} />
                                        <Tooltip
                                            labelFormatter={(l, items) => items[0]?.payload?.fullName || l}
                                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {filter !== 'all' && (
                                <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight mb-2">Equilibrio del Pilar</p>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <div className="text-lg font-black text-indigo-900">{scoring.pillarMetrics[filter].likert}%</div>
                                            <div className="text-[9px] text-indigo-400 font-bold uppercase">Autopercepción</div>
                                        </div>
                                        <div className="h-8 w-px bg-indigo-200"></div>
                                        <div className="flex-1 text-right">
                                            <div className="text-lg font-black text-emerald-700">{scoring.pillarMetrics[filter].sjt}%</div>
                                            <div className="text-[9px] text-emerald-500 font-bold uppercase">Juicio Situacional</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pillar Cards (Only in 'all' view) */}
                        {filter === 'all' && (
                            <div className="grid grid-cols-2 gap-4">
                                {(['within', 'out', 'up', 'beyond'] as const).map(p => {
                                    const m = scoring.pillarMetrics[p];
                                    const stat = getStatus(m.total);
                                    return (
                                        <div key={p} className="bg-white p-5 rounded-3xl border border-slate-100 hover:shadow-md transition-all cursor-pointer" onClick={() => setFilter(p)}>
                                            <div className={`h-1.5 w-8 rounded-full mb-3 bg-${stat.color}-500`}></div>
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{PILLAR_INFO[p].title}</h4>
                                            <div className="text-2xl font-black text-slate-900">{m.total}%</div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* AI Coach Area */}
                    <div className="h-full">
                        <AiAnalysisSection
                            reports={reports}
                            setReports={setReports}
                            username={state.username}
                            role={state.role}
                            scores={scoring}
                            pillar={filter}
                        />
                    </div>
                </div>

                {/* Detail Table */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900">Desglose por Competencia</h3>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Solo Autoinforme (Likert)</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="pb-4 pt-2">Competencia</th>
                                    <th className="pb-4 pt-2 w-24 text-center">Score (1-5)</th>
                                    <th className="pb-4 pt-2 w-32 text-right">Estatus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {scoring.compList.filter(c => filter === 'all' || c.pillar === filter).map((c, i) => {
                                    const normScore = ((c.score - 1) / 4) * 100;
                                    const stat = getStatus(normScore);
                                    return (
                                        <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4">
                                                <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                                                <div className="text-[10px] text-slate-400 font-medium group-hover:text-slate-500 transition-colors">{COMP_DEFINITIONS[c.name] || 'Definición pendiente.'}</div>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="text-sm font-black text-slate-900 font-mono">{c.score}</span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md bg-${stat.color}-50 text-${stat.color}-600 border border-${stat.color}-100`}>
                                                    {stat.label}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    );
}

// --- SHARED AI SECTION ---

interface AiAnalysisProps {
    username: string;
    role: string;
    scores: any;
    pillar: string;
    reports: Record<string, string>;
    setReports: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

function AiAnalysisSection({ username, role, scores, pillar, reports, setReports }: AiAnalysisProps) {
    const [loading, setLoading] = useState(false);
    const report = reports[pillar];

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
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#1e1e2e] text-white p-8 rounded-[40px] shadow-2xl h-full flex flex-col border border-slate-800">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-500/20 p-2 rounded-xl"><Sparkles className="text-indigo-400" /></div>
                <div>
                    <h3 className="font-black text-lg leading-none mb-1">AI Executive Consultant</h3>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{pillar === 'all' ? 'Análisis Global' : `Pilar: ${PILLAR_INFO[pillar as keyof typeof PILLAR_INFO]?.title}`}</span>
                </div>
            </div>

            {!report ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                    <p className="text-slate-400 text-sm max-w-[240px]">
                        Genera un análisis de brechas profundo y una guía de acción táctica basada en tus resultados.
                    </p>
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />}
                        {loading ? 'Generando...' : 'Obtener Feedback AI'}
                    </button>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-justify max-h-[600px] prose prose-invert prose-sm">
                    <ReactMarkdown>{report}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}
