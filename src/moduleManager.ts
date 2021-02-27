import * as fs from 'fs';
import { ArrayUtils, Config, FileSystemUtils } from "@src";

export class NgModule {
  public imports: string[] = [];
  public exports: string[] = [];
  public declarations: string[] = [];
  public entryComponents: string[] = [];
  public providers: string[] = [];
  public bootstrap: string[] = [];
  public filename: string = '';
  public moduleName: string = '';
  public moduleStats(): number[] {
    return [
      this.declarations === undefined ? 0 : ArrayUtils.arrayLength(this.declarations),
      this.imports === undefined ? 0 : ArrayUtils.arrayLength(this.imports),
      this.exports === undefined ? 0 : ArrayUtils.arrayLength(this.exports),
      this.bootstrap === undefined ? 0 : ArrayUtils.arrayLength(this.bootstrap),
      this.providers === undefined ? 0 : ArrayUtils.arrayLength(this.providers),
      this.entryComponents === undefined ? 0 : ArrayUtils.arrayLength(this.entryComponents),
    ];
  }
}

export class NamedEntity {
  public name: string = '';
  public constructor(name: string) {
    this.name = name;
  }
}
class Directive extends NamedEntity { }
class Pipe extends NamedEntity { }
class Injectable extends NamedEntity { }
class Component extends NamedEntity { 
  public dependencyInjections: string[] = [];
}
export class Project {
  public modules: NgModule[] = [];
  public moduleNames: Map<string, string> = new Map<string, string>();
  public components: Map<string, Component> = new Map<string, Component>();
  public pipes: Map<string, string> = new Map<string, string>();
  public directives: Map<string, string> = new Map<string, string>();
  public injectables: Map<string, string> = new Map<string, string>();
}

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
        project.pipes.set(file.name, file.name);
      }
      else if (file instanceof Directive) {
        project.directives.set(file.name, file.name);
      }
      else if (file instanceof Injectable) {
        project.directives.set(file.name, file.name);
      }
    });
    return project;
  }

  private static readTypescriptFile(filename: string, errors: string[]): NgModule | Component | Directive | Pipe | Injectable | undefined {
    const fileContents = fs.readFileSync(filename);
    let regex: RegExp = /@NgModule\s*\(\s*(\{.+?\})\s*\)\s*export\s+class\s+(\w+)\s+/ims;
    var match = regex.exec(fileContents.toString());
    if (match !== null) {
      const moduleName = match[2];
      const moduleContents = match[1];
      try {
        const module: NgModule = this.parseModuleContents(moduleContents);
        module.filename = filename;
        module.moduleName = moduleName;
        return module;
      } catch (ex) {
        errors.push(`ModuleName: ${moduleName}\nFilename: ${filename}\nException: ${ex}\n${match[1]}\n`);
        return undefined;
      }
    }
    regex = /@Component\s*\(\s*(\{.+?\})\s*\)\s*export\s+class\s+(\w+)\s+(.*)/ims;
    var match = regex.exec(fileContents.toString());
    if (match !== null) {
      const className = match[2];
      const component = new Component(className);
      const classBody = match[3];
      regex = /constructor\s*\((.*?)\)/ims;
      match = regex.exec(classBody);
      if (match !== null) {
        const constructorParameters = match[1];
        regex = /\s*\w+\s+\w+\s*:\s*(\w+)[,]*/gims;
        while(match = regex.exec(constructorParameters)) {
          component.dependencyInjections.push(match[1]);
        }
      }
      return component;
    }
    regex = /@Directive\s*\(\s*(\{.+?\})\s*\)\s*export\s+class\s+(\w+)\s+/ims;
    var match = regex.exec(fileContents.toString());
    if (match !== null) {
      return new Directive(match[2]);
    }
    regex = /@Pipe\s*\(\s*(\{.+?\})\s*\)\s*export\s+class\s+(\w+)\s+/ims;
    var match = regex.exec(fileContents.toString());
    if (match !== null) {
      return new Pipe(match[2]);
    }
    regex = /@Injectable\s*\(\s*(\{.+?\})\s*\)\s*export\s+class\s+(\w+)\s+/ims;
    var match = regex.exec(fileContents.toString());
    if (match !== null) {
      return new Injectable(match[2]);
    }
  }

  private static parseModuleContents(moduleContents: string): NgModule {
    moduleContents = moduleContents.replace(/\s*?\/\/.*$/igm, () => ''); // Remove comments
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