import prisma from '@/lib/prisma'

export default async function GAPage() {
    const items = await prisma.contentItem.findMany({
        take: 10,
        orderBy: { completeness: 'desc' }
    })

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-semibold text-white">Gobernanza & IP</h2>
            </div>

            <div className="bg-panel border border-border rounded-xl p-5">
                <h3 className="m-0 mb-4 text-[15px] font-semibold">Validación de Propiedad Intelectual</h3>
                <table className="w-full text-[13px] border-collapse">
                    <thead>
                        <tr className="border-b border-border text-left">
                            <th className="text-text-muted py-2 px-3 font-medium">Contenido</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Tipo IP</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Uso Autorizado</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Confidencialidad</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Check</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => {
                            // Logic to infer attributes based on DB data for display
                            let usage = 'Interno'
                            let confid = 'Alta'
                            let typeClass = 'text-text-muted'

                            if (item.ip === 'Propio') {
                                usage = 'Interno + Partners'
                                confid = 'Alta'
                                typeClass = 'text-success bg-success/15 border border-success/30 rounded-full px-2 py-0.5 text-[11px] font-medium'
                            } else if (item.ip === 'Tercero') {
                                usage = 'Solo Formación'
                                confid = 'Media'
                                typeClass = 'text-warning bg-warning/15 border border-warning/30 rounded-full px-2 py-0.5 text-[11px] font-medium'
                            } else {
                                usage = '-'
                                confid = '-'
                                typeClass = 'text-danger bg-danger/10 border border-danger/30 rounded-full px-2 py-0.5 text-[11px] font-medium'
                            }

                            return (
                                <tr key={item.id} className="border-b border-border/40 last:border-0 hover:bg-white/5 transition-colors">
                                    <td className="py-2.5 px-3">{item.title}</td>
                                    <td className="py-2.5 px-3"><span className={typeClass}>{item.ip === 'Propio' ? 'Propio (4Shine)' : item.ip === 'Tercero' ? 'Tercero (Adaptado)' : 'Completar'}</span></td>
                                    <td className="py-2.5 px-3">{usage}</td>
                                    <td className="py-2.5 px-3">{confid}</td>
                                    <td className="py-2.5 px-3">
                                        <input type="checkbox" className="accent-accent" defaultChecked={item.ip === 'Propio'} disabled />
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
