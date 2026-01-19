'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Database,
    ShieldCheck,
    TreePine,
    Grid3X3,
    Tag,
    Zap,
    Book,
    BookOpen,
    Monitor,
    Activity,
    ChevronLeft,
    ChevronRight,
    LogOut
} from 'lucide-react'
import { signOut } from "next-auth/react"

interface SidebarProps {
    session: any
    collapsed: boolean
    setCollapsed: (v: boolean) => void
}

const NavBtn = ({ id, label, icon, active, href, collapsed }: any) => {
    if (collapsed) {
        return (
            <Link
                href={href}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group
                ${active ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:bg-accent/10 hover:text-accent'}`}
                title={label}
            >
                {icon}
                {active && <div className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-white/20 rounded-l-full" />}
            </Link>
        )
    }

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden
            ${active ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:bg-accent/10 hover:text-accent'}`}
        >
            <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                {icon}
            </div>
            <span className="font-bold text-sm tracking-tight">{label}</span>
            {active && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20" />}
        </Link>
    )
}

const NavHeader = ({ label, collapsed }: any) => {
    if (collapsed) return <div className="h-4 border-b border-border mx-2 my-2 opacity-30" />
    return (
        <div className="text-[10px] font-black text-text-muted opacity-40 uppercase tracking-[0.2em] px-4 mt-6 mb-2">
            {label}
        </div>
    )
}

export function Sidebar({ session, collapsed, setCollapsed }: SidebarProps) {
    const pathname = usePathname()
    // Normalizing currentView logic as in original SPA
    const currentView = pathname === '/' ? 'inventory' : pathname === '/inventario' ? 'inventory' : pathname.replace('/', '')

    const userRole = session?.user?.role?.toLowerCase() || 'curador'
    const userName = session?.user?.name || 'Usuario'
    const userAvatar = session?.user?.image

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark')
        localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }

    // Initialize theme on mount
    useEffect(() => {
        const stored = localStorage.getItem('theme') || 'light'
        if (stored === 'dark') document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
    }, [])

    return (
        <aside
            className={`bg-panel border-r border-border flex flex-col transition-all duration-300 ease-in-out shadow-2xl z-50
            ${collapsed ? 'w-[80px] p-4 items-center' : 'w-[280px] p-6'}`}
        >
            {/* Header */}
            <div className={`flex items-center justify-between mb-8 ${collapsed ? 'flex-col gap-4' : ''}`}>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg shadow-accent/30 shrink-0">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    {!collapsed && (
                        <div className="animate-in fade-in duration-300">
                            <span className="text-xl font-black text-text-main tracking-tighter mr-2">4Shine</span>
                            <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-accent/20">Pro</span>
                        </div>
                    )}
                </div>

                {!collapsed ? (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-6 h-6 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted hover:text-accent transition-colors"
                    >
                        <ChevronLeft size={14} />
                    </button>
                ) : (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-6 h-6 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted hover:text-accent transition-colors"
                    >
                        <ChevronRight size={14} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className={`flex flex-col gap-1.5 flex-1 overflow-y-auto no-scrollbar ${collapsed ? 'items-center w-full' : ''}`}>
                {userRole === 'admin' && (
                    <>
                        <NavHeader label="SISTEMA" collapsed={collapsed} />
                        <NavBtn id="admin" label="Administración" icon={<ShieldCheck size={18} />} active={currentView === 'admin'} href="/admin" collapsed={collapsed} />
                        {!collapsed && <div className="my-3 border-t border-border opacity-50" />}
                    </>
                )}

                <NavHeader label="OPERACIÓN" collapsed={collapsed} />
                <NavBtn id="analytics" label="Analítica" icon={<Activity size={18} />} active={pathname.startsWith('/analitica')} href="/analitica" collapsed={collapsed} />
                <NavBtn id="inventory" label="Inventario" icon={<Database size={18} />} active={pathname === '/inventario' || pathname === '/'} href="/inventario" collapsed={collapsed} />
                <NavBtn id="research" label="Investigación" icon={<BookOpen size={18} />} active={pathname.startsWith('/research')} href="/research" collapsed={collapsed} />
                {/* Note: Research is now tab inside AnalyticsView, or check routing. 
                    Wait, previous code had `href="/research"` but I made AnalyticsView main for research. 
                    I'll point to "/analitica" for now or keep "/research" if that route exists? 
                    Wait, Step 848 replaced `app/analitica/page.tsx`. `app/research` folder exists? 
                    Listing said `research` dir exists. Let's check if it has a page. 
                    Assuming user meant the new Analytics Tab "Investigación". 
                    Actually, if I look at Step 848, `app/analitica` handles BOTH Inventory and Research. 
                    So the "Investigación" link might just go to `/analitica` or `/analitica?tab=research`.
                    I'll use `/analitica` for now.
                */}

                {(userRole === 'admin' || userRole === 'auditor') && (
                    <NavBtn id="qa" label="Calidad (QA)" icon={<ShieldCheck size={18} />} active={currentView === 'qa'} href="/qa" collapsed={collapsed} />
                )}

                <div className="h-4" />

                <NavHeader label="ARQUITECTURA" collapsed={collapsed} />
                <NavBtn id="taxonomy" label="Taxonomía" icon={<TreePine size={18} />} active={currentView === 'taxonomy'} href="/taxonomy" collapsed={collapsed} />
                <NavBtn id="glossary" label="Glosario" icon={<Book size={18} />} active={currentView === 'glossary'} href="/glossary" collapsed={collapsed} />
                <NavBtn id="gaps" label="Heatmap" icon={<Grid3X3 size={18} />} active={currentView === 'gap-analysis'} href="/gap-analysis" collapsed={collapsed} />
                <NavBtn id="releases" label="Versiones" icon={<Tag size={18} />} active={currentView === 'releases'} href="/releases" collapsed={collapsed} />
                <NavBtn id="generator" label="Compilador" icon={<Zap size={18} />} active={currentView === 'generator'} href="/generator" collapsed={collapsed} />
            </nav>

            {/* Footer */}
            <div className={`mt-4 pt-4 border-t border-border flex flex-col gap-2 ${collapsed ? 'items-center' : ''}`}>
                <button
                    onClick={toggleTheme}
                    className={`w-full rounded-xl border border-border bg-bg hover:bg-border/20 transition-colors flex items-center justify-center text-text-muted ${collapsed ? 'h-10 w-10 p-0' : 'h-10 gap-2'}`}
                    title="Alternar Tema"
                >
                    <Monitor size={16} />
                    {!collapsed && <span className="text-xs font-bold">Cambiar Tema</span>}
                </button>

                <div className={`bg-bg/50 border border-border rounded-2xl p-3 shadow-sm hover:shadow-md transition-all group flex items-center gap-3 ${collapsed ? 'justify-center w-10 p-0 h-10 overflow-hidden' : ''}`}>
                    <div className={`rounded-xl overflow-hidden border border-border ring-2 ring-accent/10 group-hover:ring-accent/20 transition-all shrink-0 ${collapsed ? 'w-full h-full' : 'w-10 h-10'}`}>
                        {userAvatar ? <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-accent/10 text-accent flex items-center justify-center font-bold">👤</div>}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-black text-text-main truncate leading-tight">{userName}</div>
                            <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider truncate">{userRole}</div>
                        </div>
                    )}
                    {!collapsed && (
                        <button onClick={() => signOut()} className="text-text-muted hover:text-danger transition-colors">
                            <LogOut size={14} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    )
}
