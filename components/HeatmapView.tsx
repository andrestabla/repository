'use client'

import React from 'react'
import {
    Grid3X3,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Info,
    ChevronDown
} from 'lucide-react'

type HeatmapProps = {
    subcomponents: any[]
    maturityLevels: string[]
    heatmap: Record<string, Record<string, { count: number, status: 'red' | 'yellow' | 'green' }>>
}

export default function HeatmapView({ subcomponents, maturityLevels, heatmap }: HeatmapProps) {
    return (
        <div className="max-w-7xl mx-auto text-left">
            <header className="mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                    <Grid3X3 size={28} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-text-main tracking-tighter">Monitoreo de Cobertura</h2>
                    <p className="text-sm text-text-muted mt-1 font-medium">Identifica brechas y gestiona la madurez de la competencia 4Shine.</p>
                </div>
            </header>

            <div className="bg-panel border border-border rounded-[32px] overflow-hidden shadow-2xl relative">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-panel/80 backdrop-blur-sm border-b border-border">
                                <th className="p-6 text-left text-[11px] font-black text-text-muted uppercase tracking-[0.2em] border-r border-border min-w-[240px]">
                                    <div className="flex items-center gap-2">
                                        Componente <ChevronDown size={12} className="opacity-50" />
                                    </div>
                                </th>
                                {maturityLevels.map(lvl => (
                                    <th key={lvl} className="p-6 text-center text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{lvl}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {subcomponents.map(sub => (
                                <tr key={sub.id} className="border-b border-border/40 hover:bg-bg/40 transition-colors group">
                                    <td className="p-6 border-r border-border bg-panel/30">
                                        <div className="text-[14px] font-black text-text-main group-hover:text-accent transition-colors tracking-tight">{sub.name}</div>
                                        <div className="text-[9px] text-accent mt-1.5 font-black uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                            {sub.parent?.name || 'Top Level'}
                                        </div>
                                    </td>
                                    {maturityLevels.map(lvl => {
                                        const node = heatmap[sub.name]?.[lvl]
                                        if (!node) return <td key={lvl} className="p-4 text-center opacity-10">
                                            <div className="w-full h-12 rounded-xl bg-border/20" />
                                        </td>

                                        const { count, status } = node
                                        const bgClass = status === 'green' ? 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                                            : status === 'yellow' ? 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20'
                                                : 'bg-danger/10 text-danger border-danger/30 hover:bg-danger/20'

                                        return (
                                            <td key={lvl} className="p-4 text-center">
                                                <div className={`inline-flex flex-col items-center justify-center w-full min-h-[64px] rounded-2xl border transition-all hover:scale-[1.05] hover:shadow-xl active:scale-95 ${bgClass} cursor-pointer group/cell`}>
                                                    <span className="text-xl font-black tracking-tighter">{count}</span>
                                                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                        <span className="text-[8px] font-black uppercase tracking-widest">
                                                            {status === 'red' ? 'Solicitar' : 'Explorar'}
                                                        </span>
                                                        <ArrowRight size={8} />
                                                    </div>
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <LegendCard
                    icon={<CheckCircle2 size={16} />}
                    color="bg-success"
                    label="Validado"
                    desc="Al menos 1 contenido verificado por experto (V3)."
                />
                <LegendCard
                    icon={<AlertCircle size={16} />}
                    color="bg-warning"
                    label="En Proceso"
                    desc="Activos en etapa de borrador o revisión técnica activa."
                />
                <LegendCard
                    icon={<XCircle size={16} />}
                    color="bg-danger"
                    label="Brecha Crítica"
                    desc="Sin contenidos asociados o desactualizados (P0)."
                />
                <LegendCard
                    icon={<Info size={16} />}
                    color="bg-border"
                    label="Acción"
                    desc="Acceso rápido a flujos de curación o peticiones AI."
                />
            </div>
        </div>
    )
}

function LegendCard({ icon, color, label, desc }: { icon: React.ReactNode, color: string, label: string, desc: string }) {
    return (
        <div className="bg-panel border border-border p-6 rounded-3xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-accent/40">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-xl ${color} text-white flex items-center justify-center shadow-lg shadow-black/5`}>
                    {icon}
                </div>
                <span className="text-[13px] font-black text-text-main uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed font-medium">{desc}</p>
        </div>
    )
}
