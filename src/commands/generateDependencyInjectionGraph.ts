import { ShowHierarchyBase } from './showHierarchyBase';
import { ModuleManager } from '@src';
import { ArrowType, Component, Edge, Node, NodeType, Project } from '@model';
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
            this.saveAsPng(this.config.dependencyInjectionPngFilename, message.text);
            return;
          case 'saveAsDgml':
            this.saveAsDgml(this.config.dependencyInjectionDgmlGraphFilename, message.text, `'The components hierarchy has been analyzed and a Directed Graph Markup Language (dgml) file '${this.config.dependencyInjectionDgmlGraphFilename}' has been created'`);
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
      const componentFilename = component.filename.replace(this.workspaceDirectory, '');
      appendNodes([new Node(component.name, this.generatedComponentNode(component), componentFilename, false, NodeType.component)]);
      component.dependencyInjections.forEach(injectable => {
        appendNodes([new Node(injectable.name, injectable.name, injectable.filename.replace(this.workspaceDirectory, ''), false, NodeType.injectable)]);
        appendEdges([new Edge((this.edges.length + 1).toString(), injectable.name, component.name, ArrowType.injectable)]);
      });
    });
  }

  generateJavascriptContent(nodesJson: string, edgesJson: string) {
    let template = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', this.templateJsFilename)), 'utf8');
    let jsContent = template.replace('var nodes = new vis.DataSet([]);', `var nodes = new vis.DataSet([${nodesJson}]);`);
    jsContent = jsContent.replace('var edges = new vis.DataSet([]);', `var edges = new vis.DataSet([${edgesJson}]);`);
    jsContent = jsContent.replace('type: "triangle" // edge arrow to type', `type: "${this.config.dependencyInjectionEdgeArrowToType}" // edge arrow to type}`);
    jsContent = jsContent.replace('ctx.strokeStyle = \'blue\'; // graph selection guideline color', `ctx.strokeStyle = '${this.config.graphSelectionGuidelineColor}'; // graph selection guideline color`);
    jsContent = jsContent.replace('ctx.lineWidth = 1; // graph selection guideline width', `ctx.lineWidth = ${this.config.graphSelectionGuidelineWidth}; // graph selection guideline width`);
    jsContent = jsContent.replace('selectionCanvasContext.strokeStyle = \'red\';', `selectionCanvasContext.strokeStyle = '${this.config.graphSelectionColor}';`);
    jsContent = jsContent.replace('selectionCanvasContext.lineWidth = 2;', `selectionCanvasContext.lineWidth = ${this.config.graphSelectionWidth};`);
    return jsContent;
  }
}