import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import { ArrayUtils, Config, FileSystemUtils } from '@src';

export interface INgModule {
  imports: string[];
  exports: string[];
  declarations: string[];
  entryComponents: string[];
  providers: string[];
  bootstrap: string[];
}

export class NgModule implements INgModule {
  constructor(private data: INgModule) {
    this.imports = data.imports;
    this.exports = data.exports;
    this.declarations = data.declarations;
    this.entryComponents = data.entryComponents;
    this.providers = data.providers;
    this.bootstrap = data.bootstrap;
  }
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

export class ModulesToMarkdown {
  private config = new Config();
  public static get commandName(): string { return 'modulesToMarkdown'; }

  public execute() {
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
      markdownContent = markdownContent + '| ' + module.moduleName + ' | ' +  module.moduleStats().join(' | ') + ' |\n';
      modulesMarkdown = modulesMarkdown + this.generateModuleMarkdown(module);
    });
    markdownContent = markdownContent + '\n' +modulesMarkdown;
    if (errors.length > 0) {
      this.showErrors(errors);
    }
    fsUtils.writeFileAndOpen(path.join(workspaceDirectory, this.config.modulesToMarkdownFilename), markdownContent);
  }

  private isTypescriptFile(filename: string): boolean {
    return filename.endsWith('.ts') && !filename.endsWith('index.ts');
  }

  private readModule(filename: string, errors: string[]): NgModule | undefined {
    const fileContents = fs.readFileSync(filename);
    const regex: RegExp = /@NgModule\s*\(\s*(\{.+?\})\s*\)\s*export\s+class\s+(\w+)\s*\{/ims;
    var match = regex.exec(fileContents.toString());
    if (match !== null) {
      const moduleName = match[2];
      const moduleContents = this.convertNgModuleToParsableJson(match[1]);
      try {
        const module: NgModule = new NgModule(JSON.parse(moduleContents));
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

  private convertNgModuleToParsableJson(moduleContents: string): string {
    moduleContents = moduleContents.replace(/\s*?\/\/.*$/igm, () => ''); // Remove comments
    moduleContents = moduleContents.replace(/\{\s*provide:\s*(.+?)\s*,\s*use\w+:\s*(.+?)\s*(,\s.*?)*\s*?\}[\s\}]*/igms, (str, provided, provider) => `"${provided.replace(/['"]/gms, '')} provided by ${provider.replace(/[\{\} ']/igms, '').replace(':', '=')}"`); // format providers ;
    moduleContents = moduleContents.replace("'", "\""); // Single quotes to double-quotes
    moduleContents = moduleContents.replace(/\s*?(\w+)[,\r\n]\s*?/igms, (str, identifier) => `"${identifier}",`); // quotes around array items
    moduleContents = moduleContents.replace(/(\w+\.\w+\(\))[,\r\n]/igms, (str, identifier) => `"${identifier}",`); // quotes around array items
    moduleContents = moduleContents.replace(/\[\s*([\w_\(\)\.]+?)\s*\]/igms, (str, identifier) => `"${identifier}"`); // quotes around array items
    moduleContents = moduleContents.replace(/(\w+\.\w+\().*?(\))[,\r\n]/igms, (str, identifier, idEnd) => `"${identifier}...${idEnd}",`); // quotes around array items
    moduleContents = moduleContents.replace(/("\s*),(\s+\])/igms, (str, quote, arrayEnd) => quote + arrayEnd); // Remove illegal empty array ending
    moduleContents = moduleContents.replace(/(\w+)\s*:/g, (str, identifier) => `"${identifier}":`); // quotes around identifiers
    return moduleContents;
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