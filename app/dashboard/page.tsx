'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { ShieldCheck, Server, Activity, Lock, User, LayoutDashboard } from 'lucide-react'

export default function DashboardPage() {
    const { data: session } = useSession()
    const user = session?.user as any
    const allowedModules = user?.allowedModules || []

    return (
        <div className="p-8 h-full overflow-y-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-[var(--text-main)] mb-2 flex items-center gap-3">
                    <LayoutDashboard className="text-[var(--accent)]" size={32} />
                    Panel de Control
                </h1>
                <p className="text-[var(--text-muted)] text-lg">
                    Bienvenido al Sistema de Gestión Metodológica 4Shine.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {/* User Card */}
                <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-[var(--accent)]/10 rounded-xl text-[var(--accent)]">
                            <User size={24} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider bg-[var(--bg)] px-2 py-1 rounded text-[var(--text-muted)] border border-[var(--border)]">
                            {user?.role || 'Guest'}
                        </span>
                    </div>
                    <div className="mb-1">
                        <h3 className="text-lg font-bold text-[var(--text-main)]">{user?.name}</h3>
                        <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
                    </div>
                </div>

                {/* Permissions Card */}
                <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <Lock size={24} />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-muted)]">
                            {user?.role === 'admin' ? 'Acceso Total' : `${allowedModules.length} Módulos`}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">Permisos Activos</h3>
                    <div className="flex flex-wrap gap-2">
                        {user?.role === 'admin' ? (
                            <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                                Super Administrador
                            </span>
                        ) : allowedModules.length > 0 ? (
                            allowedModules.slice(0, 3).map((m: string) => (
                                <span key={m} className="px-2 py-1 rounded-md bg-[var(--bg)] text-[var(--text-muted)] text-xs font-bold border border-[var(--border)] uppercase">
                                    {m}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-[var(--text-muted)]">Sin módulos asignados</span>
                        )}
                        {allowedModules.length > 3 && (
                            <span className="px-2 py-1 text-xs text-[var(--text-muted)]">+{allowedModules.length - 3} más</span>
                        )}
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                            <Activity size={24} />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-emerald-500">Operativo</span>
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">Estado del Sistema</h3>
                    <p className="text-sm text-[var(--text-muted)]">Todos los servicios funcionando correctamente.</p>
                </div>
            </div>

            {/* Quick Access or Info */}
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-8 text-center">
                <Server size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-20" />
                <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">Selecciona un módulo en el menú lateral</h2>
                <p className="text-[var(--text-muted)] max-w-md mx-auto">
                    Utiliza la barra de navegación izquierda para acceder a los módulos habilitados para tu cuenta. Si necesitas acceso a un módulo adicional, contacta al administrador.
                </p>
            </div>
        </div>
    )
}
