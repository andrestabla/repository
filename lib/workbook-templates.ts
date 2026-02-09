
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

      // Map the internal storage to the HTML IDs
      const flatData: any = {
        exitoFrase: m.exitoFrase || "",
        exitoEvidencia: m.exitoEvidencia || "",
        smartMeta: m.smartMeta || "",
        smart_s: m.smartCheck?.s || "",
        smart_m: m.smartCheck?.m || "",
        smart_a: m.smartCheck?.a || "",
        smart_r: m.smartCheck?.r || "",
        smart_t: m.smartCheck?.t || "",
        plan_1_rol: m.planCarrera?.year1?.definition || "",
        plan_1_kpi: m.planCarrera?.year1?.evidence || "",
        plan_3_rol: m.planCarrera?.year3?.definition || "",
        plan_3_kpi: m.planCarrera?.year3?.evidence || "",
        plan_5_rol: m.planCarrera?.year5?.definition || "",
        plan_5_kpi: m.planCarrera?.year5?.evidence || "",
        acciones90: m.acciones90 || "",
        ritual: m.ritual || "",
        wheel: m.wheel || [50, 50, 50, 50, 50, 50, 50, 50]
      };

      // Map gaps (up to 2 for this UI)
      if (m.gaps && m.gaps.length > 0) {
        flatData.gap_1_skill = m.gaps[0].skill;
        flatData.gap_1_lvl = m.gaps[0].level;
        flatData.gap_1_act = m.gaps[0].action;
      }
      if (m.gaps && m.gaps.length > 1) {
        flatData.gap_2_skill = m.gaps[1].skill;
        flatData.gap_2_lvl = m.gaps[1].level;
        flatData.gap_2_act = m.gaps[1].action;
      }

      // Map pdei (up to 2 for this UI)
      if (m.pdei && m.pdei.length > 0) {
        flatData.pdei_1_meta = m.pdei[0].meta;
        flatData.pdei_1_act = m.pdei[0].action;
        flatData.pdei_1_date = m.pdei[0].date;
        flatData.pdei_1_cel = m.pdei[0].celebration;
      }
      if (m.pdei && m.pdei.length > 1) {
        flatData.pdei_2_meta = m.pdei[1].meta;
        flatData.pdei_2_act = m.pdei[1].action;
        flatData.pdei_2_date = m.pdei[1].date;
        flatData.pdei_2_cel = m.pdei[1].celebration;
      }

      return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>${workbook.title} — Metas & PDI</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <style>
    :root{
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --accent: #f59e0b;
      --accent-light: #fffbeb; 
      --accent-glow: rgba(245, 158, 11, 0.15);
      --success: #10b981;
      --radius: 16px;
      --font-stack: 'Inter', system-ui, -apple-system, sans-serif;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0;
      font-family: var(--font-stack);
      background-color: var(--bg);
      color: var(--text-main);
      line-height: 1.6;
      padding-bottom: 100px;
    }
    .layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      max-width: 1100px;
      margin: 20px auto;
      gap: 24px;
      padding: 0 20px;
    }
    @media (max-width: 900px) {
      .layout { display: block; padding: 0 16px; margin-top: 100px; }
    }
    .sidebar {
      position: sticky;
      top: 20px;
      height: fit-content;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: var(--shadow);
    }
    .mobile-nav-wrapper { display: none; }
    @media (max-width: 900px) {
      .sidebar { display: none; }
      .mobile-nav-wrapper {
        display: block; position: fixed; top: 0; left: 0; right: 0;
        background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);
        z-index: 90; border-bottom: 1px solid var(--card-border);
        padding: 10px 0 0 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      }
      .mobile-header { padding: 0 16px 10px; display: flex; justify-content: space-between; align-items: center; }
      .mobile-header h1 { font-size: 18px; margin: 0; color: var(--text-main); }
      .mobile-nav-scroller { display: flex; overflow-x: auto; padding: 0 16px 10px; gap: 12px; scrollbar-width: none; }
      .mobile-nav-scroller::-webkit-scrollbar { display: none; }
      .nav-pill { white-space: nowrap; font-size: 13px; font-weight: 600; color: var(--text-muted); background: #f1f5f9; padding: 6px 14px; border-radius: 20px; text-decoration: none; transition: all 0.2s; }
      .nav-pill.active { background: var(--text-main); color: white; }
    }
    .nav-link {
      display: flex; align-items: center; gap: 10px;
      color: var(--text-muted); text-decoration: none;
      padding: 10px 12px; border-radius: 8px;
      font-size: 14px; font-weight: 500; transition: all 0.2s;
    }
    .nav-link:hover { background: #f1f5f9; color: var(--text-main); }
    .nav-link.active { background: var(--accent-light); color: #d97706; border-left: 3px solid var(--accent); font-weight: 600; }
    .card {
      background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius);
      padding: 30px; margin-bottom: 24px; box-shadow: var(--shadow);
    }
    @media (max-width: 600px) { .card { padding: 20px; } }
    h1, h2 { margin-top: 0; color: var(--text-main); letter-spacing: -0.02em; }
    h1 { font-size: 26px; font-weight: 800; }
    h2 { font-size: 18px; border-bottom: 1px solid var(--card-border); padding-bottom: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;}
    p.subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 20px; line-height: 1.5; }
    label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 6px; }
    input, textarea, select { width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; color: var(--text-main); padding: 12px 14px; border-radius: 10px; font-family: inherit; font-size: 15px; transition: all 0.2s; -webkit-appearance: none; }
    input:focus, textarea:focus, select:focus { outline: none; border-color: var(--accent); background: white; box-shadow: 0 0 0 3px var(--accent-glow); }
    textarea { resize: vertical; min-height: 100px; }
    .table-responsive { overflow-x: auto; border-radius: 10px; border: 1px solid var(--card-border); background-image: linear-gradient(to right, white, white), linear-gradient(to right, white, white), linear-gradient(to right, rgba(0,0,0,0.05), rgba(255,255,255,0)), linear-gradient(to left, rgba(0,0,0,0.05), rgba(255,255,255,0)); background-position: left center, right center, left center, right center; background-repeat: no-repeat; background-color: white; background-size: 20px 100%, 20px 100%, 10px 100%, 10px 100%; background-attachment: local, local, scroll, scroll; }
    table { width: 100%; border-collapse: collapse; min-width: 600px; }
    th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--card-border); font-size: 14px; }
    th { background: #f8fafc; color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    tr:last-child td { border-bottom: none; }
    td input { background: transparent; border: 1px solid transparent; padding: 4px; border-radius: 4px; }
    td input:focus { background: white; border-color: var(--accent); }
    .wheel-container { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center; }
    @media(max-width:700px){ .wheel-container{ grid-template-columns: 1fr; } }
    .slider-group { display: flex; align-items: center; gap: 12px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
    .slider-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-main); }
    input[type=range] { flex: 1.5; height: 6px; background: #e2e8f0; border: none; padding: 0; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 20px; border-radius: 50%; background: white; border: 2px solid var(--accent); box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: -7px; }
    input[type=range]::-webkit-slider-runnable-track { height: 6px; background: #e2e8f0; border-radius: 3px; }
    .slider-val { width: 36px; text-align: right; font-weight: 700; color: var(--accent); font-size: 13px; }
    .action-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; padding: 8px 10px; border-radius: 100px; display: flex; gap: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 100; width: max-content; max-width: 90%; }
    .action-bar button { background: transparent; border: none; color: #cbd5e1; padding: 10px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .action-bar button:hover { color: white; background: rgba(255,255,255,0.1); }
    .action-bar button.primary { background: var(--accent); color: white; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.4); }
    #toast { visibility: hidden; min-width: 250px; background-color: var(--text-main); color: #fff; text-align: center; border-radius: 50px; padding: 12px 24px; position: fixed; z-index: 101; left: 50%; top: 20px; transform: translateX(-50%); font-weight: 500; font-size: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); opacity: 0; transition: all 0.3s; }
    #toast.show { visibility: visible; opacity: 1; top: 40px; }
    .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media(max-width:700px){ .two-cols{ grid-template-columns: 1fr; } }
    @media print { body { background: white; padding: 0; } .sidebar, .action-bar, .mobile-nav-wrapper { display: none !important; } .layout { display: block; margin: 0; } .card { box-shadow: none; border: 1px solid #ccc; break-inside: avoid; } }
  </style>
</head>
<body>
  <div id="toast">✅ Guardado correctamente</div>
  <div class="mobile-nav-wrapper">
    <div class="mobile-header">
      <h1>${workbook.title}</h1>
      <span style="font-size:12px; color:var(--accent); font-weight:700;">PRO</span>
    </div>
    <nav class="mobile-nav-scroller">
      <a href="#sec-intro" class="nav-pill active">1. Intro</a>
      <a href="#sec-wheel" class="nav-pill">2. Rueda</a>
      <a href="#sec-smart" class="nav-pill">3. SMART</a>
      <a href="#sec-plan" class="nav-pill">4. Carrera</a>
      <a href="#sec-gap" class="nav-pill">5. GAP</a>
      <a href="#sec-pdei" class="nav-pill">6. PDEI</a>
      <a href="#sec-90dias" class="nav-pill">7. 90 Días</a>
    </nav>
  </div>

  <div class="layout">
    <aside class="sidebar">
      <div style="margin-bottom: 10px; padding: 0 12px;">
        <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:800; letter-spacing:1px;">Mapa Estratégico</span>
      </div>
      <a href="#sec-intro" class="nav-link active">1. Definición de Éxito</a>
      <a href="#sec-wheel" class="nav-link">2. Rueda de la Vida</a>
      <a href="#sec-smart" class="nav-link">3. Objetivos SMART</a>
      <a href="#sec-plan" class="nav-link">4. Plan de Carrera</a>
      <a href="#sec-gap" class="nav-link">5. Brechas (GAP)</a>
      <a href="#sec-pdei" class="nav-link">6. PDEI</a>
      <a href="#sec-90dias" class="nav-link">7. Plan 90 Días</a>
    </aside>

    <main class="main-content">
      <section id="sec-intro" class="card">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:20px;">
          <div>
            <span style="color:var(--accent); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Workbook 1 — Metas & PDI</span>
            <h1>${workbook.title}</h1>
            <p class="subtitle">${workbook.description || 'Traduce tu visión en un plan táctico. Sin distracciones.'}</p>
          </div>
        </div>
        <div class="two-cols">
            <div>
              <label>Tu definición de éxito (1 frase)</label>
              <textarea id="exitoFrase" rows="2" placeholder="Ej: Crecer con propósito y equilibrio..."></textarea>
            </div>
            <div>
              <label>Evidencia Observable</label>
              <textarea id="exitoEvidencia" rows="2" placeholder="Ej: Promoción, Ahorro de X monto..."></textarea>
            </div>
        </div>
      </section>

      <section id="sec-wheel" class="card">
        <h2>2. Diagnóstico (Rueda)</h2>
        <p class="subtitle">Desliza para ajustar tu nivel actual (0-100%).</p>
        <div class="wheel-container">
          <div class="sliders-box" id="sliderContainer"></div>
          <div style="position:relative; height:300px; width:100%;">
            <canvas id="wheelChart"></canvas>
          </div>
        </div>
      </section>

      <section id="sec-smart" class="card">
        <h2>3. Objetivo SMART</h2>
        <label>Declaración de Meta (Presente)</label>
        <textarea id="smartMeta" placeholder="Para Dic 2026, yo he logrado..."></textarea>
        <div style="margin-top:24px;">
          <label>Checklist de Calidad</label>
          <div class="table-responsive">
            <table>
              <tr><th width="50">S</th><td><input type="text" id="smart_s" placeholder="Específico..."></td></tr>
              <tr><th>M</th><td><input type="text" id="smart_m" placeholder="Medible (KPI)..."></td></tr>
              <tr><th>A</th><td><input type="text" id="smart_a" placeholder="Alcanzable..."></td></tr>
              <tr><th>R</th><td><input type="text" id="smart_r" placeholder="Relevante..."></td></tr>
              <tr><th>T</th><td><input type="text" id="smart_t" placeholder="Tiempo..."></td></tr>
            </table>
          </div>
        </div>
      </section>

      <section id="sec-plan" class="card">
        <h2>4. Visión 1-3-5 Años</h2>
        <div class="table-responsive">
          <table>
            <thead>
              <tr><th width="80">Año</th><th>Rol / Éxito</th><th>KPIs</th></tr>
            </thead>
            <tbody>
              <tr><td style="font-weight:700;">1 Año</td><td><input type="text" id="plan_1_rol" placeholder="Foco inmediato"></td><td><input type="text" id="plan_1_kpi"></td></tr>
              <tr><td style="font-weight:700;">3 Años</td><td><input type="text" id="plan_3_rol" placeholder="Consolidación"></td><td><input type="text" id="plan_3_kpi"></td></tr>
              <tr><td style="font-weight:700;">5 Años</td><td><input type="text" id="plan_5_rol" placeholder="Legado"></td><td><input type="text" id="plan_5_kpi"></td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="sec-gap" class="card">
        <h2>5. Brechas (GAP)</h2>
        <div class="table-responsive">
          <table>
            <thead>
              <tr><th>Habilidad Faltante</th><th width="60">Nvl</th><th>Acción</th></tr>
            </thead>
            <tbody>
              <tr><td><input type="text" id="gap_1_skill" placeholder="Ej: Inglés"></td><td><input type="number" id="gap_1_lvl"></td><td><input type="text" id="gap_1_act"></td></tr>
              <tr><td><input type="text" id="gap_2_skill"></td><td><input type="number" id="gap_2_lvl"></td><td><input type="text" id="gap_2_act"></td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="sec-pdei" class="card">
        <h2>6. Plan de Desarrollo</h2>
        <div class="table-responsive">
          <table>
            <thead>
              <tr><th>Qué aprender</th><th>Cómo (Acción)</th><th width="110">Fecha</th><th>Premio</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="text" id="pdei_1_meta" placeholder="Skill"></td>
                <td><input type="text" id="pdei_1_act" placeholder="Curso/Libro"></td>
                <td><input type="date" id="pdei_1_date"></td>
                <td><input type="text" id="pdei_1_cel" placeholder="Cena"></td>
              </tr>
              <tr>
                <td><input type="text" id="pdei_2_meta"></td>
                <td><input type="text" id="pdei_2_act"></td>
                <td><input type="date" id="pdei_2_date"></td>
                <td><input type="text" id="pdei_2_cel"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="sec-90dias" class="card">
        <h2>7. Ejecución (90 Días)</h2>
        <div class="two-cols">
          <div>
            <label>5 Acciones Críticas</label>
            <textarea id="acciones90" placeholder="1. ...&#10;2. ..."></textarea>
          </div>
          <div>
            <label>Ritual Semanal</label>
            <textarea id="ritual" placeholder="Día y hora de revisión..."></textarea>
          </div>
        </div>
      </section>
    </main>
  </div>

  <div class="action-bar">
    <button class="primary" id="saveBtn">Guardar</button>
    <button id="loadBtn">Cargar</button>
    <button id="exportBtn">JSON</button>
    <button id="printBtn">Imprimir / PDF</button>
    <button id="clearBtn" style="color:#fca5a5;">Borrar</button>
  </div>

  <script>
    const areas = ["Salud", "Finanzas", "Relaciones", "Familia", "Trabajo", "Contribución", "Espíritu", "Diversión"];
    const initialDataFromDB = ${JSON.stringify(flatData)};
    
    const ctx = document.getElementById('wheelChart').getContext('2d');
    const wheelChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: areas,
        datasets: [{
          label: 'Nivel',
          data: initialDataFromDB.wheel || Array(8).fill(50),
          backgroundColor: 'rgba(245, 158, 11, 0.25)',
          borderColor: '#f59e0b',
          pointBackgroundColor: '#fff',
          pointBorderColor: '#d97706',
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          r: {
            angleLines: { color: '#e2e8f0' },
            grid: { color: '#e2e8f0' },
            pointLabels: { color: '#475569', font: { size: 11, weight: '600', family: 'Inter' } },
            ticks: { display: false, backdropColor: 'transparent' }
          }
        },
        plugins: { legend: { display: false } },
        maintainAspectRatio: false
      }
    });

    const sliderContainer = document.getElementById('sliderContainer');
    areas.forEach((area, index) => {
      const val = (initialDataFromDB.wheel && initialDataFromDB.wheel[index]) || 50;
      const html = \`
        <div class="slider-group">
          <span class="slider-label">\${area}</span>
          <input type="range" min="0" max="100" value="\${val}" 
                 id="wheel_\${index}" data-index="\${index}" class="wheel-slider">
          <span class="slider-val" id="val_\${index}">\${val}%</span>
        </div>
      \`;
      sliderContainer.insertAdjacentHTML('beforeend', html);
    });

    document.querySelectorAll('.wheel-slider').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = e.target.dataset.index;
        const val = e.target.value;
        document.getElementById(\`val_\${idx}\`).textContent = val + '%';
        wheelChart.data.datasets[0].data[idx] = val;
        wheelChart.update();
      });
    });

    const STORAGE_KEY = 'workbook_light_v1';
    const toast = document.getElementById("toast");

    function showToast(msg) {
      toast.textContent = msg;
      toast.className = "show";
      setTimeout(() => { toast.className = ""; }, 3000);
    }

    function getAllData() {
      const data = {};
      document.querySelectorAll('input:not(.wheel-slider), textarea, select').forEach(el => {
        if(el.id) data[el.id] = el.value;
      });
      data.wheel = wheelChart.data.datasets[0].data;
      return data;
    }

    function setAllData(data) {
      for (const [key, value] of Object.entries(data)) {
        if (key === 'wheel') continue;
        const el = document.getElementById(key);
        if (el) el.value = value;
      }
      if(data.wheel && Array.isArray(data.wheel)){
        wheelChart.data.datasets[0].data = data.wheel;
        wheelChart.update();
        data.wheel.forEach((val, idx) => {
          const slider = document.getElementById(\`wheel_\${idx}\`);
          const label = document.getElementById(\`val_\${idx}\`);
          if(slider) slider.value = val;
          if(label) label.textContent = val + '%';
        });
      }
    }

    document.getElementById('saveBtn').addEventListener('click', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getAllData()));
      showToast("💾 Guardado localmente");
    });

    document.getElementById('loadBtn').addEventListener('click', () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if(saved) {
        setAllData(JSON.parse(saved));
        showToast("📂 Datos cargados");
      } else {
        showToast("⚠️ No hay datos previos");
      }
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      if(confirm("¿Limpiar todo el formulario?")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(getAllData(), null, 2));
      const el = document.createElement('a');
      el.setAttribute("href", dataStr);
      el.setAttribute("download", "workbook_metas.json");
      document.body.appendChild(el);
      el.click();
      el.remove();
    });

    document.getElementById('printBtn').addEventListener('click', () => { window.print(); });

    window.addEventListener('load', () => {
      setAllData(initialDataFromDB);
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            const id = entry.target.id;
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const dLink = document.querySelector(\`.nav-link[href="#\${id}"]\`);
            if(dLink) dLink.classList.add('active');
            document.querySelectorAll('.nav-pill').forEach(l => l.classList.remove('active'));
            const mLink = document.querySelector(\`.nav-pill[href="#\${id}"]\`);
            if(mLink) {
              mLink.classList.add('active');
              mLink.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
          }
        });
      }, { threshold: 0.3 });
      document.querySelectorAll('section').forEach(section => observer.observe(section));
    });
  </script>
</body>
</html>
            `;
    }
  },
  'Workbook2': {
    id: 'Workbook2',
    name: 'Workbook 2 — Autoconfianza',
    prompt: `
            Eres un EXPERTO EN PSICOLOGÍA DEL RENDIMIENTO y COACHING EJECUTIVO.
            Analiza la sesión y extrae la información para el "Workbook 2 - Autoconfianza".
            
            ESPECIFICACIONES DEL JSON:
            {
                "success": true,
                "metadata": {
                    "emocionesHoy": "Lista de emociones frecuentes mencionadas",
                    "emocionAnhelo": "Qué busca vs qué evita el líder",
                    "frasesLimitantes": "Lenguaje del crítico interno detectado",
                    "lenguajeTransformador": "Cómo debería hablarse el líder",
                    "autodefinicion10": "Descripción de identidad en pocas palabras",
                    "asociacionesExito": "Qué significa el éxito emocionalmente",
                    "creencias": [
                        { "limitante": "...", "pasado": "Yo pensaba que...", "nueva": "..." }
                    ],
                    "perdidasCreencia": "Costos de mantener las creencias limitantes",
                    "beneficiosNuevas": "Ganancias de las nuevas creencias",
                    "dofa": {
                        "fortalezas": "...",
                        "debilidades": "...",
                        "oportunidades": "...",
                        "amenazas": "..."
                    },
                    "perderSiNoActuo": "Costo de la inacción",
                    "decisionPoderosa": "La gran decisión tomada en la sesión",
                    "comoCambioVida": "Impacto esperado de esa decisión",
                    "preguntasLider": {
                        "foco": "Energía centrada en...",
                        "significado": "Interpretación de los retos",
                        "accion": "Próximo paso concreto"
                    }
                }
            }
        `,
    exportTemplate: (workbook: any) => {
      const m = workbook.metadata || {};

      return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>${workbook.title} — Autoconfianza</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">

  <style>
    :root{
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --accent: #6366f1;
      --accent-light: #e0e7ff; 
      --accent-glow: rgba(99, 102, 241, 0.15);
      --radius: 16px;
      --font-stack: 'Inter', system-ui, -apple-system, sans-serif;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0; font-family: var(--font-stack); background-color: var(--bg);
      color: var(--text-main); line-height: 1.6; padding-bottom: 100px;
    }
    .layout { display: grid; grid-template-columns: 240px 1fr; max-width: 1100px; margin: 20px auto; gap: 24px; padding: 0 20px; }
    @media (max-width: 900px) { .layout { display: block; padding: 0 16px; margin-top: 110px; } }
    .mobile-nav-wrapper { display: none; position: fixed; top: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); z-index: 90; border-bottom: 1px solid var(--card-border); padding: 10px 0 0 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    @media (max-width: 900px) { .mobile-nav-wrapper { display: block; } }
    .mobile-header { padding: 0 16px 10px; }
    .mobile-header h1 { font-size: 18px; margin: 0; color: var(--text-main); }
    .mobile-nav-scroller { display: flex; overflow-x: auto; padding: 0 16px 10px; gap: 10px; scrollbar-width: none; }
    .mobile-nav-scroller::-webkit-scrollbar { display: none; }
    .nav-pill { white-space: nowrap; font-size: 13px; font-weight: 600; color: var(--text-muted); background: #f1f5f9; padding: 6px 14px; border-radius: 20px; text-decoration: none; transition: all 0.2s; }
    .nav-pill.active { background: var(--text-main); color: white; }
    .sidebar { position: sticky; top: 20px; height: fit-content; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 20px; display: flex; flex-direction: column; gap: 6px; box-shadow: var(--shadow); }
    @media (max-width: 900px) { .sidebar { display: none; } }
    .nav-link { display: flex; align-items: center; gap: 10px; color: var(--text-muted); text-decoration: none; padding: 10px 12px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: all 0.2s; }
    .nav-link:hover { background: #f1f5f9; color: var(--text-main); }
    .nav-link.active { background: var(--accent-light); color: var(--accent); border-left: 3px solid var(--accent); font-weight: 600; }
    .card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 30px; margin-bottom: 24px; box-shadow: var(--shadow); }
    @media (max-width: 600px) { .card { padding: 20px; } }
    h1 { font-size: 26px; font-weight: 800; margin-top: 0; color: var(--text-main); letter-spacing: -0.5px;}
    h2 { font-size: 18px; border-bottom: 1px solid var(--card-border); padding-bottom: 12px; margin-bottom: 16px; margin-top: 0;}
    p.subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 20px; line-height: 1.5; }
    .note { background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 12px; font-size: 13px; color: #1e40af; margin-bottom: 15px; }
    label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 6px; }
    input, textarea, select { width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; color: var(--text-main); padding: 12px 14px; border-radius: 10px; font-family: inherit; font-size: 15px; transition: all 0.2s; -webkit-appearance: none; }
    input:focus, textarea:focus { outline: none; border-color: var(--accent); background: white; box-shadow: 0 0 0 3px var(--accent-glow); }
    textarea { resize: vertical; min-height: 100px; }
    .table-responsive { overflow-x: auto; border-radius: 10px; border: 1px solid var(--card-border); background: white; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; min-width: 650px; }
    th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--card-border); font-size: 14px; }
    th { background: #f8fafc; color: var(--text-muted); font-weight: 700; font-size: 11px; text-transform: uppercase; }
    td input, td textarea { background: transparent; border: 1px solid transparent; padding: 6px; }
    td input:focus, td textarea:focus { background: white; border-color: var(--accent); }
    .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media(max-width:700px){ .two-cols{ grid-template-columns: 1fr; } }
    .dofa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    @media(max-width:700px){ .dofa-grid{ grid-template-columns: 1fr; } }
    .dofa-item { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid var(--card-border); }
    .dofa-item.positive { border-top: 3px solid #10b981; }
    .dofa-item.negative { border-top: 3px solid #ef4444; }
    .action-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; padding: 8px 10px; border-radius: 100px; display: flex; gap: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 100; max-width: 90%; }
    .action-bar button { background: transparent; border: none; color: #cbd5e1; padding: 10px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .action-bar button:hover { color: white; background: rgba(255,255,255,0.1); }
    .action-bar button.primary { background: var(--accent); color: white; }
    #toast { visibility: hidden; min-width: 250px; background-color: var(--text-main); color: #fff; text-align: center; border-radius: 50px; padding: 12px 24px; position: fixed; z-index: 101; left: 50%; top: 20px; transform: translateX(-50%); font-weight: 500; font-size: 14px; opacity: 0; transition: all 0.3s; }
    #toast.show { visibility: visible; opacity: 1; top: 50px; }
    .tag { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-right: 5px; margin-bottom: 5px;}
    .tag-green { background: #d1fae5; color: #065f46; }
    .tag-yellow { background: #fef3c7; color: #92400e; }
    .tag-red { background: #fee2e2; color: #991b1b; }
    @media print { body { background: white; padding: 0; } .sidebar, .action-bar, .mobile-nav-wrapper { display: none; } .layout { display: block; margin: 0; } .card { box-shadow: none; border: 1px solid #ccc; break-inside: avoid; } }
  </style>
</head>
<body>
  <div id="toast">✅ Guardado</div>
  <div class="mobile-nav-wrapper">
    <div class="mobile-header">
      <span style="color:var(--accent); font-size:11px; font-weight:800; text-transform:uppercase;">Módulo 2</span>
      <h1>${workbook.title}</h1>
    </div>
    <nav class="mobile-nav-scroller">
      <a href="#sec-emociones" class="nav-pill active">1. Emociones</a>
      <a href="#sec-identidad" class="nav-pill">2. Identidad</a>
      <a href="#sec-creencias" class="nav-pill">3. Creencias</a>
      <a href="#sec-dofa" class="nav-pill">4. DOFA</a>
      <a href="#sec-estandar" class="nav-pill">5. Estándares</a>
    </nav>
  </div>

  <div class="layout">
    <aside class="sidebar">
      <div style="margin-bottom: 10px; padding: 0 12px;">
        <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:800;">Contenido</span>
      </div>
      <a href="#sec-emociones" class="nav-link active">1. Emociones y Foco</a>
      <a href="#sec-identidad" class="nav-link">2. Autodefinición</a>
      <a href="#sec-creencias" class="nav-link">3. Transformar Creencias</a>
      <a href="#sec-dofa" class="nav-link">4. DOFA Personal</a>
      <a href="#sec-estandar" class="nav-link">5. Elevar Estándares</a>
    </aside>

    <main class="main-content">
      <section id="sec-emociones" class="card">
        <span style="color:var(--accent); font-weight:700; font-size:12px;">Paso 1</span>
        <h1>Emociones & Foco</h1>
        <p class="subtitle">Identificar lo que sientes reduce su intensidad y te devuelve el control.</p>
        <div class="two-cols">
          <div>
            <label>Emociones Frecuentes</label>
            <textarea id="emocionesHoy">${m.emocionesHoy || ''}</textarea>
          </div>
          <div>
            <label>Anhelo vs. Evitación</label>
            <textarea id="emocionAnhelo">${m.emocionAnhelo || ''}</textarea>
          </div>
        </div>
      </section>

      <section id="sec-identidad" class="card">
        <h2>2. Autodefinición (Lenguaje)</h2>
        <div class="note">Cambiar "Tengo que..." por "¿Cómo puedo...?" cambia tu cerebro de modo supervivencia a modo creativo.</div>
        <div class="two-cols">
          <div>
            <label>Frases Limitantes</label>
            <textarea id="frasesLimitantes">${m.frasesLimitantes || ''}</textarea>
          </div>
          <div>
            <label>Lenguaje Transformador</label>
            <textarea id="lenguajeTransformador">${m.lenguajeTransformador || ''}</textarea>
          </div>
        </div>
        <div style="margin-top:20px;">
          <label>Tu Identidad en 10 Palabras</label>
          <input type="text" id="autodefinicion10" value="${m.autodefinicion10 || ''}">
        </div>
      </section>

      <section id="sec-creencias" class="card">
        <h2>3. Transformación de Creencias</h2>
        <div style="margin-bottom:20px;">
          <label>¿Qué es el "Éxito" para ti?</label>
          <textarea id="asociacionesExito" rows="2">${m.asociacionesExito || ''}</textarea>
        </div>
        <label>Matriz de Reprogramación</label>
        <div class="table-responsive">
          <table>
            <thead>
              <tr><th width="30%">Creencia Limitante</th><th width="20%">En Pasado</th><th>Nueva Creencia</th></tr>
            </thead>
            <tbody>
              ${(m.creencias || []).map((c: any) => `
                <tr>
                  <td><textarea>${c.limitante || ''}</textarea></td>
                  <td><textarea>${c.pasado || ''}</textarea></td>
                  <td><textarea>${c.nueva || ''}</textarea></td>
                </tr>
              `).join('')}
              ${(!m.creencias || m.creencias.length < 2) ? '<tr><td><textarea></textarea></td><td><textarea></textarea></td><td><textarea></textarea></td></tr>' : ''}
            </tbody>
          </table>
        </div>
        <div class="two-cols">
          <div>
            <label>Costo</label>
            <textarea id="perdidasCreencia">${m.perdidasCreencia || ''}</textarea>
          </div>
          <div>
            <label>Beneficio Futuro</label>
            <textarea id="beneficiosNuevas">${m.beneficiosNuevas || ''}</textarea>
          </div>
        </div>
      </section>

      <section id="sec-dofa" class="card">
        <h2>4. DOFA Personal</h2>
        <div class="dofa-grid">
          <div class="dofa-item positive">
            <label style="color:#059669;">Fortalezas</label>
            <textarea id="fortalezas" style="background:transparent; border:none; padding:0;">${m.dofa?.fortalezas || ''}</textarea>
          </div>
          <div class="dofa-item negative">
            <label style="color:#dc2626;">Debilidades</label>
            <textarea id="debilidades" style="background:transparent; border:none; padding:0;">${m.dofa?.debilidades || ''}</textarea>
          </div>
          <div class="dofa-item positive">
            <label style="color:#059669;">Oportunidades</label>
            <textarea id="oportunidades" style="background:transparent; border:none; padding:0;">${m.dofa?.oportunidades || ''}</textarea>
          </div>
          <div class="dofa-item negative">
            <label style="color:#dc2626;">Amenazas</label>
            <textarea id="amenazas" style="background:transparent; border:none; padding:0;">${m.dofa?.amenazas || ''}</textarea>
          </div>
        </div>
        <div style="margin-top:15px;">
          <label>Costo de inacción</label>
          <input type="text" id="perderSiNoActuo" value="${m.perderSiNoActuo || ''}">
        </div>
      </section>

      <section id="sec-estandar" class="card">
        <h2>5. Elevar Estándares</h2>
        <div class="two-cols" style="margin-bottom:20px;">
          <div>
            <label>Decisión Poderosa de Hoy</label>
            <textarea id="decisionPoderosa">${m.decisionPoderosa || ''}</textarea>
          </div>
          <div>
            <label>Impacto en mi vida</label>
            <textarea id="comoCambioVida">${m.comoCambioVida || ''}</textarea>
          </div>
        </div>
        <label>Las 3 Preguntas del Líder</label>
        <div class="table-responsive">
          <table>
            <thead><tr><th width="30%">Pregunta</th><th>Tu Respuesta Hoy</th></tr></thead>
            <tbody>
              <tr><td><strong>1. ¿Foco?</strong></td><td><input type="text" value="${m.preguntasLider?.foco || ''}"></td></tr>
              <tr><td><strong>2. ¿Significado?</strong></td><td><input type="text" value="${m.preguntasLider?.significado || ''}"></td></tr>
              <tr><td><strong>3. ¿Acción?</strong></td><td><input type="text" value="${m.preguntasLider?.accion || ''}"></td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <div class="action-bar">
    <button class="primary" id="saveBtn">Guardar</button>
    <button id="loadBtn">Cargar</button>
    <button id="exportBtn">Exportar</button>
    <button id="printBtn">Imprimir / PDF</button>
    <button id="clearBtn" style="color:#fca5a5;">Limpiar</button>
  </div>

  <script>
    document.getElementById('printBtn').addEventListener('click', () => { window.print(); });
  </script>
</body>
</html>
            `;
    }
  },
  'Workbook3': {
    id: 'Workbook3',
    name: 'Workbook 3 — Comunicación',
    prompt: `
            Eres un EXPERTO EN COMUNICACIÓN ESTRATÉGICA y STORYTELLING.
            Analiza la sesión y extrae la información para el "Workbook 3 - Comunicación".
            
            ESPECIFICACIONES DEL JSON DE SALIDA:
            {
                "success": true,
                "metadata": {
                    "objetivo": "Objetivo principal de la comunicación",
                    "contexto": "Escenario o audiencia clave",
                    "insumos": {
                        "problema": "El dolor que resuelves",
                        "audiencia": "A quién te diriges",
                        "diferencial": "Tu propuesta única de valor",
                        "prueba": "Dato o evidencia de éxito"
                    },
                    "speech": {
                        "quienEres": "Presentación memorable",
                        "queHaces": "Resultado que entregas",
                        "porQueImporta": "Tu diferencial + dato",
                        "hook": "Llamado a la acción o pregunta final"
                    },
                    "elevatorCompleto": "Discurso fluido de 60 segundos",
                    "version15": "Versión súper corta",
                    "tono": "Tono sugerido (Ejecutivo, Inspirador, etc.)",
                    "logrosProf": "Lista de hitos profesionales",
                    "logrosPers": "Lista de hitos personales",
                    "historia": "Estructura STAR (Situación, Tarea, Acción, Resultado)",
                    "cta": "Call to action específico",
                    "mensajes": "Ideas fuerza que deben quedar en la mente"
                }
            }
        `,
    exportTemplate: (workbook: any) => {
      const m = workbook.metadata || {};

      return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>${workbook.title} — Comunicación</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">

  <style>
    :root{
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --accent: #0891b2; 
      --accent-light: #cffafe; 
      --accent-glow: rgba(8, 145, 178, 0.15);
      --radius: 16px;
      --font-stack: 'Inter', system-ui, -apple-system, sans-serif;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0; font-family: var(--font-stack); background-color: var(--bg);
      color: var(--text-main); line-height: 1.6; padding-bottom: 100px;
    }
    .layout { display: grid; grid-template-columns: 240px 1fr; max-width: 1100px; margin: 20px auto; gap: 24px; padding: 0 20px; }
    @media (max-width: 900px) { .layout { display: block; padding: 0 16px; margin-top: 110px; } }
    .mobile-nav-wrapper { display: none; position: fixed; top: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); z-index: 90; border-bottom: 1px solid var(--card-border); padding: 10px 0 0 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    @media (max-width: 900px) { .mobile-nav-wrapper { display: block; } }
    .mobile-header { padding: 0 16px 10px; }
    .mobile-header h1 { font-size: 18px; margin: 0; color: var(--text-main); }
    .mobile-nav-scroller { display: flex; overflow-x: auto; padding: 0 16px 10px; gap: 10px; scrollbar-width: none; }
    .mobile-nav-scroller::-webkit-scrollbar { display: none; }
    .nav-pill { white-space: nowrap; font-size: 13px; font-weight: 600; color: var(--text-muted); background: #f1f5f9; padding: 6px 14px; border-radius: 20px; text-decoration: none; transition: all 0.2s; }
    .nav-pill.active { background: var(--text-main); color: white; }
    .sidebar { position: sticky; top: 20px; height: fit-content; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 20px; display: flex; flex-direction: column; gap: 6px; box-shadow: var(--shadow); }
    @media (max-width: 900px) { .sidebar { display: none; } }
    .nav-link { display: flex; align-items: center; gap: 10px; color: var(--text-muted); text-decoration: none; padding: 10px 12px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: all 0.2s; }
    .nav-link:hover { background: #f1f5f9; color: var(--text-main); }
    .nav-link.active { background: var(--accent-light); color: var(--accent); border-left: 3px solid var(--accent); font-weight: 600; }
    .card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 30px; margin-bottom: 24px; box-shadow: var(--shadow); }
    @media (max-width: 600px) { .card { padding: 20px; } }
    h1 { font-size: 26px; font-weight: 800; margin-top: 0; color: var(--text-main); letter-spacing: -0.5px;}
    h2 { font-size: 18px; border-bottom: 1px solid var(--card-border); padding-bottom: 12px; margin-bottom: 16px; margin-top: 0;}
    p.subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 20px; line-height: 1.5; }
    .highlight-box { background: #ecfeff; border: 1px solid #cffafe; border-radius: 12px; padding: 20px; margin-top: 20px; }
    label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 6px; }
    input, textarea, select { width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; color: var(--text-main); padding: 12px 14px; border-radius: 10px; font-family: inherit; font-size: 15px; transition: all 0.2s; -webkit-appearance: none; }
    input:focus, textarea:focus, select:focus { outline: none; border-color: var(--accent); background: white; box-shadow: 0 0 0 3px var(--accent-glow); }
    textarea { resize: vertical; min-height: 100px; }
    .table-responsive { overflow-x: auto; border-radius: 10px; border: 1px solid var(--card-border); background: white; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; min-width: 700px; }
    th, td { padding: 14px; text-align: left; border-bottom: 1px solid var(--card-border); font-size: 14px; vertical-align: top; }
    th { background: #f8fafc; color: var(--text-muted); font-weight: 700; font-size: 11px; text-transform: uppercase; }
    td input, td textarea { background: transparent; border: 1px solid transparent; padding: 6px; }
    td input:focus, td textarea:focus { background: white; border-color: var(--accent); }
    .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media(max-width:700px){ .two-cols{ grid-template-columns: 1fr; } }
    .action-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; padding: 8px 10px; border-radius: 100px; display: flex; gap: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 100; max-width: 90%; }
    .action-bar button { background: transparent; border: none; color: #cbd5e1; padding: 10px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .action-bar button:hover { color: white; background: rgba(255,255,255,0.1); }
    .action-bar button.primary { background: var(--accent); color: white; }
    #toast { visibility: hidden; min-width: 250px; background-color: var(--text-main); color: #fff; text-align: center; border-radius: 50px; padding: 12px 24px; position: fixed; z-index: 101; left: 50%; top: 20px; transform: translateX(-50%); font-weight: 500; font-size: 14px; opacity: 0; transition: all 0.3s; }
    #toast.show { visibility: visible; opacity: 1; top: 50px; }
    .tag { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-right: 5px; margin-bottom: 5px;}
    .tag-green { background: #d1fae5; color: #065f46; }
    .tag-yellow { background: #fef3c7; color: #92400e; }
    .tag-red { background: #fee2e2; color: #991b1b; }
    @media print { body { background: white; padding: 0; } .sidebar, .action-bar, .mobile-nav-wrapper { display: none; } .layout { display: block; margin: 0; } .card { box-shadow: none; border: 1px solid #ccc; break-inside: avoid; } }
  </style>
</head>
<body>
  <div id="toast">✅ Guardado</div>
  <div class="mobile-nav-wrapper">
    <div class="mobile-header">
      <span style="color:var(--accent); font-size:11px; font-weight:800; text-transform:uppercase;">Módulo 3</span>
      <h1>${workbook.title}</h1>
    </div>
    <nav class="mobile-nav-scroller">
      <a href="#sec-obj" class="nav-pill active">1. Objetivo</a>
      <a href="#sec-insumos" class="nav-pill">2. Insumos</a>
      <a href="#sec-estructura" class="nav-pill">3. Estructura</a>
      <a href="#sec-logros" class="nav-pill">4. Logros</a>
      <a href="#sec-cierre" class="nav-pill">5. Cierre</a>
    </nav>
  </div>

  <div class="layout">
    <aside class="sidebar">
      <div style="margin-bottom: 10px; padding: 0 12px;">
        <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:800;">Índice</span>
      </div>
      <a href="#sec-obj" class="nav-link active">1. Objetivo</a>
      <a href="#sec-insumos" class="nav-link">2. Insumos Clave</a>
      <a href="#sec-estructura" class="nav-link">3. Elevator Speech</a>
      <a href="#sec-logros" class="nav-link">4. Logros & Story</a>
      <a href="#sec-cierre" class="nav-link">5. CTA & Cierre</a>
    </aside>

    <main class="main-content">
      <section id="sec-obj" class="card">
        <span style="color:var(--accent); font-weight:700; font-size:12px;">Paso 1</span>
        <h1>Definición de Intención</h1>
        <p class="subtitle">¿Qué quieres lograr con esta conversación?</p>
        <div class="two-cols">
          <div>
            <label>Objetivo Principal</label>
            <input type="text" id="objetivo" value="${m.objetivo || ''}">
          </div>
          <div>
            <label>Contexto de uso</label>
            <input type="text" id="contexto" value="${m.contexto || ''}">
          </div>
        </div>
      </section>

      <section id="sec-insumos" class="card">
        <h2>2. Los 3 Pilares del Mensaje</h2>
        <div class="two-cols">
          <div>
            <label>¿Qué problema resuelves?</label>
            <textarea id="problema">${m.insumos?.problema || ''}</textarea>
          </div>
          <div>
            <label>¿Para quién?</label>
            <textarea id="audiencia">${m.insumos?.audiencia || ''}</textarea>
          </div>
          <div>
            <label>Tu Diferencial</label>
            <textarea id="diferencial">${m.insumos?.diferencial || ''}</textarea>
          </div>
          <div>
            <label>La Prueba (1 Dato)</label>
            <textarea id="prueba">${m.insumos?.prueba || ''}</textarea>
          </div>
        </div>
      </section>

      <section id="sec-estructura" class="card">
        <h2>3. Constructor del Elevator Speech</h2>
        <div class="table-responsive">
          <table>
            <thead><tr><th width="20%">Parte</th><th>Tu Redacción</th><th width="25%">Tip</th></tr></thead>
            <tbody>
              <tr>
                <td><strong>1. Quién eres</strong></td>
                <td><textarea id="quienEres">${m.speech?.quienEres || ''}</textarea></td>
                <td style="color:var(--text-muted); font-size:13px;">Usa un detalle memorable.</td>
              </tr>
              <tr>
                <td><strong>2. Qué haces</strong></td>
                <td><textarea id="queHaces">${m.speech?.queHaces || ''}</textarea></td>
                <td style="color:var(--text-muted); font-size:13px;">Enfócate en el resultado.</td>
              </tr>
              <tr>
                <td><strong>3. Por qué importa</strong></td>
                <td><textarea id="porQueImporta">${m.speech?.porQueImporta || ''}</textarea></td>
                <td style="color:var(--text-muted); font-size:13px;">Aquí va tu dato de prueba.</td>
              </tr>
              <tr>
                <td><strong>4. Hook/Cierre</strong></td>
                <td><textarea id="hook">${m.speech?.hook || ''}</textarea></td>
                <td style="color:var(--text-muted); font-size:13px;">Invita a la acción.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="highlight-box">
          <label style="color:var(--accent); font-size:13px;">🌟 Tu Versión Final (30-60s)</label>
          <textarea id="elevatorCompleto" style="border:none; background:transparent; font-size:16px; min-height:120px;">${m.elevatorCompleto || ''}</textarea>
        </div>
        <div class="two-cols" style="margin-top:20px;">
          <div>
            <label>Versión Ultra-Corta (15s)</label>
            <textarea id="version15">${m.version15 || ''}</textarea>
          </div>
          <div>
            <label>Tono Deseado</label>
            <input type="text" id="tono" value="${m.tono || ''}">
          </div>
        </div>
      </section>

      <section id="sec-logros" class="card">
        <h2>4. Banco de Logros</h2>
        <div class="two-cols">
          <div>
            <label>Top 5 Logros Profesionales</label>
            <textarea id="logrosProf">${m.logrosProf || ''}</textarea>
          </div>
          <div>
            <label>Top 5 Logros Personales</label>
            <textarea id="logrosPers">${m.logrosPers || ''}</textarea>
          </div>
        </div>
        <div style="margin-top:20px;">
          <label>Micro-Historia (Método STAR)</label>
          <textarea id="historia">${m.historia || ''}</textarea>
        </div>
      </section>

      <section id="sec-cierre" class="card">
        <h2>5. Cierre & CTA</h2>
        <div class="two-cols">
          <div>
            <label>Call to Action (CTA)</label>
            <input type="text" id="cta" value="${m.cta || ''}">
          </div>
          <div>
            <label>Mensajes Clave (Repetir)</label>
            <textarea id="mensajes">${m.mensajes || ''}</textarea>
          </div>
        </div>
      </section>
    </main>
  </div>

  <div class="action-bar">
    <button class="primary" id="saveBtn">Guardar</button>
    <button id="loadBtn">Cargar</button>
    <button id="exportBtn">Exportar</button>
    <button id="printBtn">Imprimir / PDF</button>
    <button id="clearBtn" style="color:#fca5a5;">Limpiar</button>
  </div>

  <script>
    document.getElementById('printBtn').addEventListener('click', () => { window.print(); });
  </script>
</body>
</html>
        `;
    }
  },
  'Workbook4': {
    id: 'Workbook4',
    name: 'Workbook 4 — Networking',
    prompt: `
            Eres un EXPERTO EN ESTRATEGIA DE RELACIONES y NETWORKING DE ALTO NIVEL.
            Analiza la sesión y extrae la información para el "Workbook 4 - Networking".
            
            ESPECIFICACIONES DEL JSON DE SALIDA:
            {
                "success": true,
                "metadata": {
                    "hab1": "Habilidad #1 seleccionada",
                    "accionHab1": "Acción para la habilidad #1",
                    "hab2": "Habilidad #2 seleccionada",
                    "accionHab2": "Acción para la habilidad #2",
                    "miedo1": "Análisis del peor escenario",
                    "miedo2": "Racionalización del miedo",
                    "orgPersona": "Persona clave interna",
                    "orgAccion": "Acción de contacto interna",
                    "cliPersona": "Persona clave externa/cliente",
                    "cliAccion": "Acción de contacto externa",
                    "socPersona": "Persona del círculo social",
                    "socAccion": "Acción de contacto social",
                    "metaRel": "Metas de networking del líder",
                    "valorRel": "Oferta de valor del líder",
                    "contacts": [
                        { "name": "...", "role": "...", "power": 1, "interest": 3 }
                    ],
                    "activation": [
                        { "contact": "...", "interest": "...", "value": "...", "frequency": "..." }
                    ]
                }
            }
        `,
    exportTemplate: (workbook: any) => {
      const m = workbook.metadata || {};
      const contacts = m.contacts || [];
      const activation = m.activation || [];

      return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <title>${workbook.title} — Networking</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">

  <style>
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --accent: #059669;
      --accent-light: #d1fae5;
      --accent-glow: rgba(5, 150, 105, 0.15);
      --radius: 16px;
      --font-stack: 'Inter', system-ui, -apple-system, sans-serif;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0; font-family: var(--font-stack); background-color: var(--bg);
      color: var(--text-main); line-height: 1.6; padding-bottom: 100px;
    }
    .layout { display: grid; grid - template - columns: 240px 1fr; max - width: 1100px; margin: 20px auto; gap: 24px; padding: 0 20px; }
@media(max - width: 900px) { .layout { display: block; padding: 0 16px; margin - top: 110px; } }
    .mobile - nav - wrapper { display: none; position: fixed; top: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.95); backdrop - filter: blur(10px); z - index: 90; border - bottom: 1px solid var(--card - border); padding: 10px 0 0 0; box - shadow: 0 4px 12px rgba(0, 0, 0, 0.03); }
@media(max - width: 900px) { .mobile - nav - wrapper { display: block; } }
    .mobile - header { padding: 0 16px 10px; }
    .mobile - header h1 { font - size: 18px; margin: 0; color: var(--text - main); }
    .mobile - nav - scroller { display: flex; overflow - x: auto; padding: 0 16px 10px; gap: 10px; scrollbar - width: none; }
    .mobile - nav - scroller:: -webkit - scrollbar { display: none; }
    .nav - pill { white - space: nowrap; font - size: 13px; font - weight: 600; color: var(--text - muted); background: #f1f5f9; padding: 6px 14px; border - radius: 20px; text - decoration: none; transition: all 0.2s; }
    .nav - pill.active { background: var(--text - main); color: white; }
    .sidebar { position: sticky; top: 20px; height: fit - content; background: var(--card - bg); border: 1px solid var(--card - border); border - radius: var(--radius); padding: 20px; display: flex; flex - direction: column; gap: 6px; box - shadow: var(--shadow); }
@media(max - width: 900px) { .sidebar { display: none; } }
    .nav - link { display: flex; align - items: center; gap: 10px; color: var(--text - muted); text - decoration: none; padding: 10px 12px; border - radius: 8px; font - size: 14px; font - weight: 500; transition: all 0.2s; }
    .nav - link:hover { background: #f1f5f9; color: var(--text - main); }
    .nav - link.active { background: var(--accent - light); color: var(--accent); border - left: 3px solid var(--accent); font - weight: 600; }
    .card { background: var(--card - bg); border: 1px solid var(--card - border); border - radius: var(--radius); padding: 30px; margin - bottom: 24px; box - shadow: var(--shadow); }
@media(max - width: 600px) { .card { padding: 20px; } }
    h1 { font - size: 26px; font - weight: 800; margin - top: 0; color: var(--text - main); letter - spacing: -0.5px; }
    h2 { font - size: 18px; border - bottom: 1px solid var(--card - border); padding - bottom: 12px; margin - bottom: 16px; margin - top: 0; }
p.subtitle { color: var(--text - muted); font - size: 14px; margin - bottom: 20px; line - height: 1.5; }
    .chip - container { display: flex; flex - wrap: wrap; gap: 8px; margin - bottom: 15px; }
    .chip { font - size: 12px; background: #f1f5f9; padding: 4px 10px; border - radius: 20px; color: var(--text - muted); font - weight: 600; }
    label { display: block; font - size: 12px; font - weight: 700; text - transform: uppercase; letter - spacing: 0.5px; color: var(--text - muted); margin - bottom: 6px; }
input, textarea, select { width: 100 %; background: #f8fafc; border: 1px solid #cbd5e1; color: var(--text - main); padding: 12px 14px; border - radius: 10px; font - family: inherit; font - size: 15px; transition: all 0.2s; -webkit - appearance: none; }
input: focus, textarea: focus, select:focus { outline: none; border - color: var(--accent); background: white; box - shadow: 0 0 0 3px var(--accent - glow); }
    textarea { resize: vertical; min - height: 100px; }
    .table - responsive { overflow - x: auto; border - radius: 10px; border: 1px solid var(--card - border); background: white; margin - bottom: 15px; }
    table { width: 100 %; border - collapse: collapse; min - width: 700px; }
th, td { padding: 14px; text - align: left; border - bottom: 1px solid var(--card - border); font - size: 14px; vertical - align: top; }
    th { background: #f8fafc; color: var(--text - muted); font - weight: 700; font - size: 11px; text - transform: uppercase; }
    td input, td textarea, td select { background: transparent; border: 1px solid transparent; padding: 6px; }
    td input: focus, td textarea: focus, td select:focus { background: white; border - color: var(--accent); }
    .two - cols { display: grid; grid - template - columns: 1fr 1fr; gap: 20px; }
@media(max - width: 700px) { .two - cols{ grid - template - columns: 1fr; } }
    .action - bar { position: fixed; bottom: 20px; left: 50 %; transform: translateX(-50 %); background: #1e293b; padding: 8px 10px; border - radius: 100px; display: flex; gap: 8px; box - shadow: 0 10px 25px rgba(0, 0, 0, 0.2); z - index: 100; max - width: 90 %; }
    .action - bar button { background: transparent; border: none; color: #cbd5e1; padding: 10px 16px; border - radius: 20px; font - size: 13px; font - weight: 600; cursor: pointer; }
    .action - bar button:hover { color: white; background: rgba(255, 255, 255, 0.1); }
    .action - bar button.primary { background: var(--accent); color: white; }
#toast { visibility: hidden; min - width: 250px; background - color: var(--text - main); color: #fff; text - align: center; border - radius: 50px; padding: 12px 24px; position: fixed; z - index: 101; left: 50 %; top: 20px; transform: translateX(-50 %); font - weight: 500; font - size: 14px; opacity: 0; transition: all 0.3s; }
#toast.show { visibility: visible; opacity: 1; top: 50px; }
@media print { body { background: white; padding: 0; } .sidebar, .action - bar, .mobile - nav - wrapper { display: none; } .layout { display: block; margin: 0; } .card { box - shadow: none; border: 1px solid #ccc; break-inside: avoid; } }
</style>
  </head>
  < body >
  <div id="toast" >✅ Guardado </div>
    < div class="mobile-nav-wrapper" >
      <div class="mobile-header" >
        <span style="color:var(--accent); font-size:11px; font-weight:800; text-transform:uppercase;" > Módulo 4 </span>
          < h1 > ${workbook.title} </h1>
            </div>
            < nav class="mobile-nav-scroller" >
              <a href="#sec-skills" class="nav-pill active" > 1. Habilidades </a>
                < a href = "#sec-miedos" class="nav-pill" > 2. Miedos </a>
                  < a href = "#sec-acciones" class="nav-pill" > 3. Acciones </a>
                    < a href = "#sec-estrategia" class="nav-pill" > 4. Estrategia </a>
                      < a href = "#sec-mapa" class="nav-pill" > 5. Mapa A / B / C </a>
                        </nav>
                        </div>

                        < div class="layout" >
                          <aside class="sidebar" >
                            <div style="margin-bottom: 10px; padding: 0 12px;" >
                              <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:800;" > Contenido </span>
                                </div>
                                < a href = "#sec-skills" class="nav-link active" > 1. Habilidades Clave </a>
                                  < a href = "#sec-miedos" class="nav-link" > 2. Superar Miedos </a>
                                    < a href = "#sec-acciones" class="nav-link" > 3. Acciones 7 Días </a>
                                      < a href = "#sec-estrategia" class="nav-link" > 4. Estrategia </a>
                                        < a href = "#sec-mapa" class="nav-link" > 5. Mapa Prioridades </a>
                                          < a href = "#sec-plan" class="nav-link" > 6. Activación </a>
                                            </aside>

                                            < main class="main-content" >
                                              <section id="sec-skills" class="card" >
                                                <span style="color:var(--accent); font-weight:700; font-size:12px;" > Paso 1 </span>
                                                  < h1 > Habilidades de Conexión </h1>
                                                    < p class="subtitle" > Selecciona 2 áreas para fortalecer esta semana.</p>
                                                      < div class="chip-container" >
                                                        <span class="chip" > Escucha Activa < /span><span class="chip">Storytelling</span > <span class="chip" > Rapport < /span><span class="chip">Persuasión</span >
                                                          </div>
                                                          < div class="two-cols" >
                                                            <div>
                                                            <label>Habilidad #1 </label>
                                                              < input type = "text" value = "${m.hab1 || ''}" >
                                                                <textarea style="margin-top:10px;" > ${m.accionHab1 || ''} </textarea>
                                                                  </div>
                                                                  < div >
                                                                  <label>Habilidad #2 </label>
                                                                    < input type = "text" value = "${m.hab2 || ''}" >
                                                                      <textarea style="margin-top:10px;" > ${m.accionHab2 || ''} </textarea>
                                                                        </div>
                                                                        </div>
                                                                        </section>

                                                                        < section id = "sec-miedos" class="card" >
                                                                          <h2>2. Superando la Barrera(Miedo) </h2>
                                                                            < div class="two-cols" >
                                                                              <div>
                                                                              <label>¿Qué es lo peor que puede pasar ? </label>
                                                                                < textarea > ${m.miedo1 || ''} </textarea>
                                                                                  </div>
                                                                                  < div >
                                                                                  <label>¿Qué pensarán realmente ? </label>
                                                                                    < textarea > ${m.miedo2 || ''} </textarea>
                                                                                      </div>
                                                                                      </div>
                                                                                      </section>

                                                                                      < section id = "sec-acciones" class="card" >
                                                                                        <h2>3. Activación Inmediata </h2>
                                                                                          < div class="table-responsive" >
                                                                                            <table>
                                                                                            <thead><tr><th width="30%" > Categoría < /th><th>Persona</th > <th>Acción < /th></tr > </thead>
                                                                                              < tbody >
                                                                                              <tr><td><strong>Organización Interna < /strong></td > <td><input type="text" value = "${m.orgPersona || ''}" > </td><td><input type="text" value="${m.orgAccion || ''}"></td > </tr>
                                                                                                < tr > <td><strong>Cliente / Externo < /strong></td > <td><input type="text" value = "${m.cliPersona || ''}" > </td><td><input type="text" value="${m.cliAccion || ''}"></td > </tr>
                                                                                                  < tr > <td><strong>Círculo Social < /strong></td > <td><input type="text" value = "${m.socPersona || ''}" > </td><td><input type="text" value="${m.socAccion || ''}"></td > </tr>
                                                                                                    </tbody>
                                                                                                    </table>
                                                                                                    </div>
                                                                                                    </section>

                                                                                                    < section id = "sec-estrategia" class="card" >
                                                                                                      <h2>4. Estrategia de Valor </h2>
                                                                                                        < div class="two-cols" >
                                                                                                          <div>
                                                                                                          <label>Mis Metas de Networking </label>
                                                                                                            < textarea rows = "3" > ${m.metaRel || ''} </textarea>
                                                                                                              </div>
                                                                                                              < div >
                                                                                                              <label>Mi Oferta de Valor </label>
                                                                                                                < textarea rows = "3" > ${m.valorRel || ''} </textarea>
                                                                                                                  </div>
                                                                                                                  </div>
                                                                                                                  </section>

                                                                                                                  < section id = "sec-mapa" class="card" >
                                                                                                                    <h2>5. Mapa de Prioridades(A / B / C) </h2>
                                                                                                                      < div class="table-responsive" >
                                                                                                                        <table>
                                                                                                                        <thead><tr><th>Nombre < /th><th>Rol</th > <th>Poder < /th><th>Interés</th > </tr></thead >
                                                                                                                        <tbody>
                                                                                                                        ${contacts.map((c: any) => `
                <tr>
                  <td><input type="text" value="${c.name || ''}"></td>
                  <td><input type="text" value="${c.role || ''}"></td>
                  <td><input type="text" value="${c.power || ''}" style="text-align:center;"></td>
                  <td><input type="text" value="${c.interest || ''}" style="text-align:center;"></td>
                </tr>
              `).join('')
        }
              ${(!contacts || contacts.length < 3) ? '<tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>'.repeat(3 - (contacts?.length || 0)) : ''}
</tbody>
  </table>
  </div>
  </section>

  < section id = "sec-plan" class="card" >
    <h2>6. Plan de Activación </h2>
      < div class="table-responsive" >
        <table>
        <thead><tr><th width="20%" > Contacto < /th><th>Interés</th > <th>Valor < /th><th>Frecuencia</th > </tr></thead >
          <tbody>
          ${activation.map((a: any) => `
                <tr>
                  <td><input type="text" value="${a.contact || ''}"></td>
                  <td><textarea rows="1">${a.interest || ''}</textarea></td>
                  <td><textarea rows="1">${a.value || ''}</textarea></td>
                  <td><input type="text" value="${a.frequency || ''}"></td>
                </tr>
              `).join('')
        }
              ${(!activation || activation.length < 2) ? '<tr><td><input type="text"></td><td><textarea rows="1"></textarea></td><td><textarea rows="1"></textarea></td><td><input type="text"></td></tr>'.repeat(2 - (activation?.length || 0)) : ''}
</tbody>
  </table>
  </div>
  </section>
  </main>
  </div>

  < div class="action-bar" >
    <button class="primary" id = "saveBtn" > Guardar </button>
      < button id = "loadBtn" > Cargar </button>
        < button id = "exportBtn" > Exportar </button>
          < button id = "printBtn" > Imprimir / PDF </button>
            < button id = "clearBtn" style = "color:#fca5a5;" > Limpiar </button>
              </div>

              <script>
document.getElementById('printBtn').addEventListener('click', () => { window.print(); });
</script>
  </body>
  </html>
    `;
    }
  },
  'Workbook5': {
    id: 'Workbook5',
    name: 'Workbook 5 — Serenidad',
    prompt: `
            Eres un EXPERTO EN GESTIÓN EMOCIONAL y PSICOLOGÍA DEL LIDERAZGO.
            Analiza la sesión y extrae la información para el "Workbook 5 - Serenidad".
            
            ESPECIFICACIONES DEL JSON DE SALIDA:
            {
                "success": true,
                "metadata": {
                    "emo1": "Nombre de la emoción 1",
                    "emo1i": 5,
                    "emo1n": "Sensación o necesidad de la emoción 1",
                    "emo2": "Nombre de la emoción 2",
                    "emo2i": 5,
                    "emo2n": "Sensación o necesidad de la emoción 2",
                    "triggers": "Lista de detonantes principales",
                    "patron": "Descripción del patrón de reacción automática",
                    "r1s": "Situación + Pensamiento Automático",
                    "r1r": "Reencuadre (Nueva Pregunta)",
                    "r1e": "Emoción Original",
                    "r1a": "Nueva Acción",
                    "ancla1": "Ancla Física (Cuerpo)",
                    "ancla2": "Ancla Mental",
                    "preguntas": "Protocolo de decisión o preguntas clave",
                    "h1": "Micro-hábito 1",
                    "h1t": "Señal para el hábito 1",
                    "h1d": "Duración del hábito 1",
                    "h1r": "Recompensa del hábito 1",
                    "h2": "Micro-hábito 2",
                    "h2t": "Señal para el hábito 2",
                    "h2d": "Duración del hábito 2",
                    "h2r": "Recompensa del hábito 2"
                }
            }
        `,
    exportTemplate: (workbook: any) => {
      const m = workbook.metadata || {};

      return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>${workbook.title} — Serenidad</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">

  <style>
    :root{
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --accent: #0ea5e9; 
      --accent-light: #e0f2fe; 
      --accent-glow: rgba(14, 165, 233, 0.15);
      --radius: 16px;
      --font-stack: 'Inter', system-ui, -apple-system, sans-serif;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0; font-family: var(--font-stack); background-color: var(--bg);
      color: var(--text-main); line-height: 1.6; padding-bottom: 100px;
    }
    .layout { display: grid; grid-template-columns: 240px 1fr; max-width: 1100px; margin: 20px auto; gap: 24px; padding: 0 20px; }
    @media (max-width: 900px) { .layout { display: block; padding: 0 16px; margin-top: 110px; } }
    .mobile-nav-wrapper { display: none; position: fixed; top: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); z-index: 90; border-bottom: 1px solid var(--card-border); padding: 10px 0 0 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    @media (max-width: 900px) { .mobile-nav-wrapper { display: block; } }
    .mobile-header { padding: 0 16px 10px; }
    .mobile-header h1 { font-size: 18px; margin: 0; color: var(--text-main); }
    .mobile-nav-scroller { display: flex; overflow-x: auto; padding: 0 16px 10px; gap: 10px; scrollbar-width: none; }
    .mobile-nav-scroller::-webkit-scrollbar { display: none; }
    .nav-pill { white-space: nowrap; font-size: 13px; font-weight: 600; color: var(--text-muted); background: #f1f5f9; padding: 6px 14px; border-radius: 20px; text-decoration: none; transition: all 0.2s; }
    .nav-pill.active { background: var(--text-main); color: white; }
    .sidebar { position: sticky; top: 20px; height: fit-content; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 20px; display: flex; flex-direction: column; gap: 6px; box-shadow: var(--shadow); }
    @media (max-width: 900px) { .sidebar { display: none; } }
    .nav-link { display: flex; align-items: center; gap: 10px; color: var(--text-muted); text-decoration: none; padding: 10px 12px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: all 0.2s; }
    .nav-link:hover { background: #f1f5f9; color: var(--text-main); }
    .nav-link.active { background: var(--accent-light); color: var(--accent); border-left: 3px solid var(--accent); font-weight: 600; }
    .card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 30px; margin-bottom: 24px; box-shadow: var(--shadow); }
    @media (max-width: 600px) { .card { padding: 20px; } }
    h1 { font-size: 26px; font-weight: 800; margin-top: 0; color: var(--text-main); letter-spacing: -0.5px;}
    h2 { font-size: 18px; border-bottom: 1px solid var(--card-border); padding-bottom: 12px; margin-bottom: 16px; margin-top: 0;}
    p.subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 20px; line-height: 1.5; }
    .note { background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 12px; font-size: 13px; color: #1e40af; margin-bottom: 15px; }
    label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 6px; }
    input, textarea, select { width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; color: var(--text-main); padding: 12px 14px; border-radius: 10px; font-family: inherit; font-size: 15px; transition: all 0.2s; -webkit-appearance: none; }
    input:focus, textarea:focus, select:focus { outline: none; border-color: var(--accent); background: white; box-shadow: 0 0 0 3px var(--accent-glow); }
    textarea { resize: vertical; min-height: 100px; }
    .table-responsive { overflow-x: auto; border-radius: 10px; border: 1px solid var(--card-border); background: white; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; min-width: 700px; }
    th, td { padding: 14px; text-align: left; border-bottom: 1px solid var(--card-border); font-size: 14px; vertical-align: top; }
    th { background: #f8fafc; color: var(--text-muted); font-weight: 700; font-size: 11px; text-transform: uppercase; }
    td input, td textarea { background: transparent; border: 1px solid transparent; padding: 6px; }
    td input:focus, td textarea:focus { background: white; border-color: var(--accent); }
    input[type=range] { -webkit-appearance: none; height: 6px; background: #e2e8f0; border: none; padding: 0; margin-top: 10px; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: white; border: 2px solid var(--accent); margin-top: -6px; cursor: pointer; }
    input[type=range]::-webkit-slider-runnable-track { height: 6px; background: #e2e8f0; border-radius: 3px; }
    .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media(max-width:700px){ .two-cols{ grid-template-columns: 1fr; } }
    .action-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; padding: 8px 10px; border-radius: 100px; display: flex; gap: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 100; max-width: 90%; }
    .action-bar button { background: transparent; border: none; color: #cbd5e1; padding: 10px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .action-bar button:hover { color: white; background: rgba(255,255,255,0.1); }
    .action-bar button.primary { background: var(--accent); color: white; }
    #toast { visibility: hidden; min-width: 250px; background-color: var(--text-main); color: #fff; text-align: center; border-radius: 50px; padding: 12px 24px; position: fixed; z-index: 101; left: 50%; top: 20px; transform: translateX(-50%); font-weight: 500; font-size: 14px; opacity: 0; transition: all 0.3s; }
    #toast.show { visibility: visible; opacity: 1; top: 50px; }
    @media print { body { background: white; padding: 0; } .sidebar, .action-bar, .mobile-nav-wrapper { display: none; } .layout { display: block; margin: 0; } .card { box-shadow: none; border: 1px solid #ccc; break-inside: avoid; } }
  </style>
</head>
<body>
  <div id="toast">✅ Guardado</div>
  <div class="mobile-nav-wrapper">
    <div class="mobile-header">
      <span style="color:var(--accent); font-size:11px; font-weight:800; text-transform:uppercase;">Módulo 5</span>
      <h1>${workbook.title}</h1>
    </div>
    <nav class="mobile-nav-scroller">
      <a href="#sec-termo" class="nav-pill active">1. Termómetro</a>
      <a href="#sec-triggers" class="nav-pill">2. Triggers</a>
      <a href="#sec-reframe" class="nav-pill">3. Reencuadre</a>
      <a href="#sec-anclas" class="nav-pill">4. Anclas</a>
      <a href="#sec-habitos" class="nav-pill">5. Hábitos</a>
    </nav>
  </div>

  <div class="layout">
    <aside class="sidebar">
      <div style="margin-bottom: 10px; padding: 0 12px;">
        <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:800;">Contenido</span>
      </div>
      <a href="#sec-termo" class="nav-link active">1. Termómetro Emocional</a>
      <a href="#sec-triggers" class="nav-link">2. Triggers</a>
      <a href="#sec-reframe" class="nav-link">3. Reencuadre</a>
      <a href="#sec-anclas" class="nav-link">4. Rutinas (Anclas)</a>
      <a href="#sec-habitos" class="nav-link">5. Plan 7 Días</a>

      <div style="margin-top:20px; padding:15px; border-top:1px solid var(--card-border);">
        <label>Kit Express (2 min)</label>
        <div style="font-size:13px; color:var(--text-muted); display:flex; flex-direction:column; gap:8px;">
          <span>💨 <strong>Respira 4-6</strong></span>
          <span>🏷️ <strong>Nombra:</strong> "Siento..."</span>
          <span>🎯 <strong>Acción:</strong> 1 paso</span>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <section id="sec-termo" class="card">
        <span style="color:var(--accent); font-weight:700; font-size:12px;">Paso 1</span>
        <h1>Termómetro Emocional</h1>
        <p class="subtitle">Identifica la emoción y su intensidad para gestionarla.</p>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th width="20%">Emoción</th>
                <th width="30%">Intensidad (0-10)</th>
                <th>Sensación / Necesidad</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="text" value="${m.emo1 || ''}"></td>
                <td style="padding: 10px 20px;">
                  <input type="range" min="0" max="10" value="${m.emo1i || 5}" oninput="updateVal('v1', this.value)">
                  <span id="v1" style="font-size:12px; font-weight:700; color:var(--accent); float:right;">${m.emo1i || 5}</span>
                </td>
                <td><input type="text" value="${m.emo1n || ''}"></td>
              </tr>
              <tr>
                <td><input type="text" value="${m.emo2 || ''}"></td>
                <td style="padding: 10px 20px;">
                  <input type="range" min="0" max="10" value="${m.emo2i || 5}" oninput="updateVal('v2', this.value)">
                  <span id="v2" style="font-size:12px; font-weight:700; color:var(--accent); float:right;">${m.emo2i || 5}</span>
                </td>
                <td><input type="text" value="${m.emo2n || ''}"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="sec-triggers" class="card">
        <h2>2. Triggers (Detonantes)</h2>
        <p class="subtitle">¿Qué situaciones disparan tu reacción automática?</p>
        <div class="two-cols">
          <div>
            <label>Mis 3 Triggers Principales</label>
            <textarea>${m.triggers || ''}</textarea>
          </div>
          <div>
            <label>Mi Patrón de Reacción</label>
            <textarea>${m.patron || ''}</textarea>
          </div>
        </div>
      </section>

      <section id="sec-reframe" class="card">
        <h2>3. Reencuadre Cognitivo</h2>
        <p class="subtitle">Cambia la interpretación para cambiar la emoción.</p>
        <div style="background:#f0f9ff; padding:20px; border-radius:12px; border:1px solid #bae6fd; margin-bottom:20px;">
          <div class="two-cols">
            <div>
              <label>Situación + Pensamiento Automático</label>
              <textarea rows="3">${m.r1s || ''}</textarea>
            </div>
            <div>
              <label>Reencuadre (Nueva Pregunta)</label>
              <textarea rows="3">${m.r1r || ''}</textarea>
            </div>
          </div>
        </div>
        <div class="two-cols">
          <div>
            <label>Emoción Original</label>
            <input type="text" value="${m.r1e || ''}">
          </div>
          <div>
            <label>Nueva Acción</label>
            <input type="text" value="${m.r1a || ''}">
          </div>
        </div>
      </section>

      <section id="sec-anclas" class="card">
        <h2>4. Rutinas (Anclas de Calma)</h2>
        <p class="subtitle">Protege tu energía con hábitos simples.</p>
        <div class="two-cols">
          <div>
            <label>Ancla Física (Cuerpo)</label>
            <input type="text" value="${m.ancla1 || ''}">
          </div>
          <div>
            <label>Ancla Mental</label>
            <input type="text" value="${m.ancla2 || ''}">
          </div>
        </div>
        <div style="margin-top:20px;">
          <label>Protocolo de Decisión (Bajo Presión)</label>
          <textarea>${m.preguntas || ''}</textarea>
        </div>
      </section>

      <section id="sec-habitos" class="card">
        <h2>5. Plan de 7 Días</h2>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th width="30%">Micro-hábito</th>
                <th>Señal (Cuándo)</th>
                <th>Duración</th>
                <th>Recompensa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="text" value="${m.h1 || ''}"></td>
                <td><input type="text" value="${m.h1t || ''}"></td>
                <td><input type="text" value="${m.h1d || ''}"></td>
                <td><input type="text" value="${m.h1r || ''}"></td>
              </tr>
              <tr>
                <td><input type="text" value="${m.h2 || ''}"></td>
                <td><input type="text" value="${m.h2t || ''}"></td>
                <td><input type="text" value="${m.h2d || ''}"></td>
                <td><input type="text" value="${m.h2r || ''}"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <div class="action-bar">
    <button class="primary" id="saveBtn">Guardar</button>
    <button id="loadBtn">Cargar</button>
    <button id="exportBtn">Exportar</button>
    <button id="printBtn">Imprimir / PDF</button>
    <button id="clearBtn" style="color:#fca5a5;">Limpiar</button>
  </div>

  <script>
    function updateVal(id, val) {
      document.getElementById(id).textContent = val;
    }
    document.getElementById('printBtn').addEventListener('click', () => { window.print(); });
  </script>
</body>
</html>
    `;
    }
  },
  'Workbook6': {
    id: 'Workbook6',
    name: 'Workbook 6 — Autenticidad I',
    prompt: `
            Eres un EXPERTO EN PERSONAL BRANDING y ESTRATEGIA DE MARCA.
            Analiza la sesión y extrae la información para el "Workbook 6 - Autenticidad I (Latido de Marca)".
            
            ESPECIFICACIONES DEL JSON DE SALIDA:
            {
                "success": true,
                "metadata": {
                    "proposito": "Frase del PPT",
                    "causa": "Lo que le duele o mueve al líder",
                    "antes1": "Estado inicial (dolor)",
                    "despues1": "Estado final (éxito)",
                    "metodo1": "Método de transformación",
                    "prueba1": "Evidencia o prueba",
                    "fraseValor": "Tagline o promesa central",
                    "resultadoMedible": "Dato de respaldo",
                    "audiencia": "Perfil del avatar/audiencia",
                    "necesidadAudiencia": "Necesidad real identificada",
                    "miedosAudiencia": "Miedos u objeciones",
                    "valoresAudiencia": "Qué compran o valoran",
                    "usp": "Propuesta Única de Venta",
                    "pruebasUsp": "3 evidencias de diferenciación",
                    "attr1": "Atributo 1",
                    "attr1c": "Conducta del atributo 1",
                    "attr1n": "Límite (qué no es) del atributo 1",
                    "attr2": "Atributo 2",
                    "attr2c": "Conducta del atributo 2",
                    "attr2n": "Límite del atributo 2",
                    "tono": "Tono de voz principal",
                    "noUso": "Palabras prohibidas",
                    "arq1": "Arquetipo Principal",
                    "arq2": "Arquetipo Secundario",
                    "manifestacion": "Cómo se manifiesta en el día a día",
                    "historia": "Historia de origen o Mini-Bio"
                }
            }
        `,
    exportTemplate: (workbook: any) => {
      const m = workbook.metadata || {};

      return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>${workbook.title} — Latido de Marca</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">

  <style>
    :root{
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --accent: #e11d48; 
      --accent-light: #ffe4e6; 
      --accent-glow: rgba(225, 29, 72, 0.15);
      --radius: 16px;
      --font-stack: 'Inter', system-ui, -apple-system, sans-serif;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0; font-family: var(--font-stack); background-color: var(--bg);
      color: var(--text-main); line-height: 1.6; padding-bottom: 100px;
    }
    .layout { display: grid; grid-template-columns: 240px 1fr; max-width: 1100px; margin: 20px auto; gap: 24px; padding: 0 20px; }
    @media (max-width: 900px) { .layout { display: block; padding: 0 16px; margin-top: 110px; } }
    .mobile-nav-wrapper { display: none; position: fixed; top: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); z-index: 90; border-bottom: 1px solid var(--card-border); padding: 10px 0 0 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    @media (max-width: 900px) { .mobile-nav-wrapper { display: block; } }
    .mobile-header { padding: 0 16px 10px; }
    .mobile-header h1 { font-size: 18px; margin: 0; color: var(--text-main); }
    .mobile-nav-scroller { display: flex; overflow-x: auto; padding: 0 16px 10px; gap: 10px; scrollbar-width: none; }
    .mobile-nav-scroller::-webkit-scrollbar { display: none; }
    .nav-pill { white-space: nowrap; font-size: 13px; font-weight: 600; color: var(--text-muted); background: #f1f5f9; padding: 6px 14px; border-radius: 20px; text-decoration: none; transition: all 0.2s; }
    .nav-pill.active { background: var(--text-main); color: white; }
    .sidebar { position: sticky; top: 20px; height: fit-content; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 20px; display: flex; flex-direction: column; gap: 6px; box-shadow: var(--shadow); }
    @media (max-width: 900px) { .sidebar { display: none; } }
    .nav-link { display: flex; align-items: center; gap: 10px; color: var(--text-muted); text-decoration: none; padding: 10px 12px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: all 0.2s; }
    .nav-link:hover { background: #f1f5f9; color: var(--text-main); }
    .nav-link.active { background: var(--accent-light); color: var(--accent); border-left: 3px solid var(--accent); font-weight: 600; }
    .card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 30px; margin-bottom: 24px; box-shadow: var(--shadow); }
    @media (max-width: 600px) { .card { padding: 20px; } }
    h1 { font-size: 26px; font-weight: 800; margin-top: 0; color: var(--text-main); letter-spacing: -0.5px;}
    h2 { font-size: 18px; border-bottom: 1px solid var(--card-border); padding-bottom: 12px; margin-bottom: 16px; margin-top: 0;}
    p.subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 20px; line-height: 1.5; }
    .highlight-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 6px; }
    input, textarea, select { width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; color: var(--text-main); padding: 12px 14px; border-radius: 10px; font-family: inherit; font-size: 15px; transition: all 0.2s; -webkit-appearance: none; }
    input:focus, textarea:focus, select:focus { outline: none; border-color: var(--accent); background: white; box-shadow: 0 0 0 3px var(--accent-glow); }
    textarea { resize: vertical; min-height: 100px; }
    .table-responsive { overflow-x: auto; border-radius: 10px; border: 1px solid var(--card-border); background: white; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; min-width: 700px; }
    th, td { padding: 14px; text-align: left; border-bottom: 1px solid var(--card-border); font-size: 14px; vertical-align: top; }
    th { background: #f8fafc; color: var(--text-muted); font-weight: 700; font-size: 11px; text-transform: uppercase; }
    td input, td textarea, td select { background: transparent; border: 1px solid transparent; padding: 6px; }
    td input:focus, td textarea:focus, td select:focus { background: white; border-color: var(--accent); }
    .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media(max-width:700px){ .two-cols{ grid-template-columns: 1fr; } }
    .action-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; padding: 8px 10px; border-radius: 100px; display: flex; gap: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 100; max-width: 90%; }
    .action-bar button { background: transparent; border: none; color: #cbd5e1; padding: 10px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .action-bar button:hover { color: white; background: rgba(255,255,255,0.1); }
    .action-bar button.primary { background: var(--accent); color: white; }
    #toast { visibility: hidden; min-width: 250px; background-color: var(--text-main); color: #fff; text-align: center; border-radius: 50px; padding: 12px 24px; position: fixed; z-index: 101; left: 50%; top: 20px; transform: translateX(-50%); font-weight: 500; font-size: 14px; opacity: 0; transition: all 0.3s; }
    #toast.show { visibility: visible; opacity: 1; top: 50px; }
    @media print { body { background: white; padding: 0; } .sidebar, .action-bar, .mobile-nav-wrapper { display: none; } .layout { display: block; margin: 0; } .card { box-shadow: none; border: 1px solid #ccc; break-inside: avoid; } }
  </style>
</head>
<body>
  <div id="toast">✅ Guardado</div>
  <div class="mobile-nav-wrapper">
    <div class="mobile-header">
      <span style="color:var(--accent); font-size:11px; font-weight:800; text-transform:uppercase;">Módulo 6</span>
      <h1>${workbook.title}</h1>
    </div>
    <nav class="mobile-nav-scroller">
      <a href="#sec-ppt" class="nav-pill active">1. Propósito</a>
      <a href="#sec-promesa" class="nav-pill">2. Promesa</a>
      <a href="#sec-audiencia" class="nav-pill">3. Audiencia</a>
      <a href="#sec-usp" class="nav-pill">4. USP</a>
      <a href="#sec-personalidad" class="nav-pill">5. Personalidad</a>
      <a href="#sec-arquetipos" class="nav-pill">6. Arquetipos</a>
    </nav>
  </div>

  <div class="layout">
    <aside class="sidebar">
      <div style="margin-bottom: 10px; padding: 0 12px;">
        <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:800;">Contenido</span>
      </div>
      <a href="#sec-ppt" class="nav-link active">1. Propósito (PPT)</a>
      <a href="#sec-promesa" class="nav-link">2. Promesa de Valor</a>
      <a href="#sec-audiencia" class="nav-link">3. Audiencia</a>
      <a href="#sec-usp" class="nav-link">4. Diferencial (USP)</a>
      <a href="#sec-personalidad" class="nav-link">5. Personalidad</a>
      <a href="#sec-arquetipos" class="nav-link">6. Arquetipos</a>

      <div style="margin-top:20px; padding:15px; border-top:1px solid var(--card-border);">
        <label>Checklist de Coherencia</label>
        <div style="font-size:13px; color:var(--text-muted); display:flex; flex-direction:column; gap:8px;">
          <span>❤️ <strong>Propósito Real</strong></span>
          <span>🎯 <strong>Audiencia Clara</strong></span>
          <span>🗣️ <strong>Tono Propio</strong></span>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <section id="sec-ppt" class="card">
        <span style="color:var(--accent); font-weight:700; font-size:12px;">Paso 1</span>
        <h1>Propósito Personal Transformador</h1>
        <p class="subtitle">El "por qué" que moviliza tu energía y decisiones.</p>
        <div class="highlight-box">
          <label style="color:#be123c;">Mi PPT (En 1 frase)</label>
          <textarea style="border:none; background:transparent; font-size:16px; min-height:80px;">${m.proposito || ''}</textarea>
        </div>
        <label>La Causa (Lo que me duele/mueve)</label>
        <textarea>${m.causa || ''}</textarea>
      </section>

      <section id="sec-promesa" class="card">
        <h2>2. Promesa de Valor</h2>
        <p class="subtitle">Transformación: Del dolor al resultado.</p>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Antes (Dolor)</th>
                <th>Después (Éxito)</th>
                <th>Método</th>
                <th>Prueba</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><textarea>${m.antes1 || ''}</textarea></td>
                <td><textarea>${m.despues1 || ''}</textarea></td>
                <td><textarea>${m.metodo1 || ''}</textarea></td>
                <td><textarea>${m.prueba1 || ''}</textarea></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="two-cols">
          <div>
            <label>Frase de Valor (Tagline)</label>
            <input type="text" value="${m.fraseValor || ''}">
          </div>
          <div>
            <label>Dato de Respaldo</label>
            <input type="text" value="${m.resultadoMedible || ''}">
          </div>
        </div>
      </section>

      <section id="sec-audiencia" class="card">
        <h2>3. Audiencia Ideal</h2>
        <p class="subtitle">¿A quién sirves mejor?</p>
        <div class="two-cols">
          <div>
            <label>Perfil (Avatar)</label>
            <textarea>${m.audiencia || ''}</textarea>
          </div>
          <div>
            <label>Necesidad Real</label>
            <textarea>${m.necesidadAudiencia || ''}</textarea>
          </div>
          <div>
            <label>Miedos / Objeciones</label>
            <textarea>${m.miedosAudiencia || ''}</textarea>
          </div>
          <div>
            <label>Valores (Qué compran)</label>
            <textarea>${m.valoresAudiencia || ''}</textarea>
          </div>
        </div>
      </section>

      <section id="sec-usp" class="card">
        <h2>4. Diferencial (USP)</h2>
        <p class="subtitle">Tu combinación única de fortalezas.</p>
        <div class="two-cols">
          <div>
            <label>Mi USP</label>
            <textarea>${m.usp || ''}</textarea>
          </div>
          <div>
            <label>3 Evidencias</label>
            <textarea>${m.pruebasUsp || ''}</textarea>
          </div>
        </div>
      </section>

      <section id="sec-personalidad" class="card">
        <h2>5. Personalidad & Tono</h2>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th width="25%">Atributo</th>
                <th>Cómo se ve (Conducta)</th>
                <th>Qué NO soy (Límite)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="text" value="${m.attr1 || ''}"></td>
                <td><input type="text" value="${m.attr1c || ''}"></td>
                <td><input type="text" value="${m.attr1n || ''}"></td>
              </tr>
              <tr>
                <td><input type="text" value="${m.attr2 || ''}"></td>
                <td><input type="text" value="${m.attr2c || ''}"></td>
                <td><input type="text" value="${m.attr2n || ''}"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="two-cols" style="margin-top:20px;">
          <div>
            <label>Tono Principal</label>
            <input type="text" value="${m.tono || ''}">
          </div>
          <div>
            <label>Palabras Prohibidas</label>
            <input type="text" value="${m.noUso || ''}">
          </div>
        </div>
      </section>

      <section id="sec-arquetipos" class="card">
        <h2>6. Arquetipos de Marca</h2>
        <div class="two-cols">
          <div>
            <label>Arquetipo Principal</label>
            <input type="text" value="${m.arq1 || ''}">
          </div>
          <div>
            <label>Arquetipo Secundario</label>
            <input type="text" value="${m.arq2 || ''}">
          </div>
        </div>
        <div style="margin-top:20px;">
          <label>Manifestación (Comportamiento)</label>
          <textarea>${m.manifestacion || ''}</textarea>
        </div>
        <div style="margin-top:20px;">
          <label>Historia de Origen (Mini-Bio)</label>
          <textarea rows="4">${m.historia || ''}</textarea>
        </div>
      </section>
    </main>
  </div>

  <div class="action-bar">
    <button class="primary" id="saveBtn">Guardar</button>
    <button id="loadBtn">Cargar</button>
    <button id="exportBtn">Exportar</button>
    <button id="printBtn">Imprimir / PDF</button>
    <button id="clearBtn" style="color:#fca5a5;">Limpiar</button>
  </div>

  <script>
    document.getElementById('printBtn').addEventListener('click', () => { window.print(); });
  </script>
</body>
</html>
    `;
    }
  }
};
