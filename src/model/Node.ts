import { Attribute, BoundingBox, NodeType, Position, Project } from "@model";
import { Config } from "@src";

export class Node {
  private config: Config = new Config();
  constructor(id: string, name: string, filename: string | undefined, isRoot: boolean, nodeType: NodeType = NodeType.none, position: Position | undefined = undefined, boundingBox: BoundingBox | undefined = undefined, attributes: Attribute[] = []) {
    this.id = id;
    this.name = name;
    this.tsFilename = filename;
    this.isRoot = isRoot;
    this.nodeType = nodeType;
    this.position = position;
    this.boundingBox = boundingBox;
    this.attributes = attributes;
  }
  public id: string;
  public name: string;
  public tsFilename: string | undefined;
  public isRoot: boolean;
  public position: Position | undefined;
  public boundingBox: BoundingBox | undefined;
  public nodeType: NodeType;
  public attributes: Attribute[];

  public toJsonString(): string {
    let nodeShapeAttr = '';
    switch (this.nodeType) {
      case NodeType.rootNode:
        nodeShapeAttr = `, shape: "${this.config.rootNodeShape}"`;
        break;
      case NodeType.component:
        nodeShapeAttr = `, shape: "${this.config.componentNodeShape}"`;
        break;
      case NodeType.module:
        nodeShapeAttr = `, shape: "${this.config.moduleNodeShape}"`;
        break;
      case NodeType.pipe:
        nodeShapeAttr = `, shape: "${this.config.pipeNodeShape}"`;
        break;
      case NodeType.directive:
        nodeShapeAttr = `, shape: "${this.config.directiveNodeShape}"`;
        break;
      case NodeType.injectable:
        nodeShapeAttr = `, shape: "${this.config.injectableNodeShape}"`;
        break;
      default:
        nodeShapeAttr = '';
        break;
    }
    const nodeColorAttr = `, color: "${this.getNodeTypeColor(this.nodeType)}"`;
    const label = this.config.maximumNodeLabelLength !== -1 && this.name.length > this.config.maximumNodeLabelLength ? this.name.substr(0, this.config.maximumNodeLabelLength) + '...' : this.name;
    return `{id: "${this.id}", label: "${label}"${nodeColorAttr}${nodeShapeAttr}}`;
  }

  public getNodeTypeColor(nodeType: NodeType): string {
    let nodeTypeColor = '';
    switch (nodeType) {
      case NodeType.rootNode:
        nodeTypeColor = this.config.rootNodeBackgroundColor;
        break;
      case NodeType.component:
        nodeTypeColor = this.config.componentNodeBackgroundColor;
        break;
      case NodeType.module:
        nodeTypeColor = this.config.moduleNodeBackgroundColor;
        break;
      case NodeType.pipe:
        nodeTypeColor = this.config.pipeNodeBackgroundColor;
        break;
      case NodeType.directive:
        nodeTypeColor = this.config.directiveNodeBackgroundColor;
        break;
      case NodeType.injectable:
        nodeTypeColor = this.config.injectableNodeBackgroundColor;
        break;
      default:
        nodeTypeColor = '';
        break;
    }
    return nodeTypeColor;
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