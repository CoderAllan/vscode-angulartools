import * as fs from 'fs';
import { Base64 } from 'js-base64';
import * as path from 'path';
import * as vscode from 'vscode';

import { Config } from '../config';
import { FileSystemUtils } from '../filesystemUtils';

class Component {

  constructor(tsFilename: string, templateFilename: string, selector: string, subComponents: Component[], isRoot: boolean) {
    this.tsFilename = tsFilename;
    this.templateFilename = templateFilename;
    this.selector = selector;
    this.subComponents = subComponents;
    this.isRoot = isRoot;
  }
  public tsFilename: string;
  public templateFilename: string;
  public selector: string;
  public subComponents: Component[];
  public isRoot: boolean;
}

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

export class ShowComponentHierarchy {

  private extensionContext: vscode.ExtensionContext;
  private fsUtils = new FileSystemUtils();
  private static readonly Name = 'showComponentHierarchy';
  constructor(context: vscode.ExtensionContext) {
    this.extensionContext = context;
  }
  public static get commandName(): string { return ShowComponentHierarchy.Name; }

  public execute(webview: vscode.Webview) {

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
    const componentFilenames = this.fsUtils.listFiles(directoryPath, Config.excludeDirectories, this.isComponentFile);
    const components = this.findComponents(componentFilenames);
    this.enrichComponentsFromComponentTemplates(components);

    let nodes: Node[] = [];
    const appendNodes = (nodeList: Node[]) => {
      nodeList.forEach(newNode => {
        if (!nodes.some(node => node.id === newNode.id)) {
          nodes = nodes.concat(newNode);
        }
      });
    };
    let edges: Edge[] = [];
    const appendLinks = (edgeList: Edge[]) => {
      edgeList.forEach(newEdge => {
        if (!edges.some(edge => edge.source === newEdge.source && edge.target === newEdge.target)) {
          edges = edges.concat(newEdge);
        }
      });
    };
    this.addNodesAndLinks(components, appendNodes, appendLinks);

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

      this.fsUtils.writeFile(this.extensionContext?.asAbsolutePath(path.join('out', ShowComponentHierarchy.Name + '.html')), htmlContent, () => { }); // For debugging
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

  private isComponentFile(filename: string): boolean {
    return filename.endsWith('.component.ts');
  }

  private findComponents(componentFilenames: string[]) {
    const compHash: { [selector: string]: Component; } = {};
    const componentRegex = /@Component\({/ig;
    const templateUrlRegex = /.*templateUrl:.+\/(.+)\'/i;
    const selectorRegex = /.*selector:.+\'(.+)\'/i;
    const endBracketRegex = /}\)/i;
    componentFilenames.forEach((componentFilename) => {
      let componentDefinitionFound = false;
      let currentComponent = new Component(componentFilename, "", "", [], true);
      const content = fs.readFileSync(componentFilename, 'utf8');
      const lines: string[] = content.split('\n');
      for (let i: number = 0; i < lines.length; i++) {
        let line = lines[i];
        let match = componentRegex.exec(line);
        if (match) {
          componentDefinitionFound = true;
        }
        if (componentDefinitionFound) {
          match = templateUrlRegex.exec(line);
          if (match) {
            currentComponent.templateFilename = path.join(path.dirname(componentFilename), match[1]);
          }
          match = selectorRegex.exec(line);
          if (match) {
            let currentSelector = match[1];
            currentSelector = currentSelector.replace("[", "");
            currentSelector = currentSelector.replace("]", "");
            currentComponent.selector = currentSelector;
          }
          match = endBracketRegex.exec(line);
          if (match) {
            break;
          }
        }
      }
      compHash[currentComponent.selector] = currentComponent;
    });
    return compHash;
  }

  private enrichComponentsFromComponentTemplates(componentHash: { [selector: string]: Component; }) {
    for (let selector1 in componentHash) {
      if (fs.existsSync(componentHash[selector1].templateFilename)) {
        const template = fs.readFileSync(componentHash[selector1].templateFilename); // We read the entire template file
        for (let selector2 in componentHash) {  // then we check if the template contains each of the selectors we found in the components
          let pattern = `</${selector2}>`;
          let index = template.indexOf(pattern);
          if (index >= 0) {
            componentHash[selector1].subComponents = componentHash[selector1].subComponents.concat(componentHash[selector2]);
            // If selector2 has been found in a template then it is not root
            componentHash[selector2].isRoot = false;
          }
          else {
            pattern = ` ${selector2}`;
            index = template.indexOf(pattern);
            if (index >= 0) {
              componentHash[selector1].subComponents = componentHash[selector1].subComponents.concat(componentHash[selector2]);
              // If selector2 has been found in a template then it is not root
              componentHash[selector2].isRoot = false;
            }
          }
        }
      }
    }
  }

  private addNodesAndLinks(componentHash: { [selector: string]: Component; }, appendNodes: (nodeList: Node[]) => void, appendLinks: (edgeList: Edge[]) => void) {
    for (let selector in componentHash) {
      const component = componentHash[selector];
      if (component.isRoot) {
        this.generateDirectedGraphNodes(component.subComponents, component, true, appendNodes);
        this.generateDirectedGraphEdges(component.subComponents, selector, "", appendLinks);
      }
    }
  }

  private generateDirectedGraphNodes(components: Component[], component: Component, isRoot: boolean, appendNodes: (nodeList: Node[]) => void) {
    appendNodes([new Node(component.selector, component.templateFilename, isRoot)]);
    if (components.length > 0) {
      components.forEach((subComponent) => {
        this.generateDirectedGraphNodes(subComponent.subComponents, subComponent, subComponent.isRoot, appendNodes);
      });
    }
  }

  private generateDirectedGraphEdges(subComponents: Component[], selector: string, parentSelector: string, appendLinks: (edgeList: Edge[]) => void) {
    if (parentSelector.length > 0) {
      const id = Math.random() * 100000;
      appendLinks([new Edge(id.toString(), parentSelector, selector)]);
    }
    if (subComponents.length > 0) {
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
    jsContent = jsContent.replace('background: "#00FF00" // rootNode background color', `background: "${Config.visRootNodeBackgroundColor}" // rootNode background color`);
    jsContent = jsContent.replace('type: "triangle" // edge arrow to type', `type: "${Config.visEdgeArrowToType}" // edge arrow to type`);
    jsContent = jsContent.replace('ctx.strokeStyle = \'blue\'; // graph selection guideline color', `ctx.strokeStyle = '${Config.graphSelectionGuidelineColor}'; // graph selection guideline color`);
    jsContent = jsContent.replace('ctx.lineWidth = 1; // graph selection guideline width', `ctx.lineWidth = ${Config.graphSelectionGuidelineWidth}; // graph selection guideline width`);
    jsContent = jsContent.replace('selectionCanvasContext.strokeStyle = \'red\';', `selectionCanvasContext.strokeStyle = '${Config.graphSelectionColor}';`);
    jsContent = jsContent.replace('selectionCanvasContext.lineWidth = 2;', `selectionCanvasContext.lineWidth = ${Config.graphSelectionWidth};`);
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
      const newFilePath = path.join(workspaceDirectory, Config.componentHierarchyFilename);
      this.fsUtils.writeFile(newFilePath, u8arr, () => {});

      vscode.window.showInformationMessage('The file ComponentHierarchy.png has been created in the root of the workspace.');
    }
  }
}