import * as vscode from 'vscode';

export class CommandBase {
  protected checkForOpenWorkspace() {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showErrorMessage('AngularTools: Must be in an open WorkSpace. Choose menu File -> Open Folder... to open a folder.');
      return;
    }
  }

  protected isTypescriptFile(filename: string): boolean {
    return filename.endsWith('.ts') && !filename.endsWith('index.ts');
  }
}