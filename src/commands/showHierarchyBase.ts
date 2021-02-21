import { CommandBase } from '@commands';
import { Config, FileSystemUtils } from '@src';
import { Base64 } from 'js-base64';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export enum NodeType {
  none,
  rootNode,
  component,
  module,
  pipe,
  directive
}
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
    const label = this.name.length > this.config.maximumNodeLabelLength ? this.name.substr(0, this.config.maximumNodeLabelLength) + '...' : this.name;
    return `{id: "${this.id}", label: "${label}" ${nodeColorAttr}}`;
  }
}

export enum ArrowType {
  none = 0,
  import = 1,
  export = 2
}

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

export class ShowHierarchyBase extends CommandBase {
  protected fsUtils: FileSystemUtils = new FileSystemUtils();
  protected config = new Config();
  protected extensionContext: vscode.ExtensionContext;
  protected nodes: Node[] = [];
  protected edges: Edge[] = [];
  protected templateJsFilename: string = 'showHierarchy_Template.js';
  protected templateHtmlFilename: string = 'showHierarchy_Template.html';
  protected showComponentHierarchyJsFilename: string = 'showComponentHierarchy.js';
  protected showModuleHierarchyJsFilename: string = 'showModuleHierarchy.js';
  protected showHierarchyCssFilename: string = 'showHierarchy.css';

  constructor(context: vscode.ExtensionContext) {
    super();
    this.extensionContext = context;
  }
  protected appendNodes = (nodeList: Node[]) => {
    nodeList.forEach(newNode => {
      if (!this.nodes.some(node => node.id === newNode.id)) {
        this.nodes = this.nodes.concat(newNode);
      }
    });
  };
  protected appendEdges = (edgeList: Edge[]) => {
    edgeList.forEach(newEdge => {
      if (!this.edges.some(edge => edge.source === newEdge.source && edge.target === newEdge.target)) {
        this.edges = this.edges.concat(newEdge);
      }
    });
  };

  protected getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  protected saveAsPng(pngFilename: string, messageText: string) {
    const dataUrl = messageText.split(',');
    if (dataUrl.length > 0) {
      const u8arr = Base64.toUint8Array(dataUrl[1]);

      const workspaceDirectory = this.fsUtils.getWorkspaceFolder();
      const newFilePath = path.join(workspaceDirectory, pngFilename);
      this.fsUtils.writeFile(newFilePath, u8arr, () => { });

      vscode.window.showInformationMessage(`The file ${pngFilename} has been created in the root of the workspace.`);
    }
  }

  
  protected generateHtmlContent(webview: vscode.Webview, outputJsFilename: string): string {
    let htmlContent = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', this.templateHtmlFilename)), 'utf8');

    const visPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'javascript', 'vis-network.min.js');
    const visUri = webview.asWebviewUri(visPath);
    htmlContent = htmlContent.replace('vis-network.min.js', visUri.toString());

    const cssPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'stylesheet', this.showHierarchyCssFilename);
    const cssUri = webview.asWebviewUri(cssPath);
    htmlContent = htmlContent.replace(this.showHierarchyCssFilename, cssUri.toString());

    const nonce = this.getNonce();
    htmlContent = htmlContent.replace('nonce-nonce', `nonce-${nonce}`);
    htmlContent = htmlContent.replace(/<script /g, `<script nonce="${nonce}" `);
    htmlContent = htmlContent.replace('cspSource', webview.cspSource);

    const jsPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, outputJsFilename);
    const jsUri = webview.asWebviewUri(jsPath);
    htmlContent = htmlContent.replace('showHierarchy.js', jsUri.toString());
    return htmlContent;
  }
}