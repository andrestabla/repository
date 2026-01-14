import prisma from '@/lib/prisma'
import { randomInt } from 'crypto' // Just for the 'random' width in mock if needed, but we'll try to calc real data

export default async function GapAnalysis() {
    // Get all pillars
    const pillars = await prisma.taxonomy.findMany({ where: { type: 'Pillar' } })

    // Calculate average completeness per pillar
    const coverageMap = new Map<string, number>()

    for (const pillar of pillars) {
        const agg = await prisma.contentItem.aggregate({
            where: { pillar: pillar.name },
            _avg: { completeness: true },
            _count: { id: true }
        })
        // If no items, 0 coverage. If items, user avg.
        coverageMap.set(pillar.name, agg._count.id > 0 ? Math.round(agg._avg.completeness || 0) : 0)
    }

    // Mock critical gaps as per prototype
    const criticalGaps = [
        { pillar: 'Shine In', component: 'Comunicación de Crisis', level: 'Avanzado', status: 'VACÍO', tagClass: 'missing' },
        { pillar: 'Shine On', component: 'Liderazgo Híbrido', level: 'Intermedio', status: 'VACÍO', tagClass: 'missing' },
        { pillar: 'Transversal', component: 'Rúbrica de Evaluación Final', level: 'N/A', status: 'Borrador', tagClass: 'warn' },
    ]

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-semibold text-white">Análisis de Brechas (Gap Analysis)</h2>
            </div>

            <div className="bg-panel border border-border border-l-4 border-l-danger rounded-xl p-5 mb-5 relative overflow-hidden">
                {/* Hack for border-left color since tailwind borders are usually all sides or specfic. 
            border-l-4 with border-danger works if defined. in v4 standard theme colors are mapped.
        */}
                <h3 className="m-0 mb-4 text-[15px] font-semibold">Brechas Críticas para v1.0</h3>
                <p className="text-[13px] text-text-muted mb-4">
                    Los siguientes elementos son requeridos por la metodología pero no tienen contenido asociado.
                </p>
                <table className="w-full text-[13px] border-collapse">
                    <thead>
                        <tr className="border-b border-border text-left">
                            <th className="text-text-muted py-2 px-3 font-medium">Pilar</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Subcomponente Requerido</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Nivel</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {criticalGaps.map((gap, i) => (
                            <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-white/5 transition-colors">
                                <td className="py-2.5 px-3">{gap.pillar}</td>
                                <td className="py-2.5 px-3">{gap.component}</td>
                                <td className="py-2.5 px-3">{gap.level}</td>
                                <td className="py-2.5 px-3">
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${gap.tagClass === 'missing' ? 'bg-danger/10 text-danger border-danger/30' : 'bg-warning/15 text-warning border-warning/30'
                                        }`}>
                                        {gap.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-panel border border-border rounded-xl p-5">
                <h3 className="m-0 mb-4 text-[15px] font-semibold">Matriz de Cobertura</h3>
                <div className="grid grid-cols-4 gap-2.5 mt-2.5">
                    {pillars.map((p) => {
                        const pct = coverageMap.get(p.name) || 0
                        return (
                            <div key={p.id} className="border border-border p-2.5 rounded-md text-center bg-[#0d1117]">
                                <div className="font-semibold mb-1.5 text-[13px]">{p.name}</div>
                                <div className="h-1.5 bg-[#30363d] rounded-full overflow-hidden">
                                    <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }}></div>
                                </div>
                                <div className="text-[11px] text-text-muted mt-1 text-right">{pct}%</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
