'use client'

import { LoaderCircle, Mic, Sparkles, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type StepAssistMode = '' | 'audio' | 'direct'
export type StepAssistStatusKind = 'idle' | 'recording' | 'loading' | 'error' | 'success'

export type StepAssistStatus = {
    kind: StepAssistStatusKind
    message: string
}

type StepTarget = {
    stepId: string
    stepTitle: string
    host: HTMLElement
}

type AdaptiveWorkbookStepAssistPanelProps = {
    workbookId: string
    storageKey: string
    pageId: number
    pageTitle: string
    stepId: string
    stepTitle: string
    currentData: unknown
    disabled: boolean
    onApplyData: (data: unknown) => void
}

type AdaptiveWorkbookStepAssistPortalsProps = {
    workbookId: string
    storageKey: string
    activePage: number
    pageTitle: string
    currentData: unknown
    enabled: boolean
    disabled: boolean
    onApplyData: (data: unknown) => void
}

const IDLE_STATUS: StepAssistStatus = { kind: 'idle', message: '' }

function normalizeText(value: string, max = 240) {
    return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

function sanitizeStructuredValue(value: unknown): unknown {
    if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim()
    if (Array.isArray(value)) return value.map((item) => sanitizeStructuredValue(item))
    if (isPlainObject(value)) {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sanitizeStructuredValue(entry)]))
    }
    return value
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}

function slugifyStepTitle(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 72)
}

function buildStorageModeKey(storageKey: string, pageId: number, stepId: string) {
    return `${storageKey}-${pageId}-${stepId}`
}

function readStoredMode(storageKey: string, pageId: number, stepId: string): StepAssistMode {
    if (typeof window === 'undefined') return ''

    try {
        const stored = window.localStorage.getItem(buildStorageModeKey(storageKey, pageId, stepId))
        return stored === 'audio' || stored === 'direct' ? stored : ''
    } catch {
        return ''
    }
}

function ensureStepAssistHosts(activePage: number) {
    if (typeof document === 'undefined') return [] as StepTarget[]

    const article = document.querySelector(`[data-print-page^="Página ${activePage} de"]`)
    if (!(article instanceof HTMLElement)) return [] as StepTarget[]

    return Array.from(article.querySelectorAll('section'))
        .map((section) => {
            if (!(section instanceof HTMLElement)) return null
            if (section.dataset.stepAssistDisabled === 'true') return null

            const heading = Array.from(section.querySelectorAll('h3')).find((candidate) => /^(Paso|Bloque)\b/i.test(normalizeText(candidate.textContent || '', 140)))
            if (!(heading instanceof HTMLElement)) return null

            const stepTitle = normalizeText(heading.textContent || '', 140)
            const stepId = slugifyStepTitle(stepTitle)
            const directChildren = Array.from(section.children)
            const headerIndex = directChildren.findIndex((child) => child === heading || child.contains(heading))
            if (headerIndex === -1) return null

            let anchorIndex = headerIndex
            for (let index = headerIndex + 1; index < directChildren.length; index += 1) {
                const tagName = directChildren[index].tagName
                if (tagName === 'P' || tagName === 'UL' || tagName === 'OL') {
                    anchorIndex = index
                    continue
                }
                break
            }

            const anchor = directChildren[anchorIndex]
            if (!(anchor instanceof HTMLElement)) return null

            const hostId = `wb-step-assist-${activePage}-${stepId}`
            let host = section.querySelector(`[data-step-assist-host="${hostId}"]`) as HTMLElement | null
            if (!(host instanceof HTMLElement)) {
                host = document.createElement('div')
                host.dataset.stepAssistHost = hostId
                host.className = 'mt-4'
                anchor.insertAdjacentElement('afterend', host)
            }

            return {
                stepId,
                stepTitle,
                host
            } satisfies StepTarget
        })
        .filter((target): target is StepTarget => !!target)
}

export function hasMeaningfulStructuredData(value: unknown) {
    const serialized = JSON.stringify(value ?? {})
    return serialized.replace(/[{}\[\]",:\s]/g, '').length > 0
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

function AdaptiveWorkbookStepAssistPanel({
    workbookId,
    storageKey,
    pageId,
    pageTitle,
    stepId,
    stepTitle,
    currentData,
    disabled,
    onApplyData
}: AdaptiveWorkbookStepAssistPanelProps) {
    const [mode, setMode] = useState<StepAssistMode>(() => readStoredMode(storageKey, pageId, stepId))
    const [status, setStatus] = useState<StepAssistStatus>(IDLE_STATUS)
    const recorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const isRecording = status.kind === 'recording'
    const isLoading = status.kind === 'loading'
    const canUseAssistant = hasMeaningfulStructuredData(currentData)
    const messageTone =
        status.kind === 'error'
            ? 'text-red-700'
            : status.kind === 'success'
              ? 'text-emerald-700'
              : status.kind === 'recording'
                ? 'text-amber-700'
                : 'text-slate-600'

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(buildStorageModeKey(storageKey, pageId, stepId), mode)
    }, [mode, pageId, stepId, storageKey])

    useEffect(() => {
        return () => {
            recorderRef.current?.stop()
            streamRef.current?.getTracks().forEach((track) => track.stop())
        }
    }, [])

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
        if (disabled) return

        if (!canUseAssistant) {
            setStatus({
                kind: 'error',
                message: 'Completa primero algo en este paso antes de pedir apoyo de Asistente IA.'
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
                    pageId,
                    pageTitle,
                    stepId,
                    stepTitle,
                    currentData
                }),
                'application/json'
            )

            onApplyData(payload.data)
            setStatus({
                kind: 'success',
                message: 'Asistente IA ordenó y mejoró la información de este paso.'
            })
        } catch (error) {
            setStatus({
                kind: 'error',
                message: error instanceof Error ? error.message : 'No fue posible completar esta ayuda en este momento.'
            })
        }
    }

    const processRecordedAudio = async (blob: Blob) => {
        setStatus({
            kind: 'loading',
            message: 'Transcribiendo y ubicando tu audio en este paso...'
        })

        try {
            const formData = new FormData()
            const extension = blob.type.includes('mp4') ? 'm4a' : 'webm'

            formData.append('workbookId', workbookId)
            formData.append('pageId', String(pageId))
            formData.append('pageTitle', pageTitle)
            formData.append('stepId', stepId)
            formData.append('stepTitle', stepTitle)
            formData.append('currentData', JSON.stringify(currentData))
            formData.append('audio', new File([blob], `${workbookId}-${pageId}-${stepId}.${extension}`, { type: blob.type || 'audio/webm' }))

            const payload = await requestAssist(formData)
            onApplyData(payload.data)
            setStatus({
                kind: 'success',
                message: 'Tu audio quedó organizado dentro de este paso.'
            })
        } catch (error) {
            setStatus({
                kind: 'error',
                message: error instanceof Error ? error.message : 'No fue posible procesar el audio en este momento.'
            })
        }
    }

    const onToggleRecording = async () => {
        if (disabled) return

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

    return (
        <aside className="rounded-2xl border border-blue-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_100%)] p-4 md:p-5 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
                <button
                    type="button"
                    onClick={() => setMode('audio')}
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
                        Recorre este paso con tu voz y deja que el sistema ubique la información automáticamente en el lugar correcto.
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => setMode('direct')}
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
                        Completa los campos de este paso y usa Asistente IA solo si necesitas ordenar o mejorar lo que ya cargaste.
                    </p>
                </button>
            </div>

            {mode === '' ? (
                <div className="rounded-xl border border-dashed border-blue-200 bg-white px-4 py-4">
                    <p className="text-sm leading-relaxed text-slate-600">
                        Selecciona una ruta para ver solo las indicaciones necesarias y mantener este paso enfocado.
                    </p>
                </div>
            ) : mode === 'audio' ? (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 space-y-4">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Si eliges grabar audio</p>
                        <ul className="space-y-2">
                            {[
                                `Habla siguiendo solo el alcance de ${stepTitle.toLowerCase()}.`,
                                'Describe hechos, decisiones, ejemplos y evidencia concreta para que el sistema distribuya mejor la información.',
                                'Si necesitas más claridad, nombra explícitamente el campo o el subtema que estás respondiendo.'
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
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 space-y-4">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Si eliges llenar los campos directamente</p>
                        <ul className="space-y-2">
                            {[
                                'Completa este paso con lenguaje claro, evidencia real y el nivel de detalle que ya piden sus campos.',
                                'Si un campo sigue borroso, deja primero una versión breve y luego pide apoyo para ordenarla mejor.',
                                'Asistente IA no reemplaza tu criterio: solo ayuda a estructurar y limpiar lo que ya registraste.'
                            ].map((instruction) => (
                                <li key={instruction} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                                    <span>{instruction}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-sm text-slate-600">
                            Continúa con los campos de este paso. Si ya cargaste suficiente información, puedes pedir apoyo de Asistente IA para ordenarla mejor.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={runAssist}
                            disabled={disabled || isLoading || isRecording || !canUseAssistant}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isLoading ? 'Procesando con Asistente IA...' : 'Asistente IA'}
                        </button>
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-1.5">
                <p className="text-xs leading-relaxed text-slate-600">El objetivo es ayudarte a completar este paso con más claridad y menor carga cognitiva.</p>
                {status.message && (
                    <p className={`text-xs font-semibold leading-relaxed ${messageTone}`} aria-live="polite">
                        {status.message}
                    </p>
                )}
            </div>
        </aside>
    )
}

export function AdaptiveWorkbookStepAssistPortals({
    workbookId,
    storageKey,
    activePage,
    pageTitle,
    currentData,
    enabled,
    disabled,
    onApplyData
}: AdaptiveWorkbookStepAssistPortalsProps) {
    const [targets, setTargets] = useState<StepTarget[]>([])

    useEffect(() => {
        if (typeof window === 'undefined') return

        const frame = window.requestAnimationFrame(() => {
            setTargets(enabled ? ensureStepAssistHosts(activePage) : [])
        })

        return () => window.cancelAnimationFrame(frame)
    }, [activePage, enabled, pageTitle])

    if (!enabled || targets.length === 0) return null

    return (
        <>
            {targets.map((target) =>
                createPortal(
                    <AdaptiveWorkbookStepAssistPanel
                        workbookId={workbookId}
                        storageKey={storageKey}
                        pageId={activePage}
                        pageTitle={pageTitle}
                        stepId={target.stepId}
                        stepTitle={target.stepTitle}
                        currentData={currentData}
                        disabled={disabled}
                        onApplyData={onApplyData}
                    />,
                    target.host,
                    `${activePage}-${target.stepId}`
                )
            )}
        </>
    )
}
