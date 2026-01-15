'use client'

import React, { useState, useEffect } from 'react'
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import {
    Activity, Clock, Database, CheckCircle2, ChevronRight, BarChart3, PieChart as PieIcon, ArrowUpRight
} from 'lucide-react'

// --- TYPES ---
type AnalyticsData = {
    metrics: {
        total: number
        validationRate: number
    }
    charts: {
        status: { name: string, value: number }[]
        pillars: { name: string, value: number }[]
    }
    recent: {
        id: string
        title: string
        status: string
        updatedAt: string
        primaryPillar: string
    }[]
}

const COLORS = ['#0969da', '#2da44e', '#8250df', '#cf222e', '#bf8700']
const RADIAN = Math.PI / 180

export default function AnalyticsView() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/analytics')
                const jsonData = await res.json()
                setData(jsonData)
            } catch (e) { console.error('Failed to load analytics', e) }
            setLoading(false)
        }
        fetchAnalytics()
    }, [])

    if (loading) return (
        <div className="flex h-full items-center justify-center p-20 opacity-50 animate-pulse">
            <div className="text-center">
                <BarChart3 className="mx-auto mb-4 text-accent" size={32} />
                <p className="text-xs font-black uppercase tracking-widest text-text-muted">Analizando Datos...</p>
            </div>
        </div>
    )

    if (!data) return null

    // Helper for Pie Chart Labels
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5
        const x = cx + radius * Math.cos(-midAngle * RADIAN)
        const y = cy + radius * Math.sin(-midAngle * RADIAN)
        return percent > 0.05 ? (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        ) : null
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <Activity className="text-accent" />
                    Tablero de Métrica
                </h2>
                <p className="text-sm text-text-muted mt-1 ml-9">Visión holística del estado del repositorio metodológico.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Total Activos"
                    value={data.metrics.total}
                    icon={<Database size={20} />}
                    trend="+12% vs last month"
                />
                <KPICard
                    title="Tasa de Validación"
                    value={`${data.metrics.validationRate}%`}
                    icon={<CheckCircle2 size={20} />}
                    sub="Objetivo: 85%"
                />
                <KPICard
                    title="Cola de Revisión"
                    value={data.charts.status.find(s => s.name === 'Revisión')?.value || 0}
                    icon={<Clock size={20} />}
                    color="text-warning"
                />
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-[1.5fr_1fr] gap-6">
                {/* Pillar Distribution Bar Chart */}
                <div className="bg-panel border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-6 z-10 relative">
                        <div>
                            <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 size={16} className="text-accent" /> Distribución por Pilar
                            </h3>
                            <p className="text-[10px] text-text-muted mt-1 opacity-60">Volumen de activos por eje temático</p>
                        </div>
                    </div>
                    <div className="h-[250px] w-full z-10 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.charts.pillars} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6e7681', fontSize: 10, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6e7681', fontSize: 10 }}
                                />
                                <ChartTooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {data.charts.pillars.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Pie Chart */}
                <div className="bg-panel border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="mb-2">
                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                            <PieIcon size={16} className="text-purple-400" /> Estados del Ciclo
                        </h3>
                    </div>
                    <div className="h-[250px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.charts.status}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={80}
                                    innerRadius={50}
                                    fill="#8884d8"
                                    dataKey="value"
                                    paddingAngle={5}
                                >
                                    {data.charts.status.map((entry, index) => {
                                        let fillColor = '#6e7681'
                                        if (entry.name === 'Validado') fillColor = '#2da44e'
                                        if (entry.name === 'Revisión') fillColor = '#bf8700'
                                        if (entry.name === 'Borrador') fillColor = '#0969da'
                                        return <Cell key={`cell-${index}`} fill={fillColor} stroke="rgba(0,0,0,0.2)" />
                                    })}
                                </Pie>
                                <ChartTooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '12px', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-panel border border-border rounded-3xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                        <Clock size={16} className="text-blue-400" /> Actividad Reciente
                    </h3>
                    <button className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1">
                        VER TODO <ArrowUpRight size={10} />
                    </button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-bg/50 border-b border-border text-text-muted uppercase tracking-wider font-black">
                            <tr>
                                <th className="p-4">Activo</th>
                                <th className="p-4">Pilar</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-right">Actualizado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {data.recent.map(item => (
                                <tr key={item.id} className="hover:bg-accent/5 transition-colors group">
                                    <td className="p-4 font-bold text-text-main group-hover:text-accent transition-colors">
                                        {item.title}
                                        <div className="text-[9px] text-text-muted font-mono mt-0.5 opacity-60">{item.id}</div>
                                    </td>
                                    <td className="p-4 text-text-muted">{item.primaryPillar}</td>
                                    <td className="p-4">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="p-4 text-right text-text-muted font-mono text-[10px]">
                                        {new Date(item.updatedAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function KPICard({ title, value, icon, sub, color = "text-text-main", trend }: any) {
    return (
        <div className="bg-panel border border-border rounded-3xl p-6 hover:border-accent/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-bg border border-border rounded-2xl text-text-muted group-hover:text-accent group-hover:scale-110 transition-all shadow-inner">
                    {icon}
                </div>
                {trend && <span className="text-[9px] font-bold bg-success/10 text-success px-2 py-1 rounded-full border border-success/20">{trend}</span>}
            </div>
            <div className={`text-3xl font-black tracking-tighter mb-1 ${color}`}>{value}</div>
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-widest opacity-60">{title}</div>
            {sub && <div className="text-[10px] text-text-muted mt-2 border-t border-border pt-2 opacity-50">{sub}</div>}
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    let classes = "bg-gray-500/10 text-gray-500 border-gray-500/20"
    if (status === 'Validado') classes = "bg-success/15 text-success border-success/30"
    if (status === 'Revisión') classes = "bg-warning/15 text-warning border-warning/30"
    if (status === 'Borrador') classes = "bg-blue-500/10 text-blue-500 border-blue-500/20"

    return (
        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${classes}`}>
            {status}
        </span>
    )
}
