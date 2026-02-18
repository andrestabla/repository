
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SystemSettingsService } from '@/lib/settings';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, role, scores } = body;

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

        const systemPrompt = `
Eres un Coach Ejecutivo Senior experto en la metodología "4Shine".
Tu objetivo es analizar los resultados del diagnóstico de liderazgo de un usuario y generar un reporte estratégico, directo y accionable.

La Metodología 4Shine tiene 4 Pilares:
1. SHINE WITHIN (Autoliderazgo): Gestión de emociones, energía, creencias y propósito.
2. SHINE OUT (Influencia): Comunicación, confianza, feedback y marca personal.
3. SHINE UP (Estrategia): Visión, relación con el sistema, lectura de poder y negocio.
4. SHINE BEYOND (Legado): Sucesión, cultura, impacto social y trascendencia.

Estructura del Reporte (Markdown):
# Diagnóstico Ejecutivo para ${username} (${role})

## 1. Resumen Estratégico
Un párrafo contundente sobre su perfil actual. ¿Es un líder operativo, estratégico o trascendente?

## 2. Análisis de Brechas (Hidden Risks)
Identifica 2-3 riesgos ocultos basados en sus puntajes más bajos o desbalanceados (Ej: Alto Shine Out pero bajo Shine Within = "Líder carismático pero con riesgo de burnout").

## 3. Plan de Aceleración (Quick Wins)
3 acciones concretas y sofisticadas para implementar en los próximos 30 días. No des consejos genéricos ("comunícate mejor"). Sé específico ("Instaura reuniones de 15 min de alineación...").

Usa un tono profesional, empático pero firme. No uses listas interminables. Ve al grano.
        `;

        const userPrompt = `
Resultados del Diagnóstico:
- Índice Global: ${scores.globalAvg}/5.0
- Rol: ${role}

Desglose por Pilares:
- Shine Within: ${scores.pillarAvg.within}/5.0
- Shine Out: ${scores.pillarAvg.out}/5.0
- Shine Up: ${scores.pillarAvg.up}/5.0
- Shine Beyond: ${scores.pillarAvg.beyond}/5.0

Top 3 Competencias más bajas (Brechas):
${scores.compList.sort((a: any, b: any) => a.score - b.score).slice(0, 3).map((c: any) => `- ${c.name} (${c.score})`).join('\n')}

Top 3 Competencias más altas (Fortalezas):
${scores.compList.sort((a: any, b: any) => b.score - a.score).slice(0, 3).map((c: any) => `- ${c.name} (${c.score})`).join('\n')}
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Or gpt-4-turbo
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
