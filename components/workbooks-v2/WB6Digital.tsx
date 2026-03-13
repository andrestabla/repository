'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3 | 4 | 5
type YesNoAnswer = '' | 'yes' | 'no'
type PresenceImpact = '' | 'Suma' | 'Resta'
type LeakageLevel = '' | 'Verde' | 'Amarillo' | 'Rojo'
type ObjectionType =
    | ''
    | 'Contenido'
    | 'Proceso'
    | 'Confianza'
    | 'Identidad o estatus'
    | 'Confianza / estatus'
    | 'Otro'

type WorkbookPage = {
    id: WorkbookPageId
    label: string
    shortLabel: string
}

type WB6State = {
    identification: {
        leaderName: string
        role: string
        cohort: string
        startDate: string
    }
    bodyLanguageSection: {
        baselineScan: Array<{
            dimension: string
            observation: string
            effect: string
        }>
        presenceMatrix: Array<{
            dimension: string
            observableBehavior: string
            presenceImpact: PresenceImpact
            concreteAdjustment: string
        }>
        leakageTraffic: Array<{
            signal: string
            level: LeakageLevel
            whenAppears: string
            generatedReading: string
        }>
        entryProtocol: {
            idealEntry: string
            positioning: string
            spaceCriteria: string
            first20Seconds: string
            signalToInstall: string
        }
        calmAuthorityPattern: {
            centeredBody: string
            listeningBody: string
            objectionBody: string
            returnToCenter: string
        }
        coherenceTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    objectionHandlingSection: {
        cartography: Array<{
            objection: string
            objectionType: ObjectionType
            whatActivatedMe: string
            response: string
            responseEffect: string
            betterResponse: string
        }>
        diagnosis: {
            literal: string
            emotionalIntensity: string
            whatItProtects: string
            firstLayerToRespond: string
        }
        protocol: {
            receive: string
            clarificationQuestion: string
            recognition: string
            focalResponse: string
            advanceVerification: string
        }
        bridgeBank: Array<{
            scenario: string
            bridgeResponse: string
        }>
        reframeLab: Array<{
            originalObjection: string
            usefulReframe: string
            proposalImprovement: string
        }>
        executiveTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    voiceToneSection: {
        baseline: Array<{
            dimension: string
            observation: string
            effect: string
        }>
        calibrationMatrix: Array<{
            dimension: string
            observablePattern: string
            impact: PresenceImpact
            concreteAdjustment: string
        }>
        messagePartiture: {
            baseMessage: string
            anchorWords: string
            functionalPauses: string
            firmClosures: string
            energyPoints: string
            vocalRisks: string
        }
        pressureProtocol: {
            earlySignal: string
            triggerContext: string
            regulationAction: string
            reanchoringPhrase: string
        }
        modulationLadder: Array<{
            context: string
            tone: string
            speed: string
            volume: string
            pauses: string
            emphasis: string
        }>
        executiveImpactTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
}

const PAGES: WorkbookPage[] = [
    { id: 1, label: '1. Portada e identificación', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Lenguaje corporal ejecutivo', shortLabel: 'Lenguaje corporal' },
    { id: 4, label: '4. Manejo de objeciones', shortLabel: 'Objeciones' },
    { id: 5, label: '5. Tono y ritmo de voz', shortLabel: 'Voz ejecutiva' }
]

const STORAGE_KEY = 'workbooks-v2-wb6-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb6-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb6-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb6-presentation-seen'

const BASELINE_DIMENSIONS = [
    'Base / apoyo',
    'Columna / hombros',
    'Mirada',
    'Manos / gestos',
    'Rostro / mandíbula',
    'Movimiento / quietud'
] as const

const PRESENCE_DIMENSIONS = [
    'Apertura',
    'Estabilidad',
    'Dirección',
    'Economía gestual',
    'Disponibilidad relacional'
] as const

const COHERENCE_QUESTIONS = [
    '¿Mi cuerpo transmitió lo mismo que mis palabras?',
    '¿Mi postura proyectó estabilidad?',
    '¿Mi mirada sostuvo presencia?',
    '¿Mis manos acompañaron sin dispersar?',
    '¿Mi cuerpo se mantuvo disponible al escuchar?',
    '¿Mi presencia corporal aumentó confianza?'
] as const

const EXAMPLE_BASELINE_SCAN = [
    {
        dimension: 'Base / apoyo',
        observation: 'Cambio mucho el peso entre pies.',
        effect: 'Inquietud o falta de aplomo.'
    },
    {
        dimension: 'Columna / hombros',
        observation: 'Me inclino hacia adelante cuando explico.',
        effect: 'Exceso de urgencia o presión.'
    },
    {
        dimension: 'Mirada',
        observation: 'Bajo la mirada cuando me cuestionan.',
        effect: 'Menor seguridad percibida.'
    },
    {
        dimension: 'Manos / gestos',
        observation: 'Muevo demasiado las manos.',
        effect: 'Dispersión del foco.'
    },
    {
        dimension: 'Rostro / mandíbula',
        observation: 'Tenso la mandíbula bajo presión.',
        effect: 'Rigidez o defensividad.'
    },
    {
        dimension: 'Movimiento / quietud',
        observation: 'Camino sin necesidad mientras hablo.',
        effect: 'Pérdida de centro y foco.'
    }
]

const EXAMPLE_PRESENCE_MATRIX = [
    {
        dimension: 'Apertura',
        observableBehavior: 'Cruzo brazos al escuchar objeciones.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Mantener brazos descruzados y manos visibles.'
    },
    {
        dimension: 'Estabilidad',
        observableBehavior: 'Balanceo el cuerpo al hablar.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Anclar ambos pies y reducir desplazamiento.'
    },
    {
        dimension: 'Dirección',
        observableBehavior: 'Mi cuerpo apunta a la pantalla, no a la audiencia.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Reorientar torso hacia interlocutor principal.'
    },
    {
        dimension: 'Economía gestual',
        observableBehavior: 'Gesticulo demasiado en ideas simples.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Reservar gestos amplios para ideas clave.'
    },
    {
        dimension: 'Disponibilidad relacional',
        observableBehavior: 'Asiento poco y casi no miro al otro al escuchar.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Aumentar mirada funcional y microseñales de escucha.'
    }
] as const

const EXAMPLE_LEAKAGE_TRAFFIC = [
    {
        signal: 'Mantengo pies firmes y hombros abiertos.',
        level: 'Verde',
        whenAppears: 'Al iniciar reunión.',
        generatedReading: 'Solidez y presencia.'
    },
    {
        signal: 'Toco mi reloj repetidamente.',
        level: 'Amarillo',
        whenAppears: 'Cuando se alarga una objeción.',
        generatedReading: 'Ansiedad o apuro.'
    },
    {
        signal: 'Bajo la mirada y cierro mandíbula.',
        level: 'Rojo',
        whenAppears: 'Cuando me contradicen en público.',
        generatedReading: 'Defensividad y tensión.'
    }
] as const

const EXAMPLE_ENTRY_PROTOCOL = {
    idealEntry: 'Entrar con paso estable, respiración baja y sin prisa visible.',
    positioning: 'Sentarme con ambos pies apoyados, torso orientado a la mesa y pantalla alineada.',
    spaceCriteria: 'Presencia firme, sin encogerme ni invadir.',
    first20Seconds: 'Manos visibles, mirada a la audiencia y celular fuera del campo de acción.',
    signalToInstall: 'Calma con autoridad.'
}

const EXAMPLE_AUTHORITY_PATTERN = {
    centeredBody: 'Pies firmes, hombros abiertos, torso estable y mirada directa.',
    listeningBody: 'Leve inclinación receptiva, rostro disponible, manos quietas.',
    objectionBody: 'No adelantarme, no cerrar brazos, sostener mirada y respirar antes de responder.',
    returnToCenter: 'Exhalo, suelto mandíbula, reanclo pies y bajo velocidad de movimiento.'
}

const OBJECTION_TYPES: ObjectionType[] = [
    'Contenido',
    'Proceso',
    'Confianza',
    'Identidad o estatus',
    'Confianza / estatus',
    'Otro'
]

const BRIDGE_SCENARIOS = [
    'Objeción agresiva',
    'Objeción confusa',
    'Objeción legítima pero mal formulada',
    'Objeción política o de estatus',
    'Objeción basada en desconfianza'
] as const

const OBJECTION_TEST_QUESTIONS = [
    '¿Escuché antes de responder?',
    '¿Diagnostiqué bien el tipo de objeción?',
    '¿Respondí a la capa correcta?',
    '¿Transmití seguridad tranquila?',
    '¿Ordené mejor la objeción?',
    '¿Verifiqué si hubo avance real?'
] as const

const EXAMPLE_OBJECTION_CARTOGRAPHY = [
    {
        objection: '“Eso no es viable en este trimestre”.',
        objectionType: 'Contenido',
        whatActivatedMe: 'Urgencia por defender mi idea.',
        response: 'Expliqué demasiado rápido.',
        responseEffect: 'Saturé y perdí foco.',
        betterResponse: 'Aclarar criterio de viabilidad antes de argumentar.'
    },
    {
        objection: '“No veo por qué cambiar lo que ya funciona”.',
        objectionType: 'Proceso',
        whatActivatedMe: 'Frustración.',
        response: 'Reaccioné comparando con el pasado.',
        responseEffect: 'Más resistencia.',
        betterResponse: 'Reconocer primero la lógica del otro y luego mostrar el nuevo riesgo.'
    },
    {
        objection: '“No estoy seguro de que tú debas liderar esto”.',
        objectionType: 'Confianza / estatus',
        whatActivatedMe: 'Defensividad.',
        response: 'Justifiqué mi trayectoria.',
        responseEffect: 'Soné inseguro.',
        betterResponse: 'Preguntar qué condición de confianza faltaba y responder con evidencia puntual.'
    }
] as const

const EXAMPLE_OBJECTION_DIAGNOSIS = {
    literal: '“No creo que este sea el momento para mover prioridades”.',
    emotionalIntensity: 'Tensión y molestia contenida.',
    whatItProtects: 'Control del plan y credibilidad frente al equipo.',
    firstLayerToRespond: 'La preocupación de control, no solo el argumento de timing.'
}

const EXAMPLE_OBJECTION_PROTOCOL = {
    receive: 'Haré una pausa, mantendré mirada y no entraré a justificarme de inmediato.',
    clarificationQuestion: '“¿Cuál es para ti el principal riesgo de hacerlo ahora?”.',
    recognition: '“Entiendo que tu preocupación principal es no abrir más dispersión.”',
    focalResponse: '“Justamente por eso propongo reducir focos y no ampliarlos.”',
    advanceVerification: '“¿Con eso responde tu objeción principal o hay otra condición que debamos mirar?”.'
}

const EXAMPLE_BRIDGE_BANK = [
    { scenario: 'Objeción agresiva', bridgeResponse: '“Voy a tomar tu punto y responderlo con precisión.”' },
    { scenario: 'Objeción confusa', bridgeResponse: '“Ayúdame a precisar qué parte te preocupa más.”' },
    {
        scenario: 'Objeción legítima pero mal formulada',
        bridgeResponse: '“Hay una preocupación válida ahí; déjame ordenarla para responder mejor.”'
    },
    {
        scenario: 'Objeción política o de estatus',
        bridgeResponse: '“Entiendo que aquí también hay una preocupación por cómo se verá esta decisión.”'
    },
    {
        scenario: 'Objeción basada en desconfianza',
        bridgeResponse: '“Quiero responder eso con hechos, no solo con opinión.”'
    }
] as const

const EXAMPLE_REFRAME_LAB = [
    {
        originalObjection: '“Eso no está suficientemente claro”.',
        usefulReframe: 'Necesito explicitar mejor el criterio central.',
        proposalImprovement: 'Mejora claridad.'
    },
    {
        originalObjection: '“No sé si este es el momento”.',
        usefulReframe: 'Debo mostrar mejor el costo de no actuar ahora.',
        proposalImprovement: 'Mejora sentido de oportunidad.'
    },
    {
        originalObjection: '“No veo quién respondería por esto”.',
        usefulReframe: 'Debo hacer visible la trazabilidad y responsables.',
        proposalImprovement: 'Mejora confianza operativa.'
    }
] as const

const VOICE_BASELINE_DIMENSIONS = [
    'Tono predominante',
    'Velocidad',
    'Volumen',
    'Articulación',
    'Pausas',
    'Énfasis',
    'Cierre de frase'
] as const

const VOICE_CALIBRATION_DIMENSIONS = [
    'Estabilidad tonal',
    'Velocidad de procesamiento',
    'Uso del silencio',
    'Claridad articulatoria',
    'Jerarquía sonora',
    'Sostén de cierre'
] as const

const VOICE_CONTEXTS = [
    'Uno a uno',
    'Alto nivel',
    'Videollamada',
    'Conversación difícil',
    'Respuesta a objeción'
] as const

const VOICE_TONE_OPTIONS = [
    'Cercano y estable',
    'Grave y limpio',
    'Firme no reactivo',
    'Más proyectado',
    'Bajo y estable',
    'Neutro'
] as const

const VOICE_SPEED_OPTIONS = ['Lenta', 'Media-baja', 'Media', 'Media-alta', 'Alta'] as const
const VOICE_VOLUME_OPTIONS = ['Bajo', 'Medio-bajo', 'Medio', 'Medio-alto', 'Alto'] as const
const VOICE_PAUSE_OPTIONS = ['Bajas', 'Moderadas', 'Claras', 'Altas', 'Estratégicas'] as const
const VOICE_EMPHASIS_OPTIONS = ['Bajo', 'Medio', 'Medio-alto', 'Alto en ideas clave'] as const

const VOICE_TEST_QUESTIONS = [
    '¿Mi voz proyectó claridad y no apuro?',
    '¿El ritmo facilitó comprensión?',
    '¿Usé pausas funcionales?',
    '¿El tono sostuvo seguridad sin rigidez?',
    '¿Las ideas clave tuvieron énfasis suficiente?',
    '¿Mi voz aumentó credibilidad?'
] as const

const EXAMPLE_VOICE_BASELINE = [
    {
        dimension: 'Tono predominante',
        observation: 'Mi voz sube cuando me cuestionan.',
        effect: 'Tensión o inseguridad.'
    },
    {
        dimension: 'Velocidad',
        observation: 'Acelero cuando explico ideas complejas.',
        effect: 'Saturación y pérdida de claridad.'
    },
    {
        dimension: 'Volumen',
        observation: 'Bajo el volumen al final de frases importantes.',
        effect: 'Menor autoridad percibida.'
    },
    {
        dimension: 'Articulación',
        observation: 'Me como cierres de palabras.',
        effect: 'Menor precisión.'
    },
    {
        dimension: 'Pausas',
        observation: 'Hablo seguido casi sin silencios.',
        effect: 'Sensación de apuro.'
    },
    {
        dimension: 'Énfasis',
        observation: 'Todo suena igual.',
        effect: 'Poca jerarquía de ideas.'
    },
    {
        dimension: 'Cierre de frase',
        observation: 'Termino en tono ascendente.',
        effect: 'Mensaje menos firme.'
    }
] as const

const EXAMPLE_VOICE_CALIBRATION = [
    {
        dimension: 'Estabilidad tonal',
        observablePattern: 'Mi tono sube al explicar cifras.',
        impact: 'Resta',
        concreteAdjustment: 'Mantener tono basal y bajar medio punto al cerrar idea.'
    },
    {
        dimension: 'Velocidad de procesamiento',
        observablePattern: 'Acelero cuando quiero sonar convincente.',
        impact: 'Resta',
        concreteAdjustment: 'Reducir velocidad en frases decisivas.'
    },
    {
        dimension: 'Uso del silencio',
        observablePattern: 'Casi no hago pausas.',
        impact: 'Resta',
        concreteAdjustment: 'Insertar pausas breves antes y después de ideas clave.'
    },
    {
        dimension: 'Claridad articulatoria',
        observablePattern: 'Recorto palabras al final.',
        impact: 'Resta',
        concreteAdjustment: 'Marcar consonantes finales y abrir vocales.'
    },
    {
        dimension: 'Jerarquía sonora',
        observablePattern: 'Todo suena plano.',
        impact: 'Resta',
        concreteAdjustment: 'Dar más énfasis a 3 palabras clave.'
    },
    {
        dimension: 'Sostén de cierre',
        observablePattern: 'Termino frases hacia arriba.',
        impact: 'Resta',
        concreteAdjustment: 'Cerrar con caída de tono y respiración completa.'
    }
] as const

const EXAMPLE_VOICE_PARTITURE = {
    baseMessage: 'Necesitamos reenfocar el trimestre en tres prioridades para proteger calidad, tiempos y capacidad de respuesta.',
    anchorWords: 'reenfocar, tres prioridades, calidad, tiempos, capacidad de respuesta',
    functionalPauses: 'Después de “trimestre”, después de “tres prioridades”.',
    firmClosures: '“tres prioridades”, “capacidad de respuesta”.',
    energyPoints: '“proteger calidad”.',
    vocalRisks: 'Acelerar al inicio y subir el tono en la segunda mitad.'
}

const EXAMPLE_VOICE_PRESSURE_PROTOCOL = {
    earlySignal: 'Subo el tono y acelero.',
    triggerContext: 'Cuando me interrumpen o me cuestionan en público.',
    regulationAction: 'Exhalar, hacer una pausa de un segundo y reiniciar con menor velocidad.',
    reanchoringPhrase: '“Voy a decirlo en una frase clara.”'
}

const EXAMPLE_VOICE_LADDER = [
    { context: 'Uno a uno', tone: 'Cercano y estable', speed: 'Media', volume: 'Medio', pauses: 'Moderadas', emphasis: 'Medio' },
    {
        context: 'Alto nivel',
        tone: 'Grave y limpio',
        speed: 'Media-baja',
        volume: 'Medio-alto',
        pauses: 'Claras',
        emphasis: 'Alto en ideas clave'
    },
    {
        context: 'Videollamada',
        tone: 'Más proyectado',
        speed: 'Media',
        volume: 'Medio-alto',
        pauses: 'Claras',
        emphasis: 'Medio-alto'
    },
    {
        context: 'Conversación difícil',
        tone: 'Bajo y estable',
        speed: 'Lenta',
        volume: 'Medio',
        pauses: 'Altas',
        emphasis: 'Bajo'
    },
    {
        context: 'Respuesta a objeción',
        tone: 'Firme no reactivo',
        speed: 'Media-baja',
        volume: 'Medio',
        pauses: 'Estratégicas',
        emphasis: 'Alto en ideas clave'
    }
] as const

const DEFAULT_STATE: WB6State = {
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    bodyLanguageSection: {
        baselineScan: BASELINE_DIMENSIONS.map((dimension) => ({
            dimension,
            observation: '',
            effect: ''
        })),
        presenceMatrix: PRESENCE_DIMENSIONS.map((dimension) => ({
            dimension,
            observableBehavior: '',
            presenceImpact: '' as PresenceImpact,
            concreteAdjustment: ''
        })),
        leakageTraffic: Array.from({ length: 4 }, () => ({
            signal: '',
            level: '' as LeakageLevel,
            whenAppears: '',
            generatedReading: ''
        })),
        entryProtocol: {
            idealEntry: '',
            positioning: '',
            spaceCriteria: '',
            first20Seconds: '',
            signalToInstall: ''
        },
        calmAuthorityPattern: {
            centeredBody: '',
            listeningBody: '',
            objectionBody: '',
            returnToCenter: ''
        },
        coherenceTest: COHERENCE_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    objectionHandlingSection: {
        cartography: Array.from({ length: 3 }, () => ({
            objection: '',
            objectionType: '' as ObjectionType,
            whatActivatedMe: '',
            response: '',
            responseEffect: '',
            betterResponse: ''
        })),
        diagnosis: {
            literal: '',
            emotionalIntensity: '',
            whatItProtects: '',
            firstLayerToRespond: ''
        },
        protocol: {
            receive: '',
            clarificationQuestion: '',
            recognition: '',
            focalResponse: '',
            advanceVerification: ''
        },
        bridgeBank: BRIDGE_SCENARIOS.map((scenario) => ({
            scenario,
            bridgeResponse: ''
        })),
        reframeLab: Array.from({ length: 3 }, () => ({
            originalObjection: '',
            usefulReframe: '',
            proposalImprovement: ''
        })),
        executiveTest: OBJECTION_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    voiceToneSection: {
        baseline: VOICE_BASELINE_DIMENSIONS.map((dimension) => ({
            dimension,
            observation: '',
            effect: ''
        })),
        calibrationMatrix: VOICE_CALIBRATION_DIMENSIONS.map((dimension) => ({
            dimension,
            observablePattern: '',
            impact: '' as PresenceImpact,
            concreteAdjustment: ''
        })),
        messagePartiture: {
            baseMessage: '',
            anchorWords: '',
            functionalPauses: '',
            firmClosures: '',
            energyPoints: '',
            vocalRisks: ''
        },
        pressureProtocol: {
            earlySignal: '',
            triggerContext: '',
            regulationAction: '',
            reanchoringPhrase: ''
        },
        modulationLadder: VOICE_CONTEXTS.map((context) => ({
            context,
            tone: '',
            speed: '',
            volume: '',
            pauses: '',
            emphasis: ''
        })),
        executiveImpactTest: VOICE_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    }
}

const normalizeState = (raw: unknown): WB6State => {
    if (!raw || typeof raw !== 'object') return DEFAULT_STATE
    const parsed = raw as Record<string, unknown>
    const identification = (parsed.identification ?? {}) as Record<string, unknown>
    const bodyRaw = (parsed.bodyLanguageSection ?? {}) as Record<string, unknown>
    const baselineRaw = Array.isArray(bodyRaw.baselineScan) ? bodyRaw.baselineScan : []
    const presenceRaw = Array.isArray(bodyRaw.presenceMatrix) ? bodyRaw.presenceMatrix : []
    const leakageRaw = Array.isArray(bodyRaw.leakageTraffic) ? bodyRaw.leakageTraffic : []
    const coherenceRaw = Array.isArray(bodyRaw.coherenceTest) ? bodyRaw.coherenceTest : []
    const objectionRaw = (parsed.objectionHandlingSection ?? {}) as Record<string, unknown>
    const objectionCartographyRaw = Array.isArray(objectionRaw.cartography) ? objectionRaw.cartography : []
    const objectionBridgeRaw = Array.isArray(objectionRaw.bridgeBank) ? objectionRaw.bridgeBank : []
    const objectionReframeRaw = Array.isArray(objectionRaw.reframeLab) ? objectionRaw.reframeLab : []
    const objectionTestRaw = Array.isArray(objectionRaw.executiveTest) ? objectionRaw.executiveTest : []
    const voiceRaw = (parsed.voiceToneSection ?? {}) as Record<string, unknown>
    const voiceBaselineRaw = Array.isArray(voiceRaw.baseline) ? voiceRaw.baseline : []
    const voiceCalibrationRaw = Array.isArray(voiceRaw.calibrationMatrix) ? voiceRaw.calibrationMatrix : []
    const voiceLadderRaw = Array.isArray(voiceRaw.modulationLadder) ? voiceRaw.modulationLadder : []
    const voiceTestRaw = Array.isArray(voiceRaw.executiveImpactTest) ? voiceRaw.executiveImpactTest : []

    const normalizeVerdict = (value: unknown): YesNoAnswer => {
        if (value === 'yes' || value === 'no') return value
        return ''
    }

    const normalizePresenceImpact = (value: unknown): PresenceImpact => {
        if (value === 'Suma' || value === 'Resta') return value
        return ''
    }

    const normalizeLeakageLevel = (value: unknown): LeakageLevel => {
        if (value === 'Verde' || value === 'Amarillo' || value === 'Rojo') return value
        return ''
    }

    const normalizeObjectionType = (value: unknown): ObjectionType => {
        if (
            value === 'Contenido' ||
            value === 'Proceso' ||
            value === 'Confianza' ||
            value === 'Identidad o estatus' ||
            value === 'Confianza / estatus' ||
            value === 'Otro'
        ) {
            return value
        }
        return ''
    }

    return {
        identification: {
            leaderName: typeof identification.leaderName === 'string' ? identification.leaderName : '',
            role: typeof identification.role === 'string' ? identification.role : '',
            cohort: typeof identification.cohort === 'string' ? identification.cohort : '',
            startDate: typeof identification.startDate === 'string' ? identification.startDate : ''
        },
        bodyLanguageSection: {
            baselineScan: BASELINE_DIMENSIONS.map((dimension, index) => {
                const candidate = (baselineRaw[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    observation: typeof candidate.observation === 'string' ? candidate.observation : '',
                    effect: typeof candidate.effect === 'string' ? candidate.effect : ''
                }
            }),
            presenceMatrix: PRESENCE_DIMENSIONS.map((dimension, index) => {
                const candidate = (presenceRaw[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    observableBehavior: typeof candidate.observableBehavior === 'string' ? candidate.observableBehavior : '',
                    presenceImpact: normalizePresenceImpact(candidate.presenceImpact),
                    concreteAdjustment: typeof candidate.concreteAdjustment === 'string' ? candidate.concreteAdjustment : ''
                }
            }),
            leakageTraffic: Array.from({ length: 4 }, (_, index) => {
                const candidate = (leakageRaw[index] ?? {}) as Record<string, unknown>
                return {
                    signal: typeof candidate.signal === 'string' ? candidate.signal : '',
                    level: normalizeLeakageLevel(candidate.level),
                    whenAppears: typeof candidate.whenAppears === 'string' ? candidate.whenAppears : '',
                    generatedReading: typeof candidate.generatedReading === 'string' ? candidate.generatedReading : ''
                }
            }),
            entryProtocol: {
                idealEntry:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.idealEntry === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).idealEntry as string)
                        : '',
                positioning:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.positioning === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).positioning as string)
                        : '',
                spaceCriteria:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.spaceCriteria === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).spaceCriteria as string)
                        : '',
                first20Seconds:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.first20Seconds === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).first20Seconds as string)
                        : '',
                signalToInstall:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.signalToInstall === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).signalToInstall as string)
                        : ''
            },
            calmAuthorityPattern: {
                centeredBody:
                    typeof (bodyRaw.calmAuthorityPattern as Record<string, unknown> | undefined)?.centeredBody === 'string'
                        ? ((bodyRaw.calmAuthorityPattern as Record<string, unknown>).centeredBody as string)
                        : '',
                listeningBody:
                    typeof (bodyRaw.calmAuthorityPattern as Record<string, unknown> | undefined)?.listeningBody === 'string'
                        ? ((bodyRaw.calmAuthorityPattern as Record<string, unknown>).listeningBody as string)
                        : '',
                objectionBody:
                    typeof (bodyRaw.calmAuthorityPattern as Record<string, unknown> | undefined)?.objectionBody === 'string'
                        ? ((bodyRaw.calmAuthorityPattern as Record<string, unknown>).objectionBody as string)
                        : '',
                returnToCenter:
                    typeof (bodyRaw.calmAuthorityPattern as Record<string, unknown> | undefined)?.returnToCenter === 'string'
                        ? ((bodyRaw.calmAuthorityPattern as Record<string, unknown>).returnToCenter as string)
                        : ''
            },
            coherenceTest: COHERENCE_QUESTIONS.map((question, index) => {
                const candidate = (coherenceRaw[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: normalizeVerdict(candidate.verdict),
                    adjustment: typeof candidate.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        },
        objectionHandlingSection: {
            cartography: Array.from({ length: 3 }, (_, index) => {
                const candidate = (objectionCartographyRaw[index] ?? {}) as Record<string, unknown>
                return {
                    objection: typeof candidate.objection === 'string' ? candidate.objection : '',
                    objectionType: normalizeObjectionType(candidate.objectionType),
                    whatActivatedMe: typeof candidate.whatActivatedMe === 'string' ? candidate.whatActivatedMe : '',
                    response: typeof candidate.response === 'string' ? candidate.response : '',
                    responseEffect: typeof candidate.responseEffect === 'string' ? candidate.responseEffect : '',
                    betterResponse: typeof candidate.betterResponse === 'string' ? candidate.betterResponse : ''
                }
            }),
            diagnosis: {
                literal:
                    typeof (objectionRaw.diagnosis as Record<string, unknown> | undefined)?.literal === 'string'
                        ? ((objectionRaw.diagnosis as Record<string, unknown>).literal as string)
                        : '',
                emotionalIntensity:
                    typeof (objectionRaw.diagnosis as Record<string, unknown> | undefined)?.emotionalIntensity === 'string'
                        ? ((objectionRaw.diagnosis as Record<string, unknown>).emotionalIntensity as string)
                        : '',
                whatItProtects:
                    typeof (objectionRaw.diagnosis as Record<string, unknown> | undefined)?.whatItProtects === 'string'
                        ? ((objectionRaw.diagnosis as Record<string, unknown>).whatItProtects as string)
                        : '',
                firstLayerToRespond:
                    typeof (objectionRaw.diagnosis as Record<string, unknown> | undefined)?.firstLayerToRespond === 'string'
                        ? ((objectionRaw.diagnosis as Record<string, unknown>).firstLayerToRespond as string)
                        : ''
            },
            protocol: {
                receive:
                    typeof (objectionRaw.protocol as Record<string, unknown> | undefined)?.receive === 'string'
                        ? ((objectionRaw.protocol as Record<string, unknown>).receive as string)
                        : '',
                clarificationQuestion:
                    typeof (objectionRaw.protocol as Record<string, unknown> | undefined)?.clarificationQuestion === 'string'
                        ? ((objectionRaw.protocol as Record<string, unknown>).clarificationQuestion as string)
                        : '',
                recognition:
                    typeof (objectionRaw.protocol as Record<string, unknown> | undefined)?.recognition === 'string'
                        ? ((objectionRaw.protocol as Record<string, unknown>).recognition as string)
                        : '',
                focalResponse:
                    typeof (objectionRaw.protocol as Record<string, unknown> | undefined)?.focalResponse === 'string'
                        ? ((objectionRaw.protocol as Record<string, unknown>).focalResponse as string)
                        : '',
                advanceVerification:
                    typeof (objectionRaw.protocol as Record<string, unknown> | undefined)?.advanceVerification === 'string'
                        ? ((objectionRaw.protocol as Record<string, unknown>).advanceVerification as string)
                        : ''
            },
            bridgeBank: BRIDGE_SCENARIOS.map((scenario, index) => {
                const candidate = (objectionBridgeRaw[index] ?? {}) as Record<string, unknown>
                return {
                    scenario,
                    bridgeResponse: typeof candidate.bridgeResponse === 'string' ? candidate.bridgeResponse : ''
                }
            }),
            reframeLab: Array.from({ length: 3 }, (_, index) => {
                const candidate = (objectionReframeRaw[index] ?? {}) as Record<string, unknown>
                return {
                    originalObjection:
                        typeof candidate.originalObjection === 'string' ? candidate.originalObjection : '',
                    usefulReframe: typeof candidate.usefulReframe === 'string' ? candidate.usefulReframe : '',
                    proposalImprovement:
                        typeof candidate.proposalImprovement === 'string' ? candidate.proposalImprovement : ''
                }
            }),
            executiveTest: OBJECTION_TEST_QUESTIONS.map((question, index) => {
                const candidate = (objectionTestRaw[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: normalizeVerdict(candidate.verdict),
                    adjustment: typeof candidate.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        },
        voiceToneSection: {
            baseline: VOICE_BASELINE_DIMENSIONS.map((dimension, index) => {
                const candidate = (voiceBaselineRaw[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    observation: typeof candidate.observation === 'string' ? candidate.observation : '',
                    effect: typeof candidate.effect === 'string' ? candidate.effect : ''
                }
            }),
            calibrationMatrix: VOICE_CALIBRATION_DIMENSIONS.map((dimension, index) => {
                const candidate = (voiceCalibrationRaw[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    observablePattern: typeof candidate.observablePattern === 'string' ? candidate.observablePattern : '',
                    impact: normalizePresenceImpact(candidate.impact),
                    concreteAdjustment: typeof candidate.concreteAdjustment === 'string' ? candidate.concreteAdjustment : ''
                }
            }),
            messagePartiture: {
                baseMessage:
                    typeof (voiceRaw.messagePartiture as Record<string, unknown> | undefined)?.baseMessage === 'string'
                        ? ((voiceRaw.messagePartiture as Record<string, unknown>).baseMessage as string)
                        : '',
                anchorWords:
                    typeof (voiceRaw.messagePartiture as Record<string, unknown> | undefined)?.anchorWords === 'string'
                        ? ((voiceRaw.messagePartiture as Record<string, unknown>).anchorWords as string)
                        : '',
                functionalPauses:
                    typeof (voiceRaw.messagePartiture as Record<string, unknown> | undefined)?.functionalPauses === 'string'
                        ? ((voiceRaw.messagePartiture as Record<string, unknown>).functionalPauses as string)
                        : '',
                firmClosures:
                    typeof (voiceRaw.messagePartiture as Record<string, unknown> | undefined)?.firmClosures === 'string'
                        ? ((voiceRaw.messagePartiture as Record<string, unknown>).firmClosures as string)
                        : '',
                energyPoints:
                    typeof (voiceRaw.messagePartiture as Record<string, unknown> | undefined)?.energyPoints === 'string'
                        ? ((voiceRaw.messagePartiture as Record<string, unknown>).energyPoints as string)
                        : '',
                vocalRisks:
                    typeof (voiceRaw.messagePartiture as Record<string, unknown> | undefined)?.vocalRisks === 'string'
                        ? ((voiceRaw.messagePartiture as Record<string, unknown>).vocalRisks as string)
                        : ''
            },
            pressureProtocol: {
                earlySignal:
                    typeof (voiceRaw.pressureProtocol as Record<string, unknown> | undefined)?.earlySignal === 'string'
                        ? ((voiceRaw.pressureProtocol as Record<string, unknown>).earlySignal as string)
                        : '',
                triggerContext:
                    typeof (voiceRaw.pressureProtocol as Record<string, unknown> | undefined)?.triggerContext === 'string'
                        ? ((voiceRaw.pressureProtocol as Record<string, unknown>).triggerContext as string)
                        : '',
                regulationAction:
                    typeof (voiceRaw.pressureProtocol as Record<string, unknown> | undefined)?.regulationAction === 'string'
                        ? ((voiceRaw.pressureProtocol as Record<string, unknown>).regulationAction as string)
                        : '',
                reanchoringPhrase:
                    typeof (voiceRaw.pressureProtocol as Record<string, unknown> | undefined)?.reanchoringPhrase === 'string'
                        ? ((voiceRaw.pressureProtocol as Record<string, unknown>).reanchoringPhrase as string)
                        : ''
            },
            modulationLadder: VOICE_CONTEXTS.map((context, index) => {
                const candidate = (voiceLadderRaw[index] ?? {}) as Record<string, unknown>
                return {
                    context,
                    tone: typeof candidate.tone === 'string' ? candidate.tone : '',
                    speed: typeof candidate.speed === 'string' ? candidate.speed : '',
                    volume: typeof candidate.volume === 'string' ? candidate.volume : '',
                    pauses: typeof candidate.pauses === 'string' ? candidate.pauses : '',
                    emphasis: typeof candidate.emphasis === 'string' ? candidate.emphasis : ''
                }
            }),
            executiveImpactTest: VOICE_TEST_QUESTIONS.map((question, index) => {
                const candidate = (voiceTestRaw[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: normalizeVerdict(candidate.verdict),
                    adjustment: typeof candidate.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        }
    }
}

export function WB6Digital() {
    const [state, setState] = useState<WB6State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]))
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [showBodyHelp, setShowBodyHelp] = useState(false)
    const [showBodyExampleStep1, setShowBodyExampleStep1] = useState(false)
    const [showBodyExampleStep2, setShowBodyExampleStep2] = useState(false)
    const [showBodyExampleStep3, setShowBodyExampleStep3] = useState(false)
    const [showBodyExampleStep4, setShowBodyExampleStep4] = useState(false)
    const [showBodyExampleStep5, setShowBodyExampleStep5] = useState(false)
    const [showBodyExampleStep6, setShowBodyExampleStep6] = useState(false)
    const [showBodySketch, setShowBodySketch] = useState(false)
    const [showObjectionHelp, setShowObjectionHelp] = useState(false)
    const [showObjectionExampleStep1, setShowObjectionExampleStep1] = useState(false)
    const [showObjectionExampleStep2, setShowObjectionExampleStep2] = useState(false)
    const [showObjectionExampleStep3, setShowObjectionExampleStep3] = useState(false)
    const [showObjectionExampleStep4, setShowObjectionExampleStep4] = useState(false)
    const [showObjectionExampleStep5, setShowObjectionExampleStep5] = useState(false)
    const [showObjectionExampleStep6, setShowObjectionExampleStep6] = useState(false)
    const [showVoiceHelp, setShowVoiceHelp] = useState(false)
    const [showVoiceExampleStep1, setShowVoiceExampleStep1] = useState(false)
    const [showVoiceExampleStep2, setShowVoiceExampleStep2] = useState(false)
    const [showVoiceExampleStep3, setShowVoiceExampleStep3] = useState(false)
    const [showVoiceExampleStep4, setShowVoiceExampleStep4] = useState(false)
    const [showVoiceExampleStep5, setShowVoiceExampleStep5] = useState(false)
    const [showVoiceExampleStep6, setShowVoiceExampleStep6] = useState(false)

    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            const rawState = window.localStorage.getItem(STORAGE_KEY)
            if (rawState) {
                setState(normalizeState(JSON.parse(rawState)))
            }

            const introSeen = window.localStorage.getItem(INTRO_SEEN_KEY) === '1'
            setHasSeenPresentationOnce(introSeen)

            const rawPage = window.localStorage.getItem(PAGE_STORAGE_KEY)
            if (rawPage) {
                const parsed = Number(rawPage)
                if (PAGES.some((page) => page.id === parsed)) {
                    setActivePage(parsed as WorkbookPageId)
                }
            }

            const rawVisited = window.localStorage.getItem(VISITED_STORAGE_KEY)
            if (rawVisited) {
                const parsedVisited = JSON.parse(rawVisited) as number[]
                const validVisited = parsedVisited.filter((page) => PAGES.some((candidate) => candidate.id === page))
                if (validVisited.length > 0) {
                    setVisitedPages(new Set(validVisited))
                }
            }
        } catch {
            setState(DEFAULT_STATE)
            setActivePage(1)
            setVisitedPages(new Set([1]))
        } finally {
            setIsHydrated(true)
        }
    }, [])

    useEffect(() => {
        if (!isHydrated || typeof window === 'undefined') return
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        window.localStorage.setItem(PAGE_STORAGE_KEY, String(activePage))
        window.localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(Array.from(visitedPages)))
        window.localStorage.setItem(INTRO_SEEN_KEY, hasSeenPresentationOnce ? '1' : '0')
    }, [activePage, hasSeenPresentationOnce, isHydrated, state, visitedPages])

    useEffect(() => {
        if (!isHydrated || hasSeenPresentationOnce || activePage !== 2) {
            return
        }

        setHasSeenPresentationOnce(true)
        setVisitedPages((prev) => {
            const next = new Set(prev)
            next.add(2)
            return next
        })
    }, [activePage, hasSeenPresentationOnce, isHydrated])

    useEffect(() => {
        return () => {
            if (feedbackTimeoutRef.current) {
                clearTimeout(feedbackTimeoutRef.current)
            }
        }
    }, [])

    const announceSave = (message: string) => {
        setSaveFeedback(message)
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current)
        }
        feedbackTimeoutRef.current = setTimeout(() => {
            setSaveFeedback('')
        }, 3200)
    }

    const markVisited = (pageId: WorkbookPageId) => {
        setVisitedPages((prev) => {
            const next = new Set(prev)
            next.add(pageId)
            return next
        })
    }

    const jumpToPage = (pageId: WorkbookPageId) => {
        setActivePage(pageId)
        markVisited(pageId)
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
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

    const savePage = (pageId: WorkbookPageId = activePage) => {
        markVisited(pageId)
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
            window.localStorage.setItem(PAGE_STORAGE_KEY, String(pageId))
        }
        announceSave(`Página ${pageId} guardada.`)
    }

    const updateIdentification = (field: keyof WB6State['identification'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateBaselineScanRow = (
        rowIndex: number,
        field: keyof WB6State['bodyLanguageSection']['baselineScan'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                baselineScan: prev.bodyLanguageSection.baselineScan.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updatePresenceMatrixRow = (
        rowIndex: number,
        field: keyof WB6State['bodyLanguageSection']['presenceMatrix'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                presenceMatrix: prev.bodyLanguageSection.presenceMatrix.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'presenceImpact'
                                      ? value === 'Suma' || value === 'Resta'
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateLeakageTrafficRow = (
        rowIndex: number,
        field: keyof WB6State['bodyLanguageSection']['leakageTraffic'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                leakageTraffic: prev.bodyLanguageSection.leakageTraffic.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'level'
                                      ? value === 'Verde' || value === 'Amarillo' || value === 'Rojo'
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateEntryProtocol = (
        field: keyof WB6State['bodyLanguageSection']['entryProtocol'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                entryProtocol: {
                    ...prev.bodyLanguageSection.entryProtocol,
                    [field]: value
                }
            }
        }))
    }

    const updateCalmAuthorityPattern = (
        field: keyof WB6State['bodyLanguageSection']['calmAuthorityPattern'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                calmAuthorityPattern: {
                    ...prev.bodyLanguageSection.calmAuthorityPattern,
                    [field]: value
                }
            }
        }))
    }

    const updateCoherenceTestRow = (
        rowIndex: number,
        field: keyof WB6State['bodyLanguageSection']['coherenceTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                coherenceTest: prev.bodyLanguageSection.coherenceTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? ((value === 'yes' || value === 'no' ? value : '') as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveBodyLanguageBlock = (blockLabel: string) => {
        markVisited(3)
        if (blockLabel === 'Paso 1') {
            setShowBodySketch(true)
        }
        announceSave(`${blockLabel} guardado.`)
    }

    const updateObjectionCartographyRow = (
        rowIndex: number,
        field: keyof WB6State['objectionHandlingSection']['cartography'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            objectionHandlingSection: {
                ...prev.objectionHandlingSection,
                cartography: prev.objectionHandlingSection.cartography.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'objectionType'
                                      ? OBJECTION_TYPES.includes(value as ObjectionType)
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateObjectionDiagnosis = (
        field: keyof WB6State['objectionHandlingSection']['diagnosis'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            objectionHandlingSection: {
                ...prev.objectionHandlingSection,
                diagnosis: {
                    ...prev.objectionHandlingSection.diagnosis,
                    [field]: value
                }
            }
        }))
    }

    const updateObjectionProtocol = (
        field: keyof WB6State['objectionHandlingSection']['protocol'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            objectionHandlingSection: {
                ...prev.objectionHandlingSection,
                protocol: {
                    ...prev.objectionHandlingSection.protocol,
                    [field]: value
                }
            }
        }))
    }

    const updateObjectionBridgeRow = (
        rowIndex: number,
        field: keyof WB6State['objectionHandlingSection']['bridgeBank'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            objectionHandlingSection: {
                ...prev.objectionHandlingSection,
                bridgeBank: prev.objectionHandlingSection.bridgeBank.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateObjectionReframeRow = (
        rowIndex: number,
        field: keyof WB6State['objectionHandlingSection']['reframeLab'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            objectionHandlingSection: {
                ...prev.objectionHandlingSection,
                reframeLab: prev.objectionHandlingSection.reframeLab.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateObjectionExecutiveTestRow = (
        rowIndex: number,
        field: keyof WB6State['objectionHandlingSection']['executiveTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            objectionHandlingSection: {
                ...prev.objectionHandlingSection,
                executiveTest: prev.objectionHandlingSection.executiveTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? ((value === 'yes' || value === 'no' ? value : '') as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveObjectionBlock = (blockLabel: string) => {
        markVisited(4)
        announceSave(`${blockLabel} guardado.`)
    }

    const updateVoiceBaselineRow = (
        rowIndex: number,
        field: keyof WB6State['voiceToneSection']['baseline'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            voiceToneSection: {
                ...prev.voiceToneSection,
                baseline: prev.voiceToneSection.baseline.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateVoiceCalibrationRow = (
        rowIndex: number,
        field: keyof WB6State['voiceToneSection']['calibrationMatrix'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            voiceToneSection: {
                ...prev.voiceToneSection,
                calibrationMatrix: prev.voiceToneSection.calibrationMatrix.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'impact'
                                      ? value === 'Suma' || value === 'Resta'
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateVoicePartiture = (
        field: keyof WB6State['voiceToneSection']['messagePartiture'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            voiceToneSection: {
                ...prev.voiceToneSection,
                messagePartiture: {
                    ...prev.voiceToneSection.messagePartiture,
                    [field]: value
                }
            }
        }))
    }

    const updateVoicePressureProtocol = (
        field: keyof WB6State['voiceToneSection']['pressureProtocol'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            voiceToneSection: {
                ...prev.voiceToneSection,
                pressureProtocol: {
                    ...prev.voiceToneSection.pressureProtocol,
                    [field]: value
                }
            }
        }))
    }

    const updateVoiceLadderRow = (
        rowIndex: number,
        field: keyof WB6State['voiceToneSection']['modulationLadder'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            voiceToneSection: {
                ...prev.voiceToneSection,
                modulationLadder: prev.voiceToneSection.modulationLadder.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateVoiceExecutiveTestRow = (
        rowIndex: number,
        field: keyof WB6State['voiceToneSection']['executiveImpactTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            voiceToneSection: {
                ...prev.voiceToneSection,
                executiveImpactTest: prev.voiceToneSection.executiveImpactTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? ((value === 'yes' || value === 'no' ? value : '') as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveVoiceBlock = (blockLabel: string) => {
        markVisited(5)
        announceSave(`${blockLabel} guardado.`)
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
            document.title = 'WB6 - Lenguaje verbal y no verbal de impacto'
            window.print()
            document.title = currentTitle
            announceSave('PDF completo generado (usa "Guardar como PDF" en el diálogo).')
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
            link.download = 'WB6-lenguaje-verbal-no-verbal-impacto-completo.html'
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

    const baselineScan = state.bodyLanguageSection.baselineScan
    const presenceMatrix = state.bodyLanguageSection.presenceMatrix
    const leakageTraffic = state.bodyLanguageSection.leakageTraffic
    const entryProtocol = state.bodyLanguageSection.entryProtocol
    const calmAuthorityPattern = state.bodyLanguageSection.calmAuthorityPattern
    const coherenceTest = state.bodyLanguageSection.coherenceTest
    const objectionCartography = state.objectionHandlingSection.cartography
    const objectionDiagnosis = state.objectionHandlingSection.diagnosis
    const objectionProtocol = state.objectionHandlingSection.protocol
    const objectionBridgeBank = state.objectionHandlingSection.bridgeBank
    const objectionReframeLab = state.objectionHandlingSection.reframeLab
    const objectionExecutiveTest = state.objectionHandlingSection.executiveTest
    const voiceBaseline = state.voiceToneSection.baseline
    const voiceCalibration = state.voiceToneSection.calibrationMatrix
    const voicePartiture = state.voiceToneSection.messagePartiture
    const voicePressureProtocol = state.voiceToneSection.pressureProtocol
    const voiceLadder = state.voiceToneSection.modulationLadder
    const voiceExecutiveTest = state.voiceToneSection.executiveImpactTest

    const baselineCompleted = baselineScan.every(
        (row) => row.observation.trim().length > 0 && row.effect.trim().length > 0
    )
    const presenceCompleted = presenceMatrix.every(
        (row) =>
            row.observableBehavior.trim().length > 0 &&
            row.presenceImpact !== '' &&
            row.concreteAdjustment.trim().length > 0
    )
    const leakageCompleted = leakageTraffic.every(
        (row) =>
            row.signal.trim().length > 0 &&
            row.level !== '' &&
            row.whenAppears.trim().length > 0 &&
            row.generatedReading.trim().length > 0
    )
    const entryCompleted = Object.values(entryProtocol).every((value) => value.trim().length > 0)
    const authorityPatternCompleted = Object.values(calmAuthorityPattern).every((value) => value.trim().length > 0)
    const coherenceCompleted = coherenceTest.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)

    const atLeastOneConcreteAdjustment = presenceMatrix.some((row) => row.concreteAdjustment.trim().length > 0)
    const bodySectionMinimal = baselineCompleted && atLeastOneConcreteAdjustment
    const bodySectionCompleted =
        baselineCompleted &&
        presenceCompleted &&
        leakageCompleted &&
        entryCompleted &&
        authorityPatternCompleted &&
        coherenceCompleted

    const observableBodyKeywords = [
        'mirada',
        'hombro',
        'postura',
        'pies',
        'manos',
        'mandíbula',
        'respiración',
        'cuerpo',
        'gesto',
        'torso',
        'cuello',
        'movimiento',
        'base'
    ]
    const emotionalOnlyWords = ['ansiedad', 'miedo', 'nervios', 'frustración', 'inseguridad', 'estrés', 'me siento']
    const baselineLooksAbstract = baselineScan.some((row) => {
        const text = row.observation.trim().toLowerCase()
        if (text.length === 0) return false
        const hasObservable = observableBodyKeywords.some((keyword) => text.includes(keyword))
        const hasEmotional = emotionalOnlyWords.some((keyword) => text.includes(keyword))
        return !hasObservable || hasEmotional
    })

    const concreteAdjustmentKeywords = ['pies', 'hombros', 'torso', 'mirada', 'manos', 'mandíbula', 'respira', 'postura', 'cuerpo']
    const adjustmentsTooAbstract = presenceMatrix
        .filter((row) => row.concreteAdjustment.trim().length > 0)
        .some((row) => !concreteAdjustmentKeywords.some((keyword) => row.concreteAdjustment.toLowerCase().includes(keyword)))

    const entryProtocolMissing = Object.values(entryProtocol).every((value) => value.trim().length === 0)
    const missingListeningInPattern = calmAuthorityPattern.listeningBody.trim().length === 0

    const baselineMapByDimension = baselineScan.reduce<Record<string, { observation: string; effect: string }>>((acc, row) => {
        acc[row.dimension] = { observation: row.observation.trim(), effect: row.effect.trim() }
        return acc
    }, {})

    const isObjectionCartographyRowComplete = (row: WB6State['objectionHandlingSection']['cartography'][number]) =>
        row.objection.trim().length > 0 &&
        row.objectionType !== '' &&
        row.whatActivatedMe.trim().length > 0 &&
        row.response.trim().length > 0 &&
        row.responseEffect.trim().length > 0 &&
        row.betterResponse.trim().length > 0

    const objectionCartographyCompleted = objectionCartography.every((row) => isObjectionCartographyRowComplete(row))
    const objectionDiagnosisCompleted = Object.values(objectionDiagnosis).every((value) => value.trim().length > 0)
    const objectionProtocolCompleted = Object.values(objectionProtocol).every((value) => value.trim().length > 0)
    const objectionBridgeCompleted = objectionBridgeBank.every((row) => row.bridgeResponse.trim().length > 0)
    const objectionReframeCompleted = objectionReframeLab.every(
        (row) =>
            row.originalObjection.trim().length > 0 &&
            row.usefulReframe.trim().length > 0 &&
            row.proposalImprovement.trim().length > 0
    )
    const objectionExecutiveTestCompleted = objectionExecutiveTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )

    const oneCartographyComplete = objectionCartography.some((row) => isObjectionCartographyRowComplete(row))
    const objectionSectionMinimal = oneCartographyComplete && objectionProtocolCompleted
    const objectionSectionCompleted =
        objectionCartographyCompleted &&
        objectionDiagnosisCompleted &&
        objectionProtocolCompleted &&
        objectionBridgeCompleted &&
        objectionReframeCompleted &&
        objectionExecutiveTestCompleted

    const objectionMissingTypeBeforeResponse = objectionCartography.some(
        (row) => row.objection.trim().length > 0 && row.response.trim().length > 0 && row.objectionType === ''
    )

    const focalResponseWordCount = objectionProtocol.focalResponse.trim().split(/\s+/).filter(Boolean).length
    const focalResponseTooLong = focalResponseWordCount > 32
    const objectionProtocolHasContent = Object.values(objectionProtocol).some((value) => value.trim().length > 0)
    const objectionMissingAdvanceVerification =
        objectionProtocolHasContent && objectionProtocol.advanceVerification.trim().length === 0
    const objectionReframeWithoutImprovement = objectionReframeLab.some(
        (row) =>
            row.originalObjection.trim().length > 0 &&
            row.usefulReframe.trim().length > 0 &&
            row.proposalImprovement.trim().length === 0
    )

    const voiceBaselineCompleted = voiceBaseline.every(
        (row) => row.observation.trim().length > 0 && row.effect.trim().length > 0
    )
    const voiceCalibrationCompleted = voiceCalibration.every(
        (row) =>
            row.observablePattern.trim().length > 0 &&
            row.impact !== '' &&
            row.concreteAdjustment.trim().length > 0
    )
    const voicePartitureCompleted = Object.values(voicePartiture).every((value) => value.trim().length > 0)
    const voicePressureCompleted = Object.values(voicePressureProtocol).every((value) => value.trim().length > 0)
    const voiceLadderCompleted = voiceLadder.every(
        (row) =>
            row.tone.trim().length > 0 &&
            row.speed.trim().length > 0 &&
            row.volume.trim().length > 0 &&
            row.pauses.trim().length > 0 &&
            row.emphasis.trim().length > 0
    )
    const voiceExecutiveTestCompleted = voiceExecutiveTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )

    const voiceAtLeastOneAdjustment = voiceCalibration.some((row) => row.concreteAdjustment.trim().length > 0)
    const voiceSectionMinimal = voiceBaselineCompleted && voiceAtLeastOneAdjustment
    const voiceSectionCompleted =
        voiceBaselineCompleted &&
        voiceCalibrationCompleted &&
        voicePartitureCompleted &&
        voicePressureCompleted &&
        voiceLadderCompleted &&
        voiceExecutiveTestCompleted

    const vocalObservableKeywords = [
        'tono',
        'velocidad',
        'ritmo',
        'volumen',
        'pausa',
        'articul',
        'énfasis',
        'cadencia',
        'cierre',
        'frase',
        'respir',
        'voz'
    ]
    const voiceEmotionWords = ['ansiedad', 'miedo', 'nervios', 'frustración', 'inseguridad', 'estrés', 'me siento']
    const voiceBaselineLooksAbstract = voiceBaseline.some((row) => {
        const text = row.observation.trim().toLowerCase()
        if (text.length === 0) return false
        const hasObservable = vocalObservableKeywords.some((keyword) => text.includes(keyword))
        const hasEmotional = voiceEmotionWords.some((keyword) => text.includes(keyword))
        return !hasObservable || hasEmotional
    })

    const voiceAnchorWordsMissing = voicePartiture.baseMessage.trim().length > 0 && voicePartiture.anchorWords.trim().length === 0
    const voiceActionKeywords = ['pausa', 'tono', 'respira', 'respiración', 'velocidad', 'volumen', 'exhala', 'cadencia']
    const voiceProtocolActionTooAbstract =
        voicePressureProtocol.regulationAction.trim().length > 0 &&
        !voiceActionKeywords.some((keyword) => voicePressureProtocol.regulationAction.toLowerCase().includes(keyword))

    const voiceLadderSignatures = voiceLadder
        .filter((row) => [row.tone, row.speed, row.volume, row.pauses, row.emphasis].some((value) => value.trim().length > 0))
        .map((row) => `${row.tone}::${row.speed}::${row.volume}::${row.pauses}::${row.emphasis}`)
    const voiceLadderSameAcrossContexts =
        voiceLadderSignatures.length >= 2 && new Set(voiceLadderSignatures).size === 1

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: bodySectionCompleted,
        4: objectionSectionCompleted,
        5: voiceSectionCompleted
    }

    const completedPages = PAGES.filter((page) => pageCompletionMap[page.id]).length
    const progressPercent = Math.round((completedPages / PAGES.length) * 100)
    const printMetaLabel = `Líder: ${state.identification.leaderName || 'Sin nombre'} · Rol: ${state.identification.role || 'Sin rol'}`

    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb6-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/workbooks-v2" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB6 - Lenguaje verbal y no verbal de impacto</p>
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
                        disabled={isLocked || isExporting}
                        className={WORKBOOK_V2_EDITORIAL.classes.saveButton}
                    >
                        Guardar página {activePage}
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

            <main className="max-w-[1280px] mx-auto px-5 md:px-8 py-8 overflow-x-auto">
                <div className={`grid gap-6 items-start ${isExportingAll ? 'grid-cols-1 min-w-0' : 'grid-cols-[240px_minmax(0,1fr)] min-w-[920px]'}`}>
                    <aside className={`wb6-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
                        <p className={WORKBOOK_V2_EDITORIAL.classes.sidebarTitle}>{WORKBOOK_V2_EDITORIAL.labels.index}</p>
                        <nav className="space-y-1.5">
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
                        {isPageVisible(1) && (
                            <article
                                className="wb6-print-page wb6-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 5"
                                data-print-title="Portada e identificación"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb6-cover-hero relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-16 w-16 md:h-20 md:w-20" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Lenguaje verbal y no verbal de impacto
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 6</p>
                                        <p className="text-blue-600 text-sm">Sistema: 4Shine® · Pilar: Shine Out (Presencia estratégica)</p>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 border-t border-slate-200">
                                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">Datos de identificación</h2>
                                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nombre del líder</span>
                                            <input
                                                type="text"
                                                value={state.identification.leaderName}
                                                onChange={(event) => updateIdentification('leaderName', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Ej: Andrés Tabla"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Rol actual</span>
                                            <input
                                                type="text"
                                                value={state.identification.role}
                                                onChange={(event) => updateIdentification('role', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Ej: Director / Líder"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Cohorte / Equipo</span>
                                            <input
                                                type="text"
                                                value={state.identification.cohort}
                                                onChange={(event) => updateIdentification('cohort', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Ej: Cohorte Ejecutiva 2026"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Fecha de inicio</span>
                                            <input
                                                type="date"
                                                value={state.identification.startDate}
                                                onChange={(event) => updateIdentification('startDate', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => savePage(1)}
                                            disabled={isLocked}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar datos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                savePage(1)
                                                jumpToPage(2)
                                            }}
                                            className="rounded-xl bg-blue-700 text-white px-6 py-3 text-sm font-bold hover:bg-blue-600 transition-colors"
                                        >
                                            Empezar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        )}

                        {isPageVisible(2) && (
                            <article
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 2 de 5"
                                data-print-title="Presentación del workbook"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 2</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Presentación del workbook</h2>
                                </header>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 p-5 md:p-7">
                                    <h3 className="text-lg font-bold text-slate-900">Objetivo</h3>
                                    <p className="mt-4 text-sm md:text-[15px] text-slate-700 leading-relaxed">
                                        Fortalecer la presencia ejecutiva del líder en entornos presenciales, virtuales e híbridos, desarrollando mayor coherencia entre lenguaje verbal y no verbal, control del tono y ritmo, capacidad de comunicar bajo presión y manejo de objeciones con claridad y aplomo.
                                    </p>
                                </section>

                                <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Componentes trabajados en este workbook</h3>
                                        <ul className="mt-4 space-y-2.5">
                                            {[
                                                'Comunicación de impacto.',
                                                'Influencia positiva.',
                                                'Presencia digital e híbrida.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-3">
                                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Competencias 4Shine que vas a activar</h3>
                                        <ul className="mt-4 space-y-2.5">
                                            {[
                                                'Claridad e inspiración.',
                                                'Escucha Activa y Empática.',
                                                'Adaptabilidad Comunicativa.',
                                                'Construcción de confianza (Trust).',
                                                'Influencia ética y persuasión.',
                                                'Influencia asíncrona y virtual.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-3">
                                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <article className="rounded-2xl border border-slate-200 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">
                                        Conductas observables asociadas (qué se debería ver en tu día a día)
                                    </h3>
                                    <p className="mt-3 text-sm text-slate-700">
                                        Usa estas conductas como referencia para escribir evidencia real (no intención):
                                    </p>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Lee a su audiencia y ajusta su estilo y lenguaje (ej. técnico vs. estratégico) según el interlocutor.',
                                            'Identifica señales no verbales en los demás y modifica el ritmo o enfoque de su mensaje para mantener la sintonía y asegurar que el mensaje sea aceptado.',
                                            'Apela a valores e ideales compartidos para generar una voluntad genuina de colaboración en el equipo.',
                                            'Proyecta la misma gravitas y calidez en videoconferencias que en persona.',
                                            'Gestiona su reputación y narrativa en plataformas digitales de forma estratégica.',
                                            'Utiliza persuasión racional basada en datos, hechos y criterio, no en amenaza o imposición.',
                                            'Trata a los demás con respeto y genera una atmósfera de seguridad conversacional.',
                                            'Comunica de manera oportuna y honesta, incluso cuando hay tensión o malas noticias.',
                                            'Deja que otros se expresen sin interrumpir y demuestra con gestos y preguntas que escucha atentamente.',
                                            'Reconoce la perspectiva del otro, incluso cuando no coincide con la suya.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>

                                <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Reglas de oro (para ti)</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Tu cuerpo, tu voz y tus palabras deben decir lo mismo.',
                                            'Bajo presión, primero regula presencia; después responde.',
                                            'No confundas autoridad con rigidez ni calma con pasividad.',
                                            'En espacios de alto nivel, menos dispersión y más intención.',
                                            'Si tu forma contradice tu mensaje, la audiencia creerá a la forma.',
                                            'Si no tienes evidencia, escribe: “No tengo evidencia reciente.”'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>

                                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 md:p-6">
                                    <p className="text-sm text-emerald-800 leading-relaxed">
                                        Esta sección es informativa. En el primer ingreso todos los usuarios la verán completa; desde el segundo ingreso retomarán
                                        automáticamente la última página guardada.
                                    </p>
                                </section>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => savePage(2)}
                                        className="rounded-xl bg-blue-700 text-white px-6 py-3 text-sm font-bold hover:bg-blue-600 transition-colors"
                                    >
                                        Guardar página 2
                                    </button>
                                </div>
                            </article>
                        )}

                        {isPageVisible(3) && (
                            <article
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 3 de 5"
                                data-print-title="Lenguaje corporal ejecutivo"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Lenguaje corporal ejecutivo
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Desarrolla una presencia corporal ejecutiva clara, estable y congruente para proyectar seguridad tranquila, autoridad sin
                                        rigidez y mayor capacidad de sostener atención, confianza y credibilidad.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Lenguaje corporal ejecutivo: señales posturales, gestuales, espaciales y visuales que impactan percepción de seguridad, claridad y autoridad.',
                                            'Alineación corporal: coherencia entre postura, mirada, manos, rostro, respiración y dirección del cuerpo.',
                                            'Anclaje postural: base estable desde pies, pelvis, columna y hombros.',
                                            'Apertura corporal: disposición visible que comunica receptividad y confianza.',
                                            'Microconductas no verbales: señales pequeñas de alto impacto (tocarse la cara, cerrar hombros, mover pies, tensión mandibular).',
                                            'Proxémica ejecutiva: uso de espacio, distancia y orientación corporal.',
                                            'Mirada funcional: contacto visual intencional para sostener presencia y marcar ideas.',
                                            'Regulación somática visible: estabilidad observable bajo tensión.',
                                            'Gravitas corporal: solidez y aplomo sin dureza excesiva.',
                                            'Fuga corporal: señales involuntarias que restan credibilidad.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Escaneo de línea base corporal</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    baselineCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {baselineCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Trabaja con una situación real (reunión, presentación o conversación clave). Observa primero cómo llega tu cuerpo antes de
                                            intentar corregirlo.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Registra hechos visibles: base, hombros, mirada, manos, rostro y movimiento, junto con su efecto probable en otros.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión corporal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Lo que observo en mí hoy</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Efecto probable en otros</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {baselineScan.map((row, rowIndex) => (
                                                    <tr key={`wb6-baseline-row-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.observation}
                                                                onChange={(event) => updateBaselineScanRow(rowIndex, 'observation', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Conducta observable"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.effect}
                                                                onChange={(event) => updateBaselineScanRow(rowIndex, 'effect', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Lectura probable en otros"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {baselineLooksAbstract && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: describe conductas visibles (mirada, hombros, manos, postura, movimiento), no solo emociones.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>

                                    {(showBodySketch || isExportingAll) && (
                                        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">Croquis de señales corporales registradas</h4>
                                            <div className="mt-4 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
                                                <div className="rounded-xl border border-blue-200 bg-white p-4">
                                                    <svg viewBox="0 0 240 360" className="w-full h-auto" aria-label="Croquis corporal">
                                                        <circle cx="120" cy="46" r="24" fill="#dbeafe" stroke="#1d4ed8" strokeWidth="2" />
                                                        <line x1="120" y1="70" x2="120" y2="210" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="70" y1="110" x2="170" y2="110" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="120" y1="210" x2="88" y2="300" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="120" y1="210" x2="152" y2="300" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="88" y1="300" x2="74" y2="335" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="152" y1="300" x2="166" y2="335" stroke="#1d4ed8" strokeWidth="3" />
                                                        <circle cx="120" cy="82" r="5" fill="#1d4ed8" />
                                                        <circle cx="120" cy="110" r="5" fill="#1d4ed8" />
                                                        <circle cx="120" cy="145" r="5" fill="#1d4ed8" />
                                                        <circle cx="82" cy="110" r="5" fill="#1d4ed8" />
                                                        <circle cx="158" cy="110" r="5" fill="#1d4ed8" />
                                                        <circle cx="86" cy="306" r="5" fill="#1d4ed8" />
                                                        <circle cx="154" cy="306" r="5" fill="#1d4ed8" />
                                                    </svg>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {BASELINE_DIMENSIONS.map((dimension) => {
                                                        const mapped = baselineMapByDimension[dimension]
                                                        return (
                                                            <div key={`wb6-body-sketch-${dimension}`} className="rounded-xl border border-blue-200 bg-white p-3">
                                                                <p className="text-xs uppercase tracking-[0.12em] text-blue-700 font-semibold">{dimension}</p>
                                                                <p className="mt-1 text-sm text-slate-700">{mapped?.observation || 'Sin observación.'}</p>
                                                                <p className="mt-1 text-xs text-slate-500">{mapped?.effect || 'Sin efecto registrado.'}</p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </article>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz de presencia corporal ejecutiva</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    presenceCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {presenceCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Convierte observación en criterio: identifica conducta observable, evalúa si suma o resta presencia y define un ajuste
                                            corporal concreto.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1060px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Conducta actual observable</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">¿Suma o resta presencia?</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste corporal concreto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {presenceMatrix.map((row, rowIndex) => (
                                                    <tr key={`wb6-presence-row-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.observableBehavior}
                                                                onChange={(event) => updatePresenceMatrixRow(rowIndex, 'observableBehavior', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Conducta visible"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.presenceImpact}
                                                                onChange={(event) => updatePresenceMatrixRow(rowIndex, 'presenceImpact', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="Suma">Suma</option>
                                                                <option value="Resta">Resta</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.concreteAdjustment}
                                                                onChange={(event) => updatePresenceMatrixRow(rowIndex, 'concreteAdjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste corporal específico"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {adjustmentsTooAbstract && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: haz el ajuste más corporal y concreto (pies, hombros, mirada, manos, postura, respiración).
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Semáforo de fugas corporales</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    leakageCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {leakageCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Clasifica señales corporales en verde, amarillo o rojo según su impacto bajo presión para anticipar correcciones antes de que
                                            resten credibilidad.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Señal corporal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nivel</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Cuándo aparece</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué lectura puede generar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leakageTraffic.map((row, rowIndex) => (
                                                    <tr key={`wb6-leakage-row-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.signal}
                                                                onChange={(event) => updateLeakageTrafficRow(rowIndex, 'signal', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.level}
                                                                onChange={(event) => updateLeakageTrafficRow(rowIndex, 'level', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="Verde">Verde</option>
                                                                <option value="Amarillo">Amarillo</option>
                                                                <option value="Rojo">Rojo</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.whenAppears}
                                                                onChange={(event) => updateLeakageTrafficRow(rowIndex, 'whenAppears', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.generatedReading}
                                                                onChange={(event) => updateLeakageTrafficRow(rowIndex, 'generatedReading', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Protocolo de entrada corporal a espacios ejecutivos</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    entryCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {entryCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Diseña tu entrada corporal antes de hablar: cómo entras, cómo te ubicas, cómo tomas el espacio y qué señal de presencia dejas
                                            instalada.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Mi entrada corporal ideal es</span>
                                            <textarea
                                                rows={2}
                                                value={entryProtocol.idealEntry}
                                                onChange={(event) => updateEntryProtocol('idealEntry', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Mi forma de ubicarme en el espacio será</span>
                                            <textarea
                                                rows={2}
                                                value={entryProtocol.positioning}
                                                onChange={(event) => updateEntryProtocol('positioning', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Mi criterio para ocupar el espacio será</span>
                                            <textarea
                                                rows={2}
                                                value={entryProtocol.spaceCriteria}
                                                onChange={(event) => updateEntryProtocol('spaceCriteria', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Manos, mirada y dispositivos en los primeros 20 segundos</span>
                                            <textarea
                                                rows={2}
                                                value={entryProtocol.first20Seconds}
                                                onChange={(event) => updateEntryProtocol('first20Seconds', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. La señal corporal que quiero dejar instalada es</span>
                                            <input
                                                type="text"
                                                value={entryProtocol.signalToInstall}
                                                onChange={(event) => updateEntryProtocol('signalToInstall', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {entryProtocolMissing && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: define cómo entrarás y tomarás el espacio antes de hablar.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Patrón corporal de autoridad tranquila</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep5(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    authorityPatternCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {authorityPatternCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Define tu patrón corporal estándar para cuatro momentos: cuando estás centrado, cuando escuchas, cuando aparece objeción y
                                            cuando necesitas volver al centro.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Cuando estoy centrado, mi cuerpo se ve así</span>
                                            <textarea
                                                rows={2}
                                                value={calmAuthorityPattern.centeredBody}
                                                onChange={(event) => updateCalmAuthorityPattern('centeredBody', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Cuando escucho, mi cuerpo se ve así</span>
                                            <textarea
                                                rows={2}
                                                value={calmAuthorityPattern.listeningBody}
                                                onChange={(event) => updateCalmAuthorityPattern('listeningBody', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Cuando aparece una objeción, mi cuerpo debe hacer esto</span>
                                            <textarea
                                                rows={2}
                                                value={calmAuthorityPattern.objectionBody}
                                                onChange={(event) => updateCalmAuthorityPattern('objectionBody', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Si detecto una fuga corporal, vuelvo al centro haciendo esto</span>
                                            <textarea
                                                rows={2}
                                                value={calmAuthorityPattern.returnToCenter}
                                                onChange={(event) => updateCalmAuthorityPattern('returnToCenter', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {missingListeningInPattern && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: incluye explícitamente cómo se ve tu cuerpo cuando escuchas, no solo cuando hablas.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de coherencia corporal ejecutiva</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep6(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    coherenceCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {coherenceCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Evalúa una reunión reciente o simulación. Marca desde evidencia si tu cuerpo reforzó el mensaje o lo contradijo en momentos
                                            críticos.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {coherenceTest.map((row, rowIndex) => (
                                                    <tr key={`wb6-coherence-row-${row.question}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-coherence-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updateCoherenceTestRow(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-coherence-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updateCoherenceTestRow(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateCoherenceTestRow(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste necesario"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 6')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre de la sección</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Qué señales corporales hoy fortalecen mi presencia.',
                                            'Qué fugas no verbales debilitan mi autoridad.',
                                            'Cómo entro y tomo el espacio en contextos ejecutivos.',
                                            'Qué patrón corporal quiero instalar como estándar.',
                                            'Cómo hacer que mi cuerpo acompañe y no contradiga mi mensaje.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                bodySectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : bodySectionMinimal
                                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {bodySectionCompleted
                                                ? 'Sección completada'
                                                : bodySectionMinimal
                                                  ? 'Pendiente (falta completar bloques)'
                                                  : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(3)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 3
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(4) && (
                            <article
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 4 de 5"
                                data-print-title="Manejo de objeciones"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 4</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Manejo de objeciones</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Responde objeciones con claridad, estabilidad y criterio para sostener presencia ejecutiva, proteger la confianza
                                        conversacional y convertir fricción en precisión y avance.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Objeción: duda, resistencia, desacuerdo, riesgo percibido o falta de claridad frente a una propuesta.',
                                            'Manejo de objeciones: recibir, leer, ordenar y responder sin defensividad.',
                                            'Tipos de objeción: contenido, proceso, confianza e identidad/estatus.',
                                            'Carga emocional: nivel de tensión afectiva que acompaña el cuestionamiento.',
                                            'Escucha desagregada: separar lo factual, lo emocional y lo político.',
                                            'Respuesta puente: intervención breve para estabilizar antes de argumentar.',
                                            'Reencuadre: convertir objeción en criterio útil o condición de calidad.',
                                            'Verificación de avance: confirmar si la objeción quedó atendida o cambió de forma.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Cartografía de objeciones recurrentes</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowObjectionExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    objectionCartographyCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {objectionCartographyCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Trabaja con situaciones reales de los últimos 20 días (reuniones de alto nivel, presentaciones, conversaciones con sponsor
                                            o momentos en los que una objeción te desordenó).
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Antes de responder, registra la objeción y su impacto con hechos observables:
                                        </p>
                                        <ul className="space-y-2">
                                            {[
                                                'Objeción concreta recibida.',
                                                'Tipo de objeción (contenido, proceso, confianza o estatus).',
                                                'Qué activó en ti y cómo respondiste.',
                                                'Qué efecto produjo tu respuesta.',
                                                'Qué habría sido más efectivo.'
                                            ].map((item) => (
                                                <li key={`wb6-obj-step1-instruction-${item}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1320px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Objeción concreta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tipo de objeción</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué activó en mí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Cómo respondí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Efecto de mi respuesta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué habría sido más efectivo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {objectionCartography.map((row, rowIndex) => (
                                                    <tr key={`wb6-objection-cartography-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.objection}
                                                                onChange={(event) => updateObjectionCartographyRow(rowIndex, 'objection', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.objectionType}
                                                                onChange={(event) => updateObjectionCartographyRow(rowIndex, 'objectionType', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona tipo</option>
                                                                {OBJECTION_TYPES.map((option) => (
                                                                    <option key={`wb6-objection-type-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.whatActivatedMe}
                                                                onChange={(event) => updateObjectionCartographyRow(rowIndex, 'whatActivatedMe', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.response}
                                                                onChange={(event) => updateObjectionCartographyRow(rowIndex, 'response', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.responseEffect}
                                                                onChange={(event) => updateObjectionCartographyRow(rowIndex, 'responseEffect', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.betterResponse}
                                                                onChange={(event) => updateObjectionCartographyRow(rowIndex, 'betterResponse', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {objectionMissingTypeBeforeResponse && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: clasifica primero la objeción (contenido, proceso, confianza o estatus) antes de responder.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveObjectionBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Diagnóstico de la objeción</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep2(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Escucha la objeción en tres capas para no responder en automático: capa explícita (lo que dijo), capa emocional (cómo lo dijo)
                                            y capa de fondo (qué riesgo/interés protege).
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Define también cuál capa responderás primero para ganar avance conversacional.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Lo que dijo literalmente</span>
                                            <textarea
                                                rows={2}
                                                value={objectionDiagnosis.literal}
                                                onChange={(event) => updateObjectionDiagnosis('literal', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué emoción o intensidad acompañaba la objeción</span>
                                            <textarea
                                                rows={2}
                                                value={objectionDiagnosis.emotionalIntensity}
                                                onChange={(event) => updateObjectionDiagnosis('emotionalIntensity', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué podría estar protegiendo realmente</span>
                                            <textarea
                                                rows={2}
                                                value={objectionDiagnosis.whatItProtects}
                                                onChange={(event) => updateObjectionDiagnosis('whatItProtects', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Capa que debo responder primero</span>
                                            <input
                                                type="text"
                                                value={objectionDiagnosis.firstLayerToRespond}
                                                onChange={(event) => updateObjectionDiagnosis('firstLayerToRespond', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveObjectionBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Protocolo ejecutivo de respuesta</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep3(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Usa esta secuencia para responder con estabilidad: recibir, aclarar, reconocer, responder y verificar avance.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            El foco es no sobrerreaccionar: primero ordenas la conversación y luego argumentas.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Recibiré la objeción así</span>
                                            <textarea
                                                rows={2}
                                                value={objectionProtocol.receive}
                                                onChange={(event) => updateObjectionProtocol('receive', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Mi pregunta de aclaración será</span>
                                            <textarea
                                                rows={2}
                                                value={objectionProtocol.clarificationQuestion}
                                                onChange={(event) => updateObjectionProtocol('clarificationQuestion', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Mi reconocimiento será</span>
                                            <textarea
                                                rows={2}
                                                value={objectionProtocol.recognition}
                                                onChange={(event) => updateObjectionProtocol('recognition', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Mi respuesta focal será</span>
                                            <textarea
                                                rows={2}
                                                value={objectionProtocol.focalResponse}
                                                onChange={(event) => updateObjectionProtocol('focalResponse', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. Mi verificación de avance será</span>
                                            <textarea
                                                rows={2}
                                                value={objectionProtocol.advanceVerification}
                                                onChange={(event) => updateObjectionProtocol('advanceVerification', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {focalResponseTooLong && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: reduce la respuesta focal a una idea central y un criterio claro.
                                        </p>
                                    )}
                                    {objectionMissingAdvanceVerification && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: incluye cómo comprobarás si la objeción quedó atendida.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveObjectionBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Banco de respuestas puente</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep4(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Diseña respuestas puente para estabilizar la interacción antes de ir al fondo técnico.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Una buena respuesta puente baja fricción, aumenta precisión y evita responder desde defensividad.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[860px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Escenario</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Mi respuesta puente</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {objectionBridgeBank.map((row, rowIndex) => (
                                                    <tr key={`wb6-objection-bridge-${row.scenario}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.scenario}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.bridgeResponse}
                                                                onChange={(event) => updateObjectionBridgeRow(rowIndex, 'bridgeResponse', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveObjectionBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Laboratorio de reencuadre</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep5(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Convierte objeciones en información útil: criterio, condición de calidad, pregunta clave o mejora del planteamiento.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Si el reencuadre no mejora tu propuesta, todavía no capturaste el valor de la objeción.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Objeción original</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Reencuadre útil</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué mejora en mi propuesta</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {objectionReframeLab.map((row, rowIndex) => (
                                                    <tr key={`wb6-objection-reframe-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.originalObjection}
                                                                onChange={(event) => updateObjectionReframeRow(rowIndex, 'originalObjection', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.usefulReframe}
                                                                onChange={(event) => updateObjectionReframeRow(rowIndex, 'usefulReframe', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.proposalImprovement}
                                                                onChange={(event) => updateObjectionReframeRow(rowIndex, 'proposalImprovement', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {objectionReframeWithoutImprovement && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: aclara qué criterio útil o mejora concreta te deja esa objeción.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveObjectionBlock('Paso 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de manejo ejecutivo de objeciones</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep6(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Aplica este test sobre una conversación reciente o una simulación para evaluar claridad, estabilidad y avance real.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            No marques desde intención: marca desde evidencia observable de cómo respondiste.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {objectionExecutiveTest.map((row, rowIndex) => (
                                                    <tr key={`wb6-objection-test-${row.question}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-objection-test-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updateObjectionExecutiveTestRow(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-objection-test-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updateObjectionExecutiveTestRow(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateObjectionExecutiveTestRow(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste necesario"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveObjectionBlock('Paso 6')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre de la sección</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Qué tipos de objeciones enfrento con más frecuencia.',
                                            'Qué capa de la objeción debo leer antes de responder.',
                                            'Cómo usar una secuencia más ejecutiva y menos reactiva.',
                                            'Cómo transformar objeciones en criterios útiles.',
                                            'Cómo sostener autoridad sin perder escucha ni confianza.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                objectionSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : objectionSectionMinimal
                                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {objectionSectionCompleted
                                                ? 'Sección completada'
                                                : objectionSectionMinimal
                                                  ? 'Pendiente (falta completar bloques)'
                                                  : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(4)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 4
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(5) && (
                            <article
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 5 de 5"
                                data-print-title="Tono y ritmo de voz"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 5</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Tono y ritmo de voz</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Fortalece el uso estratégico de la voz para proyectar claridad, calma, autoridad y control conversacional, regulando tono,
                                        ritmo, pausas y énfasis en contextos ejecutivos.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Tono basal: frecuencia vocal predominante que influye en percepción de seguridad o tensión.',
                                            'Rango tonal: amplitud de variación para evitar monotonía o dramatización.',
                                            'Ritmo ejecutivo y cadencia: velocidad y continuidad que facilitan comprensión.',
                                            'Pausa funcional: silencio intencional para enfatizar, ordenar y respirar.',
                                            'Énfasis vocal: acentuación de palabras clave para jerarquizar ideas.',
                                            'Volumen operativo y articulación: presencia suficiente y pronunciación clara.',
                                            'Prosodia ejecutiva: integración de tono, ritmo, pausas y acentos con dirección.',
                                            'Congruencia paraverbal: coherencia entre contenido y forma de la voz.',
                                            'Compresión vocal por presión: aceleración, rigidez o subida de tono bajo estrés.',
                                            'Gravitas vocal: peso, calma y autoridad sin apuro.'
                                        ].map((item) => (
                                            <li key={`wb6-voice-concept-${item}`} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Línea base vocal ejecutiva</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowVoiceExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    voiceBaselineCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {voiceBaselineCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Usa una situación real (reunión, presentación, videollamada o respuesta a objeción). Primero observa cómo suena tu voz hoy,
                                            sin corregir todavía.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Evalúa tono predominante, velocidad, volumen, articulación, pausas, énfasis y cierre de frase.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[920px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión vocal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Lo que observo en mí hoy</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Efecto probable en otros</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {voiceBaseline.map((row, rowIndex) => (
                                                    <tr key={`wb6-voice-baseline-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.observation}
                                                                onChange={(event) => updateVoiceBaselineRow(rowIndex, 'observation', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.effect}
                                                                onChange={(event) => updateVoiceBaselineRow(rowIndex, 'effect', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {voiceBaselineLooksAbstract && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: describe conductas vocales observables (tono, velocidad, volumen, pausas, articulación), no solo emociones.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVoiceBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz de calibración vocal</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep2(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Convierte observación en criterio técnico: identifica la conducta vocal actual, evalúa si suma/resta impacto y define un
                                            ajuste concreto.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1120px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Conducta vocal observable</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">¿Suma o resta?</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste vocal concreto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {voiceCalibration.map((row, rowIndex) => (
                                                    <tr key={`wb6-voice-calibration-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.observablePattern}
                                                                onChange={(event) => updateVoiceCalibrationRow(rowIndex, 'observablePattern', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.impact}
                                                                onChange={(event) => updateVoiceCalibrationRow(rowIndex, 'impact', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="Suma">Suma</option>
                                                                <option value="Resta">Resta</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.concreteAdjustment}
                                                                onChange={(event) => updateVoiceCalibrationRow(rowIndex, 'concreteAdjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVoiceBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Partitura vocal del mensaje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep3(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Toma un mensaje de 30–60 segundos y marca cómo debe sonar: palabras ancla, pausas funcionales, cierres firmes, puntos de
                                            energía y riesgos vocales.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Mensaje base</span>
                                            <textarea
                                                rows={2}
                                                value={voicePartiture.baseMessage}
                                                onChange={(event) => updateVoicePartiture('baseMessage', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Palabras ancla (máximo 5)</span>
                                            <input
                                                type="text"
                                                value={voicePartiture.anchorWords}
                                                onChange={(event) => updateVoicePartiture('anchorWords', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Pausas funcionales (dónde irían)</span>
                                            <input
                                                type="text"
                                                value={voicePartiture.functionalPauses}
                                                onChange={(event) => updateVoicePartiture('functionalPauses', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Cierres con tono firme</span>
                                            <input
                                                type="text"
                                                value={voicePartiture.firmClosures}
                                                onChange={(event) => updateVoicePartiture('firmClosures', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Puntos donde debo elevar energía sin acelerar</span>
                                            <input
                                                type="text"
                                                value={voicePartiture.energyPoints}
                                                onChange={(event) => updateVoicePartiture('energyPoints', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Riesgos vocales a vigilar</span>
                                            <input
                                                type="text"
                                                value={voicePartiture.vocalRisks}
                                                onChange={(event) => updateVoicePartiture('vocalRisks', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {voiceAnchorWordsMissing && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: marca qué palabras deben sonar con más peso para organizar la atención.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVoiceBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Protocolo de voz bajo presión</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep4(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Define cómo te regularás cuando aparezca tensión: señal temprana, disparador, acción vocal inmediata y frase de reanclaje.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Señal vocal temprana</span>
                                            <input
                                                type="text"
                                                value={voicePressureProtocol.earlySignal}
                                                onChange={(event) => updateVoicePressureProtocol('earlySignal', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Contexto donde aparece</span>
                                            <input
                                                type="text"
                                                value={voicePressureProtocol.triggerContext}
                                                onChange={(event) => updateVoicePressureProtocol('triggerContext', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Acción reguladora inmediata</span>
                                            <textarea
                                                rows={2}
                                                value={voicePressureProtocol.regulationAction}
                                                onChange={(event) => updateVoicePressureProtocol('regulationAction', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Frase de reanclaje vocal</span>
                                            <input
                                                type="text"
                                                value={voicePressureProtocol.reanchoringPhrase}
                                                onChange={(event) => updateVoicePressureProtocol('reanchoringPhrase', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {voiceProtocolActionTooAbstract && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: define qué harás con pausa, tono, respiración, velocidad o volumen.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVoiceBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Escalera de modulación por contexto</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep5(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Modula tu voz por contexto sin perder identidad. Ajusta tono, velocidad, volumen, pausas y énfasis para cada escenario.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1100px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Contexto</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tono</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Velocidad</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Volumen</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pausas</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Énfasis</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {voiceLadder.map((row, rowIndex) => (
                                                    <tr key={`wb6-voice-ladder-${row.context}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.context}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.tone}
                                                                onChange={(event) => updateVoiceLadderRow(rowIndex, 'tone', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona tono</option>
                                                                {VOICE_TONE_OPTIONS.map((option) => (
                                                                    <option key={`wb6-tone-option-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.speed}
                                                                onChange={(event) => updateVoiceLadderRow(rowIndex, 'speed', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona velocidad</option>
                                                                {VOICE_SPEED_OPTIONS.map((option) => (
                                                                    <option key={`wb6-speed-option-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.volume}
                                                                onChange={(event) => updateVoiceLadderRow(rowIndex, 'volume', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona volumen</option>
                                                                {VOICE_VOLUME_OPTIONS.map((option) => (
                                                                    <option key={`wb6-volume-option-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.pauses}
                                                                onChange={(event) => updateVoiceLadderRow(rowIndex, 'pauses', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona pausas</option>
                                                                {VOICE_PAUSE_OPTIONS.map((option) => (
                                                                    <option key={`wb6-pause-option-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.emphasis}
                                                                onChange={(event) => updateVoiceLadderRow(rowIndex, 'emphasis', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona énfasis</option>
                                                                {VOICE_EMPHASIS_OPTIONS.map((option) => (
                                                                    <option key={`wb6-emphasis-option-${option}`} value={option}>
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
                                    {voiceLadderSameAcrossContexts && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: ajusta la modulación según espacio y audiencia; evitar el mismo patrón en todos los contextos mejora impacto.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVoiceBlock('Paso 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de impacto vocal ejecutivo</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep6(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Evalúa una intervención real o simulada. Marca desde evidencia: cómo sonó tu voz y qué efecto produjo.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {voiceExecutiveTest.map((row, rowIndex) => (
                                                    <tr key={`wb6-voice-test-${row.question}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-voice-test-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updateVoiceExecutiveTestRow(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-voice-test-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updateVoiceExecutiveTestRow(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateVoiceExecutiveTestRow(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste necesario"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVoiceBlock('Paso 6')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre de la sección</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Cómo suena hoy tu voz en contextos ejecutivos.',
                                            'Qué patrones vocales fortalecen o debilitan tu presencia.',
                                            'Cómo diseñar una partitura vocal para mensajes importantes.',
                                            'Cómo regular tu voz cuando aparece presión.',
                                            'Cómo modular tono y ritmo según contexto sin perder autenticidad.'
                                        ].map((item) => (
                                            <li key={`wb6-voice-close-${item}`} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                voiceSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : voiceSectionMinimal
                                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {voiceSectionCompleted
                                                ? 'Sección completada'
                                                : voiceSectionMinimal
                                                  ? 'Pendiente (falta completar bloques)'
                                                  : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(5)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 5
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {showBodyHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Lenguaje corporal ejecutivo</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Lenguaje corporal ejecutivo no es actuar: es ordenar postura, mirada, gesto y espacio.</p>
                                        <p>• La autoridad tranquila se transmite por estabilidad y coherencia, no por rigidez.</p>
                                        <p>• Tu cuerpo debe reforzar el mensaje, no competir con él.</p>
                                        <p>• Detectar fugas corporales temprano evita pérdida de credibilidad en espacios de alto nivel.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Escaneo de línea base)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[820px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Lo que observo hoy</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Efecto probable</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_BASELINE_SCAN.map((row) => (
                                                    <tr key={`wb6-modal-step1-${row.dimension}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.dimension}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.observation}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.effect}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Matriz de presencia)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[920px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Conducta observable</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Impacto</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Ajuste concreto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_PRESENCE_MATRIX.map((row) => (
                                                    <tr key={`wb6-modal-step2-${row.dimension}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.dimension}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.observableBehavior}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.presenceImpact}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.concreteAdjustment}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Semáforo de fugas)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        {EXAMPLE_LEAKAGE_TRAFFIC.map((row, index) => (
                                            <p key={`wb6-modal-step3-${index}`}>
                                                <span className="font-semibold">{row.signal}</span> · {row.level} · {row.whenAppears} · {row.generatedReading}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Protocolo de entrada)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Entrada ideal:</span> {EXAMPLE_ENTRY_PROTOCOL.idealEntry}</p>
                                        <p><span className="font-semibold">Ubicación:</span> {EXAMPLE_ENTRY_PROTOCOL.positioning}</p>
                                        <p><span className="font-semibold">Criterio de espacio:</span> {EXAMPLE_ENTRY_PROTOCOL.spaceCriteria}</p>
                                        <p><span className="font-semibold">Primeros 20 segundos:</span> {EXAMPLE_ENTRY_PROTOCOL.first20Seconds}</p>
                                        <p><span className="font-semibold">Señal inicial:</span> {EXAMPLE_ENTRY_PROTOCOL.signalToInstall}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep5 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 5 (Patrón corporal)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep5(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Centrado:</span> {EXAMPLE_AUTHORITY_PATTERN.centeredBody}</p>
                                        <p><span className="font-semibold">Escucha:</span> {EXAMPLE_AUTHORITY_PATTERN.listeningBody}</p>
                                        <p><span className="font-semibold">Objeción:</span> {EXAMPLE_AUTHORITY_PATTERN.objectionBody}</p>
                                        <p><span className="font-semibold">Vuelta al centro:</span> {EXAMPLE_AUTHORITY_PATTERN.returnToCenter}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep6 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 6 (Test de coherencia)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep6(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p><span className="font-semibold">Señal débil:</span> explicar calma mientras el cuerpo se mueve sin parar.</p>
                                        <p><span className="font-semibold">Señal mejorada:</span> sostener idea con torso estable, manos visibles y respiración regulada.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Manejo de objeciones</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Una objeción no siempre es ataque: muchas veces contiene riesgo, confianza o necesidad de precisión.</p>
                                        <p>• No todas las objeciones se responden igual: primero diagnostica tipo y capa, luego responde.</p>
                                        <p>• Usa secuencia ejecutiva: recibir, aclarar, reconocer, responder y verificar avance.</p>
                                        <p>• La calidad de la respuesta combina escucha, foco, criterio y verificación final.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Cartografía de objeciones)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1240px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Objeción</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Tipo</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Qué activó en mí</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Cómo respondí</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Efecto</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Más efectivo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_OBJECTION_CARTOGRAPHY.map((row, rowIndex) => (
                                                    <tr key={`wb6-objection-modal-step1-${rowIndex}`}>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.objection}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.objectionType}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.whatActivatedMe}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.response}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.responseEffect}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.betterResponse}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Diagnóstico de la objeción)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Lo que dijo literalmente:</span> {EXAMPLE_OBJECTION_DIAGNOSIS.literal}</p>
                                        <p><span className="font-semibold">Emoción / intensidad:</span> {EXAMPLE_OBJECTION_DIAGNOSIS.emotionalIntensity}</p>
                                        <p><span className="font-semibold">Qué podría estar protegiendo:</span> {EXAMPLE_OBJECTION_DIAGNOSIS.whatItProtects}</p>
                                        <p><span className="font-semibold">Capa a responder primero:</span> {EXAMPLE_OBJECTION_DIAGNOSIS.firstLayerToRespond}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Protocolo ejecutivo)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Recibir:</span> {EXAMPLE_OBJECTION_PROTOCOL.receive}</p>
                                        <p><span className="font-semibold">Aclarar:</span> {EXAMPLE_OBJECTION_PROTOCOL.clarificationQuestion}</p>
                                        <p><span className="font-semibold">Reconocer:</span> {EXAMPLE_OBJECTION_PROTOCOL.recognition}</p>
                                        <p><span className="font-semibold">Responder:</span> {EXAMPLE_OBJECTION_PROTOCOL.focalResponse}</p>
                                        <p><span className="font-semibold">Verificar avance:</span> {EXAMPLE_OBJECTION_PROTOCOL.advanceVerification}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Banco de respuestas puente)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[760px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Escenario</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Respuesta puente</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_BRIDGE_BANK.map((row) => (
                                                    <tr key={`wb6-objection-modal-step4-${row.scenario}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.scenario}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.bridgeResponse}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionExampleStep5 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 5 (Laboratorio de reencuadre)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep5(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Objeción original</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Reencuadre útil</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Qué mejora</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_REFRAME_LAB.map((row, rowIndex) => (
                                                    <tr key={`wb6-objection-modal-step5-${rowIndex}`}>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.originalObjection}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.usefulReframe}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.proposalImprovement}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionExampleStep6 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 6 (Test ejecutivo)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep6(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>
                                            <span className="font-semibold">Señal débil:</span> recibir una objeción como ataque y responder desde
                                            justificación acelerada.
                                        </p>
                                        <p>
                                            <span className="font-semibold">Señal mejorada:</span> aclarar primero, reconocer la preocupación central
                                            y responder con foco y verificación final.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Tono y ritmo de voz</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• La voz ejecutiva no es sonar grave: es sonar clara, estable y bien dosificada.</p>
                                        <p>• El ritmo útil no siempre es más lento; es más procesable para tu audiencia.</p>
                                        <p>• La pausa funcional es herramienta de autoridad, no vacío.</p>
                                        <p>• Una buena modulación vocal organiza la atención y aumenta credibilidad.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Línea base vocal)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[900px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Observación</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Efecto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_VOICE_BASELINE.map((row) => (
                                                    <tr key={`wb6-voice-modal-step1-${row.dimension}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.dimension}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.observation}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.effect}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Calibración vocal)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Conducta</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Impacto</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Ajuste</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_VOICE_CALIBRATION.map((row) => (
                                                    <tr key={`wb6-voice-modal-step2-${row.dimension}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.dimension}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.observablePattern}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.impact}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.concreteAdjustment}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Partitura vocal)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Mensaje base:</span> {EXAMPLE_VOICE_PARTITURE.baseMessage}</p>
                                        <p><span className="font-semibold">Palabras ancla:</span> {EXAMPLE_VOICE_PARTITURE.anchorWords}</p>
                                        <p><span className="font-semibold">Pausas funcionales:</span> {EXAMPLE_VOICE_PARTITURE.functionalPauses}</p>
                                        <p><span className="font-semibold">Cierres firmes:</span> {EXAMPLE_VOICE_PARTITURE.firmClosures}</p>
                                        <p><span className="font-semibold">Puntos de energía:</span> {EXAMPLE_VOICE_PARTITURE.energyPoints}</p>
                                        <p><span className="font-semibold">Riesgos vocales:</span> {EXAMPLE_VOICE_PARTITURE.vocalRisks}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Voz bajo presión)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Señal temprana:</span> {EXAMPLE_VOICE_PRESSURE_PROTOCOL.earlySignal}</p>
                                        <p><span className="font-semibold">Contexto:</span> {EXAMPLE_VOICE_PRESSURE_PROTOCOL.triggerContext}</p>
                                        <p><span className="font-semibold">Acción reguladora:</span> {EXAMPLE_VOICE_PRESSURE_PROTOCOL.regulationAction}</p>
                                        <p><span className="font-semibold">Frase de reanclaje:</span> {EXAMPLE_VOICE_PRESSURE_PROTOCOL.reanchoringPhrase}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceExampleStep5 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 5 (Escalera de modulación)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep5(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Contexto</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Tono</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Velocidad</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Volumen</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Pausas</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Énfasis</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_VOICE_LADDER.map((row) => (
                                                    <tr key={`wb6-voice-modal-step5-${row.context}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.context}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.tone}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.speed}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.volume}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.pauses}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.emphasis}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceExampleStep6 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 6 (Test de impacto vocal)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep6(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>
                                            <span className="font-semibold">Señal débil:</span> decir una recomendación importante con la voz acelerada y sin pausas.
                                        </p>
                                        <p>
                                            <span className="font-semibold">Señal mejorada:</span> bajar medio punto la velocidad, marcar dos pausas y cerrar la
                                            frase con tono firme.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb6-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
                                <button type="button" onClick={goPrevPage} disabled={!hasPrevPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavPrev}>
                                    <ArrowLeft size={15} />
                                    {WORKBOOK_V2_EDITORIAL.labels.back}
                                </button>

                                <div className="text-center">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.navigation}</p>
                                    <p className="text-sm font-bold text-slate-900">{PAGES[currentPageIndex]?.shortLabel ?? 'Página'}</p>
                                </div>

                                <button type="button" onClick={goNextPage} disabled={!hasNextPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavNext}>
                                    {WORKBOOK_V2_EDITORIAL.labels.next}
                                    <ArrowRight size={15} />
                                </button>
                            </nav>
                        )}
                    </section>
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 14mm;
                    }
                    .wb6-toolbar,
                    .wb6-sidebar,
                    .wb6-page-nav {
                        display: none !important;
                    }
                    button {
                        display: none !important;
                    }
                    body {
                        background: #fff !important;
                    }
                    main {
                        padding: 0 !important;
                    }
                    main > div {
                        display: block !important;
                        min-width: 0 !important;
                    }
                    .wb6-print-page {
                        position: relative !important;
                        padding-top: 14mm !important;
                        border-top: 3px solid #1d4ed8 !important;
                    }
                    .wb6-print-page:not(.wb6-cover-page)::before {
                        content: "WB6 · Lenguaje verbal y no verbal de impacto · " attr(data-print-title);
                        position: absolute;
                        top: 2mm;
                        left: 0;
                        right: 0;
                        padding-bottom: 2mm;
                        border-bottom: 1px solid #cbd5e1;
                        font-size: 10px;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        font-weight: 700;
                        color: #1e3a8a;
                    }
                    .wb6-print-page::after {
                        content: attr(data-print-page) " · " attr(data-print-meta);
                        position: absolute;
                        left: 2mm;
                        right: 2mm;
                        bottom: 2mm;
                        font-size: 10px;
                        font-weight: 600;
                        color: #64748b;
                    }
                    .wb6-cover-page {
                        padding-top: 0 !important;
                        border-top: 4px solid #0f172a !important;
                    }
                    .wb6-cover-page::before {
                        content: none !important;
                    }
                    .wb6-cover-hero {
                        min-height: 240mm !important;
                        background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%) !important;
                    }
                    input,
                    textarea,
                    select {
                        border: 1px solid #cbd5e1 !important;
                        background: #fff !important;
                        color: #0f172a !important;
                    }
                    article.rounded-3xl {
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    )
}
