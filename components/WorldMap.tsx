import React from 'react';

// Simplified World Map SVG Paths (Low res for performance but recognizable)
// Using a dot-matrix style or simple paths for a "modern/tech" look as requested by the 4Shine aesthetic.
// Actually, let's use a nice SVG path set for continents.

const REGIONS = {
    na: "M100,50 L120,50 L130,80 L110,100 L50,80 Z", // Rough North America placeholder shape if we were drawing manually... 
    // Better approach: Use a pre-defined SVG path for the world.
};

// Since we don't have a topojson library, we'll use a standard SVG path representation of the world.
// I will use a simplified "Dot Map" or "Stylized Map" concept which is easier to implement without 500kb of path data.
// Or I can use a standard open-source SVG path string for the world.

const WorldMap = ({ data }: { data: { name: string, value: number }[] }) => {
    // 1. normalize data to find active regions
    const activeRegions = new Set<string>();
    data.forEach(d => {
        const name = d.name.toLowerCase();
        if (name.includes('global') || name.includes('world')) {
            ['na', 'sa', 'eu', 'af', 'as', 'oc'].forEach(r => activeRegions.add(r));
        }
        if (name.includes('north america') || name.includes('usa') || name.includes('canada') || name.includes('mexico')) activeRegions.add('na');
        if (name.includes('south america') || name.includes('latam') || name.includes('brazil') || name.includes('colombia') || name.includes('argentina') || name.includes('peru') || name.includes('chile')) activeRegions.add('sa');
        if (name.includes('europe') || name.includes('eu') || name.includes('uk') || name.includes('germany') || name.includes('france') || name.includes('spain')) activeRegions.add('eu');
        if (name.includes('africa')) activeRegions.add('af');
        if (name.includes('asia') || name.includes('china') || name.includes('japan') || name.includes('india')) activeRegions.add('as');
        if (name.includes('oceania') || name.includes('australia')) activeRegions.add('oc');
    });

    const getColor = (region: string) => activeRegions.has(region) ? '#00C49F' : '#E5E7EB'; // Accent vs Gray
    const getOpacity = (region: string) => activeRegions.has(region) ? 1 : 0.3;

    return (
        <svg viewBox="0 0 1000 500" className="w-full h-full">
            {/* North America */}
            <path
                d="M150,60 L280,60 L320,150 L250,220 L120,120 Z"
                fill={getColor('na')} opacity={getOpacity('na')}
                className="transition-all duration-500 hover:opacity-80"
                style={{ filter: activeRegions.has('na') ? 'drop-shadow(0 0 8px rgba(0, 196, 159, 0.4))' : 'none' }}
            />
            {/* South America */}
            <path
                d="M260,230 L340,230 L320,400 L280,450 L240,350 Z"
                fill={getColor('sa')} opacity={getOpacity('sa')}
                className="transition-all duration-500 hover:opacity-80"
                style={{ filter: activeRegions.has('sa') ? 'drop-shadow(0 0 8px rgba(0, 196, 159, 0.4))' : 'none' }}
            />
            {/* Europe */}
            <path
                d="M450,70 L550,70 L530,140 L440,130 Z"
                fill={getColor('eu')} opacity={getOpacity('eu')}
                className="transition-all duration-500 hover:opacity-80"
                style={{ filter: activeRegions.has('eu') ? 'drop-shadow(0 0 8px rgba(0, 196, 159, 0.4))' : 'none' }}
            />
            {/* Africa */}
            <path
                d="M440,150 L560,150 L580,250 L500,350 L420,250 Z"
                fill={getColor('af')} opacity={getOpacity('af')}
                className="transition-all duration-500 hover:opacity-80"
                style={{ filter: activeRegions.has('af') ? 'drop-shadow(0 0 8px rgba(0, 196, 159, 0.4))' : 'none' }}
            />
            {/* Asia */}
            <path
                d="M570,70 L850,70 L900,250 L750,300 L600,200 L570,140 Z"
                fill={getColor('as')} opacity={getOpacity('as')}
                className="transition-all duration-500 hover:opacity-80"
                style={{ filter: activeRegions.has('as') ? 'drop-shadow(0 0 8px rgba(0, 196, 159, 0.4))' : 'none' }}
            />
            {/* Oceania */}
            <path
                d="M750,320 L900,320 L880,450 L780,450 Z"
                fill={getColor('oc')} opacity={getOpacity('oc')}
                className="transition-all duration-500 hover:opacity-80"
                style={{ filter: activeRegions.has('oc') ? 'drop-shadow(0 0 8px rgba(0, 196, 159, 0.4))' : 'none' }}
            />

            {/* Labels overlay or Legend if needed, but the visual highlighting explains it */}
            <text x="50" y="450" fontSize="12" fill="#999" fontFamily="sans-serif">
                * Mapa esquemático de impacto
            </text>
        </svg>
    );
};

export default WorldMap;
