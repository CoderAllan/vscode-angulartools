import { ShowHierarchyBase } from './showHierarchyBase';
import { Component, ComponentManager } from '@src';
import { ArrowType, Edge, GraphState, Node, NodeType } from '@model';
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
          case 'saveAsPng':
            this.saveAsPng(this.config.componentHierarchyPngFilename, message.text);
            return;
          case 'saveAsDgml':
            this.saveAsDgml(this.config.componentHierarchyDgmlGraphFilename, message.text, `'The component hierarchy has been analyzed and a Directed Graph Markup Language (dgml) file '${this.config.componentHierarchyDgmlGraphFilename}' has been created'`);
            return;
          case 'saveAsDot':
            this.saveAsDot(this.config.componentHierarchyDotGraphFilename, message.text, 'componentHierarchy', `'The component hierarchy has been analyzed and a GraphViz (dot) file '${this.config.componentHierarchyDotGraphFilename}' has been created'`);
            return;
          case 'setGraphState':
            const newGraphState: GraphState = JSON.parse(message.text);
            this.graphState.networkSeed = newGraphState.networkSeed;
            this.graphState.nodePositions = newGraphState.nodePositions;
            this.setNewState(this.graphState);
            return;
        }
      },
      undefined,
      this.extensionContext.subscriptions
    );

    const components = ComponentManager.findComponents(this.directoryPath);

    this.nodes = [];
    this.edges = [];
    this.addNodesAndEdges(components, this.appendNodes, this.appendEdges);

    const nodesJson = this.nodes
      .map((node, index, arr) => { return node.toJsonString(); })
      .join(',\n');
    const rootNodesJson = this.nodes
      .filter(node => node.isRoot)
      .map((node, index, arr) => { return '"' + node.id + '"'; })
      .join(',\n');
    const edgesJson = this.edges
      .map((edge, index, arr) => { return edge.toJsonString(); })
      .join(',\n');

    try {
      const jsContent = this.generateJavascriptContent(nodesJson, rootNodesJson, edgesJson);
      const outputJsFilename = this.showComponentHierarchyJsFilename;
      let htmlContent = this.generateHtmlContent(webview, outputJsFilename);

      //this.fsUtils.writeFile(this.extensionContext?.asAbsolutePath(path.join('out', ShowComponentHierarchy.Name + '.html')), htmlContent, () => { }); // For debugging
      this.fsUtils.writeFile(
        this.extensionContext?.asAbsolutePath(path.join('.', outputJsFilename)),
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
    let componentFilename = component.tsFilename.replace(this.directoryPath, '.');
    componentFilename = componentFilename.split('\\').join('/');
    appendNodes([new Node(component.selector, component.selector, componentFilename, isRoot, isRoot ? NodeType.rootNode : NodeType.component)]);
    if (components.length > 0) {
      components.forEach((subComponent) => {
        if (parentSelector !== subComponent.selector) {
          this.generateDirectedGraphNodes(subComponent.subComponents, subComponent, subComponent.isRoot, component.selector, appendNodes);
        }
      });
    }
  }

  private generateDirectedGraphEdges(subComponents: Component[], selector: string, parentSelector: string, appendLinks: (edgeList: Edge[]) => void) {
    if (parentSelector.length > 0) {
      const id = this.edges.length;
      appendLinks([new Edge(id.toString(), parentSelector, selector, ArrowType.uses)]);
    }
    if (subComponents.length > 0 && selector !== parentSelector) {
      subComponents.forEach((subComponent) => {
        this.generateDirectedGraphEdges(subComponent.subComponents, subComponent.selector, selector, appendLinks);
      });
    }
  }

  private generateJavascriptContent(nodesJson: string, rootNodesJson: string, edgesJson: string): string {
    let template = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', this.templateJsFilename)), 'utf8');
    let jsContent = template.replace('var nodes = new vis.DataSet([]);', `var nodes = new vis.DataSet([${nodesJson}]);`);
    jsContent = jsContent.replace('var rootNodes = [];', `var rootNodes = [${rootNodesJson}];`);
    jsContent = jsContent.replace('var edges = new vis.DataSet([]);', `var edges = new vis.DataSet([${edgesJson}]);`);
    jsContent = jsContent.replace('background: "#00FF00" // rootNode background color', `background: "${this.config.rootNodeBackgroundColor}" // rootNode background color`);
    jsContent = jsContent.replace('shape: \'box\' // The shape of the nodes.', `shape: '${this.config.rootNodeShape}'// The shape of the nodes.`);
    jsContent = jsContent.replace('type: "triangle" // edge arrow to type', `type: "${this.config.componentHierarchyEdgeArrowToType}" // edge arrow to type}`);
    jsContent = jsContent.replace('ctx.strokeStyle = \'blue\'; // graph selection guideline color', `ctx.strokeStyle = '${this.config.graphSelectionGuidelineColor}'; // graph selection guideline color`);
    jsContent = jsContent.replace('ctx.lineWidth = 1; // graph selection guideline width', `ctx.lineWidth = ${this.config.graphSelectionGuidelineWidth}; // graph selection guideline width`);
    jsContent = jsContent.replace('selectionCanvasContext.strokeStyle = \'red\';', `selectionCanvasContext.strokeStyle = '${this.config.graphSelectionColor}';`);
    jsContent = jsContent.replace('selectionCanvasContext.lineWidth = 2;', `selectionCanvasContext.lineWidth = ${this.config.graphSelectionWidth};`);
    jsContent = this.setGraphState(jsContent);
    return jsContent;
  }
}