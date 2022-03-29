import * as fs from 'fs';
import { ArrayUtils, Config, FileSystemUtils, StringUtils } from "@src";
import { Component, Directive, Injectable, NamedEntity, NgModule, Pipe, Project } from '@model';

export class ModuleManager {

  public static scanProject(directoryPath: string, errors: string[], isTypescriptFile: (filename: string) => boolean): Project {
    const fsUtils = new FileSystemUtils();
    const config = new Config();
    const moduleFilenames = fsUtils.listFiles(directoryPath, config.excludeDirectories, isTypescriptFile);
    const project = new Project();
    moduleFilenames.sort(ArrayUtils.sortStrings).forEach(filename => {
      const file = this.readTypescriptFile(filename, errors);
      if (file instanceof NgModule) {
        project.modules.push(file as NgModule);
        project.moduleNames.set(file.moduleName, file.moduleName);
      }
      else if (file instanceof Component) {
        project.components.set(file.name, file);
      }
      else if (file instanceof Pipe) {
        project.pipes.set(file.name, file);
      }
      else if (file instanceof Directive) {
        project.directives.set(file.name, file);
      }
      else if (file instanceof Injectable) {
        project.injectables.set(file.name, file);
      }
    });
    project.components.forEach(component => {
        this.setFilenames(component.dependencies, project);
    });
    project.injectables.forEach(injectable => {
        this.setFilenames(injectable.dependencies, project);
    });
    project.directives.forEach(directive => {
        this.setFilenames(directive.dependencies, project);
    });
    project.pipes.forEach(pipe => {
        this.setFilenames(pipe.dependencies, project);
    });
    return project;
  }

    private static setFilenames(dependencies: NamedEntity[], project: Project) {
        dependencies.forEach(injectable => {
            const filename = project.injectables.get(injectable.name)?.filename;
            if (filename !== undefined) {
                injectable.filename = filename;
            }
        });
    }

  private static readTypescriptFile(filename: string, errors: string[]): NgModule | Component | Directive | Pipe | Injectable | undefined {
    const fileContents = fs.readFileSync(filename).toString();
    let regex: RegExp = /@NgModule\s*\(\s*(\{.+?\})\s*\)\s*export\s+class\s+(\w+)\s+/ims;
    var match = regex.exec(fileContents);
    if (match !== null) {
      const moduleName = match[2];
      const moduleContents = match[1];
      try {
        const module: NgModule = this.parseModuleContents(moduleContents);
        module.filename = filename;
        module.moduleName = moduleName;

        regex = /:\s*?Routes\s*?=\s*?\[.\(*?\)\]/ims;
        match = regex.exec(fileContents);
        if (match !== null) {
          const routesBody = match[1];
          module.isRoutingModule = true;
        }
  
        return module;
      } catch (ex) {
        errors.push(`ModuleName: ${moduleName}\nFilename: ${filename}\nException: ${ex}\n${moduleContents}\n`);
        return undefined;
      }
    }
    regex = /@Component\s*\(\s*(\{.+?\})\s*\)\s*export\s+class\s+(\w+)\s+(.*)/ims;
    match = regex.exec(fileContents);
    if (match !== null) {
      const className = match[2];
      const component = new Component(className, filename);
      const classBody = match[3];
      this.enrichComponent(component, classBody);
      return component;
    }
    regex = /@Directive\s*\(.*?\)\s*export\s+class\s+(\w+)\s+(.*)/ims;
    const newDirective = this.parseNamedEntity(Directive, filename, fileContents, regex);
    if (newDirective !== undefined) {
        return newDirective;
    }
    regex = /@Pipe\s*\(.*?\)\s*export\s+class\s+(\w+)\s+(.*)/ims;
    const newPipe = this.parseNamedEntity(Pipe, filename, fileContents, regex);
    if (newPipe !== undefined) {
        return newPipe;
    }
    regex = /@Injectable\s*\(.*?\)\s*export\s+class\s+(\w+)\s+(.*)/ims;
    const newInjectable = this.parseNamedEntity(Injectable, filename, fileContents, regex);
    if (newInjectable !== undefined) {
        return newInjectable;
    }
  }

  private static parseNamedEntity<T extends NamedEntity>(entity: new (className: string, filename: string) => T, filename: string, fileContents: string, regex: RegExp): T | undefined {
    const match = regex.exec(fileContents);
    if (match !== null) {
        const className = match[1];
        const classBody = match[2];
        const newEntity = new entity(className, filename);
        this.parseConstructor(classBody, newEntity.dependencies);
        return newEntity;
    }
    return undefined;
  }

  private static enrichComponent(component: Component, classBody: string): void {
    this.parseConstructor(classBody, component.dependencies);
    this.matchMultipleSpecificDecorator(classBody, '@Input', component.filename, component.inputs);
    this.matchMultipleSpecificDecorator(classBody, '@output', component.filename, component.outputs);
    this.matchSpecificDecorator(classBody, '@ViewChild', component.filename, component.viewChilds);
    this.matchSpecificDecorator(classBody, '@ViewChildren', component.filename, component.viewChildren);
    this.matchSpecificDecorator(classBody, '@ContentChild', component.filename, component.contentChilds);
    this.matchSpecificDecorator(classBody, '@ContentChildren', component.filename, component.contentChildren);
  }

    private static parseConstructor(classBody: string, dependencies: NamedEntity[]) {
        let regex = /constructor\s*\((.*?)\)/ims;
        let match = regex.exec(classBody);
        if (match !== null) {
            const constructorParameters = match[1];
            regex = /\s*\w+\s+\w+\s*:\s*(\w+)[,]*/gims;
            match = regex.exec(constructorParameters);
            while (match) {
                dependencies.push(new NamedEntity(match[1], ''));
                match = regex.exec(constructorParameters);
            }
        }
    }

  private static matchMultipleSpecificDecorator(classBody: string, decorator: string, filename: string, decoratorArray: NamedEntity[]) {
    const regex =  new RegExp(decorator + '\\(\\)\\s+(?:public)?(?:protected)?(?:private)?\\s*(?:[gs]et)?\\s*(\\w+)\\s*[:=(]|' + decorator + '\\(["\'](.*?)["\']\\)', 'gms');
    let match: RegExpExecArray | null = regex.exec(classBody);
    while (match) {
      if (match[1]) {
        decoratorArray.push(new NamedEntity(match[1], filename));
      } else if (match[2]) {
        decoratorArray.push(new NamedEntity(match[2], filename));
      }
      match = regex.exec(classBody);
    }
  }

  private static matchSpecificDecorator(classBody: string, decorator: string, filename: string, decoratorArray: NamedEntity[]) {
    const regex =  new RegExp(decorator + '\\s*\\(\\s*[\'"]?(\\w+)[\'"]?.*?\\)', 'gms');
    let match: RegExpExecArray | null = regex.exec(classBody);
    while (match) {
      if (match[1]) {
        decoratorArray.push(new NamedEntity(match[1], filename));
      }
      match = regex.exec(classBody);
    }    
  }

  private static parseModuleContents(moduleContents: string): NgModule {
    moduleContents = StringUtils.removeComments(moduleContents);
    const module = new NgModule();
    let section = this.getSection(moduleContents, 'imports');
    if (section.length > 0) {
      module.imports = this.parseSection(section);
    }
    section = this.getSection(moduleContents, 'exports');
    if (section.length > 0) {
      module.exports = this.parseSection(section);
    }
    section = this.getSection(moduleContents, 'declarations');
    if (section.length > 0) {
      module.declarations = this.parseSection(section);
    }
    section = this.getSection(moduleContents, 'entryComponents');
    if (section.length > 0) {
      module.entryComponents = this.parseSection(section);
    }
    section = this.getSection(moduleContents, 'providers');
    if (section.length > 0) {
      module.providers = this.parseSection(section);
    }
    section = this.getSection(moduleContents, 'bootstrap');
    if (section.length > 0) {
      module.bootstrap = this.parseSection(section);
    }
    return module;
  }

  private static getSection(moduleContents: string, sectionName: string): string {
    const regex = new RegExp("\\s*" + sectionName + ":\\s*\\[", "igms");
    const match = regex.exec(moduleContents);
    let section = '';
    if (match) {
      let endSectionFound = false;
      let inBrackets = 0;
      for (let currentPos = match.index; currentPos < moduleContents.length && !endSectionFound; currentPos++) {
        let currentChar = moduleContents.charAt(currentPos);
        switch (currentChar) {
          case '[':
            inBrackets++;
            break;
          case ']':
            inBrackets--;
            if (inBrackets === 0) {
              endSectionFound = true;
              section = moduleContents.substr(match.index + match[0].length, currentPos - match.index - match[0].length);
            }
        }
      }
    }
    return section;
  }

  private static parseSection(sectionContents: string): string[] {
    const result: string[] = [];
    let currentElement = '';
    let inBrackets = 0;
    for (let currentPos = 0; currentPos < sectionContents.length; currentPos++) {
      let currentChar = sectionContents.charAt(currentPos);
      switch (currentChar) {
        case ',':
          if (inBrackets === 0) {
            currentElement = currentElement.replace(/^\s+|\s+$|[\r\t\n|,]/igms, '');
            if (currentElement.length > 0) {
              result.push(currentElement);
            }
            currentElement = '';
          } else {
            currentElement += currentChar;
          }
          break;
        case '{':
        case '(':
        case '[':
          inBrackets++;
          currentElement += currentChar;
          break;
        case '}':
        case ')':
        case ']':
          inBrackets--;
          currentElement += currentChar;
          break;
        default:
          currentElement += currentChar;
      }
    }
    currentElement = currentElement.replace(/^\s+|\s+$|[\r\t\n|,]/igms, '');
    if (currentElement.length > 0) {
      result.push(currentElement);
    }
    return result;
  }
}