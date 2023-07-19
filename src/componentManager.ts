import * as fs from 'fs';
import path = require('path');

import { Config, FileSystemUtils, StringUtils } from '@src';
import { Component, Settings } from '@model';

export class ComponentManager {
  private static componentRegex = /@Component\({/ig;
  private static componentClassNameRegex = /export\s+class\s+(.*?)\s+/ims;
  private static templateUrlRegex = /.*templateUrl:.+\/(.+)'/i;
  private static selectorRegex = /.*selector:.+'(.+)'/i;
  private static endBracketRegex = /}\)/i;
  private static routerOutletRegex = /<router-outlet.*?>.*?<\/router-outlet>/ims;

  private static routesRegex = /:\s*?Routes\s*?=\s*?\[(.*?)\]/ims;
  private static loadChildrenRegex = /loadChildren: .*?then\s*\(.+?=>.+?\.(.+?)\)/i;
  private static routeComponentRegex = /component:\s*?(\w+?)\b/ig;
  private static childrenRegex = /children\s*?:\s*?\[(.*?)\]/ims;


  public static scanWorkspaceForComponents(directoryPath: string, settings: Settings): { [selector: string]: Component; } {
    const fsUtils = new FileSystemUtils();
    const componentOrModuleFilenames = fsUtils.listFiles(directoryPath, settings, this.isComponentOrModuleFile);
    const componentFilenames = componentOrModuleFilenames.filter(FileSystemUtils.isComponentFile);
    const components = ComponentManager.scanComponents(componentFilenames);
    ComponentManager.enrichComponentsFromComponentTemplates(components);
    const moduleFilenames = componentOrModuleFilenames.filter(FileSystemUtils.isModuleFile);
    ComponentManager.enrichComponentsFromModules(moduleFilenames, components);
    return components;
  }

  private static isComponentOrModuleFile(filename: string): boolean {
    return FileSystemUtils.isComponentFile(filename) || FileSystemUtils.isModuleFile(filename);
  }

  private static scanComponents(componentFilenames: string[]): { [selector: string]: Component; } {
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
      const componentClassNameMatch = this.componentClassNameRegex.exec(content);
      if (componentClassNameMatch !== null) {
        currentComponent.name = componentClassNameMatch[1];
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

  private static enrichComponentsFromModules(moduleFilenames: string[], componentHash: { [selector: string]: Component; }) {
    moduleFilenames.forEach((moduleFilename) => {
      const moduleContent = fs.readFileSync(moduleFilename);
      const match = this.routesRegex.exec(moduleContent.toString());
      if (match !== null) {
        let routesBody = match[1];
        this.parseRoutesBody(routesBody, moduleFilename, componentHash);
      }
    });
  }

  private static parseRoutesBody(routesBody: string, moduleFilename: string, componentDict: { [selector: string]: Component; }) {
    routesBody = StringUtils.removeComments(routesBody);
    const routesBodyParts = routesBody.split(",");
    // We assume that the routing module has a corresponding module with the same name
    // This only works if the routing module is named like 'moduleComponentName'-routing.module.ts
    if (!FileSystemUtils.isRoutingModuleFile(moduleFilename)) {
      return;
    }
    const moduleComponentFilename = moduleFilename.replace(FileSystemUtils.routingModuleFileExtension, FileSystemUtils.componentFileExtension);
    const componentDictKey = Object.keys(componentDict).find(key => componentDict[key].filename.endsWith(moduleComponentFilename));
    // if we didn't find the corresponding component we stop because we would not be able to link the components found in the routes to the current module component
    if (componentDictKey === undefined) {
      return;
    }
    const moduleComponent = componentDict[componentDictKey];
    routesBodyParts.forEach((routesBodyPart) => {
      const componentMatch = this.routeComponentRegex.exec(routesBodyPart);
      if (componentMatch !== null) {
        const componentName = componentMatch[1];
        const componentSelector = Object.keys(componentDict).find(key => componentDict[key].name === componentName);
        if (componentSelector !== undefined) {
          const component = componentDict[componentSelector];
          if (component !== undefined && componentSelector !== moduleComponent.selector) {
            component.componentsRoutingToThis.push(moduleComponent);
          }
        }
      }
      else {
        const loadChildrenMatch = this.loadChildrenRegex.exec(routesBodyPart);
        if (loadChildrenMatch !== null) {
          // TODO: Add logic for adding relations to the components referenced by the module reference
          
          // const moduleName = loadChildrenMatch[1];
          // console.log(`${moduleComponent.name} routing to module ${moduleName}`);
        }
      }
      const childrenMatch = this.childrenRegex.exec(routesBodyPart);
      if (childrenMatch !== null) {
        const childrenRoutesBody = childrenMatch[1];
        this.parseRoutesBody(childrenRoutesBody, moduleFilename, componentDict);
      }
    });

  }
}