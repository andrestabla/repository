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

            if (node.type === 'Pillar') {
                nodeColor = '#7e22ce' // Purple (Accent)
                nodeSize = 60
                fontSize = 14
                label = node.name.toUpperCase()
            } else if (node.type === 'Subcomponent') { // Level 2
                nodeColor = '#3b82f6' // Blue
                nodeSize = 40
                fontSize = 12
            } else if (node.type === 'Competence') { // Level 3
                nodeColor = '#10b981' // Emerald
                nodeSize = 20
                fontSize = 10
            } else if (node.type === 'Behavior') { // Level 4
                nodeColor = '#f59e0b' // Amber
                nodeSize = 15
                fontSize = 8
            }

            // Add Node
            nodes.push({
                data: {
                    id: node.id,
                    label: label,
                    type: node.type,
                    color: nodeColor,
                    size: nodeSize,
                    fontSize: fontSize
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

    const layout = {
        name: 'dagre',
        rankDir: 'TB', // Top to Bottom
        spacingFactor: 1.2,
        animate: true,
        animationDuration: 500
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
                'color': '#fff', // White text for dark mode compatibility (or contrasting)
                'text-valign': 'center',
                'text-halign': 'center',
                'text-outline-width': 2,
                'text-outline-color': '#000',
                'text-outline-opacity': 0.5,
                'overlay-padding': '6px',
                'z-index': 10
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 2,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
            }
        },
        {
            selector: 'node:selected',
            style: {
                'border-width': 4,
                'border-color': '#fff',
                'border-opacity': 0.8
            }
        }
    ]

    return (
        <div className="w-full h-full bg-panel rounded-2xl border border-border overflow-hidden relative shadow-inner">
            <div className="absolute top-4 left-4 z-10 bg-bg/80 backdrop-blur-md p-3 rounded-xl border border-border text-xs shadow-sm">
                <div className="font-bold mb-2">Leyenda</div>
                <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-purple-700"></div>Pilar (N1)</div>
                <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div>Subcomponente (N2)</div>
                <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div>Competencia (N3)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div>Conducta (N4)</div>
            </div>

            <CytoscapeComponent
                elements={elements}
                style={{ width: '100%', height: '100%' }}
                layout={layout}
                stylesheet={style as any}
                minZoom={0.2}
                maxZoom={3}
                wheelSensitivity={0.3}
            />
        </div>
    )
}
