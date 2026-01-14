import prisma from '@/lib/prisma'
import TaxonomyManager from '@/components/TaxonomyManager'

export const dynamic = 'force-dynamic'

export default async function Taxonomy() {
    const pillars = await prisma.taxonomy.findMany({
        where: { type: 'Pillar' },
        include: { children: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
    })

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-[24px] font-bold text-white tracking-tight">Arquitecto de Metodología</h2>
                    <p className="text-[13px] text-text-muted mt-1">Define la estructura que rige todo el repositorio 4Shine.</p>
                </div>
                <div className="flex gap-3">
                    <span className="bg-panel px-3 py-1.5 rounded-lg border border-border text-[11px] font-mono">
                        MODO: ESTRUCTURAL
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-[1.5fr_1fr] gap-8">
                <TaxonomyManager initialData={pillars as any} />

                <div className="space-y-6">
                    <div className="bg-panel border border-border rounded-xl p-5">
                        <h3 className="m-0 mb-4 text-[14px] font-semibold flex items-center gap-2">
                            <span>📋</span> Catálogos de Dominio
                        </h3>
                        <div className="grid gap-2.5">
                            {[
                                { name: 'Niveles de Madurez', count: '4 Niveles' },
                                { name: 'Tipos de Intervención', count: '5 Tipos' },
                                { name: 'Momentos del Viaje', count: '4 Estados' },
                                { name: 'Audiencias Objetivo', count: '3 Roles' }
                            ].map((cat) => (
                                <button key={cat.name} className="flex justify-between items-center bg-[#0d1117] border border-border/60 text-text p-3 rounded-lg cursor-pointer hover:border-accent group transition-all">
                                    <span className="text-[12px] font-semibold group-hover:text-accent">{cat.name}</span>
                                    <span className="text-[10px] text-text-muted">{cat.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
                        <h4 className="m-0 mb-2 text-[13px] font-bold text-accent uppercase tracking-wider">Ayuda Estructural</h4>
                        <p className="text-[12px] leading-relaxed text-text-muted">
                            Como Arquetipo de la metodología, cualquier cambio aquí afectará los filtros de búsqueda y la catalogación de todos los activos actuales y futuros.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
