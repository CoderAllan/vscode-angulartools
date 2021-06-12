import { Position } from "./Position";

export class GraphState {
  constructor() {
    this.nodePositions = {};
  }
  public graphLayout: string = "hubsize";
  public graphDirection: string = "Random";
  public networkSeed: string | undefined;
  public nodePositions: { [id: string]: Position };
  public showHierarchicalOptions: boolean = false;
}