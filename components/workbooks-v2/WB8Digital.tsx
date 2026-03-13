'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3
type YesNoAnswer = '' | 'yes' | 'no'
type Score15 = '' | '1' | '2' | '3' | '4' | '5'
type LadderLevel = 'Entrada' | 'Núcleo' | 'Escalamiento'

type WorkbookPage = {
    id: WorkbookPageId
    label: string
    shortLabel: string
}

type WB8State = {
    identification: {
        leaderName: string
        role: string
        cohort: string
        startDate: string
    }
    valueLadderSection: {
        assetsInventory: string[]
        problemTransformationRows: Array<{
            solvableProblem: string
            facilitatedTransformation: string
            supportingAsset: string
            naturalFormat: string
        }>
        ladderRows: Array<{
            level: LadderLevel
            offerName: string
            solvedProblem: string
            mainOutcome: string
            deliveryFormat: string
            durationScope: string
        }>
        ladderCoherenceTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
        focusDecisionRows: Array<{
            offer: string
            problemClarity: Score15
            deliveryCapability: Score15
            differentiation: Score15
            adoptionEase: Score15
            expectedReturn: Score15
        }>
        packagingTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
}

const PAGES: WorkbookPage[] = [
    { id: 1, label: '1. Portada e identificación', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Escalera de valor', shortLabel: 'Escalera de valor' }
]

const STORAGE_KEY = 'workbooks-v2-wb8-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb8-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb8-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb8-presentation-seen'

const ASSETS_ROWS = 8
const MATRIX_ROWS = 3
const FOCUS_ROWS = 3

const LADDER_LEVELS: LadderLevel[] = ['Entrada', 'Núcleo', 'Escalamiento']

const FORMAT_OPTIONS = [
    'Workshop',
    'Mentoría',
    'Sesión 1:1',
    'Taller',
    'Programa',
    'Consultoría',
    'Diagnóstico',
    'Contenido asíncrono',
    'Framework / plantilla'
] as const

const LADDER_COHERENCE_QUESTIONS = [
    '¿Cada nivel resuelve un problema claro?',
    '¿Hay progresión lógica entre niveles?',
    '¿La oferta de entrada abre camino a la núcleo?',
    '¿La oferta núcleo concentra mi mayor valor?',
    '¿La oferta premium escala profundidad real?',
    '¿Las ofertas son fáciles de entender?'
] as const

const PACKAGING_TEST_QUESTIONS = [
    '¿Identifiqué mis activos de conocimiento?',
    '¿Los conecté con problemas y transformación?',
    '¿Mi escalera de valor se entiende?',
    '¿Los niveles están bien diferenciados?',
    '¿Definí una oferta prioritaria?',
    '¿Mi talento ya está empaquetado con más claridad?'
] as const

const TRANSFERABLE_ASSET_SIGNALS = [
    'capacidad',
    'metod',
    'framework',
    'diagnóstico',
    'ruta',
    'síntesis',
    'facilitación',
    'modelo',
    'proceso',
    'herramienta'
] as const

const VAGUE_TRANSFORMATION_TERMS = ['mejorar', 'apoyar', 'ayudar', 'acompañar', 'optimizar', 'potenciar'] as const

const readString = (value: unknown): string => (typeof value === 'string' ? value : '')
const readYesNo = (value: unknown): YesNoAnswer => (value === 'yes' || value === 'no' ? value : '')
const readScore = (value: unknown): Score15 => (value === '1' || value === '2' || value === '3' || value === '4' || value === '5' ? value : '')

const buildFocusPriority = (row: WB8State['valueLadderSection']['focusDecisionRows'][number]): string => {
    const scores = [row.problemClarity, row.deliveryCapability, row.differentiation, row.adoptionEase, row.expectedReturn]
    if (scores.some((item) => item === '')) return ''
    const total = scores.reduce((sum, item) => sum + Number(item), 0)
    if (total >= 23) return 'Muy alta'
    if (total >= 19) return 'Alta'
    if (total >= 15) return 'Media'
    return 'Baja'
}

const computeTokenSimilarity = (left: string, right: string): number => {
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

const DEFAULT_STATE: WB8State = {
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    valueLadderSection: {
        assetsInventory: Array.from({ length: ASSETS_ROWS }, () => ''),
        problemTransformationRows: Array.from({ length: MATRIX_ROWS }, () => ({
            solvableProblem: '',
            facilitatedTransformation: '',
            supportingAsset: '',
            naturalFormat: ''
        })),
        ladderRows: LADDER_LEVELS.map((level) => ({
            level,
            offerName: '',
            solvedProblem: '',
            mainOutcome: '',
            deliveryFormat: '',
            durationScope: ''
        })),
        ladderCoherenceTest: LADDER_COHERENCE_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        })),
        focusDecisionRows: Array.from({ length: FOCUS_ROWS }, () => ({
            offer: '',
            problemClarity: '' as Score15,
            deliveryCapability: '' as Score15,
            differentiation: '' as Score15,
            adoptionEase: '' as Score15,
            expectedReturn: '' as Score15
        })),
        packagingTest: PACKAGING_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    }
}

const normalizeState = (raw: unknown): WB8State => {
    if (!raw || typeof raw !== 'object') return DEFAULT_STATE
    const parsed = raw as Record<string, unknown>
    const identification = (parsed.identification ?? {}) as Record<string, unknown>
    const valueLadderSection = (parsed.valueLadderSection ?? {}) as Record<string, unknown>

    const rawAssetsInventory = Array.isArray(valueLadderSection.assetsInventory) ? valueLadderSection.assetsInventory : []
    const rawMatrixRows = Array.isArray(valueLadderSection.problemTransformationRows) ? valueLadderSection.problemTransformationRows : []
    const rawLadderRows = Array.isArray(valueLadderSection.ladderRows) ? valueLadderSection.ladderRows : []
    const rawLadderCoherenceTest = Array.isArray(valueLadderSection.ladderCoherenceTest) ? valueLadderSection.ladderCoherenceTest : []
    const rawFocusRows = Array.isArray(valueLadderSection.focusDecisionRows) ? valueLadderSection.focusDecisionRows : []
    const rawPackagingTest = Array.isArray(valueLadderSection.packagingTest) ? valueLadderSection.packagingTest : []

    return {
        identification: {
            leaderName: readString(identification.leaderName),
            role: readString(identification.role),
            cohort: readString(identification.cohort),
            startDate: readString(identification.startDate)
        },
        valueLadderSection: {
            assetsInventory: Array.from({ length: ASSETS_ROWS }, (_, index) => readString(rawAssetsInventory[index])),
            problemTransformationRows: Array.from({ length: MATRIX_ROWS }, (_, index) => {
                const row = (rawMatrixRows[index] ?? {}) as Record<string, unknown>
                return {
                    solvableProblem: readString(row.solvableProblem),
                    facilitatedTransformation: readString(row.facilitatedTransformation),
                    supportingAsset: readString(row.supportingAsset),
                    naturalFormat: readString(row.naturalFormat)
                }
            }),
            ladderRows: LADDER_LEVELS.map((level, index) => {
                const row = (rawLadderRows[index] ?? {}) as Record<string, unknown>
                return {
                    level,
                    offerName: readString(row.offerName),
                    solvedProblem: readString(row.solvedProblem),
                    mainOutcome: readString(row.mainOutcome),
                    deliveryFormat: readString(row.deliveryFormat),
                    durationScope: readString(row.durationScope)
                }
            }),
            ladderCoherenceTest: LADDER_COHERENCE_QUESTIONS.map((question, index) => {
                const row = (rawLadderCoherenceTest[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(row.verdict),
                    adjustment: readString(row.adjustment)
                }
            }),
            focusDecisionRows: Array.from({ length: FOCUS_ROWS }, (_, index) => {
                const row = (rawFocusRows[index] ?? {}) as Record<string, unknown>
                return {
                    offer: readString(row.offer),
                    problemClarity: readScore(row.problemClarity),
                    deliveryCapability: readScore(row.deliveryCapability),
                    differentiation: readScore(row.differentiation),
                    adoptionEase: readScore(row.adoptionEase),
                    expectedReturn: readScore(row.expectedReturn)
                }
            }),
            packagingTest: PACKAGING_TEST_QUESTIONS.map((question, index) => {
                const row = (rawPackagingTest[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(row.verdict),
                    adjustment: readString(row.adjustment)
                }
            })
        }
    }
}

export function WB8Digital() {
    const [state, setState] = useState<WB8State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]))
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [showValueLadderHelp, setShowValueLadderHelp] = useState(false)

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
                    setActivePage(parsed as WorkbookPageId)
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
        if (!isHydrated || hasSeenPresentationOnce || activePage !== 2) return

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
        const pageNumber = PAGES.findIndex((page) => page.id === pageId)
        announceSave(`Página ${pageNumber >= 0 ? pageNumber + 1 : pageId} guardada.`)
    }

    const updateIdentification = (field: keyof WB8State['identification'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateAssetInventory = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const assetsInventory = [...prev.valueLadderSection.assetsInventory]
            assetsInventory[index] = value
            return {
                ...prev,
                valueLadderSection: {
                    ...prev.valueLadderSection,
                    assetsInventory
                }
            }
        })
    }

    const updateProblemTransformationRow = (
        index: number,
        field: keyof WB8State['valueLadderSection']['problemTransformationRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const problemTransformationRows = [...prev.valueLadderSection.problemTransformationRows]
            problemTransformationRows[index] = {
                ...problemTransformationRows[index],
                [field]: value
            }
            return {
                ...prev,
                valueLadderSection: {
                    ...prev.valueLadderSection,
                    problemTransformationRows
                }
            }
        })
    }

    const updateLadderRow = (
        index: number,
        field: keyof Omit<WB8State['valueLadderSection']['ladderRows'][number], 'level'>,
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const ladderRows = [...prev.valueLadderSection.ladderRows]
            ladderRows[index] = {
                ...ladderRows[index],
                [field]: value
            }
            return {
                ...prev,
                valueLadderSection: {
                    ...prev.valueLadderSection,
                    ladderRows
                }
            }
        })
    }

    const updateLadderCoherenceTestRow = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const ladderCoherenceTest = [...prev.valueLadderSection.ladderCoherenceTest]
            ladderCoherenceTest[index] =
                field === 'verdict'
                    ? { ...ladderCoherenceTest[index], verdict: readYesNo(value) }
                    : { ...ladderCoherenceTest[index], adjustment: value }
            return {
                ...prev,
                valueLadderSection: {
                    ...prev.valueLadderSection,
                    ladderCoherenceTest
                }
            }
        })
    }

    const updateFocusDecisionRow = (
        index: number,
        field: keyof WB8State['valueLadderSection']['focusDecisionRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const focusDecisionRows = [...prev.valueLadderSection.focusDecisionRows]
            if (field === 'offer') {
                focusDecisionRows[index] = {
                    ...focusDecisionRows[index],
                    offer: value
                }
            } else {
                focusDecisionRows[index] = {
                    ...focusDecisionRows[index],
                    [field]: readScore(value)
                }
            }
            return {
                ...prev,
                valueLadderSection: {
                    ...prev.valueLadderSection,
                    focusDecisionRows
                }
            }
        })
    }

    const updatePackagingTestRow = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const packagingTest = [...prev.valueLadderSection.packagingTest]
            packagingTest[index] =
                field === 'verdict'
                    ? { ...packagingTest[index], verdict: readYesNo(value) }
                    : { ...packagingTest[index], adjustment: value }
            return {
                ...prev,
                valueLadderSection: {
                    ...prev.valueLadderSection,
                    packagingTest
                }
            }
        })
    }

    const saveValueLadderBlock = (label: string) => {
        savePage(3)
        announceSave(`${label} guardado.`)
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
            document.title = 'WB8 - Pensamiento estratégico y toma de decisiones'
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
            link.download = 'WB8-pensamiento-estrategico-completo.html'
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

    const valueLadderSection = state.valueLadderSection
    const assetsInventory = valueLadderSection.assetsInventory
    const nonEmptyAssets = assetsInventory.map((item) => item.trim()).filter((item) => item.length > 0)

    const assetsCompleted = assetsInventory.every((item) => item.trim().length > 0)
    const matrixCompleted = valueLadderSection.problemTransformationRows.every(
        (row) =>
            row.solvableProblem.trim().length > 0 &&
            row.facilitatedTransformation.trim().length > 0 &&
            row.supportingAsset.trim().length > 0 &&
            row.naturalFormat.trim().length > 0
    )
    const ladderCompleted = valueLadderSection.ladderRows.every(
        (row) =>
            row.offerName.trim().length > 0 &&
            row.solvedProblem.trim().length > 0 &&
            row.mainOutcome.trim().length > 0 &&
            row.deliveryFormat.trim().length > 0 &&
            row.durationScope.trim().length > 0
    )
    const coherenceCompleted = valueLadderSection.ladderCoherenceTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const focusCompleted = valueLadderSection.focusDecisionRows.every(
        (row) =>
            row.offer.trim().length > 0 &&
            row.problemClarity !== '' &&
            row.deliveryCapability !== '' &&
            row.differentiation !== '' &&
            row.adoptionEase !== '' &&
            row.expectedReturn !== ''
    )
    const packagingCompleted = valueLadderSection.packagingTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )

    const section3Completed = assetsCompleted && matrixCompleted && ladderCompleted && coherenceCompleted && focusCompleted && packagingCompleted

    const assetsOnlyThemes =
        nonEmptyAssets.length > 0 &&
        nonEmptyAssets.every((asset) => {
            const normalized = asset.toLowerCase()
            return !TRANSFERABLE_ASSET_SIGNALS.some((signal) => normalized.includes(signal))
        })

    const ladderSummaries = valueLadderSection.ladderRows.map((row) => `${row.offerName} ${row.solvedProblem} ${row.mainOutcome}`.trim())
    let similarOffers = false
    for (let index = 0; index < ladderSummaries.length; index += 1) {
        for (let comparison = index + 1; comparison < ladderSummaries.length; comparison += 1) {
            if (computeTokenSimilarity(ladderSummaries[index], ladderSummaries[comparison]) > 0.82) {
                similarOffers = true
            }
        }
    }

    const noPriorityOffer = valueLadderSection.focusDecisionRows.every((row) => buildFocusPriority(row).length === 0)

    const vagueTransformation = valueLadderSection.problemTransformationRows.some((row) => {
        const transformed = row.facilitatedTransformation.trim().toLowerCase()
        if (transformed.length === 0) return false
        return transformed.length < 24 || VAGUE_TRANSFORMATION_TERMS.some((term) => transformed.includes(term))
    })

    const ladderMinimumDesigned = valueLadderSection.ladderRows.every(
        (row) => row.offerName.trim().length > 0 && row.solvedProblem.trim().length > 0 && row.mainOutcome.trim().length > 0
    )

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: section3Completed
    }

    const completedPages = PAGES.filter((page) => pageCompletionMap[page.id]).length
    const progressPercent = Math.round((completedPages / PAGES.length) * 100)
    const printMetaLabel = `Líder: ${state.identification.leaderName || 'Sin nombre'} · Rol: ${state.identification.role || 'Sin rol'}`

    const currentPage = PAGES[currentPageIndex]
    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId

    if (!isHydrated) {
        return <div className="p-6 text-sm text-slate-500">Cargando workbook...</div>
    }

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb8-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/workbooks-v2" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB8 - Pensamiento estratégico y toma de decisiones</p>
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
                        Guardar página {currentPage ? currentPageIndex + 1 : activePage}
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
                    <aside className={`wb8-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
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
                                className="wb8-print-page wb8-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 3"
                                data-print-title="Portada e identificación"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb8-cover-hero relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-16 w-16 md:h-20 md:w-20" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Pensamiento estratégico y toma de decisiones
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 8</p>
                                        <p className="text-blue-600 text-sm">Sistema: 4Shine® · Pilar: Shine Up (Ecosistema relacional)</p>
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
                                </div>
                            </article>
                        )}

                        {isPageVisible(2) && (
                            <article
                                className="wb8-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-6 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 2 de 3"
                                data-print-title="Presentación del workbook"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 2</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Presentación del workbook
                                    </h2>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Objetivo</h3>
                                    <p className="text-sm md:text-[15px] text-slate-700 leading-relaxed">
                                        Diseñar una lógica estratégica para convertir conocimiento, experiencia y capacidades en propuestas de valor visibles,
                                        sostenibles y medibles, de modo que tu talento deje de estar disperso y pueda traducirse en oferta,
                                        posicionamiento y retorno.
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">Al finalizar este workbook tendrás:</p>
                                    <ul className="space-y-2">
                                        {[
                                            'Una escalera de valor para empaquetar tu conocimiento en ofertas.',
                                            'Un modelo de negocio personal/profesional para monetizar tu talento en escenarios internos y externos.',
                                            'Una estrategia de visibilidad conectada con contenidos y canales.',
                                            'Un tablero de control con KPIs de alcance, conversión y retorno.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Componentes trabajados</h3>
                                    <ul className="space-y-2">
                                        {[
                                            'Visión de futuro y estrategia',
                                            'Toma de decisiones y resolución de problemas',
                                            'Adaptabilidad e innovación',
                                            'Agilidad tecnológica (tech-savviness)'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Competencias 4Shine que vas a activar</h3>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {[
                                            'Pensamiento estratégico',
                                            'Visión compartida (visioning)',
                                            'Gestión del error constructivo',
                                            'Decisión bajo incertidumbre',
                                            'Estimulación intelectual (innovación)',
                                            'Agilidad y adaptabilidad',
                                            'Resolución de causa raíz',
                                            'Liderazgo en la industria 5.0'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Conductas observables asociadas (qué se debería ver en tu día a día)</h3>
                                    <p className="text-sm text-slate-700">Usa estas conductas como referencia para escribir evidencia real (no intención):</p>
                                    <ul className="space-y-2">
                                        {[
                                            'Analiza tendencias macroeconómicas, tecnológicas y de la industria para anticipar impactos internos y externos.',
                                            'No se limita a apagar fuegos a corto plazo; dedica tiempo a planificación e iniciativas de largo alcance.',
                                            'Articula un escenario futuro aspiracional y moviliza visión compartida en el equipo.',
                                            'Comunica el por qué detrás de las metas para dar sentido y propósito al trabajo diario.',
                                            'Traduce la visión abstracta en objetivos SMART y planes de acción concretos.',
                                            'Asegura línea de vista entre tareas cotidianas, metas de corto plazo y estrategia general.',
                                            'Reúne datos y consulta expertos, pero decide a tiempo aun con información incompleta.',
                                            'Asume responsabilidad por las consecuencias de sus decisiones sin buscar culpables externos.',
                                            'Investiga causa raíz y evita quedarse en síntomas superficiales.',
                                            'Cuestiona suposiciones para reducir sesgos antes de decidir.',
                                            'Ajusta estrategia ante cambios tecnológicos o regulatorios, abandonando ideas que ya no funcionan.',
                                            'Fomenta una cultura donde el cambio se vive como oportunidad y no como amenaza.',
                                            'Desafía el statu quo y promueve nuevas formas de trabajo.',
                                            'Impulsa pilotos y pruebas de concepto antes de escalar soluciones.',
                                            'Respalda al equipo cuando un experimento falla y orienta el aprendizaje.',
                                            'Reduce el factor miedo y habilita riesgos calculados orientados a innovación.',
                                            'Promueve adopción de herramientas digitales cuidando el bienestar del equipo.',
                                            'Traduce conceptos tecnológicos complejos a decisiones estratégicas de negocio.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Reglas de oro</h3>
                                    <ul className="space-y-2">
                                        {[
                                            'No diseñes ofertas desde lo que “te gusta”; diséñalas desde valor real.',
                                            'No confundas visibilidad con ruido.',
                                            'No intentes monetizar todo al tiempo.',
                                            'Lo que no se empaqueta, no se entiende; lo que no se mide, no se mejora.',
                                            'Toda estrategia necesita una decisión de foco.',
                                            'Si no tienes evidencia, escribe: “No tengo evidencia reciente.”'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                        <p className="text-sm text-blue-900 font-semibold">Instrucción de continuidad</p>
                                        <p className="text-sm text-slate-700 mt-1">
                                            Esta sección de presentación es informativa para el primer ingreso. Desde el segundo ingreso, el sistema retoma en la última página trabajada.
                                        </p>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(3) && (
                            <article
                                className="wb8-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 3 de 3"
                                data-print-title="Escalera de valor"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Escalera de valor: empaquetado de conocimiento en ofertas
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Convertir tu conocimiento, experiencia y capacidad de resolver problemas en una escalera de ofertas progresivas,
                                        para que tu valor deje de estar implícito y pueda ser entendido, probado y escalado.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowValueLadderHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Escalera de valor: arquitectura de ofertas organizada por niveles de profundidad, complejidad, transformación y precio/retorno.',
                                            'Oferta de entrada: propuesta de bajo umbral que permite mostrar valor rápido y generar primera confianza.',
                                            'Oferta núcleo: propuesta central donde se concentra tu mayor capacidad de resolver un problema relevante.',
                                            'Oferta premium o de escalamiento: propuesta de mayor profundidad, personalización, complejidad o impacto.',
                                            'Empaquetado de conocimiento: proceso de traducir saber, experiencia o criterio en un producto, servicio, formato o intervención legible.',
                                            'Problema pagable: problema por el que una persona, organización o sistema estaría dispuesto a invertir recursos, tiempo o atención.',
                                            'Activo de conocimiento: recurso reutilizable derivado de tu experiencia, como frameworks, metodologías, diagnósticos, rutas, plantillas, workshops, mentorías o contenidos.',
                                            'Transformación ofrecida: cambio concreto que una oferta promete facilitar.',
                                            'Gradiente de valor: progresión entre una oferta básica y una oferta avanzada, donde cada nivel aumenta claridad, profundidad o resultado.',
                                            'Fricción de compra o adopción: barrera que dificulta que una persona o sistema tome tu oferta, aunque el valor exista.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Inventario de activos de conocimiento</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                assetsCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {assetsCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Lista activos reales: conocimientos, experiencias transferibles, metodologías, formatos y resultados que ya sabes producir.',
                                                'Evita listar temas genéricos; enfócate en capacidades y recursos transferibles.',
                                                'Usa evidencia de los últimos proyectos, conversaciones o entregables.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Activo 1: capacidad de traducir complejidad en estructura.',
                                                'Activo 2: diseño de herramientas de desarrollo.',
                                                'Activo 3: facilitación de procesos estratégicos.',
                                                'Activo 4: lectura de brechas de liderazgo.',
                                                'Activo 5: construcción de narrativas ejecutivas.',
                                                'Activo 6: diseño de rutas de aprendizaje.',
                                                'Activo 7: frameworks aplicados.',
                                                'Activo 8: capacidad de síntesis estratégica.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {valueLadderSection.assetsInventory.map((asset, index) => (
                                            <label key={`wb8-asset-${index}`} className="space-y-1 block">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Activo {index + 1}</span>
                                                <input
                                                    type="text"
                                                    value={asset}
                                                    onChange={(event) => updateAssetInventory(index, event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveValueLadderBlock('Paso 1 — Inventario de activos')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz problema–transformación–activo</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                matrixCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {matrixCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Conecta cada problema que sabes resolver con una transformación concreta.',
                                                'Selecciona el activo que realmente sostiene esa transformación.',
                                                'Define el formato natural de entrega (sesión, taller, programa, consultoría, etc.).'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Falta de claridad estratégica | Ordenar foco y decisión | Síntesis + frameworks | Workshop / mentoría.',
                                                'Narrativa profesional difusa | Hacer visible valor con claridad | Storytelling ejecutivo | Sesión 1:1 / taller.',
                                                'Conocimiento disperso | Convertirlo en oferta legible | Ruta metodológica | Programa / consultoría.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1180px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Problema que sé resolver</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Transformación que puedo facilitar</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Activo que lo sostiene</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Formato natural</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valueLadderSection.problemTransformationRows.map((row, index) => (
                                                    <tr key={`wb8-matrix-row-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.solvableProblem}
                                                                onChange={(event) => updateProblemTransformationRow(index, 'solvableProblem', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.facilitatedTransformation}
                                                                onChange={(event) => updateProblemTransformationRow(index, 'facilitatedTransformation', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[250px]">
                                                            <select
                                                                value={row.supportingAsset}
                                                                onChange={(event) => updateProblemTransformationRow(index, 'supportingAsset', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona activo</option>
                                                                {nonEmptyAssets.map((asset, assetIndex) => (
                                                                    <option key={`wb8-asset-option-${assetIndex}-${asset}`} value={asset}>
                                                                        {asset}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[250px]">
                                                            <input
                                                                type="text"
                                                                value={row.naturalFormat}
                                                                onChange={(event) => updateProblemTransformationRow(index, 'naturalFormat', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveValueLadderBlock('Paso 2 — Matriz problema-transformación-activo')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Diseño de escalera de valor</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                ladderCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {ladderCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Diseña 3 niveles mínimos: Entrada, Núcleo y Escalamiento.',
                                                'Diferencia problema, resultado, formato y alcance para cada nivel.',
                                                'Asegura un gradiente real de valor entre niveles.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Entrada | Diagnóstico express | Falta de claridad inicial | Mapa rápido de foco | Sesión breve | 60 min.',
                                                'Núcleo | Ruta estratégica | Dispersión de talento/mensaje | Propuesta estructurada | Programa/consultoría | 4–6 semanas.',
                                                'Escalamiento | Acompañamiento premium | Implementación profunda | Transformación sostenida | Mentoría | 3 meses.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1280px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nivel</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nombre de la oferta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Problema que resuelve</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Resultado principal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Formato</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Duración / alcance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valueLadderSection.ladderRows.map((row, index) => (
                                                    <tr key={`wb8-ladder-row-${row.level}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.level}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.offerName}
                                                                onChange={(event) => updateLadderRow(index, 'offerName', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.solvedProblem}
                                                                onChange={(event) => updateLadderRow(index, 'solvedProblem', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.mainOutcome}
                                                                onChange={(event) => updateLadderRow(index, 'mainOutcome', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.deliveryFormat}
                                                                onChange={(event) => updateLadderRow(index, 'deliveryFormat', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {FORMAT_OPTIONS.map((option) => (
                                                                    <option key={`wb8-ladder-format-${row.level}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.durationScope}
                                                                onChange={(event) => updateLadderRow(index, 'durationScope', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-3">
                                        <h4 className="text-sm font-bold text-slate-900">Esquema visual de escalera</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {valueLadderSection.ladderRows.map((row, index) => (
                                                <div
                                                    key={`wb8-ladder-visual-${row.level}`}
                                                    className={`rounded-xl border bg-white p-3 ${
                                                        index === 1
                                                            ? 'border-blue-500 shadow-[0_6px_18px_rgba(59,130,246,0.18)]'
                                                            : 'border-blue-200'
                                                    }`}
                                                >
                                                    <p className="text-xs uppercase tracking-[0.14em] text-blue-700 font-semibold">{row.level}</p>
                                                    <p className="mt-2 text-sm font-bold text-slate-900">{row.offerName || 'Define nombre de oferta'}</p>
                                                    <p className="mt-1 text-xs text-slate-600">{row.mainOutcome || 'Define resultado principal'}</p>
                                                    <p className="mt-1 text-xs text-slate-500">{row.durationScope || 'Define duración / alcance'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </article>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveValueLadderBlock('Paso 3 — Diseño de escalera de valor')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Test de coherencia de la escalera</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                coherenceCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {coherenceCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Verifica si cada nivel resuelve un problema claro.',
                                                'Confirma que exista progresión lógica entre entrada, núcleo y escalamiento.',
                                                'Asegura que la oferta de entrada abra camino al nivel núcleo.',
                                                'Valida que la oferta núcleo concentre tu mayor valor y que la premium escale profundidad real.',
                                                'Comprueba que las ofertas se entiendan con facilidad.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Señal débil: tres ofertas que parecen lo mismo con nombres distintos.',
                                                'Señal mejorada: tres niveles con distinta profundidad, distinto riesgo de entrada y una progresión clara.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí / No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valueLadderSection.ladderCoherenceTest.map((row, index) => (
                                                    <tr key={`wb8-coherence-test-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updateLadderCoherenceTestRow(index, 'verdict', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="yes">Sí</option>
                                                                <option value="no">No</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateLadderCoherenceTestRow(index, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveValueLadderBlock('Paso 4 — Test de coherencia')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Mapa de decisión de foco</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                focusCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {focusCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Evalúa cada oferta por claridad del problema, capacidad real de entrega, diferenciación, facilidad de adopción y retorno esperado.',
                                                'Usa la tabla para comparar opciones y evitar dispersión.',
                                                'El análisis automático de prioridad te ayuda a elegir foco inicial con criterio.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Diagnóstico express: Claridad 5, Capacidad 5, Diferenciación 3, Adopción 5, Retorno 3, Prioridad Alta.',
                                                'Ruta estratégica: Claridad 5, Capacidad 4, Diferenciación 5, Adopción 4, Retorno 5, Prioridad Muy alta.',
                                                'Acompañamiento premium: Claridad 4, Capacidad 3, Diferenciación 4, Adopción 2, Retorno 5, Prioridad Media.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1280px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Oferta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Claridad (1-5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Capacidad (1-5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Diferenciación (1-5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Adopción (1-5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Retorno (1-5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Prioridad (auto)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valueLadderSection.focusDecisionRows.map((row, index) => {
                                                    const priority = buildFocusPriority(row)
                                                    return (
                                                        <tr key={`wb8-focus-row-${index}`}>
                                                            <td className="px-3 py-2 border-b border-slate-100 w-[230px]">
                                                                <select
                                                                    value={row.offer}
                                                                    onChange={(event) => updateFocusDecisionRow(index, 'offer', event.target.value)}
                                                                    disabled={isLocked}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona oferta</option>
                                                                    {valueLadderSection.ladderRows
                                                                        .map((item) => item.offerName.trim())
                                                                        .filter((name) => name.length > 0)
                                                                        .map((name) => (
                                                                            <option key={`wb8-focus-offer-${index}-${name}`} value={name}>
                                                                                {name}
                                                                            </option>
                                                                        ))}
                                                                </select>
                                                            </td>
                                                            {(['problemClarity', 'deliveryCapability', 'differentiation', 'adoptionEase', 'expectedReturn'] as const).map(
                                                                (field) => (
                                                                    <td key={`wb8-focus-score-${index}-${field}`} className="px-3 py-2 border-b border-slate-100 w-[150px]">
                                                                        <select
                                                                            value={row[field]}
                                                                            onChange={(event) => updateFocusDecisionRow(index, field, event.target.value)}
                                                                            disabled={isLocked}
                                                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                        >
                                                                            <option value="">Selecciona</option>
                                                                            {['1', '2', '3', '4', '5'].map((option) => (
                                                                                <option key={`wb8-focus-score-option-${index}-${field}-${option}`} value={option}>
                                                                                    {option}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </td>
                                                                )
                                                            )}
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                                {priority || 'Pendiente de datos'}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveValueLadderBlock('Paso 5 — Mapa de decisión de foco')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de empaquetado estratégico</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                packagingCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {packagingCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Confirma que identificaste activos reales y que los conectaste con problemas y transformaciones concretas.',
                                                'Verifica que la escalera se entienda y que los niveles estén claramente diferenciados.',
                                                'Asegura una oferta prioritaria para concentrar foco y ejecución.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Señal débil: describir experiencia, pero no poder convertirla en oferta.',
                                                'Señal mejorada: traducir conocimiento en una escalera clara de soluciones con foco.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí / No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valueLadderSection.packagingTest.map((row, index) => (
                                                    <tr key={`wb8-packaging-test-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updatePackagingTestRow(index, 'verdict', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="yes">Sí</option>
                                                                <option value="no">No</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updatePackagingTestRow(index, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveValueLadderBlock('Paso 6 — Test de empaquetado estratégico')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                    <h3 className="text-base font-bold text-slate-900">Cierre de la sección</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">Cuando termines esta sección, deberías poder responder con más claridad:</p>
                                    <ul className="space-y-1.5">
                                        {[
                                            'Qué activos de conocimiento realmente tienes.',
                                            'Qué problemas sabes resolver.',
                                            'Cómo convertir ese valor en ofertas escalonadas.',
                                            'Cuál oferta debe ser tu foco inicial.',
                                            'Cómo dejar de presentar tu talento como algo difuso.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                                    <h3 className="text-base font-bold text-slate-900">Validaciones suaves</h3>
                                    {assetsOnlyThemes && (
                                        <p className="text-sm text-amber-800">Sugerencia: convierte temas en capacidades o recursos transferibles.</p>
                                    )}
                                    {similarOffers && (
                                        <p className="text-sm text-amber-800">Sugerencia: diferencia mejor profundidad, formato y resultado.</p>
                                    )}
                                    {noPriorityOffer && (
                                        <p className="text-sm text-amber-800">Sugerencia: elige un foco inicial para evitar dispersión.</p>
                                    )}
                                    {vagueTransformation && (
                                        <p className="text-sm text-amber-800">Sugerencia: aclara qué cambio concreto produces.</p>
                                    )}
                                    {!assetsOnlyThemes && !similarOffers && !noPriorityOffer && !vagueTransformation && (
                                        <p className="text-sm text-emerald-700">
                                            Sin alertas: la escalera se ve diferenciada, con foco y transformación más concreta.
                                        </p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">Estado de la sección</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {section3Completed
                                                    ? 'Completado: inventario + matriz + escalera + test + foco + test final diligenciados.'
                                                    : !ladderMinimumDesigned
                                                      ? 'Pendiente: diseña al menos una escalera mínima de 3 niveles (entrada, núcleo y escalamiento).'
                                                      : 'Pendiente: completa todos los bloques para cerrar la sección.'}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                section3Completed
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {section3Completed ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </section>
                            </article>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb8-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
                                <button type="button" onClick={goPrevPage} disabled={!hasPrevPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavPrev}>
                                    <ArrowLeft size={16} />
                                    {WORKBOOK_V2_EDITORIAL.labels.back}
                                </button>

                                <div className="text-center">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.navigation}</p>
                                    <p className="text-sm font-bold text-slate-900">{currentPage?.shortLabel ?? 'Página'}</p>
                                </div>

                                <button type="button" onClick={goNextPage} disabled={!hasNextPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavNext}>
                                    {WORKBOOK_V2_EDITORIAL.labels.next}
                                    <ArrowRight size={16} />
                                </button>
                            </nav>
                        )}

                        {showValueLadderHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
                                <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Ayuda — Escalera de valor</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowValueLadderHelp(false)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Una escalera de valor organiza tu conocimiento en niveles legibles con entrada, núcleo y escalamiento.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            No toda experiencia se convierte automáticamente en oferta: primero define problema, transformación y formato.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            La oferta núcleo debe concentrar tu mayor valor y conectarse con una decisión de foco.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Si la escalera no diferencia profundidad y resultado, termina pareciendo ruido.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    .wb8-toolbar,
                    .wb8-sidebar,
                    .wb8-page-nav {
                        display: none !important;
                    }

                    body {
                        background: white !important;
                        font-family: 'Inter', 'Segoe UI', sans-serif;
                    }

                    @page {
                        size: A4;
                        margin: 18mm 14mm;
                    }

                    .wb8-print-page {
                        break-after: page;
                        page-break-after: always;
                        position: relative;
                    }

                    .wb8-print-page:not(.wb8-cover-page)::before {
                        content: attr(data-print-page);
                        position: absolute;
                        top: -8mm;
                        right: 0;
                        font-size: 10px;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        color: #2563eb;
                        font-weight: 700;
                    }

                    .wb8-print-page::after {
                        content: attr(data-print-meta);
                        position: absolute;
                        bottom: -10mm;
                        left: 0;
                        font-size: 9px;
                        letter-spacing: 0.04em;
                        color: #475569;
                    }

                    .wb8-cover-page {
                        min-height: calc(297mm - 36mm);
                    }

                    .wb8-cover-page::before {
                        content: none !important;
                    }

                    .wb8-cover-hero {
                        min-height: 54vh !important;
                    }
                }
            `}</style>
        </div>
    )
}
