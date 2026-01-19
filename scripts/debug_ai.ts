
import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from "@google/generative-ai"
import * as fs from 'fs'
import * as path from 'path'

// Manual .env parsing
try {
    const envPath = path.resolve(process.cwd(), '.env')
    const envConfig = fs.readFileSync(envPath, 'utf-8')
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            let value = match[2].trim()
            if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1)
            process.env[key] = value
        }
    })
} catch (e) { }

const prisma = new PrismaClient()

async function main() {
    // 0. Get API Key (Env or DB)
    let apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        const setting = await prisma.systemSettings.findUnique({ where: { key: 'gemini_api_key' } })
        if (setting && setting.value) apiKey = setting.value as string
    }
    if (!apiKey) throw new Error("GEMINI_API_KEY required")

    // Get 1 item
    const item = await prisma.contentItem.findFirst({ where: { type: 'Video' } })
    if (!item) return console.log("No video found")

    console.log(`Analyzing: ${item.title}`)
    const textSource = item.transcription || item.title

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    })

    const prompt = `
        Eres la INTELIGENCIA ARTIFICIAL MAESTRA de la METODOLOGÍA 4SHINE.
        Analiza este contenido.
        
        FORMATO JSON:
        {
            "primaryPillar": "String",
            "sub": "String"
        }

        CONTENT:
        ${textSource.substring(0, 1000)}
    `

    console.log("Sending Prompt...")
    const result = await model.generateContent(prompt)
    console.log("RAW RESPONSE:")
    console.log(result.response.text())
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
