// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import {
  ComponentHierarchyMarkdown,
  ListAllImports,
  ModulesToMarkdown,
  PackageJsonToMarkdown,
  ProjectDirectoryStructure,
  ShowComponentHierarchy,
  ShowModuleHierarchy,
  GenerateDependencyInjectionGraph
} from '@commands';

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

  const modulesToMarkdownDisposable = vscode.commands.registerCommand(`${cmdPrefix}.${ModulesToMarkdown.commandName}`, () => {
    const command = new ModulesToMarkdown();
    command.execute();
  });
  context.subscriptions.push(modulesToMarkdownDisposable);

  const packageJsonToMarkdownDisposable = vscode.commands.registerCommand(`${cmdPrefix}.${PackageJsonToMarkdown.commandName}`, () => {
    const command = new PackageJsonToMarkdown();
    command.execute();
  });
  context.subscriptions.push(packageJsonToMarkdownDisposable);

  const componentHierarchyMarkdownDisposable = vscode.commands.registerCommand(`${cmdPrefix}.${ComponentHierarchyMarkdown.commandName}`, () => {
    const command = new ComponentHierarchyMarkdown();
    command.execute();
  });
  context.subscriptions.push(componentHierarchyMarkdownDisposable);

  let componentHierarchyPanel: vscode.WebviewPanel | undefined = undefined;
  const showComponentHierarchyDisposable = vscode.commands.registerCommand(`${cmdPrefix}.${ShowComponentHierarchy.commandName}`, () => {
    if (componentHierarchyPanel !== undefined) {
      componentHierarchyPanel.reveal(vscode.ViewColumn.One);
    } else {
      componentHierarchyPanel = vscode.window.createWebviewPanel(
        'angularTools_showComponentHierarchy',
        'Angular component hierarchy',
        vscode.ViewColumn.One,
        {
          enableScripts: true
        }
      );
      componentHierarchyPanel.onDidDispose(() => {
      }, null, context.subscriptions);
    }
    componentHierarchyPanel.onDidDispose(() => componentHierarchyPanel = undefined, undefined, context.subscriptions);
    const command = new ShowComponentHierarchy(context);
    command.execute(componentHierarchyPanel.webview);
  });
  context.subscriptions.push(showComponentHierarchyDisposable);

  let moduleHierarchyPanel: vscode.WebviewPanel | undefined = undefined;
  const showModuleHierarchyDisposable = vscode.commands.registerCommand(`${cmdPrefix}.${ShowModuleHierarchy.commandName}`, () => {
    if (moduleHierarchyPanel !== undefined) {
      moduleHierarchyPanel.reveal(vscode.ViewColumn.One);
    } else {
      moduleHierarchyPanel = vscode.window.createWebviewPanel(
        'angularTools_showModuleHierarchy',
        'Angular module hierarchy',
        vscode.ViewColumn.One,
        {
          enableScripts: true
        }
      );
      moduleHierarchyPanel.onDidDispose(() => {
      }, null, context.subscriptions);
    }
    moduleHierarchyPanel.onDidDispose(() => moduleHierarchyPanel = undefined, undefined, context.subscriptions);
    const command = new ShowModuleHierarchy(context);
    command.execute(moduleHierarchyPanel.webview);
  });
  context.subscriptions.push(showModuleHierarchyDisposable);

  let dependencyInjectionGraphPanel: vscode.WebviewPanel | undefined = undefined;
  const generateDependencyInjectionGraphDisposable = vscode.commands.registerCommand(`${cmdPrefix}.${GenerateDependencyInjectionGraph.commandName}`, () => {
    if (dependencyInjectionGraphPanel !== undefined) {
      dependencyInjectionGraphPanel.reveal(vscode.ViewColumn.One);
    } else {
      dependencyInjectionGraphPanel = vscode.window.createWebviewPanel(
        'angularTools_generateDependencyInjectionGraph',
        'Angular dependency injection graph',
        vscode.ViewColumn.One,
        {
          enableScripts: true
        }
      );
      dependencyInjectionGraphPanel.onDidDispose(() => {
      }, null, context.subscriptions);
    }
    dependencyInjectionGraphPanel.onDidDispose(() => dependencyInjectionGraphPanel = undefined, undefined, context.subscriptions);
    const command = new GenerateDependencyInjectionGraph(context);
    command.execute(dependencyInjectionGraphPanel.webview);
  });
  context.subscriptions.push(generateDependencyInjectionGraphDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
