
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
    console.log('🚀 Starting Secondary Pillar Assignment...')

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
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: { responseMimeType: "application/json" }
    })

    console.log('📚 Fetching Items...')

    const items = await prisma.contentItem.findMany({
        select: {
            id: true,
            title: true,
            transcription: true,
            primaryPillar: true,
            secondaryPillars: true,
            observations: true
        }
    })

    const validItems = items.filter(i => i.title && i.title.length > 2)
    console.log(`📦 Found ${items.length} items to process.`)

    const reportParams: any[] = []

    // Batch Processing
    const BATCH_SIZE = 5
    for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
        const batch = validItems.slice(i, i + BATCH_SIZE)
        console.log(`\n📦 Processing Batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1}-${Math.min(i + BATCH_SIZE, validItems.length)}/${validItems.length})`)

        await Promise.all(batch.map(async (item) => {
            // Skip if already assigned (ensure we only target those with empty secondaries for this fix)
            if (item.secondaryPillars && item.secondaryPillars.length > 0) {
                console.log(`   ⏭️ Skipping: ${item.title.substring(0, 30)}... (Already assigned)`)
                return
            }

            console.log(`   🔄 Processing: ${item.title.substring(0, 30)}...`)

            // Define Input Source
            const hasTranscription = item.transcription && item.transcription.length > 50
            const sourceText = hasTranscription
                ? `TRANSCRIPTION (Excerpt):\n${item.transcription?.substring(0, 5000)}...`
                : `TITLE: ${item.title}\nCONTEXT: ${item.observations || 'N/A'}`;

            const prompt = `
            You are a Methodological Classifier for a Leadership Platform.
            
            Taxonomy Pillars:
            1. Shine In (Self-Leadership, Mindset, Emotional Intelligence) - Note: Formerly 'Shine Within'
            2. Shine Out (Relationship Management, Networking, Negotiation)
            3. Shine Up (Strategic Influence, Managing Up, Political Savvy)
            4. Shine Beyond (Legacy, Visibility, Mentoring, Public Speaking)

            Current Primary Pillar: "${item.primaryPillar}"

            Task: Identify SECONDARY pillars that are also relevant to this content.
            
            Rules:
            1. Analyze the content below.
            2. Select 1 to 2 ADDITIONAL pillars from the list above.
            3. DO NOT include the Primary Pillar "${item.primaryPillar}" in the list.
            4. YOU MUST SELECT AT LEAST ONE SECONDARY PILLAR. Find the strongest connection if none are obvious.

            Output JSON Format:
            {
                "secondaryPillars": ["Shine Out"] // Example
            }

            CONTENT:
            ${sourceText}
            `

            try {
                const result = await model.generateContent(prompt)
                const response = result.response
                const text = response.text().trim()
                const json = JSON.parse(text)

                let assignedPillars = json.secondaryPillars || []

                // Sanity check: Ensure primary pillar is not included
                assignedPillars = assignedPillars.filter((p: string) => p !== item.primaryPillar)

                // Update Database
                if (assignedPillars.length > 0) {
                    await prisma.contentItem.update({
                        where: { id: item.id },
                        data: { secondaryPillars: assignedPillars }
                    })
                    console.log(`   ✅ Updated: ${item.title.substring(0, 15)}... -> [${assignedPillars.join(', ')}]`)
                    reportParams.push({ id: item.id, title: item.title, primary: item.primaryPillar, secondary: assignedPillars.join(', '), status: 'Updated' })
                } else {
                    console.log(`   ⚪ No Secondary: ${item.title.substring(0, 15)}...`)
                    reportParams.push({ id: item.id, title: item.title, primary: item.primaryPillar, secondary: 'None', status: 'No Change' })
                }

            } catch (error) {
                console.error(`   ❌ Error ${item.id}:`, error)
                reportParams.push({ id: item.id, title: item.title, status: 'Error', secondary: 'Error' })
            }
        }))

        // Delay between batches
        await new Promise(r => setTimeout(r, 20000))
    }

    // Generate Report
    console.log('\n📝 Generating Report...')
    let reportMarkdown = `# Secondary Pillars Report\n\n**Date:** ${new Date().toISOString()}\n**Items Processed:** ${validItems.length}\n\n`
    reportMarkdown += `| ID | Title | Primary | Secondary | Status |\n`
    reportMarkdown += `|---|---|---|---|---|\n`

    reportParams.forEach(p => {
        reportMarkdown += `| ${p.id} | ${p.title} | ${p.primary} | ${p.secondary} | ${p.status} |\n`
    })

    fs.writeFileSync('SECONDARY_PILLARS_REPORT.md', reportMarkdown)
    console.log(`✅ Report saved to ${process.cwd()}/SECONDARY_PILLARS_REPORT.md`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
