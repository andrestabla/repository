
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config()

console.log("Environment Keys:", Object.keys(process.env).sort())
console.log("OPENAI_API_KEY present?", !!process.env.OPENAI_API_KEY)
console.log("GEMINI_API_KEY present?", !!process.env.GEMINI_API_KEY)
