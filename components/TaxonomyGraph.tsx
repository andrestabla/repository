'use client'

import React, { useEffect, useState } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'

cytoscape.use(dagre)

type TaxonomyItem = {
    id: string
    name: string
    type: string
    active: boolean
    order: number
    parentId: string | null
    children?: TaxonomyItem[]
    parent?: TaxonomyItem
}

export default function TaxonomyGraph({ taxonomy }: { taxonomy: TaxonomyItem[] }) {
    const [elements, setElements] = useState<any[]>([])
    const [cyRef, setCyRef] = useState<cytoscape.Core | null>(null)
    const [currentLayout, setCurrentLayout] = useState('dagre')

    useEffect(() => {
        if (!taxonomy || taxonomy.length === 0) return

        const nodes: any[] = []
        const edges: any[] = []

        // Recursive function to traverse taxonomic tree
        const processNode = (node: TaxonomyItem, parentId: string | null = null) => {
            // Determine node style based on type
            let nodeColor = '#666'
            let nodeSize = 30
            let fontSize = 10
            let label = node.name
            let shape = 'ellipse'

            if (node.type === 'Pillar') {
                nodeColor = '#7e22ce' // Purple (Accent)
                nodeSize = 80
                fontSize = 16
                label = node.name.toUpperCase()
                shape = 'hexagon'
            } else if (node.type === 'Subcomponent') { // Level 2
                nodeColor = '#3b82f6' // Blue
                nodeSize = 50
                fontSize = 12
            } else if (node.type === 'Competence') { // Level 3
                nodeColor = '#10b981' // Emerald
                nodeSize = 30
                fontSize = 10
            } else if (node.type === 'Behavior') { // Level 4
                nodeColor = '#f59e0b' // Amber
                nodeSize = 20
                fontSize = 9
            }

            // Add Node
            nodes.push({
                data: {
                    id: node.id,
                    label: label,
                    type: node.type,
                    color: nodeColor,
                    size: nodeSize,
                    fontSize: fontSize,
                    shape: shape
                }
            })

            // Add Edge from Parent
            if (parentId) {
                edges.push({
                    data: {
                        source: parentId,
                        target: node.id
                    }
                })
            }

            // Process Children
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => processNode(child, node.id))
            }
        }

        // Start processing from root nodes (Pillars)
        taxonomy.forEach(item => processNode(item))

        setElements([...nodes, ...edges])
    }, [taxonomy])

    // Update layout when changed
    useEffect(() => {
        if (cyRef && elements.length > 0) {
            const layoutConfig = getLayoutConfig(currentLayout)
            try {
                const layout = cyRef.layout(layoutConfig)
                layout.run()
            } catch (e) {
                console.error("Layout error:", e)
            }
        }
    }, [currentLayout, elements, cyRef])

    const getLayoutConfig = (name: string) => {
        if (name === 'dagre') {
            return {
                name: 'dagre',
                rankDir: 'TB',
                spacingFactor: 1.5,
                padding: 50,
                animate: true,
                animationDuration: 500
            }
        }
        if (name === 'cose') {
            return {
                name: 'cose',
                animate: true,
                animationDuration: 500,
                padding: 50,
                componentSpacing: 80,
                nodeOverlap: 20,
                refresh: 20,
                fit: true,
                gravity: 80,
                numIter: 1000,
                initialTemp: 200,
                coolingFactor: 0.95,
                minTemp: 1.0
            }
        }
        if (name === 'circle') return { name: 'circle', padding: 50, animate: true, animationDuration: 500 }
        if (name === 'breadthfirst') return { name: 'breadthfirst', padding: 50, animate: true, animationDuration: 500, spacingFactor: 1.5 }
        if (name === 'grid') return { name: 'grid', padding: 50, animate: true, animationDuration: 500 }
        return { name: 'grid' }
    }

    const style = [
        {
            selector: 'node',
            style: {
                'background-color': 'data(color)',
                'label': 'data(label)',
                'width': 'data(size)',
                'height': 'data(size)',
                'font-size': 'data(fontSize)',
                'font-weight': 'bold',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'text-outline-width': 2,
                'text-outline-color': '#000',
                'text-outline-opacity': 0.3,
                'overlay-padding': '8px',
                'z-index': 10,
                'shape': 'data(shape)',
                'text-wrap': 'wrap',
                'text-max-width': '100px',
                'shadow-blur': 10,
                'shadow-color': '#000',
                'shadow-opacity': 0.2
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 2,
                'line-color': '#cbd5e1', // Slate-300
                'target-arrow-color': '#cbd5e1',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'arrow-scale': 1.2,
                'opacity': 0.8
            }
        },
        {
            selector: 'node:selected',
            style: {
                'border-width': 4,
                'border-color': '#fff',
                'border-opacity': 1,
                'shadow-blur': 20,
                'shadow-color': 'data(color)',
                'shadow-opacity': 0.6
            }
        }
    ]

    const handleZoomIn = () => {
        if (cyRef) {
            cyRef.zoom({
                level: cyRef.zoom() * 1.2,
                position: { x: cyRef.width() / 2, y: cyRef.height() / 2 }
            })
        }
    }

    const handleZoomOut = () => {
        if (cyRef) {
            cyRef.zoom({
                level: cyRef.zoom() * 0.8,
                position: { x: cyRef.width() / 2, y: cyRef.height() / 2 }
            })
        }
    }

    const handleFit = () => {
        if (cyRef) cyRef.fit()
    }

    return (
        <div className="w-full h-full bg-panel rounded-3xl border border-border overflow-hidden relative shadow-inner group">
            {/* Legend Overlay */}
            <div className="absolute top-6 left-6 z-10 bg-bg/90 backdrop-blur-xl p-4 rounded-2xl border border-border shadow-lg text-xs transition-opacity opacity-80 hover:opacity-100">
                <div className="font-black uppercase tracking-widest text-text-muted mb-3 opacity-70">Leyenda</div>
                <div className="space-y-2">
                    <LegendItem color="bg-purple-600" label="Pilar (N1)" icon="hexagon" />
                    <LegendItem color="bg-blue-500" label="Subcomponente (N2)" />
                    <LegendItem color="bg-emerald-500" label="Competencia (N3)" />
                    <LegendItem color="bg-amber-500" label="Conducta (N4)" />
                </div>
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
                <div className="bg-bg/90 backdrop-blur-xl p-1.5 rounded-2xl border border-border shadow-lg flex flex-col gap-1">
                    <ControlButton onClick={handleZoomIn} label="+" title="Zoom In" />
                    <ControlButton onClick={handleZoomOut} label="-" title="Zoom Out" />
                    <ControlButton onClick={handleFit} label="⤢" title="Fit to Screen" />
                </div>

                <div className="bg-bg/90 backdrop-blur-xl p-1.5 rounded-2xl border border-border shadow-lg flex flex-col gap-1 mt-2">
                    <div className="text-[9px] font-black uppercase text-center text-text-muted py-1 opacity-50 tracking-widest">Layout</div>
                    <LayoutButton active={currentLayout === 'dagre'} onClick={() => setCurrentLayout('dagre')} label="Tree" />
                    <LayoutButton active={currentLayout === 'cose'} onClick={() => setCurrentLayout('cose')} label="Organic" />
                    <LayoutButton active={currentLayout === 'breadthfirst'} onClick={() => setCurrentLayout('breadthfirst')} label="Circle" />
                </div>
            </div>

            <CytoscapeComponent
                elements={elements}
                style={{ width: '100%', height: '100%' }}
                cy={(cy) => setCyRef(cy)}
                layout={getLayoutConfig(currentLayout)}
                stylesheet={style as any}
                minZoom={0.2}
                maxZoom={3}
                wheelSensitivity={0.3}
                className="bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-80"
            />
        </div>
    )
}

function LegendItem({ color, label, icon }: { color: string, label: string, icon?: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${color} ${icon === 'hexagon' ? 'clip-hexagon' : 'rounded-full'} shadow-sm`}></div>
            <span className="font-bold text-text-main">{label}</span>
        </div>
    )
}

function ControlButton({ onClick, label, title }: { onClick: () => void, label: string, title: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-panel hover:bg-accent hover:text-white text-text-muted font-bold transition-all active:scale-90"
        >
            {label}
        </button>
    )
}

function LayoutButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-12 py-1.5 text-[10px] font-bold rounded-lg transition-all ${active
                ? 'bg-accent text-white shadow-md'
                : 'text-text-muted hover:bg-panel hover:text-text-main'
                }`}
        >
            {label}
        </button>
    )
}
