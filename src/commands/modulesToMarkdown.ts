import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import { ArrayUtils, Config, FileSystemUtils } from '@src';
import { CommandBase } from '@commands';

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

export class ModulesToMarkdown extends CommandBase {
  private config = new Config();
  public static get commandName(): string { return 'modulesToMarkdown'; }

  public execute() {
    this.checkForOpenWorkspace();
    const fsUtils = new FileSystemUtils();
    var workspaceDirectory: string = fsUtils.getWorkspaceFolder();
    const filenames = fsUtils.listFiles(workspaceDirectory, this.config.excludeDirectories, this.isTypescriptFile);
    let markdownContent = '# Modules\n\n';
    const errors: string[] = [];
    const modules: NgModule[] = [];
    filenames.sort(ArrayUtils.sortStrings).forEach(filename => {
      const module = this.readModule(filename, errors);
      if (module !== undefined) {
        modules.push(module);
      }
    });
    markdownContent = markdownContent +
      '## Modules in workspace\n\n' +
      '| Module | Declarations | Imports | Exports | Bootstrap | Providers | Entry points |\n' +
      '| ---| --- | --- | --- | --- | --- | --- |\n';
    let modulesMarkdown: string = '';
    modules.forEach(module => {
      markdownContent = markdownContent + '| ' + module.moduleName + ' | ' + module.moduleStats().join(' | ') + ' |\n';
      modulesMarkdown = modulesMarkdown + this.generateModuleMarkdown(module);
    });
    markdownContent = markdownContent + '\n' + modulesMarkdown;
    if (errors.length > 0) {
      this.showErrors(errors);
    }
    fsUtils.writeFileAndOpen(path.join(workspaceDirectory, this.config.modulesToMarkdownFilename), markdownContent);
  }

  private readModule(filename: string, errors: string[]): NgModule | undefined {
    const fileContents = fs.readFileSync(filename);
    const regex: RegExp = /@NgModule\s*\(\s*(\{.+?\})\s*\)\s*export\s+class\s+(\w+)\s*\{/ims;
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

  private parseModuleContents(moduleContents: string): NgModule {
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

  private getSection(moduleContents: string, sectionName: string): string {
    const regex = new RegExp("\\s*" + sectionName + ":\\s*\\[", "igms");
    const match = regex.exec(moduleContents);
    let section = '';
    if(match) {
      let endSectionFound = false;
      let inBrackets = 0;
      for(let currentPos = match.index; currentPos < moduleContents.length && !endSectionFound; currentPos++){
        let currentChar = moduleContents.charAt(currentPos);
        switch(currentChar){
          case '[':
            inBrackets++;
            break;
          case ']':
            inBrackets--;
            if(inBrackets === 0) {
              endSectionFound = true;
              section = moduleContents.substr(match.index + match[0].length, currentPos - match.index - match[0].length);
            }
        }
      }
    }
    return section;
  }

  private parseSection(sectionContents: string): string[] {
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

  private generateModuleMarkdown(module: NgModule): string {
    let markdown = `## ${module.moduleName}\n\n`;
    markdown = markdown +
      'Filename: ' + module.filename + '\n\n' +
      '| Section | Classes, service, modules |\n' +
      '| ---- |:-----------|\n' +
      '| Declarations | ' + ArrayUtils.arrayToMarkdown(module.declarations) + ' |\n' +
      '| Imports | ' + ArrayUtils.arrayToMarkdown(module.imports) + ' |\n' +
      '| Exports | ' + ArrayUtils.arrayToMarkdown(module.exports) + ' |\n' +
      '| Bootstrap | ' + ArrayUtils.arrayToMarkdown(module.bootstrap) + ' |\n' +
      '| Providers | ' + ArrayUtils.arrayToMarkdown(module.providers) + ' |\n' +
      '| Entry components | ' + ArrayUtils.arrayToMarkdown(module.entryComponents) + ' |\n' +
      '\n';

    return markdown;
  }

  private showErrors(errors: string[]) {
    const angularToolsOutput = vscode.window.createOutputChannel(this.config.angularToolsOutputChannel);
    angularToolsOutput.clear();
    angularToolsOutput.appendLine(`Parsing of ${errors.length > 1 ? 'some' : 'one'} of the modules failed.\n`);
    angularToolsOutput.appendLine('Below is a list of the errors.');
    angularToolsOutput.appendLine(errors.join('\n'));
    angularToolsOutput.show();
  }
}