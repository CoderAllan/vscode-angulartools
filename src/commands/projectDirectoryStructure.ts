import * as vscode from 'vscode';
import { FileSystemUtils } from '../filesystemUtils';

export class ProjectDirectoryStructure {
  public static get commandName(): string { return 'projectDirectoryStructure'; }

  public execute() {
    const fsUtils = new FileSystemUtils();
    var workspaceDirectory: string = fsUtils.getWorkspaceFolder();
    const excludeDirectories = ['bin', 'obj', 'node_modules', 'dist', 'packages', '.git', '.vs', '.github'];
    const directories: string[] = fsUtils.listDirectories(workspaceDirectory, excludeDirectories);
    this.writeDirectoryStructure(workspaceDirectory, 'ReadMe-ProjectDirectoryStructure.md', directories);
  }

  private writeDirectoryStructure(workSpaceDirectory: string, filename: string, directories: string[]) {
    const angularToolsOutput = vscode.window.createOutputChannel("Angular Tools");
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