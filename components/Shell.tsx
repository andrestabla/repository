'use client'

import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Terminal, RefreshCw } from 'lucide-react'
import { signIn } from "next-auth/react"

export default function Shell({ children, session }: { children: React.ReactNode, session: any }) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-panel border-b border-border flex items-center justify-between px-4 z-40">
               <div className="flex items-center gap-3">
                   <button 
                       onClick={() => setMobileMenuOpen(true)}
                       className="p-2 -ml-2 text-text-muted hover:text-accent transition-colors"
                   >
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <line x1="3" y1="12" x2="21" y2="12"></line>
                           <line x1="3" y1="6" x2="21" y2="6"></line>
                           <line x1="3" y1="18" x2="21" y2="18"></line>
                       </svg>
                   </button>
                   <span className="font-bold text-lg">4Shine</span>
               </div>
               {session?.user?.image && (
                   <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full border border-border" />
               )}
            </header>

            {/* Mobile Sidebar Backdrop */}
            {mobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <Sidebar 
                session={session} 
                collapsed={collapsed} 
                setCollapsed={setCollapsed}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />
            
            <main className="flex-1 overflow-auto bg-bg relative transition-all duration-300 md:pt-0 pt-16">
                {children}
            </main>
        </div>
    )
}
