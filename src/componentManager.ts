import * as fs from 'fs';
import path = require('path');

import { Config , FileSystemUtils } from '@src';

export class Component {

  constructor(tsFilename: string, templateFilename: string, selector: string, subComponents: Component[], isRoot: boolean) {
    this.tsFilename = tsFilename;
    this.templateFilename = templateFilename;
    this.selector = selector;
    this.subComponents = subComponents;
    this.isRoot = isRoot;
  }
  
  public tsFilename: string;
  public templateFilename: string;
  public selector: string;
  public subComponents: Component[];
  public isRoot: boolean;
}

export class ComponentManager {

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
    const componentRegex = /@Component\({/ig;
    const templateUrlRegex = /.*templateUrl:.+\/(.+)'/i;
    const selectorRegex = /.*selector:.+'(.+)'/i;
    const endBracketRegex = /}\)/i;
    componentFilenames.forEach((componentFilename) => {
      let componentDefinitionFound = false;
      let currentComponent = new Component(componentFilename, "", "", [], true);
      const content = fs.readFileSync(componentFilename, 'utf8');
      const lines: string[] = content.split('\n');
      for (let i: number = 0; i < lines.length; i++) {
        let line = lines[i];
        let match = componentRegex.exec(line);
        if (match) {
          componentDefinitionFound = true;
        }
        if (componentDefinitionFound) {
          match = templateUrlRegex.exec(line);
          if (match) {
            currentComponent.templateFilename = path.join(path.dirname(componentFilename), match[1]);
          }
          match = selectorRegex.exec(line);
          if (match) {
            let currentSelector = match[1];
            currentSelector = currentSelector.replace("[", "");
            currentSelector = currentSelector.replace("]", "");
            currentComponent.selector = currentSelector;
          }
          match = endBracketRegex.exec(line);
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
      if (fs.existsSync(componentHash[selector1].templateFilename)) {
        const template = fs.readFileSync(componentHash[selector1].templateFilename); // We read the entire template file
        for (let selector2 in componentHash) {  // then we check if the template contains each of the selectors we found in the components
          let pattern = `</${selector2}>`;
          let index = template.indexOf(pattern);
          if (index >= 0) {
            componentHash[selector1].subComponents = componentHash[selector1].subComponents.concat(componentHash[selector2]);
            // If selector2 has been found in a template then it is not root
            componentHash[selector2].isRoot = false;
          }
          else {
            pattern = ` ${selector2}`;
            index = template.indexOf(pattern);
            if (index >= 0) {
              componentHash[selector1].subComponents = componentHash[selector1].subComponents.concat(componentHash[selector2]);
              // If selector2 has been found in a template then it is not root
              componentHash[selector2].isRoot = false;
            }
          }
        }
      }
    }
  }  
}