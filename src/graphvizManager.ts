import { Edge, Node } from "@model";

export class GraphVizManager {

  public createGraphVizDiagram(graphType: string, nodes: Node[], edges: Edge[]): string {
    const digraphNodes = this.generateDigraphNodes(nodes);
    const digraphEdges = this.generateDigraphEdges(edges);
    const graphVizDigraph = this.addRootNode(graphType, digraphNodes, digraphEdges);

    return graphVizDigraph;
  }
  private addRootNode(graphType: string, digraphNodes: string, digraphEdges: string): string  {
    return `digraph ${graphType} {\n   ${digraphNodes}\n   ${digraphEdges}\n}`;
  }
  private generateDigraphNodes(nodes: Node[]): string {
    return nodes.map(node => node.toGraphViz()).join('\n   ');
  }
  private generateDigraphEdges(edges: Edge[]): string {
    return edges.map(edge => edge.toGraphViz()).join('\n   ');
  }
}

