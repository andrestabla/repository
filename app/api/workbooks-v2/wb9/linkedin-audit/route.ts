import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
    createOpenAIClient,
    normalizeLinkedInProfileUrl,
    normalizePublicEvidenceStatus,
    readBraveSearchSnapshot,
    readPublicProfileSnapshot,
    sanitizeText
} from '@/app/api/workbooks-v2/wb9/linkedin-shared'

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

async function analyzeWithPublicEvidence(client: OpenAI, profileUrl: string, evidenceSnapshot: string) {
    const prompt = `
Eres un asistente de marca ejecutiva para 4Shine.

Tu tarea es analizar un perfil de LinkedIn usando únicamente la evidencia pública disponible desde la URL o desde extractos indexados públicamente en la web.

REGLAS:
- Responde en español.
- No inventes información no visible en la evidencia pública.
- Si la evidencia es parcial, dilo con claridad.
- Debes completar los 6 campos desde cero con la mejor lectura posible a partir de la evidencia disponible.
- Si existe un título público del perfil o un extracto indexado, no respondas con mensajes vacíos de falta de acceso.
- Identifica también qué parte del perfil parece más genérica o menos desarrollada a partir de lo que sí se ve.
- Devuelve solo JSON válido.

URL objetivo: ${profileUrl}

EVIDENCIA PÚBLICA DISPONIBLE:
${evidenceSnapshot}

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
        const client = await createOpenAIClient()
        const directRead = await readPublicProfileSnapshot(profileUrl)
        const braveRead = await readBraveSearchSnapshot(profileUrl)

        let analysis: {
            audit: AuditRow[]
            publicEvidenceStatus: 'sufficient' | 'partial' | 'insufficient'
            note: string
        }

        const combinedEvidence = [braveRead.snapshot, directRead.snapshot].filter(Boolean).join('\n\n').slice(0, 12000)

        if (braveRead.found) {
            analysis = await analyzeWithPublicEvidence(client, profileUrl, combinedEvidence)
        } else if (directRead.meaningful) {
            analysis = await analyzeWithPublicEvidence(client, profileUrl, directRead.snapshot)
        } else {
            analysis = {
                audit: normalizeAuditRows(
                    [],
                    'No se encontró evidencia pública suficiente del perfil para completar este punto con precisión.'
                ),
                publicEvidenceStatus: 'insufficient',
                note: 'No fue posible acceder a una señal pública verificable del perfil ni a un extracto indexado suficiente.'
            }
        }

        return NextResponse.json({
            audit: analysis.audit,
            publicEvidenceStatus: analysis.publicEvidenceStatus,
            note:
                analysis.note ||
                (analysis.publicEvidenceStatus === 'partial'
                    ? 'El análisis se generó con evidencia pública parcial de la URL y extractos indexados en la web.'
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
