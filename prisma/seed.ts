
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DATA SOURCE: Exclusive Taxonomy provided by User
const rawTaxonomy = [
    {
        "pilar": "Shine In",
        "subcomponentes": [
            {
                "nombre": "Autoconfianza y autoliderazgo",
                "competencias": [
                    {
                        "nombre": "Autoeficacia y seguridad",
                        "conductas": [
                            "Afronta desafíos con seguridad en sus capacidades sin caer en la arrogancia, lo que motiva al equipo a perseguir metas exigentes.",
                            "Muestra consistencia entre lo que dice y hace, generando credibilidad y confianza en los colaboradores"
                        ]
                    },
                    {
                        "nombre": "Gestión de creencias (mindset)",
                        "conductas": [
                            "Identifica activamente sus creencias limitantes (ej. \"no soy bueno en esto\") y las reescribe hacia un lenguaje transformador y empoderante (ej. \"estoy aprendiendo a dominar esto\").",
                            "Sustituye preguntas de víctima (¿Por qué a mí?) por preguntas de protagonista (¿Qué puedo aprender de esto? ¿Cómo puedo aportar valor?)."
                        ]
                    },
                    {
                        "nombre": "Responsabilidad radical (accountability)",
                        "conductas": [
                            "Pasa de poner excusas a tomar decisiones; reconoce que tiene el control de su vida y responsabilidad sobre sus resultados.",
                            "No culpa a factores externos; asume la propiedad de sus errores y busca soluciones proactivas."
                        ]
                    }
                ]
            },
            {
                "nombre": "Inteligencia emocional y regulación (self-regulation)",
                "competencias": [
                    {
                        "nombre": "Autoconciencia emocional",
                        "conductas": [
                            "Monitorea sus estados de ánimo en tiempo real y reconoce cómo estos afectan su toma de decisiones y a las personas a su alrededor.",
                            "Identifica sus \"detonantes\" emocionales (ej. sentirse cuestionado) antes de que provoquen una reacción impulsiva."
                        ]
                    },
                    {
                        "nombre": "Regulación emocional",
                        "conductas": [
                            "Aplica la pausa estratégica (Método STOP: Parar, Pensar, Observar, Proceder) antes de reaccionar ante una crisis.",
                            "Utiliza \"anclas de serenidad\" (respiración consciente, objetos físicos o mantras) para volver a su centro en momentos de estrés.",
                            "Gestiona la frustración manteniendo la calma, proyectando estabilidad al equipo."
                        ]
                    },
                    {
                        "nombre": "Gestión de la energía",
                        "conductas": [
                            "Prioriza su descanso y desconexión para mantener la claridad mental, entendiendo que el agotamiento afecta la calidad de sus decisiones.",
                            "Incorpora rutinas de bienestar físico y mental para recargar su \"batería\" de liderazgo."
                        ]
                    }
                ]
            },
            {
                "nombre": "Propósito y valores (integridad)",
                "competencias": [
                    {
                        "nombre": "Claridad de propósito (Ikigai)",
                        "conductas": [
                            "Define y articula un \"para qué\" claro que conecta su trabajo diario con un impacto mayor (ej. \"Estoy aquí para empoderar a otros\").",
                            "Utiliza su propósito como filtro para la toma de decisiones difíciles, asegurando que sus acciones honren su intención de vida."
                        ]
                    },
                    {
                        "nombre": "Integridad y coherencia",
                        "conductas": [
                            "Hace lo que dice. Sus acciones privadas y públicas son congruentes con los valores que predica.",
                            "Cumple sus promesas y compromisos, generando un entorno de confianza y previsibilidad.",
                            "Defiende sus principios éticos incluso bajo presión o ante la posibilidad de ganancias a corto plazo."
                        ]
                    },
                    {
                        "nombre": "Autenticidad",
                        "conductas": [
                            "Se muestra genuino, sin adoptar \"máscaras\" corporativas; tiene la valentía de ser él mismo mientras lidera.",
                            "Es transparente sobre sus intenciones y valores, lo que facilita la conexión humana con su equipo."
                        ]
                    }
                ]
            },
            {
                "nombre": "Aprendizaje y reflexión (self-awareness)",
                "competencias": [
                    {
                        "nombre": "Práctica reflexiva",
                        "conductas": [
                            "Dedica tiempo agendado para la auto-observación y el análisis de su desempeño (ej. llevar un diario o bitácora emocional).",
                            "Se hace preguntas poderosas sobre su identidad y futuro (¿En quién me quiero convertir? ¿Qué puedo ofrecer?)."
                        ]
                    },
                    {
                        "nombre": "Apertura al feedback",
                        "conductas": [
                            "Solicita retroalimentación constructiva de pares, superiores y subordinados para identificar puntos ciegos.",
                            "Recibe la crítica sin ponerse a la defensiva, utilizándola como insumo para su crecimiento personal."
                        ]
                    },
                    {
                        "nombre": "Mentalidad de crecimiento",
                        "conductas": [
                            "Ve los errores y fracasos no como definiciones de su valía, sino como oportunidades de aprendizaje y mejora.",
                            "Está dispuesto a desaprender hábitos viejos y adquirir nuevas competencias para adaptarse a nuevos desafíos."
                        ]
                    }
                ]
            },
            {
                "nombre": "Gestión de energía y bienestar (biohacking)",
                "competencias": [
                    {
                        "nombre": "Regulación somática y fisiológica",
                        "conductas": [
                            "Aplica técnicas de respiración consciente antes de situaciones de alta presión.",
                            "Gestiona sus ritmos circadianos y descanso para asegurar un rendimiento cognitivo óptimo."
                        ]
                    }
                ]
            },
            {
                "nombre": "Identidad de liderazgo (identity ownership)",
                "competencias": [
                    {
                        "nombre": "Re-alineación Cognitiva",
                        "conductas": [
                            "Reescribe narrativas internas de duda (\"ocupo el cargo\") por narrativas de propiedad (\"merezco el cargo\").",
                            "Integra sus valores personales con su rol profesional sin sentir que está \"actuando\"."
                        ]
                    }
                ]
            }
        ]
    },
    {
        "pilar": "Shine Out",
        "subcomponentes": [
            {
                "nombre": "Comunicación poderosa",
                "competencias": [
                    {
                        "nombre": "Claridad e inspiración",
                        "conductas": [
                            "Expresa objetivos y la visión de futuro de forma clara, evitando la ambigüedad sobre qué se espera y por qué es importante.",
                            "Utiliza un tono entusiasta, historias o metáforas para alinear al equipo bajo un propósito común y motivador."
                        ]
                    },
                    {
                        "nombre": "Escucha Activa y Empática",
                        "conductas": [
                            "Presta atención plena (mindfulness) cuando un colaborador habla, parafraseando para confirmar entendimiento y validando las aportaciones.",
                            "Se \"pone en los zapatos\" de sus colegas para construir relaciones de confianza y seguridad psicológica."
                        ]
                    },
                    {
                        "nombre": "Adaptabilidad Comunicativa",
                        "conductas": [
                            "\"Lee\" a su audiencia y ajusta su estilo y lenguaje (ej. técnico vs. estratégico) según el interlocutor.",
                            "Identifica señales no verbales en los demás y modifica el ritmo o enfoque de su mensaje para mantener la sintonía y asegurar que el mensaje sea aceptado."
                        ]
                    }
                ]
            },
            {
                "nombre": "Influencia positiva",
                "competencias": [
                    {
                        "nombre": "Construcción de confianza (Trust)",
                        "conductas": [
                            "Comparte información relevante de manera oportuna y honesta (transparencia), incluso las malas noticias.",
                            "Admite abiertamente cuando \"no sabe\" algo y trata a todos con respeto, eliminando el miedo a represalias por reportar problemas."
                        ]
                    },
                    {
                        "nombre": "Influencia ética y persuasión",
                        "conductas": [
                            "Utiliza la persuasión racional (datos/hechos) y el ejemplo personal (\"walk the talk\") en lugar de la manipulación o la amenaza.",
                            "Apela a valores e ideales compartidos para generar una voluntad genuina de colaboración en el equipo."
                        ]
                    },
                    {
                        "nombre": "Reconocimiento y feedback",
                        "conductas": [
                            "Reconoce públicamente los logros y da crédito explícito a los colaboradores por sus contribuciones, fomentando el orgullo colectivo.",
                            "Brinda feedback privado, específico y centrado en la conducta (no en la persona) para corregir el rumbo y desarrollar talento."
                        ]
                    }
                ]
            },
            {
                "nombre": "Networking estratégico",
                "competencias": [
                    {
                        "nombre": "Conectividad interna y externa",
                        "conductas": [
                            "Conecta activamente a su equipo con otras áreas para derribar silos y fomentar la colaboración interdepartamental.",
                            "Participa en eventos de la industria y mantiene vínculos con stakeholders externos (clientes, proveedores) para detectar tendencias."
                        ]
                    },
                    {
                        "nombre": "Gestión de relaciones (relationship management)",
                        "conductas": [
                            "Actúa como un \"tejedor\" de relaciones, facilitando el acceso a recursos y conocimientos críticos para el equipo a través de su red de contactos.",
                            "Utiliza su capital social para apoyar a su equipo y abrir puertas a nuevas oportunidades de negocio o desarrollo."
                        ]
                    },
                    {
                        "nombre": "Visibilidad estratégica",
                        "conductas": [
                            "Se posiciona no solo como experto técnico, sino como un referente que aporta valor en comités y espacios de decisión.",
                            "Construye relaciones basadas en la reciprocidad y el valor mutuo, no solo en la necesidad inmediata (transaccional)."
                        ]
                    }
                ]
            },
            {
                "nombre": "Presencia digital e híbrida",
                "competencias": [
                    {
                        "nombre": "Influencia asíncrona y virtual",
                        "conductas": [
                            "Proyecta la misma \"gravitas\" y calidez en videoconferencias que en persona.",
                            "Gestiona su reputación y narrativa en plataformas digitales (LinkedIn) de forma estratégica, no solo social."
                        ]
                    }
                ]
            },
            {
                "nombre": "Competencia conversacional (ontológica)",
                "competencias": [
                    {
                        "nombre": "Ingeniería del lenguaje (promesas y pedidos)",
                        "conductas": [
                            "Hace pedidos impecables (con condiciones de satisfacción y tiempos claros) para evitar retrabajos.",
                            "Gestiona sus promesas: si no puede cumplir, revoca o renegocia a tiempo, manteniendo la confianza."
                        ]
                    }
                ]
            }
        ]
    },
    {
        "pilar": "Shine Up",
        "subcomponentes": [
            {
                "nombre": "Visión de futuro y estrategia",
                "competencias": [
                    {
                        "nombre": "Pensamiento estratégico",
                        "conductas": [
                            "Analiza tendencias macroeconómicas, tecnológicas y de la industria para anticipar cómo afectarán el entorno interno y externo de la empresa.",
                            "No se limita a \"apagar fuegos\" a corto plazo; dedica tiempo de calidad a la planificación y a las iniciativas de largo alcance."
                        ]
                    },
                    {
                        "nombre": "Visión compartida (visioning)",
                        "conductas": [
                            "Articula un escenario futuro aspiracional de manera vívida (ej. \"ser referentes regionales en 5 años\") logrando que el equipo haga propia esa visión (shared vision).",
                            "Comunica el \"por qué\" detrás de las metas, dando un fuerte sentido de finalidad y propósito al trabajo diario."
                        ]
                    },
                    {
                        "nombre": "Alineación de metas (execution)",
                        "conductas": [
                            "Traduce la visión abstracta en objetivos SMART (específicos, medibles, alcanzables, relevantes y temporales) y planes de acción concretos",
                            "Asegura la \"línea de vista\": explica claramente cómo las tareas cotidianas y las metas de corto plazo contribuyen a la estrategia general."
                        ]
                    }
                ]
            },
            {
                "nombre": "Toma de decisiones y resolución de problemas",
                "competencias": [
                    {
                        "nombre": "Compostura",
                        "conductas": [
                            "Mantiene la serenidad en situaciones de crisis, proyectando confianza y evitando que el pánico paralice al equipo.",
                            "Controla los impulsos y evita reacciones defensivas, permitiendo que otros piensen con claridad y ejecuten tareas críticas."
                        ]
                    },
                    {
                        "nombre": "Decisión bajo incertidumbre",
                        "conductas": [
                            "Reúne datos rápidamente y consulta expertos, pero toma decisiones oportunas incluso con información incompleta, evitando la \"parálisis por análisis\".",
                            "Asume la responsabilidad de las consecuencias de sus decisiones, sean aciertos o errores, sin buscar culpables externos"
                        ]
                    },
                    {
                        "nombre": "Resolución de causa raíz",
                        "conductas": [
                            "No se queda en la corrección de síntomas superficiales; investiga a fondo para identificar y resolver la causa raíz de los problemas basándose en evidencias y datos.",
                            "Aplica el pensamiento crítico para cuestionar suposiciones y reducir sesgos antes de decidir"
                        ]
                    }
                ]
            },
            {
                "nombre": "Adaptabilidad e innovación",
                "competencias": [
                    {
                        "nombre": "Agilidad y adaptabilidad",
                        "conductas": [
                            "Revisa y ajusta las estrategias establecidas si surgen cambios tecnológicos o regulatorios, demostrando disposición a abandonar ideas que ya no funcionan.",
                            "Fomenta una cultura donde el cambio se ve como oportunidad y no como amenaza."
                        ]
                    },
                    {
                        "nombre": "Estimulación intelectual (innovación)",
                        "conductas": [
                            "Cuestiona el \"así es como siempre se ha hecho\", desafiando el statu quo y animando al equipo a proponer nuevas formas de trabajar.",
                            "Instituye proyectos piloto o pruebas de concepto para testear soluciones en entornos controlados antes de escalarlas."
                        ]
                    },
                    {
                        "nombre": "Gestión del error constructivo",
                        "conductas": [
                            "Respalda al equipo cuando un experimento bien intencionado falla, enfocándose en extraer aprendizajes (\"fail forward\") en lugar de castigar el error.",
                            "Elimina el \"factor miedo\", empoderando a los empleados para asumir riesgos calculados en la búsqueda de innovación."
                        ]
                    }
                ]
            },
            {
                "nombre": "Inteligencia política y contextual",
                "competencias": [
                    {
                        "nombre": "Lectura de poder y patrocinio",
                        "conductas": [
                            "Identifica y cultiva activamente sponsors que hablen de él/ella en mesas de decisión.",
                            "Mapea las dinámicas de poder informales en la organización para destrabar proyectos."
                        ]
                    }
                ]
            },
            {
                "nombre": "Agilidad tecnológica (tech-savviness)",
                "competencias": [
                    {
                        "nombre": "Liderazgo en la industria 5.0",
                        "conductas": [
                            "Promueve la adopción de nuevas herramientas digitales sin perder el enfoque en el bienestar del equipo.",
                            "Traduce conceptos tecnológicos complejos a decisiones de negocio estratégicas."
                        ]
                    }
                ]
            }
        ]
    },
    {
        "pilar": "Shine Beyond",
        "subcomponentes": [
            {
                "nombre": "Desarrollo de otros líderes (mentoring & coaching)",
                "competencias": [
                    {
                        "nombre": "Mentoría y sucesión",
                        "conductas": [
                            "Identifica activamente el talento interno y dedica tiempo a formar a sus sucesores para garantizar la continuidad del liderazgo (construcción de pipeline).",
                            "Comparte conocimientos y experiencias sin reservas, actuando como guía para acelerar el aprendizaje de líderes emergentes."
                        ]
                    },
                    {
                        "nombre": "Empoderamiento (empowerment)",
                        "conductas": [
                            "Comparte el poder delegando autoridad real para la toma de decisiones importantes, no solo tareas operativas, fomentando la autonomía.",
                            "Elimina el micro-management; define el \"qué\" pero permite al equipo decidir el \"cómo\", demostrando confianza plena en sus capacidades."
                        ]
                    },
                    {
                        "nombre": "Desafío para el crecimiento",
                        "conductas": [
                            "Asigna proyectos desafiantes (stretch assignments) que obligan a los colaboradores a salir de su zona de confort para desarrollar nuevas habilidades.",
                            "Utiliza el coaching para ayudar a los colaboradores a encontrar sus propias soluciones en lugar de dárselas resueltas."
                        ]
                    }
                ]
            },
            {
                "nombre": "Impacto social y humano",
                "competencias": [
                    {
                        "nombre": "Ética y responsabilidad social",
                        "conductas": [
                            "Integra consideraciones éticas y de impacto comunitario en la toma de decisiones financieras y estratégicas, priorizando el bien común sobre la ganancia a corto plazo.",
                            "Impulsa iniciativas que aporten valor social (sostenibilidad, diversidad, inclusión) y modela la integridad en todas sus acciones."
                        ]
                    },
                    {
                        "nombre": "Liderazgo de servicio (stewardship)",
                        "conductas": [
                            "Actúa como un administrador (trustee) de los recursos y las personas, priorizando las necesidades de los colaboradores y la comunidad por encima del interés propio.",
                            "Fomenta un clima de seguridad psicológica donde el bienestar emocional y físico del equipo es una prioridad tangible."
                        ]
                    },
                    {
                        "nombre": "Inclusión y equidad",
                        "conductas": [
                            "Promueve activamente la diversidad y crea un entorno inclusivo donde se valoran diferentes perspectivas y antecedentes.",
                            "Trata a todos con justicia e imparcialidad, asegurando equidad en oportunidades y reconocimiento."
                        ]
                    }
                ]
            },
            {
                "nombre": "Legado personal y trascendencia",
                "competencias": [
                    {
                        "nombre": "Institucionalización de cultura",
                        "conductas": [
                            "Establece rituales, historias y prácticas que anclan los valores y la visión en el ADN de la organización, asegurando que perduren más allá de su mandato.",
                            "Documenta lecciones aprendidas y crea sistemas para que el conocimiento crítico (know-how) permanezca en la empresa."
                        ]
                    },
                    {
                        "nombre": "Reconocimiento y humildad",
                        "conductas": [
                            "Pone los focos sobre su equipo: cuando hay éxito, se aparta para que su equipo brille (\"stand back\"); cuando hay fracaso, asume la responsabilidad.",
                            "Celebra genuinamente los hitos personales y profesionales de los demás, construyendo una cultura de gratitud y apreciación."
                        ]
                    },
                    {
                        "nombre": "Conexión con el propósito (meaning)",
                        "conductas": [
                            "Ayuda a cada miembro del equipo a descubrir su propio propósito y a conectarlo con la misión de la organización (alineación de propósito).",
                            "Transforma el trabajo rutinario en una misión significativa, recordando constantemente el impacto positivo que el equipo tiene en el mundo."
                        ]
                    }
                ]
            },
            {
                "nombre": "Inteligencia cultural e inclusiva",
                "competencias": [
                    {
                        "nombre": "Gestión de la diversidad cognitiva",
                        "conductas": [
                            "Forma deliberadamente equipos con diversidad de pensamiento y antecedentes.",
                            "Detecta y mitiga sesgos inconscientes en la contratación y promoción de talento."
                        ]
                    }
                ]
            },
            {
                "nombre": "Liderazgo regenerativo",
                "competencias": [
                    {
                        "nombre": "Conciencia sistémica y comunitaria",
                        "conductas": [
                            "Conecta los objetivos de negocio con necesidades reales de la comunidad o el medio ambiente.",
                            "Actúa como un \"tejedor\" de relaciones externas que traen valor social a la empresa."
                        ]
                    }
                ]
            }
        ]
    }
];

async function main() {
    console.log('🌱 Starting Strict Exclusive Taxomomy Seed...')

    // 1. WIPE existing taxonomy to ensure exclusivity
    // We cannot use deleteMany({}) on Taxonomy directly if there are self-relations without cascade, 
    // but Prisma typically handles this via relations if configured, or we delete in order: Behavior -> Comp -> Sub -> Pillar

    // Actually, deleteMany does not cascade delete children automatically unless schema says so.
    // Safest is to delete from bottom up.
    console.log('🔥 Wiping existing Taxonomy...')

    // Level 4: Behaviors
    await prisma.taxonomy.deleteMany({ where: { type: 'Behavior' } })
    // Level 3: Competences
    await prisma.taxonomy.deleteMany({ where: { type: 'Competence' } })
    // Level 2: Subcomponents
    await prisma.taxonomy.deleteMany({ where: { type: 'Subcomponent' } })
    // Level 1: Pillars
    await prisma.taxonomy.deleteMany({ where: { type: 'Pillar' } })

    console.log('✅ Taxonomy Table Cleared.')

    // 2. SEED strictly from JSON
    for (const p of rawTaxonomy) {
        console.log(`Creating Pillar: ${p.pilar}`)
        const pillarNode = await prisma.taxonomy.create({
            data: {
                name: p.pilar,
                type: 'Pillar',
                active: true
            }
        })

        if (p.subcomponentes) {
            for (const s of p.subcomponentes) {
                // console.log(`  > Sub: ${s.nombre}`)
                const subNode = await prisma.taxonomy.create({
                    data: {
                        name: s.nombre,
                        type: 'Subcomponent',
                        parentId: pillarNode.id,
                        active: true
                    }
                })

                if (s.competencias) {
                    for (const c of s.competencias) {
                        // console.log(`    * Comp: ${c.nombre}`)
                        const compNode = await prisma.taxonomy.create({
                            data: {
                                name: c.nombre,
                                type: 'Competence',
                                parentId: subNode.id,
                                active: true
                            }
                        })

                        if (c.conductas) {
                            let order = 0
                            for (const conductText of c.conductas) {
                                // Generate a stable-ish ID or slug? Not strictly needed for seed, but good practice. 
                                // We'll just create.
                                order++
                                await prisma.taxonomy.create({
                                    data: {
                                        name: conductText, // The full text of the behavior
                                        type: 'Behavior',
                                        parentId: compNode.id,
                                        active: true,
                                        order: order
                                    }
                                })
                            }
                        }
                    }
                }
            }
        }
    }

    // Seed other defaults if needed (like Methodology or admin user) - reusing from previous seed if present
    // But USER asked for *exclusive* taxonomy. We will assume this only applies to the Taxonomy table structure. 
    // Methodologies and Users are different tables.

    // Re-enable Methodology if needed.
    const methodology = await prisma.methodology.upsert({
        where: { version: 'v1.0' },
        update: {},
        create: {
            version: 'v1.0',
            status: 'Borrador'
        }
    })
    console.log('Created Methodology:', methodology)

    // Re-enable Admin User
    const adminEmail = 'admin@4shine.com'
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'Admin User',
            role: 'ADMIN',
            // passwordHash removed as it does not exist in schema
        }
    })
    console.log('Admin user seeded.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
