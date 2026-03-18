import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SystemSettingsService } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

type PageAssistStepSummary = {
    title?: string
    detail?: string
}

function sanitizeText(value: unknown, max = 2400) {
    if (typeof value !== 'string') return ''
    return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

function sanitizeStructuredValue(value: unknown, depth = 0): unknown {
    if (depth > 12) return null
    if (typeof value === 'string') return sanitizeText(value)
    if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value
    if (Array.isArray(value)) return value.slice(0, 80).map((item) => sanitizeStructuredValue(item, depth + 1))
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, sanitizeStructuredValue(entry, depth + 1)])
        )
    }
    return value
}

function sanitizeStepSummaries(value: unknown) {
    if (!Array.isArray(value)) return [] as Array<{ title: string; detail: string }>

    return value
        .map((entry) => ({
            title: sanitizeText((entry as PageAssistStepSummary)?.title, 160),
            detail: sanitizeText((entry as PageAssistStepSummary)?.detail, 480)
        }))
        .filter((entry) => entry.title)
        .slice(0, 20)
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

    return sanitizeText(transcription.text, 16000)
}

function buildPrompt({
    workbookId,
    pageId,
    pageTitle,
    stepSummaries,
    currentData,
    sourceText
}: {
    workbookId: string
    pageId: number
    pageTitle: string
    stepSummaries: Array<{ title: string; detail: string }>
    currentData: unknown
    sourceText: string
}) {
    const stepsText =
        stepSummaries.length > 0
            ? stepSummaries.map((step) => `- ${step.title}: ${step.detail}`).join('\n')
            : '- Usa la estructura ya cargada de la página para organizar la respuesta.'

    return `
Eres un Asistente IA de escritura ejecutiva para 4Shine.

OBJETIVO:
Ayudar a completar una página de workbook con información concreta, clara y accionable, manteniendo la estructura actual del ejercicio.

REGLAS:
- Responde siempre en español.
- Usa solo la información del insumo principal y del contexto ya cargado.
- No inventes hechos, fechas, logros, métricas, nombres ni decisiones.
- Mantén la misma estructura JSON del CONTEXTO ACTUAL.
- Devuelve el JSON completo de la página, no solo un fragmento.
- Si algo no está soportado por el insumo, consérvalo como está o déjalo vacío.
- No agregues markdown, comentarios ni explicaciones.
- Responde únicamente con JSON válido.

WORKBOOK: ${workbookId}
PÁGINA: ${pageTitle} (id ${pageId})

PASOS DETECTADOS:
${stepsText}

CONTEXTO ACTUAL (estructura a respetar):
${JSON.stringify(currentData ?? {}, null, 2).slice(0, 20000)}

INSUMO PRINCIPAL DEL USUARIO:
${sourceText.slice(0, 16000)}
`
}

async function extractStructuredPageData(client: OpenAI, args: Parameters<typeof buildPrompt>[0]) {
    const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: buildPrompt(args) }]
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Asistente IA no devolvió contenido estructurado.')

    return sanitizeStructuredValue(JSON.parse(content))
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const client = await createOpenAIClient()
        const contentType = request.headers.get('content-type') || ''

        let workbookId = ''
        let pageId = 0
        let pageTitle = ''
        let stepSummaries: Array<{ title: string; detail: string }> = []
        let currentData: unknown = {}
        let sourceText = ''

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData()
            const audio = formData.get('audio')

            if (!(audio instanceof File)) {
                return NextResponse.json({ error: 'Debes adjuntar un archivo de audio.' }, { status: 400 })
            }

            workbookId = sanitizeText(formData.get('workbookId'), 40)
            pageId = Number(formData.get('pageId')) || 0
            pageTitle = sanitizeText(formData.get('pageTitle'), 180)
            stepSummaries = sanitizeStepSummaries(JSON.parse(String(formData.get('stepSummaries') || '[]')))
            currentData = JSON.parse(String(formData.get('currentData') || '{}'))
            sourceText = await transcribeAudio(client, audio)
        } else {
            const body = await request.json()
            workbookId = sanitizeText(body?.workbookId, 40)
            pageId = typeof body?.pageId === 'number' ? body.pageId : Number(body?.pageId) || 0
            pageTitle = sanitizeText(body?.pageTitle, 180)
            stepSummaries = sanitizeStepSummaries(body?.stepSummaries)
            currentData = body?.currentData ?? {}
            sourceText =
                'Ordena, sintetiza y mejora la claridad del contexto ya cargado sin inventar información nueva ni alterar el sentido de lo que el usuario ya registró.'
        }

        if (!workbookId || !pageId || !pageTitle) {
            return NextResponse.json({ error: 'Faltan datos para procesar esta página.' }, { status: 400 })
        }

        const data = await extractStructuredPageData(client, {
            workbookId,
            pageId,
            pageTitle,
            stepSummaries,
            currentData,
            sourceText
        })

        return NextResponse.json({
            data,
            sourceText
        })
    } catch (error) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'No fue posible completar la ayuda en este momento.'
            },
            { status: 500 }
        )
    }
}
