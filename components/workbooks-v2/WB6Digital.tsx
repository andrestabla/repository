'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3
type YesNoAnswer = '' | 'yes' | 'no'
type PresenceImpact = '' | 'Suma' | 'Resta'
type LeakageLevel = '' | 'Verde' | 'Amarillo' | 'Rojo'

type WorkbookPage = {
    id: WorkbookPageId
    label: string
    shortLabel: string
}

type WB6State = {
    identification: {
        leaderName: string
        role: string
        cohort: string
        startDate: string
    }
    bodyLanguageSection: {
        baselineScan: Array<{
            dimension: string
            observation: string
            effect: string
        }>
        presenceMatrix: Array<{
            dimension: string
            observableBehavior: string
            presenceImpact: PresenceImpact
            concreteAdjustment: string
        }>
        leakageTraffic: Array<{
            signal: string
            level: LeakageLevel
            whenAppears: string
            generatedReading: string
        }>
        entryProtocol: {
            idealEntry: string
            positioning: string
            spaceCriteria: string
            first20Seconds: string
            signalToInstall: string
        }
        calmAuthorityPattern: {
            centeredBody: string
            listeningBody: string
            objectionBody: string
            returnToCenter: string
        }
        coherenceTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
}

const PAGES: WorkbookPage[] = [
    { id: 1, label: '1. Portada e identificación', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Lenguaje corporal ejecutivo', shortLabel: 'Lenguaje corporal' }
]

const STORAGE_KEY = 'workbooks-v2-wb6-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb6-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb6-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb6-presentation-seen'

const BASELINE_DIMENSIONS = [
    'Base / apoyo',
    'Columna / hombros',
    'Mirada',
    'Manos / gestos',
    'Rostro / mandíbula',
    'Movimiento / quietud'
] as const

const PRESENCE_DIMENSIONS = [
    'Apertura',
    'Estabilidad',
    'Dirección',
    'Economía gestual',
    'Disponibilidad relacional'
] as const

const COHERENCE_QUESTIONS = [
    '¿Mi cuerpo transmitió lo mismo que mis palabras?',
    '¿Mi postura proyectó estabilidad?',
    '¿Mi mirada sostuvo presencia?',
    '¿Mis manos acompañaron sin dispersar?',
    '¿Mi cuerpo se mantuvo disponible al escuchar?',
    '¿Mi presencia corporal aumentó confianza?'
] as const

const EXAMPLE_BASELINE_SCAN = [
    {
        dimension: 'Base / apoyo',
        observation: 'Cambio mucho el peso entre pies.',
        effect: 'Inquietud o falta de aplomo.'
    },
    {
        dimension: 'Columna / hombros',
        observation: 'Me inclino hacia adelante cuando explico.',
        effect: 'Exceso de urgencia o presión.'
    },
    {
        dimension: 'Mirada',
        observation: 'Bajo la mirada cuando me cuestionan.',
        effect: 'Menor seguridad percibida.'
    },
    {
        dimension: 'Manos / gestos',
        observation: 'Muevo demasiado las manos.',
        effect: 'Dispersión del foco.'
    },
    {
        dimension: 'Rostro / mandíbula',
        observation: 'Tenso la mandíbula bajo presión.',
        effect: 'Rigidez o defensividad.'
    },
    {
        dimension: 'Movimiento / quietud',
        observation: 'Camino sin necesidad mientras hablo.',
        effect: 'Pérdida de centro y foco.'
    }
]

const EXAMPLE_PRESENCE_MATRIX = [
    {
        dimension: 'Apertura',
        observableBehavior: 'Cruzo brazos al escuchar objeciones.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Mantener brazos descruzados y manos visibles.'
    },
    {
        dimension: 'Estabilidad',
        observableBehavior: 'Balanceo el cuerpo al hablar.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Anclar ambos pies y reducir desplazamiento.'
    },
    {
        dimension: 'Dirección',
        observableBehavior: 'Mi cuerpo apunta a la pantalla, no a la audiencia.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Reorientar torso hacia interlocutor principal.'
    },
    {
        dimension: 'Economía gestual',
        observableBehavior: 'Gesticulo demasiado en ideas simples.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Reservar gestos amplios para ideas clave.'
    },
    {
        dimension: 'Disponibilidad relacional',
        observableBehavior: 'Asiento poco y casi no miro al otro al escuchar.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Aumentar mirada funcional y microseñales de escucha.'
    }
] as const

const EXAMPLE_LEAKAGE_TRAFFIC = [
    {
        signal: 'Mantengo pies firmes y hombros abiertos.',
        level: 'Verde',
        whenAppears: 'Al iniciar reunión.',
        generatedReading: 'Solidez y presencia.'
    },
    {
        signal: 'Toco mi reloj repetidamente.',
        level: 'Amarillo',
        whenAppears: 'Cuando se alarga una objeción.',
        generatedReading: 'Ansiedad o apuro.'
    },
    {
        signal: 'Bajo la mirada y cierro mandíbula.',
        level: 'Rojo',
        whenAppears: 'Cuando me contradicen en público.',
        generatedReading: 'Defensividad y tensión.'
    }
] as const

const EXAMPLE_ENTRY_PROTOCOL = {
    idealEntry: 'Entrar con paso estable, respiración baja y sin prisa visible.',
    positioning: 'Sentarme con ambos pies apoyados, torso orientado a la mesa y pantalla alineada.',
    spaceCriteria: 'Presencia firme, sin encogerme ni invadir.',
    first20Seconds: 'Manos visibles, mirada a la audiencia y celular fuera del campo de acción.',
    signalToInstall: 'Calma con autoridad.'
}

const EXAMPLE_AUTHORITY_PATTERN = {
    centeredBody: 'Pies firmes, hombros abiertos, torso estable y mirada directa.',
    listeningBody: 'Leve inclinación receptiva, rostro disponible, manos quietas.',
    objectionBody: 'No adelantarme, no cerrar brazos, sostener mirada y respirar antes de responder.',
    returnToCenter: 'Exhalo, suelto mandíbula, reanclo pies y bajo velocidad de movimiento.'
}

const DEFAULT_STATE: WB6State = {
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    bodyLanguageSection: {
        baselineScan: BASELINE_DIMENSIONS.map((dimension) => ({
            dimension,
            observation: '',
            effect: ''
        })),
        presenceMatrix: PRESENCE_DIMENSIONS.map((dimension) => ({
            dimension,
            observableBehavior: '',
            presenceImpact: '' as PresenceImpact,
            concreteAdjustment: ''
        })),
        leakageTraffic: Array.from({ length: 4 }, () => ({
            signal: '',
            level: '' as LeakageLevel,
            whenAppears: '',
            generatedReading: ''
        })),
        entryProtocol: {
            idealEntry: '',
            positioning: '',
            spaceCriteria: '',
            first20Seconds: '',
            signalToInstall: ''
        },
        calmAuthorityPattern: {
            centeredBody: '',
            listeningBody: '',
            objectionBody: '',
            returnToCenter: ''
        },
        coherenceTest: COHERENCE_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    }
}

const normalizeState = (raw: unknown): WB6State => {
    if (!raw || typeof raw !== 'object') return DEFAULT_STATE
    const parsed = raw as Record<string, unknown>
    const identification = (parsed.identification ?? {}) as Record<string, unknown>
    const bodyRaw = (parsed.bodyLanguageSection ?? {}) as Record<string, unknown>
    const baselineRaw = Array.isArray(bodyRaw.baselineScan) ? bodyRaw.baselineScan : []
    const presenceRaw = Array.isArray(bodyRaw.presenceMatrix) ? bodyRaw.presenceMatrix : []
    const leakageRaw = Array.isArray(bodyRaw.leakageTraffic) ? bodyRaw.leakageTraffic : []
    const coherenceRaw = Array.isArray(bodyRaw.coherenceTest) ? bodyRaw.coherenceTest : []

    const normalizeVerdict = (value: unknown): YesNoAnswer => {
        if (value === 'yes' || value === 'no') return value
        return ''
    }

    const normalizePresenceImpact = (value: unknown): PresenceImpact => {
        if (value === 'Suma' || value === 'Resta') return value
        return ''
    }

    const normalizeLeakageLevel = (value: unknown): LeakageLevel => {
        if (value === 'Verde' || value === 'Amarillo' || value === 'Rojo') return value
        return ''
    }

    return {
        identification: {
            leaderName: typeof identification.leaderName === 'string' ? identification.leaderName : '',
            role: typeof identification.role === 'string' ? identification.role : '',
            cohort: typeof identification.cohort === 'string' ? identification.cohort : '',
            startDate: typeof identification.startDate === 'string' ? identification.startDate : ''
        },
        bodyLanguageSection: {
            baselineScan: BASELINE_DIMENSIONS.map((dimension, index) => {
                const candidate = (baselineRaw[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    observation: typeof candidate.observation === 'string' ? candidate.observation : '',
                    effect: typeof candidate.effect === 'string' ? candidate.effect : ''
                }
            }),
            presenceMatrix: PRESENCE_DIMENSIONS.map((dimension, index) => {
                const candidate = (presenceRaw[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    observableBehavior: typeof candidate.observableBehavior === 'string' ? candidate.observableBehavior : '',
                    presenceImpact: normalizePresenceImpact(candidate.presenceImpact),
                    concreteAdjustment: typeof candidate.concreteAdjustment === 'string' ? candidate.concreteAdjustment : ''
                }
            }),
            leakageTraffic: Array.from({ length: 4 }, (_, index) => {
                const candidate = (leakageRaw[index] ?? {}) as Record<string, unknown>
                return {
                    signal: typeof candidate.signal === 'string' ? candidate.signal : '',
                    level: normalizeLeakageLevel(candidate.level),
                    whenAppears: typeof candidate.whenAppears === 'string' ? candidate.whenAppears : '',
                    generatedReading: typeof candidate.generatedReading === 'string' ? candidate.generatedReading : ''
                }
            }),
            entryProtocol: {
                idealEntry:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.idealEntry === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).idealEntry as string)
                        : '',
                positioning:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.positioning === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).positioning as string)
                        : '',
                spaceCriteria:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.spaceCriteria === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).spaceCriteria as string)
                        : '',
                first20Seconds:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.first20Seconds === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).first20Seconds as string)
                        : '',
                signalToInstall:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.signalToInstall === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).signalToInstall as string)
                        : ''
            },
            calmAuthorityPattern: {
                centeredBody:
                    typeof (bodyRaw.calmAuthorityPattern as Record<string, unknown> | undefined)?.centeredBody === 'string'
                        ? ((bodyRaw.calmAuthorityPattern as Record<string, unknown>).centeredBody as string)
                        : '',
                listeningBody:
                    typeof (bodyRaw.calmAuthorityPattern as Record<string, unknown> | undefined)?.listeningBody === 'string'
                        ? ((bodyRaw.calmAuthorityPattern as Record<string, unknown>).listeningBody as string)
                        : '',
                objectionBody:
                    typeof (bodyRaw.calmAuthorityPattern as Record<string, unknown> | undefined)?.objectionBody === 'string'
                        ? ((bodyRaw.calmAuthorityPattern as Record<string, unknown>).objectionBody as string)
                        : '',
                returnToCenter:
                    typeof (bodyRaw.calmAuthorityPattern as Record<string, unknown> | undefined)?.returnToCenter === 'string'
                        ? ((bodyRaw.calmAuthorityPattern as Record<string, unknown>).returnToCenter as string)
                        : ''
            },
            coherenceTest: COHERENCE_QUESTIONS.map((question, index) => {
                const candidate = (coherenceRaw[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: normalizeVerdict(candidate.verdict),
                    adjustment: typeof candidate.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        }
    }
}

export function WB6Digital() {
    const [state, setState] = useState<WB6State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]))
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [showBodyHelp, setShowBodyHelp] = useState(false)
    const [showBodyExampleStep1, setShowBodyExampleStep1] = useState(false)
    const [showBodyExampleStep2, setShowBodyExampleStep2] = useState(false)
    const [showBodyExampleStep3, setShowBodyExampleStep3] = useState(false)
    const [showBodyExampleStep4, setShowBodyExampleStep4] = useState(false)
    const [showBodyExampleStep5, setShowBodyExampleStep5] = useState(false)
    const [showBodyExampleStep6, setShowBodyExampleStep6] = useState(false)
    const [showBodySketch, setShowBodySketch] = useState(false)

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

    const updateIdentification = (field: keyof WB6State['identification'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateBaselineScanRow = (
        rowIndex: number,
        field: keyof WB6State['bodyLanguageSection']['baselineScan'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                baselineScan: prev.bodyLanguageSection.baselineScan.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updatePresenceMatrixRow = (
        rowIndex: number,
        field: keyof WB6State['bodyLanguageSection']['presenceMatrix'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                presenceMatrix: prev.bodyLanguageSection.presenceMatrix.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'presenceImpact'
                                      ? value === 'Suma' || value === 'Resta'
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateLeakageTrafficRow = (
        rowIndex: number,
        field: keyof WB6State['bodyLanguageSection']['leakageTraffic'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                leakageTraffic: prev.bodyLanguageSection.leakageTraffic.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'level'
                                      ? value === 'Verde' || value === 'Amarillo' || value === 'Rojo'
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateEntryProtocol = (
        field: keyof WB6State['bodyLanguageSection']['entryProtocol'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                entryProtocol: {
                    ...prev.bodyLanguageSection.entryProtocol,
                    [field]: value
                }
            }
        }))
    }

    const updateCalmAuthorityPattern = (
        field: keyof WB6State['bodyLanguageSection']['calmAuthorityPattern'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                calmAuthorityPattern: {
                    ...prev.bodyLanguageSection.calmAuthorityPattern,
                    [field]: value
                }
            }
        }))
    }

    const updateCoherenceTestRow = (
        rowIndex: number,
        field: keyof WB6State['bodyLanguageSection']['coherenceTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                coherenceTest: prev.bodyLanguageSection.coherenceTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? ((value === 'yes' || value === 'no' ? value : '') as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveBodyLanguageBlock = (blockLabel: string) => {
        markVisited(3)
        if (blockLabel === 'Paso 1') {
            setShowBodySketch(true)
        }
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
            document.title = 'WB6 - Lenguaje verbal y no verbal de impacto'
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
            link.download = 'WB6-lenguaje-verbal-no-verbal-impacto-completo.html'
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

    const baselineScan = state.bodyLanguageSection.baselineScan
    const presenceMatrix = state.bodyLanguageSection.presenceMatrix
    const leakageTraffic = state.bodyLanguageSection.leakageTraffic
    const entryProtocol = state.bodyLanguageSection.entryProtocol
    const calmAuthorityPattern = state.bodyLanguageSection.calmAuthorityPattern
    const coherenceTest = state.bodyLanguageSection.coherenceTest

    const baselineCompleted = baselineScan.every(
        (row) => row.observation.trim().length > 0 && row.effect.trim().length > 0
    )
    const presenceCompleted = presenceMatrix.every(
        (row) =>
            row.observableBehavior.trim().length > 0 &&
            row.presenceImpact !== '' &&
            row.concreteAdjustment.trim().length > 0
    )
    const leakageCompleted = leakageTraffic.every(
        (row) =>
            row.signal.trim().length > 0 &&
            row.level !== '' &&
            row.whenAppears.trim().length > 0 &&
            row.generatedReading.trim().length > 0
    )
    const entryCompleted = Object.values(entryProtocol).every((value) => value.trim().length > 0)
    const authorityPatternCompleted = Object.values(calmAuthorityPattern).every((value) => value.trim().length > 0)
    const coherenceCompleted = coherenceTest.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)

    const atLeastOneConcreteAdjustment = presenceMatrix.some((row) => row.concreteAdjustment.trim().length > 0)
    const bodySectionMinimal = baselineCompleted && atLeastOneConcreteAdjustment
    const bodySectionCompleted =
        baselineCompleted &&
        presenceCompleted &&
        leakageCompleted &&
        entryCompleted &&
        authorityPatternCompleted &&
        coherenceCompleted

    const observableBodyKeywords = [
        'mirada',
        'hombro',
        'postura',
        'pies',
        'manos',
        'mandíbula',
        'respiración',
        'cuerpo',
        'gesto',
        'torso',
        'cuello',
        'movimiento',
        'base'
    ]
    const emotionalOnlyWords = ['ansiedad', 'miedo', 'nervios', 'frustración', 'inseguridad', 'estrés', 'me siento']
    const baselineLooksAbstract = baselineScan.some((row) => {
        const text = row.observation.trim().toLowerCase()
        if (text.length === 0) return false
        const hasObservable = observableBodyKeywords.some((keyword) => text.includes(keyword))
        const hasEmotional = emotionalOnlyWords.some((keyword) => text.includes(keyword))
        return !hasObservable || hasEmotional
    })

    const concreteAdjustmentKeywords = ['pies', 'hombros', 'torso', 'mirada', 'manos', 'mandíbula', 'respira', 'postura', 'cuerpo']
    const adjustmentsTooAbstract = presenceMatrix
        .filter((row) => row.concreteAdjustment.trim().length > 0)
        .some((row) => !concreteAdjustmentKeywords.some((keyword) => row.concreteAdjustment.toLowerCase().includes(keyword)))

    const entryProtocolMissing = Object.values(entryProtocol).every((value) => value.trim().length === 0)
    const missingListeningInPattern = calmAuthorityPattern.listeningBody.trim().length === 0

    const baselineMapByDimension = baselineScan.reduce<Record<string, { observation: string; effect: string }>>((acc, row) => {
        acc[row.dimension] = { observation: row.observation.trim(), effect: row.effect.trim() }
        return acc
    }, {})

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: bodySectionCompleted
    }

    const completedPages = PAGES.filter((page) => pageCompletionMap[page.id]).length
    const progressPercent = Math.round((completedPages / PAGES.length) * 100)
    const printMetaLabel = `Líder: ${state.identification.leaderName || 'Sin nombre'} · Rol: ${state.identification.role || 'Sin rol'}`

    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb6-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/workbooks-v2" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB6 - Lenguaje verbal y no verbal de impacto</p>
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
                    <aside className={`wb6-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
                        <p className={WORKBOOK_V2_EDITORIAL.classes.sidebarTitle}>{WORKBOOK_V2_EDITORIAL.labels.index}</p>
                        <nav className="space-y-1.5">
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
                        {isPageVisible(1) && (
                            <article
                                className="wb6-print-page wb6-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 3"
                                data-print-title="Portada e identificación"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb6-cover-hero relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-16 w-16 md:h-20 md:w-20" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Lenguaje verbal y no verbal de impacto
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 6</p>
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
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
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
                                    <p className="mt-4 text-sm md:text-[15px] text-slate-700 leading-relaxed">
                                        Fortalecer la presencia ejecutiva del líder en entornos presenciales, virtuales e híbridos, desarrollando mayor coherencia entre lenguaje verbal y no verbal, control del tono y ritmo, capacidad de comunicar bajo presión y manejo de objeciones con claridad y aplomo.
                                    </p>
                                </section>

                                <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Componentes trabajados en este workbook</h3>
                                        <ul className="mt-4 space-y-2.5">
                                            {[
                                                'Comunicación de impacto.',
                                                'Influencia positiva.',
                                                'Presencia digital e híbrida.'
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
                                                'Claridad e inspiración.',
                                                'Escucha Activa y Empática.',
                                                'Adaptabilidad Comunicativa.',
                                                'Construcción de confianza (Trust).',
                                                'Influencia ética y persuasión.',
                                                'Influencia asíncrona y virtual.'
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
                                            'Lee a su audiencia y ajusta su estilo y lenguaje (ej. técnico vs. estratégico) según el interlocutor.',
                                            'Identifica señales no verbales en los demás y modifica el ritmo o enfoque de su mensaje para mantener la sintonía y asegurar que el mensaje sea aceptado.',
                                            'Apela a valores e ideales compartidos para generar una voluntad genuina de colaboración en el equipo.',
                                            'Proyecta la misma gravitas y calidez en videoconferencias que en persona.',
                                            'Gestiona su reputación y narrativa en plataformas digitales de forma estratégica.',
                                            'Utiliza persuasión racional basada en datos, hechos y criterio, no en amenaza o imposición.',
                                            'Trata a los demás con respeto y genera una atmósfera de seguridad conversacional.',
                                            'Comunica de manera oportuna y honesta, incluso cuando hay tensión o malas noticias.',
                                            'Deja que otros se expresen sin interrumpir y demuestra con gestos y preguntas que escucha atentamente.',
                                            'Reconoce la perspectiva del otro, incluso cuando no coincide con la suya.'
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
                                            'Tu cuerpo, tu voz y tus palabras deben decir lo mismo.',
                                            'Bajo presión, primero regula presencia; después responde.',
                                            'No confundas autoridad con rigidez ni calma con pasividad.',
                                            'En espacios de alto nivel, menos dispersión y más intención.',
                                            'Si tu forma contradice tu mensaje, la audiencia creerá a la forma.',
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
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 3 de 3"
                                data-print-title="Lenguaje corporal ejecutivo"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Lenguaje corporal ejecutivo
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Desarrolla una presencia corporal ejecutiva clara, estable y congruente para proyectar seguridad tranquila, autoridad sin
                                        rigidez y mayor capacidad de sostener atención, confianza y credibilidad.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Lenguaje corporal ejecutivo: señales posturales, gestuales, espaciales y visuales que impactan percepción de seguridad, claridad y autoridad.',
                                            'Alineación corporal: coherencia entre postura, mirada, manos, rostro, respiración y dirección del cuerpo.',
                                            'Anclaje postural: base estable desde pies, pelvis, columna y hombros.',
                                            'Apertura corporal: disposición visible que comunica receptividad y confianza.',
                                            'Microconductas no verbales: señales pequeñas de alto impacto (tocarse la cara, cerrar hombros, mover pies, tensión mandibular).',
                                            'Proxémica ejecutiva: uso de espacio, distancia y orientación corporal.',
                                            'Mirada funcional: contacto visual intencional para sostener presencia y marcar ideas.',
                                            'Regulación somática visible: estabilidad observable bajo tensión.',
                                            'Gravitas corporal: solidez y aplomo sin dureza excesiva.',
                                            'Fuga corporal: señales involuntarias que restan credibilidad.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Escaneo de línea base corporal</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    baselineCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {baselineCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión corporal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Lo que observo en mí hoy</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Efecto probable en otros</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {baselineScan.map((row, rowIndex) => (
                                                    <tr key={`wb6-baseline-row-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.observation}
                                                                onChange={(event) => updateBaselineScanRow(rowIndex, 'observation', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Conducta observable"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.effect}
                                                                onChange={(event) => updateBaselineScanRow(rowIndex, 'effect', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Lectura probable en otros"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {baselineLooksAbstract && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: describe conductas visibles (mirada, hombros, manos, postura, movimiento), no solo emociones.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>

                                    {(showBodySketch || isExportingAll) && (
                                        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">Croquis de señales corporales registradas</h4>
                                            <div className="mt-4 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
                                                <div className="rounded-xl border border-blue-200 bg-white p-4">
                                                    <svg viewBox="0 0 240 360" className="w-full h-auto" aria-label="Croquis corporal">
                                                        <circle cx="120" cy="46" r="24" fill="#dbeafe" stroke="#1d4ed8" strokeWidth="2" />
                                                        <line x1="120" y1="70" x2="120" y2="210" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="70" y1="110" x2="170" y2="110" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="120" y1="210" x2="88" y2="300" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="120" y1="210" x2="152" y2="300" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="88" y1="300" x2="74" y2="335" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="152" y1="300" x2="166" y2="335" stroke="#1d4ed8" strokeWidth="3" />
                                                        <circle cx="120" cy="82" r="5" fill="#1d4ed8" />
                                                        <circle cx="120" cy="110" r="5" fill="#1d4ed8" />
                                                        <circle cx="120" cy="145" r="5" fill="#1d4ed8" />
                                                        <circle cx="82" cy="110" r="5" fill="#1d4ed8" />
                                                        <circle cx="158" cy="110" r="5" fill="#1d4ed8" />
                                                        <circle cx="86" cy="306" r="5" fill="#1d4ed8" />
                                                        <circle cx="154" cy="306" r="5" fill="#1d4ed8" />
                                                    </svg>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {BASELINE_DIMENSIONS.map((dimension) => {
                                                        const mapped = baselineMapByDimension[dimension]
                                                        return (
                                                            <div key={`wb6-body-sketch-${dimension}`} className="rounded-xl border border-blue-200 bg-white p-3">
                                                                <p className="text-xs uppercase tracking-[0.12em] text-blue-700 font-semibold">{dimension}</p>
                                                                <p className="mt-1 text-sm text-slate-700">{mapped?.observation || 'Sin observación.'}</p>
                                                                <p className="mt-1 text-xs text-slate-500">{mapped?.effect || 'Sin efecto registrado.'}</p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </article>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz de presencia corporal ejecutiva</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    presenceCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {presenceCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1060px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Conducta actual observable</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">¿Suma o resta presencia?</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste corporal concreto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {presenceMatrix.map((row, rowIndex) => (
                                                    <tr key={`wb6-presence-row-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.observableBehavior}
                                                                onChange={(event) => updatePresenceMatrixRow(rowIndex, 'observableBehavior', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Conducta visible"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.presenceImpact}
                                                                onChange={(event) => updatePresenceMatrixRow(rowIndex, 'presenceImpact', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="Suma">Suma</option>
                                                                <option value="Resta">Resta</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.concreteAdjustment}
                                                                onChange={(event) => updatePresenceMatrixRow(rowIndex, 'concreteAdjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste corporal específico"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {adjustmentsTooAbstract && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: haz el ajuste más corporal y concreto (pies, hombros, mirada, manos, postura, respiración).
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Semáforo de fugas corporales</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    leakageCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {leakageCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Señal corporal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nivel</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Cuándo aparece</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué lectura puede generar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leakageTraffic.map((row, rowIndex) => (
                                                    <tr key={`wb6-leakage-row-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.signal}
                                                                onChange={(event) => updateLeakageTrafficRow(rowIndex, 'signal', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.level}
                                                                onChange={(event) => updateLeakageTrafficRow(rowIndex, 'level', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="Verde">Verde</option>
                                                                <option value="Amarillo">Amarillo</option>
                                                                <option value="Rojo">Rojo</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.whenAppears}
                                                                onChange={(event) => updateLeakageTrafficRow(rowIndex, 'whenAppears', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.generatedReading}
                                                                onChange={(event) => updateLeakageTrafficRow(rowIndex, 'generatedReading', event.target.value)}
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
                                            onClick={() => saveBodyLanguageBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Protocolo de entrada corporal a espacios ejecutivos</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    entryCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {entryCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Mi entrada corporal ideal es</span>
                                            <textarea
                                                rows={2}
                                                value={entryProtocol.idealEntry}
                                                onChange={(event) => updateEntryProtocol('idealEntry', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Mi forma de ubicarme en el espacio será</span>
                                            <textarea
                                                rows={2}
                                                value={entryProtocol.positioning}
                                                onChange={(event) => updateEntryProtocol('positioning', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Mi criterio para ocupar el espacio será</span>
                                            <textarea
                                                rows={2}
                                                value={entryProtocol.spaceCriteria}
                                                onChange={(event) => updateEntryProtocol('spaceCriteria', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Manos, mirada y dispositivos en los primeros 20 segundos</span>
                                            <textarea
                                                rows={2}
                                                value={entryProtocol.first20Seconds}
                                                onChange={(event) => updateEntryProtocol('first20Seconds', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. La señal corporal que quiero dejar instalada es</span>
                                            <input
                                                type="text"
                                                value={entryProtocol.signalToInstall}
                                                onChange={(event) => updateEntryProtocol('signalToInstall', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {entryProtocolMissing && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: define cómo entrarás y tomarás el espacio antes de hablar.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Patrón corporal de autoridad tranquila</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep5(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    authorityPatternCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {authorityPatternCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Cuando estoy centrado, mi cuerpo se ve así</span>
                                            <textarea
                                                rows={2}
                                                value={calmAuthorityPattern.centeredBody}
                                                onChange={(event) => updateCalmAuthorityPattern('centeredBody', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Cuando escucho, mi cuerpo se ve así</span>
                                            <textarea
                                                rows={2}
                                                value={calmAuthorityPattern.listeningBody}
                                                onChange={(event) => updateCalmAuthorityPattern('listeningBody', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Cuando aparece una objeción, mi cuerpo debe hacer esto</span>
                                            <textarea
                                                rows={2}
                                                value={calmAuthorityPattern.objectionBody}
                                                onChange={(event) => updateCalmAuthorityPattern('objectionBody', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Si detecto una fuga corporal, vuelvo al centro haciendo esto</span>
                                            <textarea
                                                rows={2}
                                                value={calmAuthorityPattern.returnToCenter}
                                                onChange={(event) => updateCalmAuthorityPattern('returnToCenter', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {missingListeningInPattern && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: incluye explícitamente cómo se ve tu cuerpo cuando escuchas, no solo cuando hablas.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de coherencia corporal ejecutiva</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep6(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
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
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {coherenceTest.map((row, rowIndex) => (
                                                    <tr key={`wb6-coherence-row-${row.question}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-coherence-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updateCoherenceTestRow(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-coherence-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updateCoherenceTestRow(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateCoherenceTestRow(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste necesario"
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
                                            onClick={() => saveBodyLanguageBlock('Paso 6')}
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
                                            'Qué señales corporales hoy fortalecen mi presencia.',
                                            'Qué fugas no verbales debilitan mi autoridad.',
                                            'Cómo entro y tomo el espacio en contextos ejecutivos.',
                                            'Qué patrón corporal quiero instalar como estándar.',
                                            'Cómo hacer que mi cuerpo acompañe y no contradiga mi mensaje.'
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
                                                bodySectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : bodySectionMinimal
                                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {bodySectionCompleted
                                                ? 'Sección completada'
                                                : bodySectionMinimal
                                                  ? 'Pendiente (falta completar bloques)'
                                                  : 'Sección pendiente'}
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

                        {showBodyHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Lenguaje corporal ejecutivo</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Lenguaje corporal ejecutivo no es actuar: es ordenar postura, mirada, gesto y espacio.</p>
                                        <p>• La autoridad tranquila se transmite por estabilidad y coherencia, no por rigidez.</p>
                                        <p>• Tu cuerpo debe reforzar el mensaje, no competir con él.</p>
                                        <p>• Detectar fugas corporales temprano evita pérdida de credibilidad en espacios de alto nivel.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Escaneo de línea base)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[820px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Lo que observo hoy</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Efecto probable</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_BASELINE_SCAN.map((row) => (
                                                    <tr key={`wb6-modal-step1-${row.dimension}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.dimension}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.observation}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.effect}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Matriz de presencia)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[920px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Conducta observable</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Impacto</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Ajuste concreto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_PRESENCE_MATRIX.map((row) => (
                                                    <tr key={`wb6-modal-step2-${row.dimension}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.dimension}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.observableBehavior}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.presenceImpact}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.concreteAdjustment}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Semáforo de fugas)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        {EXAMPLE_LEAKAGE_TRAFFIC.map((row, index) => (
                                            <p key={`wb6-modal-step3-${index}`}>
                                                <span className="font-semibold">{row.signal}</span> · {row.level} · {row.whenAppears} · {row.generatedReading}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Protocolo de entrada)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Entrada ideal:</span> {EXAMPLE_ENTRY_PROTOCOL.idealEntry}</p>
                                        <p><span className="font-semibold">Ubicación:</span> {EXAMPLE_ENTRY_PROTOCOL.positioning}</p>
                                        <p><span className="font-semibold">Criterio de espacio:</span> {EXAMPLE_ENTRY_PROTOCOL.spaceCriteria}</p>
                                        <p><span className="font-semibold">Primeros 20 segundos:</span> {EXAMPLE_ENTRY_PROTOCOL.first20Seconds}</p>
                                        <p><span className="font-semibold">Señal inicial:</span> {EXAMPLE_ENTRY_PROTOCOL.signalToInstall}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep5 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 5 (Patrón corporal)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep5(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Centrado:</span> {EXAMPLE_AUTHORITY_PATTERN.centeredBody}</p>
                                        <p><span className="font-semibold">Escucha:</span> {EXAMPLE_AUTHORITY_PATTERN.listeningBody}</p>
                                        <p><span className="font-semibold">Objeción:</span> {EXAMPLE_AUTHORITY_PATTERN.objectionBody}</p>
                                        <p><span className="font-semibold">Vuelta al centro:</span> {EXAMPLE_AUTHORITY_PATTERN.returnToCenter}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep6 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 6 (Test de coherencia)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep6(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p><span className="font-semibold">Señal débil:</span> explicar calma mientras el cuerpo se mueve sin parar.</p>
                                        <p><span className="font-semibold">Señal mejorada:</span> sostener idea con torso estable, manos visibles y respiración regulada.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb6-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
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
                    .wb6-toolbar,
                    .wb6-sidebar,
                    .wb6-page-nav {
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
                    .wb6-print-page {
                        position: relative !important;
                        padding-top: 14mm !important;
                        border-top: 3px solid #1d4ed8 !important;
                    }
                    .wb6-print-page:not(.wb6-cover-page)::before {
                        content: "WB6 · Lenguaje verbal y no verbal de impacto · " attr(data-print-title);
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
                    .wb6-print-page::after {
                        content: attr(data-print-page) " · " attr(data-print-meta);
                        position: absolute;
                        left: 2mm;
                        right: 2mm;
                        bottom: 2mm;
                        font-size: 10px;
                        font-weight: 600;
                        color: #64748b;
                    }
                    .wb6-cover-page {
                        padding-top: 0 !important;
                        border-top: 4px solid #0f172a !important;
                    }
                    .wb6-cover-page::before {
                        content: none !important;
                    }
                    .wb6-cover-hero {
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
