'use client'

import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Treemap, Legend } from 'recharts'
import { Loader2, Globe, Users, Brain, BookOpen, RefreshCw } from 'lucide-react'

// Colors for Pillars
import WorldMap from './WorldMap'

// Colors for Pillars
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ResearchAnalytics() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchData = () => {
        setRefreshing(true)
        fetch('/api/analytics/research')
            .then(res => res.json())
            .then(json => {
                setData(json.stats)
                setLoading(false)
                setRefreshing(false)
            })
            .catch(err => {
                setLoading(false)
                setRefreshing(false)
            })
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-accent" size={48} /></div>
    if (!data) return <div className="text-center text-text-muted">No data available</div>

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards & Controls */}
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2 opacity-80">
                                <BookOpen size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">Total Fuentes</span>
                            </div>
                            <div className="text-5xl font-black tracking-tighter">{data.total}</div>
                        </div>
                        {/* Refresh Action Overlay */}
                        <button
                            onClick={fetchData}
                            disabled={refreshing}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all disabled:opacity-50"
                            title="Actualizar datos"
                        >
                            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                        </button>
                    </div>
                    <div className="bg-card-bg border border-border rounded-[24px] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2 text-text-muted">
                            <Brain size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">Conceptos Clave</span>
                        </div>
                        <div className="text-3xl font-black text-text-main">{data.conceptDensity?.length || 0}</div>
                    </div>
                    <div className="bg-card-bg border border-border rounded-[24px] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2 text-text-muted">
                            <Globe size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">Regiones</span>
                        </div>
                        <div className="text-3xl font-black text-text-main">{data.geoDist?.length || 0}</div>
                    </div>
                    <div className="bg-card-bg border border-border rounded-[24px] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2 text-text-muted">
                            <Users size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">Perfiles</span>
                        </div>
                        <div className="text-3xl font-black text-text-main">{data.popDist?.length || 0}</div>
                    </div>
                </div>
            </div>

            {/* CHARTS ROW 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pillar Distribution */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        Validación por Pilares 4Shine
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.pillarDist}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {data.pillarDist.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Concept Density (Top 10) */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        Densidad de Conceptos (Top 10)
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.conceptDensity.slice(0, 10)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="text" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" fill="#8884d8" radius={[0, 8, 8, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* CHARTS ROW 2 - Competence (Fix) & Geography (Map) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Competencias Clave - FIXED: Horizontal Bar Chart to show full text */}
                <div className="lg:col-span-2 bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Competencias Clave Identificadas</h3>
                    <div className="h-[400px]"> {/* Increased height for readability */}
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.competenceDist} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={220} // Much more space for labels
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#444', fontWeight: 500 }}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" fill="#00C49F" radius={[0, 8, 8, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Geography - FIXED: Map Visualization */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm flex flex-col">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Cobertura Geográfica</h3>
                    <div className="flex-1 min-h-[300px] flex items-center justify-center bg-blue-50/30 rounded-2xl overflow-hidden border border-border/50 relative">
                        {/* Using lightweight SVG Map */}
                        <WorldMap data={data.geoDist} />

                        {/* Map Legend Overlay */}
                        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-2 rounded-lg text-[10px] font-bold shadow-sm border border-border">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#00C49F]"></span>
                                <span>Activo</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-gray-200"></span>
                                <span>Sin datos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CHARTS ROW 3 - Profiles Distribution (Full Width for Side-by-Side Legend) */}
            <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Distribución de Perfiles
                </h3>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.popDist}
                                cx="40%" // Shift left to make room for legend
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                            >
                                {data.popDist.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Legend
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '11px', maxWidth: '40%' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
