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
    let arrowColorAttr = '';
    switch (this.arrowType) {
      case ArrowType.import:
        arrowColorAttr = `, color: "${this.config.importEdgeColor}"`;
        break;
      case ArrowType.export:
        arrowColorAttr = `, color: "${this.config.exportEdgeColor}"`;
        break;
      default:
        arrowColorAttr = '';
        break;
    }
    return `{from: "${this.source}", to: "${this.target}", arrows: arrowAttr ${arrowColorAttr} }`;
  }
}
