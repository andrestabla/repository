import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 1. Methodology
    const method = await prisma.methodology.upsert({
        where: { version: 'v1.0' },
        update: {},
        create: {
            version: 'v1.0',
            status: 'Borrador',
        },
    })
    console.log('Created Methodology:', method)

    // 2. Taxonomy (Pillars & Subcomponents)
    // Helper to create slug
    const toSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // WIPED EXISTING TAXONOMY TO ENSURE CONSISTENCY
    // (In a real production seed we might match by name, but for this cleanup we assume control)

    // A. Define Data
    const SHINE_WITHIN_DATA = [
        {
            sub: "Autoconfianza y autoliderazgo",
            competences: [
                {
                    name: "Autoeficacia y seguridad",
                    behaviors: [
                        "Afronta desafíos con seguridad en sus capacidades sin caer en la arrogancia, lo que motiva al equipo a perseguir metas exigentes.",
                        "Muestra consistencia entre lo que dice y hace, generando credibilidad y confianza en los colaboradores"
                    ]
                },
                {
                    name: "Gestión de creencias (mindset)",
                    behaviors: [
                        "Identifica activamente sus creencias limitantes (ej. \"no soy bueno en esto\") y las reescribe hacia un lenguaje transformador y empoderante (ej. \"estoy aprendiendo a dominar esto\").",
                        "Sustituye preguntas de víctima (¿Por qué a mí?) por preguntas de protagonista (¿Qué puedo aprender de esto? ¿Cómo puedo aportar valor?)."
                    ]
                },
                {
                    name: "Responsabilidad radical (accountability)",
                    behaviors: [
                        "Pasa de poner excusas a tomar decisiones; reconoce que tiene el control de su vida y responsabilidad sobre sus resultados.",
                        "No culpa a factores externos; asume la propiedad de sus errores y busca soluciones proactivas."
                    ]
                }
            ]
        },
        {
            sub: "Inteligencia emocional y regulación (self-regulation)",
            competences: [
                {
                    name: "Autoconciencia emocional",
                    behaviors: [
                        "Monitorea sus estados de ánimo en tiempo real y reconoce cómo estos afectan su toma de decisiones y a las personas a su alrededor.",
                        "Identifica sus \"detonantes\" emocionales (ej. sentirse cuestionado) antes de que provoquen una reacción impulsiva."
                    ]
                },
                {
                    name: "Regulación emocional",
                    behaviors: [
                        "Aplica la pausa estratégica (Método STOP: Parar, Pensar, Observar, Proceder) antes de reaccionar ante una crisis.",
                        "Utiliza \"anclas de serenidad\" (respiración consciente, objetos físicos o mantras) para volver a su centro en momentos de estrés.",
                        "Gestiona la frustración manteniendo la calma, proyectando estabilidad al equipo."
                    ]
                },
                {
                    name: "Gestión de la energía",
                    behaviors: [
                        "Prioriza su descanso y desconexión para mantener la claridad mental, entendiendo que el agotamiento afecta la calidad de sus decisiones.",
                        "Incorpora rutinas de bienestar físico y mental para recargar su \"batería\" de liderazgo."
                    ]
                }
            ]
        },
        {
            sub: "Propósito y valores (integridad)",
            competences: [
                {
                    name: "Claridad de propósito (Ikigai)",
                    behaviors: [
                        "Define y articula un \"para qué\" claro que conecta su trabajo diario con un impacto mayor (ej. \"Estoy aquí para empoderar a otros\").",
                        "Utiliza su propósito como filtro para la toma de decisiones difíciles, asegurando que sus acciones honren su intención de vida."
                    ]
                },
                {
                    name: "Integridad y coherencia",
                    behaviors: [
                        "Hace lo que dice. Sus acciones privadas y públicas son congruentes con los valores que predica.",
                        "Cumple sus promesas y compromisos, generando un entorno de confianza y previsibilidad.",
                        "Defiende sus principios éticos incluso bajo presión o ante la posibilidad de ganancias a corto plazo."
                    ]
                },
                {
                    name: "Autenticidad",
                    behaviors: [
                        "Se muestra genuino, sin adoptar \"máscaras\" corporativas; tiene la valentía de ser él mismo mientras lidera.",
                        "Es transparente sobre sus intenciones y valores, lo que facilita la conexión humana con su equipo."
                    ]
                }
            ]
        },
        {
            sub: "Aprendizaje y reflexión (self-awareness)",
            competences: [
                {
                    name: "Práctica reflexiva",
                    behaviors: [
                        "Dedica tiempo agendado para la auto-observación y el análisis de su desempeño (ej. llevar un diario o bitácora emocional).",
                        "Se hace preguntas poderosas sobre su identidad y futuro (¿En quién me quiero convertir? ¿Qué puedo ofrecer?)."
                    ]
                },
                {
                    name: "Apertura al feedback",
                    behaviors: [
                        "Solicita retroalimentación constructiva de pares, superiores y subordinados para identificar puntos ciegos.",
                        "Recibe la crítica sin ponerse a la defensiva, utilizándola como insumo para su crecimiento personal."
                    ]
                },
                {
                    name: "Mentalidad de crecimiento",
                    behaviors: [
                        "Ve los errores y fracasos no como definiciones de su valía, sino como oportunidades de aprendizaje y mejora.",
                        "Está dispuesto a desaprender hábitos viejos y adquirir nuevas competencias para adaptarse a nuevos desafíos."
                    ]
                }
            ]
        },
        {
            sub: "Gestión de energía y bienestar (biohacking)",
            competences: [
                {
                    name: "Regulación somática y fisiológica",
                    behaviors: [
                        "Aplica técnicas de respiración consciente antes de situaciones de alta presión.",
                        "Gestiona sus ritmos circadianos y descanso para asegurar un rendimiento cognitivo óptimo."
                    ]
                }
            ]
        },
        {
            sub: "Identidad de liderazgo (identity ownership)",
            competences: [
                {
                    name: "Re-alineación Cognitiva",
                    behaviors: [
                        "Reescribe narrativas internas de duda (\"ocupo el cargo\") por narrativas de propiedad (\"merezco el cargo\").",
                        "Integra sus valores personales con su rol profesional sin sentir que está \"actuando\"."
                    ]
                }
            ]
        }
    ]

    const OTHER_PILLARS = [
        {
            name: 'Shine Out',
            subcomponents: ['Estrategia de Networking', 'Marca Personal Digital', 'Pitch & Storytelling', 'Comunicación de Impacto']
        },
        {
            name: 'Shine Up',
            subcomponents: ['Política Organizacional', 'Liderazgo Estratégico', 'Negociación Avanzada', 'Gestión de Stakeholders']
        },
        {
            name: 'Shine Beyond',
            subcomponents: ['Mentoría & Coaching', 'Innovación y Futuro', 'Sostenibilidad del Éxito', 'Transferencia de Conocimiento']
        }
    ]

    // B. Seed Shine Within
    const swName = 'Shine Within'
    const swId = `p-${toSlug(swName)}`

    // Upsert Pillar
    const swPillar = await prisma.taxonomy.upsert({
        where: { id: swId },
        update: { name: swName },
        create: { id: swId, name: swName, type: 'Pillar', order: 0, active: true }
    })

    let subOrder = 0
    for (const s of SHINE_WITHIN_DATA) {
        const subId = `s-${toSlug(s.sub)}`
        const subRecord = await prisma.taxonomy.upsert({
            where: { id: subId },
            update: { name: s.sub, parentId: swPillar.id, order: subOrder },
            create: { id: subId, name: s.sub, type: 'Subcomponent', parentId: swPillar.id, order: subOrder, active: true }
        })
        subOrder++

        let compOrder = 0
        for (const c of s.competences) {
            const compId = `c-${toSlug(c.name)}`
            const compRecord = await prisma.taxonomy.upsert({
                where: { id: compId },
                update: { name: c.name, parentId: subRecord.id, order: compOrder },
                create: { id: compId, name: c.name, type: 'Competence', parentId: subRecord.id, order: compOrder, active: true }
            })
            compOrder++

            let behOrder = 0
            for (const b of c.behaviors) {
                // Deterministic ID for upsert
                const behSlug = toSlug(b).substring(0, 40)
                const behId = `b-${behSlug}-${behOrder}`
                await prisma.taxonomy.upsert({
                    where: { id: behId },
                    update: { name: b, parentId: compRecord.id, order: behOrder },
                    create: { id: behId, name: b, type: 'Behavior', parentId: compRecord.id, order: behOrder, active: true }
                })
                behOrder++
            }
        }
    }

    // C. Seed Others
    let pOrder = 1
    for (const p of OTHER_PILLARS) {
        const pId = `p-${toSlug(p.name)}`
        const pRecord = await prisma.taxonomy.upsert({
            where: { id: pId },
            update: { name: p.name },
            create: { id: pId, name: p.name, type: 'Pillar', order: pOrder++, active: true }
        })

        let sOrder = 0
        for (const s of p.subcomponents) {
            const sId = `s-${toSlug(s)}`
            await prisma.taxonomy.upsert({
                where: { id: sId },
                update: { name: s, parentId: pRecord.id, order: sOrder },
                create: { id: sId, name: s, type: 'Subcomponent', parentId: pRecord.id, order: sOrder++, active: true }
            })
        }
    }

    // 3. Content Items from Prototype (New Dataset)
    const contents = [
        { id: '4S-P-001', title: 'Guía Fundamental de Networking', type: 'PDF', primaryPillar: 'Shine Out', secondaryPillars: [], sub: 'Networking', maturity: 'Básico', status: 'Approved', complete: 100, ip: 'Propio', driveId: 'VALID_ID' },
        { id: '4S-V-020', title: 'Video: Elevator Pitch TED', type: 'Video', primaryPillar: 'Shine Within', secondaryPillars: [], sub: 'Comunicación', maturity: 'Intermedio', status: 'Review', complete: 90, ip: 'Tercero', driveId: 'VALID_ID' },
        { id: '4S-T-099', title: 'Matriz de Influencia Política', type: 'Herramienta', primaryPillar: 'Shine Up', secondaryPillars: [], sub: 'Influencia', maturity: 'Avanzado', status: 'Draft', complete: 20, ip: 'Completar', driveId: null },
        { id: '4S-P-002', title: 'Checklist de LinkedIn', type: 'PDF', primaryPillar: 'Shine Out', secondaryPillars: [], sub: 'Marca Personal', maturity: 'Básico', status: 'Approved', complete: 100, ip: 'Propio', driveId: 'VALID_ID' },
        { id: '4S-D-105', title: 'Manual Facilitador Módulo 1', type: 'Doc', primaryPillar: 'Transversal', secondaryPillars: [], sub: 'General', maturity: 'N/A', status: 'Draft', complete: 40, ip: 'Propio', driveId: null }
    ]

    for (const c of contents) {
        await prisma.contentItem.upsert({
            where: { id: c.id },
            update: {
                title: c.title,
                type: c.type,
                primaryPillar: c.primaryPillar,
                secondaryPillars: c.secondaryPillars,
                sub: c.sub,
                maturity: c.maturity,
                level: c.maturity,
                status: c.status,
                ip: c.ip,
                completeness: c.complete,
                driveId: c.driveId
            },
            create: {
                id: c.id,
                title: c.title,
                type: c.type,
                primaryPillar: c.primaryPillar,
                secondaryPillars: c.secondaryPillars,
                sub: c.sub,
                maturity: c.maturity,
                level: c.maturity,
                version: 'v1.0',
                status: c.status,
                ip: c.ip,
                completeness: c.complete,
                driveId: c.driveId,
            },
        })
    }
    // 4. Artifacts
    const artifacts = [
        { name: "Dossier Maestro", type: "PDF", lastGen: new Date() },
        { name: "Workbook Participante", type: "PDF", lastGen: new Date() },
        { name: "Guía de Facilitador", type: "Doc", lastGen: new Date() },
    ]
    for (const a of artifacts) {
        await prisma.artifact.create({
            data: a
        })
    }

    // 5. Seed Admin User
    const adminEmail = 'andrestablarico@gmail.com'
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: 'ADMIN' },
        create: {
            email: adminEmail,
            name: 'Andres Tabla (Admin)',
            role: 'ADMIN'
        }
    })
    console.log('Admin user seeded.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
