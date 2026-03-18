'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer, Sparkles } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
type YesNoAnswer = '' | 'yes' | 'no'
type RatingValue = '' | '1' | '2' | '3' | '4' | '5'
type ObjectiveType = '' | 'Sostén' | 'Expansión' | 'Legado'
type GoalFunction = '' | 'Sostener' | 'Expandir' | 'Trascender'
type HelpModalKey = null | 'vision' | 'areaGoals' | 'priorities' | 'commitments' | 'indicators' | 'onePage'

type WorkbookPage = {
    id: WorkbookPageId
    label: string
    shortLabel: string
}

type CheckRow = {
    question: string
    verdict: YesNoAnswer
    adjustment: string
}

type FuturePhoto = {
    professionalState: string
    visibleImpact: string
    lifestyle: string
    lessDependentOnMe: string
    visibleFootprint: string
}

type SimpleResponseRow = {
    label: string
    response: string
}

type LifeVisionRow = {
    area: string
    vision: string
}

type GapRow = {
    dimension: string
    currentState: string
    futureState: string
    mainGap: string
    systemicChange: string
}

type AreaPrioritizationRow = {
    area: string
    importance: RatingValue
    currentState: RatingValue
    urgency: RatingValue
    reading: string
}

type AreaObjectiveRow = {
    area: string
    vision: string
    objective: string
    goalType: ObjectiveType
    visibleResult: string
}

type ObjectiveClassificationRow = {
    objective: string
    mainFunction: GoalFunction
    why: string
}

type InterdependencyMap = {
    driverArea: string
    limitingArea: string
    multiplierObjective: string
    coherentCombination: string
}

type FinalObjectiveRow = {
    area: string
    statement: string
}

type PriorityMatrixRow = {
    front: string
    impact: RatingValue
    urgency: RatingValue
    leverage: RatingValue
    costOfDelay: string
    reading: string
}

type MasterPriorityRow = {
    priority: string
    summarizedFront: string
    servedObjective: string
    priorityType: ObjectiveType
}

type PrioritySequence = {
    first: string
    dependsOn: string
    parallel: string
    postpone: string
}

type RenunciationRow = {
    release: string
    whyCompetes: string
    doDifferent: string
}

type CommitmentTractionRow = {
    commitment: string
    servedPriority: string
    commitmentType: ObjectiveType
    visibleTraction: string
    risk: string
}

type CommitmentDesignRow = {
    commitment: string
    exactAction: string
    timing: string
    evidence: string
    support: string
}

type CommitmentObstacleRow = {
    commitment: string
    obstacle: string
    earlySignal: string
    contingency: string
    minimumProtection: string
}

type AccountabilityPlan = {
    declaredCommitment: string
    audience: string
    reviewFrequency: string
    supportNeeded: string
    simpleIndicator: string
}

type IndicatorMatrixRow = {
    dimension: string
    indicator: string
    evidence: string
    reviewFrequency: string
}

type IndicatorClassificationRow = {
    indicator: string
    indicatorType: ObjectiveType
    protectsOrDrives: string
}

type IndicatorThresholdRow = {
    indicator: string
    baseline: string
    goal30: string
    goal90: string
    minimumThreshold: string
    correctiveAction: string
}

type IndicatorCard = {
    indicator: string
    measures: string
    formula: string
    source: string
    owner: string
    decision: string
}

type DashboardRow = {
    indicator: string
    currentValue: string
    goal: string
    decision: string
}

type SynthesisRow = {
    block: string
    summary: string
}

type LayoutPlan = {
    north: string
    keyAreas: string
    priorities: string
    action: string
    measurement: string
    review: string
}

type FinalOnePagePlan = {
    vision: string
    legacyPhrase: string
    integratedObjectives: string[]
    masterPriorities: string[]
    immediateCommitments: string[]
    criticalIndicators: string[]
    reviewFrequency: string
    adjustmentCriteria: string
}

type WB10State = {
    identification: {
        leaderName: string
        role: string
        cohort: string
        startDate: string
    }
    vision3Years: {
        futurePhoto: FuturePhoto
        systemMatrix: SimpleResponseRow[]
        lifeMap: LifeVisionRow[]
        gapMap: GapRow[]
        statement: string
        qualityChecks: CheckRow[]
    }
    areaGoals: {
        prioritization: AreaPrioritizationRow[]
        objectiveMatrix: AreaObjectiveRow[]
        classifications: ObjectiveClassificationRow[]
        interdependencies: InterdependencyMap
        finalObjectives: FinalObjectiveRow[]
        qualityChecks: CheckRow[]
    }
    priorities: {
        fronts: string[]
        matrix: PriorityMatrixRow[]
        masterPriorities: MasterPriorityRow[]
        sequence: PrioritySequence
        renunciations: RenunciationRow[]
        qualityChecks: CheckRow[]
    }
    commitments: {
        commitments: string[]
        tractionMatrix: CommitmentTractionRow[]
        designRows: CommitmentDesignRow[]
        obstacles: CommitmentObstacleRow[]
        accountability: AccountabilityPlan
        qualityChecks: CheckRow[]
    }
    indicators: {
        dimensions: string[]
        matrix: IndicatorMatrixRow[]
        classifications: IndicatorClassificationRow[]
        thresholds: IndicatorThresholdRow[]
        cards: IndicatorCard[]
        dashboard: DashboardRow[]
        qualityChecks: CheckRow[]
    }
    onePagePlan: {
        essentialBlocks: string[]
        synthesis: SynthesisRow[]
        layout: LayoutPlan
        coherenceChecks: CheckRow[]
        finalPlan: FinalOnePagePlan
        finalChecks: CheckRow[]
    }
}

const PAGES: WorkbookPage[] = [
    { id: 1, label: '1. Portada e identificación', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Visión a 3 años', shortLabel: 'Visión' },
    { id: 4, label: '4. Objetivos por área de vida', shortLabel: 'Objetivos' },
    { id: 5, label: '5. Prioridades estratégicas', shortLabel: 'Prioridades' },
    { id: 6, label: '6. Compromisos de acción inmediata', shortLabel: 'Compromisos' },
    { id: 7, label: '7. Indicadores de avance', shortLabel: 'Indicadores' },
    { id: 8, label: '8. One Strategic Page Plan', shortLabel: 'One Page Plan' }
]

const STORAGE_KEY = 'workbooks-v2-wb10-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb10-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb10-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb10-presentation-seen'

const WORKBOOK_TITLE = 'Visión Estratégica Personal'
const WORKBOOK_NUMBER = 'Workbook 10'
const SYSTEM_LABEL = 'Sistema: 4Shine®'
const PILLAR_LABEL = 'Pilar: Shine Beyond (Legado)'

const WORKBOOK_OUTCOMES = [
    'Una visión a 3 años clara y articulada.',
    'Un mapa de objetivos por área de vida.',
    'Una definición más rigurosa de tus prioridades estratégicas.',
    'Un conjunto de compromisos de acción inmediata.',
    'Indicadores para medir avance.',
    'Un plan estratégico personal en una página.'
] as const

const WORKBOOK_COMPONENTS = [
    'Desarrollo de otros líderes (mentoring & coaching)',
    'Impacto social y humano',
    'Legado personal y trascendencia',
    'Inteligencia cultural e inclusiva',
    'Liderazgo regenerativo'
] as const

const WORKBOOK_COMPETENCIES = [
    'Mentoría y sucesión',
    'Empoderamiento (empowerment)',
    'Desafío para el crecimiento',
    'Ética y responsabilidad social',
    'Liderazgo de servicio (stewardship)',
    'Inclusión y equidad',
    'Institucionalización de cultura',
    'Reconocimiento y humildad',
    'Conexión con el propósito (meaning)',
    'Gestión de la diversidad cognitiva',
    'Conciencia sistémica y comunitaria'
] as const

const GOLDEN_RULES = [
    'No diseñes solo metas; diseña un sistema de vida y legado.',
    'No confundas crecimiento con acumulación.',
    'Una visión estratégica personal debe seguir existiendo incluso cuando cambie tu cargo.',
    'Si todo depende de ti, todavía no estás escalando.',
    'El verdadero plan se nota en lo que priorizas, sueltas e institucionalizas.'
] as const

const AREA_LABELS = [
    'Trabajo / profesional',
    'Contribución a la sociedad',
    'Finanzas / éxito financiero',
    'Salud y bienestar',
    'Relaciones',
    'Familia / personal',
    'Tiempo libre y energía',
    'Espiritualidad'
] as const

const VISION_SYSTEM_DIMENSIONS = [
    'Qué quiero construir a 3 años',
    'Qué sistema debe existir para sostenerlo',
    'Qué personas / capacidades deben multiplicarlo',
    'Qué parte de la visión ya apunta a legado',
    'Qué riesgo la volvería solo éxito temporal'
] as const

const VISION_QUALITY_QUESTIONS = [
    '¿Mi visión trasciende el cargo actual?',
    '¿Integra varias áreas de vida?',
    '¿Tiene lógica de sistema?',
    '¿Incluye legado y trascendencia?',
    '¿Reduce dependencia exclusiva de mí?',
    '¿Puede convertirse en plan?'
] as const

const AREA_GOALS_QUALITY_QUESTIONS = [
    '¿Cada área tiene un objetivo claro?',
    '¿Los objetivos conversan con la visión?',
    '¿Hay equilibrio entre sostener, expandir y trascender?',
    '¿Sé qué áreas están más críticas?',
    '¿Identifiqué objetivos multiplicadores?',
    '¿Estos objetivos pueden volverse plan?'
] as const

const PRIORITIES_QUALITY_QUESTIONS = [
    '¿Elegí pocas prioridades realmente decisivas?',
    '¿Conversan con mi visión?',
    '¿Distingo sostén, expansión y legado?',
    '¿Identifiqué la secuencia correcta?',
    '¿Sé qué debo soltar o postergar?',
    '¿Pueden convertirse en plan operativo?'
] as const

const COMMITMENTS_QUALITY_QUESTIONS = [
    '¿Elegí pocos compromisos realmente críticos?',
    '¿Cada compromiso sirve a una prioridad?',
    '¿Están formulados de forma verificable?',
    '¿Sé qué evidencia dejará cada uno?',
    '¿He previsto obstáculos y contingencias?',
    '¿Existe algún mecanismo de rendición de cuentas?'
] as const

const INDICATORS_QUALITY_QUESTIONS = [
    '¿Elegí pocos indicadores realmente decisivos?',
    '¿Cada indicador tiene evidencia y frecuencia?',
    '¿Distingo sostén, expansión y legado?',
    '¿Definí línea base, meta y umbral?',
    '¿El tablero muestra señales útiles para decidir?',
    '¿El plan deja de depender solo de mi intención?'
] as const

const ONE_PAGE_COHERENCE_QUESTIONS = [
    '¿La visión conversa con los objetivos?',
    '¿Los objetivos justifican las prioridades?',
    '¿Las prioridades bajan a compromisos?',
    '¿Los indicadores miden lo esencial?',
    '¿La lógica de legado aparece visible?',
    '¿Otra persona podría entender este plan?'
] as const

const ONE_PAGE_FINAL_QUESTIONS = [
    '¿El plan cabe y se entiende en una página?',
    '¿Integra visión, objetivos, prioridades, acción e indicadores?',
    '¿El legado aparece de forma explícita?',
    '¿El plan ya no depende solo de intención?',
    '¿Puedo usarlo para dirigir mis decisiones?',
    '¿Refleja trascendencia y no solo éxito temporal?'
] as const

const OBJECTIVE_TYPE_OPTIONS: ObjectiveType[] = ['Sostén', 'Expansión', 'Legado']
const GOAL_FUNCTION_OPTIONS: GoalFunction[] = ['Sostener', 'Expandir', 'Trascender']
const FREQUENCY_OPTIONS = ['Semanal', 'Quincenal', 'Mensual', 'Bimestral', 'Trimestral'] as const
const ESSENTIAL_BLOCK_DEFAULTS = [
    'Visión a 3 años',
    'Objetivos por área de vida',
    'Prioridades estratégicas',
    'Compromisos de acción inmediata',
    'Indicadores de avance',
    'Legado / institucionalización'
] as const
const SYNTHESIS_BLOCK_LABELS = [
    'Visión a 3 años',
    'Objetivos integradores',
    'Prioridades maestras',
    'Compromisos inmediatos',
    'Indicadores críticos',
    'Frase de legado'
] as const

const PRESENTATION_OBJECTIVE =
    'Diseñar una visión estratégica personal a 3 años que integre legado, crecimiento, sostenibilidad, impacto y prioridades de vida, para que tu desarrollo deje de depender de urgencias o logros aislados y empiece a operar como un sistema consciente, escalable y trascendente.'

const VISION_CONCEPTS = [
    'Visión a 3 años: futuro suficientemente lejano para exigir rediseño y lo bastante cercano para traducirse a decisiones actuales.',
    'Visión estratégica personal: integra carrera, impacto, bienestar, relaciones, finanzas, contribución y legado.',
    'Legado consciente: huella deliberada más allá del rol o del éxito inmediato.',
    'Integración sistémica del crecimiento: articular desarrollo, bienestar, cultura e impacto en un mismo sistema.',
    'Escalamiento personal: crecer diseñando mejor, delegando, institucionalizando y multiplicando.',
    'Sostenibilidad del crecimiento: avanzar sin erosionar salud, relaciones ni propósito.'
] as const

const AREA_GOALS_CONCEPTS = [
    'Objetivo por área de vida: resultado claro, medible y coherente con la visión general.',
    'Área tractora: dimensión que impulsa positivamente al resto del sistema.',
    'Área vulnerable: dimensión que limita sostenibilidad o expansión si no se atiende.',
    'Meta de sostén: protege estabilidad, energía o bienestar.',
    'Meta de expansión: impulsa influencia, ingresos, alcance o capacidad.',
    'Meta de legado: construye algo que permanece más allá del desempeño inmediato.'
] as const

const PRIORITIES_CONCEPTS = [
    'Prioridad estratégica: foco de alto impacto que orienta tiempo, energía y recursos.',
    'Palanca estratégica: frente que mueve varias áreas del sistema al mismo tiempo.',
    'Trade-off estratégico: renuncia consciente para proteger lo más valioso.',
    'Secuencia estratégica: orden lógico para que las prioridades no se saboteen entre sí.',
    'Capacidad finita: tiempo, atención y energía son recursos limitados.',
    'Ruta crítica personal: cadena de prioridades que sostiene la visión completa.'
] as const

const COMMITMENTS_CONCEPTS = [
    'Compromiso inmediato: decisión concreta, próxima y verificable que activa el plan.',
    'Acción palanca: movimiento que destraba varias áreas del sistema al mismo tiempo.',
    'Compromiso verificable: formulación que permite saber si ocurrió o no.',
    'Hito temprano: evidencia visible de que el plan ya empezó a moverse.',
    'Fricción de arranque: resistencia que aparece al pasar de intención a acción.',
    'Rendición de cuentas: mecanismo externo mínimo para sostener tracción.'
] as const

const INDICATORS_CONCEPTS = [
    'Indicador de avance: señal observable y verificable de progreso real.',
    'Indicador de sostén: protege energía, foco, bienestar o estabilidad.',
    'Indicador de expansión: mide crecimiento en influencia, autonomía o capacidad.',
    'Indicador de legado: mide cultura, sucesión, institucionalización o impacto más allá del yo.',
    'Línea base, meta y umbral: mínimo sistema para sostener decisiones.',
    'Crecimiento independiente del líder: el plan madura cuando deja de depender solo de tu intervención.'
] as const

const ONE_PAGE_CONCEPTS = [
    'One Strategic Page Plan: versión condensada y ejecutiva de tu estrategia personal.',
    'Síntesis estratégica: reducir complejidad sin perder dirección ni trazabilidad.',
    'Mapa ejecutivo personal: norte, prioridades, acciones, métricas y decisiones clave.',
    'Sistema institucionalizado: crecimiento sostenido por prácticas, estructuras y seguimiento.',
    'Legado operativo: legado traducido a prácticas, sucesión, cultura e impacto verificable.',
    'Plan vivo: documento que se revisa, ajusta y usa.'
] as const

const VISION_CLOSURE = [
    'Qué vida y qué liderazgo quieres haber construido en 3 años.',
    'Qué parte de esa visión ya habla de legado.',
    'Qué áreas necesitan integrarse mejor.',
    'Dónde están tus brechas principales.',
    'Si tu futuro deseado ya puede empezar a operar como sistema.'
] as const

const AREA_GOALS_CLOSURE = [
    'Qué quieres construir en cada área de vida.',
    'Cuáles objetivos sostienen tu sistema.',
    'Cuáles lo expanden.',
    'Cuáles conectan con tu legado.',
    'Qué áreas hoy requieren más intervención estratégica.'
] as const

const PRIORITIES_CLOSURE = [
    'Cuáles son tus prioridades maestras reales.',
    'Qué prioridad sostiene, cuál expande y cuál trasciende.',
    'Qué debe ocurrir primero.',
    'Qué necesitas soltar para escalar.',
    'Qué ruta crítica sostiene tu visión estratégica personal.'
] as const

const COMMITMENTS_CLOSURE = [
    'Qué compromisos ya activan de verdad el plan.',
    'Qué evidencia vas a usar para confirmar tracción.',
    'Qué obstáculos podrían frenarte.',
    'Qué decisiones mínimas protegerán el avance.',
    'Qué mecanismo de rendición de cuentas sostendrá la ejecución.'
] as const

const INDICATORS_CLOSURE = [
    'Qué dimensiones del plan merecen seguimiento explícito.',
    'Qué indicadores protegen base, expansión y legado.',
    'Qué línea base y metas guiarán tus decisiones.',
    'Qué tablero mínimo te permitirá corregir a tiempo.',
    'Si el crecimiento ya empieza a dejar capacidades instaladas más allá de ti.'
] as const

const ONE_PAGE_CLOSURE = [
    'Si tu visión ya se convirtió en sistema.',
    'Si tu plan puede ser leído y usado en una sola página.',
    'Qué parte de tu crecimiento es sostén, cuál expansión y cuál legado.',
    'Qué estructura sostendrá el rumbo en los próximos meses.',
    'Si realmente estás diseñando trascendencia y no solo éxito temporal.'
] as const

const HELP_MODAL_CONTENT: Record<Exclude<HelpModalKey, null>, { title: string; paragraphs: string[]; principle: string; reminders: string[]; example: string }> = {
    vision: {
        title: 'Ayuda — Visión a 3 años',
        paragraphs: [
            'Una visión a 3 años no es una lista de metas sueltas: debe integrar sistema, áreas de vida, sostenibilidad y legado.',
            'Si todo sigue dependiendo exclusivamente del líder, la visión todavía no escala.',
            'Una buena visión después alimenta objetivos, prioridades, compromisos e indicadores.'
        ],
        principle: 'Diseña futuro con sistema, no solo con deseo.',
        reminders: [
            'Integra también bienestar, relaciones, finanzas e impacto, no solo trabajo.',
            'Haz visible qué huella quieres dejar más allá del cargo.',
            'Aclara qué estructura o capacidades sostendrán esa visión.'
        ],
        example:
            'En 3 años, habré construido una vida y un liderazgo más estratégicos, sostenibles y trascendentes, con mayor capacidad de influir, desarrollar a otros e institucionalizar cultura.'
    },
    areaGoals: {
        title: 'Ayuda — Objetivos por área de vida',
        paragraphs: [
            'No se trata de llenar áreas con metas sueltas: cada objetivo debe conversar con la visión general.',
            'Conviene distinguir entre sostener, expandir y trascender para no sobrecargar el sistema.',
            'Una buena formulación por área luego facilita prioridades, compromisos e indicadores.'
        ],
        principle: 'Convierte la visión integral en objetivos con dirección visible.',
        reminders: [
            'Diferencia qué áreas requieren más atención estratégica.',
            'Haz más visible qué quieres construir en cada área.',
            'Incluye al menos uno o dos objetivos que vayan más allá del crecimiento individual.'
        ],
        example: 'En esta área, mi objetivo estratégico es pasar de ejecutor sólido a constructor de sistemas, influencia y legado.'
    },
    priorities: {
        title: 'Ayuda — Prioridades estratégicas',
        paragraphs: [
            'Priorizar no es ordenar una lista larga, sino elegir pocos frentes realmente decisivos.',
            'Una prioridad estratégica debería mover varias áreas o resultados al mismo tiempo.',
            'Priorizar siempre implica secuencia y renuncia; si todo sigue siendo prioridad, el plan todavía no es estratégico.'
        ],
        principle: 'Protege foco y capacidad finita con pocas prioridades maestras.',
        reminders: [
            'Reduce a 3–5 prioridades para ganar foco real.',
            'Aclara si cada prioridad sostiene, expande o construye legado.',
            'Haz explícitas las renuncias necesarias.'
        ],
        example: 'Recuperar y sostener energía base; salir de la hipercentralidad; construir mayor influencia visible; institucionalizar una práctica de desarrollo de otros.'
    },
    commitments: {
        title: 'Ayuda — Compromisos de acción inmediata',
        paragraphs: [
            'Un compromiso inmediato no es una intención: es una acción verificable, conectada con una prioridad, un plazo y una evidencia.',
            'Si no prevés obstáculos, el plan se rompe al primer choque con la realidad.',
            'La rendición de cuentas ayuda a convertir compromiso en tracción.'
        ],
        principle: 'Activa el plan con pocos movimientos críticos y verificables.',
        reminders: [
            'Reduce a los compromisos que realmente destraban el sistema.',
            'Aclara cuándo ocurrirá cada uno.',
            'Define evidencia, contingencias y un mecanismo mínimo de revisión.'
        ],
        example: 'Delegar dos decisiones clave antes del viernes, con responsables asignados, seguimiento acordado y evidencia escrita.'
    },
    indicators: {
        title: 'Ayuda — Indicadores de avance',
        paragraphs: [
            'No se trata de medir todo, sino de medir lo decisivo.',
            'Un buen indicador necesita evidencia, frecuencia y una decisión asociada.',
            'Conviene equilibrar indicadores de sostén, expansión y legado.'
        ],
        principle: 'Mide lo que te ayuda a sostener, expandir e institucionalizar el crecimiento.',
        reminders: [
            'Incluye señales de resultado, autonomía o legado, no solo actividad.',
            'Aclara línea base, metas y evidencia verificable.',
            'Incluye al menos un indicador de delegación, sucesión o institucionalización.'
        ],
        example: 'Decisiones delegadas con seguimiento: mide cuántas decisiones ya no dependen solo de ti y habilita decisiones sobre foco, sucesión y autonomía.'
    },
    onePage: {
        title: 'Ayuda — One Strategic Page Plan',
        paragraphs: [
            'Una página estratégica no simplifica por decorar; simplifica para dirigir.',
            'El plan debe poder leerse rápido y orientar decisiones reales.',
            'Si el legado no aparece, todavía no es un plan completo de Shine Beyond.'
        ],
        principle: 'Sintetiza sin perder dirección, foco, medición ni lógica de legado.',
        reminders: [
            'Reduce a formulaciones más ejecutivas y legibles.',
            'Haz visible qué quedará más allá de tu presencia directa.',
            'Define cuándo y cómo revisarás el plan.'
        ],
        example:
            'Visión clara, 5 objetivos integradores, 5 prioridades maestras, 5 compromisos, 5 indicadores críticos y una frecuencia de revisión usable.'
    }
}

const TEXT_INPUT_CLASS =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed'
const TEXTAREA_CLASS =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed'
const SELECT_CLASS =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed'

const createCheckRows = (questions: readonly string[]): CheckRow[] =>
    questions.map((question) => ({
        question,
        verdict: '' as YesNoAnswer,
        adjustment: ''
    }))

const createDefaultState = (): WB10State => ({
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    vision3Years: {
        futurePhoto: {
            professionalState: '',
            visibleImpact: '',
            lifestyle: '',
            lessDependentOnMe: '',
            visibleFootprint: ''
        },
        systemMatrix: VISION_SYSTEM_DIMENSIONS.map((label) => ({ label, response: '' })),
        lifeMap: AREA_LABELS.map((area) => ({ area, vision: '' })),
        gapMap: Array.from({ length: 4 }, () => ({
            dimension: '',
            currentState: '',
            futureState: '',
            mainGap: '',
            systemicChange: ''
        })),
        statement: '',
        qualityChecks: createCheckRows(VISION_QUALITY_QUESTIONS)
    },
    areaGoals: {
        prioritization: AREA_LABELS.map((area) => ({
            area,
            importance: '' as RatingValue,
            currentState: '' as RatingValue,
            urgency: '' as RatingValue,
            reading: ''
        })),
        objectiveMatrix: AREA_LABELS.map((area) => ({
            area,
            vision: '',
            objective: '',
            goalType: '' as ObjectiveType,
            visibleResult: ''
        })),
        classifications: Array.from({ length: 5 }, () => ({
            objective: '',
            mainFunction: '' as GoalFunction,
            why: ''
        })),
        interdependencies: {
            driverArea: '',
            limitingArea: '',
            multiplierObjective: '',
            coherentCombination: ''
        },
        finalObjectives: AREA_LABELS.map((area) => ({
            area,
            statement: ''
        })),
        qualityChecks: createCheckRows(AREA_GOALS_QUALITY_QUESTIONS)
    },
    priorities: {
        fronts: Array.from({ length: 10 }, () => ''),
        matrix: Array.from({ length: 5 }, () => ({
            front: '',
            impact: '' as RatingValue,
            urgency: '' as RatingValue,
            leverage: '' as RatingValue,
            costOfDelay: '',
            reading: ''
        })),
        masterPriorities: Array.from({ length: 5 }, () => ({
            priority: '',
            summarizedFront: '',
            servedObjective: '',
            priorityType: '' as ObjectiveType
        })),
        sequence: {
            first: '',
            dependsOn: '',
            parallel: '',
            postpone: ''
        },
        renunciations: Array.from({ length: 4 }, () => ({
            release: '',
            whyCompetes: '',
            doDifferent: ''
        })),
        qualityChecks: createCheckRows(PRIORITIES_QUALITY_QUESTIONS)
    },
    commitments: {
        commitments: Array.from({ length: 7 }, () => ''),
        tractionMatrix: Array.from({ length: 5 }, () => ({
            commitment: '',
            servedPriority: '',
            commitmentType: '' as ObjectiveType,
            visibleTraction: '',
            risk: ''
        })),
        designRows: Array.from({ length: 4 }, () => ({
            commitment: '',
            exactAction: '',
            timing: '',
            evidence: '',
            support: ''
        })),
        obstacles: Array.from({ length: 3 }, () => ({
            commitment: '',
            obstacle: '',
            earlySignal: '',
            contingency: '',
            minimumProtection: ''
        })),
        accountability: {
            declaredCommitment: '',
            audience: '',
            reviewFrequency: '',
            supportNeeded: '',
            simpleIndicator: ''
        },
        qualityChecks: createCheckRows(COMMITMENTS_QUALITY_QUESTIONS)
    },
    indicators: {
        dimensions: Array.from({ length: 8 }, () => ''),
        matrix: Array.from({ length: 5 }, () => ({
            dimension: '',
            indicator: '',
            evidence: '',
            reviewFrequency: ''
        })),
        classifications: Array.from({ length: 5 }, () => ({
            indicator: '',
            indicatorType: '' as ObjectiveType,
            protectsOrDrives: ''
        })),
        thresholds: Array.from({ length: 4 }, () => ({
            indicator: '',
            baseline: '',
            goal30: '',
            goal90: '',
            minimumThreshold: '',
            correctiveAction: ''
        })),
        cards: Array.from({ length: 4 }, () => ({
            indicator: '',
            measures: '',
            formula: '',
            source: '',
            owner: '',
            decision: ''
        })),
        dashboard: Array.from({ length: 5 }, () => ({
            indicator: '',
            currentValue: '',
            goal: '',
            decision: ''
        })),
        qualityChecks: createCheckRows(INDICATORS_QUALITY_QUESTIONS)
    },
    onePagePlan: {
        essentialBlocks: [...ESSENTIAL_BLOCK_DEFAULTS],
        synthesis: SYNTHESIS_BLOCK_LABELS.map((block) => ({
            block,
            summary: ''
        })),
        layout: {
            north: '',
            keyAreas: '',
            priorities: '',
            action: '',
            measurement: '',
            review: ''
        },
        coherenceChecks: createCheckRows(ONE_PAGE_COHERENCE_QUESTIONS),
        finalPlan: {
            vision: '',
            legacyPhrase: '',
            integratedObjectives: Array.from({ length: 5 }, () => ''),
            masterPriorities: Array.from({ length: 5 }, () => ''),
            immediateCommitments: Array.from({ length: 5 }, () => ''),
            criticalIndicators: Array.from({ length: 5 }, () => ''),
            reviewFrequency: '',
            adjustmentCriteria: ''
        },
        finalChecks: createCheckRows(ONE_PAGE_FINAL_QUESTIONS)
    }
})

const DEFAULT_STATE = createDefaultState()

const mergeWithDefault = <T,>(defaults: T, value: unknown): T => {
    if (Array.isArray(defaults)) {
        if (!Array.isArray(value)) return defaults
        return defaults.map((item, index) => mergeWithDefault(item, value[index])) as T
    }

    if (defaults && typeof defaults === 'object') {
        const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
        const result: Record<string, unknown> = {}

        for (const [key, defaultValue] of Object.entries(defaults as Record<string, unknown>)) {
            result[key] = mergeWithDefault(defaultValue, source[key])
        }

        return result as T
    }

    if (typeof defaults === 'string') {
        return (typeof value === 'string' ? value : defaults) as T
    }

    return defaults
}

const normalizeState = (raw: unknown): WB10State => mergeWithDefault(DEFAULT_STATE, raw)
const isWorkbookPageId = (value: number): value is WorkbookPageId => PAGES.some((page) => page.id === value)

const buildDefinitionScore = (text: string): number => {
    const words = text.trim().split(/\s+/).filter(Boolean).length
    if (words === 0) return 0
    if (words <= 3) return 3
    if (words <= 7) return 5
    if (words <= 12) return 7
    if (words <= 18) return 8.5
    return 10
}

const buildAreaReading = (importance: RatingValue, currentState: RatingValue, urgency: RatingValue): string => {
    const i = Number(importance || 0)
    const c = Number(currentState || 0)
    const u = Number(urgency || 0)
    if (!i && !c && !u) return ''
    if (u >= 5 && c <= 2) return 'Área crítica: requiere intervención prioritaria.'
    if (i >= 4 && u >= 4 && c <= 3) return 'Alta prioridad estratégica con brecha visible.'
    if (i >= 4 && c >= 4 && u <= 3) return 'Área sólida: conviene sostenerla y escalarla.'
    if (u >= 4) return 'Necesita mayor atención táctica y seguimiento.'
    return 'Área relevante: conviene darle una lectura más fina y consciente.'
}

const buildPriorityReading = (impact: RatingValue, urgency: RatingValue, leverage: RatingValue): string => {
    const total = Number(impact || 0) + Number(urgency || 0) + Number(leverage || 0)
    if (total === 0) return ''
    if (total >= 13) return 'Prioridad tractora'
    if (total >= 11) return 'Prioridad alta'
    if (total >= 8) return 'Prioridad relevante'
    return 'Frente complementario'
}

const collectFilled = (values: string[]) => values.map((value) => value.trim()).filter(Boolean)
const uniqueFilled = (values: string[]) => Array.from(new Set(collectFilled(values)))

const compactJoin = (values: string[], fallback = '') => {
    const cleaned = uniqueFilled(values)
    return cleaned.length > 0 ? cleaned.join(' · ') : fallback
}

const extractNumber = (value: string): number | null => {
    const match = value.replace(',', '.').match(/-?\d+(\.\d+)?/)
    return match ? Number(match[0]) : null
}

const resolveIndicatorTrend = (currentValue: string, baselineValue: string): '↑' | '→' | '↓' => {
    const current = extractNumber(currentValue)
    const baseline = extractNumber(baselineValue)
    if (current === null || baseline === null) return '→'
    if (current > baseline) return '↑'
    if (current < baseline) return '↓'
    return '→'
}

const resolveIndicatorStatus = (currentValue: string, goalValue: string, minimumThreshold: string): 'Verde' | 'Amarillo' | 'Rojo' | 'Pendiente' => {
    const current = extractNumber(currentValue)
    const goal = extractNumber(goalValue)
    const minimum = extractNumber(minimumThreshold)

    if (current === null) return 'Pendiente'
    if (minimum !== null && current < minimum) return 'Rojo'
    if (goal !== null && current >= goal) return 'Verde'
    if (minimum !== null && current >= minimum) return 'Amarillo'
    if (goal !== null) return 'Amarillo'
    return 'Pendiente'
}

const resolveIndicatorQuickRead = (status: 'Verde' | 'Amarillo' | 'Rojo' | 'Pendiente', trend: '↑' | '→' | '↓') => {
    if (status === 'Verde') return trend === '↑' ? 'Avance sólido y creciente.' : 'Meta alcanzada o controlada.'
    if (status === 'Amarillo') return trend === '↑' ? 'Avanza, pero aún requiere consolidación.' : 'Se sostiene, pero necesita más tracción.'
    if (status === 'Rojo') return 'Está por debajo del mínimo y requiere corrección.'
    return 'Aún no hay suficiente información para decidir.'
}

const keywordMatch = (value: string, pattern: RegExp) => pattern.test(value.toLowerCase())

const inferObjectiveTypeFromText = (value: string): ObjectiveType => {
    const lower = value.toLowerCase()
    if (/(legad|suces|instituci|cultur|impact|contrib)/.test(lower)) return 'Legado'
    if (/(salud|bienestar|relaci|famil|energia|espiritual|descanso)/.test(lower)) return 'Sostén'
    if (/(finanz|influencia|visibil|expansi|crecimiento|profesional|alcance)/.test(lower)) return 'Expansión'
    return ''
}

const inferGoalFunctionFromObjective = (value: string): GoalFunction => {
    const type = inferObjectiveTypeFromText(value)
    if (type === 'Legado') return 'Trascender'
    if (type === 'Sostén') return 'Sostener'
    if (type === 'Expansión') return 'Expandir'
    return ''
}

const buildSuggestedIndicator = (dimension: string) => {
    const lower = dimension.toLowerCase()
    if (/(energ|bienestar|salud)/.test(lower)) {
        return {
            indicator: 'Semanas con rutina mínima de energía sostenida',
            evidence: 'Registro de sueño, ejercicio o descanso',
            reviewFrequency: 'Semanal',
            indicatorType: 'Sostén' as ObjectiveType,
            protectsOrDrives: 'Protege la base física y mental',
            measures: 'La continuidad mínima de hábitos que sostienen energía y claridad',
            formula: 'Semanas con rutina mínima cumplida / total de semanas revisadas',
            source: 'Agenda personal y registro de hábitos',
            owner: 'Líder',
            decision: 'Rediseñar agenda y sobrecarga cuando cae'
        }
    }
    if (/(deleg|suces|autonom)/.test(lower)) {
        return {
            indicator: 'Decisiones o funciones ya transferidas',
            evidence: 'Responsables definidos y seguimiento acordado',
            reviewFrequency: 'Quincenal',
            indicatorType: 'Legado' as ObjectiveType,
            protectsOrDrives: 'Reduce dependencia exclusiva del líder',
            measures: 'Cuántas decisiones relevantes ya no dependen solo de ti',
            formula: 'Total de decisiones o funciones transferidas con seguimiento activo',
            source: 'Actas, responsables definidos y tablero de seguimiento',
            owner: 'Líder + mentor',
            decision: 'Ajustar criterio de delegación y desarrollo de sucesores'
        }
    }
    if (/(finanz|ahorro|inversion|libertad)/.test(lower)) {
        return {
            indicator: 'Porcentaje de ahorro / inversión sostenida',
            evidence: 'Registro financiero mensual',
            reviewFrequency: 'Mensual',
            indicatorType: 'Expansión' as ObjectiveType,
            protectsOrDrives: 'Aumenta autonomía y margen de decisión',
            measures: 'La porción del ingreso convertida en ahorro o inversión sostenida',
            formula: '(Ahorro + inversión del periodo) / ingreso del periodo',
            source: 'Control financiero personal',
            owner: 'Líder',
            decision: 'Ajustar gasto, foco o estrategia financiera'
        }
    }
    if (/(cultur|instituci)/.test(lower)) {
        return {
            indicator: 'Práctica o ritual sostenido por otros',
            evidence: 'Evidencia del equipo o sistema en marcha',
            reviewFrequency: 'Mensual',
            indicatorType: 'Legado' as ObjectiveType,
            protectsOrDrives: 'Institucionaliza capacidades más allá del líder',
            measures: 'Qué práctica sigue viva sin depender de tu presencia directa',
            formula: 'Número de prácticas activas sostenidas autónomamente',
            source: 'Rituales, actas y evidencia del equipo',
            owner: 'Líder + equipo',
            decision: 'Fortalecer cultura, sucesión o sistema de seguimiento'
        }
    }
    if (/(famil|relaci|personal)/.test(lower)) {
        return {
            indicator: 'Espacios de presencia de calidad por semana',
            evidence: 'Agenda compartida y registro de cumplimiento',
            reviewFrequency: 'Semanal',
            indicatorType: 'Sostén' as ObjectiveType,
            protectsOrDrives: 'Protege vínculo, presencia y equilibrio',
            measures: 'La frecuencia de espacios protegidos con personas clave',
            formula: 'Cantidad de espacios de calidad sostenidos por semana',
            source: 'Agenda y acuerdos familiares/personales',
            owner: 'Líder',
            decision: 'Reequilibrar carga si la vida personal pierde espacio'
        }
    }
    if (/(contrib|legad|impact|comunit|social)/.test(lower)) {
        return {
            indicator: 'Iniciativas con impacto visible fuera del yo',
            evidence: 'Casos, conversaciones, mentorías o acciones con impacto verificable',
            reviewFrequency: 'Mensual',
            indicatorType: 'Legado' as ObjectiveType,
            protectsOrDrives: 'Expande huella colectiva y trascendencia',
            measures: 'La cantidad y calidad de acciones con efecto visible más allá del resultado individual',
            formula: 'Número de iniciativas con evidencia de impacto externo',
            source: 'Registro de acciones, testimonios y resultados',
            owner: 'Líder',
            decision: 'Rediseñar vehículos de contribución si la huella no se vuelve visible'
        }
    }

    return {
        indicator: `Señal visible de avance en ${dimension || 'la dimensión priorizada'}`,
        evidence: 'Entregable, responsable asignado o hábito sostenido',
        reviewFrequency: 'Mensual',
        indicatorType: 'Expansión' as ObjectiveType,
        protectsOrDrives: 'Hace legible el avance de esta dimensión',
        measures: `El progreso observable en ${dimension || 'la dimensión seleccionada'}`,
        formula: 'Lectura periódica con evidencia verificable',
        source: 'Registro personal o tablero de seguimiento',
        owner: 'Líder',
        decision: 'Ajustar foco, secuencia o soporte'
    }
}

const buildDerivedVision = (state: WB10State) =>
    state.vision3Years.statement.trim() ||
    (state.vision3Years.futurePhoto.professionalState.trim().length > 0
        ? `En 3 años, habré construido ${state.vision3Years.futurePhoto.professionalState.trim()}.`
        : 'En 3 años, habré construido una vida y un liderazgo más estratégicos, sostenibles y trascendentes.')

const buildDerivedLegacyPhrase = (state: WB10State) =>
    state.vision3Years.futurePhoto.visibleFootprint.trim() ||
    'Dejar capacidades instaladas y crecimiento que no dependa solo de mí.'

const buildDerivedObjectives = (state: WB10State) => {
    const finalObjectives = uniqueFilled(state.areaGoals.finalObjectives.map((row) => row.statement))
    if (finalObjectives.length > 0) return finalObjectives.slice(0, 5)
    const matrixObjectives = uniqueFilled(state.areaGoals.objectiveMatrix.map((row) => row.objective))
    return matrixObjectives.slice(0, 5)
}

const buildDerivedPriorities = (state: WB10State) => uniqueFilled(state.priorities.masterPriorities.map((row) => row.priority)).slice(0, 5)
const buildDerivedCommitments = (state: WB10State) => uniqueFilled(state.commitments.commitments).slice(0, 5)
const buildDerivedIndicators = (state: WB10State) => uniqueFilled(state.indicators.matrix.map((row) => row.indicator)).slice(0, 5)

const syncDerivedState = (state: WB10State): WB10State => {
    const next = JSON.parse(JSON.stringify(state)) as WB10State
    let changed = false

    next.areaGoals.prioritization.forEach((row) => {
        const reading = buildAreaReading(row.importance, row.currentState, row.urgency)
        if (row.reading !== reading) {
            row.reading = reading
            changed = true
        }
    })

    next.priorities.matrix.forEach((row, index) => {
        const frontFallback = state.priorities.fronts[index]?.trim() || ''
        if (!row.front.trim() && frontFallback) {
            row.front = frontFallback
            changed = true
        }

        const reading = buildPriorityReading(row.impact, row.urgency, row.leverage)
        if (row.reading !== reading) {
            row.reading = reading
            changed = true
        }
    })

    next.commitments.tractionMatrix.forEach((row, index) => {
        const commitmentFallback = state.commitments.commitments[index]?.trim() || ''
        if (!row.commitment.trim() && commitmentFallback) {
            row.commitment = commitmentFallback
            changed = true
        }
    })

    next.commitments.designRows.forEach((row, index) => {
        const commitmentFallback = state.commitments.commitments[index]?.trim() || ''
        if (!row.commitment.trim() && commitmentFallback) {
            row.commitment = commitmentFallback
            changed = true
        }
    })

    next.commitments.obstacles.forEach((row, index) => {
        const commitmentFallback = state.commitments.commitments[index]?.trim() || ''
        if (!row.commitment.trim() && commitmentFallback) {
            row.commitment = commitmentFallback
            changed = true
        }
    })

    if (!next.commitments.accountability.declaredCommitment.trim() && state.commitments.commitments[0]?.trim()) {
        next.commitments.accountability.declaredCommitment = state.commitments.commitments[0].trim()
        changed = true
    }

    next.indicators.matrix.forEach((row, index) => {
        const dimensionFallback = state.indicators.dimensions[index]?.trim() || ''
        if (!row.dimension.trim() && dimensionFallback) {
            row.dimension = dimensionFallback
            changed = true
        }
    })

    next.indicators.classifications.forEach((row, index) => {
        const indicatorFallback = state.indicators.matrix[index]?.indicator?.trim() || ''
        if (!row.indicator.trim() && indicatorFallback) {
            row.indicator = indicatorFallback
            changed = true
        }
    })

    next.indicators.thresholds.forEach((row, index) => {
        const indicatorFallback = state.indicators.matrix[index]?.indicator?.trim() || ''
        if (!row.indicator.trim() && indicatorFallback) {
            row.indicator = indicatorFallback
            changed = true
        }
    })

    next.indicators.cards.forEach((row, index) => {
        const indicatorFallback = state.indicators.matrix[index]?.indicator?.trim() || ''
        if (!row.indicator.trim() && indicatorFallback) {
            row.indicator = indicatorFallback
            changed = true
        }
    })

    next.indicators.dashboard.forEach((row, index) => {
        const indicatorFallback = state.indicators.matrix[index]?.indicator?.trim() || ''
        if (!row.indicator.trim() && indicatorFallback) {
            row.indicator = indicatorFallback
            changed = true
        }

        const goalFallback = state.indicators.thresholds[index]?.goal90?.trim() || ''
        if (!row.goal.trim() && goalFallback) {
            row.goal = goalFallback
            changed = true
        }
    })

    next.onePagePlan.essentialBlocks.forEach((value, index) => {
        const fallback = ESSENTIAL_BLOCK_DEFAULTS[index] || ''
        if (!value.trim() && fallback) {
            next.onePagePlan.essentialBlocks[index] = fallback
            changed = true
        }
    })

    next.onePagePlan.synthesis.forEach((row, index) => {
        const blockFallback = SYNTHESIS_BLOCK_LABELS[index] || ''
        if (!row.block.trim() && blockFallback) {
            row.block = blockFallback
            changed = true
        }
    })

    const derivedObjectives = buildDerivedObjectives(state)
    const derivedPriorities = buildDerivedPriorities(state)
    const derivedCommitments = buildDerivedCommitments(state)
    const derivedIndicators = buildDerivedIndicators(state)
    const derivedVision = buildDerivedVision(state)
    const derivedLegacyPhrase = buildDerivedLegacyPhrase(state)

    const synthesisMap: Record<string, string> = {
        'Visión a 3 años': derivedVision,
        'Objetivos integradores': compactJoin(derivedObjectives, 'Pendiente'),
        'Prioridades maestras': compactJoin(derivedPriorities, 'Pendiente'),
        'Compromisos inmediatos': compactJoin(derivedCommitments, 'Pendiente'),
        'Indicadores críticos': compactJoin(derivedIndicators, 'Pendiente'),
        'Frase de legado': derivedLegacyPhrase
    }

    next.onePagePlan.synthesis.forEach((row) => {
        if (!row.summary.trim() && synthesisMap[row.block]) {
            row.summary = synthesisMap[row.block]
            changed = true
        }
    })

    if (!next.onePagePlan.layout.north.trim() && derivedVision) {
        next.onePagePlan.layout.north = `${derivedVision} ${derivedLegacyPhrase}`.trim()
        changed = true
    }
    if (!next.onePagePlan.layout.keyAreas.trim() && derivedObjectives.length > 0) {
        next.onePagePlan.layout.keyAreas = compactJoin(derivedObjectives)
        changed = true
    }
    if (!next.onePagePlan.layout.priorities.trim() && derivedPriorities.length > 0) {
        next.onePagePlan.layout.priorities = compactJoin(derivedPriorities)
        changed = true
    }
    if (!next.onePagePlan.layout.action.trim() && derivedCommitments.length > 0) {
        next.onePagePlan.layout.action = compactJoin(derivedCommitments)
        changed = true
    }
    if (!next.onePagePlan.layout.measurement.trim() && derivedIndicators.length > 0) {
        next.onePagePlan.layout.measurement = compactJoin(derivedIndicators)
        changed = true
    }
    if (!next.onePagePlan.layout.review.trim()) {
        next.onePagePlan.layout.review = 'Revisión semanal y mensual con decisiones gatillo.'
        changed = true
    }

    if (!next.onePagePlan.finalPlan.vision.trim() && derivedVision) {
        next.onePagePlan.finalPlan.vision = derivedVision
        changed = true
    }
    if (!next.onePagePlan.finalPlan.legacyPhrase.trim() && derivedLegacyPhrase) {
        next.onePagePlan.finalPlan.legacyPhrase = derivedLegacyPhrase
        changed = true
    }
    next.onePagePlan.finalPlan.integratedObjectives.forEach((value, index) => {
        if (!value.trim() && derivedObjectives[index]) {
            next.onePagePlan.finalPlan.integratedObjectives[index] = derivedObjectives[index]
            changed = true
        }
    })
    next.onePagePlan.finalPlan.masterPriorities.forEach((value, index) => {
        if (!value.trim() && derivedPriorities[index]) {
            next.onePagePlan.finalPlan.masterPriorities[index] = derivedPriorities[index]
            changed = true
        }
    })
    next.onePagePlan.finalPlan.immediateCommitments.forEach((value, index) => {
        if (!value.trim() && derivedCommitments[index]) {
            next.onePagePlan.finalPlan.immediateCommitments[index] = derivedCommitments[index]
            changed = true
        }
    })
    next.onePagePlan.finalPlan.criticalIndicators.forEach((value, index) => {
        if (!value.trim() && derivedIndicators[index]) {
            next.onePagePlan.finalPlan.criticalIndicators[index] = derivedIndicators[index]
            changed = true
        }
    })
    if (!next.onePagePlan.finalPlan.reviewFrequency.trim()) {
        next.onePagePlan.finalPlan.reviewFrequency = 'Semanal para sostén y acción; mensual para expansión y legado.'
        changed = true
    }
    if (!next.onePagePlan.finalPlan.adjustmentCriteria.trim()) {
        next.onePagePlan.finalPlan.adjustmentCriteria =
            'Si dos indicadores clave caen en rojo por dos ciclos seguidos, rediseño carga, foco o secuencia.'
        changed = true
    }

    return changed ? next : state
}

function TextInputField({
    label,
    value,
    onChange,
    placeholder,
    disabled,
    type = 'text'
}: {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled: boolean
    type?: 'text' | 'date'
}) {
    return (
        <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={TEXT_INPUT_CLASS}
            />
        </label>
    )
}

function TextareaField({
    label,
    value,
    onChange,
    placeholder,
    disabled,
    rows = 4
}: {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled: boolean
    rows?: number
}) {
    return (
        <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                className={TEXTAREA_CLASS}
            />
        </label>
    )
}

function SelectField({
    label,
    value,
    onChange,
    disabled,
    options,
    placeholder = 'Selecciona una opción'
}: {
    label: string
    value: string
    onChange: (value: string) => void
    disabled: boolean
    options: readonly string[]
    placeholder?: string
}) {
    return (
        <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={SELECT_CLASS}>
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={`${label}-${option}`} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    )
}

function SectionContextCard({ concepts }: { concepts: readonly string[] }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
                {concepts.map((concept) => (
                    <li key={concept} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700" />
                        <span>{concept}</span>
                    </li>
                ))}
            </ul>
        </section>
    )
}

function ClosureCard({ items }: { items: readonly string[] }) {
    return (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-6">
            <h3 className="text-lg font-bold text-slate-900">Cierre esperado de esta sección</h3>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
                {items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-700" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </section>
    )
}

function CheckTable({
    rows,
    disabled,
    onVerdictChange,
    onAdjustmentChange
}: {
    rows: CheckRow[]
    disabled: boolean
    onVerdictChange: (index: number, value: YesNoAnswer) => void
    onAdjustmentChange: (index: number, value: string) => void
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full overflow-hidden rounded-2xl border border-slate-200">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pregunta</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sí / No</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ajuste necesario</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={row.question} className="border-t border-slate-200 align-top">
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.question}</td>
                            <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: 'Sí', value: 'yes' as YesNoAnswer },
                                        { label: 'No', value: 'no' as YesNoAnswer }
                                    ].map((option) => (
                                        <button
                                            key={`${row.question}-${option.value}`}
                                            type="button"
                                            onClick={() => onVerdictChange(index, option.value)}
                                            disabled={disabled}
                                            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                                row.verdict === option.value
                                                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                            } disabled:cursor-not-allowed disabled:opacity-50`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <textarea
                                    value={row.adjustment}
                                    onChange={(event) => onAdjustmentChange(index, event.target.value)}
                                    placeholder="Qué debes ajustar para fortalecer esta parte del plan."
                                    disabled={disabled}
                                    rows={3}
                                    className={TEXTAREA_CLASS}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function HelpModal({
    helpKey,
    onClose
}: {
    helpKey: Exclude<HelpModalKey, null>
    onClose: () => void
}) {
    const content = HELP_MODAL_CONTENT[helpKey]

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/55 px-4 py-8 backdrop-blur-sm">
            <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-slate-900">{content.title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                    {content.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="font-semibold text-slate-900">Principio guía</p>
                        <p className="mt-2">{content.principle}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">Recuerda</p>
                        <ul className="mt-2 space-y-2">
                            {content.reminders.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <p className="font-semibold text-slate-900">Ejemplo orientador</p>
                        <p className="mt-2">{content.example}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function WB10Digital() {
    const [state, setState] = useState<WB10State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<WorkbookPageId[]>([1])
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [activeHelpModal, setActiveHelpModal] = useState<HelpModalKey>(null)
    const saveFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            const storedState = window.localStorage.getItem(STORAGE_KEY)
            if (storedState) {
                setState(normalizeState(JSON.parse(storedState)))
            }

            const introSeen = window.localStorage.getItem(INTRO_SEEN_KEY) === '1'
            setHasSeenPresentationOnce(introSeen)

            const storedPage = Number(window.localStorage.getItem(PAGE_STORAGE_KEY))
            if (introSeen && Number.isInteger(storedPage) && isWorkbookPageId(storedPage)) {
                setActivePage(storedPage)
            }

            const storedVisited = window.localStorage.getItem(VISITED_STORAGE_KEY)
            if (storedVisited) {
                const parsedVisited = JSON.parse(storedVisited)
                if (Array.isArray(parsedVisited)) {
                    const normalizedVisited = parsedVisited
                        .map((value) => Number(value))
                        .filter((value): value is WorkbookPageId => Number.isInteger(value) && isWorkbookPageId(value))
                    if (normalizedVisited.length > 0) {
                        setVisitedPages(Array.from(new Set(normalizedVisited)))
                    }
                }
            }
        } catch {
            setState(DEFAULT_STATE)
            setActivePage(1)
            setVisitedPages([1])
            setHasSeenPresentationOnce(false)
        } finally {
            setIsHydrated(true)
        }
    }, [])

    useEffect(() => {
        if (!isHydrated || typeof window === 'undefined') return
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        window.localStorage.setItem(PAGE_STORAGE_KEY, String(activePage))
        window.localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(visitedPages))
        window.localStorage.setItem(INTRO_SEEN_KEY, hasSeenPresentationOnce ? '1' : '0')
    }, [activePage, hasSeenPresentationOnce, isHydrated, state, visitedPages])

    useEffect(() => {
        if (!isHydrated || hasSeenPresentationOnce || activePage !== 2) return
        setHasSeenPresentationOnce(true)
        setVisitedPages((prev) => Array.from(new Set([...prev, 2])))
    }, [activePage, hasSeenPresentationOnce, isHydrated])

    useEffect(() => {
        setState((prev) => syncDerivedState(prev))
    }, [state])

    useEffect(() => {
        return () => {
            if (saveFeedbackTimeoutRef.current) {
                clearTimeout(saveFeedbackTimeoutRef.current)
            }
        }
    }, [])

    const announceSave = (message: string) => {
        setSaveFeedback(message)
        if (saveFeedbackTimeoutRef.current) {
            clearTimeout(saveFeedbackTimeoutRef.current)
        }
        saveFeedbackTimeoutRef.current = setTimeout(() => setSaveFeedback(''), 2600)
    }

    const markPageVisited = (pageId: WorkbookPageId) => {
        setVisitedPages((prev) => Array.from(new Set([...prev, pageId])))
    }

    const jumpToPage = (pageId: WorkbookPageId) => {
        setActivePage(pageId)
        markPageVisited(pageId)
    }

    const savePage = (pageId: WorkbookPageId, message?: string) => {
        markPageVisited(pageId)
        announceSave(message ?? `Página ${pageId} guardada.`)
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

    const updateIdentification = (field: keyof WB10State['identification'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateFuturePhoto = (field: keyof FuturePhoto, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            vision3Years: {
                ...prev.vision3Years,
                futurePhoto: {
                    ...prev.vision3Years.futurePhoto,
                    [field]: value
                }
            }
        }))
    }

    const updateVisionMatrixRow = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            vision3Years: {
                ...prev.vision3Years,
                systemMatrix: prev.vision3Years.systemMatrix.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              response: value
                          }
                        : row
                )
            }
        }))
    }

    const updateVisionLifeMapRow = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            vision3Years: {
                ...prev.vision3Years,
                lifeMap: prev.vision3Years.lifeMap.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              vision: value
                          }
                        : row
                )
            }
        }))
    }

    const updateVisionGapRow = (index: number, field: keyof GapRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            vision3Years: {
                ...prev.vision3Years,
                gapMap: prev.vision3Years.gapMap.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateVisionStatement = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            vision3Years: {
                ...prev.vision3Years,
                statement: value
            }
        }))
    }

    const updateVisionCheckRow = (index: number, field: keyof Omit<CheckRow, 'question'>, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            vision3Years: {
                ...prev.vision3Years,
                qualityChecks: prev.vision3Years.qualityChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateAreaPrioritizationRow = (index: number, field: keyof Omit<AreaPrioritizationRow, 'area'>, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            areaGoals: {
                ...prev.areaGoals,
                prioritization: prev.areaGoals.prioritization.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateAreaObjectiveRow = (index: number, field: keyof AreaObjectiveRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            areaGoals: {
                ...prev.areaGoals,
                objectiveMatrix: prev.areaGoals.objectiveMatrix.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateObjectiveClassificationRow = (index: number, field: keyof ObjectiveClassificationRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            areaGoals: {
                ...prev.areaGoals,
                classifications: prev.areaGoals.classifications.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateInterdependencies = (field: keyof InterdependencyMap, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            areaGoals: {
                ...prev.areaGoals,
                interdependencies: {
                    ...prev.areaGoals.interdependencies,
                    [field]: value
                }
            }
        }))
    }

    const updateFinalObjectiveRow = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            areaGoals: {
                ...prev.areaGoals,
                finalObjectives: prev.areaGoals.finalObjectives.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              statement: value
                          }
                        : row
                )
            }
        }))
    }

    const updateAreaGoalsCheckRow = (index: number, field: keyof Omit<CheckRow, 'question'>, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            areaGoals: {
                ...prev.areaGoals,
                qualityChecks: prev.areaGoals.qualityChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updatePriorityFront = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            priorities: {
                ...prev.priorities,
                fronts: prev.priorities.fronts.map((front, frontIndex) => (frontIndex === index ? value : front))
            }
        }))
    }

    const updatePriorityMatrixRow = (index: number, field: keyof PriorityMatrixRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            priorities: {
                ...prev.priorities,
                matrix: prev.priorities.matrix.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateMasterPriorityRow = (index: number, field: keyof MasterPriorityRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            priorities: {
                ...prev.priorities,
                masterPriorities: prev.priorities.masterPriorities.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updatePrioritySequence = (field: keyof PrioritySequence, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            priorities: {
                ...prev.priorities,
                sequence: {
                    ...prev.priorities.sequence,
                    [field]: value
                }
            }
        }))
    }

    const updateRenunciationRow = (index: number, field: keyof RenunciationRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            priorities: {
                ...prev.priorities,
                renunciations: prev.priorities.renunciations.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updatePrioritiesCheckRow = (index: number, field: keyof Omit<CheckRow, 'question'>, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            priorities: {
                ...prev.priorities,
                qualityChecks: prev.priorities.qualityChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateCommitmentField = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            commitments: {
                ...prev.commitments,
                commitments: prev.commitments.commitments.map((item, itemIndex) => (itemIndex === index ? value : item))
            }
        }))
    }

    const updateCommitmentTractionRow = (index: number, field: keyof CommitmentTractionRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            commitments: {
                ...prev.commitments,
                tractionMatrix: prev.commitments.tractionMatrix.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateCommitmentDesignRow = (index: number, field: keyof CommitmentDesignRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            commitments: {
                ...prev.commitments,
                designRows: prev.commitments.designRows.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateCommitmentObstacleRow = (index: number, field: keyof CommitmentObstacleRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            commitments: {
                ...prev.commitments,
                obstacles: prev.commitments.obstacles.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateAccountability = (field: keyof AccountabilityPlan, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            commitments: {
                ...prev.commitments,
                accountability: {
                    ...prev.commitments.accountability,
                    [field]: value
                }
            }
        }))
    }

    const updateCommitmentsCheckRow = (index: number, field: keyof Omit<CheckRow, 'question'>, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            commitments: {
                ...prev.commitments,
                qualityChecks: prev.commitments.qualityChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateIndicatorDimension = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            indicators: {
                ...prev.indicators,
                dimensions: prev.indicators.dimensions.map((item, itemIndex) => (itemIndex === index ? value : item))
            }
        }))
    }

    const updateIndicatorMatrixRow = (index: number, field: keyof IndicatorMatrixRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            indicators: {
                ...prev.indicators,
                matrix: prev.indicators.matrix.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateIndicatorClassificationRow = (index: number, field: keyof IndicatorClassificationRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            indicators: {
                ...prev.indicators,
                classifications: prev.indicators.classifications.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateIndicatorThresholdRow = (index: number, field: keyof IndicatorThresholdRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            indicators: {
                ...prev.indicators,
                thresholds: prev.indicators.thresholds.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateIndicatorCard = (index: number, field: keyof IndicatorCard, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            indicators: {
                ...prev.indicators,
                cards: prev.indicators.cards.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateDashboardRow = (index: number, field: keyof DashboardRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            indicators: {
                ...prev.indicators,
                dashboard: prev.indicators.dashboard.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateIndicatorsCheckRow = (index: number, field: keyof Omit<CheckRow, 'question'>, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            indicators: {
                ...prev.indicators,
                qualityChecks: prev.indicators.qualityChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateEssentialBlock = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            onePagePlan: {
                ...prev.onePagePlan,
                essentialBlocks: prev.onePagePlan.essentialBlocks.map((item, itemIndex) => (itemIndex === index ? value : item))
            }
        }))
    }

    const updateSynthesisRow = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            onePagePlan: {
                ...prev.onePagePlan,
                synthesis: prev.onePagePlan.synthesis.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              summary: value
                          }
                        : row
                )
            }
        }))
    }

    const updateLayout = (field: keyof LayoutPlan, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            onePagePlan: {
                ...prev.onePagePlan,
                layout: {
                    ...prev.onePagePlan.layout,
                    [field]: value
                }
            }
        }))
    }

    const updateOnePageCoherenceRow = (index: number, field: keyof Omit<CheckRow, 'question'>, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            onePagePlan: {
                ...prev.onePagePlan,
                coherenceChecks: prev.onePagePlan.coherenceChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const updateFinalPlan = (field: keyof Omit<FinalOnePagePlan, 'integratedObjectives' | 'masterPriorities' | 'immediateCommitments' | 'criticalIndicators'>, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            onePagePlan: {
                ...prev.onePagePlan,
                finalPlan: {
                    ...prev.onePagePlan.finalPlan,
                    [field]: value
                }
            }
        }))
    }

    const updateFinalPlanArray = (
        field: 'integratedObjectives' | 'masterPriorities' | 'immediateCommitments' | 'criticalIndicators',
        index: number,
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            onePagePlan: {
                ...prev.onePagePlan,
                finalPlan: {
                    ...prev.onePagePlan.finalPlan,
                    [field]: prev.onePagePlan.finalPlan[field].map((item, itemIndex) => (itemIndex === index ? value : item))
                }
            }
        }))
    }

    const updateOnePageFinalCheckRow = (index: number, field: keyof Omit<CheckRow, 'question'>, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            onePagePlan: {
                ...prev.onePagePlan,
                finalChecks: prev.onePagePlan.finalChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: value
                          }
                        : row
                )
            }
        }))
    }

    const saveVisionBlock = (label: string) => savePage(3, `${label} guardado.`)
    const saveAreaGoalsBlock = (label: string) => savePage(4, `${label} guardado.`)
    const savePrioritiesBlock = (label: string) => savePage(5, `${label} guardado.`)
    const saveCommitmentsBlock = (label: string) => savePage(6, `${label} guardado.`)
    const saveIndicatorsBlock = (label: string) => savePage(7, `${label} guardado.`)
    const saveOnePageBlock = (label: string) => savePage(8, `${label} guardado.`)

    const assistAreaObjectiveMatrix = () => {
        const suggestedAreas = [...state.areaGoals.prioritization]
            .sort((a, b) => Number(b.importance || 0) + Number(b.urgency || 0) - (Number(a.importance || 0) + Number(a.urgency || 0)))
            .map((row) => row.area)

        setState((prev) => ({
            ...prev,
            areaGoals: {
                ...prev.areaGoals,
                objectiveMatrix: prev.areaGoals.objectiveMatrix.map((row, index) => {
                    const area = row.area || suggestedAreas[index] || AREA_LABELS[index]
                    const lifeVision =
                        prev.vision3Years.lifeMap.find((item) => item.area === area)?.vision ||
                        `Quiero construir una versión más sólida y sostenible de ${area.toLowerCase()}.`
                    const objective =
                        row.objective ||
                        `Fortalecer ${area.toLowerCase()} con más claridad, sistema y capacidad de sostener crecimiento.`
                    const type = row.goalType || inferObjectiveTypeFromText(`${area} ${objective}`)
                    return {
                        ...row,
                        area,
                        vision: row.vision || lifeVision,
                        objective,
                        goalType: type,
                        visibleResult:
                            row.visibleResult ||
                            (type === 'Legado'
                                ? 'Capacidades visibles más allá de mí'
                                : type === 'Sostén'
                                  ? 'Mayor estabilidad, energía o equilibrio'
                                  : 'Más alcance, foco o autonomía')
                    }
                })
            }
        }))
        announceSave('Asistente local: matriz área-visión-objetivo completada.')
    }

    const assistObjectiveClassifications = () => {
        const objectives = prevFilledAreaObjectives(state.areaGoals.objectiveMatrix)
        setState((prev) => ({
            ...prev,
            areaGoals: {
                ...prev.areaGoals,
                classifications: prev.areaGoals.classifications.map((row, index) => {
                    const objective = row.objective || objectives[index] || ''
                    const mainFunction = row.mainFunction || inferGoalFunctionFromObjective(objective)
                    return {
                        ...row,
                        objective,
                        mainFunction,
                        why:
                            row.why ||
                            (mainFunction === 'Trascender'
                                ? 'Construye capacidades o impacto más allá del desempeño inmediato.'
                                : mainFunction === 'Sostener'
                                  ? 'Protege la base del sistema para que el resto sea sostenible.'
                                  : 'Amplía alcance, influencia o capacidad de crecimiento.')
                    }
                })
            }
        }))
        announceSave('Asistente local: clasificación de objetivos completada.')
    }

    const assistInterdependencies = () => {
        const prioritization = [...state.areaGoals.prioritization]
        const driver = prioritization
            .filter((row) => row.importance !== '')
            .sort((a, b) => Number(b.importance || 0) - Number(a.importance || 0))[0]
        const limiting = prioritization
            .filter((row) => row.currentState !== '' || row.urgency !== '')
            .sort((a, b) => Number(a.currentState || 0) - Number(b.currentState || 0) || Number(b.urgency || 0) - Number(a.urgency || 0))[0]
        const multiplier = state.areaGoals.objectiveMatrix.find((row) => row.goalType === 'Legado')?.objective || state.areaGoals.objectiveMatrix.find((row) => row.objective.trim())?.objective || ''
        const combo = uniqueFilled([driver?.area || '', limiting?.area || '', state.areaGoals.objectiveMatrix.find((row) => row.goalType === 'Expansión')?.area || '']).slice(0, 3)

        setState((prev) => ({
            ...prev,
            areaGoals: {
                ...prev.areaGoals,
                interdependencies: {
                    driverArea: prev.areaGoals.interdependencies.driverArea || driver?.area || '',
                    limitingArea: prev.areaGoals.interdependencies.limitingArea || limiting?.area || '',
                    multiplierObjective: prev.areaGoals.interdependencies.multiplierObjective || multiplier,
                    coherentCombination:
                        prev.areaGoals.interdependencies.coherentCombination ||
                        (combo.length > 0 ? combo.join(' + ') : 'Salud y bienestar + foco profesional + relaciones')
                }
            }
        }))
        announceSave('Asistente local: interdependencias sugeridas.')
    }

    const assistFinalObjectives = () => {
        setState((prev) => ({
            ...prev,
            areaGoals: {
                ...prev.areaGoals,
                finalObjectives: prev.areaGoals.finalObjectives.map((row) => {
                    const existingMatrix = prev.areaGoals.objectiveMatrix.find((item) => item.area === row.area)
                    return {
                        ...row,
                        statement:
                            row.statement ||
                            `En esta área, mi objetivo estratégico es ${
                                existingMatrix?.objective || `fortalecer ${row.area.toLowerCase()} con mayor claridad, sostenibilidad y dirección`
                            }.`
                    }
                })
            }
        }))
        announceSave('Asistente local: formulación final de objetivos por área lista.')
    }

    const assistPrioritySequence = () => {
        const nonEmptyPriorities = state.priorities.masterPriorities.filter((row) => row.priority.trim())
        const first = nonEmptyPriorities.find((row) => row.priorityType === 'Sostén')?.priority || nonEmptyPriorities[0]?.priority || ''
        const dependsOn = nonEmptyPriorities.find((row) => row.priorityType === 'Legado')?.priority || nonEmptyPriorities[1]?.priority || ''
        const parallel = nonEmptyPriorities.find((row) => row.priorityType === 'Expansión')?.priority || nonEmptyPriorities[2]?.priority || ''
        const postpone = state.priorities.fronts.find(
            (front) => front.trim() && !nonEmptyPriorities.some((row) => row.summarizedFront.trim() === front.trim())
        )

        setState((prev) => ({
            ...prev,
            priorities: {
                ...prev.priorities,
                sequence: {
                    first: prev.priorities.sequence.first || first,
                    dependsOn: prev.priorities.sequence.dependsOn || dependsOn,
                    parallel: prev.priorities.sequence.parallel || parallel,
                    postpone: prev.priorities.sequence.postpone || postpone || ''
                }
            }
        }))
        announceSave('Asistente local: secuencia estratégica sugerida.')
    }

    const assistIndicatorMatrix = () => {
        setState((prev) => ({
            ...prev,
            indicators: {
                ...prev.indicators,
                matrix: prev.indicators.matrix.map((row, index) => {
                    const dimension = row.dimension || prev.indicators.dimensions[index] || ''
                    const suggestion = buildSuggestedIndicator(dimension)
                    return {
                        ...row,
                        dimension,
                        indicator: row.indicator || suggestion.indicator,
                        evidence: row.evidence || suggestion.evidence,
                        reviewFrequency: row.reviewFrequency || suggestion.reviewFrequency
                    }
                })
            }
        }))
        announceSave('Asistente local: matriz dimensión-indicador completada.')
    }

    const assistIndicatorClassification = () => {
        setState((prev) => ({
            ...prev,
            indicators: {
                ...prev.indicators,
                classifications: prev.indicators.classifications.map((row, index) => {
                    const indicator = row.indicator || prev.indicators.matrix[index]?.indicator || ''
                    const suggestion = buildSuggestedIndicator(indicator)
                    return {
                        ...row,
                        indicator,
                        indicatorType: row.indicatorType || suggestion.indicatorType,
                        protectsOrDrives: row.protectsOrDrives || suggestion.protectsOrDrives
                    }
                })
            }
        }))
        announceSave('Asistente local: clasificación de indicadores lista.')
    }

    const assistIndicatorThresholds = () => {
        setState((prev) => ({
            ...prev,
            indicators: {
                ...prev.indicators,
                thresholds: prev.indicators.thresholds.map((row, index) => ({
                    ...row,
                    indicator: row.indicator || prev.indicators.matrix[index]?.indicator || '',
                    baseline: row.baseline || `${index + 1}`,
                    goal30: row.goal30 || `${index + 2}`,
                    goal90: row.goal90 || `${index + 4}`,
                    minimumThreshold: row.minimumThreshold || `${index + 1}`,
                    correctiveAction: row.correctiveAction || 'Revisar foco, carga o secuencia si el indicador cae.'
                }))
            }
        }))
        announceSave('Asistente local: línea base, metas y umbrales sugeridos.')
    }

    const assistIndicatorCards = () => {
        setState((prev) => ({
            ...prev,
            indicators: {
                ...prev.indicators,
                cards: prev.indicators.cards.map((row, index) => {
                    const indicator = row.indicator || prev.indicators.matrix[index]?.indicator || ''
                    const suggestion = buildSuggestedIndicator(indicator)
                    return {
                        ...row,
                        indicator,
                        measures: row.measures || suggestion.measures,
                        formula: row.formula || suggestion.formula,
                        source: row.source || suggestion.source,
                        owner: row.owner || suggestion.owner,
                        decision: row.decision || suggestion.decision
                    }
                })
            }
        }))
        announceSave('Asistente local: fichas técnicas de indicadores listas.')
    }

    const assistOnePageLayout = () => {
        setState((prev) => ({
            ...prev,
            onePagePlan: {
                ...prev.onePagePlan,
                layout: {
                    north: prev.onePagePlan.layout.north || `${buildDerivedVision(prev)} ${buildDerivedLegacyPhrase(prev)}`.trim(),
                    keyAreas: prev.onePagePlan.layout.keyAreas || compactJoin(buildDerivedObjectives(prev), 'Áreas clave pendientes'),
                    priorities: prev.onePagePlan.layout.priorities || compactJoin(buildDerivedPriorities(prev), 'Prioridades pendientes'),
                    action: prev.onePagePlan.layout.action || compactJoin(buildDerivedCommitments(prev), 'Acción pendiente'),
                    measurement: prev.onePagePlan.layout.measurement || compactJoin(buildDerivedIndicators(prev), 'Medición pendiente'),
                    review: prev.onePagePlan.layout.review || 'Revisión semanal y mensual con decisiones gatillo.'
                }
            }
        }))
        announceSave('Asistente local: layout estratégico sugerido.')
    }

    const assistFinalOnePagePlan = () => {
        const derivedObjectives = buildDerivedObjectives(state)
        const derivedPriorities = buildDerivedPriorities(state)
        const derivedCommitments = buildDerivedCommitments(state)
        const derivedIndicators = buildDerivedIndicators(state)
        setState((prev) => ({
            ...prev,
            onePagePlan: {
                ...prev.onePagePlan,
                finalPlan: {
                    ...prev.onePagePlan.finalPlan,
                    vision: prev.onePagePlan.finalPlan.vision || buildDerivedVision(prev),
                    legacyPhrase: prev.onePagePlan.finalPlan.legacyPhrase || buildDerivedLegacyPhrase(prev),
                    integratedObjectives: prev.onePagePlan.finalPlan.integratedObjectives.map((item, index) => item || derivedObjectives[index] || ''),
                    masterPriorities: prev.onePagePlan.finalPlan.masterPriorities.map((item, index) => item || derivedPriorities[index] || ''),
                    immediateCommitments: prev.onePagePlan.finalPlan.immediateCommitments.map((item, index) => item || derivedCommitments[index] || ''),
                    criticalIndicators: prev.onePagePlan.finalPlan.criticalIndicators.map((item, index) => item || derivedIndicators[index] || ''),
                    reviewFrequency:
                        prev.onePagePlan.finalPlan.reviewFrequency || 'Semanal para sostén y acción; mensual para expansión y legado.',
                    adjustmentCriteria:
                        prev.onePagePlan.finalPlan.adjustmentCriteria ||
                        'Si dos indicadores clave caen en rojo por dos ciclos seguidos, rediseño carga, foco o secuencia.'
                }
            }
        }))
        announceSave('Asistente local: One Strategic Page Plan redactado.')
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
            document.title = 'WB10 - Vision Estrategica Personal'
            window.print()
            document.title = currentTitle
            announceSave('PDF completo generado. Usa "Guardar como PDF" en el diálogo.')
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
            link.download = 'WB10-vision-estrategica-personal.html'
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

    const futurePhotoComplete = Object.values(state.vision3Years.futurePhoto).every((value) => value.trim().length > 0)
    const systemMatrixComplete = state.vision3Years.systemMatrix.every((row) => row.response.trim().length > 0)
    const lifeMapComplete = state.vision3Years.lifeMap.every((row) => row.vision.trim().length > 0)
    const gapMapComplete = state.vision3Years.gapMap.every(
        (row) =>
            row.dimension.trim().length > 0 &&
            row.currentState.trim().length > 0 &&
            row.futureState.trim().length > 0 &&
            row.mainGap.trim().length > 0 &&
            row.systemicChange.trim().length > 0
    )
    const visionChecksComplete = state.vision3Years.qualityChecks.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)
    const visionSectionComplete =
        futurePhotoComplete &&
        systemMatrixComplete &&
        lifeMapComplete &&
        gapMapComplete &&
        state.vision3Years.statement.trim().length > 0 &&
        visionChecksComplete

    const areaPrioritizationComplete = state.areaGoals.prioritization.every(
        (row) => row.importance !== '' && row.currentState !== '' && row.urgency !== ''
    )
    const areaObjectiveMatrixComplete = state.areaGoals.objectiveMatrix.every(
        (row) =>
            row.area.trim().length > 0 &&
            row.vision.trim().length > 0 &&
            row.objective.trim().length > 0 &&
            row.goalType !== '' &&
            row.visibleResult.trim().length > 0
    )
    const objectiveClassificationsComplete = state.areaGoals.classifications.every(
        (row) => row.objective.trim().length > 0 && row.mainFunction !== '' && row.why.trim().length > 0
    )
    const interdependenciesComplete = Object.values(state.areaGoals.interdependencies).every((value) => value.trim().length > 0)
    const finalObjectivesComplete = state.areaGoals.finalObjectives.every((row) => row.statement.trim().length > 0)
    const areaGoalsChecksComplete = state.areaGoals.qualityChecks.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)
    const areaGoalsSectionComplete =
        areaPrioritizationComplete &&
        areaObjectiveMatrixComplete &&
        objectiveClassificationsComplete &&
        interdependenciesComplete &&
        finalObjectivesComplete &&
        areaGoalsChecksComplete

    const frontsComplete = state.priorities.fronts.every((front) => front.trim().length > 0)
    const prioritiesMatrixComplete = state.priorities.matrix.every(
        (row) =>
            row.front.trim().length > 0 &&
            row.impact !== '' &&
            row.urgency !== '' &&
            row.leverage !== '' &&
            row.costOfDelay.trim().length > 0 &&
            row.reading.trim().length > 0
    )
    const masterPrioritiesComplete = state.priorities.masterPriorities.every(
        (row) =>
            row.priority.trim().length > 0 &&
            row.summarizedFront.trim().length > 0 &&
            row.servedObjective.trim().length > 0 &&
            row.priorityType !== ''
    )
    const prioritySequenceComplete = Object.values(state.priorities.sequence).every((value) => value.trim().length > 0)
    const renunciationsComplete = state.priorities.renunciations.every(
        (row) => row.release.trim().length > 0 && row.whyCompetes.trim().length > 0 && row.doDifferent.trim().length > 0
    )
    const prioritiesChecksComplete = state.priorities.qualityChecks.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)
    const prioritiesSectionComplete =
        frontsComplete && prioritiesMatrixComplete && masterPrioritiesComplete && prioritySequenceComplete && renunciationsComplete && prioritiesChecksComplete

    const nonEmptyCommitments = collectFilled(state.commitments.commitments)
    const commitmentsSelectionComplete = state.commitments.commitments.slice(0, 5).every((value) => value.trim().length > 0)
    const commitmentTractionComplete = state.commitments.tractionMatrix.every(
        (row) =>
            row.commitment.trim().length > 0 &&
            row.servedPriority.trim().length > 0 &&
            row.commitmentType !== '' &&
            row.visibleTraction.trim().length > 0 &&
            row.risk.trim().length > 0
    )
    const commitmentDesignComplete = state.commitments.designRows.every(
        (row) =>
            row.commitment.trim().length > 0 &&
            row.exactAction.trim().length > 0 &&
            row.timing.trim().length > 0 &&
            row.evidence.trim().length > 0 &&
            row.support.trim().length > 0
    )
    const commitmentObstaclesComplete = state.commitments.obstacles.every(
        (row) =>
            row.commitment.trim().length > 0 &&
            row.obstacle.trim().length > 0 &&
            row.earlySignal.trim().length > 0 &&
            row.contingency.trim().length > 0 &&
            row.minimumProtection.trim().length > 0
    )
    const accountabilityComplete = Object.values(state.commitments.accountability).every((value) => value.trim().length > 0)
    const commitmentsChecksComplete = state.commitments.qualityChecks.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)
    const commitmentsSectionComplete =
        commitmentsSelectionComplete &&
        commitmentTractionComplete &&
        commitmentDesignComplete &&
        commitmentObstaclesComplete &&
        accountabilityComplete &&
        commitmentsChecksComplete

    const dimensionsComplete = state.indicators.dimensions.slice(0, 5).every((value) => value.trim().length > 0)
    const indicatorsMatrixComplete = state.indicators.matrix.every(
        (row) =>
            row.dimension.trim().length > 0 &&
            row.indicator.trim().length > 0 &&
            row.evidence.trim().length > 0 &&
            row.reviewFrequency.trim().length > 0
    )
    const indicatorsClassificationComplete = state.indicators.classifications.every(
        (row) => row.indicator.trim().length > 0 && row.indicatorType !== '' && row.protectsOrDrives.trim().length > 0
    )
    const indicatorsThresholdComplete = state.indicators.thresholds.every(
        (row) =>
            row.indicator.trim().length > 0 &&
            row.baseline.trim().length > 0 &&
            row.goal30.trim().length > 0 &&
            row.goal90.trim().length > 0 &&
            row.minimumThreshold.trim().length > 0 &&
            row.correctiveAction.trim().length > 0
    )
    const indicatorsCardsComplete = state.indicators.cards.every(
        (row) =>
            row.indicator.trim().length > 0 &&
            row.measures.trim().length > 0 &&
            row.formula.trim().length > 0 &&
            row.source.trim().length > 0 &&
            row.owner.trim().length > 0 &&
            row.decision.trim().length > 0
    )
    const indicatorsDashboardComplete = state.indicators.dashboard.every(
        (row) => row.indicator.trim().length > 0 && row.currentValue.trim().length > 0 && row.goal.trim().length > 0 && row.decision.trim().length > 0
    )
    const indicatorsChecksComplete = state.indicators.qualityChecks.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)
    const indicatorsSectionComplete =
        dimensionsComplete &&
        indicatorsMatrixComplete &&
        indicatorsClassificationComplete &&
        indicatorsThresholdComplete &&
        indicatorsCardsComplete &&
        indicatorsDashboardComplete &&
        indicatorsChecksComplete

    const essentialBlocksComplete = state.onePagePlan.essentialBlocks.every((value) => value.trim().length > 0)
    const synthesisComplete = state.onePagePlan.synthesis.every((row) => row.block.trim().length > 0 && row.summary.trim().length > 0)
    const layoutComplete = Object.values(state.onePagePlan.layout).every((value) => value.trim().length > 0)
    const onePageCoherenceComplete = state.onePagePlan.coherenceChecks.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const finalPlanComplete =
        state.onePagePlan.finalPlan.vision.trim().length > 0 &&
        state.onePagePlan.finalPlan.legacyPhrase.trim().length > 0 &&
        state.onePagePlan.finalPlan.integratedObjectives.every((value) => value.trim().length > 0) &&
        state.onePagePlan.finalPlan.masterPriorities.every((value) => value.trim().length > 0) &&
        state.onePagePlan.finalPlan.immediateCommitments.every((value) => value.trim().length > 0) &&
        state.onePagePlan.finalPlan.criticalIndicators.every((value) => value.trim().length > 0) &&
        state.onePagePlan.finalPlan.reviewFrequency.trim().length > 0 &&
        state.onePagePlan.finalPlan.adjustmentCriteria.trim().length > 0
    const onePageFinalChecksComplete = state.onePagePlan.finalChecks.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)
    const onePageSectionComplete =
        essentialBlocksComplete && synthesisComplete && layoutComplete && onePageCoherenceComplete && finalPlanComplete && onePageFinalChecksComplete

    const showVisionWorkOnlySuggestion =
        state.vision3Years.statement.trim().length > 0 &&
        state.vision3Years.lifeMap.filter((row) => row.vision.trim().length > 0).length <= 2
    const showVisionLegacySuggestion =
        state.vision3Years.statement.trim().length > 0 &&
        !keywordMatch(
            `${state.vision3Years.statement} ${state.vision3Years.futurePhoto.visibleFootprint} ${state.vision3Years.systemMatrix[3]?.response || ''}`,
            /(legad|huella|trascend|instituci|suces|impact)/
        )
    const showVisionSystemSuggestion =
        state.vision3Years.statement.trim().length > 0 &&
        state.vision3Years.systemMatrix[1]?.response.trim().length === 0
    const showVisionVagueSuggestion = state.vision3Years.statement.trim().split(/\s+/).filter(Boolean).length > 0 &&
        state.vision3Years.statement.trim().split(/\s+/).filter(Boolean).length < 12

    const allImportanceSame = new Set(state.areaGoals.prioritization.map((row) => row.importance).filter(Boolean)).size <= 1
    const allUrgencySame = new Set(state.areaGoals.prioritization.map((row) => row.urgency).filter(Boolean)).size <= 1
    const showAreaEqualPrioritySuggestion = areaPrioritizationComplete && allImportanceSame && allUrgencySame
    const showAreaGenericObjectivesSuggestion = state.areaGoals.finalObjectives.some(
        (row) => row.statement.trim().length > 0 && row.statement.trim().split(/\s+/).filter(Boolean).length < 10
    )
    const showAreaLegacyObjectiveSuggestion =
        state.areaGoals.finalObjectives.some((row) => row.statement.trim().length > 0) &&
        !keywordMatch(
            state.areaGoals.finalObjectives.map((row) => row.statement).join(' '),
            /(legad|impact|suces|instituci|trascend)/
        )
    const showAreaInterdependencySuggestion = !interdependenciesComplete

    const showPriorityTypeSuggestion =
        state.priorities.masterPriorities.some((row) => row.priority.trim().length > 0) &&
        state.priorities.masterPriorities.some((row) => row.priority.trim().length > 0 && row.priorityType === '')
    const showPriorityRenunciationSuggestion = !state.priorities.renunciations.some((row) => row.release.trim().length > 0)
    const showPrioritySequenceSuggestion = !prioritySequenceComplete && state.priorities.masterPriorities.some((row) => row.priority.trim().length > 0)

    const showCommitmentVolumeSuggestion = nonEmptyCommitments.length > 5
    const showCommitmentTimingSuggestion = state.commitments.designRows.some(
        (row) => row.exactAction.trim().length > 0 && row.timing.trim().length === 0
    )
    const showCommitmentEvidenceSuggestion = state.commitments.designRows.some(
        (row) => row.exactAction.trim().length > 0 && row.evidence.trim().length === 0
    )
    const showCommitmentContingencySuggestion = state.commitments.obstacles.some(
        (row) => row.commitment.trim().length > 0 && row.contingency.trim().length === 0
    )
    const showCommitmentAccountabilitySuggestion =
        nonEmptyCommitments.length > 0 &&
        (state.commitments.accountability.audience.trim().length === 0 || state.commitments.accountability.reviewFrequency.trim().length === 0)

    const nonEmptyDimensions = collectFilled(state.indicators.dimensions)
    const showIndicatorsVolumeSuggestion = nonEmptyDimensions.length > 6
    const showIndicatorsActivityOnlySuggestion =
        state.indicators.matrix.some((row) => row.indicator.trim().length > 0) &&
        !keywordMatch(
            state.indicators.matrix.map((row) => `${row.indicator} ${row.evidence}`).join(' '),
            /(impact|deleg|suces|cultur|ahorro|influencia|autonom|resultado|legad|instituci)/
        )
    const showIndicatorsBaselineSuggestion = state.indicators.thresholds.some(
        (row) => row.indicator.trim().length > 0 && row.baseline.trim().length === 0
    )
    const showIndicatorsEvidenceSuggestion = state.indicators.matrix.some(
        (row) => row.indicator.trim().length > 0 && row.evidence.trim().length === 0
    )
    const showIndicatorsInstitutionalizationSuggestion =
        state.indicators.matrix.some((row) => row.indicator.trim().length > 0) &&
        !keywordMatch(
            state.indicators.matrix.map((row) => `${row.dimension} ${row.indicator}`).join(' '),
            /(deleg|suces|instituci|cultur|autonom)/
        )

    const showOnePageCondenseSuggestion = [...state.onePagePlan.synthesis.map((row) => row.summary), ...Object.values(state.onePagePlan.layout)].some(
        (value) => value.trim().split(/\s+/).filter(Boolean).length > 20
    )
    const showOnePageLegacySuggestion =
        state.onePagePlan.finalPlan.legacyPhrase.trim().length > 0 &&
        !keywordMatch(state.onePagePlan.finalPlan.legacyPhrase, /(legad|huella|instituci|suces|impact|trascend)/)
    const showOnePageReviewSuggestion =
        state.onePagePlan.finalPlan.reviewFrequency.trim().length === 0 || state.onePagePlan.finalPlan.adjustmentCriteria.trim().length === 0

    const visionLifeScores = state.vision3Years.lifeMap.map((row) => buildDefinitionScore(row.vision))
    const lifeWheelSize = 360
    const lifeWheelCenter = 180
    const lifeWheelRadius = 120
    const lifeWheelLevels = [2, 4, 6, 8, 10]
    const visionLifeAxes = state.vision3Years.lifeMap.map((row, index) => {
        const score = visionLifeScores[index]
        const angle = (-90 + (360 / state.vision3Years.lifeMap.length) * index) * (Math.PI / 180)
        const pointRadius = (score / 10) * lifeWheelRadius
        const outerRadius = lifeWheelRadius + 32
        return {
            area: row.area,
            score,
            pointX: lifeWheelCenter + pointRadius * Math.cos(angle),
            pointY: lifeWheelCenter + pointRadius * Math.sin(angle),
            outerX: lifeWheelCenter + lifeWheelRadius * Math.cos(angle),
            outerY: lifeWheelCenter + lifeWheelRadius * Math.sin(angle),
            labelX: lifeWheelCenter + outerRadius * Math.cos(angle),
            labelY: lifeWheelCenter + outerRadius * Math.sin(angle)
        }
    })
    const visionLifePolygonPoints = visionLifeAxes.map((axis) => `${axis.pointX},${axis.pointY}`).join(' ')

    const areaStateScores = state.areaGoals.prioritization.map((row) => Number(row.currentState || 0) * 2)
    const areaStateAxes = state.areaGoals.prioritization.map((row, index) => {
        const score = areaStateScores[index]
        const angle = (-90 + (360 / state.areaGoals.prioritization.length) * index) * (Math.PI / 180)
        const pointRadius = (score / 10) * lifeWheelRadius
        const outerRadius = lifeWheelRadius + 32
        return {
            area: row.area,
            score,
            pointX: lifeWheelCenter + pointRadius * Math.cos(angle),
            pointY: lifeWheelCenter + pointRadius * Math.sin(angle),
            outerX: lifeWheelCenter + lifeWheelRadius * Math.cos(angle),
            outerY: lifeWheelCenter + lifeWheelRadius * Math.sin(angle),
            labelX: lifeWheelCenter + outerRadius * Math.cos(angle),
            labelY: lifeWheelCenter + outerRadius * Math.sin(angle)
        }
    })
    const areaStatePolygonPoints = areaStateAxes.map((axis) => `${axis.pointX},${axis.pointY}`).join(' ')

    const dashboardThresholdLookup = new Map(
        state.indicators.thresholds.map((row) => [
            row.indicator.trim(),
            {
                baseline: row.baseline,
                goal90: row.goal90,
                minimumThreshold: row.minimumThreshold
            }
        ])
    )
    const dashboardRowsComputed = state.indicators.dashboard.map((row) => {
        const threshold = dashboardThresholdLookup.get(row.indicator.trim())
        const trend = resolveIndicatorTrend(row.currentValue, threshold?.baseline || '')
        const status = resolveIndicatorStatus(row.currentValue, row.goal || threshold?.goal90 || '', threshold?.minimumThreshold || '')
        const quickRead = resolveIndicatorQuickRead(status, trend)
        return {
            ...row,
            trend,
            status,
            quickRead
        }
    })

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: visionSectionComplete,
        4: areaGoalsSectionComplete,
        5: prioritiesSectionComplete,
        6: commitmentsSectionComplete,
        7: indicatorsSectionComplete,
        8: onePageSectionComplete
    }

    const completedPages = PAGES.filter((page) => pageCompletionMap[page.id]).length
    const progressPercent = Math.round((completedPages / PAGES.length) * 100)
    const printMetaLabel = `Líder: ${state.identification.leaderName || 'Sin nombre'} · Rol: ${state.identification.role || 'Sin rol'}`
    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb10-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/workbooks-v2" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="mr-auto">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm font-extrabold text-slate-900 md:text-base">WB10 - {WORKBOOK_TITLE}</p>
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
                        disabled={isLocked || isExporting || !isHydrated}
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

            <main className="mx-auto max-w-[1280px] overflow-x-hidden px-2 py-5 sm:px-5 md:px-8 md:py-8">
                <div className={`grid items-start gap-6 ${isExportingAll ? 'grid-cols-1 min-w-0' : 'grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] min-w-0'}`}>
                    <aside className={`wb10-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
                        <p className={WORKBOOK_V2_EDITORIAL.classes.sidebarTitle}>{WORKBOOK_V2_EDITORIAL.labels.index}</p>
                        <nav className="space-y-1.5">
                            {PAGES.map((page) => (
                                <button
                                    key={page.id}
                                    type="button"
                                    onClick={() => jumpToPage(page.id)}
                                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                                        activePage === page.id
                                            ? 'border-amber-200 bg-amber-50 text-amber-900'
                                            : pageCompletionMap[page.id]
                                              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                                              : 'border-transparent text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-semibold">{page.label}</span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                                                pageCompletionMap[page.id]
                                                    ? 'bg-white/80 text-emerald-700'
                                                    : visitedPages.includes(page.id)
                                                      ? 'bg-white/80 text-amber-700'
                                                      : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {pageCompletionMap[page.id] ? 'Lista' : visitedPages.includes(page.id) ? 'Vista' : 'Nueva'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <section className="space-y-6">
                        {isPageVisible(1) && (
                            <article
                                className="wb10-print-page wb10-cover-page overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 8"
                                data-print-title="Portada e identificación"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb10-cover-hero relative min-h-[56vh] overflow-hidden bg-[radial-gradient(circle_at_top,#fff8eb_0%,#f7efe1_35%,#edf4fb_100%)] px-6 py-12 md:min-h-[62vh]">
                                    <div className="absolute left-[-10%] top-16 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl" />
                                    <div className="absolute bottom-8 right-[-8%] h-44 w-44 rounded-full bg-sky-200/35 blur-3xl" />
                                    <div className="relative flex min-h-[56vh] items-center justify-center">
                                        <div className="max-w-3xl text-center">
                                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/70 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                                                <Image src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" width={64} height={64} className="h-16 w-16" />
                                            </div>

                                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-800">
                                                <Sparkles size={14} />
                                                {PILLAR_LABEL}
                                            </div>

                                            <h1 className="mt-5 text-3xl font-extrabold leading-[1.05] tracking-tight text-slate-900 md:text-5xl">
                                                {WORKBOOK_TITLE}
                                            </h1>

                                            <div className="mt-4 space-y-1">
                                                <p className="text-sm font-semibold text-amber-800">{WORKBOOK_NUMBER}</p>
                                                <p className="text-sm font-semibold text-slate-600">{SYSTEM_LABEL}</p>
                                                <p className="text-sm font-semibold text-slate-600">{PILLAR_LABEL}</p>
                                            </div>

                                            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Cuadernillo de trabajo digital para diseñar una visión estratégica personal a 3 años con más coherencia,
                                                sostenibilidad, impacto y capacidad de trascendencia.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 p-4 sm:p-6 md:p-8">
                                    <h2 className="text-xl font-extrabold text-slate-900 md:text-2xl">Datos de identificación</h2>

                                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <TextInputField
                                            label="Nombre del líder"
                                            value={state.identification.leaderName}
                                            onChange={(value) => updateIdentification('leaderName', value)}
                                            placeholder="Ej: Andrea Restrepo"
                                            disabled={isLocked}
                                        />
                                        <TextInputField
                                            label="Rol actual"
                                            value={state.identification.role}
                                            onChange={(value) => updateIdentification('role', value)}
                                            placeholder="Ej: CEO / VP / Director(a)"
                                            disabled={isLocked}
                                        />
                                        <TextInputField
                                            label="Cohorte / organización"
                                            value={state.identification.cohort}
                                            onChange={(value) => updateIdentification('cohort', value)}
                                            placeholder="Ej: Cohorte Ejecutiva 2026"
                                            disabled={isLocked}
                                        />
                                        <TextInputField
                                            label="Fecha de inicio"
                                            value={state.identification.startDate}
                                            onChange={(value) => updateIdentification('startDate', value)}
                                            type="date"
                                            disabled={isLocked}
                                        />
                                    </div>

                                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                                        <p className="text-sm leading-relaxed text-amber-900">
                                            Esta portada respeta la instrucción base: logo 4Shine, título del workbook, número y pilar desde el primer ingreso.
                                        </p>
                                    </div>

                                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => savePage(1)}
                                            disabled={isLocked || !isHydrated}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Guardar datos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                savePage(1)
                                                jumpToPage(2)
                                            }}
                                            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                                        >
                                            Continuar a presentación
                                        </button>
                                    </div>
                                </div>
                            </article>
                        )}

                        {isPageVisible(2) && (
                            <article
                                className="wb10-print-page rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] sm:p-6 md:p-8"
                                data-print-page="Página 2 de 8"
                                data-print-title="Presentación del workbook"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 2</p>
                                    <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">
                                        Presentación del workbook
                                    </h2>
                                    <p className="max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">{PRESENTATION_OBJECTIVE}</p>
                                </header>

                                <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                                    <section className="space-y-6">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
                                            <h3 className="text-lg font-bold text-slate-900">Qué vas a lograr en este workbook</h3>
                                            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
                                                {WORKBOOK_OUTCOMES.map((item) => (
                                                    <li key={item} className="flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                                            <h3 className="text-lg font-bold text-slate-900">Componentes trabajados en este workbook</h3>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {WORKBOOK_COMPONENTS.map((item) => (
                                                    <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-6">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                                            <h3 className="text-lg font-bold text-slate-900">Competencias 4Shine que vas a activar</h3>
                                            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
                                                {WORKBOOK_COMPETENCIES.map((item) => (
                                                    <li key={item} className="flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-700" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-6">
                                            <h3 className="text-lg font-bold text-slate-900">Reglas de oro para el líder en este WB10</h3>
                                            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
                                                {GOLDEN_RULES.map((item) => (
                                                    <li key={item} className="flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-700" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </section>
                                </div>
                            </article>
                        )}

                        {isPageVisible(3) && (
                            <article
                                className="wb10-print-page space-y-8 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] sm:p-6 md:p-8"
                                data-print-page="Página 3 de 8"
                                data-print-title="Visión a 3 años"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 3</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">Visión a 3 años</h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Construir una visión a 3 años clara, inspiradora y estratégicamente aterrizada, para orientar decisiones
                                                presentes hacia un futuro con más coherencia, sostenibilidad, impacto y capacidad de trascendencia.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveHelpModal('vision')}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <SectionContextCard concepts={VISION_CONCEPTS} />

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Foto de futuro</h3>
                                            <p className="mt-2 text-sm text-slate-600">Describe con precisión cómo se ve tu vida y tu liderazgo dentro de 3 años.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${futurePhotoComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {futurePhotoComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <TextareaField
                                            label="En 3 años, profesionalmente soy / hago esto"
                                            value={state.vision3Years.futurePhoto.professionalState}
                                            onChange={(value) => updateFuturePhoto('professionalState', value)}
                                            placeholder="Qué rol, posición o plataforma habrás construido."
                                            disabled={isLocked}
                                        />
                                        <TextareaField
                                            label="El impacto que produzco se ve así"
                                            value={state.vision3Years.futurePhoto.visibleImpact}
                                            onChange={(value) => updateFuturePhoto('visibleImpact', value)}
                                            placeholder="Qué cambio visible produces en personas, equipos u organizaciones."
                                            disabled={isLocked}
                                        />
                                        <TextareaField
                                            label="Mi forma de vivir y trabajar se ve así"
                                            value={state.vision3Years.futurePhoto.lifestyle}
                                            onChange={(value) => updateFuturePhoto('lifestyle', value)}
                                            placeholder="Cómo cambia tu forma de vivir, trabajar y sostenerte."
                                            disabled={isLocked}
                                        />
                                        <TextareaField
                                            label="Lo que ya no depende solo de mí es"
                                            value={state.vision3Years.futurePhoto.lessDependentOnMe}
                                            onChange={(value) => updateFuturePhoto('lessDependentOnMe', value)}
                                            placeholder="Qué deja de depender exclusivamente de tu presencia directa."
                                            disabled={isLocked}
                                        />
                                    </div>

                                    <TextareaField
                                        label="La huella que empieza a ser visible es"
                                        value={state.vision3Years.futurePhoto.visibleFootprint}
                                        onChange={(value) => updateFuturePhoto('visibleFootprint', value)}
                                        placeholder="Qué legado o huella empieza a verse con claridad."
                                        disabled={isLocked}
                                    />

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVisionBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 1
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Matriz visión-sistema-legado</h3>
                                            <p className="mt-2 text-sm text-slate-600">Aterriza la visión en sistema, multiplicadores, riesgo y legado.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${systemMatrixComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {systemMatrixComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[860px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dimensión</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tu respuesta</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.vision3Years.systemMatrix.map((row, index) => (
                                                    <tr key={row.label} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.label}</td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.response}
                                                                onChange={(event) => updateVisionMatrixRow(index, event.target.value)}
                                                                placeholder="Describe con claridad esta dimensión de tu visión."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
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
                                            onClick={() => saveVisionBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 2
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Mapa integral de vida</h3>
                                            <p className="mt-2 text-sm text-slate-600">Completa la visión a 3 años por cada área clave y observa la rueda resultante.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lifeMapComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {lifeMapComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        {state.vision3Years.lifeMap.map((row, index) => (
                                            <div key={row.area} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <p className="text-sm font-bold text-slate-900">{row.area}</p>
                                                <textarea
                                                    value={row.vision}
                                                    onChange={(event) => updateVisionLifeMapRow(index, event.target.value)}
                                                    placeholder="Cómo se verá esta área en 3 años."
                                                    disabled={isLocked}
                                                    rows={5}
                                                    className={`${TEXTAREA_CLASS} mt-3`}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-sm font-semibold text-slate-900">Lectura visual de integración</p>
                                            <p className="mt-2 text-sm text-slate-600">
                                                La rueda se construye según el nivel de definición de cada área: cuanto más concreta y desarrollada es la visión,
                                                más lejos llega la señal en el gráfico.
                                            </p>
                                            <div className="mt-4 grid gap-2 md:grid-cols-2">
                                                {visionLifeAxes.map((axis) => (
                                                    <div key={axis.area} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                                        <span className="font-semibold text-slate-900">{axis.area}:</span> {axis.score.toFixed(1)}/10
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                            <svg viewBox={`0 0 ${lifeWheelSize} ${lifeWheelSize}`} className="mx-auto h-auto w-full max-w-[340px]" role="img" aria-label="Rueda de visión integral">
                                                <defs>
                                                    <linearGradient id="wb10-vision-wheel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.42" />
                                                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.24" />
                                                    </linearGradient>
                                                </defs>
                                                {lifeWheelLevels.map((level) => (
                                                    <circle
                                                        key={`wb10-vision-wheel-level-${level}`}
                                                        cx={lifeWheelCenter}
                                                        cy={lifeWheelCenter}
                                                        r={(level / 10) * lifeWheelRadius}
                                                        fill="none"
                                                        stroke="#e2e8f0"
                                                        strokeWidth={1}
                                                    />
                                                ))}
                                                {visionLifeAxes.map((axis) => (
                                                    <line
                                                        key={`wb10-vision-wheel-axis-${axis.area}`}
                                                        x1={lifeWheelCenter}
                                                        y1={lifeWheelCenter}
                                                        x2={axis.outerX}
                                                        y2={axis.outerY}
                                                        stroke="#cbd5e1"
                                                        strokeWidth={1}
                                                    />
                                                ))}
                                                <polygon points={visionLifePolygonPoints} fill="url(#wb10-vision-wheel-gradient)" stroke="#d97706" strokeWidth={2.5} />
                                                {visionLifeAxes.map((axis) => (
                                                    <g key={`wb10-vision-wheel-point-${axis.area}`}>
                                                        <circle cx={axis.pointX} cy={axis.pointY} r={4.5} fill="#d97706" />
                                                        <text
                                                            x={axis.labelX}
                                                            y={axis.labelY}
                                                            textAnchor={axis.labelX < lifeWheelCenter - 8 ? 'end' : axis.labelX > lifeWheelCenter + 8 ? 'start' : 'middle'}
                                                            dominantBaseline="middle"
                                                            fontSize="11"
                                                            fill="#334155"
                                                        >
                                                            {axis.area}
                                                        </text>
                                                    </g>
                                                ))}
                                                <circle cx={lifeWheelCenter} cy={lifeWheelCenter} r={4} fill="#0f172a" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVisionBlock('Bloque 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 3
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Mapa de brechas</h3>
                                            <p className="mt-2 text-sm text-slate-600">Haz explícita la distancia entre el presente y la visión que quieres construir.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${gapMapComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {gapMapComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1180px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dimensión</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Estado actual</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Visión a 3 años</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Brecha principal</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Cambio sistémico requerido</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.vision3Years.gapMap.map((row, index) => (
                                                    <tr key={`vision-gap-row-${index}`} className="border-t border-slate-200">
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.dimension} onChange={(event) => updateVisionGapRow(index, 'dimension', event.target.value)} placeholder="Ej. Trabajo / profesional" disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.currentState} onChange={(event) => updateVisionGapRow(index, 'currentState', event.target.value)} placeholder="Dónde estás hoy." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.futureState} onChange={(event) => updateVisionGapRow(index, 'futureState', event.target.value)} placeholder="Dónde quieres estar en 3 años." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.mainGap} onChange={(event) => updateVisionGapRow(index, 'mainGap', event.target.value)} placeholder="Qué diferencia clave existe." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.systemicChange} onChange={(event) => updateVisionGapRow(index, 'systemicChange', event.target.value)} placeholder="Qué cambio de sistema exige esa brecha." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVisionBlock('Bloque 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 4
                                        </button>
                                    </div>
                                </section>

                                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 5 — Declaración de visión estratégica</h3>
                                                <p className="mt-2 text-sm text-slate-600">Convierte todo el análisis en una formulación clara y sintetizable.</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${state.vision3Years.statement.trim().length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {state.vision3Years.statement.trim().length > 0 ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <TextareaField
                                            label='Mi visión estratégica personal a 3 años es'
                                            value={state.vision3Years.statement}
                                            onChange={updateVisionStatement}
                                            placeholder='Empieza con: "En 3 años, habré construido..."'
                                            disabled={isLocked}
                                            rows={7}
                                        />

                                        {showVisionWorkOnlySuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Integra también bienestar, relaciones, finanzas e impacto; la visión no debería quedar centrada solo en trabajo.
                                            </div>
                                        )}
                                        {showVisionLegacySuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Haz visible qué huella quieres dejar más allá del cargo.
                                            </div>
                                        )}
                                        {showVisionSystemSuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Aclara qué estructura o capacidades sostendrán esa visión.
                                            </div>
                                        )}
                                        {showVisionVagueSuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Nombra con más precisión qué habrás construido y qué ya no dependerá solo de ti.
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveVisionBlock('Bloque 5')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 5
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 6 — Test de calidad de la visión</h3>
                                                <p className="mt-2 text-sm text-slate-600">Verifica si la visión ya es estratégica o si sigue siendo solo deseo.</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${visionChecksComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {visionChecksComplete ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <CheckTable
                                            rows={state.vision3Years.qualityChecks}
                                            disabled={isLocked}
                                            onVerdictChange={(index, value) => updateVisionCheckRow(index, 'verdict', value)}
                                            onAdjustmentChange={(index, value) => updateVisionCheckRow(index, 'adjustment', value)}
                                        />

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveVisionBlock('Bloque 6')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 6
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <ClosureCard items={VISION_CLOSURE} />
                            </article>
                        )}

                        {isPageVisible(4) && (
                            <article
                                className="wb10-print-page space-y-8 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] sm:p-6 md:p-8"
                                data-print-page="Página 4 de 8"
                                data-print-title="Objetivos por área de vida"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 4</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">Objetivos por área de vida</h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Traducir tu visión a 3 años en objetivos concretos por área de vida para que tu crecimiento avance como un
                                                sistema equilibrado, sostenible y coherente con tu legado.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveHelpModal('areaGoals')}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <SectionContextCard concepts={AREA_GOALS_CONCEPTS} />

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Priorización de áreas</h3>
                                            <p className="mt-2 text-sm text-slate-600">Calibra importancia, estado actual y urgencia de intervención por cada área de vida.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${areaPrioritizationComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {areaPrioritizationComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[980px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Área de vida</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Importancia estratégica</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Estado actual</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Urgencia</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lectura breve</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.areaGoals.prioritization.map((row, index) => (
                                                    <tr key={row.area} className="border-t border-slate-200 align-top">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.area}</td>
                                                        <td className="px-4 py-3">
                                                            <select value={row.importance} onChange={(event) => updateAreaPrioritizationRow(index, 'importance', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona</option>
                                                                <option value="1">1</option>
                                                                <option value="2">2</option>
                                                                <option value="3">3</option>
                                                                <option value="4">4</option>
                                                                <option value="5">5</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select value={row.currentState} onChange={(event) => updateAreaPrioritizationRow(index, 'currentState', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona</option>
                                                                <option value="1">1</option>
                                                                <option value="2">2</option>
                                                                <option value="3">3</option>
                                                                <option value="4">4</option>
                                                                <option value="5">5</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select value={row.urgency} onChange={(event) => updateAreaPrioritizationRow(index, 'urgency', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona</option>
                                                                <option value="1">1</option>
                                                                <option value="2">2</option>
                                                                <option value="3">3</option>
                                                                <option value="4">4</option>
                                                                <option value="5">5</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-700">{row.reading || 'Se completará automáticamente al definir las tres escalas.'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {showAreaEqualPrioritySuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Diferencia mejor qué áreas hoy requieren más atención estratégica.
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveAreaGoalsBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 1
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Matriz área-visión-objetivo</h3>
                                            <p className="mt-2 text-sm text-slate-600">Convierte la visión por área en objetivos claros, tipo de objetivo y resultado visible.</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={assistAreaObjectiveMatrix}
                                                disabled={isLocked}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                            >
                                                Asistente IA
                                            </button>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${areaObjectiveMatrixComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {areaObjectiveMatrixComplete ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1180px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Área</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Visión a 3 años</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Objetivo estratégico</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tipo</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Resultado visible esperado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.areaGoals.objectiveMatrix.map((row, index) => (
                                                    <tr key={`area-objective-row-${row.area}-${index}`} className="border-t border-slate-200 align-top">
                                                        <td className="px-3 py-3">
                                                            <select value={row.area} onChange={(event) => updateAreaObjectiveRow(index, 'area', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                {AREA_LABELS.map((area) => (
                                                                    <option key={`objective-area-${area}`} value={area}>
                                                                        {area}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.vision} onChange={(event) => updateAreaObjectiveRow(index, 'vision', event.target.value)} placeholder="Cómo se ve esta área en la visión a 3 años." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.objective} onChange={(event) => updateAreaObjectiveRow(index, 'objective', event.target.value)} placeholder="Qué objetivo estratégico resume esta área." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select value={row.goalType} onChange={(event) => updateAreaObjectiveRow(index, 'goalType', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona tipo</option>
                                                                {OBJECTIVE_TYPE_OPTIONS.map((option) => (
                                                                    <option key={`goal-type-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.visibleResult} onChange={(event) => updateAreaObjectiveRow(index, 'visibleResult', event.target.value)} placeholder="Qué señal visible confirmaría avance." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveAreaGoalsBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 2
                                        </button>
                                    </div>
                                </section>

                                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Clasificación de objetivos</h3>
                                                <p className="mt-2 text-sm text-slate-600">Introduce jerarquía: sostener, expandir o trascender.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={assistObjectiveClassifications}
                                                disabled={isLocked}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                            >
                                                Asistente IA
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-[920px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Objetivo</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Función principal</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Por qué cumple esa función</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {state.areaGoals.classifications.map((row, index) => (
                                                        <tr key={`objective-classification-${index}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3">
                                                                <textarea value={row.objective} onChange={(event) => updateObjectiveClassificationRow(index, 'objective', event.target.value)} placeholder="Objetivo a clasificar." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <select value={row.mainFunction} onChange={(event) => updateObjectiveClassificationRow(index, 'mainFunction', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                    <option value="">Selecciona función</option>
                                                                    {GOAL_FUNCTION_OPTIONS.map((option) => (
                                                                        <option key={`goal-function-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <textarea value={row.why} onChange={(event) => updateObjectiveClassificationRow(index, 'why', event.target.value)} placeholder="Por qué este objetivo cumple esa función." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveAreaGoalsBlock('Bloque 3')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 3
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Mapa de interdependencias</h3>
                                                <p className="mt-2 text-sm text-slate-600">Detecta qué área empuja, cuál limita y qué combinación genera más coherencia.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={assistInterdependencies}
                                                disabled={isLocked}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                            >
                                                Asistente IA
                                            </button>
                                        </div>

                                        <div className="grid gap-4">
                                            <TextareaField
                                                label="El área que más impulsa a las demás es"
                                                value={state.areaGoals.interdependencies.driverArea}
                                                onChange={(value) => updateInterdependencies('driverArea', value)}
                                                placeholder="Qué área hoy empuja con más fuerza al resto del sistema."
                                                disabled={isLocked}
                                            />
                                            <TextareaField
                                                label="El área que hoy más limita el sistema es"
                                                value={state.areaGoals.interdependencies.limitingArea}
                                                onChange={(value) => updateInterdependencies('limitingArea', value)}
                                                placeholder="Qué área hoy está frenando el sistema."
                                                disabled={isLocked}
                                            />
                                            <TextareaField
                                                label="El objetivo con mayor efecto multiplicador es"
                                                value={state.areaGoals.interdependencies.multiplierObjective}
                                                onChange={(value) => updateInterdependencies('multiplierObjective', value)}
                                                placeholder="Qué objetivo mueve varias áreas al mismo tiempo."
                                                disabled={isLocked}
                                            />
                                            <TextareaField
                                                label="La combinación de objetivos que más coherencia generaría es"
                                                value={state.areaGoals.interdependencies.coherentCombination}
                                                onChange={(value) => updateInterdependencies('coherentCombination', value)}
                                                placeholder="Qué combinación de objetivos crea más coherencia sistémica."
                                                disabled={isLocked}
                                            />
                                        </div>

                                        {showAreaInterdependencySuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Aclara qué área empuja y cuál limita al resto del sistema.
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveAreaGoalsBlock('Bloque 4')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 4
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 5 — Formulación final de objetivos por área</h3>
                                            <p className="mt-2 text-sm text-slate-600">Redacta cada objetivo con estructura estratégica y lenguaje usable.</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={assistFinalObjectives}
                                                disabled={isLocked}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                            >
                                                Asistente IA
                                            </button>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${finalObjectivesComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {finalObjectivesComplete ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {state.areaGoals.finalObjectives.map((row, index) => (
                                            <TextareaField
                                                key={row.area}
                                                label={row.area}
                                                value={row.statement}
                                                onChange={(value) => updateFinalObjectiveRow(index, value)}
                                                placeholder='Empieza con: "En esta área, mi objetivo estratégico es..."'
                                                disabled={isLocked}
                                            />
                                        ))}
                                    </div>

                                    {showAreaGenericObjectivesSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Haz más visible qué quieres construir en cada área; evita formulaciones demasiado genéricas.
                                        </div>
                                    )}
                                    {showAreaLegacyObjectiveSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Incluye al menos uno o dos objetivos que vayan más allá del crecimiento individual.
                                        </div>
                                    )}

                                    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-sm font-semibold text-slate-900">Rueda del estado actual</p>
                                            <p className="mt-2 text-sm text-slate-600">
                                                Esta lectura visual usa el estado actual reportado en cada área. La importancia y la urgencia quedan como lectura
                                                complementaria en la tabla superior.
                                            </p>
                                            <div className="mt-4 grid gap-2 md:grid-cols-2">
                                                {state.areaGoals.prioritization.map((row) => (
                                                    <div key={`state-score-${row.area}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                                        <span className="font-semibold text-slate-900">{row.area}:</span> {row.currentState || '0'}/5
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                            <svg viewBox={`0 0 ${lifeWheelSize} ${lifeWheelSize}`} className="mx-auto h-auto w-full max-w-[340px]" role="img" aria-label="Rueda de estado actual por área">
                                                <defs>
                                                    <linearGradient id="wb10-goals-wheel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.34" />
                                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.22" />
                                                    </linearGradient>
                                                </defs>
                                                {lifeWheelLevels.map((level) => (
                                                    <circle
                                                        key={`wb10-goals-wheel-level-${level}`}
                                                        cx={lifeWheelCenter}
                                                        cy={lifeWheelCenter}
                                                        r={(level / 10) * lifeWheelRadius}
                                                        fill="none"
                                                        stroke="#e2e8f0"
                                                        strokeWidth={1}
                                                    />
                                                ))}
                                                {areaStateAxes.map((axis) => (
                                                    <line
                                                        key={`wb10-goals-wheel-axis-${axis.area}`}
                                                        x1={lifeWheelCenter}
                                                        y1={lifeWheelCenter}
                                                        x2={axis.outerX}
                                                        y2={axis.outerY}
                                                        stroke="#cbd5e1"
                                                        strokeWidth={1}
                                                    />
                                                ))}
                                                <polygon points={areaStatePolygonPoints} fill="url(#wb10-goals-wheel-gradient)" stroke="#0284c7" strokeWidth={2.5} />
                                                {areaStateAxes.map((axis) => (
                                                    <g key={`wb10-goals-wheel-point-${axis.area}`}>
                                                        <circle cx={axis.pointX} cy={axis.pointY} r={4.5} fill="#0284c7" />
                                                        <text
                                                            x={axis.labelX}
                                                            y={axis.labelY}
                                                            textAnchor={axis.labelX < lifeWheelCenter - 8 ? 'end' : axis.labelX > lifeWheelCenter + 8 ? 'start' : 'middle'}
                                                            dominantBaseline="middle"
                                                            fontSize="11"
                                                            fill="#334155"
                                                        >
                                                            {axis.area}
                                                        </text>
                                                    </g>
                                                ))}
                                                <circle cx={lifeWheelCenter} cy={lifeWheelCenter} r={4} fill="#0f172a" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveAreaGoalsBlock('Bloque 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 5
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 6 — Test de calidad</h3>
                                            <p className="mt-2 text-sm text-slate-600">Verifica si los objetivos ya tienen suficiente claridad, función y equilibrio.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${areaGoalsChecksComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {areaGoalsChecksComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <CheckTable
                                        rows={state.areaGoals.qualityChecks}
                                        disabled={isLocked}
                                        onVerdictChange={(index, value) => updateAreaGoalsCheckRow(index, 'verdict', value)}
                                        onAdjustmentChange={(index, value) => updateAreaGoalsCheckRow(index, 'adjustment', value)}
                                    />

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveAreaGoalsBlock('Bloque 6')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 6
                                        </button>
                                    </div>
                                </section>

                                <ClosureCard items={AREA_GOALS_CLOSURE} />
                            </article>
                        )}

                        {isPageVisible(5) && (
                            <article
                                className="wb10-print-page space-y-8 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] sm:p-6 md:p-8"
                                data-print-page="Página 5 de 8"
                                data-print-title="Prioridades estratégicas"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 5</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">Prioridades estratégicas</h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Definir las prioridades estratégicas que harán viable tu visión a 3 años, concentrando energía y recursos en
                                                los pocos frentes que realmente mueven tu sistema personal, profesional y de legado.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveHelpModal('priorities')}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <SectionContextCard concepts={PRIORITIES_CONCEPTS} />

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Inventario de frentes estratégicos</h3>
                                            <p className="mt-2 text-sm text-slate-600">Haz visible todo lo que hoy compite por tu atención.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${frontsComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {frontsComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {state.priorities.fronts.map((front, index) => (
                                            <TextInputField
                                                key={`priority-front-${index}`}
                                                label={`Frente ${index + 1}`}
                                                value={front}
                                                onChange={(value) => updatePriorityFront(index, value)}
                                                placeholder="Ej. Recuperar salud y energía"
                                                disabled={isLocked}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => savePrioritiesBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 1
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Matriz impacto-urgencia-apalancamiento</h3>
                                            <p className="mt-2 text-sm text-slate-600">Lee qué frentes tienen mayor efecto sistémico y costo de postergación.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${prioritiesMatrixComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {prioritiesMatrixComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1180px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Frente estratégico</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Impacto (1-5)</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Urgencia (1-5)</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Apalancamiento (1-5)</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Costo de postergarlo</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lectura</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.priorities.matrix.map((row, index) => (
                                                    <tr key={`priority-matrix-${index}`} className="border-t border-slate-200 align-top">
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.front} onChange={(event) => updatePriorityMatrixRow(index, 'front', event.target.value)} placeholder="Frente estratégico priorizado." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select value={row.impact} onChange={(event) => updatePriorityMatrixRow(index, 'impact', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona</option>
                                                                <option value="1">1</option>
                                                                <option value="2">2</option>
                                                                <option value="3">3</option>
                                                                <option value="4">4</option>
                                                                <option value="5">5</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select value={row.urgency} onChange={(event) => updatePriorityMatrixRow(index, 'urgency', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona</option>
                                                                <option value="1">1</option>
                                                                <option value="2">2</option>
                                                                <option value="3">3</option>
                                                                <option value="4">4</option>
                                                                <option value="5">5</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select value={row.leverage} onChange={(event) => updatePriorityMatrixRow(index, 'leverage', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona</option>
                                                                <option value="1">1</option>
                                                                <option value="2">2</option>
                                                                <option value="3">3</option>
                                                                <option value="4">4</option>
                                                                <option value="5">5</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.costOfDelay} onChange={(event) => updatePriorityMatrixRow(index, 'costOfDelay', event.target.value)} placeholder="Qué pasa si no se atiende ahora." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-slate-700">{row.reading || 'Se completará automáticamente al definir impacto, urgencia y apalancamiento.'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => savePrioritiesBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 2
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Selección de prioridades maestras</h3>
                                            <p className="mt-2 text-sm text-slate-600">Reduce el plan a 3–5 prioridades maestras con función estratégica explícita.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${masterPrioritiesComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {masterPrioritiesComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1100px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Prioridad maestra</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué frente resume</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué objetivo estratégico sirve</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tipo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.priorities.masterPriorities.map((row, index) => (
                                                    <tr key={`master-priority-${index}`} className="border-t border-slate-200 align-top">
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.priority} onChange={(event) => updateMasterPriorityRow(index, 'priority', event.target.value)} placeholder="Nombre de la prioridad maestra." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select value={row.summarizedFront} onChange={(event) => updateMasterPriorityRow(index, 'summarizedFront', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona frente</option>
                                                                {collectFilled(state.priorities.fronts).map((front) => (
                                                                    <option key={`front-option-${front}`} value={front}>
                                                                        {front}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select value={row.servedObjective} onChange={(event) => updateMasterPriorityRow(index, 'servedObjective', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona objetivo</option>
                                                                {uniqueFilled(state.areaGoals.finalObjectives.map((item) => item.statement)).map((objective) => (
                                                                    <option key={`served-objective-${objective}`} value={objective}>
                                                                        {objective}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select value={row.priorityType} onChange={(event) => updateMasterPriorityRow(index, 'priorityType', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona tipo</option>
                                                                {OBJECTIVE_TYPE_OPTIONS.map((option) => (
                                                                    <option key={`priority-type-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {showPriorityTypeSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Aclara si cada prioridad sostiene, expande o construye legado.
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => savePrioritiesBlock('Bloque 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 3
                                        </button>
                                    </div>
                                </section>

                                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Mapa de secuencia estratégica</h3>
                                                <p className="mt-2 text-sm text-slate-600">Define qué va primero, qué depende de otra cosa y qué conviene postergar.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={assistPrioritySequence}
                                                disabled={isLocked}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                            >
                                                Asistente IA
                                            </button>
                                        </div>

                                        <div className="grid gap-4">
                                            <TextareaField label="La prioridad que debe ir primero es" value={state.priorities.sequence.first} onChange={(value) => updatePrioritySequence('first', value)} placeholder="Qué debe ocurrir primero." disabled={isLocked} />
                                            <TextareaField label="La prioridad que depende de otra es" value={state.priorities.sequence.dependsOn} onChange={(value) => updatePrioritySequence('dependsOn', value)} placeholder="Qué prioridad depende de una condición previa." disabled={isLocked} />
                                            <TextareaField label="La prioridad que puede avanzar en paralelo es" value={state.priorities.sequence.parallel} onChange={(value) => updatePrioritySequence('parallel', value)} placeholder="Qué frente puede avanzar sin interferir con otro." disabled={isLocked} />
                                            <TextareaField label="La prioridad que debo postergar si compite es" value={state.priorities.sequence.postpone} onChange={(value) => updatePrioritySequence('postpone', value)} placeholder="Qué conviene postergar si compite con lo más crítico." disabled={isLocked} />
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-sm font-semibold text-slate-900">Secuencia estratégica sugerida</p>
                                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">{state.priorities.sequence.first || 'Primero'}</span>
                                                <span>→</span>
                                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">{state.priorities.sequence.dependsOn || 'Dependencia'}</span>
                                                <span>||</span>
                                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">{state.priorities.sequence.parallel || 'Paralelo'}</span>
                                            </div>
                                        </div>

                                        {showPrioritySequenceSuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Define qué debe ocurrir primero para no sabotear el sistema.
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => savePrioritiesBlock('Bloque 4')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 4
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 5 — Matriz de renuncias y no-prioridades</h3>
                                                <p className="mt-2 text-sm text-slate-600">Haz explícito qué debes soltar o reducir para sostener foco real.</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${renunciationsComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {renunciationsComplete ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-[920px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué debo soltar o reducir</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Por qué compite con mis prioridades</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué haré distinto</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {state.priorities.renunciations.map((row, index) => (
                                                        <tr key={`renunciation-${index}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3">
                                                                <textarea value={row.release} onChange={(event) => updateRenunciationRow(index, 'release', event.target.value)} placeholder="Qué foco, hábito o actividad debes soltar." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <textarea value={row.whyCompetes} onChange={(event) => updateRenunciationRow(index, 'whyCompetes', event.target.value)} placeholder="Por qué compite con las prioridades reales." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <textarea value={row.doDifferent} onChange={(event) => updateRenunciationRow(index, 'doDifferent', event.target.value)} placeholder="Qué harás distinto para proteger el foco." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {showPriorityRenunciationSuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Toda prioridad necesita algo que salga del foco.
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => savePrioritiesBlock('Bloque 5')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 5
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 6 — Test de calidad de prioridades</h3>
                                            <p className="mt-2 text-sm text-slate-600">Comprueba si ya elegiste prioridades estratégicas o solo una lista de frentes.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${prioritiesChecksComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {prioritiesChecksComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <CheckTable
                                        rows={state.priorities.qualityChecks}
                                        disabled={isLocked}
                                        onVerdictChange={(index, value) => updatePrioritiesCheckRow(index, 'verdict', value)}
                                        onAdjustmentChange={(index, value) => updatePrioritiesCheckRow(index, 'adjustment', value)}
                                    />

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => savePrioritiesBlock('Bloque 6')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 6
                                        </button>
                                    </div>
                                </section>

                                <ClosureCard items={PRIORITIES_CLOSURE} />
                            </article>
                        )}

                        {isPageVisible(6) && (
                            <article
                                className="wb10-print-page space-y-8 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] sm:p-6 md:p-8"
                                data-print-page="Página 6 de 8"
                                data-print-title="Compromisos de acción inmediata"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 6</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">Compromisos de acción inmediata</h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Convertir las prioridades estratégicas en compromisos verificables para que la visión empiece a producir
                                                tracción visible, responsables claros y primeras evidencias de cambio.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveHelpModal('commitments')}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <SectionContextCard concepts={COMMITMENTS_CONCEPTS} />

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Selección de compromisos críticos</h3>
                                            <p className="mt-2 text-sm text-slate-600">Define entre 5 y 7 compromisos inmediatos para los próximos 30 días.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${commitmentsSelectionComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {commitmentsSelectionComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {state.commitments.commitments.map((commitment, index) => (
                                            <TextInputField
                                                key={`commitment-${index}`}
                                                label={`Compromiso ${index + 1}${index >= 5 ? ' (opcional)' : ''}`}
                                                value={commitment}
                                                onChange={(value) => updateCommitmentField(index, value)}
                                                placeholder="Ej. Delegar dos decisiones clave"
                                                disabled={isLocked}
                                            />
                                        ))}
                                    </div>

                                    {showCommitmentVolumeSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Reduce a los pocos compromisos que realmente destraban el sistema.
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveCommitmentsBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 1
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Matriz compromiso-prioridad-tracción</h3>
                                            <p className="mt-2 text-sm text-slate-600">Conecta cada compromiso con la prioridad que sirve, su tipo y la tracción esperada.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${commitmentTractionComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {commitmentTractionComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1100px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Compromiso inmediato</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Prioridad estratégica que sirve</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tipo</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tracción visible esperada</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Riesgo si no se ejecuta</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.commitments.tractionMatrix.map((row, index) => (
                                                    <tr key={`commitment-traction-${index}`} className="border-t border-slate-200 align-top">
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.commitment} onChange={(event) => updateCommitmentTractionRow(index, 'commitment', event.target.value)} placeholder="Compromiso crítico." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select value={row.servedPriority} onChange={(event) => updateCommitmentTractionRow(index, 'servedPriority', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona prioridad</option>
                                                                {buildDerivedPriorities(state).map((priority) => (
                                                                    <option key={`served-priority-${priority}`} value={priority}>
                                                                        {priority}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select value={row.commitmentType} onChange={(event) => updateCommitmentTractionRow(index, 'commitmentType', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona tipo</option>
                                                                {OBJECTIVE_TYPE_OPTIONS.map((option) => (
                                                                    <option key={`commitment-type-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.visibleTraction} onChange={(event) => updateCommitmentTractionRow(index, 'visibleTraction', event.target.value)} placeholder="Qué señal visible dejará este compromiso." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.risk} onChange={(event) => updateCommitmentTractionRow(index, 'risk', event.target.value)} placeholder="Qué riesgo aparece si no lo ejecutas." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveCommitmentsBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 2
                                        </button>
                                    </div>
                                </section>

                                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Diseño de compromisos impecables</h3>
                                                <p className="mt-2 text-sm text-slate-600">Baja cada compromiso a acción exacta, plazo, evidencia y soporte.</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${commitmentDesignComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {commitmentDesignComplete ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-[980px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Compromiso</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué haré exactamente</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Cuándo / plazo</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Evidencia de cumplimiento</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Aliado / testigo / soporte</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {state.commitments.designRows.map((row, index) => (
                                                        <tr key={`commitment-design-${index}`} className="border-t border-slate-200 align-top">
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.commitment} onChange={(event) => updateCommitmentDesignRow(index, 'commitment', event.target.value)} placeholder="Compromiso priorizado." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.exactAction} onChange={(event) => updateCommitmentDesignRow(index, 'exactAction', event.target.value)} placeholder="Qué harás exactamente." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.timing} onChange={(event) => updateCommitmentDesignRow(index, 'timing', event.target.value)} placeholder="Cuándo, frecuencia o plazo." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.evidence} onChange={(event) => updateCommitmentDesignRow(index, 'evidence', event.target.value)} placeholder="Qué evidencia confirmará cumplimiento." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.support} onChange={(event) => updateCommitmentDesignRow(index, 'support', event.target.value)} placeholder="Quién acompañará o sabrá del compromiso." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {showCommitmentTimingSuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Aclara cuándo ocurrirá cada compromiso.
                                            </div>
                                        )}
                                        {showCommitmentEvidenceSuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Define cómo sabrás si el compromiso se cumplió.
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveCommitmentsBlock('Bloque 3')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 3
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Mapa de obstáculos y contingencias</h3>
                                                <p className="mt-2 text-sm text-slate-600">Evita que el plan se rompa al primer choque con la realidad.</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${commitmentObstaclesComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {commitmentObstaclesComplete ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-[920px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Compromiso</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Obstáculo probable</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Señal temprana de desvío</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Plan de contingencia</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Decisión mínima de protección</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {state.commitments.obstacles.map((row, index) => (
                                                        <tr key={`commitment-obstacle-${index}`} className="border-t border-slate-200 align-top">
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.commitment} onChange={(event) => updateCommitmentObstacleRow(index, 'commitment', event.target.value)} placeholder="Compromiso vulnerable." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.obstacle} onChange={(event) => updateCommitmentObstacleRow(index, 'obstacle', event.target.value)} placeholder="Obstáculo más probable." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.earlySignal} onChange={(event) => updateCommitmentObstacleRow(index, 'earlySignal', event.target.value)} placeholder="Qué señal te avisará que te estás desviando." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.contingency} onChange={(event) => updateCommitmentObstacleRow(index, 'contingency', event.target.value)} placeholder="Qué harás si aparece el obstáculo." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.minimumProtection} onChange={(event) => updateCommitmentObstacleRow(index, 'minimumProtection', event.target.value)} placeholder="Cuál es la decisión mínima para no romper el compromiso." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {showCommitmentContingencySuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Prevê qué harás cuando aparezca el obstáculo más probable.
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveCommitmentsBlock('Bloque 4')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 4
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 5 — Compromiso público o de rendición de cuentas</h3>
                                                <p className="mt-2 text-sm text-slate-600">Convierte el compromiso en algo visible y revisable con otras personas.</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${accountabilityComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {accountabilityComplete ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <div className="grid gap-4">
                                            <TextareaField label="El compromiso que voy a declarar explícitamente es" value={state.commitments.accountability.declaredCommitment} onChange={(value) => updateAccountability('declaredCommitment', value)} placeholder="Qué compromiso declararás de forma explícita." disabled={isLocked} />
                                            <TextareaField label="Se lo comunicaré a" value={state.commitments.accountability.audience} onChange={(value) => updateAccountability('audience', value)} placeholder="A quién se lo vas a comunicar." disabled={isLocked} />
                                            <TextareaField label="Lo revisaré con esta frecuencia" value={state.commitments.accountability.reviewFrequency} onChange={(value) => updateAccountability('reviewFrequency', value)} placeholder="Semanal, quincenal, mensual..." disabled={isLocked} />
                                            <TextareaField label="El apoyo que pediré será" value={state.commitments.accountability.supportNeeded} onChange={(value) => updateAccountability('supportNeeded', value)} placeholder="Qué apoyo, feedback o soporte vas a pedir." disabled={isLocked} />
                                            <TextareaField label="El indicador simple que mostraré es" value={state.commitments.accountability.simpleIndicator} onChange={(value) => updateAccountability('simpleIndicator', value)} placeholder="Qué señal simple mostrarás para rendir cuentas." disabled={isLocked} />
                                        </div>

                                        {showCommitmentAccountabilitySuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Agrega una mínima rendición de cuentas para sostener el arranque del plan.
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveCommitmentsBlock('Bloque 5')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 5
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 6 — Test de calidad de compromisos</h3>
                                                <p className="mt-2 text-sm text-slate-600">Comprueba si los compromisos ya son suficientemente operativos para mover el plan.</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${commitmentsChecksComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {commitmentsChecksComplete ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <CheckTable
                                            rows={state.commitments.qualityChecks}
                                            disabled={isLocked}
                                            onVerdictChange={(index, value) => updateCommitmentsCheckRow(index, 'verdict', value)}
                                            onAdjustmentChange={(index, value) => updateCommitmentsCheckRow(index, 'adjustment', value)}
                                        />

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveCommitmentsBlock('Bloque 6')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 6
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <ClosureCard items={COMMITMENTS_CLOSURE} />
                            </article>
                        )}

                        {isPageVisible(7) && (
                            <article
                                className="wb10-print-page space-y-8 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] sm:p-6 md:p-8"
                                data-print-page="Página 7 de 8"
                                data-print-title="Indicadores de avance"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 7</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">Indicadores de avance</h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Definir indicadores que permitan medir si tu visión estratégica personal realmente está tomando forma y si el
                                                crecimiento ya empieza a dejar señales verificables de autonomía, legado y ajuste.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveHelpModal('indicators')}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <SectionContextCard concepts={INDICATORS_CONCEPTS} />

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Selección de dimensiones</h3>
                                            <p className="mt-2 text-sm text-slate-600">Selecciona entre 5 y 8 dimensiones que merecen seguimiento explícito.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${dimensionsComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {dimensionsComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {state.indicators.dimensions.map((dimension, index) => (
                                            <TextInputField
                                                key={`indicator-dimension-${index}`}
                                                label={`Dimensión ${index + 1}${index >= 5 ? ' (opcional)' : ''}`}
                                                value={dimension}
                                                onChange={(value) => updateIndicatorDimension(index, value)}
                                                placeholder="Ej. Delegación y desarrollo de sucesores"
                                                disabled={isLocked}
                                            />
                                        ))}
                                    </div>

                                    {showIndicatorsVolumeSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Reduce a un conjunto más corto y más decisivo.
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveIndicatorsBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 1
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Matriz dimensión-indicador-evidencia</h3>
                                            <p className="mt-2 text-sm text-slate-600">Baja cada dimensión a una señal verificable y una frecuencia de revisión.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={assistIndicatorMatrix}
                                            disabled={isLocked}
                                            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                        >
                                            Asistente IA
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1080px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dimensión</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Indicador propuesto</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué evidencia lo respalda</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Frecuencia de revisión</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.indicators.matrix.map((row, index) => (
                                                    <tr key={`indicator-matrix-${index}`} className="border-t border-slate-200 align-top">
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.dimension} onChange={(event) => updateIndicatorMatrixRow(index, 'dimension', event.target.value)} placeholder="Dimensión a medir." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.indicator} onChange={(event) => updateIndicatorMatrixRow(index, 'indicator', event.target.value)} placeholder="Indicador propuesto." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea value={row.evidence} onChange={(event) => updateIndicatorMatrixRow(index, 'evidence', event.target.value)} placeholder="Qué evidencia verificará este indicador." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select value={row.reviewFrequency} onChange={(event) => updateIndicatorMatrixRow(index, 'reviewFrequency', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                <option value="">Selecciona frecuencia</option>
                                                                {FREQUENCY_OPTIONS.map((option) => (
                                                                    <option key={`review-frequency-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {showIndicatorsEvidenceSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Define cómo se comprobará el avance.
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveIndicatorsBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 2
                                        </button>
                                    </div>
                                </section>

                                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Clasificación de indicadores</h3>
                                                <p className="mt-2 text-sm text-slate-600">Distingue qué indicadores protegen base, expansión o legado.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={assistIndicatorClassification}
                                                disabled={isLocked}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                            >
                                                Asistente IA
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-[920px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Indicador</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tipo</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué protege o impulsa</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {state.indicators.classifications.map((row, index) => (
                                                        <tr key={`indicator-classification-${index}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3">
                                                                <textarea value={row.indicator} onChange={(event) => updateIndicatorClassificationRow(index, 'indicator', event.target.value)} placeholder="Indicador a clasificar." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <select value={row.indicatorType} onChange={(event) => updateIndicatorClassificationRow(index, 'indicatorType', event.target.value)} disabled={isLocked} className={SELECT_CLASS}>
                                                                    <option value="">Selecciona tipo</option>
                                                                    {OBJECTIVE_TYPE_OPTIONS.map((option) => (
                                                                        <option key={`indicator-type-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <textarea value={row.protectsOrDrives} onChange={(event) => updateIndicatorClassificationRow(index, 'protectsOrDrives', event.target.value)} placeholder="Qué protege o impulsa este indicador." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {showIndicatorsActivityOnlySuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Incluye también señales de resultado, autonomía o legado, no solo actividad.
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveIndicatorsBlock('Bloque 3')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 3
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Línea base, meta y umbral</h3>
                                                <p className="mt-2 text-sm text-slate-600">Define punto de partida, metas y el mínimo aceptable por indicador.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={assistIndicatorThresholds}
                                                disabled={isLocked}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                            >
                                                Asistente IA
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-[1080px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Indicador</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Línea base actual</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Meta 30 días</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Meta 90 días</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Umbral mínimo</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Acción correctiva</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {state.indicators.thresholds.map((row, index) => (
                                                        <tr key={`indicator-threshold-${index}`} className="border-t border-slate-200 align-top">
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.indicator} onChange={(event) => updateIndicatorThresholdRow(index, 'indicator', event.target.value)} placeholder="Indicador a parametrizar." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.baseline} onChange={(event) => updateIndicatorThresholdRow(index, 'baseline', event.target.value)} placeholder="Ej. 1/4 o 5%" disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.goal30} onChange={(event) => updateIndicatorThresholdRow(index, 'goal30', event.target.value)} placeholder="Meta a 30 días." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.goal90} onChange={(event) => updateIndicatorThresholdRow(index, 'goal90', event.target.value)} placeholder="Meta a 90 días." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.minimumThreshold} onChange={(event) => updateIndicatorThresholdRow(index, 'minimumThreshold', event.target.value)} placeholder="Mínimo aceptable." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.correctiveAction} onChange={(event) => updateIndicatorThresholdRow(index, 'correctiveAction', event.target.value)} placeholder="Qué harás si cae por debajo." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {showIndicatorsBaselineSuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Aclara desde dónde parte hoy ese indicador.
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveIndicatorsBlock('Bloque 4')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 4
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 5 — Ficha técnica del indicador</h3>
                                                <p className="mt-2 text-sm text-slate-600">Vuelve operativo cada indicador con definición, fórmula, fuente y decisión.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={assistIndicatorCards}
                                                disabled={isLocked}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                            >
                                                Asistente IA
                                            </button>
                                        </div>

                                        <div className="grid gap-4">
                                            {state.indicators.cards.map((row, index) => (
                                                <div key={`indicator-card-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <SelectField
                                                            label="Nombre del indicador"
                                                            value={row.indicator}
                                                            onChange={(value) => updateIndicatorCard(index, 'indicator', value)}
                                                            disabled={isLocked}
                                                            options={buildDerivedIndicators(state)}
                                                            placeholder="Selecciona indicador"
                                                        />
                                                        <TextareaField
                                                            label="Qué mide exactamente"
                                                            value={row.measures}
                                                            onChange={(value) => updateIndicatorCard(index, 'measures', value)}
                                                            placeholder="Qué mide en términos simples."
                                                            disabled={isLocked}
                                                        />
                                                        <TextareaField
                                                            label="Cómo se calcula"
                                                            value={row.formula}
                                                            onChange={(value) => updateIndicatorCard(index, 'formula', value)}
                                                            placeholder="Fórmula o lógica de cálculo."
                                                            disabled={isLocked}
                                                        />
                                                        <TextareaField
                                                            label="Fuente de información"
                                                            value={row.source}
                                                            onChange={(value) => updateIndicatorCard(index, 'source', value)}
                                                            placeholder="Agenda, dashboard, actas, registro personal..."
                                                            disabled={isLocked}
                                                        />
                                                        <TextareaField
                                                            label="Quién lo revisa"
                                                            value={row.owner}
                                                            onChange={(value) => updateIndicatorCard(index, 'owner', value)}
                                                            placeholder="Quién revisa este indicador."
                                                            disabled={isLocked}
                                                        />
                                                        <TextareaField
                                                            label="Qué decisión habilita"
                                                            value={row.decision}
                                                            onChange={(value) => updateIndicatorCard(index, 'decision', value)}
                                                            placeholder="Qué decisión te permite tomar."
                                                            disabled={isLocked}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveIndicatorsBlock('Bloque 5')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 5
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 6 — Tablero mínimo de avance</h3>
                                                <p className="mt-2 text-sm text-slate-600">Reúne indicadores críticos en una vista simple para decidir con rapidez.</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${indicatorsDashboardComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {indicatorsDashboardComplete ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-[1180px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Indicador</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Valor actual</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tendencia</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Meta</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Estado</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lectura rápida</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Decisión</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dashboardRowsComputed.map((row, index) => (
                                                        <tr key={`dashboard-row-${index}`} className="border-t border-slate-200 align-top">
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.indicator} onChange={(event) => updateDashboardRow(index, 'indicator', event.target.value)} placeholder="Indicador a leer." disabled={isLocked} rows={2} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.currentValue} onChange={(event) => updateDashboardRow(index, 'currentValue', event.target.value)} placeholder="Valor actual." disabled={isLocked} rows={2} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3 text-lg font-bold text-slate-900">{row.trend}</td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.goal} onChange={(event) => updateDashboardRow(index, 'goal', event.target.value)} placeholder="Meta visible." disabled={isLocked} rows={2} className={TEXTAREA_CLASS} />
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <span
                                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                                        row.status === 'Verde'
                                                                            ? 'bg-emerald-100 text-emerald-700'
                                                                            : row.status === 'Amarillo'
                                                                              ? 'bg-amber-100 text-amber-700'
                                                                              : row.status === 'Rojo'
                                                                                ? 'bg-rose-100 text-rose-700'
                                                                                : 'bg-slate-100 text-slate-600'
                                                                    }`}
                                                                >
                                                                    {row.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3 text-sm text-slate-700">{row.quickRead}</td>
                                                            <td className="px-3 py-3">
                                                                <textarea value={row.decision} onChange={(event) => updateDashboardRow(index, 'decision', event.target.value)} placeholder="Qué decisión tomarás a partir de esta lectura." disabled={isLocked} rows={2} className={TEXTAREA_CLASS} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {showIndicatorsInstitutionalizationSuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Incluye al menos un indicador que mida institucionalización, delegación o sucesión.
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveIndicatorsBlock('Bloque 6')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 6
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 7 — Test de calidad de indicadores</h3>
                                            <p className="mt-2 text-sm text-slate-600">Comprueba si el tablero ya te ayuda a leer progreso y decidir ajustes.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${indicatorsChecksComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {indicatorsChecksComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <CheckTable
                                        rows={state.indicators.qualityChecks}
                                        disabled={isLocked}
                                        onVerdictChange={(index, value) => updateIndicatorsCheckRow(index, 'verdict', value)}
                                        onAdjustmentChange={(index, value) => updateIndicatorsCheckRow(index, 'adjustment', value)}
                                    />

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveIndicatorsBlock('Bloque 7')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 7
                                        </button>
                                    </div>
                                </section>

                                <ClosureCard items={INDICATORS_CLOSURE} />
                            </article>
                        )}

                        {isPageVisible(8) && (
                            <article
                                className="wb10-print-page space-y-8 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] sm:p-6 md:p-8"
                                data-print-page="Página 8 de 8"
                                data-print-title="One Strategic Page Plan"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 8</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">Plan estratégico personal en una página</h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Sintetizar tu visión estratégica personal en una sola página ejecutiva, integrando horizonte, objetivos,
                                                prioridades, compromisos, indicadores y lógica de legado.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveHelpModal('onePage')}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <SectionContextCard concepts={ONE_PAGE_CONCEPTS} />

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Selección de bloques imprescindibles</h3>
                                            <p className="mt-2 text-sm text-slate-600">Define qué debe entrar sí o sí en tu versión ejecutiva del plan.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${essentialBlocksComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {essentialBlocksComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {state.onePagePlan.essentialBlocks.map((block, index) => (
                                            <TextInputField
                                                key={`essential-block-${index}`}
                                                label={`Bloque ${index + 1}`}
                                                value={block}
                                                onChange={(value) => updateEssentialBlock(index, value)}
                                                placeholder="Nombre del bloque imprescindible"
                                                disabled={isLocked}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveOnePageBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 1
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Matriz de síntesis del plan</h3>
                                            <p className="mt-2 text-sm text-slate-600">Reúne en una sola vista lo que ya trabajaste a lo largo del workbook.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${synthesisComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {synthesisComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[900px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Bloque del plan</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mi síntesis ejecutiva</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.onePagePlan.synthesis.map((row, index) => (
                                                    <tr key={row.block} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.block}</td>
                                                        <td className="px-4 py-3">
                                                            <textarea value={row.summary} onChange={(event) => updateSynthesisRow(index, event.target.value)} placeholder="Resumen ejecutivo de este bloque." disabled={isLocked} rows={3} className={TEXTAREA_CLASS} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveOnePageBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 2
                                        </button>
                                    </div>
                                </section>

                                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Diseño del layout estratégico</h3>
                                                <p className="mt-2 text-sm text-slate-600">Define cómo se verá la página única en sus 6 bloques centrales.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={assistOnePageLayout}
                                                disabled={isLocked}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                            >
                                                Asistente IA
                                            </button>
                                        </div>

                                        <div className="grid gap-4">
                                            <TextareaField label="Bloque 1 — Norte" value={state.onePagePlan.layout.north} onChange={(value) => updateLayout('north', value)} placeholder="Visión a 3 años + frase de legado." disabled={isLocked} />
                                            <TextareaField label="Bloque 2 — Áreas clave" value={state.onePagePlan.layout.keyAreas} onChange={(value) => updateLayout('keyAreas', value)} placeholder="Objetivos por área o grupos clave." disabled={isLocked} />
                                            <TextareaField label="Bloque 3 — Prioridades" value={state.onePagePlan.layout.priorities} onChange={(value) => updateLayout('priorities', value)} placeholder="3 a 5 prioridades maestras." disabled={isLocked} />
                                            <TextareaField label="Bloque 4 — Acción" value={state.onePagePlan.layout.action} onChange={(value) => updateLayout('action', value)} placeholder="Compromisos inmediatos." disabled={isLocked} />
                                            <TextareaField label="Bloque 5 — Medición" value={state.onePagePlan.layout.measurement} onChange={(value) => updateLayout('measurement', value)} placeholder="Indicadores críticos." disabled={isLocked} />
                                            <TextareaField label="Bloque 6 — Revisión" value={state.onePagePlan.layout.review} onChange={(value) => updateLayout('review', value)} placeholder="Frecuencia de revisión y criterio de ajuste." disabled={isLocked} />
                                        </div>

                                        {showOnePageCondenseSuggestion && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                Reduce a formulaciones más ejecutivas y legibles.
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveOnePageBlock('Bloque 3')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 3
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Test de coherencia interna</h3>
                                                <p className="mt-2 text-sm text-slate-600">Comprueba si visión, objetivos, prioridades, acción e indicadores conversan entre sí.</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${onePageCoherenceComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {onePageCoherenceComplete ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <CheckTable
                                            rows={state.onePagePlan.coherenceChecks}
                                            disabled={isLocked}
                                            onVerdictChange={(index, value) => updateOnePageCoherenceRow(index, 'verdict', value)}
                                            onAdjustmentChange={(index, value) => updateOnePageCoherenceRow(index, 'adjustment', value)}
                                        />

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveOnePageBlock('Bloque 4')}
                                                disabled={isLocked}
                                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                Guardar bloque 4
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 5 — Redacción final del One Strategic Page Plan</h3>
                                            <p className="mt-2 text-sm text-slate-600">Redacta el plan final con lenguaje ejecutivo, foco y capacidad de revisión.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={assistFinalOnePagePlan}
                                            disabled={isLocked}
                                            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                        >
                                            Asistente IA
                                        </button>
                                    </div>

                                    <div className="grid gap-4">
                                        <TextareaField label="Mi visión a 3 años" value={state.onePagePlan.finalPlan.vision} onChange={(value) => updateFinalPlan('vision', value)} placeholder="Visión ejecutiva a 3 años." disabled={isLocked} />
                                        <TextareaField label="Mi frase de legado" value={state.onePagePlan.finalPlan.legacyPhrase} onChange={(value) => updateFinalPlan('legacyPhrase', value)} placeholder="Frase breve de legado o trascendencia." disabled={isLocked} />
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Mis objetivos integradores</h4>
                                            {state.onePagePlan.finalPlan.integratedObjectives.map((item, index) => (
                                                <TextInputField key={`final-objective-${index}`} label={`Objetivo ${index + 1}`} value={item} onChange={(value) => updateFinalPlanArray('integratedObjectives', index, value)} placeholder="Objetivo integrador" disabled={isLocked} />
                                            ))}
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Mis prioridades maestras</h4>
                                            {state.onePagePlan.finalPlan.masterPriorities.map((item, index) => (
                                                <TextInputField key={`final-priority-${index}`} label={`Prioridad ${index + 1}`} value={item} onChange={(value) => updateFinalPlanArray('masterPriorities', index, value)} placeholder="Prioridad maestra" disabled={isLocked} />
                                            ))}
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Mis compromisos inmediatos</h4>
                                            {state.onePagePlan.finalPlan.immediateCommitments.map((item, index) => (
                                                <TextInputField key={`final-commitment-${index}`} label={`Compromiso ${index + 1}`} value={item} onChange={(value) => updateFinalPlanArray('immediateCommitments', index, value)} placeholder="Compromiso inmediato" disabled={isLocked} />
                                            ))}
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Mis indicadores críticos</h4>
                                            {state.onePagePlan.finalPlan.criticalIndicators.map((item, index) => (
                                                <TextInputField key={`final-indicator-${index}`} label={`Indicador ${index + 1}`} value={item} onChange={(value) => updateFinalPlanArray('criticalIndicators', index, value)} placeholder="Indicador crítico" disabled={isLocked} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <TextareaField label="Frecuencia de revisión" value={state.onePagePlan.finalPlan.reviewFrequency} onChange={(value) => updateFinalPlan('reviewFrequency', value)} placeholder="Semanal, mensual, por ciclo..." disabled={isLocked} />
                                        <TextareaField label="Criterio de ajuste" value={state.onePagePlan.finalPlan.adjustmentCriteria} onChange={(value) => updateFinalPlan('adjustmentCriteria', value)} placeholder="Qué gatilla un ajuste del plan." disabled={isLocked} />
                                    </div>

                                    {showOnePageLegacySuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Haz visible qué quedará más allá de tu presencia directa.
                                        </div>
                                    )}
                                    {showOnePageReviewSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Define cuándo y cómo revisarás el plan.
                                        </div>
                                    )}

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-sm font-bold text-slate-900">ONE STRATEGIC PAGE PLAN</p>
                                        <div className="mt-4 space-y-3 text-sm text-slate-700">
                                            <p><span className="font-semibold text-slate-900">Visión:</span> {state.onePagePlan.finalPlan.vision || 'Pendiente'}</p>
                                            <p><span className="font-semibold text-slate-900">Legado:</span> {state.onePagePlan.finalPlan.legacyPhrase || 'Pendiente'}</p>
                                            <p><span className="font-semibold text-slate-900">Objetivos:</span> {compactJoin(state.onePagePlan.finalPlan.integratedObjectives, 'Pendiente')}</p>
                                            <p><span className="font-semibold text-slate-900">Prioridades:</span> {compactJoin(state.onePagePlan.finalPlan.masterPriorities, 'Pendiente')}</p>
                                            <p><span className="font-semibold text-slate-900">Compromisos:</span> {compactJoin(state.onePagePlan.finalPlan.immediateCommitments, 'Pendiente')}</p>
                                            <p><span className="font-semibold text-slate-900">Indicadores:</span> {compactJoin(state.onePagePlan.finalPlan.criticalIndicators, 'Pendiente')}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveOnePageBlock('Bloque 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 5
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 6 — Test final del plan</h3>
                                            <p className="mt-2 text-sm text-slate-600">Valida si el plan ya cabe en una página útil, coherente y revisable.</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${onePageFinalChecksComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {onePageFinalChecksComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <CheckTable
                                        rows={state.onePagePlan.finalChecks}
                                        disabled={isLocked}
                                        onVerdictChange={(index, value) => updateOnePageFinalCheckRow(index, 'verdict', value)}
                                        onAdjustmentChange={(index, value) => updateOnePageFinalCheckRow(index, 'adjustment', value)}
                                    />

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveOnePageBlock('Bloque 6')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar bloque 6
                                        </button>
                                    </div>
                                </section>

                                <ClosureCard items={ONE_PAGE_CLOSURE} />
                            </article>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb10-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
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

                        {activeHelpModal && !isExportingAll && <HelpModal helpKey={activeHelpModal} onClose={() => setActiveHelpModal(null)} />}
                    </section>
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    .wb10-toolbar,
                    .wb10-sidebar,
                    .wb10-page-nav {
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

                    .wb10-print-page {
                        break-after: page;
                        page-break-after: always;
                        position: relative;
                        box-shadow: none !important;
                    }

                    .wb10-print-page:not(.wb10-cover-page)::before {
                        content: attr(data-print-page);
                        position: absolute;
                        top: -8mm;
                        right: 0;
                        font-size: 10px;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        color: #b45309;
                        font-weight: 700;
                    }

                    .wb10-print-page::after {
                        content: attr(data-print-meta);
                        position: absolute;
                        bottom: -10mm;
                        left: 0;
                        font-size: 9px;
                        letter-spacing: 0.04em;
                        color: #475569;
                    }

                    .wb10-cover-page {
                        min-height: calc(297mm - 36mm);
                    }

                    .wb10-cover-page::before {
                        content: none !important;
                    }

                    .wb10-cover-hero {
                        min-height: 54vh !important;
                    }
                }
            `}</style>
        </div>
    )
}

function prevFilledAreaObjectives(rows: AreaObjectiveRow[]) {
    return uniqueFilled(rows.map((row) => row.objective))
}
