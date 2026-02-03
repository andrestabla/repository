
import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from "@google/generative-ai"
import * as fs from 'fs'
import * as path from 'path'

// Manual .env parsing
try {
    const envPath = path.resolve(process.cwd(), '.env')
    console.log(`Loading env from: ${envPath}`)
    const envConfig = fs.readFileSync(envPath, 'utf-8')
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            let value = match[2].trim()
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1)
            }
            process.env[key] = value
        }
    })
} catch (e) {
    console.warn('⚠️ No .env file found or error reading it.', e)
}

const prisma = new PrismaClient()

// --- We will REPLICATE the Gemini Logic here to have full control over the loop and context without modifying the Service ---
// Or better: reuse the service if we can import it. 
// Given the relative paths, let's try to mimic the core logic to be safe and self-contained script.

async function fetchTaxonomyContext() {
    const taxonomyTree = await prisma.taxonomy.findMany({
        where: { type: 'Pillar', active: true },
        include: {
            children: { // Sub
                include: {
                    children: { // Comp
                        include: {
                            children: true // Behavior
                        }
                    }
                }
            }
        }
    })

    let taxonomyContext = "ESTRUCTURA METODOLÓGICA VÁLIDA (Debes seleccionar valores EXACTOS de esta lista):\n";
    taxonomyTree.forEach(p => {
        taxonomyContext += `\nPILAR: ${p.name}\n`;
        p.children.forEach(sub => {
            taxonomyContext += `  - Componente: ${sub.name}\n`;
            sub.children.forEach(comp => {
                taxonomyContext += `    * Competencia: ${comp.name}\n`;
                const behaviors = comp.children.map(b => b.name).join(' | ');
                taxonomyContext += `      > Conductas: ${behaviors.substring(0, 1000)}...\n`;
            });
        });
    });
    return taxonomyContext
}

async function analyzeItem(text: string, taxonomyContext: string, apiKey: string) {
    if (!text || text.length < 10) return null

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash", // Use fast model for batch
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
        }
    })

    const prompt = `
        Eres la INTELIGENCIA ARTIFICIAL MAESTRA de la METODOLOGÍA 4SHINE.
        Analiza el siguiente contenido y clasifícalo metadatos taxonómicos.

        ${taxonomyContext}

        --- REGLAS ---
        1. SELECCIÓN DE PILAR OBLIGATORIA: Uno de los 4 pilares activos.
        2. TAXONOMÍA EXACTA: "sub", "competence" y "behavior" DEBEN ser TEXTUALES de la lista provista.
        3. FORMATO JSON:
        {
            "primaryPillar": "String",
            "secondaryPillars": ["String"],
            "sub": "String",
            "competence": "String",
            "behavior": "String",
            "maturity": "Básico | Intermedio | Avanzado",
            "observations": "Análisis corto (1-2 frases) justificando la clasificación."
        }

        CONTENT TO ANALYZE:
        ${text.substring(0, 20000)}
    `

    try {
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        let parsed = JSON.parse(responseText)
        if (Array.isArray(parsed)) parsed = parsed[0]
        return parsed
    } catch (e) {
        console.error("AI Error:", e)
        return null
    }
}

async function main() {
    console.log('🚀 Starting Batch Metadata Update...')
    // 0. Get API Key (Env or DB)
    let apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.log('🔑 API Key not in .env, checking SystemSettings...')
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'gemini_api_key' }
        })
        if (setting && setting.value) {
            apiKey = setting.value as string
            console.log('✅ Found API Key in Database')
        }
    }

    if (!apiKey) throw new Error("GEMINI_API_KEY required (checked .env and DB)")

    // 1. Get Context
    console.log('📚 Fetching Taxonomy Context...')
    const taxContext = await fetchTaxonomyContext()

    // 2. Get All Items
    const items = await prisma.contentItem.findMany({
        where: {} // All items
    })
    console.log(`📦 Found ${items.length} items to process.`)

    // 3. Process
    const results = []
    let processed = 0

    for (const item of items) {
        processed++
        console.log(`\n[${processed}/${items.length}] Processing: ${item.title} (${item.type})`)

        // Determine text source
        let textSource = ''
        if (item.type.toLowerCase().includes('video') && item.transcription) {
            console.log('   🎙️ Using Transcription')
            textSource = item.transcription
        } else {
            console.log('   📄 Using Title/Desc')
            // Using title and whatever summary/desc might allow (ContentItem has 'observations' but maybe not a clean summary field if it wasn't AI generated yet? 
            // Checking schema: has `observations`, `title`. 
            // We'll combine title + observations if it acts as description, or just title if obs is empty/short)
            textSource = `Title: ${item.title}\n\nExisting Data/Context: ${item.observations || ''}`
        }

        // Skip if too short
        if (textSource.length < 10) {
            console.log('   ⚠️ Content too short, skipping.')
            results.push({ id: item.id, title: item.title, status: 'Skipped' })
            continue
        }

        // Analyze
        const meta = await analyzeItem(textSource, taxContext, apiKey)

        if (meta) {
            console.log(`   ✅ Classified: ${meta.primaryPillar} > ${meta.sub} > ${meta.competence} > ${meta.behavior?.substring(0, 20)}...`)

            // Update DB
            await prisma.contentItem.update({
                where: { id: item.id },
                data: {
                    primaryPillar: meta.primaryPillar,
                    secondaryPillars: meta.secondaryPillars || [],
                    sub: meta.sub,
                    competence: meta.competence,
                    behavior: meta.behavior,
                    maturity: meta.maturity,
                    observations: meta.observations // Updating observations with the justification
                }
            })

            results.push({
                id: item.id,
                title: item.title,
                oldPillar: item.primaryPillar,
                newPillar: meta.primaryPillar,
                newSub: meta.sub,
                newComp: meta.competence,
                newBeh: meta.behavior,
                status: 'Updated'
            })
        } else {
            console.error('   ❌ AI Analysis failed')
            results.push({ id: item.id, title: item.title, status: 'Failed' })
        }

        // Rate Limit Guard (Sleep 2s)
        await new Promise(r => setTimeout(r, 2000))
    }

    // 4. Generate Report
    console.log('\n📝 Generating Report...')
    let reportMD = '# Batch Metadata Update Report\n\n'
    reportMD += `**Date:** ${new Date().toISOString()}\n`
    reportMD += `**Items Processed:** ${processed}\n\n`
    reportMD += '| ID | Title | Status | Old Pillar | New Pillar | New Sub | New Competence | New Behavior |\n'
    reportMD += '|---|---|---|---|---|---|---|---|\n'

    results.forEach(r => {
        reportMD += `| ${r.id} | ${r.title} | ${r.status} | ${r.oldPillar || '-'} | ${r.newPillar || '-'} | ${r.newSub || '-'} | ${r.newComp || '-'} | ${r.newBeh || '-'} |\n`
    })

    const reportPath = path.join(process.cwd(), 'BATCH_UPDATE_REPORT.md')
    fs.writeFileSync(reportPath, reportMD)
    console.log(`✅ Report saved to ${reportPath}`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
