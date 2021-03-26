import { Node, Edge, ShowHierarchyBase, NodeType, ArrowType } from './showHierarchyBase';
import { ModuleManager } from '@src';
import { Component, Project } from '@model';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class GenerateDependencyInjectionGraph extends ShowHierarchyBase {
  static get commandName() { return 'generateDependencyInjectionGraph'; }
  public execute(webview: vscode.Webview) {
    this.checkForOpenWorkspace();
    webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'saveAsPng':
            this.saveAsPng('DependencyInjectionGraph.png', message.text);
            return;
        }
      },
      undefined,
      this.extensionContext.subscriptions
    );
    webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'saveAsDgml':
            console.log(message.text);
            return;
        }
      },
      undefined,
      this.extensionContext.subscriptions
    );
    var workspaceFolder = this.fsUtils.getWorkspaceFolder();
    const errors: string[] = [];
    const project: Project = ModuleManager.scanProject(workspaceFolder, errors, this.isTypescriptFile);

    this.nodes = [];
    this.edges = [];
    this.addNodesAndEdges(project, this.appendNodes, this.appendEdges);
    const nodesJson = this.nodes
      .map((node, index, arr) => { return node.toJsonString(); })
      .join(',\n');
    const edgesJson = this.edges
      .map((edge, index, arr) => { return edge.toJsonString(); })
      .join(',\n');
    
      try {
      const jsContent = this.generateJavascriptContent(nodesJson, edgesJson);
      const outputJsFilename = this.showModuleHierarchyJsFilename;
      let htmlContent = this.generateHtmlContent(webview, this.showModuleHierarchyJsFilename);
      //this.fsUtils.writeFile(this.extensionContext?.asAbsolutePath(path.join('out', ShowComponentHierarchy.Name + '.html')), htmlContent, () => { }); // For debugging
      this.fsUtils.writeFile(
        this.extensionContext?.asAbsolutePath(path.join('.', outputJsFilename)),
        jsContent,
        () => {
          webview.html = htmlContent;
        }
      );
    }
    catch (ex) {
      console.log('Angular Tools Exception:' + ex);
    }
    if (errors.length > 0) {
      this.showErrors(errors, `Parsing of ${errors.length > 1 ? 'some' : 'one'} of the project files failed.\n`);
    }
  }

  generatedComponentNode(component: Component): string {
    let nodeContent: string = '';
    nodeContent = `<b>${component.name}</b>`;
    if(component.inputs.length > 0) {
      const inputs = component.inputs.join(", ");
      nodeContent += `\\n<b>Inputs:</b> ${inputs}`;
    }
    if(component.outputs.length > 0) {
      const outputs = component.outputs.join(", ");
      nodeContent += `\\n<b>Outputs:</b> ${outputs}`;
    }
    if(component.viewchilds.length > 0) {
      const viewchilds = component.viewchilds.join(", ");
      nodeContent += `\\n<b>Viewchilds:</b> ${viewchilds}`;
    }
    if(component.viewchildren.length > 0) {
      const viewchildren = component.viewchildren.join(", ");
      nodeContent += `\\n<b>Viewchildren:</b> ${viewchildren}`;
    }
    if(component.contentchilds.length > 0) {
      const contentchilds = component.contentchilds.join(", ");
      nodeContent += `\\n<b>Contentchilds:</b> ${contentchilds}`;
    }
    if(component.contentchildren.length > 0) {
      const contentchildren = component.contentchildren.join(", ");
      nodeContent += `\\n<b>Contentchildren:</b> ${contentchildren}`;
    }
    return nodeContent;
  }

  addNodesAndEdges(project: Project, appendNodes: (nodeList: Node[]) => void, appendEdges: (edgeList: Edge[]) => void) {
    project.components.forEach(component => {
      appendNodes([new Node(component.name, this.generatedComponentNode(component), false, NodeType.component)]);
      component.dependencyInjections.forEach(injectable => {
        appendNodes([new Node(injectable, injectable, false, NodeType.injectable)]);
        appendEdges([new Edge((this.edges.length + 1).toString(), injectable, component.name, ArrowType.injectable)]);
      });
    });
  }

  generateJavascriptContent(nodesJson: string, edgesJson: string) {
    let template = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', this.templateJsFilename)), 'utf8');
    let jsContent = template.replace('var nodes = new vis.DataSet([]);', `var nodes = new vis.DataSet([${nodesJson}]);`);
    jsContent = jsContent.replace('var edges = new vis.DataSet([]);', `var edges = new vis.DataSet([${edgesJson}]);`);
    jsContent = jsContent.replace('type: "triangle" // edge arrow to type', `type: "${this.config.visEdgeArrowToType}" // edge arrow to type}`);
    jsContent = jsContent.replace('ctx.strokeStyle = \'blue\'; // graph selection guideline color', `ctx.strokeStyle = '${this.config.graphSelectionGuidelineColor}'; // graph selection guideline color`);
    jsContent = jsContent.replace('ctx.lineWidth = 1; // graph selection guideline width', `ctx.lineWidth = ${this.config.graphSelectionGuidelineWidth}; // graph selection guideline width`);
    jsContent = jsContent.replace('selectionCanvasContext.strokeStyle = \'red\';', `selectionCanvasContext.strokeStyle = '${this.config.graphSelectionColor}';`);
    jsContent = jsContent.replace('selectionCanvasContext.lineWidth = 2;', `selectionCanvasContext.lineWidth = ${this.config.graphSelectionWidth};`);
    return jsContent;
  }
}