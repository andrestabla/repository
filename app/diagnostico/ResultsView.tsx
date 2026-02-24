'use client';

import React, { useState } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    Tooltip
} from 'recharts';
import { RefreshCw, Download, Sparkles, BrainCircuit, Loader2, Info, Share2, ExternalLink, Copy, Mail } from 'lucide-react';
import { PILLAR_INFO, COMP_DEFINITIONS, DB } from './DiagnosticsData';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

// --- TYPES ---
export interface UserState {
    username: string;
    role: string;
    answers: Record<string | number, string | number>;
    currentIdx: number;
}

interface ResultsViewProps {
    state: UserState;
    onReset?: () => void;
    isPublic?: boolean;
    initialReports?: Record<string, string>;
}

export function ResultsView({ state, onReset, isPublic = false, initialReports = {} }: ResultsViewProps) {
    const [filter, setFilter] = useState<'all' | 'within' | 'out' | 'up' | 'beyond'>('all');
    const [reports, setReports] = useState<Record<string, string>>(initialReports);
    const [isExporting, setIsExporting] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [publicId, setPublicId] = useState<string | null>(null);
    const reportRef = React.useRef<HTMLDivElement>(null);

    // Tour state
    const [runTour, setRunTour] = useState(false);

    React.useEffect(() => {
        if (!isPublic) {
            const hasSeenTour = localStorage.getItem(`hasSeenResultsTour_${state.username}`);
            if (!hasSeenTour) {
                setRunTour(true);
            }
        }
    }, [isPublic, state.username]);

    const tourSteps: Step[] = [
        {
            target: '.tour-tabs',
            content: 'Aquí puedes navegar entre una Visión General de tus resultados o profundizar en cada uno de los 4 Pilares de Liderazgo.',
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '.tour-ai',
            content: '¡Usa el poder de la IA! Genera un análisis profundo y una hoja de ruta táctica basada en tus puntajes (disponible de forma global y por pilar).',
            placement: 'left',
        },
        {
            target: '.tour-share',
            content: 'Comparte un enlace público temporal de tus resultados con tu equipo o mentores.',
            placement: 'bottom',
        },
        {
            target: '.tour-download',
            content: 'Descarga un archivo PDF de tu reporte actual en cualquier momento.',
            placement: 'bottom',
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
        if (finishedStatuses.includes(status)) {
            setRunTour(false);
            localStorage.setItem(`hasSeenResultsTour_${state.username}`, 'true');
        }
    };

    const handleShare = async () => {
        if (isPublic) return;
        setIsSharing(true);
        try {
            const res = await fetch('/api/diagnostics/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: state.username,
                    role: state.role,
                    scores: scoring,
                    reports: reports,
                    answers: state.answers
                })
            });
            const data = await res.json();
            if (data.publicId) {
                setPublicId(data.publicId);
            } else {
                alert('Error al generar el link compartido.');
            }
        } catch (e) {
            console.error(e);
            alert('Error al compartir.');
        } finally {
            setIsSharing(false);
        }
    };

    const copyToClipboard = () => {
        if (!publicId) return;
        const url = `${window.location.origin}/diagnostico/share/${publicId}`;
        navigator.clipboard.writeText(url);
        alert('Copiado al portapapeles');
    };

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        try {
            await new Promise(r => setTimeout(r, 1000));

            const canvas = await html2canvas(reportRef.current, {
                scale: 1.5,
                useCORS: true,
                logging: true,
                backgroundColor: '#f8fafc',
                onclone: (clonedDoc) => {
                    // 1. Hide unwanted elements
                    clonedDoc.querySelectorAll('.no-export').forEach(el => {
                        (el as HTMLElement).style.display = 'none';
                    });

                    // 2. SANITIZE COLORS: Modern CSS functions (lab, oklch, oklab, color-mix) crash html2canvas.
                    const allElements = clonedDoc.getElementsByTagName("*");
                    const problematicColors = ['lab(', 'oklch(', 'oklab(', 'color-mix('];
                    const colorProps = [
                        'color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor',
                        'borderLeftColor', 'borderRightColor', 'fill', 'stroke', 'outlineColor',
                        'boxShadow', 'textShadow', 'columnRuleColor', 'textDecorationColor'
                    ];

                    for (let i = 0; i < allElements.length; i++) {
                        const el = allElements[i] as HTMLElement;
                        const style = window.getComputedStyle(el);

                        // Check direct color properties
                        colorProps.forEach(prop => {
                            const val = (style as any)[prop];
                            if (val && problematicColors.some(c => val.includes(c))) {
                                el.style.setProperty(prop, 'transparent', 'important');
                            }
                        });

                        // Check backgrounds for gradients with modern colors
                        ['background', 'backgroundImage'].forEach(prop => {
                            const val = (style as any)[prop];
                            if (val && problematicColors.some(c => val.includes(c))) {
                                el.style.setProperty(prop, 'none', 'important');
                            }
                        });
                    }
                },
                windowWidth: reportRef.current.scrollWidth,
                windowHeight: reportRef.current.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Diagnostico_4Shine_${state.username}.pdf`);
        } catch (error: any) {
            console.error('Export failed:', error);
            alert(`Error al generar el PDF: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsExporting(false);
        }
    };

    const scoring = React.useMemo(() => {
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

        const calcPillarPct = (pKey: keyof typeof pillars) => {
            const p = pillars[pKey];
            const sumL = p.likert.reduce((a, b) => a + b, 0);
            const sumS = p.sjt.reduce((a, b) => a + b, 0);
            const numLikert = p.likert.length;
            const likertNorm = numLikert > 0 ? (sumL - numLikert) / (4 * numLikert) : 0;
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

    const radarData = [
        { subject: 'Within', A: scoring.pillarMetrics.within.total, fullMark: 100 },
        { subject: 'Out', A: scoring.pillarMetrics.out.total, fullMark: 100 },
        { subject: 'Beyond', A: scoring.pillarMetrics.beyond.total, fullMark: 100 },
        { subject: 'Up', A: scoring.pillarMetrics.up.total, fullMark: 100 },
    ];

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
            <Joyride
                steps={tourSteps}
                run={runTour}
                continuous
                showSkipButton
                showProgress
                hideCloseButton
                scrollOffset={100}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        primaryColor: '#4f46e5',
                        zIndex: 10000,
                    }
                }}
            />
            <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm no-export">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center bg-slate-900 rounded-xl text-white font-bold text-sm">4S</div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 leading-none">Resultados del Diagnóstico</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{state.username}</p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    {!isPublic && (
                        <button
                            onClick={() => setRunTour(true)}
                            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors mr-2 flex items-center gap-1"
                        >
                            <Info size={14} /> Tour
                        </button>
                    )}
                    {!isPublic && (
                        <>
                            {publicId ? (
                                <div className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                    <input
                                        readOnly
                                        value={`${window.location.origin}/diagnostico/share/${publicId}`}
                                        className="text-[10px] bg-transparent text-indigo-600 outline-none w-24"
                                    />
                                    <button onClick={copyToClipboard} className="text-indigo-600 hover:text-indigo-800" title="Copiar Link"><Copy size={16} /></button>
                                    <a
                                        href={`mailto:?subject=Diagnóstico de Liderazgo 4Shine - ${state.username}&body=Hola, puedes ver los resultados de mi diagnóstico aquí: ${window.location.origin}/diagnostico/share/${publicId}`}
                                        className="text-indigo-600 hover:text-indigo-800"
                                        title="Enviar por Correo"
                                    >
                                        <Mail size={16} />
                                    </a>
                                    <a href={`/diagnostico/share/${publicId}`} target="_blank" className="text-indigo-600 hover:text-indigo-800" title="Ver en pestaña nueva"><ExternalLink size={16} /></a>
                                </div>
                            ) : (
                                <button
                                    onClick={handleShare}
                                    disabled={isSharing}
                                    className="tour-share flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-500 transition-all disabled:opacity-50"
                                >
                                    {isSharing ? <Loader2 className="animate-spin" size={14} /> : <Share2 size={14} />}
                                    Compartir
                                </button>
                            )}
                            <div className="h-4 w-px bg-slate-200 mx-1"></div>
                        </>
                    )}

                    <button
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                        className="tour-download p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors disabled:opacity-50"
                        title="Descargar PDF"
                    >
                        {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                    </button>
                    {onReset && (
                        <button onClick={onReset} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Reiniciar"><RefreshCw size={20} /></button>
                    )}
                </div>
            </nav>

            <main ref={reportRef} className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
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
                                className="w-full bg-white text-indigo-950 font-black py-4 rounded-2xl shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95 no-export"
                            >
                                {isPublic ? 'Ver Análisis Detallado' : 'Generar Informe AI'}
                            </button>
                            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest text-center mt-4">Powered by 4Shine AI</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center w-full no-export">
                    <div className="tour-tabs flex flex-wrap items-center justify-center gap-3 p-2 rounded-[2rem]">
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
                </div>

                <div className="grid md:grid-cols-2 gap-8">
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

                    <div className="h-full tour-ai">
                        <AiAnalysisSection
                            reports={reports}
                            setReports={setReports}
                            username={state.username}
                            role={state.role}
                            scores={scoring}
                            pillar={filter}
                            isPublic={isPublic}
                        />
                    </div>
                </div>

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
    isPublic?: boolean;
}

export function AiAnalysisSection({ username, role, scores, pillar, reports, setReports, isPublic = false }: AiAnalysisProps) {
    const [loading, setLoading] = useState(false);
    const report = reports[pillar];

    const handleAnalyze = async () => {
        if (isPublic) return;
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
                        {isPublic ? 'Análisis no disponible.' : 'Genera un análisis de brechas profundo y una guía de acción táctica basada en tus resultados.'}
                    </p>
                    {!isPublic && (
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />}
                            {loading ? 'Generando...' : 'Obtener Feedback AI'}
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-justify max-h-[600px] prose prose-invert prose-sm">
                    <ReactMarkdown>{report}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}
