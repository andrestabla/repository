
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Starting Gap Analysis: Assets vs Observable Behaviors...");

    // 1. Fetch Taxonomy Hierarchy
    // We need to build a map of All Behaviors -> Their Pillar
    // Hierarchy: Pillar -> Subcomponent -> Competence -> Behavior

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
                                where: { type: 'Behavior', active: true }
                            }
                        }
                    }
                }
            }
        }
    });

    // Flatten into a list of behaviors with metadata
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

    for (const pillar of pillars) {
        for (const sub of pillar.children) {
            for (const comp of sub.children) {
                for (const beh of comp.children) {
                    allBehaviors.push({
                        id: beh.id,
                        text: beh.name, // The behavior text is in the name field
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

    console.log(`📚 Total Observable Behaviors defined in Taxonomy: ${allBehaviors.length}`);

    // 2. Fetch Assets (ContentItems)
    const assets = await prisma.contentItem.findMany({
        select: {
            id: true,
            title: true,
            behavior: true,
            type: true
        }
    });

    console.log(`📦 Total Assets in Inventory: ${assets.length}`);

    // 3. Check Coverage
    // ContentItem behavior field can contain multiple behaviors separated by "|"

    let coveredCount = 0;

    for (const asset of assets) {
        if (!asset.behavior) continue;

        const assetBehaviors = asset.behavior.split('|').map(s => s.trim());

        for (const assetBehText of assetBehaviors) {
            // Find matching behavior in our taxonomy list
            // We use robust string matching (trim, maybe ignore case?)
            // For now, strict trim match as per seed data logic

            // We search in allBehaviors (this might be slow O(N*M) but N is small ~100)
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

    console.log(`✅ Covered Behaviors: ${coveredCount}`);
    console.log(`❌ Gaps (Uncovered): ${allBehaviors.length - coveredCount}`);

    // 4. Generate HTML Report
    const reportPath = path.join(process.cwd(), 'gap_report.html');

    // Group gaps by Pillar
    const gapsByPillar: Record<string, BehaviorNode[]> = {};
    const coveredByPillar: Record<string, BehaviorNode[]> = {};

    for (const b of allBehaviors) {
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
    <title>Reporte de Brechas: Activos vs Conductas 4Shine</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 5px solid #3498db; }
        .stat-card.alert { border-left-color: #e74c3c; }
        .stat-number { font-size: 2em; font-weight: bold; display: block; }
        .pillar-section { margin-bottom: 40px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .pillar-header { background: #ecf0f1; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
        .pillar-header h3 { margin: 0; }
        .gap-list { list-style: none; padding: 0; margin: 0; }
        .gap-item { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; flex-direction: column; gap: 5px; }
        .gap-item:last-child { border-bottom: none; }
        .gap-item:nth-child(even) { background-color: #fafafa; }
        .path { font-size: 0.85em; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; }
        .behavior-text { font-size: 1.1em; color: #c0392b; font-weight: 500; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; color: white; }
        .badge-red { background-color: #e74c3c; }
        .badge-green { background-color: #2ecc71; }
        .progress-bar { height: 10px; background: #eee; border-radius: 5px; overflow: hidden; width: 200px; }
        .progress-fill { height: 100%; background: #2ecc71; }
        footer { margin-top: 50px; text-align: center; color: #7f8c8d; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>Reporte de Brechas de Contenido (Gap Analysis)</h1>
    <p>Este reporte identifica las <strong>Conductas Observables</strong> del sistema 4Shine que <strong>NO</strong> están cubiertas por ningún Activo en el inventario actual.</p>
    
    <div class="stats-grid">
        <div class="stat-card">
            <span class="stat-number">${allBehaviors.length}</span>
            Conductas Totales
        </div>
        <div class="stat-card">
            <span class="stat-number" style="color:#2ecc71">${coveredCount}</span>
            Conductas Cubiertas
        </div>
        <div class="stat-card alert">
            <span class="stat-number" style="color:#e74c3c">${allBehaviors.length - coveredCount}</span>
            Brechas (Sin Contenido)
        </div>
        <div class="stat-card">
            <span class="stat-number">${Math.round((coveredCount / allBehaviors.length) * 100)}%</span>
            Cobertura Global
        </div>
    </div>

    ${Object.keys(gapsByPillar).map(pillarName => {
        const gaps = gapsByPillar[pillarName] || [];
        const covered = coveredByPillar[pillarName] || [];
        const total = gaps.length + covered.length;
        const percent = Math.round((covered.length / total) * 100) || 0;

        return `
        <div class="pillar-section">
            <div class="pillar-header">
                <h3>${pillarName}</h3>
                <div style="display:flex; align-items:center; gap:15px;">
                    <span>Cobertura: <strong>${percent}%</strong> (${covered.length}/${total})</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                </div>
            </div>
            
            ${gaps.length === 0 ?
                `<div style="padding:20px; text-align:center; color:#2ecc71;">✅ ¡Excelente! No hay brechas en este pilar. Todas las conductas tienen activos asociados.</div>` :
                `<ul class="gap-list">
                    ${gaps.map(g => `
                        <li class="gap-item">
                            <span class="path">${g.sub} > ${g.comp}</span>
                            <span class="behavior-text">⚠️ ${g.text}</span>
                        </li>
                    `).join('')}
                </ul>`
            }
        </div>
        `;
    }).join('')}

    <footer>
        Generado automáticamente por Antigravity a las ${new Date().toLocaleString()}
    </footer>
</body>
</html>
    `;

    fs.writeFileSync(reportPath, htmlContent);
    console.log(`✅ Report generated at: ${reportPath}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
