import React from 'react'
import { Map, BarChart, PieChart, TrendingUp, Users, Target, CheckCircle, AlertTriangle, Lightbulb, Zap } from 'lucide-react'

// Icon mapping helper
const IconMap: any = {
    map: Map,
    chart: BarChart,
    pie: PieChart,
    trend: TrendingUp,
    users: Users,
    target: Target,
    check: CheckCircle,
    alert: AlertTriangle,
    idea: Lightbulb,
    zap: Zap
}

type InfographicData = {
    title: string;
    intro: string;
    sections: {
        title: string;
        content: string;
        icon?: string;
        stats?: { label: string; value: string }[];
        chart?: { type: 'bar' | 'pie'; data: { name: string; value: number }[] };
    }[];
    conclusion: string;
}

export default function InfographicRenderer({ data }: { data: InfographicData }) {
    if (!data) return null;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-6 font-sans">
            {/* HERDER */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-10 text-white">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{data.title}</h1>
                <p className="text-lg md:text-xl opacity-90 font-light leading-relaxed max-w-3xl">{data.intro}</p>
            </div>

            {/* SECTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-12 bg-slate-50 dark:bg-black/20">
                {data.sections.map((section, idx) => {
                    const Icon = section.icon && IconMap[section.icon] ? IconMap[section.icon] : Zap
                    const isFullWidth = idx === data.sections.length - 1 && data.sections.length % 2 !== 0

                    return (
                        <div
                            key={idx}
                            className={`flex flex-col gap-4 bg-white dark:bg-[#1E1F20] p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow ${isFullWidth ? 'md:col-span-2' : ''}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{section.title}</h3>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                {section.content}
                            </p>

                            {/* STATS */}
                            {section.stats && section.stats.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    {section.stats.map((stat, sIdx) => (
                                        <div key={sIdx} className="bg-slate-50 dark:bg-black/30 p-3 rounded-lg text-center border border-slate-100 dark:border-slate-800">
                                            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                                                {stat.value}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* SIMPLE CHARTS */}
                            {section.chart && section.chart.data && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Datos Clave</h4>
                                    <div className="space-y-2">
                                        {section.chart.data.map((item, cIdx) => (
                                            <div key={cIdx} className="relative">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                                                    <span className="text-slate-500">{item.value}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                                                        style={{ width: `${Math.min(item.value, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* FOOTER */}
            <div className="p-8 md:p-10 bg-slate-900 text-white text-center">
                <div className="max-w-2xl mx-auto">
                    <h3 className="text-lg font-bold mb-3 opacity-90">Conclusión</h3>
                    <p className="text-sm opacity-70 leading-relaxed">{data.conclusion}</p>
                </div>
            </div>
        </div>
    )
}
