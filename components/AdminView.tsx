'use client'

import { useState, useEffect } from 'react'

type User = {
    email: string
    role: string
    name: string | null
    createdAt: string
}

export default function AdminView() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [refresh, setRefresh] = useState(0)

    // Form inputs
    const [newEmail, setNewEmail] = useState('')
    const [newName, setNewName] = useState('')
    const [newRole, setNewRole] = useState('curador')

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setUsers(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [refresh])

    const handleAddUser = async () => {
        if (!newEmail) return alert('Email requerido')

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, name: newName, role: newRole })
            })
            if (res.ok) {
                setNewEmail('')
                setNewName('')
                setRefresh(p => p + 1)
                alert('Usuario agregado')
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) {
            alert('Error de red')
        }
    }

    const handleApprove = async (email: string, name: string | null) => {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, role: 'curador' }) // Default to Curador
            })
            if (res.ok) {
                setRefresh(p => p + 1)
            }
        } catch (e) { alert('Error') }
    }

    const handleDelete = async (email: string) => {
        if (!confirm('¿Eliminar acceso a ' + email + '?')) return
        try {
            const res = await fetch(`/api/users?email=${email}`, { method: 'DELETE' })
            if (res.ok) {
                setRefresh(p => p + 1)
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) {
            alert('Error de red')
        }
    }

    // Filter lists
    const pendingUsers = users.filter(u => u.role === 'pending')
    const activeUsers = users.filter(u => u.role !== 'pending')

    return (
        <div className="p-8 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                🛡️ Gestión de Usuarios
            </h2>

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
                                        <button
                                            onClick={() => handleApprove(u.email, u.name)}
                                            className="bg-[var(--success)] text-white px-3 py-1.5 rounded text-xs font-semibold hover:brightness-110"
                                        >
                                            ✅ Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.email)}
                                            className="bg-[var(--danger)] text-white px-3 py-1.5 rounded text-xs font-semibold hover:brightness-110"
                                        >
                                            ❌ Rechazar
                                        </button>
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
                        <input
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            placeholder="usuario@gmail.com"
                            className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre</label>
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Nombre Apellido"
                            className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm"
                        />
                    </div>
                    <div className="w-[150px]">
                        <label className="text-xs text-[var(--text-muted)] block mb-1">Rol</label>
                        <select
                            value={newRole}
                            onChange={e => setNewRole(e.target.value)}
                            className="w-full bg-[#0d1117] border border-[var(--border)] rounded p-2 text-sm"
                        >
                            <option value="admin">Admin</option>
                            <option value="metodologo">Metodólogo</option>
                            <option value="curador">Curador</option>
                            <option value="auditor">Auditor</option>
                        </select>
                    </div>
                    <button
                        onClick={handleAddUser}
                        className="bg-[var(--success)] text-white px-4 py-2 rounded text-sm font-semibold h-[38px] hover:brightness-110"
                    >
                        Agregar
                    </button>
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
                        {loading && <tr><td colSpan={4} className="p-5 text-center text-[var(--text-muted)]">Cargando...</td></tr>}
                        {activeUsers.map(u => (
                            <tr key={u.email} className="border-t border-[var(--border)] hover:bg-white/5">
                                <td className="p-3">
                                    <div className="font-semibold text-white">{u.name || 'Sin nombre'}</div>
                                    <div className="text-[var(--text-muted)] text-xs">{u.email}</div>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide
                                        ${u.role === 'admin' ? 'bg-purple-900 text-purple-200' :
                                            u.role === 'curador' ? 'bg-blue-900 text-blue-200' :
                                                u.role === 'auditor' ? 'bg-green-900 text-green-200' :
                                                    'bg-gray-800 text-gray-300'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-3 text-[var(--text-muted)]">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-3 text-right">
                                    {u.role !== 'admin' && (
                                        <button
                                            onClick={() => handleDelete(u.email)}
                                            className="text-[var(--danger)] hover:underline text-xs"
                                        >
                                            Revocar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
