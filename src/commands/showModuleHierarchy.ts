import { Node, Edge, ShowHierarchyBase, NodeType, ArrowType } from './showHierarchyBase';
import { ModuleManager, Project } from '@src';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class ShowModuleHierarchy extends ShowHierarchyBase {
  static get commandName() { return 'showModuleHierarchy'; }
  public execute(webview: vscode.Webview) {
    this.checkForOpenWorkspace();
    webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'saveAsPng':
            this.saveAsPng(this.config.moduleHierarchyFilename, message.text);
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
        this.extensionContext?.asAbsolutePath(path.join('out', outputJsFilename)),
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
      this.showErrors(errors);
    }
  }
  addNodesAndEdges(project: Project, appendNodes: (nodeList: Node[]) => void, appendEdges: (edgeList: Edge[]) => void) {
    project.modules.forEach(module => {
      appendNodes([new Node(module.moduleName, module.moduleName, false, NodeType.module)]);
      module.imports.forEach(_import => {
        const nodeType = this.getNodeType(project, _import);
        appendNodes([new Node(_import, _import, false, nodeType)]);
        appendEdges([new Edge((this.edges.length + 1).toString(), _import, module.moduleName, ArrowType.import)]);
      });
      module.exports.forEach(_export => {
        const nodeType = this.getNodeType(project, _export);
        appendNodes([new Node(_export, _export, false, nodeType)]);
        appendEdges([new Edge((this.edges.length + 1).toString(), module.moduleName, _export, ArrowType.export)]);
      });
    });
  }
  getNodeType(project: Project, className: string) {
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
    return nodeType;
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

  showErrors(errors: string[]) {
    const angularToolsOutput = vscode.window.createOutputChannel(this.config.angularToolsOutputChannel);
    angularToolsOutput.clear();
    angularToolsOutput.appendLine(`Parsing of ${errors.length > 1 ? 'some' : 'one'} of the modules failed.\n`);
    angularToolsOutput.appendLine('Below is a list of the errors.');
    angularToolsOutput.appendLine(errors.join('\n'));
    angularToolsOutput.show();
  }
}
