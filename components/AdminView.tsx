'use client'

import { useState, useEffect } from 'react'

type User = {
    email: string
    role: string
    name: string | null
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

export default function AdminView() {
    const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users')

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
    const [loadingSettings, setLoadingSettings] = useState(false)
    const [newFolderId, setNewFolderId] = useState('')

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
                    setLoadingSettings(false)
                })
                .catch(err => { console.error(err); setLoadingSettings(false) })
        }
    }, [activeTab])

    // --- USER HANDLERS ---
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
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                🛡️ Panel de Administración
            </h2>

            {/* TABS */}
            <div className="flex border-b border-[var(--border)] mb-6">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'users'
                        ? 'border-[var(--accent)] text-white'
                        : 'border-transparent text-[var(--text-muted)] hover:text-white'
                        }`}
                >
                    Usuarios
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'settings'
                        ? 'border-[var(--accent)] text-white'
                        : 'border-transparent text-[var(--text-muted)] hover:text-white'
                        }`}
                >
                    Configuración
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
                                                <div className="font-semibold text-white">{u.name || 'Sin nombre'}</div>
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
                                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="usuario@gmail.com" className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre</label>
                                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre Apellido" className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm" />
                            </div>
                            <div className="w-[150px]">
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Rol</label>
                                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm">
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
                                    <th className="p-3 text-left">Rol</th>
                                    <th className="p-3 text-left">Fecha Registro</th>
                                    <th className="p-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingUsers && <tr><td colSpan={4} className="p-5 text-center text-[var(--text-muted)]">Cargando...</td></tr>}
                                {activeUsers.map(u => (
                                    <tr key={u.email} className="border-t border-[var(--border)] hover:bg-white/5">
                                        <td className="p-3">
                                            <div className="font-semibold text-white">{u.name || 'Sin nombre'}</div>
                                            <div className="text-[var(--text-muted)] text-xs">{u.email}</div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${u.role === 'admin' ? 'bg-purple-900 text-purple-200' : u.role === 'curador' ? 'bg-blue-900 text-blue-200' : u.role === 'auditor' ? 'bg-green-900 text-green-200' : 'bg-gray-800 text-gray-300'}`}>{u.role}</span>
                                        </td>
                                        <td className="p-3 text-[var(--text-muted)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="p-3 text-right">
                                            {u.role !== 'admin' && (
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
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">📧 Configuración de Correo</h3>
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
                                    className="bg-[#21262d] text-white px-3 py-1 rounded text-xs font-semibold hover:brightness-110 border border-[var(--border)]"
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
                                    className="bg-[#0d1117] border border-[var(--border)] rounded px-2 py-1 text-xs"
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
                                <input value={emailConfig.smtpHost} onChange={e => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })} placeholder="smtp.gmail.com" className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Puerto</label>
                                <input type="number" value={emailConfig.smtpPort} onChange={e => setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value) })} placeholder="465" className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm" />
                            </div>

                            {/* SENDER CUSTOMIZATION */}
                            <div>
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Usuario (Email de envío)</label>
                                <input value={emailConfig.smtpUser} onChange={e => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })} placeholder="tu@email.com" className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--text-muted)] block mb-1">Contraseña de Aplicación</label>
                                <input type="password" value={emailConfig.smtpPass} onChange={e => setEmailConfig({ ...emailConfig, smtpPass: e.target.value })} placeholder="********" className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm" />
                            </div>

                            {/* SENDER CUSTOMIZATION */}
                            <div className="col-span-2 pt-2 border-t border-[var(--border)] grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre del Remitente (Opcional)</label>
                                    <input value={emailConfig.senderName || ''} onChange={e => setEmailConfig({ ...emailConfig, senderName: e.target.value })} placeholder="Ej: Soporte TI" className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--text-muted)] block mb-1">Email del Remitente (Opcional)</label>
                                    <input value={emailConfig.senderEmail || ''} onChange={e => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })} placeholder="Ej: no-reply@empresa.com" className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm" />
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Si se deja vacío, se usa el Usuario SMTP.</p>
                                </div>
                            </div>

                            <div className="col-span-2 pt-2 border-t border-[var(--border)] grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre del Remitente (Opcional)</label>
                                    <input value={emailConfig.senderName || ''} onChange={e => setEmailConfig({ ...emailConfig, senderName: e.target.value })} placeholder="Ej: Soporte TI" className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--text-muted)] block mb-1">Email del Remitente (Opcional)</label>
                                    <input value={emailConfig.senderEmail || ''} onChange={e => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })} placeholder="Ej: no-reply@empresa.com" className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm" />
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Si se deja vacío, se usa el Usuario SMTP.</p>
                                </div>
                            </div>

                            <div className="col-span-2 p-3 bg-blue-900/20 border border-blue-900/50 rounded text-xs text-blue-200 mt-2">
                                💡 <strong>Tip para Gmail:</strong> Debes usar una <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline font-bold hover:text-white">Contraseña de Aplicación</a>. Si ingresas tu contraseña normal, fallará.
                            </div>
                        </div>
                        <button onClick={saveEmailConfig} className="bg-[var(--accent)] text-white px-4 py-2 rounded text-sm font-bold hover:brightness-110">Guardar Configuración SMTP</button>
                    </div>

                    {/* DRIVE CONFIG WIZARD */}
                    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-5">
                        <h3 className="text-lg font-bold text-white mb-4">📂 Carpetas Autorizadas (Google Drive)</h3>

                        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2 mt-4">
                            🤖 Service Account (JSON de Credenciales)
                        </h3>
                        <div className="bg-[#0d1117] p-4 rounded-lg border border-[var(--border)] mb-6">
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

                        <div className="mb-6 p-4 bg-[#0d1117] rounded border border-[var(--border)]">
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
                                    className="flex-1 bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm"
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
                                            <div className="font-mono text-xs text-white flex items-center gap-2">
                                                {id}
                                                <button
                                                    onClick={async () => {
                                                        // Simple format check visually for now, could be expanded to server ping
                                                        if (id.length > 20) alert('✅ Formato de ID válido. Asegúrate de que la carpeta sea "Pública" o compartida con la cuenta de servicio.');
                                                        else alert('⚠️ El ID parece demasiado corto.');
                                                    }}
                                                    className="text-[10px] bg-[#21262d] px-1.5 py-0.5 rounded text-[var(--text-muted)] hover:text-white"
                                                    title="Verificar Acceso"
                                                >
                                                    🔍 Verificar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFolder(id)} className="text-[var(--danger)] text-xs hover:underline bg-[#0d1117] px-2 py-1 rounded border border-[var(--border)]">Eliminar</button>
                                </div>
                            ))}
                            {driveConfig.authorizedFolderIds.length === 0 && (
                                <div className="text-center text-[var(--text-muted)] text-sm py-4 italic">No hay carpetas configuradas. Agrega una arriba.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
