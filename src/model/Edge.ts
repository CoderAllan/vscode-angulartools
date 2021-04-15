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

  public toJsonString(): string {
    let arrowColorAttr = `, color: "${this.getEdgeTypeColor(this.arrowType)}"`;
    return `{from: "${this.source}", to: "${this.target}", arrows: arrowAttr${arrowColorAttr} }`;
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
