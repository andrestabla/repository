'use client'

export default function GeneratorCards() {
    const items = [
        'Dossier Maestro', 'Manual Metodológico', 'Guía del Mentor',
        'Workbook Participante', 'Toolkit (ZIP)', 'Sistema de Evaluación'
    ]

    const handleGenerate = (item: string) => {
        alert(`Iniciando proceso de generación para: ${item}...\n\nConectando a Vercel API...\nConsultando Neon...\nRecuperando archivos de Drive...`)
    }

    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            {items.map((item) => (
                <div
                    key={item}
                    onClick={() => handleGenerate(item)}
                    className="bg-[var(--panel)] border border-border rounded-lg p-4 flex flex-col gap-2.5 cursor-pointer hover:border-accent hover:bg-[rgba(88,166,255,0.05)] transition-all duration-200"
                >
                    <div className="text-[24px] mb-1">📄</div>
                    <div className="font-semibold text-[var(--text-main)]">{item}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">JSON structure + Assets</div>
                    <button className="bg-[#238636] text-white border border-white/10 px-3 py-1.5 rounded-md text-[12px] font-semibold hover:bg-[#2ea043] transition-colors w-full mt-auto">
                        Generar
                    </button>
                </div>
            ))}
        </div>
    )
}
