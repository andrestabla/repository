'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3 | 4
type YesNoAnswer = '' | 'yes' | 'no'
type StakeholderLevel = '' | '1' | '2' | '3'
type StakeholderSymbol = '' | '★' | '▲' | '!' | '○'
type SponsorLevel = '' | 'bajo' | 'medio' | 'alto'

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
    sponsorIdentificationSection: {
        possibleSponsors: string[]
        sponsorMatrixRows: Array<{
            influenceAccess: Score15
            currentCloseness: Score15
            valueExposure: Score15
            probableDisposition: Score15
        }>
        sponsorshipIndexRows: Array<{
            factor: string
            level: SponsorLevel
            evidence: string
        }>
        valueBeforeAskingRows: Array<{
            prioritySponsor: string
            currentPriority: string
            firstValue: string
            avoidAction: string
        }>
        activationRoute: {
            prioritySponsor: string
            accessPath: string
            realisticMove: string
            progressSignal: string
            mainRisk: string
            nextStep15Days: string
        }
        sponsorReadTest: Array<{
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
    { id: 3, label: '3. Mapeo de stakeholders (niveles 1, 2 y 3)', shortLabel: 'Stakeholders' },
    { id: 4, label: '4. Identificación de sponsors', shortLabel: 'Sponsors' }
]

const STORAGE_KEY = 'workbooks-v2-wb7-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb7-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb7-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb7-presentation-seen'

const INVENTORY_ROWS = 10
const SPONSOR_ROWS = 6
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
const SPONSORSHIP_INDEX_FACTORS = [
    'Resultados visibles',
    'Reputación confiable',
    'Claridad de aporte',
    'Consistencia relacional',
    'Visibilidad estratégica',
    'Capacidad de reciprocidad'
] as const
const SPONSOR_TEST_QUESTIONS = [
    '¿Diferencio mentor y sponsor?',
    '¿Identifico sponsors prioritarios reales?',
    '¿Sé qué valor aportar primero?',
    '¿Distingo sponsor natural de sponsor aspiracional?',
    '¿Tengo una vía de acceso realista?',
    '¿Estoy evitando pedir patrocinio demasiado pronto?'
] as const
const SPONSOR_ACCESS_OPTIONS = ['Directa', 'Por puente', 'Por visibilidad gradual'] as const

const readString = (value: unknown): string => (typeof value === 'string' ? value : '')

const readYesNo = (value: unknown): YesNoAnswer => (value === 'yes' || value === 'no' ? value : '')

const readLevel = (value: unknown): StakeholderLevel => (value === '1' || value === '2' || value === '3' ? value : '')

const readScore = (value: unknown): Score15 => (value === '1' || value === '2' || value === '3' || value === '4' || value === '5' ? value : '')

const readSymbol = (value: unknown): StakeholderSymbol => (MAP_RING_SYMBOLS.includes(value as StakeholderSymbol) ? (value as StakeholderSymbol) : '')
const readSponsorLevel = (value: unknown): SponsorLevel => (value === 'bajo' || value === 'medio' || value === 'alto' ? value : '')

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

const buildSponsorType = (influence: Score15, closeness: Score15, exposure: Score15, disposition: Score15): string => {
    const i = scoreToNumber(influence)
    const c = scoreToNumber(closeness)
    const e = scoreToNumber(exposure)
    const d = scoreToNumber(disposition)

    if (!i && !c && !e && !d) return ''
    if (i >= 4 && c >= 4 && e >= 4 && d >= 4) return 'Sponsor natural'
    if (i >= 4 && (c <= 2 || e <= 2) && d >= 2) return 'Sponsor potencial lejano'
    if (i >= 4 && e >= 3 && d >= 3) return 'Sponsor potencial'
    if (i <= 2) return 'Sponsor improbable (baja influencia)'
    if (d <= 2) return 'Sponsor improbable (baja disposición)'
    return 'Sponsor en desarrollo'
}

const getConcentricPosition = (
    index: number,
    total: number,
    radiusPercent: number,
    startAngleDeg: number = -90
): { x: number; y: number } => {
    if (total <= 0) return { x: 50, y: 50 }
    const step = 360 / total
    const angle = ((startAngleDeg + index * step) * Math.PI) / 180
    const rawX = 50 + radiusPercent * Math.cos(angle)
    const rawY = 50 + radiusPercent * Math.sin(angle)
    const clamp = (value: number) => Math.min(86, Math.max(14, value))
    return {
        x: clamp(rawX),
        y: clamp(rawY)
    }
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
    },
    sponsorIdentificationSection: {
        possibleSponsors: Array.from({ length: SPONSOR_ROWS }, () => ''),
        sponsorMatrixRows: Array.from({ length: SPONSOR_ROWS }, () => ({
            influenceAccess: '' as Score15,
            currentCloseness: '' as Score15,
            valueExposure: '' as Score15,
            probableDisposition: '' as Score15
        })),
        sponsorshipIndexRows: SPONSORSHIP_INDEX_FACTORS.map((factor) => ({
            factor,
            level: '' as SponsorLevel,
            evidence: ''
        })),
        valueBeforeAskingRows: Array.from({ length: 3 }, () => ({
            prioritySponsor: '',
            currentPriority: '',
            firstValue: '',
            avoidAction: ''
        })),
        activationRoute: {
            prioritySponsor: '',
            accessPath: '',
            realisticMove: '',
            progressSignal: '',
            mainRisk: '',
            nextStep15Days: ''
        },
        sponsorReadTest: SPONSOR_TEST_QUESTIONS.map((question) => ({
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
    const sponsorSection = (parsed.sponsorIdentificationSection ?? {}) as Record<string, unknown>
    const rawPossibleSponsors = Array.isArray(sponsorSection.possibleSponsors) ? sponsorSection.possibleSponsors : []
    const rawSponsorMatrixRows = Array.isArray(sponsorSection.sponsorMatrixRows) ? sponsorSection.sponsorMatrixRows : []
    const rawSponsorshipIndexRows = Array.isArray(sponsorSection.sponsorshipIndexRows) ? sponsorSection.sponsorshipIndexRows : []
    const rawValueBeforeAskingRows = Array.isArray(sponsorSection.valueBeforeAskingRows) ? sponsorSection.valueBeforeAskingRows : []
    const rawActivationRoute = (sponsorSection.activationRoute ?? {}) as Record<string, unknown>
    const rawSponsorReadTest = Array.isArray(sponsorSection.sponsorReadTest) ? sponsorSection.sponsorReadTest : []

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
        },
        sponsorIdentificationSection: {
            possibleSponsors: Array.from({ length: SPONSOR_ROWS }, (_, index) => readString(rawPossibleSponsors[index])),
            sponsorMatrixRows: Array.from({ length: SPONSOR_ROWS }, (_, index) => {
                const row = (rawSponsorMatrixRows[index] ?? {}) as Record<string, unknown>
                return {
                    influenceAccess: readScore(row.influenceAccess),
                    currentCloseness: readScore(row.currentCloseness),
                    valueExposure: readScore(row.valueExposure),
                    probableDisposition: readScore(row.probableDisposition)
                }
            }),
            sponsorshipIndexRows: SPONSORSHIP_INDEX_FACTORS.map((factor, index) => {
                const row = (rawSponsorshipIndexRows[index] ?? {}) as Record<string, unknown>
                return {
                    factor,
                    level: readSponsorLevel(row.level),
                    evidence: readString(row.evidence)
                }
            }),
            valueBeforeAskingRows: Array.from({ length: 3 }, (_, index) => {
                const row = (rawValueBeforeAskingRows[index] ?? {}) as Record<string, unknown>
                return {
                    prioritySponsor: readString(row.prioritySponsor),
                    currentPriority: readString(row.currentPriority),
                    firstValue: readString(row.firstValue),
                    avoidAction: readString(row.avoidAction)
                }
            }),
            activationRoute: {
                prioritySponsor: readString(rawActivationRoute.prioritySponsor),
                accessPath: readString(rawActivationRoute.accessPath),
                realisticMove: readString(rawActivationRoute.realisticMove),
                progressSignal: readString(rawActivationRoute.progressSignal),
                mainRisk: readString(rawActivationRoute.mainRisk),
                nextStep15Days: readString(rawActivationRoute.nextStep15Days)
            },
            sponsorReadTest: SPONSOR_TEST_QUESTIONS.map((question, index) => {
                const row = (rawSponsorReadTest[index] ?? {}) as Record<string, unknown>
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
    const [showSponsorHelp, setShowSponsorHelp] = useState(false)

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

    const updatePossibleSponsor = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const possibleSponsors = [...prev.sponsorIdentificationSection.possibleSponsors]
            possibleSponsors[index] = value
            return {
                ...prev,
                sponsorIdentificationSection: {
                    ...prev.sponsorIdentificationSection,
                    possibleSponsors
                }
            }
        })
    }

    const updateSponsorMatrixRow = (
        index: number,
        field: keyof WB7State['sponsorIdentificationSection']['sponsorMatrixRows'][number],
        value: Score15
    ) => {
        if (isLocked) return
        setState((prev) => {
            const sponsorMatrixRows = [...prev.sponsorIdentificationSection.sponsorMatrixRows]
            sponsorMatrixRows[index] = {
                ...sponsorMatrixRows[index],
                [field]: value
            }
            return {
                ...prev,
                sponsorIdentificationSection: {
                    ...prev.sponsorIdentificationSection,
                    sponsorMatrixRows
                }
            }
        })
    }

    const updateSponsorshipIndexRow = (index: number, field: 'level' | 'evidence', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const sponsorshipIndexRows = [...prev.sponsorIdentificationSection.sponsorshipIndexRows]
            sponsorshipIndexRows[index] =
                field === 'level'
                    ? { ...sponsorshipIndexRows[index], level: readSponsorLevel(value) }
                    : { ...sponsorshipIndexRows[index], evidence: value }
            return {
                ...prev,
                sponsorIdentificationSection: {
                    ...prev.sponsorIdentificationSection,
                    sponsorshipIndexRows
                }
            }
        })
    }

    const updateValueBeforeAskingRow = (
        index: number,
        field: keyof WB7State['sponsorIdentificationSection']['valueBeforeAskingRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const valueBeforeAskingRows = [...prev.sponsorIdentificationSection.valueBeforeAskingRows]
            valueBeforeAskingRows[index] = {
                ...valueBeforeAskingRows[index],
                [field]: value
            }
            return {
                ...prev,
                sponsorIdentificationSection: {
                    ...prev.sponsorIdentificationSection,
                    valueBeforeAskingRows
                }
            }
        })
    }

    const updateActivationRoute = (
        field: keyof WB7State['sponsorIdentificationSection']['activationRoute'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            sponsorIdentificationSection: {
                ...prev.sponsorIdentificationSection,
                activationRoute: {
                    ...prev.sponsorIdentificationSection.activationRoute,
                    [field]: value
                }
            }
        }))
    }

    const updateSponsorReadTestRow = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const sponsorReadTest = [...prev.sponsorIdentificationSection.sponsorReadTest]
            sponsorReadTest[index] =
                field === 'verdict'
                    ? { ...sponsorReadTest[index], verdict: readYesNo(value) }
                    : { ...sponsorReadTest[index], adjustment: value }
            return {
                ...prev,
                sponsorIdentificationSection: {
                    ...prev.sponsorIdentificationSection,
                    sponsorReadTest
                }
            }
        })
    }

    const saveSponsorBlock = (label: string) => {
        savePage(4)
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
    const ring1Positions = ring1Actors.map((_, index) => getConcentricPosition(index, ring1Actors.length, 18, -90))
    const ring2Positions = ring2Actors.map((_, index) => getConcentricPosition(index, ring2Actors.length, 30, -30))
    const ring3Positions = ring3Actors.map((_, index) => getConcentricPosition(index, ring3Actors.length, 42, 20))

    const sponsorSection = state.sponsorIdentificationSection
    const sponsorRows = sponsorSection.possibleSponsors.map((name, index) => ({
        index,
        name: name.trim(),
        row: sponsorSection.sponsorMatrixRows[index]
    }))
    const sponsorsDefined = sponsorRows.filter((item) => item.name.length > 0)
    const sponsorsInventoryCompleted = sponsorsDefined.length >= 1
    const sponsorMatrixCompleted =
        sponsorsDefined.length > 0 &&
        sponsorsDefined.every(
            (item) =>
                item.row.influenceAccess !== '' &&
                item.row.currentCloseness !== '' &&
                item.row.valueExposure !== '' &&
                item.row.probableDisposition !== ''
        )
    const sponsorshipIndexCompleted = sponsorSection.sponsorshipIndexRows.every(
        (row) => row.level !== '' && row.evidence.trim().length > 0
    )
    const valueBeforeAskingCompleted = sponsorSection.valueBeforeAskingRows.every(
        (row) =>
            row.prioritySponsor.trim().length > 0 &&
            row.currentPriority.trim().length > 0 &&
            row.firstValue.trim().length > 0 &&
            row.avoidAction.trim().length > 0
    )
    const activationRoute = sponsorSection.activationRoute
    const sponsorActivationCompleted =
        activationRoute.prioritySponsor.trim().length > 0 &&
        activationRoute.accessPath.trim().length > 0 &&
        activationRoute.realisticMove.trim().length > 0 &&
        activationRoute.progressSignal.trim().length > 0 &&
        activationRoute.mainRisk.trim().length > 0 &&
        activationRoute.nextStep15Days.trim().length > 0
    const sponsorTestCompleted = sponsorSection.sponsorReadTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const hasPrioritySponsor =
        activationRoute.prioritySponsor.trim().length > 0 ||
        sponsorSection.valueBeforeAskingRows.some((row) => row.prioritySponsor.trim().length > 0)
    const section4Completed =
        sponsorsInventoryCompleted &&
        sponsorMatrixCompleted &&
        sponsorshipIndexCompleted &&
        valueBeforeAskingCompleted &&
        sponsorActivationCompleted &&
        sponsorTestCompleted &&
        hasPrioritySponsor

    const allSponsorsDistant = sponsorsDefined.length > 0 && sponsorsDefined.every((item) => scoreToNumber(item.row.currentCloseness) <= 2)
    const noValueBeforeAsking = sponsorSection.valueBeforeAskingRows.every((row) => row.firstValue.trim().length === 0)
    const allHighInfluenceLowExposure =
        sponsorsDefined.length > 0 &&
        sponsorsDefined.every((item) => scoreToNumber(item.row.influenceAccess) >= 4 && scoreToNumber(item.row.valueExposure) <= 2)
    const activationRouteVague = !sponsorActivationCompleted

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: section3Completed,
        4: section4Completed
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
                                data-print-page="Página 1 de 4"
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
                                data-print-page="Página 2 de 4"
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
                                data-print-page="Página 3 de 4"
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
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Trabaja con tu contexto real de los últimos 30 a 60 días.',
                                                'No te limites a personas cercanas; incluye actores que influyen en resultados, visibilidad, legitimidad o acceso.',
                                                'Asegura mezcla interna y externa: jerárquicos, pares, aliados transversales, clientes, partners y referentes.'
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
                                                'Actor 1: Jefe directo',
                                                'Actor 2: Directora de unidad',
                                                'Actor 3: Par de operaciones',
                                                'Actor 4: Líder comercial',
                                                'Actor 5: Sponsor informal de otra gerencia',
                                                'Actor 6: Cliente interno clave',
                                                'Actor 7: Proveedor estratégico',
                                                'Actor 8: Referente externo del sector',
                                                'Actor 9: Exjefe con alta credibilidad',
                                                'Actor 10: Mentor con llegada a comité'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
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
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Nivel 1: relación directa, frecuente e impacto inmediato.',
                                                'Nivel 2: conexión al sistema cercano con influencia relevante, sin interacción diaria.',
                                                'Nivel 3: actor periférico con valor estratégico futuro o capacidad de abrir oportunidades.',
                                                'Completa además tipo de vínculo, frecuencia e impacto para evitar clasificaciones vagas.'
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
                                                'Jefe directo → Nivel 1 · Jerárquico/coordinación · Frecuencia alta · Impacto alto.',
                                                'Par de operaciones → Nivel 1 · Colaboración transversal · Frecuencia alta · Impacto medio-alto.',
                                                'Directora de unidad → Nivel 2 · Visibilidad/decisión · Frecuencia media · Impacto alto.',
                                                'Sponsor informal → Nivel 2 · Reputación/acceso · Frecuencia baja-media · Impacto alto.',
                                                'Referente externo → Nivel 3 · Posicionamiento/networking · Frecuencia baja · Impacto medio-alto.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
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
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Poder/influencia: cuánto puede mover decisiones, recursos, reputación o acceso.',
                                                'Cercanía actual: calidad y frecuencia real de la relación hoy.',
                                                'Valor mutuo: nivel de intercambio útil y recíproco, más allá de contacto superficial.',
                                                'Usa la lectura automática como base y ajusta tu estrategia de relación a partir de ese resultado.'
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
                                                'Directora de unidad: poder 5, cercanía 2, valor mutuo 2 → Alta influencia, baja cercanía: relación a desarrollar.',
                                                'Jefe directo: poder 4, cercanía 4, valor mutuo 4 → Relación crítica y relativamente sólida.',
                                                'Sponsor informal: poder 4, cercanía 2, valor mutuo 3 → Relación estratégica subdesarrollada.',
                                                'Referente externo: poder 3, cercanía 1, valor mutuo 2 → Existe acceso, falta fortalecer valor mutuo.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
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
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Detecta qué actor debería estar en tu mapa y hoy no está suficientemente conectado.',
                                                'Evalúa dónde dependes de una sola persona para acceso o visibilidad.',
                                                'Especifica por qué el vacío es crítico y cuál es la acción mínima para activarlo en 15–30 días.'
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
                                                'Vacío 1: no tengo vínculo directo con la directora que valida iniciativas estratégicas.',
                                                'Por qué es crítico: dependo de visibilidad indirecta y eso limita posicionamiento.',
                                                'Acción mínima: activar conversación puente con apoyo del jefe directo.',
                                                'Vacío 2: red externa del sector débil.',
                                                'Por qué es crítico: reduce aprendizaje comparativo y visibilidad estratégica.',
                                                'Acción mínima: reactivar dos contactos externos y asistir a un evento clave este mes.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
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
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Centro: escribe tu rol actual para anclar el mapa en tu contexto real.',
                                                'Anillo 1: stakeholders nivel 1; anillo 2: nivel 2; anillo 3: nivel 3.',
                                                'Asigna símbolos por actor según lectura: ★ sponsor potencial, ▲ alto valor, ! relación crítica/frágil, ○ vínculo a activar.'
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
                                                'Centro: Yo / líder de área.',
                                                'Anillo 1: jefe directo, equipo, par de operaciones.',
                                                'Anillo 2: directora de unidad ★ !, sponsor informal ▲, líder comercial.',
                                                'Anillo 3: referente externo ○, exjefe ▲, mentor ★.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
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

                                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-5">
                                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-4 items-start">
                                            <div className="relative mx-auto w-full max-w-[780px] h-[460px] md:h-[560px] rounded-2xl border border-blue-200 bg-gradient-to-b from-[#f8fbff] to-[#edf4ff] overflow-hidden">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="relative w-[94%] h-[94%]">
                                                        <div className="absolute left-1/2 top-1/2 w-[92%] h-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200 bg-blue-50/20" />
                                                        <div className="absolute left-1/2 top-1/2 w-[68%] h-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300 bg-blue-50/25" />
                                                        <div className="absolute left-1/2 top-1/2 w-[44%] h-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400 bg-blue-50/35" />

                                                        {ring3Actors.map((item, index) => {
                                                            const pos = ring3Positions[index]
                                                            return (
                                                                <button
                                                                    key={`wb7-concentric-ring3-${item.index}`}
                                                                    type="button"
                                                                    onClick={() => cycleActorSymbol(item.index)}
                                                                    disabled={isLocked}
                                                                    title={`Anillo 3 · ${item.actor}`}
                                                                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                                                    className="absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full border border-blue-300 bg-white px-2 py-1 text-[11px] md:text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed max-w-[112px] md:max-w-[170px] shadow-sm"
                                                                >
                                                                    {item.symbol ? <span className="shrink-0">{item.symbol}</span> : null}
                                                                    <span className="truncate">{item.actor}</span>
                                                                </button>
                                                            )
                                                        })}

                                                        {ring2Actors.map((item, index) => {
                                                            const pos = ring2Positions[index]
                                                            return (
                                                                <button
                                                                    key={`wb7-concentric-ring2-${item.index}`}
                                                                    type="button"
                                                                    onClick={() => cycleActorSymbol(item.index)}
                                                                    disabled={isLocked}
                                                                    title={`Anillo 2 · ${item.actor}`}
                                                                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                                                    className="absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full border border-blue-400 bg-white px-2 py-1 text-[11px] md:text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed max-w-[112px] md:max-w-[170px] shadow-sm"
                                                                >
                                                                    {item.symbol ? <span className="shrink-0">{item.symbol}</span> : null}
                                                                    <span className="truncate">{item.actor}</span>
                                                                </button>
                                                            )
                                                        })}

                                                        {ring1Actors.map((item, index) => {
                                                            const pos = ring1Positions[index]
                                                            return (
                                                                <button
                                                                    key={`wb7-concentric-ring1-${item.index}`}
                                                                    type="button"
                                                                    onClick={() => cycleActorSymbol(item.index)}
                                                                    disabled={isLocked}
                                                                    title={`Anillo 1 · ${item.actor}`}
                                                                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                                                    className="absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full border border-blue-500 bg-white px-2 py-1 text-[11px] md:text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed max-w-[112px] md:max-w-[170px] shadow-sm"
                                                                >
                                                                    {item.symbol ? <span className="shrink-0">{item.symbol}</span> : null}
                                                                    <span className="truncate">{item.actor}</span>
                                                                </button>
                                                            )
                                                        })}

                                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[32%] max-w-[250px] min-w-[150px] rounded-2xl border border-blue-500 bg-white px-3 py-2.5 text-center shadow-sm">
                                                            <p className="text-[10px] uppercase tracking-[0.14em] text-blue-700 font-semibold">Centro</p>
                                                            <p className="mt-1 text-sm md:text-base font-bold text-slate-900 leading-tight">
                                                                {state.stakeholderMappingSection.ecosystemMap.centerRole.trim() || 'Completa tu rol'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {ring1Actors.length === 0 && ring2Actors.length === 0 && ring3Actors.length === 0 && (
                                                    <div className="absolute inset-x-6 bottom-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center">
                                                        <p className="text-xs text-amber-800">
                                                            Aún no hay stakeholders clasificados por niveles. Completa el Paso 2 para visualizar el mapa concéntrico.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <aside className="space-y-2.5">
                                                {[
                                                    { title: 'Anillo 1', subtitle: 'Stakeholders nivel 1', color: 'border-blue-500 text-blue-800', count: ring1Actors.length },
                                                    { title: 'Anillo 2', subtitle: 'Stakeholders nivel 2', color: 'border-blue-400 text-blue-700', count: ring2Actors.length },
                                                    { title: 'Anillo 3', subtitle: 'Stakeholders nivel 3', color: 'border-blue-300 text-blue-600', count: ring3Actors.length }
                                                ].map((ring) => (
                                                    <div key={`wb7-ring-guide-${ring.title}`} className={`rounded-xl border bg-white px-3 py-2 ${ring.color}`}>
                                                        <p className="text-xs uppercase tracking-[0.12em] font-semibold">{ring.title}</p>
                                                        <p className="text-xs mt-0.5">{ring.subtitle}</p>
                                                        <p className="text-xs mt-1 text-slate-500">{ring.count} actor{ring.count === 1 ? '' : 'es'}</p>
                                                    </div>
                                                ))}
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                    Haz clic sobre cualquier actor del mapa para alternar símbolo y marcar prioridad relacional.
                                                </p>
                                            </aside>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {[
                                                { label: 'Anillo 1', rows: ring1Actors },
                                                { label: 'Anillo 2', rows: ring2Actors },
                                                { label: 'Anillo 3', rows: ring3Actors }
                                            ].map((ring) => (
                                                <article key={`wb7-ring-summary-${ring.label}`} className="rounded-xl border border-blue-200 bg-white p-3">
                                                    <p className="text-xs uppercase tracking-[0.12em] text-blue-700 font-semibold">{ring.label}</p>
                                                    <p className="mt-1 text-sm text-slate-700">
                                                        {ring.rows.length > 0 ? ring.rows.map((item) => item.actor).join(', ') : 'Sin stakeholders en este anillo.'}
                                                    </p>
                                                </article>
                                            ))}
                                        </div>

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
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Marca Sí o No con honestidad para cada pregunta del test.',
                                                'Cuando marques No, registra un ajuste concreto para la próxima iteración.',
                                                'Usa este bloque para transformar el mapa en decisiones accionables de networking.'
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
                                                'Señal débil: mapa centrado solo en quienes ya te rodean cotidianamente.',
                                                'Señal mejorada: mapa que distingue influencia, cercanía, valor mutuo y vacíos críticos.'
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

                        {isPageVisible(4) && (
                            <article
                                className="wb7-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 4 de 4"
                                data-print-title="Identificación de sponsors"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 4</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Identificación de sponsors</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Identifica sponsors estratégicos reales y potenciales para activar visibilidad, acceso y legitimidad desde una aproximación
                                        basada en valor.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowSponsorHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Sponsor estratégico: abre puertas, visibiliza y pone reputación en juego por tu valor.',
                                            'Mentor orienta; sponsor moviliza oportunidades activamente.',
                                            'Patrocinio activo: recomendar, incluir, visibilizar, defender o nominar.',
                                            'Antes de pedir respaldo: valor visible, relación suficiente y lectura política.',
                                            'Distingue sponsor natural, potencial, lejano e improbable.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Inventario de sponsors posibles</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                sponsorsInventoryCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {sponsorsInventoryCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Lista actores con influencia real y acceso a decisiones.',
                                                'Incluye internos, externos y aliados de industria relevantes.',
                                                'Prioriza quienes ya amplifican talento o resultados.'
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
                                                'Sponsor posible 1: Directora de unidad',
                                                'Sponsor posible 2: Exjefe con alta reputación',
                                                'Sponsor posible 3: Sponsor informal de otra gerencia',
                                                'Sponsor posible 4: Mentor con llegada a comité',
                                                'Sponsor posible 5: Referente externo del sector',
                                                'Sponsor posible 6: Líder comercial con alta exposición ejecutiva'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {sponsorSection.possibleSponsors.map((sponsor, index) => (
                                            <label key={`wb7-sponsor-possible-${index}`} className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Sponsor posible {index + 1}</span>
                                                <input
                                                    type="text"
                                                    value={sponsor}
                                                    onChange={(event) => updatePossibleSponsor(index, event.target.value)}
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
                                            onClick={() => saveSponsorBlock('Paso 1 — Inventario de sponsors')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz sponsor: influencia, cercanía y disposición</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                sponsorMatrixCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {sponsorMatrixCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Califica cada sponsor posible de 1 a 5 y usa el tipo automático para distinguir natural, potencial, lejano o improbable.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Influencia/acceso: capacidad de abrir puertas o mover decisiones.',
                                                'Cercanía actual: nivel real de relación y confianza.',
                                                'Exposición a tu valor: cuánto conoce esa persona tus resultados.',
                                                'Disposición probable: viabilidad real de apoyo activo.'
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
                                                'Directora de unidad: 5 / 2 / 2 / 2 → Sponsor potencial lejano.',
                                                'Exjefe con reputación: 4 / 4 / 5 / 4 → Sponsor natural.',
                                                'Sponsor informal: 4 / 2 / 3 / 3 → Sponsor potencial.',
                                                'Mentor con llegada a comité: 3 / 4 / 4 / 4 → Sponsor natural.'
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
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Actor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Influencia / acceso</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Cercanía</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Exposición a mi valor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Disposición probable</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tipo (automático)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sponsorRows.map((item) => {
                                                    const disabledRow = isLocked || item.name.length === 0
                                                    const autoType = buildSponsorType(
                                                        item.row.influenceAccess,
                                                        item.row.currentCloseness,
                                                        item.row.valueExposure,
                                                        item.row.probableDisposition
                                                    )
                                                    return (
                                                        <tr key={`wb7-sponsor-matrix-${item.index}`}>
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                                {item.name || `Sponsor ${item.index + 1} (sin definir)`}
                                                            </td>
                                                            {(['influenceAccess', 'currentCloseness', 'valueExposure', 'probableDisposition'] as const).map((field) => (
                                                                <td key={`wb7-sponsor-matrix-${item.index}-${field}`} className="px-3 py-2 border-b border-slate-100">
                                                                    <select
                                                                        value={item.row[field]}
                                                                        onChange={(event) => updateSponsorMatrixRow(item.index, field, readScore(event.target.value))}
                                                                        disabled={disabledRow}
                                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                    >
                                                                        <option value="">Selecciona</option>
                                                                        {['1', '2', '3', '4', '5'].map((option) => (
                                                                            <option key={`wb7-sponsor-option-${item.index}-${field}-${option}`} value={option}>
                                                                                {option}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                            ))}
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">
                                                                {autoType || 'Completa los puntajes para clasificar.'}
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
                                            onClick={() => saveSponsorBlock('Paso 2 — Matriz de sponsors')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Índice de patrocinabilidad propia</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                sponsorshipIndexCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {sponsorshipIndexCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Evalúa tu preparación para recibir patrocinio real con evidencia observable, no solo intención.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Selecciona Bajo/Medio/Alto por cada factor de patrocinabilidad.',
                                                'Acompaña cada selección con evidencia concreta y reciente.',
                                                'Si no hay evidencia, registra explícitamente “No tengo evidencia reciente”.'
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
                                                'Resultados visibles: Medio (trabajo sólido, poca exposición ejecutiva).',
                                                'Reputación confiable: Alto (cumplimiento consistente).',
                                                'Claridad de aporte: Medio (valor entendido de forma desigual).',
                                                'Visibilidad estratégica: Bajo (dependencia de visibilidad indirecta).'
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
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Factor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nivel</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Evidencia / señal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sponsorSection.sponsorshipIndexRows.map((row, index) => (
                                                    <tr key={`wb7-sponsor-index-${row.factor}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.factor}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.level}
                                                                onChange={(event) => updateSponsorshipIndexRow(index, 'level', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="bajo">Bajo</option>
                                                                <option value="medio">Medio</option>
                                                                <option value="alto">Alto</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.evidence}
                                                                onChange={(event) => updateSponsorshipIndexRow(index, 'evidence', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Evidencia concreta"
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
                                            onClick={() => saveSponsorBlock('Paso 3 — Índice de patrocinabilidad')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Mapa de valor antes de pedir</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                valueBeforeAskingCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {valueBeforeAskingCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Define qué valor aportar primero antes de solicitar respaldo para evitar un acercamiento oportunista.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Selecciona sponsors prioritarios sobre los que puedas construir relación real.',
                                                'Explicita qué les importa hoy y cómo puedes contribuir primero.',
                                                'Define con claridad qué comportamiento debes evitar para no sonar transaccional.'
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
                                                'Directora de unidad: le importa foco estratégico; aportar síntesis ejecutivas útiles; evitar pedir exposición sin evidencia.',
                                                'Exjefe con reputación: le importa talento confiable; compartir avances concretos; evitar aparecer solo al pedir recomendación.',
                                                'Sponsor informal: le importa impacto transversal; conectar trabajo con su agenda; evitar forzar cercanía.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1120px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sponsor prioritario</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué le importa</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué valor puedo aportar primero</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué no debo hacer</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sponsorSection.valueBeforeAskingRows.map((row, index) => (
                                                    <tr key={`wb7-value-before-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.prioritySponsor}
                                                                onChange={(event) => updateValueBeforeAskingRow(index, 'prioritySponsor', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona sponsor</option>
                                                                {sponsorsDefined.map((item) => (
                                                                    <option key={`wb7-sponsor-priority-${item.index}`} value={item.name}>
                                                                        {item.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.currentPriority}
                                                                onChange={(event) => updateValueBeforeAskingRow(index, 'currentPriority', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Qué le importa"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.firstValue}
                                                                onChange={(event) => updateValueBeforeAskingRow(index, 'firstValue', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Valor previo que pondrás"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.avoidAction}
                                                                onChange={(event) => updateValueBeforeAskingRow(index, 'avoidAction', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Error a evitar"
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
                                            onClick={() => saveSponsorBlock('Paso 4 — Mapa de valor antes de pedir')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Ruta de activación del sponsor</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                sponsorActivationCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {sponsorActivationCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Elige un sponsor prioritario realista para los próximos 15 días.',
                                                'Define una vía de acceso viable: directa, por puente o por visibilidad gradual.',
                                                'Concreta movimiento inicial, señal de avance, riesgo principal y siguiente paso verificable.'
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
                                                'Sponsor prioritario: Directora de unidad.',
                                                'Vía de acceso: por puente con jefe directo.',
                                                'Movimiento inicial: presentar síntesis ejecutiva en espacio compartido.',
                                                'Señal de avance: reconocimiento explícito de criterio o invitación a iniciativa.',
                                                'Riesgo principal: parecer oportunista.',
                                                'Próximo paso (15 días): pedir al jefe un espacio breve de exposición con foco estratégico.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className="space-y-1 block md:col-span-2">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Sponsor prioritario</span>
                                            <select
                                                value={activationRoute.prioritySponsor}
                                                onChange={(event) => updateActivationRoute('prioritySponsor', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            >
                                                <option value="">Selecciona sponsor</option>
                                                {sponsorsDefined.map((item) => (
                                                    <option key={`wb7-route-sponsor-${item.index}`} value={item.name}>
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="space-y-1 block">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Vía de acceso</span>
                                            <select
                                                value={activationRoute.accessPath}
                                                onChange={(event) => updateActivationRoute('accessPath', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            >
                                                <option value="">Selecciona</option>
                                                {SPONSOR_ACCESS_OPTIONS.map((option) => (
                                                    <option key={`wb7-access-path-${option}`} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="space-y-1 block">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Señal de avance</span>
                                            <input
                                                type="text"
                                                value={activationRoute.progressSignal}
                                                onChange={(event) => updateActivationRoute('progressSignal', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Qué señal buscarás"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1 block md:col-span-2">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Movimiento inicial realista</span>
                                            <textarea
                                                value={activationRoute.realisticMove}
                                                onChange={(event) => updateActivationRoute('realisticMove', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                placeholder="Primer movimiento concreto"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                                            />
                                        </label>
                                        <label className="space-y-1 block">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Riesgo principal</span>
                                            <textarea
                                                value={activationRoute.mainRisk}
                                                onChange={(event) => updateActivationRoute('mainRisk', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                placeholder="Riesgo si te acercas mal"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                                            />
                                        </label>
                                        <label className="space-y-1 block">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Próximo paso (15 días)</span>
                                            <textarea
                                                value={activationRoute.nextStep15Days}
                                                onChange={(event) => updateActivationRoute('nextStep15Days', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                placeholder="Acción concreta en 15 días"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveSponsorBlock('Paso 5 — Ruta de activación')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de lectura de sponsors</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                sponsorTestCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {sponsorTestCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Responde Sí/No desde hechos observables y recientes.',
                                                'Registra ajustes concretos cuando identifiques brechas.',
                                                'Verifica especialmente si estás pidiendo patrocinio antes de construir valor visible.'
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
                                                'Señal débil: llamar sponsor a cualquier actor influyente que apenas te conoce.',
                                                'Señal mejorada: priorizar quien combina influencia, conoce tu valor y podría poner reputación en juego por ti.'
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
                                                {sponsorSection.sponsorReadTest.map((row, index) => (
                                                    <tr key={`wb7-sponsor-test-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updateSponsorReadTestRow(index, 'verdict', event.target.value)}
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
                                                                onChange={(event) => updateSponsorReadTestRow(index, 'adjustment', event.target.value)}
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
                                            onClick={() => saveSponsorBlock('Paso 6 — Test de sponsors')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                                    <h3 className="text-base font-bold text-slate-900">Validaciones suaves</h3>
                                    {allSponsorsDistant && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: incluye también sponsors naturales o intermedios con acceso más realista.
                                        </p>
                                    )}
                                    {noValueBeforeAsking && (
                                        <p className="text-sm text-amber-800">Sugerencia: define primero qué puedes ofrecer o facilitar antes de pedir.</p>
                                    )}
                                    {allHighInfluenceLowExposure && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: si hay alta influencia pero baja exposición a tu valor, primero aumenta visibilidad y credibilidad.
                                        </p>
                                    )}
                                    {activationRouteVague && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: convierte la intención en un movimiento concreto de los próximos 15 días.
                                        </p>
                                    )}
                                    {!allSponsorsDistant && !noValueBeforeAsking && !allHighInfluenceLowExposure && !activationRouteVague && (
                                        <p className="text-sm text-emerald-700">Sin alertas: la estrategia de sponsors está bien calibrada para activación.</p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">Estado de la sección</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {section4Completed
                                                    ? 'Completado: inventario, matriz, patrocinabilidad, valor previo, ruta y test diligenciados.'
                                                    : 'Pendiente: define al menos un sponsor prioritario y completa una ruta de activación, junto con los demás bloques.'}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                section4Completed
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {section4Completed ? 'Completado' : 'Pendiente'}
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

                        {showSponsorHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
                                <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Ayuda — Identificación de sponsors</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowSponsorHelp(false)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Sponsor ≠ mentor: el sponsor abre puertas, visibiliza y pone capital reputacional en juego.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Antes de pedir patrocinio, necesitas valor visible, relación suficiente y lectura política.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Un buen sponsor no siempre es la persona más cercana, sino quien combina influencia, credibilidad y disposición real.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Diseña primero qué aportas; luego activa la conversación de patrocinio.
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
