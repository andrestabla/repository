import prisma from '@/lib/prisma'
import Link from 'next/link'
import GeneratorCards from '@/components/GeneratorCards'

export const dynamic = 'force-dynamic'

export default async function Generator() {
    const artifacts = await prisma.artifact.findMany({
        orderBy: { lastGen: 'desc' }
    })

    // Format date helper
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-ES', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        }).format(date)
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-[20px] font-semibold text-white flex items-center gap-3">
                    Generador de Documentación
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-warning/30 bg-warning/15 text-warning font-medium">Environment: Production</span>
                </h2>
            </div>

            <div className="bg-panel border border-border rounded-xl p-5 mb-5 bg-gradient-to-r from-[rgba(35,134,54,0.1)] to-transparent">
                <h3 className="m-0 mb-2 text-[15px] font-semibold">🚀 Compilador de Metodología v1.0</h3>
                <p className="text-[13px] text-text-muted max-w-[600px]">
                    Esta herramienta consulta Neon DB, verifica los Drive IDs y genera los documentos estructurados oficiales.
                    Los artefactos se guardarán en: <span className="font-mono">/4Shine/Releases/v1.0/Artifacts/</span>
                </p>
            </div>

            <GeneratorCards />

            <div className="bg-panel border border-border rounded-xl p-5">
                <h3 className="m-0 mb-4 text-[15px] font-semibold">Historial de Generación</h3>
                <table className="w-full text-[13px] border-collapse">
                    <thead>
                        <tr className="border-b border-border text-left">
                            <th className="text-text-muted py-2 px-3 font-medium">Artefacto</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Versión Data</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Fecha</th>
                            <th className="text-text-muted py-2 px-3 font-medium">User</th>
                            <th className="text-text-muted py-2 px-3 font-medium">Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {artifacts.map((a) => (
                            <tr key={a.id} className="border-b border-border/40 last:border-0 hover:bg-white/5 transition-colors">
                                <td className="py-2.5 px-3">{a.name}</td>
                                <td className="py-2.5 px-3">
                                    <span className="font-mono text-[11px] bg-[rgba(188,140,255,0.15)] text-purple px-2 py-0.5 rounded-full border border-[rgba(188,140,255,0.3)]">v1.0</span>
                                </td>
                                <td className="py-2.5 px-3">{formatDate(a.lastGen)}</td>
                                <td className="py-2.5 px-3">Metodólogo</td>
                                <td className="py-2.5 px-3">
                                    <Link href="#" className="text-accent hover:underline">Descargar</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
