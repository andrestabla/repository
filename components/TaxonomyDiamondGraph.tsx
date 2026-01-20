'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { ZoomIn, ZoomOut, Maximize, RefreshCw } from 'lucide-react'

type TaxonomyItem = {
    id: string
    name: string
    type: string
    active: boolean
    children?: TaxonomyItem[]
}

type Props = {
    data: TaxonomyItem[]
    focus: 'ALL' | 'Shine Within' | 'Shine Out' | 'Shine Up' | 'Shine Beyond'
}

export default function TaxonomyDiamondGraph({ data, focus }: Props) {
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

    useEffect(() => {
        const updateDims = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                })
            }
        }
        window.addEventListener('resize', updateDims)
        updateDims()
        return () => window.removeEventListener('resize', updateDims)
    }, [])

    useEffect(() => {
        if (!data || !svgRef.current) return

        const svg = d3.select(svgRef.current)
        svg.selectAll('*').remove() // Clear previous

        const { width, height } = dimensions
        const centerX = width / 2
        const centerY = height / 2

        // Create Zoom Group
        const g = svg.append('g')

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform)
            })

        svg.call(zoom)
        // Initial Center
        svg.call(zoom.transform, d3.zoomIdentity.translate(centerX, centerY).scale(0.8))


        // --- CONFIGURATION ---
        // Pillar Order & Colors
        // Mapping pillars to quadrants/directions
        // Shine Up (Top), Shine Within (Right), Shine Out (Bottom), Shine Beyond (Left) ??
        // Let's deduce from user text or use logical ordering.
        // Given visual diamond: Up, Right, Down, Left seems natural.

        const pillars = [
            { name: 'Shine Up', color: '#10b981', angle: -90 }, // Top
            { name: 'Shine Within', color: '#8b5cf6', angle: 0 }, // Right
            { name: 'Shine Out', color: '#3b82f6', angle: 90 }, // Bottom
            { name: 'Shine Beyond', color: '#f59e0b', angle: 180 } // Left
        ]

        // --- HIERARCHY PROCESSING ---
        // We need to flatten the tree into nodes with polar coordinates (angle, radius)

        const nodes: any[] = []
        const links: any[] = []

        // RADIUS DEFINITIONS
        const R_CORE = 0
        const R_PILLAR = 60 // The Diamond vertices
        const R_SUB = 180
        const R_COMP = 320
        const R_BEH = 450

        // Helper to convert polar to cartesian
        const getXY = (angleDeg: number, radius: number) => {
            const angleRad = (angleDeg - 90) * (Math.PI / 180) // -90 to start at 12 o'clock if 0 was 3 o'clock? 
            // Actually, let's use standard trig: 0 is Right (3oclock).
            // angleDeg input is already adjusted in pillars array
            const rad = angleDeg * (Math.PI / 180)
            return {
                x: Math.cos(rad) * radius,
                y: Math.sin(rad) * radius
            }
        }

        // Draw Center Diamond Background
        // Points: (0, -R), (R, 0), (0, R), (-R, 0)
        // Correction: The DIAMOND connects the centers of the pillars? 
        // Or the pillars ARE the corners. Let's assume Pillars are corners.
        // Actually, if pillars are quadrants, the diamond faces are the spaces between them?
        // Let's stick to: Pillars are the MAIN AXES for now.

        // Let's modify: Pillar Nodes are at (Angle, 100), forming a cross. 
        // Connecting them forms a diamond.

        pillars.forEach((p, i) => {
            const pillarNode = data.find(d => d.name === p.name)
            if (!pillarNode) return

            // If FOCUS mode is active, only process the relevant pillar
            if (focus !== 'ALL' && focus !== p.name) return

            // Calculate Angle Span for this Pillar
            // If ALL: 90 degrees per pillar. -45 to +45 relative to main angle?
            // If Single: 360 degrees available? Or keep original position?
            // "Gráfica específica" usually implies expanded view. 
            // Let's keep position consistent to avoid disorientation, but maybe hide others.

            const baseAngle = p.angle
            const sectorWidth = focus === 'ALL' ? 90 : 360 // Use full circle if focused? Maybe just keep it simple first.
            const pNode = {
                ...pillarNode,
                x: getXY(baseAngle, R_PILLAR).x,
                y: getXY(baseAngle, R_PILLAR).y,
                color: p.color,
                level: 'Pillar',
                baseAngle
            }
            nodes.push(pNode)

            // SUBCOMPONENTS
            if (pillarNode.children) {
                const subs = pillarNode.children
                const step = sectorWidth / (subs.length + 1) // Distribute within sector
                // Start angle
                const startA = baseAngle - (sectorWidth / 2)

                subs.forEach((sub, j) => {
                    // Angle
                    const subAngle = startA + (step * (j + 1))
                    const subPos = getXY(subAngle, R_SUB)
                    const sNode = {
                        ...sub,
                        x: subPos.x,
                        y: subPos.y,
                        color: p.color, // Inherit
                        level: 'Sub',
                        baseAngle: subAngle
                    }
                    nodes.push(sNode)
                    links.push({ source: pNode, target: sNode })

                    // COMPETENCES
                    if (sub.children) {
                        const comps = sub.children
                        // Range for this subcomponent? Be narrower.
                        const subSector = step * 0.8
                        const subStep = subSector / (comps.length + 1)
                        const subStart = subAngle - (subSector / 2)

                        comps.forEach((comp, k) => {
                            const compAngle = subStart + (subStep * (k + 1))
                            const compPos = getXY(compAngle, R_COMP)
                            const cNode = {
                                ...comp,
                                x: compPos.x,
                                y: compPos.y,
                                color: p.color,
                                level: 'Comp',
                                baseAngle: compAngle
                            }
                            nodes.push(cNode)
                            links.push({ source: sNode, target: cNode })

                            // BEHAVIORS
                            if (comp.children) {
                                const behs = comp.children
                                const compSector = subStep * 0.8
                                const behStep = compSector / (behs.length + 1)
                                const behStart = compAngle - (compSector / 2)

                                behs.forEach((beh, l) => {
                                    const behAngle = behStart + (behStep * (l + 1))
                                    const behPos = getXY(behAngle, R_BEH)
                                    const bNode = {
                                        ...beh,
                                        x: behPos.x,
                                        y: behPos.y,
                                        color: p.color,
                                        level: 'Beh',
                                        baseAngle: behAngle
                                    }
                                    nodes.push(bNode)
                                    links.push({ source: cNode, target: bNode })
                                })
                            }
                        })
                    }
                })
            }
        })


        // --- RENDERING ---

        // Central Diamond Marker (Visual only)
        if (focus === 'ALL') {
            const diamondPoints = [
                getXY(-90, R_PILLAR), // Top
                getXY(0, R_PILLAR),   // Right
                getXY(90, R_PILLAR),  // Bottom
                getXY(180, R_PILLAR)  // Left
            ].map(p => `${p.x},${p.y}`).join(' ')

            g.append('polygon')
                .attr('points', diamondPoints)
                .attr('fill', '#fff')
                .attr('fill-opacity', 0.05)
                .attr('stroke', '#cbd5e1')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '4')
        }

        // Concentric Rings (Visual Guide)
        const rings = [R_SUB, R_COMP, R_BEH]
        rings.forEach((r, i) => {
            g.append('circle')
                .attr('r', r)
                .attr('fill', 'none')
                .attr('stroke', '#333')
                .attr('stroke-opacity', 0.05)
                .attr('stroke-dasharray', '2')
        })

        // Links
        g.selectAll('.link')
            .data(links)
            .enter()
            .append('line')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)
            .attr('stroke', '#cbd5e1') // Light gray
            .attr('stroke-width', 0.5)
            .attr('opacity', 0.6)

        // Nodes
        const nodeGroup = g.selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .attr('class', 'node cursor-pointer group')

        // Node Shapes
        nodeGroup.each(function (d) {
            const el = d3.select(this)
            if (d.level === 'Pillar') {
                // Diamond Shape for Pillars
                el.append('rect')
                    .attr('width', 40)
                    .attr('height', 40)
                    .attr('x', -20)
                    .attr('y', -20)
                    .attr('fill', d.color)
                    .attr('transform', 'rotate(45)') // Rotate to make it diamond
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 2)
                    .attr('class', 'drop-shadow-md')
            } else {
                // Dots for others
                const size = d.level === 'Sub' ? 8 : d.level === 'Comp' ? 5 : 3
                el.append('circle')
                    .attr('r', size)
                    .attr('fill', d.color) // Inherit pillar color
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1)
            }

            // Labels
            // Only show label if level is Pillar or Sub? Behavior might be too crowded
            if (d.level !== 'Beh' || focus !== 'ALL') {
                const angle = d.baseAngle // -180 to 180
                const isLeft = angle > 90 || angle < -90

                el.append('text')
                    .text(d.name)
                    .attr('x', isLeft ? -15 : 15)
                    .attr('y', 4)
                    .attr('text-anchor', isLeft ? 'end' : 'start')
                    .attr('font-size', d.level === 'Pillar' ? 14 : 10)
                    .attr('font-weight', d.level === 'Pillar' ? '900' : '500')
                    .attr('fill', d.level === 'Pillar' ? d.color : '#64748b')
                    .attr('class', 'select-none pointer-events-none transition-opacity')
                    .style('text-transform', d.level === 'Pillar' ? 'uppercase' : 'none')
            }
        })

    }, [data, dimensions, focus])

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-white/50">
            <svg ref={svgRef} width="100%" height="100%" className="cursor-grab active:cursor-grabbing"></svg>
            <div className="absolute bottom-4 right-4 text-[10px] text-text-muted opacity-50 font-mono">
                D3 Rendered · {focus} Mode
            </div>
        </div>
    )
}
