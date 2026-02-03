import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Starting Taxonomy Migration 2026...\n')

    // Step 1: Rename "Shine In" to "Shine Within" in Taxonomy table
    console.log('📝 Step 1: Renaming "Shine In" → "Shine Within" in Taxonomy...')
    const shineInPillar = await prisma.taxonomy.findFirst({
        where: { name: 'Shine In', type: 'Pillar' }
    })

    if (shineInPillar) {
        await prisma.taxonomy.update({
            where: { id: shineInPillar.id },
            data: { name: 'Shine Within' }
        })
        console.log('✅ Renamed Pillar: Shine In → Shine Within')
    } else {
        console.log('⚠️  Pillar "Shine In" not found, checking for "Shine Within"...')
        const shineWithinExists = await prisma.taxonomy.findFirst({
            where: { name: 'Shine Within', type: 'Pillar' }
        })
        if (!shineWithinExists) {
            console.error('❌ Neither "Shine In" nor "Shine Within" found! Creating new pillar...')
            await prisma.taxonomy.create({
                data: {
                    name: 'Shine Within',
                    type: 'Pillar',
                    active: true,
                    order: 1
                }
            })
        }
    }

    // Step 2: Update ContentItem references
    console.log('\n📝 Step 2: Updating ContentItem references...')
    const primaryUpdated = await prisma.contentItem.updateMany({
        where: { primaryPillar: 'Shine In' },
        data: { primaryPillar: 'Shine Within' }
    })
    console.log(`✅ Updated ${primaryUpdated.count} items with primaryPillar = "Shine Within"`)

    const itemsWithSecondary = await prisma.contentItem.findMany({
        where: { secondaryPillars: { has: 'Shine In' } }
    })
    for (const item of itemsWithSecondary) {
        const newPillars = item.secondaryPillars.map(p => p === 'Shine In' ? 'Shine Within' : p)
        await prisma.contentItem.update({
            where: { id: item.id },
            data: { secondaryPillars: newPillars }
        })
    }
    console.log(`✅ Updated ${itemsWithSecondary.length} items with secondaryPillars containing "Shine Within"`)

    // Step 3: Update ResearchSource references
    console.log('\n📝 Step 3: Updating ResearchSource references...')
    const researchSources = await prisma.researchSource.findMany({
        where: { pillars: { has: 'Shine In' } }
    })
    for (const source of researchSources) {
        const newPillars = source.pillars.map(p => p === 'Shine In' ? 'Shine Within' : p)
        await prisma.researchSource.update({
            where: { id: source.id },
            data: { pillars: newPillars }
        })
    }
    console.log(`✅ Updated ${researchSources.length} research sources with "Shine Within"`)

    // Step 4: Update GlossaryTerm references
    console.log('\n📝 Step 4: Updating GlossaryTerm references...')
    const glossaryTerms = await prisma.glossaryTerm.findMany({
        where: { pillars: { has: 'Shine In' } }
    })
    for (const term of glossaryTerms) {
        const newPillars = term.pillars.map(p => p === 'Shine In' ? 'Shine Within' : p)
        await prisma.glossaryTerm.update({
            where: { id: term.id },
            data: { pillars: newPillars }
        })
    }
    console.log(`✅ Updated ${glossaryTerms.length} glossary terms with "Shine Within"`)

    // Step 5: Delete old taxonomy structure
    console.log('\n📝 Step 5: Deleting old taxonomy structure...')
    const shineWithinPillar = await prisma.taxonomy.findFirst({
        where: { name: 'Shine Within', type: 'Pillar' }
    })

    if (shineWithinPillar) {
        // Delete all children recursively
        const oldSubs = await prisma.taxonomy.findMany({
            where: { parentId: shineWithinPillar.id }
        })

        for (const sub of oldSubs) {
            const oldComps = await prisma.taxonomy.findMany({
                where: { parentId: sub.id }
            })

            for (const comp of oldComps) {
                await prisma.taxonomy.deleteMany({
                    where: { parentId: comp.id }
                })
            }

            await prisma.taxonomy.deleteMany({
                where: { parentId: sub.id }
            })
        }

        await prisma.taxonomy.deleteMany({
            where: { parentId: shineWithinPillar.id }
        })

        console.log('✅ Deleted old Shine Within taxonomy structure')
    }

    // Repeat for Shine Out
    const shineOutPillar = await prisma.taxonomy.findFirst({
        where: { name: 'Shine Out', type: 'Pillar' }
    })

    if (shineOutPillar) {
        const oldSubs = await prisma.taxonomy.findMany({
            where: { parentId: shineOutPillar.id }
        })

        for (const sub of oldSubs) {
            const oldComps = await prisma.taxonomy.findMany({
                where: { parentId: sub.id }
            })

            for (const comp of oldComps) {
                await prisma.taxonomy.deleteMany({
                    where: { parentId: comp.id }
                })
            }

            await prisma.taxonomy.deleteMany({
                where: { parentId: sub.id }
            })
        }

        await prisma.taxonomy.deleteMany({
            where: { parentId: shineOutPillar.id }
        })

        console.log('✅ Deleted old Shine Out taxonomy structure')
    }

    // Repeat for Shine Beyond
    const shineBeyondPillar = await prisma.taxonomy.findFirst({
        where: { name: 'Shine Beyond', type: 'Pillar' }
    })

    if (shineBeyondPillar) {
        const oldSubs = await prisma.taxonomy.findMany({
            where: { parentId: shineBeyondPillar.id }
        })

        for (const sub of oldSubs) {
            const oldComps = await prisma.taxonomy.findMany({
                where: { parentId: sub.id }
            })

            for (const comp of oldComps) {
                await prisma.taxonomy.deleteMany({
                    where: { parentId: comp.id }
                })
            }

            await prisma.taxonomy.deleteMany({
                where: { parentId: sub.id }
            })
        }

        await prisma.taxonomy.deleteMany({
            where: { parentId: shineBeyondPillar.id }
        })

        console.log('✅ Deleted old Shine Beyond taxonomy structure')
    }

    // Step 6: Insert new taxonomy structure
    console.log('\n📝 Step 6: Inserting new taxonomy structure...')

    // Get pillar IDs
    const shineWithin = await prisma.taxonomy.findFirst({
        where: { name: 'Shine Within', type: 'Pillar' }
    })
    const shineOut = await prisma.taxonomy.findFirst({
        where: { name: 'Shine Out', type: 'Pillar' }
    })
    const shineBeyond = await prisma.taxonomy.findFirst({
        where: { name: 'Shine Beyond', type: 'Pillar' }
    })

    if (!shineWithin || !shineOut || !shineBeyond) {
        throw new Error('Pillars not found!')
    }

    // SHINE WITHIN
    console.log('\n  📌 Creating Shine Within structure...')

    // Componente 1: Autoconfianza y autoliderazgo
    const comp1 = await prisma.taxonomy.create({
        data: {
            name: 'Autoconfianza y autoliderazgo',
            type: 'Sub',
            parentId: shineWithin.id,
            active: true,
            order: 1
        }
    })

    const comp1_competence1 = await prisma.taxonomy.create({
        data: {
            name: 'Autoeficacia y seguridad',
            type: 'Comp',
            parentId: comp1.id,
            active: true,
            order: 1
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Afronta desafíos con seguridad en sus capacidades sin caer en la arrogancia, lo que motiva al equipo a perseguir metas exigentes.',
                type: 'Behavior',
                parentId: comp1_competence1.id,
                active: true,
                order: 1
            },
            {
                name: 'Muestra consistencia entre lo que dice y hace, generando credibilidad y confianza en los colaboradores',
                type: 'Behavior',
                parentId: comp1_competence1.id,
                active: true,
                order: 2
            }
        ]
    })

    const comp1_competence2 = await prisma.taxonomy.create({
        data: {
            name: 'Gestión de creencias (mindset)',
            type: 'Comp',
            parentId: comp1.id,
            active: true,
            order: 2
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Identifica activamente sus creencias limitantes (ej. "no soy bueno en esto") y las reescribe hacia un lenguaje transformador y empoderante (ej. "estoy aprendiendo a dominar esto").',
                type: 'Behavior',
                parentId: comp1_competence2.id,
                active: true,
                order: 1
            },
            {
                name: 'Sustituye preguntas de víctima (¿Por qué a mí?) por preguntas de protagonista (¿Qué puedo aprender de esto? ¿Cómo puedo aportar valor?).',
                type: 'Behavior',
                parentId: comp1_competence2.id,
                active: true,
                order: 2
            }
        ]
    })

    const comp1_competence3 = await prisma.taxonomy.create({
        data: {
            name: 'Responsabilidad radical (accountability)',
            type: 'Comp',
            parentId: comp1.id,
            active: true,
            order: 3
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Pasa de poner excusas a tomar decisiones; reconoce que tiene el control de su vida y responsabilidad sobre sus resultados.',
                type: 'Behavior',
                parentId: comp1_competence3.id,
                active: true,
                order: 1
            },
            {
                name: 'No culpa a factores externos; asume la propiedad de sus errores y busca soluciones proactivas.',
                type: 'Behavior',
                parentId: comp1_competence3.id,
                active: true,
                order: 2
            }
        ]
    })

    // Componente 2: Inteligencia emocional y regulación
    const comp2 = await prisma.taxonomy.create({
        data: {
            name: 'Inteligencia emocional y regulación (self-regulation)',
            type: 'Sub',
            parentId: shineWithin.id,
            active: true,
            order: 2
        }
    })

    const comp2_competence1 = await prisma.taxonomy.create({
        data: {
            name: 'Autoconciencia emocional',
            type: 'Comp',
            parentId: comp2.id,
            active: true,
            order: 1
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Monitorea sus estados de ánimo en tiempo real y reconoce cómo estos afectan su toma de decisiones y su trato con los demás.',
                type: 'Behavior',
                parentId: comp2_competence1.id,
                active: true,
                order: 1
            },
            {
                name: 'Identifica sus "detonantes" emocionales y tiene estrategias para gestionarlos antes de reaccionar impulsivamente.',
                type: 'Behavior',
                parentId: comp2_competence1.id,
                active: true,
                order: 2
            }
        ]
    })

    const comp2_competence2 = await prisma.taxonomy.create({
        data: {
            name: 'Gestión del estrés y resiliencia',
            type: 'Comp',
            parentId: comp2.id,
            active: true,
            order: 2
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Mantiene la calma y la claridad mental bajo presión, sirviendo como un ancla emocional para el equipo en momentos de crisis.',
                type: 'Behavior',
                parentId: comp2_competence2.id,
                active: true,
                order: 1
            },
            {
                name: 'Se recupera rápidamente de los contratiempos, viendo los fracasos como oportunidades de aprendizaje y no como derrotas personales.',
                type: 'Behavior',
                parentId: comp2_competence2.id,
                active: true,
                order: 2
            }
        ]
    })

    // Componente 3: Propósito y valores personales
    const comp3 = await prisma.taxonomy.create({
        data: {
            name: 'Propósito y valores personales',
            type: 'Sub',
            parentId: shineWithin.id,
            active: true,
            order: 3
        }
    })

    const comp3_competence1 = await prisma.taxonomy.create({
        data: {
            name: 'Claridad de propósito (ikigai)',
            type: 'Comp',
            parentId: comp3.id,
            active: true,
            order: 1
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Conoce y articula su propósito personal y profesional, lo que le da dirección y energía en su liderazgo diario.',
                type: 'Behavior',
                parentId: comp3_competence1.id,
                active: true,
                order: 1
            },
            {
                name: 'Alinea sus decisiones y acciones con sus valores fundamentales, actuando con integridad incluso cuando nadie lo ve.',
                type: 'Behavior',
                parentId: comp3_competence1.id,
                active: true,
                order: 2
            }
        ]
    })

    const comp3_competence2 = await prisma.taxonomy.create({
        data: {
            name: 'Autenticidad y vulnerabilidad',
            type: 'Comp',
            parentId: comp3.id,
            active: true,
            order: 2
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Se muestra humano y accesible, admitiendo cuando no tiene todas las respuestas o cuando ha cometido un error.',
                type: 'Behavior',
                parentId: comp3_competence2.id,
                active: true,
                order: 1
            },
            {
                name: 'Comparte sus experiencias y aprendizajes (incluyendo los difíciles) para conectar genuinamente con los demás y fomentar un ambiente de confianza.',
                type: 'Behavior',
                parentId: comp3_competence2.id,
                active: true,
                order: 2
            }
        ]
    })

    console.log('  ✅ Shine Within: 3 componentes, 7 competencias, 14 conductas')

    // SHINE OUT
    console.log('\n  📌 Creating Shine Out structure...')

    // Componente 1: Empatía y conexión
    const out_comp1 = await prisma.taxonomy.create({
        data: {
            name: 'Empatía y conexión',
            type: 'Sub',
            parentId: shineOut.id,
            active: true,
            order: 1
        }
    })

    const out_comp1_competence1 = await prisma.taxonomy.create({
        data: {
            name: 'Escucha activa y presencia',
            type: 'Comp',
            parentId: out_comp1.id,
            active: true,
            order: 1
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Escucha para comprender, no para responder; hace preguntas poderosas que invitan a la reflexión y profundizan el diálogo.',
                type: 'Behavior',
                parentId: out_comp1_competence1.id,
                active: true,
                order: 1
            },
            {
                name: 'Está plenamente presente en las interacciones, dejando de lado distracciones (como el celular) para dar toda su atención al interlocutor.',
                type: 'Behavior',
                parentId: out_comp1_competence1.id,
                active: true,
                order: 2
            }
        ]
    })

    const out_comp1_competence2 = await prisma.taxonomy.create({
        data: {
            name: 'Validación emocional',
            type: 'Comp',
            parentId: out_comp1.id,
            active: true,
            order: 2
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Reconoce y valida las emociones de los miembros del equipo ("Entiendo que te sientas frustrado..."), creando un espacio seguro para la expresión.',
                type: 'Behavior',
                parentId: out_comp1_competence2.id,
                active: true,
                order: 1
            },
            {
                name: 'Demuestra interés genuino por el bienestar de las personas, más allá de sus resultados laborales.',
                type: 'Behavior',
                parentId: out_comp1_competence2.id,
                active: true,
                order: 2
            }
        ]
    })

    // Componente 2: Comunicación e influencia
    const out_comp2 = await prisma.taxonomy.create({
        data: {
            name: 'Comunicación e influencia',
            type: 'Sub',
            parentId: shineOut.id,
            active: true,
            order: 2
        }
    })

    const out_comp2_competence1 = await prisma.taxonomy.create({
        data: {
            name: 'Comunicación asertiva y clara',
            type: 'Comp',
            parentId: out_comp2.id,
            active: true,
            order: 1
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Expresa sus ideas, expectativas y límites de manera clara, directa y respetuosa, evitando ambigüedades.',
                type: 'Behavior',
                parentId: out_comp2_competence1.id,
                active: true,
                order: 1
            },
            {
                name: 'Adapta su estilo de comunicación al interlocutor y al contexto para asegurar que el mensaje sea recibido y comprendido correctamente.',
                type: 'Behavior',
                parentId: out_comp2_competence1.id,
                active: true,
                order: 2
            }
        ]
    })

    const out_comp2_competence2 = await prisma.taxonomy.create({
        data: {
            name: 'Persuasión e inspiración (storytelling)',
            type: 'Comp',
            parentId: out_comp2.id,
            active: true,
            order: 2
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Utiliza historias y metáforas para comunicar la visión y los valores, haciendo que los mensajes sean memorables y movilizadores.',
                type: 'Behavior',
                parentId: out_comp2_competence2.id,
                active: true,
                order: 1
            },
            {
                name: 'Inspira a la acción conectando las tareas diarias con un propósito mayor ("el porqué" detrás del "qué").',
                type: 'Behavior',
                parentId: out_comp2_competence2.id,
                active: true,
                order: 2
            }
        ]
    })

    // Componente 3: Desarrollo de otros
    const out_comp3 = await prisma.taxonomy.create({
        data: {
            name: 'Desarrollo de otros',
            type: 'Sub',
            parentId: shineOut.id,
            active: true,
            order: 3
        }
    })

    const out_comp3_competence1 = await prisma.taxonomy.create({
        data: {
            name: 'Mentoring y coaching',
            type: 'Comp',
            parentId: out_comp3.id,
            active: true,
            order: 1
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Dedica tiempo regularmente a conversaciones de desarrollo, ayudando a los miembros del equipo a identificar sus fortalezas y áreas de mejora.',
                type: 'Behavior',
                parentId: out_comp3_competence1.id,
                active: true,
                order: 1
            },
            {
                name: 'Ofrece feedback constructivo y oportuno, enfocado en el crecimiento y no en la crítica destructiva.',
                type: 'Behavior',
                parentId: out_comp3_competence1.id,
                active: true,
                order: 2
            }
        ]
    })

    const out_comp3_competence2 = await prisma.taxonomy.create({
        data: {
            name: 'Empoderamiento y delegación',
            type: 'Comp',
            parentId: out_comp3.id,
            active: true,
            order: 2
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Delega tareas desafiantes con confianza, proporcionando la autonomía y los recursos necesarios para que el equipo tenga éxito.',
                type: 'Behavior',
                parentId: out_comp3_competence2.id,
                active: true,
                order: 1
            },
            {
                name: 'Fomenta la toma de decisiones independiente, permitiendo que el equipo aprenda de sus propios aciertos y errores.',
                type: 'Behavior',
                parentId: out_comp3_competence2.id,
                active: true,
                order: 2
            }
        ]
    })

    console.log('  ✅ Shine Out: 3 componentes, 6 competencias, 12 conductas')

    // SHINE BEYOND
    console.log('\n  📌 Creating Shine Beyond structure...')

    // Componente 1: Visión estratégica y sistémica
    const beyond_comp1 = await prisma.taxonomy.create({
        data: {
            name: 'Visión estratégica y sistémica',
            type: 'Sub',
            parentId: shineBeyond.id,
            active: true,
            order: 1
        }
    })

    const beyond_comp1_competence1 = await prisma.taxonomy.create({
        data: {
            name: 'Pensamiento a largo plazo',
            type: 'Comp',
            parentId: beyond_comp1.id,
            active: true,
            order: 1
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Anticipa tendencias y cambios en el entorno, preparando al equipo para adaptarse y prosperar en el futuro.',
                type: 'Behavior',
                parentId: beyond_comp1_competence1.id,
                active: true,
                order: 1
            },
            {
                name: 'Equilibra las necesidades operativas inmediatas con la visión estratégica de largo plazo, asegurando la sostenibilidad del negocio.',
                type: 'Behavior',
                parentId: beyond_comp1_competence1.id,
                active: true,
                order: 2
            }
        ]
    })

    const beyond_comp1_competence2 = await prisma.taxonomy.create({
        data: {
            name: 'Comprensión del ecosistema',
            type: 'Comp',
            parentId: beyond_comp1.id,
            active: true,
            order: 2
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Entiende cómo las acciones de su equipo impactan en otras áreas de la organización y en los stakeholders externos.',
                type: 'Behavior',
                parentId: beyond_comp1_competence2.id,
                active: true,
                order: 1
            },
            {
                name: 'Promueve la colaboración interdepartamental, rompiendo silos para lograr objetivos comunes.',
                type: 'Behavior',
                parentId: beyond_comp1_competence2.id,
                active: true,
                order: 2
            }
        ]
    })

    // Componente 2: Legado personal y trascendencia
    const beyond_comp2 = await prisma.taxonomy.create({
        data: {
            name: 'Legado personal y trascendencia',
            type: 'Sub',
            parentId: shineBeyond.id,
            active: true,
            order: 2
        }
    })

    const beyond_comp2_competence1 = await prisma.taxonomy.create({
        data: {
            name: 'Reconocimiento y humildad',
            type: 'Comp',
            parentId: beyond_comp2.id,
            active: true,
            order: 1
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Pone los focos sobre su equipo: cuando hay éxito, se aparta para que su equipo brille ("stand back"); cuando hay fracaso, asume la responsabilidad.',
                type: 'Behavior',
                parentId: beyond_comp2_competence1.id,
                active: true,
                order: 1
            },
            {
                name: 'Celebra genuinamente los hitos personales y profesionales de los demás, construyendo una cultura de gratitud y apreciación.',
                type: 'Behavior',
                parentId: beyond_comp2_competence1.id,
                active: true,
                order: 2
            }
        ]
    })

    const beyond_comp2_competence2 = await prisma.taxonomy.create({
        data: {
            name: 'Conexión con el propósito (meaning)',
            type: 'Comp',
            parentId: beyond_comp2.id,
            active: true,
            order: 2
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Ayuda a cada miembro del equipo a descubrir su propio propósito y a conectarlo con la misión de la organización (alineación de propósito).',
                type: 'Behavior',
                parentId: beyond_comp2_competence2.id,
                active: true,
                order: 1
            },
            {
                name: 'Transforma el trabajo rutinario en una misión significativa, recordando constantemente el impacto positivo que el equipo tiene en el mundo.',
                type: 'Behavior',
                parentId: beyond_comp2_competence2.id,
                active: true,
                order: 2
            }
        ]
    })

    // Componente 3: Inteligencia cultural e inclusiva
    const beyond_comp3 = await prisma.taxonomy.create({
        data: {
            name: 'Inteligencia cultural e inclusiva',
            type: 'Sub',
            parentId: shineBeyond.id,
            active: true,
            order: 3
        }
    })

    const beyond_comp3_competence1 = await prisma.taxonomy.create({
        data: {
            name: 'Gestión de la diversidad cognitiva',
            type: 'Comp',
            parentId: beyond_comp3.id,
            active: true,
            order: 1
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Forma deliberadamente equipos con diversidad de pensamiento y antecedentes.',
                type: 'Behavior',
                parentId: beyond_comp3_competence1.id,
                active: true,
                order: 1
            },
            {
                name: 'Detecta y mitiga sesgos inconscientes en la contratación y promoción de talento.',
                type: 'Behavior',
                parentId: beyond_comp3_competence1.id,
                active: true,
                order: 2
            }
        ]
    })

    // Componente 4: Liderazgo regenerativo
    const beyond_comp4 = await prisma.taxonomy.create({
        data: {
            name: 'Liderazgo regenerativo',
            type: 'Sub',
            parentId: shineBeyond.id,
            active: true,
            order: 4
        }
    })

    const beyond_comp4_competence1 = await prisma.taxonomy.create({
        data: {
            name: 'Conciencia sistémica y comunitaria',
            type: 'Comp',
            parentId: beyond_comp4.id,
            active: true,
            order: 1
        }
    })

    await prisma.taxonomy.createMany({
        data: [
            {
                name: 'Conecta los objetivos de negocio con necesidades reales de la comunidad o el medio ambiente.',
                type: 'Behavior',
                parentId: beyond_comp4_competence1.id,
                active: true,
                order: 1
            },
            {
                name: 'Actúa como un "tejedor" de relaciones externas que traen valor social a la empresa.',
                type: 'Behavior',
                parentId: beyond_comp4_competence1.id,
                active: true,
                order: 2
            }
        ]
    })

    console.log('  ✅ Shine Beyond: 4 componentes, 6 competencias, 12 conductas')

    // Step 7: Verification
    console.log('\n📝 Step 7: Verification...')
    const verifyShineIn = await prisma.contentItem.count({
        where: { primaryPillar: 'Shine In' }
    })
    console.log(`  ✅ ContentItems with "Shine In" as primary: ${verifyShineIn} (should be 0)`)

    const verifyShineWithin = await prisma.contentItem.count({
        where: { primaryPillar: 'Shine Within' }
    })
    console.log(`  ✅ ContentItems with "Shine Within" as primary: ${verifyShineWithin}`)

    const totalTaxonomy = await prisma.taxonomy.count()
    console.log(`  ✅ Total taxonomy nodes: ${totalTaxonomy}`)

    console.log('\n✅ Taxonomy Migration 2026 Complete!')
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
