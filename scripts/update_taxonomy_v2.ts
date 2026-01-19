
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Provided Taxonomy Data Structure
// Hierachy: Pillar -> Subcomponent -> Competence -> Behavior
const taxonomyData = [
    {
        pillar: "Shine Within",
        subcomponent: "Autoconfianza y autoliderazgo",
        competence: "Autoeficacia y seguridad",
        behaviors: [
            "Afronta desafíos con seguridad en sus capacidades sin caer en la arrogancia, lo que motiva al equipo a perseguir metas exigentes.",
            "Muestra consistencia entre lo que dice y hace, generando credibilidad y confianza en los colaboradores"
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Autoconfianza y autoliderazgo",
        competence: "Gestión de creencias (mindset)",
        behaviors: [
            "Identifica activamente sus creencias limitantes (ej. \"no soy bueno en esto\") y las reescribe hacia un lenguaje transformador y empoderante (ej. \"estoy aprendiendo a dominar esto\").",
            "Sustituye preguntas de víctima (¿Por qué a mí?) por preguntas de protagonista (¿Qué puedo aprender de esto? ¿Cómo puedo aportar valor?)."
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Autoconfianza y autoliderazgo",
        competence: "Responsabilidad radical (accountability)",
        behaviors: [
            "Pasa de poner excusas a tomar decisiones; reconoce que tiene el control de su vida y responsabilidad sobre sus resultados.",
            "No culpa a factores externos; asume la propiedad de sus errores y busca soluciones proactivas."
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Inteligencia emocional y regulación (self-regulation)",
        competence: "Autoconciencia emocional",
        behaviors: [
            "Monitorea sus estados de ánimo en tiempo real y reconoce cómo estos afectan su toma de decisiones y a las personas a su alrededor.",
            "Identifica sus \"detonantes\" emocionales (ej. sentirse cuestionado) antes de que provoquen una reacción impulsiva."
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Inteligencia emocional y regulación (self-regulation)",
        competence: "Regulación emocional",
        behaviors: [
            "Aplica la pausa estratégica (Método STOP: Parar, Pensar, Observar, Proceder) antes de reaccionar ante una crisis.",
            "Utiliza \"anclas de serenidad\" (respiración consciente, objetos físicos o mantras) para volver a su centro en momentos de estrés.",
            "Gestiona la frustración manteniendo la calma, proyectando estabilidad al equipo."
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Inteligencia emocional y regulación (self-regulation)",
        competence: "Gestión de la energía",
        behaviors: [
            "Prioriza su descanso y desconexión para mantener la claridad mental, entendiendo que el agotamiento afecta la calidad de sus decisiones.",
            "Incorpora rutinas de bienestar físico y mental para recargar su \"batería\" de liderazgo."
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Propósito y valores (integridad)",
        competence: "Claridad de propósito (Ikigai)",
        behaviors: [
            "Define y articula un \"para qué\" claro que conecta su trabajo diario con un impacto mayor (ej. \"Estoy aquí para empoderar a otros\").",
            "Utiliza su propósito como filtro para la toma de decisiones difíciles, asegurando que sus acciones honren su intención de vida."
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Propósito y valores (integridad)",
        competence: "Integridad y coherencia",
        behaviors: [
            "Hace lo que dice. Sus acciones privadas y públicas son congruentes con los valores que predica.",
            "Cumple sus promesas y compromisos, generando un entorno de confianza y previsibilidad.",
            "Defiende sus principios éticos incluso bajo presión o ante la posibilidad de ganancias a corto plazo."
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Propósito y valores (integridad)",
        competence: "Autenticidad",
        behaviors: [
            "Se muestra genuino, sin adoptar \"máscaras\" corporativas; tiene la valentía de ser él mismo mientras lidera.",
            "Es transparente sobre sus intenciones y valores, lo que facilita la conexión humana con su equipo."
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Aprendizaje y reflexión (self-awareness)",
        competence: "Práctica reflexiva",
        behaviors: [
            "Dedica tiempo agendado para la auto-observación y el análisis de su desempeño (ej. llevar un diario o bitácora emocional).",
            "Se hace preguntas poderosas sobre su identidad y futuro (¿En quién me quiero convertir? ¿Qué puedo ofrecer?)."
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Aprendizaje y reflexión (self-awareness)",
        competence: "Apertura al feedback",
        behaviors: [
            "Solicita retroalimentación constructiva de pares, superiores y subordinados para identificar puntos ciegos.",
            "Recibe la crítica sin ponerse a la defensiva, utilizándola como insumo para su crecimiento personal."
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Aprendizaje y reflexión (self-awareness)",
        competence: "Mentalidad de crecimiento",
        behaviors: [
            "Ve los errores y fracasos no como definiciones de su valía, sino como oportunidades de aprendizaje y mejora.",
            "Está dispuesto a desaprender hábitos viejos y adquirir nuevas competencias para adaptarse a nuevos desafíos."
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Gestión de energía y bienestar (biohacking)",
        competence: "Regulación somática y fisiológica",
        behaviors: [
            "Aplica técnicas de respiración consciente antes de situaciones de alta presión.",
            "Gestiona sus ritmos circadianos y descanso para asegurar un rendimiento cognitivo óptimo."
        ]
    },
    {
        pillar: "Shine Within",
        subcomponent: "Identidad de liderazgo (identity ownership)",
        competence: "Re-alineación Cognitiva",
        behaviors: [
            "Reescribe narrativas internas de duda (\"ocupo el cargo\") por narrativas de propiedad (\"merezco el cargo\").",
            "Integra sus valores personales con su rol profesional sin sentir que está \"actuando\"."
        ]
    },
    // SHINE OUT
    {
        pillar: "Shine Out",
        subcomponent: "Comunicación poderosa",
        competence: "Claridad e inspiración",
        behaviors: [
            "Expresa objetivos y la visión de futuro de forma clara, evitando la ambigüedad sobre qué se espera y por qué es importante.",
            "Utiliza un tono entusiasta, historias o metáforas para alinear al equipo bajo un propósito común y motivador."
        ]
    },
    {
        pillar: "Shine Out",
        subcomponent: "Comunicación poderosa",
        competence: "Escucha Activa y Empática",
        behaviors: [
            "Presta atención plena (mindfulness) cuando un colaborador habla, parafraseando para confirmar entendimiento y validando las aportaciones.",
            "Se \"pone en los zapatos\" de sus colegas para construir relaciones de confianza y seguridad psicológica."
        ]
    },
    {
        pillar: "Shine Out",
        subcomponent: "Comunicación poderosa",
        competence: "Adaptabilidad Comunicativa",
        behaviors: [
            "\"Lee\" a su audiencia y ajusta su estilo y lenguaje (ej. técnico vs. estratégico) según el interlocutor.",
            "Identifica señales no verbales en los demás y modifica el ritmo o enfoque de su mensaje para mantener la sintonía y asegurar que el mensaje sea aceptado."
        ]
    },
    {
        pillar: "Shine Out",
        subcomponent: "Influencia positiva",
        competence: "Construcción de confianza (Trust)",
        behaviors: [
            "Comparte información relevante de manera oportuna y honesta (transparencia), incluso las malas noticias.",
            "Admite abiertamente cuando \"no sabe\" algo y trata a todos con respeto, eliminando el miedo a represalias por reportar problemas."
        ]
    },
    {
        pillar: "Shine Out",
        subcomponent: "Influencia positiva",
        competence: "Influencia ética y persuasión",
        behaviors: [
            "Utiliza la persuasión racional (datos/hechos) y el ejemplo personal (\"walk the talk\") en lugar de la manipulación o la amenaza.",
            "Apela a valores e ideales compartidos para generar una voluntad genuina de colaboración en el equipo."
        ]
    },
    {
        pillar: "Shine Out",
        subcomponent: "Influencia positiva",
        competence: "Reconocimiento y feedback",
        behaviors: [
            "Reconoce públicamente los logros y da crédito explícito a los colaboradores por sus contribuciones, fomentando el orgullo colectivo.",
            "Brinda feedback privado, específico y centrado en la conducta (no en la persona) para corregir el rumbo y desarrollar talento."
        ]
    },
    {
        pillar: "Shine Out",
        subcomponent: "Networking estratégico",
        competence: "Conectividad interna y externa",
        behaviors: [
            "Conecta activamente a su equipo con otras áreas para derribar silos y fomentar la colaboración interdepartamental.",
            "Participa en eventos de la industria y mantiene vínculos con stakeholders externos (clientes, proveedores) para detectar tendencias."
        ]
    },
    {
        pillar: "Shine Out",
        subcomponent: "Networking estratégico",
        competence: "Gestión de relaciones (relationship management)",
        behaviors: [
            "Actúa como un \"tejedor\" de relaciones, facilitando el acceso a recursos y conocimientos críticos para el equipo a través de su red de contactos.",
            "Utiliza su capital social para apoyar a su equipo y abrir puertas a nuevas oportunidades de negocio o desarrollo."
        ]
    },
    {
        pillar: "Shine Out",
        subcomponent: "Networking estratégico",
        competence: "Visibilidad estratégica",
        behaviors: [
            "Se posiciona no solo como experto técnico, sino como un referente que aporta valor en comités y espacios de decisión.",
            "Construye relaciones basadas en la reciprocidad y el valor mutuo, no solo en la necesidad inmediata (transaccional)."
        ]
    },
    {
        pillar: "Shine Out",
        subcomponent: "Presencia digital e híbrida",
        competence: "Influencia asíncrona y virtual",
        behaviors: [
            "Proyecta la misma \"gravitas\" y calidez en videoconferencias que en persona.",
            "Gestiona su reputación y narrativa en plataformas digitales (LinkedIn) de forma estratégica, no solo social."
        ]
    },
    {
        pillar: "Shine Out",
        subcomponent: "Competencia conversacional (ontológica)",
        competence: "Ingeniería del lenguaje (promesas y pedidos)",
        behaviors: [
            "Hace pedidos impecables (con condiciones de satisfacción y tiempos claros) para evitar retrabajos.",
            "Gestiona sus promesas: si no puede cumplir, revoca o renegocia a tiempo, manteniendo la confianza."
        ]
    },
    // SHINE UP
    {
        pillar: "Shine Up",
        subcomponent: "Visión de futuro y estrategia",
        competence: "Pensamiento estratégico",
        behaviors: [
            "Analiza tendencias macroeconómicas, tecnológicas y de la industria para anticipar cómo afectarán el entorno interno y externo de la empresa.",
            "No se limita a \"apagar fuegos\" a corto plazo; dedica tiempo de calidad a la planificación y a las iniciativas de largo alcance."
        ]
    },
    {
        pillar: "Shine Up",
        subcomponent: "Visión de futuro y estrategia",
        competence: "Visión compartida (visioning)",
        behaviors: [
            "Articula un escenario futuro aspiracional de manera vívida (ej. \"ser referentes regionales en 5 años\") logrando que el equipo haga propia esa visión (shared vision).",
            "Comunica el \"por qué\" detrás de las metas, dando un fuerte sentido de finalidad y propósito al trabajo diario."
        ]
    },
    {
        pillar: "Shine Up",
        subcomponent: "Visión de futuro y estrategia",
        competence: "Alineación de metas (execution)",
        behaviors: [
            "Traduce la visión abstracta en objetivos SMART (específicos, medibles, alcanzables, relevantes y temporales) y planes de acción concretos",
            "Asegura la \"línea de vista\": explica claramente cómo las tareas cotidianas y las metas de corto plazo contribuyen a la estrategia general."
        ]
    },
    {
        pillar: "Shine Up",
        subcomponent: "Toma de decisiones y resolución de problemas",
        competence: "Compostura",
        behaviors: [
            "Mantiene la serenidad en situaciones de crisis, proyectando confianza y evitando que el pánico paralice al equipo.",
            "Controla los impulsos y evita reacciones defensivas, permitiendo que otros piensen con claridad y ejecuten tareas críticas."
        ]
    },
    {
        pillar: "Shine Up",
        subcomponent: "Toma de decisiones y resolución de problemas",
        competence: "Decisión bajo incertidumbre",
        behaviors: [
            "Reúne datos rápidamente y consulta expertos, pero toma decisiones oportunas incluso con información incompleta, evitando la \"parálisis por análisis\".",
            "Asume la responsabilidad de las consecuencias de sus decisiones, sean aciertos o errores, sin buscar culpables externos"
        ]
    },
    {
        pillar: "Shine Up",
        subcomponent: "Toma de decisiones y resolución de problemas",
        competence: "Resolución de causa raíz",
        behaviors: [
            "No se queda en la corrección de síntomas superficiales; investiga a fondo para identificar y resolver la causa raíz de los problemas basándose en evidencias y datos.",
            "Aplica el pensamiento crítico para cuestionar suposiciones y reducir sesgos antes de decidir"
        ]
    },
    {
        pillar: "Shine Up",
        subcomponent: "Adaptabilidad e innovación",
        competence: "Agilidad y adaptabilidad",
        behaviors: [
            "Revisa y ajusta las estrategias establecidas si surgen cambios tecnológicos o regulatorios, demostrando disposición a abandonar ideas que ya no funcionan.",
            "Fomenta una cultura donde el cambio se ve como oportunidad y no como amenaza."
        ]
    },
    {
        pillar: "Shine Up",
        subcomponent: "Adaptabilidad e innovación",
        competence: "Estimulación intelectual (innovación)",
        behaviors: [
            "Cuestiona el \"así es como siempre se ha hecho\", desafiando el statu quo y animando al equipo a proponer nuevas formas de trabajar.",
            "Instituye proyectos piloto o pruebas de concepto para testear soluciones en entornos controlados antes de escalarlas."
        ]
    },
    {
        pillar: "Shine Up",
        subcomponent: "Adaptabilidad e innovación",
        competence: "Gestión del error constructivo",
        behaviors: [
            "Respalda al equipo cuando un experimento bien intencionado falla, enfocándose en extraer aprendizajes (\"fail forward\") en lugar de castigar el error.",
            "Elimina el \"factor miedo\", empoderando a los empleados para asumir riesgos calculados en la búsqueda de innovación."
        ]
    },
    {
        pillar: "Shine Up",
        subcomponent: "Inteligencia política y contextual",
        competence: "Lectura de poder y patrocinio",
        behaviors: [
            "Identifica y cultiva activamente sponsors que hablen de él/ella en mesas de decisión.",
            "Mapea las dinámicas de poder informales en la organización para destrabar proyectos."
        ]
    },
    {
        pillar: "Shine Up",
        subcomponent: "Agilidad tecnológica (tech-savviness)",
        competence: "Liderazgo en la industria 5.0",
        behaviors: [
            "Promueve la adopción de nuevas herramientas digitales sin perder el enfoque en el bienestar del equipo.",
            "Traduce conceptos tecnológicos complejos a decisiones de negocio estratégicas."
        ]
    },
    // SHINE BEYOND
    {
        pillar: "Shine Beyond",
        subcomponent: "Desarrollo de otros líderes (mentoring & coaching)",
        competence: "Mentoría y sucesión",
        behaviors: [
            "Identifica activamente el talento interno y dedica tiempo a formar a sus sucesores para garantizar la continuidad del liderazgo (construcción de pipeline).",
            "Comparte conocimientos y experiencias sin reservas, actuando como guía para acelerar el aprendizaje de líderes emergentes."
        ]
    },
    {
        pillar: "Shine Beyond",
        subcomponent: "Desarrollo de otros líderes (mentoring & coaching)",
        competence: "Empoderamiento (empowerment)",
        behaviors: [
            "Comparte el poder delegando autoridad real para la toma de decisiones importantes, no solo tareas operativas, fomentando la autonomía.",
            "Elimina el micro-management; define el \"qué\" pero permite al equipo decidir el \"cómo\", demostrando confianza plena en sus capacidades."
        ]
    },
    {
        pillar: "Shine Beyond",
        subcomponent: "Desarrollo de otros líderes (mentoring & coaching)",
        competence: "Desafío para el crecimiento",
        behaviors: [
            "Asigna proyectos desafiantes (stretch assignments) que obligan a los colaboradores a salir de su zona de confort para desarrollar nuevas habilidades.",
            "Utiliza el coaching para ayudar a los colaboradores a encontrar sus propias soluciones en lugar de dárselas resueltas."
        ]
    },
    {
        pillar: "Shine Beyond",
        subcomponent: "Impacto social y humano",
        competence: "Ética y responsabilidad social",
        behaviors: [
            "Integra consideraciones éticas y de impacto comunitario en la toma de decisiones financieras y estratégicas, priorizando el bien común sobre la ganancia a corto plazo.",
            "Impulsa iniciativas que aporten valor social (sostenibilidad, diversidad, inclusión) y modela la integridad en todas sus acciones."
        ]
    },
    {
        pillar: "Shine Beyond",
        subcomponent: "Impacto social y humano",
        competence: "Liderazgo de servicio (stewardship)",
        behaviors: [
            "Actúa como un administrador (trustee) de los recursos y las personas, priorizando las necesidades de los colaboradores y la comunidad por encima del interés propio.",
            "Fomenta un clima de seguridad psicológica donde el bienestar emocional y físico del equipo es una prioridad tangible."
        ]
    },
    {
        pillar: "Shine Beyond",
        subcomponent: "Impacto social y humano",
        competence: "Inclusión y equidad",
        behaviors: [
            "Promueve activamente la diversidad y crea un entorno inclusivo donde se valoran diferentes perspectivas y antecedentes.",
            "Trata a todos con justicia e imparcialidad, asegurando equidad en oportunidades y reconocimiento."
        ]
    },
    {
        pillar: "Shine Beyond",
        subcomponent: "Legado personal y trascendencia",
        competence: "Institucionalización de cultura",
        behaviors: [
            "Establece rituales, historias y prácticas que anclan los valores y la visión en el ADN de la organización, asegurando que perduren más allá de su mandato.",
            "Documenta lecciones aprendidas y crea sistemas para que el conocimiento crítico (know-how) permanezca en la empresa."
        ]
    },
    {
        pillar: "Shine Beyond",
        subcomponent: "Legado personal y trascendencia",
        competence: "Reconocimiento y humildad",
        behaviors: [
            "Pone los focos sobre su equipo: cuando hay éxito, se aparta para que su equipo brille (\"stand back\"); cuando hay fracaso, asume la responsabilidad.",
            "Celebra genuinamente los hitos personales y profesionales de los demás, construyendo una cultura de gratitud y apreciación."
        ]
    },
    {
        pillar: "Shine Beyond",
        subcomponent: "Legado personal y trascendencia",
        competence: "Conexión con el propósito (meaning)",
        behaviors: [
            "Ayuda a cada miembro del equipo a descubrir su propio propósito y a conectarlo con la misión de la organización (alineación de propósito).",
            "Transforma el trabajo rutinario en una misión significativa, recordando constantemente el impacto positivo que el equipo tiene en el mundo."
        ]
    },
    {
        pillar: "Shine Beyond",
        subcomponent: "Inteligencia cultural e inclusiva",
        competence: "Gestión de la diversidad cognitiva",
        behaviors: [
            "Forma deliberadamente equipos con diversidad de pensamiento y antecedentes.",
            "Detecta y mitiga sesgos inconscientes en la contratación y promoción de talento."
        ]
    },
    {
        pillar: "Shine Beyond",
        subcomponent: "Liderazgo regenerativo",
        competence: "Conciencia sistémica y comunitaria",
        behaviors: [
            "Conecta los objetivos de negocio con necesidades reales de la comunidad o el medio ambiente.",
            "Actúa como un \"tejedor\" de relaciones externas que traen valor social a la empresa."
        ]
    },
]

async function main() {
    console.log('Seeding Taxonomy Defaults...')

    // Helper to slugify for ID
    const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    let orderPillar = 0
    let processedPillars = new Set()

    for (const item of taxonomyData) {
        if (!processedPillars.has(item.pillar)) {
            processedPillars.add(item.pillar)
            orderPillar++
        }

        // 1. Pillar
        const pillarId = `p-${slugify(item.pillar)}`
        const pillarData = await prisma.taxonomy.upsert({
            where: { id: pillarId },
            update: { name: item.pillar, active: true },
            create: {
                id: pillarId,
                name: item.pillar,
                type: 'Pillar',
                active: true,
                order: orderPillar
            }
        })

        // 2. Subcomponent
        const subId = `s-${slugify(item.subcomponent)}`
        const subData = await prisma.taxonomy.upsert({
            where: { id: subId },
            update: { name: item.subcomponent, parentId: pillarData.id, active: true },
            create: {
                id: subId,
                name: item.subcomponent,
                type: 'Subcomponent',
                parentId: pillarData.id,
                active: true,
                order: 0 // Ideally this should be calculated per parent
            }
        })

        // 3. Competence
        // Need unique ID. Combinations of Sub+Comp name
        const compId = `c-${slugify(item.subcomponent + '-' + item.competence)}`
        const compData = await prisma.taxonomy.upsert({
            where: { id: compId },
            update: { name: item.competence, parentId: subData.id, active: true },
            create: {
                id: compId,
                name: item.competence,
                type: 'Competence',
                parentId: subData.id,
                active: true,
                order: 0
            }
        })

        // 4. Behaviors
        // Behaviors are multiple per competence. Upserting them might be tricky if we don't have stable IDs.
        // We will use a hash or slug of content.
        let behaviorOrder = 0
        for (const b of item.behaviors) {
            behaviorOrder++
            // Truncating slug to avoid massive IDs
            const bSlug = slugify(b).substring(0, 50)
            // Adding random suffix or compId ref to ensure uniqueness if text repeats across areas (unlikely but safe)
            const behaviorId = `b-${slugify(item.competence).substring(0, 10)}-${bSlug}`

            await prisma.taxonomy.upsert({
                where: { id: behaviorId },
                update: { name: b, parentId: compData.id, active: true, order: behaviorOrder },
                create: {
                    id: behaviorId,
                    name: b,
                    type: 'Behavior',
                    parentId: compData.id,
                    active: true,
                    order: behaviorOrder
                }
            })
        }
    }

    console.log('Taxonomy update complete.')
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
