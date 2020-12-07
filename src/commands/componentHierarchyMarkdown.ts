import { Config, Component, ComponentManager, FileSystemUtils } from '@src';
import * as path from 'path';

export class ComponentHierarchyMarkdown {

  public static get commandName(): string { return 'componentHierarchyMarkdown'; }

  public execute() {
    const fsUtils = new FileSystemUtils();
    var workspaceDirectory: string = fsUtils.getWorkspaceFolder();
    const components = ComponentManager.findComponents(workspaceDirectory);
    
    let relations: string = '';
    const addRelation = (from: string, to: string) => {
      relations = relations + `    ${from}-->${to}\n`;
    };
    try {
      this.addMermaidRelations(components, addRelation);
      const markdownContent = '# Component hierarchy\n\n' +
      '```mermaid\n' +
      'graph TD;\n'+
      relations+
      '```\n';
      fsUtils.writeFileAndOpen(path.join(workspaceDirectory, Config.componentHierarchyMarkdownFilename), markdownContent);
    } catch (ex) {
      console.log('exception:' + ex);
    }
  }

  private addMermaidRelations(componentHash: { [selector: string]: Component; }, addRelation: (from: string, to: string) => void) {
    for (let selector in componentHash) {
      const component = componentHash[selector];
      if (component.isRoot) {
        this.generateMermaidRelation(component.subComponents, selector, "", addRelation);
      }
    }
  }

  private generateMermaidRelation(subComponents: Component[], displayName: string, parentDisplayName: string, addRelation: (from: string, to: string) => void) {
    if (parentDisplayName.length > 0) {
      addRelation(parentDisplayName, displayName);
    }
    if (subComponents.length > 0) {
      subComponents.forEach((subComponent) => {
        this.generateMermaidRelation(subComponent.subComponents, subComponent.selector, displayName, addRelation);
      });
    }
  }
}