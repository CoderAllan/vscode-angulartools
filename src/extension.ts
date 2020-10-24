// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { 
  ListAllImports,
  PackageJsonToMarkdown,
  ProjectDirectoryStructure
} from './commands';

export function activate(context: vscode.ExtensionContext) {

  const cmdPrefix = 'angulartools';

  const listAllImportsDisposable = vscode.commands.registerCommand(`${cmdPrefix}.${ListAllImports.commandName}`, () => {
    const command = new ListAllImports();
    command.execute();
  });
  context.subscriptions.push(listAllImportsDisposable);

  const projectDirectoryStructureDisposable = vscode.commands.registerCommand(`${cmdPrefix}.${ProjectDirectoryStructure.commandName}`, () => {
    const command = new ProjectDirectoryStructure();
    command.execute();
  });
  context.subscriptions.push(projectDirectoryStructureDisposable);

  const packageJsonToMarkdownDisposable = vscode.commands.registerCommand(`${cmdPrefix}.${PackageJsonToMarkdown.commandName}`, () => {
    const command = new PackageJsonToMarkdown();
    command.execute();
  });
  context.subscriptions.push(packageJsonToMarkdownDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
