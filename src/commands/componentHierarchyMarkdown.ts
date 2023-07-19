import { CommandBase } from '@commands';
import { Component, Settings } from '@model';
import { Config, ComponentManager, FileSystemUtils } from '@src';
import * as path from 'path';

export class ComponentHierarchyMarkdown extends CommandBase {
    private config = new Config();
    public static get commandName(): string { return 'componentHierarchyMarkdown'; }

    public execute() {
        this.checkForOpenWorkspace();
        const fsUtils = new FileSystemUtils();
        var workspaceFolder: string = fsUtils.getWorkspaceFolder();
        const settings: Settings = fsUtils.readProjectSettings(this.config);
        const components = ComponentManager.scanWorkspaceForComponents(workspaceFolder, settings);

        let relations: string = '';
        const addRelation = (from: string, to: string, visible: boolean) => {
            const relationType = visible ? "-->" : "~~~";
            relations = relations + `    ${from}${relationType}${to}\n`;
        };
        try {
            this.addMermaidRelations(components, addRelation);
            const markdownContent = '# Component hierarchy\n\n' +
                '```mermaid\n' +
                'graph TD;\n' +
                relations +
                '```\n';
            fsUtils.writeFileAndOpen(path.join(workspaceFolder, this.config.componentHierarchyMarkdownFilename), markdownContent);
        } catch (ex) {
            console.log('Angular Tools Exception: ' + ex);
        }
    }

    private addMermaidRelations(componentHash: { [selector: string]: Component; }, addRelation: (from: string, to: string, visible: boolean) => void) {
        for (let selector in componentHash) {
            const component = componentHash[selector];
            if (component.isRoot) {
                this.generateMermaidRelation(component.subComponents, selector, "", addRelation);
            }
        }
    }

    private generateMermaidRelation(subComponents: Component[], displayName: string, parentDisplayName: string, addRelation: (from: string, to: string, visible: boolean) => void) {
        if (parentDisplayName.length > 0) {
            addRelation(parentDisplayName, displayName, true);
        }
        else {
            addRelation(displayName, displayName, false);
        }
        if (subComponents.length > 0) {
            subComponents.forEach((subComponent) => {
                this.generateMermaidRelation(subComponent.subComponents, subComponent.selector, displayName, addRelation);
            });
        }
    }
}