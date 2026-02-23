
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SystemSettingsService } from '@/lib/settings';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, role, scores, pillar } = body;

        if (!scores || !scores.pillarMetrics) {
            return NextResponse.json({ error: "Invalid data structure" }, { status: 400 });
        }

        // Initialize OpenAI
        let apiKey: string | undefined | null = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            apiKey = await SystemSettingsService.getOpenAIApiKey();
        }

        if (!apiKey) {
            return NextResponse.json({ error: "OpenAI API Key not configured" }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        // --- CONTEXT RETRIEVAL (RAG LITE) ---

        // 1. Identify Gaps (Context-Aware)
        // compList contains Likert scores (1-5). We use them for granularity.
        const allSorted = scores.compList.sort((a: any, b: any) => a.score - b.score);
        const globalGaps = allSorted.slice(0, 3);
        const globalStrengths = allSorted.slice(-3).map((c: any) => c.name);

        let targetGaps = globalGaps;
        let pName = "Visión General";

        if (pillar && pillar !== 'all') {
            const pComps = scores.compList.filter((c: any) => c.pillar === pillar);
            targetGaps = pComps.sort((a: any, b: any) => a.score - b.score).slice(0, 3);

            const pillarNames: Record<string, string> = {
                within: "SHINE WITHIN (Autoliderazgo)",
                out: "SHINE OUT (Influencia y Relaciones)",
                up: "SHINE UP (Estrategia y Negocio)",
                beyond: "SHINE BEYOND (Cultura y Legado)"
            };
            pName = pillarNames[pillar] || pillar;
        }

        const targetGapNames = targetGaps.map((c: any) => c.name);

        // 2. Fetch Glossary Definitions (For TARGET gaps)
        const glossaryDocs = await prisma.glossaryTerm.findMany({
            where: { term: { in: targetGapNames } },
            select: { term: true, definition: true }
        });

        const glossaryString = glossaryDocs.map((g: any) => `- **${g.term}**: ${g.definition}`).join('\n');

        // 3. Fetch Recommended Assets
        const whereCondition: any = pillar && pillar !== 'all'
            ? {
                OR: [
                    { competence: { in: targetGapNames } },
                    { primaryPillar: { equals: pillar, mode: 'insensitive' } }
                ]
            }
            : { competence: { in: targetGapNames } };

        const recommendations = await prisma.contentItem.findMany({
            where: {
                ...whereCondition,
                status: 'published'
            },
            take: 4,
            select: { title: true, type: true, competence: true, fileUrl: true }
        });

        const recsString = recommendations.map((r: any) => `- ${r.title} (${r.type}) [Enfocado en: ${r.competence || 'General'}]`).join('\n');

        let systemPrompt = '';
        let userPrompt = '';

        if (pillar === 'all' || !pillar) {
            // --- GENERAL ANALYSIS ---
            systemPrompt = `
Eres un Coach Ejecutivo Senior experto en la metodología "4Shine".
Tu estilo es DIRECTO, SOFISTICADO y CONTUNDENTE.
Háblale directamente al usuario usando "TÚ" (segunda persona).
Tu objetivo es analizar SU perfil holístico de liderazgo, usando el contexto de la plataforma.

**RECURSOS DE LA PLATAFORMA (Contexto RAG):**
A continuación, definiciones oficiales de sus brechas y recursos recomendados. ÚSALOS para dar consejos específicos.
*Glosario Técnico:*
${glossaryString}

*Recursos Recomendados Disponibles:*
${recsString}

La Metodología 4Shine tiene 4 Pilares:
1. SHINE WITHIN (Autoliderazgo)
2. SHINE OUT (Influencia)
3. SHINE UP (Estrategia)
4. SHINE BEYOND (Legado)

Estructura del Reporte (Markdown):
## 1. Tu Perfil Estratégico (Arquetipo)
Define su arquetipo (ej: "Eres un Líder Operativo..."). Integra cómo TUS fortalezas (${globalStrengths.join(', ')}) contrastan con TUS brechas (${targetGapNames.join(', ')}). 
Menciona su madurez global del ${scores.globalIndex}%.

## 2. Análisis de Riesgos Ocultos (Deep Dive)
Identifica 2 tensiones sistémicas en su liderazgo. Conecta sus brechas con definiciones teóricas. (Ej: "Tu falta de '${targetGapNames[0]}' te impide...").

## 3. Tu Plan de Aceleración (Hoja de Ruta)
3 acciones tácticas para TI. **DEBES RECOMIENDAR** al menos 1 de los recursos listados arriba si son pertinentes para su crecimiento.
            `;

            userPrompt = `
Líder: ${username} (${role})
Índice de Madurez Global: ${scores.globalIndex}%
Resultados por Pilar (0-100%):
- Within: ${scores.pillarMetrics.within.total}% (Likert: ${scores.pillarMetrics.within.likert}%, SJT: ${scores.pillarMetrics.within.sjt}%)
- Out: ${scores.pillarMetrics.out.total}% (Likert: ${scores.pillarMetrics.out.likert}%, SJT: ${scores.pillarMetrics.out.sjt}%)
- Up: ${scores.pillarMetrics.up.total}% (Likert: ${scores.pillarMetrics.up.likert}%, SJT: ${scores.pillarMetrics.up.sjt}%)
- Beyond: ${scores.pillarMetrics.beyond.total}% (Likert: ${scores.pillarMetrics.beyond.likert}%, SJT: ${scores.pillarMetrics.beyond.sjt}%)

Top Brechas Globales (escala 1-5):
${targetGaps.map((c: any) => `- ${c.name} (${c.score})`).join('\n')}
            `;

        } else {
            // --- PILLAR DEEP DIVE ---
            const pComps = scores.compList.filter((c: any) => c.pillar === pillar);
            const sortedComps = pComps.sort((a: any, b: any) => a.score - b.score);

            targetGaps = sortedComps.slice(0, 3);
            const targetStrengths = sortedComps.slice(-3).reverse(); // Highest scores

            systemPrompt = `
Eres un Coach Especialista en "${pName}" de la metodología 4Shine.
Analiza con profundidad quirúrgica, hablándole de "TÚ" al líder.

**CONTEXTO DE PLATAFORMA:**
*Definiciones Clave:*
${glossaryString}
*Herramientas 4Shine Sugeridas:*
${recsString}

Estructura del Reporte (Markdown):
## Diagnóstico Profundo: ${pName}

### 1. Tus Superpoderes (Fortalezas)
Reconoce y valida sus mejores puntajes en este pilar: ${targetStrengths.map((c: any) => c.name).join(', ')}. Explica brevemente por qué son activos clave.

### 2. La Verdad Incómoda
Analiza TUS puntajes bajos en este pilar (Brechas). Usa las definiciones para explicarte POR QUÉ estás fallando en ${targetGapNames.join(', ')}. Sé crudo pero constructivo. 
Si hay una brecha entre tu Autopercepción (${scores.pillarMetrics[pillar].likert}%) y tu Juicio Situacional (${scores.pillarMetrics[pillar].sjt}%), menciónalo como un punto de atención crítico.

### 3. Impacto Sistémico
Conecta estas brechas específicas de ${pName} con TUS resultados de negocio y equipo.

### 4. Protocolo de Intervención
2 rutinas específicas para TI y **RECOMIENDA** explícitamente 1 recurso/tool del listado anterior para cerrar TU brecha en este pilar.
            `;

            userPrompt = `
Líder: ${username} (${role})
Resultado Pilar ${pName}: ${scores.pillarMetrics[pillar].total}%
Desglose: Autoinforme (Likert) ${scores.pillarMetrics[pillar].likert}%, Juicio Situacional (SJT) ${scores.pillarMetrics[pillar].sjt}%

Tus Fortalezas (escala 1-5):
${targetStrengths.map((c: any) => `- ${c.name} (${c.score})`).join('\n')}

Tus Brechas Críticas (escala 1-5):
${targetGaps.map((c: any) => `- ${c.name} (${c.score})`).join('\n')}
            `;
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
        });

        const report = completion.choices[0].message.content;

        return NextResponse.json({ report });

    } catch (error: any) {
        console.error("AI Analysis Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
