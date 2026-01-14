import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function Taxonomy() {
    const pillars = await prisma.taxonomy.findMany({
        where: { type: 'Pillar' },
        orderBy: { name: 'asc' }, // Or whatever order
    })

    // Mock sub-items for visual parity since we didn't seed deep tree
    const mockSubItems = ['Competencia A (Definida)', 'Competencia B (Definida)']

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-semibold text-white">Taxonomía Controlada</h2>
            </div>

            <div className="grid grid-cols-2 gap-5">
                <div className="bg-panel border border-border rounded-xl p-5">
                    <h3 className="m-0 mb-4 text-[15px] font-semibold flex justify-between">Estructura (Pilares & Componentes)</h3>
                    <ul className="list-none p-0 leading-8">
                        {pillars.map((p) => (
                            <li key={p.id}>
                                <span className="text-accent font-medium">📂 {p.name}</span>
                                <ul className="border-l border-border ml-1.5 pl-4 text-[13px] text-text-muted">
                                    {mockSubItems.map((sub, i) => (
                                        <li key={i}>{sub}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-panel border border-border rounded-xl p-5">
                    <h3 className="m-0 mb-4 text-[15px] font-semibold flex justify-between">Catálogos Auxiliares</h3>
                    <div className="grid gap-2.5">
                        {['Niveles de Madurez (3 definidos)', 'Tipos de Intervención (5 definidos)', 'Tipos de Archivo / MIME', 'Roles de Usuario'].map((item) => (
                            <button key={item} className="text-left bg-[#21262d] border border-border text-text px-3.5 py-1.5 rounded-md cursor-pointer text-[12px] font-semibold hover:bg-[#30363d] transition-colors">
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
