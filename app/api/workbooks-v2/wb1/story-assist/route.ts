import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SystemSettingsService } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

type StoryAssistStepKey = 'step1' | 'step2' | 'step3'

type StoryAssistEventPayload = {
    type?: string
    approxDate?: string
    happened?: string
    interpreted?: string
    learned?: string
    belief?: string
}

type StoryAssistPayload = {
    timelineRange?: string
    events?: StoryAssistEventPayload[]
    actOrigin?: string
    actBreak?: string
    actRebuild?: string
    patternDecision?: string[]
    patternTrigger?: string[]
    patternResource?: string[]
}

function sanitizeText(value: unknown, max = 1800) {
    if (typeof value !== 'string') return ''
    return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

function sanitizeList(value: unknown, max = 10) {
    if (!Array.isArray(value)) return []

    return value
        .map((item) => sanitizeText(item, 240))
        .filter(Boolean)
        .slice(0, max)
}

function normalizeEventType(value: unknown): 'logro' | 'logro-golpe' | 'golpe' {
    if (value === 'logro' || value === 'logro-golpe' || value === 'golpe') return value
    if (typeof value !== 'string') return 'logro'

    const normalized = value.toLowerCase()
    if (normalized.includes('logro') && (normalized.includes('golpe') || normalized.includes('quiebre') || normalized.includes('crisis'))) {
        return 'logro-golpe'
    }
    if (normalized.includes('golpe') || normalized.includes('quiebre') || normalized.includes('crisis')) return 'golpe'
    return 'logro'
}

function normalizeApproxDate(value: unknown) {
    if (typeof value !== 'string') return ''
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed
    if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01`
    return ''
}

function normalizePayload(step: StoryAssistStepKey, raw: unknown): StoryAssistPayload {
    const candidate = raw && typeof raw === 'object' ? (raw as StoryAssistPayload) : {}

    if (step === 'step1') {
        return {
            timelineRange: sanitizeText(candidate.timelineRange, 120),
            events: Array.isArray(candidate.events)
                ? candidate.events
                      .map((event) => ({
                          type: normalizeEventType(event?.type),
                          approxDate: normalizeApproxDate(event?.approxDate),
                          happened: sanitizeText(event?.happened, 900),
                          interpreted: sanitizeText(event?.interpreted, 900),
                          learned: sanitizeText(event?.learned, 900),
                          belief: sanitizeText(event?.belief, 900)
                      }))
                      .filter((event) => event.happened || event.interpreted || event.learned || event.belief)
                      .slice(0, 5)
                : []
        }
    }

    if (step === 'step2') {
        return {
            actOrigin: sanitizeText(candidate.actOrigin, 2400),
            actBreak: sanitizeText(candidate.actBreak, 2400),
            actRebuild: sanitizeText(candidate.actRebuild, 2400)
        }
    }

    return {
        patternDecision: sanitizeList(candidate.patternDecision, 10),
        patternTrigger: sanitizeList(candidate.patternTrigger, 10),
        patternResource: sanitizeList(candidate.patternResource, 10)
    }
}

function getStepPrompt(step: StoryAssistStepKey) {
    if (step === 'step1') {
        return `
PASO 1 - LINEA DE VIDA (TIMELINE)
- Tu trabajo es extraer una temporalidad de trabajo y hasta 5 eventos bien estructurados.
- Cada evento debe incluir: type, approxDate, happened, interpreted, learned, belief.
- "type" solo puede ser: "logro", "logro-golpe" o "golpe".
- Usa "logro-golpe" cuando el evento mezcle avance con quiebre o tensión.
- Si el usuario solo menciona el año, usa YYYY-01.
- Si no hay fecha suficiente, usa "".
- No inventes eventos; solo organiza y resume los que sí aparecen en el insumo.
- Devuelve este JSON exacto:
{
  "timelineRange": "",
  "events": [
    {
      "type": "logro",
      "approxDate": "2024-02",
      "happened": "",
      "interpreted": "",
      "learned": "",
      "belief": ""
    }
  ]
}
`
    }

    if (step === 'step2') {
        return `
PASO 2 - NARRATIVA EN 3 ACTOS
- Redacta en primera persona.
- Usa hechos, contexto, escena clave y efecto en la persona.
- Ordena la historia en: origen, quiebre y reconstrucción.
- No escribas frases vacias ni coaching generico.
- Si falta informacion para un acto, devuelve "" en ese campo.
- Devuelve este JSON exacto:
{
  "actOrigin": "",
  "actBreak": "",
  "actRebuild": ""
}
`
    }

    return `
PASO 3 - PATRONES
- Convierte la informacion del usuario en bullets concretos, observables y accionables.
- No uses adjetivos vagos; privilegia comportamientos visibles.
- Separa claramente:
  - patternDecision: patrones que se repiten en sus decisiones.
  - patternTrigger: situaciones que activan miedo, defensa o cierre.
  - patternResource: recursos consistentes que le ayudan a responder mejor.
- Maximo 10 bullets por lista.
- Devuelve este JSON exacto:
{
  "patternDecision": [],
  "patternTrigger": [],
  "patternResource": []
}
`
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

async function extractStructuredStoryData(
    client: OpenAI,
    step: StoryAssistStepKey,
    sourceText: string,
    currentData: unknown
) {
    const prompt = `
Eres un asistente de escritura ejecutiva de 4Shine para el WB1 "Creencias, identidad y pilares personales".

REGLAS:
- Responde siempre en espanol.
- Usa SOLO informacion contenida en el insumo del usuario y en el contexto ya cargado.
- No inventes hechos, fechas, logros, crisis ni creencias.
- Puedes reorganizar, sintetizar y limpiar redaccion.
- Si no hay suficiente informacion para un campo, devuelvelo vacio.
- Responde unicamente con JSON valido. Sin markdown.

${getStepPrompt(step)}

CONTEXTO YA CARGADO:
${JSON.stringify(currentData ?? {}, null, 2).slice(0, 12000)}

INSUMO PRINCIPAL DEL USUARIO:
${sourceText.slice(0, 12000)}
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

function isValidStep(value: unknown): value is StoryAssistStepKey {
    return value === 'step1' || value === 'step2' || value === 'step3'
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

        let step: StoryAssistStepKey | null = null
        let sourceText = ''
        let currentData: unknown = {}

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData()
            const rawStep = formData.get('step')
            const rawCurrentData = formData.get('currentData')
            const audio = formData.get('audio')

            if (!isValidStep(rawStep)) {
                return NextResponse.json({ error: 'Paso inválido.' }, { status: 400 })
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
                return NextResponse.json({ error: 'Paso inválido.' }, { status: 400 })
            }

            step = rawStep
            currentData = body?.currentData ?? {}
            sourceText = sanitizeText(body?.notes, 12000)
        }

        if (!step) {
            return NextResponse.json({ error: 'Paso inválido.' }, { status: 400 })
        }

        if (!sourceText && !hasMeaningfulCurrentData(currentData)) {
            return NextResponse.json({ error: 'Comparte notas o un audio con contenido para poder ayudarte.' }, { status: 400 })
        }

        const data = await extractStructuredStoryData(client, step, sourceText, currentData)

        return NextResponse.json({
            success: true,
            sourceText,
            data
        })
    } catch (error: unknown) {
        console.error('[WB1 Story Assist Error]', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'No fue posible procesar la ayuda de IA.' },
            { status: 500 }
        )
    }
}
