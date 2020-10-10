// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "angulartools" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const listAllImportsDisposable = vscode.commands.registerCommand('angulartools.listAllImports', () => {
    // The code you place here will be executed every time your command is executed
    var directoryPath: string = getWorkspaceFolder();
    const excludeDirectories = ['bin', 'obj', 'node_modules', 'dist', 'packages', '.git', '.vs', '.github'];
    const isTypescriptFile = (filename: string): boolean => filename.endsWith('.ts') && !filename.endsWith('index.ts');
    const files = listFiles(directoryPath, excludeDirectories, isTypescriptFile);
    console.log('files:' + files.length);
    writeResult('imports.txt', files);
    // Display a message box to the user
    //vscode.window.showInformationMessage('Hello World from AngularTools!\n' + directoryPath + '\n');
  });
  context.subscriptions.push(listAllImportsDisposable);

  const projectDirectoryStructureDisposable = vscode.commands.registerCommand('angulartools.projectDirectoryStructure', () => {
    var directoryPath: string = getWorkspaceFolder();
    const excludeDirectories = ['bin', 'obj', 'node_modules', 'dist', 'packages', '.git', '.vs', '.github'];
    const gDirectories: string[] = listDirectories(directoryPath, excludeDirectories);
    writeDirectoryStructure(directoryPath, 'projectDirectoryStructure.txt', gDirectories);
    vscode.window.showInformationMessage('Hello World from AngularTools!\n');
  });
  context.subscriptions.push(projectDirectoryStructureDisposable);
}

function getWorkspaceFolder(): string {
  var folder = vscode.workspace.workspaceFolders;
  var directoryPath: string = '';
  if (folder != null) {
    directoryPath = folder[0].uri.fsPath;
  }
  return directoryPath;
}

const imports: { [module: string]: number } = {};
function writeResult(filename: string, results: string[]) {
  if (!results) { return; }
  for (let i = 0; i < results.length; i++) {
    var file = results[i];
    const regex: RegExp = new RegExp('.*?\\s+from\\s+[\'"](.+)[\'"]', 'ig');
    const content = fs.readFileSync(file, 'utf8');
    const lines: string[] = content.split('\n');
    lines.forEach(line => {
      const match = regex.exec(line);
      if (match) {
        const key = match[1];
        if (imports.hasOwnProperty(key)) {
          imports[key] = imports[key] + 1;
        } else {
          imports[key] = 1;
        }
      }
    });
  }
  var directoryPath: string = getWorkspaceFolder();
  var output = `Imports for files in workspace: ${directoryPath}\n`;
  for (const key of Object.keys(imports).sort()) {
    console.log(`${key}: ${imports[key]}`);
    output = output + `${key}: ${imports[key]}\n`;
  }
  console.log('open file ' + path.join(directoryPath, filename));
  writeFileAndOpen(path.join(directoryPath, filename), output);
};

function listFiles(
  dir: string,
  excludeDirectories: string[],
  isTypescriptFile: (filename: string) => boolean
): string[] {
  const directories = listDirectories(dir, excludeDirectories);
  let files: string[] = [];
  directories.forEach(directory => {
    const filesInDirectory = fs.readdirSync(directory)
      .map(name => path.join(directory, name))
      .filter((name: any) => fs.lstatSync(name).isFile())
      .filter((name: string) => isTypescriptFile(name));
    files = files.concat(filesInDirectory);
  });
  return files;
}

function writeDirectoryStructure(workSpaceDirectory: string, filename: string, directories: string[]) {
  var output: string = `Workspace directory: ${workSpaceDirectory}\nDirectories:\n`;
  directories?.forEach(directoryFullPath => {
    var directoryName = directoryFullPath.replace(workSpaceDirectory, '.');
    output = output + directoryName + '\n';
  });
  var directoryPath: string = getWorkspaceFolder();
  writeFileAndOpen(path.join(directoryPath, filename), output);
}

const isDirectory = (directoryName: any) => fs.lstatSync(directoryName).isDirectory();
function listDirectories(
  dir: string,
  excludeDirectories: string[]
): string[] {
  if (excludeDirectories.includes(path.basename(dir))) {
    return [];
  }
  const directories = fs.readdirSync(dir).map(name => path.join(dir, name)).filter(isDirectory);
  let result: string[] = [];
  if (directories && directories.length > 0) {
    directories.forEach(directory => {
      if (!excludeDirectories.includes(path.basename(directory))) {
        result.push(directory);
        const subDirectories = listDirectories(directory, excludeDirectories);
        if (subDirectories.length > 0) {
          result = result.concat(subDirectories.filter((element, index, array) => { return !(excludeDirectories.includes(path.basename(element))); }));
        }
      }
    });
  }
  return result;
};

function writeFileAndOpen(filename: string, content: string) {
  fs.writeFile(filename, content, function (err) {
    if (err) {
      return console.error(err);
    }
    var openPath = vscode.Uri.parse("file:///" + filename);
    vscode.workspace.openTextDocument(openPath).then(doc => {
      vscode.window.showTextDocument(doc);
    });
  });
};

// this method is called when your extension is deactivated
export function deactivate() { }
