'use client'

import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Terminal, RefreshCw } from 'lucide-react'
import { signIn } from "next-auth/react"

export default function Shell({ children, session }: { children: React.ReactNode, session: any }) {
    const [collapsed, setCollapsed] = useState(false)

    // Simplified Login View if no session 
    // (Note: MethodologySPA previously handled this internally, but now Shell wraps everything)
    if (!session) {
        return (
            <div className="fixed inset-0 bg-bg flex items-center justify-center transition-colors">
                <div className="text-center p-12 bg-panel border border-border rounded-2xl shadow-2xl max-w-sm w-full mx-4">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent animate-pulse">
                        <Terminal size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-text-main mb-2 tracking-tight">4Shine Builder</h2>
                    <p className="text-sm text-text-muted mb-8 leading-relaxed">Framework de Arquitectura Metodológica e Inventario de Activos.</p>
                    <button
                        onClick={() => signIn('google')}
                        className="w-full bg-accent text-white px-6 py-3.5 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-accent/20"
                    >
                        <RefreshCw size={20} className="animate-spin-slow" />
                        Acceder con Google Workspace
                    </button>
                    <p className="text-[10px] text-text-muted mt-8 uppercase tracking-[0.2em] font-bold opacity-40">System Release 1.2 Pro</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-bg text-text-main font-ui">
            <Sidebar session={session} collapsed={collapsed} setCollapsed={setCollapsed} />
            <main className="flex-1 overflow-auto bg-bg relative transition-all duration-300">
                {children}
            </main>
        </div>
    )
}
