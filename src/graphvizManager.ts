import { Edge, NetworkNode, Node, Position } from "@model";

export class GraphVizManager {

  public createGraphVizDiagram(graphType: string, nodes: Node[], nodeInfoDictionary: { [id: string]: NetworkNode }, edges: Edge[]): string {
    const maxX = Math.max(...Object.keys(nodeInfoDictionary).map(id => nodeInfoDictionary[id].position.x));
    const minX = Math.min(...Object.keys(nodeInfoDictionary).map(id => nodeInfoDictionary[id].position.x));
    const diffX = Math.max(...[Math.abs(maxX),Math.abs(minX)]);
    const maxY = Math.max(...Object.keys(nodeInfoDictionary).map(id => nodeInfoDictionary[id].position.y));
    const minY = Math.min(...Object.keys(nodeInfoDictionary).map(id => nodeInfoDictionary[id].position.y));
    const diffY = Math.max(...[Math.abs(maxY),Math.abs(minY)]);

    nodes.forEach(node => {
      if(node.id in nodeInfoDictionary){
        const networkNode = nodeInfoDictionary[node.id];
        if (networkNode.label) {
          node.name = networkNode.label;
        }
        if (node.id in nodeInfoDictionary) {
          node.position = {x: Math.round(((networkNode.position.x + diffX) / maxX) * nodes.length), y: Math.round(((networkNode.position.y + diffY) / maxY) * nodes.length)};
        }
      }
    });
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

