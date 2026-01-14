'use client'

import React, { useState, useEffect } from 'react'
import { signIn, signOut } from "next-auth/react"
import AdminView from './AdminView'

// Types based on the schema
type ContentItem = {
    id: string
    title: string
    pillar: string
    sub?: string | null
    level?: string | null
    type: string
    version: string
    status: string
    ip: string | null
    completeness: number
    driveId?: string | null
    // New metadata fields (optional for now in UI)
    maturity?: string | null
    ipOwner?: string | null
}

type UserRole = 'metodologo' | 'curador' | 'auditor' | 'admin' | 'guest' | 'pending'

type User = {
    role: UserRole
    name: string
    label: string
    avatar: string | React.ReactNode
    color: string
}

type Session = {
    user?: {
        name?: string | null
        email?: string | null
        image?: string | null
        role?: string
    }
}

export default function MethodologySPA({ initialData, session }: { initialData: ContentItem[], session: Session | null }) {
    const [user, setUser] = useState<User | null>(null)
    const [currentView, setCurrentView] = useState('login')
    const [consoleLog, setConsoleLog] = useState<string[]>([])

    // Initialize User from Session
    useEffect(() => {
        if (session?.user) {
            // Use Role from Session or Default to Curador
            const role = (session.user.role as UserRole) || 'curador'

            setUser({
                role: role,
                name: session.user.name || 'Usuario 4Shine',
                label: role === 'admin' ? 'Administrador' : 'Builder (Connected)',
                avatar: session.user.image ? <img src={session.user.image} alt="avatar" className="w-full h-full rounded-full" /> : '👤',
                color: role === 'admin' ? '#d73a49' : '#58a6ff'
            })
            // Default view based on role
            setCurrentView(role === 'admin' ? 'admin' : 'inventory')
        }
    }, [session])

    // Real Data State
    const [inventoryData, setInventoryData] = useState<ContentItem[]>(initialData)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Fetch Logic
    const refreshData = async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch('/api/inventory')
            const data = await res.json()
            setInventoryData(data)
        } catch (e) {
            console.error("Failed to refresh", e)
        } finally {
            setIsRefreshing(false)
        }
    }

    // Upsert Logic
    const handleUpsert = async (item: ContentItem) => {
        try {
            const res = await fetch('/api/inventory/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            })
            if (res.ok) {
                // Optimistic update or refresh
                await refreshData()
                alert('Item guardado correctamente')
            } else {
                alert('Error al guardar')
            }
        } catch (e) {
            console.error(e)
            alert('Error de red')
        }
    }

    // Login Logic (Now just triggers Google)
    const handleLogin = () => {
        signIn('google')
    }

    // Console Simulation
    const simulateCompile = (artifact: string) => {
        setConsoleLog([`> Initializing Compiler for: ${artifact}...`])

        setTimeout(() => setConsoleLog(prev => [...prev, `> Connecting to Neon DB [v1.0]...`]), 500)
        setTimeout(() => setConsoleLog(prev => [...prev, `> Fetching taxonomy tree... OK`]), 1000)
        setTimeout(() => setConsoleLog(prev => [...prev, `> Retrieving approved contents... Found ${initialData.filter(i => i.status === 'Approved').length} items`]), 1500)
        setTimeout(() => setConsoleLog(prev => [...prev, `> Validating Drive Links... OK`]), 2000)
        setTimeout(() => setConsoleLog(prev => [...prev, `> SUCCESS: JSON Generated (14kb)`]), 2500)
    }

    if (!user || user.role === 'guest' || user.role === 'pending') {
        const isPending = user?.role === 'pending'

        const handleRequestAccess = async () => {
            try {
                const res = await fetch('/api/users/request', { method: 'POST' })
                if (res.ok) {
                    alert('Solicitud enviada. Un administrador revisará tu acceso.')
                    window.location.reload()
                } else {
                    alert('Error al solicitar acceso')
                }
            } catch (e) {
                alert('Connection error')
            }
        }

        return (
            <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-[var(--panel)] p-10 rounded-xl border border-[var(--border)] w-[400px] text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="text-4xl mb-2.5">🏗️</div>
                    <h2 className="mb-1.5 text-2xl font-semibold text-white">4Shine Builder</h2>
                    <p className="text-[var(--text-muted)] mb-8">Sistema de Gestión Metodológica v1.0</p>

                    {!user ? (
                        <button
                            onClick={handleLogin}
                            className="w-full bg-white text-black border border-gray-300 p-2.5 rounded-md font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Google Workspace Login
                        </button>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg text-left">
                                <img src={user.avatar as string} className="w-10 h-10 rounded-full" />
                                <div>
                                    <div className="text-white font-semibold text-sm">{user.name}</div>
                                    <div className="text-[var(--text-muted)] text-xs">Conectado como Invitado</div>
                                </div>
                            </div>

                            {isPending ? (
                                <div className="bg-[rgba(210,153,34,0.15)] border border-[rgba(210,153,34,0.3)] text-[var(--warning)] p-3 rounded text-sm mb-2">
                                    ⏳ Tu solicitud está en revisión. Te notificaremos cuando un administrador la apruebe.
                                </div>
                            ) : (
                                <button
                                    onClick={handleRequestAccess}
                                    className="w-full bg-[var(--accent)] text-white p-2.5 rounded-md font-semibold hover:brightness-110 transition-colors"
                                >
                                    Solicitar Acceso
                                </button>
                            )}

                            <button
                                onClick={() => signOut()}
                                className="text-[var(--text-muted)] text-xs hover:text-white underline"
                            >
                                Cerrar Sesión / Cambiar Cuenta
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-[10px] text-[var(--text-muted)]">
                        Acceso restringido a personal autorizado.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-[260px_1fr] h-screen overflow-hidden bg-[var(--bg)] text-[var(--text-main)] font-ui">
            {/* Sidebar */}
            <aside className="bg-[var(--panel)] border-r border-[var(--border)] flex flex-col p-5">
                <div className="text-lg font-bold text-white mb-8 flex items-center gap-2.5">
                    4Shine <span className="text-[10px] bg-[var(--border)] px-1.5 py-0.5 rounded font-code">v1.0</span>
                </div>

                <nav className="flex flex-col gap-0.5">
                    {/* Admin Nav */}
                    {user?.role === 'admin' && (
                        <>
                            <div className="text-[11px] uppercase text-[#484f58] mb-2 font-bold tracking-wider">Configuración</div>
                            <NavBtn id="admin" label="Gestión de Usuarios" icon="🛡️" active={currentView === 'admin'} onClick={() => setCurrentView('admin')} />
                            <div className="my-4 border-t border-[var(--border)]" />
                        </>
                    )}

                    <div className="text-[11px] uppercase text-[#484f58] my-2 font-bold tracking-wider">Acciones</div>
                    <NavBtn id="inventory" label="Inventario Maestro" icon="🗃️" active={currentView === 'inventory'} onClick={() => setCurrentView('inventory')} />
                    <NavBtn id="gaps" label="Matriz de Brechas" icon="⚠️" active={currentView === 'gaps'} onClick={() => setCurrentView('gaps')} />
                    <NavBtn id="generator" label="Generador (Dossier)" icon="⚡" active={currentView === 'generator'} onClick={() => setCurrentView('generator')} />
                    <NavBtn id="qa" label="QA / Revisión" icon="🛡️" active={currentView === 'qa'} onClick={() => setCurrentView('qa')} />
                </nav>

                <div className="mt-auto border-t border-[var(--border)] pt-5">
                    <div className="flex gap-2.5 items-center">
                        <div
                            className="w-8 h-8 rounded-full grid place-items-center overflow-hidden"
                            style={{ background: typeof user.avatar === 'string' ? user.color + '33' : 'transparent', color: user.color }}
                        >
                            {user.avatar}
                        </div>
                        <div className="overflow-hidden">
                            <div className="font-semibold text-[13px] truncate w-[140px]">{user.name}</div>
                            <div className="text-[var(--text-muted)] text-[11px]">{user.label}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="bg-transparent border-none text-[var(--danger)] text-[11px] mt-2.5 cursor-pointer p-0 hover:underline text-left w-full"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="overflow-y-auto p-[0px] h-full">
                <div className="p-[30px_40px]">
                    {currentView === 'admin' && <AdminView />}
                    {currentView === 'gaps' && <GapsView />}
                    {currentView === 'inventory' && (
                        <InventoryView
                            data={inventoryData}
                            role={user.role}
                            onRefresh={refreshData}
                            isRefreshing={isRefreshing}
                            onSave={handleUpsert}
                        />
                    )}
                    {currentView === 'generator' && <GeneratorView simulateCompile={simulateCompile} consoleLog={consoleLog} />}
                    {currentView === 'qa' && <QAView data={inventoryData} />}
                </div>
            </main>
        </div>
    )
}

// --- Subcomponents ---

function NavBtn({ id, label, icon, active, onClick }: { id: string, label: string, icon: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-2.5 rounded-md text-[14px] font-medium flex items-center gap-2.5 transition-all
        ${active ? 'bg-[rgba(88,166,255,0.1)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-white'}
      `}
        >
            <span>{icon}</span> {label}
        </button>
    )
}

function GapsView() {
    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-semibold m-0 tracking-tighter text-white">Matriz de Cobertura (Gap Analysis)</h2>
                    <div className="text-[13px] text-[var(--text-muted)] mt-1.5">
                        Versión objetivo: <span className="text-[11px] px-2 py-0.5 rounded-xl font-semibold border border-[var(--purple)] text-[var(--purple)]">v1.0</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">🔴 Vacío (Crítico)</span>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">🟢 Cubierto</span>
                </div>
            </header>

            <div className="grid grid-cols-[200px_1fr_1fr_1fr] gap-[2px] bg-[var(--border)] border border-[var(--border)] rounded-md overflow-hidden">
                {['Subcomponente', 'Básico', 'Intermedio', 'Avanzado'].map(h => (
                    <div key={h} className="bg-[var(--bg)] p-4 flex items-center justify-center text-sm min-h-[60px] font-semibold text-[var(--text-muted)] first:justify-start first:pl-5">
                        {h}
                    </div>
                ))}

                {/* Row 1 */}
                <div className="bg-[var(--panel)] p-4 flex items-center text-sm font-semibold text-white">Networking</div>
                <div className="bg-[var(--panel)] p-4 flex items-center justify-center text-sm text-[var(--text-muted)]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)] mr-2"></div> 1 Item
                </div>
                <div className="bg-[var(--panel)] p-4 flex items-center justify-center text-sm" style={{ background: 'rgba(218, 54, 51, 0.05)' }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] shadow-[0_0_8px_rgba(218,54,51,0.4)] mr-2"></div>
                    <button className="bg-[var(--border)] text-white border border-white/10 text-[10px] px-1.5 py-0.5 rounded cursor-pointer hover:opacity-90">Solicitar</button>
                </div>
                <div className="bg-[var(--panel)] p-4 flex items-center justify-center text-sm" style={{ background: 'rgba(218, 54, 51, 0.05)' }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] shadow-[0_0_8px_rgba(218,54,51,0.4)] mr-2"></div>
                    <button className="bg-[var(--border)] text-white border border-white/10 text-[10px] px-1.5 py-0.5 rounded cursor-pointer hover:opacity-90">Solicitar</button>
                </div>

                {/* Row 2 */}
                <div className="bg-[var(--panel)] p-4 flex items-center text-sm font-semibold text-white">Comunicación</div>
                <div className="bg-[var(--panel)] p-4 flex items-center justify-center text-sm" style={{ background: 'rgba(218, 54, 51, 0.05)' }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] shadow-[0_0_8px_rgba(218,54,51,0.4)] mr-2"></div>
                    <button className="bg-[var(--border)] text-white border border-white/10 text-[10px] px-1.5 py-0.5 rounded cursor-pointer hover:opacity-90">Solicitar</button>
                </div>
                <div className="bg-[var(--panel)] p-4 flex items-center justify-center text-sm text-[var(--text-muted)]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--warning)] mr-2"></div> En Revisión
                </div>
                <div className="bg-[var(--panel)] p-4 flex items-center justify-center text-sm" style={{ background: 'rgba(218, 54, 51, 0.05)' }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] shadow-[0_0_8px_rgba(218,54,51,0.4)] mr-2"></div>
                    <button className="bg-[var(--border)] text-white border border-white/10 text-[10px] px-1.5 py-0.5 rounded cursor-pointer hover:opacity-90">Solicitar</button>
                </div>

                {/* Row 3 */}
                <div className="bg-[var(--panel)] p-4 flex items-center text-sm font-semibold text-white">Influencia</div>
                <div className="bg-[var(--panel)] p-4 flex items-center justify-center text-sm" style={{ background: 'rgba(218, 54, 51, 0.05)' }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] shadow-[0_0_8px_rgba(218,54,51,0.4)] mr-2"></div>
                    <button className="bg-[var(--border)] text-white border border-white/10 text-[10px] px-1.5 py-0.5 rounded cursor-pointer hover:opacity-90">Solicitar</button>
                </div>
                <div className="bg-[var(--panel)] p-4 flex items-center justify-center text-sm" style={{ background: 'rgba(218, 54, 51, 0.05)' }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] shadow-[0_0_8px_rgba(218,54,51,0.4)] mr-2"></div>
                    <button className="bg-[var(--border)] text-white border border-white/10 text-[10px] px-1.5 py-0.5 rounded cursor-pointer hover:opacity-90">Solicitar</button>
                </div>
                <div className="bg-[var(--panel)] p-4 flex items-center justify-center text-sm text-[var(--text-muted)]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] shadow-[0_0_8px_rgba(218,54,51,0.4)] mr-2"></div> Borrador (20%)
                </div>
            </div>
        </>
    )
}

function InventoryView({
    data, role, onRefresh, isRefreshing, onSave
}: {
    data: ContentItem[],
    role: UserRole,
    onRefresh: () => void,
    isRefreshing: boolean,
    onSave: (item: ContentItem) => void
}) {
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)

    // Edit State
    const [editForm, setEditForm] = useState<ContentItem | null>(null)

    // When selection changes, update edit form
    useEffect(() => {
        if (selectedItem) setEditForm({ ...selectedItem })
    }, [selectedItem])

    const handleSaveClick = () => {
        if (editForm) {
            onSave(editForm)
        }
    }

    return (
        <>
            <header className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold m-0 tracking-tighter text-white flex items-center gap-3">
                    Inventario Maestro
                    <button
                        onClick={onRefresh}
                        className={`text-[12px] bg-[var(--panel)] border border-[var(--border)] p-1.5 rounded-md text-[var(--text-muted)] hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Refrescar Datos"
                    >
                        🔄
                    </button>
                </h2>
                <div className="flex gap-2">
                    {selectedItem && (
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="bg-[var(--panel)] border border-[var(--border)] text-[var(--text-muted)] px-3 py-1.5 rounded-md text-[12px] hover:text-white"
                        >
                            Cerrar Vista
                        </button>
                    )}
                    {role === 'curador' && (
                        <button className="bg-[var(--success)] border border-white/10 text-white px-4 py-2 rounded-md font-semibold text-[13px] hover:opacity-90">
                            + Nuevo Activo
                        </button>
                    )}
                </div>
            </header>

            <div className={`grid gap-5 transition-all duration-300 ease-in-out ${selectedItem ? 'grid-cols-[40%_60%]' : 'grid-cols-1'}`}>

                {/* Left Panel: List */}
                <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                    <div className="p-3 border-b border-[var(--border)]">
                        <input
                            type="text"
                            placeholder="Buscar activos..."
                            className="w-full bg-[#0d1117] border border-[var(--border)] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                        />
                    </div>

                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-[13px] border-collapse">
                            <thead className="sticky top-0 bg-[var(--panel)] z-10 shadow-sm">
                                <tr>
                                    <th className="text-left text-[var(--text-muted)] p-3 border-b border-[var(--border)] font-medium">Título</th>
                                    {!selectedItem && <th className="text-left text-[var(--text-muted)] p-3 border-b border-[var(--border)] font-medium">Estado</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(c => (
                                    <tr
                                        key={c.id}
                                        onClick={() => setSelectedItem(c)}
                                        className={`cursor-pointer hover:bg-white/5 border-b border-[var(--border)] last:border-0
                      ${selectedItem?.id === c.id ? 'bg-[rgba(88,166,255,0.1)] border-l-2 border-l-[var(--accent)]' : ''}
                    `}
                                    >
                                        <td className="p-3">
                                            <div className="font-semibold text-white truncate max-w-[300px]">{c.title}</div>
                                            <div className="text-[11px] text-[var(--text-muted)]">{c.id} • {c.type}</div>
                                        </td>
                                        {!selectedItem && (
                                            <td className="p-3">
                                                <StatusBadge status={c.status} />
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Panel: Preview / Edit */}
                {selectedItem && editForm && (
                    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] overflow-y-auto pr-1">

                        {/* Metadata Card (Editable for Curators) */}
                        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 mr-4">
                                    {role === 'curador' ? (
                                        <input
                                            className="text-lg font-bold text-white bg-transparent border-b border-transparent focus:border-[var(--accent)] focus:outline-none w-full"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        />
                                    ) : (
                                        <h3 className="text-lg font-bold text-white leading-tight">{editForm.title}</h3>
                                    )}
                                    <div className="text-sm text-[var(--accent)] font-code mt-1">{editForm.id}</div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <StatusBadge status={editForm.status} />
                                    {role === 'curador' && (
                                        <button
                                            onClick={handleSaveClick}
                                            className="text-[10px] bg-[var(--accent)] text-white px-2 py-1 rounded hover:opacity-80"
                                        >
                                            Guardar Cambios
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="text-[11px] text-[var(--text-muted)] block mb-1">TAXONOMÍA (Pilar)</label>
                                    {role === 'curador' ? (
                                        <select
                                            className="w-full text-white bg-black/20 p-2 rounded border border-[var(--border)]"
                                            value={editForm.pillar}
                                            onChange={(e) => setEditForm({ ...editForm, pillar: e.target.value })}
                                        >
                                            <option value="Shine Out">Shine Out</option>
                                            <option value="Shine In">Shine In</option>
                                            <option value="Shine Up">Shine Up</option>
                                            <option value="Shine On">Shine On</option>
                                        </select>
                                    ) : (
                                        <div className="text-white bg-black/20 p-2 rounded border border-[var(--border)]">{editForm.pillar}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[11px] text-[var(--text-muted)] block mb-1">DRIVE ID</label>
                                    {role === 'curador' ? (
                                        <input
                                            className="w-full text-white bg-black/20 p-2 rounded border border-[var(--border)] font-code text-xs"
                                            value={editForm.driveId || ''}
                                            onChange={(e) => setEditForm({ ...editForm, driveId: e.target.value })}
                                        />
                                    ) : (
                                        <div className="text-white bg-black/20 p-2 rounded border border-[var(--border)] font-code text-xs">
                                            {editForm.driveId || 'N/A'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Drive Preview */}
                        <div className="bg-black border border-[var(--border)] rounded-lg flex-1 min-h-[400px] relative overflow-hidden group">
                            {editForm.driveId ? (
                                <iframe
                                    src={`https://drive.google.com/file/d/${editForm.driveId}/preview`}
                                    className="w-full h-full border-none"
                                    allow="autoplay"
                                ></iframe>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)]">
                                    <div className="text-4xl mb-2">☁️</div>
                                    <p>No Drive ID connected</p>
                                </div>
                            )}

                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a
                                    href={editForm.driveId ? `https://drive.google.com/file/d/${editForm.driveId}/view` : '#'}
                                    target="_blank"
                                    className="bg-black/80 hover:bg-black text-white text-xs px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md"
                                >
                                    Abrir en Drive ↗
                                </a>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        Approved: 'text-[var(--success)] bg-[rgba(46,160,67,0.15)] border-[rgba(46,160,67,0.3)]',
        Review: 'text-[var(--warning)] bg-[rgba(210,153,34,0.15)] border-[rgba(210,153,34,0.3)]',
        Draft: 'text-[var(--text-muted)] border-[var(--border)]',
    }

    const defaultStyle = styles.Draft

    return (
        <span className={`text-[11px] px-2 py-0.5 rounded-xl font-semibold border ${styles[status] || defaultStyle}`}>
            {status}
        </span>
    )
}

function GeneratorView({ simulateCompile, consoleLog }: { simulateCompile: (a: string) => void, consoleLog: string[] }) {
    return (
        <>
            <header className="mb-8">
                <h2 className="text-2xl font-semibold m-0 tracking-tighter text-white">Generador de Artefactos</h2>
            </header>

            <div className="grid grid-cols-3 gap-5 mb-8">
                <GeneratorCard
                    icon="📘"
                    title="Manual del Facilitador"
                    desc="Compila PDF con guías paso a paso para mentores. Incluye links a herramientas."
                    action="Generar JSON"
                    onClick={() => simulateCompile('Manual Facilitador')}
                    isPrimary
                />
                <GeneratorCard
                    icon="📂"
                    title="Dossier Metodológico"
                    desc="Reporte completo de cobertura, fichas técnicas y gobernanza IP."
                    action="Generar JSON"
                    onClick={() => simulateCompile('Dossier Maestro')}
                />
                <GeneratorCard
                    icon="📦"
                    title="Toolkit (ZIP)"
                    desc="Descarga masiva de archivos desde Drive organizados por carpeta."
                    action="Preparar Descarga"
                    onClick={() => simulateCompile('Toolkit')}
                />
            </div>

            <div className="bg-black p-4 rounded-md font-code text-xs text-[#0f0] max-h-[200px] overflow-y-auto border border-white/10">
                {consoleLog.length === 0 ? <span className="text-[#333]">// Ready to generate...</span> : null}
                {consoleLog.map((line, i) => (
                    <div key={i}>{line}</div>
                ))}
            </div>
        </>
    )
}

function GeneratorCard({ icon, title, desc, action, onClick, isPrimary }: any) {
    return (
        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5">
            <div className="text-3xl mb-2.5">{icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-[13px] text-[var(--text-muted)] mb-5 leading-normal">{desc}</p>
            <button
                onClick={onClick}
                className={`w-full py-2 rounded-md font-semibold text-[13px] border hover:opacity-90 transition-opacity
          ${isPrimary
                        ? 'bg-[var(--success)] border-white/10 text-white'
                        : 'bg-[var(--border)] border-white/10 text-white'}
        `}
            >
                {action}
            </button>
        </div>
    )
}

function QAView({ data }: { data: ContentItem[] }) {
    const item = data.find(c => c.status === 'Review')

    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold m-0 tracking-tighter text-white">Cola de Revisión</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-xl font-semibold border text-[var(--warning)] bg-[rgba(210,153,34,0.15)] border-[rgba(210,153,34,0.3)]">
                    1 Pendiente
                </span>
            </header>

            {item ? (
                <div className="grid grid-cols-2 gap-5 h-[600px]">
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5">
                        <h3 className="font-semibold text-white mb-5">Metadatos (Neon DB)</h3>
                        <div className="grid gap-4">
                            <div>
                                <label className="text-[11px] text-[var(--text-muted)] block mb-1">TÍTULO</label>
                                <div className="font-semibold text-white">{item.title}</div>
                            </div>
                            <div>
                                <label className="text-[11px] text-[var(--text-muted)] block mb-1">TAXONOMÍA</label>
                                <div className="text-[var(--text-main)]">{item.pillar} {'>'} {item.sub}</div>
                            </div>
                            <div>
                                <label className="text-[11px] text-[var(--text-muted)] block mb-1">PROPIEDAD INTELECTUAL</label>
                                <select className="w-full p-2 bg-black text-white border border-[var(--warning)] rounded">
                                    <option>{item.ip}</option>
                                    <option>Propio</option>
                                </select>
                                <div className="text-[11px] text-[var(--warning)] mt-1.5 flex items-center gap-1">
                                    ⚠️ Revisar licencia de tercero
                                </div>
                            </div>
                            <div className="mt-10 grid gap-2.5">
                                <button className="w-full bg-[var(--success)] border border-white/10 text-white py-2 rounded font-semibold hover:opacity-90">
                                    ✅ Aprobar y Publicar
                                </button>
                                <button className="w-full bg-transparent border border-[var(--danger)] text-[var(--danger)] py-2 rounded font-semibold hover:bg-[var(--danger)] hover:text-white transition-colors">
                                    ❌ Rechazar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black border border-dashed border-[var(--text-muted)] rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-4xl mb-2">📺</div>
                            <p className="text-[var(--text-muted)] mb-2">Google Drive Preview</p>
                            <code className="text-[var(--accent)] font-code text-xs">File ID: {item.driveId}</code>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5 text-[var(--text-muted)]">
                    No hay items pendientes de revisión.
                </div>
            )}
        </>
    )
}
