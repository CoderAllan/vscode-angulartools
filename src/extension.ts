// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { 
  ComponentHierarchyDgml,
  ListAllImports,
  PackageJsonToMarkdown,
  ProjectDirectoryStructure,
  ShowComponentHierarchy
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

  const componentHierarchyDgmlDisposable = vscode.commands.registerCommand(`${cmdPrefix}.${ComponentHierarchyDgml.commandName}`, () => {
    const command = new ComponentHierarchyDgml();
    command.execute();
  });
  context.subscriptions.push(componentHierarchyDgmlDisposable);

  const showComponentHierarchyDisposable = vscode.commands.registerCommand(`${cmdPrefix}.${ShowComponentHierarchy.commandName}`, () => {
    const componentHierarchyPanel = vscode.window.createWebviewPanel(
      'angularTools_showComponentHierarchy',
      'Angular component hierarchy',
      vscode.ViewColumn.One,
      {
        enableScripts: true
      }
    );
    componentHierarchyPanel.onDidDispose(() => {  

    }, null, context.subscriptions );
    const command = new ShowComponentHierarchy(context);
    command.execute(componentHierarchyPanel.webview);
  });
  context.subscriptions.push(showComponentHierarchyDisposable);}

// this method is called when your extension is deactivated
export function deactivate() { }
