
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
    const [selectedType, setSelectedType] = useState('Todos')

    const filteredProducts = initialProducts.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesType = selectedType === 'Todos' || p.type === selectedType

        return matchesSearch && matchesType
    })

    const handleSuccess = () => {
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-bg text-text-main p-8 transition-colors duration-300">

            {/* Header Section */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-text-main tracking-tight">
                        Productos Estratégicos
                    </h1>
                    <p className="text-text-muted mt-2 font-medium">
                        Repositorio de entregables y recursos del Sistema 4Shine®.
                    </p>
                </div>

                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/30 hover:scale-105 uppercase text-xs tracking-wider"
                >
                    <Plus size={18} />
                    Nuevo Producto
                </button>
            </div>

            {/* Filters Bar */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row gap-4">

                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por título o etiqueta..."
                        className="w-full pl-12 pr-4 py-3 bg-panel border border-border rounded-xl focus:ring-2 focus:ring-accent outline-none transition-all placeholder:text-text-muted/50 text-text-main shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Type Filter */}
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <select
                        className="w-full pl-11 pr-4 py-3 bg-panel border border-border rounded-xl outline-none focus:ring-2 focus:ring-accent appearance-none text-text-main shadow-sm font-medium"
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                    >
                        <option value="Todos">Todos los Tipos</option>
                        <option value="Documento">Documentos</option>
                        <option value="Esquema">Esquemas</option>
                        <option value="Video">Videos</option>
                        <option value="Audio">Audios</option>
                        <option value="Herramienta">Herramientas</option>
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
                <div className="text-center py-24 bg-panel rounded-3xl border border-border mt-8">
                    <div className="w-20 h-20 bg-bg rounded-full flex items-center justify-center mx-auto mb-6 text-text-muted">
                        <Search size={32} opacity={0.5} />
                    </div>
                    <h3 className="text-text-main font-bold text-lg mb-1">No se encontraron productos</h3>
                    <p className="text-text-muted text-sm">Intenta ajustar tu búsqueda o crea un nuevo producto.</p>
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
