import Link from 'next/link'
import { ArrowRight, BookOpenText, Sparkles } from 'lucide-react'
import { WORKBOOKS_V2_CATALOG } from '@/lib/workbooks-v2-catalog'

export const revalidate = 0

export default function WorkbooksV2Page() {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#10152a_0%,#070b17_44%,#05070d_100%)] text-white px-6 py-10 md:px-10 md:py-12">
            <div className="max-w-6xl mx-auto space-y-10">
                <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 md:p-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase text-cyan-200">
                        <Sparkles size={14} />
                        Workbooks v2
                    </div>
                    <h1 className="mt-5 text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                        Biblioteca digital e interactiva 4Shine
                    </h1>
                    <p className="mt-4 max-w-3xl text-sm md:text-base text-slate-300 leading-relaxed">
                        Este módulo centraliza las nuevas versiones 100% digitales de los cuadernillos.
                        Cada workbook tendrá navegación interactiva y versión descargable.
                    </p>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {WORKBOOKS_V2_CATALOG.map((workbook) => (
                        <article
                            key={workbook.id}
                            className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-[0_24px_60px_rgba(2,8,23,0.45)]"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]">
                                    <BookOpenText size={14} />
                                    {workbook.code}
                                </div>
                                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold text-cyan-200">
                                    {workbook.statusLabel}
                                </span>
                            </div>

                            <h2 className="mt-5 text-2xl font-extrabold leading-tight">
                                {workbook.title}
                            </h2>
                            <p className="mt-2 text-sm text-slate-400">
                                Pilar: <span className="text-slate-200 font-semibold">{workbook.pillar}</span>
                            </p>
                            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                                {workbook.summary}
                            </p>

                            <div className="mt-6">
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                                    <span>Progreso digital</span>
                                    <span>{workbook.progress}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                        style={{ width: `${workbook.progress}%` }}
                                    />
                                </div>
                            </div>

                            <Link
                                href={`/workbooks-v2/${workbook.slug}`}
                                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-4 py-2.5 text-sm font-bold hover:bg-cyan-100 transition-colors"
                            >
                                Abrir versión digital
                                <ArrowRight size={16} />
                            </Link>
                        </article>
                    ))}
                </section>
            </div>
        </div>
    )
}
