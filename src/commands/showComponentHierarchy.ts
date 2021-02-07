import { CommandBase } from '@commands';
import { Component, ComponentManager, Config, FileSystemUtils } from '@src';
import * as fs from 'fs';
import { Base64 } from 'js-base64';
import * as path from 'path';
import * as vscode from 'vscode';

class Node {
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

class Edge {
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

export class ShowComponentHierarchy extends CommandBase {
  private config = new Config();
  private extensionContext: vscode.ExtensionContext;
  private fsUtils = new FileSystemUtils();
  private static readonly Name = 'showComponentHierarchy';
  constructor(context: vscode.ExtensionContext) {
    super();
    this.extensionContext = context;
  }
  public static get commandName(): string { return ShowComponentHierarchy.Name; }

  public execute(webview: vscode.Webview) {
    this.checkForOpenWorkspace();
    webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'saveAsPng':
            this.saveAsPng(message.text);
            return;
        }
      },
      undefined,
      this.extensionContext.subscriptions
    );

    var directoryPath: string = this.fsUtils.getWorkspaceFolder();
    const components = ComponentManager.findComponents(directoryPath);

    let nodes: Node[] = [];
    const appendNodes = (nodeList: Node[]) => {
      nodeList.forEach(newNode => {
        if (!nodes.some(node => node.id === newNode.id)) {
          nodes = nodes.concat(newNode);
        }
      });
    };
    let edges: Edge[] = [];
    const appendEdges = (edgeList: Edge[]) => {
      edgeList.forEach(newEdge => {
        if (!edges.some(edge => edge.source === newEdge.source && edge.target === newEdge.target)) {
          edges = edges.concat(newEdge);
        }
      });
    };
    this.addNodesAndEdges(components, appendNodes, appendEdges);

    const nodesJson = nodes
      .map((node, index, arr) => { return node.toJsonString(); })
      .join(',\n');
    const rootNodesJson = nodes
      .filter(node => node.isRoot)
      .map((node, index, arr) => { return '"' + node.id + '"'; })
      .join(',\n');
    const edgesJson = edges
      .map((edge, index, arr) => { return edge.toJsonString(); })
      .join(',\n');

    try {
      const jsContent = this.generateJavascriptContent(nodesJson, rootNodesJson, edgesJson);
      const outputJsFilename = ShowComponentHierarchy.Name + '.js';
      let htmlContent = this.generateHtmlContent(webview, outputJsFilename);

      //this.fsUtils.writeFile(this.extensionContext?.asAbsolutePath(path.join('out', ShowComponentHierarchy.Name + '.html')), htmlContent, () => { }); // For debugging
      this.fsUtils.writeFile(
        this.extensionContext?.asAbsolutePath(path.join('out', outputJsFilename)),
        jsContent,
        () => {
          webview.html = htmlContent;
        }
      );
    } catch (ex) {
      console.log('Angular Tools Exception:' + ex);
    }
  }

  private addNodesAndEdges(componentHash: { [selector: string]: Component; }, appendNodes: (nodeList: Node[]) => void, appendLinks: (edgeList: Edge[]) => void) {
    for (let selector in componentHash) {
      const component = componentHash[selector];
      if (component.isRoot) {
        this.generateDirectedGraphNodes(component.subComponents, component, true, '', appendNodes);
        this.generateDirectedGraphEdges(component.subComponents, selector, "", appendLinks);
      }
    }
  }

  private generateDirectedGraphNodes(components: Component[], component: Component, isRoot: boolean, parentSelector: string, appendNodes: (nodeList: Node[]) => void) {
    appendNodes([new Node(component.selector, component.templateFilename, isRoot)]);
    if (components.length > 0) {
      components.forEach((subComponent) => {
        if(parentSelector !== subComponent.selector) {
          this.generateDirectedGraphNodes(subComponent.subComponents, subComponent, subComponent.isRoot, component.selector, appendNodes);
        }
      });
    }
  }

  private generateDirectedGraphEdges(subComponents: Component[], selector: string, parentSelector: string, appendLinks: (edgeList: Edge[]) => void) {
    if (parentSelector.length > 0) {
      const id = Math.random() * 100000;
      appendLinks([new Edge(id.toString(), parentSelector, selector)]);
    }
    if (subComponents.length > 0 && selector !== parentSelector) {
      subComponents.forEach((subComponent) => {
        this.generateDirectedGraphEdges(subComponent.subComponents, subComponent.selector, selector, appendLinks);
      });
    }
  }

  private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private generateJavascriptContent(nodesJson: string, rootNodesJson: string, edgesJson: string): string {
    const templateJsFilename = ShowComponentHierarchy.Name + '_Template.js';
    let template = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', templateJsFilename)), 'utf8');
    let jsContent = template.replace('var nodes = new vis.DataSet([]);', `var nodes = new vis.DataSet([${nodesJson}]);`);
    jsContent = jsContent.replace('var rootNodes = [];', `var rootNodes = [${rootNodesJson}];`);
    jsContent = jsContent.replace('var edges = new vis.DataSet([]);', `var edges = new vis.DataSet([${edgesJson}]);`);
    jsContent = jsContent.replace('background: "#00FF00" // rootNode background color', `background: "${this.config.visRootNodeBackgroundColor}" // rootNode background color`);
    jsContent = jsContent.replace('shape: \'box\' // The shape of the nodes.', `shape: '${this.config.visNodeShape}'// The shape of the nodes.`);
    jsContent = jsContent.replace('type: "triangle" // edge arrow to type', `type: "${this.config.visEdgeArrowToType}" // edge arrow to type}`);
    jsContent = jsContent.replace('ctx.strokeStyle = \'blue\'; // graph selection guideline color', `ctx.strokeStyle = '${this.config.graphSelectionGuidelineColor}'; // graph selection guideline color`);
    jsContent = jsContent.replace('ctx.lineWidth = 1; // graph selection guideline width', `ctx.lineWidth = ${this.config.graphSelectionGuidelineWidth}; // graph selection guideline width`);
    jsContent = jsContent.replace('selectionCanvasContext.strokeStyle = \'red\';', `selectionCanvasContext.strokeStyle = '${this.config.graphSelectionColor}';`);
    jsContent = jsContent.replace('selectionCanvasContext.lineWidth = 2;', `selectionCanvasContext.lineWidth = ${this.config.graphSelectionWidth};`);
    return jsContent;
  }

  private generateHtmlContent(webview: vscode.Webview, outputJsFilename: string): string {
    const templateHtmlFilename = ShowComponentHierarchy.Name + '_Template.html';
    let htmlContent = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', templateHtmlFilename)), 'utf8');

    const visPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'javascript', 'vis-network.min.js');
    const visUri = webview.asWebviewUri(visPath);
    htmlContent = htmlContent.replace('vis-network.min.js', visUri.toString());

    const cssPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'stylesheet', ShowComponentHierarchy.Name + '.css');
    const cssUri = webview.asWebviewUri(cssPath);
    htmlContent = htmlContent.replace(ShowComponentHierarchy.Name + '.css', cssUri.toString());

    const nonce = this.getNonce();
    htmlContent = htmlContent.replace('nonce-nonce', `nonce-${nonce}`);
    htmlContent = htmlContent.replace(/<script /g, `<script nonce="${nonce}" `);
    htmlContent = htmlContent.replace('cspSource', webview.cspSource);

    const jsPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'out', outputJsFilename);
    const jsUri = webview.asWebviewUri(jsPath);
    htmlContent = htmlContent.replace(ShowComponentHierarchy.Name + '.js', jsUri.toString());
    return htmlContent;
  }

  private saveAsPng(messageText: string) {
    const dataUrl = messageText.split(',');
    if (dataUrl.length > 0) {
      const u8arr = Base64.toUint8Array(dataUrl[1]);

      const workspaceDirectory = this.fsUtils.getWorkspaceFolder();
      const newFilePath = path.join(workspaceDirectory, this.config.componentHierarchyFilename);
      this.fsUtils.writeFile(newFilePath, u8arr, () => {});

      vscode.window.showInformationMessage(`The file ${this.config.componentHierarchyFilename} has been created in the root of the workspace.`);
    }
  }
}