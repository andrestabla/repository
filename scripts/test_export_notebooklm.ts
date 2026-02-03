
import { GET } from '../app/api/export/notebooklm/route'
import prisma from '../lib/prisma'

async function main() {
    console.log('🧪 Testing NotebookLM Export Endpoint...')

    try {
        // Simulate the request
        const response = await GET()

        const status = response.status
        const headers = Object.fromEntries(response.headers.entries())
        const text = await response.text()

        console.log(`\n📊 Status: ${status}`)
        console.log(`TYPE: ${headers['content-type']}`)
        console.log(`SIZE: ${text.length} chars`)
        console.log(`-----------------------------------------`)

        // Validation Checks
        if (status !== 200) throw new Error('Status is not 200')
        if (!text.includes('# Base de Conocimiento 4Shine')) throw new Error('Missing Header')

        // Check for new taxonomy
        if (text.includes('PILAR: SHINE WITHIN')) {
            console.log('✅ Found Pillar: SHINE WITHIN')
        } else {
            console.error('❌ FAIL: Pillar SHINE WITHIN not found')
        }

        // Check for structure
        if (text.includes('### Componente:')) {
            console.log('✅ Found Component headers')
        }

        // Sample Output
        console.log('\n📄 Sample Output Preview (First 500 chars):')
        console.log(text.substring(0, 500))
        console.log('...\n')

    } catch (e) {
        console.error('❌ Error during test:', e)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
