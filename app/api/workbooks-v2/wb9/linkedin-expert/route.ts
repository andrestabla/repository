import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
    createOpenAIClient,
    normalizeLinkedInProfileUrl,
    readBraveSearchSnapshot,
    readPublicProfileSnapshot,
    sanitizeText
} from '@/app/api/workbooks-v2/wb9/linkedin-shared'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const LINKEDIN_ABOUT_BLOCKS = [
    'Quién soy y desde dónde hablo',
    'Resultados / trayectoria que me respaldan',
    'Problema principal que resuelvo',
    'Cómo pienso / cómo lidero',
    'Qué organizaciones o audiencias quiero impactar',
    'Qué visión o legado estoy construyendo'
] as const

const LINKEDIN_PROFILE_SECTIONS = ['Foto', 'Banner', 'Headline', 'Acerca de', 'Experiencia', 'Destacados', 'Actividad'] as const

const LINKEDIN_OPTIMIZATION_QUESTIONS = [
    '¿Mi Headline comunica valor y no solo rol?',
    '¿El banner refuerza mi promesa?',
    '¿El “Acerca de” está bien estructurado?',
    '¿Mi perfil muestra pensamiento propio?',
    '¿Hay suficiente prueba reputacional?',
    '¿El perfil puede abrir oportunidades reales?'
] as const

type LinkedInExpertBlock = 'headline' | 'banner' | 'about' | 'sections' | 'optimization'

type LinkedInExpertPayload = {
    profileUrl?: string
    block?: LinkedInExpertBlock
    context?: unknown
}

type YesNoAnswer = '' | 'yes' | 'no'

function isLinkedInExpertBlock(value: unknown): value is LinkedInExpertBlock {
    return value === 'headline' || value === 'banner' || value === 'about' || value === 'sections' || value === 'optimization'
}

function sanitizePromptValue(value: unknown, depth = 0): unknown {
    if (depth > 4) return ''
    if (typeof value === 'string') return sanitizeText(value, 320)
    if (typeof value === 'number' || typeof value === 'boolean') return value
    if (Array.isArray(value)) {
        return value
            .slice(0, 12)
            .map((item) => sanitizePromptValue(item, depth + 1))
            .filter((item) =>
                typeof item === 'string'
                    ? item.length > 0
                    : Array.isArray(item)
                      ? item.length > 0
                      : item && typeof item === 'object'
                        ? Object.keys(item).length > 0
                        : Boolean(item)
            )
    }
    if (value && typeof value === 'object') {
        const cleanedEntries = Object.entries(value as Record<string, unknown>)
            .slice(0, 24)
            .map(([key, nested]) => [key, sanitizePromptValue(nested, depth + 1)] as const)
            .filter(([, nested]) =>
                typeof nested === 'string'
                    ? nested.length > 0
                    : Array.isArray(nested)
                      ? nested.length > 0
                      : nested && typeof nested === 'object'
                        ? Object.keys(nested).length > 0
                        : Boolean(nested)
            )

        return Object.fromEntries(cleanedEntries)
    }
    return ''
}

function buildContextSnapshot(context: unknown) {
    const cleaned = sanitizePromptValue(context)
    const serialized = JSON.stringify(cleaned, null, 2)
    return serialized && serialized !== '{}' ? serialized.slice(0, 8000) : 'Sin contexto adicional del workbook.'
}

function getEvidenceStatus(directRead: { meaningful: boolean }, braveRead: { found: boolean }) {
    if (directRead.meaningful && braveRead.found) return 'sufficient' as const
    if (directRead.meaningful || braveRead.found) return 'partial' as const
    return 'insufficient' as const
}

function buildFallbackNote(status: 'sufficient' | 'partial' | 'insufficient') {
    if (status === 'sufficient') {
        return 'La recomendación se generó con señal pública verificable del perfil y el contexto del workbook.'
    }
    if (status === 'partial') {
        return 'La recomendación se afinó con evidencia pública parcial del perfil y el contexto del workbook.'
    }
    return 'La recomendación se apoyó sobre todo en el contexto del workbook porque la evidencia pública del perfil fue limitada.'
}

function buildBlockGuidance(block: LinkedInExpertBlock) {
    switch (block) {
        case 'headline':
            return {
                label: 'Bloque 2 — Fórmula del Headline estratégico',
                rules: [
                    'Propón un solo Headline, breve, recordable y usable en LinkedIn.',
                    'Máximo 220 caracteres.',
                    'Debe comunicar transformación, territorio y sello ejecutivo sin depender solo del cargo.'
                ],
                template: `{
  "strategicHeadline": "",
  "note": ""
}`
            }
        case 'banner':
            return {
                label: 'Bloque 3 — Diseño del Banner',
                rules: [
                    'Completa los 4 campos del banner con lenguaje claro y ejecutivo.',
                    'La frase principal debe sonar como promesa de valor.',
                    'La señal visual debe ser concreta y memorable.'
                ],
                template: `{
  "banner": {
    "mainPhrase": "",
    "subtitle": "",
    "visualSignal": "",
    "reinforces": ""
  },
  "note": ""
}`
            }
        case 'about':
            return {
                label: 'Bloque 4 — Matriz “Acerca de”',
                rules: [
                    'Completa los 6 bloques con formulaciones concretas.',
                    'Cada bloque debe sonar a marca ejecutiva, no a biografía genérica.',
                    'No inventes logros fuera de la evidencia pública o del contexto del workbook.'
                ],
                template: `{
  "aboutMatrix": [
    { "block": "Quién soy y desde dónde hablo", "formulation": "" },
    { "block": "Resultados / trayectoria que me respaldan", "formulation": "" },
    { "block": "Problema principal que resuelvo", "formulation": "" },
    { "block": "Cómo pienso / cómo lidero", "formulation": "" },
    { "block": "Qué organizaciones o audiencias quiero impactar", "formulation": "" },
    { "block": "Qué visión o legado estoy construyendo", "formulation": "" }
  ],
  "note": ""
}`
            }
        case 'sections':
            return {
                label: 'Bloque 5 — Mapa de secciones críticas del perfil',
                rules: [
                    'Completa las 7 filas con lectura estratégica y accionable.',
                    'No repitas frases idénticas entre secciones.',
                    'Los ajustes prioritarios deben ser específicos.'
                ],
                template: `{
  "profileSections": [
    { "section": "Foto", "communicates": "", "missingToday": "", "priorityAdjustment": "" },
    { "section": "Banner", "communicates": "", "missingToday": "", "priorityAdjustment": "" },
    { "section": "Headline", "communicates": "", "missingToday": "", "priorityAdjustment": "" },
    { "section": "Acerca de", "communicates": "", "missingToday": "", "priorityAdjustment": "" },
    { "section": "Experiencia", "communicates": "", "missingToday": "", "priorityAdjustment": "" },
    { "section": "Destacados", "communicates": "", "missingToday": "", "priorityAdjustment": "" },
    { "section": "Actividad", "communicates": "", "missingToday": "", "priorityAdjustment": "" }
  ],
  "note": ""
}`
            }
        case 'optimization':
            return {
                label: 'Bloque 6 — Test de optimización del perfil',
                rules: [
                    'Responde las 6 preguntas con un veredicto yes/no y un ajuste concreto.',
                    'Usa el contenido actual del workbook para evaluar si la optimización ya está suficientemente resuelta.',
                    'Si marcas yes, el ajuste debe servir para fortalecer; si marcas no, el ajuste debe cerrar la brecha.'
                ],
                template: `{
  "optimizationChecks": [
    { "question": "¿Mi Headline comunica valor y no solo rol?", "verdict": "yes", "adjustment": "" },
    { "question": "¿El banner refuerza mi promesa?", "verdict": "yes", "adjustment": "" },
    { "question": "¿El “Acerca de” está bien estructurado?", "verdict": "yes", "adjustment": "" },
    { "question": "¿Mi perfil muestra pensamiento propio?", "verdict": "yes", "adjustment": "" },
    { "question": "¿Hay suficiente prueba reputacional?", "verdict": "yes", "adjustment": "" },
    { "question": "¿El perfil puede abrir oportunidades reales?", "verdict": "yes", "adjustment": "" }
  ],
  "note": ""
}`
            }
    }
}

async function analyzeExpertBlock(
    client: OpenAI,
    block: LinkedInExpertBlock,
    profileUrl: string,
    evidenceSnapshot: string,
    contextSnapshot: string,
    publicEvidenceStatus: 'sufficient' | 'partial' | 'insufficient'
) {
    const guidance = buildBlockGuidance(block)
    const prompt = `
Eres un estratega senior de marca ejecutiva y LinkedIn para 4Shine.

Tu tarea es completar ${guidance.label} usando:
1. evidencia pública del perfil de LinkedIn y extractos indexados;
2. la auditoría y el contenido ya cargado en el workbook;
3. el contexto de propósito, marca, valores, arquetipo y causa.

REGLAS:
- Responde en español.
- No inventes cargos, logros ni credenciales que no aparezcan en la evidencia pública o en el contexto del workbook.
- Si la evidencia pública es parcial, igual entrega una propuesta útil, clara y accionable.
- No uses emojis.
- No menciones limitaciones técnicas dentro de los campos salvo que sea indispensable para la calidad de la recomendación.
- Devuelve solo JSON válido.

ESTADO DE EVIDENCIA PÚBLICA:
${publicEvidenceStatus}

URL OBJETIVO:
${profileUrl}

EVIDENCIA PÚBLICA DISPONIBLE:
${evidenceSnapshot}

CONTEXTO DEL WORKBOOK:
${contextSnapshot}

REQUISITOS ESPECÍFICOS:
${guidance.rules.map((rule) => `- ${rule}`).join('\n')}

Devuelve exactamente este JSON:
${guidance.template}
`

    const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }]
    })

    return JSON.parse(completion.choices[0]?.message?.content || '{}') as Record<string, unknown>
}

function normalizeHeadline(value: unknown) {
    return sanitizeText(value, 220)
}

function normalizeBanner(value: unknown) {
    const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
    return {
        mainPhrase: sanitizeText(source.mainPhrase, 240),
        subtitle: sanitizeText(source.subtitle, 240),
        visualSignal: sanitizeText(source.visualSignal, 180),
        reinforces: sanitizeText(source.reinforces, 240)
    }
}

function normalizeAboutMatrix(value: unknown) {
    const rows = Array.isArray(value) ? value : []
    return LINKEDIN_ABOUT_BLOCKS.map((block, index) => {
        const byBlock = rows.find(
            (row) => row && typeof row === 'object' && sanitizeText((row as Record<string, unknown>).block, 240) === block
        )
        const byIndex = rows[index]
        const source = (byBlock || byIndex || {}) as Record<string, unknown>
        return {
            block,
            formulation: sanitizeText(source.formulation, 360)
        }
    })
}

function normalizeProfileSections(value: unknown) {
    const rows = Array.isArray(value) ? value : []
    return LINKEDIN_PROFILE_SECTIONS.map((section, index) => {
        const bySection = rows.find(
            (row) => row && typeof row === 'object' && sanitizeText((row as Record<string, unknown>).section, 240) === section
        )
        const byIndex = rows[index]
        const source = (bySection || byIndex || {}) as Record<string, unknown>
        return {
            section,
            communicates: sanitizeText(source.communicates, 240),
            missingToday: sanitizeText(source.missingToday, 240),
            priorityAdjustment: sanitizeText(source.priorityAdjustment, 260)
        }
    })
}

function normalizeVerdict(value: unknown): YesNoAnswer {
    return value === 'yes' || value === 'no' ? value : ''
}

function normalizeOptimizationChecks(value: unknown) {
    const rows = Array.isArray(value) ? value : []
    return LINKEDIN_OPTIMIZATION_QUESTIONS.map((question, index) => {
        const byQuestion = rows.find(
            (row) => row && typeof row === 'object' && sanitizeText((row as Record<string, unknown>).question, 240) === question
        )
        const byIndex = rows[index]
        const source = (byQuestion || byIndex || {}) as Record<string, unknown>
        return {
            question,
            verdict: normalizeVerdict(source.verdict),
            adjustment: sanitizeText(source.adjustment, 240)
        }
    })
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = (await request.json()) as LinkedInExpertPayload
        const profileUrl = normalizeLinkedInProfileUrl(body.profileUrl)

        if (!isLinkedInExpertBlock(body.block)) {
            throw new Error('El bloque solicitado no es válido para este Asistente IA.')
        }

        const client = await createOpenAIClient()
        const directRead = await readPublicProfileSnapshot(profileUrl)
        const braveRead = await readBraveSearchSnapshot(profileUrl)
        const publicEvidenceStatus = getEvidenceStatus(directRead, braveRead)
        const evidenceSnapshot = [braveRead.snapshot, directRead.snapshot].filter(Boolean).join('\n\n').slice(0, 12000) || 'Sin evidencia pública adicional.'
        const contextSnapshot = buildContextSnapshot(body.context)
        const parsed = await analyzeExpertBlock(client, body.block, profileUrl, evidenceSnapshot, contextSnapshot, publicEvidenceStatus)
        const note = sanitizeText(parsed.note, 400) || buildFallbackNote(publicEvidenceStatus)

        switch (body.block) {
            case 'headline':
                return NextResponse.json({
                    strategicHeadline: normalizeHeadline(parsed.strategicHeadline),
                    publicEvidenceStatus,
                    note
                })
            case 'banner':
                return NextResponse.json({
                    banner: normalizeBanner(parsed.banner),
                    publicEvidenceStatus,
                    note
                })
            case 'about':
                return NextResponse.json({
                    aboutMatrix: normalizeAboutMatrix(parsed.aboutMatrix),
                    publicEvidenceStatus,
                    note
                })
            case 'sections':
                return NextResponse.json({
                    profileSections: normalizeProfileSections(parsed.profileSections),
                    publicEvidenceStatus,
                    note
                })
            case 'optimization':
                return NextResponse.json({
                    optimizationChecks: normalizeOptimizationChecks(parsed.optimizationChecks),
                    publicEvidenceStatus,
                    note
                })
        }
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'No fue posible generar esta recomendación experta en este momento.'
            },
            { status: 500 }
        )
    }
}
