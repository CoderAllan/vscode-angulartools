
export class Config {
  public static readonly excludeDirectories: string[] = ['bin', 'obj', 'node_modules', 'dist', 'packages', '.git', '.vs', '.github'];
  
  public static readonly angularToolsOutputChannel = 'Angular Tools';

  // ComponentHierarchyDgml
  public static readonly dgmlGraphFilename = 'ReadMe-ProjectStructure.dgml';
  public static readonly dgmlGraphLayout = 'Sugiyama';
  public static readonly dgmlGraphDirection = 'LeftToRight';
  public static readonly dgmlZooLevel = '-1';
  public static readonly rootNodeBackgroundColor = '#FF00AA00';
  
  // PackageJsonToMarkdown
  public static readonly packageJsonMarkdownFilename ='ReadMe-PackagesJson.md';
  
  // ProjectDirectoryStructure
  public static readonly projectDirectoryStructureMarkdownFilename ='ReadMe-ProjectDirectoryStructure.md';

  // ShowComponentHierarchy
  public static readonly visRootNodeBackgroundColor = '#00FF00';
  public static readonly visEdgeArrowToType = 'triangle';
  public static readonly graphSelectionGuidelineColor = 'blue';
  public static readonly graphSelectionGuidelineWidth = 1;
  public static readonly graphSelectionColor = 'red';
  public static readonly graphSelectionWidth = 2;
  public static readonly componentHierarchyFilename = 'ComponentHierarchy.png';

  // ComponentHierarchyMarkdown
  public static readonly componentHierarchyMarkdownFilename = 'ComponentHierarchy.md';
}