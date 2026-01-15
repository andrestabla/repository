import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { GeminiService } from '@/lib/gemini'
import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 60 // Allow longer timeout for generation

type CompilationType = 'dossier' | 'matrix' | 'toolkit'

export async function POST(request: NextRequest) {
    try {
        const { type, version, message } = await request.json() as { type: CompilationType, version?: string, message?: string }

        // 1. Fetch Validated Assets
        const whereClause: any = { status: 'Validado' }
        if (version) whereClause.version = version

        const items = await prisma.contentItem.findMany({
            where: whereClause,

        })

        if (items.length === 0) {
            return NextResponse.json({ error: 'No hay activos validados disponibles para compilar.' }, { status: 400 })
        }

        // 2. Prepare Context
        const assetsContext = items.map((item, index) => `
        [ASSET ${index + 1}]
        ID: ${item.id}
        TÍTULO: ${item.title}
        PILAR: ${item.primaryPillar} (${(item.secondaryPillars as string[])?.join(', ')})
        TIPO: ${item.type} | COMPETENCIA: ${item.competence}
        RESUMEN ESTRATÉGICO: ${item.observations || 'Sin descripción detallada.'}
        `).join('\n')

        // 3. Define Prompt based on Type
        let prompt = ''

        // Auth: Use System Settings first, then env var
        const { SystemSettingsService } = await import('@/lib/settings')
        let apiKey = await SystemSettingsService.getGeminiApiKey()
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY || ''

        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API Key not configured in Settings or Environment' }, { status: 500 })
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) // Upgrading to 2.0 Flash (confirmed available)

        if (message) {
            prompt = `
             Actúa como un ASISTENTE DE INVESTIGACIÓN INTELIGENTE (estilo NotebookLM).
             Tienes acceso total al inventario de activos de la organización (Contexto abajo).
             
             TU TAREA:
             Responde a la solicitud del usuario basándote EXCLUSIVAMENTE en los activos validados proporcionados.
             
             SOLICITUD DEL USUARIO:
             "${message}"
             
             PAUTAS ESTRICTAS:
             1. **GROUNDING (Rigor):** No inventes información. Si no está en los activos, dilo.
             2. **CITAS:** Cada afirmación clave debe tener una cita entre corchetes, ej: "El liderazgo comienza dentro [Fuente: Shine Within MasterClass]".
             3. **ESTILO:** Profesional pero conversacional, directo y sintético.
             4. **FORMATO:** Markdown limpio. Negritas para conceptos clave.
             5. **PREGUNTAS SUGERIDAS:** Al final, obligatoriamente sugiere 3 preguntas de profundización que el usuario podría hacer a continuación.

             CONTEXTO DE ACTIVOS (Source of Truth):
             ${assetsContext}
             `
        } else if (type === 'dossier') {
            prompt = `
            Actúa como un CONSULTOR ESTRATÉGICO SENIOR. Genera un **DOSSIER EJECUTIVO** para B2B.

            INSTRUCCIONES:
            1. **Intro Ejecutiva**: Sintetiza el valor de la metodología.
            2. **Desglose por Pilar**: Resumen narrativo de Shine In, Out, Up, Beyond, CITANDO los activos.
            3. **Impacto**: Conductas observables esperadas.
            4. **Cierre**: Llamado a la acción.
            
            CONTEXTO:
            ${assetsContext}
            `
        } else if (type === 'matrix') {
            prompt = `
            Actúa como ANALISTA DE DATOS. Genera una **MATRIZ DE TRAZABILIDAD** en JSON.
            
            JSON ESTRUCTURA: Array de objetos { "id", "titulo", "pilar", "nivel_impacto", "ruta_aprendizaje" }.
            SIN MARKDOWN TEXTUAL, SOLO JSON.
            
            CONTEXTO:
            ${assetsContext}
            `
        } else if (type === 'toolkit') {
            prompt = `
            Actúa como ARQUITECTO DE INFORMACIÓN. Diseña la **ESTRUCTURA DE CARPETAS (Toolkit)**.
            Agrupa lógicamente. Formato árbol (tree). Añade notas breves. Sugiere 3 Gaps.
            
            CONTEXTO:
            ${assetsContext}
            `
        } else if (type === 'podcast') {
            prompt = `
            Actúa como un GUIONISTA DE PODCAST DE ALTO NIVEL (Estilo "Deep Dive" de NotebookLM).
            Genera un GUION DE AUDIO para dos anfitriones (Host y Experto) que discuten esta metodología.

            PERSONAJES:
            - **HOST (Curioso, entusiasta):** Hace las preguntas que todos tienen, usa analogías simples, se sorprende.
            - **EXPERTO (Analítico, profundo):** Conecta los puntos, explica el "porqué", cita los conceptos de los activos.

            INSTRUCCIONES:
            1. Crea un diálogo fluido, dinámico y entretenido de unos 5-8 minutos de lectura.
            2. **NO** sea robótico. Usa interjecciones ("¡Wow!", "¿En serio?", "Exacto").
            3. Discuten los pilares principales (Shine In/Out/Up/Beyond) basándose REALMENTE en los activos provistos.
            4. Terminan con una reflexión poderosa sobre el "Legado".
            
            FORMATO:
            **HOST:** ...
            **EXPERTO:** ...

            CONTEXTO DE ACTIVOS:
            ${assetsContext}
            `
        }

        // 4. Generate Content
        const result = await model.generateContent(prompt)
        const response = await result.response
        let output = response.text()

        // Clean JSON output if needed
        if (type === 'matrix') {
            output = output.replace(/```json/g, '').replace(/```/g, '').trim()
        }

        return NextResponse.json({
            result: output,
            count: items.length
        })

    } catch (error) {
        console.error('Generator API Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
