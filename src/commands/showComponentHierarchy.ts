import { ShowHierarchyBase } from './showHierarchyBase';
import { ComponentManager } from '@src';
import { ArrowType, Component, Edge, GraphState, Node, NodeType } from '@model';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class ShowComponentHierarchy extends ShowHierarchyBase {
  public static get commandName(): string { return 'showComponentHierarchy'; }

  private directoryPath: string = this.fsUtils.getWorkspaceFolder();

  public execute(webview: vscode.Webview) {
    this.checkForOpenWorkspace();
    webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'saveAsPng': {
            this.saveAsPng(this.config.componentHierarchyPngFilename, message.text);
            return;
          }
          case 'saveAsDgml': {
            this.saveAsDgml(this.config.componentHierarchyDgmlGraphFilename, message.text, `'The component hierarchy has been analyzed and a Directed Graph Markup Language (dgml) file '${this.config.componentHierarchyDgmlGraphFilename}' has been created'`);
            return;
          }
          case 'saveAsDot': {
            this.saveAsDot(this.config.componentHierarchyDotGraphFilename, message.text, 'componentHierarchy', `'The component hierarchy has been analyzed and a GraphViz (dot) file '${this.config.componentHierarchyDotGraphFilename}' has been created'`);
            return;
          }
          case 'setGraphState': {
            const newGraphState: GraphState = JSON.parse(message.text);
            this.graphState = newGraphState;
            this.setNewState(this.graphState);
            this.nodes.forEach(node => {
              node.position = this.graphState.nodePositions[node.id];
            });
            this.addNodesAndEdges(components, this.appendNodes, this.appendEdges);
            this.generateAndSaveJavascriptContent(() => { });
            return;
          }
          case 'openFile': {
            const filename = message.text;
            if (this.fsUtils.fileExists(filename)) {
              var openPath = vscode.Uri.parse("file:///" + filename);
              vscode.workspace.openTextDocument(openPath).then(doc => {
                vscode.window.showTextDocument(doc);
              });
            }
            return;
          }
        }
      },
      undefined,
      this.extensionContext.subscriptions
    );

    const components = ComponentManager.scanWorkspaceForComponents(this.directoryPath);

    this.nodes = [];
    this.edges = [];
    this.addNodesAndEdges(components, this.appendNodes, this.appendEdges);
    const htmlContent = this.generateHtmlContent(webview, this.showComponentHierarchyJsFilename);
    //this.fsUtils.writeFile(this.extensionContext?.asAbsolutePath(path.join('out', ShowComponentHierarchy.Name + '.html')), htmlContent, () => { }); // For debugging
    this.generateAndSaveJavascriptContent(() => { webview.html = htmlContent; });
  }

  private generateAndSaveJavascriptContent(callback: () => any) {
    const nodesJson = this.nodes
      .map(node => { return node.toJsonString(); })
      .join(',\n');
    const rootNodesJson = this.nodes
      .filter(node => node.isRoot)
      .map(node => { return '"' + node.id + '"'; })
      .join(',\n');
    const edgesJson = this.edges
      .map(edge => { return edge.toJsonString(); })
      .join(',\n');

    try {
      const jsContent = this.generateJavascriptContent(nodesJson, rootNodesJson, edgesJson);
      this.fsUtils.writeFile(
        this.extensionContext?.asAbsolutePath(path.join('.', this.showComponentHierarchyJsFilename)),
        jsContent,
        callback
      );
    } catch (ex) {
      console.log('Angular Tools Exception:' + ex);
    }
  }

  private addNodesAndEdges(componentDict: { [selector: string]: Component; }, appendNodes: (nodeList: Node[]) => void, appendEdges: (edgeList: Edge[]) => void) {
    for (let selector in componentDict) {
      const component = componentDict[selector];
      if (component.isRoot) {
        this.generateDirectedGraphNodes(component.subComponents, component, true, '', appendNodes);
        this.generateDirectedGraphEdges(component.subComponents, selector, "", appendEdges);
      }
    }
  }

  private generateDirectedGraphNodes(components: Component[], component: Component, isRoot: boolean, parentSelector: string, appendNodes: (nodeList: Node[]) => void) {
    let componentFilename = component.filename.replace(this.directoryPath, '.');
    componentFilename = componentFilename.split('\\').join('/');
    const componentPosition = this.graphState.nodePositions[component.selector];
    appendNodes([new Node(component.selector, component.selector, componentFilename, component.filename, isRoot, isRoot ? NodeType.rootNode : NodeType.component, componentPosition)]);
    if (components.length > 0) {
      components.forEach((subComponent) => {
        if (parentSelector !== subComponent.selector) {
          this.generateDirectedGraphNodes(subComponent.subComponents, subComponent, subComponent.isRoot, component.selector, appendNodes);
        }
      });
    }
  }

  private generateDirectedGraphEdges(subComponents: Component[], selector: string, parentSelector: string, appendEdges: (edgeList: Edge[]) => void) {
    if (parentSelector.length > 0) {
      const id = this.edges.length;
      appendEdges([new Edge(id.toString(), parentSelector, selector, ArrowType.uses)]);
    }
    if (subComponents.length > 0 && selector !== parentSelector) {
      subComponents.forEach((subComponent) => {
        this.generateDirectedGraphEdges(subComponent.subComponents, subComponent.selector, selector, appendEdges);
      });
    }
  }

  private generateJavascriptContent(nodesJson: string, rootNodesJson: string, edgesJson: string): string {
    let template = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', this.templateJsFilename)), 'utf8');
    let jsContent = template.replace('const nodes = new vis.DataSet([]);', `var nodes = new vis.DataSet([${nodesJson}]);`);
    jsContent = jsContent.replace('const rootNodes = [];', `var rootNodes = [${rootNodesJson}];`);
    jsContent = jsContent.replace('const edges = new vis.DataSet([]);', `var edges = new vis.DataSet([${edgesJson}]);`);
    jsContent = jsContent.replace('background: "#00FF00" // rootNode background color', `background: "${this.config.rootNodeBackgroundColor}" // rootNode background color`);
    jsContent = jsContent.replace('shape: \'box\' // The shape of the nodes.', `shape: '${this.config.rootNodeShape}'// The shape of the nodes.`);
    jsContent = jsContent.replace('type: "triangle" // edge arrow to type', `type: "${this.config.componentHierarchyEdgeArrowToType}" // edge arrow to type}`);
    jsContent = jsContent.replace('ctx.strokeStyle = \'blue\'; // graph selection guideline color', `ctx.strokeStyle = '${this.config.graphSelectionGuidelineColor}'; // graph selection guideline color`);
    jsContent = jsContent.replace('ctx.lineWidth = 1; // graph selection guideline width', `ctx.lineWidth = ${this.config.graphSelectionGuidelineWidth}; // graph selection guideline width`);
    jsContent = jsContent.replace('selectionCanvasContext.strokeStyle = \'red\';', `selectionCanvasContext.strokeStyle = '${this.config.graphSelectionColor}';`);
    jsContent = jsContent.replace('selectionCanvasContext.lineWidth = 2;', `selectionCanvasContext.lineWidth = ${this.config.graphSelectionWidth};`);
    jsContent = jsContent.replace('let showHierarchicalOptionsCheckboxChecked = false;', `let showHierarchicalOptionsCheckboxChecked = ${this.graphState.showHierarchicalOptions};`);
    jsContent = jsContent.replace('let hierarchicalOptionsDirectionSelectValue = undefined;', `let hierarchicalOptionsDirectionSelectValue = '${this.graphState.graphDirection}';`);
    jsContent = jsContent.replace('let hierarchicalOptionsSortMethodSelectValue = undefined;', `let hierarchicalOptionsSortMethodSelectValue = '${this.graphState.graphLayout}';`);
    jsContent = this.setGraphState(jsContent);
    return jsContent;
  }
}