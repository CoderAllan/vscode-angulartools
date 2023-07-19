import { Config, FileSystemUtils } from '@src';
import { CommandBase } from '@commands';
import * as vscode from 'vscode';
import { Settings } from '@model';

export class ProjectDirectoryStructure extends CommandBase {
  private config = new Config();
  public static get commandName(): string { return 'projectDirectoryStructure'; }

  public execute() {
    this.checkForOpenWorkspace();
    const fsUtils = new FileSystemUtils();
    var workspaceFolder: string = fsUtils.getWorkspaceFolder();
    const settings: Settings = fsUtils.readProjectSettings(this.config);
    const directories: string[] = fsUtils.listDirectories(workspaceFolder, settings);
    this.writeDirectoryStructure(workspaceFolder, this.config.projectDirectoryStructureMarkdownFilename, directories);
  }

  private writeDirectoryStructure(workspaceFolder: string, filename: string, directories: string[]) {
    const angularToolsOutput = vscode.window.createOutputChannel(this.config.angularToolsOutputChannel);
    angularToolsOutput.clear();
    angularToolsOutput.appendLine('Project Directory Structure');
    angularToolsOutput.appendLine(`Workspace directory: ${workspaceFolder}\n`);
    angularToolsOutput.appendLine('Directories:');
    directories?.forEach(directoryFullPath => {
      var directoryName = directoryFullPath.replace(workspaceFolder, '.');
      angularToolsOutput.appendLine(directoryName);
    });
    angularToolsOutput.show();
  }
}