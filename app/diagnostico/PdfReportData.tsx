import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { PILLAR_INFO, COMP_DEFINITIONS } from './DiagnosticsData';

interface PdfReportDataProps {
    state: any;
    scoring: any;
    reports: Record<string, string>;
    radarData: any[];
}

export const PdfReportData = React.forwardRef<HTMLDivElement, PdfReportDataProps>(({ state, scoring, reports, radarData }, ref) => {

    const getStatus = (val: number) => {
        if (val >= 71) return { label: 'Fortaleza', color: 'emerald', hex: '#10b981', bgHex: '#d1fae5' };
        if (val >= 41) return { label: 'Desarrollo', color: 'amber', hex: '#f59e0b', bgHex: '#fef3c7' };
        return { label: 'Brecha Crítica', color: 'rose', hex: '#f43f5e', bgHex: '#ffe4e6' };
    };

    const globalStatus = getStatus(scoring.globalIndex);
    const pillars = ['within', 'out', 'up', 'beyond'] as const;

    const getPillarRadarData = (pillarKey: string) => {
        return scoring.compList
            .filter((c: any) => c.pillar === pillarKey)
            .map((c: any) => ({
                subject: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
                A: Math.round(((c.score - 1) / 4) * 100),
                fullMark: 100
            }));
    };

    return (
        <div ref={ref} className="bg-white" style={{ width: '210mm', color: '#0f172a' }}>

            {/* BLOCK 1: COVER & EXECUTIVE SUMMARY */}
            <div className="pdf-block p-12 bg-white flex flex-col justify-center" style={{ minHeight: '290mm', boxSizing: 'border-box' }}>
                <div className="flex items-center gap-4 mb-16 border-b border-slate-200 pb-8">
                    <div className="h-14 w-14 flex items-center justify-center bg-slate-900 rounded-xl text-white font-bold text-xl tracking-tighter">4S</div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 leading-none">Reporte de Liderazgo 4Shine</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">CONFIDENCIAL • {state.username}</p>
                    </div>
                </div>

                <div className="flex items-center gap-12 mb-16 bg-slate-50 p-10 rounded-3xl border border-slate-100">
                    <div className="w-56 h-56 rounded-full border-[12px] border-white flex flex-col items-center justify-center bg-slate-50 relative shadow-sm">
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Global</span>
                        <span className="text-7xl font-black text-indigo-600 leading-none">{scoring.globalIndex}%</span>
                    </div>
                    <div className="flex-1">
                        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 border" style={{ backgroundColor: globalStatus.bgHex, color: globalStatus.hex, borderColor: globalStatus.hex }}>
                            Nivel: {globalStatus.label}
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 mb-4">Resumen Ejecutivo</h2>
                        <p className="text-slate-500 text-lg leading-relaxed">
                            Tu madurez de liderazgo global se sitúa en un nivel <strong>{globalStatus.label.toLowerCase()}</strong>.
                            Este score se calcula mediante una combinación ponderada de tus respuestas de autoevaluación (Likert) y juicio situacional práctico (SJT) a través de los 4 pilares de la metodología.
                        </p>
                    </div>
                </div>

                <h3 className="text-center font-black text-slate-800 mb-8 uppercase tracking-widest text-sm">MAPPING GLOBAL</h3>
                <div className="h-[400px] w-full flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 14, fontWeight: '800' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Score" dataKey="A" stroke="#4f46e5" strokeWidth={4} fill="#6366f1" fillOpacity={0.15} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* BLOCK 2: GLOBAL AI ANALYSIS */}
            {reports['all'] && (
                <div className="pdf-block p-12 pb-6 bg-white shrink-0" style={{ boxSizing: 'border-box' }}>
                    <div className="mb-4">
                        <h3 className="text-2xl font-black text-slate-900 mb-6 border-b border-indigo-100 pb-4 text-indigo-900">AI Executive Consultant: Análisis Global</h3>
                        <div className="prose prose-slate prose-sm max-w-none text-justify text-slate-700">
                            <ReactMarkdown>{reports['all']}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}

            {/* BLOCK 3: COMPETENCIES TABLE */}
            <div className="pdf-block p-12 pt-0 bg-white shrink-0" style={{ boxSizing: 'border-box' }}>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-4">Desglose por Competencia (Score 1-5)</h3>
                <table className="w-full text-left text-sm">
                    <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                        <tr>
                            <th className="pb-3 pt-2">Competencia</th>
                            <th className="pb-3 pt-2">Pilar</th>
                            <th className="pb-3 pt-2 text-center">Score</th>
                            <th className="pb-3 pt-2 text-right">Diagnóstico</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {scoring.compList.map((c: any, i: number) => {
                            const normScore = ((c.score - 1) / 4) * 100;
                            const stat = getStatus(normScore);
                            return (
                                <tr key={i}>
                                    <td className="py-3 font-bold text-slate-800">{c.name}</td>
                                    <td className="py-3 text-slate-500 font-medium">{PILLAR_INFO[c.pillar as keyof typeof PILLAR_INFO].title}</td>
                                    <td className="py-3 text-center font-black text-slate-900">{c.score}</td>
                                    <td className="py-3 text-right">
                                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: stat.hex }}>{stat.label}</span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* BLOCKS 4-7: INDIVIDUAL PILLAR DEEP DIVES */}
            {pillars.map(p => {
                const pMetrics = scoring.pillarMetrics[p];
                const pStat = getStatus(pMetrics.total);
                const pName = PILLAR_INFO[p].title;
                const pRadar = getPillarRadarData(p);
                const pReport = reports[p];

                return (
                    <div key={p} className="pdf-block p-12 bg-white flex flex-col justify-start" style={{ minHeight: '290mm', boxSizing: 'border-box' }}>
                        <div className="flex items-center justify-between border-b-4 border-indigo-600 pb-6 mb-10">
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">{pName}</h2>
                            <div className="text-right">
                                <div className="text-5xl font-black text-indigo-600 leading-none">{pMetrics.total}%</div>
                                <div className="text-xs font-black uppercase tracking-widest mt-2" style={{ color: pStat.hex }}>{pStat.label}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-10 mb-10">
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Desglose de Equilibrio</h4>
                                <div className="flex gap-6 justify-center">
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-indigo-900">{pMetrics.likert}%</div>
                                        <div className="text-[10px] text-indigo-400 font-bold uppercase mt-1">Autopercepción</div>
                                    </div>
                                    <div className="w-px bg-indigo-200"></div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-emerald-700">{pMetrics.sjt}%</div>
                                        <div className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Juicio Situacional</div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[250px] flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={pRadar}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: '800' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name="Score" dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#6366f1" fillOpacity={0.15} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {pReport ? (
                            <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100">
                                <h3 className="text-xl font-black text-indigo-900 mb-6">AI Executive Consultant: Deep Dive</h3>
                                <div className="prose prose-slate prose-sm max-w-none text-justify text-slate-700">
                                    <ReactMarkdown>{pReport}</ReactMarkdown>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center">
                                <p className="text-slate-400 text-sm">El análisis de IA para este pilar no fue generado antes de la exportación.</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
});
PdfReportData.displayName = 'PdfReportData';
