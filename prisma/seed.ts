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
    // A. Define Data
    const TAXONOMY_DATA = [
        {
            pillar: "Shine Within",
            subs: [
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
        },
        {
            pillar: "Shine Out",
            subs: [
                {
                    sub: "Comunicación poderosa",
                    competences: [
                        {
                            name: "Claridad e inspiración",
                            behaviors: [
                                "Expresa objetivos y la visión de futuro de forma clara, evitando la ambigüedad sobre qué se espera y por qué es importante.",
                                "Utiliza un tono entusiasta, historias o metáforas para alinear al equipo bajo un propósito común y motivador."
                            ]
                        },
                        {
                            name: "Escucha Activa y Empática",
                            behaviors: [
                                "Presta atención plena (mindfulness) cuando un colaborador habla, parafraseando para confirmar entendimiento y validando las aportaciones.",
                                "Se \"pone en los zapatos\" de sus colegas para construir relaciones de confianza y seguridad psicológica."
                            ]
                        },
                        {
                            name: "Adaptabilidad Comunicativa",
                            behaviors: [
                                "\"Lee\" a su audiencia y ajusta su estilo y lenguaje (ej. técnico vs. estratégico) según el interlocutor.",
                                "Identifica señales no verbales en los demás y modifica el ritmo o enfoque de su mensaje para mantener la sintonía y asegurar que el mensaje sea aceptado."
                            ]
                        }
                    ]
                },
                {
                    sub: "Influencia positiva",
                    competences: [
                        {
                            name: "Construcción de confianza (Trust)",
                            behaviors: [
                                "Comparte información relevante de manera oportuna y honesta (transparencia), incluso las malas noticias.",
                                "Admite abiertamente cuando \"no sabe\" algo y trata a todos con respeto, eliminando el miedo a represalias por reportar problemas."
                            ]
                        },
                        {
                            name: "Influencia ética y persuasión",
                            behaviors: [
                                "Utiliza la persuasión racional (datos/hechos) y el ejemplo personal (\"walk the talk\") en lugar de la manipulación o la amenaza.",
                                "Apela a valores e ideales compartidos para generar una voluntad genuina de colaboración en el equipo."
                            ]
                        },
                        {
                            name: "Reconocimiento y feedback",
                            behaviors: [
                                "Reconoce públicamente los logros y da crédito explícito a los colaboradores por sus contribuciones, fomentando el orgullo colectivo.",
                                "Brinda feedback privado, específico y centrado en la conducta (no en la persona) para corregir el rumbo y desarrollar talento."
                            ]
                        }
                    ]
                },
                {
                    sub: "Networking estratégico",
                    competences: [
                        {
                            name: "Conectividad interna y externa",
                            behaviors: [
                                "Conecta activamente a su equipo con otras áreas para derribar silos y fomentar la colaboración interdepartamental.",
                                "Participa en eventos de la industria y mantiene vínculos con stakeholders externos (clientes, proveedores) para detectar tendencias."
                            ]
                        },
                        {
                            name: "Gestión de relaciones (relationship management)",
                            behaviors: [
                                "Actúa como un \"tejedor\" de relaciones, facilitando el acceso a recursos y conocimientos críticos para el equipo a través de su red de contactos.",
                                "Utiliza su capital social para apoyar a su equipo y abrir puertas a nuevas oportunidades de negocio o desarrollo."
                            ]
                        },
                        {
                            name: "Visibilidad estratégica",
                            behaviors: [
                                "Se posiciona no solo como experto técnico, sino como un referente que aporta valor en comités y espacios de decisión.",
                                "Construye relaciones basadas en la reciprocidad y el valor mutuo, no solo en la necesidad inmediata (transaccional)."
                            ]
                        }
                    ]
                },
                {
                    sub: "Presencia digital e híbrida",
                    competences: [
                        {
                            name: "Influencia asíncrona y virtual",
                            behaviors: [
                                "Proyecta la misma \"gravitas\" y calidez en videoconferencias que en persona.",
                                "Gestiona su reputación y narrativa en plataformas digitales (LinkedIn) de forma estratégica, no solo social."
                            ]
                        }
                    ]
                },
                {
                    sub: "Competencia conversacional (ontológica)",
                    competences: [
                        {
                            name: "Ingeniería del lenguaje (promesas y pedidos)",
                            behaviors: [
                                "Hace pedidos impecables (con condiciones de satisfacción y tiempos claros) para evitar retrabajos.",
                                "Gestiona sus promesas: si no puede cumplir, revoca o renegocia a tiempo, manteniendo la confianza."
                            ]
                        }
                    ]
                }
            ]
        },
        {
            pillar: "Shine Up",
            subs: [
                {
                    sub: "Visión de futuro y estrategia",
                    competences: [
                        {
                            name: "Pensamiento estratégico",
                            behaviors: [
                                "Analiza tendencias macroeconómicas, tecnológicas y de la industria para anticipar cómo afectarán el entorno interno y externo de la empresa.",
                                "No se limita a \"apagar fuegos\" a corto plazo; dedica tiempo de calidad a la planificación y a las iniciativas de largo alcance."
                            ]
                        },
                        {
                            name: "Visión compartida (visioning)",
                            behaviors: [
                                "Articula un escenario futuro aspiracional de manera vívida (ej. \"ser referentes regionales en 5 años\") logrando que el equipo haga propia esa visión (shared vision).",
                                "Comunica el \"por qué\" detrás de las metas, dando un fuerte sentido de finalidad y propósito al trabajo diario."
                            ]
                        },
                        {
                            name: "Alineación de metas (execution)",
                            behaviors: [
                                "Traduce la visión abstracta en objetivos SMART (específicos, medibles, alcanzables, relevantes y temporales) y planes de acción concretos",
                                "Asegura la \"línea de vista\": explica claramente cómo las tareas cotidianas y las metas de corto plazo contribuyen a la estrategia general."
                            ]
                        }
                    ]
                },
                {
                    sub: "Toma de decisiones y resolución de problemas",
                    competences: [
                        {
                            name: "Compostura",
                            behaviors: [
                                "Mantiene la serenidad en situaciones de crisis, proyectando confianza y evitando que el pánico paralice al equipo.",
                                "Controla los impulsos y evita reacciones defensivas, permitiendo que otros piensen con claridad y ejecuten tareas críticas."
                            ]
                        },
                        {
                            name: "Decisión bajo incertidumbre",
                            behaviors: [
                                "Reúne datos rápidamente y consulta expertos, pero toma decisiones oportunas incluso con información incompleta, evitando la \"parálisis por análisis\".",
                                "Asume la responsabilidad de las consecuencias de sus decisiones, sean aciertos o errores, sin buscar culpables externos"
                            ]
                        },
                        {
                            name: "Resolución de causa raíz",
                            behaviors: [
                                "No se queda en la corrección de síntomas superficiales; investiga a fondo para identificar y resolver la causa raíz de los problemas basándose en evidencias y datos.",
                                "Aplica el pensamiento crítico para cuestionar suposiciones y reducir sesgos antes de decidir"
                            ]
                        }
                    ]
                },
                {
                    sub: "Adaptabilidad e innovación",
                    competences: [
                        {
                            name: "Agilidad y adaptabilidad",
                            behaviors: [
                                "Revisa y ajusta las estrategias establecidas si surgen cambios tecnológicos o regulatorios, demostrando disposición a abandonar ideas que ya no funcionan.",
                                "Fomenta una cultura donde el cambio se ve como oportunidad y no como amenaza."
                            ]
                        },
                        {
                            name: "Estimulación intelectual (innovación)",
                            behaviors: [
                                "Cuestiona el \"así es como siempre se ha hecho\", desafiando el statu quo y animando al equipo a proponer nuevas formas de trabajar.",
                                "Instituye proyectos piloto o pruebas de concepto para testear soluciones en entornos controlados antes de escalarlas."
                            ]
                        },
                        {
                            name: "Gestión del error constructivo",
                            behaviors: [
                                "Respalda al equipo cuando un experimento bien intencionado falla, enfocándose en extraer aprendizajes (\"fail forward\") en lugar de castigar el error.",
                                "Elimina el \"factor miedo\", empoderando a los empleados para asumir riesgos calculados en la búsqueda de innovación."
                            ]
                        }
                    ]
                },
                {
                    sub: "Inteligencia política y contextual",
                    competences: [
                        {
                            name: "Lectura de poder y patrocinio",
                            behaviors: [
                                "Identifica y cultiva activamente sponsors que hablen de él/ella en mesas de decisión.",
                                "Mapea las dinámicas de poder informales en la organización para destrabar proyectos."
                            ]
                        }
                    ]
                },
                {
                    sub: "Agilidad tecnológica (tech-savviness)",
                    competences: [
                        {
                            name: "Liderazgo en la industria 5.0",
                            behaviors: [
                                "Promueve la adopción de nuevas herramientas digitales sin perder el enfoque en el bienestar del equipo.",
                                "Traduce conceptos tecnológicos complejos a decisiones de negocio estratégicas."
                            ]
                        }
                    ]
                }
            ]
        },
        {
            pillar: "Shine Beyond",
            subs: [
                {
                    sub: "Desarrollo de otros líderes (mentoring & coaching)",
                    competences: [
                        {
                            name: "Mentoría y sucesión",
                            behaviors: [
                                "Identifica activamente el talento interno y dedica tiempo a formar a sus sucesores para garantizar la continuidad del liderazgo (construcción de pipeline).",
                                "Comparte conocimientos y experiencias sin reservas, actuando como guía para acelerar el aprendizaje de líderes emergentes."
                            ]
                        },
                        {
                            name: "Empoderamiento (empowerment)",
                            behaviors: [
                                "Comparte el poder delegando autoridad real para la toma de decisiones importantes, no solo tareas operativas, fomentando la autonomía.",
                                "Elimina el micro-management; define el \"qué\" pero permite al equipo decidir el \"cómo\", demostrando confianza plena en sus capacidades."
                            ]
                        },
                        {
                            name: "Desafío para el crecimiento",
                            behaviors: [
                                "Asigna proyectos desafiantes (stretch assignments) que obligan a los colaboradores a salir de su zona de confort para desarrollar nuevas habilidades.",
                                "Utiliza el coaching para ayudar a los colaboradores a encontrar sus propias soluciones en lugar de dárselas resueltas."
                            ]
                        }
                    ]
                },
                {
                    sub: "Impacto social y humano",
                    competences: [
                        {
                            name: "Ética y responsabilidad social",
                            behaviors: [
                                "Integra consideraciones éticas y de impacto comunitario en la toma de decisiones financieras y estratégicas, priorizando el bien común sobre la ganancia a corto plazo.",
                                "Impulsa iniciativas que aporten valor social (sostenibilidad, diversidad, inclusión) y modela la integridad en todas sus acciones."
                            ]
                        },
                        {
                            name: "Liderazgo de servicio (stewardship)",
                            behaviors: [
                                "Actúa como un administrador (trustee) de los recursos y las personas, priorizando las necesidades de los colaboradores y la comunidad por encima del interés propio.",
                                "Fomenta un clima de seguridad psicológica donde el bienestar emocional y físico del equipo es una prioridad tangible."
                            ]
                        },
                        {
                            name: "Inclusión y equidad",
                            behaviors: [
                                "Promueve activamente la diversidad y crea un entorno inclusivo donde se valoran diferentes perspectivas y antecedentes.",
                                "Trata a todos con justicia e imparcialidad, asegurando equidad en oportunidades y reconocimiento."
                            ]
                        }
                    ]
                },
                {
                    sub: "Legado personal y trascendencia",
                    competences: [
                        {
                            name: "Institucionalización de cultura",
                            behaviors: [
                                "Establece rituales, historias y prácticas que anclan los valores y la visión en el ADN de la organización, asegurando que perduren más allá de su mandato.",
                                "Documenta lecciones aprendidas y crea sistemas para que el conocimiento crítico (know-how) permanezca en la empresa."
                            ]
                        },
                        {
                            name: "Reconocimiento y humildad",
                            behaviors: [
                                "Pone los focos sobre su equipo: cuando hay éxito, se aparta para que su equipo brille (\"stand back\"); cuando hay fracaso, asume la responsabilidad.",
                                "Celebra genuinamente los hitos personales y profesionales de los demás, construyendo una cultura de gratitud y apreciación."
                            ]
                        },
                        {
                            name: "Conexión con el propósito (meaning)",
                            behaviors: [
                                "Ayuda a cada miembro del equipo a descubrir su propio propósito y a conectarlo con la misión de la organización (alineación de propósito).",
                                "Transforma el trabajo rutinario en una misión significativa, recordando constantemente el impacto positivo que el equipo tiene en el mundo."
                            ]
                        }
                    ]
                },
                {
                    sub: "Inteligencia cultural e inclusiva",
                    competences: [
                        {
                            name: "Gestión de la diversidad cognitiva",
                            behaviors: [
                                "Forma deliberadamente equipos con diversidad de pensamiento y antecedentes.",
                                "Detecta y mitiga sesgos inconscientes en la contratación y promoción de talento."
                            ]
                        }
                    ]
                },
                {
                    sub: "Liderazgo regenerativo",
                    competences: [
                        {
                            name: "Conciencia sistémica y comunitaria",
                            behaviors: [
                                "Conecta los objetivos de negocio con necesidades reales de la comunidad o el medio ambiente.",
                                "Actúa como un \"tejedor\" de relaciones externas que traen valor social a la empresa."
                            ]
                        }
                    ]
                }
            ]
        }
    ]

    // B. Seed All Pillars
    let pillarOrder = 0

    for (const pMeta of TAXONOMY_DATA) {
        const pName = pMeta.pillar
        const pId = `p-${toSlug(pName)}`

        // Upsert Pillar
        const pillarRecord = await prisma.taxonomy.upsert({
            where: { id: pId },
            update: { name: pName, order: pillarOrder },
            create: { id: pId, name: pName, type: 'Pillar', order: pillarOrder, active: true }
        })
        pillarOrder++
        console.log(`Pillar: ${pName}`)

        let subOrder = 0
        for (const s of pMeta.subs) {
            const subId = `s-${toSlug(s.sub)}`
            const subRecord = await prisma.taxonomy.upsert({
                where: { id: subId },
                update: { name: s.sub, parentId: pillarRecord.id, order: subOrder },
                create: { id: subId, name: s.sub, type: 'Subcomponent', parentId: pillarRecord.id, order: subOrder, active: true }
            })
            subOrder++
            console.log(` > Sub: ${s.sub}`)

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
                    // Unique Slug for Behavior to prevent collisions if text is same (unlikely but safe)
                    const behSlug = toSlug(b).substring(0, 50) + `-${Math.random().toString(36).substring(7)}`
                    const behId = `b-${behSlug}` // Using random suffix might be bad for determinism, 
                    // but behaviors are long text. 
                    // Let's rely on content hash or index if we want stability. 
                    // For now, let's use a simpler slug + index to try and keep it stable across runs
                    const stableBehSlug = toSlug(b).substring(0, 50)
                    const stableBehId = `b-${stableBehSlug}-${behOrder}`

                    await prisma.taxonomy.upsert({
                        where: { id: stableBehId },
                        update: { name: b, parentId: compRecord.id, order: behOrder },
                        create: { id: stableBehId, name: b, type: 'Behavior', parentId: compRecord.id, order: behOrder, active: true }
                    })
                    behOrder++
                }
            }
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
