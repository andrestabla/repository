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
        statusLabel: 'Edición premium activa',
        progress: 100,
        summary: 'Versión digital interactiva completa con navegación editorial, guardado por instrumento y exportación integral.'
    },
    {
        id: 'wb2',
        slug: 'wb2',
        code: 'WB2',
        title: 'Gestión emocional y PDI estratégico',
        pillar: 'Shine Within',
        statusLabel: 'Edición premium activa',
        progress: 100,
        summary: 'Versión digital interactiva completa con estructura por páginas, experiencia guiada y exportación profesional.'
    },
    {
        id: 'wb3',
        slug: 'wb3',
        code: 'WB3',
        title: 'Propósito y valores no negociables',
        pillar: 'Shine Within',
        statusLabel: 'Edición premium activa',
        progress: 100,
        summary: 'Versión digital interactiva completa con diseño editorial estandarizado, flujo claro y cierre de evaluación.'
    },
    {
        id: 'wb4',
        slug: 'wb4',
        code: 'WB4',
        title: 'Narrativa profesional y Elevator Pitch',
        pillar: 'Shine Out',
        statusLabel: 'Construcción activa',
        progress: 35,
        summary: 'Portada y presentación informativa activas en formato digital premium, con flujo guiado para primer ingreso y continuidad automática.'
    },
    {
        id: 'wb5',
        slug: 'wb5',
        code: 'WB5',
        title: 'Comunicación ejecutiva y estratégica',
        pillar: 'Shine Out',
        statusLabel: 'Construcción activa',
        progress: 40,
        summary: 'Estructura digital en desarrollo con portada, presentación y bloques operativos iniciales para comunicación, influencia y conversaciones estratégicas.'
    },
    {
        id: 'wb6',
        slug: 'wb6',
        code: 'WB6',
        title: 'Lenguaje verbal y no verbal de impacto',
        pillar: 'Shine Out',
        statusLabel: 'Construcción activa',
        progress: 78,
        summary: 'Edición premium con bloques avanzados de lenguaje corporal, voz, presión, objeciones, coherencia y evaluación.'
    },
    {
        id: 'wb7',
        slug: 'wb7',
        code: 'WB7',
        title: 'Mapeo del ecosistema estratégico',
        pillar: 'Shine Up',
        statusLabel: 'Portada y presentación activas',
        progress: 15,
        summary: 'Nueva versión digital con portada e identificación, presentación informativa completa y continuidad automática por sesión.'
    },
    {
        id: 'wb8',
        slug: 'wb8',
        code: 'WB8',
        title: 'Pensamiento estratégico y toma de decisiones',
        pillar: 'Shine Up',
        statusLabel: 'Construcción activa',
        progress: 35,
        summary: 'Portada, presentación y sección Escalera de valor con pasos, ejemplos, validaciones suaves y esquema visual interactivo.'
    }
]
