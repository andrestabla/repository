
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const workbook = await prisma.workbook.findUnique({
            where: { id }
        })

        if (!workbook) {
            return new NextResponse('Workbook Not Found', { status: 404 })
        }

        const meta = workbook.metadata as any || {}

        const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${workbook.title} - 4Shine Workbook</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Montserrat', sans-serif; -webkit-print-color-adjust: exact; }
                    .print-break { page-break-before: always; }
                </style>
            </head>
            <body class="bg-white text-slate-800 p-12 max-w-4xl mx-auto">
                
                <!-- Header -->
                <header class="flex justify-between items-end border-b-4 border-indigo-600 pb-6 mb-12">
                     <div>
                        <div class="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">4Shine Methodology</div>
                        <h1 class="text-4xl font-black text-slate-900 leading-tight">${workbook.title}</h1>
                        <p class="text-lg text-slate-500 mt-2">${workbook.description || ''}</p>
                    </div>
                </header>

                <!-- Metadata Grid -->
                <div class="grid grid-cols-2 gap-8 mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div>
                        <b class="block text-xs uppercase text-slate-400 tracking-wider mb-1">Audiencia</b>
                        <span class="font-bold text-slate-800">${meta.audience || 'General'}</span>
                    </div>
                     <div>
                        <b class="block text-xs uppercase text-slate-400 tracking-wider mb-1">Dificultad / Duración</b>
                        <span class="font-bold text-slate-800">${meta.difficulty || 'Básico'} &bull; ${meta.duration || 'N/A'}</span>
                    </div>
                    ${meta.prerequisites ? `
                    <div class="col-span-2">
                         <b class="block text-xs uppercase text-slate-400 tracking-wider mb-1">Prerrequisitos</b>
                        <span class="text-slate-700">${meta.prerequisites}</span>
                    </div>` : ''}
                </div>

                <!-- Objectives -->
                <section class="mb-12">
                    <h2 class="text-2xl font-black text-indigo-700 mb-6 flex items-center gap-2">
                        <span class="w-8 h-1 bg-indigo-700 rounded-full inline-block"></span>
                        Objetivos de Aprendizaje
                    </h2>
                    <ul class="space-y-4">
                        ${(meta.objectives || []).map((obj: string) => `
                            <li class="flex gap-4 items-start">
                                <span class="bg-indigo-100 text-indigo-700 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs">✓</span>
                                <span class="text-lg font-medium text-slate-700">${obj}</span>
                            </li>
                        `).join('')}
                    </ul>
                </section>

                 <!-- Key Takeaways -->
                <section class="mb-12">
                    <h2 class="text-2xl font-black text-indigo-700 mb-6 flex items-center gap-2">
                        <span class="w-8 h-1 bg-indigo-700 rounded-full inline-block"></span>
                        Puntos Clave (Key Takeaways)
                    </h2>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${(meta.takeaways || []).map((tk: string) => `
                            <div class="bg-white border-l-4 border-indigo-400 pl-4 py-2 shadow-sm">
                                <p class="text-slate-700 font-medium">${tk}</p>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <div class="print-break"></div>

                <!-- Content Section -->
                ${workbook.content ? `
                    <section>
                         <h2 class="text-2xl font-black text-indigo-700 mb-6 flex items-center gap-2">
                            <span class="w-8 h-1 bg-indigo-700 rounded-full inline-block"></span>
                            Contenido & Ejercicios
                        </h2>
                        <div class="prose prose-slate max-w-none">
                            ${workbook.content.replace(/\n/g, '<br/>')}
                        </div>
                    </section>
                ` : ''}

                <!-- Footer -->
                <footer class="mt-24 text-center text-xs text-slate-400 border-t border-slate-200 pt-8">
                    <p class="font-bold">Generado por 4Shine System &trade;</p>
                    <p>${new Date().getFullYear()} &copy; Todos los derechos reservados.</p>
                </footer>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
            }
        })
    } catch (error) {
        console.error('Error generating export:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
