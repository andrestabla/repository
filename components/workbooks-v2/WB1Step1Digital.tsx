"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Download, FileText, Lock, Printer } from 'lucide-react'

type WB1CoverFields = {
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

type WB1IdentityFields = {
    roleLeader: string
    principlesNoNeg: string
    underPressure: string
    inCalm: string
    valueOffer: string
    avoidThings: string
    triggers: string
    resources: string
    matrixTrustDo: string
    matrixTrustImpact: string
    matrixTransparencyDo: string
    matrixTransparencyImpact: string
    stakeholdersChosen: string
    stakeholderStrength: string
    stakeholderBlindspot: string
}

const STORAGE_KEY = 'workbooks-v2-wb1-step1'
const STORY_STORAGE_KEY = 'workbooks-v2-wb1-step31'
const IDENTITY_STORAGE_KEY = 'workbooks-v2-wb1-step32'

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
    'Paso 1 - Linea de vida: registra 5 momentos clave, 3 quiebres y 3 logros de superacion.',
    'Paso 2 - Narrativa en 3 actos: origen, quiebre y reconstruccion (10 a 15 lineas por acto).',
    'Paso 3 - Patrones: identifica decisiones repetidas, disparadores de defensa y recursos consistentes.'
]

const RESPONSE_RULES = [
    'Responde con bullets concretos.',
    'Si puedes, agrega un ejemplo corto (1 linea) por bullet.',
    'No uses adjetivos (muy intenso), usa comportamiento (microgestion, evito conversar, me cierro).'
]

const IDENTITY_SEGMENTS = [
    { key: 'roleLeader', label: 'Rol clave (lider, profesional, etc.)' },
    { key: 'principlesNoNeg', label: 'Principios no negociables' },
    { key: 'underPressure', label: 'Estilo bajo presion' },
    { key: 'inCalm', label: 'Estilo en calma' },
    { key: 'valueOffer', label: 'Lo que aportas (valor)' },
    { key: 'avoidThings', label: 'Lo que evitas' },
    { key: 'triggers', label: 'Lo que te dispara (triggers)' },
    { key: 'resources', label: 'Lo que te sostiene (recursos)' }
] as const

export function WB1Step1Digital() {
    const [fields, setFields] = useState<WB1CoverFields>({
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
    const [identityFields, setIdentityFields] = useState<WB1IdentityFields>({
        roleLeader: '',
        principlesNoNeg: '',
        underPressure: '',
        inCalm: '',
        valueOffer: '',
        avoidThings: '',
        triggers: '',
        resources: '',
        matrixTrustDo: '',
        matrixTrustImpact: '',
        matrixTransparencyDo: '',
        matrixTransparencyImpact: '',
        stakeholdersChosen: '',
        stakeholderStrength: '',
        stakeholderBlindspot: ''
    })
    const [isLocked, setIsLocked] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as WB1CoverFields
            setFields({
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
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fields))
    }, [fields])

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

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(IDENTITY_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as WB1IdentityFields
            setIdentityFields({
                roleLeader: parsed.roleLeader || '',
                principlesNoNeg: parsed.principlesNoNeg || '',
                underPressure: parsed.underPressure || '',
                inCalm: parsed.inCalm || '',
                valueOffer: parsed.valueOffer || '',
                avoidThings: parsed.avoidThings || '',
                triggers: parsed.triggers || '',
                resources: parsed.resources || '',
                matrixTrustDo: parsed.matrixTrustDo || '',
                matrixTrustImpact: parsed.matrixTrustImpact || '',
                matrixTransparencyDo: parsed.matrixTransparencyDo || '',
                matrixTransparencyImpact: parsed.matrixTransparencyImpact || '',
                stakeholdersChosen: parsed.stakeholdersChosen || '',
                stakeholderStrength: parsed.stakeholderStrength || '',
                stakeholderBlindspot: parsed.stakeholderBlindspot || ''
            })
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identityFields))
    }, [identityFields])

    const completion = useMemo(() => {
        const values = Object.values(fields)
        const filled = values.filter((value) => value.trim().length > 0).length
        return Math.round((filled / values.length) * 100)
    }, [fields])

    const exportPdf = () => {
        window.print()
    }

    const exportHtml = () => {
        const htmlContent = '<!doctype html>\n' + document.documentElement.outerHTML
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'WB1-paso1-portada-digital.html'
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }

    const setField = (key: keyof WB1CoverFields, value: string) => {
        if (isLocked) return
        setFields((prev) => ({ ...prev, [key]: value }))
    }

    const setStoryField = (key: keyof WB1StoryFields, value: string) => {
        if (isLocked) return
        setStoryFields((prev) => ({ ...prev, [key]: value }))
    }

    const setIdentityField = (key: keyof WB1IdentityFields, value: string) => {
        if (isLocked) return
        setIdentityFields((prev) => ({ ...prev, [key]: value }))
    }

    return (
        <div className="min-h-screen bg-[#04060c] text-white">
            <header className="wb1-toolbar sticky top-0 z-40 border-b border-white/10 bg-[#04060c]/90 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-5 md:px-8 py-4 flex flex-wrap items-center gap-3">
                    <Link
                        href="/workbooks-v2"
                        className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold tracking-wide hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-400">Workbook v2</p>
                        <p className="text-sm md:text-base font-extrabold">WB1 • Paso 1: Portada digital</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsLocked((prev) => !prev)}
                        className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/15 transition-colors"
                    >
                        <Lock size={14} />
                        {isLocked ? 'Campos bloqueados' : 'Campos editables'}
                    </button>
                    <button
                        type="button"
                        onClick={exportPdf}
                        className="inline-flex items-center gap-2 rounded-lg bg-white text-slate-900 px-3 py-2 text-xs font-bold hover:bg-cyan-100 transition-colors"
                    >
                        <Printer size={14} />
                        Descargar PDF
                    </button>
                    <button
                        type="button"
                        onClick={exportHtml}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold hover:bg-white/10 transition-colors"
                    >
                        <FileText size={14} />
                        Descargar HTML
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-10 space-y-8">
                <section className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#020306] to-[#000000] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,.55)]">
                    <div className="relative min-h-[70vh] md:min-h-[78vh] flex items-center justify-center px-6 py-14">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(56,189,248,0.18),transparent_55%)]" />
                        <div className="absolute inset-x-0 top-[57%] h-px bg-cyan-300/70" />

                        <div className="relative text-center max-w-3xl">
                            <div className="mx-auto mb-8 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm flex items-center justify-center shadow-[0_12px_40px_rgba(255,255,255,0.15)]">
                                <Image
                                    src="/workbooks-v2/diamond.svg"
                                    alt="4Shine diamond"
                                    width={90}
                                    height={90}
                                    className="w-16 h-16 md:w-20 md:h-20"
                                    priority
                                />
                            </div>

                            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-white">
                                Creencias, identidad y pilares personales
                            </h1>

                            <div className="mt-6 text-cyan-100/90 text-sm md:text-lg font-semibold">
                                Workbook 1
                            </div>
                            <div className="text-cyan-200/70 text-sm md:text-base tracking-wide">
                                4Shine
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl md:text-2xl font-extrabold">Datos del líder (editable)</h2>
                        <div className="text-xs font-semibold text-slate-300">
                            Completado: <span className="text-cyan-200">{completion}%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="space-y-1">
                            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Nombre del líder</span>
                            <input
                                type="text"
                                value={fields.leaderName}
                                onChange={(event) => setField('leaderName', event.target.value)}
                                disabled={isLocked}
                                className="w-full rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-cyan-300"
                                placeholder="Ej: Andrés Tabla"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Rol actual</span>
                            <input
                                type="text"
                                value={fields.role}
                                onChange={(event) => setField('role', event.target.value)}
                                disabled={isLocked}
                                className="w-full rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-cyan-300"
                                placeholder="Ej: Director / Líder"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Cohorte / Equipo</span>
                            <input
                                type="text"
                                value={fields.cohort}
                                onChange={(event) => setField('cohort', event.target.value)}
                                disabled={isLocked}
                                className="w-full rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-cyan-300"
                                placeholder="Ej: Cohorte Ejecutiva 2026"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Fecha de inicio</span>
                            <input
                                type="date"
                                value={fields.startDate}
                                onChange={(event) => setField('startDate', event.target.value)}
                                disabled={isLocked}
                                className="w-full rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-cyan-300"
                            />
                        </label>
                    </div>
                </section>

                <section className="rounded-3xl border border-cyan-200/20 bg-gradient-to-b from-[#071022] to-[#060b16] p-6 md:p-10 space-y-10">
                    <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/80 font-semibold">Paso 2</p>
                        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-cyan-100">
                            Presentacion del workbook
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 md:p-7">
                        <h3 className="text-lg md:text-xl font-bold text-cyan-200">Objetivo</h3>
                        <p className="mt-2 text-sm md:text-base text-slate-300">
                            Al finalizar, tendras:
                        </p>
                        <ul className="mt-4 space-y-2.5">
                            {OBJECTIVE_OUTCOMES.map((item) => (
                                <li key={item} className="flex items-start gap-3 text-sm md:text-[15px] text-slate-200/95 leading-relaxed">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:p-6">
                            <h3 className="text-base md:text-lg font-bold text-cyan-200">
                                Componentes trabajados en este workbook
                            </h3>
                            <ul className="mt-4 space-y-2.5">
                                {WORKBOOK_COMPONENTS.map((item) => (
                                    <li key={item} className="text-sm text-slate-200/95 leading-relaxed flex items-start gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </article>

                        <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:p-6">
                            <h3 className="text-base md:text-lg font-bold text-cyan-200">
                                Competencias 4Shine que vas a activar
                            </h3>
                            <ul className="mt-4 space-y-2.5">
                                {FOURSHINE_COMPETENCIES.map((item) => (
                                    <li key={item} className="text-sm text-slate-200/95 leading-relaxed flex items-start gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    </div>

                    <article className="rounded-2xl border border-cyan-200/20 bg-cyan-200/5 p-5 md:p-7">
                        <h3 className="text-base md:text-lg font-bold text-cyan-200">
                            Conductas observables asociadas (que se deberia ver en tu dia a dia)
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {OBSERVABLE_BEHAVIORS.map((item) => (
                                <li key={item} className="text-sm md:text-[15px] text-slate-100 leading-relaxed flex items-start gap-3">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-xs md:text-sm text-cyan-100/80">
                            Nota practica: cuando este workbook se usa con mentor, se trabaja con evidencia reciente
                            (ultimos 20 dias) para que el progreso sea verificable.
                        </p>
                    </article>
                </section>

                <section className="rounded-3xl border border-violet-200/20 bg-gradient-to-b from-[#100b1a] to-[#0a0914] p-6 md:p-10 space-y-8">
                    <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-violet-300/80 font-semibold">Paso 3.1</p>
                        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-violet-100">
                            1. Storytelling personal
                        </h2>
                    </div>

                    <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:p-7 space-y-4">
                        <h3 className="text-base md:text-lg font-bold text-violet-200">Proposito</h3>
                        <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                            Entender como tu historia ha moldeado tu identidad y tus creencias actuales.
                        </p>
                    </article>

                    <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:p-7 space-y-4">
                        <h3 className="text-base md:text-lg font-bold text-violet-200">Instrucciones</h3>
                        <ul className="space-y-2.5">
                            {STORY_STEPS.map((item) => (
                                <li key={item} className="text-sm md:text-[15px] text-slate-200/95 leading-relaxed flex items-start gap-3">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-violet-300 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </article>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Linea de vida (eventos clave)</span>
                            <textarea
                                value={storyFields.timelineEvents}
                                onChange={(event) => setStoryField('timelineEvents', event.target.value)}
                                disabled={isLocked}
                                className="w-full min-h-[120px] rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-violet-300"
                                placeholder="Fecha, hecho, interpretacion, aprendizaje y creencia instalada..."
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Narrativa en 3 actos</span>
                            <textarea
                                value={storyFields.threeActsNarrative}
                                onChange={(event) => setStoryField('threeActsNarrative', event.target.value)}
                                disabled={isLocked}
                                className="w-full min-h-[140px] rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-violet-300"
                                placeholder="Acto 1 (origen), Acto 2 (quiebre), Acto 3 (reconstruccion)..."
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Patrones detectados</span>
                            <textarea
                                value={storyFields.patterns}
                                onChange={(event) => setStoryField('patterns', event.target.value)}
                                disabled={isLocked}
                                className="w-full min-h-[140px] rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-violet-300"
                                placeholder="Decisiones repetidas, disparadores de miedo/defensa y recursos consistentes..."
                            />
                        </label>
                    </div>

                    <aside className="rounded-xl border border-violet-300/25 bg-slate-100 text-slate-900 p-4 md:p-5">
                        <p className="text-sm font-extrabold">¿Que es una creencia?</p>
                        <p className="mt-1 text-sm leading-relaxed">
                            Conviccion interna que guia el comportamiento y la toma de decisiones de un individuo.
                        </p>
                    </aside>

                    <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:p-7 space-y-5">
                        <div className="space-y-2">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300/80 font-semibold">Paso 3.3</p>
                            <h3 className="text-base md:text-lg font-bold text-violet-200">Patrones de respuesta</h3>
                        </div>

                        <aside className="rounded-xl border border-slate-300/30 bg-slate-200 text-slate-900 p-4 md:p-5">
                            <p className="text-sm font-extrabold">Como responder (regla)</p>
                            <ul className="mt-2 space-y-1.5">
                                {RESPONSE_RULES.map((rule) => (
                                    <li key={rule} className="text-sm leading-relaxed flex items-start gap-2">
                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                        <span>{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </aside>

                        <div className="space-y-5">
                            <label className="block space-y-1">
                                <span className="text-sm md:text-[15px] font-semibold text-violet-100">
                                    1. Patron que se repite en mis decisiones:
                                </span>
                                <textarea
                                    value={storyFields.patternDecision}
                                    onChange={(event) => setStoryField('patternDecision', event.target.value)}
                                    disabled={isLocked}
                                    className="w-full min-h-[86px] rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-violet-300"
                                    placeholder="- Escribe tus bullets aqui..."
                                />
                                <p className="text-xs text-violet-200/70">
                                    Ejemplo: Bajo presion priorizo control y velocidad sobre conversacion.
                                </p>
                            </label>

                            <label className="block space-y-1">
                                <span className="text-sm md:text-[15px] font-semibold text-violet-100">
                                    2. Situacion que mas activa miedo/defensa:
                                </span>
                                <textarea
                                    value={storyFields.patternTrigger}
                                    onChange={(event) => setStoryField('patternTrigger', event.target.value)}
                                    disabled={isLocked}
                                    className="w-full min-h-[86px] rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-violet-300"
                                    placeholder="- Escribe tus bullets aqui..."
                                />
                                <p className="text-xs text-violet-200/70">
                                    Ejemplo: Critica o cuestionamiento publico frente al equipo o direccion.
                                </p>
                            </label>

                            <label className="block space-y-1">
                                <span className="text-sm md:text-[15px] font-semibold text-violet-100">
                                    3. Mi recurso mas consistente:
                                </span>
                                <textarea
                                    value={storyFields.patternResource}
                                    onChange={(event) => setStoryField('patternResource', event.target.value)}
                                    disabled={isLocked}
                                    className="w-full min-h-[86px] rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-violet-300"
                                    placeholder="- Escribe tus bullets aqui..."
                                />
                                <p className="text-xs text-violet-200/70">
                                    Ejemplo: Capacidad de analisis y disciplina para ejecutar con orden.
                                </p>
                            </label>
                        </div>
                    </article>
                </section>

                <section className="rounded-3xl border border-emerald-200/20 bg-gradient-to-b from-[#071611] to-[#07120f] p-6 md:p-10 space-y-8">
                    <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-300/80 font-semibold">Paso 3.2</p>
                        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-emerald-100">
                            2. Definicion de identidad actual
                        </h2>
                    </div>

                    <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:p-7">
                        <h3 className="text-base md:text-lg font-bold text-emerald-200">Proposito</h3>
                        <p className="mt-2 text-sm md:text-base text-slate-200 leading-relaxed">
                            Definir quien eres hoy en terminos de conducta y reputacion, no de intencion.
                        </p>
                    </article>

                    <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:p-7 space-y-4">
                        <h3 className="text-base md:text-lg font-bold text-emerald-200">Instrumento 1 - Rueda de identidad</h3>
                        <p className="text-sm text-slate-300">
                            Escribe de 3 a 5 bullets por segmento para construir una fotografia clara de tu identidad actual.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {IDENTITY_SEGMENTS.map((item) => (
                                <label key={item.key} className="space-y-1">
                                    <span className="text-xs uppercase tracking-[0.14em] text-slate-400">{item.label}</span>
                                    <textarea
                                        value={identityFields[item.key]}
                                        onChange={(event) => setIdentityField(item.key, event.target.value)}
                                        disabled={isLocked}
                                        className="w-full min-h-[96px] rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-emerald-300"
                                        placeholder="Escribe aqui..."
                                    />
                                </label>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:p-7 space-y-4">
                        <h3 className="text-base md:text-lg font-bold text-emerald-200">Instrumento 2 - Matriz Lo que digo / hago / impacto</h3>
                        <div className="overflow-hidden rounded-xl border border-white/15">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/10 text-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Lo que digo</th>
                                        <th className="px-4 py-3 font-semibold">Lo que hago (hechos)</th>
                                        <th className="px-4 py-3 font-semibold">Impacto en otros</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-black/20">
                                    <tr className="border-t border-white/10">
                                        <td className="px-4 py-3 text-slate-200">"Confio en el equipo"</td>
                                        <td className="px-3 py-2">
                                            <textarea
                                                value={identityFields.matrixTrustDo}
                                                onChange={(event) => setIdentityField('matrixTrustDo', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[78px] rounded-lg border border-white/20 bg-white/95 text-slate-900 px-3 py-2 text-sm disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-emerald-300"
                                                placeholder="Evidencia concreta..."
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <textarea
                                                value={identityFields.matrixTrustImpact}
                                                onChange={(event) => setIdentityField('matrixTrustImpact', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[78px] rounded-lg border border-white/20 bg-white/95 text-slate-900 px-3 py-2 text-sm disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-emerald-300"
                                                placeholder="Impacto observado..."
                                            />
                                        </td>
                                    </tr>
                                    <tr className="border-t border-white/10">
                                        <td className="px-4 py-3 text-slate-200">"Valoro la transparencia"</td>
                                        <td className="px-3 py-2">
                                            <textarea
                                                value={identityFields.matrixTransparencyDo}
                                                onChange={(event) => setIdentityField('matrixTransparencyDo', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[78px] rounded-lg border border-white/20 bg-white/95 text-slate-900 px-3 py-2 text-sm disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-emerald-300"
                                                placeholder="Evidencia concreta..."
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <textarea
                                                value={identityFields.matrixTransparencyImpact}
                                                onChange={(event) => setIdentityField('matrixTransparencyImpact', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[78px] rounded-lg border border-white/20 bg-white/95 text-slate-900 px-3 py-2 text-sm disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-emerald-300"
                                                placeholder="Impacto observado..."
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </article>

                    <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:p-7 space-y-4">
                        <h3 className="text-base md:text-lg font-bold text-emerald-200">Instrumento 3 - Mini espejo de stakeholders (360 rapido)</h3>
                        <label className="space-y-1 block">
                            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Personas elegidas (jefe, par, colaborador)</span>
                            <input
                                type="text"
                                value={identityFields.stakeholdersChosen}
                                onChange={(event) => setIdentityField('stakeholdersChosen', event.target.value)}
                                disabled={isLocked}
                                className="w-full rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-emerald-300"
                                placeholder="Ej: Jefe directo, colega senior, miembro del equipo"
                            />
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-400">¿Que dirian que es tu fortaleza?</span>
                                <textarea
                                    value={identityFields.stakeholderStrength}
                                    onChange={(event) => setIdentityField('stakeholderStrength', event.target.value)}
                                    disabled={isLocked}
                                    className="w-full min-h-[110px] rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-emerald-300"
                                    placeholder="Tu hipotesis..."
                                />
                            </label>
                            <label className="space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-400">¿Que dirian que es tu punto ciego?</span>
                                <textarea
                                    value={identityFields.stakeholderBlindspot}
                                    onChange={(event) => setIdentityField('stakeholderBlindspot', event.target.value)}
                                    disabled={isLocked}
                                    className="w-full min-h-[110px] rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-emerald-300"
                                    placeholder="Tu hipotesis..."
                                />
                            </label>
                        </div>
                        <p className="text-xs md:text-sm text-emerald-100/80">
                            Es una hipotesis inicial. Luego podras validarla con feedback real.
                        </p>
                    </article>
                </section>
            </main>

            <style jsx global>{`
                @media print {
                    .wb1-toolbar {
                        display: none !important;
                    }
                    body {
                        background: #000 !important;
                    }
                    main {
                        padding-top: 0 !important;
                    }
                }
            `}</style>
        </div>
    )
}
