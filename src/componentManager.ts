import * as fs from 'fs';
import path = require('path');

import { Config, FileSystemUtils } from '@src';
import { Component } from '@model';

export class ComponentManager {
  private static componentRegex = /@Component\({/ig;
  private static templateUrlRegex = /.*templateUrl:.+\/(.+)'/i;
  private static selectorRegex = /.*selector:.+'(.+)'/i;
  private static endBracketRegex = /}\)/i;
  private static routerOutletRegex = /<router-outlet.*?>.*?<\/router-outlet>/ims;

  public static findComponents(directoryPath: string): { [selector: string]: Component; } {
    const fsUtils = new FileSystemUtils();
    const config = new Config();
    const componentFilenames = fsUtils.listFiles(directoryPath, config.excludeDirectories, ComponentManager.isComponentFile);
    const components = ComponentManager.scanWorkspaceForComponents(componentFilenames);
    ComponentManager.enrichComponentsFromComponentTemplates(components);
    return components;
  }

  private static isComponentFile(filename: string): boolean {
    return filename.endsWith('.component.ts');
  }

  private static scanWorkspaceForComponents(componentFilenames: string[]): { [selector: string]: Component; } {
    const compHash: { [selector: string]: Component; } = {};
    componentFilenames.forEach((componentFilename) => {
      let componentDefinitionFound = false;
      let currentComponent = new Component('', componentFilename, "", "", [], true);
      const content = fs.readFileSync(componentFilename, 'utf8');
      const lines: string[] = content.split('\n');
      for (let i: number = 0; i < lines.length; i++) {
        let line = lines[i];
        let match = this.componentRegex.exec(line);
        if (match) {
          componentDefinitionFound = true;
        }
        if (componentDefinitionFound) {
          match = this.templateUrlRegex.exec(line);
          if (match) {
            currentComponent.templateFilename = path.join(path.dirname(componentFilename), match[1]);
          }
          match = this.selectorRegex.exec(line);
          if (match) {
            let currentSelector = match[1];
            currentSelector = currentSelector.replace("[", "");
            currentSelector = currentSelector.replace("]", "");
            currentComponent.selector = currentSelector;
          }
          match = this.endBracketRegex.exec(line);
          if (match) {
            break;
          }
        }
      }
      compHash[currentComponent.selector] = currentComponent;
    });
    return compHash;
  }

  private static enrichComponentsFromComponentTemplates(componentHash: { [selector: string]: Component; }) {
    for (let selector1 in componentHash) {
      const component = componentHash[selector1];
      if (fs.existsSync(component.templateFilename)) {
        const template = fs.readFileSync(component.templateFilename); // We read the entire template file
        component.isRouterOutlet = this.isComponentRouterOutlet(template);
        for (let selector2 in componentHash) {  // then we check if the template contains each of the selectors we found in the components
          let pattern = `</${selector2}>`;
          let index = template.indexOf(pattern);
          if (index >= 0) {
            component.subComponents = component.subComponents.concat(componentHash[selector2]);
            // If selector2 has been found in a template then it is not root
            componentHash[selector2].isRoot = false;
          }
          else {
            pattern = ` ${selector2}`;
            index = template.indexOf(pattern);
            if (index >= 0) {
              component.subComponents = component.subComponents.concat(componentHash[selector2]);
              // If selector2 has been found in a template then it is not root
              componentHash[selector2].isRoot = false;
            }
          }
        }
      }
    }
  }
  private static isComponentRouterOutlet(template: Buffer): boolean {
    const match = this.routerOutletRegex.exec(template.toString());
    return match !== null;
  }
}