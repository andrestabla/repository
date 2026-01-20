
'use client'

import React, { useState, useEffect } from 'react'
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Treemap, Cell, Legend, ScatterChart, Scatter, ZAxis,
    PieChart, Pie
} from 'recharts'
import { Loader2, LayoutDashboard, Target, Layers, ArrowRight, BookOpen } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

// Custom Content for Treemap
const CustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, name, value } = props;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: depth < 2 ? COLORS[index % COLORS.length] : 'none',
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {depth === 1 ? (
                <text x={x + width / 2} y={y + 20} textAnchor="middle" fill="#fff" fontSize={16} fontWeight="bold" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}>
                    {name}
                </text>
            ) : null}
            {depth > 1 ? (
                <text x={x + 8} y={y + 20} fill="#fff" fontSize={11} fontWeight={500} fillOpacity={0.9} style={{ textShadow: '0px 1px 1px rgba(0,0,0,0.3)' }}>
                    {name} ({value})
                </text>
            ) : null}
        </g>
    );
};

export default function InventoryAnalytics() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/analytics/inventory')
            .then(res => res.json())
            .then(json => {
                setData(json.stats)
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }, [])

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-accent" size={48} /></div>
    if (!data) return <div className="text-center p-12 text-text-muted">No hay suficientes datos para generar analítica.</div>

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* KPI HEADERS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[24px] p-6 text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <LayoutDashboard size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Activos Totales</span>
                    </div>
                    <div className="text-4xl font-black">{data.total}</div>
                </div>
                {/* Add more KPIs if needed */}
            </div>

            {/* SECTION 1: COBERTURA DE PILARES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2.1 Radar: Cobertura Primaria */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Target size={18} className="text-accent" />
                        Cobertura Principal (Radar)
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.pillarDist}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                                <Radar name="Activos Primarios" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2.2 Radar: Cobertura Secundaria (Apoyo) */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Layers size={18} className="text-purple-500" />
                        Cobertura de Apoyo (Secundaria)
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.secondaryPillarDist}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                                <Radar name="Activos de Apoyo" dataKey="A" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SECTION 2: MADUREZ Y TÉCNICA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2.3 Heatmap: Pilar x Madurez */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Layers size={18} className="text-orange-500" />
                        Madurez por Pilar
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.maturityMatrix} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Bar dataKey="Básico" stackId="a" fill="#82ca9d" />
                                <Bar dataKey="En Desarrollo" stackId="a" fill="#ffc658" />
                                <Bar dataKey="Avanzado" stackId="a" fill="#8884d8" />
                                <Bar dataKey="Maestría" stackId="a" fill="#FF8042" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2.4 Distribución Técnica */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Layers size={18} className="text-pink-500" />
                        Distribución por Categoría Técnica
                    </h3>
                    <div className="h-80 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.typeDist}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {data.typeDist?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pr-0">
                            <div className="text-3xl font-black text-text-main">{data.total}</div>
                            <div className="text-[10px] uppercase font-bold text-text-muted">Activos</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2.3 Treemap: Cobertura Taxonómica (ENHANCED VISIBILITY) */}
            <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">
                    Árbol de Cobertura Taxonómica (Treemap)
                </h3>
                {/* INCREASED HEIGHT FOR BETTER VISIBILITY */}
                <div className="h-[600px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={data.treeMap}
                            dataKey="size"
                            aspectRatio={4 / 3}
                            stroke="#fff"
                            fill="#8884d8"
                            content={<CustomizedContent />}
                        >
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                        </Treemap>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-xs text-text-muted text-center max-w-2xl mx-auto">
                    Este mapa muestra la densidad de activos por Subcomponente (Cajas Grandes) y Competencias (Cajas Pequeñas).
                    <br />
                    <strong>Tamaño</strong> = Cantidad de Activos. <strong>Color</strong> = Pilar Principal.
                </div>
            </div>



            {/* SECTION 2: DISEÑO PEDAGÓGICO */}
            <h2 className="text-xl font-bold mt-10 mb-6 flex items-center gap-2">
                <BookOpen className="text-blue-500" /> Diseño Pedagógico y Experiencia
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 3.1 Distribución por Intervención */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-6">Intervención</h3>
                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.interventionDist}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#00C49F" radius={[4, 4, 0, 0]}>
                                    {data.interventionDist.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3.2 Journey (Moment) */}
                <div className="lg:col-span-2 bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        Learning Journey <ArrowRight size={14} />
                    </h3>
                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.journeyDist}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" padding={{ left: 30, right: 30 }} />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3.3 Matrix: Roles y Niveles */}
            <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Matriz de Roles y Niveles</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="py-3 font-bold text-text-muted">Target Role</th>
                                <th className="py-3 font-bold text-center text-blue-500">Junior</th>
                                <th className="py-3 font-bold text-center text-green-500">Senior</th>
                                <th className="py-3 font-bold text-center text-purple-500">Manager</th>
                                <th className="py-3 font-bold text-center text-orange-500">C-Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.roleMatrix.map((row: any) => (
                                <tr key={row.role} className="border-b border-border/50 hover:bg-gray-50/50">
                                    <td className="py-3 font-medium">{row.role || 'Sin Definir'}</td>
                                    {['Junior', 'Senior', 'Manager', 'C-Level'].map(level => {
                                        const count = row[level]
                                        return (
                                            <td key={level} className="py-3 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${count === 0 ? 'bg-gray-100 text-gray-400' :
                                                    count < 3 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {count}
                                                </span>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
