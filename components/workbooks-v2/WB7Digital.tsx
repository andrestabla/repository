'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3
type YesNoAnswer = '' | 'yes' | 'no'
type StakeholderLevel = '' | '1' | '2' | '3'
type StakeholderSymbol = '' | '★' | '▲' | '!' | '○'

type WorkbookPage = {
    id: WorkbookPageId
    label: string
    shortLabel: string
}

type WB7State = {
    identification: {
        leaderName: string
        role: string
        cohort: string
        startDate: string
    }
    stakeholderMappingSection: {
        actorInventory: string[]
        classificationRows: Array<{
            level: StakeholderLevel
            bondType: string
            contactFrequency: string
            ecosystemImpact: string
        }>
        valueMatrixRows: Array<{
            powerInfluence: '' | '1' | '2' | '3' | '4' | '5'
            currentCloseness: '' | '1' | '2' | '3' | '4' | '5'
            mutualValue: '' | '1' | '2' | '3' | '4' | '5'
        }>
        relationalGaps: Array<{
            relationalGap: string
            criticalReason: string
            minimumAction: string
        }>
        ecosystemMap: {
            centerRole: string
            actorSymbols: StakeholderSymbol[]
        }
        strategicReadTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
}

type Score15 = '' | '1' | '2' | '3' | '4' | '5'

const PAGES: WorkbookPage[] = [
    { id: 1, label: '1. Portada e identificación', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Mapeo de stakeholders (niveles 1, 2 y 3)', shortLabel: 'Stakeholders' }
]

const STORAGE_KEY = 'workbooks-v2-wb7-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb7-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb7-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb7-presentation-seen'

const INVENTORY_ROWS = 10
const MAP_RING_SYMBOLS: StakeholderSymbol[] = ['', '★', '▲', '!', '○']
const BOND_TYPE_OPTIONS = [
    'Jerárquico / coordinación',
    'Colaboración transversal',
    'Visibilidad / decisión',
    'Reputación / acceso',
    'Cliente interno',
    'Cliente externo',
    'Partner / proveedor',
    'Mentoría / desarrollo',
    'Referencia externa',
    'Relación difícil / crítica',
    'Otro'
] as const
const CONTACT_FREQUENCY_OPTIONS = ['Alta', 'Media', 'Baja', 'Esporádica'] as const
const ECOSYSTEM_IMPACT_OPTIONS = ['Alto', 'Medio-alto', 'Medio', 'Bajo'] as const
const STRATEGIC_TEST_QUESTIONS = [
    '¿Diferencio actores operativos y estratégicos?',
    '¿Identifico bien quién decide, influye o amplifica?',
    '¿Mi red se ve estratégica y no solo circunstancial?',
    '¿Detecté vacíos relacionales relevantes?',
    '¿Identifiqué relaciones de alto valor y relaciones frágiles?',
    '¿El mapa me permite decidir próximos movimientos?'
] as const

const readString = (value: unknown): string => (typeof value === 'string' ? value : '')

const readYesNo = (value: unknown): YesNoAnswer => (value === 'yes' || value === 'no' ? value : '')

const readLevel = (value: unknown): StakeholderLevel => (value === '1' || value === '2' || value === '3' ? value : '')

const readScore = (value: unknown): Score15 => (value === '1' || value === '2' || value === '3' || value === '4' || value === '5' ? value : '')

const readSymbol = (value: unknown): StakeholderSymbol => (MAP_RING_SYMBOLS.includes(value as StakeholderSymbol) ? (value as StakeholderSymbol) : '')

const scoreToNumber = (value: Score15): number => (value ? Number(value) : 0)

const buildStrategicReading = (power: Score15, closeness: Score15, mutualValue: Score15): string => {
    const p = scoreToNumber(power)
    const c = scoreToNumber(closeness)
    const v = scoreToNumber(mutualValue)

    if (!p && !c && !v) return ''
    if (p >= 4 && c <= 2 && v <= 2) return 'Alta influencia, baja cercanía: relación a desarrollar'
    if (p >= 4 && c >= 4 && v >= 4) return 'Relación crítica y relativamente sólida'
    if (p >= 4 && c <= 2) return 'Relación estratégica subdesarrollada: activar vínculo'
    if (p <= 2 && c >= 4 && v >= 3) return 'Relación operativa cercana con impacto limitado'
    if (p >= 3 && v <= 2) return 'Existe acceso, falta fortalecer valor mutuo'
    return 'Relación en evolución: ajustar estrategia según contexto'
}

const DEFAULT_STATE: WB7State = {
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    stakeholderMappingSection: {
        actorInventory: Array.from({ length: INVENTORY_ROWS }, () => ''),
        classificationRows: Array.from({ length: INVENTORY_ROWS }, () => ({
            level: '' as StakeholderLevel,
            bondType: '',
            contactFrequency: '',
            ecosystemImpact: ''
        })),
        valueMatrixRows: Array.from({ length: INVENTORY_ROWS }, () => ({
            powerInfluence: '' as '' | '1' | '2' | '3' | '4' | '5',
            currentCloseness: '' as '' | '1' | '2' | '3' | '4' | '5',
            mutualValue: '' as '' | '1' | '2' | '3' | '4' | '5'
        })),
        relationalGaps: Array.from({ length: 2 }, () => ({
            relationalGap: '',
            criticalReason: '',
            minimumAction: ''
        })),
        ecosystemMap: {
            centerRole: '',
            actorSymbols: Array.from({ length: INVENTORY_ROWS }, () => '' as StakeholderSymbol)
        },
        strategicReadTest: STRATEGIC_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    }
}

const normalizeState = (raw: unknown): WB7State => {
    if (!raw || typeof raw !== 'object') return DEFAULT_STATE
    const parsed = raw as Record<string, unknown>
    const identification = (parsed.identification ?? {}) as Record<string, unknown>
    const stakeholderSection = (parsed.stakeholderMappingSection ?? {}) as Record<string, unknown>

    const rawInventory = Array.isArray(stakeholderSection.actorInventory) ? stakeholderSection.actorInventory : []
    const rawClassificationRows = Array.isArray(stakeholderSection.classificationRows) ? stakeholderSection.classificationRows : []
    const rawValueMatrixRows = Array.isArray(stakeholderSection.valueMatrixRows) ? stakeholderSection.valueMatrixRows : []
    const rawRelationalGaps = Array.isArray(stakeholderSection.relationalGaps) ? stakeholderSection.relationalGaps : []
    const rawEcosystemMap = (stakeholderSection.ecosystemMap ?? {}) as Record<string, unknown>
    const rawActorSymbols = Array.isArray(rawEcosystemMap.actorSymbols) ? rawEcosystemMap.actorSymbols : []
    const rawStrategicReadTest = Array.isArray(stakeholderSection.strategicReadTest) ? stakeholderSection.strategicReadTest : []

    return {
        identification: {
            leaderName: readString(identification.leaderName),
            role: readString(identification.role),
            cohort: readString(identification.cohort),
            startDate: readString(identification.startDate)
        },
        stakeholderMappingSection: {
            actorInventory: Array.from({ length: INVENTORY_ROWS }, (_, index) => readString(rawInventory[index])),
            classificationRows: Array.from({ length: INVENTORY_ROWS }, (_, index) => {
                const row = (rawClassificationRows[index] ?? {}) as Record<string, unknown>
                return {
                    level: readLevel(row.level),
                    bondType: readString(row.bondType),
                    contactFrequency: readString(row.contactFrequency),
                    ecosystemImpact: readString(row.ecosystemImpact)
                }
            }),
            valueMatrixRows: Array.from({ length: INVENTORY_ROWS }, (_, index) => {
                const row = (rawValueMatrixRows[index] ?? {}) as Record<string, unknown>
                return {
                    powerInfluence: readScore(row.powerInfluence),
                    currentCloseness: readScore(row.currentCloseness),
                    mutualValue: readScore(row.mutualValue)
                }
            }),
            relationalGaps: Array.from({ length: 2 }, (_, index) => {
                const row = (rawRelationalGaps[index] ?? {}) as Record<string, unknown>
                return {
                    relationalGap: readString(row.relationalGap),
                    criticalReason: readString(row.criticalReason),
                    minimumAction: readString(row.minimumAction)
                }
            }),
            ecosystemMap: {
                centerRole: readString(rawEcosystemMap.centerRole),
                actorSymbols: Array.from({ length: INVENTORY_ROWS }, (_, index) => readSymbol(rawActorSymbols[index]))
            },
            strategicReadTest: STRATEGIC_TEST_QUESTIONS.map((question, index) => {
                const row = (rawStrategicReadTest[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(row.verdict),
                    adjustment: readString(row.adjustment)
                }
            })
        }
    }
}

export function WB7Digital() {
    const [state, setState] = useState<WB7State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]))
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [showStakeholderHelp, setShowStakeholderHelp] = useState(false)

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
        const pageNumber = PAGES.findIndex((page) => page.id === pageId)
        announceSave(`Página ${pageNumber >= 0 ? pageNumber + 1 : pageId} guardada.`)
    }

    const updateIdentification = (field: keyof WB7State['identification'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateActorInventory = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const actorInventory = [...prev.stakeholderMappingSection.actorInventory]
            actorInventory[index] = value
            return {
                ...prev,
                stakeholderMappingSection: {
                    ...prev.stakeholderMappingSection,
                    actorInventory
                }
            }
        })
    }

    const updateClassificationRow = (
        index: number,
        field: keyof WB7State['stakeholderMappingSection']['classificationRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const classificationRows = [...prev.stakeholderMappingSection.classificationRows]
            classificationRows[index] = {
                ...classificationRows[index],
                [field]: value
            }
            return {
                ...prev,
                stakeholderMappingSection: {
                    ...prev.stakeholderMappingSection,
                    classificationRows
                }
            }
        })
    }

    const updateValueMatrixRow = (
        index: number,
        field: keyof WB7State['stakeholderMappingSection']['valueMatrixRows'][number],
        value: Score15
    ) => {
        if (isLocked) return
        setState((prev) => {
            const valueMatrixRows = [...prev.stakeholderMappingSection.valueMatrixRows]
            valueMatrixRows[index] = {
                ...valueMatrixRows[index],
                [field]: value
            }
            return {
                ...prev,
                stakeholderMappingSection: {
                    ...prev.stakeholderMappingSection,
                    valueMatrixRows
                }
            }
        })
    }

    const updateRelationalGap = (
        index: number,
        field: keyof WB7State['stakeholderMappingSection']['relationalGaps'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const relationalGaps = [...prev.stakeholderMappingSection.relationalGaps]
            relationalGaps[index] = {
                ...relationalGaps[index],
                [field]: value
            }
            return {
                ...prev,
                stakeholderMappingSection: {
                    ...prev.stakeholderMappingSection,
                    relationalGaps
                }
            }
        })
    }

    const updateEcosystemCenterRole = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            stakeholderMappingSection: {
                ...prev.stakeholderMappingSection,
                ecosystemMap: {
                    ...prev.stakeholderMappingSection.ecosystemMap,
                    centerRole: value
                }
            }
        }))
    }

    const cycleActorSymbol = (index: number) => {
        if (isLocked) return
        setState((prev) => {
            const actorSymbols = [...prev.stakeholderMappingSection.ecosystemMap.actorSymbols]
            const current = actorSymbols[index]
            const nextIndex = (MAP_RING_SYMBOLS.indexOf(current) + 1) % MAP_RING_SYMBOLS.length
            actorSymbols[index] = MAP_RING_SYMBOLS[nextIndex]
            return {
                ...prev,
                stakeholderMappingSection: {
                    ...prev.stakeholderMappingSection,
                    ecosystemMap: {
                        ...prev.stakeholderMappingSection.ecosystemMap,
                        actorSymbols
                    }
                }
            }
        })
    }

    const updateStrategicReadTestRow = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const strategicReadTest = [...prev.stakeholderMappingSection.strategicReadTest]
            strategicReadTest[index] =
                field === 'verdict'
                    ? { ...strategicReadTest[index], verdict: readYesNo(value) }
                    : { ...strategicReadTest[index], adjustment: value }
            return {
                ...prev,
                stakeholderMappingSection: {
                    ...prev.stakeholderMappingSection,
                    strategicReadTest
                }
            }
        })
    }

    const saveStakeholderBlock = (label: string) => {
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
            document.title = 'WB7 - Mapeo del ecosistema estratégico'
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
            link.download = 'WB7-mapeo-ecosistema-estrategico-completo.html'
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

    const stakeholderSection = state.stakeholderMappingSection
    const actorRows = stakeholderSection.actorInventory.map((actor, index) => ({
        index,
        actor: actor.trim(),
        row: stakeholderSection.classificationRows[index],
        matrix: stakeholderSection.valueMatrixRows[index],
        symbol: stakeholderSection.ecosystemMap.actorSymbols[index]
    }))
    const actorsWithName = actorRows.filter((item) => item.actor.length > 0)
    const activeClassificationRows = actorRows.filter((item) => item.actor.length > 0)
    const activeMatrixRows = actorRows.filter((item) => item.actor.length > 0 && item.row.level !== '')

    const inventoryCompleted = actorsWithName.length >= 3
    const classificationCompleted =
        activeClassificationRows.length > 0 &&
        activeClassificationRows.every(
            (item) =>
                item.row.level !== '' &&
                item.row.bondType.trim().length > 0 &&
                item.row.contactFrequency.trim().length > 0 &&
                item.row.ecosystemImpact.trim().length > 0
        )
    const valueMatrixCompleted =
        activeMatrixRows.length > 0 &&
        activeMatrixRows.every(
            (item) => item.matrix.powerInfluence !== '' && item.matrix.currentCloseness !== '' && item.matrix.mutualValue !== ''
        )
    const relationalGapsCompleted = stakeholderSection.relationalGaps.some(
        (gap) => gap.relationalGap.trim().length > 0 && gap.criticalReason.trim().length > 0 && gap.minimumAction.trim().length > 0
    )
    const ecosystemMapCompleted = stakeholderSection.ecosystemMap.centerRole.trim().length > 0 && activeClassificationRows.some((item) => item.row.level !== '')
    const strategicTestCompleted = stakeholderSection.strategicReadTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )

    const section3Completed =
        inventoryCompleted &&
        classificationCompleted &&
        valueMatrixCompleted &&
        relationalGapsCompleted &&
        ecosystemMapCompleted &&
        strategicTestCompleted

    const allClassifiedRows = activeClassificationRows.filter((item) => item.row.level !== '')
    const allActorsLevel1 = allClassifiedRows.length >= 2 && allClassifiedRows.every((item) => item.row.level === '1')
    const hasHighInfluenceLowCloseness = actorRows.some(
        (item) => scoreToNumber(item.matrix.powerInfluence) >= 4 && scoreToNumber(item.matrix.currentCloseness) <= 2
    )
    const gapsMissing = stakeholderSection.relationalGaps.every(
        (gap) =>
            gap.relationalGap.trim().length === 0 && gap.criticalReason.trim().length === 0 && gap.minimumAction.trim().length === 0
    )
    const hasVagueStrategicReadings = actorRows.some((item) => {
        const reading = buildStrategicReading(item.matrix.powerInfluence, item.matrix.currentCloseness, item.matrix.mutualValue)
        return reading === 'Relación en evolución: ajustar estrategia según contexto'
    })

    const ring1Actors = actorRows.filter((item) => item.actor && item.row.level === '1')
    const ring2Actors = actorRows.filter((item) => item.actor && item.row.level === '2')
    const ring3Actors = actorRows.filter((item) => item.actor && item.row.level === '3')

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: section3Completed
    }

    const completedPages = PAGES.filter((page) => pageCompletionMap[page.id]).length
    const progressPercent = Math.round((completedPages / PAGES.length) * 100)
    const printMetaLabel = `Líder: ${state.identification.leaderName || 'Sin nombre'} · Rol: ${state.identification.role || 'Sin rol'}`

    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb7-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/workbooks-v2" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB7 - Mapeo del ecosistema estratégico</p>
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
                        Guardar página {currentPageIndex >= 0 ? currentPageIndex + 1 : activePage}
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
                    <aside className={`wb7-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
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
                                className="wb7-print-page wb7-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 3"
                                data-print-title="Portada e identificación"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb7-cover-hero relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-16 w-16 md:h-20 md:w-20" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Mapeo del ecosistema estratégico
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 7</p>
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
                                className="wb7-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
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
                                        Mapear tu ecosistema estratégico para identificar actores clave, relaciones de alto valor, sponsors potenciales y
                                        oportunidades de visibilidad, de modo que tu red deje de ser circunstancial y se convierta en un sistema consciente de
                                        generación de valor mutuo.
                                    </p>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Al finalizar este workbook tendrás</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Un mapa de stakeholders organizado por niveles.',
                                            'Una primera identificación de sponsors estratégicos.',
                                            'Una lectura más clara de tu red de alto valor.',
                                            'Una estrategia de networking consciente basada en valor mutuo.',
                                            'Un plan de visibilidad estratégica conectado con tu contexto real.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-3">
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
                                            {['Networking estratégico.', 'Inteligencia política y contextual.'].map((item) => (
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
                                                'Conectividad interna y externa.',
                                                'Gestión de relaciones (relationship management).',
                                                'Visibilidad estratégica.',
                                                'Lectura de poder y patrocinio.'
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
                                    <p className="mt-3 text-sm text-slate-700">Usa estas conductas como referencia para escribir evidencia real (no intención):</p>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Conecta activamente a su equipo con otras áreas para derribar silos y fomentar la colaboración interdepartamental.',
                                            'Participa en eventos de la industria y mantiene vínculos con stakeholders externos (clientes, proveedores) para detectar tendencias.',
                                            'Actúa como un "tejedor" de relaciones, facilitando el acceso a recursos y conocimientos críticos para el equipo a través de su red de contactos.',
                                            'Utiliza su capital social para apoyar a su equipo y abrir puertas a nuevas oportunidades de negocio o desarrollo.',
                                            'Se posiciona no solo como experto técnico, sino como un referente que aporta valor en comités y espacios de decisión.',
                                            'Construye relaciones basadas en la reciprocidad y el valor mutuo, no solo en la necesidad inmediata (transaccional).',
                                            'Identifica y cultiva activamente sponsors que hablen de él/ella en mesas de decisión.',
                                            'Mapea las dinámicas de poder informales en la organización para destrabar proyectos.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>

                                <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Reglas de oro</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'No confundas cercanía con valor estratégico.',
                                            'Antes de pedir acceso, influencia o apoyo, identifica qué valor puedes aportar.',
                                            'Tu red no se mide por cantidad de contactos, sino por calidad, confianza y reciprocidad.',
                                            'Si no mapeas poder, influencia y vacíos relacionales, tu networking seguirá siendo circunstancial.',
                                            'La visibilidad estratégica no es autopromoción; es hacer visible tu aporte en los espacios correctos.',
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
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-700 text-white px-6 py-3 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Guardar página 2
                                    </button>
                                </div>
                            </article>
                        )}

                        {isPageVisible(3) && (
                            <article
                                className="wb7-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 3 de 3"
                                data-print-title="Mapeo de stakeholders (niveles 1, 2 y 3)"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Mapeo de stakeholders (niveles 1, 2 y 3)
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Identifica y clasifica actores clave de tu ecosistema relacional para distinguir vínculos operativos, de influencia y de
                                        escalamiento con una lógica de red estratégica.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStakeholderHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Stakeholder: actor que influye o puede incidir en resultados, visibilidad, legitimidad o acceso a oportunidades.',
                                            'Niveles 1, 2 y 3: cercanía e impacto estratégico (no valor humano).',
                                            'Mapa relacional: lectura estructurada de influencia, cercanía, valor mutuo y riesgos de desconexión.',
                                            'Vacío relacional: ausencia de vínculo con un actor que debería estar conectado por estrategia.',
                                            'Red estratégica: relaciones diseñadas con criterio, valor mutuo y conexión deliberada con objetivos.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Inventario inicial de actores</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                inventoryCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {inventoryCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Lista actores de los últimos 30–60 días que inciden en resultados, visibilidad, acceso o legitimidad. Evita quedarte solo en
                                        quienes te resultan cercanos.
                                    </p>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <p className="mt-2 text-sm text-slate-600">
                                            Jefe directo, directora de unidad, par de operaciones, líder comercial, sponsor informal, cliente interno clave,
                                            proveedor estratégico, referente externo, exjefe y mentor con llegada a comité.
                                        </p>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {state.stakeholderMappingSection.actorInventory.map((actor, index) => (
                                            <label key={`wb7-inventory-${index}`} className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Actor {index + 1}</span>
                                                <input
                                                    type="text"
                                                    value={actor}
                                                    onChange={(event) => updateActorInventory(index, event.target.value)}
                                                    disabled={isLocked}
                                                    placeholder="Ej: Directora de unidad"
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStakeholderBlock('Paso 1 — Inventario inicial')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Clasificación por niveles 1, 2 y 3</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                classificationCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {classificationCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Clasifica cada actor según cercanía e impacto estratégico: nivel 1 (directo), nivel 2 (influencia relevante), nivel 3
                                        (periférico con valor futuro).
                                    </p>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <p className="mt-2 text-sm text-slate-600">
                                            Jefe directo (nivel 1, impacto alto), directora de unidad (nivel 2, visibilidad/decisión), referente externo (nivel 3,
                                            posicionamiento).
                                        </p>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1120px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Actor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nivel</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tipo de vínculo</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Frecuencia</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Impacto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {actorRows.map((item) => {
                                                    const disabledRow = isLocked || item.actor.length === 0
                                                    return (
                                                        <tr key={`wb7-classification-${item.index}`}>
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                                {item.actor || `Actor ${item.index + 1} (sin definir)`}
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.row.level}
                                                                    onChange={(event) => updateClassificationRow(item.index, 'level', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    <option value="1">Nivel 1</option>
                                                                    <option value="2">Nivel 2</option>
                                                                    <option value="3">Nivel 3</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.row.bondType}
                                                                    onChange={(event) => updateClassificationRow(item.index, 'bondType', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {BOND_TYPE_OPTIONS.map((option) => (
                                                                        <option key={`wb7-bond-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.row.contactFrequency}
                                                                    onChange={(event) => updateClassificationRow(item.index, 'contactFrequency', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {CONTACT_FREQUENCY_OPTIONS.map((option) => (
                                                                        <option key={`wb7-frequency-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.row.ecosystemImpact}
                                                                    onChange={(event) => updateClassificationRow(item.index, 'ecosystemImpact', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {ECOSYSTEM_IMPACT_OPTIONS.map((option) => (
                                                                        <option key={`wb7-impact-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
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
                                            onClick={() => saveStakeholderBlock('Paso 2 — Clasificación por niveles')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Matriz poder, cercanía y valor mutuo</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                valueMatrixCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {valueMatrixCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Evalúa cada actor con escala 1–5 y usa la lectura automática para identificar relaciones críticas, frágiles o con potencial
                                        estratégico subdesarrollado.
                                    </p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1120px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Actor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Poder / influencia</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Cercanía actual</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Valor mutuo</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Lectura estratégica (automática)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {actorRows.map((item) => {
                                                    const disabledRow = isLocked || item.actor.length === 0
                                                    const strategicReading = buildStrategicReading(
                                                        item.matrix.powerInfluence,
                                                        item.matrix.currentCloseness,
                                                        item.matrix.mutualValue
                                                    )
                                                    return (
                                                        <tr key={`wb7-matrix-${item.index}`}>
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                                {item.actor || `Actor ${item.index + 1} (sin definir)`}
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.matrix.powerInfluence}
                                                                    onChange={(event) => updateValueMatrixRow(item.index, 'powerInfluence', readScore(event.target.value))}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {['1', '2', '3', '4', '5'].map((option) => (
                                                                        <option key={`wb7-power-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.matrix.currentCloseness}
                                                                    onChange={(event) => updateValueMatrixRow(item.index, 'currentCloseness', readScore(event.target.value))}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {['1', '2', '3', '4', '5'].map((option) => (
                                                                        <option key={`wb7-closeness-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.matrix.mutualValue}
                                                                    onChange={(event) => updateValueMatrixRow(item.index, 'mutualValue', readScore(event.target.value))}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {['1', '2', '3', '4', '5'].map((option) => (
                                                                        <option key={`wb7-value-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">
                                                                {strategicReading || 'Completa la escala para generar lectura.'}
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
                                            onClick={() => saveStakeholderBlock('Paso 3 — Matriz poder, cercanía y valor mutuo')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Detección de vacíos relacionales</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                relationalGapsCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {relationalGapsCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Identifica al menos un vacío relacional crítico y define una acción mínima para activarlo en el corto plazo.
                                    </p>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {state.stakeholderMappingSection.relationalGaps.map((gap, index) => (
                                            <article key={`wb7-gap-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">Vacío relacional {index + 1}</p>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Vacío relacional</span>
                                                    <input
                                                        type="text"
                                                        value={gap.relationalGap}
                                                        onChange={(event) => updateRelationalGap(index, 'relationalGap', event.target.value)}
                                                        disabled={isLocked}
                                                        placeholder="Ej: Sin vínculo directo con directora estratégica"
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Por qué es crítico</span>
                                                    <textarea
                                                        value={gap.criticalReason}
                                                        onChange={(event) => updateRelationalGap(index, 'criticalReason', event.target.value)}
                                                        disabled={isLocked}
                                                        rows={3}
                                                        placeholder="Describe riesgo o costo"
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                                                    />
                                                </label>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Acción mínima para activarlo</span>
                                                    <textarea
                                                        value={gap.minimumAction}
                                                        onChange={(event) => updateRelationalGap(index, 'minimumAction', event.target.value)}
                                                        disabled={isLocked}
                                                        rows={3}
                                                        placeholder="Define siguiente paso concreto"
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                                                    />
                                                </label>
                                            </article>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStakeholderBlock('Paso 4 — Detección de vacíos relacionales')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Mapa visual del ecosistema</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                ecosystemMapCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {ecosystemMapCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Organiza los actores por anillos concéntricos y asigna símbolos para marcar sponsors potenciales, relaciones de alto valor,
                                        relaciones críticas/frágiles y vínculos a activar.
                                    </p>
                                    <label className="space-y-1 block">
                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Centro: Yo / mi rol actual</span>
                                        <input
                                            type="text"
                                            value={state.stakeholderMappingSection.ecosystemMap.centerRole}
                                            onChange={(event) => updateEcosystemCenterRole(event.target.value)}
                                            disabled={isLocked}
                                            placeholder="Ej: Líder de área de operaciones"
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </label>

                                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-4">
                                        <div className="rounded-xl bg-white border border-blue-200 px-4 py-3">
                                            <p className="text-xs uppercase tracking-[0.12em] text-blue-600 font-semibold">Centro</p>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {state.stakeholderMappingSection.ecosystemMap.centerRole.trim() || 'Completa tu rol para activar el centro.'}
                                            </p>
                                        </div>

                                        {[
                                            { title: 'Anillo 1 — Stakeholders nivel 1', rows: ring1Actors },
                                            { title: 'Anillo 2 — Stakeholders nivel 2', rows: ring2Actors },
                                            { title: 'Anillo 3 — Stakeholders nivel 3', rows: ring3Actors }
                                        ].map((ring) => (
                                            <article key={`wb7-ring-${ring.title}`} className="rounded-xl bg-white border border-blue-200 p-4 space-y-3">
                                                <h4 className="text-sm font-bold text-slate-900">{ring.title}</h4>
                                                {ring.rows.length === 0 ? (
                                                    <p className="text-sm text-slate-500">Sin actores clasificados en este anillo.</p>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {ring.rows.map((item) => (
                                                            <button
                                                                key={`wb7-ring-actor-${item.index}`}
                                                                type="button"
                                                                onClick={() => cycleActorSymbol(item.index)}
                                                                disabled={isLocked}
                                                                title="Haz clic para cambiar símbolo"
                                                                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                                            >
                                                                {item.symbol ? `${item.symbol} ` : ''}
                                                                {item.actor}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </article>
                                        ))}

                                        <div className="rounded-xl border border-blue-200 bg-white p-4">
                                            <p className="text-xs uppercase tracking-[0.12em] text-blue-600 font-semibold">Leyenda de símbolos</p>
                                            <p className="mt-2 text-sm text-slate-700">★ sponsor potencial · ▲ relación de alto valor · ! relación crítica/frágil · ○ vínculo a activar</p>
                                            <p className="mt-1 text-xs text-slate-500">Haz clic sobre cada actor para alternar símbolo.</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStakeholderBlock('Paso 5 — Mapa visual del ecosistema')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de lectura estratégica del ecosistema</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                strategicTestCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {strategicTestCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Verifica si tu red está diseñada con criterio estratégico y si el mapa ya orienta decisiones concretas de relacionamiento.
                                    </p>
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
                                                {state.stakeholderMappingSection.strategicReadTest.map((row, index) => (
                                                    <tr key={`wb7-test-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updateStrategicReadTestRow(index, 'verdict', event.target.value)}
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
                                                                onChange={(event) => updateStrategicReadTestRow(index, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="¿Qué necesitas ajustar?"
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
                                            onClick={() => saveStakeholderBlock('Paso 6 — Test de lectura estratégica')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                                    <h3 className="text-base font-bold text-slate-900">Validaciones suaves</h3>
                                    {allActorsLevel1 && (
                                        <p className="text-sm text-amber-800">Sugerencia: diferencia mejor cercanía actual e impacto estratégico.</p>
                                    )}
                                    {!hasHighInfluenceLowCloseness && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: revisa si hay relaciones estratégicas subdesarrolladas (alta influencia y baja cercanía).
                                        </p>
                                    )}
                                    {gapsMissing && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: todo ecosistema tiene relaciones por activar; revisa dónde dependes demasiado de pocos actores.
                                        </p>
                                    )}
                                    {hasVagueStrategicReadings && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: aclara si la relación es crítica, frágil, de alto valor o de potencial futuro.
                                        </p>
                                    )}
                                    {!allActorsLevel1 && hasHighInfluenceLowCloseness && !gapsMissing && !hasVagueStrategicReadings && (
                                        <p className="text-sm text-emerald-700">Sin alertas: tu estructura actual muestra una lectura estratégica más sólida.</p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">Estado de la sección</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {section3Completed
                                                    ? 'Completado: inventario, clasificación, matriz, vacíos, mapa y test diligenciados.'
                                                    : 'Pendiente: completa clasificación de actores y al menos un vacío relacional, junto con los demás bloques.'}
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
                            <nav className={`wb7-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
                                <button type="button" onClick={goPrevPage} disabled={!hasPrevPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavPrev}>
                                    <ArrowLeft size={16} />
                                    {WORKBOOK_V2_EDITORIAL.labels.back}
                                </button>

                                <div className="text-center">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.navigation}</p>
                                    <p className="text-sm font-bold text-slate-900">{PAGES[currentPageIndex]?.shortLabel ?? 'Página'}</p>
                                </div>

                                <button type="button" onClick={goNextPage} disabled={!hasNextPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavNext}>
                                    {WORKBOOK_V2_EDITORIAL.labels.next}
                                    <ArrowRight size={16} />
                                </button>
                            </nav>
                        )}

                        {showStakeholderHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
                                <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Ayuda — Mapeo de stakeholders</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStakeholderHelp(false)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Stakeholder no es solo quien está cerca; incluye quien influye o puede incidir en resultados, visibilidad o acceso.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Nivel 1, 2 y 3 describen cercanía e impacto estratégico, no “importancia humana”.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Una red estratégica se diseña con criterio y valor mutuo; no solo por proximidad o rutina.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            El mapa debe ayudarte a detectar sponsors, vacíos relacionales y relaciones de alto valor.
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
                    .wb7-toolbar,
                    .wb7-sidebar,
                    .wb7-page-nav {
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

                    .wb7-print-page {
                        break-after: page;
                        page-break-after: always;
                        position: relative;
                    }

                    .wb7-print-page:not(.wb7-cover-page)::before {
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

                    .wb7-print-page::after {
                        content: attr(data-print-meta);
                        position: absolute;
                        bottom: -10mm;
                        left: 0;
                        font-size: 9px;
                        letter-spacing: 0.04em;
                        color: #475569;
                    }

                    .wb7-cover-page {
                        min-height: calc(297mm - 36mm);
                    }

                    .wb7-cover-page::before {
                        content: none !important;
                    }

                    .wb7-cover-hero {
                        min-height: 54vh !important;
                    }
                }
            `}</style>
        </div>
    )
}
