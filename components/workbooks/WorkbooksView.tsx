
"use client"

import { useState } from 'react'
import { Plus, Search, Filter, BookOpen } from 'lucide-react'
import { WorkbookCard, Workbook } from './WorkbookCard'
import { WorkbookForm } from './WorkbookForm'
import { useRouter } from 'next/navigation'

export function WorkbooksView({ initialWorkbooks }: { initialWorkbooks: Workbook[] }) {
    const router = useRouter()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingWorkbook, setEditingWorkbook] = useState<Workbook | undefined>(undefined)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('Todos')

    const filteredWorkbooks = initialWorkbooks.filter(w => {
        const matchesSearch = w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (w.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())

        const matchesStatus = selectedStatus === 'Todos' || w.status === selectedStatus

        return matchesSearch && matchesStatus
    })

    const handleSuccess = () => {
        router.refresh()
        setIsFormOpen(false)
        setEditingWorkbook(undefined)
    }

    const handleEdit = (workbook: Workbook) => {
        setEditingWorkbook(workbook)
        setIsFormOpen(true)
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/workbooks/${id}`, { method: 'DELETE' })
            if (res.ok) {
                router.refresh()
            } else {
                alert("Error al eliminar el workbook.")
            }
        } catch (error) {
            console.error("Delete Error:", error)
        }
    }

    return (
        <div className="min-h-screen bg-bg text-text-main p-8 transition-colors duration-300">

            {/* Header Section */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-text-main tracking-tight flex items-center gap-3">
                        <BookOpen className="text-accent" size={32} />
                        Workbooks Educativos
                    </h1>
                    <p className="text-text-muted mt-2 font-medium">
                        Gestión de material didáctico y guías de trabajo 4Shine®.
                    </p>
                </div>

                <button
                    onClick={() => { setEditingWorkbook(undefined); setIsFormOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/30 hover:scale-105 uppercase text-xs tracking-wider"
                >
                    <Plus size={18} />
                    Nuevo Workbook
                </button>
            </div>

            {/* Filters Bar */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row gap-4">

                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por título o descripción..."
                        className="w-full pl-12 pr-4 py-3 bg-panel border border-border rounded-xl focus:ring-2 focus:ring-accent outline-none transition-all placeholder:text-text-muted/50 text-text-main shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <select
                        className="w-full pl-11 pr-4 py-3 bg-panel border border-border rounded-xl outline-none focus:ring-2 focus:ring-accent appearance-none text-text-main shadow-sm font-medium"
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                    >
                        <option value="Todos">Todos los Estados</option>
                        <option value="Borrador">Borrador</option>
                        <option value="Revisión">Revisión</option>
                        <option value="Publicado">Publicado</option>
                    </select>
                </div>

            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredWorkbooks.map(workbook => (
                    <WorkbookCard
                        key={workbook.id}
                        workbook={workbook}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {/* Empty State */}
            {filteredWorkbooks.length === 0 && (
                <div className="text-center py-24 bg-panel rounded-3xl border border-border mt-8">
                    <div className="w-20 h-20 bg-bg rounded-full flex items-center justify-center mx-auto mb-6 text-text-muted">
                        <BookOpen size={32} opacity={0.5} />
                    </div>
                    <h3 className="text-text-main font-bold text-lg mb-1">No se encontraron workbooks</h3>
                    <p className="text-text-muted text-sm">Crea uno nuevo para comenzar a estructurar tu contenido.</p>
                </div>
            )}

            {/* Form Modal */}
            <WorkbookForm
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingWorkbook(undefined); }}
                onSuccess={handleSuccess}
                initialWorkbook={editingWorkbook}
            />

        </div>
    )
}
