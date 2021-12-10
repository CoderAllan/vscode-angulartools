import { CommandBase } from '@commands';
import { Component } from '@model';
import { Config, ComponentManager, FileSystemUtils } from '@src';
import * as path from 'path';

export class ComponentHierarchyMarkdown extends CommandBase {
  private config = new Config();
  public static get commandName(): string { return 'componentHierarchyMarkdown'; }

  public execute() {
    this.checkForOpenWorkspace();
    const fsUtils = new FileSystemUtils();
    var workspaceDirectory: string = fsUtils.getWorkspaceFolder();
    const components = ComponentManager.scanWorkspaceForComponents(workspaceDirectory);
    
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
      fsUtils.writeFileAndOpen(path.join(workspaceDirectory, this.config.componentHierarchyMarkdownFilename), markdownContent);
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