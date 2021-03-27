import { NodeType, Project } from "@model";
import { Config } from "@src";

export class Node {
  private config: Config = new Config();
  constructor(id: string, name: string, isRoot: boolean, nodeType: NodeType = NodeType.none) {
    this.id = id;
    this.name = name;
    this.isRoot = isRoot;
    this.nodeType = nodeType;
  }
  public id: string;
  public name: string;
  public isRoot: boolean;
  public nodeType: NodeType;

  public toJsonString(): string {
    let nodeColorAttr = '';
    switch (this.nodeType) {
      case NodeType.rootNode:
        nodeColorAttr = `, color: "${this.config.rootNodeBackgroundColor}", shape: "${this.config.visNodeShape}"`;
        break;
      case NodeType.component:
        nodeColorAttr = `, color: "${this.config.componentNodeBackgroundColor}", shape: "${this.config.componentNodeShape}"`;
        break;
      case NodeType.module:
        nodeColorAttr = `, color: "${this.config.moduleNodeBackgroundColor}", shape: "${this.config.moduleNodeShape}"`;
        break;
      case NodeType.pipe:
        nodeColorAttr = `, color: "${this.config.pipeNodeBackgroundColor}", shape: "${this.config.pipeNodeShape}"`;
        break;
      case NodeType.directive:
        nodeColorAttr = `, color: "${this.config.directiveNodeBackgroundColor}", shape: "${this.config.directiveNodeShape}"`;
        break;
      default:
        nodeColorAttr = '';
        break;
    }
    const label = this.config.maximumNodeLabelLength !== -1 && this.name.length > this.config.maximumNodeLabelLength ? this.name.substr(0, this.config.maximumNodeLabelLength) + '...' : this.name;
    return `{id: "${this.id}", label: "${label}" ${nodeColorAttr}}`;
  }

  public static getNodeType(project: Project, className: string) {
    let nodeType = NodeType.none;
    if (project.moduleNames.has(className) || className.endsWith('Module') || className.includes("Module.")) {
      nodeType = NodeType.module;
    }
    else if (project.components.has(className) || className.endsWith('Component')) {
      nodeType = NodeType.component;
    }
    else if (project.directives.has(className) || className.endsWith('Directive')) {
      nodeType = NodeType.directive;
    }
    else if (project.pipes.has(className) || className.endsWith('Pipe')) {
      nodeType = NodeType.pipe;
    }
    else if (project.injectables.has(className)) {
      nodeType = NodeType.injectable;
    }
    return nodeType;
  }
}