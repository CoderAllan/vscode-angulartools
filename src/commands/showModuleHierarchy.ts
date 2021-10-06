import { ShowHierarchyBase } from './showHierarchyBase';
import { ModuleManager } from '@src';
import { ArrowType, Edge, GraphState, Node, NodeType, Project } from '@model';
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
          case 'saveAsPng': {
            this.saveAsPng(this.config.moduleHierarchyPngFilename, message.text);
            return;
          }
          case 'saveAsDgml': {
            this.saveAsDgml(this.config.moduleHierarchyDgmlGraphFilename, message.text, `'The modules hierarchy has been analyzed and a Directed Graph Markup Language (dgml) file '${this.config.moduleHierarchyDgmlGraphFilename}' has been created'`);
            return;
          }
          case 'saveAsDot': {
            this.saveAsDot(this.config.moduleHierarchyDotGraphFilename, message.text, 'moduleHierarchy', `'The modules hierarchy has been analyzed and a GraphViz (dot) file '${this.config.moduleHierarchyDotGraphFilename}' has been created'`);
            return;
          }
          case 'setGraphState': {
            const newGraphState: GraphState = JSON.parse(message.text);
            this.graphState = newGraphState;
            this.setNewState(this.graphState);
            this.nodes.forEach(node => {
              node.position = this.graphState.nodePositions[node.id];
            });
            this.addNodesAndEdges(project, this.appendNodes, this.appendEdges);
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
    var workspaceFolder = this.fsUtils.getWorkspaceFolder();
    const errors: string[] = [];
    const project: Project = ModuleManager.scanProject(workspaceFolder, errors, this.isTypescriptFile);

    this.nodes = [];
    this.edges = [];
    this.addNodesAndEdges(project, this.appendNodes, this.appendEdges);
    let htmlContent = this.generateHtmlContent(webview, this.showModuleHierarchyJsFilename);
    //this.fsUtils.writeFile(this.extensionContext?.asAbsolutePath(path.join('out', ShowComponentHierarchy.Name + '.html')), htmlContent, () => { }); // For debugging
    this.generateAndSaveJavascriptContent(() => { webview.html = htmlContent; });
    if (errors.length > 0) {
      this.showErrors(errors, `Parsing of ${errors.length > 1 ? 'some' : 'one'} of the modules failed.\n`);
    }
  }

  private generateAndSaveJavascriptContent(callback: () => any) {
    const nodesJson = this.nodes
      .map(node => { return node.toJsonString(); })
      .join(',\n');
    const edgesJson = this.edges
      .map(edge => { return edge.toJsonString(); })
      .join(',\n');

    try {
      const jsContent = this.generateJavascriptContent(nodesJson, edgesJson);
      this.fsUtils.writeFile(
        this.extensionContext?.asAbsolutePath(path.join('.', this.showModuleHierarchyJsFilename)),
        jsContent,
        callback
      );
    }
    catch (ex) {
      console.log('Angular Tools Exception:' + ex);
    }
  }

  private addNodesAndEdges(project: Project, appendNodes: (nodeList: Node[]) => void, appendEdges: (edgeList: Edge[]) => void) {
    project.modules.forEach(module => {
      let moduleFilename = module.filename.replace(this.workspaceDirectory, '.');
      moduleFilename = moduleFilename.replace(/\\/g, '/');
      const modulePosition = this.graphState.nodePositions[module.moduleName];
      appendNodes([new Node(module.moduleName, module.moduleName, moduleFilename, module.filename, false, NodeType.module, modulePosition)]);
      module.imports.forEach(_import => {
        const nodeType = Node.getNodeType(project, _import);
        const importPosition = this.graphState.nodePositions[_import];
        const nodeFilename = this.getNodeFilename(_import, nodeType, project);
        appendNodes([new Node(_import, _import, nodeFilename?.replace(this.workspaceDirectory, ''), nodeFilename, false, nodeType, importPosition)]);
        appendEdges([new Edge((this.edges.length + 1).toString(), _import, module.moduleName, ArrowType.import)]);
      });
      module.exports.forEach(_export => {
        const nodeType = Node.getNodeType(project, _export);
        const exportPosition = this.graphState.nodePositions[_export];
        const nodeFilename = this.getNodeFilename(_export, nodeType, project);
        appendNodes([new Node(_export, _export, nodeFilename?.replace(this.workspaceDirectory, ''), nodeFilename, false, nodeType, exportPosition)]);
        appendEdges([new Edge((this.edges.length + 1).toString(), module.moduleName, _export, ArrowType.export)]);
      });
    });
  }

  private getNodeFilename(nodeName: string, nodeType: NodeType, project: Project): string | undefined {
    let nodeFilename: string | undefined;
    switch (nodeType) {
      case (NodeType.directive):
        nodeFilename = project.directives.get(nodeName)?.filename;
        break;
      case (NodeType.pipe):
        nodeFilename = project.pipes.get(nodeName)?.filename;
        break;
      case (NodeType.component):
        nodeFilename = project.components.get(nodeName)?.filename;
        break;
      default:
        nodeFilename = '';
    }
    return nodeFilename;
  }

  private generateJavascriptContent(nodesJson: string, edgesJson: string) {
    let template = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', this.templateJsFilename)), 'utf8');
    let jsContent = template.replace('const nodes = new vis.DataSet([]);', `var nodes = new vis.DataSet([${nodesJson}]);`);
    jsContent = jsContent.replace('const edges = new vis.DataSet([]);', `var edges = new vis.DataSet([${edgesJson}]);`);
    jsContent = jsContent.replace('type: "triangle" // edge arrow to type', `type: "${this.config.moduleHierarchyEdgeArrowToType}" // edge arrow to type}`);
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
