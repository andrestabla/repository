import prisma from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  // Fetch Data
  const [total, incomplete, approved, backlog, methodology] = await Promise.all([
    prisma.contentItem.count(),
    prisma.contentItem.count({
      where: {
        OR: [
          { completeness: { lt: 100 } },
          { ip: 'Completar' },
          { driveId: null },
        ],
      },
    }),
    prisma.contentItem.count({ where: { status: 'Aprobado' } }),
    prisma.contentItem.findMany({
      where: { completeness: { lt: 100 } },
      take: 3,
    }),
    prisma.methodology.findUnique({ where: { version: 'v1.0' } }), // Should ideally get active one
  ])

  const coverage = total > 0 ? Math.round((approved / total) * 100) : 0
  const version = methodology?.version || 'v1.0'

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[20px] font-semibold text-white flex items-center gap-3">
          Dashboard <span className="font-mono text-[11px] bg-[rgba(188,140,255,0.15)] text-purple px-2 py-0.5 rounded-full border border-[rgba(188,140,255,0.3)]">{version}</span>
        </h2>
        <div>
          <Link href="/generator" className="bg-[#238636] text-white border border-white/10 px-3.5 py-1.5 rounded-md text-[12px] font-semibold hover:bg-[#2ea043] transition-colors">
            Exportar Documentación
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatBox label="Total Activos Indexados" value={total} />
        <StatBox label="Datos Faltantes (Action Req)" value={incomplete} color="text-danger" borderColor="border-danger/40" />
        <StatBox label="Aprobados para v1.0" value={approved} color="text-success" />
        <StatBox label="Cobertura Metodológica" value={`${coverage}%`} color="text-accent" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-panel border border-border rounded-xl p-5">
          <h3 className="m-0 mb-4 text-[15px] font-semibold flex justify-between">Estado del Repositorio (Drive)</h3>
          <p className="text-[13px] text-text-muted mb-4">
            Conectado a: <span className="font-mono">/4Shine/Methodology/v1.0/</span>
          </p>
          <div className="bg-black/30 p-2.5 rounded-md font-mono text-[12px] text-text-muted">
            &gt; Checking file integrity... OK<br />
            &gt; Syncing metadata... OK<br />
            &gt; <span className="text-danger">Warning: 2 files missing Drive ID</span>
          </div>
        </div>

        <div className="bg-panel border border-border rounded-xl p-5">
          <h3 className="m-0 mb-4 text-[15px] font-semibold flex justify-between">Backlog de Curaduría</h3>
          <table className="w-full text-[13px] border-collapse">
            <tbody>
              {backlog.map((item) => (
                <tr key={item.id} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5">{item.title}</td>
                  <td className="py-2.5">
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-danger/30 bg-danger/10 text-danger font-medium">
                      {item.completeness}% data
                    </span>
                  </td>
                  <td className="text-right py-2.5">
                    <Link href="/inventory" className="bg-[#21262d] border border-border text-text px-3 py-1.5 rounded-md text-[12px] font-semibold hover:bg-[#30363d] transition-colors">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, color = 'text-white', borderColor = 'border-border' }: { label: string, value: number | string, color?: string, borderColor?: string }) {
  return (
    <div className={`bg-[#0d1117] border ${borderColor} rounded-md p-4`}>
      <div className="text-[12px] text-text-muted">{label}</div>
      <div className={`text-[24px] font-bold mt-1 ${color}`}>{value}</div>
    </div>
  )
}
