import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FileSystemUtils } from "../../filesystemUtils";

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
  constructor(context: vscode.ExtensionContext) {
    this.extensionContext = context;
  }
  public static get commandName(): string { return 'showComponentHierarchy'; }

  public execute(webview: vscode.Webview) {
    const fsUtils = new FileSystemUtils();
    var directoryPath: string = fsUtils.getWorkspaceFolder();
    const excludeDirectories = ['bin', 'obj', 'node_modules', 'dist', 'packages', '.git', '.vs', '.github'];
    const componentFilenames = fsUtils.listFiles(directoryPath, excludeDirectories, this.isComponentFile);
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
      const outputJsFilename = 'showComponentHierarchy/showComponentHierarchy.js';
      let htmlContent = this.generateHtmlContent(webview, outputJsFilename);

      fsUtils.writeFile(this.extensionContext?.asAbsolutePath(path.join('src', 'commands', 'showComponentHierarchy/showComponentHierarchy.html')), htmlContent, () => { } ); // For debugging
      fsUtils.writeFile(
        this.extensionContext?.asAbsolutePath(path.join('src', 'commands', outputJsFilename)),
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
        this.generateDirectedGraphNodesXml(component.subComponents, component, true, appendNodes);
        this.generateDirectedGraphLinksXml(component.subComponents, selector, "", appendLinks);
      }
    }
  }

  private generateDirectedGraphNodesXml(components: Component[], component: Component, isRoot: boolean, appendNodes: (nodeList: Node[]) => void) {
    appendNodes([new Node(component.selector, component.templateFilename, isRoot)]);
    if (components.length > 0) {
      components.forEach((subComponent) => {
        this.generateDirectedGraphNodesXml(subComponent.subComponents, subComponent, subComponent.isRoot, appendNodes);
      });
    }
  }

  private generateDirectedGraphLinksXml(subComponents: Component[], selector: string, parentSelector: string, appendLinks: (edgeList: Edge[]) => void) {
    if (parentSelector.length > 0) {
      const id = Math.random() * 100000;
      appendLinks([new Edge(id.toString(), parentSelector, selector)]);
    }
    if (subComponents.length > 0) {
      subComponents.forEach((subComponent) => {
        this.generateDirectedGraphLinksXml(subComponent.subComponents, subComponent.selector, selector, appendLinks);
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
    const templateJsFilename = 'showComponentHierarchy/showComponentHierarchy_Template.js';
    let template = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('src', 'commands', templateJsFilename)), 'utf8');
    let jsContent = template.replace('var nodes = new vis.DataSet([]);', `var nodes = new vis.DataSet([${nodesJson}]);`);
    jsContent = jsContent.replace('var rootNodes = [];', `var rootNodes = [${rootNodesJson}];`);
    jsContent = jsContent.replace('var edges = new vis.DataSet([]);', `var edges = new vis.DataSet([${edgesJson}]);`);
    return jsContent;
  }

  private generateHtmlContent(webview: vscode.Webview, outputJsFilename: string): string {
    const templateHtmlFilename = 'showComponentHierarchy/showComponentHierarchy_Template.html';
    let htmlContent = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('src', 'commands', templateHtmlFilename)), 'utf8');

    const visPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'src', 'commands', 'showComponentHierarchy/vis-network.min.js');
    const visUri = webview.asWebviewUri(visPath);
    htmlContent = htmlContent.replace('vis-network.min.js', visUri.toString());

    const cssPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'src', 'commands', 'showComponentHierarchy/showComponentHierarchy.css');
    const cssUri = webview.asWebviewUri(cssPath);
    htmlContent = htmlContent.replace('showComponentHierarchy.css', cssUri.toString());

    const nonce = this.getNonce();
    htmlContent = htmlContent.replace('nonce-nonce', `nonce-${nonce}`);
    htmlContent = htmlContent.replace(/<script /g, `<script nonce="${nonce}" `);
    htmlContent = htmlContent.replace('cspSource', webview.cspSource);

    const jsPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'src', 'commands', outputJsFilename);
    const jsUri = webview.asWebviewUri(jsPath);
    htmlContent = htmlContent.replace('showComponentHierarchy.js', jsUri.toString());
    return htmlContent;
  }
}