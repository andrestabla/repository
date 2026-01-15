'use client'

import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Treemap, Legend } from 'recharts'
import { Loader2, Globe, Users, Brain, BookOpen } from 'lucide-react'

// Colors for Pillars
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
    if (!data) return <div className="text-center text-text-muted">No data available</div>

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[24px] p-6 text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <BookOpen size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Total Fuentes</span>
                    </div>
                    <div className="text-5xl font-black tracking-tighter">{data.total}</div>
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

            {/* CHARTS ROW 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pillar Distribution */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        Validación por Pilares 4Shine
                    </h3>
                    <div className="h-64">
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

                {/* Concept Density (Treemap alternative using Bar for now for clarity) */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        Densidad de Conceptos (Top 10)
                    </h3>
                    <div className="h-64">
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

            {/* CHARTS ROW 2 - Competence & Geography */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Competencias Clave */}
                <div className="lg:col-span-2 bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Competencias Clave Identificadas</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.competenceDist}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} dy={10} interval={0} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#00C49F" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Geography */}
                <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Cobertura Geográfica</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.geoDist}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.geoDist.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
