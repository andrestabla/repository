'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path || (path === '/' && pathname === '/dashboard')

    const navItemClass = (path: string) => `
    w-full text-left bg-transparent border-0
    text-text-muted px-3 py-2 mb-1
    cursor-pointer rounded-md text-[13px] font-medium
    flex items-center gap-2.5 transition-all duration-200
    hover:bg-white/5 hover:text-text
    ${isActive(path) ? 'bg-[rgba(88,166,255,0.1)] text-accent' : ''}
  `

    return (
        <aside className="bg-panel border-r border-border flex flex-col p-4 w-[250px] h-full">
            <div className="flex items-center gap-2.5 pb-5 border-b border-border mb-4">
                <div className="w-8 h-8 bg-text text-bg font-extrabold grid place-items-center rounded">4S</div>
                <div>
                    <h1 className="text-[14px] font-bold text-white m-0">Methodology Builder</h1>
                    <span className="text-[11px] text-text-muted font-mono">v0.1.2 (Dev)</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="text-[11px] uppercase text-[#484f58] mt-4 mb-2 ml-3 font-bold">Gestión</div>
                <Link href="/" className={navItemClass('/')}>
                    📊 Dashboard
                </Link>
                <Link href="/inventory" className={navItemClass('/inventory')}>
                    🗃️ Inventario Maestro
                </Link>
                <Link href="/taxonomy" className={navItemClass('/taxonomy')}>
                    🌳 Taxonomía
                </Link>

                <div className="text-[11px] uppercase text-[#484f58] mt-4 mb-2 ml-3 font-bold">Análisis</div>
                <Link href="/gap-analysis" className={navItemClass('/gap-analysis')}>
                    ⚠️ Brechas (Gap Analysis)
                </Link>
                <Link href="/qa" className={navItemClass('/qa')}>
                    🛡️ Gobernanza & IP
                </Link>

                <div className="text-[11px] uppercase text-[#484f58] mt-4 mb-2 ml-3 font-bold">Producción</div>
                <Link href="/generator" className={navItemClass('/generator')}>
                    ⚡ Generador de Productos
                </Link>
            </div>

            <div className="mt-auto pt-5 border-t border-border">
                <div className="text-[12px] flex gap-2.5 items-center">
                    <div className="w-6 h-6 bg-purple rounded-full grid place-items-center font-bold text-white">M</div>
                    <div>
                        <div className="text-white font-semibold">Metodólogo</div>
                        <div className="text-text-muted text-[11px]">Admin</div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
