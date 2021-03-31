import * as vscode from 'vscode';

export class Config {
  public readonly angularToolsOutputChannel = 'Angular Tools';

  private configuration = vscode.workspace.getConfiguration('angularTools');
  private getSetting<T>(setting: string, defaultValue: T): T {
    let value = this.configuration.get<T>(setting);
    if (value === undefined) {
      value = defaultValue;
    }
    if (typeof value === 'string' && value.length === 0) {
      value = defaultValue;
    }
    return value as T;
  }

  // General
  public get excludeDirectories(): string[] {
    const value = this.getSetting<string>('excludeDirectories', 'bin;obj;node_modules;dist;packages;.git;.vs;.github');
    return value.split(";");
  }

  // Dgml graph
  public get dgmlGraphLayout(): string { return this.getSetting<string>('dgmlGraph.graphLayout', 'Sugiyama'); }
  public get dgmlGraphDirection(): string { return this.getSetting<string>('dgmlGraph.graphDirection', 'LeftToRight'); }
  public readonly dgmlZoomLevel = '-1';
  
  // DependencyInjectionGraph
  public get dependencyInjectionPngFilename(): string { return this.getSetting<string>('dependencyInjectionGraph.pngGraphFilename', 'DependencyInjectionGraph.png'); }
  public get dependencyInjectionDgmlGraphFilename(): string { return this.getSetting<string>('dependencyInjectionGraph.dgmlGraphFilename', 'DependencyInjectionGraph.dgml'); }
  public get dependencyInjectionEdgeArrowToType(): string { return this.getSetting<string>('dependencyInjectionGraph.edgeArrowToType', 'triangle'); }
  
  // ShowComponentHierarchy
  public get componentHierarchyPngFilename(): string { return this.getSetting<string>('showComponentHierarchy.componentHierarchyPngFilename', 'ComponentHierarchy.png'); }
  public get componentHierarchyDgmlGraphFilename(): string { return this.getSetting<string>('showComponentHierarchy.componentHierarchyDgmlGraphFilename', 'ComponentHierarchy.dgml'); }
  public get componentHierarchyEdgeArrowToType(): string { return this.getSetting<string>('showComponentHierarchy.edgeArrowToType', 'triangle'); }
  
  // ShowModuleHierarchy
  public get moduleHierarchyPngFilename(): string { return this.getSetting<string>('showModuleHierarchy.moduleHierarchyPngFilename', 'ModuleHierarchy.png'); }
  public get moduleHierarchyDgmlGraphFilename(): string { return this.getSetting<string>('showModuleHierarchy.moduleHierarchyDgmlGraphFilename', 'ModuleHierarchy.dgml'); }
  public get moduleHierarchyEdgeArrowToType(): string { return this.getSetting<string>('showModuleHierarchy.edgeArrowToType', 'triangle'); }

  // GraphSelection
  public get graphSelectionGuidelineColor(): string { return this.getSetting<string>('graphSelection.graphSelectionGuidelineColor', '#0288d1'); }
  public get graphSelectionGuidelineWidth(): number { return this.getSetting<number>('graphSelection.graphSelectionGuidelineWidth', 1); }
  public get graphSelectionColor(): string { return this.getSetting<string>('graphSelection.graphSelectionColor', '#e53935'); }
  public get graphSelectionWidth(): number { return this.getSetting<number>('graphSelection.graphSelectionWidth', 2); }
  
  // GraphNodes
  public get rootNodeBackgroundColor(): string { return this.getSetting<string>('graphNodes.rootNodeBackgroundColor', '#3abc3f'); }
  public get rootNodeShape(): string { return this.getSetting<string>('graphNodes.rootNodeShape', 'box'); }
  public get componentNodeBackgroundColor(): string { return this.getSetting<string>('graphNodes.componentNodeBackgroundColor', '#0288d1');}
  public get componentNodeShape(): string { return this.getSetting<string>('graphNodes.componentNodeShape', 'box'); }
  public get moduleNodeBackgroundColor(): string { return this.getSetting<string>('graphNodes.moduleNodeBackgroundColor', '#e53935');}
  public get moduleNodeShape(): string { return this.getSetting<string>('graphNodes.moduleNodeShape', 'box'); }
  public get pipeNodeBackgroundColor(): string { return this.getSetting<string>('graphNodes.pipeNodeBackgroundColor', '#00897b');}
  public get pipeNodeShape(): string { return this.getSetting<string>('graphNodes.pipeNodeShape', 'box'); }
  public get directiveNodeBackgroundColor(): string { return this.getSetting<string>('graphNodes.directiveNodeBackgroundColor', '#ffc107');}
  public get directiveNodeShape(): string { return this.getSetting<string>('graphNodes.directiveNodeShape', 'box'); }
  public get injectableNodeBackgroundColor(): string { return this.getSetting<string>('graphNodes.injectableNodeBackgroundColor', '#97c2fc'); }
  public get injectableNodeShape(): string { return this.getSetting<string>('graphNodes.injectableNodeShape', 'box'); }
  public get maximumNodeLabelLength(): number { return this.getSetting<number>('graphNodes.maximumNodeLabelLength', -1); }
  
  // Edges
  public get importEdgeColor(): string { return this.getSetting<string>('edges.importEdgeColor', '#43a047'); }
  public get exportEdgeColor(): string { return this.getSetting<string>('edges.exportEdgeColor', '#0288d1'); }
  public get injectableEdgeColor(): string { return this.getSetting<string>('edges.exportEdgeColor', '#0288d1'); }
  public get usesEdgeColor(): string { return this.getSetting<string>('edges.exportEdgeColor', '#0288d1'); }

  // PackageJsonToMarkdown
  public get packageJsonMarkdownFilename(): string { return this.getSetting<string>('packageJsonMarkdownFilename', 'ReadMe-PackagesJson.md'); }

  // ProjectDirectoryStructure
  public get projectDirectoryStructureMarkdownFilename(): string { return this.getSetting<string>('projectDirectoryStructureMarkdownFilename', 'ReadMe-ProjectDirectoryStructure.md'); }

  // ComponentHierarchyMarkdown
  public get componentHierarchyMarkdownFilename(): string { return this.getSetting<string>('componentHierarchyMarkdownFilename', 'ComponentHierarchy.md'); }

  // ModulesMarkdown
  public get modulesToMarkdownFilename(): string {return this.getSetting<string>('modulesToMarkdownFilename', 'Modules.md'); }
}