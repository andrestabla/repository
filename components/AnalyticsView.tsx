'use client'

import React from 'react'
import { LayoutDashboard, BookOpen } from 'lucide-react'
import ResearchAnalytics from './ResearchAnalytics'
import Link from 'next/link'

export default function AnalyticsView({ currentTab = 'inventory' }: { currentTab?: 'inventory' | 'research' }) {

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
                    <Link
                        href="/analitica/inventario"
                        className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${currentTab === 'inventory'
                            ? 'bg-text-main border-text-main text-bg'
                            : 'bg-card-bg border-border text-text-muted hover:border-text-main/20'
                            }`}
                    >
                        <LayoutDashboard size={14} /> Inventario de Activos
                    </Link>
                    <Link
                        href="/analitica/research"
                        className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${currentTab === 'research'
                            ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                            : 'bg-card-bg border-border text-text-muted hover:border-accent/30 hover:text-accent'
                            }`}
                    >
                        <BookOpen size={14} /> Investigación
                    </Link>
                </div>


                <div className="min-h-[500px]">
                    {currentTab === 'inventory' && (
                        <div className="p-12 text-center border-4 border-dashed border-border rounded-[32px] text-text-muted opacity-50">
                            <h3 className="text-xl font-bold mb-2">Análisis de Inventario</h3>
                            <p>Visualizaciones de completitud, madurez y pilares de activos internos.</p>
                            {/* NOTE: If there were existing charts for inventory, they'd go here. */}
                        </div>
                    )}

                    {currentTab === 'research' && <ResearchAnalytics />}
                </div>
            </main>
        </div>
    )
}
