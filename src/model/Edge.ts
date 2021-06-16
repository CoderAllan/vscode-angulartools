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
      switch (this.arrowType) {
        case ArrowType.injectable:
          jsStringProperties.push(`title: "${this.source} injected into ${this.target}"`);
          break;
        case ArrowType.import:
          jsStringProperties.push(`title: "${this.target} imports ${this.source}"`);
          break;
        case ArrowType.export:
          jsStringProperties.push(`title: "${this.source} exports ${this.target}"`);
          break;
        case ArrowType.uses:
          jsStringProperties.push(`title: "${this.source} uses ${this.target}"`);
          break;
        default:
          break;
      }
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
      default:
        edgeTypeColor = '';
        break;
    }
    return edgeTypeColor;
  }
}
