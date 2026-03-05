"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, FileText, Lock, Printer } from 'lucide-react'

type WB1IdentificationFields = {
    leaderName: string
    role: string
    cohort: string
    startDate: string
}

type WB1StoryFields = {
    timelineEvents: string
    threeActsNarrative: string
    patterns: string
    patternDecision: string
    patternTrigger: string
    patternResource: string
}

type PageItem = {
    id: number
    label: string
    shortLabel: string
}

const ID_STORAGE_KEY = 'workbooks-v2-wb1-identification'
const STORY_STORAGE_KEY = 'workbooks-v2-wb1-storytelling'

const PAGES: PageItem[] = [
    { id: 1, label: '1. Portada e identificacion', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentacion del workbook', shortLabel: 'Presentacion' },
    { id: 3, label: '3. Storytelling personal', shortLabel: 'Storytelling' }
]

const OBJECTIVE_OUTCOMES = [
    'Tu historia personal resumida en una narrativa clara (sin victimismo ni epica vacia).',
    'Una identidad actual definida con hechos (no con adjetivos).',
    'Tus valores fundamentales priorizados y tus no negociables explicitos.',
    'Un mapa de fortalezas y areas de oportunidad con evidencia reciente.',
    'Un inventario de creencias limitantes (y su origen) y su reemplazo por creencias empoderadoras.',
    'Mantras personales disenados para sostener conducta bajo presion.',
    'Tu identidad futura 10X (vision, habitos y decisiones) y un primer plan de activacion.'
]

const WORKBOOK_COMPONENTS = [
    'Identidad y coherencia personal',
    'Valores y principios no negociables',
    'Sistema de creencias (mindset)',
    'Reflexion y aprendizaje (autoconciencia)'
]

const FOURSHINE_COMPETENCIES = [
    'Gestion de creencias (mindset)',
    'Integridad y coherencia',
    'Responsabilidad radical (accountability)',
    'Autenticidad',
    'Practica reflexiva y apertura al feedback',
    'Claridad de proposito y valores (Ikigai como marco)'
]

const OBSERVABLE_BEHAVIORS = [
    'Coherencia: tomas decisiones alineadas con tus valores incluso bajo presion.',
    'Accountability: asumes publicamente tu parte cuando algo falla y defines correcciones concretas.',
    'Mindset: identificas una creencia limitante, la cuestionas y ejecutas un reemplazo conductual.',
    'Autenticidad: sostienes tu estilo sin mascara corporativa y sin perder firmeza.',
    'Reflexion: conviertes experiencias en aprendizaje (registras, sintetizas y ajustas conducta).'
]

const STORY_STEPS = [
    'Linea de vida: registra 5 momentos clave, 3 quiebres y 3 logros de superacion.',
    'Narrativa en 3 actos: origen, quiebre y reconstruccion (10 a 15 lineas por acto).',
    'Patrones: identifica decisiones repetidas, disparadores de defensa y recursos consistentes.'
]

const RESPONSE_RULES = [
    'Responde con bullets concretos.',
    'Si puedes, agrega un ejemplo corto (1 linea) por bullet.',
    'No uses adjetivos (muy intenso), usa comportamiento (microgestion, evito conversar, me cierro).'
]

export function WB1Step1Digital() {
    const [activePage, setActivePage] = useState(1)
    const [isLocked, setIsLocked] = useState(false)
    const [idFields, setIdFields] = useState<WB1IdentificationFields>({
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    })
    const [storyFields, setStoryFields] = useState<WB1StoryFields>({
        timelineEvents: '',
        threeActsNarrative: '',
        patterns: '',
        patternDecision: '',
        patternTrigger: '',
        patternResource: ''
    })

    useEffect(() => {
        if (typeof window === 'undefined') return
        document.documentElement.classList.remove('dark')
        window.localStorage.setItem('theme', 'light')
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(ID_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as WB1IdentificationFields
            setIdFields({
                leaderName: parsed.leaderName || '',
                role: parsed.role || '',
                cohort: parsed.cohort || '',
                startDate: parsed.startDate || ''
            })
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(ID_STORAGE_KEY, JSON.stringify(idFields))
    }, [idFields])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(STORY_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as WB1StoryFields
            setStoryFields({
                timelineEvents: parsed.timelineEvents || '',
                threeActsNarrative: parsed.threeActsNarrative || '',
                patterns: parsed.patterns || '',
                patternDecision: parsed.patternDecision || '',
                patternTrigger: parsed.patternTrigger || '',
                patternResource: parsed.patternResource || ''
            })
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(storyFields))
    }, [storyFields])

    const completion = useMemo(() => {
        const idValues = Object.values(idFields)
        const storyValues = Object.values(storyFields)
        const total = idValues.length + storyValues.length
        const filled = [...idValues, ...storyValues].filter((value) => value.trim().length > 0).length
        return Math.round((filled / total) * 100)
    }, [idFields, storyFields])

    const exportPdf = () => {
        window.print()
    }

    const exportHtml = () => {
        const htmlContent = '<!doctype html>\n' + document.documentElement.outerHTML
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'WB1-digital-interactivo.html'
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }

    const setIdField = (key: keyof WB1IdentificationFields, value: string) => {
        if (isLocked) return
        setIdFields((prev) => ({ ...prev, [key]: value }))
    }

    const setStoryField = (key: keyof WB1StoryFields, value: string) => {
        if (isLocked) return
        setStoryFields((prev) => ({ ...prev, [key]: value }))
    }

    const jumpToPage = (page: number) => {
        setActivePage(page)
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    return (
        <div className="min-h-screen bg-[#f4f7fb] text-[#0f172a]">
            <header className="wb1-toolbar sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex flex-wrap items-center gap-3">
                    <Link
                        href="/workbooks-v2"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold tracking-wide hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500">Workbook v2</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB1 - Creencias, identidad y pilares personales</p>
                    </div>

                    <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-semibold text-blue-700">
                        Avance: {completion}%
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsLocked((prev) => !prev)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <Lock size={14} />
                        {isLocked ? 'Campos bloqueados' : 'Campos editables'}
                    </button>
                    <button
                        type="button"
                        onClick={exportPdf}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-2 text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                        <Printer size={14} />
                        Descargar PDF
                    </button>
                    <button
                        type="button"
                        onClick={exportHtml}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <FileText size={14} />
                        Descargar HTML
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-5 md:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6 items-start">
                    <aside className="wb1-sidebar rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Indice</p>
                        <nav className="space-y-1.5" aria-label="Navegacion de paginas">
                            {PAGES.map((page) => (
                                <button
                                    key={page.id}
                                    type="button"
                                    onClick={() => jumpToPage(page.id)}
                                    className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                                        activePage === page.id
                                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                            : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                                    }`}
                                >
                                    {page.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <section className="space-y-6">
                        {activePage === 1 && (
                            <article className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                                <div className="relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <Image
                                                src="/workbooks-v2/diamond.svg"
                                                alt="4Shine diamond"
                                                width={90}
                                                height={90}
                                                className="w-16 h-16 md:w-20 md:h-20"
                                                priority
                                            />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Creencias, identidad y pilares personales
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 1</p>
                                        <p className="text-blue-600 text-sm">4Shine</p>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 border-t border-slate-200">
                                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">Datos de identificacion</h2>
                                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nombre del lider</span>
                                            <input
                                                type="text"
                                                value={idFields.leaderName}
                                                onChange={(event) => setIdField('leaderName', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                placeholder="Ej: Andres Tabla"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Rol actual</span>
                                            <input
                                                type="text"
                                                value={idFields.role}
                                                onChange={(event) => setIdField('role', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                placeholder="Ej: Director / Lider"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Cohorte / Equipo</span>
                                            <input
                                                type="text"
                                                value={idFields.cohort}
                                                onChange={(event) => setIdField('cohort', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                placeholder="Ej: Cohorte Ejecutiva 2026"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Fecha de inicio</span>
                                            <input
                                                type="date"
                                                value={idFields.startDate}
                                                onChange={(event) => setIdField('startDate', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => jumpToPage(2)}
                                            className="rounded-xl bg-blue-700 text-white px-6 py-3 text-sm font-bold hover:bg-blue-600 transition-colors"
                                        >
                                            Empezar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        )}

                        {activePage === 2 && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Pagina 2</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Presentacion del workbook
                                    </h2>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7">
                                    <h3 className="text-lg font-bold text-slate-900">Objetivo</h3>
                                    <p className="mt-2 text-sm md:text-base text-slate-700">Al finalizar, tendras:</p>
                                    <ul className="mt-4 space-y-2.5">
                                        {OBJECTIVE_OUTCOMES.map((item) => (
                                            <li key={item} className="flex items-start gap-3 text-sm md:text-[15px] text-slate-700 leading-relaxed">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">
                                            Componentes trabajados en este workbook
                                        </h3>
                                        <ul className="mt-4 space-y-2.5">
                                            {WORKBOOK_COMPONENTS.map((item) => (
                                                <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-3">
                                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">
                                            Competencias 4Shine que vas a activar
                                        </h3>
                                        <ul className="mt-4 space-y-2.5">
                                            {FOURSHINE_COMPETENCIES.map((item) => (
                                                <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-3">
                                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">
                                        Conductas observables asociadas (que se deberia ver en tu dia a dia)
                                    </h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {OBSERVABLE_BEHAVIORS.map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            </article>
                        )}

                        {activePage === 3 && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 space-y-6 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Pagina 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Storytelling personal
                                    </h2>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Proposito</h3>
                                    <p className="mt-2 text-sm md:text-base text-slate-700 leading-relaxed">
                                        Entender como tu historia ha moldeado tu identidad y tus creencias actuales.
                                    </p>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Instrucciones</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {STORY_STEPS.map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="space-y-1 md:col-span-2">
                                        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Linea de vida (eventos clave)</span>
                                        <textarea
                                            value={storyFields.timelineEvents}
                                            onChange={(event) => setStoryField('timelineEvents', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full min-h-[110px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            placeholder="Fecha, hecho, interpretacion, aprendizaje y creencia instalada..."
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Narrativa en 3 actos</span>
                                        <textarea
                                            value={storyFields.threeActsNarrative}
                                            onChange={(event) => setStoryField('threeActsNarrative', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full min-h-[120px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            placeholder="Acto 1 (origen), Acto 2 (quiebre), Acto 3 (reconstruccion)..."
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Patrones detectados</span>
                                        <textarea
                                            value={storyFields.patterns}
                                            onChange={(event) => setStoryField('patterns', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full min-h-[120px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            placeholder="Resume los patrones que observas..."
                                        />
                                    </label>
                                </div>

                                <aside className="rounded-xl border border-slate-300 bg-slate-100 p-4 md:p-5">
                                    <p className="text-sm font-extrabold text-slate-900">Como responder (regla)</p>
                                    <ul className="mt-2 space-y-1.5">
                                        {RESPONSE_RULES.map((rule) => (
                                            <li key={rule} className="text-sm text-slate-700 leading-relaxed flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{rule}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </aside>

                                <div className="space-y-5">
                                    <label className="block space-y-1">
                                        <span className="text-sm md:text-[15px] font-semibold text-slate-900">
                                            1. Patron que se repite en mis decisiones:
                                        </span>
                                        <textarea
                                            value={storyFields.patternDecision}
                                            onChange={(event) => setStoryField('patternDecision', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full min-h-[86px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            placeholder="- Escribe tus bullets aqui..."
                                        />
                                        <p className="text-xs text-slate-500">
                                            Ejemplo: Bajo presion priorizo control y velocidad sobre conversacion.
                                        </p>
                                    </label>

                                    <label className="block space-y-1">
                                        <span className="text-sm md:text-[15px] font-semibold text-slate-900">
                                            2. Situacion que mas activa miedo/defensa:
                                        </span>
                                        <textarea
                                            value={storyFields.patternTrigger}
                                            onChange={(event) => setStoryField('patternTrigger', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full min-h-[86px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            placeholder="- Escribe tus bullets aqui..."
                                        />
                                        <p className="text-xs text-slate-500">
                                            Ejemplo: Critica o cuestionamiento publico frente al equipo o direccion.
                                        </p>
                                    </label>

                                    <label className="block space-y-1">
                                        <span className="text-sm md:text-[15px] font-semibold text-slate-900">
                                            3. Mi recurso mas consistente:
                                        </span>
                                        <textarea
                                            value={storyFields.patternResource}
                                            onChange={(event) => setStoryField('patternResource', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full min-h-[86px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            placeholder="- Escribe tus bullets aqui..."
                                        />
                                        <p className="text-xs text-slate-500">
                                            Ejemplo: Capacidad de analisis y disciplina para ejecutar con orden.
                                        </p>
                                    </label>
                                </div>
                            </article>
                        )}
                    </section>
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    .wb1-toolbar,
                    .wb1-sidebar {
                        display: none !important;
                    }
                    body {
                        background: #fff !important;
                    }
                    main {
                        padding-top: 0 !important;
                    }
                }
            `}</style>
        </div>
    )
}
