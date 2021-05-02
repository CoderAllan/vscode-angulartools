import { Position } from "./Position";

export class GraphState {
  constructor() {
    this.nodePositions = {};
  }
  public graphLayout: string | undefined;
  public graphDirection: string | undefined;
  public networkSeed: string | undefined;
  public nodePositions: { [id: string]: Position };
  public showHierarchicalOptions: boolean = false;
}