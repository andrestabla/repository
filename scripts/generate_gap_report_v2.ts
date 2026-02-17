
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Enhanced Gap Analysis (v2.3 - Detail & Filters)...");

    // 1. Fetch Taxonomy Hierarchy
    const pillars = await prisma.taxonomy.findMany({
        where: { type: 'Pillar', active: true },
        include: {
            children: { // Subcomponents
                where: { active: true },
                include: {
                    children: { // Competences
                        where: { active: true },
                        include: {
                            children: { // Behaviors
                                where: { type: 'Behavior', active: true },
                                orderBy: { order: 'asc' }
                            }
                        }
                    }
                }
            }
        }
    });

    interface BehaviorNode {
        id: string;
        text: string;
        pillar: string;
        sub: string;
        comp: string;
        covered: boolean;
        linkedAssets: string[];
    }

    const allBehaviors: BehaviorNode[] = [];

    // Flatten logic
    for (const pillar of pillars) {
        for (const sub of pillar.children) {
            for (const comp of sub.children) {
                // @ts-ignore
                for (const beh of comp.children) {
                    allBehaviors.push({
                        id: beh.id,
                        text: beh.name,
                        pillar: pillar.name,
                        sub: sub.name,
                        comp: comp.name,
                        covered: false,
                        linkedAssets: []
                    });
                }
            }
        }
    }

    console.log(`📚 Total Behaviors: ${allBehaviors.length}`);

    // 2. Fetch Assets
    const assets = await prisma.contentItem.findMany({
        select: {
            id: true,
            title: true,
            behavior: true,
            type: true
        }
    });

    // 3. Check Coverage
    let coveredCount = 0;
    for (const asset of assets) {
        if (!asset.behavior) continue;
        const assetBehaviors = asset.behavior.split('|').map(s => s.trim());
        for (const assetBehText of assetBehaviors) {
            const matchedBehaviors = allBehaviors.filter(b => b.text.trim() === assetBehText);
            for (const match of matchedBehaviors) {
                if (!match.covered) {
                    match.covered = true;
                    coveredCount++;
                }
                match.linkedAssets.push(`${asset.title} (${asset.type})`);
            }
        }
    }

    // 4. Group Gaps for Proposals
    const gapsByCompetence: Record<string, BehaviorNode[]> = {};

    for (const b of allBehaviors) {
        if (!b.covered) {
            const key = `${b.pillar} > ${b.sub} > ${b.comp}`;
            if (!gapsByCompetence[key]) gapsByCompetence[key] = [];
            gapsByCompetence[key].push(b);
        }
    }

    // Generate Proposals with strict types and expanded descriptions
    interface Proposal {
        type: 'Video (10 min)' | 'Documento' | 'Podcast (15 min)';
        title: string;
        description: string;
        behaviors: string[];
        pillar: string;
        competence: string;
    }

    const proposals: Proposal[] = [];

    // Helper to generate rich descriptions
    const generateStructure = (type: string, comp: string, gaps: BehaviorNode[]) => {
        const gap1 = gaps[0] ? gaps[0].text : "conducta clave";
        const gap2 = gaps[1] ? gaps[1].text : "";
        const gapLast = gaps[gaps.length - 1] ? gaps[gaps.length - 1].text : "";

        if (type.includes('Podcast')) {
            return `
            <strong>Formato:</strong> Episodio de Podcast / Conversación (máx 15 min).<br><br>
            <strong>Objetivo Estratégico:</strong> Profundizar en las ${gaps.length} conductas complejas de "${comp}" mediante exploración dialéctica.<br><br>
            <strong>Estructura Sugerida:</strong><br>
            1. <strong>Intro (2 min) - "El Costo de la Inacción":</strong> Narrar una historia breve sobre qué pasa cuando un líder ignora <em>"${comp}"</em>. Conectar con el dolor del usuario.<br>
            2. <strong>Deep Dive (8 min) - "La Anatomía del Error":</strong> Desglosar por qué es tan difícil <em>"${gap1.substring(0, 50)}..."</em>. Analizar las barreras psicológicas ocultas.<br>
            3. <strong>Entrevista/Caso (3 min) - "El Punto de Inflexión":</strong> Relatar un caso real donde aplicar <em>"${gapLast.substring(0, 50)}..."</em> cambió el rumbo de un equipo.<br>
            4. <strong>Cierre (2 min) - "El Reto de 24h":</strong> Proponer una acción micro para ejecutar mañana mismo.`;
        } else if (type.includes('Video')) {
            return `
            <strong>Formato:</strong> Video de micro-learning de alto impacto (máx 10 min).<br><br>
            <strong>Objetivo Estratégico:</strong> Modelar visualmente las ${gaps.length} conductas de "${comp}" para su imitación inmediata.<br><br>
            <strong>Estructura Sugerida:</strong><br>
            1. <strong>Hook (1 min) - "Te suena esto?":</strong> Representar una situación de fallo común al intentar <em>"${gap1.substring(0, 40)}..."</em>. Capturar la frustración.<br>
            2. <strong>Concepto Clave (4 min) - "El Shift Mental":</strong> Explicar el principio subyacente de ${comp}. Usar una metáfora visual potente.<br>
            3. <strong>Role-Play (3 min) - "Good vs Bad":</strong> Contrastar la conducta equivocada con la ejecución maestral de <em>"${gap2 || gap1}"</em>. Analizar el lenguaje corporal.<br>
            4. <strong>CTA (2 min) - "Guion de Acción":</strong> Entregar una frase o script exacto para usar en la próxima reunión.`;
        } else {
            return `
            <strong>Formato:</strong> Documento PDF / Guía Práctica.<br><br>
            <strong>Objetivo Estratégico:</strong> Proporcionar una herramienta de consulta rápida y autodiagnóstico para "${comp}".<br><br>
            <strong>Contenido Esquemático:</strong><br>
            - <strong>Definición (Contexto):</strong> Por qué <em>"${gap1.substring(0, 50)}..."</em> es un superpoder invisible.<br>
            - <strong>Checklist (Autodiagnóstico):</strong> Lista de verificación de "Síntomas de Ausencia" vs "Señales de Maestría".<br>
            - <strong>Ejercicio (Reflexión):</strong> 3 preguntas incómodas para desbloquear la conducta.<br>
            - <strong>Plan de Acción (7 Días):</strong> Mini-retos diarios para integrar la conducta en la rutina.`;
        }
    };

    for (const [key, gaps] of Object.entries(gapsByCompetence)) {
        const [pillar, sub, comp] = key.split(' > ');
        const gapCount = gaps.length;

        let type: Proposal['type'];

        if (gapCount >= 3) type = 'Podcast (15 min)';
        else if (gapCount === 2) type = 'Video (10 min)';
        else type = 'Documento';

        const detailedDesc = generateStructure(type, comp, gaps);

        proposals.push({
            type,
            title: `Activo Propuesto: ${comp}`,
            description: detailedDesc,
            behaviors: gaps.map(g => g.text),
            pillar,
            competence: comp
        });
    }

    // 5. Generate Styled HTML Report
    const reportPath = path.join(process.cwd(), 'gap_report_v2.html');

    // Group gaps by Pillar for display
    const gapsByPillar: Record<string, BehaviorNode[]> = {};
    const coveredByPillar: Record<string, BehaviorNode[]> = {};
    const uniquePillars = new Set<string>();

    for (const b of allBehaviors) {
        uniquePillars.add(b.pillar);
        if (!gapsByPillar[b.pillar]) gapsByPillar[b.pillar] = [];
        if (!coveredByPillar[b.pillar]) coveredByPillar[b.pillar] = [];

        if (!b.covered) {
            gapsByPillar[b.pillar].push(b);
        } else {
            coveredByPillar[b.pillar].push(b);
        }
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gap Analysis & Content Strategy 4Shine</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #2563eb;
            --secondary: #64748b;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --bg: #f1f5f9;
            --card-bg: #ffffff;
            --border: #e2e8f0;
            --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: #0f172a; margin: 0; padding: 0; line-height: 1.5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        
        header { text-align: center; margin-bottom: 50px; }
        h1 { font-size: 2.25rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; letter-spacing: -0.025em; }
        p.subtitle { color: var(--secondary); font-size: 1.125rem; max-width: 600px; margin: 0 auto; }

        /* Modern Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 60px; }
        .stat-card { background: var(--card-bg); padding: 32px; border-radius: 20px; box-shadow: var(--shadow-sm); border: 1px solid rgba(255,255,255,0.5); backdrop-filter: blur(8px); text-align: center; transition: all 0.3s ease; }
        .stat-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); }
        .stat-value { font-size: 3.5rem; font-weight: 800; display: block; margin-bottom: 4px; line-height: 1; letter-spacing: -0.05em; }
        .stat-label { color: var(--secondary); font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }

        /* Sticky Tabs */
        .tabs-container { position: sticky; top: 20px; z-index: 100; margin-bottom: 40px; display: flex; justify-content: center; }
        .tabs { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(16px); padding: 8px; border-radius: 9999px; display: inline-flex; gap: 6px; box-shadow: var(--shadow-md); border: 1px solid rgba(255,255,255,0.6); }
        .tab-btn { padding: 10px 24px; background: transparent; border: none; border-radius: 9999px; font-size: 0.95rem; font-weight: 600; color: var(--secondary); cursor: pointer; transition: all 0.2s; }
        .tab-btn:hover { color: var(--primary); background: rgba(37, 99, 235, 0.05); }
        .tab-btn.active { background: var(--primary); color: white; box-shadow: var(--shadow-sm); }
        
        .tab-content { display: none; margin-top: 20px; animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .tab-content.active { display: block; }

        /* Accordion Pillar Cards */
        .pillar-card { background: var(--card-bg); border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--border); margin-bottom: 24px; transition: box-shadow 0.3s ease; }
        .pillar-card:hover { box-shadow: var(--shadow-md); }
        
        .pillar-header { background: #fff; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; transition: background 0.2s; }
        .pillar-header:hover { background: #f8fafc; }
        .pillar-title-group { display: flex; align-items: center; gap: 16px; }
        .chevron { transition: transform 0.3s ease; color: var(--secondary); }
        .pillar-card.open .chevron { transform: rotate(180deg); }
        .pillar-title { font-size: 1.25rem; font-weight: 700; margin: 0; color: #334155; }
        
        .progress-wrapper { display: flex; align-items: center; gap: 12px; }
        .progress-bar { width: 140px; height: 10px; background: #e2e8f0; border-radius: 9999px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 9999px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
        .pillar-content { max-height: 0; overflow: hidden; transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: #fcfcfc; }
        .pillar-card.open .pillar-content { max-height: 2000px; /* Arbitrary large height */ border-top: 1px solid var(--border); }

        /* Modern Gap Items */
        .gap-list { list-style: none; padding: 0; margin: 0; }
        .gap-item { padding: 20px 32px; border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 40px 1fr; gap: 8px; transition: background 0.15s; align-items: start; }
        .gap-item:hover { background: #fff; }
        .gap-item:last-child { border-bottom: none; }
        .gap-icon { height: 32px; width: 32px; background: #fef2f2; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--danger); font-size: 1.1rem; }
        .gap-details { display: flex; flex-direction: column; gap: 6px; }
        .breadcrumb { font-size: 0.8rem; color: var(--secondary); font-weight: 600; display:flex; align-items:center; gap: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .behavior-text { font-size: 1.05rem; color: #1e293b; line-height: 1.6; font-weight: 500; }
        .status-badge { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        
        /* Flexbox Proposals */
        .proposals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; padding-bottom: 40px; }
        .proposal-card { background: var(--card-bg); border-radius: 16px; padding: 28px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; height: 100%; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); justify-content: space-between; position: relative; overflow: hidden; }
        .proposal-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: #bfdbfe; }
        
        .proposal-header { margin-bottom: 24px; }
        .proposal-type { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 16px; display: inline-block; padding: 6px 10px; border-radius: 6px; letter-spacing: 0.05em; }
        
        .type-podcast { background: #f3e8ff; color: #6b21a8; }
        .type-video { background: #eff6ff; color: #1e40af; }
        .type-doc { background: #f1f5f9; color: #475569; }
        
        .proposal-title { font-size: 1.25rem; font-weight: 700; margin: 0 0 16px 0; color: #0f172a; line-height: 1.3; }
        .proposal-desc { font-size: 0.95rem; color: var(--secondary); line-height: 1.6; }
        .proposal-desc strong { color: #334155; }
        
        .proposal-footer { margin-top: auto; padding-top: 24px; border-top: 1px solid var(--border); }
        .behavior-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .b-tag { background: #fff1f2; color: #be123c; font-size: 0.75rem; font-weight: 500; padding: 4px 10px; border-radius: 9999px; border: 1px solid #fecdd3; }

        .filter-bar { display: flex; gap: 10px; margin-bottom: 30px; flex-wrap: wrap; justify-content: center; }
        .filter-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: white; color: var(--secondary); cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; }
        .filter-btn:hover { border-color: var(--primary); color: var(--primary); }
        .filter-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Diagnóstico de Contenido 4Shine</h1>
            <p class="subtitle">Análisis de Brechas y Estrategia de Desarrollo de Contenido</p>
        </header>

        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-value" style="color:var(--primary)">${allBehaviors.length}</span>
                <span class="stat-label">Total Conductas</span>
            </div>
            <div class="stat-card">
                <span class="stat-value" style="color:var(--success)">${coveredCount}</span>
                <span class="stat-label">Cubiertas</span>
            </div>
            <div class="stat-card">
                <span class="stat-value" style="color:var(--danger)">${allBehaviors.length - coveredCount}</span>
                <span class="stat-label">Brechas (Gaps)</span>
            </div>
            <div class="stat-card">
                <span class="stat-value change-color">${Math.round((coveredCount / allBehaviors.length) * 100)}%</span>
                <span class="stat-label">Score Global</span>
            </div>
        </div>

        <div class="tabs-container">
            <div class="tabs">
                <button class="tab-btn active" onclick="openTab(event, 'gaps')">📊 Análisis de Brechas</button>
                <button class="tab-btn" onclick="openTab(event, 'proposals')">🚀 Estrategia (${proposals.length})</button>
            </div>
        </div>

        <div id="gaps" class="tab-content active">
             <div style="text-align:center; margin-bottom:20px; color:var(--secondary);">
                <small>Haz clic en los pilares para ver el detalle de las brechas.</small>
            </div>
            ${Object.keys(gapsByPillar).map(pillarName => {
        const gaps = gapsByPillar[pillarName] || [];
        const covered = coveredByPillar[pillarName] || [];
        const total = gaps.length + covered.length;
        const percent = Math.round((covered.length / total) * 100) || 0;
        const color = percent < 30 ? 'var(--danger)' : percent < 70 ? 'var(--warning)' : 'var(--success)';
        const isOpen = false;

        return `
                <div class="pillar-card ${isOpen ? 'open' : ''}" onclick="toggleAccordion(this)">
                    <div class="pillar-header">
                        <div class="pillar-title-group">
                            <span class="chevron">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </span>
                            <div>
                                <h3 class="pillar-title">${pillarName}</h3>
                            </div>
                        </div>
                        <div class="progress-wrapper">
                            <span class="status-badge" style="background:${color}20; color:${color}">${percent}% Cobertura</span>
                             <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percent}%; background: ${color}"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pillar-content">
                    ${gaps.length === 0 ?
                `<div style="padding:40px; text-align:center; color:var(--success); font-weight:600;">✅ ¡Excelente! No hay brechas en este pilar.</div>` :
                `<ul class="gap-list">
                            ${gaps.map(g => `
                                <li class="gap-item">
                                    <div class="gap-icon">⚠️</div>
                                    <div class="gap-details">
                                        <div class="breadcrumb">
                                            <span>${g.sub}</span> <span style="color:#cbd5e1">•</span> <span>${g.comp}</span>
                                        </div>
                                        <div class="behavior-text">
                                            ${g.text}
                                        </div>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>`
            }
                    </div>
                </div>
                `;
    }).join('')}
        </div>

        <div id="proposals" class="tab-content">
            <div style="margin-bottom:30px; background:#e0e7ff; padding:24px; border-radius:12px; border:1px solid #c7d2fe; color:#3730a3; display:flex; align-items:start; gap:16px;">
                <span style="font-size:1.5rem">💡</span>
                <div>
                     <strong style="display:block; margin-bottom:4px; font-size:1.1rem;">Estrategia de Cierre de Brechas</strong>
                     Propuestas inteligentes agrupadas por competencia para optimizar recursos.
                </div>
            </div>

            <div class="filter-bar">
                <button class="filter-btn active" onclick="filterProposals('all')">Todos</button>
                ${Array.from(uniquePillars).map(p => `
                    <button class="filter-btn" onclick="filterProposals('${p}')">${p}</button>
                `).join('')}
            </div>

            <div class="proposals-grid">
                ${proposals.sort((a, b) => {
        const order = { 'Podcast (15 min)': 0, 'Video (10 min)': 1, 'Documento': 2 };
        // @ts-ignore
        return order[a.type] - order[b.type];
    }).map(p => {
        let typeClass = 'type-doc';
        if (p.type.includes('Podcast')) typeClass = 'type-podcast';
        if (p.type.includes('Video')) typeClass = 'type-video';

        return `
                    <div class="proposal-card" data-pillar="${p.pillar}">
                        <div class="proposal-header">
                            <span class="proposal-type ${typeClass}">${p.type}</span>
                            <h4 class="proposal-title">${p.title}</h4>
                            <div class="proposal-desc">${p.description}</div>
                        </div>
                        <div class="proposal-footer">
                            <div style="font-size:0.7rem; font-weight:700; margin-bottom:8px; color:#94a3b8; letter-spacing:0.05em; text-transform:uppercase;">Conductas que resuelve:</div>
                            <div class="behavior-tags">
                                ${p.behaviors.map(b => `<span class="b-tag">${b.substring(0, 50)}${b.length > 50 ? '...' : ''}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    `;
    }).join('')}
            </div>
        </div>

        <footer style="margin-top:80px; text-align:center; color:#94a3b8; font-size:0.875rem; border-top:1px solid var(--border); padding-top:30px; padding-bottom:40px;">
            Generado por <strong>Antigravity v2.3</strong> | ${new Date().toLocaleString()}
        </footer>
    </div>

    <script>
        function openTab(evt, tabName) {
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tab-content");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].classList.remove("active");
            }
            tablinks = document.getElementsByClassName("tab-btn");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].classList.remove("active");
            }
            document.getElementById(tabName).classList.add("active");
            evt.currentTarget.classList.add("active");
        }

        function toggleAccordion(element) {
            element.classList.toggle("open");
        }

        function filterProposals(pillar) {
            const cards = document.querySelectorAll('.proposal-card');
            const buttons = document.querySelectorAll('.filter-btn');
            
            buttons.forEach(btn => {
                if (btn.innerText === pillar || (pillar === 'all' && btn.innerText === 'Todos')) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            cards.forEach(card => {
                const cardPillar = card.getAttribute('data-pillar');
                if (pillar === 'all' || cardPillar === pillar) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>
    `;

    fs.writeFileSync(reportPath, htmlContent);
    console.log(`✨ Enhanced Report generated at: ${reportPath}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
