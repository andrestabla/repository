
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
                within: "Shine within (autoliderazgo)",
                out: "Shine out (influencia y relaciones)",
                up: "Shine up (estrategia y negocio)",
                beyond: "Shine beyond (cultura y legado)"
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
Eres un analista experto en la metodología 4Shine.
Tu objetivo es analizar el perfil holístico de liderazgo del usuario, usando exclusivamente el conocimiento de la metodología 4Shine provisto en el contexto.
Usa un tono directo, humano y profesional. NO uses lenguaje, palabras o morfosintaxis típica de inteligencia artificial (ej. "en resumen", "es importante destacar", "crucial", "adentrémonos", "sin duda", etc).
Habla en segunda persona del singular (tú).

REGLA ESTRICTA DE MAYÚSCULAS:
Solamente debes emplear mayúsculas iniciales en los siguientes 3 casos:
1. Iniciando párrafo.
2. Después de punto y aparte o punto seguido.
3. Nombres propios (ej. 4Shine).
NO uses mayúsculas para enfatizar. NO uses mayúsculas en títulos salvo la primera letra. Todo lo demás debe ir en minúsculas estrictamente.

REGLA DE RECURSOS Y AUTORES:
Basa tus recomendaciones lógicas en las ideas de los "Recursos recomendados" listados abajo, pero NUNCA menciones específicamente el nombre de un activo (curso, libro, etc.) ni el nombre de un autor. Solo transmite el concepto, idea o acción metodológica.

**CONTEXTO DE PLATAFORMA (Glosario):**
${glossaryString}

**RECURSOS RECOMENDADOS (Usa solo sus conceptos/ideas, oculta nombres y autores):**
${recsString}

La metodología 4Shine tiene 4 pilares:
1. Shine within (autoliderazgo)
2. Shine out (influencia)
3. Shine up (estrategia)
4. Shine beyond (legado)

Estructura del reporte esperado (usa markdown, respeta la regla de mayúsculas):
## 1. Tu perfil estratégico
Define su arquetipo integrando cómo sus fortalezas (${globalStrengths.join(', ')}) contrastan con sus brechas principales (${targetGapNames.join(', ')}). 
Menciona su madurez global del ${scores.globalIndex}%.

## 2. Análisis de riesgos
Identifica 2 tensiones en su liderazgo. Conecta sus brechas con las definiciones teóricas del glosario provisto.

## 3. Plan de aceleración
Provee 3 acciones tácticas apoyándote en los conceptos de los recursos recomendados, pero sin nombrar directamente el recurso.
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
Eres un analista experto en el pilar "${pName}" de la metodología 4Shine.
Tu objetivo es analizar profundamente el perfil del usuario en este pilar específico, usando exclusivamente el contexto metodológico provisto.
Usa un tono directo, humano y profesional. NO uses lenguaje, palabras o morfosintaxis típica de inteligencia artificial.
Habla en segunda persona del singular (tú).

REGLA ESTRICTA DE MAYÚSCULAS:
Solamente debes emplear mayúsculas iniciales en los siguientes 3 casos:
1. Iniciando párrafo.
2. Después de punto y aparte o punto seguido.
3. Nombres propios (ej. 4Shine).
NO uses mayúsculas para enfatizar. NO uses mayúsculas en títulos salvo la primera letra. Todo lo demás en minúsculas.

REGLA DE RECURSOS Y AUTORES:
Basa tus tácticas en las ideas de las "Herramientas sugeridas" listadas abajo, pero NUNCA sugieras ni menciones un activo literario, nombre de curso o autor. Extrae únicamente el conocimiento de esas herramientas como si fuera conocimiento base de 4Shine.

**CONTEXTO METODOLÓGICO (Glosario):**
${glossaryString}

**HERRAMIENTAS SUGERIDAS (Transmite conceptos, omite títulos/autores):**
${recsString}

Estructura del reporte esperado (usa markdown, aplicando estrictamente reglas de mayúsculas):
## Diagnóstico profundo: ${pName}

### 1. Fortalezas
Reconoce sus principales competencias altas: ${targetStrengths.map((c: any) => c.name).join(', ')}. Explica lógicamente por qué le sirven con base en el pilar.

### 2. Puntos críticos de atención
Analiza sus brechas (${targetGapNames.join(', ')}). Explica la causa fundamental apoyándote en las definiciones del glosario.
Si hay gran diferencia entre su autopercepción (${scores.pillarMetrics[pillar].likert}%) y el juicio situacional (${scores.pillarMetrics[pillar].sjt}%), hágalo notar como un aspecto de mejora.

### 3. Consecuencias sistémicas
Conecta lógicamente las brechas de este pilar con sus resultados en el equipo y la organización.

### 4. Intervención táctica
Describe 2 rutinas claras para el usuario, inspiradas en los conceptos de las herramientas sugeridas.
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
