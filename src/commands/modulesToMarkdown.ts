import * as vscode from 'vscode';
import * as path from 'path';
import { ArrayUtils, Config, FileSystemUtils, ModuleManager, NgModule } from '@src';
import { CommandBase } from '@commands';
import { Project } from '@model';

export class ModulesToMarkdown extends CommandBase {
  private config = new Config();
  public static get commandName(): string { return 'modulesToMarkdown'; }

  public execute() {
    this.checkForOpenWorkspace();
    const fsUtils = new FileSystemUtils();
    var workspaceDirectory: string = fsUtils.getWorkspaceFolder();
    let markdownContent = '# Modules\n\n';
    const errors: string[] = [];
    const project: Project = ModuleManager.scanProject(workspaceDirectory, errors, this.isTypescriptFile);
    markdownContent = markdownContent +
      '## Modules in workspace\n\n' +
      '| Module | Declarations | Imports | Exports | Bootstrap | Providers | Entry points |\n' +
      '| ---| --- | --- | --- | --- | --- | --- |\n';
    let modulesMarkdown: string = '';
    project.modules.forEach(module => {
      markdownContent = markdownContent + '| ' + module.moduleName + ' | ' + module.moduleStats().join(' | ') + ' |\n';
      modulesMarkdown = modulesMarkdown + this.generateModuleMarkdown(module);
    });
    markdownContent = markdownContent + '\n' + modulesMarkdown;
    if (errors.length > 0) {
      this.showErrors(errors);
    }
    fsUtils.writeFileAndOpen(path.join(workspaceDirectory, this.config.modulesToMarkdownFilename), markdownContent);
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