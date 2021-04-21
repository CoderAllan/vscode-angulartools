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
    const jsStringProperties: string[] = [];
    jsStringProperties.push(`id: "${this.id}"`);
    const label = this.config.maximumNodeLabelLength !== -1 && this.name.length > this.config.maximumNodeLabelLength ? this.name.substr(0, this.config.maximumNodeLabelLength) + '...' : this.name;
    jsStringProperties.push(`label: "${label}"`);
    jsStringProperties.push(`color: "${this.getNodeTypeColor(this.nodeType)}"`);
    switch (this.nodeType) {
      case NodeType.rootNode:
        jsStringProperties.push(`shape: "${this.config.rootNodeShape}"`);
        break;
      case NodeType.component:
        jsStringProperties.push(`shape: "${this.config.componentNodeShape}"`);
        break;
      case NodeType.module:
        jsStringProperties.push(`shape: "${this.config.moduleNodeShape}"`);
        break;
      case NodeType.pipe:
        jsStringProperties.push(`shape: "${this.config.pipeNodeShape}"`);
        break;
      case NodeType.directive:
        jsStringProperties.push(`shape: "${this.config.directiveNodeShape}"`);
        break;
      case NodeType.injectable:
        jsStringProperties.push(`shape: "${this.config.injectableNodeShape}"`);
        break;
      default:
        break;
    }
    if (this.position !== undefined && this.position.x !== undefined && this.position.y !== undefined) { jsStringProperties.push(`x: ${this.position.x}, y: ${this.position.y}, fixed: { x: true, y: true}`); }
    return `{ ${jsStringProperties.join(', ')} }`;
  }

  public toGraphViz(): string {
    const regex = /\W/g;
    const id = this.id.replace(regex, '_');
    const attributes: string[] = [];
    const label = this.config.maximumNodeLabelLength !== -1 && this.name.length > this.config.maximumNodeLabelLength ? this.name.substr(0, this.config.maximumNodeLabelLength) + '...' : this.name;
    attributes.push(`label=<${label}>`);
    attributes.push('shape="box"');
    attributes.push(`style="filled,rounded"`);
    const color = this.getNodeTypeColor(this.nodeType);
    if (color) {
      attributes.push(`color="${color}"`);
    }
    if (this.position !== undefined) {
      const x = this.position.x;
      const y = this.position.y;
      attributes.push(`pos="${x},${y}"`);
    }
    let attributesStr: string = '';
    if (attributes.length > 0) {
      attributesStr = ` [${attributes.join(', ')}]`;
    }
    return `${id}${attributesStr};`;
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