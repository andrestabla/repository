'use client'

import { useState, useEffect } from 'react'

type User = {
    email: string
    role: string
    name: string | null
    isActive: boolean
    createdAt: string
}

type EmailConfig = {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
    senderName?: string
    senderEmail?: string
}

type DriveConfig = {
    authorizedFolderIds: string[]
    serviceAccountJson?: string
}

type SystemLog = {
    id: number
    action: string
    details: string | null
    resourceId: string | null
    userEmail: string
    createdAt: string
    user?: { name: string | null, email: string }
}

type HealthInfo = {
    database: { status: string, details: string }
    drive: { status: string, details: string }
    gemini: { status: string, details: string }
}

export default function AdminView() {
    const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'health' | 'logs'>('users')

    // --- USERS STATE ---
    const [users, setUsers] = useState<User[]>([])
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [refreshUsers, setRefreshUsers] = useState(0)

    // Form inputs (Users)
    const [newEmail, setNewEmail] = useState('')
    const [newName, setNewName] = useState('')
    const [newRole, setNewRole] = useState('curador')

    // --- SETTINGS STATE ---
    const [emailConfig, setEmailConfig] = useState<EmailConfig>({ smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '' })
    const [driveConfig, setDriveConfig] = useState<DriveConfig>({ authorizedFolderIds: [] })
    const [geminiApiKey, setGeminiApiKey] = useState('')
    const [openaiApiKey, setOpenaiApiKey] = useState('')
    const [flikiApiKey, setFlikiApiKey] = useState('')
    const [loadingSettings, setLoadingSettings] = useState(false)
    const [refreshSettings, setRefreshSettings] = useState(0)
    const [newFolderId, setNewFolderId] = useState('')

    // --- HEALTH STATE ---
    const [health, setHealth] = useState<HealthInfo | null>(null)
    const [loadingHealth, setLoadingHealth] = useState(false)

    // --- LOGS STATE ---
    const [logs, setLogs] = useState<SystemLog[]>([])
    const [loadingLogs, setLoadingLogs] = useState(false)

    // Fetch Users
    useEffect(() => {
        if (activeTab === 'users') {
            fetch('/api/users')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setUsers(data)
                    setLoadingUsers(false)
                })
                .catch(err => { console.error(err); setLoadingUsers(false) })
        }
    }, [refreshUsers, activeTab])

    // Fetch Settings
    useEffect(() => {
        if (activeTab === 'settings') {
            setLoadingSettings(true)
            fetch('/api/settings')
                .then(res => res.json())
                .then(data => {
                    if (data.emailConfig) setEmailConfig(data.emailConfig)
                    if (data.driveConfig) setDriveConfig(data.driveConfig)
                    if (data.geminiApiKey) setGeminiApiKey(data.geminiApiKey)
                    if (data.openaiApiKey) setOpenaiApiKey(data.openaiApiKey)
                    if (data.flikiApiKey) setFlikiApiKey(data.flikiApiKey)
                    setLoadingSettings(false)
                })
                .catch(err => { console.error(err); setLoadingSettings(false) })
        }
    }, [activeTab, refreshSettings])

    // Fetch Health
    useEffect(() => {
        if (activeTab === 'health') {
            setLoadingHealth(true)
            fetch('/api/health')
                .then(res => res.json())
                .then(data => {
                    setHealth(data)
                    setLoadingHealth(false)
                })
                .catch(err => { console.error(err); setLoadingHealth(false) })
        }
    }, [activeTab])

    // Fetch Logs
    useEffect(() => {
        if (activeTab === 'logs') {
            setLoadingLogs(true)
            fetch('/api/logs')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setLogs(data)
                    setLoadingLogs(false)
                })
                .catch(err => { console.error(err); setLoadingLogs(false) })
        }
    }, [activeTab])

    // --- USER HANDLERS ---
    const handleUpdateUser = async (email: string, updates: Partial<User>) => {
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, ...updates })
            })
            if (res.ok) {
                setRefreshUsers(p => p + 1)
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) { alert('Error de red') }
    }

    const handleAddUser = async () => {
        if (!newEmail) return alert('Email requerido')
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, name: newName, role: newRole })
            })
            if (res.ok) {
                setNewEmail(''); setNewName(''); setRefreshUsers(p => p + 1); alert('Usuario agregado')
            } else {
                const err = await res.json(); alert('Error: ' + err.error)
            }
        } catch (e) { alert('Error de red') }
    }

    const handleApprove = async (email: string, name: string | null) => {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, role: 'curador' })
            })
            if (res.ok) setRefreshUsers(p => p + 1)
        } catch (e) { alert('Error') }
    }

    const handleDelete = async (email: string) => {
        if (!confirm('¿Eliminar acceso a ' + email + '?')) return
        try {
            const res = await fetch(`/api/users?email=${email}`, { method: 'DELETE' })
            if (res.ok) setRefreshUsers(p => p + 1)
            else { const err = await res.json(); alert('Error: ' + err.error) }
        } catch (e) { alert('Error de red') }
    }

    // --- SETTINGS HANDLERS ---
    const saveEmailConfig = async () => {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'email', data: emailConfig })
            })
            if (res.ok) alert('Configuración de correo guardada')
            else alert('Error al guardar')
        } catch (e) { alert('Error de red') }
    }

    const addFolder = async () => {
        if (!newFolderId) return
        const newList = [...driveConfig.authorizedFolderIds, newFolderId]
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'drive', data: { authorizedFolderIds: newList } })
            })
            if (res.ok) {
                setDriveConfig({ ...driveConfig, authorizedFolderIds: newList })
                setNewFolderId('')
            }
        } catch (e) { alert('Error') }
    }

    const removeFolder = async (id: string) => {
        const newList = driveConfig.authorizedFolderIds.filter(f => f !== id)
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'drive', data: { authorizedFolderIds: newList } })
            })
            if (res.ok) setDriveConfig({ ...driveConfig, authorizedFolderIds: newList })
        } catch (e) { alert('Error') }
    }

    // Filter lists
    const pendingUsers = users.filter(u => u.role === 'pending')
    const activeUsers = users.filter(u => u.role !== 'pending')

    return (
        <div className="p-8 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-3">
                🛡️ Panel de Administración
            </h2>

            {/* TABS */}
            <div className="flex border-b border-[var(--border)] mb-6">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'users'
                        ? 'border-[var(--accent)] text-[var(--text-main)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                >
                    Usuarios
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'settings'
                        ? 'border-[var(--accent)] text-[var(--text-main)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                >
                    Configuración
                </button>
                <button
                    onClick={() => setActiveTab('health')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'health'
                        ? 'border-[var(--accent)] text-[var(--text-main)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                >
                    Salud del Sistema
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'logs'
                        ? 'border-[var(--accent)] text-[var(--text-main)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                >
                    Logs
                </button>
            </div>

            {/* CONTENT: USERS */}
            {activeTab === 'users' && (
                <>
                    {/* Pending Requests */}
                    {pendingUsers.length > 0 && (
                        <div className="mb-8 border border-[var(--warning)] bg-[rgba(210,153,34,0.05)] rounded-lg overflow-hidden">
                            <div className="bg-[rgba(210,153,34,0.1)] p-3 border-b border-[var(--warning)] flex gap-2 items-center">
                                <span className="text-xl">🔔</span>
                                <h3 className="font-bold text-[var(--warning)]">Solicitudes Pendientes ({pendingUsers.length})</h3>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {pendingUsers.map(u => (
                                        <tr key={u.email} className="border-b border-[rgba(210,153,34,0.2)] last:border-0 hover:bg-[rgba(210,153,34,0.05)]">
                                            <td className="p-4">
                                                <div className="font-semibold text-[var(--text-main)]">{u.name || 'Sin nombre'}</div>
                                                <div className="text-[var(--text-muted)] text-xs">{u.email}</div>
                                            </td>
                                            <td className="p-4 text-right flex gap-2 justify-end">
                                                <button onClick={() => handleApprove(u.email, u.name)} className="bg-[var(--success)] text-white px-3 py-1.5 rounded text-xs font-semibold hover:brightness-110">✅ Aprobar</button>
                                                <button onClick={() => handleDelete(u.email)} className="bg-[var(--danger)] text-white px-3 py-1.5 rounded text-xs font-semibold hover:brightness-110">❌ Rechazar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Add User Form */}
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5 mb-8">
                        <h3 className="text-sm uppercase text-[var(--text-muted)] font-bold mb-4">Invitar Nuevo Usuario</h3>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Email (Gmail)</label>
                                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="usuario@gmail.com" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre</label>
                                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre Apellido" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                            </div>
                            <div className="w-[150px]">
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Rol</label>
                                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm">
                                    <option value="admin">Admin</option>
                                    <option value="metodologo">Metodólogo</option>
                                    <option value="curador">Curador</option>
                                    <option value="auditor">Auditor</option>
                                </select>
                            </div>
                            <button onClick={handleAddUser} className="bg-[var(--success)] text-white px-4 py-2 rounded text-sm font-semibold h-[38px] hover:brightness-110">Agregar</button>
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-[#1c2128] text-[var(--text-muted)]">
                                <tr>
                                    <th className="p-3 text-left">Usuario</th>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-left">Rol</th>
                                    <th className="p-3 text-left">Fecha Registro</th>
                                    <th className="p-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingUsers && <tr><td colSpan={5} className="p-5 text-center text-[var(--text-muted)]">Cargando...</td></tr>}
                                {activeUsers.map(u => (
                                    <tr key={u.email} className={`border-t border-[var(--border)] hover:bg-white/5 ${!u.isActive ? 'opacity-50 grayscale' : ''}`}>
                                        <td className="p-3">
                                            <div className="font-semibold text-[var(--text-main)]">{u.name || 'Sin nombre'}</div>
                                            <div className="text-[var(--text-muted)] text-xs">{u.email}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateUser(u.email, { isActive: !u.isActive })}
                                                    disabled={u.email === 'andrestablarico@gmail.com'}
                                                    className={`w-10 h-5 rounded-full transition-colors relative ${u.isActive ? 'bg-[var(--success)]' : 'bg-gray-600'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${u.isActive ? 'left-6' : 'left-1'}`} />
                                                </button>
                                                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">{u.isActive ? 'Activo' : 'Inactivo'}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <select
                                                value={u.role.toLowerCase()}
                                                onChange={(e) => handleUpdateUser(u.email, { role: e.target.value })}
                                                disabled={u.email === 'andrestablarico@gmail.com'}
                                                className="bg-bg border border-[var(--border)] rounded px-2 py-1 text-[10px] font-bold uppercase outline-none focus:border-[var(--accent)]"
                                            >
                                                <option value="admin">ADMIN</option>
                                                <option value="metodologo">METODOLOGO</option>
                                                <option value="curador">CURADOR</option>
                                                <option value="auditor">AUDITOR</option>
                                            </select>
                                        </td>
                                        <td className="p-3 text-[var(--text-muted)] text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="p-3 text-right">
                                            {u.email !== 'andrestablarico@gmail.com' && (
                                                <button onClick={() => handleDelete(u.email)} className="text-[var(--danger)] hover:underline text-xs">Revocar</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* CONTENT: SETTINGS */}
            {activeTab === 'settings' && (
                <div className="space-y-8">
                    {loadingSettings && <div className="text-[var(--text-muted)]">Cargando configuración...</div>}

                    {/* EMAIL CONFIG WIZARD */}
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">📧 Configuración de Correo</h3>
                                <p className="text-xs text-[var(--text-muted)] mt-1">Configura el servidor SMTP para enviar notificaciones.</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        if (!emailConfig.smtpHost) return alert('Configura primero el host SMTP');
                                        const btn = e.target as HTMLButtonElement;
                                        const originalText = btn.innerText;
                                        btn.innerText = 'Enviando...';
                                        btn.disabled = true;
                                        try {
                                            const res = await fetch('/api/settings/test-email', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ config: emailConfig })
                                            });
                                            if (res.ok) alert('✅ Correo de prueba enviado exitosamente a tu cuenta.');
                                            else { const err = await res.json(); alert('❌ Error: ' + err.error); }
                                        } catch (er) { alert('Error de red'); }
                                        btn.innerText = originalText;
                                        btn.disabled = false;
                                    }}
                                    className="bg-[#21262d] text-[var(--text-main)] px-3 py-1 rounded text-xs font-semibold hover:brightness-110 border border-[var(--border)]"
                                >
                                    📬 Probar Envío
                                </button>
                                <select
                                    onChange={(e) => {
                                        const provider = e.target.value;
                                        if (provider === 'gmail') {
                                            setEmailConfig(prev => ({ ...prev, smtpHost: 'smtp.gmail.com', smtpPort: 465, smtpUser: '' }));
                                        } else if (provider === 'outlook') {
                                            setEmailConfig(prev => ({ ...prev, smtpHost: 'smtp.office365.com', smtpPort: 587, smtpUser: '' }));
                                        }
                                    }}
                                    className="bg-bg border border-[var(--border)] rounded px-2 py-1 text-xs"
                                >
                                    <option value="custom">Presets: Personalizado</option>
                                    <option value="gmail">Gmail (Recomendado)</option>
                                    <option value="outlook">Outlook / Office 365</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Host SMTP</label>
                                <input value={emailConfig.smtpHost} onChange={e => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })} placeholder="smtp.gmail.com" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Puerto</label>
                                <input type="number" value={emailConfig.smtpPort} onChange={e => setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value) })} placeholder="465" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                            </div>

                            {/* SENDER CUSTOMIZATION */}
                            <div>
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Usuario (Email de envío)</label>
                                <input value={emailConfig.smtpUser} onChange={e => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })} placeholder="tu@email.com" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Contraseña de Aplicación</label>
                                <input type="password" value={emailConfig.smtpPass} onChange={e => setEmailConfig({ ...emailConfig, smtpPass: e.target.value })} placeholder="********" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                            </div>

                            {/* SENDER CUSTOMIZATION */}
                            <div className="col-span-2 pt-2 border-t border-[var(--border)] grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre del Remitente (Opcional)</label>
                                    <input value={emailConfig.senderName || ''} onChange={e => setEmailConfig({ ...emailConfig, senderName: e.target.value })} placeholder="Ej: Soporte TI" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--text-muted)] block mb-1">Email del Remitente (Opcional)</label>
                                    <input value={emailConfig.senderEmail || ''} onChange={e => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })} placeholder="Ej: no-reply@empresa.com" className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm" />
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Si se deja vacío, se usa el Usuario SMTP.</p>
                                </div>
                            </div>

                            <div className="col-span-2 p-3 bg-blue-900/20 border border-blue-900/50 rounded text-xs text-blue-200 mt-2">
                                💡 <strong>Tip para Gmail:</strong> Debes usar una <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline font-bold hover:text-[var(--text-main)]">Contraseña de Aplicación</a>. Si ingresas tu contraseña normal, fallará.
                            </div>
                        </div>
                        <button onClick={saveEmailConfig} className="bg-[var(--accent)] text-white px-4 py-2 rounded text-sm font-bold hover:brightness-110">Guardar Configuración SMTP</button>
                    </div>

                    {/* DRIVE CONFIG WIZARD */}
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5">
                        <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">📂 Carpetas Autorizadas (Google Drive)</h3>

                        <h3 className="text-sm font-bold text-[var(--text-main)] mb-2 flex items-center gap-2 mt-4">
                            🤖 Service Account (JSON de Credenciales)
                        </h3>
                        <div className="bg-bg p-4 rounded-lg border border-[var(--border)] mb-6">
                            <p className="text-xs text-[var(--text-muted)] mb-3">
                                Pega aquí el contenido del archivo JSON de tu Service Account. Este bot debe tener permiso de <strong>"Lector" o "Editor"</strong> sobre la carpeta raíz.
                            </p>
                            <textarea
                                className="w-full h-32 bg-black/50 border border-[var(--border)] rounded p-2 text-[10px] font-mono text-[var(--success)] focus:outline-none focus:border-[var(--accent)] resize-none"
                                placeholder='{ "type": "service_account", "project_id": "...", ... }'
                                value={driveConfig.serviceAccountJson || ''}
                                onChange={e => setDriveConfig({ ...driveConfig, serviceAccountJson: e.target.value })}
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={async () => {
                                        const jsonStr = driveConfig.serviceAccountJson || ''
                                        if (!jsonStr) {
                                            alert('❌ El campo JSON está vacío.')
                                            return
                                        }

                                        try {
                                            const parsed = JSON.parse(jsonStr)
                                            if (parsed.type !== 'service_account') {
                                                alert('⚠️ Advertencia: El JSON no parece ser de una Service Account (falta "type": "service_account"). Verifica que sea el archivo correcto.')
                                                // We allow saving anyway in case google changes format, but warn user.
                                            }

                                            // Save logic
                                            const res = await fetch('/api/settings', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ driveConfig: { ...driveConfig, serviceAccountJson: jsonStr } })
                                            })

                                            if (res.ok) alert('✅ Credenciales guardadas y JSON validado correctamente.')
                                            else alert('❌ Error al guardar en el servidor.')

                                        } catch (e) {
                                            alert('❌ Error de Sintaxis: El texto ingresado no es un JSON válido.\nVerifica comillas y llaves.')
                                        }
                                    }}
                                    className="bg-[var(--accent)] text-white px-4 py-2 rounded text-xs font-bold hover:brightness-110 flex items-center gap-2"
                                >
                                    💾 Guardar Credenciales
                                </button>
                            </div>
                        </div>

                        <div className="mb-6 p-4 bg-bg rounded border border-[var(--border)]">
                            <label className="text-xs text-[var(--text-muted)] block mb-2 font-bold">Asistente de Carpeta</label>
                            <div className="flex gap-2">
                                <input
                                    value={newFolderId}
                                    onChange={e => {
                                        const val = e.target.value;
                                        // Auto-extract ID from URL
                                        if (val.includes('drive.google.com')) {
                                            const match = val.match(/folders\/([-a-zA-Z0-9_]+)/);
                                            if (match && match[1]) {
                                                setNewFolderId(match[1]);
                                                return;
                                            }
                                        }
                                        setNewFolderId(val);
                                    }}
                                    placeholder="Pega aquí la URL de la carpeta o el ID..."
                                    className="flex-1 bg-bg border border-[var(--border)] rounded p-2 text-sm"
                                />
                                <button onClick={addFolder} className="bg-[var(--success)] text-white px-4 py-2 rounded text-sm font-bold hover:brightness-110">Agregar</button>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                Puedes pegar la URL completa (ej: <code>https://drive.google.com/drive/folders/1A2b3C...</code>) y nosotros extraeremos el ID automáticamente.
                            </p>
                        </div>

                        <div className="space-y-2">
                            {driveConfig.authorizedFolderIds.map(id => (
                                <div key={id} className="flex items-center justify-between bg-[#1c2128] p-3 rounded border border-[var(--border)]">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">📁</span>
                                        <div>
                                            <div className="font-mono text-xs text-[var(--text-main)] flex items-center gap-2">
                                                {id}
                                                <button
                                                    onClick={async () => {
                                                        // Simple format check visually for now, could be expanded to server ping
                                                        if (id.length > 20) alert('✅ Formato de ID válido. Asegúrate de que la carpeta sea "Pública" o compartida con la cuenta de servicio.');
                                                        else alert('⚠️ El ID parece demasiado corto.');
                                                    }}
                                                    className="text-[10px] bg-[#21262d] px-1.5 py-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                                    title="Verificar Acceso"
                                                >
                                                    🔍 Verificar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFolder(id)} className="text-[var(--danger)] text-xs hover:underline bg-bg px-2 py-1 rounded border border-[var(--border)]">Eliminar</button>
                                </div>
                            ))}
                            {driveConfig.authorizedFolderIds.length === 0 && (
                                <div className="text-center text-[var(--text-muted)] text-sm py-4 italic">No hay carpetas configuradas. Agrega una arriba.</div>
                            )}
                        </div>

                        {/* AI CONFIG WIZARD */}
                        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5">
                            <h3 className="text-lg font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">🧠 Inteligencia Artificial (Gemini)</h3>
                            <p className="text-xs text-[var(--text-muted)] mb-4">Configura la API Key de Google Gemini para habilitar el auto-análisis de documentos.</p>

                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="text-xs text-[var(--text-muted)] block mb-1 font-bold">Gemini API Key</label>
                                    <input
                                        type="password"
                                        placeholder={geminiApiKey ? '******** (Configurado)' : 'AIza...'}
                                        onChange={e => setGeminiApiKey(e.target.value)}
                                        className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!geminiApiKey) return alert('Ingresa una API Key válida')
                                        try {
                                            const res = await fetch('/api/settings', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ geminiApiKey })
                                            })
                                            if (res.ok) {
                                                alert('✅ API Key de Gemini guardada.')
                                                setGeminiApiKey('') // Clear input for security, UI shows placeholder
                                                // Refresh settings to get the "configured" state if we had one
                                                setRefreshSettings(p => p + 1)
                                            } else {
                                                alert('❌ Error al guardar.')
                                            }
                                        } catch (e) { alert('Error de red') }
                                    }}
                                    className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm font-bold h-[38px] shadow-lg shadow-purple-900/20"
                                >
                                    Guardar Key
                                </button>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                Puedes obtener una clave gratuita en <a href="https://aistudio.google.com/" target="_blank" className="underline hover:text-[var(--accent)]">Google AI Studio</a>.
                            </p>
                        </div>

                        {/* OPENAI CONFIG WIZARD */}
                        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5 mt-5">
                            <h3 className="text-lg font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">🧠 Inteligencia Artificial (OpenAI)</h3>
                            <p className="text-xs text-[var(--text-muted)] mb-4">Configura la API Key de OpenAI para habilitar el compilador avanzado (GPT-4o).</p>

                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="text-xs text-[var(--text-muted)] block mb-1 font-bold">OpenAI API Key</label>
                                    <input
                                        type="password"
                                        placeholder={openaiApiKey && openaiApiKey.includes('*') ? '******** (Configurado)' : 'sk-...'}
                                        onChange={e => setOpenaiApiKey(e.target.value)}
                                        className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!openaiApiKey) return alert('Ingresa una API Key válida')
                                        try {
                                            const res = await fetch('/api/settings', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ openaiApiKey })
                                            })
                                            if (res.ok) {
                                                alert('✅ API Key de OpenAI guardada.')
                                                setOpenaiApiKey('') // Clear input for security
                                                setRefreshSettings(p => p + 1)
                                            } else {
                                                alert('❌ Error al guardar.')
                                            }
                                        } catch (e) { alert('Error de red') }
                                    }}
                                    className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-bold h-[38px] shadow-lg shadow-green-900/20"
                                >
                                    Guardar Key
                                </button>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                Se requiere créditos o una cuenta activada en <a href="https://platform.openai.com/" target="_blank" className="underline hover:text-[var(--accent)]">OpenAI Platform</a>.
                            </p>
                        </div>

                        {/* FLIKI CONFIG WIZARD */}
                        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5 mt-5">
                            <h3 className="text-lg font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">🗣️ Inteligencia Artificial (Fliki.ai)</h3>
                            <p className="text-xs text-[var(--text-muted)] mb-4">Configura la API Key de Fliki para habilitar la generación de audio realista.</p>

                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="text-xs text-[var(--text-muted)] block mb-1 font-bold">Fliki API Key</label>
                                    <input
                                        type="password"
                                        placeholder={flikiApiKey && flikiApiKey.includes('*') ? '******** (Configurado)' : 'API Key...'}
                                        onChange={e => setFlikiApiKey(e.target.value)}
                                        className="w-full bg-bg border border-[var(--border)] rounded p-2 text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!flikiApiKey) return alert('Ingresa una API Key válida')
                                        try {
                                            const res = await fetch('/api/settings', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ flikiApiKey })
                                            })
                                            if (res.ok) {
                                                alert('✅ API Key de Fliki guardada.')
                                                setFlikiApiKey('') // Clear input for security
                                                setRefreshSettings(p => p + 1)
                                            } else {
                                                alert('❌ Error al guardar.')
                                            }
                                        } catch (e) { alert('Error de red') }
                                    }}
                                    className="bg-pink-700 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm font-bold h-[38px] shadow-lg shadow-pink-900/20"
                                >
                                    Guardar Key
                                </button>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                Obtén tu clave en <a href="https://app.fliki.ai/account/api" target="_blank" className="underline hover:text-[var(--accent)]">Fliki Dashboard</a>.
                            </p>
                        </div>

                    </div>
                </div>
            )}
            {/* CONTENT: HEALTH */}
            {activeTab === 'health' && (
                <div className="space-y-6">
                    <h3 className="text-sm uppercase text-[var(--text-muted)] font-bold mb-4">Estado de Salud de Integraciones</h3>
                    {loadingHealth && <div className="text-[var(--text-muted)]">Analizando servicios...</div>}
                    {health && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.entries(health).map(([service, info]) => (
                                <div key={service} className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="capitalize font-bold text-[var(--text-main)] text-sm">{service}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${info.status === 'healthy' ? 'bg-green-900/40 text-green-400' :
                                            info.status === 'warning' ? 'bg-yellow-900/40 text-yellow-400' :
                                                'bg-red-900/40 text-red-400'
                                            }`}>
                                            {info.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">{info.details}</p>
                                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${info.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                        <span className="text-[10px] text-[var(--text-muted)] uppercase">Live Check</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* CONTENT: LOGS */}
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    <h3 className="text-sm uppercase text-[var(--text-muted)] font-bold mb-4">Logs de Auditoría (Últimos 100)</h3>
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-[#1c2128] text-[var(--text-muted)]">
                                <tr>
                                    <th className="p-3 text-left">Fecha</th>
                                    <th className="p-3 text-left">Acción</th>
                                    <th className="p-3 text-left">Usuario</th>
                                    <th className="p-3 text-left">Detalles</th>
                                    <th className="p-3 text-left">ID Recurso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingLogs && <tr><td colSpan={5} className="p-5 text-center text-[var(--text-muted)]">Cargando logs...</td></tr>}
                                {logs.map(log => (
                                    <tr key={log.id} className="border-t border-[var(--border)] hover:bg-white/5 text-[11px]">
                                        <td className="p-3 text-[var(--text-muted)] whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-tighter ${log.action.includes('FORCE') ? 'bg-red-900/40 text-red-400 border border-red-800/50' :
                                                log.action.includes('DELETE') ? 'bg-orange-900/40 text-orange-400' :
                                                    'bg-blue-900/40 text-blue-400'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-semibold text-[var(--text-main)] truncate max-w-[120px]" title={log.userEmail}>{log.user?.name || log.userEmail.split('@')[0]}</div>
                                        </td>
                                        <td className="p-3 text-[var(--text-muted)] max-w-[250px] truncate" title={log.details || ''}>{log.details}</td>
                                        <td className="p-3 font-mono text-xs text-[var(--accent)]">{log.resourceId}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && !loadingLogs && (
                                    <tr><td colSpan={5} className="p-10 text-center italic text-[var(--text-muted)]">No se encontraron registros en la auditoría.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
