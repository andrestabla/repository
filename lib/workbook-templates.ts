
export interface WorkbookTemplate {
    id: string;
    name: string;
    prompt: string;
    exportTemplate: (workbook: any) => string;
}

export const WORKBOOK_TEMPLATES: Record<string, WorkbookTemplate> = {
    'Workbook1': {
        id: 'Workbook1',
        name: 'Workbook 1 — Metas & PDI',
        prompt: `
            Eres un EXPERTO EN DISEÑO INSTRUCCIONAL y PEDAGOGÍA CORPORATIVA (4Shine Methodology).
            Analiza la transcripción de la sesión de mentoría y extrae la información para el "Workbook 1 - Metas & PDI".
            
            ESPECIFICACIONES DEL JSON DE SALIDA:
            Debes devolver un objeto JSON con esta estructura exacta:
            {
                "success": true,
                "metadata": {
                    "exitoFrase": "Frase que define el éxito del líder",
                    "exitoEvidencia": "Evidencias observables de éxito",
                    "wheel": [50, 60, 70, 80, 40, 50, 90, 30], // Array de 8 números (0-100) para las áreas ordenadas: Salud, Finanzas, Relaciones, Familia, Trabajo, Filantropía, Espiritualidad, Hobbies
                    "metaSmart": "Redacción de la meta SMART principal",
                    "smartCheck": { "s": "...", "m": "...", "a": "...", "r": "...", "t": "..." },
                    "planCarrera": {
                        "year1": { "definition": "...", "evidence": "..." },
                        "year3": { "definition": "...", "evidence": "..." },
                        "year5": { "definition": "...", "evidence": "..." }
                    },
                    "gaps": [
                        { "skill": "...", "level": 3, "diagnostic": "...", "action": "...", "resources": "..." }
                    ],
                    "pdei": [
                        { "meta": "...", "action": "...", "date": "...", "indicator": "...", "celebration": "..." }
                    ],
                    "acciones90": "Lista de acciones",
                    "barreras": "Lista de barreras",
                    "ritual": "Descripción del ritual"
                }
            }

            IMPORTANTE: Si falta información, infiérela basándote en el tono de la conversación o deja valores coherentes por defecto.
        `,
        exportTemplate: (workbook: any) => {
            const m = workbook.metadata || {};
            const wheelAreas = [
                "Salud & bienestar", "Finanzas", "Relaciones", "Familia",
                "Trabajo", "Filantropía", "Espiritualidad", "Hobbies"
            ];

            // Replicating the user's provided HTML structure but with workbook data
            return `
                <!doctype html>
                <html lang="es">
                <head>
                  <meta charset="utf-8" />
                  <title>${workbook.title}</title>
                  <style>
                    /* Reused styles from user prompt */
                    :root{
                      --bg:#0b0c10; --card:#12141b; --text:#eef2ff; --muted:#b8c0ff;
                      --accent:#ffd166; --accent2:#7bdff2; --line:rgba(255,255,255,.1);
                      --radius:18px; --max:1000px;
                    }
                    body{ font-family: sans-serif; background: var(--bg); color: var(--text); line-height:1.4; padding:20px; }
                    .wrap{ max-width:var(--max); margin:0 auto; }
                    .card{ background:var(--card); border:1px solid var(--line); border-radius:var(--radius); padding:24px; margin-bottom:20px; }
                    h1, h2{ margin-top:0; color:var(--accent); }
                    .badge{ display:inline-block; padding:4px 12px; background:rgba(255,255,255,.1); border-radius:999px; font-size:12px; margin-bottom:10px; }
                    .grid{ display:grid; grid-template-columns:1fr 1fr; gap:20px; }
                    .table{ width:100%; border-collapse:collapse; margin-top:10px; }
                    .table th, .table td{ border:1px solid var(--line); padding:10px; text-align:left; font-size:13px; }
                    .wheel-grid{ display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; }
                    .wheel-item{ background:rgba(0,0,0,.2); padding:10px; border-radius:10px; text-align:center; }
                    .wheel-item span{ display:block; font-size:18px; font-weight:bold; color:var(--accent2); }
                  </style>
                </head>
                <body>
                  <div class="wrap">
                    <header class="card">
                      <span class="badge">Workbook 1 — Metas & PDI</span>
                      <h1>${workbook.title}</h1>
                      <p>${workbook.description || ''}</p>
                    </header>

                    <section class="card">
                      <h2>1) Definición de Éxito</h2>
                      <p><strong>Frase:</strong> ${m.exitoFrase || 'N/A'}</p>
                      <p><strong>Evidencias:</strong> ${m.exitoEvidencia || 'N/A'}</p>
                    </section>

                    <section class="card">
                      <h2>2) Rueda del Éxito</h2>
                      <div class="wheel-grid">
                        ${(m.wheel || []).map((val: number, i: number) => `
                          <div class="wheel-item">
                            <small>${wheelAreas[i]}</small>
                            <span>${val}%</span>
                          </div>
                        `).join('')}
                      </div>
                    </section>

                    <section class="card">
                      <h2>3) Metas SMART</h2>
                      <p><strong>Meta:</strong> ${m.metaSmart || 'N/A'}</p>
                      <table class="table">
                        <tr><th>Específico</th><td>${m.smartCheck?.s || ''}</td></tr>
                        <tr><th>Medible</th><td>${m.smartCheck?.m || ''}</td></tr>
                        <tr><th>Alcanzable</th><td>${m.smartCheck?.a || ''}</td></tr>
                        <tr><th>Relevante</th><td>${m.smartCheck?.r || ''}</td></tr>
                        <tr><th>Tiempo</th><td>${m.smartCheck?.t || ''}</td></tr>
                      </table>
                    </section>

                    <section class="card">
                      <h2>4) Plan de Carrera</h2>
                      <table class="table">
                        <tr><th>Horizonte</th><th>Definición</th><th>Indicadores</th></tr>
                        <tr><td>1 Año</td><td>${m.planCarrera?.year1?.definition || ''}</td><td>${m.planCarrera?.year1?.evidence || ''}</td></tr>
                        <tr><td>3 Años</td><td>${m.planCarrera?.year3?.definition || ''}</td><td>${m.planCarrera?.year3?.evidence || ''}</td></tr>
                        <tr><td>5 Años</td><td>${m.planCarrera?.year5?.definition || ''}</td><td>${m.planCarrera?.year5?.evidence || ''}</td></tr>
                      </table>
                    </section>

                    <section class="card">
                      <h2>5) GAP Analysis</h2>
                      <table class="table">
                        <tr><th>Habilidad</th><th>Nivel</th><th>Acción</th></tr>
                        ${(m.gaps || []).map((g: any) => `
                          <tr><td>${g.skill}</td><td>${g.level}/5</td><td>${g.action}</td></tr>
                        `).join('')}
                      </table>
                    </section>

                    <section class="card">
                      <h2>6) PDEI</h2>
                      <table class="table">
                        <tr><th>Meta</th><th>Acción</th><th>Fecha</th></tr>
                        ${(m.pdei || []).map((p: any) => `
                          <tr><td>${p.meta}</td><td>${p.action}</td><td>${p.date}</td></tr>
                        `).join('')}
                      </table>
                    </section>
                  </div>
                  <script>window.print();</script>
                </body>
                </html>
            `;
        }
    }
};
