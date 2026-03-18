'use client'

import { LoaderCircle, Mic, Sparkles, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type PageAssistMode = '' | 'audio' | 'direct'
export type PageAssistStatusKind = 'idle' | 'recording' | 'loading' | 'error' | 'success'

export type PageAssistStatus = {
    kind: PageAssistStatusKind
    message: string
}

export type PageAssistStepSummary = {
    title: string
    detail: string
}

type UseWorkbookPageAssistArgs<T> = {
    workbookId: string
    storageKey: string
    activePage: number
    pageTitle: string
    currentData: T | null
    enabled: boolean
    disabled: boolean
    onApplyData: (data: unknown) => void
}

type UseWorkbookPageAssistResult = {
    mode: PageAssistMode
    status: PageAssistStatus
    stepSummaries: PageAssistStepSummary[]
    canUseAssistant: boolean
    onModeChange: (mode: PageAssistMode) => void
    onAssist: () => Promise<void>
    onToggleRecording: () => Promise<void>
}

type AdaptiveWorkbookAssistPanelProps = {
    pageTitle: string
    stepSummaries: PageAssistStepSummary[]
    mode: PageAssistMode
    status: PageAssistStatus
    disabled: boolean
    canUseAssistant: boolean
    onModeChange: (mode: PageAssistMode) => void
    onAssist: () => void
    onToggleRecording: () => void
}

const IDLE_STATUS: PageAssistStatus = { kind: 'idle', message: '' }

function normalizeStepText(value: string, max = 240) {
    return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

function buildFallbackStepDetail(title: string) {
    const lowered = title.toLowerCase()

    if (lowered.includes('test') || lowered.includes('coherencia') || lowered.includes('calidad')) {
        return 'Usa este paso para comprobar consistencia, detectar brechas y decidir qué ajustar antes de cerrar la página.'
    }

    if (lowered.includes('matriz') || lowered.includes('mapa') || lowered.includes('canvas')) {
        return 'Baja tus ideas a una estructura concreta y completa este paso con criterios, decisiones y ejemplos verificables.'
    }

    if (lowered.includes('fórmula') || lowered.includes('declaración') || lowered.includes('frase')) {
        return 'Sintetiza aquí lo esencial de la página con una formulación clara, específica y conectada con tu experiencia real.'
    }

    return 'Completa este paso con hechos, lenguaje claro y señales observables para que la información quede accionable y fácil de revisar.'
}

export function extractAssistStepSummariesForVisiblePage(activePage: number) {
    if (typeof document === 'undefined') return [] as PageAssistStepSummary[]

    const article = document.querySelector(`[data-print-page^="Página ${activePage} de"]`)
    if (!(article instanceof HTMLElement)) return [] as PageAssistStepSummary[]

    const seen = new Set<string>()
    const summaries: PageAssistStepSummary[] = []
    const headings = Array.from(article.querySelectorAll('h3'))

    headings.forEach((heading) => {
        const title = normalizeStepText(heading.textContent || '', 140)
        if (!title || !/^(Paso|Bloque)\b/i.test(title) || seen.has(title)) return

        const section = heading.closest('section')
        const paragraphs = section ? Array.from(section.querySelectorAll('p')) : []
        let detail = ''

        for (const paragraph of paragraphs) {
            const text = normalizeStepText(paragraph.textContent || '')
            if (!text || text === title || /^Página \d+/i.test(text)) continue
            if (/^(Completado|Pendiente)$/i.test(text)) continue
            detail = text
            break
        }

        seen.add(title)
        summaries.push({
            title,
            detail: detail || buildFallbackStepDetail(title)
        })
    })

    return summaries
}

export function hasMeaningfulStructuredData(value: unknown) {
    const serialized = JSON.stringify(value ?? {})
    return serialized.replace(/[{}\[\]",:\s]/g, '').length > 0
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}

function sanitizeStructuredValue(value: unknown): unknown {
    if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim()
    if (Array.isArray(value)) return value.map((item) => sanitizeStructuredValue(item))
    if (isPlainObject(value)) {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sanitizeStructuredValue(entry)]))
    }
    return value
}

export function mergeStructuredData<T>(currentValue: T, incomingValue: unknown): T {
    if (Array.isArray(currentValue) && Array.isArray(incomingValue)) {
        return incomingValue.map((entry, index) => {
            const currentEntry = currentValue[index]
            return typeof currentEntry === 'undefined' ? sanitizeStructuredValue(entry) : mergeStructuredData(currentEntry, entry)
        }) as T
    }

    if (isPlainObject(currentValue) && isPlainObject(incomingValue)) {
        const nextValue: Record<string, unknown> = { ...currentValue }

        Object.entries(incomingValue).forEach(([key, entry]) => {
            nextValue[key] =
                key in currentValue
                    ? mergeStructuredData((currentValue as Record<string, unknown>)[key], entry)
                    : sanitizeStructuredValue(entry)
        })

        return nextValue as T
    }

    return sanitizeStructuredValue(incomingValue) as T
}

export function useWorkbookPageAssist<T>({
    workbookId,
    storageKey,
    activePage,
    pageTitle,
    currentData,
    enabled,
    disabled,
    onApplyData
}: UseWorkbookPageAssistArgs<T>): UseWorkbookPageAssistResult {
    const [modes, setModes] = useState<Record<string, PageAssistMode>>(() => {
        if (typeof window === 'undefined') return {}

        try {
            const raw = window.localStorage.getItem(storageKey)
            if (!raw) return {}

            const parsed = JSON.parse(raw)
            return parsed && typeof parsed === 'object' ? (parsed as Record<string, PageAssistMode>) : {}
        } catch {
            return {}
        }
    })
    const [statuses, setStatuses] = useState<Record<string, PageAssistStatus>>({})
    const [stepSummaries, setStepSummaries] = useState<PageAssistStepSummary[]>([])
    const recorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const pageKey = String(activePage)

    const mode: PageAssistMode = modes[pageKey] || ''
    const status = statuses[pageKey] || IDLE_STATUS
    const canUseAssistant = !!currentData && hasMeaningfulStructuredData(currentData)

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(storageKey, JSON.stringify(modes))
    }, [modes, storageKey])

    useEffect(() => {
        if (typeof window === 'undefined') return

        const frame = window.requestAnimationFrame(() => {
            setStepSummaries(enabled ? extractAssistStepSummariesForVisiblePage(activePage) : [])
        })

        return () => window.cancelAnimationFrame(frame)
    }, [activePage, enabled, pageTitle])

    useEffect(() => {
        return () => {
            recorderRef.current?.stop()
            streamRef.current?.getTracks().forEach((track) => track.stop())
        }
    }, [])

    const setStatus = (nextStatus: PageAssistStatus) => {
        setStatuses((prev) => ({
            ...prev,
            [pageKey]: nextStatus
        }))
    }

    const onModeChange = (nextMode: PageAssistMode) => {
        if (disabled) return

        setModes((prev) => ({
            ...prev,
            [pageKey]: nextMode
        }))

        setStatus(IDLE_STATUS)
    }

    const requestAssist = async (body: BodyInit, contentType?: string) => {
        const response = await fetch('/api/workbooks-v2/page-assist', {
            method: 'POST',
            headers: contentType ? { 'Content-Type': contentType } : undefined,
            body
        })

        const payload = await response.json()

        if (!response.ok) {
            throw new Error(typeof payload?.error === 'string' ? payload.error : 'No fue posible completar esta ayuda en este momento.')
        }

        return payload as { data: unknown }
    }

    const runAssist = async () => {
        if (!enabled || disabled || !currentData) return

        if (!canUseAssistant) {
            setStatus({
                kind: 'error',
                message: 'Completa primero algo en esta página antes de pedir apoyo de Asistente IA.'
            })
            return
        }

        setStatus({
            kind: 'loading',
            message: 'Procesando tu información con Asistente IA...'
        })

        try {
            const payload = await requestAssist(
                JSON.stringify({
                    workbookId,
                    pageId: activePage,
                    pageTitle,
                    stepSummaries,
                    currentData
                }),
                'application/json'
            )

            onApplyData(payload.data)
            setStatus({
                kind: 'success',
                message: 'Asistente IA ordenó y mejoró la información de esta página.'
            })
        } catch (error) {
            setStatus({
                kind: 'error',
                message: error instanceof Error ? error.message : 'No fue posible completar esta ayuda en este momento.'
            })
        }
    }

    const processRecordedAudio = async (blob: Blob) => {
        if (!currentData) return

        setStatus({
            kind: 'loading',
            message: 'Transcribiendo y ubicando tu audio en los pasos correctos...'
        })

        try {
            const formData = new FormData()
            const extension = blob.type.includes('mp4') ? 'm4a' : 'webm'

            formData.append('workbookId', workbookId)
            formData.append('pageId', String(activePage))
            formData.append('pageTitle', pageTitle)
            formData.append('stepSummaries', JSON.stringify(stepSummaries))
            formData.append('currentData', JSON.stringify(currentData))
            formData.append('audio', new File([blob], `${workbookId}-page-${activePage}.${extension}`, { type: blob.type || 'audio/webm' }))

            const payload = await requestAssist(formData)
            onApplyData(payload.data)
            setStatus({
                kind: 'success',
                message: 'Tu audio quedó organizado dentro de esta página.'
            })
        } catch (error) {
            setStatus({
                kind: 'error',
                message: error instanceof Error ? error.message : 'No fue posible procesar el audio en este momento.'
            })
        }
    }

    const onToggleRecording = async () => {
        if (!enabled || disabled) return

        if (recorderRef.current && status.kind === 'recording') {
            recorderRef.current.stop()
            return
        }

        if (
            typeof window === 'undefined' ||
            typeof navigator === 'undefined' ||
            typeof MediaRecorder === 'undefined' ||
            !navigator.mediaDevices?.getUserMedia
        ) {
            setStatus({
                kind: 'error',
                message: 'Tu navegador no soporta grabación de audio en este momento.'
            })
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const preferredMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : ''
            const recorder = preferredMimeType ? new MediaRecorder(stream, { mimeType: preferredMimeType }) : new MediaRecorder(stream)

            streamRef.current = stream
            recorderRef.current = recorder
            chunksRef.current = []

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data)
                }
            }

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
                recorderRef.current = null
                chunksRef.current = []
                streamRef.current?.getTracks().forEach((track) => track.stop())
                streamRef.current = null
                await processRecordedAudio(audioBlob)
            }

            recorder.start()
            setStatus({
                kind: 'recording',
                message: 'Grabando... vuelve a tocar el botón cuando quieras procesar el audio.'
            })
        } catch (error) {
            setStatus({
                kind: 'error',
                message: error instanceof Error ? error.message : 'No pude acceder al micrófono. Revisa permisos e intenta de nuevo.'
            })
            streamRef.current?.getTracks().forEach((track) => track.stop())
            streamRef.current = null
            recorderRef.current = null
            chunksRef.current = []
        }
    }

    return {
        mode,
        status,
        stepSummaries,
        canUseAssistant,
        onModeChange,
        onAssist: runAssist,
        onToggleRecording
    }
}

export function AdaptiveWorkbookAssistPanel({
    pageTitle,
    stepSummaries,
    mode,
    status,
    disabled,
    canUseAssistant,
    onModeChange,
    onAssist,
    onToggleRecording
}: AdaptiveWorkbookAssistPanelProps) {
    const isRecording = status.kind === 'recording'
    const isLoading = status.kind === 'loading'
    const messageTone =
        status.kind === 'error'
            ? 'text-red-700'
            : status.kind === 'success'
              ? 'text-emerald-700'
              : status.kind === 'recording'
                ? 'text-amber-700'
                : 'text-slate-600'

    return (
        <aside className="rounded-3xl border border-blue-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_100%)] p-5 shadow-[0_14px_36px_rgba(59,130,246,0.08)] md:p-6">
            <div className="space-y-5">
                <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">Asistente de página</p>
                    <h3 className="text-lg font-extrabold text-slate-900 md:text-xl">Trabaja {pageTitle} con una sola ruta a la vez</h3>
                    <p className="text-sm leading-relaxed text-slate-700">
                        Primero revisa las instrucciones generales de esta página. Luego elige cómo quieres completarla para que la experiencia se adapte y
                        reduzca la carga cognitiva.
                    </p>
                </div>

                {stepSummaries.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Instrucciones generales por paso</p>
                        <div className="mt-4 grid gap-3">
                            {stepSummaries.map((summary) => (
                                <article key={summary.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm font-bold text-slate-900">{summary.title}</p>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{summary.detail}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => onModeChange('audio')}
                        disabled={disabled || isLoading || isRecording}
                        className={`rounded-2xl border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            mode === 'audio'
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                        }`}
                    >
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                            <Mic size={16} className={mode === 'audio' ? 'text-blue-700' : 'text-slate-600'} />
                            Grabar audio
                        </span>
                        <p className="mt-2 text-sm text-slate-600">
                            Recorre esta página hablando paso a paso y deja que el sistema ubique cada idea donde corresponde.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => onModeChange('direct')}
                        disabled={disabled || isLoading || isRecording}
                        className={`rounded-2xl border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            mode === 'direct'
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                        }`}
                    >
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                            <Sparkles size={16} className={mode === 'direct' ? 'text-blue-700' : 'text-slate-600'} />
                            Llenar los campos directamente
                        </span>
                        <p className="mt-2 text-sm text-slate-600">
                            Completa los campos en pantalla y usa Asistente IA para ordenar o mejorar lo que ya cargaste.
                        </p>
                    </button>
                </div>

                {mode === '' ? (
                    <div className="rounded-2xl border border-dashed border-blue-200 bg-white px-4 py-4">
                        <p className="text-sm leading-relaxed text-slate-600">
                            Selecciona una ruta para ver solo las indicaciones necesarias y trabajar esta página con más foco.
                        </p>
                    </div>
                ) : mode === 'audio' ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 space-y-4">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Si eliges grabar audio</p>
                            <ul className="space-y-2">
                                {[
                                    'Habla siguiendo el orden de los pasos o bloques que aparecen arriba.',
                                    'Menciona hechos, decisiones, ejemplos y evidencias concretas para que el sistema pueda ubicar mejor la información.',
                                    'Si cambias de paso, dilo explícitamente para que la transcripción se distribuya con más claridad.'
                                ].map((instruction) => (
                                    <li key={instruction} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                                        <span>{instruction}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            type="button"
                            onClick={onToggleRecording}
                            disabled={disabled || isLoading}
                            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                isRecording
                                    ? 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            {isRecording ? <Square size={16} /> : <Mic size={16} />}
                            {isRecording ? 'Detener y procesar audio' : 'Grabar audio'}
                        </button>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 space-y-4">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Si eliges llenar los campos directamente</p>
                            <ul className="space-y-2">
                                {[
                                    'Completa primero los campos que ya tengas claros para esta página.',
                                    'Cuando haya suficiente material, usa Asistente IA para ordenar, sintetizar o mejorar lo ya escrito.',
                                    'Revisa el resultado final y ajusta cualquier matiz personal antes de guardar.'
                                ].map((instruction) => (
                                    <li key={instruction} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                                        <span>{instruction}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-sm text-slate-600">
                                Esta ruta solo activa la ayuda cuando ya existe contenido en la página, para que Asistente IA trabaje sobre material real y no
                                invente información.
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onAssist}
                                disabled={disabled || isLoading || isRecording || !canUseAssistant}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {isLoading ? 'Procesando con Asistente IA...' : 'Asistente IA'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs leading-relaxed text-slate-600">
                        El objetivo es ayudarte a registrar información de calidad con menos fricción y mejor estructura.
                    </p>
                    {status.message && (
                        <p className={`mt-1.5 text-xs font-semibold leading-relaxed ${messageTone}`} aria-live="polite">
                            {status.message}
                        </p>
                    )}
                </div>
            </div>
        </aside>
    )
}
