'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Compass,
    FileText,
    Heart,
    Lock,
    Printer,
    ShieldCheck,
    Sparkles,
    Target,
    Users
} from 'lucide-react'
import {
    AdaptiveWorkbookStepAssistPortals,
    mergeStructuredData
} from '@/components/workbooks-v2/page-assist'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
type YesNoAnswer = '' | 'yes' | 'no'
type RatingValue = '' | '1' | '2' | '3' | '4' | '5'
type MentorLevel = '' | 'N1' | 'N2' | 'N3' | 'N4'
type MentorDecision = '' | 'Consolidado' | 'En desarrollo' | 'Prioritario'
type EvaluationStageKey = 'mentor' | 'leader' | 'synthesis' | 'final'

type WorkbookPage = {
    id: WorkbookPageId
    label: string
    shortLabel: string
}

type PurposeMatrixRow = {
    dimension: string
    response: string
}

type CoherenceCheckRow = {
    question: string
    verdict: YesNoAnswer
    adjustment: string
}

type LifeIntegrationRow = {
    area: string
    vision: string
}

type ExecutiveBrandSignalRow = {
    dimension: string
    reading: string
}

type ExecutiveBrandMatrixRow = {
    differentiator: string
    problem: string
    audience: string
    proof: string
    signal: string
}

type ExecutiveBrandCanvas = {
    professionalIdentity: string
    mainProblem: string
    differentiator: string
    transformation: string
    tone: string
    audience: string
    primarySignal: string
}

type BrandStrengthCheckRow = {
    question: string
    verdict: YesNoAnswer
    adjustment: string
}

type BrandValuesMatrixRow = {
    value: string
    meaning: string
    behavior: string
    proof: string
    weakener: string
}

type BrandValuesRankingRow = {
    importance: RatingValue
    evidence: RatingValue
    strategicReading: string
}

type BrandValueNonNegotiableRow = {
    principle: string
    cost: string
}

type BrandValueConsistencyCheckRow = {
    question: string
    verdict: YesNoAnswer
    adjustment: string
}

type LeadershipArchetypeInventoryRow = {
    dimension: string
    reading: string
}

type LeadershipArchetypeChoice = {
    primary: string
    reason: string
    visibleTraits: string
    credibility: string
    secondary: string
}

type LeadershipArchetypeExpressiveRow = {
    dimension: string
    definition: string
}

type LeadershipArchetypeCoherenceCheckRow = {
    question: string
    verdict: YesNoAnswer
    adjustment: string
}

type LinkedInAuditRow = {
    dimension: string
    response: string
}

type LinkedInBannerDesign = {
    mainPhrase: string
    subtitle: string
    visualSignal: string
    reinforces: string
}

type LinkedInAboutRow = {
    block: string
    formulation: string
}

type LinkedInProfileSectionRow = {
    section: string
    communicates: string
    missingToday: string
    priorityAdjustment: string
}

type LinkedInOptimizationCheckRow = {
    question: string
    verdict: YesNoAnswer
    adjustment: string
}

type LinkedInAuditApiResponse = {
    audit?: Array<{
        dimension?: string
        response?: string
    }>
    publicEvidenceStatus?: 'sufficient' | 'partial' | 'insufficient'
    note?: string
    error?: string
}

type SocialCauseLegitimacyRow = {
    possibleCause: string
    storyConnection: RatingValue
    purposeCoherence: RatingValue
    contributionCapacity: RatingValue
    externalCredibility: RatingValue
    footprintPotential: RatingValue
}

type SocialCauseMapRow = {
    element: string
    formulation: string
}

type SocialCauseActivationRow = {
    vehicle: string
    concreteAction: string
    impactedAudience: string
    visibleSignal: string
}

type SocialCauseLegitimacyCheckRow = {
    question: string
    verdict: YesNoAnswer
    adjustment: string
}

type ContentPlanSignal = {
    perception90Days: string
    centralIdea: string
    sustainingTone: string
    avoidProjecting: string
    connectionToBrand: string
}

type ContentPlanPillarRow = {
    pillar: string
    whatToShow: string
    reinforcedPerception: string
}

type ContentPlanMatrixRow = {
    piece: string
    pillar: string
    channel: string
    objective: string
    brandSignal: string
}

type ContentPlanCalendarRow = {
    horizon: string
    stretchObjective: string
    prioritizedContent: string
    mainChannel: string
    expectedResult: string
}

type ContentPlanBacklogRow = {
    piece: string
    pillar: string
    horizon: string
    channelFormat: string
    objective: string
    priority: string
}

type ContentPlanCadence = {
    minimumCadence: string
    channelRhythm: string
    creationBlock: string
    distributionBlock: string
    reviewBlock: string
    learningCriteria: string
}

type ContentPlanCheckRow = {
    question: string
    verdict: YesNoAnswer
    adjustment: string
}

type EvaluationMentorRow = {
    criterion: string
    level: MentorLevel
    evidence: string
    decision: MentorDecision
}

type EvaluationLeaderRow = {
    question: string
    response: string
    evidence: string
    action: string
}

type WB9State = {
    identification: {
        leaderName: string
        role: string
        cohort: string
        startDate: string
    }
    purposeIntegrated: {
        inventory: {
            passion: string
            vocation: string
            mission: string
            expertise: string
            desiredImpact: string
        }
        contributionMatrix: PurposeMatrixRow[]
        integratedPurpose: string
        coherenceChecks: CoherenceCheckRow[]
        lifeIntegration: LifeIntegrationRow[]
    }
    executiveBrand: {
        currentSignals: ExecutiveBrandSignalRow[]
        differentiatorMatrix: ExecutiveBrandMatrixRow[]
        canvas: ExecutiveBrandCanvas
        positioningStatement: string
        strengthChecks: BrandStrengthCheckRow[]
    }
    brandValues: {
        inventory: string[]
        valueMatrix: BrandValuesMatrixRow[]
        coreValues: string[]
        rankings: BrandValuesRankingRow[]
        nonNegotiables: BrandValueNonNegotiableRow[]
        consistencyChecks: BrandValueConsistencyCheckRow[]
    }
    leadershipArchetype: {
        dominantTraits: LeadershipArchetypeInventoryRow[]
        selectedArchetypes: string[]
        centralChoice: LeadershipArchetypeChoice
        expressiveCode: LeadershipArchetypeExpressiveRow[]
        coherenceChecks: LeadershipArchetypeCoherenceCheckRow[]
    }
    linkedInProfile: {
        profileUrl: string
        audit: LinkedInAuditRow[]
        strategicHeadline: string
        banner: LinkedInBannerDesign
        aboutMatrix: LinkedInAboutRow[]
        profileSections: LinkedInProfileSectionRow[]
        optimizationChecks: LinkedInOptimizationCheckRow[]
    }
    socialCause: {
        possibleCauses: string[]
        legitimacyMatrix: SocialCauseLegitimacyRow[]
        strategicCause: string
        causeMap: SocialCauseMapRow[]
        activationVehicles: SocialCauseActivationRow[]
        legitimacyChecks: SocialCauseLegitimacyCheckRow[]
    }
    contentPlan: {
        centralSignal: ContentPlanSignal
        pillars: ContentPlanPillarRow[]
        contentMatrix: ContentPlanMatrixRow[]
        calendar: ContentPlanCalendarRow[]
        backlog: ContentPlanBacklogRow[]
        cadence: ContentPlanCadence
        coherenceChecks: ContentPlanCheckRow[]
    }
    evaluation: {
        mentorRows: EvaluationMentorRow[]
        mentorGeneralNotes: string
        mentorGlobalDecision: MentorDecision
        leaderRows: EvaluationLeaderRow[]
        agreementsSynthesis: string
    }
}

const PAGES: WorkbookPage[] = [
    { id: 1, label: '1. Portada e identificación', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Propósito integrado', shortLabel: 'Propósito integrado' },
    { id: 4, label: '4. Marca ejecutiva', shortLabel: 'Marca ejecutiva' },
    { id: 5, label: '5. Valores de marca', shortLabel: 'Valores de marca' },
    { id: 6, label: '6. Arquetipo de liderazgo', shortLabel: 'Arquetipo' },
    { id: 7, label: '7. Perfil LinkedIn optimizado', shortLabel: 'LinkedIn' },
    { id: 8, label: '8. Causa social estratégica', shortLabel: 'Causa social' },
    { id: 9, label: '9. Plan de contenido 30-60-90 días', shortLabel: '30-60-90' },
    { id: 10, label: '10. Evaluación', shortLabel: 'Evaluación' }
]

const STORAGE_KEY = 'workbooks-v2-wb9-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb9-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb9-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb9-presentation-seen'
const PAGE_ASSIST_STORAGE_KEY = 'workbooks-v2-wb9-page-assist-mode'

const WORKBOOK_TITLE = 'Latido de marca'
const WORKBOOK_NUMBER = 'Workbook 9'
const SYSTEM_LABEL = 'Sistema: 4Shine®'
const PILLAR_LABEL = 'Pilar: Shine Beyond (Legado)'

const WORKBOOK_OUTCOMES = [
    'Un propósito integrado entre identidad, impacto y trayectoria.',
    'Una definición clara de tu marca ejecutiva.',
    'Un set explícito de valores de marca.',
    'Un arquetipo de liderazgo que ordene estilo, tono y percepción.',
    'Un perfil LinkedIn optimizado y coherente con tu posicionamiento.',
    'Una causa social estratégica conectada con tu legado.',
    'Un plan de contenido 30-60-90 días para activar reputación y visibilidad.'
] as const

const WORKBOOK_COMPONENTS = [
    'Legado personal y transcendencia',
    'Liderazgo regenerativo',
    'Impacto social y humano',
    'Desarrollo de otros líderes (mentoring & coaching)'
] as const

const GOLDEN_RULES = [
    'No construyas imagen; construye coherencia.',
    'Tu marca ejecutiva no es lo que dices de ti, sino la huella que otros pueden confirmar.',
    'No confundas visibilidad con exposición vacía.',
    'Si tu propósito no conversa con tu posicionamiento, la marca se fractura.',
    'El legado empieza cuando tu influencia deja de depender solo de tu presencia directa.'
] as const

const PURPOSE_CONCEPTS = [
    'Propósito integrado: articulación coherente entre vocación, experiencia, ambición profesional, contribución social y visión de legado.',
    'Propósito de marca: formulación breve que expresa para qué existes profesionalmente y qué tipo de transformación quieres impulsar.',
    'Coherencia propósito-posicionamiento: alineación entre el propósito que declaras y la forma en que te presentas, decides y te haces visible.',
    'Legado personal y trascendencia: capacidad de dejar una huella duradera que conecte acciones y valores con impacto positivo en otros.',
    'Causa social estratégica: causa que extiende tu marca más allá del logro individual y conecta tu trayectoria con una contribución social concreta.',
    'Promesa de valor con sentido: afirmación de transformación que vincula capacidad profesional con impacto.',
    'Huella deseada: tipo de marca que quieres dejar en personas, organizaciones y entorno.',
    'Tensión propósito-ego: diferencia entre construir una marca para servir y construir una marca solo para validación o visibilidad.',
    'Narrativa de contribución: forma de contar tu trayectoria desde el valor y el impacto, no solo desde cargos o logros.',
    'Integración de vida: articulación entre éxito profesional, relaciones, salud, espiritualidad, contribución y bienestar.'
] as const

const PURPOSE_SECTION_CLOSURE = [
    'Qué te mueve realmente.',
    'Qué transformación quieres facilitar.',
    'Qué huella deseas dejar.',
    'Si tu propósito ya está integrado con tu marca.',
    'Si tu promesa pública conversa de verdad con tu legado.'
] as const

const PURPOSE_INVENTORY_FIELDS = [
    { key: 'passion', label: 'Pasión', icon: Heart, placeholder: 'Qué te mueve de forma genuina.' },
    { key: 'vocation', label: 'Vocación', icon: Compass, placeholder: 'Qué tiendes a despertar o facilitar en otros.' },
    { key: 'mission', label: 'Misión', icon: Target, placeholder: 'Qué transformación quieres impulsar.' },
    { key: 'expertise', label: 'Profesión / expertise', icon: Briefcase, placeholder: 'Qué sabes hacer con credibilidad.' },
    { key: 'desiredImpact', label: 'Impacto deseado', icon: Sparkles, placeholder: 'Qué cambio quieres dejar en personas, organizaciones o sociedad.' }
] as const

type InventoryFieldKey = (typeof PURPOSE_INVENTORY_FIELDS)[number]['key']

const PURPOSE_MATRIX_DEFINITIONS = [
    { label: 'Qué me mueve', icon: Heart },
    { label: 'Qué sé aportar', icon: ShieldCheck },
    { label: 'A quién quiero servir', icon: Users },
    { label: 'Qué transformación quiero generar', icon: Sparkles },
    { label: 'Qué huella quiero dejar', icon: Target }
] as const

const COHERENCE_QUESTIONS = [
    '¿Mi propósito coincide con la huella que hoy dejo?',
    '¿Mi posicionamiento actual lo refleja?',
    '¿Mis decisiones recientes fueron coherentes con él?',
    '¿Mi propósito trasciende el cargo actual?',
    '¿Se conecta con una contribución social o humana?'
] as const

const LIFE_INTEGRATION_AREAS = [
    'Trabajo / profesional',
    'Contribución a la sociedad',
    'Finanzas',
    'Salud y bienestar',
    'Relaciones',
    'Familia / personal',
    'Tiempo libre y energía',
    'Espiritualidad'
] as const

const INVENTORY_EXAMPLE: Record<InventoryFieldKey, string> = {
    passion: 'Resolver problemas complejos, crear, aprender y construir visiones compartidas con impacto real.',
    vocation: 'Guiar, inspirar y cambiar mentalidades.',
    mission: 'Transformar la forma de pensar y ejecutar de líderes y organizaciones para lograr resultados extraordinarios y sostenibles.',
    expertise: 'Ejecutivo experto con visión estratégica y capacidad probada para transformar operaciones y desarrollar equipos.',
    desiredImpact: 'Dejar una huella positiva en la economía, en las personas y en la forma en que las organizaciones crecen.'
}

const PURPOSE_MATRIX_EXAMPLE = [
    'Construir futuro con criterio y humanidad',
    'Claridad estratégica, dirección y capacidad de transformar complejidad en decisiones',
    'Líderes, organizaciones y ecosistemas que buscan crecer con sostenibilidad',
    'Pasar de ejecución reactiva a crecimiento con visión',
    'Negocios que crecen, personas que se desarrollan y una cultura de impacto colectivo'
] as const

const LIFE_INTEGRATION_EXAMPLE = [
    'Liderar organizaciones que quieran crecer con estrategia, talento y visión',
    'Aportar a empresas y personas para que crezcan y generen mejor calidad de vida',
    'Construir seguridad financiera que también me permita ayudar a otros',
    'Mantener vitalidad, claridad mental y menor estrés',
    'Conservar vínculos genuinos y sin apariencias',
    'Sostener armonía y apoyo mutuo',
    'Repartir el tiempo entre bienestar, aprendizaje y experiencias significativas',
    'Recentrarme, pausar y actuar desde mayor conciencia'
] as const

const EXECUTIVE_BRAND_CONCEPTS = [
    'Marca ejecutiva: percepción consistente y estratégica que otros forman sobre tu valor, tu estilo y tu contribución, a partir de resultados, comportamiento, narrativa y presencia.',
    'Posicionamiento ejecutivo: lugar claro que ocupas en la mente de tus stakeholders cuando piensan en tu especialidad, tu forma de liderar y el tipo de problemas que resuelves.',
    'USP (Unique Selling Proposition / propuesta única): formulación breve de aquello que te hace distintivo y difícil de sustituir.',
    'Promesa de valor: afirmación concreta sobre el cambio o resultado que generas.',
    'Diferenciador ejecutivo: rasgo, capacidad o combinación de atributos que te separa de otros perfiles similares y hace más legible tu valor.',
    'Señal de marca: palabra, idea o percepción que quieres dejar instalada de forma repetida y verificable.',
    'Territorio de marca: campo temático y reputacional en el que deseas ser reconocido.',
    'Prueba de marca: evidencia concreta que vuelve creíble tu posicionamiento, como resultados, casos, impacto visible, testimonios o trayectoria.',
    'Tono de marca: forma reconocible en que te comunicas.',
    'Arquitectura de marca ejecutiva: estructura mínima que conecta propósito, USP, promesa de valor, audiencia, atributos y prueba.',
    'Marca inflada: marca con discurso atractivo, pero sin suficiente evidencia ni coherencia conductual.',
    'Marca subnombrada: marca donde sí existe valor, pero no está suficientemente formulado o visible para otros.',
    'Coherencia reputacional: consistencia entre lo que declaras de tu marca y lo que otros pueden confirmar por experiencia directa o indirecta.'
] as const

const EXECUTIVE_BRAND_SECTION_CLOSURE = [
    'Cómo se ve hoy tu marca ejecutiva.',
    'Qué diferenciador la sostiene.',
    'Qué problema resuelves y para quién.',
    'Qué señal quieres dejar instalada.',
    'Si tu posicionamiento ya tiene suficiente claridad, prueba y coherencia.'
] as const

const EXECUTIVE_BRAND_SIGNAL_DIMENSIONS = [
    'Cómo me describen hoy',
    'Valor que suelen asociar conmigo',
    'Problema que creen que sé resolver',
    'Estilo o tono que me reconocen',
    'Atributo dominante actual',
    'Vacío o confusión en mi marca'
] as const

const EXECUTIVE_BRAND_SIGNAL_EXAMPLE = [
    'Como alguien sólido, resolutivo y confiable.',
    'Capacidad de resolver problemas complejos.',
    'Crisis operativas y escenarios de presión.',
    'Sereno, claro y estratégico.',
    'Serenidad bajo presión.',
    'Aún no siempre se ve con claridad mi dimensión de legado y desarrollo de otros.'
] as const

const EXECUTIVE_BRAND_MATRIX_EXAMPLE = [
    {
        differentiator: 'Serenidad bajo presión',
        problem: 'Equipos y negocios en entornos de alta tensión',
        audience: 'Presidentes, gerentes generales y comités directivos',
        proof: 'Experiencia en negociaciones críticas y continuidad operativa',
        signal: 'Calma con criterio'
    },
    {
        differentiator: 'Coraje operacional con visión estratégica',
        problem: 'Organizaciones que ejecutan, pero no anticipan',
        audience: 'VPs de operaciones, supply chain, innovación y estrategia',
        proof: 'Recuperación de millones y lectura de tendencias',
        signal: 'Estrategia con ejecución'
    },
    {
        differentiator: 'Liderazgo humano con foco en legado',
        problem: 'Organizaciones que quieren crecer sin deshumanizarse',
        audience: 'Alta dirección y equipos de escalamiento',
        proof: 'Desarrollo de equipos y narrativa de impacto colectivo',
        signal: 'Resultados con huella'
    }
] as const

const EXECUTIVE_BRAND_CANVAS_FIELDS = [
    {
        key: 'professionalIdentity',
        label: 'Quién soy profesionalmente',
        icon: Briefcase,
        placeholder: 'Describe tu identidad profesional sin depender solo del cargo.'
    },
    {
        key: 'mainProblem',
        label: 'Qué problema principal ayudo a resolver',
        icon: Target,
        placeholder: 'Qué problema principal ayudas a resolver.'
    },
    {
        key: 'differentiator',
        label: 'Qué me hace diferente',
        icon: Sparkles,
        placeholder: 'Cuál es tu diferenciador más visible y difícil de sustituir.'
    },
    {
        key: 'transformation',
        label: 'Qué transformación genero',
        icon: ShieldCheck,
        placeholder: 'Qué cambio o resultado concreto generas.'
    },
    {
        key: 'tone',
        label: 'Qué tono o estilo define mi marca',
        icon: Compass,
        placeholder: 'Cómo se siente tu forma de comunicar y liderar.'
    },
    {
        key: 'audience',
        label: 'Qué audiencia quiero atraer o impactar',
        icon: Users,
        placeholder: 'Para quién importa tu marca.'
    },
    {
        key: 'primarySignal',
        label: 'Qué señal principal quiero instalar',
        icon: Heart,
        placeholder: 'Qué idea quieres dejar instalada de forma repetida y verificable.'
    }
] as const

type ExecutiveBrandCanvasFieldKey = (typeof EXECUTIVE_BRAND_CANVAS_FIELDS)[number]['key']

const EXECUTIVE_BRAND_CANVAS_EXAMPLE: Record<ExecutiveBrandCanvasFieldKey, string> = {
    professionalIdentity: 'Soy un líder que convierte ejecución compleja en dirección estratégica.',
    mainProblem: 'Resuelvo problemas de competitividad, foco y sostenibilidad en contextos complejos.',
    differentiator: 'Combino serenidad bajo presión, lectura estratégica y capacidad real de implementación.',
    transformation: 'Transformo la operación en ventaja competitiva con impacto sostenible.',
    tone: 'Estratégico, reflexivo, humano; sereno, firme, claro y confiable.',
    audience: 'Presidentes, gerentes generales, comités directivos y líderes de operaciones, innovación y estrategia.',
    primarySignal: 'Estrategia con serenidad para construir futuro.'
}

const EXECUTIVE_BRAND_STRENGTH_QUESTIONS = [
    '¿Mi marca se entiende en una frase?',
    '¿Está sostenida por evidencia?',
    '¿Tiene un diferenciador claro?',
    '¿Mi tono de marca es reconocible?',
    '¿Mi marca conversa con mi propósito?',
    '¿Puede sostener reputación y visibilidad?'
] as const

const BRAND_VALUES_CONCEPTS = [
    'Valores de marca: principios rectores que orientan cómo actúas, decides, te relacionas y proyectas tu liderazgo.',
    'Integración ética en decisiones: coherencia entre los valores declarados y las decisiones reales del líder, especialmente bajo presión.',
    'Coherencia reputacional: alineación entre lo que afirmas representar y lo que otros pueden observar en tu comportamiento y trayectoria.',
    'Valor aspiracional: valor que te gustaría encarnar, pero que aún no tiene suficiente evidencia conductual.',
    'Valor probado: valor respaldado por decisiones, hábitos y señales observables.',
    'Valor diferenciador: valor que no solo te orienta éticamente, sino que además te distingue frente a otros líderes.',
    'No negociable de marca: principio que no debería sacrificarse aun cuando exista presión de resultado, urgencia o conveniencia.',
    'Tensión valor-resultado: momento en que un objetivo atractivo presiona al líder a actuar por fuera de sus principios declarados.',
    'Huella ética: percepción que deja tu forma de decidir, priorizar y ejercer poder.',
    'Arquitectura axiológica de marca: estructura de valores que sostiene la narrativa, el posicionamiento y la reputación del líder.',
    'Credibilidad moral: confianza que otros desarrollan cuando observan consistencia entre discurso, criterio y acción.',
    'Valor de marca visible: valor que puede identificarse en decisiones, interacciones y estilo de liderazgo.'
] as const

const BRAND_VALUES_SECTION_CLOSURE = [
    'Qué valores sostienen realmente tu marca ejecutiva.',
    'Cuáles están probados y cuáles siguen siendo más aspiracionales.',
    'Qué decisiones fortalecen o debilitan tu credibilidad moral.',
    'Qué no negociables protegen tu reputación.',
    'Si tu marca tiene una base ética legible y confiable.'
] as const

const BRAND_VALUES_INVENTORY_EXAMPLE = [
    'Honestidad',
    'Coherencia',
    'Responsabilidad',
    'Visión',
    'Impacto colectivo',
    'Integridad',
    'Claridad',
    'Confianza',
    'Serenidad',
    'Servicio'
] as const

const BRAND_VALUES_MATRIX_EXAMPLE = [
    {
        value: 'Honestidad',
        meaning: 'Hablar y actuar con verdad, incluso en tensión.',
        behavior: 'No maquillo resultados ni exagero promesas.',
        proof: 'Feedback claro y decisiones transparentes.',
        weakener: 'Quedar bien a costa de la verdad.'
    },
    {
        value: 'Coherencia',
        meaning: 'Que mi discurso y mis decisiones vayan juntos.',
        behavior: 'Sostengo el mismo criterio en público y en privado.',
        proof: 'Señales consistentes de otros stakeholders.',
        weakener: 'Decir una cosa y hacer otra.'
    },
    {
        value: 'Visión',
        meaning: 'No actuar solo para el presente.',
        behavior: 'Tomo decisiones con lectura de largo plazo.',
        proof: 'Anticipo escenarios y no solo reacciono.',
        weakener: 'Quedar atrapado en la urgencia.'
    },
    {
        value: 'Impacto colectivo',
        meaning: 'Mi huella no es individualista.',
        behavior: 'Desarrollo otros, comparto crédito y construyo con otros.',
        proof: 'Equipos fortalecidos y resultados sostenibles.',
        weakener: 'Centralizar poder o buscar lucimiento propio.'
    }
] as const

const BRAND_VALUES_RANKING_EXAMPLE = [
    { value: 'Honestidad', importance: '5', evidence: '4', strategicReading: 'Valor fuerte y bastante visible.' },
    { value: 'Coherencia', importance: '5', evidence: '3', strategicReading: 'Debe fortalecerse en visibilidad pública.' },
    { value: 'Responsabilidad', importance: '5', evidence: '5', strategicReading: 'Muy integrado.' },
    { value: 'Visión', importance: '5', evidence: '3', strategicReading: 'Existe, pero aún no siempre se ve.' },
    { value: 'Impacto colectivo', importance: '5', evidence: '2', strategicReading: 'Valor muy importante, pero con baja evidencia visible.' }
] as const

const BRAND_VALUES_TEST_QUESTIONS = [
    '¿Tengo mis valores de marca claramente definidos?',
    '¿Cada valor se traduce en conducta visible?',
    '¿Distingo valor declarado de valor probado?',
    '¿Tengo no negociables claros?',
    '¿Mi reputación confirma esos valores?',
    '¿Mis decisiones recientes los reforzaron?'
] as const

const RATING_OPTIONS: RatingValue[] = ['1', '2', '3', '4', '5']

const LEADERSHIP_ARCHETYPE_CONCEPTS = [
    'Arquetipo de liderazgo: patrón simbólico y narrativo que sintetiza la esencia de tu estilo de liderazgo y ayuda a volverlo legible, recordable y coherente.',
    'Arquetipo de marca: identidad narrativa que organiza tono, atributos, señales, decisiones y percepción externa en torno a un núcleo reconocible.',
    'Sabio Estratega: arquetipo que combina reflexión, visión, criterio y serenidad, y que en el ejemplo aplicado se formula como liderazgo desde la claridad y no desde la urgencia.',
    'Identidad simbólica: capa de sentido que permite condensar tu marca en una figura comprensible para otros.',
    'Código narrativo: conjunto de ideas, palabras, imágenes y comportamientos que hacen consistente tu arquetipo.',
    'Estilo de liderazgo: manera recurrente de decidir, comunicar, influir, sostener tensión y relacionarte con otros.',
    'Tono arquetípico: forma reconocible en que suena y se expresa tu liderazgo.',
    'Sombra del arquetipo: distorsión o exceso de un rasgo positivo que, llevado al límite, debilita la marca.',
    'Señal arquetípica: rasgo visible que permite a otros reconocer tu estilo de liderazgo con rapidez.',
    'Coherencia arquetípica: alineación entre propósito, valores, tono, decisiones y reputación bajo una misma identidad de liderazgo.',
    'Código simbólico: imagen o metáfora que ayuda a expresar el arquetipo.'
] as const

const LEADERSHIP_ARCHETYPE_SECTION_CLOSURE = [
    'Qué figura narrativa resume mejor tu liderazgo.',
    'Qué rasgos la hacen creíble.',
    'Qué tono y señales la sostienen.',
    'Qué sombra debes vigilar.',
    'Cómo usar el arquetipo para darle más consistencia a tu marca ejecutiva.'
] as const

const LEADERSHIP_ARCHETYPE_INVENTORY_DIMENSIONS = [
    'Rasgo dominante 1',
    'Rasgo dominante 2',
    'Rasgo dominante 3',
    'Tipo de presencia que genero',
    'Forma de influencia más natural',
    'Rasgo valioso pero subnombrado'
] as const

const LEADERSHIP_ARCHETYPE_INVENTORY_EXAMPLE = [
    'Serenidad bajo presión',
    'Visión estratégica',
    'Capacidad de convertir complejidad en dirección',
    'Calma con criterio',
    'Ordenar, clarificar y anticipar',
    'Foco en legado y desarrollo de otros'
] as const

const LEADERSHIP_ARCHETYPE_OPTIONS = [
    {
        name: 'Sabio Estratega',
        traits: 'Visión, calma, criterio y lectura de largo plazo',
        strengthens: 'Autoridad serena y dirección clara',
        risk: 'Sonar demasiado distante o analítico',
        balances: 'Humanidad y cercanía'
    },
    {
        name: 'Arquitecto del Futuro',
        traits: 'Anticipación, diseño, estructura e innovación',
        strengthens: 'Visión y construcción de largo plazo',
        risk: 'Exceso de abstracción',
        balances: 'Prueba concreta y ejecución'
    },
    {
        name: 'Líder Multiplicador',
        traits: 'Desarrollo de otros, huella colectiva y mentoría',
        strengthens: 'Legado y crecimiento compartido',
        risk: 'Diluir demasiado la autoría propia',
        balances: 'Claridad de criterio y foco'
    },
    {
        name: 'Gobernante Integrador',
        traits: 'Orden, dirección, responsabilidad y capacidad de decisión',
        strengthens: 'Autoridad, control del sistema y legitimidad',
        risk: 'Rigidez, control excesivo o verticalidad',
        balances: 'Escucha y flexibilidad'
    },
    {
        name: 'Héroe Ejecutor',
        traits: 'Coraje, determinación, disciplina y capacidad de superar retos',
        strengthens: 'Credibilidad por resultados y fuerza de acción',
        risk: 'Sobreexigencia, dureza o hipercompetencia',
        balances: 'Vulnerabilidad y colaboración'
    },
    {
        name: 'Explorador Visionario',
        traits: 'Curiosidad, autonomía, apertura y búsqueda de nuevas rutas',
        strengthens: 'Innovación, adaptabilidad y amplitud de mirada',
        risk: 'Dispersión o dificultad para sostener foco',
        balances: 'Disciplina y priorización'
    },
    {
        name: 'Rebelde Transformador',
        traits: 'Cuestionamiento del statu quo, valentía y cambio estructural',
        strengthens: 'Diferenciación, valentía y poder transformador',
        risk: 'Desgaste, confrontación permanente o resistencia por resistencia',
        balances: 'Dirección estratégica y diplomacia'
    },
    {
        name: 'Mago Catalizador',
        traits: 'Transformación profunda, intuición y capacidad de activar cambios',
        strengthens: 'Capacidad de mover procesos complejos y generar transformación',
        risk: 'Sonar críptico, grandilocuente o poco aterrizado',
        balances: 'Método y evidencia'
    },
    {
        name: 'Cuidador Generativo',
        traits: 'Protección, servicio, empatía y desarrollo de otros',
        strengthens: 'Confianza, humanidad y seguridad relacional',
        risk: 'Sobreprotección o dificultad para poner límites',
        balances: 'Exigencia sana y criterio'
    },
    {
        name: 'Conector Humano',
        traits: 'Cercanía, humildad, inclusión y trabajo con otros',
        strengthens: 'Accesibilidad, empatía y sentido de pertenencia',
        risk: 'Volverse demasiado complaciente o poco diferenciado',
        balances: 'Ambición clara y autoridad'
    },
    {
        name: 'Inspirador Optimista',
        traits: 'Esperanza, claridad positiva y fe en el potencial',
        strengthens: 'Energía, elevación e inspiración',
        risk: 'Negar complejidad o sonar ingenuo',
        balances: 'Realismo y profundidad'
    },
    {
        name: 'Activador Creativo',
        traits: 'Originalidad, expresión, imaginación y diseño de nuevas posibilidades',
        strengthens: 'Diferenciación, frescura y pensamiento no convencional',
        risk: 'Inconsistencia o exceso de forma sobre fondo',
        balances: 'Estructura y coherencia'
    }
] as const

const LEADERSHIP_ARCHETYPE_EXPRESSIVE_DIMENSIONS = [
    'Cómo habla',
    'Cómo decide',
    'Cómo actúa bajo presión',
    'Qué no haría',
    'Palabras / ideas que lo representan',
    'Símbolo que lo condensa'
] as const

const LEADERSHIP_ARCHETYPE_EXPRESSIVE_EXAMPLE = [
    'Con claridad, serenidad y experiencia.',
    'Con visión, criterio y lectura de largo plazo.',
    'Mantiene calma, ordena el contexto y transmite confianza.',
    'Liderar desde ego, urgencia o reacción impulsiva.',
    'Estrategia, serenidad, visión, confianza y legado.',
    'El faro.'
] as const

const LEADERSHIP_ARCHETYPE_TEST_QUESTIONS = [
    '¿Mi arquetipo coincide con mi propósito?',
    '¿Conversa con mis valores de marca?',
    '¿Tiene evidencia en mi trayectoria?',
    '¿Mi tono lo refuerza?',
    '¿Mi audiencia lo vería creíble?',
    '¿Evito su caricatura o sombra?'
] as const

const LINKEDIN_PROFILE_CONCEPTS = [
    'Perfil LinkedIn optimizado: versión estratégica del perfil profesional diseñada para convertir experiencia, propuesta de valor y reputación en una señal visible, legible y confiable.',
    'Headline estratégico: línea principal del perfil que comunica transformación, especialidad y diferenciador en una fórmula breve.',
    'Banner de posicionamiento: elemento visual que refuerza la promesa de valor.',
    'Acerca de ejecutivo: narrativa breve y persuasiva que explica quién eres, qué has logrado, qué problema resuelves, cómo piensas y qué huella quieres dejar.',
    'Visibilidad por pensamiento: principio según el cual el líder debe ser visible más por cómo piensa y qué criterio aporta que por su CV o lista de cargos.',
    'Prueba reputacional: evidencia concreta que vuelve creíble el perfil.',
    'Señal de autoridad digital: impresión de expertise, criterio y credibilidad que el perfil deja en stakeholders internos y externos.',
    'Arquitectura del perfil: estructura del perfil como sistema coherente entre foto, banner, headline, about, experiencia, destacados y actividad.',
    'Narrativa de credibilidad: secuencia que conecta experiencia, resultados, enfoque, estilo y propósito sin caer en autopromoción vacía.',
    'Perfil inerte: perfil que existe, pero no traduce valor ni genera conversación.',
    'Perfil de oportunidad: perfil capaz de abrir conversación, recomendación, invitación, reclutamiento, patrocinio o negocio.',
    'Coherencia digital de marca: alineación entre propósito, marca ejecutiva, valores, arquetipo y la forma en que el perfil se presenta.'
] as const

const LINKEDIN_PROFILE_SECTION_CLOSURE = [
    'Si tu perfil LinkedIn comunica una marca ejecutiva o solo una trayectoria.',
    'Qué debe decir tu Headline.',
    'Cómo debe estructurarse tu “Acerca de”.',
    'Qué partes del perfil necesitan prueba y no solo redacción.',
    'Si tu presencia digital ya está lista para abrir oportunidades reales.'
] as const

const LINKEDIN_AUDIT_DIMENSIONS = [
    'Qué impresión general deja hoy',
    'Qué valor comunica con claridad',
    'Qué parte del perfil está genérica o débil',
    'Qué señal de autoridad aparece',
    'Qué oportunidad podría abrir hoy',
    'Qué oportunidad probablemente está perdiendo'
] as const

const LINKEDIN_BANNER_FIELDS = [
    { key: 'mainPhrase', label: 'Frase principal del banner', placeholder: 'Cuál es la promesa principal que debe reforzar el banner.' },
    { key: 'subtitle', label: 'Subtítulo o idea secundaria', placeholder: 'Qué idea secundaria acompaña la promesa principal.' },
    { key: 'visualSignal', label: 'Señal visual o simbólica', placeholder: 'Qué símbolo, imagen o código visual refuerza tu marca.' },
    { key: 'reinforces', label: 'Qué debe reforzar del perfil', placeholder: 'Qué idea clave debe hacer más evidente dentro del perfil.' }
] as const

type LinkedInBannerFieldKey = (typeof LINKEDIN_BANNER_FIELDS)[number]['key']

const LINKEDIN_ABOUT_BLOCKS = [
    'Quién soy y desde dónde hablo',
    'Resultados / trayectoria que me respaldan',
    'Problema principal que resuelvo',
    'Cómo pienso / cómo lidero',
    'Qué organizaciones o audiencias quiero impactar',
    'Qué visión o legado estoy construyendo'
] as const

const LINKEDIN_PROFILE_SECTIONS = [
    'Foto',
    'Banner',
    'Headline',
    'Acerca de',
    'Experiencia',
    'Destacados',
    'Actividad'
] as const

const LINKEDIN_OPTIMIZATION_QUESTIONS = [
    '¿Mi Headline comunica valor y no solo rol?',
    '¿El banner refuerza mi promesa?',
    '¿El “Acerca de” está bien estructurado?',
    '¿Mi perfil muestra pensamiento propio?',
    '¿Hay suficiente prueba reputacional?',
    '¿El perfil puede abrir oportunidades reales?'
] as const

const LINKEDIN_HEADLINE_EXAMPLE =
    'Transformo operaciones en ventaja competitiva | Estratega en Procurement & Operaciones | Procurement Head | Liderazgo sereno, visión estratégica y decisiones que escalan.'

const LINKEDIN_BANNER_EXAMPLE: Record<LinkedInBannerFieldKey, string> = {
    mainPhrase: 'Transformo la cadena de suministro en una ventaja competitiva con impacto sostenible.',
    subtitle: 'Liderazgo sereno, visión estratégica y decisiones que escalan.',
    visualSignal: 'Faro / dirección / crecimiento sostenible.',
    reinforces: 'Que no soy solo un ejecutor; soy un estratega con impacto real.'
}

const LINKEDIN_ABOUT_EXAMPLE = [
    'Soy un ejecutivo con experiencia internacional que ha transformado la cadena de suministro en una ventaja competitiva.',
    'He recuperado millones de dólares, asegurado continuidad operativa y liderado equipos en contextos multiculturales.',
    'Convierto operaciones complejas en motores de competitividad, resiliencia y crecimiento.',
    'Combino coraje operacional con visión estratégica y serenidad bajo presión.',
    'Organizaciones que quieren ir más allá de la eficiencia y construir negocios sólidos, rentables y sostenibles.',
    'Liderar empresas que quieran escalar con estrategia, desarrollar talento y dejar una huella positiva en la economía y en las personas.'
] as const

const LINKEDIN_PROFILE_SECTION_EXAMPLE = [
    ['Presencia ejecutiva y cercanía confiable', 'Mayor intención de marca', 'Elegir foto más consistente'],
    ['Promesa de valor', 'Señal más estratégica', 'Rediseñar frase principal'],
    ['Diferenciación y transformación', 'Más claridad ejecutiva', 'Reescribir con fórmula estratégica'],
    ['Trayectoria + problema + visión', 'Más narrativa de impacto', 'Reestructurar en bloques'],
    ['Evidencia y resultados', 'Menos descripción de cargo', 'Reescribir con foco en impacto'],
    ['Prueba visible', 'Pocas piezas estratégicas', 'Subir casos, artículos o logros'],
    ['Pensamiento visible', 'Baja consistencia', 'Activar contenido útil y regular']
] as const

const SOCIAL_CAUSE_CONCEPTS = [
    'Causa social estratégica: causa o problema social al que tu marca ejecutiva decide contribuir de forma coherente, no como accesorio reputacional, sino como extensión real de propósito, valores y trayectoria.',
    'Impacto social y humano: influencia positiva que el líder ejerce sobre personas, organizaciones y comunidades mediante decisiones responsables y orientación al bien común.',
    'Legado personal y trascendencia: capacidad de dejar una huella duradera que trascienda al individuo y conecte acciones y valores con impacto positivo en otros.',
    'Propósito expandido: versión del propósito que no se agota en carrera, rol o éxito individual, sino que se proyecta hacia una contribución de mayor escala.',
    'Causa oportunista: causa elegida por conveniencia discursiva o reputacional, sin conexión real con trayectoria, decisiones o compromiso sostenido.',
    'Causa encarnada: causa que ya tiene raíces visibles en tu historia, tus preocupaciones, tus decisiones o tu forma de liderar.',
    'Territorio de contribución: espacio social, humano, educativo, económico o ambiental donde tu marca puede generar una diferencia creíble.',
    'Tesis de impacto: formulación clara de la transformación social que quieres favorecer.',
    'Coherencia causa-marca: alineación entre propósito, valores, arquetipo, promesa de valor y causa social.',
    'Vehículo de contribución: medio concreto a través del cual tu causa puede expresarse.',
    'Huella colectiva: evidencia de que tu liderazgo no solo produce resultados, sino también bienestar, desarrollo, empleo, autonomía o transformación más allá de ti.',
    'Señal de legitimidad social: prueba visible de que tu causa no es declarativa, sino respaldada por acciones, elecciones o compromisos concretos.'
] as const

const SOCIAL_CAUSE_SECTION_CLOSURE = [
    'Qué causa social realmente conversa con tu marca ejecutiva.',
    'Por qué esa causa es creíble en tu trayectoria.',
    'Qué valores y propósito la sostienen.',
    'Cómo se hará visible en tu liderazgo.',
    'Cómo conecta tu marca con una huella que trasciende el logro individual.'
] as const

const SOCIAL_CAUSE_INVENTORY_EXAMPLE = [
    'Desarrollo de liderazgo humano en Latinoamérica.',
    'Empresas más sostenibles y competitivas.',
    'Generación de empleo y crecimiento económico con sentido.',
    'Desarrollo de talento y equipos autónomos.',
    'Transformación de mentalidades empresariales.',
    'Crecimiento sin sacrificar cultura ni personas.'
] as const

const SOCIAL_CAUSE_MATRIX_EXAMPLE = [
    {
        possibleCause: 'Cambio de mentalidad empresarial en Latinoamérica',
        storyConnection: '5' as RatingValue,
        purposeCoherence: '5' as RatingValue,
        contributionCapacity: '4' as RatingValue,
        externalCredibility: '5' as RatingValue,
        footprintPotential: '5' as RatingValue
    },
    {
        possibleCause: 'Desarrollo de equipos autónomos',
        storyConnection: '5' as RatingValue,
        purposeCoherence: '4' as RatingValue,
        contributionCapacity: '5' as RatingValue,
        externalCredibility: '4' as RatingValue,
        footprintPotential: '4' as RatingValue
    },
    {
        possibleCause: 'Sostenibilidad competitiva',
        storyConnection: '4' as RatingValue,
        purposeCoherence: '5' as RatingValue,
        contributionCapacity: '4' as RatingValue,
        externalCredibility: '5' as RatingValue,
        footprintPotential: '5' as RatingValue
    },
    {
        possibleCause: 'Empleo y crecimiento con impacto',
        storyConnection: '4' as RatingValue,
        purposeCoherence: '4' as RatingValue,
        contributionCapacity: '3' as RatingValue,
        externalCredibility: '4' as RatingValue,
        footprintPotential: '5' as RatingValue
    }
] as const

const SOCIAL_CAUSE_MAP_ELEMENTS = [
    'Propósito integrado',
    'Promesa de valor',
    'Valores de marca que sostienen la causa',
    'Arquetipo que mejor la expresa',
    'Causa social elegida',
    'Contribución visible que puedo hacer'
] as const

const SOCIAL_CAUSE_MAP_EXAMPLE = [
    'Estoy aquí para impulsar el cambio e inspirar crecimiento real en personas y organizaciones.',
    'Transformo la cadena de suministro en una ventaja competitiva con impacto sostenible.',
    'Honestidad, coherencia, visión e impacto colectivo.',
    'El Sabio Estratega.',
    'Impulsar el cambio de mentalidad en Latinoamérica.',
    'Compartir criterio, desarrollar líderes y mostrar que crecimiento y humanidad sí pueden convivir.'
] as const

const SOCIAL_CAUSE_ACTIVATION_EXAMPLE = [
    {
        vehicle: 'Contenido LinkedIn',
        concreteAction: 'Publicar ideas sobre liderazgo, legado y crecimiento sostenible.',
        impactedAudience: 'Líderes y directivos.',
        visibleSignal: 'Mayor conversación cualificada.'
    },
    {
        vehicle: 'Mentoría',
        concreteAction: 'Acompañar líderes en transición.',
        impactedAudience: 'Directivos o gerentes.',
        visibleSignal: 'Casos de desarrollo visibles.'
    },
    {
        vehicle: 'Desarrollo de equipos',
        concreteAction: 'Delegar, formar y multiplicar autonomía.',
        impactedAudience: 'Equipo propio.',
        visibleSignal: 'Sucesores más fuertes.'
    },
    {
        vehicle: 'Posicionamiento ejecutivo',
        concreteAction: 'Hablar de empresas sostenibles y humanas en espacios clave.',
        impactedAudience: 'Stakeholders internos y externos.',
        visibleSignal: 'Reconocimiento más claro de la causa.'
    }
] as const

const SOCIAL_CAUSE_TEST_QUESTIONS = [
    '¿Mi causa conversa con mi propósito?',
    '¿Es creíble desde mi trayectoria?',
    '¿Está sostenida por valores visibles?',
    '¿Tengo vehículos concretos de activación?',
    '¿Mi audiencia la vería consistente?',
    '¿Amplía mi marca y no la dispersa?'
] as const

const CONTENT_PLAN_CONCEPTS = [
    'Plan de contenido 30-60-90: secuencia estratégica de visibilidad organizada por tres horizontes de tiempo: activación, consolidación y expansión.',
    'Contenido de marca ejecutiva: pieza de comunicación diseñada para hacer visible criterio, experiencia, valores, causa y propuesta de valor, no solo actividad o presencia superficial.',
    'Cadencia de marca: frecuencia mínima sostenible con la que una marca se vuelve visible sin depender de improvisación.',
    'Pilar de contenido: eje temático recurrente que organiza el contenido y evita dispersión.',
    'Contenido de autoridad: contenido que demuestra criterio, profundidad y experiencia.',
    'Contenido de identidad: contenido que hace visible estilo, valores, propósito o arquetipo.',
    'Contenido de legado: contenido que conecta la marca con impacto colectivo, desarrollo de otros o causa social.',
    'Contenido de prueba: contenido que muestra evidencia, caso, resultado, experiencia o señal verificable.',
    'Canal de expresión: superficie donde la marca se vuelve visible, como LinkedIn, correo, newsletter, conversación, eventos o espacios internos.',
    'Ritmo de posicionamiento: secuencia con la que una marca pasa de estar formulada a ser reconocida.',
    'Consistencia narrativa: repetición coherente de señales, ideas y tono a lo largo del tiempo.',
    'Arquitectura 30-60-90: diseño escalonado donde en 30 días se activa la presencia mínima viable, en 60 días se consolida la señal y en 90 días se amplifica el posicionamiento y la reputación.',
    'Retorno reputacional: efecto acumulado de la visibilidad en reconocimiento, autoridad, conversaciones, oportunidades e influencia.'
] as const

const CONTENT_PLAN_SECTION_CLOSURE = [
    'Qué percepción quieres instalar en 90 días.',
    'Qué pilares sostendrán tu contenido.',
    'Qué piezas concretas vas a producir.',
    'Cómo se organizará tu cadencia.',
    'Cómo convertir la marca ejecutiva en una presencia visible, consistente y útil.'
] as const

const CONTENT_PLAN_SIGNAL_FIELDS = [
    {
        key: 'perception90Days',
        label: 'La percepción que quiero instalar en 90 días es',
        placeholder: 'Qué impresión quieres dejar al final del plan.'
    },
    {
        key: 'centralIdea',
        label: 'La idea central que quiero repetir es',
        placeholder: 'Qué idea central debe repetirse de forma sostenida.'
    },
    {
        key: 'sustainingTone',
        label: 'El tono que debe sostener esa señal es',
        placeholder: 'Qué tono debe sostener esa visibilidad.'
    },
    {
        key: 'avoidProjecting',
        label: 'Lo que no quiero proyectar es',
        placeholder: 'Qué no quieres que tu contenido transmita.'
    },
    {
        key: 'connectionToBrand',
        label: 'Esta señal se conecta con mi marca ejecutiva porque',
        placeholder: 'Cómo se conecta esta señal con tu marca.'
    }
] as const

type ContentPlanSignalFieldKey = (typeof CONTENT_PLAN_SIGNAL_FIELDS)[number]['key']

const CONTENT_PLAN_SIGNAL_EXAMPLE: Record<ContentPlanSignalFieldKey, string> = {
    perception90Days: 'Que soy un líder con visión, serenidad y capacidad de transformar complejidad en dirección.',
    centralIdea: 'Liderazgo sereno con impacto estratégico.',
    sustainingTone: 'Claro, reflexivo, firme, humano y confiable.',
    avoidProjecting: 'Improvisación, grandilocuencia o autopromoción vacía.',
    connectionToBrand: 'Resume mi propósito, mi arquetipo y mi propuesta de valor.'
}

const CONTENT_PLAN_PILLARS = ['Autoridad', 'Identidad', 'Legado / causa'] as const

const CONTENT_PLAN_PILLAR_EXAMPLE = [
    {
        pillar: 'Autoridad',
        whatToShow: 'Lecturas estratégicas, aprendizajes, experiencia y criterio.',
        reinforcedPerception: 'Solidez y autoridad.'
    },
    {
        pillar: 'Identidad',
        whatToShow: 'Valores, propósito, estilo de liderazgo y decisiones.',
        reinforcedPerception: 'Coherencia y autenticidad.'
    },
    {
        pillar: 'Legado / causa',
        whatToShow: 'Desarrollo de otros, empresas humanas y visión de impacto.',
        reinforcedPerception: 'Huella y trascendencia.'
    }
] as const

const CONTENT_PLAN_MATRIX_EXAMPLE = [
    {
        piece: 'Qué significa liderar con serenidad bajo presión',
        pillar: 'Identidad',
        channel: 'LinkedIn',
        objective: 'Autoridad + identidad',
        brandSignal: 'Calma con criterio'
    },
    {
        piece: 'Cómo convertir complejidad en decisiones claras',
        pillar: 'Autoridad',
        channel: 'LinkedIn / newsletter',
        objective: 'Autoridad',
        brandSignal: 'Claridad estratégica'
    },
    {
        piece: 'Empresas humanas y competitivas: falso dilema',
        pillar: 'Legado / causa',
        channel: 'LinkedIn / evento',
        objective: 'Legitimidad + causa',
        brandSignal: 'Impacto colectivo'
    },
    {
        piece: 'Aprendizajes de formar otros líderes',
        pillar: 'Legado / identidad',
        channel: 'LinkedIn / conversación',
        objective: 'Confianza',
        brandSignal: 'Liderazgo que trasciende'
    }
] as const

const CONTENT_PLAN_HORIZONS = ['30 días', '60 días', '90 días'] as const

const CONTENT_PLAN_CALENDAR_EXAMPLE = [
    {
        horizon: '30 días',
        stretchObjective: 'Activar presencia y coherencia básica.',
        prioritizedContent: '6 piezas entre autoridad e identidad.',
        mainChannel: 'LinkedIn + ajuste de perfil.',
        expectedResult: 'Señal inicial más clara.'
    },
    {
        horizon: '60 días',
        stretchObjective: 'Consolidar tono y pilares.',
        prioritizedContent: 'Contenido más profundo + causa social.',
        mainChannel: 'LinkedIn + conversaciones clave.',
        expectedResult: 'Mayor reconocimiento y consistencia.'
    },
    {
        horizon: '90 días',
        stretchObjective: 'Amplificar reputación y abrir oportunidades.',
        prioritizedContent: 'Contenidos de prueba, legado y visión.',
        mainChannel: 'LinkedIn + espacios externos / internos.',
        expectedResult: 'Más autoridad, más conversaciones, más tracción.'
    }
] as const

const CONTENT_PLAN_BACKLOG_EXAMPLE = [
    {
        piece: 'Liderar desde la claridad y no desde la urgencia',
        pillar: 'Identidad',
        horizon: '30 días',
        channelFormat: 'LinkedIn post',
        objective: 'Instalar tono',
        priority: 'Alta'
    },
    {
        piece: 'Qué vuelve estratégica una operación',
        pillar: 'Autoridad',
        horizon: '30 días',
        channelFormat: 'LinkedIn carrusel',
        objective: 'Autoridad',
        priority: 'Alta'
    },
    {
        piece: 'Mi causa: empresas humanas y competitivas',
        pillar: 'Legado',
        horizon: '30 días',
        channelFormat: 'LinkedIn post',
        objective: 'Causa + coherencia',
        priority: 'Alta'
    },
    {
        piece: '3 decisiones que cambian una cultura',
        pillar: 'Autoridad',
        horizon: '60 días',
        channelFormat: 'Artículo corto',
        objective: 'Profundidad',
        priority: 'Alta'
    },
    {
        piece: 'Qué significa dejar legado desde un rol ejecutivo',
        pillar: 'Legado',
        horizon: '60 días',
        channelFormat: 'Post / video corto',
        objective: 'Huella',
        priority: 'Media-alta'
    },
    {
        piece: 'Cómo se forma un sucesor de verdad',
        pillar: 'Legado / identidad',
        horizon: '60 días',
        channelFormat: 'LinkedIn post',
        objective: 'Liderazgo multiplicador',
        priority: 'Alta'
    },
    {
        piece: 'Caso: transformar complejidad en dirección',
        pillar: 'Autoridad',
        horizon: '90 días',
        channelFormat: 'Carrusel / PDF',
        objective: 'Prueba reputacional',
        priority: 'Alta'
    },
    {
        piece: 'Lo que aprendí liderando en presión',
        pillar: 'Identidad',
        horizon: '90 días',
        channelFormat: 'Post / conversación',
        objective: 'Humanizar autoridad',
        priority: 'Media'
    },
    {
        piece: 'Por qué el futuro necesita líderes más humanos y más estratégicos',
        pillar: 'Legado',
        horizon: '90 días',
        channelFormat: 'Artículo / keynote / post largo',
        objective: 'Amplificación',
        priority: 'Alta'
    }
] as const

const CONTENT_PLAN_CADENCE_FIELDS = [
    { key: 'minimumCadence', label: 'Cadencia mínima total', placeholder: 'Ej. 2 piezas semanales + 1 conversación estratégica cada 15 días.' },
    { key: 'channelRhythm', label: 'Ritmo por canal', placeholder: 'Cómo se reparte la visibilidad por canal.' },
    { key: 'creationBlock', label: 'Bloque de creación', placeholder: 'Cuándo crearás el contenido.' },
    { key: 'distributionBlock', label: 'Bloque de distribución', placeholder: 'Cuándo publicarás o moverás las piezas.' },
    { key: 'reviewBlock', label: 'Bloque de revisión', placeholder: 'Cuándo revisarás el desempeño del plan.' },
    { key: 'learningCriteria', label: 'Criterio de aprendizaje', placeholder: 'Qué aprenderás o medirás para ajustar.' }
] as const

type ContentPlanCadenceFieldKey = (typeof CONTENT_PLAN_CADENCE_FIELDS)[number]['key']

const CONTENT_PLAN_CADENCE_EXAMPLE: Record<ContentPlanCadenceFieldKey, string> = {
    minimumCadence: '2 piezas semanales + 1 conversación estratégica cada 15 días.',
    channelRhythm: 'LinkedIn semanal, espacios clave mensuales, ajustes del perfil permanentes.',
    creationBlock: 'Martes 7:00-8:00 a. m.',
    distributionBlock: 'Jueves y viernes.',
    reviewBlock: 'Último viernes del mes.',
    learningCriteria: 'Identificar qué temas generan más reconocimiento, conversación y autoridad.'
}

const CONTENT_PLAN_TEST_QUESTIONS = [
    '¿El plan hace visible mi marca y no solo actividad?',
    '¿Los pilares están bien conectados con mi identidad?',
    '¿El 30-60-90 tiene progresión clara?',
    '¿Tengo backlog concreto y priorizado?',
    '¿La cadencia es sostenible?',
    '¿Este plan puede fortalecer reputación externa?'
] as const

const MENTOR_LEVEL_OPTIONS: MentorLevel[] = ['N1', 'N2', 'N3', 'N4']
const MENTOR_DECISION_OPTIONS: MentorDecision[] = ['Consolidado', 'En desarrollo', 'Prioritario']

const WB9_MENTOR_INSTRUCTIONS = [
    'Evalúa cada criterio con base en evidencia observable (idealmente de los últimos 90 días).',
    'Marca un solo nivel por criterio (N1, N2, N3 o N4).',
    'Registra comentario u observación concreta por criterio (hechos, conversación o conducta observada).',
    'Define decisión por criterio: Consolidado, En desarrollo o Prioritario.',
    'Cierra el WB con observaciones generales y una decisión global de seguimiento.'
] as const

const WB9_MENTOR_LEVEL_REFERENCE = [
    {
        level: 'Nivel 1 – Declarativo',
        descriptor: 'Posicionamiento difuso; decisiones incoherentes.'
    },
    {
        level: 'Nivel 2 – Consciente',
        descriptor: 'Reconoce brechas entre identidad y reputación.'
    },
    {
        level: 'Nivel 3 – Integrado',
        descriptor: 'Marca clara; decisiones alineadas con valores.'
    },
    {
        level: 'Nivel 4 – Alineación Estratégica',
        descriptor: 'Reputación sólida; forma sucesores y deja huella visible.'
    }
] as const

const WB9_MENTOR_EVALUATION_CRITERIA = [
    'Claridad de marca personal',
    'Coherencia propósito-posicionamiento',
    'Integración ética en decisiones',
    'Desarrollo de otros líderes',
    'Consistencia entre discurso y reputación externa'
] as const

const WB9_LEADER_INSTRUCTIONS = [
    'Responde cada pregunta desde hechos concretos y recientes, no desde intención.',
    'Incluye al menos un ejemplo o evidencia por respuesta.',
    'Define una acción o compromiso de 30 días para cada respuesta clave.',
    'Usa este bloque como insumo para acordar el plan de desarrollo con el mentor.'
] as const

const WB9_LEADER_EVALUATION_QUESTIONS = [
    '¿Qué huella estoy dejando hoy en mi equipo y organización?',
    '¿Mi reputación coincide con mi intención identitaria?',
    '¿Estoy desarrollando sucesores o centralizando poder?',
    '¿Qué incoherencia pública debo corregir?',
    '¿Cómo describirían mi marca ejecutiva tres stakeholders clave?'
] as const

const EVALUATION_STAGES: Array<{ key: EvaluationStageKey; label: string }> = [
    { key: 'mentor', label: 'Pantalla 1 - Mentor' },
    { key: 'leader', label: 'Pantalla 2 - Líder' },
    { key: 'synthesis', label: 'Pantalla 3 - Síntesis' },
    { key: 'final', label: 'Cierre' }
]

const createDefaultEvaluationData = (): WB9State['evaluation'] => ({
    mentorRows: WB9_MENTOR_EVALUATION_CRITERIA.map((criterion) => ({
        criterion,
        level: '' as MentorLevel,
        evidence: '',
        decision: '' as MentorDecision
    })),
    mentorGeneralNotes: '',
    mentorGlobalDecision: '' as MentorDecision,
    leaderRows: WB9_LEADER_EVALUATION_QUESTIONS.map((question) => ({
        question,
        response: '',
        evidence: '',
        action: ''
    })),
    agreementsSynthesis: ''
})

const isMentorEvaluationRowComplete = (row: EvaluationMentorRow): boolean =>
    row.level !== '' && row.evidence.trim().length > 0 && row.decision !== ''

const isLeaderEvaluationRowComplete = (row: EvaluationLeaderRow): boolean =>
    row.response.trim().length > 0 && row.evidence.trim().length > 0 && row.action.trim().length > 0

const DEFAULT_STATE: WB9State = {
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    purposeIntegrated: {
        inventory: {
            passion: '',
            vocation: '',
            mission: '',
            expertise: '',
            desiredImpact: ''
        },
        contributionMatrix: PURPOSE_MATRIX_DEFINITIONS.map((item) => ({
            dimension: item.label,
            response: ''
        })),
        integratedPurpose: '',
        coherenceChecks: COHERENCE_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        })),
        lifeIntegration: LIFE_INTEGRATION_AREAS.map((area) => ({
            area,
            vision: ''
        }))
    },
    executiveBrand: {
        currentSignals: EXECUTIVE_BRAND_SIGNAL_DIMENSIONS.map((dimension) => ({
            dimension,
            reading: ''
        })),
        differentiatorMatrix: Array.from({ length: 3 }, () => ({
            differentiator: '',
            problem: '',
            audience: '',
            proof: '',
            signal: ''
        })),
        canvas: {
            professionalIdentity: '',
            mainProblem: '',
            differentiator: '',
            transformation: '',
            tone: '',
            audience: '',
            primarySignal: ''
        },
        positioningStatement: '',
        strengthChecks: EXECUTIVE_BRAND_STRENGTH_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    brandValues: {
        inventory: Array.from({ length: 15 }, () => ''),
        valueMatrix: Array.from({ length: 4 }, () => ({
            value: '',
            meaning: '',
            behavior: '',
            proof: '',
            weakener: ''
        })),
        coreValues: Array.from({ length: 5 }, () => ''),
        rankings: Array.from({ length: 5 }, () => ({
            importance: '' as RatingValue,
            evidence: '' as RatingValue,
            strategicReading: ''
        })),
        nonNegotiables: Array.from({ length: 3 }, () => ({
            principle: '',
            cost: ''
        })),
        consistencyChecks: BRAND_VALUES_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    leadershipArchetype: {
        dominantTraits: LEADERSHIP_ARCHETYPE_INVENTORY_DIMENSIONS.map((dimension) => ({
            dimension,
            reading: ''
        })),
        selectedArchetypes: [],
        centralChoice: {
            primary: '',
            reason: '',
            visibleTraits: '',
            credibility: '',
            secondary: ''
        },
        expressiveCode: LEADERSHIP_ARCHETYPE_EXPRESSIVE_DIMENSIONS.map((dimension) => ({
            dimension,
            definition: ''
        })),
        coherenceChecks: LEADERSHIP_ARCHETYPE_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    linkedInProfile: {
        profileUrl: '',
        audit: LINKEDIN_AUDIT_DIMENSIONS.map((dimension) => ({
            dimension,
            response: ''
        })),
        strategicHeadline: '',
        banner: {
            mainPhrase: '',
            subtitle: '',
            visualSignal: '',
            reinforces: ''
        },
        aboutMatrix: LINKEDIN_ABOUT_BLOCKS.map((block) => ({
            block,
            formulation: ''
        })),
        profileSections: LINKEDIN_PROFILE_SECTIONS.map((section) => ({
            section,
            communicates: '',
            missingToday: '',
            priorityAdjustment: ''
        })),
        optimizationChecks: LINKEDIN_OPTIMIZATION_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    socialCause: {
        possibleCauses: Array.from({ length: 6 }, () => ''),
        legitimacyMatrix: Array.from({ length: 4 }, () => ({
            possibleCause: '',
            storyConnection: '' as RatingValue,
            purposeCoherence: '' as RatingValue,
            contributionCapacity: '' as RatingValue,
            externalCredibility: '' as RatingValue,
            footprintPotential: '' as RatingValue
        })),
        strategicCause: '',
        causeMap: SOCIAL_CAUSE_MAP_ELEMENTS.map((element) => ({
            element,
            formulation: ''
        })),
        activationVehicles: Array.from({ length: 4 }, () => ({
            vehicle: '',
            concreteAction: '',
            impactedAudience: '',
            visibleSignal: ''
        })),
        legitimacyChecks: SOCIAL_CAUSE_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    contentPlan: {
        centralSignal: {
            perception90Days: '',
            centralIdea: '',
            sustainingTone: '',
            avoidProjecting: '',
            connectionToBrand: ''
        },
        pillars: CONTENT_PLAN_PILLARS.map((pillar) => ({
            pillar,
            whatToShow: '',
            reinforcedPerception: ''
        })),
        contentMatrix: Array.from({ length: 4 }, () => ({
            piece: '',
            pillar: '',
            channel: '',
            objective: '',
            brandSignal: ''
        })),
        calendar: CONTENT_PLAN_HORIZONS.map((horizon) => ({
            horizon,
            stretchObjective: '',
            prioritizedContent: '',
            mainChannel: '',
            expectedResult: ''
        })),
        backlog: Array.from({ length: 9 }, () => ({
            piece: '',
            pillar: '',
            horizon: '',
            channelFormat: '',
            objective: '',
            priority: ''
        })),
        cadence: {
            minimumCadence: '',
            channelRhythm: '',
            creationBlock: '',
            distributionBlock: '',
            reviewBlock: '',
            learningCriteria: ''
        },
        coherenceChecks: CONTENT_PLAN_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    evaluation: createDefaultEvaluationData()
}

const INPUT_CLASS =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed'
const TEXTAREA_CLASS =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-amber-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed'

const readString = (value: unknown): string => (typeof value === 'string' ? value : '')
const readYesNo = (value: unknown): YesNoAnswer => (value === 'yes' || value === 'no' ? value : '')
const readRating = (value: unknown): RatingValue =>
    value === '1' || value === '2' || value === '3' || value === '4' || value === '5' ? value : ''
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

const normalizeState = (raw: unknown): WB9State => {
    if (!raw || typeof raw !== 'object') return DEFAULT_STATE

    const parsed = raw as Record<string, unknown>
    const identification = (parsed.identification ?? {}) as Record<string, unknown>
    const purposeIntegrated = (parsed.purposeIntegrated ?? {}) as Record<string, unknown>
    const executiveBrand = (parsed.executiveBrand ?? {}) as Record<string, unknown>
    const inventory = (purposeIntegrated.inventory ?? {}) as Record<string, unknown>
    const rawContributionMatrix = Array.isArray(purposeIntegrated.contributionMatrix) ? purposeIntegrated.contributionMatrix : []
    const rawCoherenceChecks = Array.isArray(purposeIntegrated.coherenceChecks) ? purposeIntegrated.coherenceChecks : []
    const rawLifeIntegration = Array.isArray(purposeIntegrated.lifeIntegration) ? purposeIntegrated.lifeIntegration : []
    const rawCurrentSignals = Array.isArray(executiveBrand.currentSignals) ? executiveBrand.currentSignals : []
    const rawDifferentiatorMatrix = Array.isArray(executiveBrand.differentiatorMatrix) ? executiveBrand.differentiatorMatrix : []
    const rawBrandCanvas = (executiveBrand.canvas ?? {}) as Record<string, unknown>
    const rawStrengthChecks = Array.isArray(executiveBrand.strengthChecks) ? executiveBrand.strengthChecks : []
    const brandValues = (parsed.brandValues ?? {}) as Record<string, unknown>
    const rawBrandValuesInventory = Array.isArray(brandValues.inventory) ? brandValues.inventory : []
    const rawBrandValuesMatrix = Array.isArray(brandValues.valueMatrix) ? brandValues.valueMatrix : []
    const rawBrandCoreValues = Array.isArray(brandValues.coreValues) ? brandValues.coreValues : []
    const rawBrandRankings = Array.isArray(brandValues.rankings) ? brandValues.rankings : []
    const rawBrandNonNegotiables = Array.isArray(brandValues.nonNegotiables) ? brandValues.nonNegotiables : []
    const rawBrandConsistencyChecks = Array.isArray(brandValues.consistencyChecks) ? brandValues.consistencyChecks : []
    const leadershipArchetype = (parsed.leadershipArchetype ?? {}) as Record<string, unknown>
    const rawDominantTraits = Array.isArray(leadershipArchetype.dominantTraits) ? leadershipArchetype.dominantTraits : []
    const rawSelectedArchetypes = Array.isArray(leadershipArchetype.selectedArchetypes) ? leadershipArchetype.selectedArchetypes : []
    const rawCentralChoice = (leadershipArchetype.centralChoice ?? {}) as Record<string, unknown>
    const rawExpressiveCode = Array.isArray(leadershipArchetype.expressiveCode) ? leadershipArchetype.expressiveCode : []
    const rawArchetypeCoherenceChecks = Array.isArray(leadershipArchetype.coherenceChecks) ? leadershipArchetype.coherenceChecks : []
    const linkedInProfile = (parsed.linkedInProfile ?? {}) as Record<string, unknown>
    const rawLinkedInAudit = Array.isArray(linkedInProfile.audit) ? linkedInProfile.audit : []
    const rawLinkedInBanner = (linkedInProfile.banner ?? {}) as Record<string, unknown>
    const rawLinkedInAbout = Array.isArray(linkedInProfile.aboutMatrix) ? linkedInProfile.aboutMatrix : []
    const rawLinkedInSections = Array.isArray(linkedInProfile.profileSections) ? linkedInProfile.profileSections : []
    const rawLinkedInChecks = Array.isArray(linkedInProfile.optimizationChecks) ? linkedInProfile.optimizationChecks : []
    const socialCause = (parsed.socialCause ?? {}) as Record<string, unknown>
    const rawPossibleCauses = Array.isArray(socialCause.possibleCauses) ? socialCause.possibleCauses : []
    const rawLegitimacyMatrix = Array.isArray(socialCause.legitimacyMatrix) ? socialCause.legitimacyMatrix : []
    const rawCauseMap = Array.isArray(socialCause.causeMap) ? socialCause.causeMap : []
    const rawActivationVehicles = Array.isArray(socialCause.activationVehicles) ? socialCause.activationVehicles : []
    const rawLegitimacyChecks = Array.isArray(socialCause.legitimacyChecks) ? socialCause.legitimacyChecks : []
    const contentPlan = (parsed.contentPlan ?? {}) as Record<string, unknown>
    const rawCentralSignal = (contentPlan.centralSignal ?? {}) as Record<string, unknown>
    const rawPillars = Array.isArray(contentPlan.pillars) ? contentPlan.pillars : []
    const rawContentMatrix = Array.isArray(contentPlan.contentMatrix) ? contentPlan.contentMatrix : []
    const rawCalendar = Array.isArray(contentPlan.calendar) ? contentPlan.calendar : []
    const rawBacklog = Array.isArray(contentPlan.backlog) ? contentPlan.backlog : []
    const rawCadence = (contentPlan.cadence ?? {}) as Record<string, unknown>
    const rawContentPlanChecks = Array.isArray(contentPlan.coherenceChecks) ? contentPlan.coherenceChecks : []
    const evaluation = (parsed.evaluation ?? {}) as Record<string, unknown>
    const rawMentorRows = Array.isArray(evaluation.mentorRows) ? evaluation.mentorRows : []
    const rawLeaderRows = Array.isArray(evaluation.leaderRows) ? evaluation.leaderRows : []

    return {
        identification: {
            leaderName: readString(identification.leaderName),
            role: readString(identification.role),
            cohort: readString(identification.cohort),
            startDate: readString(identification.startDate)
        },
        purposeIntegrated: {
            inventory: {
                passion: readString(inventory.passion),
                vocation: readString(inventory.vocation),
                mission: readString(inventory.mission),
                expertise: readString(inventory.expertise),
                desiredImpact: readString(inventory.desiredImpact)
            },
            contributionMatrix: PURPOSE_MATRIX_DEFINITIONS.map((item, index) => {
                const rawRow = (rawContributionMatrix[index] ?? {}) as Record<string, unknown>
                return {
                    dimension: item.label,
                    response: readString(rawRow.response)
                }
            }),
            integratedPurpose: readString(purposeIntegrated.integratedPurpose),
            coherenceChecks: COHERENCE_QUESTIONS.map((question, index) => {
                const rawRow = (rawCoherenceChecks[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(rawRow.verdict),
                    adjustment: readString(rawRow.adjustment)
                }
            }),
            lifeIntegration: LIFE_INTEGRATION_AREAS.map((area, index) => {
                const rawRow = (rawLifeIntegration[index] ?? {}) as Record<string, unknown>
                return {
                    area,
                    vision: readString(rawRow.vision)
                }
            })
        },
        executiveBrand: {
            currentSignals: EXECUTIVE_BRAND_SIGNAL_DIMENSIONS.map((dimension, index) => {
                const rawRow = (rawCurrentSignals[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    reading: readString(rawRow.reading)
                }
            }),
            differentiatorMatrix: Array.from({ length: 3 }, (_, index) => {
                const rawRow = (rawDifferentiatorMatrix[index] ?? {}) as Record<string, unknown>
                return {
                    differentiator: readString(rawRow.differentiator),
                    problem: readString(rawRow.problem),
                    audience: readString(rawRow.audience),
                    proof: readString(rawRow.proof),
                    signal: readString(rawRow.signal)
                }
            }),
            canvas: {
                professionalIdentity: readString(rawBrandCanvas.professionalIdentity),
                mainProblem: readString(rawBrandCanvas.mainProblem),
                differentiator: readString(rawBrandCanvas.differentiator),
                transformation: readString(rawBrandCanvas.transformation),
                tone: readString(rawBrandCanvas.tone),
                audience: readString(rawBrandCanvas.audience),
                primarySignal: readString(rawBrandCanvas.primarySignal)
            },
            positioningStatement: readString(executiveBrand.positioningStatement),
            strengthChecks: EXECUTIVE_BRAND_STRENGTH_QUESTIONS.map((question, index) => {
                const rawRow = (rawStrengthChecks[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(rawRow.verdict),
                    adjustment: readString(rawRow.adjustment)
                }
            })
        },
        brandValues: {
            inventory: Array.from({ length: 15 }, (_, index) => readString(rawBrandValuesInventory[index])),
            valueMatrix: Array.from({ length: 4 }, (_, index) => {
                const rawRow = (rawBrandValuesMatrix[index] ?? {}) as Record<string, unknown>
                return {
                    value: readString(rawRow.value),
                    meaning: readString(rawRow.meaning),
                    behavior: readString(rawRow.behavior),
                    proof: readString(rawRow.proof),
                    weakener: readString(rawRow.weakener)
                }
            }),
            coreValues: Array.from({ length: 5 }, (_, index) => readString(rawBrandCoreValues[index])),
            rankings: Array.from({ length: 5 }, (_, index) => {
                const rawRow = (rawBrandRankings[index] ?? {}) as Record<string, unknown>
                return {
                    importance: readRating(rawRow.importance),
                    evidence: readRating(rawRow.evidence),
                    strategicReading: readString(rawRow.strategicReading)
                }
            }),
            nonNegotiables: Array.from({ length: 3 }, (_, index) => {
                const rawRow = (rawBrandNonNegotiables[index] ?? {}) as Record<string, unknown>
                return {
                    principle: readString(rawRow.principle),
                    cost: readString(rawRow.cost)
                }
            }),
            consistencyChecks: BRAND_VALUES_TEST_QUESTIONS.map((question, index) => {
                const rawRow = (rawBrandConsistencyChecks[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(rawRow.verdict),
                    adjustment: readString(rawRow.adjustment)
                }
            })
        },
        leadershipArchetype: {
            dominantTraits: LEADERSHIP_ARCHETYPE_INVENTORY_DIMENSIONS.map((dimension, index) => {
                const rawRow = (rawDominantTraits[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    reading: readString(rawRow.reading)
                }
            }),
            selectedArchetypes: rawSelectedArchetypes
                .map((value) => readString(value))
                .filter((value) => LEADERSHIP_ARCHETYPE_OPTIONS.some((option) => option.name === value))
                .slice(0, 3),
            centralChoice: {
                primary: readString(rawCentralChoice.primary),
                reason: readString(rawCentralChoice.reason),
                visibleTraits: readString(rawCentralChoice.visibleTraits),
                credibility: readString(rawCentralChoice.credibility),
                secondary: readString(rawCentralChoice.secondary)
            },
            expressiveCode: LEADERSHIP_ARCHETYPE_EXPRESSIVE_DIMENSIONS.map((dimension, index) => {
                const rawRow = (rawExpressiveCode[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    definition: readString(rawRow.definition)
                }
            }),
            coherenceChecks: LEADERSHIP_ARCHETYPE_TEST_QUESTIONS.map((question, index) => {
                const rawRow = (rawArchetypeCoherenceChecks[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(rawRow.verdict),
                    adjustment: readString(rawRow.adjustment)
                }
            })
        },
        linkedInProfile: {
            profileUrl: readString(linkedInProfile.profileUrl),
            audit: LINKEDIN_AUDIT_DIMENSIONS.map((dimension, index) => {
                const rawRow = (rawLinkedInAudit[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    response: readString(rawRow.response)
                }
            }),
            strategicHeadline: readString(linkedInProfile.strategicHeadline),
            banner: {
                mainPhrase: readString(rawLinkedInBanner.mainPhrase),
                subtitle: readString(rawLinkedInBanner.subtitle),
                visualSignal: readString(rawLinkedInBanner.visualSignal),
                reinforces: readString(rawLinkedInBanner.reinforces)
            },
            aboutMatrix: LINKEDIN_ABOUT_BLOCKS.map((block, index) => {
                const rawRow = (rawLinkedInAbout[index] ?? {}) as Record<string, unknown>
                return {
                    block,
                    formulation: readString(rawRow.formulation)
                }
            }),
            profileSections: LINKEDIN_PROFILE_SECTIONS.map((section, index) => {
                const rawRow = (rawLinkedInSections[index] ?? {}) as Record<string, unknown>
                return {
                    section,
                    communicates: readString(rawRow.communicates),
                    missingToday: readString(rawRow.missingToday),
                    priorityAdjustment: readString(rawRow.priorityAdjustment)
                }
            }),
            optimizationChecks: LINKEDIN_OPTIMIZATION_QUESTIONS.map((question, index) => {
                const rawRow = (rawLinkedInChecks[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(rawRow.verdict),
                    adjustment: readString(rawRow.adjustment)
                }
            })
        },
        socialCause: {
            possibleCauses: Array.from({ length: 6 }, (_, index) => readString(rawPossibleCauses[index])),
            legitimacyMatrix: Array.from({ length: 4 }, (_, index) => {
                const rawRow = (rawLegitimacyMatrix[index] ?? {}) as Record<string, unknown>
                return {
                    possibleCause: readString(rawRow.possibleCause),
                    storyConnection: readRating(rawRow.storyConnection),
                    purposeCoherence: readRating(rawRow.purposeCoherence),
                    contributionCapacity: readRating(rawRow.contributionCapacity),
                    externalCredibility: readRating(rawRow.externalCredibility),
                    footprintPotential: readRating(rawRow.footprintPotential)
                }
            }),
            strategicCause: readString(socialCause.strategicCause),
            causeMap: SOCIAL_CAUSE_MAP_ELEMENTS.map((element, index) => {
                const rawRow = (rawCauseMap[index] ?? {}) as Record<string, unknown>
                return {
                    element,
                    formulation: readString(rawRow.formulation)
                }
            }),
            activationVehicles: Array.from({ length: 4 }, (_, index) => {
                const rawRow = (rawActivationVehicles[index] ?? {}) as Record<string, unknown>
                return {
                    vehicle: readString(rawRow.vehicle),
                    concreteAction: readString(rawRow.concreteAction),
                    impactedAudience: readString(rawRow.impactedAudience),
                    visibleSignal: readString(rawRow.visibleSignal)
                }
            }),
            legitimacyChecks: SOCIAL_CAUSE_TEST_QUESTIONS.map((question, index) => {
                const rawRow = (rawLegitimacyChecks[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(rawRow.verdict),
                    adjustment: readString(rawRow.adjustment)
                }
            })
        },
        contentPlan: {
            centralSignal: {
                perception90Days: readString(rawCentralSignal.perception90Days),
                centralIdea: readString(rawCentralSignal.centralIdea),
                sustainingTone: readString(rawCentralSignal.sustainingTone),
                avoidProjecting: readString(rawCentralSignal.avoidProjecting),
                connectionToBrand: readString(rawCentralSignal.connectionToBrand)
            },
            pillars: CONTENT_PLAN_PILLARS.map((pillar, index) => {
                const rawRow = (rawPillars[index] ?? {}) as Record<string, unknown>
                return {
                    pillar,
                    whatToShow: readString(rawRow.whatToShow),
                    reinforcedPerception: readString(rawRow.reinforcedPerception)
                }
            }),
            contentMatrix: Array.from({ length: 4 }, (_, index) => {
                const rawRow = (rawContentMatrix[index] ?? {}) as Record<string, unknown>
                return {
                    piece: readString(rawRow.piece),
                    pillar: readString(rawRow.pillar),
                    channel: readString(rawRow.channel),
                    objective: readString(rawRow.objective),
                    brandSignal: readString(rawRow.brandSignal)
                }
            }),
            calendar: CONTENT_PLAN_HORIZONS.map((horizon, index) => {
                const rawRow = (rawCalendar[index] ?? {}) as Record<string, unknown>
                return {
                    horizon,
                    stretchObjective: readString(rawRow.stretchObjective),
                    prioritizedContent: readString(rawRow.prioritizedContent),
                    mainChannel: readString(rawRow.mainChannel),
                    expectedResult: readString(rawRow.expectedResult)
                }
            }),
            backlog: Array.from({ length: 9 }, (_, index) => {
                const rawRow = (rawBacklog[index] ?? {}) as Record<string, unknown>
                return {
                    piece: readString(rawRow.piece),
                    pillar: readString(rawRow.pillar),
                    horizon: readString(rawRow.horizon),
                    channelFormat: readString(rawRow.channelFormat),
                    objective: readString(rawRow.objective),
                    priority: readString(rawRow.priority)
                }
            }),
            cadence: {
                minimumCadence: readString(rawCadence.minimumCadence),
                channelRhythm: readString(rawCadence.channelRhythm),
                creationBlock: readString(rawCadence.creationBlock),
                distributionBlock: readString(rawCadence.distributionBlock),
                reviewBlock: readString(rawCadence.reviewBlock),
                learningCriteria: readString(rawCadence.learningCriteria)
            },
            coherenceChecks: CONTENT_PLAN_TEST_QUESTIONS.map((question, index) => {
                const rawRow = (rawContentPlanChecks[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(rawRow.verdict),
                    adjustment: readString(rawRow.adjustment)
                }
            })
        },
        evaluation: {
            mentorRows: WB9_MENTOR_EVALUATION_CRITERIA.map((criterion, index) => {
                const rawRow = (rawMentorRows[index] ?? {}) as Record<string, unknown>
                const level = readString(rawRow.level) as MentorLevel
                const decision = readString(rawRow.decision) as MentorDecision
                return {
                    criterion,
                    level: MENTOR_LEVEL_OPTIONS.includes(level) ? level : ('' as MentorLevel),
                    evidence: readString(rawRow.evidence),
                    decision: MENTOR_DECISION_OPTIONS.includes(decision) ? decision : ('' as MentorDecision)
                }
            }),
            mentorGeneralNotes: readString(evaluation.mentorGeneralNotes),
            mentorGlobalDecision: MENTOR_DECISION_OPTIONS.includes(readString(evaluation.mentorGlobalDecision) as MentorDecision)
                ? (readString(evaluation.mentorGlobalDecision) as MentorDecision)
                : ('' as MentorDecision),
            leaderRows: WB9_LEADER_EVALUATION_QUESTIONS.map((question, index) => {
                const rawRow = (rawLeaderRows[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    response: readString(rawRow.response),
                    evidence: readString(rawRow.evidence),
                    action: readString(rawRow.action)
                }
            }),
            agreementsSynthesis: readString(evaluation.agreementsSynthesis)
        }
    }
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
                className={INPUT_CLASS}
            />
        </label>
    )
}

function TextAreaField({
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

export function WB9Digital() {
    const [state, setState] = useState<WB9State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<WorkbookPageId[]>([1])
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)
    const [showPurposeHelp, setShowPurposeHelp] = useState(false)
    const [showExecutiveBrandHelp, setShowExecutiveBrandHelp] = useState(false)
    const [showBrandValuesHelp, setShowBrandValuesHelp] = useState(false)
    const [showLeadershipArchetypeHelp, setShowLeadershipArchetypeHelp] = useState(false)
    const [showLinkedInProfileHelp, setShowLinkedInProfileHelp] = useState(false)
    const [showSocialCauseHelp, setShowSocialCauseHelp] = useState(false)
    const [showContentPlanHelp, setShowContentPlanHelp] = useState(false)
    const [showEvaluationHelp, setShowEvaluationHelp] = useState(false)
    const [evaluationStage, setEvaluationStage] = useState<EvaluationStageKey>('mentor')
    const [showEvaluationLevelReference, setShowEvaluationLevelReference] = useState(false)
    const [isLinkedInAuditLoading, setIsLinkedInAuditLoading] = useState(false)
    const [linkedInAuditMessage, setLinkedInAuditMessage] = useState('')
    const [linkedInAuditError, setLinkedInAuditError] = useState('')
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
            } else {
                setActivePage(1)
            }

            const storedVisited = window.localStorage.getItem(VISITED_STORAGE_KEY)
            if (storedVisited) {
                const parsedVisited = JSON.parse(storedVisited)
                if (Array.isArray(parsedVisited)) {
                    const normalizedVisited = parsedVisited
                        .map((value) => Number(value))
                        .filter((value): value is WorkbookPageId => Number.isInteger(value) && isWorkbookPageId(value))

                    if (normalizedVisited.length > 0) {
                        setVisitedPages(Array.from(new Set([1 as WorkbookPageId, ...normalizedVisited])) as WorkbookPageId[])
                    }
                }
            }
        } catch (error) {
            console.error('No se pudo restaurar el estado de WB9.', error)
            setState(DEFAULT_STATE)
            setActivePage(1)
            setVisitedPages([1])
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
        setVisitedPages((prev) => (prev.includes(2) ? prev : [...prev, 2]))
    }, [activePage, hasSeenPresentationOnce, isHydrated])

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
        saveFeedbackTimeoutRef.current = setTimeout(() => {
            setSaveFeedback('')
        }, 2600)
    }

    const markVisited = (pageId: WorkbookPageId) => {
        setVisitedPages((prev) => (prev.includes(pageId) ? prev : [...prev, pageId]))
    }

    const jumpToPage = (pageId: WorkbookPageId) => {
        setActivePage(pageId)
        markVisited(pageId)
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const savePage = (pageId: WorkbookPageId = activePage, message?: string) => {
        markVisited(pageId)
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
            window.localStorage.setItem(PAGE_STORAGE_KEY, String(pageId))
        }
        announceSave(message ?? `Página ${pageId} guardada en este navegador.`)
    }

    const updateIdentification = (field: keyof WB9State['identification'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateInventoryField = (field: InventoryFieldKey, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            purposeIntegrated: {
                ...prev.purposeIntegrated,
                inventory: {
                    ...prev.purposeIntegrated.inventory,
                    [field]: value
                }
            }
        }))
    }

    const updateContributionMatrixRow = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            purposeIntegrated: {
                ...prev.purposeIntegrated,
                contributionMatrix: prev.purposeIntegrated.contributionMatrix.map((row, rowIndex) =>
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

    const updateIntegratedPurpose = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            purposeIntegrated: {
                ...prev.purposeIntegrated,
                integratedPurpose: value
            }
        }))
    }

    const updateCoherenceCheck = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            purposeIntegrated: {
                ...prev.purposeIntegrated,
                coherenceChecks: prev.purposeIntegrated.coherenceChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: field === 'verdict' ? (value as YesNoAnswer) : value
                          }
                        : row
                )
            }
        }))
    }

    const updateLifeIntegrationRow = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            purposeIntegrated: {
                ...prev.purposeIntegrated,
                lifeIntegration: prev.purposeIntegrated.lifeIntegration.map((row, rowIndex) =>
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

    const savePurposeIntegratedBlock = (label: string) => {
        savePage(3, `${label} guardado.`)
    }

    const updateExecutiveBrandSignal = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveBrand: {
                ...prev.executiveBrand,
                currentSignals: prev.executiveBrand.currentSignals.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              reading: value
                          }
                        : row
                )
            }
        }))
    }

    const updateExecutiveBrandMatrixRow = (
        index: number,
        field: keyof ExecutiveBrandMatrixRow,
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveBrand: {
                ...prev.executiveBrand,
                differentiatorMatrix: prev.executiveBrand.differentiatorMatrix.map((row, rowIndex) =>
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

    const updateExecutiveBrandCanvasField = (field: ExecutiveBrandCanvasFieldKey, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveBrand: {
                ...prev.executiveBrand,
                canvas: {
                    ...prev.executiveBrand.canvas,
                    [field]: value
                }
            }
        }))
    }

    const updateExecutiveBrandPositioning = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveBrand: {
                ...prev.executiveBrand,
                positioningStatement: value
            }
        }))
    }

    const updateExecutiveBrandStrengthCheck = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveBrand: {
                ...prev.executiveBrand,
                strengthChecks: prev.executiveBrand.strengthChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: field === 'verdict' ? (value as YesNoAnswer) : value
                          }
                        : row
                )
            }
        }))
    }

    const saveExecutiveBrandBlock = (label: string) => {
        savePage(4, `${label} guardado.`)
    }

    const updateBrandValueInventory = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            brandValues: {
                ...prev.brandValues,
                inventory: prev.brandValues.inventory.map((item, itemIndex) => (itemIndex === index ? value : item))
            }
        }))
    }

    const updateBrandValuesMatrixRow = (index: number, field: keyof BrandValuesMatrixRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            brandValues: {
                ...prev.brandValues,
                valueMatrix: prev.brandValues.valueMatrix.map((row, rowIndex) =>
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

    const updateBrandCoreValue = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            brandValues: {
                ...prev.brandValues,
                coreValues: prev.brandValues.coreValues.map((item, itemIndex) => (itemIndex === index ? value : item))
            }
        }))
    }

    const updateBrandValueRankingRow = (index: number, field: keyof BrandValuesRankingRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            brandValues: {
                ...prev.brandValues,
                rankings: prev.brandValues.rankings.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: field === 'strategicReading' ? value : (value as RatingValue)
                          }
                        : row
                )
            }
        }))
    }

    const updateBrandValueNonNegotiable = (index: number, field: keyof BrandValueNonNegotiableRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            brandValues: {
                ...prev.brandValues,
                nonNegotiables: prev.brandValues.nonNegotiables.map((row, rowIndex) =>
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

    const updateBrandValueConsistencyCheck = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            brandValues: {
                ...prev.brandValues,
                consistencyChecks: prev.brandValues.consistencyChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: field === 'verdict' ? (value as YesNoAnswer) : value
                          }
                        : row
                )
            }
        }))
    }

    const saveBrandValuesBlock = (label: string) => {
        savePage(5, `${label} guardado.`)
    }

    const updateLeadershipArchetypeInventory = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            leadershipArchetype: {
                ...prev.leadershipArchetype,
                dominantTraits: prev.leadershipArchetype.dominantTraits.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              reading: value
                          }
                        : row
                )
            }
        }))
    }

    const toggleLeadershipArchetypeOption = (name: string) => {
        if (isLocked) return
        setState((prev) => {
            const isSelected = prev.leadershipArchetype.selectedArchetypes.includes(name)
            const nextSelected = isSelected
                ? prev.leadershipArchetype.selectedArchetypes.filter((item) => item !== name)
                : prev.leadershipArchetype.selectedArchetypes.length < 3
                  ? [...prev.leadershipArchetype.selectedArchetypes, name]
                  : prev.leadershipArchetype.selectedArchetypes

            const nextPrimary = nextSelected.includes(prev.leadershipArchetype.centralChoice.primary)
                ? prev.leadershipArchetype.centralChoice.primary
                : ''
            const nextSecondary = nextSelected.includes(prev.leadershipArchetype.centralChoice.secondary)
                ? prev.leadershipArchetype.centralChoice.secondary
                : ''

            return {
                ...prev,
                leadershipArchetype: {
                    ...prev.leadershipArchetype,
                    selectedArchetypes: nextSelected,
                    centralChoice: {
                        ...prev.leadershipArchetype.centralChoice,
                        primary: nextPrimary,
                        secondary: nextSecondary
                    }
                }
            }
        })
    }

    const updateLeadershipArchetypeChoice = (field: keyof LeadershipArchetypeChoice, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            leadershipArchetype: {
                ...prev.leadershipArchetype,
                centralChoice: {
                    ...prev.leadershipArchetype.centralChoice,
                    [field]: value
                }
            }
        }))
    }

    const updateLeadershipArchetypeExpressiveRow = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            leadershipArchetype: {
                ...prev.leadershipArchetype,
                expressiveCode: prev.leadershipArchetype.expressiveCode.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              definition: value
                          }
                        : row
                )
            }
        }))
    }

    const updateLeadershipArchetypeCoherenceCheck = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            leadershipArchetype: {
                ...prev.leadershipArchetype,
                coherenceChecks: prev.leadershipArchetype.coherenceChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: field === 'verdict' ? (value as YesNoAnswer) : value
                          }
                        : row
                )
            }
        }))
    }

    const saveLeadershipArchetypeBlock = (label: string) => {
        savePage(6, `${label} guardado.`)
    }

    const clipWords = (text: string, fallback: string, maxWords = 8) => {
        const source = text.trim().length > 0 ? text.trim() : fallback
        return source
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, maxWords)
            .join(' ')
    }

    const getLinkedInContext = () => {
        const role = state.identification.role.trim() || 'Líder ejecutivo'
        const professionalIdentity = state.executiveBrand.canvas.professionalIdentity.trim() || role
        const problem = state.executiveBrand.canvas.mainProblem.trim() || 'operaciones complejas'
        const transformation =
            state.executiveBrand.canvas.transformation.trim() || 'ventaja competitiva con impacto sostenible'
        const differentiator =
            state.executiveBrand.canvas.differentiator.trim() || 'visión estratégica y capacidad de ejecución'
        const tone =
            state.executiveBrand.canvas.tone.trim() || 'estratégico, reflexivo, humano; sereno, firme, claro y confiable'
        const audience =
            state.executiveBrand.canvas.audience.trim() || 'organizaciones y líderes que buscan crecer con criterio'
        const signal =
            state.executiveBrand.canvas.primarySignal.trim() || 'liderazgo sereno, claridad y visión de futuro'
        const purpose =
            state.purposeIntegrated.integratedPurpose.trim() || 'impulsar crecimiento real en personas y organizaciones'
        const desiredImpact =
            state.purposeIntegrated.inventory.desiredImpact.trim() || 'dejar una huella positiva en personas y organizaciones'
        const results =
            state.executiveBrand.differentiatorMatrix
                .map((row) => row.proof.trim())
                .filter(Boolean)
                .join('; ') ||
            'trayectoria visible en transformación, continuidad operativa y desarrollo de equipos'
        const symbol =
            state.leadershipArchetype.expressiveCode.find((row) => row.dimension === 'Símbolo que lo condensa')?.definition.trim() ||
            'faro'
        const archetype =
            state.leadershipArchetype.centralChoice.primary.trim() || 'liderazgo estratégico'
        const coreValues =
            state.brandValues.coreValues
                .filter((value) => value.trim().length > 0)
                .slice(0, 3)
                .join(', ') || 'coherencia, visión y responsabilidad'

        return {
            role,
            professionalIdentity,
            problem,
            transformation,
            differentiator,
            tone,
            audience,
            signal,
            purpose,
            desiredImpact,
            results,
            symbol,
            archetype,
            coreValues
        }
    }

    const buildSuggestedLinkedInHeadline = () => {
        const context = getLinkedInContext()
        return [
            `Transformo ${clipWords(context.problem, 'operaciones complejas', 5)} en ${clipWords(context.transformation, 'ventaja competitiva sostenible', 5)}`,
            clipWords(context.professionalIdentity, context.role, 6),
            clipWords(context.role, 'Líder ejecutivo', 4),
            clipWords(context.signal, 'criterio, claridad y liderazgo con impacto', 7)
        ].join(' | ')
    }

    const buildSuggestedLinkedInBanner = (): LinkedInBannerDesign => {
        const context = getLinkedInContext()
        return {
            mainPhrase: `Transformo ${context.problem.toLowerCase()} en ${context.transformation.toLowerCase()}.`,
            subtitle: clipWords(context.tone, 'liderazgo sereno, visión estratégica y decisiones que escalan', 12),
            visualSignal: `${context.symbol} / ${clipWords(context.signal, 'dirección estratégica y confianza', 6)}`,
            reinforces: `Que no soy solo ${context.role.toLowerCase()}; también aporto ${context.differentiator.toLowerCase()} y ${context.purpose.toLowerCase()}.`
        }
    }

    const buildSuggestedLinkedInAbout = () => {
        const context = getLinkedInContext()
        return [
            `Soy ${context.professionalIdentity.toLowerCase()} y hablo desde una trayectoria orientada a ${context.transformation.toLowerCase()}.`,
            `Me respaldan ${context.results}.`,
            `Resuelvo ${context.problem.toLowerCase()} para convertirla en ${context.transformation.toLowerCase()}.`,
            `Pienso y lidero desde ${context.tone.toLowerCase()}, con foco en ${context.coreValues.toLowerCase()}.`,
            `Quiero impactar a ${context.audience.toLowerCase()}.`,
            `Estoy construyendo un legado orientado a ${context.desiredImpact.toLowerCase()} desde ${context.archetype.toLowerCase()}.`
        ]
    }

    const buildSuggestedLinkedInProfileSections = (): LinkedInProfileSectionRow[] => {
        const context = getLinkedInContext()
        return [
            {
                section: 'Foto',
                communicates: 'Presencia ejecutiva, criterio y cercanía confiable.',
                missingToday: 'Más intención de marca conectada con tu tono.',
                priorityAdjustment: 'Elegir una foto que proyecte serenidad, claridad y liderazgo humano.'
            },
            {
                section: 'Banner',
                communicates: `La promesa de valor: ${context.transformation}.`,
                missingToday: 'Mayor señal estratégica y recordación simbólica.',
                priorityAdjustment: `Diseñar un banner que use ${context.symbol.toLowerCase()} y refuerce ${context.signal.toLowerCase()}.`
            },
            {
                section: 'Headline',
                communicates: 'Transformación, especialidad y diferenciador.',
                missingToday: 'Más foco en propuesta de valor y menos dependencia del cargo.',
                priorityAdjustment: 'Reescribir con verbo de transformación, territorio y sello de liderazgo.'
            },
            {
                section: 'Acerca de',
                communicates: 'Trayectoria, problema, valor, pensamiento y visión.',
                missingToday: 'Más narrativa de credibilidad y menos biografía lineal.',
                priorityAdjustment: 'Reestructurar en bloques que conecten experiencia, resultados, criterio y legado.'
            },
            {
                section: 'Experiencia',
                communicates: 'Resultados, contexto e impacto visible.',
                missingToday: 'Más evidencia concreta y menos descripción de funciones.',
                priorityAdjustment: `Reescribir cargos con foco en ${context.results.toLowerCase()}.`
            },
            {
                section: 'Destacados',
                communicates: 'Prueba reputacional y pensamiento visible.',
                missingToday: 'Pocas piezas estratégicas que refuercen tu autoridad.',
                priorityAdjustment: 'Subir casos, artículos, entrevistas o logros que prueben criterio y transformación.'
            },
            {
                section: 'Actividad',
                communicates: 'Pensamiento propio, criterio y consistencia.',
                missingToday: 'Baja frecuencia de visibilidad por ideas.',
                priorityAdjustment: 'Activar una presencia mínima por pensamiento, no solo por historial.'
            }
        ]
    }

    const updateLinkedInProfileUrl = (value: string) => {
        if (isLocked) return
        setLinkedInAuditError('')
        setLinkedInAuditMessage('')
        setState((prev) => ({
            ...prev,
            linkedInProfile: {
                ...prev.linkedInProfile,
                profileUrl: value
            }
        }))
    }

    const updateLinkedInAuditRow = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            linkedInProfile: {
                ...prev.linkedInProfile,
                audit: prev.linkedInProfile.audit.map((row, rowIndex) =>
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

    const updateLinkedInHeadline = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            linkedInProfile: {
                ...prev.linkedInProfile,
                strategicHeadline: value
            }
        }))
    }

    const updateLinkedInBannerField = (field: LinkedInBannerFieldKey, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            linkedInProfile: {
                ...prev.linkedInProfile,
                banner: {
                    ...prev.linkedInProfile.banner,
                    [field]: value
                }
            }
        }))
    }

    const updateLinkedInAboutRow = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            linkedInProfile: {
                ...prev.linkedInProfile,
                aboutMatrix: prev.linkedInProfile.aboutMatrix.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              formulation: value
                          }
                        : row
                )
            }
        }))
    }

    const updateLinkedInProfileSectionRow = (
        index: number,
        field: keyof LinkedInProfileSectionRow,
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            linkedInProfile: {
                ...prev.linkedInProfile,
                profileSections: prev.linkedInProfile.profileSections.map((row, rowIndex) =>
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

    const updateLinkedInOptimizationCheck = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            linkedInProfile: {
                ...prev.linkedInProfile,
                optimizationChecks: prev.linkedInProfile.optimizationChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: field === 'verdict' ? (value as YesNoAnswer) : value
                          }
                        : row
                )
            }
        }))
    }

    const saveLinkedInProfileBlock = (label: string) => {
        savePage(7, `${label} guardado.`)
    }

    const updateSocialCausePossible = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            socialCause: {
                ...prev.socialCause,
                possibleCauses: prev.socialCause.possibleCauses.map((item, itemIndex) => (itemIndex === index ? value : item))
            }
        }))
    }

    const updateSocialCauseLegitimacyRow = (
        index: number,
        field: keyof SocialCauseLegitimacyRow,
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            socialCause: {
                ...prev.socialCause,
                legitimacyMatrix: prev.socialCause.legitimacyMatrix.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]:
                                  field === 'possibleCause'
                                      ? value
                                      : (value as RatingValue)
                          }
                        : row
                )
            }
        }))
    }

    const updateSocialCauseStrategicCause = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            socialCause: {
                ...prev.socialCause,
                strategicCause: value
            }
        }))
    }

    const updateSocialCauseMapRow = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            socialCause: {
                ...prev.socialCause,
                causeMap: prev.socialCause.causeMap.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              formulation: value
                          }
                        : row
                )
            }
        }))
    }

    const updateSocialCauseActivationVehicle = (
        index: number,
        field: keyof SocialCauseActivationRow,
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            socialCause: {
                ...prev.socialCause,
                activationVehicles: prev.socialCause.activationVehicles.map((row, rowIndex) =>
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

    const updateSocialCauseLegitimacyCheck = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            socialCause: {
                ...prev.socialCause,
                legitimacyChecks: prev.socialCause.legitimacyChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: field === 'verdict' ? (value as YesNoAnswer) : value
                          }
                        : row
                )
            }
        }))
    }

    const saveSocialCauseBlock = (label: string) => {
        savePage(8, `${label} guardado.`)
    }

    const updateContentPlanSignalField = (field: keyof ContentPlanSignal, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            contentPlan: {
                ...prev.contentPlan,
                centralSignal: {
                    ...prev.contentPlan.centralSignal,
                    [field]: value
                }
            }
        }))
    }

    const updateContentPlanPillarRow = (index: number, field: keyof ContentPlanPillarRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            contentPlan: {
                ...prev.contentPlan,
                pillars: prev.contentPlan.pillars.map((row, rowIndex) =>
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

    const updateContentPlanMatrixRow = (index: number, field: keyof ContentPlanMatrixRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            contentPlan: {
                ...prev.contentPlan,
                contentMatrix: prev.contentPlan.contentMatrix.map((row, rowIndex) =>
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

    const updateContentPlanCalendarRow = (index: number, field: keyof ContentPlanCalendarRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            contentPlan: {
                ...prev.contentPlan,
                calendar: prev.contentPlan.calendar.map((row, rowIndex) =>
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

    const updateContentPlanBacklogRow = (index: number, field: keyof ContentPlanBacklogRow, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            contentPlan: {
                ...prev.contentPlan,
                backlog: prev.contentPlan.backlog.map((row, rowIndex) =>
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

    const updateContentPlanCadenceField = (field: keyof ContentPlanCadence, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            contentPlan: {
                ...prev.contentPlan,
                cadence: {
                    ...prev.contentPlan.cadence,
                    [field]: value
                }
            }
        }))
    }

    const updateContentPlanCheck = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            contentPlan: {
                ...prev.contentPlan,
                coherenceChecks: prev.contentPlan.coherenceChecks.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]: field === 'verdict' ? (value as YesNoAnswer) : value
                          }
                        : row
                )
            }
        }))
    }

    const saveContentPlanBlock = (label: string) => {
        savePage(9, `${label} guardado.`)
    }

    const updateEvaluationMentorRow = (index: number, field: keyof Omit<EvaluationMentorRow, 'criterion'>, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            evaluation: {
                ...prev.evaluation,
                mentorRows: prev.evaluation.mentorRows.map((row, rowIndex) =>
                    rowIndex === index
                        ? {
                              ...row,
                              [field]:
                                  field === 'level'
                                      ? ((MENTOR_LEVEL_OPTIONS.includes(value as MentorLevel) ? value : '') as MentorLevel)
                                      : field === 'decision'
                                        ? ((MENTOR_DECISION_OPTIONS.includes(value as MentorDecision) ? value : '') as MentorDecision)
                                        : value
                          }
                        : row
                )
            }
        }))
    }

    const setEvaluationMentorGeneralNotes = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            evaluation: {
                ...prev.evaluation,
                mentorGeneralNotes: value
            }
        }))
    }

    const setEvaluationMentorGlobalDecision = (value: string) => {
        if (isLocked) return
        const safeDecision = MENTOR_DECISION_OPTIONS.includes(value as MentorDecision) ? (value as MentorDecision) : ''
        setState((prev) => ({
            ...prev,
            evaluation: {
                ...prev.evaluation,
                mentorGlobalDecision: safeDecision
            }
        }))
    }

    const updateEvaluationLeaderRow = (index: number, field: keyof Omit<EvaluationLeaderRow, 'question'>, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            evaluation: {
                ...prev.evaluation,
                leaderRows: prev.evaluation.leaderRows.map((row, rowIndex) =>
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

    const setEvaluationAgreementsSynthesis = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            evaluation: {
                ...prev.evaluation,
                agreementsSynthesis: value
            }
        }))
    }

    const saveEvaluationBlock = (label: string) => {
        savePage(10, `${label} guardado.`)
    }

    const changeEvaluationStage = (stage: EvaluationStageKey) => {
        setEvaluationStage(stage)
    }

    const goPrevEvaluationStage = () => {
        const currentIndex = EVALUATION_STAGES.findIndex((stage) => stage.key === evaluationStage)
        if (currentIndex <= 0) return
        setEvaluationStage(EVALUATION_STAGES[currentIndex - 1].key)
    }

    const goNextEvaluationStage = () => {
        const currentIndex = EVALUATION_STAGES.findIndex((stage) => stage.key === evaluationStage)
        if (currentIndex < 0 || currentIndex >= EVALUATION_STAGES.length - 1) return
        setEvaluationStage(EVALUATION_STAGES[currentIndex + 1].key)
    }

    const assistLinkedInAudit = async () => {
        if (isLocked || isLinkedInAuditLoading) return

        const profileUrl = state.linkedInProfile.profileUrl.trim()
        if (!profileUrl) {
            setLinkedInAuditError('Agrega una URL pública de LinkedIn para analizar este bloque.')
            setLinkedInAuditMessage('')
            return
        }

        try {
            setIsLinkedInAuditLoading(true)
            setLinkedInAuditError('')

            const response = await fetch('/api/workbooks-v2/wb9/linkedin-audit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profileUrl,
                    currentAudit: state.linkedInProfile.audit
                })
            })

            const payload = (await response.json()) as LinkedInAuditApiResponse
            if (!response.ok) {
                throw new Error(payload.error || 'No fue posible analizar esta URL de LinkedIn en este momento.')
            }

            const orderedAudit = LINKEDIN_AUDIT_DIMENSIONS.map((dimension) => {
                const match = payload.audit?.find((row) => row.dimension === dimension)
                return {
                    dimension,
                    response: typeof match?.response === 'string' ? match.response : ''
                }
            })

            setState((prev) => ({
                ...prev,
                linkedInProfile: {
                    ...prev.linkedInProfile,
                    audit: orderedAudit
                }
            }))

            setLinkedInAuditMessage(payload.note || '')
            announceSave(
                payload.publicEvidenceStatus === 'partial'
                    ? 'Análisis IA listo con evidencia pública parcial.'
                    : 'Análisis IA del perfil de LinkedIn listo.'
            )
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No fue posible analizar esta URL de LinkedIn en este momento.'
            setLinkedInAuditError(message)
            setLinkedInAuditMessage('')
        } finally {
            setIsLinkedInAuditLoading(false)
        }
    }

    const assistLinkedInHeadline = () => {
        updateLinkedInHeadline(buildSuggestedLinkedInHeadline())
        announceSave('Borrador IA para el Headline listo.')
    }

    const assistLinkedInBanner = () => {
        const suggestion = buildSuggestedLinkedInBanner()
        setState((prev) => ({
            ...prev,
            linkedInProfile: {
                ...prev.linkedInProfile,
                banner: suggestion
            }
        }))
        announceSave('Borrador IA para el banner listo.')
    }

    const assistLinkedInAbout = () => {
        const suggestions = buildSuggestedLinkedInAbout()
        setState((prev) => ({
            ...prev,
            linkedInProfile: {
                ...prev.linkedInProfile,
                aboutMatrix: LINKEDIN_ABOUT_BLOCKS.map((block, index) => ({
                    block,
                    formulation: suggestions[index]
                }))
            }
        }))
        announceSave('Borrador IA para el “Acerca de” listo.')
    }

    const assistLinkedInProfileSections = () => {
        setState((prev) => ({
            ...prev,
            linkedInProfile: {
                ...prev.linkedInProfile,
                profileSections: buildSuggestedLinkedInProfileSections()
            }
        }))
        announceSave('Borrador IA para las secciones críticas del perfil listo.')
    }

    const assistLinkedInOptimization = () => {
        const headline = state.linkedInProfile.strategicHeadline.trim()
        const bannerFilled = Object.values(state.linkedInProfile.banner).every((value) => value.trim().length > 0)
        const aboutFilled = state.linkedInProfile.aboutMatrix.every((row) => row.formulation.trim().length > 0)
        const thoughtVisible =
            state.linkedInProfile.profileSections.find((row) => row.section === 'Actividad')?.priorityAdjustment.trim().length ?? 0
        const proofVisible =
            state.linkedInProfile.aboutMatrix[1]?.formulation.trim().length > 0 ||
            state.linkedInProfile.profileSections.find((row) => row.section === 'Experiencia')?.communicates.trim().length

        const suggestions: Array<{ verdict: YesNoAnswer; adjustment: string }> = [
            {
                verdict: headline.trim().length > 0 && /(transform|conviert|impuls|ventaja|liderazgo|estrateg)/i.test(headline) ? 'yes' : 'no',
                adjustment: headline.trim().length > 0 && /(transform|conviert|impuls|ventaja|liderazgo|estrateg)/i.test(headline)
                    ? 'Mantener foco en transformación y evitar que el cargo vuelva a ocupar todo el espacio.'
                    : 'Reescribe el Headline para que comunique transformación, especialidad o diferenciador.'
            },
            {
                verdict: bannerFilled ? 'yes' : 'no',
                adjustment: bannerFilled
                    ? 'Asegura que el banner refuerce promesa de valor y símbolo de marca.'
                    : 'Define banner con promesa principal, subtítulo y señal simbólica.'
            },
            {
                verdict: aboutFilled ? 'yes' : 'no',
                adjustment: aboutFilled
                    ? 'Revisa que cada bloque conecte experiencia, problema, valor y visión sin sonar biográfico.'
                    : 'Conecta más trayectoria con problema, valor y visión.'
            },
            {
                verdict: thoughtVisible ? 'yes' : 'no',
                adjustment: thoughtVisible
                    ? 'Mantén una presencia mínima que haga visible tu pensamiento con regularidad.'
                    : 'Activa una presencia mínima por pensamiento, no solo por historial.'
            },
            {
                verdict: proofVisible ? 'yes' : 'no',
                adjustment: proofVisible
                    ? 'Haz que la prueba reputacional esté visible en experiencia, destacados o actividad.'
                    : 'Incluye resultados, casos o señales de credibilidad.'
            },
            {
                verdict: bannerFilled && aboutFilled && headline.trim().length > 0 ? 'yes' : 'no',
                adjustment: bannerFilled && aboutFilled && headline.trim().length > 0
                    ? 'Sigue reforzando coherencia entre propuesta de valor, tono y evidencia.'
                    : 'Completa las piezas críticas para que el perfil pueda abrir oportunidades reales.'
            }
        ]

        setState((prev) => ({
            ...prev,
            linkedInProfile: {
                ...prev.linkedInProfile,
                optimizationChecks: LINKEDIN_OPTIMIZATION_QUESTIONS.map((question, index) => ({
                    question,
                    verdict: suggestions[index].verdict,
                    adjustment: suggestions[index].adjustment
                }))
            }
        }))
        announceSave('Borrador IA para el test de optimización listo.')
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
            document.title = 'WB9 - Latido de marca'
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
            link.download = 'WB9-latido-de-marca.html'
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

    const inventoryValues = PURPOSE_INVENTORY_FIELDS.map((field) => state.purposeIntegrated.inventory[field.key])
    const inventoryComplete = inventoryValues.every((value) => value.trim().length > 0)
    const contributionMatrixComplete = state.purposeIntegrated.contributionMatrix.every((row) => row.response.trim().length > 0)
    const integratedPurposeComplete = state.purposeIntegrated.integratedPurpose.trim().length > 0
    const coherenceComplete = state.purposeIntegrated.coherenceChecks.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const lifeIntegrationComplete = state.purposeIntegrated.lifeIntegration.every((row) => row.vision.trim().length > 0)
    const purposeIntegratedComplete =
        inventoryComplete && contributionMatrixComplete && integratedPurposeComplete && coherenceComplete && lifeIntegrationComplete

    const normalizedPurpose = state.purposeIntegrated.integratedPurpose.trim().toLowerCase()
    const purposeWordCount = normalizedPurpose.split(/\s+/).filter(Boolean).length
    const hasTransformationSignal =
        /(transform|impuls|desarroll|cambi|movil|fortale|gui|inspira|activar|mejor|constru|facilita|orden)/.test(normalizedPurpose)
    const hasAudienceSignal = /(personas|organizaciones|equipos|líderes|lideres|sociedad|ecosistemas|comunidades|clientes)/.test(
        normalizedPurpose
    )
    const hasContributionSignal = /(impact|huella|contrib|serv|transform|desarroll|sosten|cambio|legado)/.test(normalizedPurpose)
    const showAbstractPurposeSuggestion =
        normalizedPurpose.length > 0 && (purposeWordCount < 8 || !hasTransformationSignal || !hasAudienceSignal)
    const showContributionSuggestion = normalizedPurpose.length > 0 && !hasContributionSignal

    const lifeIntegrationScores = state.purposeIntegrated.lifeIntegration.map((row) => buildDefinitionScore(row.vision))
    const lifeIntegrationFilledCount = state.purposeIntegrated.lifeIntegration.filter((row) => row.vision.trim().length > 0).length
    const maxLifeScore = Math.max(...lifeIntegrationScores, 0)
    const minFilledLifeScore = lifeIntegrationScores.filter((score) => score > 0).length
        ? Math.min(...lifeIntegrationScores.filter((score) => score > 0))
        : 0
    const workAreaDefined = state.purposeIntegrated.lifeIntegration[0]?.vision.trim().length > 0
    const showLifeIntegrationSuggestion =
        (lifeIntegrationFilledCount > 0 && lifeIntegrationFilledCount <= 3) ||
        (workAreaDefined && lifeIntegrationFilledCount <= 4) ||
        maxLifeScore - minFilledLifeScore >= 5

    const incoherentRows = state.purposeIntegrated.coherenceChecks.filter((row) => row.verdict === 'no')
    const showCoherenceSuggestion = incoherentRows.length > 0

    const executiveBrandSignalsComplete = state.executiveBrand.currentSignals.every((row) => row.reading.trim().length > 0)
    const executiveBrandMatrixComplete = state.executiveBrand.differentiatorMatrix.every((row) =>
        Object.values(row).every((value) => value.trim().length > 0)
    )
    const executiveBrandCanvasValues = Object.values(state.executiveBrand.canvas)
    const executiveBrandCanvasComplete = executiveBrandCanvasValues.every((value) => value.trim().length > 0)
    const executiveBrandPositioningComplete = state.executiveBrand.positioningStatement.trim().length > 0
    const executiveBrandStrengthComplete = state.executiveBrand.strengthChecks.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const executiveBrandComplete =
        executiveBrandSignalsComplete &&
        executiveBrandMatrixComplete &&
        executiveBrandCanvasComplete &&
        executiveBrandPositioningComplete &&
        executiveBrandStrengthComplete

    const brandPageHasContent =
        state.executiveBrand.currentSignals.some((row) => row.reading.trim().length > 0) ||
        state.executiveBrand.differentiatorMatrix.some((row) => Object.values(row).some((value) => value.trim().length > 0)) ||
        executiveBrandCanvasValues.some((value) => value.trim().length > 0) ||
        state.executiveBrand.positioningStatement.trim().length > 0

    const normalizedBrandDifferentiationText = [
        ...state.executiveBrand.currentSignals.map((row) => row.reading),
        state.executiveBrand.canvas.differentiator,
        state.executiveBrand.canvas.tone,
        state.executiveBrand.positioningStatement
    ]
        .join(' ')
        .trim()
        .toLowerCase()
    const hasGenericBrandTraits =
        /(estratégic|estrategic|apasionad|resilien|confiable|innovador|innovadora|humano|humana|líder|lider|proactiv|comprometid|firme|claro|clara|sereno|serena|reflexiv|responsable)/.test(
            normalizedBrandDifferentiationText
        )
    const hasBrandProblemOrProofSignal =
        /(problema|crisis|operativ|resultado|impact|evidenc|prueba|testimoni|trayector|millones|casos|transform|ventaja|sostenible|negociaciones|continuidad|audiencia)/.test(
            normalizedBrandDifferentiationText
        )
    const showGenericBrandSuggestion =
        normalizedBrandDifferentiationText.length > 0 && hasGenericBrandTraits && !hasBrandProblemOrProofSignal

    const hasAudienceDefined =
        state.executiveBrand.canvas.audience.trim().length > 0 ||
        state.executiveBrand.differentiatorMatrix.some((row) => row.audience.trim().length > 0) ||
        /(organizaciones|equipos|líderes|lideres|empresas|presidentes|gerentes|comités|comites|stakeholders|clientes|dirección|direccion)/.test(
            state.executiveBrand.positioningStatement.trim().toLowerCase()
        )
    const showBrandAudienceSuggestion = brandPageHasContent && !hasAudienceDefined

    const hasBrandEvidence =
        state.executiveBrand.differentiatorMatrix.some((row) => row.proof.trim().length > 0) ||
        /(resultados|trayectoria|impacto|casos|testimonios|evidencia|prueba|millones|experiencia)/.test(
            state.executiveBrand.positioningStatement.trim().toLowerCase()
        )
    const showBrandEvidenceSuggestion = brandPageHasContent && !hasBrandEvidence

    const normalizedBrandPositioning = state.executiveBrand.positioningStatement.trim()
    const brandPositioningWordCount = normalizedBrandPositioning.split(/\s+/).filter(Boolean).length
    const showBrandLengthSuggestion = normalizedBrandPositioning.length > 0 && brandPositioningWordCount > 28

    const availableBrandValueOptions = Array.from(
        new Set(state.brandValues.inventory.map((value) => value.trim()).filter((value) => value.length > 0))
    )
    const resolvedBrandValuesMatrix = state.brandValues.valueMatrix.map((row, index) => ({
        ...row,
        value: row.value.trim().length > 0 ? row.value : availableBrandValueOptions[index] ?? ''
    }))
    const mandatoryBrandValuesComplete = state.brandValues.inventory.slice(0, 10).every((value) => value.trim().length > 0)
    const brandValuesMatrixComplete = resolvedBrandValuesMatrix.every(
        (row) =>
            row.value.trim().length > 0 &&
            row.meaning.trim().length > 0 &&
            row.behavior.trim().length > 0 &&
            row.proof.trim().length > 0 &&
            row.weakener.trim().length > 0
    )
    const coreBrandValuesComplete = state.brandValues.coreValues.every((value) => value.trim().length > 0)
    const resolvedBrandValueRankings = state.brandValues.rankings.map((row, index) => {
        const importance = row.importance === '' ? 0 : Number(row.importance)
        const evidence = row.evidence === '' ? 0 : Number(row.evidence)
        return {
            ...row,
            value: state.brandValues.coreValues[index] ?? '',
            gap: row.importance !== '' && row.evidence !== '' ? Math.abs(importance - evidence) : null
        }
    })
    const brandValuesRankingComplete = resolvedBrandValueRankings.every(
        (row) =>
            row.value.trim().length > 0 &&
            row.importance !== '' &&
            row.evidence !== '' &&
            row.strategicReading.trim().length > 0
    )
    const brandValueNonNegotiablesComplete = state.brandValues.nonNegotiables.every(
        (row) => row.principle.trim().length > 0 && row.cost.trim().length > 0
    )
    const brandValueConsistencyComplete = state.brandValues.consistencyChecks.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const brandValuesComplete =
        mandatoryBrandValuesComplete &&
        brandValuesMatrixComplete &&
        coreBrandValuesComplete &&
        brandValuesRankingComplete &&
        brandValueNonNegotiablesComplete &&
        brandValueConsistencyComplete

    const hasBrandValuesContent =
        state.brandValues.inventory.some((value) => value.trim().length > 0) ||
        state.brandValues.valueMatrix.some((row) => Object.values(row).some((value) => value.trim().length > 0)) ||
        state.brandValues.coreValues.some((value) => value.trim().length > 0) ||
        state.brandValues.rankings.some((row) => row.importance !== '' || row.evidence !== '' || row.strategicReading.trim().length > 0) ||
        state.brandValues.nonNegotiables.some((row) => row.principle.trim().length > 0 || row.cost.trim().length > 0)

    const showBrandValuesBehaviorSuggestion =
        hasBrandValuesContent &&
        resolvedBrandValuesMatrix.some((row) => row.value.trim().length > 0 && row.behavior.trim().length === 0)
    const showBrandValuesEvidenceMaxSuggestion =
        coreBrandValuesComplete && resolvedBrandValueRankings.every((row) => row.evidence === '5')
    const showBrandValuesNonNegotiableSuggestion =
        hasBrandValuesContent &&
        state.brandValues.nonNegotiables.every((row) => row.principle.trim().length === 0 && row.cost.trim().length === 0)
    const reputationConsistencyRow = state.brandValues.consistencyChecks.find(
        (row) => row.question === '¿Mi reputación confirma esos valores?'
    )
    const showBrandValuesReputationSuggestion = reputationConsistencyRow?.verdict === 'no'

    const leadershipArchetypeInventoryComplete = state.leadershipArchetype.dominantTraits.every(
        (row) => row.reading.trim().length > 0
    )
    const leadershipArchetypeSelectedComplete = state.leadershipArchetype.selectedArchetypes.length === 3
    const archetypePrimaryValid = state.leadershipArchetype.selectedArchetypes.includes(state.leadershipArchetype.centralChoice.primary)
    const archetypeSecondaryValid =
        state.leadershipArchetype.centralChoice.secondary.trim().length === 0 ||
        state.leadershipArchetype.selectedArchetypes.includes(state.leadershipArchetype.centralChoice.secondary)
    const leadershipArchetypeChoiceComplete =
        archetypePrimaryValid &&
        archetypeSecondaryValid &&
        state.leadershipArchetype.centralChoice.reason.trim().length > 0 &&
        state.leadershipArchetype.centralChoice.visibleTraits.trim().length > 0 &&
        state.leadershipArchetype.centralChoice.credibility.trim().length > 0
    const leadershipArchetypeExpressiveComplete = state.leadershipArchetype.expressiveCode.every(
        (row) => row.definition.trim().length > 0
    )
    const leadershipArchetypeCoherenceComplete = state.leadershipArchetype.coherenceChecks.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const leadershipArchetypeComplete =
        leadershipArchetypeInventoryComplete &&
        leadershipArchetypeSelectedComplete &&
        leadershipArchetypeChoiceComplete &&
        leadershipArchetypeExpressiveComplete &&
        leadershipArchetypeCoherenceComplete

    const selectedLeadershipArchetypeOptions = state.leadershipArchetype.selectedArchetypes
        .map((name) => LEADERSHIP_ARCHETYPE_OPTIONS.find((option) => option.name === name))
        .filter((option): option is (typeof LEADERSHIP_ARCHETYPE_OPTIONS)[number] => Boolean(option))

    const leadershipArchetypeHasContent =
        state.leadershipArchetype.dominantTraits.some((row) => row.reading.trim().length > 0) ||
        state.leadershipArchetype.selectedArchetypes.length > 0 ||
        Object.values(state.leadershipArchetype.centralChoice).some((value) => value.trim().length > 0) ||
        state.leadershipArchetype.expressiveCode.some((row) => row.definition.trim().length > 0)

    const showArchetypeVisibleTraitsSuggestion =
        state.leadershipArchetype.centralChoice.primary.trim().length > 0 &&
        state.leadershipArchetype.centralChoice.visibleTraits.trim().length === 0
    const showArchetypeCredibilitySuggestion =
        state.leadershipArchetype.centralChoice.primary.trim().length > 0 &&
        state.leadershipArchetype.centralChoice.credibility.trim().length === 0
    const expressiveArchetypeText = state.leadershipArchetype.expressiveCode.map((row) => row.definition).join(' ').trim()
    const expressiveArchetypeWordCount = expressiveArchetypeText.split(/\s+/).filter(Boolean).length
    const showArchetypeAbstractSuggestion =
        expressiveArchetypeText.length > 0 &&
        (expressiveArchetypeWordCount < 18 ||
            state.leadershipArchetype.expressiveCode.slice(0, 4).some((row) => row.definition.trim().length < 12))
    const showArchetypeShadowSuggestion =
        leadershipArchetypeHasContent && selectedLeadershipArchetypeOptions.length === 0

    const linkedInAuditComplete =
        state.linkedInProfile.profileUrl.trim().length > 0 &&
        state.linkedInProfile.audit.every((row) => row.response.trim().length > 0)
    const linkedInHeadlineComplete = state.linkedInProfile.strategicHeadline.trim().length > 0
    const linkedInBannerComplete = Object.values(state.linkedInProfile.banner).every((value) => value.trim().length > 0)
    const linkedInAboutComplete = state.linkedInProfile.aboutMatrix.every((row) => row.formulation.trim().length > 0)
    const linkedInSectionsComplete = state.linkedInProfile.profileSections.every(
        (row) =>
            row.communicates.trim().length > 0 &&
            row.missingToday.trim().length > 0 &&
            row.priorityAdjustment.trim().length > 0
    )
    const linkedInOptimizationComplete = state.linkedInProfile.optimizationChecks.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const linkedInProfileComplete =
        linkedInAuditComplete &&
        linkedInHeadlineComplete &&
        linkedInBannerComplete &&
        linkedInAboutComplete &&
        linkedInSectionsComplete &&
        linkedInOptimizationComplete

    const normalizedLinkedInHeadline = state.linkedInProfile.strategicHeadline.trim().toLowerCase()
    const linkedInHeadlineLooksLikeRoleOnly =
        normalizedLinkedInHeadline.length > 0 &&
        !/(transform|conviert|impuls|ventaja|diferenci|criterio|impact|estrateg|liderazgo)/.test(normalizedLinkedInHeadline) &&
        normalizedLinkedInHeadline.split(/\s+/).filter(Boolean).length <= 10
    const linkedInAboutNarrativeDepth =
        (state.linkedInProfile.aboutMatrix[2]?.formulation.trim().length ?? 0) +
        (state.linkedInProfile.aboutMatrix[3]?.formulation.trim().length ?? 0) +
        (state.linkedInProfile.aboutMatrix[5]?.formulation.trim().length ?? 0)
    const linkedInAboutBioWeight =
        (state.linkedInProfile.aboutMatrix[0]?.formulation.trim().length ?? 0) +
        (state.linkedInProfile.aboutMatrix[1]?.formulation.trim().length ?? 0)
    const showLinkedInBioSuggestion =
        linkedInAboutBioWeight > 0 && linkedInAboutNarrativeDepth > 0 && linkedInAboutBioWeight > linkedInAboutNarrativeDepth
    const hasLinkedInProofVisible =
        state.linkedInProfile.aboutMatrix[1]?.formulation.trim().length > 0 ||
        state.linkedInProfile.profileSections.some(
            (row) =>
                row.section === 'Experiencia' || row.section === 'Destacados'
                    ? row.communicates.trim().length > 0 || row.priorityAdjustment.trim().length > 0
                    : false
        )
    const showLinkedInProofSuggestion =
        state.linkedInProfile.strategicHeadline.trim().length > 0 &&
        state.linkedInProfile.aboutMatrix.some((row) => row.formulation.trim().length > 0) &&
        !hasLinkedInProofVisible
    const linkedInActivityRow = state.linkedInProfile.profileSections.find((row) => row.section === 'Actividad')
    const showLinkedInActivitySuggestion =
        Boolean(
            state.linkedInProfile.strategicHeadline.trim().length > 0 &&
                (!linkedInActivityRow ||
                    (linkedInActivityRow.communicates.trim().length === 0 &&
                        linkedInActivityRow.missingToday.trim().length === 0 &&
                        linkedInActivityRow.priorityAdjustment.trim().length === 0))
        )

    const socialCauseInventoryComplete = state.socialCause.possibleCauses.every((cause) => cause.trim().length > 0)
    const socialCauseLegitimacyComplete = state.socialCause.legitimacyMatrix.every(
        (row) =>
            row.possibleCause.trim().length > 0 &&
            row.storyConnection !== '' &&
            row.purposeCoherence !== '' &&
            row.contributionCapacity !== '' &&
            row.externalCredibility !== '' &&
            row.footprintPotential !== ''
    )
    const socialCauseStrategicComplete = state.socialCause.strategicCause.trim().length > 0
    const socialCauseMapComplete = state.socialCause.causeMap.every((row) => row.formulation.trim().length > 0)
    const socialCauseActivationComplete = state.socialCause.activationVehicles.every(
        (row) =>
            row.vehicle.trim().length > 0 &&
            row.concreteAction.trim().length > 0 &&
            row.impactedAudience.trim().length > 0 &&
            row.visibleSignal.trim().length > 0
    )
    const socialCauseChecksComplete = state.socialCause.legitimacyChecks.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const socialCauseComplete =
        socialCauseInventoryComplete &&
        socialCauseLegitimacyComplete &&
        socialCauseStrategicComplete &&
        socialCauseMapComplete &&
        socialCauseActivationComplete &&
        socialCauseChecksComplete

    const socialCauseWordCount = state.socialCause.strategicCause.trim().split(/\s+/).filter(Boolean).length
    const showSocialCauseAbstractSuggestion =
        state.socialCause.strategicCause.trim().length > 0 &&
        (socialCauseWordCount < 8 ||
            !/(latinoam|empresa|organizacion|equipo|lider|persona|comunidad|territorio|industr|sistema)/i.test(
                state.socialCause.strategicCause
            ))
    const trajectoryLegitimacyRow = state.socialCause.legitimacyChecks.find(
        (row) => row.question === '¿Es creíble desde mi trayectoria?'
    )
    const showSocialCauseTrajectorySuggestion = trajectoryLegitimacyRow?.verdict === 'no'
    const socialCauseHasActivationContent = state.socialCause.activationVehicles.some(
        (row) =>
            row.vehicle.trim().length > 0 ||
            row.concreteAction.trim().length > 0 ||
            row.impactedAudience.trim().length > 0 ||
            row.visibleSignal.trim().length > 0
    )
    const showSocialCauseActivationSuggestion =
        state.socialCause.strategicCause.trim().length > 0 && !socialCauseHasActivationContent
    const causeFocusRow = state.socialCause.legitimacyChecks.find(
        (row) => row.question === '¿Amplía mi marca y no la dispersa?'
    )
    const showSocialCauseDecorativeSuggestion = causeFocusRow?.verdict === 'no'

    const contentPlanSignalComplete = Object.values(state.contentPlan.centralSignal).every((value) => value.trim().length > 0)
    const contentPlanPillarsComplete = state.contentPlan.pillars.every(
        (row) => row.whatToShow.trim().length > 0 && row.reinforcedPerception.trim().length > 0
    )
    const contentPlanMatrixComplete = state.contentPlan.contentMatrix.every(
        (row) =>
            row.piece.trim().length > 0 &&
            row.pillar.trim().length > 0 &&
            row.channel.trim().length > 0 &&
            row.objective.trim().length > 0 &&
            row.brandSignal.trim().length > 0
    )
    const contentPlanCalendarComplete = state.contentPlan.calendar.every(
        (row) =>
            row.stretchObjective.trim().length > 0 &&
            row.prioritizedContent.trim().length > 0 &&
            row.mainChannel.trim().length > 0 &&
            row.expectedResult.trim().length > 0
    )
    const contentPlanBacklogComplete = state.contentPlan.backlog.every(
        (row) =>
            row.piece.trim().length > 0 &&
            row.pillar.trim().length > 0 &&
            row.horizon.trim().length > 0 &&
            row.channelFormat.trim().length > 0 &&
            row.objective.trim().length > 0 &&
            row.priority.trim().length > 0
    )
    const contentPlanCadenceComplete = Object.values(state.contentPlan.cadence).every((value) => value.trim().length > 0)
    const contentPlanChecksComplete = state.contentPlan.coherenceChecks.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const contentPlanComplete =
        contentPlanSignalComplete &&
        contentPlanPillarsComplete &&
        contentPlanMatrixComplete &&
        contentPlanCalendarComplete &&
        contentPlanBacklogComplete &&
        contentPlanCadenceComplete &&
        contentPlanChecksComplete

    const contentPlanHasLooseThemes =
        state.contentPlan.contentMatrix.some(
            (row) =>
                row.piece.trim().length > 0 &&
                (row.channel.trim().length === 0 || row.objective.trim().length === 0)
        ) ||
        state.contentPlan.backlog.some(
            (row) =>
                row.piece.trim().length > 0 &&
                (row.channelFormat.trim().length === 0 || row.objective.trim().length === 0)
        )
    const showContentPlanLooseThemesSuggestion = contentPlanHasLooseThemes

    const contentPlanHasBrandContent =
        state.contentPlan.contentMatrix.some(
            (row) =>
                row.piece.trim().length > 0 ||
                row.pillar.trim().length > 0 ||
                row.channel.trim().length > 0 ||
                row.objective.trim().length > 0 ||
                row.brandSignal.trim().length > 0
        ) ||
        Object.values(state.contentPlan.centralSignal).some((value) => value.trim().length > 0)
    const hasBrandConnectionGap =
        state.contentPlan.contentMatrix.some(
            (row) =>
                (row.piece.trim().length > 0 ||
                    row.pillar.trim().length > 0 ||
                    row.channel.trim().length > 0 ||
                    row.objective.trim().length > 0) &&
                row.brandSignal.trim().length === 0
        ) ||
        state.contentPlan.centralSignal.connectionToBrand.trim().length === 0
    const showContentPlanBrandSignalSuggestion = contentPlanHasBrandContent && hasBrandConnectionGap

    const calendar30 = state.contentPlan.calendar[0]
    const calendar60 = state.contentPlan.calendar[1]
    const calendar90 = state.contentPlan.calendar[2]
    const thirtyShowsActivation = /(activ|presenc|arran|inicio|base|coher)/i.test(
        `${calendar30?.stretchObjective ?? ''} ${calendar30?.expectedResult ?? ''}`
    )
    const sixtyShowsConsolidation = /(consol|repet|afin|reconoc|consisten|tono)/i.test(
        `${calendar60?.stretchObjective ?? ''} ${calendar60?.expectedResult ?? ''}`
    )
    const ninetyShowsAmplification = /(amplif|oportun|reput|convers|tracci|expan)/i.test(
        `${calendar90?.stretchObjective ?? ''} ${calendar90?.expectedResult ?? ''}`
    )
    const showContentPlanProgressionSuggestion =
        state.contentPlan.calendar.some(
            (row) =>
                row.stretchObjective.trim().length > 0 ||
                row.prioritizedContent.trim().length > 0 ||
                row.mainChannel.trim().length > 0 ||
                row.expectedResult.trim().length > 0
        ) &&
        !(thirtyShowsActivation && sixtyShowsConsolidation && ninetyShowsAmplification)

    const cadenceText = [
        state.contentPlan.cadence.minimumCadence,
        state.contentPlan.cadence.channelRhythm,
        state.contentPlan.cadence.creationBlock,
        state.contentPlan.cadence.distributionBlock
    ]
        .join(' ')
        .toLowerCase()
    const cadenceLooksUnrealistic =
        /(diari|cada dia|cada día)/.test(cadenceText) ||
        /\b([6-9]|[1-9]\d)\s*(piezas|posts|publicaciones)\s*(seman|semana)/.test(cadenceText) ||
        /\b([2-9]\d)\s*(piezas|posts|publicaciones)\s*(mes|mensual)/.test(cadenceText)
    const showContentPlanCadenceSuggestion =
        state.contentPlan.cadence.minimumCadence.trim().length > 0 && cadenceLooksUnrealistic

    const mentorCompletedRows = state.evaluation.mentorRows.filter(isMentorEvaluationRowComplete).length
    const leaderCompletedRows = state.evaluation.leaderRows.filter(isLeaderEvaluationRowComplete).length
    const evaluationMentorComplete =
        mentorCompletedRows === state.evaluation.mentorRows.length &&
        state.evaluation.mentorGeneralNotes.trim().length > 0 &&
        state.evaluation.mentorGlobalDecision !== ''
    const evaluationLeaderComplete = leaderCompletedRows === state.evaluation.leaderRows.length
    const evaluationSynthesisComplete = state.evaluation.agreementsSynthesis.trim().length > 0
    const evaluationComplete = evaluationMentorComplete && evaluationLeaderComplete && evaluationSynthesisComplete
    const evaluationStageIndex = EVALUATION_STAGES.findIndex((stage) => stage.key === evaluationStage)
    const hasPrevEvaluationStage = evaluationStageIndex > 0
    const hasNextEvaluationStage = evaluationStageIndex >= 0 && evaluationStageIndex < EVALUATION_STAGES.length - 1
    const evaluationStageCompletionMap: Record<EvaluationStageKey, boolean> = {
        mentor: evaluationMentorComplete,
        leader: evaluationLeaderComplete,
        synthesis: evaluationSynthesisComplete,
        final: evaluationComplete
    }

    const showEvaluationMentorEvidenceSuggestion =
        state.evaluation.mentorRows.some(
            (row) => (row.level !== '' || row.decision !== '') && row.evidence.trim().length === 0
        )
    const showEvaluationLeaderActionSuggestion =
        state.evaluation.leaderRows.some(
            (row) =>
                (row.response.trim().length > 0 || row.evidence.trim().length > 0) && row.action.trim().length === 0
        )
    const showEvaluationGlobalDecisionSuggestion =
        mentorCompletedRows > 0 && state.evaluation.mentorGlobalDecision === ''

    const lifeWheelSize = 360
    const lifeWheelCenter = 180
    const lifeWheelRadius = 120
    const lifeWheelLevels = [2, 4, 6, 8, 10]
    const lifeWheelAxes = state.purposeIntegrated.lifeIntegration.map((row, index) => {
        const score = lifeIntegrationScores[index]
        const angle = (-90 + (360 / state.purposeIntegrated.lifeIntegration.length) * index) * (Math.PI / 180)
        const pointRadius = (score / 10) * lifeWheelRadius
        const outerRadius = lifeWheelRadius + 32
        return {
            area: row.area,
            score,
            index,
            pointX: lifeWheelCenter + pointRadius * Math.cos(angle),
            pointY: lifeWheelCenter + pointRadius * Math.sin(angle),
            outerX: lifeWheelCenter + lifeWheelRadius * Math.cos(angle),
            outerY: lifeWheelCenter + lifeWheelRadius * Math.sin(angle),
            labelX: lifeWheelCenter + outerRadius * Math.cos(angle),
            labelY: lifeWheelCenter + outerRadius * Math.sin(angle)
        }
    })
    const lifeWheelPolygonPoints = lifeWheelAxes.map((axis) => `${axis.pointX},${axis.pointY}`).join(' ')

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: purposeIntegratedComplete,
        4: executiveBrandComplete,
        5: brandValuesComplete,
        6: leadershipArchetypeComplete,
        7: linkedInProfileComplete,
        8: socialCauseComplete,
        9: contentPlanComplete,
        10: evaluationComplete
    }

    const completedPages = PAGES.filter((page) => pageCompletionMap[page.id]).length
    const progressPercent = Math.round((completedPages / PAGES.length) * 100)
    const printMetaLabel = `Líder: ${state.identification.leaderName || 'Sin nombre'} · Rol: ${state.identification.role || 'Sin rol'}`
    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId
    const currentAssistContext =
        activePage === 3
            ? {
                  currentData: state.purposeIntegrated,
                  applyData: (payload: unknown) => {
                      setState((prev) => ({
                          ...prev,
                          purposeIntegrated: mergeStructuredData(prev.purposeIntegrated, payload)
                      }))
                  }
              }
            : activePage === 4
              ? {
                    currentData: state.executiveBrand,
                    applyData: (payload: unknown) => {
                        setState((prev) => ({
                            ...prev,
                            executiveBrand: mergeStructuredData(prev.executiveBrand, payload)
                        }))
                    }
                }
              : activePage === 5
                ? {
                      currentData: state.brandValues,
                      applyData: (payload: unknown) => {
                          setState((prev) => ({
                              ...prev,
                              brandValues: mergeStructuredData(prev.brandValues, payload)
                          }))
                      }
                  }
                : activePage === 6
                  ? {
                        currentData: state.leadershipArchetype,
                        applyData: (payload: unknown) => {
                            setState((prev) => ({
                                ...prev,
                                leadershipArchetype: mergeStructuredData(prev.leadershipArchetype, payload)
                            }))
                        }
                    }
                  : activePage === 7
                    ? {
                          currentData: state.linkedInProfile,
                          applyData: (payload: unknown) => {
                              setState((prev) => ({
                                  ...prev,
                                  linkedInProfile: mergeStructuredData(prev.linkedInProfile, payload)
                              }))
                          }
                      }
                    : activePage === 8
                      ? {
                            currentData: state.socialCause,
                            applyData: (payload: unknown) => {
                                setState((prev) => ({
                                    ...prev,
                                    socialCause: mergeStructuredData(prev.socialCause, payload)
                                }))
                            }
                        }
                      : activePage === 9
                        ? {
                              currentData: state.contentPlan,
                              applyData: (payload: unknown) => {
                                  setState((prev) => ({
                                      ...prev,
                                      contentPlan: mergeStructuredData(prev.contentPlan, payload)
                                  }))
                              }
                          }
                        : null

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb9-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/workbooks-v2" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="mr-auto">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB9 - {WORKBOOK_TITLE}</p>
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

            <main className="max-w-[1280px] mx-auto px-2 sm:px-5 md:px-8 py-5 md:py-8 overflow-x-hidden">
                <div className={`grid gap-6 items-start ${isExportingAll ? 'grid-cols-1 min-w-0' : 'grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] min-w-0'}`}>
                    <aside className={`wb9-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
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
                        {!isExportingAll && currentAssistContext && (
                            <AdaptiveWorkbookStepAssistPortals
                                workbookId="wb9"
                                storageKey={PAGE_ASSIST_STORAGE_KEY}
                                activePage={activePage}
                                pageTitle={PAGES.find((page) => page.id === activePage)?.label.replace(/^\d+\.\s*/, '') || ''}
                                currentData={currentAssistContext.currentData}
                                enabled={!!currentAssistContext && !isExportingAll}
                                disabled={isLocked || isExporting || !isHydrated}
                                onApplyData={(payload) => currentAssistContext.applyData(payload)}
                            />
                        )}

                        {isPageVisible(1) && (
                            <article
                                className="wb9-print-page wb9-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 10"
                                data-print-title="Portada e identificación"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb9-cover-hero relative min-h-[56vh] md:min-h-[62vh] overflow-hidden bg-[radial-gradient(circle_at_top,#fff8eb_0%,#f7efe1_35%,#edf4fb_100%)] px-6 py-12">
                                    <div className="absolute left-[-10%] top-16 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl" />
                                    <div className="absolute right-[-8%] bottom-8 h-44 w-44 rounded-full bg-sky-200/35 blur-3xl" />
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
                                                Cuadernillo de trabajo digital para integrar propósito, posicionamiento, reputación y legado en una marca
                                                ejecutiva clara, coherente y visible.
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
                                            placeholder="Ej: VP Comercial"
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
                                            disabled={isLocked}
                                            type="date"
                                        />
                                    </div>

                                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                                        <p className="text-sm leading-relaxed text-amber-900">
                                            Lo primero que aparece en este cuadernillo digital es la portada con el logo 4Shine, el título del workbook, su
                                            número y el pilar correspondiente, tal como definiste.
                                        </p>
                                    </div>

                                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => savePage(1)}
                                            disabled={isLocked || !isHydrated}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar datos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                savePage(1)
                                                jumpToPage(2)
                                            }}
                                            className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-500"
                                        >
                                            Ver presentación
                                        </button>
                                    </div>
                                </div>
                            </article>
                        )}

                        {isPageVisible(2) && (
                            <article
                                className="wb9-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 2 de 10"
                                data-print-title="Presentación del workbook"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 2</p>
                                    <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">
                                        Presentación del workbook
                                    </h2>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7">
                                    <h3 className="text-lg font-bold text-slate-900">Objetivo</h3>
                                    <p className="mt-4 text-sm leading-relaxed text-slate-700 md:text-[15px]">
                                        Integrar propósito, posicionamiento, reputación y legado en una marca ejecutiva clara, coherente y visible, para que
                                        el líder deje de ser percibido solo por su rol actual y comience a ser reconocido por la huella estratégica, ética y
                                        humana que proyecta.
                                    </p>
                                </section>

                                <section className="grid gap-4 lg:grid-cols-2">
                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Al finalizar este workbook tendrás</h3>
                                        <ul className="mt-4 space-y-3">
                                            {WORKBOOK_OUTCOMES.map((item) => (
                                                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Componentes trabajados en este workbook</h3>
                                        <ul className="mt-4 space-y-3">
                                            {WORKBOOK_COMPONENTS.map((item) => (
                                                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="text-amber-700" size={20} />
                                        <h3 className="text-lg font-bold text-slate-900">Competencias 4Shine que vas a activar</h3>
                                    </div>

                                    <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Competencia guía</p>
                                        <p className="mt-2 text-xl font-extrabold text-slate-900">Mentoría y sucesión</p>
                                        <p className="mt-3 text-sm leading-relaxed text-slate-700">
                                            Esta competencia orienta la huella de mentoría, sucesión y legado que este workbook busca hacer más visible.
                                        </p>
                                    </article>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Reglas de oro</h3>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {GOLDEN_RULES.map((rule) => (
                                            <article
                                                key={rule}
                                                className="rounded-2xl border border-amber-200 bg-[linear-gradient(180deg,#fff9ef_0%,#ffffff_100%)] p-5 shadow-[0_10px_24px_rgba(217,119,6,0.08)]"
                                            >
                                                <p className="text-sm font-semibold leading-relaxed text-slate-800">{rule}</p>
                                            </article>
                                        ))}
                                    </div>
                                </section>

                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                    <p className="text-sm font-medium text-amber-900">
                                        Esta primera sección de presentación es plenamente informativa. Todos los usuarios la ven la primera vez que ingresan.
                                        Después del segundo ingreso, el workbook continúa en la sección donde habían quedado la última vez.
                                    </p>
                                </div>
                            </article>
                        )}

                        {isPageVisible(3) && (
                            <article
                                className="wb9-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 3 de 10"
                                data-print-title="Propósito integrado"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 3</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">
                                                Propósito integrado
                                            </h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Integra tu propósito personal, profesional y de impacto en una formulación clara, consistente y accionable,
                                                para que tu marca ejecutiva no sea solo reputación externa, sino expresión coherente de quién eres, qué
                                                causas mueves y qué huella quieres dejar.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowPurposeHelp(true)}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <section className="grid gap-4 lg:grid-cols-2">
                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Conceptos eje</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {PURPOSE_CONCEPTS.map((concept) => (
                                                <li key={concept}>{concept}</li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Cierre esperado de esta sección</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {PURPOSE_SECTION_CLOSURE.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Inventario de propósito en 5 fuentes</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Antes de escribir un propósito integrado, identifica de dónde sale.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {PURPOSE_INVENTORY_FIELDS.map((field) => {
                                            const Icon = field.icon
                                            return (
                                                <label key={field.key} className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                                                        <Icon size={16} className="text-amber-700" />
                                                        {field.label}
                                                    </span>
                                                    <textarea
                                                        value={state.purposeIntegrated.inventory[field.key]}
                                                        onChange={(event) => updateInventoryField(field.key, event.target.value)}
                                                        placeholder={field.placeholder}
                                                        disabled={isLocked}
                                                        rows={4}
                                                        className={TEXTAREA_CLASS}
                                                    />
                                                </label>
                                            )
                                        })}
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            {PURPOSE_INVENTORY_FIELDS.map((field) => (
                                                <p key={`inventory-example-${field.key}`}>
                                                    <span className="font-semibold text-slate-900">{field.label}:</span> {INVENTORY_EXAMPLE[field.key]}
                                                </p>
                                            ))}
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${inventoryComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {inventoryComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePurposeIntegratedBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Matriz propósito-aporte-huella</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Este instrumento evita que el propósito quede bonito, pero abstracto.
                                        </p>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Responde con precisión qué te mueve, qué sabes aportar, a quién quieres servir, qué transformación buscas y
                                            qué huella deseas dejar.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[760px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dimensión</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tu respuesta</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {PURPOSE_MATRIX_DEFINITIONS.map((item, index) => {
                                                    const Icon = item.icon
                                                    return (
                                                        <tr key={item.label} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 align-top">
                                                                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                                    <Icon size={16} className="text-amber-700" />
                                                                    {item.label}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <textarea
                                                                    value={state.purposeIntegrated.contributionMatrix[index].response}
                                                                    onChange={(event) => updateContributionMatrixRow(index, event.target.value)}
                                                                    placeholder="Escribe una respuesta concreta, visible y útil."
                                                                    disabled={isLocked}
                                                                    rows={3}
                                                                    className={TEXTAREA_CLASS}
                                                                />
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[680px] w-full rounded-xl border border-slate-200 overflow-hidden bg-white">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dimensión</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tu respuesta</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {PURPOSE_MATRIX_DEFINITIONS.map((item, index) => (
                                                        <tr key={`matrix-example-${item.label}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{item.label}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{PURPOSE_MATRIX_EXAMPLE[index]}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${contributionMatrixComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {contributionMatrixComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePurposeIntegratedBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Fórmula del propósito integrado</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Estructura recomendada: “Estoy aquí para + verbo de contribución + qué transformo + en quién + con qué tipo de impacto.”
                                        </p>
                                    </div>

                                    <TextAreaField
                                        label="Mi propósito integrado es"
                                        value={state.purposeIntegrated.integratedPurpose}
                                        onChange={updateIntegratedPurpose}
                                        placeholder="Estoy aquí para..."
                                        disabled={isLocked}
                                        rows={5}
                                    />

                                    {showAbstractPurposeSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Haz más visible qué transformas y en quién.
                                        </div>
                                    )}

                                    {showContributionSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Agrega el tipo de impacto que quieres dejar.
                                        </div>
                                    )}

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            <p className="font-semibold text-slate-900">Mi propósito integrado es:</p>
                                            <p>Estoy aquí para impulsar el cambio e inspirar crecimiento real en personas y organizaciones.</p>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${integratedPurposeComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {integratedPurposeComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePurposeIntegratedBlock('Bloque 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Test de coherencia propósito-marca</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Este instrumento conecta directamente con la rúbrica del WB9.
                                        </p>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Verifica si tu propósito coincide con la huella que ya dejas, si trasciende el cargo y si está respaldado por
                                            una contribución humana o social verificable.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[820px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pregunta</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sí / No</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.purposeIntegrated.coherenceChecks.map((row, index) => (
                                                    <tr key={row.question} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.question}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                {[
                                                                    { value: 'yes' as YesNoAnswer, label: 'Sí' },
                                                                    { value: 'no' as YesNoAnswer, label: 'No' }
                                                                ].map((option) => (
                                                                    <button
                                                                        key={`${row.question}-${option.value}`}
                                                                        type="button"
                                                                        onClick={() => updateCoherenceCheck(index, 'verdict', option.value)}
                                                                        disabled={isLocked}
                                                                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                                                            row.verdict === option.value
                                                                                ? option.value === 'yes'
                                                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                                                                    : 'border-rose-300 bg-rose-50 text-rose-800'
                                                                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                    >
                                                                        {option.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.adjustment}
                                                                onChange={(event) => updateCoherenceCheck(index, 'adjustment', event.target.value)}
                                                                placeholder="Qué necesitas ajustar para alinear mejor propósito y marca."
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            <p><span className="font-semibold text-slate-900">Señal débil:</span> declarar un propósito inspirador, pero presentarse solo desde logros técnicos o cargo.</p>
                                            <p><span className="font-semibold text-slate-900">Señal mejorada:</span> formular un propósito que también se ve en la promesa de valor, la causa social, el LinkedIn y el tipo de impacto que buscas.</p>
                                        </div>
                                    </details>

                                    {showCoherenceSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Ajusta LinkedIn, promesa de valor o causa social para alinear mejor el propósito.
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${coherenceComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {coherenceComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePurposeIntegratedBlock('Bloque 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 5 — Mapa de integración de vida</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Escribe una frase de visión breve por cada área clave. La visualización muestra el nivel de definición actual
                                                de cada dimensión.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-[760px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Área</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mi visión integrada</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {state.purposeIntegrated.lifeIntegration.map((row, index) => (
                                                        <tr key={row.area} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.area}</td>
                                                            <td className="px-4 py-3">
                                                                <textarea
                                                                    value={row.vision}
                                                                    onChange={(event) => updateLifeIntegrationRow(index, event.target.value)}
                                                                    placeholder="Escribe una frase breve, concreta y con dirección."
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

                                        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Rueda de integración</h4>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                La figura refleja qué tan definida está cada área hoy, según la claridad de lo que escribiste.
                                            </p>
                                            <p className="mt-2 text-xs leading-relaxed text-slate-500">
                                                Esta visualización no califica tu vida: muestra el nivel de definición actual de tu narrativa integral.
                                            </p>

                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                                                <svg viewBox={`0 0 ${lifeWheelSize} ${lifeWheelSize}`} className="mx-auto h-auto w-full max-w-[340px]" role="img" aria-label="Rueda de integración de vida">
                                                    <defs>
                                                        <linearGradient id="wb9-wheel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                                                            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.2" />
                                                        </linearGradient>
                                                    </defs>

                                                    {lifeWheelLevels.map((level) => (
                                                        <circle
                                                            key={`life-level-${level}`}
                                                            cx={lifeWheelCenter}
                                                            cy={lifeWheelCenter}
                                                            r={(level / 10) * lifeWheelRadius}
                                                            fill="none"
                                                            stroke="#cbd5e1"
                                                            strokeDasharray={level === 10 ? '0' : '4 4'}
                                                            strokeWidth={level === 10 ? 1.4 : 1}
                                                        />
                                                    ))}

                                                    {lifeWheelAxes.map((axis) => (
                                                        <line
                                                            key={`axis-${axis.area}`}
                                                            x1={lifeWheelCenter}
                                                            y1={lifeWheelCenter}
                                                            x2={axis.outerX}
                                                            y2={axis.outerY}
                                                            stroke="#cbd5e1"
                                                            strokeWidth={1}
                                                        />
                                                    ))}

                                                    <polygon points={lifeWheelPolygonPoints} fill="url(#wb9-wheel-gradient)" stroke="#d97706" strokeWidth={2.5} />

                                                    {lifeWheelAxes.map((axis) => (
                                                        <g key={`point-${axis.area}`}>
                                                            <circle cx={axis.pointX} cy={axis.pointY} r={5.5} fill="#d97706" stroke="#fff" strokeWidth={2} />
                                                            <text
                                                                x={axis.labelX}
                                                                y={axis.labelY}
                                                                textAnchor={axis.labelX < lifeWheelCenter - 8 ? 'end' : axis.labelX > lifeWheelCenter + 8 ? 'start' : 'middle'}
                                                                dominantBaseline="middle"
                                                                fill="#0f172a"
                                                                fontSize="11"
                                                                fontWeight="700"
                                                            >
                                                                {axis.index + 1}
                                                            </text>
                                                        </g>
                                                    ))}

                                                    <circle cx={lifeWheelCenter} cy={lifeWheelCenter} r={4} fill="#0f172a" />
                                                </svg>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                {state.purposeIntegrated.lifeIntegration.map((row, index) => (
                                                    <div key={`legend-${row.area}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{index + 1}</p>
                                                            <p className="text-sm font-semibold text-slate-900">{row.area}</p>
                                                        </div>
                                                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                                                            {lifeIntegrationScores[index].toFixed(1)}/10
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </article>
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[700px] w-full rounded-xl border border-slate-200 overflow-hidden bg-white">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Área</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mi visión integrada</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {LIFE_INTEGRATION_AREAS.map((area, index) => (
                                                        <tr key={`life-example-${area}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{area}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{LIFE_INTEGRATION_EXAMPLE[index]}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    {showLifeIntegrationSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Revisa si tu marca está demasiado centrada solo en trabajo y no en legado integral.
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lifeIntegrationComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {lifeIntegrationComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePurposeIntegratedBlock('Bloque 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Estado de la sección</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Pendiente si no has formulado un propósito integrado y no has revisado su coherencia. Completado si están
                                                diligenciados inventario, matriz, propósito, test y mapa de integración.
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                purposeIntegratedComplete
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {purposeIntegratedComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(4) && (
                            <article
                                className="wb9-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 4 de 10"
                                data-print-title="Marca ejecutiva"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 4</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">
                                                Marca ejecutiva
                                            </h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Define una marca ejecutiva clara, creíble y diferenciada, para que tu posicionamiento deje de depender solo
                                                del cargo o de la trayectoria acumulada y comience a sostenerse en una propuesta de valor reconocible,
                                                coherente y estratégicamente visible.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveBrandHelp(true)}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <section className="grid gap-4 lg:grid-cols-2">
                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Conceptos eje</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {EXECUTIVE_BRAND_CONCEPTS.map((concept) => (
                                                <li key={concept}>{concept}</li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Cierre esperado de esta sección</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {EXECUTIVE_BRAND_SECTION_CLOSURE.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Inventario de señales actuales de marca</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Antes de construir una marca ejecutiva, identifica qué señales ya estás emitiendo hoy, incluso sin haberlas
                                            diseñado de forma consciente.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[760px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                        Dimensión de marca actual
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                        Mi lectura
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.executiveBrand.currentSignals.map((row, index) => (
                                                    <tr key={row.dimension} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.dimension}</td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.reading}
                                                                onChange={(event) => updateExecutiveBrandSignal(index, event.target.value)}
                                                                placeholder="Describe la señal actual con honestidad y precisión."
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[720px] w-full rounded-xl border border-slate-200 overflow-hidden bg-white">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                            Dimensión de marca actual
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                            Mi lectura
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {EXECUTIVE_BRAND_SIGNAL_DIMENSIONS.map((dimension, index) => (
                                                        <tr key={`brand-signal-example-${dimension}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{dimension}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{EXECUTIVE_BRAND_SIGNAL_EXAMPLE[index]}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                executiveBrandSignalsComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {executiveBrandSignalsComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBrandBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Matriz diferenciador-problema-prueba</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            No basta con decir “soy distinto”; debes mostrar en qué, para quién y con qué evidencia.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1100px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Diferenciador</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Problema o necesidad</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Audiencia para la que importa</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Prueba / evidencia</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Señal que instala</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.executiveBrand.differentiatorMatrix.map((row, index) => (
                                                    <tr key={`brand-matrix-row-${index}`} className="border-t border-slate-200">
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.differentiator}
                                                                onChange={(event) => updateExecutiveBrandMatrixRow(index, 'differentiator', event.target.value)}
                                                                placeholder="Qué te hace distintivo."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.problem}
                                                                onChange={(event) => updateExecutiveBrandMatrixRow(index, 'problem', event.target.value)}
                                                                placeholder="Qué necesidad o problema resuelve."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.audience}
                                                                onChange={(event) => updateExecutiveBrandMatrixRow(index, 'audience', event.target.value)}
                                                                placeholder="Para quién importa."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.proof}
                                                                onChange={(event) => updateExecutiveBrandMatrixRow(index, 'proof', event.target.value)}
                                                                placeholder="Qué evidencia lo vuelve creíble."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.signal}
                                                                onChange={(event) => updateExecutiveBrandMatrixRow(index, 'signal', event.target.value)}
                                                                placeholder="Qué señal deja instalada."
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[1000px] w-full rounded-xl border border-slate-200 overflow-hidden bg-white">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Diferenciador</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Problema o necesidad</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Audiencia</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Prueba</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Señal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {EXECUTIVE_BRAND_MATRIX_EXAMPLE.map((row, index) => (
                                                        <tr key={`brand-matrix-example-${index}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 text-sm text-slate-700">{row.differentiator}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{row.problem}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{row.audience}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{row.proof}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{row.signal}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                executiveBrandMatrixComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {executiveBrandMatrixComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBrandBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Canvas de marca ejecutiva</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Integra los elementos mínimos de tu marca en una formulación coherente: identidad, problema, diferenciador,
                                            transformación, tono, audiencia y señal principal.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {EXECUTIVE_BRAND_CANVAS_FIELDS.map((field) => {
                                            const Icon = field.icon
                                            return (
                                                <label key={field.key} className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                                                        <Icon size={16} className="text-amber-700" />
                                                        {field.label}
                                                    </span>
                                                    <textarea
                                                        value={state.executiveBrand.canvas[field.key]}
                                                        onChange={(event) => updateExecutiveBrandCanvasField(field.key, event.target.value)}
                                                        placeholder={field.placeholder}
                                                        disabled={isLocked}
                                                        rows={4}
                                                        className={TEXTAREA_CLASS}
                                                    />
                                                </label>
                                            )
                                        })}
                                    </div>

                                    <article className="rounded-2xl border border-amber-200 bg-[linear-gradient(180deg,#fff8eb_0%,#ffffff_100%)] p-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-amber-800">Esquema visual del canvas</h4>
                                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800">Mapa actual</span>
                                        </div>

                                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                            {EXECUTIVE_BRAND_CANVAS_FIELDS.map((field) => {
                                                const Icon = field.icon
                                                const value = state.executiveBrand.canvas[field.key]
                                                return (
                                                    <div key={`brand-canvas-card-${field.key}`} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Icon size={15} className="text-amber-700" />
                                                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{field.label}</p>
                                                        </div>
                                                        <p className="mt-3 text-sm leading-relaxed text-slate-700">
                                                            {value.trim().length > 0 ? value : 'Pendiente por definir.'}
                                                        </p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </article>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                            {EXECUTIVE_BRAND_CANVAS_FIELDS.map((field) => (
                                                <div key={`brand-canvas-example-${field.key}`} className="rounded-xl border border-slate-200 bg-white p-4">
                                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{field.label}</p>
                                                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{EXECUTIVE_BRAND_CANVAS_EXAMPLE[field.key]}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                executiveBrandCanvasComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {executiveBrandCanvasComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBrandBlock('Bloque 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Fórmula de posicionamiento ejecutivo</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Estructura sugerida: “Ayudo a [audiencia] a [resolver / transformar] mediante [diferenciador o capacidad
                                            central], para generar [resultado o impacto].”
                                        </p>
                                    </div>

                                    <TextAreaField
                                        label="Mi frase de posicionamiento ejecutivo es"
                                        value={state.executiveBrand.positioningStatement}
                                        onChange={updateExecutiveBrandPositioning}
                                        placeholder="Ayudo a..."
                                        disabled={isLocked}
                                        rows={5}
                                    />

                                    {showGenericBrandSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Convierte atributos en diferenciadores conectados con problema y prueba.
                                        </div>
                                    )}

                                    {showBrandAudienceSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Aclara para quién importa tu marca.
                                        </div>
                                    )}

                                    {showBrandEvidenceSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Agrega resultados, trayectoria o señales verificables.
                                        </div>
                                    )}

                                    {showBrandLengthSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Reduce a una formulación más nítida y recordable.
                                        </div>
                                    )}

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            <p className="font-semibold text-slate-900">Mi frase de posicionamiento ejecutivo es:</p>
                                            <p>
                                                Ayudo a organizaciones que quieren crecer con criterio a transformar complejidad operativa en ventaja
                                                competitiva, mediante liderazgo sereno, visión estratégica y capacidad de ejecución con impacto sostenible.
                                            </p>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                executiveBrandPositioningComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {executiveBrandPositioningComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBrandBlock('Bloque 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 5 — Test de fortaleza de marca ejecutiva</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Revisa si tu marca ya es legible y creíble o si todavía está difusa.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[840px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pregunta</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sí / No</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.executiveBrand.strengthChecks.map((row, index) => (
                                                    <tr key={row.question} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.question}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                {[
                                                                    { value: 'yes' as YesNoAnswer, label: 'Sí' },
                                                                    { value: 'no' as YesNoAnswer, label: 'No' }
                                                                ].map((option) => (
                                                                    <button
                                                                        key={`${row.question}-${option.value}`}
                                                                        type="button"
                                                                        onClick={() => updateExecutiveBrandStrengthCheck(index, 'verdict', option.value)}
                                                                        disabled={isLocked}
                                                                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                                                            row.verdict === option.value
                                                                                ? option.value === 'yes'
                                                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                                                                    : 'border-rose-300 bg-rose-50 text-rose-800'
                                                                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                    >
                                                                        {option.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.adjustment}
                                                                onChange={(event) => updateExecutiveBrandStrengthCheck(index, 'adjustment', event.target.value)}
                                                                placeholder="Qué debes ajustar para fortalecer la marca."
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            <p>
                                                <span className="font-semibold text-slate-900">Señal débil:</span> describirme con adjetivos genéricos como
                                                “estratégico, apasionado, resiliente”, sin problema, audiencia ni prueba.
                                            </p>
                                            <p>
                                                <span className="font-semibold text-slate-900">Señal mejorada:</span> formular una marca donde se entienda
                                                qué resuelvo, cómo lo hago y por qué eso es creíble.
                                            </p>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                executiveBrandStrengthComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {executiveBrandStrengthComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBrandBlock('Bloque 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Estado de la sección</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Pendiente si no has formulado un posicionamiento claro y no has definido tu señal principal. Completado si
                                                están diligenciados inventario, matriz, canvas, posicionamiento y test.
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                executiveBrandComplete
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {executiveBrandComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(5) && (
                            <article
                                className="wb9-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 5 de 10"
                                data-print-title="Valores de marca"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 5</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">
                                                Valores de marca
                                            </h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Define los valores que sostienen tu marca ejecutiva, para que tu posicionamiento no dependa solo de
                                                atributos atractivos o narrativas bien formuladas, sino de principios verificables que ordenen tu conducta,
                                                tus decisiones y tu reputación.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowBrandValuesHelp(true)}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <section className="grid gap-4 lg:grid-cols-2">
                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Conceptos eje</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {BRAND_VALUES_CONCEPTS.map((concept) => (
                                                <li key={concept}>{concept}</li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Cierre esperado de esta sección</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {BRAND_VALUES_SECTION_CLOSURE.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Inventario amplio de valores</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Selecciona entre 10 y 15 valores que realmente te representen o que quieras considerar como base de tu marca.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {state.brandValues.inventory.map((value, index) => {
                                            const isOptional = index >= 10
                                            return (
                                                <label key={`brand-value-inventory-${index}`} className="space-y-1.5">
                                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                        Valor {index + 1}
                                                        {isOptional ? ' (opcional)' : ''}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={value}
                                                        onChange={(event) => updateBrandValueInventory(index, event.target.value)}
                                                        placeholder={isOptional ? 'Opcional' : 'Escribe un valor central para tu marca.'}
                                                        disabled={isLocked}
                                                        className={INPUT_CLASS}
                                                    />
                                                </label>
                                            )
                                        })}
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                            {BRAND_VALUES_INVENTORY_EXAMPLE.map((value, index) => (
                                                <p key={`brand-value-example-${value}`} className="text-sm text-slate-700">
                                                    <span className="font-semibold text-slate-900">Valor {index + 1}:</span> {value}
                                                </p>
                                            ))}
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                mandatoryBrandValuesComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {mandatoryBrandValuesComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveBrandValuesBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Matriz valor-conducta-prueba</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Cada valor debe conectarse con una conducta observable y con una prueba visible.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1120px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Valor</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué significa en mi marca</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Cómo se ve en conducta</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Prueba / evidencia</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué lo debilita</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {resolvedBrandValuesMatrix.map((row, index) => (
                                                    <tr key={`brand-values-matrix-${index}`} className="border-t border-slate-200">
                                                        <td className="px-3 py-3">
                                                            <select
                                                                value={row.value}
                                                                onChange={(event) => updateBrandValuesMatrixRow(index, 'value', event.target.value)}
                                                                disabled={isLocked}
                                                                className={INPUT_CLASS}
                                                            >
                                                                <option value="">Selecciona un valor</option>
                                                                {availableBrandValueOptions.map((option) => (
                                                                    <option key={`brand-value-option-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.meaning}
                                                                onChange={(event) => updateBrandValuesMatrixRow(index, 'meaning', event.target.value)}
                                                                placeholder="Qué significa este valor dentro de tu marca."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.behavior}
                                                                onChange={(event) => updateBrandValuesMatrixRow(index, 'behavior', event.target.value)}
                                                                placeholder="Cómo se ve en conducta observable."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.proof}
                                                                onChange={(event) => updateBrandValuesMatrixRow(index, 'proof', event.target.value)}
                                                                placeholder="Qué evidencia o ejemplo lo respalda."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.weakener}
                                                                onChange={(event) => updateBrandValuesMatrixRow(index, 'weakener', event.target.value)}
                                                                placeholder="Qué contradicción lo debilita."
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[1080px] w-full rounded-xl border border-slate-200 overflow-hidden bg-white">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Valor</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué significa</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Conducta</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Prueba</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Debilitador</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {BRAND_VALUES_MATRIX_EXAMPLE.map((row) => (
                                                        <tr key={`brand-values-matrix-example-${row.value}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.value}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{row.meaning}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{row.behavior}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{row.proof}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{row.weakener}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    {showBrandValuesBehaviorSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Conecta cada valor con una conducta visible.
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                brandValuesMatrixComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {brandValuesMatrixComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveBrandValuesBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Selección de valores núcleo</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Elige 5 valores centrales que funcionen como columna vertebral de tu marca ejecutiva.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {state.brandValues.coreValues.map((value, index) => (
                                            <label key={`brand-core-value-${index}`} className="space-y-1.5">
                                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                    Valor núcleo {index + 1}
                                                </span>
                                                <select
                                                    value={value}
                                                    onChange={(event) => updateBrandCoreValue(index, event.target.value)}
                                                    disabled={isLocked}
                                                    className={INPUT_CLASS}
                                                >
                                                    <option value="">Selecciona un valor del inventario</option>
                                                    {availableBrandValueOptions.map((option) => (
                                                        <option key={`core-brand-value-option-${index}-${option}`} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        ))}
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ol className="mt-4 space-y-2 text-sm text-slate-700">
                                            {['Honestidad', 'Coherencia', 'Responsabilidad', 'Visión', 'Impacto colectivo'].map((value, index) => (
                                                <li key={`brand-core-example-${value}`}>
                                                    <span className="font-semibold text-slate-900">{index + 1}.</span> {value}
                                                </li>
                                            ))}
                                        </ol>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                coreBrandValuesComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {coreBrandValuesComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveBrandValuesBlock('Bloque 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Ranking declarado vs. probado</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Distingue entre importancia declarada y evidencia real para cada valor núcleo.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[980px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Valor núcleo</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Importancia (1-5)</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Evidencia visible hoy (1-5)</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Brecha</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lectura estratégica</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {resolvedBrandValueRankings.map((row, index) => (
                                                    <tr key={`brand-ranking-row-${index}`} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                                            {row.value.trim().length > 0 ? row.value : 'Selecciona antes tus valores núcleo'}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select
                                                                value={row.importance}
                                                                onChange={(event) => updateBrandValueRankingRow(index, 'importance', event.target.value)}
                                                                disabled={isLocked || row.value.trim().length === 0}
                                                                className={INPUT_CLASS}
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {RATING_OPTIONS.map((option) => (
                                                                    <option key={`brand-importance-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select
                                                                value={row.evidence}
                                                                onChange={(event) => updateBrandValueRankingRow(index, 'evidence', event.target.value)}
                                                                disabled={isLocked || row.value.trim().length === 0}
                                                                className={INPUT_CLASS}
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {RATING_OPTIONS.map((option) => (
                                                                    <option key={`brand-evidence-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="inline-flex min-w-[60px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                                                {row.gap ?? '—'}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.strategicReading}
                                                                onChange={(event) => updateBrandValueRankingRow(index, 'strategicReading', event.target.value)}
                                                                placeholder="Qué lectura estratégica haces de esta brecha."
                                                                disabled={isLocked || row.value.trim().length === 0}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[900px] w-full rounded-xl border border-slate-200 overflow-hidden bg-white">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Valor núcleo</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Importancia</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Evidencia</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Brecha</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lectura</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {BRAND_VALUES_RANKING_EXAMPLE.map((row) => (
                                                        <tr key={`brand-ranking-example-${row.value}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.value}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{row.importance}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{row.evidence}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                                {Math.abs(Number(row.importance) - Number(row.evidence))}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{row.strategicReading}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    {showBrandValuesEvidenceMaxSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Revisa con honestidad qué valores todavía son más aspiracionales que probados.
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                brandValuesRankingComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {brandValuesRankingComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveBrandValuesBlock('Bloque 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 5 — No negociables de marca</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Traduce tus valores más críticos en límites éticos y reputacionales claros.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 xl:grid-cols-3">
                                        {state.brandValues.nonNegotiables.map((row, index) => (
                                            <article key={`brand-non-negotiable-${index}`} className="rounded-2xl border border-amber-200 bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)] p-5 space-y-4">
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">No negociable {index + 1}</p>
                                                <TextAreaField
                                                    label="En mi marca ejecutiva, no negocio"
                                                    value={row.principle}
                                                    onChange={(value) => updateBrandValueNonNegotiable(index, 'principle', value)}
                                                    placeholder="Ej: la honestidad"
                                                    disabled={isLocked}
                                                    rows={3}
                                                />
                                                <TextAreaField
                                                    label="Aunque eso implique"
                                                    value={row.cost}
                                                    onChange={(value) => updateBrandValueNonNegotiable(index, 'cost', value)}
                                                    placeholder="Ej: dar una noticia incómoda a tiempo"
                                                    disabled={isLocked}
                                                    rows={3}
                                                />
                                                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
                                                    En mi marca ejecutiva, no negocio{' '}
                                                    <span className="font-semibold text-slate-900">{row.principle.trim().length > 0 ? row.principle : '________'}</span>,
                                                    aunque eso implique{' '}
                                                    <span className="font-semibold text-slate-900">{row.cost.trim().length > 0 ? row.cost : '________'}</span>.
                                                </div>
                                            </article>
                                        ))}
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            <p>1. En mi marca ejecutiva, no negocio la honestidad aunque eso implique dar una noticia incómoda a tiempo.</p>
                                            <p>2. En mi marca ejecutiva, no negocio la coherencia aunque eso implique renunciar a una oportunidad que contradiga mis principios.</p>
                                            <p>3. En mi marca ejecutiva, no negocio el impacto colectivo aunque eso implique compartir protagonismo y crédito.</p>
                                        </div>
                                    </details>

                                    {showBrandValuesNonNegotiableSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Define qué principios no deberían ceder cuando aumente la presión.
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                brandValueNonNegotiablesComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {brandValueNonNegotiablesComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveBrandValuesBlock('Bloque 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 6 — Test de consistencia ética</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Este instrumento conecta la sección directamente con la rúbrica del WB9.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[840px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pregunta</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sí / No</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.brandValues.consistencyChecks.map((row, index) => (
                                                    <tr key={row.question} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.question}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                {[
                                                                    { value: 'yes' as YesNoAnswer, label: 'Sí' },
                                                                    { value: 'no' as YesNoAnswer, label: 'No' }
                                                                ].map((option) => (
                                                                    <button
                                                                        key={`${row.question}-${option.value}`}
                                                                        type="button"
                                                                        onClick={() => updateBrandValueConsistencyCheck(index, 'verdict', option.value)}
                                                                        disabled={isLocked}
                                                                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                                                            row.verdict === option.value
                                                                                ? option.value === 'yes'
                                                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                                                                    : 'border-rose-300 bg-rose-50 text-rose-800'
                                                                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                    >
                                                                        {option.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.adjustment}
                                                                onChange={(event) => updateBrandValueConsistencyCheck(index, 'adjustment', event.target.value)}
                                                                placeholder="Qué ajuste necesitas hacer para sostener este valor."
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            <p>
                                                <span className="font-semibold text-slate-900">Señal débil:</span> afirmar valores nobles, pero no poder
                                                mostrar decisiones o conductas que los respalden.
                                            </p>
                                            <p>
                                                <span className="font-semibold text-slate-900">Señal mejorada:</span> nombrar valores, conectarlos con
                                                conductas visibles y sostenerlos bajo presión.
                                            </p>
                                        </div>
                                    </details>

                                    {showBrandValuesReputationSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Ajusta conducta, narrativa o visibilidad para cerrar esa brecha.
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                brandValueConsistencyComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {brandValueConsistencyComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveBrandValuesBlock('Bloque 6')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Estado de la sección</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Pendiente si no has definido valores núcleo ni no negociables. Completado si están diligenciados inventario,
                                                matriz, núcleo, ranking, no negociables y test.
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                brandValuesComplete
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {brandValuesComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
                                        Esta sección se alinea directamente con el criterio de la rúbrica <span className="font-semibold">Integración ética en decisiones</span> y con la exigencia de consistencia entre discurso y reputación externa.
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(6) && (
                            <article
                                className="wb9-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 6 de 10"
                                data-print-title="Arquetipo de liderazgo"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 6</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">
                                                Arquetipo de liderazgo
                                            </h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Define el arquetipo de liderazgo que mejor representa tu marca ejecutiva, para darle una identidad simbólica,
                                                narrativa y conductual más clara a tu posicionamiento, tu tono y tu forma de ejercer influencia.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowLeadershipArchetypeHelp(true)}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <section className="grid gap-4 lg:grid-cols-2">
                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Conceptos eje</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {LEADERSHIP_ARCHETYPE_CONCEPTS.map((concept) => (
                                                <li key={concept}>{concept}</li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Cierre esperado de esta sección</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {LEADERSHIP_ARCHETYPE_SECTION_CLOSURE.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Inventario de rasgos dominantes</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Identifica qué señales dominan hoy tu estilo de liderazgo antes de elegir un arquetipo central.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[760px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dimensión</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mi lectura</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.leadershipArchetype.dominantTraits.map((row, index) => (
                                                    <tr key={row.dimension} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.dimension}</td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.reading}
                                                                onChange={(event) => updateLeadershipArchetypeInventory(index, event.target.value)}
                                                                placeholder="Describe la señal dominante con precisión."
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[720px] w-full rounded-xl border border-slate-200 overflow-hidden bg-white">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dimensión</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mi lectura</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {LEADERSHIP_ARCHETYPE_INVENTORY_DIMENSIONS.map((dimension, index) => (
                                                        <tr key={`archetype-inventory-example-${dimension}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{dimension}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{LEADERSHIP_ARCHETYPE_INVENTORY_EXAMPLE[index]}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                leadershipArchetypeInventoryComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {leadershipArchetypeInventoryComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveLeadershipArchetypeBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Matriz arquetipo-rasgo-riesgo</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Revisa los arquetipos disponibles y selecciona los 3 que mejor representen lo mejor de tu liderazgo y sus riesgos.
                                            </p>
                                        </div>

                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                                            Seleccionados: {state.leadershipArchetype.selectedArchetypes.length}/3
                                        </span>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-2">
                                        {LEADERSHIP_ARCHETYPE_OPTIONS.map((option) => {
                                            const isSelected = state.leadershipArchetype.selectedArchetypes.includes(option.name)
                                            const disableSelection =
                                                !isSelected && state.leadershipArchetype.selectedArchetypes.length >= 3
                                            return (
                                                <article
                                                    key={option.name}
                                                    className={`rounded-2xl border p-5 transition-colors ${
                                                        isSelected
                                                            ? 'border-amber-300 bg-amber-50'
                                                            : 'border-slate-200 bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h4 className="text-base font-bold text-slate-900">{option.name}</h4>
                                                            <p className="mt-2 text-sm leading-relaxed text-slate-700">{option.traits}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleLeadershipArchetypeOption(option.name)}
                                                            disabled={isLocked || disableSelection}
                                                            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                                                                isSelected
                                                                    ? 'bg-amber-600 text-white hover:bg-amber-500'
                                                                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        >
                                                            {isSelected ? 'Seleccionado' : 'Seleccionar'}
                                                        </button>
                                                    </div>

                                                    <dl className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
                                                        <div>
                                                            <dt className="font-semibold text-slate-900">Qué fortalece</dt>
                                                            <dd>{option.strengthens}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="font-semibold text-slate-900">Riesgo / sombra</dt>
                                                            <dd>{option.risk}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="font-semibold text-slate-900">Qué lo equilibra</dt>
                                                            <dd>{option.balances}</dd>
                                                        </div>
                                                    </dl>
                                                </article>
                                            )
                                        })}
                                    </div>

                                    {showArchetypeShadowSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Identifica qué exceso podría debilitar tu arquetipo.
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                leadershipArchetypeSelectedComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {leadershipArchetypeSelectedComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveLeadershipArchetypeBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Elección del arquetipo central</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Elige un arquetipo central y, si lo necesitas, uno secundario que complemente tu marca.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="space-y-1.5">
                                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mi arquetipo central es</span>
                                            <select
                                                value={state.leadershipArchetype.centralChoice.primary}
                                                onChange={(event) => updateLeadershipArchetypeChoice('primary', event.target.value)}
                                                disabled={isLocked}
                                                className={INPUT_CLASS}
                                            >
                                                <option value="">Selecciona uno de los 3 arquetipos elegidos</option>
                                                {state.leadershipArchetype.selectedArchetypes.map((option) => (
                                                    <option key={`archetype-primary-${option}`} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="space-y-1.5">
                                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mi arquetipo secundario o complementario es</span>
                                            <select
                                                value={state.leadershipArchetype.centralChoice.secondary}
                                                onChange={(event) => updateLeadershipArchetypeChoice('secondary', event.target.value)}
                                                disabled={isLocked}
                                                className={INPUT_CLASS}
                                            >
                                                <option value="">Selecciona un arquetipo complementario</option>
                                                {state.leadershipArchetype.selectedArchetypes
                                                    .filter((option) => option !== state.leadershipArchetype.centralChoice.primary)
                                                    .map((option) => (
                                                        <option key={`archetype-secondary-${option}`} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                            </select>
                                        </label>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <TextAreaField
                                            label="Lo elijo porque"
                                            value={state.leadershipArchetype.centralChoice.reason}
                                            onChange={(value) => updateLeadershipArchetypeChoice('reason', value)}
                                            placeholder="Por qué representa mejor tu liderazgo."
                                            disabled={isLocked}
                                            rows={4}
                                        />
                                        <TextAreaField
                                            label="Los rasgos visibles que lo sostienen son"
                                            value={state.leadershipArchetype.centralChoice.visibleTraits}
                                            onChange={(value) => updateLeadershipArchetypeChoice('visibleTraits', value)}
                                            placeholder="Qué señales visibles sostienen el arquetipo."
                                            disabled={isLocked}
                                            rows={4}
                                        />
                                        <TextAreaField
                                            label="Lo que lo hace creíble en mi trayectoria es"
                                            value={state.leadershipArchetype.centralChoice.credibility}
                                            onChange={(value) => updateLeadershipArchetypeChoice('credibility', value)}
                                            placeholder="Qué evidencia de tu trayectoria lo respalda."
                                            disabled={isLocked}
                                            rows={4}
                                        />
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            <p><span className="font-semibold text-slate-900">Mi arquetipo central es:</span> El Sabio Estratega.</p>
                                            <p><span className="font-semibold text-slate-900">Lo elijo porque:</span> representa mi forma de liderar desde claridad, visión y serenidad bajo presión.</p>
                                            <p><span className="font-semibold text-slate-900">Los rasgos visibles que lo sostienen son:</span> pensamiento estratégico, compostura, criterio y liderazgo humano.</p>
                                            <p><span className="font-semibold text-slate-900">Lo que lo hace creíble en mi trayectoria es:</span> la experiencia en contextos complejos, la capacidad de ordenar escenarios y la orientación a legado.</p>
                                            <p><span className="font-semibold text-slate-900">Mi arquetipo secundario o complementario es:</span> el Líder Multiplicador.</p>
                                        </div>
                                    </details>

                                    {showArchetypeVisibleTraitsSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Aterriza el arquetipo en conductas y señales concretas.
                                        </div>
                                    )}

                                    {showArchetypeCredibilitySuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Haz más explícita la evidencia que lo sostiene.
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                leadershipArchetypeChoiceComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {leadershipArchetypeChoiceComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveLeadershipArchetypeBlock('Bloque 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Código expresivo del arquetipo</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Define cómo habla, decide, actúa bajo presión y qué símbolos o palabras vuelven reconocible tu arquetipo.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[760px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dimensión</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mi definición arquetípica</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.leadershipArchetype.expressiveCode.map((row, index) => (
                                                    <tr key={row.dimension} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.dimension}</td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.definition}
                                                                onChange={(event) => updateLeadershipArchetypeExpressiveRow(index, event.target.value)}
                                                                placeholder="Describe esta dimensión con lenguaje concreto y visible."
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[720px] w-full rounded-xl border border-slate-200 overflow-hidden bg-white">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dimensión</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mi definición arquetípica</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {LEADERSHIP_ARCHETYPE_EXPRESSIVE_DIMENSIONS.map((dimension, index) => (
                                                        <tr key={`archetype-expressive-example-${dimension}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{dimension}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{LEADERSHIP_ARCHETYPE_EXPRESSIVE_EXAMPLE[index]}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    {showArchetypeAbstractSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Define cómo habla, decide y actúa ese arquetipo.
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                leadershipArchetypeExpressiveComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {leadershipArchetypeExpressiveComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveLeadershipArchetypeBlock('Bloque 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 5 — Test de coherencia del arquetipo</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Verifica si el arquetipo realmente conversa con tu marca o si todavía es solo una etiqueta atractiva.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[840px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pregunta</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sí / No</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.leadershipArchetype.coherenceChecks.map((row, index) => (
                                                    <tr key={row.question} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.question}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                {[
                                                                    { value: 'yes' as YesNoAnswer, label: 'Sí' },
                                                                    { value: 'no' as YesNoAnswer, label: 'No' }
                                                                ].map((option) => (
                                                                    <button
                                                                        key={`${row.question}-${option.value}`}
                                                                        type="button"
                                                                        onClick={() => updateLeadershipArchetypeCoherenceCheck(index, 'verdict', option.value)}
                                                                        disabled={isLocked}
                                                                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                                                            row.verdict === option.value
                                                                                ? option.value === 'yes'
                                                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                                                                    : 'border-rose-300 bg-rose-50 text-rose-800'
                                                                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                    >
                                                                        {option.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.adjustment}
                                                                onChange={(event) => updateLeadershipArchetypeCoherenceCheck(index, 'adjustment', event.target.value)}
                                                                placeholder="Qué debes ajustar para que el arquetipo sea más coherente."
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            <p>
                                                <span className="font-semibold text-slate-900">Señal débil:</span> elegir un arquetipo aspiracional que no
                                                conversa con la trayectoria ni con la reputación actual.
                                            </p>
                                            <p>
                                                <span className="font-semibold text-slate-900">Señal mejorada:</span> elegir un arquetipo que ordena mejor
                                                lo que ya es visible, lo que quieres amplificar y lo que puedes sostener con evidencia.
                                            </p>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                leadershipArchetypeCoherenceComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {leadershipArchetypeCoherenceComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveLeadershipArchetypeBlock('Bloque 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Estado de la sección</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Pendiente si no has elegido un arquetipo central y no has definido su código expresivo. Completado si están
                                                diligenciados inventario, matriz, elección, código y test.
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                leadershipArchetypeComplete
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {leadershipArchetypeComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(7) && (
                            <article
                                className="wb9-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 7 de 10"
                                data-print-title="Perfil LinkedIn optimizado"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 7</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">
                                                Perfil LinkedIn optimizado
                                            </h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Optimiza tu perfil de LinkedIn para que funcione como una pieza coherente de tu marca ejecutiva, capaz de
                                                traducir propósito, posicionamiento, reputación y propuesta de valor en una presencia digital clara, creíble
                                                y estratégicamente visible.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowLinkedInProfileHelp(true)}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <section className="grid gap-4 lg:grid-cols-2">
                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Conceptos eje</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {LINKEDIN_PROFILE_CONCEPTS.map((concept) => (
                                                <li key={concept}>{concept}</li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Cierre esperado de esta sección</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {LINKEDIN_PROFILE_SECTION_CLOSURE.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <section
                                    data-step-assist-disabled="true"
                                    className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Auditoría estratégica del perfil</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Agrega tu URL de LinkedIn y deja que el Asistente IA revise la señal pública del perfil para completar la
                                                auditoría estratégica como la leería un recruiter, sponsor, aliado o stakeholder de alto nivel.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={assistLinkedInAudit}
                                            disabled={isLocked || isLinkedInAuditLoading || state.linkedInProfile.profileUrl.trim().length === 0}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            {isLinkedInAuditLoading ? 'Analizando...' : 'Asistente IA'}
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-3 md:flex-row">
                                        <div className="flex-1">
                                            <TextInputField
                                                label="URL de LinkedIn"
                                                value={state.linkedInProfile.profileUrl}
                                                onChange={updateLinkedInProfileUrl}
                                                placeholder="https://www.linkedin.com/in/tu-perfil"
                                                disabled={isLocked}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={assistLinkedInAudit}
                                                disabled={isLocked || isLinkedInAuditLoading || state.linkedInProfile.profileUrl.trim().length === 0}
                                                className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                            >
                                                {isLinkedInAuditLoading ? 'Analizando...' : 'Analizar URL'}
                                            </button>
                                        </div>
                                    </div>

                                    {linkedInAuditError ? (
                                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                            {linkedInAuditError}
                                        </div>
                                    ) : null}

                                    {linkedInAuditMessage ? (
                                        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                                            {linkedInAuditMessage}
                                        </div>
                                    ) : null}

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[760px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lectura estratégica</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Análisis</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.linkedInProfile.audit.map((row, index) => (
                                                    <tr key={row.dimension} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.dimension}</td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.response}
                                                                onChange={(event) => updateLinkedInAuditRow(index, event.target.value)}
                                                                placeholder="El análisis del Asistente IA completará aquí la lectura estratégica del perfil."
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

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                linkedInAuditComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {linkedInAuditComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveLinkedInProfileBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Fórmula del Headline estratégico</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Estructura recomendada: verbo de transformación + área + rol o territorio + diferenciador o sello de liderazgo.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={assistLinkedInHeadline}
                                            disabled={isLocked}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Asistente IA
                                        </button>
                                    </div>

                                    <TextAreaField
                                        label="Mi Headline estratégico"
                                        value={state.linkedInProfile.strategicHeadline}
                                        onChange={updateLinkedInHeadline}
                                        placeholder="Transformo..."
                                        disabled={isLocked}
                                        rows={4}
                                    />

                                    {linkedInHeadlineLooksLikeRoleOnly && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Agrega transformación, especialidad o diferenciador.
                                        </div>
                                    )}

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <p className="mt-4 text-sm leading-relaxed text-slate-700">{LINKEDIN_HEADLINE_EXAMPLE}</p>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                linkedInHeadlineComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {linkedInHeadlineComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveLinkedInProfileBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Diseño del Banner</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                El banner debe reforzar la promesa principal de tu marca y aumentar la recordación visual del perfil.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={assistLinkedInBanner}
                                            disabled={isLocked}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Asistente IA
                                        </button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {LINKEDIN_BANNER_FIELDS.map((field) => (
                                            <TextAreaField
                                                key={field.key}
                                                label={field.label}
                                                value={state.linkedInProfile.banner[field.key]}
                                                onChange={(value) => updateLinkedInBannerField(field.key, value)}
                                                placeholder={field.placeholder}
                                                disabled={isLocked}
                                                rows={4}
                                            />
                                        ))}
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            {LINKEDIN_BANNER_FIELDS.map((field) => (
                                                <p key={`linkedin-banner-example-${field.key}`}>
                                                    <span className="font-semibold text-slate-900">{field.label}:</span> {LINKEDIN_BANNER_EXAMPLE[field.key]}
                                                </p>
                                            ))}
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                linkedInBannerComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {linkedInBannerComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveLinkedInProfileBlock('Bloque 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Matriz “Acerca de”</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                El “Acerca de” debe conectar trayectoria, problema, valor, forma de liderazgo y visión de legado.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={assistLinkedInAbout}
                                            disabled={isLocked}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Asistente IA
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[760px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Bloque del “Acerca de”</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mi formulación</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.linkedInProfile.aboutMatrix.map((row, index) => (
                                                    <tr key={row.block} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.block}</td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.formulation}
                                                                onChange={(event) => updateLinkedInAboutRow(index, event.target.value)}
                                                                placeholder="Define esta parte del “Acerca de” con criterio y claridad."
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

                                    {showLinkedInBioSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Conecta más trayectoria con problema, valor y visión.
                                        </div>
                                    )}

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[720px] w-full rounded-xl border border-slate-200 overflow-hidden bg-white">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Bloque</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mi formulación</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {LINKEDIN_ABOUT_BLOCKS.map((block, index) => (
                                                        <tr key={`linkedin-about-example-${block}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{block}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{LINKEDIN_ABOUT_EXAMPLE[index]}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                linkedInAboutComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {linkedInAboutComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveLinkedInProfileBlock('Bloque 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 5 — Mapa de secciones críticas del perfil</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Define qué debe comunicar cada sección, qué falta hoy y qué ajuste prioritario necesita.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={assistLinkedInProfileSections}
                                            disabled={isLocked}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Asistente IA
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1120px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sección del perfil</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué debe comunicar</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué falta hoy</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ajuste prioritario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.linkedInProfile.profileSections.map((row, index) => (
                                                    <tr key={row.section} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.section}</td>
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.communicates}
                                                                onChange={(event) => updateLinkedInProfileSectionRow(index, 'communicates', event.target.value)}
                                                                placeholder="Qué debe comunicar esta sección."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.missingToday}
                                                                onChange={(event) => updateLinkedInProfileSectionRow(index, 'missingToday', event.target.value)}
                                                                placeholder="Qué falta hoy."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <textarea
                                                                value={row.priorityAdjustment}
                                                                onChange={(event) => updateLinkedInProfileSectionRow(index, 'priorityAdjustment', event.target.value)}
                                                                placeholder="Qué ajuste prioritario requiere."
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

                                    {showLinkedInProofSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Incluye resultados, casos o señales de credibilidad.
                                        </div>
                                    )}

                                    {showLinkedInActivitySuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Activa una presencia mínima por pensamiento, no solo por historial.
                                        </div>
                                    )}

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[1000px] w-full rounded-xl border border-slate-200 overflow-hidden bg-white">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sección</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué debe comunicar</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué falta hoy</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ajuste prioritario</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {LINKEDIN_PROFILE_SECTIONS.map((section, index) => (
                                                        <tr key={`linkedin-section-example-${section}`} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{section}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{LINKEDIN_PROFILE_SECTION_EXAMPLE[index][0]}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{LINKEDIN_PROFILE_SECTION_EXAMPLE[index][1]}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-700">{LINKEDIN_PROFILE_SECTION_EXAMPLE[index][2]}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                linkedInSectionsComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {linkedInSectionsComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveLinkedInProfileBlock('Bloque 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Bloque 6 — Test de optimización del perfil</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Revisa si el perfil ya funciona como pieza de marca ejecutiva y no solo como hoja de vida digital.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={assistLinkedInOptimization}
                                            disabled={isLocked}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Asistente IA
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[840px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pregunta</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sí / No</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.linkedInProfile.optimizationChecks.map((row, index) => (
                                                    <tr key={row.question} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.question}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                {[
                                                                    { value: 'yes' as YesNoAnswer, label: 'Sí' },
                                                                    { value: 'no' as YesNoAnswer, label: 'No' }
                                                                ].map((option) => (
                                                                    <button
                                                                        key={`${row.question}-${option.value}`}
                                                                        type="button"
                                                                        onClick={() => updateLinkedInOptimizationCheck(index, 'verdict', option.value)}
                                                                        disabled={isLocked}
                                                                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                                                            row.verdict === option.value
                                                                                ? option.value === 'yes'
                                                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                                                                    : 'border-rose-300 bg-rose-50 text-rose-800'
                                                                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                    >
                                                                        {option.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.adjustment}
                                                                onChange={(event) => updateLinkedInOptimizationCheck(index, 'adjustment', event.target.value)}
                                                                placeholder="Qué debes ajustar para optimizar mejor el perfil."
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            <p>
                                                <span className="font-semibold text-slate-900">Señal débil:</span> perfil correcto, pero intercambiable
                                                con muchos otros.
                                            </p>
                                            <p>
                                                <span className="font-semibold text-slate-900">Señal mejorada:</span> perfil que traduce con claridad
                                                problema, transformación, diferenciador, tono y visión.
                                            </p>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                linkedInOptimizationComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {linkedInOptimizationComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveLinkedInProfileBlock('Bloque 6')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Estado de la sección</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Pendiente si no has redefinido Headline y “Acerca de”. Completado si están diligenciados auditoría,
                                                headline, banner, matriz “Acerca de”, mapa de secciones y test.
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                linkedInProfileComplete
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {linkedInProfileComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(8) && (
                            <article
                                className="wb9-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 8 de 10"
                                data-print-title="Causa social estratégica"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 8</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">
                                                Causa social estratégica
                                            </h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Define una causa social estratégica que extienda tu marca ejecutiva más allá del logro individual, para
                                                conectar tu liderazgo con una contribución visible, coherente y sostenible hacia la sociedad.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowSocialCauseHelp(true)}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <section className="grid gap-4 lg:grid-cols-2">
                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Conceptos eje</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {SOCIAL_CAUSE_CONCEPTS.map((concept) => (
                                                <li key={concept}>{concept}</li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Cierre esperado de esta sección</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {SOCIAL_CAUSE_SECTION_CLOSURE.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Inventario de causas posibles</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Identifica qué problemas humanos, sociales o sistémicos te importan de verdad y cuáles conversan con tu
                                            trayectoria y tu forma de liderar.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {state.socialCause.possibleCauses.map((cause, index) => (
                                            <TextInputField
                                                key={`social-cause-possible-${index}`}
                                                label={`Causa posible ${index + 1}`}
                                                value={cause}
                                                onChange={(value) => updateSocialCausePossible(index, value)}
                                                placeholder="Describe una causa que realmente resuene contigo."
                                                disabled={isLocked}
                                            />
                                        ))}
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-slate-700">
                                            {SOCIAL_CAUSE_INVENTORY_EXAMPLE.map((item, index) => (
                                                <p key={`social-cause-example-${index}`}>
                                                    <span className="font-semibold text-slate-900">Causa posible {index + 1}:</span> {item}
                                                </p>
                                            ))}
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                socialCauseInventoryComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {socialCauseInventoryComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveSocialCauseBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Matriz causa-trayectoria-legitimidad</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Evalúa qué causa tiene verdadera legitimidad para formar parte de tu marca ejecutiva.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1120px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Causa posible</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Conexión con mi historia (1-5)</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Coherencia con mi propósito (1-5)</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Capacidad real de aporte (1-5)</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Credibilidad externa (1-5)</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Potencial de huella (1-5)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.socialCause.legitimacyMatrix.map((row, index) => (
                                                    <tr key={`social-cause-matrix-${index}`} className="border-t border-slate-200">
                                                        <td className="px-4 py-3">
                                                            <input
                                                                value={row.possibleCause}
                                                                onChange={(event) =>
                                                                    updateSocialCauseLegitimacyRow(index, 'possibleCause', event.target.value)
                                                                }
                                                                placeholder={state.socialCause.possibleCauses[index] || 'Escribe una causa concreta.'}
                                                                disabled={isLocked}
                                                                className={INPUT_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select
                                                                value={row.storyConnection}
                                                                onChange={(event) =>
                                                                    updateSocialCauseLegitimacyRow(index, 'storyConnection', event.target.value)
                                                                }
                                                                disabled={isLocked}
                                                                className={INPUT_CLASS}
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {RATING_OPTIONS.map((option) => (
                                                                    <option key={`social-cause-story-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select
                                                                value={row.purposeCoherence}
                                                                onChange={(event) =>
                                                                    updateSocialCauseLegitimacyRow(index, 'purposeCoherence', event.target.value)
                                                                }
                                                                disabled={isLocked}
                                                                className={INPUT_CLASS}
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {RATING_OPTIONS.map((option) => (
                                                                    <option key={`social-cause-purpose-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select
                                                                value={row.contributionCapacity}
                                                                onChange={(event) =>
                                                                    updateSocialCauseLegitimacyRow(index, 'contributionCapacity', event.target.value)
                                                                }
                                                                disabled={isLocked}
                                                                className={INPUT_CLASS}
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {RATING_OPTIONS.map((option) => (
                                                                    <option key={`social-cause-capacity-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select
                                                                value={row.externalCredibility}
                                                                onChange={(event) =>
                                                                    updateSocialCauseLegitimacyRow(index, 'externalCredibility', event.target.value)
                                                                }
                                                                disabled={isLocked}
                                                                className={INPUT_CLASS}
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {RATING_OPTIONS.map((option) => (
                                                                    <option key={`social-cause-credibility-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select
                                                                value={row.footprintPotential}
                                                                onChange={(event) =>
                                                                    updateSocialCauseLegitimacyRow(index, 'footprintPotential', event.target.value)
                                                                }
                                                                disabled={isLocked}
                                                                className={INPUT_CLASS}
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {RATING_OPTIONS.map((option) => (
                                                                    <option key={`social-cause-footprint-${index}-${option}`} value={option}>
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[980px] w-full text-sm text-slate-700">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                                                        <th className="pb-2 pr-4">Causa posible</th>
                                                        <th className="pb-2 pr-4">Historia</th>
                                                        <th className="pb-2 pr-4">Propósito</th>
                                                        <th className="pb-2 pr-4">Aporte</th>
                                                        <th className="pb-2 pr-4">Credibilidad</th>
                                                        <th className="pb-2">Huella</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {SOCIAL_CAUSE_MATRIX_EXAMPLE.map((row) => (
                                                        <tr key={row.possibleCause} className="border-t border-slate-200">
                                                            <td className="py-2 pr-4 font-medium text-slate-900">{row.possibleCause}</td>
                                                            <td className="py-2 pr-4">{row.storyConnection}</td>
                                                            <td className="py-2 pr-4">{row.purposeCoherence}</td>
                                                            <td className="py-2 pr-4">{row.contributionCapacity}</td>
                                                            <td className="py-2 pr-4">{row.externalCredibility}</td>
                                                            <td className="py-2">{row.footprintPotential}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                socialCauseLegitimacyComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {socialCauseLegitimacyComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveSocialCauseBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Formulación de la causa social estratégica</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Estructura recomendada: contribuir a + transformación social o humana + en + población o sistema + mediante +
                                            tipo de liderazgo, acción o aporte.
                                        </p>
                                    </div>

                                    <TextAreaField
                                        label="Mi causa social estratégica"
                                        value={state.socialCause.strategicCause}
                                        onChange={updateSocialCauseStrategicCause}
                                        placeholder="Contribuir a..."
                                        disabled={isLocked}
                                        rows={4}
                                    />

                                    {showSocialCauseAbstractSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Haz más concreta la transformación que quieres impulsar.
                                        </div>
                                    )}

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <p className="mt-4 text-sm leading-relaxed text-slate-700">
                                            Impulsar el cambio de mentalidad en Latinoamérica: demostrar que sí se puede construir empresas competitivas,
                                            sostenibles y humanas.
                                        </p>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                socialCauseStrategicComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {socialCauseStrategicComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveSocialCauseBlock('Bloque 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Mapa causa-marca-contribución</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Integra la causa elegida con tu propósito, tu promesa de valor, tus valores y tu arquetipo para que la
                                            contribución no quede suelta.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[760px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Elemento</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mi formulación</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.socialCause.causeMap.map((row, index) => {
                                                    const placeholders = [
                                                        state.purposeIntegrated.integratedPurpose || 'Conecta tu propósito integrado.',
                                                        state.executiveBrand.canvas.transformation || 'Describe la promesa de valor que sostiene la causa.',
                                                        state.brandValues.coreValues.filter(Boolean).join(', ') || 'Nombra los valores de marca más relevantes.',
                                                        state.leadershipArchetype.centralChoice.primary || 'Indica el arquetipo que mejor la expresa.',
                                                        state.socialCause.strategicCause || 'Escribe la causa social elegida.',
                                                        'Define qué aporte visible harás desde tu liderazgo.'
                                                    ]

                                                    return (
                                                        <tr key={row.element} className="border-t border-slate-200">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.element}</td>
                                                            <td className="px-4 py-3">
                                                                <textarea
                                                                    value={row.formulation}
                                                                    onChange={(event) => updateSocialCauseMapRow(index, event.target.value)}
                                                                    placeholder={placeholders[index]}
                                                                    disabled={isLocked}
                                                                    rows={3}
                                                                    className={TEXTAREA_CLASS}
                                                                />
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            {SOCIAL_CAUSE_MAP_ELEMENTS.map((element, index) => (
                                                <p key={`social-cause-map-example-${element}`}>
                                                    <span className="font-semibold text-slate-900">{element}:</span> {SOCIAL_CAUSE_MAP_EXAMPLE[index]}
                                                </p>
                                            ))}
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                socialCauseMapComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {socialCauseMapComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveSocialCauseBlock('Bloque 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 5 — Vehículos de activación</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            La causa necesita vehículos concretos para volverse visible, verificable y coherente con tu liderazgo.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[980px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Vehículo de activación</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué haré concretamente</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">A quién impacta</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Señal visible de avance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.socialCause.activationVehicles.map((row, index) => (
                                                    <tr key={`social-cause-activation-${index}`} className="border-t border-slate-200">
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.vehicle}
                                                                onChange={(event) =>
                                                                    updateSocialCauseActivationVehicle(index, 'vehicle', event.target.value)
                                                                }
                                                                placeholder="Ej. Mentoría, contenidos, decisiones organizacionales."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.concreteAction}
                                                                onChange={(event) =>
                                                                    updateSocialCauseActivationVehicle(index, 'concreteAction', event.target.value)
                                                                }
                                                                placeholder="Qué harás de forma concreta."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.impactedAudience}
                                                                onChange={(event) =>
                                                                    updateSocialCauseActivationVehicle(index, 'impactedAudience', event.target.value)
                                                                }
                                                                placeholder="Qué personas, equipos o comunidades impacta."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.visibleSignal}
                                                                onChange={(event) =>
                                                                    updateSocialCauseActivationVehicle(index, 'visibleSignal', event.target.value)
                                                                }
                                                                placeholder="Qué señal visible confirmará avance."
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

                                    {showSocialCauseActivationSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Define cómo harás visible esta causa en acciones reales.
                                        </div>
                                    )}

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[900px] w-full text-sm text-slate-700">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                                                        <th className="pb-2 pr-4">Vehículo</th>
                                                        <th className="pb-2 pr-4">Acción</th>
                                                        <th className="pb-2 pr-4">Impacto</th>
                                                        <th className="pb-2">Señal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {SOCIAL_CAUSE_ACTIVATION_EXAMPLE.map((row) => (
                                                        <tr key={row.vehicle} className="border-t border-slate-200">
                                                            <td className="py-2 pr-4 font-medium text-slate-900">{row.vehicle}</td>
                                                            <td className="py-2 pr-4">{row.concreteAction}</td>
                                                            <td className="py-2 pr-4">{row.impactedAudience}</td>
                                                            <td className="py-2">{row.visibleSignal}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                socialCauseActivationComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {socialCauseActivationComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveSocialCauseBlock('Bloque 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 6 — Test de legitimidad de la causa</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Verifica si la causa conversa con tu propósito, tu trayectoria, tus valores y tus formas reales de activación.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[840px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pregunta</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sí / No</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.socialCause.legitimacyChecks.map((row, index) => (
                                                    <tr key={row.question} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.question}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                {[
                                                                    { value: 'yes' as YesNoAnswer, label: 'Sí' },
                                                                    { value: 'no' as YesNoAnswer, label: 'No' }
                                                                ].map((option) => (
                                                                    <button
                                                                        key={`${row.question}-${option.value}`}
                                                                        type="button"
                                                                        onClick={() => updateSocialCauseLegitimacyCheck(index, 'verdict', option.value)}
                                                                        disabled={isLocked}
                                                                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                                                            row.verdict === option.value
                                                                                ? option.value === 'yes'
                                                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                                                                    : 'border-rose-300 bg-rose-50 text-rose-800'
                                                                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                    >
                                                                        {option.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.adjustment}
                                                                onChange={(event) =>
                                                                    updateSocialCauseLegitimacyCheck(index, 'adjustment', event.target.value)
                                                                }
                                                                placeholder="Qué debes ajustar para reforzar la legitimidad de la causa."
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

                                    {showSocialCauseTrajectorySuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Aclara qué parte de tu experiencia hace creíble esta causa.
                                        </div>
                                    )}

                                    {showSocialCauseDecorativeSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Revisa si esta causa amplía tu marca o solo la adorna.
                                        </div>
                                    )}

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            <p>
                                                <span className="font-semibold text-slate-900">Señal débil:</span> elegir una causa noble pero desconectada
                                                de la trayectoria, la marca y la capacidad real de aporte.
                                            </p>
                                            <p>
                                                <span className="font-semibold text-slate-900">Señal mejorada:</span> elegir una causa que expande con
                                                legitimidad el propósito, el arquetipo y la promesa de valor, y que ya tiene vehículos concretos de
                                                activación.
                                            </p>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                socialCauseChecksComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {socialCauseChecksComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveSocialCauseBlock('Bloque 6')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Estado de la sección</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Pendiente si no has formulado una causa social y no has definido cómo activarla. Completado si están
                                                diligenciados inventario, matriz, causa formulada, mapa, vehículos y test.
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                socialCauseComplete
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {socialCauseComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(9) && (
                            <article
                                className="wb9-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 9 de 10"
                                data-print-title="Plan de contenido 30-60-90 días"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 9</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">
                                                Plan de contenido 30-60-90 días
                                            </h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Diseña un plan de contenido 30-60-90 días que convierta tu marca ejecutiva en presencia visible,
                                                consistente y estratégica, para que propósito, posicionamiento, causa social y reputación empiecen a
                                                moverse de forma concreta en audiencias relevantes.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowContentPlanHelp(true)}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                <section className="grid gap-4 lg:grid-cols-2">
                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Conceptos eje</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {CONTENT_PLAN_CONCEPTS.map((concept) => (
                                                <li key={concept}>{concept}</li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-base font-bold text-slate-900 md:text-lg">Cierre esperado de esta sección</h3>
                                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                                            {CONTENT_PLAN_SECTION_CLOSURE.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 1 — Definición de la señal central</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Define la percepción, la idea, el tono y el límite reputacional que quieres instalar con consistencia en los
                                            próximos 90 días.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {CONTENT_PLAN_SIGNAL_FIELDS.map((field) => (
                                            <TextAreaField
                                                key={field.key}
                                                label={field.label}
                                                value={state.contentPlan.centralSignal[field.key]}
                                                onChange={(value) => updateContentPlanSignalField(field.key, value)}
                                                placeholder={field.placeholder}
                                                disabled={isLocked}
                                                rows={field.key === 'connectionToBrand' ? 4 : 3}
                                            />
                                        ))}
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            {CONTENT_PLAN_SIGNAL_FIELDS.map((field, index) => (
                                                <p key={`content-plan-signal-example-${field.key}`}>
                                                    <span className="font-semibold text-slate-900">{index + 1}. {field.label}:</span>{' '}
                                                    {CONTENT_PLAN_SIGNAL_EXAMPLE[field.key]}
                                                </p>
                                            ))}
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                contentPlanSignalComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {contentPlanSignalComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveContentPlanBlock('Bloque 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 2 — Arquitectura de pilares</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Define tres pilares simples y estratégicos para que tu visibilidad no se disperse.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[760px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pilar de contenido</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué mostraré aquí</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué percepción quiero reforzar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.contentPlan.pillars.map((row, index) => (
                                                    <tr key={row.pillar} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.pillar}</td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.whatToShow}
                                                                onChange={(event) => updateContentPlanPillarRow(index, 'whatToShow', event.target.value)}
                                                                placeholder="Qué mostrarás de forma recurrente en este pilar."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.reinforcedPerception}
                                                                onChange={(event) =>
                                                                    updateContentPlanPillarRow(index, 'reinforcedPerception', event.target.value)
                                                                }
                                                                placeholder="Qué percepción quieres reforzar con este pilar."
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[760px] w-full text-sm text-slate-700">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                                                        <th className="pb-2 pr-4">Pilar</th>
                                                        <th className="pb-2 pr-4">Qué mostraré</th>
                                                        <th className="pb-2">Percepción</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {CONTENT_PLAN_PILLAR_EXAMPLE.map((row) => (
                                                        <tr key={row.pillar} className="border-t border-slate-200">
                                                            <td className="py-2 pr-4 font-medium text-slate-900">{row.pillar}</td>
                                                            <td className="py-2 pr-4">{row.whatToShow}</td>
                                                            <td className="py-2">{row.reinforcedPerception}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                contentPlanPillarsComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {contentPlanPillarsComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveContentPlanBlock('Bloque 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 3 — Matriz contenido-canal-objetivo</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Cada pieza debe reforzar una señal de marca y tener un objetivo claro. No todo contenido persigue lo mismo.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[980px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pieza o tema</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pilar</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Canal</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Objetivo</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Señal de marca que refuerza</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.contentPlan.contentMatrix.map((row, index) => (
                                                    <tr key={`content-plan-matrix-${index}`} className="border-t border-slate-200">
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.piece}
                                                                onChange={(event) => updateContentPlanMatrixRow(index, 'piece', event.target.value)}
                                                                placeholder="Tema o pieza específica."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.pillar}
                                                                onChange={(event) => updateContentPlanMatrixRow(index, 'pillar', event.target.value)}
                                                                placeholder="Autoridad, identidad, legado o combinación."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.channel}
                                                                onChange={(event) => updateContentPlanMatrixRow(index, 'channel', event.target.value)}
                                                                placeholder="LinkedIn, newsletter, conversación, evento."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.objective}
                                                                onChange={(event) => updateContentPlanMatrixRow(index, 'objective', event.target.value)}
                                                                placeholder="Visibilidad, autoridad, confianza, conversación."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.brandSignal}
                                                                onChange={(event) => updateContentPlanMatrixRow(index, 'brandSignal', event.target.value)}
                                                                placeholder="Qué señal de marca refuerza esta pieza."
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

                                    {showContentPlanLooseThemesSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Convierte temas en piezas con objetivo y canal.
                                        </div>
                                    )}

                                    {showContentPlanBrandSignalSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Aclara qué señal de marca refuerza cada pieza.
                                        </div>
                                    )}

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[980px] w-full text-sm text-slate-700">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                                                        <th className="pb-2 pr-4">Pieza</th>
                                                        <th className="pb-2 pr-4">Pilar</th>
                                                        <th className="pb-2 pr-4">Canal</th>
                                                        <th className="pb-2 pr-4">Objetivo</th>
                                                        <th className="pb-2">Señal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {CONTENT_PLAN_MATRIX_EXAMPLE.map((row) => (
                                                        <tr key={row.piece} className="border-t border-slate-200">
                                                            <td className="py-2 pr-4 font-medium text-slate-900">{row.piece}</td>
                                                            <td className="py-2 pr-4">{row.pillar}</td>
                                                            <td className="py-2 pr-4">{row.channel}</td>
                                                            <td className="py-2 pr-4">{row.objective}</td>
                                                            <td className="py-2">{row.brandSignal}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                contentPlanMatrixComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {contentPlanMatrixComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveContentPlanBlock('Bloque 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 4 — Calendario 30-60-90</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Diseña una progresión real: activar, consolidar y amplificar. Cada horizonte debe tener un objetivo y un
                                            resultado distinto.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[980px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Horizonte</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Objetivo del tramo</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué contenido priorizaré</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Canal / formato principal</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Resultado esperado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.contentPlan.calendar.map((row, index) => (
                                                    <tr key={row.horizon} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.horizon}</td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.stretchObjective}
                                                                onChange={(event) => updateContentPlanCalendarRow(index, 'stretchObjective', event.target.value)}
                                                                placeholder="Qué buscas lograr en este tramo."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.prioritizedContent}
                                                                onChange={(event) => updateContentPlanCalendarRow(index, 'prioritizedContent', event.target.value)}
                                                                placeholder="Qué tipo de contenido priorizarás."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.mainChannel}
                                                                onChange={(event) => updateContentPlanCalendarRow(index, 'mainChannel', event.target.value)}
                                                                placeholder="Canal o formato principal."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.expectedResult}
                                                                onChange={(event) => updateContentPlanCalendarRow(index, 'expectedResult', event.target.value)}
                                                                placeholder="Qué resultado reputacional esperas."
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

                                    {showContentPlanProgressionSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Diferencia activación, consolidación y amplificación.
                                        </div>
                                    )}

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[980px] w-full text-sm text-slate-700">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                                                        <th className="pb-2 pr-4">Horizonte</th>
                                                        <th className="pb-2 pr-4">Objetivo</th>
                                                        <th className="pb-2 pr-4">Contenido</th>
                                                        <th className="pb-2 pr-4">Canal</th>
                                                        <th className="pb-2">Resultado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {CONTENT_PLAN_CALENDAR_EXAMPLE.map((row) => (
                                                        <tr key={row.horizon} className="border-t border-slate-200">
                                                            <td className="py-2 pr-4 font-medium text-slate-900">{row.horizon}</td>
                                                            <td className="py-2 pr-4">{row.stretchObjective}</td>
                                                            <td className="py-2 pr-4">{row.prioritizedContent}</td>
                                                            <td className="py-2 pr-4">{row.mainChannel}</td>
                                                            <td className="py-2">{row.expectedResult}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                contentPlanCalendarComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {contentPlanCalendarComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveContentPlanBlock('Bloque 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 5 — Backlog priorizado</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Convierte la estrategia en piezas concretas. El backlog debe cubrir los tres horizontes del plan.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1120px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pieza / tema</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pilar</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Horizonte</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Canal / formato</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Objetivo</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Prioridad</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.contentPlan.backlog.map((row, index) => (
                                                    <tr key={`content-plan-backlog-${index}`} className="border-t border-slate-200">
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.piece}
                                                                onChange={(event) => updateContentPlanBacklogRow(index, 'piece', event.target.value)}
                                                                placeholder="Título o pieza concreta."
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className={TEXTAREA_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                value={row.pillar}
                                                                onChange={(event) => updateContentPlanBacklogRow(index, 'pillar', event.target.value)}
                                                                placeholder="Autoridad, identidad, legado."
                                                                disabled={isLocked}
                                                                className={INPUT_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                value={row.horizon}
                                                                onChange={(event) => updateContentPlanBacklogRow(index, 'horizon', event.target.value)}
                                                                disabled={isLocked}
                                                                className={INPUT_CLASS}
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {CONTENT_PLAN_HORIZONS.map((horizon) => (
                                                                    <option key={`content-plan-backlog-horizon-${index}-${horizon}`} value={horizon}>
                                                                        {horizon}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                value={row.channelFormat}
                                                                onChange={(event) =>
                                                                    updateContentPlanBacklogRow(index, 'channelFormat', event.target.value)
                                                                }
                                                                placeholder="LinkedIn post, carrusel, artículo."
                                                                disabled={isLocked}
                                                                className={INPUT_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                value={row.objective}
                                                                onChange={(event) => updateContentPlanBacklogRow(index, 'objective', event.target.value)}
                                                                placeholder="Autoridad, prueba, huella, conversación."
                                                                disabled={isLocked}
                                                                className={INPUT_CLASS}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                value={row.priority}
                                                                onChange={(event) => updateContentPlanBacklogRow(index, 'priority', event.target.value)}
                                                                placeholder="Alta, media-alta, media."
                                                                disabled={isLocked}
                                                                className={INPUT_CLASS}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-[1120px] w-full text-sm text-slate-700">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                                                        <th className="pb-2 pr-4">Pieza</th>
                                                        <th className="pb-2 pr-4">Pilar</th>
                                                        <th className="pb-2 pr-4">Horizonte</th>
                                                        <th className="pb-2 pr-4">Canal</th>
                                                        <th className="pb-2 pr-4">Objetivo</th>
                                                        <th className="pb-2">Prioridad</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {CONTENT_PLAN_BACKLOG_EXAMPLE.map((row) => (
                                                        <tr key={`${row.horizon}-${row.piece}`} className="border-t border-slate-200">
                                                            <td className="py-2 pr-4 font-medium text-slate-900">{row.piece}</td>
                                                            <td className="py-2 pr-4">{row.pillar}</td>
                                                            <td className="py-2 pr-4">{row.horizon}</td>
                                                            <td className="py-2 pr-4">{row.channelFormat}</td>
                                                            <td className="py-2 pr-4">{row.objective}</td>
                                                            <td className="py-2">{row.priority}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                contentPlanBacklogComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {contentPlanBacklogComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveContentPlanBlock('Bloque 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 6 — Cadencia, ritmo y revisión</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Una marca se consolida por repetición con criterio. Define un ritmo sostenible y una forma de revisar
                                            aprendizajes.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {CONTENT_PLAN_CADENCE_FIELDS.map((field) => (
                                            <TextAreaField
                                                key={field.key}
                                                label={field.label}
                                                value={state.contentPlan.cadence[field.key]}
                                                onChange={(value) => updateContentPlanCadenceField(field.key, value)}
                                                placeholder={field.placeholder}
                                                disabled={isLocked}
                                                rows={3}
                                            />
                                        ))}
                                    </div>

                                    {showContentPlanCadenceSuggestion && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Ajusta a un ritmo sostenible.
                                        </div>
                                    )}

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            {CONTENT_PLAN_CADENCE_FIELDS.map((field) => (
                                                <p key={`content-plan-cadence-example-${field.key}`}>
                                                    <span className="font-semibold text-slate-900">{field.label}:</span>{' '}
                                                    {CONTENT_PLAN_CADENCE_EXAMPLE[field.key]}
                                                </p>
                                            ))}
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                contentPlanCadenceComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {contentPlanCadenceComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveContentPlanBlock('Bloque 6')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Bloque 7 — Test de coherencia del plan</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            Verifica si el plan hace visible tu marca, tiene lógica progresiva y puede sostener reputación externa.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[840px] w-full rounded-2xl border border-slate-200 overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pregunta</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sí / No</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.contentPlan.coherenceChecks.map((row, index) => (
                                                    <tr key={row.question} className="border-t border-slate-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.question}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                {[
                                                                    { value: 'yes' as YesNoAnswer, label: 'Sí' },
                                                                    { value: 'no' as YesNoAnswer, label: 'No' }
                                                                ].map((option) => (
                                                                    <button
                                                                        key={`${row.question}-${option.value}`}
                                                                        type="button"
                                                                        onClick={() => updateContentPlanCheck(index, 'verdict', option.value)}
                                                                        disabled={isLocked}
                                                                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                                                            row.verdict === option.value
                                                                                ? option.value === 'yes'
                                                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                                                                    : 'border-rose-300 bg-rose-50 text-rose-800'
                                                                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                    >
                                                                        {option.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <textarea
                                                                value={row.adjustment}
                                                                onChange={(event) => updateContentPlanCheck(index, 'adjustment', event.target.value)}
                                                                placeholder="Qué debes ajustar para fortalecer el plan."
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

                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                                            <p>
                                                <span className="font-semibold text-slate-900">Señal débil:</span> plan de contenido abundante, pero
                                                desconectado de marca, causa y tono.
                                            </p>
                                            <p>
                                                <span className="font-semibold text-slate-900">Señal mejorada:</span> plan donde cada pieza refuerza una
                                                percepción, una señal y una dirección reputacional.
                                            </p>
                                        </div>
                                    </details>

                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                contentPlanChecksComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {contentPlanChecksComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => saveContentPlanBlock('Bloque 7')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Estado de la sección</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                Pendiente si no has definido señal central, pilares y calendario 30-60-90. Completado si están
                                                diligenciados señal, pilares, matriz, calendario, backlog, cadencia y test.
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                contentPlanComplete
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {contentPlanComplete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(10) && (
                            <article
                                className="wb9-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 10 de 10"
                                data-print-title="Evaluación"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Página 10</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-4xl">
                                                Evaluación
                                            </h2>
                                            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                                                Objetivo: permitir que mentor y líder evalúen con evidencia, definan decisiones por criterio y cierren
                                                con síntesis de acuerdos de 30 días.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowEvaluationHelp(true)}
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                </header>

                                {!isExportingAll && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5 space-y-4">
                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                                            {EVALUATION_STAGES.map((stage) => {
                                                const isActive = evaluationStage === stage.key
                                                const isComplete = evaluationStageCompletionMap[stage.key]

                                                return (
                                                    <button
                                                        key={`wb9-evaluation-stage-${stage.key}`}
                                                        type="button"
                                                        onClick={() => changeEvaluationStage(stage.key)}
                                                        className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors md:text-sm ${
                                                            isActive
                                                                ? 'border-blue-300 bg-blue-50 text-blue-800'
                                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <p>{stage.label}</p>
                                                        <p className={`mt-1 text-[11px] ${isComplete ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                            {isComplete ? 'Completado' : 'Pendiente'}
                                                        </p>
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={goPrevEvaluationStage}
                                                disabled={!hasPrevEvaluationStage}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Atrás
                                            </button>
                                            <button
                                                type="button"
                                                onClick={goNextEvaluationStage}
                                                disabled={!hasNextEvaluationStage}
                                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    </section>
                                )}

                                {(evaluationStage === 'mentor' || isExportingAll) && (
                                    <section className="space-y-5">
                                        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900 md:text-lg">A) Instrucciones para el mentor (rúbricas)</h3>
                                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                        Evalúa cada criterio con evidencia observable reciente y cierra con una decisión global del workbook.
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs text-slate-500">
                                                        Criterios completos: {mentorCompletedRows}/{state.evaluation.mentorRows.length}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowEvaluationLevelReference((current) => !current)}
                                                        className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                                                    >
                                                        {showEvaluationLevelReference ? 'Ocultar referencia' : 'Ver referencia de niveles'}
                                                    </button>
                                                </div>
                                            </div>

                                            <ul className="space-y-2 text-sm leading-relaxed text-slate-700">
                                                {WB9_MENTOR_INSTRUCTIONS.map((instruction) => (
                                                    <li key={instruction} className="flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700" />
                                                        <span>{instruction}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {(showEvaluationLevelReference || isExportingAll) && (
                                                <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                    <p className="text-sm font-semibold text-slate-900">Referencia de niveles (1-4)</p>
                                                    <div className="mt-4 overflow-x-auto">
                                                        <table className="min-w-[520px] w-full overflow-hidden rounded-lg border border-blue-200 bg-white">
                                                            <thead>
                                                                <tr className="bg-blue-100">
                                                                    <th className="border-b border-blue-200 px-3 py-2 text-left text-xs font-bold text-blue-800">
                                                                        Nivel
                                                                    </th>
                                                                    <th className="border-b border-blue-200 px-3 py-2 text-left text-xs font-bold text-blue-800">
                                                                        Descriptor
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {WB9_MENTOR_LEVEL_REFERENCE.map((item) => (
                                                                    <tr key={item.level} className="odd:bg-white even:bg-blue-50/40">
                                                                        <td className="border-b border-blue-100 px-3 py-2 text-sm font-semibold text-slate-900">
                                                                            {item.level}
                                                                        </td>
                                                                        <td className="border-b border-blue-100 px-3 py-2 text-sm text-slate-700">
                                                                            {item.descriptor}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </article>
                                            )}
                                        </article>

                                        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900">Formato de evaluación del mentor</h3>
                                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                        Marca un nivel por criterio, registra evidencia observable y define la decisión de seguimiento.
                                                    </p>
                                                </div>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        evaluationMentorComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {evaluationMentorComplete ? 'Completado' : 'Pendiente'}
                                                </span>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="min-w-[1180px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                                    <thead className="bg-slate-100">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                                Criterio
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                                Nivel
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                                Comentario / evidencia observable
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                                Decisión del mentor
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {state.evaluation.mentorRows.map((row, index) => (
                                                            <tr key={row.criterion} className="border-t border-slate-200 align-top">
                                                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.criterion}</td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {MENTOR_LEVEL_OPTIONS.map((level) => (
                                                                            <button
                                                                                key={`${row.criterion}-${level}`}
                                                                                type="button"
                                                                                onClick={() => updateEvaluationMentorRow(index, 'level', level)}
                                                                                disabled={isLocked}
                                                                                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                                                                    row.level === level
                                                                                        ? 'border-blue-300 bg-blue-50 text-blue-800'
                                                                                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                                                } disabled:cursor-not-allowed disabled:opacity-50`}
                                                                            >
                                                                                {level}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <textarea
                                                                        value={row.evidence}
                                                                        onChange={(event) => updateEvaluationMentorRow(index, 'evidence', event.target.value)}
                                                                        placeholder="Hechos, conversaciones o conductas observadas en los últimos 90 días."
                                                                        disabled={isLocked}
                                                                        rows={4}
                                                                        className={TEXTAREA_CLASS}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex flex-col gap-2">
                                                                        {MENTOR_DECISION_OPTIONS.map((decision) => (
                                                                            <button
                                                                                key={`${row.criterion}-${decision}`}
                                                                                type="button"
                                                                                onClick={() => updateEvaluationMentorRow(index, 'decision', decision)}
                                                                                disabled={isLocked}
                                                                                className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                                                                                    row.decision === decision
                                                                                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                                                                                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                                                } disabled:cursor-not-allowed disabled:opacity-50`}
                                                                            >
                                                                                {decision}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {showEvaluationMentorEvidenceSuggestion && (
                                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                    Agrega evidencia observable reciente por criterio.
                                                </div>
                                            )}

                                            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                                                <label className="block space-y-1.5">
                                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                        Observaciones generales del mentor
                                                    </span>
                                                    <textarea
                                                        value={state.evaluation.mentorGeneralNotes}
                                                        onChange={(event) => setEvaluationMentorGeneralNotes(event.target.value)}
                                                        placeholder="Resume patrones, alertas y recomendaciones globales del workbook."
                                                        disabled={isLocked}
                                                        rows={6}
                                                        className={TEXTAREA_CLASS}
                                                    />
                                                </label>

                                                <fieldset className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                    <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                        Decisión global del WB
                                                    </legend>
                                                    <div className="mt-2 flex flex-col gap-2">
                                                        {MENTOR_DECISION_OPTIONS.map((decision) => (
                                                            <button
                                                                key={`wb9-mentor-global-${decision}`}
                                                                type="button"
                                                                onClick={() => setEvaluationMentorGlobalDecision(decision)}
                                                                disabled={isLocked}
                                                                className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                                                                    state.evaluation.mentorGlobalDecision === decision
                                                                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                                                                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                                                } disabled:cursor-not-allowed disabled:opacity-50`}
                                                            >
                                                                {decision}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </fieldset>
                                            </div>

                                            {showEvaluationGlobalDecisionSuggestion && (
                                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                    Cierra la evaluación con una decisión global de seguimiento.
                                                </div>
                                            )}

                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => saveEvaluationBlock('Bloque mentor')}
                                                    disabled={isLocked}
                                                    className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                                >
                                                    Guardar bloque mentor
                                                </button>
                                            </div>
                                        </section>
                                    </section>
                                )}

                                {(evaluationStage === 'leader' || isExportingAll) && (
                                    <section className="space-y-5">
                                        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900 md:text-lg">B) Instrucciones para el líder (autoevaluación)</h3>
                                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                        Responde desde hechos concretos, evidencia observable y compromisos accionables para los próximos 30 días.
                                                    </p>
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    Preguntas completas: {leaderCompletedRows}/{state.evaluation.leaderRows.length}
                                                </span>
                                            </div>

                                            <ul className="space-y-2 text-sm leading-relaxed text-slate-700">
                                                {WB9_LEADER_INSTRUCTIONS.map((instruction) => (
                                                    <li key={instruction} className="flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700" />
                                                        <span>{instruction}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
                                                Usa este bloque como base para una conversación de desarrollo clara y útil con el mentor.
                                            </div>
                                        </article>

                                        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900">Preguntas de autoevaluación del líder</h3>
                                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                        Responde desde hechos, evidencia reciente y un compromiso concreto de 30 días por cada pregunta.
                                                    </p>
                                                </div>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        evaluationLeaderComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {evaluationLeaderComplete ? 'Completado' : 'Pendiente'}
                                                </span>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="min-w-[1100px] w-full overflow-hidden rounded-2xl border border-slate-200">
                                                    <thead className="bg-slate-100">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                                Pregunta
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                                Respuesta del líder
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                                Evidencia / ejemplo
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                                Acción o compromiso (30 días)
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {state.evaluation.leaderRows.map((row, index) => (
                                                            <tr key={row.question} className="border-t border-slate-200 align-top">
                                                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.question}</td>
                                                                <td className="px-4 py-3">
                                                                    <textarea
                                                                        value={row.response}
                                                                        onChange={(event) => updateEvaluationLeaderRow(index, 'response', event.target.value)}
                                                                        placeholder="Respuesta concreta y reciente."
                                                                        disabled={isLocked}
                                                                        rows={4}
                                                                        className={TEXTAREA_CLASS}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <textarea
                                                                        value={row.evidence}
                                                                        onChange={(event) => updateEvaluationLeaderRow(index, 'evidence', event.target.value)}
                                                                        placeholder="Caso, situación o ejemplo observable."
                                                                        disabled={isLocked}
                                                                        rows={4}
                                                                        className={TEXTAREA_CLASS}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <textarea
                                                                        value={row.action}
                                                                        onChange={(event) => updateEvaluationLeaderRow(index, 'action', event.target.value)}
                                                                        placeholder="Compromiso concreto para los próximos 30 días."
                                                                        disabled={isLocked}
                                                                        rows={4}
                                                                        className={TEXTAREA_CLASS}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {showEvaluationLeaderActionSuggestion && (
                                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                    Convierte la reflexión en un compromiso de 30 días.
                                                </div>
                                            )}

                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => saveEvaluationBlock('Bloque líder')}
                                                    disabled={isLocked}
                                                    className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                                >
                                                    Guardar bloque líder
                                                </button>
                                            </div>
                                        </section>
                                    </section>
                                )}

                                {(evaluationStage === 'synthesis' || isExportingAll) && (
                                    <section className="space-y-5">
                                        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900 md:text-lg">C) Síntesis de acuerdos Mentor-Líder</h3>
                                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                        Cierra la evaluación con acuerdos claros, foco de desarrollo y próximos hitos verificables.
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        evaluationSynthesisComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {evaluationSynthesisComplete ? 'Completado' : 'Pendiente'}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed text-slate-700">
                                                Resume prioridades compartidas, responsables, compromisos de 30 días y señales que revisarán en el siguiente
                                                seguimiento.
                                            </p>
                                        </article>

                                        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                            <label className="block space-y-1.5">
                                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                    Síntesis de acuerdos Mentor-Líder
                                                </span>
                                                <textarea
                                                    value={state.evaluation.agreementsSynthesis}
                                                    onChange={(event) => setEvaluationAgreementsSynthesis(event.target.value)}
                                                    placeholder="Resume acuerdos, compromisos, foco de seguimiento y próximos hitos."
                                                    disabled={isLocked}
                                                    rows={7}
                                                    className={TEXTAREA_CLASS}
                                                />
                                            </label>

                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => saveEvaluationBlock('Síntesis de acuerdos')}
                                                    disabled={isLocked}
                                                    className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                                                >
                                                    Guardar síntesis
                                                </button>
                                            </div>
                                        </section>
                                    </section>
                                )}

                                {(evaluationStage === 'final' || isExportingAll) && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Cierre</h3>
                                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                    Revisa si el mentor, el líder y la síntesis final ya dejan una conversación cerrada con evidencia,
                                                    decisiones y acuerdos accionables.
                                                </p>
                                            </div>

                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                    evaluationComplete
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-300 bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {evaluationComplete ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                                                <p className="font-semibold text-slate-900">Pantalla 1 - Mentor</p>
                                                <p className="mt-1">{mentorCompletedRows}/{state.evaluation.mentorRows.length} criterios completos</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {evaluationMentorComplete ? 'Listo para seguimiento' : 'Faltan evidencia, notas o decisión global'}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                                                <p className="font-semibold text-slate-900">Pantalla 2 - Líder</p>
                                                <p className="mt-1">{leaderCompletedRows}/{state.evaluation.leaderRows.length} respuestas completas</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {evaluationLeaderComplete ? 'Autodiagnóstico completo' : 'Faltan respuestas, evidencia o compromisos'}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                                                <p className="font-semibold text-slate-900">Pantalla 3 - Síntesis</p>
                                                <p className="mt-1">{evaluationSynthesisComplete ? 'Síntesis lista' : 'Síntesis pendiente'}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {evaluationSynthesisComplete ? 'Hay acuerdos compartidos' : 'Falta cerrar acuerdos y próximos pasos'}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                                                <p className="font-semibold text-slate-900">Decisión global</p>
                                                <p className="mt-1">{state.evaluation.mentorGlobalDecision || 'Pendiente'}</p>
                                                <p className="mt-1 text-xs text-slate-500">Estado final del workbook para el seguimiento</p>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </article>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb9-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
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

                        {showPurposeHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Propósito integrado</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPurposeHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            Cerrar
                                        </button>
                                    </div>

                                    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                                        <p>Propósito integrado no es una frase bonita: debe conectar experiencia, aporte, impacto y legado.</p>
                                        <p>Una buena formulación puede alimentar después tu promesa de valor, tu causa social, tu LinkedIn y tu storytelling.</p>
                                        <p>La marca ejecutiva se vuelve más sólida cuando el propósito también ordena la vida, no solo el cargo.</p>
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <p className="font-semibold text-slate-900">Ejemplo de formulación útil</p>
                                            <p className="mt-2">
                                                “Estoy aquí para impulsar el cambio e inspirar crecimiento real en personas y organizaciones.”
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="font-semibold text-slate-900">Recuerda</p>
                                            <ul className="mt-2 space-y-2">
                                                <li>Tu propósito debe decir qué transformas y en quién.</li>
                                                <li>Debe conversar con una contribución social o humana verificable.</li>
                                                <li>Si solo valida ego o visibilidad, la marca se debilita.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showExecutiveBrandHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Marca ejecutiva</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveBrandHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            Cerrar
                                        </button>
                                    </div>

                                    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                                        <p>Marca ejecutiva no es imagen superficial: es percepción estratégica sostenida por evidencia, conducta y resultados.</p>
                                        <p>Una marca sólida conecta diferenciador, audiencia, problema, tono y prueba en una formulación legible.</p>
                                        <p>El cargo puede sumar, pero no debe ser el centro del posicionamiento.</p>
                                        <p>Cuando la marca es clara, puede alimentar LinkedIn, storytelling, networking y visibilidad con mayor coherencia.</p>
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <p className="font-semibold text-slate-900">Ejemplo de promesa de valor</p>
                                            <p className="mt-2">“Transformo la cadena de suministro en una ventaja competitiva con impacto sostenible.”</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBrandValuesHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Valores de marca</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBrandValuesHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            Cerrar
                                        </button>
                                    </div>

                                    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                                        <p>Los valores de marca no son palabras decorativas: deben poder observarse en decisiones, comportamientos y reputación.</p>
                                        <p>Una marca sólida necesita valores probados, no solo deseados o aspiracionales.</p>
                                        <p>Los no negociables ayudan a proteger coherencia bajo presión y vuelven más legible tu criterio ético.</p>
                                        <p>Cuando los valores están claros, ordenan posicionamiento, narrativa y reputación externa con mayor credibilidad.</p>
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <p className="font-semibold text-slate-900">Ejemplo de núcleo de marca</p>
                                            <p className="mt-2">Honestidad, coherencia, responsabilidad, visión e impacto colectivo.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showLeadershipArchetypeHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Arquetipo de liderazgo</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowLeadershipArchetypeHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            Cerrar
                                        </button>
                                    </div>

                                    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                                        <p>El arquetipo no reemplaza tu marca: la ordena y la vuelve más legible, recordable y coherente.</p>
                                        <p>Un buen arquetipo resume tu estilo de liderazgo de forma creíble y conversa con propósito, valores, tono y reputación.</p>
                                        <p>También necesitas identificar su sombra para evitar excesos que debiliten la percepción de tu liderazgo.</p>
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <p className="font-semibold text-slate-900">Ejemplo de código simbólico</p>
                                            <p className="mt-2">El faro: dirección, calma en la tormenta y guía estratégica en la incertidumbre.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showLinkedInProfileHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Perfil LinkedIn optimizado</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowLinkedInProfileHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            Cerrar
                                        </button>
                                    </div>

                                    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                                        <p>LinkedIn no es solo un CV digital: debe comunicar propuesta de valor, no solo trayectoria.</p>
                                        <p>Headline, banner y “Acerca de” son las tres piezas más críticas para volver legible tu marca ejecutiva.</p>
                                        <p>La mejor visibilidad digital viene del pensamiento, la claridad y la coherencia, no del exceso de autopromoción.</p>
                                        <p>Un buen perfil convierte experiencia, reputación y criterio en una presencia capaz de abrir oportunidades reales.</p>
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <p className="font-semibold text-slate-900">Principio guía</p>
                                            <p className="mt-2">Ser visible por tu pensamiento, no solo por tu CV.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showSocialCauseHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Causa social estratégica</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowSocialCauseHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            Cerrar
                                        </button>
                                    </div>

                                    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                                        <p>Causa social estratégica no es una frase altruista aislada: debe conversar con propósito, valores, promesa de valor y trayectoria.</p>
                                        <p>Una causa sólida necesita vehículos de activación para que se vuelva visible, verificable y sostenible en el tiempo.</p>
                                        <p>La causa amplía tu marca cuando agrega huella colectiva, no cuando la desvía o la vuelve decorativa.</p>
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <p className="font-semibold text-slate-900">Ejemplo de formulación útil</p>
                                            <p className="mt-2">
                                                Impulsar el cambio de mentalidad en Latinoamérica: demostrar que sí se puede construir empresas competitivas,
                                                sostenibles y humanas.
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="font-semibold text-slate-900">Recuerda</p>
                                            <ul className="mt-2 space-y-2">
                                                <li>Tu causa debe conectarse con algo que ya sea creíble en tu historia.</li>
                                                <li>Necesita una forma visible de activarse en decisiones, contenidos, mentoría o liderazgo.</li>
                                                <li>Si solo adorna tu narrativa, no está ampliando realmente tu marca ejecutiva.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showContentPlanHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Plan de contenido 30-60-90 días</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowContentPlanHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            Cerrar
                                        </button>
                                    </div>

                                    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                                        <p>Un plan 30-60-90 no es una lista de ideas: es una arquitectura de posicionamiento organizada por activación, consolidación y amplificación.</p>
                                        <p>Cada contenido debería reforzar propósito, marca, valores, arquetipo o causa, y no solo aumentar actividad superficial.</p>
                                        <p>La repetición coherente instala reputación; por eso necesitas backlog, cadencia y revisión, no improvisación constante.</p>
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <p className="font-semibold text-slate-900">Principio guía</p>
                                            <p className="mt-2">La visibilidad útil aparece cuando cada pieza deja una señal clara y acumulable en el tiempo.</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="font-semibold text-slate-900">Recuerda</p>
                                            <ul className="mt-2 space-y-2">
                                                <li>No publiques de todo: define pocos pilares y repítelos con criterio.</li>
                                                <li>Convierte temas en piezas con objetivo, canal y señal de marca.</li>
                                                <li>Ajusta la cadencia a un ritmo que realmente puedas sostener.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showEvaluationHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Evaluación</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowEvaluationHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            Cerrar
                                        </button>
                                    </div>

                                    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                                        <p>La evaluación final no busca opinión general, sino evidencia observable reciente sobre marca, coherencia, reputación y legado.</p>
                                        <p>El mentor debe marcar un solo nivel por criterio, registrar evidencia concreta y cerrar con una decisión por criterio y una decisión global del workbook.</p>
                                        <p>La autoevaluación del líder debe aterrizarse en hechos, ejemplos y acciones de 30 días para facilitar un plan de desarrollo útil.</p>
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <p className="font-semibold text-slate-900">Principio guía</p>
                                            <p className="mt-2">La evaluación cierra `WB9` cuando reputación, intención y seguimiento quedan conectados en decisiones concretas.</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="font-semibold text-slate-900">Recuerda</p>
                                            <ul className="mt-2 space-y-2">
                                                <li>Usa evidencia observable de los últimos 90 días.</li>
                                                <li>Evita respuestas declarativas sin ejemplo o sin compromiso.</li>
                                                <li>La síntesis final debe dejar acuerdos accionables entre mentor y líder.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    .wb9-toolbar,
                    .wb9-sidebar,
                    .wb9-page-nav {
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

                    .wb9-print-page {
                        break-after: page;
                        page-break-after: always;
                        position: relative;
                        box-shadow: none !important;
                    }

                    .wb9-print-page:not(.wb9-cover-page)::before {
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

                    .wb9-print-page::after {
                        content: attr(data-print-meta);
                        position: absolute;
                        bottom: -10mm;
                        left: 0;
                        font-size: 9px;
                        letter-spacing: 0.04em;
                        color: #475569;
                    }

                    .wb9-cover-page {
                        min-height: calc(297mm - 36mm);
                    }

                    .wb9-cover-page::before {
                        content: none !important;
                    }

                    .wb9-cover-hero {
                        min-height: 54vh !important;
                    }
                }
            `}</style>
        </div>
    )
}
