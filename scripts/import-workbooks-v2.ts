import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'

type WorkbookMeta = {
    module: 'v2'
    workbookCode: string
    sourceFormat: 'docx'
    sourceFile: string
    importedAt: string
    objectives: string[]
    audience: string
    duration: string
    difficulty: string
    prerequisites: string
    takeaways: string[]
}

const prisma = new PrismaClient()

function slugify(value: string) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

async function extractDocxText(filePath: string) {
    const officeParser = require('officeparser')
    const buffer = await fs.readFile(filePath)
    const ast = await officeParser.parseOffice(buffer)
    const raw = ast && typeof ast.toText === 'function'
        ? ast.toText()
        : typeof ast === 'string'
            ? ast
            : JSON.stringify(ast)

    return String(raw || '')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

async function importWorkbook(workbooksRoot: string, workbookCode: string, sourceDirName?: string) {
    const workbookDir = path.join(workbooksRoot, sourceDirName || workbookCode)
    const dirEntries = await fs.readdir(workbookDir, { withFileTypes: true })
    const docxFile = dirEntries.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.docx'))

    if (!docxFile) {
        throw new Error(`No .docx file found in ${workbookDir}`)
    }

    const sourceFile = path.join(workbookDir, docxFile.name)
    const title = docxFile.name.replace(/\.docx$/i, '').trim()
    const content = await extractDocxText(sourceFile)
    const slugBase = slugify(`${workbookCode}-${title}-v2`) || `${workbookCode.toLowerCase()}-v2`
    const metadata: WorkbookMeta = {
        module: 'v2',
        workbookCode,
        sourceFormat: 'docx',
        sourceFile: docxFile.name,
        importedAt: new Date().toISOString(),
        objectives: [],
        audience: '',
        duration: '',
        difficulty: 'Básico',
        prerequisites: '',
        takeaways: []
    }

    const sameTitle = await prisma.workbook.findMany({
        where: { title },
        select: { id: true, metadata: true }
    })

    const existingV2 = sameTitle.find((workbook) => (workbook.metadata as any)?.module === 'v2')

    if (existingV2) {
        const updated = await prisma.workbook.update({
            where: { id: existingV2.id },
            data: {
                description: `Workbook ${workbookCode} v2 importado desde Workbooksfinales.`,
                status: 'Borrador',
                type: 'General',
                metadata: {
                    ...(existingV2 as any).metadata,
                    ...metadata
                } as any,
                content
            }
        })

        return { mode: 'updated', id: updated.id, title: updated.title, slug: updated.slug }
    }

    const created = await prisma.workbook.create({
        data: {
            title,
            description: `Workbook ${workbookCode} v2 importado desde Workbooksfinales.`,
            status: 'Borrador',
            type: 'General',
            slug: `${slugBase}-${Math.random().toString(36).slice(2, 7)}`,
            metadata: metadata as any,
            content
        }
    })

    return { mode: 'created', id: created.id, title: created.title, slug: created.slug }
}

async function main() {
    const workbooksRoot = process.argv[2] || '/Users/andrestabla/Documents/4Shinebuilder/Workbooksfinales'
    const workbookCode = process.argv[3] || 'WB1'
    const sourceDirName = process.argv[4]
    const result = await importWorkbook(workbooksRoot, workbookCode, sourceDirName)
    console.log(JSON.stringify(result, null, 2))
}

main()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
