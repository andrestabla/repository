
'use client'

import React, { useState, useEffect } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ScatterChart, Scatter, ZAxis
} from 'recharts'
import { Loader2, Globe, Users, Brain, BookOpen, RefreshCw, Microscope, Link as LinkIcon, Layers } from 'lucide-react'

// Colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#ff7300'];

// --- CUSTOM HEATMAP COMPONENT (Matrix) ---
const HeatmapMatrix = ({ data, xLabels, title }: { data: any[], xLabels: string[], title: string }) => {
    if (!data || data.length === 0) return null;

    // Find max value for normalization
    let maxVal = 0;
    data.forEach(row => xLabels.forEach(x => maxVal = Math.max(maxVal, row[x] || 0)));

    const getColor = (val: number) => {
        if (val === 0) return 'bg-gray-50 text-gray-300';
        const intensity = Math.ceil((val / maxVal) * 5); // 1-5 scale
        switch (intensity) {
            case 1: return 'bg-blue-100 text-blue-700';
            case 2: return 'bg-blue-200 text-blue-800';
            case 3: return 'bg-blue-300 text-blue-900';
            case 4: return 'bg-blue-400 text-white';
            case 5: return 'bg-blue-600 text-white font-bold';
            default: return 'bg-gray-50';
        }
    }

    return (
        <div className="bg-card-bg border border-border rounded-[24px] p-6 shadow-sm overflow-hidden">
            <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-4 opacity-70">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr>
                            <th className="p-2 text-left text-text-muted font-normal italic">Competencia / Dimensión</th>
                            {xLabels.map(x => <th key={x} className="p-2 text-center text-text-main font-bold">{x.replace('Shine ', '')}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(row => (
                            <tr key={row.name} className="border-b border-border/30">
                                <td className="p-2 font-medium text-text-main/80 truncate max-w-[150px]" title={row.name}>{row.name}</td>
                                {xLabels.map(x => (
                                    <td key={x} className="p-1">
                                        <div className={`w-full h-8 rounded-md flex items-center justify-center transition-colors ${getColor(row[x])}`}>
                                            {row[x] > 0 ? row[x] : '-'}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// --- CUSTOM CIRCULAR GRAPH COMPONENT (Semantic Network) ---
const CircularConceptGraph = ({ nodes, links }: { nodes: any[], links: any[] }) => {
    if (!nodes.length) return null;
    const width = 400; // SVG viewBox size
    const height = 400;
    const radius = 160;
    const centerX = width / 2;
    const centerY = height / 2;

    // Position nodes in a circle
    const nodePos = nodes.map((n, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        return {
            ...n,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            color: COLORS[i % COLORS.length]
        }
    });

    const nodeIdMap = new Map(nodePos.map(n => [n.id, n]));

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-w-md mx-auto">
            {/* Links */}
            {links.map((l, i) => {
                const s = nodeIdMap.get(l.source);
                const t = nodeIdMap.get(l.target);
                if (!s || !t) return null;
                return (
                    <line
                        key={i}
                        x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                        stroke="#cbd5e1"
                        strokeWidth={Math.min(l.weight, 4)}
                        opacity={0.4}
                    />
                )
            })}
            {/* Nodes */}
            {nodePos.map((n, i) => (
                <g key={n.id}>
                    <circle cx={n.x} cy={n.y} r={Math.max(3, Math.min(n.val, 15))} fill={n.color} opacity={0.8} />
                    <text
                        x={n.x}
                        y={n.y}
                        dx={n.x > centerX ? 10 : -10}
                        dy={4}
                        textAnchor={n.x > centerX ? 'start' : 'end'}
                        fontSize={8}
                        fontWeight="bold"
                        fill="#475569"
                    >
                        {n.id}
                    </text>
                </g>
            ))}
        </svg>
    )
}


export default function ResearchAnalytics() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/analytics/research')
            .then(res => res.json())
            .then(json => {
                setData(json.stats)
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }, [])

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-accent" size={48} /></div>
    if (!data) return <div className="text-center p-12 text-text-muted">No data available</div>

    const PILLARS = ['Shine Within', 'Shine Out', 'Shine Up', 'Shine Beyond']

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">

            {/* HEADER KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 text-white rounded-[24px] p-6 shadow-xl flex items-center justify-between">
                    <div>
                        <div className="text-xs font-black uppercase tracking-widest opacity-60">Total Fuentes</div>
                        <div className="text-4xl font-black">{data.total}</div>
                    </div>
                    <BookOpen size={32} className="opacity-20" />
                </div>
                <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Conceptos Clave</div>
                    <div className="text-4xl font-black text-slate-800">{data.conceptDensity?.length || 0}</div>
                </div>
                <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Regiones</div>
                    <div className="text-4xl font-black text-slate-800">{data.geoDist?.length || 0}</div>
                </div>
            </div>

            {/* SEC 2: COBERTURA CIENTÍFICA (Pilar Focus) */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Layers size={16} className="text-blue-600" /></div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">2. Cobertura Científica 4Shine</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Distribution Chart */}
                    <div className="bg-card-bg border border-border rounded-[24px] p-6 shadow-sm lg:col-span-1">
                        <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-4 opacity-70">Fuentes por Pilar</h3>
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.pillarDist}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                                    <YAxis />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {data.pillarDist.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Heatmap Matrix: Pillar x Competence */}
                    <div className="lg:col-span-2">
                        <HeatmapMatrix
                            title="Mapa de Evidencia: Competencia x Pilar"
                            data={data.pillarCompetenceData}
                            xLabels={PILLARS}
                        />
                    </div>
                </div>
            </section>

            {/* SEC 3: BALANCE METODOLÓGICO */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><Microscope size={16} className="text-purple-600" /></div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">3. Rigor Metodológico</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Method Mix */}
                    <div className="bg-card-bg border border-border rounded-[24px] p-6 shadow-sm">
                        <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-4 opacity-70">Mix Metodológico</h3>
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.methodCounts} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" paddingAngle={2}>
                                        {data.methodCounts?.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Evidence Ranking Top 10 */}
                    <div className="bg-card-bg border border-border rounded-[24px] p-6 shadow-sm overflow-hidden">
                        <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-4 opacity-70">Top 10: Índice de Evidencia</h3>
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                            {data.evidenceRanking.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${item.score >= 4 ? 'bg-emerald-500' : item.score === 3 ? 'bg-blue-400' : 'bg-slate-400'
                                        }`}>
                                        {item.score}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold truncate text-slate-700">{item.title}</div>
                                        <div className="text-[10px] text-slate-400 truncate">{item.methodology}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Method x Pillar Matrix (Full Width) */}
                    <div className="lg:col-span-2">
                        <HeatmapMatrix title="Matriz: Método x Pilar" data={data.methodPillarData} xLabels={PILLARS} />
                    </div>
                </div>
            </section>

            {/* SEC 4 & 5: GEOGRAFÍA & POBLACIÓN */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Geography */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"><Globe size={16} className="text-green-600" /></div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">4. Relevancia Geográfica</h2>
                    </div>
                    {/* Geo Charts */}
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-[24px] p-6 h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.geoDist} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <HeatmapMatrix title="Geo x Pilar" data={data.geoPillarData} xLabels={PILLARS} />
                    </div>
                </div>

                {/* Population */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><Users size={16} className="text-orange-600" /></div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">5. Poblaciones</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-[24px] p-6 h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.popDist} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <HeatmapMatrix title="Población x Pilar" data={data.popPillarData} xLabels={PILLARS} />
                    </div>
                </div>
            </section>

            {/* SEC 6: SEMÁNTICA */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center"><Brain size={16} className="text-pink-600" /></div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">6. Insights Semánticos (Red)</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[32px] p-8 aspect-square lg:aspect-video flex items-center justify-center relative overflow-hidden">
                        <div className="absolute top-4 left-6 text-xs text-text-muted font-bold uppercase">Grafo de Co-ocurrencia</div>
                        <CircularConceptGraph nodes={data.conceptGraph.nodes} links={data.conceptGraph.links} />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[24px] p-6">
                        <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-4 opacity-70">Ranking de Conceptos</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.conceptDensity.slice(0, 15).map((c: any, i: number) => (
                                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                                    {c.text} ({c.value})
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* SEC 7: TRAZABILIDAD */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center"><LinkIcon size={16} className="text-indigo-600" /></div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">7. Trazabilidad (Más Citados)</h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[24px] p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.citationRanking.map((cit: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="text-3xl font-black text-indigo-200">#{i + 1}</div>
                                <div>
                                    <div className=" font-bold text-slate-800 leading-tight">{cit.title}</div>
                                    <div className="text-xs text-indigo-500 font-bold mt-1">{cit.count} citas en inventario</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    )
}
