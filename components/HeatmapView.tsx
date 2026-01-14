'use client'

import React from 'react'
import Link from 'next/link'

type HeatmapProps = {
    subcomponents: any[]
    maturityLevels: string[]
    heatmap: Record<string, Record<string, { count: number, status: 'red' | 'yellow' | 'green' }>>
}

export default function HeatmapView({ subcomponents, maturityLevels, heatmap }: HeatmapProps) {
    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8">
                <h2 className="text-[24px] font-bold text-white tracking-tight">Monitoreo de Cobertura (HU-M-02)</h2>
                <p className="text-[13px] text-text-muted mt-1">Identifica brechas y gestiona la madurez de la competencia 4Shine.</p>
            </header>

            <div className="bg-panel border border-border rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#0d1117] border-b border-border">
                                <th className="p-4 text-left text-[12px] font-bold text-text-muted border-r border-border min-w-[200px]">Subcomponente</th>
                                {maturityLevels.map(lvl => (
                                    <th key={lvl} className="p-4 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider">{lvl}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {subcomponents.map(sub => (
                                <tr key={sub.id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                                    <td className="p-4 border-r border-border">
                                        <div className="text-[13px] font-semibold text-white">{sub.name}</div>
                                        <div className="text-[10px] text-accent mt-0.5 uppercase">{sub.parent?.name}</div>
                                    </td>
                                    {maturityLevels.map(lvl => {
                                        const node = heatmap[sub.name]?.[lvl]
                                        if (!node) return <td key={lvl} className="p-2 text-center">-</td>

                                        const { count, status } = node
                                        const bgClass = status === 'green' ? 'bg-success/20 text-success border-success/30'
                                            : status === 'yellow' ? 'bg-warning/20 text-warning border-warning/30'
                                                : 'bg-danger/20 text-danger border-danger/30'

                                        return (
                                            <td key={lvl} className="p-2 text-center">
                                                <div className={`inline-flex flex-col items-center justify-center w-full min-h-[50px] rounded-lg border transition-transform active:scale-95 ${bgClass} cursor-pointer group`}>
                                                    <span className="text-[14px] font-bold">{count}</span>
                                                    <span className="text-[9px] opacity-70 group-hover:underline">
                                                        {status === 'red' ? 'Solicitar' : 'Ver Detalles'}
                                                    </span>
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

            <div className="mt-8 grid grid-cols-4 gap-4">
                <LegendItem color="bg-success" label="Validado / Full" desc="Al menos 1 contenido validado por experto." />
                <LegendItem color="bg-warning" label="En Proceso" desc="Contenidos en borrador o revisión." />
                <LegendItem color="bg-danger" label="Brecha Crítica" desc="Sin contenidos asociados (P0)." />
                <LegendItem color="bg-border" label="Acción" desc="Clic para crear solicitud pre-llenada." />
            </div>
        </div>
    )
}

function LegendItem({ color, label, desc }: { color: string, label: string, desc: string }) {
    return (
        <div className="bg-panel border border-border p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                <span className="text-[12px] font-bold text-white text-nowrap">{label}</span>
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed">{desc}</p>
        </div>
    )
}
