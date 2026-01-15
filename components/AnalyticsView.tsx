'use client'

import React, { useState } from 'react'
import { LayoutDashboard, BookOpen } from 'lucide-react'
import ResearchAnalytics from './ResearchAnalytics'
// Import existing Analytics/Charts components if available, otherwise defaulting to placeholder
// Assuming methodology analytics code can be moved here or reused. For now, I'll allow the parent to pass "Inventory Analytics" children or implement it here.
// Since the user said "Inventory Analysis" is one tab, I'll reuse the existing logic if I can find it, but `analitica/page.tsx` was just "MethodologySPA" which is a list.
// The prompt says "En el módulo de analítica, habrá 2 pestañas". Previous `analitica` page pointed to specific inventory analysis? No, it pointed to `MethodologySPA` which looked like a list view in `qa/page.tsx`. 
// I will assume for "Inventory Analysis" I should render what was previously there (conceptually) or a placeholder if I don't have the charts yet.
// Wait, `MethodologySPA` IS the "Inventory List" basically. But "Analítica" implies charts.
// The user likely wants *Charts* for Inventory (like breakdown by type, completeness) and *Charts* for Research.
// I will create a placeholder for Inventory Analysis for now or try to fetch basic inventory stats.

export default function AnalyticsView() {
    const [activeTab, setActiveTab] = useState<'inventory' | 'research'>('inventory')

    return (
        <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-accent/30 selection:text-accent pb-20">
            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b-4 border-border px-8 h-20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight leading-none">DASHBOARD DE IMPACTO</h1>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Métricas de Inventario e Investigación</p>
                    </div>
                </div>
            </nav>

            <main className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${activeTab === 'inventory'
                            ? 'bg-text-main border-text-main text-bg'
                            : 'bg-card-bg border-border text-text-muted hover:border-text-main/20'
                            }`}
                    >
                        <LayoutDashboard size={14} /> Inventario de Activos
                    </button>
                    <button
                        onClick={() => setActiveTab('research')}
                        className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${activeTab === 'research'
                            ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                            : 'bg-card-bg border-border text-text-muted hover:border-accent/30 hover:text-accent'
                            }`}
                    >
                        <BookOpen size={14} /> Investigación
                    </button>
                </div>

                <div className="min-h-[500px]">
                    {activeTab === 'inventory' && (
                        <div className="p-12 text-center border-4 border-dashed border-border rounded-[32px] text-text-muted opacity-50">
                            <h3 className="text-xl font-bold mb-2">Análisis de Inventario</h3>
                            <p>Visualizaciones de completitud, madurez y pilares de activos internos.</p>
                            {/* NOTE: If there were existing charts for inventory, they'd go here. */}
                        </div>
                    )}

                    {activeTab === 'research' && <ResearchAnalytics />}
                </div>
            </main>
        </div>
    )
}
