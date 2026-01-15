import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper to generate IDs manually or let CUId do it, but to ensure idempotency we'll use deterministic IDs or upsert by title
const records = [
    {
        title: "1. Liderazgo y Carácter del Líder (Crossan et al., 2017)",
        apa: "Crossan, M., Seijts, G., & Gandz, J. (2017). Toward a Framework of Leader Character in Organizations. Journal of Management Studies, 54(7), 986-1008.",
        url: "Disponible en ResearchGate",
        summary: "Artículo seminal que propone un marco conceptual integral sobre el carácter del líder (11 dimensiones lideradas por el Juicio).",
        concepts: "Carácter del líder, Virtudes, Juicio (prudence), Competencias, Liderazgo efectivo",
        findings: "El carácter es esencial y complementario a las competencias. Se identificó el Juicio como la dimensión central que orquesta a las demás.",
        methods: "Estudio multimétodo: grupos focales + encuestas 360° a casi 2000 ejecutivos."
    },
    {
        title: "2. Entrelazamiento Carácter-Competencia (Sturm, Vera & Crossan, 2017)",
        apa: "Sturm, R. E., Vera, D., & Crossan, M. (2017). The entanglement of leader character and leader competence and its impact on performance. The Leadership Quarterly, 28(3), 349-366.",
        url: "Repositorio Wright State University",
        summary: "Estudio conceptual sobre el 'entrelazamiento' profundo entre carácter y competencia para un desempeño extraordinario sostenido.",
        concepts: "Entrelazamiento carácter-competencia, Learning-by-living, Desempeño extraordinario",
        findings: "Alto entrelazamiento genera performance superior largo plazo. Requiere aprendizaje por experiencia (vivencial).",
        methods: "Teórico-conceptual / Revisión interdisciplinaria."
    },
    {
        title: "3. Carácter del Líder y Resultados en Colaboradores (Monzani et al., 2021)",
        apa: "Monzani, L., Seijts, G. H., & Crossan, M. m. (2021). Character matters: The network structure of leader character and its relation to follower positive outcomes. PLoS ONE, 16(9), e0255940.",
        url: "PubMed Central (Open Access)",
        summary: "Estudio cuantitativo de redes que muestra cómo el Juicio y el Ímpetu (Drive) conectan el carácter del líder con el bienestar de los seguidores.",
        concepts: "Network structure, Juicio (prudence), Ímpetu (drive), Resultados positivos del seguidor",
        findings: "Juicio es central. Juicio y Drive son los puentes clave para impactar el engagement y bienestar del equipo.",
        methods: "Cuantitativo: Análisis de Redes y CFA en 188 díadas líder-colaborador."
    },
    {
        title: "4. Revisión Sistemática sobre Personal Branding (Gorbatov, Khapova & Lysova, 2018)",
        apa: "Gorbatov, S., Khapova, S. N., & Lysova, E. I. (2018). Personal branding: Interdisciplinary systematic review and research agenda. Frontiers in Psychology, 9, 2238.",
        url: "Frontiers in Psychology (Open Access)",
        summary: "Revisión sistemática que integra definiciones y propone un modelo de inputs-procesos-resultados del personal branding.",
        concepts: "Marca personal, Personal branding, Nomología de marca, Modelo integrador",
        findings: "Definición integradora: proceso estratégico de gestión de impresiones basado en identidad única que aporta valor.",
        methods: "Revisión sistemática de >100 fuentes académicas."
    },
    {
        title: "5. Marca Personal de Líderes en Redes (Venciūtė, Yue & Thelen, 2023)",
        apa: "Venciūtė, D., Yue, C. A., & Thelen, P. D. (2023). Leaders’ personal branding and communication on professional social media platforms. Journal of Brand Management, 30(1), 43-65.",
        url: "Resumen en Ideas/RePEc",
        summary: "Estudio cualitativo sobre cómo ejecutivos usan LinkedIn para beneficios personales y corporativos (reputación, talento).",
        concepts: "Marca personal ejecutiva, Presencia estratégica en redes, Motivaciones duales",
        findings: "Lideres motivados por legado y beneficio empresa. La autenticidad y visibilidad estratégica refuerzan la confianza.",
        methods: "Cualitativo: 25 entrevistas en profundidad a líderes senior."
    },
    {
        title: "6. Branding Personal del Dueño y Reputación (Situmorang & Salamah, 2018)",
        apa: "Situmorang, F. A. R., & Salamah, U. (2018). Analysis of personal branding and leadership branding company owner and company reputation. Jurnal InterAct, 7(2), 1-5.",
        url: "Repositorio Atma Jaya",
        summary: "Caso de estudio de cómo la marca personal filantrópica de un dueño ('Mr. T') se transfiere a la reputación corporativa.",
        concepts: "Marca personal del dueño, Liderazgo branding, Reputación corporativa",
        findings: "La marca personal del líder ES la marca de la empresa en estos contextos. Actos visibles (filantropía) generan confianza.",
        methods: "Estudio de caso cualitativo (Indonesia), análisis de contenido."
    },
    {
        title: "7. Modelo de Desarrollo del Carácter (Crossan et al., 2021)",
        apa: "Crossan, M., Mazutis, D., Seijts, G., & Byrne, A. (2021). Towards a model of leader character development: Insights from anatomy and music therapy. The Leadership Quarterly, 32(4), 101480.",
        url: "ResearchGate",
        summary: "Modelo holístico 'PABC' (Fisiología, Afecto, Comportamiento, Cognición) para desarrollar carácter, usando analogía musical.",
        concepts: "Desarrollo del carácter, Anatomía del carácter (PABC), Musicoterapia",
        findings: "Desarrollar carácter requiere alinear cuerpo, emoción, mente y hábito. Intervenciones como música pueden ejercitar el sistema completo.",
        methods: "Ensayo teórico conceptual transdisciplinario."
    },
    {
        title: "8. Presencia Ejecutiva y Employee Engagement (Chukwuma & Okonkwo, 2023)",
        apa: "Chukwuma, C., & Okonkwo, C. (2023). Executive presence and employee engagement: An empirical analogy. Journal of Management Information and Decision Sciences, 26(2), 100–112.",
        url: "Allied Academies",
        summary: "Correlación empírica muy alta entre presencia ejecutiva (gravitas, comunicación) y el compromiso de empleados.",
        concepts: "Presencia ejecutiva (EP), Employee engagement, Gravitas",
        findings: "Relación casi perfecta (r=0.95). Líderes con presencia inspiran mayor dedicación y energía en sus equipos.",
        methods: "Cuantitativo: Encuesta a 74 gerentes, correlación y regresión."
    },
    {
        title: "9. Liderazgo Virtuoso para Inclusión (Grimani & Gotsis, 2020)",
        apa: "Grimani, A., & Gotsis, G. (2020). Fostering inclusive organizations through virtuous leadership. En The Routledge Companion to Inclusive Leadership.",
        url: "Taylor & Francis",
        summary: "Marco conceptual de cómo las virtudes (humildad, justicia) fomentan inclusión natural al satisfacer pertenencia y unicidad.",
        concepts: "Liderazgo virtuoso, Liderazgo inclusivo, Resultados multinivel",
        findings: "El líder virtuoso es inclusivo por naturaleza (derriba barreras de ego). Satisface necesidades de pertenencia y autorrealización.",
        methods: "Revisión conceptual teórica."
    },
    {
        title: "10. Soft Skills e Innovación (Ballester-Miquel et al., 2026)",
        apa: "Ballester-Miquel, J. C., Pérez-Ruiz, P., et al. (2026). The role of soft skills in workplace innovation... Journal of Innovation & Knowledge, 11(1).",
        url: "Elsevier (Open Access)",
        summary: "Estudio cuantitativo que identifica Liderazgo y Resolución de Problemas como los soft skills top para la innovación.",
        concepts: "Soft skills, Innovación en el lugar de trabajo, Liderazgo influenciador, Problem-solving",
        findings: "Liderazgo es el driver #1 de innovación, seguido de Resolución de Problemas. Clave para ventaja competitiva.",
        methods: "Cuantitativo: PLS-SEM en 125 profesionales."
    },
    {
        title: "11. Liderazgo Inclusivo y Éxito de Proyectos (Javed et al., 2025)",
        apa: "Javed, W., Younis, A., & Noor, U. (2025). The impact of inclusive leadership on project success... Journal of Positive School Psychology.",
        url: "ResearchGate",
        summary: "Liderazgo inclusivo mejora éxito de proyectos mediado por engagement, potenciado por el autosacrificio del líder.",
        concepts: "Liderazgo inclusivo, Éxito de proyectos, Autosacrificio, Engagement mediador",
        findings: "Inclusión genera engagement -> éxito. El líder que 'se sacrifica' por el equipo potencia este efecto.",
        methods: "Cuantitativo: Modelo de mediación/moderación en serie (n=400)."
    },
    {
        title: "12. Beneficios del Executive Coaching (Longenecker & McCartney, 2020)",
        apa: "Longenecker, C. O., & McCartney, K. (2020). The benefits of executive coaching: Voices from the C-suite. Strategic HR Review.",
        url: "Emerald Insight",
        summary: "Voces de 70 ejecutivos (C-suite) sobre beneficios del coaching: autoconciencia, control de ego, enfoque estratégico.",
        concepts: "Coaching ejecutivo, C-suite, Inteligencia emocional, Control del ego",
        findings: "Beneficios tangibles (enfoque, alineación) e intangibles (bajar la guardia, apoyo emocional, reducción de soledad).",
        methods: "Cualitativo: Entrevistas y focus groups a 70 ejecutivos."
    }
]

async function main() {
    console.log(`Start seeding research items...`)
    let count = 0
    for (const r of records) {
        // Generate a deterministic ID based on index or title hash to avoid duplicates if re-run
        // Simple approach: UPSERT by title logic is hard without unique constraint on title. 
        // We will assume unique ID prefix "RES-" with index
        count++
        const id = `RES-${String(count).padStart(3, '0')}`

        await prisma.contentItem.upsert({
            where: { id },
            update: {
                title: r.title,
                metadata: {
                    apa: r.apa,
                    url: r.url,
                    key_concepts: r.concepts,
                    findings: r.findings,
                    methodology: r.methods,
                    summary: r.summary
                },
                observations: r.summary
            },
            create: {
                id,
                title: r.title,
                type: 'Investigación',
                status: 'Validado', // Assuming historical research is validated
                version: 'v1.0',
                primaryPillar: 'Transversal', // Default
                completeness: 100,
                metadata: {
                    apa: r.apa,
                    url: r.url,
                    key_concepts: r.concepts,
                    findings: r.findings,
                    methodology: r.methods,
                    summary: r.summary
                },
                observations: r.summary
            }
        })
    }
    console.log(`Seeding finished. ${count} records processed.`)
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
