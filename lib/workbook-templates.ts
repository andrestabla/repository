
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
            Tu objetivo es generar un análisis PROFUNDO, DETALLADO y ALTAMENTE DESCRIPTIVO. 
            Analiza la transcripción de la sesión de mentoría y extrae la información para el "Workbook 1 - Metas & PDI".
            
            ESPECIFICACIONES DEL JSON DE SALIDA:
            Debes devolver un objeto JSON con esta estructura exacta:
            {
                "success": true,
                "metadata": {
                    "exitoFrase": "Frase detallada que define el éxito del líder",
                    "exitoEvidencia": "Evidencias observables y tangibles de éxito",
                    "wheel": [50, 60, 70, 80, 40, 50, 90, 30], 
                    "metaSmart": "Redacción de la meta SMART principal",
                    "metaCual": "Redacción de la meta cualitativa principal",
                    "smartCheck": "Checklist detallado (S, M, A, R, T) en formato texto",
                    "brecha": "Descripción de la brecha o gap principal",
                    "c1": "Plan de carrera a 1 año",
                    "c3": "Plan de carrera a 3 años",
                    "c5": "Plan de carrera a 5 años",
                    "g1": "Brecha de Conocimiento / Skill",
                    "g2": "Brecha de Mindset / Creencia",
                    "g3": "Brecha de Redes / Entorno",
                    "hab1": "Hábito 1 (Detonante y Acción)",
                    "hab2": "Hábito 2",
                    "pdeiAcciones": "Acciones clave del PDEI",
                    "acciones90": "Plan de acción detallado para los próximos 90 días",
                    "barreras": "Lista de barreras potenciales",
                    "ritual": "Descripción minuciosa del ritual de inicio"
                }
            }

            REGLAS CRÍTICAS:
            1. PROFUNDIDAD: Genera textos largos, explicativos y con mucho valor.
            2. COMPLETITUD: Es OBLIGATORIO llenar todos los campos.
            3. FALLBACK: Si no hay información suficiente en la transcripción para un campo, escribe EXACTAMENTE: "Información a completar manualmente".
            4. IDIOMA: Responde siempre en Español.
        `,
    exportTemplate: (workbook: any) => {
      const m = workbook.metadata || {};

      // Map the internal storage to the HTML IDs
      const initialData: any = {
        exitoFrase: m.exitoFrase || "",
        exitoEvidencia: m.exitoEvidencia || "",
        metaSmart: m.metaSmart || "",
        metaCual: m.metaCual || "",
        smartCheck: m.smartCheck || "",
        brecha: m.brecha || "",
        c1: m.c1 || "",
        c3: m.c3 || "",
        c5: m.c5 || "",
        g1: m.g1 || "",
        g2: m.g2 || "",
        g3: m.g3 || "",
        hab1: m.hab1 || "",
        hab2: m.hab2 || "",
        pdeiAcciones: m.pdeiAcciones || "",
        acciones90: m.acciones90 || "",
        wheel: m.wheel || [50, 50, 50, 50, 50, 50, 50, 50]
      };

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
    textarea { resize: none; min-height: 50px; overflow: hidden; line-height: 1.5; }
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
      <a href="#sec-gap" class="nav-pill">5. Brechas</a>
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
        <div class="two-cols">
            <div>
                <label>Meta SMART Principal</label>
                <textarea id="metaSmart" placeholder="Para Dic 2026, yo he logrado..."></textarea>
            </div>
            <div>
                <label>Meta Cualitativa</label>
                <textarea id="metaCual" placeholder="Ser reconocido como..."></textarea>
            </div>
        </div>
        <div style="margin-top:24px;">
            <label>Checklist de Calidad (S-M-A-R-T)</label>
            <textarea id="smartCheck" placeholder="S:... M:... A:... R:... T:..."></textarea>
        </div>
        <div style="margin-top:24px;">
            <label>La Brecha Crítica</label>
            <textarea id="brecha" placeholder="¿Qué me separa hoy de esta meta?"></textarea>
        </div>
      </section>

      <section id="sec-plan" class="card">
        <h2>4. Visión 1-3-5 Años</h2>
        <div class="space-y-4">
            <div style="margin-bottom:15px;">
                <label>A 1 Año (Foco Inmediato)</label>
                <textarea id="c1"></textarea>
            </div>
            <div style="margin-bottom:15px;">
                <label>A 3 Años (Consolidación)</label>
                <textarea id="c3"></textarea>
            </div>
            <div>
                <label>A 5 Años (Legado)</label>
                <textarea id="c5"></textarea>
            </div>
        </div>
      </section>

      <section id="sec-gap" class="card">
        <h2>5. Brechas Detalladas</h2>
        <div class="space-y-4">
            <div style="margin-bottom:15px;">
                <label>Conocimiento / Hard Skill</label>
                <textarea id="g1"></textarea>
            </div>
            <div style="margin-bottom:15px;">
                <label>Mindset / Creencias</label>
                <textarea id="g2"></textarea>
            </div>
            <div>
                <label>Redes / Entorno</label>
                <textarea id="g3"></textarea>
            </div>
        </div>
      </section>

      <section id="sec-pdei" class="card">
        <h2>6. Plan de Desarrollo (PDEI)</h2>
        <div class="two-cols">
            <div>
                <label>Hábito Clave 1</label>
                <textarea id="hab1"></textarea>
            </div>
            <div>
                <label>Hábito Clave 2</label>
                <textarea id="hab2"></textarea>
            </div>
        </div>
        <div style="margin-top:24px;">
            <label>Acciones Principales</label>
            <textarea id="pdeiAcciones"></textarea>
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
    <button id="printBtn">Imprimir / PDF</button>
  </div>

  <script>
    const areas = ["Salud", "Finanzas", "Relaciones", "Familia", "Trabajo", "Contribución", "Espíritu", "Diversión"];
    const initialDataFromDB = ${JSON.stringify(initialData)};
    
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

    function resizeTextarea(el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }

    document.querySelectorAll('textarea').forEach(el => {
      el.addEventListener('input', () => resizeTextarea(el));
      setTimeout(() => resizeTextarea(el), 100);
    });

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
            Tu objetivo es generar un análisis PROFUNDO, DETALLADO y ALTAMENTE DESCRIPTIVO.
            Analiza la sesión y extrae la información para el "Workbook 2 - Autoconfianza".
            
            ESPECIFICACIONES DEL JSON:
            {
                "success": true,
                "metadata": {
                    "emocionesHoy": "Lista exhaustiva de emociones",
                    "emocionAnhelo": "Análisis profundo de qué busca vs qué evita",
                    "frasesLimitantes": "Mapeo del crítico interno",
                    "lenguajeTransformador": "Cómo debe hablarse el líder (ejemplos)",
                    "autodefinicion10": "Identidad en 10 palabras con fuerza",
                    "asociacionesExito": "Significado emocional detallado",
                    "perdidasCreencia": "Costos de mantener las creencias",
                    "beneficiosNuevas": "Ganancias detalladas",
                    "dofa_fortalezas": "Fortalezas detectadas",
                    "dofa_oportunidades": "Oportunidades de crecimiento",
                    "dofa_debilidades": "Debilidades o áreas de mejora",
                    "dofa_amenazas": "Amenazas externas",
                    "decisionPoderosa": "La gran decisión estratégica",
                    "comoCambioVida": "Impacto esperado a largo plazo",
                    "preguntasFoco": "Energía centrada en...",
                    "preguntasSignificado": "Interpretación de los retos",
                    "preguntasAccion": "Próximo paso concreto"
                }
            }

            REGLAS CRÍTICAS:
            1. PROFUNDIDAD: Genera textos largos, explicativos y con mucho valor.
            2. COMPLETITUD: Es OBLIGATORIO llenar todos los campos.
            3. FALLBACK: Si no hay información suficiente en la transcripción para un campo, escribe EXACTAMENTE: "Información a completar manualmente".
            4. IDIOMA: Responde siempre en Español.
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
    textarea { resize: none; min-height: 50px; overflow: hidden; line-height: 1.5; }
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
            <textarea id="dofa_fortalezas" style="background:transparent; border:none; padding:0;">${m.dofa_fortalezas || ''}</textarea>
          </div>
          <div class="dofa-item negative">
            <label style="color:#dc2626;">Debilidades</label>
            <textarea id="dofa_debilidades" style="background:transparent; border:none; padding:0;">${m.dofa_debilidades || ''}</textarea>
          </div>
          <div class="dofa-item positive">
            <label style="color:#059669;">Oportunidades</label>
            <textarea id="dofa_oportunidades" style="background:transparent; border:none; padding:0;">${m.dofa_oportunidades || ''}</textarea>
          </div>
          <div class="dofa-item negative">
            <label style="color:#dc2626;">Amenazas</label>
            <textarea id="dofa_amenazas" style="background:transparent; border:none; padding:0;">${m.dofa_amenazas || ''}</textarea>
          </div>
        </div>
        <div style="margin-top:15px;">
          <label>Costo de inacción</label>
          <textarea id="perdidasCreencia">${m.perdidasCreencia || ''}</textarea>
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
        <div class="space-y-4">
            <div style="margin-bottom:12px;">
                <label>1. ¿En qué está mi foco (Energía)?</label>
                <textarea id="preguntasFoco">${m.preguntasFoco || ''}</textarea>
            </div>
            <div style="margin-bottom:12px;">
                <label>2. ¿Qué significado le doy a los retos?</label>
                <textarea id="preguntasSignificado">${m.preguntasSignificado || ''}</textarea>
            </div>
            <div>
                <label>3. ¿Qué acción concreta tomaré?</label>
                <textarea id="preguntasAccion">${m.preguntasAccion || ''}</textarea>
            </div>
        </div>
      </section>
    </main>
  </div>

  <div class="action-bar">
    <button id="printBtn">Imprimir / PDF</button>
  </div>

  <script>
    document.getElementById('printBtn').addEventListener('click', () => { window.print(); });

    function resizeTextarea(el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }

    document.querySelectorAll('textarea').forEach(el => {
      el.addEventListener('input', () => resizeTextarea(el));
      setTimeout(() => resizeTextarea(el), 100);
    });
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
            Tu objetivo es generar un análisis PROFUNDO, DETALLADO y ALTAMENTE DESCRIPTIVO.
            Analiza la sesión y extrae la información para el "Workbook 3 - Comunicación".
            
            ESPECIFICACIONES DEL JSON DE SALIDA:
            {
                "success": true,
                "metadata": {
                    "problema": "El dolor profundo que resuelves",
                    "diferencial": "Tu propuesta única de valor explicada",
                    "mercado": "Análisis del mercado o nicho ideal",
                    "metodologia": "Descripción de tu metodología o proceso único",
                    "elevatorCompleto": "Discurso fluido, persuasivo de 60 segundos",
                    "historia": "Historia STAR (Situación, Tarea, Acción, Resultado) desarrollada",
                    "cta": "Call to action específico e irresistible",
                    "hab1": "Hábito de comunicación 1",
                    "accionHab1": "Acción concreta para el hábito 1",
                    "hab2": "Hábito de comunicación 2",
                    "accionHab2": "Acción concreta para el hábito 2"
                }
            }

            REGLAS CRÍTICAS:
            1. PROFUNDIDAD: Genera textos largos, explicativos y con mucho valor.
            2. COMPLETITUD: Es OBLIGATORIO llenar todos los campos.
            3. FALLBACK: Si no hay información suficiente en la transcripción para un campo, escribe EXACTAMENTE: "Información a completar manualmente".
            4. IDIOMA: Responde siempre en Español.
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
    textarea { resize: none; min-height: 50px; overflow: hidden; line-height: 1.5; }
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
      <a href="#sec-insumos" class="nav-pill active">1. Insumos</a>
      <a href="#sec-speech" class="nav-pill">2. Speech</a>
      <a href="#sec-habitos" class="nav-pill">3. Hábitos</a>
    </nav>
  </div>

  <div class="layout">
    <aside class="sidebar">
      <div style="margin-bottom: 10px; padding: 0 12px;">
        <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:800;">Índice</span>
      </div>
      <a href="#sec-insumos" class="nav-link active">1. Insumos Clave</a>
      <a href="#sec-speech" class="nav-link">2. Elevator Speech</a>
      <a href="#sec-habitos" class="nav-link">3. Hábitos de Poder</a>
    </aside>

    <main class="main-content">
      <section id="sec-insumos" class="card">
        <span style="color:var(--accent); font-weight:700; font-size:12px;">Paso 1</span>
        <h1>Insumos de Marca</h1>
        <p class="subtitle">Los cimientos de tu mensaje.</p>
        <div class="two-cols">
          <div>
            <label>Problema que resuelves</label>
            <textarea id="problema">${m.problema || ''}</textarea>
          </div>
          <div>
            <label>Tu Diferencial</label>
            <textarea id="diferencial">${m.diferencial || ''}</textarea>
          </div>
        </div>
        <div class="two-cols" style="margin-top:20px;">
          <div>
            <label>Mercado / Nicho</label>
            <textarea id="mercado">${m.mercado || ''}</textarea>
          </div>
          <div>
            <label>Metodología / Cómo</label>
            <textarea id="metodologia">${m.metodologia || ''}</textarea>
          </div>
        </div>
      </section>

      <section id="sec-speech" class="card">
        <h2>2. Elevator Pitch (60")</h2>
        <p class="subtitle">Tu discurso fluido para captar atención inmediata.</p>
        <textarea id="elevatorCompleto" rows="4" style="font-size:18px; font-weight:500; color:var(--accent);">${m.elevatorCompleto || ''}</textarea>
        <div class="two-cols" style="margin-top:20px;">
          <div>
            <label>Historia STAR</label>
            <textarea id="historia">${m.historia || ''}</textarea>
          </div>
          <div>
            <label>Call to Action (CTA)</label>
            <textarea id="cta">${m.cta || ''}</textarea>
          </div>
        </div>
      </section>

      <section id="sec-habitos" class="card">
        <h2>3. Hábitos de Poder</h2>
        <div class="two-cols">
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label>Hábito 1: Comunicación</label>
            <textarea id="hab1">${m.hab1 || ''}</textarea>
            <label style="margin-top:10px;">Acción Concreta</label>
            <textarea id="accionHab1">${m.accionHab1 || ''}</textarea>
          </div>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label>Hábito 2: Comunicación</label>
            <textarea id="hab2">${m.hab2 || ''}</textarea>
            <label style="margin-top:10px;">Acción Concreta</label>
            <textarea id="accionHab2">${m.accionHab2 || ''}</textarea>
          </div>
        </div>
      </section>
    </main>
  </div>

  <div class="action-bar">
    <button id="printBtn">Imprimir / PDF</button>
  </div>

  <script>
    document.getElementById('printBtn').addEventListener('click', () => { window.print(); });

    function resizeTextarea(el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }

    document.querySelectorAll('textarea').forEach(el => {
      el.addEventListener('input', () => resizeTextarea(el));
      setTimeout(() => resizeTextarea(el), 100);
    });
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
            Tu objetivo es generar un análisis PROFUNDO, DETALLADO y ALTAMENTE DESCRIPTIVO.
            Analiza la sesión y extrae la información para el "Workbook 4 - Networking".
            
            ESPECIFICACIONES DEL JSON DE SALIDA:
            {
                "success": true,
                "metadata": {
                    "metaRel": "Metas de networking claras y ambiciosas",
                    "valorRel": "Oferta de valor detallada del líder",
                    "aliado1": "Aliado 1: Nombre y por qué es clave",
                    "aliado2": "Aliado 2: Nombre y por qué es clave",
                    "aliado3": "Aliado 3: Nombre y por qué es clave",
                    "guion1": "Guion 1: Primer contacto o reactivación",
                    "guion2": "Guion 2: Seguimiento o aporte de valor",
                    "planEventos": "Lista de espacios y canales estratégicos",
                    "pilar1": "Pilar 1: Presencia",
                    "pilar2": "Pilar 2: Utilidad",
                    "pilar3": "Pilar 3: Reciprocidad"
                }
            }

            REGLAS CRÍTICAS:
            1. PROFUNDIDAD: Genera textos largos, explicativos y con mucho valor.
            2. COMPLETITUD: Es OBLIGATORIO llenar todos los campos.
            3. FALLBACK: Si no hay información suficiente en la transcripción para un campo, escribe EXACTAMENTE: "Información a completar manualmente".
            4. IDIOMA: Responde siempre en Español.
        `,
    exportTemplate: (workbook: any) => {
      const m = workbook.metadata || {};

      return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>${workbook.title} — Networking</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">

  <style>
    :root{
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --accent: #059669; 
      --accent-light: #ecfeff; 
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
    h1, h2 { margin-top: 0; color: var(--text-main); letter-spacing: -0.02em; }
    h1 { font-size: 26px; font-weight: 800; }
    h2 { font-size: 18px; border-bottom: 1px solid var(--card-border); padding-bottom: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;}
    p.subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 20px; line-height: 1.5; }
    label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 6px; }
    textarea { width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; color: var(--text-main); padding: 12px 14px; border-radius: 10px; font-family: inherit; font-size: 15px; transition: all 0.2s; -webkit-appearance: none; resize: none; min-height: 50px; overflow: hidden; line-height: 1.5; }
    textarea:focus { outline: none; border-color: var(--accent); background: white; box-shadow: 0 0 0 3px var(--accent-glow); }
    .action-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; padding: 8px 10px; border-radius: 100px; display: flex; gap: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 100; max-width: 90%; }
    .action-bar button { background: transparent; border: none; color: #cbd5e1; padding: 10px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .action-bar button:hover { color: white; background: rgba(255,255,255,0.1); }
    .action-bar button.primary { background: var(--accent); color: white; }
    .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media(max-width:700px){ .two-cols{ grid-template-columns: 1fr; } }
    @media print { body { background: white; padding: 0; } .sidebar, .action-bar, .mobile-nav-wrapper { display: none; } .layout { display: block; margin: 0; } .card { box-shadow: none; border: 1px solid #ccc; break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="mobile-nav-wrapper">
    <div class="mobile-header">
      <h1>${workbook.title}</h1>
    </div>
    <nav class="mobile-nav-scroller">
      <a href="#sec-estrategia" class="nav-pill active">1. Estrategia</a>
      <a href="#sec-aliados" class="nav-pill">2. Aliados</a>
      <a href="#sec-guion" class="nav-pill">3. Guiones</a>
      <a href="#sec-plan" class="nav-pill">4. Plan</a>
      <a href="#sec-pilares" class="nav-pill">5. Pilares</a>
    </nav>
  </div>

  <div class="layout">
    <aside class="sidebar">
      <a href="#sec-estrategia" class="nav-link active">1. Estrategia de Valor</a>
      <a href="#sec-aliados" class="nav-link">2. Aliados Estratégicos</a>
      <a href="#sec-guion" class="nav-link">3. Guiones de Conexión</a>
      <a href="#sec-plan" class="nav-link">4. Plan de Canales</a>
      <a href="#sec-pilares" class="nav-link">5. Pilares de Seguimiento</a>
    </aside>

    <main class="main-content">
      <section id="sec-estrategia" class="card">
        <h1>Estrategia de Valor</h1>
        <div class="two-cols">
          <div>
            <label>Meta de Networking</label>
            <textarea id="metaRel">${m.metaRel || ''}</textarea>
          </div>
          <div>
            <label>Oferta de Valor Relevante</label>
            <textarea id="valorRel">${m.valorRel || ''}</textarea>
          </div>
        </div>
      </section>

      <section id="sec-aliados" class="card">
        <h2>2. Aliados Estratégicos</h2>
        <div class="space-y-4">
            <div style="margin-bottom:12px;">
                <label>Aliado Principal</label>
                <textarea id="aliado1">${m.aliado1 || ''}</textarea>
            </div>
            <div style="margin-bottom:12px;">
                <label>Aliado Crativo / Soporte</label>
                <textarea id="aliado2">${m.aliado2 || ''}</textarea>
            </div>
            <div>
                <label>Aliado Institucional / Red</label>
                <textarea id="aliado3">${m.aliado3 || ''}</textarea>
            </div>
        </div>
      </section>

      <section id="sec-guion" class="card">
        <h2>3. Guiones de Conexión</h2>
        <div class="two-cols">
          <div>
            <label>Guion 1 (Primer Contacto)</label>
            <textarea id="guion1">${m.guion1 || ''}</textarea>
          </div>
          <div>
            <label>Guion 2 (Aporte de Valor)</label>
            <textarea id="guion2">${m.guion2 || ''}</textarea>
          </div>
        </div>
      </section>

      <section id="sec-plan" class="card">
        <h2>4. Plan de Canales & Eventos</h2>
        <textarea id="planEventos">${m.planEventos || ''}</textarea>
      </section>

      <section id="sec-pilares" class="card">
        <h2>5. Pilares de Seguimiento</h2>
        <div class="two-cols">
          <div>
            <label>Pilar 1: Presencia</label>
            <textarea id="pilar1">${m.pilar1 || ''}</textarea>
          </div>
          <div>
            <label>Pilar 2: Utilidad</label>
            <textarea id="pilar2">${m.pilar2 || ''}</textarea>
          </div>
        </div>
        <div style="margin-top:20px;">
          <label>Pilar 3: Reciprocidad</label>
          <textarea id="pilar3">${m.pilar3 || ''}</textarea>
        </div>
      </section>
    </main>
  </div>

  <div class="action-bar">
    <button id="printBtn">Imprimir / PDF</button>
  </div>

  <script>
    document.getElementById('printBtn').addEventListener('click', () => { window.print(); });

    function resizeTextarea(el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }

    document.querySelectorAll('textarea').forEach(el => {
      el.addEventListener('input', () => resizeTextarea(el));
      setTimeout(() => resizeTextarea(el), 100);
    });
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
            Tu objetivo es generar un análisis PROFUNDO, DETALLADO y ALTAMENTE DESCRIPTIVO.
            Analiza la sesión y extrae la información para el "Workbook 5 - Serenidad".
            
            ESPECIFICACIONES DEL JSON DE SALIDA:
            {
                "success": true,
                "metadata": {
                    "emo1": "Emoción predominante 1",
                    "emo1i": "Intensidad inicial",
                    "emo1n": "Sensación y Nueva Intensidad",
                    "emo2": "Emoción predominante 2",
                    "emo2i": "Intensidad inicial",
                    "emo2n": "Sensación y Nueva Intensidad",
                    "emo3": "Emoción predominante 3",
                    "emo3i": "Intensidad inicial",
                    "emo3n": "Sensación y Nueva Intensidad",
                    "triggers": "Lista detallada de detonantes",
                    "patron": "Descripción minuciosa del patrón automático",
                    "r1s": "Situación + Pensamiento Automático nocivo",
                    "r1r": "Reencuadre cognitivo (Nueva Realidad)",
                    "r1e": "Análisis de la emoción original",
                    "r1a": "Nueva Acción consciente sugerida",
                    "ancla1": "Ancla Física (Cuerpo y respiración)",
                    "ancla2": "Ancla Mental (Frase de poder)",
                    "h1": "Micro-hábito de serenidad 1",
                    "h1t": "Señal para el hábito 1"
                }
            }

            REGLAS CRÍTICAS:
            1. PROFUNDIDAD: Genera textos largos, explicativos y con mucho valor.
            2. COMPLETITUD: Es OBLIGATORIO llenar todos los campos.
            3. FALLBACK: Si no hay información suficiente en la transcripción para un campo, escribe EXACTAMENTE: "Información a completar manualmente".
            4. IDIOMA: Responde siempre en Español.
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
    textarea { resize: none; min-height: 50px; overflow: hidden; line-height: 1.5; }
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
    <button id="printBtn">Imprimir / PDF</button>
  </div>

  <script>
    function updateVal(id, val) {
      document.getElementById(id).textContent = val;
    }
    document.getElementById('printBtn').addEventListener('click', () => { window.print(); });

    function resizeTextarea(el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }

    document.querySelectorAll('textarea').forEach(el => {
      el.addEventListener('input', () => resizeTextarea(el));
      setTimeout(() => resizeTextarea(el), 100);
    });
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
            Tu objetivo es generar un análisis PROFUNDO, DETALLADO y ALTAMENTE DESCRIPTIVO.
            Analiza la sesión y extrae la información para el "Workbook 6 - Autenticidad I (Latido de Marca)".
            
            ESPECIFICACIONES DEL JSON DE SALIDA:
            {
                "success": true,
                "metadata": {
                    "proposito": "Frase potente del PPT",
                    "causa": "Análisis de lo que duele o mueve al líder",
                    "antes1": "Estado inicial detallado (el dolor)",
                    "despues1": "Estado final deseado (el éxito)",
                    "metodo1": "Método único de transformación",
                    "prueba1": "Evidencia o prueba social detallada",
                    "audiencia": "Perfil exhaustivo del avatar",
                    "necesidadAudiencia": "Análisis de la necesidad real",
                    "miedosAudiencia": "Mapeo de miedos u objeciones",
                    "valoresAudiencia": "Qué compran o valoran profundamente",
                    "usp": "Propuesta Única de Venta analizada",
                    "pruebasUsp": "3 evidencias claras de diferenciación",
                    "personalidadLimites": "Límites y atributos de personalidad",
                    "historia": "Historia de origen o Brand Story narrativa",
                    "arq1": "Arquetipo Principal analizado",
                    "arq2": "Arquetipo Secundario analizado"
                }
            }

            REGLAS CRÍTICAS:
            1. PROFUNDIDAD: Genera textos largos, explicativos y con mucho valor.
            2. COMPLETITUD: Es OBLIGATORIO llenar todos los campos.
            3. FALLBACK: Si no hay información suficiente en la transcripción para un campo, escribe EXACTAMENTE: "Información a completar manualmente".
            4. IDIOMA: Responde siempre en Español.
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
    textarea { resize: none; min-height: 50px; overflow: hidden; line-height: 1.5; }
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
    <button id="printBtn">Imprimir / PDF</button>
  </div>

  <script>
    document.getElementById('printBtn').addEventListener('click', () => { window.print(); });

    function resizeTextarea(el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }

    document.querySelectorAll('textarea').forEach(el => {
      el.addEventListener('input', () => resizeTextarea(el));
      setTimeout(() => resizeTextarea(el), 100);
    });
  </script>
</body>
</html>
    `;
    }
  },
  'Workbook7': {
    id: 'Workbook7',
    name: 'Workbook 7 — Autenticidad II',
    prompt: `
            Eres un EXPERTO EN ESTRATEGIA DE NEGOCIO, VISIBILIDAD y MONETIZACIÓN para líderes.
            Tu objetivo es generar un análisis PROFUNDO, DETALLADO y ALTAMENTE DESCRIPTIVO.
            Analiza la sesión y extrae la información para el "Workbook 7 - Autenticidad II (Visibilidad & Monetización)".
            
            ESPECIFICACIONES DEL JSON DE SALIDA:
            {
                "success": true,
                "metadata": {
                    "ecosistemas": "Territorios y ecosistemas clave (uno por línea)",
                    "aliados": "Aliados estratégicos y stakeholders",
                    "v1c": "Canal estratégico 1", "v1a": "Acción detallada 1",
                    "v2c": "Canal estratégico 2", "v2a": "Acción detallada 2",
                    "mensajeCentral": "Mensaje principal de marca analizado",
                    "of1r": "Promesa Nivel Básico", "of1$": "Precio Nivel Básico",
                    "of2r": "Promesa Nivel Intermedio", "of2$": "Precio Nivel Intermedio",
                    "of3r": "Promesa Nivel Premium", "of3$": "Precio Nivel Premium",
                    "ruta": "Modelo Principal de Monetización",
                    "metaIngreso": "Meta de ingreso monetaria específica",
                    "palancas": "Palancas de crecimiento analizadas",
                    "p30a1": "Acciones estratégicas 30 días", "p30r": "Meta específica 30 días",
                    "p60a1": "Acciones estratégicas 60 días", "p60r": "Meta específica 60 días",
                    "p90a1": "Acciones estratégicas 90 días", "p90r": "Meta específica 90 días",
                    "kpiVis": "KPIs de Visibilidad detallados",
                    "kpiIng": "KPIs de Negocio detallados"
                }
            }

            REGLAS CRÍTICAS:
            1. PROFUNDIDAD: Genera textos largos, explicativos y con mucho valor.
            2. COMPLETITUD: Es OBLIGATORIO llenar todos los campos.
            3. FALLBACK: Si no hay información suficiente en la transcripción para un campo, escribe EXACTAMENTE: "Información a completar manualmente".
            4. IDIOMA: Responde siempre en Español.
        `,
    exportTemplate: (workbook: any) => {
      const m = workbook.metadata || {};

      return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>${workbook.title} — Visibilidad & Monetización</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">

  <style>
    :root{
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --accent: #7c3aed; 
      --accent-light: #ede9fe; 
      --accent-glow: rgba(124, 58, 237, 0.15);
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
    label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 6px; }
    input, textarea, select { width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; color: var(--text-main); padding: 12px 14px; border-radius: 10px; font-family: inherit; font-size: 15px; transition: all 0.2s; -webkit-appearance: none; }
    input:focus, textarea:focus, select:focus { outline: none; border-color: var(--accent); background: white; box-shadow: 0 0 0 3px var(--accent-glow); }
    textarea { resize: none; min-height: 50px; overflow: hidden; line-height: 1.5; }
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
      <span style="color:var(--accent); font-size:11px; font-weight:800; text-transform:uppercase;">Módulo 6</span>
      <h1>${workbook.title}</h1>
    </div>
    <nav class="mobile-nav-scroller">
      <a href="#sec-ecosistemas" class="nav-pill active">1. Ecosistemas</a>
      <a href="#sec-visibilidad" class="nav-pill">2. Visibilidad</a>
      <a href="#sec-oferta" class="nav-pill">3. Oferta</a>
      <a href="#sec-monetizacion" class="nav-pill">4. Monetización</a>
      <a href="#sec-plan" class="nav-pill">5. Plan 30-60-90</a>
    </nav>
  </div>

  <div class="layout">
    <aside class="sidebar">
      <div style="margin-bottom: 10px; padding: 0 12px;">
        <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:800;">Contenido</span>
      </div>
      <a href="#sec-ecosistemas" class="nav-link active">1. Ecosistemas</a>
      <a href="#sec-visibilidad" class="nav-link">2. Visibilidad</a>
      <a href="#sec-oferta" class="nav-link">3. Oferta de Valor</a>
      <a href="#sec-monetizacion" class="nav-link">4. Monetización</a>
      <a href="#sec-plan" class="nav-link">5. Plan 30-60-90</a>
      <a href="#sec-kpi" class="nav-link">6. Indicadores</a>

      <div style="margin-top:20px; padding:15px; border-top:1px solid var(--card-border);">
        <label>Estado de Ejecución</label>
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          <span class="tag tag-green">En Marcha</span>
          <span class="tag tag-yellow">Planeando</span>
          <span class="tag tag-red">Inactivo</span>
        </div>
        <p style="font-size:12px; color:var(--text-muted); margin-top:8px; line-height:1.3;">
          Recuerda: Visibilidad sin oferta es solo ruido.
        </p>
      </div>
    </aside>

    <main class="main-content">
      <section id="sec-ecosistemas" class="card">
        <span style="color:var(--accent); font-weight:700; font-size:12px;">Paso 1</span>
        <h1>Ecosistemas y Aliados</h1>
        <p class="subtitle">¿Dónde debe vivir tu marca? Identifica tus territorios y aliados.</p>
        <div class="two-cols">
          <div>
            <label>Ecosistemas Relevantes</label>
            <textarea>${m.ecosistemas || ''}</textarea>
          </div>
          <div>
            <label>Aliados Estratégicos</label>
            <textarea>${m.aliados || ''}</textarea>
          </div>
        </div>
      </section>

      <section id="sec-visibilidad" class="card">
        <h2>2. Estrategia de Visibilidad</h2>
        <p class="subtitle">Presencia con propósito, no solo "likes".</p>
        <div class="two-cols">
          <div>
            <label>Mensaje Central</label>
            <textarea>${m.mensajeCentral || ''}</textarea>
          </div>
          <div>
            <label>3 Temas Pilares</label>
            <textarea>${m.temasPilares || ''}</textarea>
          </div>
        </div>
        <label style="margin-top:20px;">Plan de Canales</label>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th width="25%">Canal</th>
                <th>Acción Concreta</th>
                <th width="20%">Frecuencia</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="text" value="${m.v1c || ''}"></td>
                <td><input type="text" value="${m.v1a || ''}"></td>
                <td><input type="text" value="${m.v1f || ''}"></td>
              </tr>
              <tr>
                <td><input type="text" value="${m.v2c || ''}"></td>
                <td><input type="text" value="${m.v2a || ''}"></td>
                <td><input type="text" value="${m.v2f || ''}"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="sec-oferta" class="card">
        <h2>3. Tu Menú de Valor</h2>
        <p class="subtitle">Empaqueta tu conocimiento en ofertas claras.</p>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th width="20%">Nivel</th>
                <th>Promesa / Resultado</th>
                <th width="20%">Precio/Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Básica</strong></td>
                <td><textarea rows="2">${m.of1r || ''}</textarea></td>
                <td><input type="text" value="${m.of1$ || ''}"></td>
              </tr>
              <tr>
                <td><strong>Intermedia</strong></td>
                <td><textarea rows="2">${m.of2r || ''}</textarea></td>
                <td><input type="text" value="${m.of2$ || ''}"></td>
              </tr>
              <tr>
                <td><strong>Premium</strong></td>
                <td><textarea rows="2">${m.of3r || ''}</textarea></td>
                <td><input type="text" value="${m.of3$ || ''}"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top:20px;">
          <label>Prueba Social (Tu respaldo)</label>
          <textarea>${m.pruebasSociales || ''}</textarea>
        </div>
      </section>

      <section id="sec-monetizacion" class="card">
        <h2>4. Ruta de Monetización</h2>
        <div class="two-cols">
          <div>
            <label>Modelo Principal</label>
            <input type="text" value="${m.ruta || ''}">
          </div>
          <div>
            <label>Meta de Ingreso</label>
            <input type="text" value="${m.metaIngreso || ''}">
          </div>
        </div>
        <div style="margin-top:20px;">
          <label>Palancas de Crecimiento</label>
          <textarea>${m.palancas || ''}</textarea>
        </div>
      </section>

      <section id="sec-plan" class="card">
        <h2>5. Plan de Ejecución (30-60-90)</h2>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th width="15%">Fase</th>
                <th>Foco / Acciones Clave</th>
                <th width="25%">Meta</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>30 Días</strong></td>
                <td><textarea rows="2">${m.p30a1 || ''}</textarea></td>
                <td><textarea rows="2">${m.p30r || ''}</textarea></td>
              </tr>
              <tr>
                <td><strong>60 Días</strong></td>
                <td><textarea rows="2">${m.p60a1 || ''}</textarea></td>
                <td><textarea rows="2">${m.p60r || ''}</textarea></td>
              </tr>
              <tr>
                <td><strong>90 Días</strong></td>
                <td><textarea rows="2">${m.p90a1 || ''}</textarea></td>
                <td><textarea rows="2">${m.p90r || ''}</textarea></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="sec-kpi" class="card">
        <h2>6. Tablero de Control</h2>
        <div class="two-cols">
          <div>
            <label>KPIs de Visibilidad</label>
            <input type="text" value="${m.kpiVis || ''}">
          </div>
          <div>
            <label>KPIs de Negocio</label>
            <input type="text" value="${m.kpiIng || ''}">
          </div>
        </div>
      </section>
    </main>
  </div>

  <div class="action-bar">
    <button id="printBtn">Imprimir / PDF</button>
  </div>

  <script>
    document.getElementById('printBtn').addEventListener('click', () => { window.print(); });

    function resizeTextarea(el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }

    document.querySelectorAll('textarea').forEach(el => {
      el.addEventListener('input', () => resizeTextarea(el));
      setTimeout(() => resizeTextarea(el), 100);
    });
  </script>
</body>
</html>
    `;
    }
  }
};
