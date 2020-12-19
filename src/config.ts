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

  // ComponentHierarchyDgml
  public get dgmlGraphFilename(): string { return this.getSetting<string>('componentHierarchyDgml.defaultGraphFilename', 'ReadMe-ProjectStructure.dgml'); }
  public get dgmlGraphLayout(): string { return this.getSetting<string>('componentHierarchyDgml.graphLayout', 'Sugiyama'); }
  public get dgmlGraphDirection(): string { return this.getSetting<string>('componentHierarchyDgml.graphDirection', 'LeftToRight'); }
  public readonly dgmlZoomLevel = '-1';
  public get rootNodeBackgroundColor(): string { return this.getSetting<string>('componentHierarchyDgml.rootNodeBackgroundColor', '#FF00AA00'); }

  // PackageJsonToMarkdown
  public get packageJsonMarkdownFilename(): string { return this.getSetting<string>('packageJsonMarkdownFilename', 'ReadMe-PackagesJson.md'); }

  // ProjectDirectoryStructure
  public get projectDirectoryStructureMarkdownFilename(): string { return this.getSetting<string>('projectDirectoryStructureMarkdownFilename', 'ReadMe-ProjectDirectoryStructure.md'); }

  // ShowComponentHierarchy
  public get visRootNodeBackgroundColor(): string { return this.getSetting<string>('showComponentHierarchy.rootNodeBackgroundColor', '#00FF00'); }
  public get visNodeShape(): string { return this.getSetting<string>('showComponentHierarchy.nodeShape', 'box'); }
  public get visEdgeArrowToType(): string { return this.getSetting<string>('showComponentHierarchy.edgeArrowToType', 'triangle'); }
  public get graphSelectionGuidelineColor(): string { return this.getSetting<string>('showComponentHierarchy.graphSelectionGuidelineColor', 'blue'); }
  public get graphSelectionGuidelineWidth(): number { return this.getSetting<number>('showComponentHierarchy.graphSelectionGuidelineWidth', 1); }
  public get graphSelectionColor(): string { return this.getSetting<string>('showComponentHierarchy.graphSelectionColor', 'red'); }
  public get graphSelectionWidth(): number { return this.getSetting<number>('showComponentHierarchy.graphSelectionWidth', 2); }
  public get componentHierarchyFilename(): string { return this.getSetting<string>('showComponentHierarchy.componentHierarchyFilename', 'ComponentHierarchy.png'); }

  // ComponentHierarchyMarkdown
  public get componentHierarchyMarkdownFilename(): string { return this.getSetting<string>('componentHierarchyMarkdownFilename', 'ComponentHierarchy.md'); }
}