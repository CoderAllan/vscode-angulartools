import { Config, FileSystemUtils } from '@src';
import * as vscode from 'vscode';

export class ProjectDirectoryStructure {
  public static get commandName(): string { return 'projectDirectoryStructure'; }

  public execute() {
    const fsUtils = new FileSystemUtils();
    var workspaceDirectory: string = fsUtils.getWorkspaceFolder();
    const directories: string[] = fsUtils.listDirectories(workspaceDirectory, Config.excludeDirectories);
    this.writeDirectoryStructure(workspaceDirectory, Config.projectDirectoryStructureMarkdownFilename, directories);
  }

  private writeDirectoryStructure(workSpaceDirectory: string, filename: string, directories: string[]) {
    const angularToolsOutput = vscode.window.createOutputChannel(Config.angularToolsOutputChannel);
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