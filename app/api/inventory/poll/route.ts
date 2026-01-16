import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/gemini'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Polling checks are fast, but generation takes ~30s

export async function POST(req: NextRequest) {
    try {
        const { contentId } = await req.json()
        if (!contentId) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const item = await prisma.contentItem.findUnique({ where: { id: contentId } })
        if (!item || !item.geminiName) {
            return NextResponse.json({ error: 'Item not found or not in async process' }, { status: 404 })
        }

        if (item.status === 'Validado' || item.status === 'Borrador') {
            // Already done
            return NextResponse.json({ success: true, status: 'COMPLETED', data: item })
        }

        // Check Gemini State
        const state = await GeminiService.checkFileState(item.geminiName)
        console.log(`[Poll] Item ${contentId}: Gemini State = ${state}`)

        if (state === 'PROCESSING') {
            return NextResponse.json({ success: true, status: 'PROCESSING', message: 'Google está procesando el video...' })
        }

        if (state === 'failed' || state === 'FAILED') {
            await prisma.contentItem.update({
                where: { id: contentId },
                data: { status: 'ERROR', observations: 'Fallo en procesamiento de video de Google.' }
            })
            return NextResponse.json({ error: 'Google Video Processing Failed' }, { status: 500 })
        }

        // If ACTIVE, we can run the analysis!
        if (state === 'ACTIVE') {
            console.log(`[Poll] Video Ready! Running Analysis for ${contentId}...`)

            // 1. Get Transcription
            // We need mimeType, but didn't store it? We can guess or fetch metadata. 
            // Actually generateFromUri needs mimeType. 
            // Let's assume video/mp4 for now or try to fetch file metadata if needed.
            // BETTER: Add mimeType to DB? Or just pass 'video/mp4' (Gemini is usually smart enough or accepts generic video/*)

            // Let's update `GeminiService.generateFromUri` to be robust or just pass video/mp4
            const transcription = await GeminiService.generateFromUri(item.geminiUri!, 'video/mp4') // Defaulting to mp4 usually works for Gemini API URIs

            const text = `[TRANSCRIPTION]\n${transcription}`

            // 2. Run Full Analysis
            const promptContext = `
            MODO: ANÁLISIS DE VIDEO ASÍNCRONO
            El usuario subió este video. Analízalo con la metodología 4Shine.
            `
            const metadata = await GeminiService.analyzeContent(text, promptContext)

            if (metadata) {
                // Update Record with Final Data
                // Use the update from `analyzeContent` logic? 
                // We should map metadata fields to DB fields.

                await prisma.contentItem.update({
                    where: { id: contentId },
                    data: {
                        title: metadata.title,
                        status: 'Borrador', // Set to Borrador so it shows up
                        type: 'Video',
                        primaryPillar: metadata.primaryPillar,
                        secondaryPillars: metadata.secondaryPillars,
                        competence: metadata.competence,
                        sub: metadata.sub,
                        behavior: metadata.behavior,
                        observations: metadata.observations,
                        transcription: transcription,
                        completeness: metadata.completeness,
                        metadata: metadata as any // Store full JSON
                    }
                })

                return NextResponse.json({ success: true, status: 'COMPLETED', data: metadata })
            }
        }

        return NextResponse.json({ success: true, status: 'UNKNOWN_STATE' })

    } catch (error: any) {
        console.error('[Poll Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
