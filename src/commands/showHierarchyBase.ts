import { CommandBase } from '@commands';
import { Config, FileSystemUtils } from '@src';
import { Base64 } from 'js-base64';
import * as path from 'path';
import * as vscode from 'vscode';

export class Node {
  constructor(id: string, tsFilename: string, isRoot: boolean) {
    this.id = id;
    this.tsFilename = tsFilename;
    this.isRoot = isRoot;
  }
  public id: string;
  public tsFilename: string;
  public isRoot: boolean;

  public toJsonString(): string {
    return `{id: "${this.id}", label: "${this.id}"}`;
  }
}

export class Edge {
  constructor(id: string, source: string, target: string) {
    this.id = id;
    this.source = source;
    this.target = target;
  }
  public id: string;
  public source: string;
  public target: string;

  public toJsonString(): string {
    return `{from: "${this.source}", to: "${this.target}", arrows: arrowAttr }`;
  }
}

export class ShowHierarchyBase extends CommandBase {
  protected fsUtils: FileSystemUtils = new FileSystemUtils();
  protected config = new Config();
  protected extensionContext: vscode.ExtensionContext;
  protected nodes: Node[] = [];
  protected edges: Edge[] = [];

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
      this.fsUtils.writeFile(newFilePath, u8arr, () => {});

      vscode.window.showInformationMessage(`The file ${pngFilename} has been created in the root of the workspace.`);
    }
  }

}