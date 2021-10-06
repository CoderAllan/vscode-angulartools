import { Edge, NetworkNode, Node } from "@model";

export class GraphVizManager {

  public createGraphVizDiagram(graphType: string, nodes: Node[], nodeInfoDictionary: { [id: string]: NetworkNode }, edges: Edge[]): string {
    const graphVizNodes: Node[] = [];
    nodes.forEach(node => {
      const graphVizNode = Object.create(node);
      if(graphVizNode.id in nodeInfoDictionary){
        const networkNode = nodeInfoDictionary[graphVizNode.id];
        if (networkNode.label) {
          graphVizNode.name = networkNode.label;
        }
        if (graphVizNode.id in nodeInfoDictionary) {
          graphVizNode.position = { x: networkNode.position.x, y: -1 * networkNode.position.y};
        }
      }
      graphVizNodes.push(graphVizNode);
    });
    const digraphNodes = this.generateDigraphNodes(graphVizNodes);
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

