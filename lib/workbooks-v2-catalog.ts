export type WorkbookV2CatalogItem = {
    id: string
    slug: string
    code: string
    title: string
    pillar: string
    statusLabel: string
    progress: number
    summary: string
}

export const WORKBOOKS_V2_CATALOG: WorkbookV2CatalogItem[] = [
    {
        id: 'wb1',
        slug: 'wb1',
        code: 'WB1',
        title: 'Creencias, identidad y pilares personales',
        pillar: 'Shine Within',
        statusLabel: 'Paso 3.3 activo',
        progress: 42,
        summary: 'Portada + presentacion + storytelling + definicion de identidad en version digital interactiva.'
    }
]
