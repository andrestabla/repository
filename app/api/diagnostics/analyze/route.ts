
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SystemSettingsService } from '@/lib/settings';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, role, scores, pillar } = body;

        if (!scores || !scores.pillarAvg) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // Initialize OpenAI
        let apiKey = await SystemSettingsService.getOpenAIApiKey();
        if (!apiKey) apiKey = process.env.OPENAI_API_KEY || null;

        if (!apiKey) {
            return NextResponse.json({ error: "OpenAI API Key not configured" }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        let systemPrompt = '';
        let userPrompt = '';

        if (pillar === 'all' || !pillar) {
            // --- GENERAL ANALYSIS ---
            systemPrompt = `
Eres un Coach Ejecutivo Senior experto en la metodología "4Shine".
Tu estilo es DIRECTO, SOFISTICADO y CONTUNDENTE. No uses lenguaje corporativo vacío.
Tu objetivo es analizar el perfil holístico del líder y dar una hoja de ruta clara.

La Metodología 4Shine tiene 4 Pilares:
1. SHINE WITHIN (Autoliderazgo): Gestión interna.
2. SHINE OUT (Influencia): Impacto en otros.
3. SHINE UP (Estrategia): Lectura del sistema.
4. SHINE BEYOND (Legado): Impacto a largo plazo.

Estructura del Reporte (Markdown):
## 1. Perfil Estratégico
Define su arquetipo de liderazgo en una frase (ej: "Líder Operativo de Alto Rendimiento pero Bajo Impacto Estratégico").

## 2. Análisis de Riesgos Ocultos (Deep Dive)
Identifica 2 tensiones o riesgos basados en desbalances (ej: Alto Shine Out + Bajo Shine Within = "Riesgo de Impostor"). Sé crudo y real.

## 3. Plan de Aceleración (3 Movimientos)
3 acciones de alto nivel para los próximos 30 días. Nada de "mejorar comunicación". Dame tácticas específicas.
            `;

            userPrompt = `
Líder: ${username} (${role})
Global: ${scores.globalAvg}/5.0

Pilares:
- Within: ${scores.pillarAvg.within}
- Out: ${scores.pillarAvg.out}
- Up: ${scores.pillarAvg.up}
- Beyond: ${scores.pillarAvg.beyond}

Top Brechas:
${scores.compList.sort((a: any, b: any) => a.score - b.score).slice(0, 3).map((c: any) => `- ${c.name} (${c.score})`).join('\n')}
            `;

        } else {
            // --- PILLAR DEEP DIVE ---
            const pillarNames: Record<string, string> = {
                within: "SHINE WITHIN (Autoliderazgo)",
                out: "SHINE OUT (Influencia y Relaciones)",
                up: "SHINE UP (Estrategia y Negocio)",
                beyond: "SHINE BEYOND (Cultura y Legado)"
            };
            const pName = pillarNames[pillar] || pillar;

            systemPrompt = `
Eres un Coach Especialista en "${pName}" de la metodología 4Shine.
Tu objetivo es hacer una "Biopsia de Liderazgo" profunda solo en este pilar.
Sé extremadamente detallado, crítico y orientado a la acción inmediata.

Estructura del Reporte (Markdown):
## Diagnóstico de ${pName}

### 1. La Verdad Incómoda
Analiza sus puntajes en este pilar. ¿Qué están diciendo realmente sobre su día a día? ¿Dónde se está auto-saboteando?

### 2. Impacto en el Negocio
Conecta sus brechas en este pilar con resultados de negocio (pérdida de talento, lentitud en decisiones, falta de innovación).

### 3. Protocolo de Intervención
2 rutinas o herramientas específicas para elevar este pilar. Ejemplos: "Auditoría de Calendario", "Feedback Estructurado", "Mapa de Poder".
            `;

            // Filter comps for this pillar
            const pComps = scores.compList.filter((c: any) => c.pillar === pillar);
            const lowComps = pComps.sort((a: any, b: any) => a.score - b.score).slice(0, 3);
            const highComps = pComps.sort((a: any, b: any) => b.score - a.score).slice(0, 3);

            userPrompt = `
Líder: ${username} (${role})
Puntaje Pilar ${pillar}: ${scores.pillarAvg[pillar]}/5.0

Competencias Críticas (Bajas):
${lowComps.map((c: any) => `- ${c.name} (${c.score})`).join('\n')}

Competencias Fuertes:
${highComps.map((c: any) => `- ${c.name} (${c.score})`).join('\n')}
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
