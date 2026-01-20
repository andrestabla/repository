import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { AlertCircle, CheckCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

type GapStat = {
    pillar: string
    totalBehaviors: number
    coveredBehaviors: number
    coverage: number
    missing: Array<{
        pillar: string
        sub: string
        competence: string
        behavior: string
    }>
}

type AnalysisData = {
    stats: GapStat[]
    totalGaps: number
    generatedAt: string
}

export default function GapAnalysisView() {
    const [data, setData] = useState<AnalysisData | null>(null)
    const [loading, setLoading] = useState(true)
    const [expandedPillar, setExpandedPillar] = useState<string | null>(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/reports/gap-analysis')
            const json = await res.json()
            setData(json)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full text-text-muted animate-pulse">
            <RefreshCw className="animate-spin mb-4" size={40} />
            <p>Calculando Brechas contra Taxonomía...</p>
        </div>
    )

    if (!data) return <div>Error cargando datos</div>

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-text-main">ANÁLISIS DE BRECHAS (GAP)</h2>
                    <p className="text-sm font-bold text-text-muted mt-1 uppercase tracking-widest">
                        Cobertura Real vs. Taxonomía Ideal
                    </p>
                </div>
                <div className="bg-card-bg px-6 py-3 rounded-2xl border-2 border-border shadow-lg flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-text-muted">Brechas Totales</p>
                        <p className="text-2xl font-black text-danger leading-none">{data.totalGaps}</p>
                    </div>
                    <AlertCircle className="text-danger" size={32} />
                </div>
            </div>

            {/* High Level Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.stats.map(stat => (
                    <div key={stat.pillar} className="bg-card-bg border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-1">{stat.pillar}</h3>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black text-accent">{stat.coverage}%</span>
                                <span className="text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wide">Cobertura</span>
                            </div>
                            <div className="w-full bg-border h-2 rounded-full mt-4 overflow-hidden">
                                <div
                                    className="bg-accent h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${stat.coverage}%` }}
                                />
                            </div>
                            <div className="mt-2 flex justify-between text-[10px] font-bold text-text-muted uppercase">
                                <span>{stat.coveredBehaviors} Cubiertos</span>
                                <span>{stat.totalBehaviors} Objetivos</span>
                            </div>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <PieChart width={120} height={120}>
                                <Pie
                                    data={[{ value: stat.coverage }, { value: 100 - stat.coverage }]}
                                    innerRadius={40}
                                    outerRadius={60}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="value"
                                >
                                    <Cell fill="currentColor" className="text-accent" />
                                    <Cell fill="transparent" />
                                </Pie>
                            </PieChart>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Gap List */}
            <div className="bg-bg border-4 border-border rounded-[32px] overflow-hidden shadow-xl">
                <div className="bg-card-bg p-6 border-b-4 border-border flex items-center justify-between">
                    <h3 className="text-lg font-black text-text-main uppercase tracking-widest">
                        Detalle de Conductas Faltantes
                    </h3>
                    <button onClick={fetchData} className="p-2 hover:bg-black/5 rounded-full text-text-muted transition-colors">
                        <RefreshCw size={18} />
                    </button>
                </div>

                <div className="divide-y divide-border">
                    {data.stats.map(stat => (
                        <div key={stat.pillar} className="group">
                            <button
                                onClick={() => setExpandedPillar(expandedPillar === stat.pillar ? null : stat.pillar)}
                                className="w-full flex items-center justify-between p-6 hover:bg-card-bg transition-colors text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-12 rounded-full ${stat.coverage === 100 ? 'bg-success' : 'bg-danger'}`} />
                                    <div>
                                        <span className="text-xs font-black text-text-muted uppercase tracking-widest">{stat.pillar}</span>
                                        <h4 className="text-lg font-bold text-text-main">
                                            {stat.missing.length === 0
                                                ? '¡Cobertura Completa! 🎉'
                                                : `${stat.missing.length} Conductas Faltantes`
                                            }
                                        </h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-black text-text-muted opacity-30 group-hover:opacity-100 transition-opacity">
                                        {stat.coverage}%
                                    </span>
                                    {expandedPillar === stat.pillar ? <ChevronUp /> : <ChevronDown />}
                                </div>
                            </button>

                            {expandedPillar === stat.pillar && stat.missing.length > 0 && (
                                <div className="bg-card-bg/50 px-6 pb-6 animate-in slide-in-from-top-4">
                                    <div className="space-y-3 pl-7 border-l-2 border-dashed border-border ml-5 mt-2">
                                        {stat.missing.map((gap, idx) => (
                                            <div key={idx} className="bg-bg border border-border rounded-xl p-4 text-sm shadow-sm relative group/item hover:border-danger/50 transition-colors">
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    <span className="bg-danger/10 text-danger text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-wider">Brecha Detectada</span>
                                                    <span className="bg-accent/5 text-text-muted text-[9px] font-bold uppercase px-2 py-1 rounded-md tracking-wider border border-border">{gap.sub}</span>
                                                    <span className="bg-accent/5 text-text-muted text-[9px] font-bold uppercase px-2 py-1 rounded-md tracking-wider border border-border">{gap.competence}</span>
                                                </div>
                                                <p className="text-text-main font-medium leading-relaxed">
                                                    "{gap.behavior}"
                                                </p>

                                                <div className="absolute right-4 top-4 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <button className="px-3 py-1.5 bg-text-main text-bg rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-colors">
                                                        Crear Contenido
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
