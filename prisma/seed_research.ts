import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 12 Records provided by user + Relation to 4Shine
const records = [
    {
        title: "1. Liderazgo y Carácter del Líder (Crossan et al., 2017)",
        apa: "Crossan, M., Seijts, G., & Gandz, J. (2017). Toward a Framework of Leader Character in Organizations. Journal of Management Studies, 54(7), 986-1008.",
        url: "https://www.researchgate.net/publication/313473422_Toward_a_Framework_of_Leader_Character_in_Organizations",
        summary: "Artículo seminal que propone un marco conceptual integral sobre el carácter del líder (11 dimensiones lideradas por el Juicio).",
        concepts: "Carácter del líder, Virtudes, Juicio (prudence), Competencias, Liderazgo efectivo",
        findings: "El carácter es esencial y complementario a las competencias. Se identificó el Juicio como la dimensión central que orquesta a las demás.",
        methods: "Estudio multimétodo: grupos focales + encuestas 360° a casi 2000 ejecutivos.",
        rel4shine: "Fundamenta el pilar 'Esencia del Líder' en 4Shine. Valida que el carácter no es 'soft' sino estructural para el desempeño. El 'Juicio' corresponde a nuestra dimensión de Toma de Decisiones Consciente."
    },
    {
        title: "2. Entrelazamiento Carácter-Competencia (Sturm, Vera & Crossan, 2017)",
        apa: "Sturm, R. E., Vera, D., & Crossan, M. (2017). The entanglement of leader character and leader competence and its impact on performance. The Leadership Quarterly, 28(3), 349-366.",
        url: "https://corescholar.libraries.wright.edu/cgi/viewcontent.cgi?article=1010&context=management",
        summary: "Estudio conceptual sobre el 'entrelazamiento' profundo entre carácter y competencia para un desempeño extraordinario sostenido.",
        concepts: "Entrelazamiento carácter-competencia, Learning-by-living, Desempeño extraordinario",
        findings: "Alto entrelazamiento genera performance superior largo plazo. Requiere aprendizaje por experiencia (vivencial).",
        methods: "Teórico-conceptual / Revisión interdisciplinaria.",
        rel4shine: "Sustenta la integración de 'Ser' (Carácter) y 'Hacer' (Competencia) que propone 4Shine. Refuerza que la excelencia técnica sin base ética es insostenible."
    },
    {
        title: "3. Carácter del Líder y Resultados en Colaboradores (Monzani et al., 2021)",
        apa: "Monzani, L., Seijts, G. H., & Crossan, M. m. (2021). Character matters: The network structure of leader character and its relation to follower positive outcomes. PLoS ONE, 16(9), e0255940.",
        url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0255940",
        summary: "Estudio cuantitativo de redes que muestra cómo el Juicio y el Ímpetu (Drive) conectan el carácter del líder con el bienestar de los seguidores.",
        concepts: "Network structure, Juicio (prudence), Ímpetu (drive), Resultados positivos del seguidor",
        findings: "Juicio es central. Juicio y Drive son los puentes clave para impactar el engagement y bienestar del equipo.",
        methods: "Cuantitativo: Análisis de Redes y CFA en 188 díadas líder-colaborador.",
        rel4shine: "Evidencia cómo el liderazgo impacta en el 'Engagement' y resultados del equipo, alineándose con nuestro pilar de 'Liderazgo de Alto Impacto' y bienestar organizacional."
    },
    {
        title: "4. Revisión Sistemática sobre Personal Branding (Gorbatov, Khapova & Lysova, 2018)",
        apa: "Gorbatov, S., Khapova, S. N., & Lysova, E. I. (2018). Personal branding: Interdisciplinary systematic review and research agenda. Frontiers in Psychology, 9, 2238.",
        url: "https://www.frontiersin.org/articles/10.3389/fpsyg.2018.02238/full",
        summary: "Revisión sistemática que integra definiciones y propone un modelo de inputs-procesos-resultados del personal branding.",
        concepts: "Marca personal, Personal branding, Nomología de marca, Modelo integrador",
        findings: "Definición integradora: proceso estratégico de gestión de impresiones basado en identidad única que aporta valor.",
        methods: "Revisión sistemática de >100 fuentes académicas.",
        rel4shine: "Base teórica para el pilar de 'Marca Personal'. Clarifica la diferencia entre autopromoción y gestión estratégica de la reputación basada en valor."
    },
    {
        title: "5. Marca Personal de Líderes en Redes (Venciūtė, Yue & Thelen, 2023)",
        apa: "Venciūtė, D., Yue, C. A., & Thelen, P. D. (2023). Leaders’ personal branding and communication on professional social media platforms. Journal of Brand Management, 30(1), 43-65.",
        url: "https://ideas.repec.org/a/pal/jobman/v30y2023i1d10.1057s41262-022-00293-6.html",
        summary: "Estudio cualitativo sobre cómo ejecutivos usan LinkedIn para beneficios personales y corporativos (reputación, talento).",
        concepts: "Marca personal ejecutiva, Presencia estratégica en redes, Motivaciones duales",
        findings: "Lideres motivados por legado y beneficio empresa. La autenticidad y visibilidad estratégica refuerzan la confianza.",
        methods: "Cualitativo: 25 entrevistas en profundidad a líderes senior.",
        rel4shine: "Justifica la necesidad de la 'Visibilidad Digital' en líderes modernos. Conecta la marca del líder con el Employer Branding (atracción de talento)."
    },
    {
        title: "6. Branding Personal del Dueño y Reputación (Situmorang & Salamah, 2018)",
        apa: "Situmorang, F. A. R., & Salamah, U. (2018). Analysis of personal branding and leadership branding company owner and company reputation. Jurnal InterAct, 7(2), 1-5.",
        url: "http://repository.atmajaya.ac.id/id/eprint/3001",
        summary: "Caso de estudio de cómo la marca personal filantrópica de un dueño ('Mr. T') se transfiere a la reputación corporativa.",
        concepts: "Marca personal del dueño, Liderazgo branding, Reputación corporativa",
        findings: "La marca personal del líder ES la marca de la empresa en estos contextos. Actos visibles (filantropía) generan confianza.",
        methods: "Estudio de caso cualitativo (Indonesia), análisis de contenido.",
        rel4shine: "Demuestra el efecto 'halo' de la marca personal del líder sobre la reputación corporativa, clave para dueños y empresarios."
    },
    {
        title: "7. Modelo de Desarrollo del Carácter (Crossan et al., 2021)",
        apa: "Crossan, M., Mazutis, D., Seijts, G., & Byrne, A. (2021). Towards a model of leader character development: Insights from anatomy and music therapy. The Leadership Quarterly, 32(4), 101480.",
        url: "https://www.researchgate.net/publication/348616182_Towards_a_Model_of_Leader_Character_Development",
        summary: "Modelo holístico 'PABC' (Fisiología, Afecto, Comportamiento, Cognición) para desarrollar carácter, usando analogía musical.",
        concepts: "Desarrollo del carácter, Anatomía del carácter (PABC), Musicoterapia",
        findings: "Desarrollar carácter requiere alinear cuerpo, emoción, mente y hábito. Intervenciones como música pueden ejercitar el sistema completo.",
        methods: "Ensayo teórico conceptual transdisciplinario.",
        rel4shine: "Apoya metodología vivencial de 4Shine: el liderazgo no se aprende solo intelectualmente, requiere intervención en conductas, emociones y mentalidad (PABC)."
    },
    {
        title: "8. Presencia Ejecutiva y Employee Engagement (Chukwuma & Okonkwo, 2023)",
        apa: "Chukwuma, C., & Okonkwo, C. (2023). Executive presence and employee engagement: An empirical analogy. Journal of Management Information and Decision Sciences, 26(2), 100–112.",
        url: "https://www.abacademies.org/articles/executive-presence-and-employee-engagement-an-empirical-analogy-15638.html",
        summary: "Correlación empírica muy alta entre presencia ejecutiva (gravitas, comunicación) y el compromiso de empleados.",
        concepts: "Presencia ejecutiva (EP), Employee engagement, Gravitas",
        findings: "Relación casi perfecta (r=0.95). Líderes con presencia inspiran mayor dedicación y energía en sus equipos.",
        methods: "Cuantitativo: Encuesta a 74 gerentes, correlación y regresión.",
        rel4shine: "Evidencia estadística para el pilar de 'Presencia Ejecutiva' y 'Comunicación'. La forma (presencia, gravitas) fondo impacta resultados tangibles (engagement)."
    },
    {
        title: "9. Liderazgo Virtuoso para Inclusión (Grimani & Gotsis, 2020)",
        apa: "Grimani, A., & Gotsis, G. (2020). Fostering inclusive organizations through virtuous leadership. En The Routledge Companion to Inclusive Leadership.",
        url: "https://www.taylorfrancis.com/chapters/edit/10.4324/9780429449673-9/fostering-inclusive-organizations-virtuous-leadership-alexandra-grimani-george-gotsis",
        summary: "Marco conceptual de cómo las virtudes (humildad, justicia) fomentan inclusión natural al satisfacer pertenencia y unicidad.",
        concepts: "Liderazgo virtuoso, Liderazgo inclusivo, Resultados multinivel",
        findings: "El líder virtuoso es inclusivo por naturaleza (derriba barreras de ego). Satisface necesidades de pertenencia y autorrealización.",
        methods: "Revisión conceptual teórica.",
        rel4shine: "Vincula el liderazgo ético con la construcción de Culturas Inclusivas, un resultado esperado de aplicar 4Shine en equipos diversos."
    },
    {
        title: "10. Soft Skills e Innovación (Ballester-Miquel et al., 2026)",
        apa: "Ballester-Miquel, J. C., Pérez-Ruiz, P., et al. (2026). The role of soft skills in workplace innovation... Journal of Innovation & Knowledge, 11(1).",
        url: "https://www.sciencedirect.com/science/article/pii/S2444569X2500055X",
        summary: "Estudio cuantitativo que identifica Liderazgo y Resolución de Problemas como los soft skills top para la innovación.",
        concepts: "Soft skills, Innovación en el lugar de trabajo, Liderazgo influenciador, Problem-solving",
        findings: "Liderazgo es el driver #1 de innovación, seguido de Resolución de Problemas. Clave para ventaja competitiva.",
        methods: "Cuantitativo: PLS-SEM en 125 profesionales.",
        rel4shine: "Posiciona las 'Habilidades Blandas' (Soft Skills) como motor de rentabilidad e innovación, no solo como 'nice to have'."
    },
    {
        title: "11. Liderazgo Inclusivo y Éxito de Proyectos (Javed et al., 2025)",
        apa: "Javed, W., Younis, A., & Noor, U. (2025). The impact of inclusive leadership on project success... Journal of Positive School Psychology.",
        url: "https://www.researchgate.net/publication/366961446_The_Impact_of_Inclusive_Leadership_on_Project_Success_A_Serial_Mediation_Analysis",
        summary: "Liderazgo inclusivo mejora éxito de proyectos mediado por engagement, potenciado por el autosacrificio del líder.",
        concepts: "Liderazgo inclusivo, Éxito de proyectos, Autosacrificio, Engagement mediador",
        findings: "Inclusión genera engagement -> éxito. El líder que 'se sacrifica' por el equipo potencia este efecto.",
        methods: "Cuantitativo: Modelo de mediación/moderación en serie (n=400).",
        rel4shine: "Conecta el liderazgo humano con el Éxito de Proyectos (KPis). Refuerza la idea de 'Liderazgo de Servicio' transversal a resultados."
    },
    {
        title: "12. Beneficios del Executive Coaching (Longenecker & McCartney, 2020)",
        apa: "Longenecker, C. O., & McCartney, K. (2020). The benefits of executive coaching: Voices from the C-suite. Strategic HR Review.",
        url: "https://www.emerald.com/insight/content/doi/10.1108/SHR-11-2019-0086/full/html",
        summary: "Voces de 70 ejecutivos (C-suite) sobre beneficios del coaching: autoconciencia, control de ego, enfoque estratégico.",
        concepts: "Coaching ejecutivo, C-suite, Inteligencia emocional, Control del ego",
        findings: "Beneficios tangibles (enfoque, alineación) e intangibles (bajar la guardia, apoyo emocional, reducción de soledad).",
        methods: "Cualitativo: Entrevistas y focus groups a 70 ejecutivos.",
        rel4shine: "Valida científicamente la metodología de Coaching Ejecutivo como herramienta para C-Levels, mejorando autoconciencia y ROI."
    }
]

async function main() {
    console.log(`Start seeding research SOURCES...`)
    let count = 0

    // Clean previous records in ContentItem that were temporary (with ID starting with RES-)
    try {
        await prisma.contentItem.deleteMany({ where: { id: { startsWith: 'RES-' } } })
        console.log('Cleaned up simple ContentItem research records.')
    } catch (e) { console.log('Cleanup skipped or failed', e) }

    for (const r of records) {
        count++
        const id = `RS-${String(count).padStart(3, '0')}` // New ID scheme for ResearchSource

        await prisma.researchSource.upsert({
            where: { id },
            update: {
                title: r.title,
                apa: r.apa,
                url: r.url,
                summary: r.summary,
                keyConcepts: r.concepts,
                findings: r.findings,
                methodology: r.methods,
                relation4Shine: r.rel4shine
            },
            create: {
                id,
                title: r.title,
                apa: r.apa,
                url: r.url,
                summary: r.summary,
                keyConcepts: r.concepts,
                findings: r.findings,
                methodology: r.methods,
                relation4Shine: r.rel4shine
            }
        })
    }
    console.log(`Seeding finished. ${count} ResearchSource records processed.`)
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
