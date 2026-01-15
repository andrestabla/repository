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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }) // Use 1.5 Pro to handle large context

        if (message) {
            prompt = `
             Actúa como un ARQUITECTO DE SOLUCIONES Y EXPERTO METODOLÓGICO (4Shine AI).
             Tienes acceso total al inventario de activos de la organización (Contexto abajo).
             
             TU TAREA:
             Responde a la solicitud del usuario generando el entregable o respuesta requerida basándote EXCLUSIVAMENTE en los activos validados proporcionados.
             
             SOLICITUD DEL USUARIO:
             "${message}"
             
             PAUTAS:
             1. Si te piden un "Dossier", genera un documento narrativo ejecutivo.
             2. Si te piden una "Matriz", estructura la respuesta (puede ser en Markdown tables o JSON si lo piden).
             3. Si te piden un "Toolkit", organiza los items lógicamente.
             4. Sé proactivo: Si notas gaps en la metodología, menciónalos constructivamente.
             5. Mantén un tono profesional, "curado" y de alto nivel.
             6. Usa formato Markdown rico (Negritas, Listas, Tablas) para estructurar tu respuesta.

             CONTEXTO DE ACTIVOS (Use this as the source of truth):
             ${assetsContext}
             `
        } else if (type === 'dossier') {
            prompt = `
            Actúa como un CONSULTOR ESTRATÉGICO SENIOR especializado en Diseño Instruccional y Desarrollo Organizacional.
            Tu tarea es generar el contenido para un **DOSSIER EJECUTIVO** de la Metodología 4Shine basado en los activos validados adjuntos.

            OBJETIVO:
            Crear un documento narrativo que venda y explique el valor de la metodología a un cliente corporativo (B2B).

            INSTRUCCIONES:
            1. Escribe una "Introducción Ejecutiva" que sintetice el alcance de estos ${items.length} activos.
            2. Para cada Pilar (Shine In, Out, Up, Beyond), crea un resumen narrativo de qué herramientas tenemos disponibles, citando los títulos de los activos más relevantes.
            3. Redacta una sección de "Impacto Esperado" basada en las conductas observables descritas en los activos.
            4. Utiliza un tono profesional, inspirador y de alto nivel.
            5. Formato de salida: MARKDOWN limpio.
            
            CONTEXTO DE ACTIVOS:
            ${assetsContext}
            `
        } else if (type === 'matrix') {
            prompt = `
            Actúa como un ANALISTA DE DATOS experto.
            Tu tarea es generar una **MATRIZ DE TRAZABILIDAD** en formato JSON estructurado.

            INSTRUCCIONES:
            1. Analiza cada activo y mapea su contribución al modelo.
            2. Genera un ARRAY JSON donde cada objeto represente un activo.
            3. Campos requeridos: "id", "titulo", "pilar", "nivel_impacto" (Calculado por ti: Alto/Medio), "ruta_aprendizaje" (Sugiere: Liderazgo, Comunicación, etc. basado en el contenido).
            4. NO incluyas texto explicativo, SOLO el JSON puro.
            
            CONTEXTO DE ACTIVOS:
            ${assetsContext}
            `
        } else if (type === 'toolkit') {
            prompt = `
            Actúa como un ARQUITECTO DE INFORMACIÓN.
            Tu tarea es diseñar la **ESTRUCTURA DE CARPETAS (Toolkit)** ideal para entregar estos activos al cliente final.

            INSTRUCCIONES:
            1. Agrupa los activos lógicamente (Por Pilar, Por Nivel, o Por Competencia).
            2. Genera una estructura de árbol en texto plano (estilo comando 'tree').
            3. Añade breves notas (entre paréntesis) de por qué agrupaste así.
            4. Sugiere 3 recursos adicionales ("Gaps") que faltarían para completar el toolkit ideal.
            5. Formato de salida: Texto plano formateado.

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
