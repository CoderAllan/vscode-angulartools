import { Config, FileSystemUtils } from '@src';
import { CommandBase } from '@commands';
import * as vscode from 'vscode';

export class ProjectDirectoryStructure extends CommandBase {
  private config = new Config();
  public static get commandName(): string { return 'projectDirectoryStructure'; }

  public execute() {
    this.checkForOpenWorkspace();
    const fsUtils = new FileSystemUtils();
    var workspaceDirectory: string = fsUtils.getWorkspaceFolder();
    const directories: string[] = fsUtils.listDirectories(workspaceDirectory, this.config.excludeDirectories);
    this.writeDirectoryStructure(workspaceDirectory, this.config.projectDirectoryStructureMarkdownFilename, directories);
  }

  private writeDirectoryStructure(workSpaceDirectory: string, filename: string, directories: string[]) {
    const angularToolsOutput = vscode.window.createOutputChannel(this.config.angularToolsOutputChannel);
    angularToolsOutput.clear();
    angularToolsOutput.appendLine('Project Directory Structure');
    angularToolsOutput.appendLine(`Workspace directory: ${workSpaceDirectory}\n`);
    angularToolsOutput.appendLine('Directories:');
    directories?.forEach(directoryFullPath => {
      var directoryName = directoryFullPath.replace(workSpaceDirectory, '.');
      angularToolsOutput.appendLine(directoryName);
    });
    angularToolsOutput.show();
  }
}