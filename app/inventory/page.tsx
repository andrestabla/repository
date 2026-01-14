import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function Inventory() {
    const items = await prisma.contentItem.findMany({
        orderBy: { id: 'asc' },
    })

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-semibold text-white">Inventario Maestro (Source of Truth)</h2>
                <button className="bg-[#238636] text-white border border-white/10 px-3.5 py-1.5 rounded-md text-[12px] font-semibold hover:bg-[#2ea043] transition-colors">
                    + Indexar Nuevo
                </button>
            </div>

            <div className="bg-panel border border-border rounded-xl p-5 mb-5">
                <div className="flex gap-2.5 mb-4">
                    <input
                        placeholder="Buscar por ID, título o metadata..."
                        className="bg-[#0d1117] border border-border text-text px-2 py-2 rounded-md w-full max-w-[300px] text-[13px] outline-none focus:border-accent"
                    />
                    <select className="bg-[#0d1117] border border-border text-text px-2 py-2 rounded-md w-full max-w-[150px] text-[13px] outline-none">
                        <option>Todos los Pilares</option>
                    </select>
                    <select className="bg-[#0d1117] border border-border text-text px-2 py-2 rounded-md w-full max-w-[150px] text-[13px] outline-none">
                        <option>Estado: Todos</option>
                    </select>
                </div>

                <table className="w-full text-[13px] border-collapse">
                    <thead>
                        <tr className="border-b border-border text-left">
                            <th className="text-text-muted py-2 px-3 font-medium w-[10%]">ID</th>
                            <th className="text-text-muted py-2 px-3 font-medium w-[30%]">Título</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Versión</th>
                            <th className="text-text-muted py-2 px-3 font-medium">IP / Confid.</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Drive ID</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Estado</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => {
                            const driveIdDisplay = item.driveId ? (
                                <span className="font-mono">{item.driveId}</span>
                            ) : (
                                <span className="text-[11px] px-2 py-0.5 rounded-full border border-danger/30 bg-danger/10 text-danger font-medium">Upload Req</span>
                            )

                            const statusColor = item.status === 'Aprobado' ? 'text-success bg-success/15 border-success/30' :
                                item.status === 'Revisión' ? 'text-warning bg-warning/15 border-warning/30' :
                                    'text-danger bg-danger/10 border-danger/30'

                            const ipDisplay = item.ip === 'Completar' ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-full border border-danger/30 bg-danger/10 text-danger font-medium">Completar</span>
                            ) : item.ip

                            return (
                                <tr key={item.id} className="border-b border-border/40 last:border-0 hover:bg-white/5 transition-colors">
                                    <td className="py-2.5 px-3 font-mono text-accent">{item.id}</td>
                                    <td className="py-2.5 px-3">
                                        <div className="font-semibold">{item.title}</div>
                                        <div className="text-[11px] text-text-muted">{item.pillar} • {item.type}</div>
                                    </td>
                                    <td className="py-2.5 px-3">
                                        <span className="font-mono text-[11px] bg-[rgba(188,140,255,0.15)] text-purple px-2 py-0.5 rounded-full border border-[rgba(188,140,255,0.3)]">{item.version}</span>
                                    </td>
                                    <td className="py-2.5 px-3">{ipDisplay}</td>
                                    <td className="py-2.5 px-3">{driveIdDisplay}</td>
                                    <td className="py-2.5 px-3">
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusColor}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                        <button className="bg-[#21262d] border border-border text-text px-3 py-1.5 rounded-md text-[12px] font-semibold hover:bg-[#30363d] transition-colors">
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
