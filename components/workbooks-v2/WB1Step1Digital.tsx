"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, FileText, Lock, Plus, Printer, X, Trash2 } from 'lucide-react'

type WB1IdentificationFields = {
    leaderName: string
    role: string
    cohort: string
    startDate: string
}

type StoryEventType = 'logro' | 'logro-golpe' | 'golpe'

type StoryEvent = {
    id: string
    type: StoryEventType
    approxDate: string
    happened: string
    interpreted: string
    learned: string
    belief: string
}

type StoryPageFields = {
    timelineRange: string
    actOrigin: string
    actBreak: string
    actRebuild: string
    patternDecision: string[]
    patternTrigger: string[]
    patternResource: string[]
}

type StoryEventDraft = Omit<StoryEvent, 'id'>
type StoryActHelpKey = 'acto1' | 'acto2' | 'acto3'
type StoryActFieldKey = 'actOrigin' | 'actBreak' | 'actRebuild'
type StoryTextFieldKey = 'timelineRange' | 'actOrigin' | 'actBreak' | 'actRebuild'
type PatternListKey = 'patternDecision' | 'patternTrigger' | 'patternResource'
type IdentitySegmentKey = 'roles' | 'principios' | 'presion' | 'calma' | 'aporte' | 'evito' | 'triggers' | 'recursos'

type StoryActGuide = {
    helpKey: StoryActHelpKey
    fieldKey: StoryActFieldKey
    title: string
    guidingQuestions: string[]
    example: string
}

type PatternListConfig = {
    key: PatternListKey
    title: string
    example: string
}

type IdentitySegmentConfig = {
    key: IdentitySegmentKey
    title: string
    color: string
}

type IdentityMatrixFieldKey = 'say' | 'do' | 'impact'

type IdentityMatrixRow = {
    say: string
    do: string
    impact: string
}

type StakeholderFieldKey = 'personRole' | 'strength' | 'blindspot'

type StakeholderRow = {
    personRole: string
    strength: string
    blindspot: string
}

type FundamentalValuesFields = {
    selected10: string[]
    selected5: string[]
    selected3: string[]
}

type ValueDecisionFieldKey = 'decision1' | 'decision2'

type ValueDecisionRow = {
    value: string
    decision1: string
    decision2: string
}

type PageItem = {
    id: number
    label: string
    shortLabel: string
}

const ID_STORAGE_KEY = 'workbooks-v2-wb1-identification'
const STORY_FIELDS_STORAGE_KEY = 'workbooks-v2-wb1-story-fields'
const STORY_EVENTS_STORAGE_KEY = 'workbooks-v2-wb1-story-events'
const IDENTITY_WHEEL_STORAGE_KEY = 'workbooks-v2-wb1-identity-wheel'
const IDENTITY_MATRIX_STORAGE_KEY = 'workbooks-v2-wb1-identity-matrix'
const STAKEHOLDER_MIRROR_STORAGE_KEY = 'workbooks-v2-wb1-stakeholder-mirror'
const FUNDAMENTAL_VALUES_STORAGE_KEY = 'workbooks-v2-wb1-fundamental-values'
const VALUE_DECISIONS_STORAGE_KEY = 'workbooks-v2-wb1-value-decisions'

const STORY_EVENT_LIMIT = 5
const PATTERN_LIST_LIMIT = 10
const IDENTITY_BULLET_LIMIT = 3
const IDENTITY_MATRIX_ROWS = 10
const STAKEHOLDER_ROWS = 3
const VALUE_DECISION_ROWS = 5
const IDENTITY_WHEEL_SIZES = [620, 760, 920] as const

const PAGES: PageItem[] = [
    { id: 1, label: '1. Portada e identificación', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Storytelling personal', shortLabel: 'Storytelling' },
    { id: 4, label: '4. Definición de identidad actual', shortLabel: 'Identidad' },
    { id: 5, label: '5. Valores fundamentales', shortLabel: 'Valores' }
]

const OBJECTIVE_OUTCOMES = [
    'Tu historia personal resumida en una narrativa clara (sin victimismo ni épica vacía).',
    'Una identidad actual definida con hechos (no con adjetivos).',
    'Tus valores fundamentales priorizados y tus no negociables explícitos.',
    'Un mapa de fortalezas y áreas de oportunidad con evidencia reciente.',
    'Un inventario de creencias limitantes (y su origen) y su reemplazo por creencias empoderadoras.',
    'Mantras personales diseñados para sostener conducta bajo presión.',
    'Tu identidad futura 10X (visión, hábitos y decisiones) y un primer plan de activación.'
]

const WORKBOOK_COMPONENTS = [
    'Identidad y coherencia personal',
    'Valores y principios no negociables',
    'Sistema de creencias (mindset)',
    'Reflexión y aprendizaje (autoconciencia)'
]

const FOURSHINE_COMPETENCIES = [
    'Gestión de creencias (mindset)',
    'Integridad y coherencia',
    'Responsabilidad radical (accountability)',
    'Autenticidad',
    'Práctica reflexiva y apertura al feedback',
    'Claridad de propósito y valores (Ikigai como marco)'
]

const OBSERVABLE_BEHAVIORS = [
    'Coherencia: tomas decisiones alineadas con tus valores incluso bajo presión.',
    'Accountability: asumes públicamente tu parte cuando algo falla y defines correcciones concretas.',
    'Mindset: identificas una creencia limitante, la cuestionas y ejecutas un reemplazo conductual.',
    'Autenticidad: sostienes tu estilo sin máscara corporativa y sin perder firmeza.',
    'Reflexión: conviertes experiencias en aprendizaje (registras, sintetizas y ajustas conducta).'
]

const RESPONSE_RULES = [
    'Responde con bullets concretos.',
    'Si puedes, agrega un ejemplo corto (1 línea) por bullet.',
    'No uses adjetivos ("muy intenso"), usa comportamiento ("microgestión", "evito conversar", "me cierro").'
]

const STEP1_IDENTIFICATION_POINTS = ['5 momentos clave', '3 golpes / crisis / quiebres', '3 logros (no solo "éxitos"; también superaciones)']

const EVENT_TEMPLATE_FIELDS = [
    'Tipo',
    'Fecha aproximada',
    'Qué ocurrió (hecho)',
    'Qué decidí / interpreté',
    'Qué aprendí',
    'Qué creencia se instaló'
]

const STEP2_DISCOVERY_ACTS = [
    'Acto 1 (origen): qué identidad se formó',
    'Acto 2 (quiebre): qué creencia fue desafiada',
    'Acto 3 (reconstrucción): qué nueva versión tuya emergió'
]

const STEP2_WRITING_RULES = [
    '10-15 líneas por acto (no más).',
    'Escribe en primera persona (Yo...) y en hechos, no solo emociones.',
    'En cada acto incluye 3 elementos obligatorios: contexto (dónde/época/rol), escena clave (qué pasó), efecto en ti (qué cambió: decisión, creencia, comportamiento).'
]

const STEP3_EXAMPLES: PatternListConfig[] = [
    {
        key: 'patternDecision',
        title: '1. Patrón que se repite en mis decisiones',
        example: 'Bajo presión priorizo control y velocidad sobre conversación (cierro rápido).'
    },
    {
        key: 'patternTrigger',
        title: '2. Situación que más activa miedo/defensa',
        example: 'Crítica o cuestionamiento público (especialmente frente a equipo o dirección).'
    },
    {
        key: 'patternResource',
        title: '3. Mi recurso más consistente',
        example: 'Capacidad de análisis + disciplina para ejecutar (cuando ordeno el problema, avanzo).'
    }
]

const IDENTITY_SEGMENTS: IdentitySegmentConfig[] = [
    { key: 'roles', title: 'Roles clave (líder, padre/madre, profesional, etc.)', color: '#dbeafe' },
    { key: 'principios', title: 'Principios (lo que NO negocias)', color: '#e0e7ff' },
    { key: 'presion', title: 'Estilo bajo presión', color: '#fef3c7' },
    { key: 'calma', title: 'Estilo en calma', color: '#dcfce7' },
    { key: 'aporte', title: 'Lo que aportas (valor)', color: '#cffafe' },
    { key: 'evito', title: 'Lo que evitas', color: '#fee2e2' },
    { key: 'triggers', title: 'Lo que te dispara (triggers)', color: '#fde68a' },
    { key: 'recursos', title: 'Lo que te sostiene (recursos)', color: '#ddd6fe' }
]

const IDENTITY_MATRIX_INSTRUCTIONS = [
    'Escribe frases reales que tú dices como líder (promesas, principios, mensajes frecuentes).',
    'En "Lo que hago", registra hechos recientes (últimos 20-30 días): qué hiciste/dijiste, con quién, en qué contexto.',
    'En "Impacto", escribe el efecto observable en otras personas (conducta, clima, confianza, resultados).',
    'Si hay incoherencia, no la justifiques: solo descríbela. Ahí está el trabajo.'
]

const STAKEHOLDER_MIRROR_INSTRUCTIONS = [
    'Elige 3 personas (idealmente de roles distintos): 1 jefe/sponsor, 1 par/colega y 1 colaborador/alguien a quien lideras.',
    'Para cada persona, escribe tu hipótesis en 2 frases: "Mi fortaleza, según esta persona, sería..." y "Mi punto ciego, según esta persona, sería...".',
    'Sé concreto: describe conductas, no adjetivos.'
]

const VALUE_DECISION_INSTRUCTIONS = [
    'Para cada valor seleccionado previamente como más determinante, escribe 2 decisiones recientes (últimos 20-40 días) que lo demuestren.',
    'Regla: una decisión debe ser observable: elegiste, priorizaste, dijiste no, actuaste, corregiste, conversaste.'
]

const FUNDAMENTAL_VALUES = [
    'Integridad',
    'Honestidad',
    'Responsabilidad',
    'Coherencia',
    'Justicia',
    'Respeto',
    'Humildad',
    'Valentía',
    'Disciplina',
    'Excelencia',
    'Servicio',
    'Impacto',
    'Contribución',
    'Compasión',
    'Empatía',
    'Lealtad',
    'Confianza',
    'Transparencia',
    'Autonomía',
    'Libertad',
    'Seguridad',
    'Estabilidad',
    'Aprendizaje',
    'Crecimiento',
    'Innovación',
    'Creatividad',
    'Colaboración',
    'Familia',
    'Bienestar',
    'Espiritualidad / Sentido'
] as const

const STEP2_ACT_GUIDES: StoryActGuide[] = [
    {
        helpKey: 'acto1',
        fieldKey: 'actOrigin',
        title: 'Acto 1 - Origen (qué te formó)',
        guidingQuestions: [
            '¿Qué tipo de entorno me moldeó (familia, escuela, trabajo, cultura)?',
            '¿Qué reglas no escritas aprendí?',
            '¿Qué gané con esas reglas? ¿Qué me costaron?'
        ],
        example:
            'Crecí aprendiendo que el valor personal se demuestra con resultados y responsabilidad. Desde temprano asumí tareas "de adulto": resolver, responder, no fallar. En la universidad y luego en el trabajo, reforcé esa idea: si entregaba rápido y bien, ganaba confianza y espacio. Empecé a construir una identidad de "persona confiable", pero con una condición: casi no pedía ayuda. Me acostumbré a llevar carga extra para evitar exponer dudas. Con el tiempo, ese patrón se volvió una marca: eficiencia, cumplimiento y control del detalle. La regla interna era clara: "si no tengo certeza, mejor lo resuelvo yo". Esa forma de operar me dio reputación y crecimiento, pero también me entrenó en silencio, autosuficiencia y presión interna.'
    },
    {
        helpKey: 'acto2',
        fieldKey: 'actBreak',
        title: 'Acto 2 - Quiebre (qué me confrontó)',
        guidingQuestions: [
            '¿Qué evento o etapa me mostró que mi manera de operar ya no funcionaba?',
            '¿Qué emoción dominó? ¿Qué perdí o arriesgué?',
            '¿Qué parte de mí quedó en evidencia (miedo, control, orgullo, inseguridad)?'
        ],
        example:
            'Cuando asumí un rol con mayor visibilidad, ya no bastaba con trabajar duro: tenía que coordinar, delegar y sostener conversaciones difíciles. En una reunión importante, un par cuestionó mi propuesta frente a otros y sentí que mi autoridad estaba en juego. Reaccioné defendiendo mi punto con rigidez, cerrando el debate. El equipo se volvió silencioso y al final la decisión no fue mejor, solo fue más rápida. Ahí entendí el quiebre: mi necesidad de control y de "no verme vulnerable" estaba dañando la colaboración. En lugar de construir confianza, estaba construyendo distancia. Me confrontó una verdad incómoda: el liderazgo no se mide por tener siempre la razón, sino por elevar la calidad de las decisiones y del equipo. Ese día vi mi patrón: bajo presión, me cerraba.'
    },
    {
        helpKey: 'acto3',
        fieldKey: 'actRebuild',
        title: 'Acto 3 - Reconstrucción (qué me redefinió)',
        guidingQuestions: [
            '¿Qué decisión tomé después del quiebre?',
            '¿Qué habilidad o virtud desarrollé?',
            '¿Qué nueva identidad empezó a aparecer? (no perfecta, pero real)'
        ],
        example:
            'Después de ese episodio decidí aprender a pausar, preguntar y pedir apoyo de forma específica. Empecé a preparar reuniones con claridad, pero abriendo espacio para perspectivas distintas. Practiqué decir: "No lo tengo completo, necesito tu mirada en esto". También aprendí a separar "ser cuestionado" de "ser desautorizado". En vez de responder para ganar, empecé a responder para construir. Descubrí una nueva forma de firmeza: calma, claridad y escucha. Aún me cuesta cuando siento crítica pública, pero ahora lo veo como un disparador y no como una amenaza absoluta. Me redefiní desde una idea distinta: "mi autoridad crece cuando hago preguntas mejores y sostengo conversaciones más maduras". Ese cambio me devolvió energía, porque ya no tengo que cargar solo.'
    }
]

const EVENT_TYPE_STYLE: Record<StoryEventType, { label: string; nodeClass: string; badgeClass: string }> = {
    logro: {
        label: 'Logro',
        nodeClass: 'bg-emerald-500 border-emerald-600',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    'logro-golpe': {
        label: 'Logro / Golpe',
        nodeClass: 'bg-amber-400 border-amber-500',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    golpe: {
        label: 'Golpe / Crisis / Quiebre',
        nodeClass: 'bg-red-500 border-red-600',
        badgeClass: 'bg-red-100 text-red-800 border-red-200'
    }
}

const EXAMPLE_EVENT: StoryEventDraft = {
    type: 'logro-golpe',
    approxDate: '2021-08',
    happened:
        'Me ascendieron a un rol de mayor responsabilidad. Durante las primeras 3 semanas recibí tareas nuevas sin inducción formal. No pedí apoyo ni aclaré expectativas con mi jefe, aunque tuve dudas en varios entregables.',
    interpreted:
        'Decidí que pedir ayuda o admitir dudas podía hacer que cuestionaran mi capacidad para el cargo. Interpreté que "un líder debe resolver solo" y que mostrar incertidumbre reduce autoridad.',
    learned:
        'Aprendí que mi silencio aumentó el riesgo: trabajé más horas, cometí errores evitables y demoré decisiones por miedo a preguntar. También aprendí que la autoridad real se fortalece cuando pido apoyo específico y tomo decisiones con información completa.',
    belief: 'Si pido ayuda, pierdo autoridad. Un líder debe poder con todo sin mostrar vulnerabilidad.'
}

const defaultEventDraft = (): StoryEventDraft => ({
    type: 'logro',
    approxDate: '',
    happened: '',
    interpreted: '',
    learned: '',
    belief: ''
})

function emptyPatternList() {
    return Array.from({ length: PATTERN_LIST_LIMIT }, () => '')
}

function emptyIdentityList() {
    return Array.from({ length: IDENTITY_BULLET_LIMIT }, () => '')
}

function defaultIdentityWheelFields() {
    return {
        roles: emptyIdentityList(),
        principios: emptyIdentityList(),
        presion: emptyIdentityList(),
        calma: emptyIdentityList(),
        aporte: emptyIdentityList(),
        evito: emptyIdentityList(),
        triggers: emptyIdentityList(),
        recursos: emptyIdentityList()
    } satisfies Record<IdentitySegmentKey, string[]>
}

function defaultIdentityMatrixRows() {
    return Array.from({ length: IDENTITY_MATRIX_ROWS }, () => ({
        say: '',
        do: '',
        impact: ''
    }))
}

function defaultStakeholderRows() {
    return Array.from({ length: STAKEHOLDER_ROWS }, () => ({
        personRole: '',
        strength: '',
        blindspot: ''
    }))
}

function defaultFundamentalValuesFields(): FundamentalValuesFields {
    return {
        selected10: [],
        selected5: [],
        selected3: []
    }
}

function defaultValueDecisionRows() {
    return Array.from({ length: VALUE_DECISION_ROWS }, () => ({
        value: '',
        decision1: '',
        decision2: ''
    }))
}

function normalizePatternList(value: unknown) {
    if (Array.isArray(value)) {
        const list = value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .slice(0, PATTERN_LIST_LIMIT)
        return [...list, ...Array.from({ length: PATTERN_LIST_LIMIT - list.length }, () => '')]
    }

    if (typeof value === 'string') {
        const list = value
            .split('\n')
            .map((line) => line.replace(/^[\s•-]+/, '').trim())
            .filter(Boolean)
            .slice(0, PATTERN_LIST_LIMIT)
        return [...list, ...Array.from({ length: PATTERN_LIST_LIMIT - list.length }, () => '')]
    }

    return emptyPatternList()
}

function normalizeIdentityList(value: unknown) {
    if (Array.isArray(value)) {
        const list = value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .slice(0, IDENTITY_BULLET_LIMIT)
        return [...list, ...Array.from({ length: IDENTITY_BULLET_LIMIT - list.length }, () => '')]
    }

    if (typeof value === 'string') {
        const list = value
            .split('\n')
            .map((line) => line.replace(/^[\s•-]+/, '').trim())
            .filter(Boolean)
            .slice(0, IDENTITY_BULLET_LIMIT)
        return [...list, ...Array.from({ length: IDENTITY_BULLET_LIMIT - list.length }, () => '')]
    }

    return emptyIdentityList()
}

function normalizeIdentityMatrixRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { say: '', do: '', impact: '' }
                }
                const candidate = row as Partial<Record<IdentityMatrixFieldKey, unknown>>
                return {
                    say: typeof candidate.say === 'string' ? candidate.say : '',
                    do: typeof candidate.do === 'string' ? candidate.do : '',
                    impact: typeof candidate.impact === 'string' ? candidate.impact : ''
                }
            })
            .slice(0, IDENTITY_MATRIX_ROWS)

        return [...rows, ...Array.from({ length: IDENTITY_MATRIX_ROWS - rows.length }, () => ({ say: '', do: '', impact: '' }))]
    }

    return defaultIdentityMatrixRows()
}

function normalizeStakeholderRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { personRole: '', strength: '', blindspot: '' }
                }
                const candidate = row as Partial<Record<StakeholderFieldKey, unknown>>
                return {
                    personRole: typeof candidate.personRole === 'string' ? candidate.personRole : '',
                    strength: typeof candidate.strength === 'string' ? candidate.strength : '',
                    blindspot: typeof candidate.blindspot === 'string' ? candidate.blindspot : ''
                }
            })
            .slice(0, STAKEHOLDER_ROWS)

        return [...rows, ...Array.from({ length: STAKEHOLDER_ROWS - rows.length }, () => ({ personRole: '', strength: '', blindspot: '' }))]
    }

    return defaultStakeholderRows()
}

function normalizeFundamentalValuesList(value: unknown, max: number) {
    if (!Array.isArray(value)) return []

    const allowed = new Set<string>(FUNDAMENTAL_VALUES)
    const seen = new Set<string>()
    const next: string[] = []

    for (const item of value) {
        if (typeof item !== 'string') continue
        const trimmed = item.trim()
        if (!allowed.has(trimmed) || seen.has(trimmed)) continue
        seen.add(trimmed)
        next.push(trimmed)
        if (next.length >= max) break
    }

    return next
}

function normalizeValueDecisionRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { value: '', decision1: '', decision2: '' }
                }
                const candidate = row as Partial<Record<'value' | ValueDecisionFieldKey, unknown>>
                return {
                    value: typeof candidate.value === 'string' ? candidate.value : '',
                    decision1: typeof candidate.decision1 === 'string' ? candidate.decision1 : '',
                    decision2: typeof candidate.decision2 === 'string' ? candidate.decision2 : ''
                }
            })
            .slice(0, VALUE_DECISION_ROWS)

        return [...rows, ...Array.from({ length: VALUE_DECISION_ROWS - rows.length }, () => ({ value: '', decision1: '', decision2: '' }))]
    }

    return defaultValueDecisionRows()
}

function toMonthLabel(value: string) {
    if (!value) return 'Sin fecha'
    const [year, month] = value.split('-')
    if (!year || !month) return value
    const date = new Date(Number(year), Number(month) - 1, 1)
    return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}

function sortByApproxDate(a: StoryEvent, b: StoryEvent) {
    if (!a.approxDate && !b.approxDate) return 0
    if (!a.approxDate) return 1
    if (!b.approxDate) return -1
    return a.approxDate.localeCompare(b.approxDate)
}

export function WB1Step1Digital() {
    const [activePage, setActivePage] = useState(1)
    const [isLocked, setIsLocked] = useState(false)
    const [showEventModal, setShowEventModal] = useState(false)
    const [showIdentityHelp, setShowIdentityHelp] = useState(false)
    const [showIdentityMatrixHelp, setShowIdentityMatrixHelp] = useState(false)
    const [showStakeholderHelp, setShowStakeholderHelp] = useState(false)
    const [showValueDecisionHelp, setShowValueDecisionHelp] = useState(false)
    const [identityWheelSizeIndex, setIdentityWheelSizeIndex] = useState(0)
    const [openActHelp, setOpenActHelp] = useState<Record<StoryActHelpKey, boolean>>({
        acto1: false,
        acto2: false,
        acto3: false
    })
    const [eventDraft, setEventDraft] = useState<StoryEventDraft>(defaultEventDraft())
    const [patternEditModes, setPatternEditModes] = useState<Record<PatternListKey, boolean>>({
        patternDecision: false,
        patternTrigger: false,
        patternResource: false
    })
    const [identityEditModes, setIdentityEditModes] = useState<Record<IdentitySegmentKey, boolean>>({
        roles: false,
        principios: false,
        presion: false,
        calma: false,
        aporte: false,
        evito: false,
        triggers: false,
        recursos: false
    })
    const [idFields, setIdFields] = useState<WB1IdentificationFields>({
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    })
    const [storyFields, setStoryFields] = useState<StoryPageFields>({
        timelineRange: '',
        actOrigin: '',
        actBreak: '',
        actRebuild: '',
        patternDecision: emptyPatternList(),
        patternTrigger: emptyPatternList(),
        patternResource: emptyPatternList()
    })
    const [storyEvents, setStoryEvents] = useState<StoryEvent[]>([])
    const [identityWheelFields, setIdentityWheelFields] = useState<Record<IdentitySegmentKey, string[]>>(defaultIdentityWheelFields())
    const [identityMatrixRows, setIdentityMatrixRows] = useState<IdentityMatrixRow[]>(defaultIdentityMatrixRows())
    const [stakeholderRows, setStakeholderRows] = useState<StakeholderRow[]>(defaultStakeholderRows())
    const [fundamentalValues, setFundamentalValues] = useState<FundamentalValuesFields>(defaultFundamentalValuesFields())
    const [valueDecisionRows, setValueDecisionRows] = useState<ValueDecisionRow[]>(defaultValueDecisionRows())

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
        const stored = window.localStorage.getItem(STORY_FIELDS_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as Partial<StoryPageFields> & Record<string, unknown>
            setStoryFields({
                timelineRange: parsed.timelineRange || '',
                actOrigin: parsed.actOrigin || '',
                actBreak: parsed.actBreak || '',
                actRebuild: parsed.actRebuild || '',
                patternDecision: normalizePatternList(parsed.patternDecision),
                patternTrigger: normalizePatternList(parsed.patternTrigger),
                patternResource: normalizePatternList(parsed.patternResource)
            })
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(STORY_FIELDS_STORAGE_KEY, JSON.stringify(storyFields))
    }, [storyFields])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(STORY_EVENTS_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as StoryEvent[]
            setStoryEvents(Array.isArray(parsed) ? parsed : [])
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(STORY_EVENTS_STORAGE_KEY, JSON.stringify(storyEvents))
    }, [storyEvents])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(IDENTITY_WHEEL_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as Partial<Record<IdentitySegmentKey, unknown>>
            setIdentityWheelFields({
                roles: normalizeIdentityList(parsed.roles),
                principios: normalizeIdentityList(parsed.principios),
                presion: normalizeIdentityList(parsed.presion),
                calma: normalizeIdentityList(parsed.calma),
                aporte: normalizeIdentityList(parsed.aporte),
                evito: normalizeIdentityList(parsed.evito),
                triggers: normalizeIdentityList(parsed.triggers),
                recursos: normalizeIdentityList(parsed.recursos)
            })
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(IDENTITY_WHEEL_STORAGE_KEY, JSON.stringify(identityWheelFields))
    }, [identityWheelFields])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(IDENTITY_MATRIX_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setIdentityMatrixRows(normalizeIdentityMatrixRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(IDENTITY_MATRIX_STORAGE_KEY, JSON.stringify(identityMatrixRows))
    }, [identityMatrixRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(STAKEHOLDER_MIRROR_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setStakeholderRows(normalizeStakeholderRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(STAKEHOLDER_MIRROR_STORAGE_KEY, JSON.stringify(stakeholderRows))
    }, [stakeholderRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(FUNDAMENTAL_VALUES_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as Partial<FundamentalValuesFields> & Record<string, unknown>
            const selected10 = normalizeFundamentalValuesList(parsed.selected10, 10)
            const selected5 = normalizeFundamentalValuesList(parsed.selected5, 5).filter((value) => selected10.includes(value))
            const selected3 = normalizeFundamentalValuesList(parsed.selected3, 3).filter((value) => selected5.includes(value))
            setFundamentalValues({
                selected10,
                selected5,
                selected3
            })
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(FUNDAMENTAL_VALUES_STORAGE_KEY, JSON.stringify(fundamentalValues))
    }, [fundamentalValues])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(VALUE_DECISIONS_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setValueDecisionRows(normalizeValueDecisionRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        setValueDecisionRows((prev) => {
            const previousByValue = new Map(
                prev
                    .filter((row) => row.value.trim().length > 0)
                    .map((row) => [row.value, row] as const)
            )

            return Array.from({ length: VALUE_DECISION_ROWS }, (_, index) => {
                const value = fundamentalValues.selected5[index] || ''
                const previous = previousByValue.get(value)
                return {
                    value,
                    decision1: previous?.decision1 || '',
                    decision2: previous?.decision2 || ''
                }
            })
        })
    }, [fundamentalValues.selected5])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(VALUE_DECISIONS_STORAGE_KEY, JSON.stringify(valueDecisionRows))
    }, [valueDecisionRows])

    const completion = useMemo(() => {
        const idValues = Object.values(idFields)
        const narrativeValues = [storyFields.timelineRange, storyFields.actOrigin, storyFields.actBreak, storyFields.actRebuild]
        const patternValues = [storyFields.patternDecision, storyFields.patternTrigger, storyFields.patternResource]
        const identityValues = Object.values(identityWheelFields)
        const total = idValues.length + narrativeValues.length + patternValues.length + identityValues.length + 7
        const filledId = idValues.filter((value) => value.trim().length > 0).length
        const filledNarrative = narrativeValues.filter((value) => value.trim().length > 0).length
        const filledPatterns = patternValues.filter((list) => list.some((item) => item.trim().length > 0)).length
        const filledIdentity = identityValues.filter((list) => list.some((item) => item.trim().length > 0)).length
        const filledMatrix = identityMatrixRows.some(
            (row) => row.say.trim().length > 0 || row.do.trim().length > 0 || row.impact.trim().length > 0
        )
            ? 1
            : 0
        const filledStakeholders = stakeholderRows.some(
            (row) => row.personRole.trim().length > 0 || row.strength.trim().length > 0 || row.blindspot.trim().length > 0
        )
            ? 1
            : 0
        const filledValues10 = fundamentalValues.selected10.length === 10 ? 1 : 0
        const filledValues5 = fundamentalValues.selected5.length === 5 ? 1 : 0
        const filledValues3 = fundamentalValues.selected3.length === 3 ? 1 : 0
        const filledValueDecisionMatrix = valueDecisionRows.every(
            (row) => row.value.trim().length > 0 && row.decision1.trim().length > 0 && row.decision2.trim().length > 0
        )
            ? 1
            : 0
        const filled =
            filledId +
            filledNarrative +
            filledPatterns +
            filledIdentity +
            filledMatrix +
            filledStakeholders +
            filledValues10 +
            filledValues5 +
            filledValues3 +
            filledValueDecisionMatrix +
            (storyEvents.length > 0 ? 1 : 0)
        return Math.round((filled / total) * 100)
    }, [idFields, storyFields, identityWheelFields, identityMatrixRows, stakeholderRows, fundamentalValues, valueDecisionRows, storyEvents.length])

    const orderedEvents = useMemo(() => {
        return [...storyEvents].sort(sortByApproxDate)
    }, [storyEvents])

    const identityWheelSize = IDENTITY_WHEEL_SIZES[identityWheelSizeIndex]

    const currentPageIndex = PAGES.findIndex((page) => page.id === activePage)
    const hasPrevPage = currentPageIndex > 0
    const hasNextPage = currentPageIndex >= 0 && currentPageIndex < PAGES.length - 1

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

    const setStoryField = (key: StoryTextFieldKey, value: string) => {
        if (isLocked) return
        setStoryFields((prev) => ({ ...prev, [key]: value }))
    }

    const editPatternList = (key: PatternListKey) => {
        if (isLocked) return
        setPatternEditModes((prev) => ({ ...prev, [key]: true }))
    }

    const savePatternList = (key: PatternListKey) => {
        setStoryFields((prev) => ({
            ...prev,
            [key]: prev[key].map((item) => item.trim())
        }))
        setPatternEditModes((prev) => ({ ...prev, [key]: false }))
    }

    const setPatternBullet = (key: PatternListKey, index: number, value: string) => {
        if (isLocked || !patternEditModes[key]) return
        setStoryFields((prev) => {
            const nextList = [...prev[key]]
            nextList[index] = value
            return {
                ...prev,
                [key]: nextList
            }
        })
    }

    const editIdentitySegment = (key: IdentitySegmentKey) => {
        if (isLocked) return
        setIdentityEditModes((prev) => ({ ...prev, [key]: true }))
    }

    const saveIdentitySegment = (key: IdentitySegmentKey) => {
        setIdentityWheelFields((prev) => ({
            ...prev,
            [key]: prev[key].map((item) => item.trim())
        }))
        setIdentityEditModes((prev) => ({ ...prev, [key]: false }))
    }

    const setIdentityBullet = (key: IdentitySegmentKey, index: number, value: string) => {
        if (isLocked || !identityEditModes[key]) return
        setIdentityWheelFields((prev) => {
            const nextList = [...prev[key]]
            nextList[index] = value
            return {
                ...prev,
                [key]: nextList
            }
        })
    }

    const setIdentityMatrixCell = (rowIndex: number, field: IdentityMatrixFieldKey, value: string) => {
        if (isLocked) return
        setIdentityMatrixRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const setStakeholderCell = (rowIndex: number, field: StakeholderFieldKey, value: string) => {
        if (isLocked) return
        setStakeholderRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const setValueDecisionCell = (rowIndex: number, field: ValueDecisionFieldKey, value: string) => {
        if (isLocked) return
        setValueDecisionRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target || target.value.trim().length === 0) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const toggleFundamentalValue10 = (value: string) => {
        if (isLocked) return
        setFundamentalValues((prev) => {
            const isSelected = prev.selected10.includes(value)
            if (isSelected) {
                const selected10 = prev.selected10.filter((item) => item !== value)
                const selected5 = prev.selected5.filter((item) => selected10.includes(item))
                const selected3 = prev.selected3.filter((item) => selected5.includes(item))
                return { selected10, selected5, selected3 }
            }

            if (prev.selected10.length >= 10) return prev
            return { ...prev, selected10: [...prev.selected10, value] }
        })
    }

    const toggleFundamentalValue5 = (value: string) => {
        if (isLocked) return
        setFundamentalValues((prev) => {
            if (!prev.selected10.includes(value)) return prev
            const isSelected = prev.selected5.includes(value)

            if (isSelected) {
                const selected5 = prev.selected5.filter((item) => item !== value)
                const selected3 = prev.selected3.filter((item) => selected5.includes(item))
                return { ...prev, selected5, selected3 }
            }

            if (prev.selected5.length >= 5) return prev
            return { ...prev, selected5: [...prev.selected5, value] }
        })
    }

    const toggleFundamentalValue3 = (value: string) => {
        if (isLocked) return
        setFundamentalValues((prev) => {
            if (!prev.selected5.includes(value)) return prev
            const isSelected = prev.selected3.includes(value)

            if (isSelected) {
                return { ...prev, selected3: prev.selected3.filter((item) => item !== value) }
            }

            if (prev.selected3.length >= 3) return prev
            return { ...prev, selected3: [...prev.selected3, value] }
        })
    }

    const zoomIdentityWheelIn = () => {
        setIdentityWheelSizeIndex((prev) => Math.min(prev + 1, IDENTITY_WHEEL_SIZES.length - 1))
    }

    const zoomIdentityWheelOut = () => {
        setIdentityWheelSizeIndex((prev) => Math.max(prev - 1, 0))
    }

    const jumpToPage = (page: number) => {
        setActivePage(page)
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const goPrevPage = () => {
        if (!hasPrevPage) return
        jumpToPage(PAGES[currentPageIndex - 1].id)
    }

    const goNextPage = () => {
        if (!hasNextPage) return
        jumpToPage(PAGES[currentPageIndex + 1].id)
    }

    const openEventModal = () => {
        if (isLocked || storyEvents.length >= STORY_EVENT_LIMIT) return
        setEventDraft(defaultEventDraft())
        setShowEventModal(true)
    }

    const validateEventDraft = () => {
        return (
            eventDraft.approxDate.trim() &&
            eventDraft.happened.trim() &&
            eventDraft.interpreted.trim() &&
            eventDraft.learned.trim() &&
            eventDraft.belief.trim()
        )
    }

    const saveEvent = () => {
        if (isLocked || !validateEventDraft()) return
        if (storyEvents.length >= STORY_EVENT_LIMIT) return

        const nextEvent: StoryEvent = {
            id: crypto.randomUUID(),
            ...eventDraft
        }

        setStoryEvents((prev) => [...prev, nextEvent])
        setShowEventModal(false)
    }

    const removeEvent = (id: string) => {
        if (isLocked) return
        setStoryEvents((prev) => prev.filter((event) => event.id !== id))
    }

    const toggleActHelp = (key: StoryActHelpKey) => {
        setOpenActHelp((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    const visiblePatternBullets = (key: PatternListKey) => storyFields[key].map((item) => item.trim()).filter(Boolean)
    const visibleIdentityBullets = (key: IdentitySegmentKey) => identityWheelFields[key].map((item) => item.trim()).filter(Boolean)
    const canSelectTop5 = fundamentalValues.selected10.length === 10
    const canSelectTop3 = fundamentalValues.selected5.length === 5
    const canUseValueDecisionMatrix = fundamentalValues.selected5.length === 5

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

            <main className="max-w-7xl mx-auto px-5 md:px-8 py-8 overflow-x-auto">
                <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-6 items-start min-w-[920px]">
                    <aside className="wb1-sidebar rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Índice</p>
                        <nav className="space-y-1.5" aria-label="Navegación de páginas">
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
                                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">Datos de identificación</h2>
                                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nombre del líder</span>
                                            <input
                                                type="text"
                                                value={idFields.leaderName}
                                                onChange={(event) => setIdField('leaderName', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                placeholder="Ej: Andrés Tabla"
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
                                                placeholder="Ej: Director / Líder"
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
                                            onClick={goNextPage}
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
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 2</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Presentación del workbook
                                    </h2>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7">
                                    <h3 className="text-lg font-bold text-slate-900">Objetivo</h3>
                                    <p className="mt-2 text-sm md:text-base text-slate-700">Al finalizar, tendrás:</p>
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
                                        Conductas observables asociadas (que se debería ver en tu día a día)
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
                            <article className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Storytelling personal
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-3xl">
                                        Entender cómo tu historia ha moldeado tu identidad y tus creencias actuales.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 1. Línea de vida (Timeline)</h3>
                                    <p className="text-sm text-slate-700">
                                        Define una temporalidad y, en este lapso, identifica:
                                    </p>
                                    <ul className="space-y-1.5">
                                        {STEP1_IDENTIFICATION_POINTS.map((item) => (
                                            <li key={item} className="text-sm text-slate-700">
                                                • {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <label className="block space-y-1">
                                        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Temporalidad de trabajo</span>
                                        <input
                                            type="text"
                                            value={storyFields.timelineRange}
                                            onChange={(event) => setStoryField('timelineRange', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            placeholder="Ej: Enero 2020 - Diciembre 2025"
                                        />
                                    </label>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">Registro de eventos</h3>
                                            <p className="text-sm text-slate-600 mt-1">
                                                Usa la plantilla: tipo, fecha aproximada, qué ocurrió, qué decidiste, qué aprendiste y creencia instalada.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={openEventModal}
                                            disabled={isLocked || storyEvents.length >= STORY_EVENT_LIMIT}
                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 text-white px-3 py-2 text-xs font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={14} />
                                            Agregar evento
                                        </button>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">Plantilla de registro (por evento)</p>
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {EVENT_TEMPLATE_FIELDS.map((field) => (
                                                <p key={field} className="text-sm text-slate-700">
                                                    • {field}: ______
                                                </p>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 md:p-5">
                                        <p className="text-sm font-extrabold text-slate-900">¿Qué es una creencia?</p>
                                        <p className="text-sm text-slate-700 mt-1">
                                            Convicción interna que guía el comportamiento y la toma de decisiones de un individuo.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-300 bg-blue-50 p-4 md:p-5 space-y-2">
                                        <p className="text-sm font-extrabold text-slate-900">Ejemplo (ilustración)</p>
                                        <p className="text-sm text-slate-700">• Tipo: logro/quiebre</p>
                                        <p className="text-sm text-slate-700">• Fecha aproximada: Agosto 2021</p>
                                        <p className="text-sm text-slate-700">• Qué ocurrió (hecho): {EXAMPLE_EVENT.happened}</p>
                                        <p className="text-sm text-slate-700">• Qué decidí / interpreté: {EXAMPLE_EVENT.interpreted}</p>
                                        <p className="text-sm text-slate-700">• Qué aprendí: {EXAMPLE_EVENT.learned}</p>
                                        <p className="text-sm text-slate-700">• Qué creencia se instaló: {EXAMPLE_EVENT.belief}</p>
                                    </div>

                                    <p className="text-xs text-slate-500">
                                        Eventos registrados: {storyEvents.length} / {STORY_EVENT_LIMIT}
                                    </p>
                                    {storyEvents.length >= STORY_EVENT_LIMIT && (
                                        <p className="text-xs font-semibold text-amber-700">
                                            Alcanzaste el máximo de 5 eventos. Elimina uno para registrar otro.
                                        </p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Línea de tiempo cronológica</h3>
                                        <span className="text-xs font-semibold text-slate-500">Ordenada por fecha aproximada</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(EVENT_TYPE_STYLE).map(([key, style]) => (
                                            <span
                                                key={key}
                                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.badgeClass}`}
                                            >
                                                {style.label}
                                            </span>
                                        ))}
                                    </div>

                                    {orderedEvents.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 text-sm">
                                            Aún no hay eventos. Agrega tu primer evento para visualizar la línea de tiempo.
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-300" />
                                            <ul className="space-y-6">
                                                {orderedEvents.map((event) => {
                                                    const style = EVENT_TYPE_STYLE[event.type]
                                                    return (
                                                        <li key={event.id} className="relative pl-16">
                                                            <span className={`absolute left-[18px] top-2 h-4 w-4 rounded-full border-2 ${style.nodeClass}`} />

                                                            <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="space-y-1">
                                                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.badgeClass}`}>
                                                                            {style.label}
                                                                        </span>
                                                                        <p className="text-sm font-bold text-slate-900">{toMonthLabel(event.approxDate)}</p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeEvent(event.id)}
                                                                        disabled={isLocked}
                                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                        Eliminar
                                                                    </button>
                                                                </div>

                                                                <dl className="mt-3 grid grid-cols-1 gap-2">
                                                                    <div>
                                                                        <dt className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Qué ocurrió (hecho)</dt>
                                                                        <dd className="text-sm text-slate-700 mt-0.5">{event.happened}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Qué decidí / interpreté</dt>
                                                                        <dd className="text-sm text-slate-700 mt-0.5">{event.interpreted}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Qué aprendí</dt>
                                                                        <dd className="text-sm text-slate-700 mt-0.5">{event.learned}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Qué creencia se instaló</dt>
                                                                        <dd className="text-sm text-slate-700 mt-0.5">{event.belief}</dd>
                                                                    </div>
                                                                </dl>
                                                            </article>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 2. Narrativa en 3 actos</h3>
                                    <p className="text-sm text-slate-700">
                                        Convierte tu historia en una narrativa útil para el liderazgo. Descúbrete en 3 actos:
                                    </p>
                                    <ul className="space-y-1.5">
                                        {STEP2_DISCOVERY_ACTS.map((item) => (
                                            <li key={item} className="text-sm text-slate-700">
                                                • {item}
                                            </li>
                                        ))}
                                    </ul>

                                    <aside className="rounded-xl border border-slate-300 bg-slate-100 p-4 md:p-5">
                                        <p className="text-sm font-extrabold text-slate-900">Reglas de escritura</p>
                                        <ol className="mt-2 space-y-1.5 list-decimal pl-5">
                                            {STEP2_WRITING_RULES.map((rule) => (
                                                <li key={rule} className="text-sm text-slate-700 leading-relaxed">
                                                    {rule}
                                                </li>
                                            ))}
                                        </ol>
                                    </aside>

                                    <div className="space-y-5">
                                        {STEP2_ACT_GUIDES.map((guide) => (
                                            <article key={guide.helpKey} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 space-y-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h4 className="text-sm md:text-base font-bold text-slate-900">{guide.title}</h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActHelp(guide.helpKey)}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                                    >
                                                        {openActHelp[guide.helpKey] ? 'Ocultar ayuda' : 'Ayuda + ejemplo'}
                                                    </button>
                                                </div>

                                                <ul className="space-y-1.5">
                                                    {guide.guidingQuestions.map((question) => (
                                                        <li key={question} className="text-sm text-slate-700 flex items-start gap-2">
                                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                            <span>{question}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {openActHelp[guide.helpKey] && (
                                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                        <p className="text-xs uppercase tracking-[0.14em] text-blue-700 font-semibold">Ejemplo de referencia</p>
                                                        <p className="mt-2 text-sm leading-relaxed text-slate-700">{guide.example}</p>
                                                    </div>
                                                )}

                                                <label className="block space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Escribe tu narrativa</span>
                                                    <textarea
                                                        value={storyFields[guide.fieldKey]}
                                                        onChange={(event) => setStoryField(guide.fieldKey, event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full min-h-[130px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                        placeholder="Escribe entre 10 y 15 líneas en primera persona, incorporando contexto, escena clave y efecto en ti."
                                                    />
                                                </label>
                                            </article>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 3. Patrones</h3>
                                    <p className="text-sm text-slate-700">
                                        Extrae 3 conclusiones operativas: tu patrón, tu mayor detonante y tu recurso más confiable.
                                    </p>
                                    <aside className="rounded-xl border border-slate-300 bg-slate-100 p-4 md:p-5">
                                        <p className="text-sm font-extrabold text-slate-900">Cómo responder (regla)</p>
                                        <ul className="mt-2 space-y-1.5">
                                            {RESPONSE_RULES.map((rule) => (
                                                <li key={rule} className="text-sm text-slate-700 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                    <span>{rule}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </aside>

                                    <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5">
                                        <p className="text-sm font-extrabold text-slate-900">Ejemplo (ilustración)</p>
                                        <ol className="mt-3 space-y-3">
                                            {STEP3_EXAMPLES.map((item) => (
                                                <li key={item.key} className="space-y-1">
                                                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                                    <p className="text-sm text-slate-700">• {item.example}</p>
                                                </li>
                                            ))}
                                        </ol>
                                    </article>

                                    <div className="space-y-4">
                                        {STEP3_EXAMPLES.map((listConfig) => {
                                            const isEditingList = patternEditModes[listConfig.key]
                                            const savedBullets = visiblePatternBullets(listConfig.key)

                                            return (
                                                <article key={listConfig.key} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 space-y-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <h4 className="text-sm md:text-base font-bold text-slate-900">{listConfig.title}</h4>
                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => editPatternList(listConfig.key)}
                                                                disabled={isLocked || isEditingList}
                                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => savePatternList(listConfig.key)}
                                                                disabled={isLocked || !isEditingList}
                                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Guardar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-slate-500">
                                                        Bullets cargados: {savedBullets.length} / {PATTERN_LIST_LIMIT}
                                                    </p>

                                                    {isEditingList ? (
                                                        <div className="space-y-2">
                                                            {storyFields[listConfig.key].map((bullet, index) => (
                                                                <label key={`${listConfig.key}-${index}`} className="block">
                                                                    <span className="sr-only">Bullet {index + 1}</span>
                                                                    <input
                                                                        type="text"
                                                                        value={bullet}
                                                                        onChange={(event) => setPatternBullet(listConfig.key, index, event.target.value)}
                                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                                        placeholder={`Bullet ${index + 1}`}
                                                                    />
                                                                </label>
                                                            ))}
                                                        </div>
                                                    ) : savedBullets.length > 0 ? (
                                                        <ul className="space-y-1.5">
                                                            {savedBullets.map((bullet, index) => (
                                                                <li key={`${listConfig.key}-view-${index}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                                    <span>{bullet}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-slate-500">Sin registros en esta lista. Presiona "Editar" para comenzar.</p>
                                                    )}
                                                </article>
                                            )
                                        })}
                                    </div>
                                </section>
                            </article>
                        )}

                        {activePage === 4 && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 4</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Definición de identidad actual
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-3xl">
                                        Definir quién eres hoy en términos de conducta y reputación, no de intención.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 1 - Rueda de identidad (Identity Wheel)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700 max-w-3xl">
                                                Este instrumento te ayuda a identificar quién eres hoy como líder en 8 dimensiones que determinan tu
                                                comportamiento: lo que sostienes, lo que evitas, lo que te activa y lo que entregas.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowIdentityHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showIdentityHelp ? 'Ocultar ayuda' : 'Ayuda + ejemplo'}
                                        </button>
                                    </div>

                                    <p className="text-sm text-slate-700">
                                        En cada segmento de la rueda, escribe máximo 3 bullets con frases cortas y concretas.
                                    </p>

                                    {showIdentityHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-4">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo de referencia</p>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">Estilo bajo presión (máx 3 bullets):</p>
                                                    <ul className="mt-1 space-y-1">
                                                        <li className="text-sm text-slate-700">• Cierro rápido decisiones</li>
                                                        <li className="text-sm text-slate-700">• Hablo más, escucho menos</li>
                                                        <li className="text-sm text-slate-700">• Reviso detalles que podría delegar</li>
                                                    </ul>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">Principios (NO negociables):</p>
                                                    <ul className="mt-1 space-y-1">
                                                        <li className="text-sm text-slate-700">• No maquillo información</li>
                                                        <li className="text-sm text-slate-700">• No falto al respeto en público</li>
                                                        <li className="text-sm text-slate-700">• No prometo lo que no puedo sostener</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </article>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={zoomIdentityWheelOut}
                                                disabled={identityWheelSizeIndex === 0}
                                                className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-slate-700 text-lg leading-none hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Reducir tamaño de la rueda"
                                            >
                                                -
                                            </button>
                                            <button
                                                type="button"
                                                onClick={zoomIdentityWheelIn}
                                                disabled={identityWheelSizeIndex === IDENTITY_WHEEL_SIZES.length - 1}
                                                className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-slate-700 text-lg leading-none hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Ampliar tamaño de la rueda"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto pb-2">
                                            <div className="relative mx-auto aspect-square" style={{ width: `${identityWheelSize}px`, minWidth: `${identityWheelSize}px` }}>
                                                <div
                                                    className="absolute inset-0 rounded-full border border-slate-300 shadow-inner"
                                                    style={{
                                                        background: `conic-gradient(${IDENTITY_SEGMENTS.map(
                                                            (segment, index) => `${segment.color} ${index * 45}deg ${(index + 1) * 45}deg`
                                                        ).join(', ')})`
                                                    }}
                                                />
                                                <div className="absolute inset-[22%] rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center p-4">
                                                    <div className="text-center">
                                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Identity Wheel</p>
                                                        <p className="text-sm md:text-base font-extrabold text-slate-900 mt-1">Definición actual</p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Segmentos con contenido: {Object.values(identityWheelFields).filter((list) => list.some((item) => item.trim())).length} /{' '}
                                                            {IDENTITY_SEGMENTS.length}
                                                        </p>
                                                    </div>
                                                </div>
                                                {IDENTITY_SEGMENTS.map((segment, index) => {
                                                    const labelAngle = (index / IDENTITY_SEGMENTS.length) * Math.PI * 2 - Math.PI / 2
                                                    const labelX = 50 + Math.cos(labelAngle) * 42
                                                    const labelY = 50 + Math.sin(labelAngle) * 42
                                                    const contentAngle = ((index + 0.5) / IDENTITY_SEGMENTS.length) * Math.PI * 2 - Math.PI / 2
                                                    const contentX = 50 + Math.cos(contentAngle) * 31
                                                    const contentY = 50 + Math.sin(contentAngle) * 31
                                                    const bullets = visibleIdentityBullets(segment.key)

                                                    return (
                                                        <div key={`wheel-layer-${segment.key}`}>
                                                            <div
                                                                className="absolute -translate-x-1/2 -translate-y-1/2 w-28 text-center"
                                                                style={{ left: `${labelX}%`, top: `${labelY}%` }}
                                                            >
                                                                <span className="inline-block rounded-md border border-slate-300 bg-white/90 px-2 py-1 text-[10px] leading-tight font-semibold text-slate-700 shadow-sm">
                                                                    {index + 1}. {segment.title}
                                                                </span>
                                                            </div>

                                                            {bullets.length > 0 && (
                                                                <div
                                                                    className="absolute -translate-x-1/2 -translate-y-1/2 w-36 rounded-lg border border-slate-300 bg-white/95 p-2 shadow-sm"
                                                                    style={{ left: `${contentX}%`, top: `${contentY}%` }}
                                                                >
                                                                    <ul className="space-y-1">
                                                                        {bullets.map((bullet, bulletIndex) => (
                                                                            <li key={`${segment.key}-wheel-bullet-${bulletIndex}`} className="text-[10px] leading-tight text-slate-700">
                                                                                • {bullet}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {IDENTITY_SEGMENTS.map((segment) => {
                                            const isEditing = identityEditModes[segment.key]
                                            const bullets = visibleIdentityBullets(segment.key)
                                            return (
                                                <article key={segment.key} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 space-y-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <h4 className="text-sm md:text-base font-bold text-slate-900">{segment.title}</h4>
                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => editIdentitySegment(segment.key)}
                                                                disabled={isLocked || isEditing}
                                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => saveIdentitySegment(segment.key)}
                                                                disabled={isLocked || !isEditing}
                                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Guardar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-slate-500">
                                                        Bullets cargados: {bullets.length} / {IDENTITY_BULLET_LIMIT}
                                                    </p>

                                                    {isEditing ? (
                                                        <div className="space-y-2">
                                                            {identityWheelFields[segment.key].map((bullet, index) => (
                                                                <label key={`${segment.key}-input-${index}`} className="block">
                                                                    <span className="sr-only">Bullet {index + 1}</span>
                                                                    <input
                                                                        type="text"
                                                                        value={bullet}
                                                                        onChange={(event) => setIdentityBullet(segment.key, index, event.target.value)}
                                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                                        placeholder={`Bullet ${index + 1}`}
                                                                    />
                                                                </label>
                                                            ))}
                                                        </div>
                                                    ) : bullets.length > 0 ? (
                                                        <ul className="space-y-1.5">
                                                            {bullets.map((bullet, index) => (
                                                                <li key={`${segment.key}-view-${index}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                                    <span>{bullet}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-slate-500">Sin registros en este segmento. Presiona "Editar" para comenzar.</p>
                                                    )}
                                                </article>
                                            )
                                        })}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 2 - Matriz "Lo que digo / hago / impacto"
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">Completa 10 filas con evidencia reciente y observable.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowIdentityMatrixHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showIdentityMatrixHelp ? 'Ocultar ayuda' : 'Ayuda + ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {IDENTITY_MATRIX_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <aside className="rounded-xl border border-slate-300 bg-slate-100 p-4">
                                        <p className="text-sm font-semibold text-slate-900">
                                            Regla de calidad: "Lo que hago" debe poder comprobarse con un ejemplo concreto (reunión X, mensaje Y, decisión Z).
                                        </p>
                                    </aside>

                                    {showIdentityMatrixHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-3">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo para completar la matriz</p>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-[720px] w-full border border-slate-300 rounded-lg overflow-hidden">
                                                    <thead>
                                                        <tr className="bg-slate-100">
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Lo que digo</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Lo que hago (hechos)</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Impacto en otros</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">"Valoro la transparencia"</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                En la reunión del lunes compartí riesgos del proyecto y dije qué NO estaba resuelto, proponiendo opciones.
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                El equipo aportó soluciones; aumentó confianza y se redujo rumor/ansiedad.
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </article>
                                    )}

                                    <p className="text-xs text-slate-500">
                                        Filas con contenido:{' '}
                                        {
                                            identityMatrixRows.filter(
                                                (row) => row.say.trim().length > 0 || row.do.trim().length > 0 || row.impact.trim().length > 0
                                            ).length
                                        }{' '}
                                        / {IDENTITY_MATRIX_ROWS}
                                    </p>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1020px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="w-[60px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">#</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Lo que digo (mensaje)
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Lo que hago (hechos recientes)
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Impacto en otros (observable)
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {identityMatrixRows.map((row, rowIndex) => (
                                                    <tr key={`matrix-row-${rowIndex}`} className="odd:bg-white even:bg-slate-50">
                                                        <td className="px-3 py-2 text-xs font-semibold text-slate-500 align-top border-b border-slate-200">
                                                            {rowIndex + 1}
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.say}
                                                                onChange={(event) => setIdentityMatrixCell(rowIndex, 'say', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[64px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Mensaje o frase que dices"
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.do}
                                                                onChange={(event) => setIdentityMatrixCell(rowIndex, 'do', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[64px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Hecho concreto reciente"
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.impact}
                                                                onChange={(event) => setIdentityMatrixCell(rowIndex, 'impact', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[64px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Efecto observable en otros"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 3 - Mini espejo de stakeholders (360 rápido)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">Completa 3 filas con hipótesis concretas por rol.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowStakeholderHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showStakeholderHelp ? 'Ocultar ayuda' : 'Ayuda + ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {STAKEHOLDER_MIRROR_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <aside className="rounded-xl border border-slate-300 bg-slate-100 p-4">
                                        <p className="text-sm text-slate-700">
                                            Nota: esto es una hipótesis. Luego podrás validarla preguntando directamente.
                                        </p>
                                    </aside>

                                    {showStakeholderHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-3">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo para completar este ejercicio</p>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-[760px] w-full border border-slate-300 rounded-lg overflow-hidden">
                                                    <thead>
                                                        <tr className="bg-slate-100">
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Persona (rol)
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Fortaleza que crees que vería en ti
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Punto ciego que crees que vería en ti
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Jefe / sponsor</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                "Resuelve rápido y convierte problemas difusos en plan."
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                "A veces prioriza velocidad sobre alineación; cierra antes de escuchar."
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </article>
                                    )}

                                    <p className="text-xs text-slate-500">
                                        Filas con contenido:{' '}
                                        {
                                            stakeholderRows.filter(
                                                (row) =>
                                                    row.personRole.trim().length > 0 ||
                                                    row.strength.trim().length > 0 ||
                                                    row.blindspot.trim().length > 0
                                            ).length
                                        }{' '}
                                        / {STAKEHOLDER_ROWS}
                                    </p>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1020px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="w-[60px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">#</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Persona (rol)
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Fortaleza que crees que vería en ti
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Punto ciego que crees que vería en ti
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stakeholderRows.map((row, rowIndex) => (
                                                    <tr key={`stakeholder-row-${rowIndex}`} className="odd:bg-white even:bg-slate-50">
                                                        <td className="px-3 py-2 text-xs font-semibold text-slate-500 align-top border-b border-slate-200">
                                                            {rowIndex + 1}
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.personRole}
                                                                onChange={(event) => setStakeholderCell(rowIndex, 'personRole', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[64px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Ej: Jefe / sponsor"
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.strength}
                                                                onChange={(event) => setStakeholderCell(rowIndex, 'strength', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[64px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder='Ej: "Resuelve rápido y convierte problemas difusos en plan."'
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.blindspot}
                                                                onChange={(event) => setStakeholderCell(rowIndex, 'blindspot', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[64px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder='Ej: "A veces prioriza velocidad sobre alineación; cierra antes de escuchar."'
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </article>
                        )}

                        {activePage === 5 && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 5</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Valores fundamentales
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-3xl">
                                        Convertir valores en criterios de decisión.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">
                                        Instrumento 1 - Selección y priorización (card sorting)
                                    </h3>
                                    <p className="text-sm text-slate-700">Instrucciones:</p>
                                    <ol className="space-y-1.5 list-decimal pl-5">
                                        <li className="text-sm text-slate-700">
                                            Revisa la lista de valores y marca 10 que realmente guían tu vida (no los deseables).
                                        </li>
                                        <li className="text-sm text-slate-700">Reduce a 5 (los más determinantes).</li>
                                        <li className="text-sm text-slate-700">
                                            Reduce a 3 no negociables (los que defenderías bajo presión).
                                        </li>
                                    </ol>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">
                                            1) 10 valores que guían mi vida
                                        </h3>
                                        <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                            Seleccionados: {fundamentalValues.selected10.length} / 10
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600">Haz clic para seleccionar o deseleccionar valores.</p>
                                    <div className="flex flex-wrap gap-2">
                                        {FUNDAMENTAL_VALUES.map((value) => {
                                            const selected = fundamentalValues.selected10.includes(value)
                                            const disabled = isLocked || (!selected && fundamentalValues.selected10.length >= 10)

                                            return (
                                                <button
                                                    key={`value-10-${value}`}
                                                    type="button"
                                                    onClick={() => toggleFundamentalValue10(value)}
                                                    disabled={disabled}
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                        selected
                                                            ? 'bg-emerald-500 text-white border-emerald-600'
                                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {value}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">
                                            2) Los más determinantes (elige 5 de tus 10)
                                        </h3>
                                        <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                            Seleccionados: {fundamentalValues.selected5.length} / 5
                                        </span>
                                    </div>

                                    {!canSelectTop5 && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                            Completa primero los 10 valores de la sección anterior para habilitar esta selección.
                                        </p>
                                    )}

                                    {fundamentalValues.selected10.length === 0 ? (
                                        <p className="text-sm text-slate-500">Aún no hay valores seleccionados en el paso 1.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {fundamentalValues.selected10.map((value) => {
                                                const selected = fundamentalValues.selected5.includes(value)
                                                const disabled = isLocked || !canSelectTop5 || (!selected && fundamentalValues.selected5.length >= 5)

                                                return (
                                                    <button
                                                        key={`value-5-${value}`}
                                                        type="button"
                                                        onClick={() => toggleFundamentalValue5(value)}
                                                        disabled={disabled}
                                                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                            selected
                                                                ? 'bg-emerald-500 text-white border-emerald-600'
                                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {value}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">
                                            3) No negociables (elige 3 de tus 5)
                                        </h3>
                                        <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                            Seleccionados: {fundamentalValues.selected3.length} / 3
                                        </span>
                                    </div>

                                    {!canSelectTop3 && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                            Completa primero los 5 valores determinantes para habilitar esta selección.
                                        </p>
                                    )}

                                    {fundamentalValues.selected5.length === 0 ? (
                                        <p className="text-sm text-slate-500">Aún no hay valores seleccionados en el paso 2.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {fundamentalValues.selected5.map((value) => {
                                                const selected = fundamentalValues.selected3.includes(value)
                                                const disabled = isLocked || !canSelectTop3 || (!selected && fundamentalValues.selected3.length >= 3)

                                                return (
                                                    <button
                                                        key={`value-3-${value}`}
                                                        type="button"
                                                        onClick={() => toggleFundamentalValue3(value)}
                                                        disabled={disabled}
                                                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                            selected
                                                                ? 'bg-emerald-500 text-white border-emerald-600'
                                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {value}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 2 - Matriz valores-decisiones (evidencia)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Completa 5 filas con los valores determinantes y decisiones recientes observables.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowValueDecisionHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showValueDecisionHelp ? 'Ocultar ayuda' : 'Ayuda + ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {VALUE_DECISION_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {!canUseValueDecisionMatrix && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                            Para completar esta matriz, primero selecciona los 5 valores más determinantes en el Instrumento 1.
                                        </p>
                                    )}

                                    {showValueDecisionHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-3">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo para completar este ejercicio</p>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-[860px] w-full border border-slate-300 rounded-lg overflow-hidden">
                                                    <thead>
                                                        <tr className="bg-slate-100">
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Valor</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Decisión 1 (fecha y contexto)
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Decisión 2 (fecha y contexto)
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Integridad</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                12 feb: rechacé ajustar un informe ocultando datos; propuse redactarlo con transparencia.
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                28 feb: asumí públicamente un error de planificación y presenté corrección con fechas.
                                                            </td>
                                                        </tr>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Crecimiento</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                05 mar: pedí feedback directo al equipo sobre mi estilo en reuniones.
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                18 mar: acepté liderar un reto nuevo y pedí apoyo técnico específico sin ocultarlo.
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </article>
                                    )}

                                    <p className="text-xs text-slate-500">
                                        Filas completas:{' '}
                                        {
                                            valueDecisionRows.filter(
                                                (row) =>
                                                    row.value.trim().length > 0 &&
                                                    row.decision1.trim().length > 0 &&
                                                    row.decision2.trim().length > 0
                                            ).length
                                        }{' '}
                                        / {VALUE_DECISION_ROWS}
                                    </p>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[980px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="w-[240px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Valor</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Decisión 1 (fecha y contexto)
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Decisión 2 (fecha y contexto)
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valueDecisionRows.map((row, rowIndex) => {
                                                    const rowDisabled = isLocked || row.value.trim().length === 0 || !canUseValueDecisionMatrix
                                                    return (
                                                        <tr key={`value-decision-row-${rowIndex}`} className="odd:bg-white even:bg-slate-50">
                                                            <td className="px-3 py-2 text-sm font-semibold text-slate-800 align-top border-b border-slate-200">
                                                                {row.value || `Valor determinante ${rowIndex + 1} (por seleccionar)`}
                                                            </td>
                                                            <td className="p-2 align-top border-b border-slate-200">
                                                                <textarea
                                                                    value={row.decision1}
                                                                    onChange={(event) => setValueDecisionCell(rowIndex, 'decision1', event.target.value)}
                                                                    disabled={rowDisabled}
                                                                    className="w-full min-h-[72px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                    placeholder="Ej: 12 feb - decisión observable con contexto"
                                                                />
                                                            </td>
                                                            <td className="p-2 align-top border-b border-slate-200">
                                                                <textarea
                                                                    value={row.decision2}
                                                                    onChange={(event) => setValueDecisionCell(rowIndex, 'decision2', event.target.value)}
                                                                    disabled={rowDisabled}
                                                                    className="w-full min-h-[72px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                    placeholder="Ej: 28 feb - decisión observable con contexto"
                                                                />
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </article>
                        )}

                        <nav className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm flex items-center justify-between">
                            <button
                                type="button"
                                onClick={goPrevPage}
                                disabled={!hasPrevPage}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ArrowLeft size={15} />
                                Atrás
                            </button>

                            <div className="text-center">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Navegación</p>
                                <p className="text-sm font-bold text-slate-900">
                                    {PAGES[currentPageIndex]?.shortLabel || 'Página'}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={goNextPage}
                                disabled={!hasNextPage}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Adelante
                                <ArrowRight size={15} />
                            </button>
                        </nav>
                    </section>
                </div>
            </main>

            {showEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowEventModal(false)} />
                    <div className="relative w-full max-w-2xl rounded-2xl border border-slate-300 bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                            <h3 className="text-base md:text-lg font-bold text-slate-900">Agregar evento de línea de vida</h3>
                            <button
                                type="button"
                                onClick={() => setShowEventModal(false)}
                                className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Tipo</span>
                                <select
                                    value={eventDraft.type}
                                    onChange={(event) => setEventDraft((prev) => ({ ...prev, type: event.target.value as StoryEventType }))}
                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="logro">Logro</option>
                                    <option value="logro-golpe">Logro / Golpe</option>
                                    <option value="golpe">Golpe / Crisis / Quiebre</option>
                                </select>
                            </label>

                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Fecha aproximada</span>
                                <input
                                    type="month"
                                    value={eventDraft.approxDate}
                                    onChange={(event) => setEventDraft((prev) => ({ ...prev, approxDate: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </label>

                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué ocurrió (hecho)</span>
                                <textarea
                                    value={eventDraft.happened}
                                    onChange={(event) => setEventDraft((prev) => ({ ...prev, happened: event.target.value }))}
                                    className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </label>

                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué decidí / interpreté</span>
                                <textarea
                                    value={eventDraft.interpreted}
                                    onChange={(event) => setEventDraft((prev) => ({ ...prev, interpreted: event.target.value }))}
                                    className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </label>

                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué aprendí</span>
                                <textarea
                                    value={eventDraft.learned}
                                    onChange={(event) => setEventDraft((prev) => ({ ...prev, learned: event.target.value }))}
                                    className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </label>

                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué creencia se instaló</span>
                                <textarea
                                    value={eventDraft.belief}
                                    onChange={(event) => setEventDraft((prev) => ({ ...prev, belief: event.target.value }))}
                                    className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => setShowEventModal(false)}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={saveEvent}
                                disabled={!validateEventDraft()}
                                className="rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Guardar evento
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
