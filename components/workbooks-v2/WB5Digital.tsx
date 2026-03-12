'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3
type YesNoAnswer = '' | 'yes' | 'no'

type WorkbookPage = {
    id: WorkbookPageId
    label: string
    shortLabel: string
}

type WB5State = {
    identification: {
        leaderName: string
        role: string
        cohort: string
        startDate: string
    }
    executiveMessageSection: {
        bluf: {
            bottomLine: string
            whyItMatters: string
            nowWhat: string
            supportOne: string
            supportTwo: string
            supportThree: string
        }
        pyramid: {
            motherIdea: string
            argumentOne: string
            proofOne: string
            argumentTwo: string
            proofTwo: string
            argumentThree: string
            proofThree: string
        }
        scqa: {
            situation: string
            complication: string
            question: string
            answer: string
        }
        clarityTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
}

const PAGES: WorkbookPage[] = [
    { id: 1, label: '1. Portada e identificación', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Estructura de mensaje ejecutivo', shortLabel: 'Mensaje ejecutivo' }
]

const STORAGE_KEY = 'workbooks-v2-wb5-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb5-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb5-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb5-presentation-seen'
const EXECUTIVE_TEST_QUESTIONS = [
    '¿La idea principal aparece rápido?',
    '¿La lógica del mensaje se sostiene?',
    '¿Queda claro qué debe pasar después?',
    '¿El mensaje es creíble y verificable?',
    '¿El nivel de detalle está bien calibrado?'
]

const DEFAULT_STATE: WB5State = {
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    executiveMessageSection: {
        bluf: {
            bottomLine: '',
            whyItMatters: '',
            nowWhat: '',
            supportOne: '',
            supportTwo: '',
            supportThree: ''
        },
        pyramid: {
            motherIdea: '',
            argumentOne: '',
            proofOne: '',
            argumentTwo: '',
            proofTwo: '',
            argumentThree: '',
            proofThree: ''
        },
        scqa: {
            situation: '',
            complication: '',
            question: '',
            answer: ''
        },
        clarityTest: EXECUTIVE_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '',
            adjustment: ''
        }))
    }
}

const normalizeState = (raw: unknown): WB5State => {
    const parsed = typeof raw === 'object' && raw !== null ? (raw as Record<string, any>) : {}
    const executiveRaw = parsed.executiveMessageSection ?? {}
    const clarityRaw = Array.isArray(executiveRaw.clarityTest) ? executiveRaw.clarityTest : []

    return {
        identification: {
            ...DEFAULT_STATE.identification,
            ...(parsed.identification ?? {})
        },
        executiveMessageSection: {
            bluf: {
                ...DEFAULT_STATE.executiveMessageSection.bluf,
                ...(executiveRaw.bluf ?? {})
            },
            pyramid: {
                ...DEFAULT_STATE.executiveMessageSection.pyramid,
                ...(executiveRaw.pyramid ?? {})
            },
            scqa: {
                ...DEFAULT_STATE.executiveMessageSection.scqa,
                ...(executiveRaw.scqa ?? {})
            },
            clarityTest: EXECUTIVE_TEST_QUESTIONS.map((question, index) => {
                const candidate = clarityRaw[index]
                return {
                    question,
                    verdict: candidate?.verdict === 'yes' || candidate?.verdict === 'no' ? candidate.verdict : '',
                    adjustment: typeof candidate?.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        }
    }
}

export function WB5Digital() {
    const [state, setState] = useState<WB5State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]))
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [showExecutiveHelp, setShowExecutiveHelp] = useState(false)
    const [showExecutiveExampleStep1, setShowExecutiveExampleStep1] = useState(false)
    const [showExecutiveExampleStep2, setShowExecutiveExampleStep2] = useState(false)
    const [showExecutiveExampleStep3, setShowExecutiveExampleStep3] = useState(false)
    const [showExecutiveExampleStep4, setShowExecutiveExampleStep4] = useState(false)

    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            const rawState = window.localStorage.getItem(STORAGE_KEY)
            if (rawState) {
                setState(normalizeState(JSON.parse(rawState)))
            }

            const introSeen = window.localStorage.getItem(INTRO_SEEN_KEY) === '1'
            setHasSeenPresentationOnce(introSeen)

            const rawPage = window.localStorage.getItem(PAGE_STORAGE_KEY)
            if (rawPage) {
                const parsed = Number(rawPage)
                if (PAGES.some((page) => page.id === parsed)) {
                    setActivePage(!introSeen && parsed > 2 ? 1 : (parsed as WorkbookPageId))
                }
            }

            const rawVisited = window.localStorage.getItem(VISITED_STORAGE_KEY)
            if (rawVisited) {
                const parsedVisited = JSON.parse(rawVisited) as number[]
                const validVisited = parsedVisited.filter((page) => PAGES.some((candidate) => candidate.id === page))
                if (validVisited.length > 0) {
                    setVisitedPages(new Set(validVisited))
                }
            }
        } catch {
            setState(DEFAULT_STATE)
            setActivePage(1)
            setVisitedPages(new Set([1]))
        } finally {
            setIsHydrated(true)
        }
    }, [])

    useEffect(() => {
        if (!isHydrated || typeof window === 'undefined') return
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        window.localStorage.setItem(PAGE_STORAGE_KEY, String(activePage))
        window.localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(Array.from(visitedPages)))
        window.localStorage.setItem(INTRO_SEEN_KEY, hasSeenPresentationOnce ? '1' : '0')
    }, [activePage, hasSeenPresentationOnce, isHydrated, state, visitedPages])

    useEffect(() => {
        if (!isHydrated || hasSeenPresentationOnce || activePage !== 2) {
            return
        }

        setHasSeenPresentationOnce(true)
        setVisitedPages((prev) => {
            const next = new Set(prev)
            next.add(2)
            return next
        })
    }, [activePage, hasSeenPresentationOnce, isHydrated])

    useEffect(() => {
        return () => {
            if (feedbackTimeoutRef.current) {
                clearTimeout(feedbackTimeoutRef.current)
            }
        }
    }, [])

    const announceSave = (message: string) => {
        setSaveFeedback(message)
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current)
        }
        feedbackTimeoutRef.current = setTimeout(() => {
            setSaveFeedback('')
        }, 3200)
    }

    const markVisited = (pageId: WorkbookPageId) => {
        setVisitedPages((prev) => {
            const next = new Set(prev)
            next.add(pageId)
            return next
        })
    }

    const jumpToPage = (pageId: WorkbookPageId) => {
        if (!hasSeenPresentationOnce && pageId > 2) {
            setActivePage(2)
            markVisited(2)
            announceSave('Revisa primero la Presentación del workbook.')
            return
        }

        setActivePage(pageId)
        markVisited(pageId)
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const currentPageIndex = PAGES.findIndex((page) => page.id === activePage)
    const hasPrevPage = currentPageIndex > 0
    const hasNextPage = currentPageIndex >= 0 && currentPageIndex < PAGES.length - 1

    const goPrevPage = () => {
        if (!hasPrevPage) return
        jumpToPage(PAGES[currentPageIndex - 1].id)
    }

    const goNextPage = () => {
        if (!hasNextPage) return
        jumpToPage(PAGES[currentPageIndex + 1].id)
    }

    const savePage = (pageId: WorkbookPageId = activePage) => {
        markVisited(pageId)
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
            window.localStorage.setItem(PAGE_STORAGE_KEY, String(pageId))
        }
        announceSave(`Página ${pageId} guardada.`)
    }

    const updateIdentification = (field: keyof WB5State['identification'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateBluf = (
        field: keyof WB5State['executiveMessageSection']['bluf'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveMessageSection: {
                ...prev.executiveMessageSection,
                bluf: {
                    ...prev.executiveMessageSection.bluf,
                    [field]: value
                }
            }
        }))
    }

    const updatePyramid = (
        field: keyof WB5State['executiveMessageSection']['pyramid'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveMessageSection: {
                ...prev.executiveMessageSection,
                pyramid: {
                    ...prev.executiveMessageSection.pyramid,
                    [field]: value
                }
            }
        }))
    }

    const updateScqa = (
        field: keyof WB5State['executiveMessageSection']['scqa'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveMessageSection: {
                ...prev.executiveMessageSection,
                scqa: {
                    ...prev.executiveMessageSection.scqa,
                    [field]: value
                }
            }
        }))
    }

    const updateExecutiveTest = (
        rowIndex: number,
        field: keyof WB5State['executiveMessageSection']['clarityTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveMessageSection: {
                ...prev.executiveMessageSection,
                clarityTest: prev.executiveMessageSection.clarityTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? (value as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveExecutiveBlock = (blockLabel: string) => {
        markVisited(3)
        announceSave(`${blockLabel} guardado.`)
    }

    const waitForRenderCycle = () =>
        new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })

    const exportPdf = async () => {
        if (typeof window === 'undefined') return
        setIsExporting(true)
        setIsExportingAll(true)
        await waitForRenderCycle()
        try {
            const currentTitle = document.title
            document.title = 'WB5 - Comunicación ejecutiva y estratégica'
            window.print()
            document.title = currentTitle
            announceSave('PDF completo generado (usa "Guardar como PDF" en el diálogo).')
        } finally {
            setIsExportingAll(false)
            setIsExporting(false)
        }
    }

    const exportHtml = async () => {
        if (typeof window === 'undefined') return
        setIsExporting(true)
        setIsExportingAll(true)
        await waitForRenderCycle()
        try {
            const origin = window.location.origin
            let htmlContent = '<!doctype html>\n' + document.documentElement.outerHTML
            htmlContent = htmlContent.replace(/\b(href|src)=\"\/(?!\/)/g, `$1=\"${origin}/`)

            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'WB5-comunicacion-ejecutiva-estrategica-completo.html'
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)
            announceSave('HTML completo exportado con todos los datos.')
        } finally {
            setIsExportingAll(false)
            setIsExporting(false)
        }
    }

    const computeTokenSimilarity = (left: string, right: string) => {
        const leftTokens = new Set(
            left
                .toLowerCase()
                .replace(/[^\p{L}\p{N}\s]/gu, ' ')
                .split(/\s+/)
                .filter((token) => token.length > 2)
        )
        const rightTokens = new Set(
            right
                .toLowerCase()
                .replace(/[^\p{L}\p{N}\s]/gu, ' ')
                .split(/\s+/)
                .filter((token) => token.length > 2)
        )

        if (leftTokens.size === 0 || rightTokens.size === 0) return 0

        const intersection = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length
        const union = new Set([...Array.from(leftTokens), ...Array.from(rightTokens)]).size
        return union === 0 ? 0 : intersection / union
    }

    const executiveBluf = state.executiveMessageSection.bluf
    const executivePyramid = state.executiveMessageSection.pyramid
    const executiveScqa = state.executiveMessageSection.scqa
    const executiveClarityTest = state.executiveMessageSection.clarityTest

    const blufCompleted = Object.values(executiveBluf).every((value) => value.trim().length > 0)
    const pyramidCompleted = Object.values(executivePyramid).every((value) => value.trim().length > 0)
    const scqaCompleted = Object.values(executiveScqa).every((value) => value.trim().length > 0)
    const executiveTestCompleted = executiveClarityTest.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)
    const executiveSectionCompleted = blufCompleted && pyramidCompleted && scqaCompleted && executiveTestCompleted

    const bottomLineWordCount = executiveBluf.bottomLine.trim().split(/\s+/).filter(Boolean).length
    const bottomLineTooLong = bottomLineWordCount > 18

    const argumentTexts = [
        executivePyramid.argumentOne,
        executivePyramid.argumentTwo,
        executivePyramid.argumentThree
    ]
        .map((argument) => argument.trim())
        .filter(Boolean)
    const repeatedArgumentByText = argumentTexts.some((argument, index) => argumentTexts.indexOf(argument) !== index)
    let repeatedArgumentBySimilarity = false
    for (let index = 0; index < argumentTexts.length; index += 1) {
        for (let comparison = index + 1; comparison < argumentTexts.length; comparison += 1) {
            if (computeTokenSimilarity(argumentTexts[index], argumentTexts[comparison]) > 0.86) {
                repeatedArgumentBySimilarity = true
            }
        }
    }
    const pyramidArgumentsRepetitive = repeatedArgumentByText || repeatedArgumentBySimilarity

    const scqaMisaligned =
        executiveScqa.question.trim().length > 0 &&
        executiveScqa.answer.trim().length > 0 &&
        computeTokenSimilarity(executiveScqa.question, executiveScqa.answer) < 0.08

    const actionClarityNeedsAdjustment = executiveClarityTest[2]?.verdict === 'no'

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: executiveSectionCompleted
    }

    const completedPages = PAGES.filter((page) => pageCompletionMap[page.id]).length
    const progressPercent = Math.round((completedPages / PAGES.length) * 100)
    const printMetaLabel = `Líder: ${state.identification.leaderName || 'Sin nombre'} · Rol: ${state.identification.role || 'Sin rol'}`

    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb5-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/workbooks-v2" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB5 - Comunicación ejecutiva y estratégica</p>
                    </div>

                    <span className={WORKBOOK_V2_EDITORIAL.classes.progressPill}>Avance: {progressPercent}%</span>
                    {saveFeedback && <span className={WORKBOOK_V2_EDITORIAL.classes.savedPill}>{saveFeedback}</span>}
                    {isExporting && <span className={WORKBOOK_V2_EDITORIAL.classes.exportingPill}>{WORKBOOK_V2_EDITORIAL.labels.exportingAll}</span>}

                    <button type="button" onClick={() => setIsLocked((prev) => !prev)} className={WORKBOOK_V2_EDITORIAL.classes.lockButton}>
                        <Lock size={14} />
                        {isLocked ? WORKBOOK_V2_EDITORIAL.labels.fieldsLocked : WORKBOOK_V2_EDITORIAL.labels.fieldsEditable}
                    </button>

                    <button
                        type="button"
                        onClick={() => savePage(activePage)}
                        disabled={isLocked || isExporting}
                        className={WORKBOOK_V2_EDITORIAL.classes.saveButton}
                    >
                        Guardar página {activePage}
                    </button>

                    <button type="button" onClick={exportPdf} disabled={isExporting} className={WORKBOOK_V2_EDITORIAL.classes.pdfButton}>
                        <Printer size={14} />
                        {isExporting ? WORKBOOK_V2_EDITORIAL.labels.pdfLoading : WORKBOOK_V2_EDITORIAL.labels.pdfDownload}
                    </button>

                    <button type="button" onClick={exportHtml} disabled={isExporting} className={WORKBOOK_V2_EDITORIAL.classes.htmlButton}>
                        <FileText size={14} />
                        {isExporting ? WORKBOOK_V2_EDITORIAL.labels.htmlLoading : WORKBOOK_V2_EDITORIAL.labels.htmlDownload}
                    </button>
                </div>
            </header>

            <main className="max-w-[1280px] mx-auto px-5 md:px-8 py-8 overflow-x-auto">
                <div className={`grid gap-6 items-start ${isExportingAll ? 'grid-cols-1 min-w-0' : 'grid-cols-[240px_minmax(0,1fr)] min-w-[920px]'}`}>
                    <aside className={`wb5-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
                        <p className={WORKBOOK_V2_EDITORIAL.classes.sidebarTitle}>{WORKBOOK_V2_EDITORIAL.labels.index}</p>
                        <nav className="space-y-1.5">
                            {PAGES.map((page) => (
                                <button
                                    key={page.id}
                                    type="button"
                                    onClick={() => jumpToPage(page.id)}
                                    disabled={page.id > 2 && !hasSeenPresentationOnce}
                                    className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                                        activePage === page.id
                                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                            : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                                    } disabled:opacity-55 disabled:cursor-not-allowed`}
                                >
                                    {page.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <section className="space-y-6">
                        {isPageVisible(1) && (
                            <article
                                className="wb5-print-page wb5-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 3"
                                data-print-title="Portada e identificación"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb5-cover-hero relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-16 w-16 md:h-20 md:w-20" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Comunicación ejecutiva y estratégica
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 5</p>
                                        <p className="text-blue-600 text-sm">Sistema: 4Shine® · Pilar: Shine Out (Presencia estratégica)</p>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 border-t border-slate-200">
                                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">Datos de identificación</h2>
                                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nombre del líder</span>
                                            <input
                                                type="text"
                                                value={state.identification.leaderName}
                                                onChange={(event) => updateIdentification('leaderName', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Ej: Andrés Tabla"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Rol actual</span>
                                            <input
                                                type="text"
                                                value={state.identification.role}
                                                onChange={(event) => updateIdentification('role', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Ej: Director / Líder"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Cohorte / Equipo</span>
                                            <input
                                                type="text"
                                                value={state.identification.cohort}
                                                onChange={(event) => updateIdentification('cohort', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Ej: Cohorte Ejecutiva 2026"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Fecha de inicio</span>
                                            <input
                                                type="date"
                                                value={state.identification.startDate}
                                                onChange={(event) => updateIdentification('startDate', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => savePage(1)}
                                            disabled={isLocked}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar datos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                savePage(1)
                                                jumpToPage(2)
                                            }}
                                            className="rounded-xl bg-blue-700 text-white px-6 py-3 text-sm font-bold hover:bg-blue-600 transition-colors"
                                        >
                                            Empezar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        )}

                        {isPageVisible(2) && (
                            <article
                                className="wb5-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 2 de 3"
                                data-print-title="Presentación del workbook"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 2</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Presentación del workbook</h2>
                                </header>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 p-5 md:p-7">
                                    <h3 className="text-lg font-bold text-slate-900">Objetivo</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Una estructura más precisa para la comunicación de impacto.',
                                            'Un método para construir mensajes ejecutivos claros y útiles.',
                                            'Herramientas para formular pedidos y promesas con mayor precisión.',
                                            'Una comprensión más estratégica de la influencia racional y emocional.',
                                            'Un framework de conversación estratégica aplicable a conversaciones clave.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Componentes trabajados en este workbook</h3>
                                        <ul className="mt-4 space-y-2.5">
                                            {[
                                                'Comunicación de impacto.',
                                                'Influencia positiva.',
                                                'Competencia conversacional (ontológica).'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-3">
                                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Competencias 4Shine que vas a activar</h3>
                                        <ul className="mt-4 space-y-2.5">
                                            {[
                                                'Escucha Activa y Empática.',
                                                'Adaptabilidad Comunicativa.',
                                                'Construcción de confianza (Trust).',
                                                'Influencia ética y persuasión.',
                                                'Reconocimiento y Feedback.',
                                                'Ingeniería del lenguaje (promesas y pedidos).'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-3">
                                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <article className="rounded-2xl border border-slate-200 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">
                                        Conductas observables asociadas (qué se debería ver en tu día a día)
                                    </h3>
                                    <p className="mt-3 text-sm text-slate-700">
                                        Usa estas conductas como referencia para escribir evidencia real (no intención):
                                    </p>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Presta atención plena (mindfulness) cuando un colaborador habla, parafraseando para confirmar entendimiento y validando los aportes.',
                                            'Se "pone en los zapatos" de sus colegas para construir relaciones de confianza y seguridad psicológica.',
                                            'Lee a su audiencia y ajusta su estilo y lenguaje (ej. técnico vs. estratégico) según el interlocutor.',
                                            'Identifica señales no verbales en los demás y modifica el ritmo o enfoque de su mensaje para mantener la sintonía y asegurar que el mensaje sea aceptado.',
                                            'Comparte información relevante de manera oportuna y honesta (transparencia), incluso las malas noticias.',
                                            'Admite abiertamente cuando "no sabe" algo y trata a todos con respeto, eliminando el miedo a represalias por reportar problemas.',
                                            'Apela a valores e ideales compartidos para generar una voluntad genuina de colaboración en el equipo.',
                                            'Reconoce públicamente los logros y da crédito explícito a los colaboradores por sus contribuciones, fomentando el orgullo colectivo.',
                                            'Brinda feedback privado, específico y centrado en la conducta (no en la persona) para corregir el rumbo y desarrollar talento.',
                                            'Hace pedidos impecables (con condiciones de satisfacción y tiempos claros) para evitar retrabajos.',
                                            'Gestiona sus promesas: si no puede cumplir, revoca o renegocia a tiempo, manteniendo la confianza.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>

                                <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Reglas de oro (para ti)</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'No respondas desde intención; responde desde conversaciones reales y recientes.',
                                            'No evalúes solo lo que dices; observa también qué efecto produce tu comunicación.',
                                            'No confundas hablar mucho con comunicar bien.',
                                            'No des por hecho que el otro entendió; verifica.',
                                            'No formules pedidos ambiguos esperando que otros “entiendan solos”.',
                                            'Si no tienes evidencia, escribe: “No tengo evidencia reciente.”'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>

                                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 md:p-6">
                                    <p className="text-sm text-emerald-800 leading-relaxed">
                                        Esta sección es informativa. En el primer ingreso todos los usuarios la verán completa; desde el segundo ingreso retomarán
                                        automáticamente la última página guardada.
                                    </p>
                                </section>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => savePage(2)}
                                        className="rounded-xl bg-blue-700 text-white px-6 py-3 text-sm font-bold hover:bg-blue-600 transition-colors"
                                    >
                                        Guardar página 2
                                    </button>
                                </div>
                            </article>
                        )}

                        {isPageVisible(3) && (
                            <article
                                className="wb5-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 3 de 3"
                                data-print-title="Estructura de mensaje ejecutivo"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Estructura de mensaje ejecutivo
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Estructura mensajes ejecutivos con claridad, jerarquía y capacidad de acción para reducir ambigüedad y dejar claro qué debe decidirse, hacerse o acordarse.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Mensaje ejecutivo: comunicación breve, jerarquizada y orientada a decisión.',
                                            'BLUF: pone la conclusión al inicio para acelerar comprensión.',
                                            'Pirámide ejecutiva: idea central superior con argumentos y evidencias de soporte.',
                                            'SCQA ejecutivo: situación, complicación, pregunta y respuesta.',
                                            'Accionabilidad: deja claro qué debe decidirse, hacerse o confirmarse.',
                                            'Condición de satisfacción: define cómo se ve un resultado bien hecho.',
                                            'Confianza conversacional: mensaje claro, honesto y consistente que evita retrabajo.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — BLUF ejecutivo (Bottom Line Up Front)</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowExecutiveExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    blufCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {blufCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-700">
                                        Empieza por lo esencial: conclusión, relevancia, acción esperada y soporte mínimo.
                                    </p>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Bottom line (idea principal)</span>
                                            <textarea
                                                rows={2}
                                                value={executiveBluf.bottomLine}
                                                onChange={(event) => updateBluf('bottomLine', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Por qué importa (so what)</span>
                                            <textarea
                                                rows={2}
                                                value={executiveBluf.whyItMatters}
                                                onChange={(event) => updateBluf('whyItMatters', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Qué debe pasar ahora (now what)</span>
                                            <textarea
                                                rows={2}
                                                value={executiveBluf.nowWhat}
                                                onChange={(event) => updateBluf('nowWhat', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Soporte mínimo 1</span>
                                            <input
                                                type="text"
                                                value={executiveBluf.supportOne}
                                                onChange={(event) => updateBluf('supportOne', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Soporte mínimo 2</span>
                                            <input
                                                type="text"
                                                value={executiveBluf.supportTwo}
                                                onChange={(event) => updateBluf('supportTwo', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Soporte mínimo 3</span>
                                            <input
                                                type="text"
                                                value={executiveBluf.supportThree}
                                                onChange={(event) => updateBluf('supportThree', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {bottomLineTooLong && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: reduce la idea principal a una frase más nítida.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Pirámide ejecutiva 1–3–3</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowExecutiveExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    pyramidCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {pyramidCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <label className="space-y-1">
                                        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 1 — Idea madre</span>
                                        <textarea
                                            rows={2}
                                            value={executivePyramid.motherIdea}
                                            onChange={(event) => updatePyramid('motherIdea', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 2 — Argumento 1</span>
                                                <textarea
                                                    rows={3}
                                                    value={executivePyramid.argumentOne}
                                                    onChange={(event) => updatePyramid('argumentOne', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 3 — Prueba / implicación 1</span>
                                                <textarea
                                                    rows={3}
                                                    value={executivePyramid.proofOne}
                                                    onChange={(event) => updatePyramid('proofOne', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                        </div>
                                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 2 — Argumento 2</span>
                                                <textarea
                                                    rows={3}
                                                    value={executivePyramid.argumentTwo}
                                                    onChange={(event) => updatePyramid('argumentTwo', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 3 — Prueba / implicación 2</span>
                                                <textarea
                                                    rows={3}
                                                    value={executivePyramid.proofTwo}
                                                    onChange={(event) => updatePyramid('proofTwo', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                        </div>
                                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 2 — Argumento 3</span>
                                                <textarea
                                                    rows={3}
                                                    value={executivePyramid.argumentThree}
                                                    onChange={(event) => updatePyramid('argumentThree', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 3 — Prueba / implicación 3</span>
                                                <textarea
                                                    rows={3}
                                                    value={executivePyramid.proofThree}
                                                    onChange={(event) => updatePyramid('proofThree', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 md:p-5">
                                        <p className="text-xs uppercase tracking-[0.14em] text-blue-700 font-semibold">Esquema visual de la pirámide 1–3–3</p>
                                        <div className="mt-3 space-y-4">
                                            <div className="mx-auto max-w-2xl rounded-xl border border-blue-200 bg-white p-4 text-center shadow-sm">
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Idea madre</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                                    {executivePyramid.motherIdea.trim() || 'Completa la idea madre para visualizarla aquí'}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {[
                                                    { title: 'Argumento 1', argument: executivePyramid.argumentOne, proof: executivePyramid.proofOne },
                                                    { title: 'Argumento 2', argument: executivePyramid.argumentTwo, proof: executivePyramid.proofTwo },
                                                    { title: 'Argumento 3', argument: executivePyramid.argumentThree, proof: executivePyramid.proofThree }
                                                ].map((item) => (
                                                    <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.title}</p>
                                                        <p className="mt-1 text-sm font-semibold text-slate-800">{item.argument.trim() || 'Sin argumento'}</p>
                                                        <div className="mt-2 h-px bg-slate-200" />
                                                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">Prueba / implicación</p>
                                                        <p className="mt-1 text-sm text-slate-700">{item.proof.trim() || 'Sin prueba'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {pyramidArgumentsRepetitive && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: diferencia mejor cada argumento para evitar repeticiones.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — SCQA ejecutivo</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowExecutiveExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    scqaCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {scqaCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Situación</span>
                                            <textarea
                                                rows={2}
                                                value={executiveScqa.situation}
                                                onChange={(event) => updateScqa('situation', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Complicación</span>
                                            <textarea
                                                rows={2}
                                                value={executiveScqa.complication}
                                                onChange={(event) => updateScqa('complication', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Pregunta / decisión que se abre</span>
                                            <textarea
                                                rows={2}
                                                value={executiveScqa.question}
                                                onChange={(event) => updateScqa('question', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Respuesta / propuesta</span>
                                            <textarea
                                                rows={2}
                                                value={executiveScqa.answer}
                                                onChange={(event) => updateScqa('answer', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {scqaMisaligned && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: alinea mejor la propuesta con la tensión planteada en la pregunta.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Test de claridad, lógica y accionabilidad</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowExecutiveExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    executiveTestCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {executiveTestCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[860px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">
                                                        Ajuste necesario
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {executiveClarityTest.map((row, rowIndex) => (
                                                    <tr key={`executive-check-${rowIndex}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <label className="inline-flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`executive-check-${rowIndex}`}
                                                                    checked={row.verdict === 'yes'}
                                                                    onChange={() => updateExecutiveTest(rowIndex, 'verdict', 'yes')}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                />
                                                            </label>
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <label className="inline-flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`executive-check-${rowIndex}`}
                                                                    checked={row.verdict === 'no'}
                                                                    onChange={() => updateExecutiveTest(rowIndex, 'verdict', 'no')}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                />
                                                            </label>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateExecutiveTest(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Escribe ajuste o Completar"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {actionClarityNeedsAdjustment && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: define explícitamente qué debe decidirse, hacerse o confirmarse.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre de la sección</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            '¿Cuál es la idea central que debe ir primero?',
                                            '¿Cómo organizar un mensaje con jerarquía y soporte?',
                                            '¿Cuándo usar BLUF y cuándo usar SCQA?',
                                            '¿Cómo traducir una idea en una estructura accionable?',
                                            '¿Cómo saber si tu mensaje está listo para una audiencia ejecutiva?'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                executiveSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {executiveSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(3)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 3
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {showExecutiveHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Estructura de mensaje ejecutivo</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• BLUF: empieza por la conclusión para reducir carga cognitiva.</p>
                                        <p>• Pirámide ejecutiva: idea madre + argumentos + pruebas.</p>
                                        <p>• SCQA: contexto estructurado sin perder foco ni accionabilidad.</p>
                                        <p>• Un buen mensaje ejecutivo reduce ambigüedad y facilita decisiones.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showExecutiveExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (BLUF)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Bottom line:</span> Necesitamos redefinir prioridades del trimestre y concentrarnos en tres frentes.</p>
                                        <p><span className="font-semibold">Por qué importa:</span> Si seguimos con cinco prioridades activas, bajará la calidad y aumentará el retrabajo.</p>
                                        <p><span className="font-semibold">Qué debe pasar ahora:</span> Hoy debemos decidir qué tres frentes quedan y cuáles salen del foco.</p>
                                        <p><span className="font-semibold">Soporte mínimo:</span> El equipo reporta saturación; hubo correcciones evitables; la capacidad no alcanza para cinco frentes.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showExecutiveExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Pirámide 1–3–3)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Idea madre:</span> Necesitamos simplificar el mensaje ejecutivo del proyecto.</li>
                                        <li><span className="font-semibold">Argumento 1:</span> La propuesta es extensa para la audiencia decisora.</li>
                                        <li><span className="font-semibold">Prueba 1:</span> El sponsor pidió “ir al punto” tres veces.</li>
                                        <li><span className="font-semibold">Argumento 2:</span> La idea principal queda diluida entre contexto.</li>
                                        <li><span className="font-semibold">Prueba 2:</span> El equipo no pudo repetir la recomendación final.</li>
                                        <li><span className="font-semibold">Argumento 3:</span> No está clara la decisión esperada.</li>
                                        <li><span className="font-semibold">Prueba 3:</span> La reunión cerró sin responsables ni siguiente paso.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showExecutiveExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (SCQA)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Situación:</span> El equipo inició el trimestre con cuatro frentes estratégicos definidos.</li>
                                        <li><span className="font-semibold">Complicación:</span> Entraron dos demandas nuevas que alteraron la capacidad real.</li>
                                        <li><span className="font-semibold">Pregunta:</span> ¿Qué debemos priorizar para no sacrificar calidad ni tiempos?</li>
                                        <li><span className="font-semibold">Respuesta:</span> Reenfocar en tres frentes, redefinir responsables y sacar del alcance lo que no cabe.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showExecutiveExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Test)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Mensaje débil:</span> “Tenemos que revisar varias cosas para mejorar cómo vamos.”</p>
                                        <p>
                                            <span className="font-semibold">Mensaje mejorado:</span> “Necesitamos redefinir prioridades hoy porque la carga actual supera la capacidad del equipo y ya está afectando calidad. Quiero cerrar esta reunión con tres focos, responsables y límites claros.”
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb5-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
                                <button type="button" onClick={goPrevPage} disabled={!hasPrevPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavPrev}>
                                    <ArrowLeft size={15} />
                                    {WORKBOOK_V2_EDITORIAL.labels.back}
                                </button>

                                <div className="text-center">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.navigation}</p>
                                    <p className="text-sm font-bold text-slate-900">{PAGES[currentPageIndex]?.shortLabel ?? 'Página'}</p>
                                </div>

                                <button type="button" onClick={goNextPage} disabled={!hasNextPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavNext}>
                                    {WORKBOOK_V2_EDITORIAL.labels.next}
                                    <ArrowRight size={15} />
                                </button>
                            </nav>
                        )}
                    </section>
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 14mm;
                    }
                    .wb5-toolbar,
                    .wb5-sidebar,
                    .wb5-page-nav {
                        display: none !important;
                    }
                    button {
                        display: none !important;
                    }
                    body {
                        background: #fff !important;
                    }
                    main {
                        padding: 0 !important;
                    }
                    main > div {
                        display: block !important;
                        min-width: 0 !important;
                    }
                    .wb5-print-page {
                        position: relative !important;
                        padding-top: 14mm !important;
                        border-top: 3px solid #1d4ed8 !important;
                    }
                    .wb5-print-page:not(.wb5-cover-page)::before {
                        content: "WB5 · Comunicación ejecutiva y estratégica · " attr(data-print-title);
                        position: absolute;
                        top: 2mm;
                        left: 0;
                        right: 0;
                        padding-bottom: 2mm;
                        border-bottom: 1px solid #cbd5e1;
                        font-size: 10px;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        font-weight: 700;
                        color: #1e3a8a;
                    }
                    .wb5-print-page::after {
                        content: attr(data-print-page) " · " attr(data-print-meta);
                        position: absolute;
                        left: 2mm;
                        right: 2mm;
                        bottom: 2mm;
                        font-size: 10px;
                        font-weight: 600;
                        color: #64748b;
                    }
                    .wb5-cover-page {
                        padding-top: 0 !important;
                        border-top: 4px solid #0f172a !important;
                    }
                    .wb5-cover-page::before {
                        content: none !important;
                    }
                    .wb5-cover-hero {
                        min-height: 240mm !important;
                        background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%) !important;
                    }
                    input,
                    textarea,
                    select {
                        border: 1px solid #cbd5e1 !important;
                        background: #fff !important;
                        color: #0f172a !important;
                    }
                    article.rounded-3xl {
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    )
}
