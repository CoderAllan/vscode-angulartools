import { ArrowType } from "@model";
import { Config } from "@src";

export class Edge {
    private config: Config = new Config();
    constructor(id: string, source: string, target: string, arrowType: ArrowType = ArrowType.none) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.arrowType = arrowType;
    }
    public id: string;
    public source: string;
    public target: string;
    public arrowType: ArrowType;
    public mutualEdgeCount: number = 1;
    public showPopupsOverNodesAndEdges: boolean = true;

    public toJsonString(): string {
        let arrowColorAttr = `, color: "${this.getEdgeTypeColor(this.arrowType)}"`;
        const jsStringProperties: string[] = [
            `from: "${this.source}"`,
            `to: "${this.target}"`,
            `arrows: arrowAttr${arrowColorAttr}`
        ];
        if (this.mutualEdgeCount > 1) {
            jsStringProperties.push(`smooth: {type: 'curvedCW', roundness: 0.2}`);
        } else {
            jsStringProperties.push(`smooth: false`);
        }
        if (this.showPopupsOverNodesAndEdges) {
            const title = this.getEdgeTitle();
            jsStringProperties.push(`title: "${title}"`);
        }
        return `{${jsStringProperties.join(', ')}}`;
    }

    public toGraphViz(): string {
        const regex = /\W/g;
        const source = this.source.replace(regex, '_');
        const target = this.target.replace(regex, '_');
        const attributes: string[] = [];
        const color = this.getEdgeTypeColor(this.arrowType);
        if (color) {
            attributes.push(`color="${color}"`);
        }
        let attributesStr: string = '';
        if (attributes.length > 0) {
            attributesStr = ` [${attributes.join(', ')}]`;
        }
        return `${source} -> ${target}${attributesStr};`;
    }

    public getEdgeTypeColor(arrowType: ArrowType): string {
        let edgeTypeColor = '';
        switch (arrowType) {
            case ArrowType.import:
                edgeTypeColor = this.config.importEdgeColor;
                break;
            case ArrowType.export:
                edgeTypeColor = this.config.exportEdgeColor;
                break;
            case ArrowType.injectable:
                edgeTypeColor = this.config.injectableEdgeColor;
                break;
            case ArrowType.uses:
                edgeTypeColor = this.config.usesEdgeColor;
                break;
            case ArrowType.route:
                edgeTypeColor = this.config.routeEdgeColor;
                break;
            default:
                edgeTypeColor = '';
                break;
        }
        return edgeTypeColor;
    }
    public getEdgeTitle() {
        switch (this.arrowType) {
            case ArrowType.import:
                return `${this.target} imports ${this.source}`;
            case ArrowType.export:
                return `${this.target} exports ${this.source}`;
            case ArrowType.injectable:
                return `${this.source} injected into ${this.target}`;
            case ArrowType.uses:
                return `${this.target} uses ${this.source}`;
            case ArrowType.route:
                return `${this.target} routes to ${this.source}`;
            default:
                return '';
        }
    }
}
