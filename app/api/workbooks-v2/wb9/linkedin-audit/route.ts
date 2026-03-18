import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SystemSettingsService } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const LINKEDIN_AUDIT_DIMENSIONS = [
    'Qué impresión general deja hoy',
    'Qué valor comunica con claridad',
    'Qué parte del perfil está genérica o débil',
    'Qué señal de autoridad aparece',
    'Qué oportunidad podría abrir hoy',
    'Qué oportunidad probablemente está perdiendo'
] as const

type AuditDimension = (typeof LINKEDIN_AUDIT_DIMENSIONS)[number]

type AuditRow = {
    dimension: AuditDimension
    response: string
}

type LinkedInAuditPayload = {
    profileUrl?: string
    currentAudit?: Array<{
        dimension?: string
        response?: string
    }>
}

function sanitizeText(value: unknown, max = 2400) {
    if (typeof value !== 'string') return ''
    return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

function decodeHtmlEntities(value: string) {
    return value
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
}

function normalizeLinkedInProfileUrl(value: unknown) {
    if (typeof value !== 'string') throw new Error('Debes ingresar una URL de LinkedIn.')

    let parsed: URL
    try {
        parsed = new URL(value.trim())
    } catch {
        throw new Error('La URL de LinkedIn no es válida.')
    }

    const host = parsed.hostname.toLowerCase()
    if (!host.endsWith('linkedin.com')) {
        throw new Error('Usa una URL pública de LinkedIn.')
    }

    if (!parsed.pathname.startsWith('/in/')) {
        throw new Error('La URL debe apuntar a un perfil público de LinkedIn.')
    }

    parsed.search = ''
    parsed.hash = ''
    parsed.pathname = parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`
    return parsed.toString()
}

function extractLinkedInSlug(profileUrl: string) {
    try {
        const parsed = new URL(profileUrl)
        return sanitizeText(parsed.pathname.replace(/^\/in\//, '').replace(/\/$/, ''), 160)
    } catch {
        return ''
    }
}

function extractMetaContent(html: string, pattern: RegExp) {
    const match = html.match(pattern)
    return decodeHtmlEntities(sanitizeText(match?.[1] || '', 600))
}

function stripHtml(html: string) {
    return sanitizeText(
        decodeHtmlEntities(
            html
                .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
                .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
                .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
                .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
                .replace(/<[^>]+>/g, ' ')
        ),
        5000
    )
}

async function readPublicProfileSnapshot(profileUrl: string) {
    try {
        const response = await fetch(profileUrl, {
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'accept-language': 'es-CO,es;q=0.9,en;q=0.8'
            },
            redirect: 'follow',
            cache: 'no-store'
        })

        const html = await response.text()
        const title = extractMetaContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
        const description = extractMetaContent(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
        const ogTitle = extractMetaContent(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
        const ogDescription = extractMetaContent(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
        const plainText = stripHtml(html)

        const parts = [
            `Estado HTTP: ${response.status}`,
            response.url && response.url !== profileUrl ? `URL final: ${response.url}` : '',
            title ? `Título: ${title}` : '',
            description ? `Descripción: ${description}` : '',
            ogTitle ? `OG título: ${ogTitle}` : '',
            ogDescription ? `OG descripción: ${ogDescription}` : '',
            plainText ? `Texto visible: ${plainText}` : ''
        ].filter(Boolean)

        return {
            snapshot: parts.join('\n').slice(0, 8000),
            meaningful: plainText.replace(/linkedin|authwall|sign in|join now|cookie|privacy|terms|agreement/gi, '').length > 260
        }
    } catch (error) {
        return {
            snapshot:
                error instanceof Error
                    ? `No se pudo leer la URL directamente. Motivo técnico: ${sanitizeText(error.message, 600)}`
                    : 'No se pudo leer la URL directamente.',
            meaningful: false
        }
    }
}

async function createOpenAIClient() {
    let apiKey = await SystemSettingsService.getOpenAIApiKey()
    if (!apiKey) apiKey = process.env.OPENAI_API_KEY || null
    if (!apiKey) throw new Error('No hay configuración disponible para el Asistente IA.')

    return new OpenAI({ apiKey })
}

function normalizeAuditRows(rawAudit: unknown, fallbackMessage: string) {
    const rows = Array.isArray(rawAudit) ? rawAudit : []

    return LINKEDIN_AUDIT_DIMENSIONS.map((dimension, index) => {
        const byDimension = rows.find(
            (row) => row && typeof row === 'object' && sanitizeText((row as Record<string, unknown>).dimension, 240) === dimension
        )
        const byIndex = rows[index]
        const source = (byDimension || byIndex || {}) as Record<string, unknown>
        const response = sanitizeText(source.response, 520)

        return {
            dimension,
            response: response || fallbackMessage
        } satisfies AuditRow
    })
}

function normalizePublicEvidenceStatus(value: unknown): 'sufficient' | 'partial' | 'insufficient' {
    if (value === 'sufficient' || value === 'partial' || value === 'insufficient') return value
    return 'partial'
}

async function analyzeWithWebSearch(client: OpenAI, profileUrl: string, directSnapshot: string, currentAudit: unknown) {
    const slug = extractLinkedInSlug(profileUrl)

    const response = await client.responses.create({
        model: 'gpt-4.1-mini',
        tools: [
            {
                type: 'web_search_preview',
                search_context_size: 'medium',
                user_location: {
                    type: 'approximate',
                    city: 'Bogota',
                    region: 'Bogota',
                    country: 'CO',
                    timezone: 'America/Bogota'
                }
            }
        ],
        include: ['web_search_call.action.sources'],
        instructions: `
Eres un asistente de marca ejecutiva para 4Shine.

Tu tarea es analizar de forma honesta y estratégica un perfil de LinkedIn a partir de evidencia pública.

REGLAS:
- Responde siempre en español.
- Usa solo evidencia pública que apunte claramente a la URL objetivo o al mismo perfil.
- Prioriza coincidencias exactas con la URL ${profileUrl}.
- Si la evidencia es parcial, dilo con claridad y evita inventar.
- No hagas juicios grandilocuentes; mantén tono ejecutivo, concreto y útil.
- Cada respuesta debe ser breve, específica y accionable.
- Devuelve únicamente JSON válido.
`,
        input: `
Analiza esta URL de LinkedIn: ${profileUrl}
Slug del perfil: ${slug || 'no identificado'}

Si puedes leer contenido público directo, úsalo como insumo adicional:
${directSnapshot || 'No hubo lectura directa útil desde la URL.'}

Usa este contexto actual solo como referencia del formato que espera el workbook, no como evidencia:
${JSON.stringify(currentAudit ?? {}, null, 2).slice(0, 6000)}
`,
        max_output_tokens: 1800,
        text: {
            format: {
                type: 'json_schema',
                name: 'linkedin_audit',
                strict: true,
                schema: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        audit: {
                            type: 'array',
                            minItems: 6,
                            maxItems: 6,
                            items: {
                                type: 'object',
                                additionalProperties: false,
                                properties: {
                                    dimension: {
                                        type: 'string',
                                        enum: [...LINKEDIN_AUDIT_DIMENSIONS]
                                    },
                                    response: {
                                        type: 'string'
                                    }
                                },
                                required: ['dimension', 'response']
                            }
                        },
                        publicEvidenceStatus: {
                            type: 'string',
                            enum: ['sufficient', 'partial', 'insufficient']
                        },
                        note: {
                            type: 'string'
                        }
                    },
                    required: ['audit', 'publicEvidenceStatus', 'note']
                }
            }
        }
    })

    const parsed = JSON.parse(response.output_text || '{}') as Record<string, unknown>
    const publicEvidenceStatus = normalizePublicEvidenceStatus(parsed.publicEvidenceStatus)
    const fallbackMessage =
        publicEvidenceStatus === 'insufficient'
            ? 'No hay evidencia pública suficiente para evaluar este punto con precisión desde la URL analizada.'
            : 'Se encontró evidencia pública parcial; conviene validar este punto directamente en el perfil.'

    return {
        audit: normalizeAuditRows(parsed.audit, fallbackMessage),
        publicEvidenceStatus,
        note: sanitizeText(parsed.note, 400)
    }
}

async function analyzeWithDirectSnapshot(client: OpenAI, profileUrl: string, directSnapshot: string, currentAudit: unknown) {
    const prompt = `
Eres un asistente de marca ejecutiva para 4Shine.

Tu tarea es analizar un perfil de LinkedIn usando únicamente el contenido público que se pudo leer directamente desde esta URL.

REGLAS:
- Responde en español.
- No inventes información no visible en la captura pública.
- Si la evidencia es parcial, dilo con claridad.
- Devuelve solo JSON válido.

URL objetivo: ${profileUrl}

LECTURA PÚBLICA DISPONIBLE:
${directSnapshot}

CONTEXTO ACTUAL DEL WORKBOOK:
${JSON.stringify(currentAudit ?? {}, null, 2).slice(0, 6000)}

Devuelve este JSON exacto:
{
  "audit": [
    { "dimension": "Qué impresión general deja hoy", "response": "" },
    { "dimension": "Qué valor comunica con claridad", "response": "" },
    { "dimension": "Qué parte del perfil está genérica o débil", "response": "" },
    { "dimension": "Qué señal de autoridad aparece", "response": "" },
    { "dimension": "Qué oportunidad podría abrir hoy", "response": "" },
    { "dimension": "Qué oportunidad probablemente está perdiendo", "response": "" }
  ],
  "publicEvidenceStatus": "partial",
  "note": ""
}
`

    const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }]
    })

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}') as Record<string, unknown>
    const publicEvidenceStatus = normalizePublicEvidenceStatus(parsed.publicEvidenceStatus)
    const fallbackMessage =
        publicEvidenceStatus === 'insufficient'
            ? 'No hay evidencia pública suficiente para evaluar este punto con precisión desde la URL analizada.'
            : 'La lectura directa del perfil fue parcial; conviene revisar el perfil completo para afinar este punto.'

    return {
        audit: normalizeAuditRows(parsed.audit, fallbackMessage),
        publicEvidenceStatus,
        note: sanitizeText(parsed.note, 400)
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = (await request.json()) as LinkedInAuditPayload
        const profileUrl = normalizeLinkedInProfileUrl(body.profileUrl)
        const currentAudit = Array.isArray(body.currentAudit) ? body.currentAudit : []

        const client = await createOpenAIClient()
        const directRead = await readPublicProfileSnapshot(profileUrl)

        let analysis: {
            audit: AuditRow[]
            publicEvidenceStatus: 'sufficient' | 'partial' | 'insufficient'
            note: string
        }

        try {
            analysis = await analyzeWithWebSearch(client, profileUrl, directRead.snapshot, currentAudit)
        } catch (webSearchError) {
            if (!directRead.meaningful) {
                throw webSearchError
            }

            analysis = await analyzeWithDirectSnapshot(client, profileUrl, directRead.snapshot, currentAudit)
        }

        return NextResponse.json({
            audit: analysis.audit,
            publicEvidenceStatus: analysis.publicEvidenceStatus,
            note:
                analysis.note ||
                (analysis.publicEvidenceStatus === 'partial'
                    ? 'El análisis se generó con evidencia pública parcial de la URL y señales visibles en la web.'
                    : '')
        })
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'No fue posible analizar esta URL de LinkedIn en este momento.'
            },
            { status: 500 }
        )
    }
}
