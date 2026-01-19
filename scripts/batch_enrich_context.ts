
import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'

// Manual .env loading
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
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
}

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Starting Context Enrichment...')

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

    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing in .env and Database")
        process.exit(1)
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    console.log('📚 Fetching Items...')

    const items = await prisma.contentItem.findMany({
        select: {
            id: true,
            title: true,
            transcription: true,
            primaryPillar: true,
            sub: true,
            competence: true,
            behavior: true,
            observations: true
        }
    })

    console.log(`📦 Found ${items.length} items to process.`)

    const validItems = items.filter(i => i.title && i.title.length > 2)
    const reportParams: any[] = []

    // Batch Processing
    const BATCH_SIZE = 5
    for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
        const batch = validItems.slice(i, i + BATCH_SIZE)
        console.log(`\n📦 Processing Batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1}-${Math.min(i + BATCH_SIZE, validItems.length)}/${validItems.length})`)

        await Promise.all(batch.map(async (item) => {
            // Check Skip
            if (item.observations && item.observations.length > 300) {
                console.log(`   ⏭️ Skipping: ${item.title.substring(0, 30)}...`)
                reportParams.push({ id: item.id, title: item.title, status: 'Skipped', preview: 'Already enriched' })
                return
            }

            console.log(`   🔄 Processing: ${item.title.substring(0, 30)}...`)

            // Define Input Source
            const hasTranscription = item.transcription && item.transcription.length > 50
            const sourceText = hasTranscription
                ? `TRANSCRIPTION:\n${item.transcription?.substring(0, 15000)}...`
                : `TITLE: ${item.title}`;

            const taxonomyContext = `
            TAXONOMY CONTEXT:
            - Pillar: ${item.primaryPillar}
            - Subcomponent: ${item.sub}
            - Competence: ${item.competence}
            - Behavior: ${item.behavior}
            `

            const prompt = `
            You are an Expert Pedagogical Architect for a Leadership Development Platform.
            Your task is to write a **DEEP PEDAGOGICAL CONTEXT (Observation)** for the following training asset.

            Goal: Provide a comprehensive 2-3 paragraph explanation that serves as a guide for Facilitators and Methodologists.
            
            Structure of the response:
            1. **Educational Intent**: Why this specific asset exists? What deep psychological or behavioral gap does it address?
            2. **Key Insight/Mechanism**: How does it work? (e.g., reframing limiting beliefs, somatic regulation, strategic networking).
            3. **Facilitation/Application Note**: How should this be used or positioned? (e.g., best for moments of high stress, strategic planning sessions, or as a pre-read for mentoring).

            Style: Professional, insightful, sophisticated, and actionable. Spanish Language.

            ${taxonomyContext}

            ${sourceText}

            OUTPUT ONLY THE TEXT OF THE OBSERVATION (2-3 Paragraphs). NO MARKDOWN TITLES.
            `

            try {
                const result = await model.generateContent(prompt)
                const response = result.response
                const text = response.text().trim()

                if (text) {
                    await prisma.contentItem.update({
                        where: { id: item.id },
                        data: { observations: text, completeness: 100 }
                    })
                    console.log(`   ✅ Enriched: ${item.title.substring(0, 20)}... (${text.length} chars)`)
                    reportParams.push({ id: item.id, title: item.title, status: 'Updated', preview: text.substring(0, 100) + '...' })
                } else {
                    console.warn(`   ⚠️ No text: ${item.id}`)
                }
            } catch (error) {
                console.error(`   ❌ Error ${item.id}:`, error)
                reportParams.push({ id: item.id, title: item.title, status: 'Error', preview: 'Failed' })
            }
        }))

        // Delay between batches
        await new Promise(r => setTimeout(r, 10000))
    }

    // Generate Report
    console.log('\n📝 Generating Report...')
    let reportMarkdown = `# Context Enrichment Report\n\n**Date:** ${new Date().toISOString()}\n**Items Processed:** ${validItems.length}\n\n`
    reportMarkdown += `| ID | Title | Status | Preview |\n`
    reportMarkdown += `|---|---|---|---|\n`

    reportParams.forEach(p => {
        reportMarkdown += `| ${p.id} | ${p.title} | ${p.status} | ${p.preview} |\n`
    })

    fs.writeFileSync('CONTEXT_ENRICHMENT_REPORT.md', reportMarkdown)
    console.log(`✅ Report saved to ${process.cwd()}/CONTEXT_ENRICHMENT_REPORT.md`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
