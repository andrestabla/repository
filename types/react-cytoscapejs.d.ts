declare module 'react-cytoscapejs' {
    import { Component } from 'react'
    import cytoscape from 'cytoscape'

    export interface CytoscapeComponentProps {
        id?: string;
        className?: string;
        style?: React.CSSProperties;
        stylesheet?: cytoscape.Stylesheet[];
        elements: cytoscape.ElementDefinition[];
        layout?: cytoscape.LayoutOptions;
        cy?: (cy: cytoscape.Core) => void;
        minZoom?: number;
        maxZoom?: number;
        userZoomingEnabled?: boolean;
        wheelSensitivity?: number;
    }

    export default class CytoscapeComponent extends Component<CytoscapeComponentProps> {
        static normalizeElements(data: any): any;
    }
}

declare module 'cytoscape-dagre';
