import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SystemSettingsService } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

type InstrumentAssistKey =
    | 'identityWheel'
    | 'identityMatrix'
    | 'stakeholderMirror'
    | 'fundamentalValues'
    | 'valueDecisionMatrix'
    | 'noNegotiables'
    | 'foa'
    | 'energyMap'
    | 'beliefAbc'
    | 'beliefEvidence'
    | 'beliefImpact'
    | 'empoweringBeliefs'
    | 'bridgeExperiment'
    | 'mantras'
    | 'futureSelf'
    | 'backcasting'
    | 'futureLetter'

type EnergySign = '' | '+' | '-'
type EnergyAdjust = '' | 'Más' | 'Menos' | 'Rediseñar'

const IDENTITY_BULLET_LIMIT = 3
const IDENTITY_MATRIX_ROWS = 10
const STAKEHOLDER_ROWS = 3
const VALUE_DECISION_ROWS = 5
const NO_NEGOTIABLE_ROWS = 3
const FOA_BULLET_LIMIT = 5
const ENERGY_MAP_ROWS = 20
const ENERGY_PATTERN_BULLETS = 3
const BELIEF_ABC_ROWS = 3
const BELIEF_EVIDENCE_ROWS = 5
const BELIEF_IMPACT_BULLETS = 5
const BELIEF_IMPACT_AFFECTED_ROWS = 3
const EMPOWERING_BELIEF_ROWS = 3
const BRIDGE_EXPERIMENT_ROWS = 3
const MANTRA_ROWS = 3
const FUTURE_SELF_IDENTITY_ROWS = 2
const FUTURE_SELF_VALUES_ROWS = 3
const FUTURE_SELF_HABITS_ROWS = 5
const FUTURE_SELF_DECISIONS_ROWS = 3
const FUTURE_SELF_SKILLS_ROWS = 3
const FUTURE_SELF_METRICS_ROWS = 3
const FUTURE_SELF_RISK_ROWS = 3
const BACKCASTING_ROWS = 4

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

function sanitizeText(value: unknown, max = 1800) {
    if (typeof value !== 'string') return ''
    return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

function sanitizeList(value: unknown, max: number, itemMax = 240) {
    if (!Array.isArray(value)) return []

    return value
        .map((item) => sanitizeText(item, itemMax))
        .filter(Boolean)
        .slice(0, max)
}

function sanitizeValueList(value: unknown, max: number) {
    if (!Array.isArray(value)) return []

    const allowed = new Set<string>(FUNDAMENTAL_VALUES)
    const seen = new Set<string>()
    const next: string[] = []

    for (const item of value) {
        const trimmed = sanitizeText(item, 80)
        if (!trimmed || !allowed.has(trimmed) || seen.has(trimmed)) continue
        seen.add(trimmed)
        next.push(trimmed)
        if (next.length >= max) break
    }

    return next
}

function normalizeEnergySign(value: unknown): EnergySign {
    return value === '+' || value === '-' ? value : ''
}

function normalizeEnergyAdjust(value: unknown): EnergyAdjust {
    return value === 'Más' || value === 'Menos' || value === 'Rediseñar' ? value : ''
}

function normalizeEnergyScore(value: unknown) {
    if (typeof value === 'number' && value >= 0 && value <= 10) return String(value)
    if (typeof value !== 'string') return ''
    const trimmed = value.trim()
    return /^([0-9]|10)$/.test(trimmed) ? trimmed : ''
}

function normalizeIdentityWheel(value: unknown) {
    const candidate = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
    return {
        roles: sanitizeList(candidate.roles, IDENTITY_BULLET_LIMIT),
        principios: sanitizeList(candidate.principios, IDENTITY_BULLET_LIMIT),
        presion: sanitizeList(candidate.presion, IDENTITY_BULLET_LIMIT),
        calma: sanitizeList(candidate.calma, IDENTITY_BULLET_LIMIT),
        aporte: sanitizeList(candidate.aporte, IDENTITY_BULLET_LIMIT),
        evito: sanitizeList(candidate.evito, IDENTITY_BULLET_LIMIT),
        triggers: sanitizeList(candidate.triggers, IDENTITY_BULLET_LIMIT),
        recursos: sanitizeList(candidate.recursos, IDENTITY_BULLET_LIMIT)
    }
}

function normalizeIdentityMatrixRows(value: unknown) {
    if (!Array.isArray(value)) return []
    return value
        .map((row) => {
            const candidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
            return {
                say: sanitizeText(candidate.say, 700),
                do: sanitizeText(candidate.do, 900),
                impact: sanitizeText(candidate.impact, 900)
            }
        })
        .filter((row) => row.say || row.do || row.impact)
        .slice(0, IDENTITY_MATRIX_ROWS)
}

function normalizeStakeholderRows(value: unknown) {
    if (!Array.isArray(value)) return []
    return value
        .map((row) => {
            const candidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
            return {
                personRole: sanitizeText(candidate.personRole, 180),
                strength: sanitizeText(candidate.strength, 500),
                blindspot: sanitizeText(candidate.blindspot, 500)
            }
        })
        .filter((row) => row.personRole || row.strength || row.blindspot)
        .slice(0, STAKEHOLDER_ROWS)
}

function normalizeFundamentalValues(value: unknown) {
    const candidate = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
    const selected10 = sanitizeValueList(candidate.selected10, 10)
    const selected5 = sanitizeValueList(candidate.selected5, 5).filter((item) => selected10.includes(item))
    const selected3 = sanitizeValueList(candidate.selected3, 3).filter((item) => selected5.includes(item))
    return {
        selected10,
        selected5,
        selected3
    }
}

function normalizeValueDecisionRows(value: unknown) {
    if (!Array.isArray(value)) return []
    return value
        .map((row) => {
            const candidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
            return {
                value: sanitizeText(candidate.value, 80),
                decision1: sanitizeText(candidate.decision1, 900),
                decision2: sanitizeText(candidate.decision2, 900)
            }
        })
        .filter((row) => row.value || row.decision1 || row.decision2)
        .slice(0, VALUE_DECISION_ROWS)
}

function normalizeNoNegotiableRows(value: unknown) {
    if (!Array.isArray(value)) return []
    return value
        .map((row) => {
            const candidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
            return {
                value: sanitizeText(candidate.value, 80),
                behavior: sanitizeText(candidate.behavior, 500),
                implication: sanitizeText(candidate.implication, 500)
            }
        })
        .filter((row) => row.value || row.behavior || row.implication)
        .slice(0, NO_NEGOTIABLE_ROWS)
}

function normalizeFoaFields(value: unknown) {
    const candidate = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
    return {
        strengths: sanitizeList(candidate.strengths, FOA_BULLET_LIMIT),
        opportunities: sanitizeList(candidate.opportunities, FOA_BULLET_LIMIT),
        threats: sanitizeList(candidate.threats, FOA_BULLET_LIMIT)
    }
}

function normalizeEnergyMapRows(value: unknown) {
    if (!Array.isArray(value)) return []
    return value
        .map((row) => {
            const candidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
            return {
                activity: sanitizeText(candidate.activity, 180),
                sign: normalizeEnergySign(candidate.sign),
                energy: normalizeEnergyScore(candidate.energy),
                reason: sanitizeText(candidate.reason, 280),
                adjust: normalizeEnergyAdjust(candidate.adjust)
            }
        })
        .filter((row) => row.activity || row.sign || row.energy || row.reason || row.adjust)
        .slice(0, ENERGY_MAP_ROWS)
}

function normalizeBeliefAbcRows(value: unknown) {
    if (!Array.isArray(value)) return []
    return value
        .map((row) => {
            const candidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
            return {
                activator: sanitizeText(candidate.activator, 700),
                belief: sanitizeText(candidate.belief, 500),
                emotion: sanitizeText(candidate.emotion, 160),
                action: sanitizeText(candidate.action, 700)
            }
        })
        .filter((row) => row.activator || row.belief || row.emotion || row.action)
        .slice(0, BELIEF_ABC_ROWS)
}

function normalizeBeliefEvidenceRows(value: unknown) {
    if (!Array.isArray(value)) return []
    return value
        .map((row) => {
            const candidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
            return {
                limitingBelief: sanitizeText(candidate.limitingBelief, 400),
                evidenceFor: sanitizeText(candidate.evidenceFor, 900),
                evidenceAgainst: sanitizeText(candidate.evidenceAgainst, 900),
                newMeaning: sanitizeText(candidate.newMeaning, 900)
            }
        })
        .filter((row) => row.limitingBelief || row.evidenceFor || row.evidenceAgainst || row.newMeaning)
        .slice(0, BELIEF_EVIDENCE_ROWS)
}

function normalizeBeliefImpact(value: unknown) {
    const candidate = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
    return {
        beliefImpactSelected: sanitizeText(candidate.beliefImpactSelected, 400),
        beliefImpactCosts: sanitizeList(candidate.beliefImpactCosts, BELIEF_IMPACT_BULLETS),
        beliefImpactLostOpportunities: sanitizeList(candidate.beliefImpactLostOpportunities, BELIEF_IMPACT_BULLETS),
        beliefImpactAffectedRows: Array.isArray(candidate.beliefImpactAffectedRows)
            ? candidate.beliefImpactAffectedRows
                  .map((row) => {
                      const rowCandidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
                      return {
                          person: sanitizeText(rowCandidate.person, 180),
                          impact: sanitizeText(rowCandidate.impact, 500)
                      }
                  })
                  .filter((row) => row.person || row.impact)
                  .slice(0, BELIEF_IMPACT_AFFECTED_ROWS)
            : []
    }
}

function normalizeEmpoweringBeliefRows(value: unknown) {
    if (!Array.isArray(value)) return []
    return value
        .map((row) => {
            const candidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
            return {
                limitingBelief: sanitizeText(candidate.limitingBelief, 400),
                idealBelief: sanitizeText(candidate.idealBelief, 500),
                bridgeBelief: sanitizeText(candidate.bridgeBelief, 500)
            }
        })
        .filter((row) => row.limitingBelief || row.idealBelief || row.bridgeBelief)
        .slice(0, EMPOWERING_BELIEF_ROWS)
}

function normalizeBridgeExperimentRows(value: unknown) {
    if (!Array.isArray(value)) return []
    return value
        .map((row) => {
            const candidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
            return {
                bridgeBelief: sanitizeText(candidate.bridgeBelief, 500),
                dailyBehavior: sanitizeText(candidate.dailyBehavior, 900),
                evidence: sanitizeText(candidate.evidence, 900),
                indicator: sanitizeText(candidate.indicator, 600)
            }
        })
        .filter((row) => row.bridgeBelief || row.dailyBehavior || row.evidence || row.indicator)
        .slice(0, BRIDGE_EXPERIMENT_ROWS)
}

function normalizeMantraRows(value: unknown) {
    if (!Array.isArray(value)) return []
    return value
        .map((row) => {
            const candidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
            return {
                mantra: sanitizeText(candidate.mantra, 320),
                situation: sanitizeText(candidate.situation, 500),
                behavior: sanitizeText(candidate.behavior, 500),
                signal: sanitizeText(candidate.signal, 320)
            }
        })
        .filter((row) => row.mantra || row.situation || row.behavior || row.signal)
        .slice(0, MANTRA_ROWS)
}

function normalizeFutureSelfFields(value: unknown) {
    const candidate = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
    const environment = candidate.environment && typeof candidate.environment === 'object' ? (candidate.environment as Record<string, unknown>) : {}
    const impact = candidate.impact && typeof candidate.impact === 'object' ? (candidate.impact as Record<string, unknown>) : {}

    return {
        identity: sanitizeList(candidate.identity, FUTURE_SELF_IDENTITY_ROWS),
        values: sanitizeList(candidate.values, FUTURE_SELF_VALUES_ROWS),
        habits: sanitizeList(candidate.habits, FUTURE_SELF_HABITS_ROWS),
        decisions: sanitizeList(candidate.decisions, FUTURE_SELF_DECISIONS_ROWS),
        skills: sanitizeList(candidate.skills, FUTURE_SELF_SKILLS_ROWS),
        environment: {
            surround: sanitizeText(environment.surround, 500),
            eliminate: sanitizeText(environment.eliminate, 500),
            protect: sanitizeText(environment.protect, 500)
        },
        impact: {
            serve: sanitizeText(impact.serve, 500),
            transform: sanitizeText(impact.transform, 500),
            result: sanitizeText(impact.result, 500)
        },
        metrics: sanitizeList(candidate.metrics, FUTURE_SELF_METRICS_ROWS),
        risks: Array.isArray(candidate.risks)
            ? candidate.risks
                  .map((row) => {
                      const rowCandidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
                      return {
                          risk: sanitizeText(rowCandidate.risk, 320),
                          prevention: sanitizeText(rowCandidate.prevention, 320)
                      }
                  })
                  .filter((row) => row.risk || row.prevention)
                  .slice(0, FUTURE_SELF_RISK_ROWS)
            : []
    }
}

function normalizeBackcastingRows(value: unknown) {
    if (!Array.isArray(value)) return []
    return value
        .map((row) => {
            const candidate = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
            return {
                achievement: sanitizeText(candidate.achievement, 500),
                habit: sanitizeText(candidate.habit, 500),
                evidence: sanitizeText(candidate.evidence, 500)
            }
        })
        .filter((row) => row.achievement || row.habit || row.evidence)
        .slice(0, BACKCASTING_ROWS)
}

function normalizePayload(step: InstrumentAssistKey, raw: unknown) {
    const candidate = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}

    switch (step) {
        case 'identityWheel':
            return { identityWheel: normalizeIdentityWheel(candidate.identityWheel) }
        case 'identityMatrix':
            return { identityMatrixRows: normalizeIdentityMatrixRows(candidate.identityMatrixRows) }
        case 'stakeholderMirror':
            return { stakeholderRows: normalizeStakeholderRows(candidate.stakeholderRows) }
        case 'fundamentalValues':
            return { fundamentalValues: normalizeFundamentalValues(candidate.fundamentalValues) }
        case 'valueDecisionMatrix':
            return { valueDecisionRows: normalizeValueDecisionRows(candidate.valueDecisionRows) }
        case 'noNegotiables':
            return { noNegotiableRows: normalizeNoNegotiableRows(candidate.noNegotiableRows) }
        case 'foa':
            return { foaFields: normalizeFoaFields(candidate.foaFields) }
        case 'energyMap':
            return {
                energyMapRows: normalizeEnergyMapRows(candidate.energyMapRows),
                energyPatternBullets: sanitizeList(candidate.energyPatternBullets, ENERGY_PATTERN_BULLETS),
                energyDoMore: sanitizeText(candidate.energyDoMore, 240),
                energyDoLess: sanitizeText(candidate.energyDoLess, 240),
                energyRedesign: sanitizeText(candidate.energyRedesign, 240)
            }
        case 'beliefAbc':
            return { beliefAbcRows: normalizeBeliefAbcRows(candidate.beliefAbcRows) }
        case 'beliefEvidence':
            return { beliefEvidenceRows: normalizeBeliefEvidenceRows(candidate.beliefEvidenceRows) }
        case 'beliefImpact':
            return normalizeBeliefImpact(candidate)
        case 'empoweringBeliefs':
            return { empoweringBeliefRows: normalizeEmpoweringBeliefRows(candidate.empoweringBeliefRows) }
        case 'bridgeExperiment':
            return { bridgeExperimentRows: normalizeBridgeExperimentRows(candidate.bridgeExperimentRows) }
        case 'mantras':
            return { mantraRows: normalizeMantraRows(candidate.mantraRows) }
        case 'futureSelf':
            return { futureSelfFields: normalizeFutureSelfFields(candidate.futureSelfFields) }
        case 'backcasting':
            return { backcastingRows: normalizeBackcastingRows(candidate.backcastingRows) }
        case 'futureLetter':
            return { futureLetterText: sanitizeText(candidate.futureLetterText, 9000) }
        default:
            return {}
    }
}

function getStepPrompt(step: InstrumentAssistKey) {
    switch (step) {
        case 'identityWheel':
            return `
INSTRUMENTO - RUEDA DE IDENTIDAD
- Organiza la informacion en 8 segmentos: roles, principios, presion, calma, aporte, evito, triggers, recursos.
- Cada segmento debe tener maximo 3 bullets cortos y concretos.
- No inventes segmentos vacios.
- Devuelve JSON:
{
  "identityWheel": {
    "roles": [],
    "principios": [],
    "presion": [],
    "calma": [],
    "aporte": [],
    "evito": [],
    "triggers": [],
    "recursos": []
  }
}
`
        case 'identityMatrix':
            return `
INSTRUMENTO - MATRIZ LO QUE DIGO / HAGO / IMPACTO
- Organiza hasta 10 filas.
- Cada fila debe incluir: say, do, impact.
- Usa hechos observables; no inventes filas.
- Devuelve JSON:
{ "identityMatrixRows": [{ "say": "", "do": "", "impact": "" }] }
`
        case 'stakeholderMirror':
            return `
INSTRUMENTO - ESPEJO DE STAKEHOLDERS
- Organiza hasta 3 filas.
- Cada fila debe incluir: personRole, strength, blindspot.
- Devuelve JSON:
{ "stakeholderRows": [{ "personRole": "", "strength": "", "blindspot": "" }] }
`
        case 'fundamentalValues':
            return `
INSTRUMENTO - VALORES FUNDAMENTALES
- Selecciona valores SOLO de esta lista permitida:
${FUNDAMENTAL_VALUES.join(', ')}
- Devuelve una propuesta de selected10, luego selected5 contenidos dentro de selected10 y selected3 contenidos dentro de selected5.
- No inventes valores fuera de la lista.
- Devuelve JSON:
{
  "fundamentalValues": {
    "selected10": [],
    "selected5": [],
    "selected3": []
  }
}
`
        case 'valueDecisionMatrix':
            return `
INSTRUMENTO - MATRIZ VALORES-DECISIONES
- Organiza hasta 5 filas con value, decision1, decision2.
- decision1 y decision2 deben ser decisiones observables con contexto.
- Devuelve JSON:
{ "valueDecisionRows": [{ "value": "", "decision1": "", "decision2": "" }] }
`
        case 'noNegotiables':
            return `
INSTRUMENTO - NO NEGOCIABLES
- Organiza hasta 3 filas con value, behavior, implication.
- behavior debe ser conducta concreta; implication el costo asumido.
- Devuelve JSON:
{ "noNegotiableRows": [{ "value": "", "behavior": "", "implication": "" }] }
`
        case 'foa':
            return `
INSTRUMENTO - F.O.A.
- Organiza bullets concretos en strengths, opportunities y threats.
- Maximo 5 bullets por lista.
- Devuelve JSON:
{
  "foaFields": {
    "strengths": [],
    "opportunities": [],
    "threats": []
  }
}
`
        case 'energyMap':
            return `
INSTRUMENTO - MAPA DE ENERGIA
- Organiza hasta 20 filas con activity, sign, energy, reason, adjust.
- sign solo puede ser "+" o "-".
- energy debe ir de 0 a 10 como string.
- adjust solo puede ser "Más", "Menos" o "Rediseñar".
- Incluye tambien energyPatternBullets, energyDoMore, energyDoLess y energyRedesign.
- Devuelve JSON:
{
  "energyMapRows": [{ "activity": "", "sign": "+", "energy": "7", "reason": "", "adjust": "Más" }],
  "energyPatternBullets": [],
  "energyDoMore": "",
  "energyDoLess": "",
  "energyRedesign": ""
}
`
        case 'beliefAbc':
            return `
INSTRUMENTO - MODELO ABC
- Organiza hasta 3 filas con activator, belief, emotion y action.
- activator debe ser hecho; belief, frase interna; emotion, emocion + intensidad; action, conducta observable.
- Devuelve JSON:
{ "beliefAbcRows": [{ "activator": "", "belief": "", "emotion": "", "action": "" }] }
`
        case 'beliefEvidence':
            return `
INSTRUMENTO - MATRIZ DE EVIDENCIA
- Organiza hasta 5 filas con limitingBelief, evidenceFor, evidenceAgainst y newMeaning.
- Devuelve JSON:
{ "beliefEvidenceRows": [{ "limitingBelief": "", "evidenceFor": "", "evidenceAgainst": "", "newMeaning": "" }] }
`
        case 'beliefImpact':
            return `
INSTRUMENTO - COSTO OCULTO
- Organiza la informacion en beliefImpactSelected, beliefImpactCosts, beliefImpactLostOpportunities y beliefImpactAffectedRows.
- Maximo 5 bullets en costos y oportunidades; maximo 3 filas en afectados.
- Devuelve JSON:
{
  "beliefImpactSelected": "",
  "beliefImpactCosts": [],
  "beliefImpactLostOpportunities": [],
  "beliefImpactAffectedRows": [{ "person": "", "impact": "" }]
}
`
        case 'empoweringBeliefs':
            return `
INSTRUMENTO - REENCUADRE + CREENCIA PUENTE
- Organiza hasta 3 filas con limitingBelief, idealBelief y bridgeBelief.
- bridgeBelief debe ser creible y accionable.
- Devuelve JSON:
{ "empoweringBeliefRows": [{ "limitingBelief": "", "idealBelief": "", "bridgeBelief": "" }] }
`
        case 'bridgeExperiment':
            return `
INSTRUMENTO - PLAN DE PRUEBA
- Organiza hasta 3 filas con bridgeBelief, dailyBehavior, evidence e indicator.
- Las conductas deben ser minimas y observables.
- Devuelve JSON:
{ "bridgeExperimentRows": [{ "bridgeBelief": "", "dailyBehavior": "", "evidence": "", "indicator": "" }] }
`
        case 'mantras':
            return `
INSTRUMENTO - MANTRAS
- Organiza hasta 3 filas con mantra, situation, behavior y signal.
- Mantén frases cortas y concretas.
- Devuelve JSON:
{ "mantraRows": [{ "mantra": "", "situation": "", "behavior": "", "signal": "" }] }
`
        case 'futureSelf':
            return `
INSTRUMENTO - FUTURE SELF CANVAS 10X
- Organiza el contenido en futureSelfFields con:
  - identity (2 bullets)
  - values (3 bullets)
  - habits (5 bullets)
  - decisions (3 bullets)
  - skills (3 bullets)
  - environment: surround, eliminate, protect
  - impact: serve, transform, result
  - metrics (3 bullets)
  - risks: hasta 3 filas con risk y prevention
- Devuelve JSON:
{
  "futureSelfFields": {
    "identity": [],
    "values": [],
    "habits": [],
    "decisions": [],
    "skills": [],
    "environment": { "surround": "", "eliminate": "", "protect": "" },
    "impact": { "serve": "", "transform": "", "result": "" },
    "metrics": [],
    "risks": [{ "risk": "", "prevention": "" }]
  }
}
`
        case 'backcasting':
            return `
INSTRUMENTO - BACKCASTING
- Organiza exactamente la secuencia en backcastingRows con hasta 4 hitos: año 10, año 3, año 1, 30 dias.
- Cada fila incluye achievement, habit y evidence.
- Devuelve JSON:
{ "backcastingRows": [{ "achievement": "", "habit": "", "evidence": "" }] }
`
        case 'futureLetter':
            return `
INSTRUMENTO - CARTA DESDE TU FUTURO
- Redacta una carta breve en primera persona.
- Debe conectar identidad 10X, no negociables, habito clave, decision clave e impacto.
- Devuelve JSON:
{ "futureLetterText": "" }
`
        default:
            return ''
    }
}

async function createOpenAIClient() {
    let apiKey = await SystemSettingsService.getOpenAIApiKey()
    if (!apiKey) apiKey = process.env.OPENAI_API_KEY || null
    if (!apiKey) throw new Error('OPENAI_API_KEY no configurada.')

    return new OpenAI({ apiKey })
}

async function transcribeAudio(client: OpenAI, audioFile: File) {
    const transcription = await client.audio.transcriptions.create({
        file: audioFile,
        model: 'gpt-4o-mini-transcribe'
    })

    return sanitizeText(transcription.text, 12000)
}

async function extractStructuredData(client: OpenAI, step: InstrumentAssistKey, sourceText: string, currentData: unknown) {
    const prompt = `
Eres un asistente de escritura ejecutiva de 4Shine para el WB1 "Creencias, identidad y pilares personales".

REGLAS:
- Responde siempre en espanol.
- Usa SOLO informacion contenida en el insumo del usuario y en el contexto ya cargado.
- No inventes hechos, decisiones, creencias, stakeholders, valores, riesgos ni indicadores.
- Puedes reorganizar, sintetizar y limpiar redaccion.
- Si falta informacion, devuelve menos campos llenos; no inventes.
- Responde unicamente con JSON valido. Sin markdown.

${getStepPrompt(step)}

CONTEXTO YA CARGADO:
${JSON.stringify(currentData ?? {}, null, 2).slice(0, 14000)}

INSUMO PRINCIPAL DEL USUARIO:
${sourceText.slice(0, 14000)}
`

    const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }]
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('OpenAI no devolvió contenido estructurado.')

    return normalizePayload(step, JSON.parse(content))
}

function isValidStep(value: unknown): value is InstrumentAssistKey {
    return (
        value === 'identityWheel' ||
        value === 'identityMatrix' ||
        value === 'stakeholderMirror' ||
        value === 'fundamentalValues' ||
        value === 'valueDecisionMatrix' ||
        value === 'noNegotiables' ||
        value === 'foa' ||
        value === 'energyMap' ||
        value === 'beliefAbc' ||
        value === 'beliefEvidence' ||
        value === 'beliefImpact' ||
        value === 'empoweringBeliefs' ||
        value === 'bridgeExperiment' ||
        value === 'mantras' ||
        value === 'futureSelf' ||
        value === 'backcasting' ||
        value === 'futureLetter'
    )
}

function hasMeaningfulCurrentData(value: unknown) {
    const serialized = JSON.stringify(value ?? {})
    return serialized.replace(/[{}\[\]",:\s]/g, '').length > 0
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const client = await createOpenAIClient()
        const contentType = request.headers.get('content-type') || ''

        let step: InstrumentAssistKey | null = null
        let sourceText = ''
        let currentData: unknown = {}

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData()
            const rawStep = formData.get('step')
            const rawCurrentData = formData.get('currentData')
            const audio = formData.get('audio')

            if (!isValidStep(rawStep)) {
                return NextResponse.json({ error: 'Instrumento inválido.' }, { status: 400 })
            }

            if (!(audio instanceof File)) {
                return NextResponse.json({ error: 'Debes adjuntar un archivo de audio.' }, { status: 400 })
            }

            step = rawStep
            currentData = typeof rawCurrentData === 'string' && rawCurrentData.trim().length > 0 ? JSON.parse(rawCurrentData) : {}
            sourceText = await transcribeAudio(client, audio)
        } else {
            const body = await request.json()
            const rawStep = body?.step
            if (!isValidStep(rawStep)) {
                return NextResponse.json({ error: 'Instrumento inválido.' }, { status: 400 })
            }

            step = rawStep
            currentData = body?.currentData ?? {}
            sourceText = sanitizeText(body?.notes, 12000)
        }

        if (!step) {
            return NextResponse.json({ error: 'Instrumento inválido.' }, { status: 400 })
        }

        if (!sourceText && !hasMeaningfulCurrentData(currentData)) {
            return NextResponse.json({ error: 'Comparte contenido o un audio para poder ayudarte.' }, { status: 400 })
        }

        const data = await extractStructuredData(client, step, sourceText, currentData)

        return NextResponse.json({
            success: true,
            sourceText,
            data
        })
    } catch (error: unknown) {
        console.error('[WB1 Instrument Assist Error]', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'No fue posible procesar la ayuda de IA.' },
            { status: 500 }
        )
    }
}
