import React, { memo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Manual mapping of region keywords to ISO-3 numeric codes (simplified subset)
// Standard codes: USA=840, CAN=124, BRA=076, COL=170, etc.
// Since we don't want to maintain a massive map, we'll check against continents if possible, 
// or just mapping key major countries for the "Region" visual.

const MAPPING: Record<string, string[]> = {
    "na": ["840", "124", "484"], // USA, Canada, Mexico
    "sa": ["076", "170", "032", "152", "604", "862", "858", "068"], // Brazil, Colombia, Argentina, Chile, Peru, Venezuela, Uruguay, Bolivia
    "eu": ["250", "276", "380", "724", "826", "620", "528", "056", "372", "752", "246"], // France, DE, IT, ES, UK, PT, NL, BE, IE, SE, FI
    "as": ["156", "392", "356", "360", "410", "702", "764", "608"], // CN, JP, IN, ID, KR, SG, TH, PH
    "oc": ["036", "554"], // AU, NZ
    "af": ["710", "818", "566", "231"] // ZA, EG, NG, ET
};

const WorldMap = ({ data }: { data: { name: string, value: number }[] }) => {

    // Identify active zones
    const activeZones = new Set<string>();

    data.forEach(d => {
        const name = d.name.toLowerCase();
        // Global = All
        if (name.includes('global') || name.includes('world') || name.includes('mundial')) {
            ['na', 'sa', 'eu', 'as', 'oc', 'af'].forEach(k => activeZones.add(k));
        }

        // Regions
        if (name.includes('north america') || name.includes('usa') || name.includes('canada')) activeZones.add('na');
        if (name.includes('latam') || name.includes('south america')) activeZones.add('sa');
        if (name.includes('europe')) activeZones.add('eu');
        if (name.includes('asia')) activeZones.add('as');
        if (name.includes('africa')) activeZones.add('af');

        // Specific Countries override (basic check)
        if (name.includes('colombia')) activeZones.add('170');
        if (name.includes('canada')) activeZones.add('124');
    });

    // Helper to check if a country ISO is active
    const isActive = (geoId: string) => {
        // Direct ID match?
        if (activeZones.has(geoId)) return true;

        // In an active region?
        for (const zone of Array.from(activeZones)) {
            if (MAPPING[zone]?.includes(geoId)) return true;
        }
        return false;
    };

    return (
        <div className="w-full h-full" data-tip="">
            <ComposableMap projectionConfig={{ scale: 200, center: [0, 0] }} style={{ width: "100%", height: "100%" }}>
                <ZoomableGroup>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const isHighlighted = isActive(geo.id);
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={isHighlighted ? "#00C49F" : "#E5E7EB"}
                                        stroke="#D1D5DB"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none", transition: "all 250ms" },
                                            hover: { fill: isHighlighted ? "#00A885" : "#D1D5DB", outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
        </div>
    );
};

export default memo(WorldMap);
