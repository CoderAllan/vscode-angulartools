import * as fs from 'fs';
import { ArrayUtils, Config, FileSystemUtils } from "@src";

export interface INgModule {
  imports: string[];
  exports: string[];
  declarations: string[];
  entryComponents: string[];
  providers: string[];
  bootstrap: string[];
}

export class NgModule implements INgModule {
  public imports: string[] = [];
  public exports: string[] = [];
  public declarations: string[] = [];
  public entryComponents: string[] = [];
  public providers: string[] = [];
  public bootstrap: string[] = [];
  public filename: string = '';
  public moduleName: string = '';
  public moduleContents: string = '';
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

export class ModuleManager {

  public static findModules(directoryPath: string, errors: string[], isTypescriptFile: (filename: string) => boolean): NgModule[] {
    const fsUtils = new FileSystemUtils();
    const config = new Config();
    const moduleFilenames = fsUtils.listFiles(directoryPath, config.excludeDirectories, isTypescriptFile);
    const modules: NgModule[] = [];
    moduleFilenames.sort(ArrayUtils.sortStrings).forEach(filename => {
      const module = this.readModule(filename, errors);
      if (module !== undefined) {
        modules.push(module);
      }
    });
    return modules;
  }

  private static readModule(filename: string, errors: string[]): NgModule | undefined {
    const fileContents = fs.readFileSync(filename);
    const regex: RegExp = /@NgModule\s*\(\s*(\{.+?\})\s*\)\s*export\s+class\s+(\w+)\s+/ims;
    var match = regex.exec(fileContents.toString());
    if (match !== null) {
      const moduleName = match[2];
      const moduleContents = match[1];
      try {
        const module: NgModule = this.parseModuleContents(moduleContents);
        module.filename = filename;
        module.moduleName = moduleName;
        module.moduleContents = moduleContents;
        return module;
      } catch (ex) {
        errors.push(`ModuleName: ${moduleName}\nFilename: ${filename}\nException: ${ex}\n${match[1]}\n`);
        return undefined;
      }
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