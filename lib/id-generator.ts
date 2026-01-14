import prisma from './prisma'

const TYPE_PREFIXES: Record<string, string> = {
    'PDF': 'P',
    'Documento': 'P',
    'Video': 'V',
    'Audio': 'A',
    'Texto': 'T',
    'Artículo': 'T',
    'Toolkit': 'K',
    'Plantilla': 'K',
    'Test': 'E',
    'Evaluación': 'E',
    'Rúbrica': 'R',
    'Workbook': 'W',
    'Documento maestro': 'D'
}

export class IdGeneratorService {
    /**
     * Generates a unique ID following the pattern 4S-[Prefix]-[NNN]
     * Prefix depends on the Content Type.
     * NNN is a sequential number per type, never reused.
     */
    static async generateId(contentType: string): Promise<string> {
        // 1. Get Prefix
        // Normalize type (Gemini might return different strings)
        let prefix = 'X' // Default if type unknown

        for (const [key, val] of Object.entries(TYPE_PREFIXES)) {
            if (contentType?.toLowerCase().includes(key.toLowerCase())) {
                prefix = val
                break
            }
        }

        // 2. Manage sequence in SystemSettings to ensure "Never Reused"
        const settingsKey = 'id_sequences'
        const settings = await prisma.systemSettings.findUnique({ where: { key: settingsKey } })

        // Value format: { [prefix]: number }
        let sequences: Record<string, number> = (settings?.value as any) || {}

        const nextNumber = (sequences[prefix] || 0) + 1
        sequences[prefix] = nextNumber

        // Update the sequence in DB before returning
        await prisma.systemSettings.upsert({
            where: { key: settingsKey },
            update: { value: sequences },
            create: { key: settingsKey, value: sequences }
        })

        // 3. Format: 4S-[Prefix]-[000]
        const paddedNumber = nextNumber.toString().padStart(3, '0')
        return `4S-${prefix}-${paddedNumber}`
    }
}
