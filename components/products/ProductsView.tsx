
"use client"

import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { ProductCard, Product } from './ProductCard'
import { ProductForm } from './ProductForm'
import { useRouter } from 'next/navigation'

export function ProductsView({ initialProducts }: { initialProducts: Product[] }) {
    const router = useRouter()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState('ALL')

    const filteredProducts = initialProducts.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesType = selectedType === 'ALL' || p.type === selectedType

        return matchesSearch && matchesType
    })

    const handleSuccess = () => {
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">

            {/* Header Section */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300">
                        Productos Estratégicos
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Repositorio de entregables y recursos del Sistema 4Shine®.
                    </p>
                </div>

                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/40 hover:scale-105"
                >
                    <Plus size={20} />
                    NUEVO PRODUCTO
                </button>
            </div>

            {/* Filters Bar */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row gap-4">

                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por título o etiqueta..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Type Filter */}
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <select
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl outline-none appearance-none"
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                    >
                        <option value="ALL">Todos los Tipos</option>
                        <option value="PDF">Documentos (PDF)</option>
                        <option value="Video">Videos</option>
                        <option value="Presentation">Presentaciones</option>
                    </select>
                </div>

            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                        <Search size={32} />
                    </div>
                    <h3 className="text-slate-500 font-medium">No se encontraron productos</h3>
                </div>
            )}

            {/* Form Modal */}
            <ProductForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={handleSuccess}
            />

        </div>
    )
}
