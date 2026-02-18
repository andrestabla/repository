
import { PrismaClient, Prisma } from '@prisma/client'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config()

const prisma = new PrismaClient()
const EMBEDDING_MODEL = 'text-embedding-3-small'

async function getClient() {
    let apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        const setting = await prisma.systemSettings.findUnique({ where: { key: 'openai_api_key' } })
        if (setting?.value) apiKey = setting.value as string
    }
    if (!apiKey) throw new Error("OPENAI_API_KEY missing")
    return new OpenAI({ apiKey })
}

async function generateEmbedding(openai: OpenAI, text: string) {
    if (!text || text.length < 5) return null
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 8000)
    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: cleanText,
            encoding_format: 'float'
        })
        return response.data[0].embedding
    } catch (e: any) {
        console.error("Embedding Error:", e.message)
        return null
    }
}

async function main() {
    console.log("Starting Embeddings Backfill...")
    const openai = await getClient()

    // 1. Content Items
    const contentItems = await prisma.contentItem.findMany({
        // @ts-ignore
        where: { embedding: { equals: Prisma.JsonNull } },
        // @ts-ignore
        select: { id: true, title: true, observations: true, primaryPillar: true }
    })
    console.log(`Found ${contentItems.length} ContentItems without embeddings.`)

    for (const item of contentItems) {
        const textToEmbed = `Title: ${item.title}. Pillar: ${item.primaryPillar}. Content: ${item.observations || ''}`
        console.log(`Processing ContentItem: ${item.title}...`)
        const embedding = await generateEmbedding(openai, textToEmbed)

        if (embedding) {
            await prisma.contentItem.update({
                where: { id: item.id },
                // @ts-ignore
                data: { embedding: embedding as any }
            })
        }
        await new Promise(r => setTimeout(r, 200)) // Rate limit nice
    }

    // 2. Research Sources
    const researchItems = await prisma.researchSource.findMany({
        // @ts-ignore
        where: { embedding: { equals: Prisma.JsonNull } },
        // @ts-ignore
        select: { id: true, title: true, summary: true, findings: true }
    })
    console.log(`Found ${researchItems.length} ResearchSources without embeddings.`)

    for (const item of researchItems) {
        const textToEmbed = `Title: ${item.title}. Summary: ${item.summary || ''}. Findings: ${item.findings || ''}`
        console.log(`Processing ResearchSource: ${item.title}...`)
        const embedding = await generateEmbedding(openai, textToEmbed)

        if (embedding) {
            await prisma.researchSource.update({
                where: { id: item.id },
                // @ts-ignore
                data: { embedding: embedding as any }
            })
        }
        await new Promise(r => setTimeout(r, 200))
    }

    console.log("Backfill Complete.")
}

main()
    .catch((e) => {
        console.error(e)
        // process.exit(1) // Don't exit hard, maybe partial success
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
