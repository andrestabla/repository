'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import {
    Folder,
    FileText,
    PlusCircle,
    Edit2,
    Eye,
    EyeOff,
    Loader2,
    Plus,
    Box,
    RefreshCw,
    Link as LinkIcon,
    BookOpen,
    Share2,
    List,
    AlertCircle,
    Download
} from 'lucide-react'
import TaxonomyGraph from './TaxonomyGraph'
import TaxonomyDiamondGraph from './TaxonomyDiamondGraph'

type ContentItem = {
    id: string
    title: string
    type: string
    primaryPillar: string
    sub?: string | null
    competence?: string | null
    behavior?: string | null
}

type ResearchItem = {
    id: string
    title: string
    pillars?: string[]
    competence?: string | null
}

type TaxonomyItem = {
    id: string
    name: string
    type: string
    active: boolean
    order: number
    parentId: string | null
    children?: TaxonomyItem[]
}

export default function TaxonomyManager({
    initialData,
    inventory = [],
    research = []
}: {
    initialData: TaxonomyItem[],
    inventory?: ContentItem[],
    research?: ResearchItem[]
}) {
    const [data, setData] = useState<TaxonomyItem[]>(initialData)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'list' | 'visual' | 'diamond'>('diamond')
    const [showGaps, setShowGaps] = useState(false)
    const [graphFocus, setGraphFocus] = useState<'ALL' | 'Shine Within' | 'Shine Out' | 'Shine Up' | 'Shine Beyond'>('ALL')

    // Flatten tree structure for exports
    const flattenTree = (nodes: TaxonomyItem[]): TaxonomyItem[] => {
        const result: TaxonomyItem[] = []
        const flatten = (items: TaxonomyItem[]) => {
            items.forEach(item => {
                result.push(item)
                if (item.children && item.children.length > 0) {
                    flatten(item.children)
                }
            })
        }
        flatten(nodes)
        return result
    }

    const getLinkedAssets = (node: TaxonomyItem, level: 'Pillar' | 'Sub' | 'Comp' | 'Behavior') => {
        const invMatches = inventory.filter(item => {
            if (level === 'Pillar') return item.primaryPillar === node.name
            if (level === 'Sub') return item.sub === node.name
            if (level === 'Comp') return item.competence === node.name
            if (level === 'Behavior') return item.behavior === node.name
            return false
        })

        const resMatches = research.filter(item => {
            if (level === 'Pillar') return item.pillars && item.pillars.includes(node.name)
            // For sub/comp/behavior, we check if competence matches or loosely match text if needed.
            // Assuming strict mapping via competence for L3. 
            if (level === 'Comp') return item.competence === node.name
            return false
        })

        // Map to common interface for display
        return [
            ...invMatches.map(i => ({ ...i, source: 'inventory' as const })),
            ...resMatches.map(r => ({ ...r, source: 'research' as const, type: 'Investigación' }))
        ]
    }

    const handleToggleActive = async (id: string, current: boolean) => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/taxonomy', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, active: !current })
            })
            if (res.ok) {
                const updateTree = (nodes: TaxonomyItem[]): TaxonomyItem[] => {
                    return nodes.map(n => {
                        if (n.id === id) return { ...n, active: !current }
                        if (n.children) return { ...n, children: updateTree(n.children) }
                        return n
                    })
                }
                setData(updateTree(data))
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddNode = async (parentId: string | null, type: string) => {
        const name = window.prompt(`Nuevo ${type}:`)
        if (!name) return

        setIsLoading(true)
        try {
            const res = await fetch('/api/taxonomy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type, parentId })
            })
            if (res.ok) {
                window.location.reload()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditName = async (id: string, currentName: string) => {
        const name = window.prompt('Editar nombre:', currentName)
        if (!name || name === currentName) return

        setIsLoading(true)
        try {
            const res = await fetch('/api/taxonomy', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name })
            })
            if (res.ok) {
                const updateTree = (nodes: TaxonomyItem[]): TaxonomyItem[] => {
                    return nodes.map(n => {
                        if (n.id === id) return { ...n, name }
                        if (n.children) return { ...n, children: updateTree(n.children) }
                        return n
                    })
                }
                setData(updateTree(data))
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleSync = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/taxonomy', { method: 'PUT' })
            const data = await res.json()
            if (res.ok) {
                alert(`Sincronización completada.\nAgregados: ${data.stats.added}\nEliminados: ${data.stats.deleted}\nExistentes: ${data.stats.exist}`)
                window.location.reload()
            }
        } catch (err) {
            console.error(err)
            alert('Error al sincronizar')
        } finally {
            setIsLoading(false)
        }
    }

    const exportAsPNG = async () => {
        setIsLoading(true)
        try {
            const container = document.querySelector('.taxonomy-view-container') as HTMLElement
            if (!container) {
                alert('No se pudo encontrar el contenedor')
                setIsLoading(false)
                return
            }

            // Check if we're in diamond view (SVG) or list view (HTML)
            const svgElement = container.querySelector('svg') as SVGElement

            if (svgElement && activeTab === 'diamond') {
                // SVG Export (Diamond view)
                const bbox = svgElement.getBoundingClientRect()
                const svgData = new XMLSerializer().serializeToString(svgElement)
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    alert('Error al crear canvas')
                    setIsLoading(false)
                    return
                }

                canvas.width = bbox.width * 2
                canvas.height = bbox.height * 2
                ctx.scale(2, 2)

                const img = new Image()
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
                const url = URL.createObjectURL(svgBlob)

                img.onload = () => {
                    ctx.fillStyle = '#ffffff'
                    ctx.fillRect(0, 0, bbox.width, bbox.height)
                    ctx.drawImage(img, 0, 0, bbox.width, bbox.height)
                    URL.revokeObjectURL(url)

                    const link = document.createElement('a')
                    link.download = `taxonomia-${graphFocus}-${Date.now()}.png`
                    link.href = canvas.toDataURL('image/png')
                    link.click()
                    setIsLoading(false)
                }

                img.onerror = (err) => {
                    console.error('Error loading SVG:', err)
                    alert('Error al cargar el gráfico SVG')
                    URL.revokeObjectURL(url)
                    setIsLoading(false)
                }

                img.src = url
            } else {
                // HTML Export (List view)
                const canvas = await html2canvas(container, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    logging: false,
                    useCORS: true,
                    onclone: (clonedDoc) => {
                        // Fix oklch colors that cause parsing errors
                        const elements = clonedDoc.querySelectorAll('*')
                        elements.forEach((el: any) => {
                            if (el.style.backgroundColor?.includes('oklch')) el.style.backgroundColor = '#ffffff'
                            if (el.style.color?.includes('oklch')) el.style.color = '#000000'
                            if (el.style.borderColor?.includes('oklch')) el.style.borderColor = '#e5e7eb'
                        })

                        // Override CSS variables that use oklch
                        const style = clonedDoc.createElement('style')
                        style.textContent = `
                            * {
                                --bg-main: #ffffff !important;
                                --text-main: #000000 !important;
                                --text-muted: #6b7280 !important;
                                --border: #e5e7eb !important;
                                --accent: #3b82f6 !important;
                            }
                        `
                        clonedDoc.head.appendChild(style)
                    }
                })

                const link = document.createElement('a')
                link.download = `taxonomia-listado-${Date.now()}.png`
                link.href = canvas.toDataURL('image/png')
                link.click()
                setIsLoading(false)
            }
        } catch (error: any) {
            console.error('Error exporting PNG:', error)
            alert(`Error al exportar PNG: ${error.message || 'Error desconocido'}`)
            setIsLoading(false)
        }
    }

    const exportAsPDF = async () => {
        setIsLoading(true)
        try {
            const container = document.querySelector('.taxonomy-view-container') as HTMLElement
            if (!container) {
                alert('No se pudo encontrar el contenedor')
                setIsLoading(false)
                return
            }

            const svgElement = container.querySelector('svg') as SVGElement
            let canvas: HTMLCanvasElement

            if (svgElement && activeTab === 'diamond') {
                // SVG Export (Diamond view)
                const bbox = svgElement.getBoundingClientRect()
                const svgData = new XMLSerializer().serializeToString(svgElement)
                canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    alert('Error al crear canvas')
                    setIsLoading(false)
                    return
                }

                canvas.width = bbox.width * 2
                canvas.height = bbox.height * 2
                ctx.scale(2, 2)

                const img = new Image()
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
                const url = URL.createObjectURL(svgBlob)

                img.onload = () => {
                    ctx.fillStyle = '#ffffff'
                    ctx.fillRect(0, 0, bbox.width, bbox.height)
                    ctx.drawImage(img, 0, 0, bbox.width, bbox.height)
                    URL.revokeObjectURL(url)

                    const imgData = canvas.toDataURL('image/png')
                    const pdf = new jsPDF('landscape', 'mm', 'a4')
                    const imgWidth = 297
                    const imgHeight = (canvas.height * imgWidth) / canvas.width

                    if (imgHeight > 210) {
                        const scaleFactor = 210 / imgHeight
                        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * scaleFactor, 210)
                    } else {
                        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
                    }

                    pdf.save(`taxonomia-${graphFocus}-${Date.now()}.pdf`)
                    setIsLoading(false)
                }

                img.onerror = (err) => {
                    console.error('Error loading SVG:', err)
                    alert('Error al cargar el gráfico SVG')
                    URL.revokeObjectURL(url)
                    setIsLoading(false)
                }

                img.src = url
            } else {
                // HTML Export (List view)
                canvas = await html2canvas(container, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    logging: false,
                    useCORS: true,
                    onclone: (clonedDoc) => {
                        // Fix oklch colors that cause parsing errors
                        const elements = clonedDoc.querySelectorAll('*')
                        elements.forEach((el: any) => {
                            if (el.style.backgroundColor?.includes('oklch')) el.style.backgroundColor = '#ffffff'
                            if (el.style.color?.includes('oklch')) el.style.color = '#000000'
                            if (el.style.borderColor?.includes('oklch')) el.style.borderColor = '#e5e7eb'
                        })

                        // Override CSS variables that use oklch
                        const style = clonedDoc.createElement('style')
                        style.textContent = `
                            * {
                                --bg-main: #ffffff !important;
                                --text-main: #000000 !important;
                                --text-muted: #6b7280 !important;
                                --border: #e5e7eb !important;
                                --accent: #3b82f6 !important;
                            }
                        `
                        clonedDoc.head.appendChild(style)
                    }
                })

                const imgData = canvas.toDataURL('image/png')
                const pdf = new jsPDF('landscape', 'mm', 'a4')
                const imgWidth = 297
                const imgHeight = (canvas.height * imgWidth) / canvas.width

                if (imgHeight > 210) {
                    const scaleFactor = 210 / imgHeight
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * scaleFactor, 210)
                } else {
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
                }

                pdf.save(`taxonomia-listado-${Date.now()}.pdf`)
                setIsLoading(false)
            }
        } catch (error: any) {
            console.error('Error exporting PDF:', error)
            alert(`Error al exportar PDF: ${error.message || 'Error desconocido'}`)
            setIsLoading(false)
        }
    }

    const exportAsExcel = () => {
        setIsLoading(true)
        try {
            const excelData: any[] = []

            // Flatten the tree structure to get all nodes
            const flattenedData = flattenTree(data)

            // Debug logging
            console.log('Export Debug:', {
                totalItems: flattenedData.length,
                pillars: flattenedData.filter(i => i.type === 'Pillar').length,
                components: flattenedData.filter(i => i.type === 'Component').length,
                competences: flattenedData.filter(i => i.type === 'Competence').length,
                behaviors: flattenedData.filter(i => i.type === 'Behavior').length
            })

            flattenedData
                .filter(item => item.type === 'Pillar' && item.parentId === null)
                .sort((a, b) => a.order - b.order)
                .forEach(pillar => {
                    const pillarAssets = getLinkedAssets(pillar, 'Pillar')
                    const components = flattenedData.filter(c => c.parentId === pillar.id && c.type === 'Component')
                        .sort((a, b) => a.order - b.order)

                    if (components.length === 0) {
                        excelData.push({
                            'Pilar': pillar.name,
                            'Componente': '',
                            'Competencia': '',
                            'Comportamiento': '',
                            'Activo': pillar.active ? 'Sí' : 'No',
                            'Fuentes Vinculadas': pillarAssets.length,
                            'Títulos de Fuentes': pillarAssets.map(a => a.title).join('; ')
                        })
                    } else {
                        components.forEach(comp => {
                            const compAssets = getLinkedAssets(comp, 'Sub')
                            const competences = flattenedData.filter(co => co.parentId === comp.id && co.type === 'Competence')
                                .sort((a, b) => a.order - b.order)

                            if (competences.length === 0) {
                                excelData.push({
                                    'Pilar': pillar.name,
                                    'Componente': comp.name,
                                    'Competencia': '',
                                    'Comportamiento': '',
                                    'Activo': comp.active ? 'Sí' : 'No',
                                    'Fuentes Vinculadas': compAssets.length,
                                    'Títulos de Fuentes': compAssets.map(a => a.title).join('; ')
                                })
                            } else {
                                competences.forEach(competence => {
                                    const competenceAssets = getLinkedAssets(competence, 'Comp')
                                    const behaviors = flattenedData.filter(b => b.parentId === competence.id && b.type === 'Behavior')
                                        .sort((a, b) => a.order - b.order)

                                    if (behaviors.length === 0) {
                                        excelData.push({
                                            'Pilar': pillar.name,
                                            'Componente': comp.name,
                                            'Competencia': competence.name,
                                            'Comportamiento': '',
                                            'Activo': competence.active ? 'Sí' : 'No',
                                            'Fuentes Vinculadas': competenceAssets.length,
                                            'Títulos de Fuentes': competenceAssets.map(a => a.title).join('; ')
                                        })
                                    } else {
                                        behaviors.forEach(behavior => {
                                            const behaviorAssets = getLinkedAssets(behavior, 'Behavior')
                                            excelData.push({
                                                'Pilar': pillar.name,
                                                'Componente': comp.name,
                                                'Competencia': competence.name,
                                                'Comportamiento': behavior.name,
                                                'Activo': behavior.active ? 'Sí' : 'No',
                                                'Fuentes Vinculadas': behaviorAssets.length,
                                                'Títulos de Fuentes': behaviorAssets.map(a => a.title).join('; ')
                                            })
                                        })
                                    }
                                })
                            }
                        })
                    }
                })

            console.log('Excel rows generated:', excelData.length)

            const ws = XLSX.utils.json_to_sheet(excelData)

            // Set column widths
            ws['!cols'] = [
                { wch: 20 }, // Pilar
                { wch: 30 }, // Componente
                { wch: 35 }, // Competencia
                { wch: 40 }, // Comportamiento
                { wch: 10 }, // Activo
                { wch: 15 }, // Fuentes Vinculadas
                { wch: 60 }  // Títulos de Fuentes
            ]

            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Taxonomía 4Shine')

            XLSX.writeFile(wb, `taxonomia-4shine-${Date.now()}.xlsx`)
            setIsLoading(false)
        } catch (error: any) {
            console.error('Error exporting Excel:', error)
            alert(`Error al exportar Excel: ${error.message || 'Error desconocido'}`)
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-panel border border-border rounded-3xl p-8 shadow-sm text-left">
            <header className="flex justify-between items-center mb-10 border-b border-border pb-6">
                <div>
                    <h3 className="text-2xl font-black text-text-main tracking-tighter flex items-center gap-3">
                        Arquitectura Estructural
                        <Box size={20} className="text-accent opacity-50" />
                    </h3>
                    <p className="text-sm text-text-muted mt-1 font-medium italic">Define pilares y subcomponentes del framework 4Shine.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSync}
                        className="bg-panel border border-border text-text-muted hover:text-accent hover:border-accent px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                        title="Sincronizar Pilares desde Assets"
                    >
                        <RefreshCw size={14} />
                        Actualizar
                    </button>
                    <button
                        onClick={() => handleAddNode(null, 'Pillar')}
                        className="bg-gray-100 text-gray-400 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed flex items-center gap-2"
                        title="Los pilares base son fijos (4Shine)"
                        disabled
                    >
                        <Plus size={16} />
                        Agregar Pilar
                    </button>
                    <div className="w-px bg-border mx-1"></div>
                    <button
                        onClick={exportAsPNG}
                        disabled={isLoading}
                        className="bg-panel border border-border text-text-muted hover:text-blue-500 hover:border-blue-500 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Descargar como PNG"
                    >
                        <Download size={14} />
                        PNG
                    </button>
                    <button
                        onClick={exportAsPDF}
                        disabled={isLoading}
                        className="bg-panel border border-border text-text-muted hover:text-red-500 hover:border-red-500 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Descargar como PDF"
                    >
                        <Download size={14} />
                        PDF
                    </button>
                    <button
                        onClick={exportAsExcel}
                        disabled={isLoading}
                        className="bg-panel border border-border text-text-muted hover:text-green-500 hover:border-green-500 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Descargar como Excel"
                    >
                        <Download size={14} />
                        EXCEL
                    </button>
                </div>
            </header>

            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'list'
                            ? 'bg-accent text-white shadow-lg shadow-accent/20'
                            : 'bg-bg border border-border text-text-muted hover:border-accent hover:text-accent'
                            }`}
                    >
                        <List size={16} />
                        Listado Detallado
                    </button>
                    <button
                        onClick={() => setActiveTab('diamond')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'diamond'
                            ? 'bg-accent text-white shadow-lg shadow-accent/20'
                            : 'bg-bg border border-border text-text-muted hover:border-accent hover:text-accent'
                            }`}
                    >
                        <Box size={16} />
                        Esquema Visual (Diamante)
                    </button>
                    <button
                        onClick={() => setShowGaps(!showGaps)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${showGaps
                            ? 'bg-danger text-white shadow-lg shadow-danger/20 animate-pulse'
                            : 'bg-bg border border-border text-text-muted hover:border-danger hover:text-danger'
                            }`}
                    >
                        <Eye size={16} />
                        {showGaps ? 'Ocultar Brechas' : 'Ver Faltantes'}
                    </button>
                </div>

                {/* Graph Focus Selector - Only visible on Diamond Tab */}
                {activeTab === 'diamond' && (
                    <div className="flex bg-bg border border-border rounded-xl p-1 gap-1">
                        {['ALL', 'Shine Within', 'Shine Out', 'Shine Up', 'Shine Beyond'].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setGraphFocus(opt as any)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${graphFocus === opt
                                    ? 'bg-text-main text-bg shadow-md'
                                    : 'text-text-muted hover:text-text-main hover:bg-panel'
                                    }`}
                            >
                                {opt === 'ALL' ? 'General' : opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {activeTab === 'diamond' ? (
                <div className="taxonomy-view-container h-[700px] w-full bg-slate-50 border border-border rounded-3xl overflow-hidden relative animate-in fade-in duration-500">
                    <div className="absolute top-4 left-4 z-10 p-4 pointer-events-none">
                        <h3 className="text-xl font-black text-text-main uppercase tracking-tighter opacity-20">
                            {graphFocus === 'ALL' ? 'Visión Sistémica 4Shine' : `Foco de Pilar: ${graphFocus}`}
                        </h3>
                    </div>
                    <TaxonomyDiamondGraph data={data} focus={graphFocus} showGaps={showGaps} inventory={inventory} />
                </div>
            ) : activeTab === 'visual' ? (
                <div className="h-[600px] w-full animate-in fade-in duration-500">
                    <TaxonomyGraph taxonomy={data} />
                </div>
            ) : (
                <div className="taxonomy-view-container grid gap-6 animate-in fade-in duration-500 bg-white p-6 rounded-3xl">
                    {data
                        .filter(item => item.type === 'Pillar' && item.parentId === null)
                        .sort((a, b) => a.order - b.order)
                        .map(pillar => {
                            const pAssets = getLinkedAssets(pillar, 'Pillar')
                            const isPGap = pAssets.length === 0
                            return (
                                <div key={pillar.id} className={`group bg-bg border-2 border-border/40 rounded-3xl p-6 transition-all hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 ${!pillar.active ? 'opacity-50 grayscale' : ''} ${showGaps && isPGap ? 'border-danger/50 bg-danger/5' : ''}`}>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-accent/5 text-accent rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                                                <Folder size={24} fill={pillar.active ? 'currentColor' : 'none'} fillOpacity={0.2} />
                                            </div>
                                            <div>
                                                <div className="font-black text-xl text-text-main flex items-center gap-3 tracking-tight">
                                                    {pillar.name}
                                                    {!pillar.active && (
                                                        <span className="text-[9px] bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded-full uppercase font-black tracking-widest">Inactivo</span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-1 opacity-60">Pilar Maestría</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <IconButton icon={<Edit2 size={14} />} onClick={() => handleEditName(pillar.id, pillar.name)} />
                                            <IconButton icon={pillar.active ? <EyeOff size={14} /> : <Eye size={14} />} onClick={() => handleToggleActive(pillar.id, pillar.active)} />
                                            <button
                                                onClick={() => handleAddNode(pillar.id, 'Component')}
                                                className="bg-panel border border-border text-text-muted px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all flex items-center gap-2"
                                            >
                                                <PlusCircle size={14} /> Subcomponente
                                            </button>
                                        </div>
                                    </div>

                                    {/* Linked Assets for Pillar */}
                                    <LinkedAssets assets={pAssets} showGaps={showGaps} isGap={isPGap} />

                                    <div className="flex flex-col gap-3 ml-2 lg:ml-16 mt-4">
                                        {pillar.children?.map(level2 => {
                                            const sAssets = getLinkedAssets(level2, 'Sub')
                                            const isSGap = sAssets.length === 0
                                            return (
                                                <div key={level2.id} className={`border border-border rounded-xl p-4 bg-panel/50 ${showGaps && isSGap ? 'border-danger/30' : ''}`}>
                                                    {/* LEVEL 2: SUBCOMPONENT */}
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-bold">L2</div>
                                                            <span className="font-bold text-sm text-text-main">{level2.name}</span>
                                                            <span className="text-[10px] text-text-muted uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-1.5 rounded">Subcomponente</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <IconButton icon={<Edit2 size={12} />} onClick={() => handleEditName(level2.id, level2.name)} />
                                                            <IconButton icon={level2.active ? <EyeOff size={12} /> : <Eye size={12} />} onClick={() => handleToggleActive(level2.id, level2.active)} />
                                                        </div>
                                                    </div>

                                                    {/* Linked Assets for L2 */}
                                                    <LinkedAssets assets={sAssets} showGaps={showGaps} isGap={isSGap} />

                                                    {/* LEVEL 3: COMPETENCIA */}
                                                    <div className="ml-8 border-l-2 border-border pl-4 grid gap-2">
                                                        {level2.children?.map(level3 => {
                                                            const cAssets = getLinkedAssets(level3, 'Comp')
                                                            const isCGap = cAssets.length === 0
                                                            return (
                                                                <div key={level3.id} className="group/l3">
                                                                    <div className="flex justify-between items-center py-2 hover:bg-black/5 rounded px-2 -ml-2 transition-colors">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-5 h-5 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center text-[9px] font-bold">L3</div>
                                                                            <span className="text-sm font-medium text-text-main">{level3.name}</span>
                                                                            <span className="text-[9px] text-text-muted uppercase tracking-widest opacity-50">Competencia</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Linked Assets for L3 */}
                                                                    <LinkedAssets assets={cAssets} showGaps={showGaps} isGap={isCGap} />

                                                                    {/* LEVEL 4: CONDUCTA */}
                                                                    <div className="ml-6 mt-1 space-y-1">
                                                                        {level3.children?.map(level4 => {
                                                                            const bAssets = getLinkedAssets(level4, 'Behavior')
                                                                            const isBGap = bAssets.length === 0
                                                                            return (
                                                                                <div key={level4.id}>
                                                                                    <div className={`flex items-center gap-2 text-xs py-1 pl-2 border-l transition-colors ${showGaps && isBGap ? 'text-danger border-danger font-bold' : 'text-text-muted border-border hover:text-accent hover:border-accent'}`}>
                                                                                        <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-accent" />
                                                                                        {showGaps && isBGap && <AlertCircle size={10} className="text-danger animate-pulse" />}
                                                                                        <span>{level4.name}</span>
                                                                                    </div>
                                                                                    {/* Linked Assets for L4 */}
                                                                                    <LinkedAssets assets={bAssets} showGaps={showGaps} isGap={isBGap} />
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                </div>
            )}

            {isLoading && (
                <div className="fixed inset-0 bg-bg/80 backdrop-blur-md flex items-center justify-center z-[100] transition-all">
                    <div className="bg-panel border border-border p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-6">
                        <Loader2 size={48} className="text-accent animate-spin" />
                        <div className="text-lg font-black text-text-main tracking-tighter uppercase tracking-widest">Sincronizando Arquitectura 4Shine</div>
                    </div>
                </div>
            )}
        </div>
    )
}

function IconButton({ icon, onClick }: { icon: React.ReactNode, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-10 h-10 rounded-xl bg-panel border border-border text-text-muted hover:border-accent hover:text-accent transition-all flex items-center justify-center hover:shadow-lg hover:shadow-accent/10 active:scale-90"
        >
            {icon}
        </button>
    )
}

function LinkedAssets({ assets, showGaps, isGap }: { assets: any[], showGaps?: boolean, isGap?: boolean }) {
    if (assets.length === 0) {
        if (showGaps && isGap) {
            return (
                <div className="ml-8 mb-3 pl-2 border-l-2 border-danger/20">
                    <div className="text-[9px] font-black text-danger uppercase tracking-widest mb-1 flex items-center gap-2">
                        <AlertCircle size={10} />
                        Sin Contenido
                    </div>
                </div>
            )
        }
        return null
    }
    return (
        <div className="ml-8 mb-3 pl-2 border-l-2 border-accent/20">
            <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <LinkIcon size={10} className="text-accent" />
                Fuentes ({assets.length})
            </div>
            <div className="flex flex-wrap gap-2">
                {assets.map((a, i) => {
                    const isResearch = a.source === 'research'
                    const href = isResearch ? `/research?id=${a.id}` : `/inventario?id=${a.id}`
                    return (
                        <Link key={a.id + i} href={href} className="group/link block">
                            <div className={`text-[10px] items-center gap-1.5 inline-flex bg-bg border px-2.5 py-1.5 rounded-lg hover:shadow-sm transition-all truncate max-w-[200px] ${isResearch
                                ? 'border-yellow-200 text-yellow-700 hover:border-yellow-500 hover:text-yellow-600'
                                : 'border-border text-text-muted hover:border-accent hover:text-accent'
                                }`} title={a.title}>
                                {isResearch ? <BookOpen size={10} /> : <FileText size={10} className="opacity-50 group-hover/link:text-accent" />}
                                <span className="truncate max-w-[150px]">{a.title}</span>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
