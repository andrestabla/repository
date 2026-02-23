'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { DB } from './DiagnosticsData';
import { ResultsView, UserState } from './ResultsView';

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

    // --- RENDER HELPERS ---
    if (step === 'results') {
        return <ResultsView state={userState} onReset={handleReset} />;
    }

    if (step === 'intro') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-2xl shadow-white/10">4S</div>
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter">LEADERSHIP<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">DIAGNOSTIC</span></h1>
                            <p className="text-slate-400 text-lg leading-relaxed max-w-md">Evalúa tu madurez de liderazgo mediante un modelo híbrido de autopercepción y juicio situacional.</p>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[40px] border border-white/10 shadow-2xl space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={userState.username}
                                    onChange={(e) => setUserState({ ...userState, username: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold placeholder:text-slate-700"
                                    placeholder="Andrés Tabla"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Rol Actual</label>
                                <select
                                    value={userState.role}
                                    onChange={(e) => setUserState({ ...userState, role: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                                >
                                    <option>Director/C-Level</option>
                                    <option>Gerente/Mando Medio</option>
                                    <option>Coordinador/Líder de Proyecto</option>
                                    <option>Individual Contributor</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={handleStart}
                            className="w-full bg-white text-slate-950 font-black py-5 rounded-2xl text-lg hover:bg-slate-200 transition-all active:scale-[0.98] shadow-xl shadow-white/5"
                        >
                            Comenzar Evaluación
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'instructions') {
        const features = [
            { title: "Escala Likert", desc: "96 ítems para evaluar tu autopercepción conductual." },
            { title: "Juicio Situacional", desc: "29 escenarios reales con opciones de respuesta ponderadas." },
            { title: "Análisis 4 Pilares", desc: "Within, Out, Up y Beyond para una visión 360°." }
        ];

        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-white p-12 rounded-[50px] shadow-sm border border-slate-100 space-y-10">
                    <div className="text-center space-y-4">
                        <div className="h-1.5 w-12 bg-indigo-600 mx-auto rounded-full"></div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Instrucciones</h2>
                    </div>
                    <div className="grid gap-4">
                        {features.map((f, i) => (
                            <div key={i} className="flex items-start gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100">
                                <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-slate-900 font-black shadow-sm flex-shrink-0">{i + 1}</div>
                                <div>
                                    <h4 className="font-black text-slate-900 mb-1">{f.title}</h4>
                                    <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-slate-400 text-xs font-medium px-8 leading-relaxed italic">
                        "La calidad de tu liderazgo no depende de tus intenciones, sino de tu capacidad para gestionar situaciones complejas con madurez."
                    </p>
                    <button
                        onClick={handleStartQuiz}
                        className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/10"
                    >
                        Entendido, empezar <ChevronRight />
                    </button>
                </div>
            </div>
        );
    }

    const start = userState.currentIdx;
    const end = Math.min(start + ITEMS_PER_PAGE, DB.length);
    const pageItems = DB.slice(start, end);
    const progress = Math.round((end / DB.length) * 100);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header / Progress */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-10">
                <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-950 rounded-xl flex items-center justify-center text-white font-black text-xs">4S</div>
                        <div>
                            <h3 className="font-black text-slate-900 leading-none">Evaluación v2.0</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${progress}%` }}></div>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{progress}%</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><RefreshCw size={20} /></button>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-6 pt-12 space-y-8">
                {pageItems.map((q, qIdx) => {
                    const ans = userState.answers[q.id];
                    return (
                        <div key={q.id} className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${qIdx * 100}ms` }}>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase tracking-widest">{q.pillar}</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${q.type === 'sjt' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        {q.type === 'sjt' ? 'Situacional' : 'Autoinforme'}
                                    </span>
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 leading-snug">{q.text}</h4>
                            </div>

                            {q.type === 'likert' ? (
                                <div className="grid grid-cols-5 gap-3">
                                    {[1, 2, 3, 4, 5].map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => handleAnswer(q.id, v)}
                                            className={`
                                                aspect-square flex flex-col items-center justify-center p-4 rounded-3xl text-lg font-black transition-all border
                                                ${ans === v
                                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 border-indigo-600 scale-105'
                                                    : 'bg-white text-slate-400 hover:bg-slate-50 border-slate-100'
                                                }
                                            `}
                                        >
                                            {v}
                                            <span className="text-[8px] mt-1 opacity-60 font-bold uppercase tracking-tight">
                                                {v === 1 ? 'Nunca' : v === 5 ? 'Siempre' : ''}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {q.options?.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleAnswer(q.id, opt.id)}
                                            className={`
                                                w-full text-left p-6 rounded-3xl text-sm font-bold transition-all border flex gap-4 items-center group
                                                ${ans === opt.id
                                                    ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-md'
                                                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                                                }
                                            `}
                                        >
                                            <div className={`h-6 w-6 rounded-full border-4 flex-shrink-0 transition-all ${ans === opt.id ? 'border-amber-400' : 'border-slate-100 group-hover:border-slate-200'}`}></div>
                                            {opt.text}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="flex items-center justify-between pt-8">
                    <button
                        onClick={handlePrevPage}
                        disabled={start === 0}
                        className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2 disabled:opacity-0"
                    >
                        <ChevronLeft /> Anterior
                    </button>
                    <button
                        onClick={handleNextPage}
                        className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                    >
                        {end >= DB.length ? 'Ver Resultados' : 'Continuar'} <ChevronRight />
                    </button>
                </div>
            </main>
        </div>
    );
}
