import { ShowHierarchyBase } from './showHierarchyBase';
import { ModuleManager } from '@src';
import { ArrowType, Component, Edge, GraphState, NamedEntity, Node, NodeType, Project } from '@model';
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
                    case 'saveAsPng': {
                        this.saveAsPng(this.config.dependencyInjectionPngFilename, message.text);
                        return;
                    }
                    case 'saveAsDgml': {
                        this.saveAsDgml(this.config.dependencyInjectionDgmlGraphFilename, message.text, `'The components hierarchy has been analyzed and a Directed Graph Markup Language (dgml) file '${this.config.dependencyInjectionDgmlGraphFilename}' has been created'`);
                        return;
                    }
                    case 'saveAsDot': {
                        this.saveAsDot(this.config.dependencyInjectionDotGraphFilename, message.text, 'dependencyInjectionGraph', `'The components hierarchy has been analyzed and a GraphViz (dot) file '${this.config.dependencyInjectionDotGraphFilename}' has been created'`);
                        return;
                    }
                    case 'setGraphState': {
                        const newGraphState: GraphState = JSON.parse(message.text);
                        this.graphState = newGraphState;
                        this.setNewState(this.graphState);
                        this.nodes.forEach(node => {
                            node.position = this.graphState.nodePositions[node.id];
                        });
                        this.addNodesAndEdges(project);
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
        this.addNodesAndEdges(project);
        let htmlContent = this.generateHtmlContent(webview, this.showModuleHierarchyJsFilename);
        // this.fsUtils.writeFile(this.extensionContext?.asAbsolutePath(path.join('out', GenerateDependencyInjectionGraph.commandName + '.html')), htmlContent, () => { }); // For debugging
        this.generateAndSaveJavascriptContent(() => { webview.html = htmlContent; });
        if (errors.length > 0) {
            this.showErrors(errors, `Parsing of ${errors.length > 1 ? 'some' : 'one'} of the project files failed.\n`);
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

    private getNodeLabel(entity: Component | NamedEntity): string {
        let nodeContent: string = '';
        nodeContent = `<b>${entity.name}</b>`;
        if (entity instanceof Component) {
            if (entity.inputs.length > 0) {
                const inputs = entity.inputs.map(i => i.name).join(", ");
                nodeContent += `\\n<b>Inputs: </b> ${inputs}`;
            }
            if (entity.outputs.length > 0) {
                const outputs = entity.outputs.map(i => i.name).join(", ");
                nodeContent += `\\n<b>Outputs: </b> ${outputs}`;
            }
            if (entity.viewChilds.length > 0) {
                const viewchilds = entity.viewChilds.map(i => i.name).join(", ");
                nodeContent += `\\n<b>Viewchilds: </b> ${viewchilds}`;
            }
            if (entity.viewChildren.length > 0) {
                const viewchildren = entity.viewChildren.map(i => i.name).join(", ");
                nodeContent += `\\n<b>Viewchildren: </b> ${viewchildren}`;
            }
            if (entity.contentChilds.length > 0) {
                const contentchilds = entity.contentChilds.map(i => i.name).join(", ");
                nodeContent += `\\n<b>Contentchilds: </b> ${contentchilds}`;
            }
            if (entity.contentChildren.length > 0) {
                const contentchildren = entity.contentChildren.map(i => i.name).join(", ");
                nodeContent += `\\n<b>Contentchildren: </b> ${contentchildren}`;
            }
        }
        return nodeContent;
    }

    private addNodesAndEdges(project: Project) {
        this.addNamedEntityNodeAndEdges(project.components, NodeType.component, ArrowType.injectable);
        this.addNamedEntityNodeAndEdges(project.injectables, NodeType.injectable, ArrowType.injectable);
        this.addNamedEntityNodeAndEdges(project.directives, NodeType.directive, ArrowType.injectable);
        this.addNamedEntityNodeAndEdges(project.pipes, NodeType.pipe, ArrowType.injectable);
    }

    private addNamedEntityNodeAndEdges(namedEntityMap: Map<string, Component | NamedEntity>, noteType: NodeType, arrowType: ArrowType) {
        namedEntityMap.forEach(namedEntity => {
            const entityPosition = this.graphState.nodePositions[namedEntity.name];
            this.appendNodes([new Node(namedEntity.name, this.getNodeLabel(namedEntity), this.fixTsFilename(namedEntity.filename), namedEntity.filename, false, noteType, entityPosition)]);
            namedEntity.dependencies.forEach(dependency => {
                const dependencyPosition = this.graphState.nodePositions[dependency.name];
                this.appendNodes([new Node(dependency.name, dependency.name, this.fixTsFilename(dependency.filename), dependency.filename, false, NodeType.injectable, dependencyPosition)]);
                this.appendEdges([new Edge((this.edges.length + 1).toString(), dependency.name, namedEntity.name, arrowType)]);
            });
        });
    }

    private fixTsFilename(filename: string): string {
        let entityFilename = filename.replace(this.workspaceDirectory, '.');
        entityFilename = entityFilename.split('\\').join('/');
        return entityFilename;
    }

    private generateJavascriptContent(nodesJson: string, edgesJson: string) {
        let template = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', this.templateJsFilename)), 'utf8');
        let jsContent = template.replace('const nodes = new vis.DataSet([]);', `var nodes = new vis.DataSet([${nodesJson}]);`);
        jsContent = jsContent.replace('const edges = new vis.DataSet([]);', `var edges = new vis.DataSet([${edgesJson}]);`);
        jsContent = jsContent.replace('type: "triangle" // edge arrow to type', `type: "${this.config.dependencyInjectionEdgeArrowToType}" // edge arrow to type}`);
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