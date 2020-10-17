// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
const fetch = require('node-fetch');

export function activate(context: vscode.ExtensionContext) {
  // Implementation of the commands that has been defined in the package.json file
  const listAllImportsDisposable = vscode.commands.registerCommand('angulartools.listAllImports', () => {
    // The code you place here will be executed every time your command is executed
    var directoryPath: string = getWorkspaceFolder();
    const excludeDirectories = ['bin', 'obj', 'node_modules', 'dist', 'packages', '.git', '.vs', '.github'];
    const isTypescriptFile = (filename: string): boolean => filename.endsWith('.ts') && !filename.endsWith('index.ts');
    const files = listFiles(directoryPath, excludeDirectories, isTypescriptFile);
    writeResult(files);
  });
  context.subscriptions.push(listAllImportsDisposable);

  const projectDirectoryStructureDisposable = vscode.commands.registerCommand('angulartools.projectDirectoryStructure', () => {
    var workspaceDirectory: string = getWorkspaceFolder();
    const excludeDirectories = ['bin', 'obj', 'node_modules', 'dist', 'packages', '.git', '.vs', '.github'];
    const directories: string[] = listDirectories(workspaceDirectory, excludeDirectories);
    writeDirectoryStructure(workspaceDirectory, 'ReadMe-ProjectDirectoryStructure.md', directories);
  });
  context.subscriptions.push(projectDirectoryStructureDisposable);

  const packageJsonToMarkdownDisposable = vscode.commands.registerCommand('angulartools.packageJsonToMarkdown', () => {
    var directoryPath: string = getWorkspaceFolder();
    const excludeDirectories = ['bin', 'obj', 'node_modules', 'dist', 'packages', '.git', '.vs', '.github'];
    const isPackageJson = (filename: string): boolean => filename.toLowerCase().endsWith('package.json');
    const files = listFiles(directoryPath, excludeDirectories, isPackageJson);
    writeMarkdownFile(files);
  });
  context.subscriptions.push(packageJsonToMarkdownDisposable);
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
function writeResult(results: string[]) {
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
  const workspaceDirectory: string = getWorkspaceFolder();
  const angularToolsOutput = vscode.window.createOutputChannel("Angular Tools");
  angularToolsOutput.clear();
  angularToolsOutput.appendLine(`Imports for files in workspace: ${workspaceDirectory}`);
  angularToolsOutput.appendLine('The number following each import in the list is the number of occurrences of the package import.\n');
  for (const key of Object.keys(imports).sort()) {
    angularToolsOutput.appendLine(`${key}: ${imports[key]}`);
  }
  angularToolsOutput.show();
};

function listFiles(
  dir: string,
  excludeDirectories: string[],
  isMatchingFile: (filename: string) => boolean
): string[] {
  const directories = listDirectories(dir, excludeDirectories);
  directories.push(dir);
  let files: string[] = [];
  directories.forEach(directory => {
    const filesInDirectory = fs.readdirSync(directory)
      .map(name => path.join(directory, name))
      .filter((name: any) => fs.lstatSync(name).isFile())
      .filter((name: string) => isMatchingFile(name));
    files = files.concat(filesInDirectory);
  });
  return files;
}

function writeDirectoryStructure(workSpaceDirectory: string, filename: string, directories: string[]) {
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

function writeMarkdownFile(packageJsonFiles: string[]) {
  let devDependencies: string[] = [];
  let dependencies: string[] = [];
  let peerDependencies: string[] = [];
  packageJsonFiles.forEach(packageJsonFile => {
    // console.log('Package file: ' + packageJsonFile);
    const contents = fs.readFileSync(packageJsonFile).toString('utf8');
    const packageJson = JSON.parse(contents);
    if (packageJson.devDependencies) {
      devDependencies = [...new Set([...devDependencies, ...Object.keys(packageJson.devDependencies)])]
    }
    if (packageJson.dependencies) {
      dependencies = [...new Set([...dependencies, ...Object.keys(packageJson.dependencies)])]
    }
    if (packageJson.peerDependencies) {
      peerDependencies = [...new Set([...peerDependencies, ...Object.keys(packageJson.peerDependencies)])]
    }
  });
  // console.log('Dependencies: ' + dependencies.length);
  // console.log('Dev dependencies: ' + devDependencies.length);
  // console.log('Peer dependencies: ' + peerDependencies.length);

  let dependenciesMarkdown = '';
  let devDependenciesMarkdown = '';
  let peerDependenciesMarkdown = '';
  const dependenciesRequests: Promise<{ name: string, description: string }>[] = [];
  dependencies.sort().forEach(pckName => {
    dependenciesRequests.push(makeRequest(pckName));
  });
  Promise.all(dependenciesRequests).then(responses => {
    responses.forEach(response => {
      if (response) {
        dependenciesMarkdown += `| ${response.name} | ${response.description} |\n`;
      }
    });
  }).then(() => {
    const devDependenciesRequests: Promise<{ name: string, description: string }>[] = [];
    devDependencies.sort().forEach(pckName => {
      devDependenciesRequests.push(makeRequest(pckName));
    });
    Promise.all(devDependenciesRequests).then(responses => {
      responses.forEach(response => {
        if (response) {
          devDependenciesMarkdown += `| ${response.name} | ${response.description} |\n`;
        }
      });
    }).then(() => {
      const peerDependenciesRequests: Promise<{ name: string, description: string }>[] = [];
      peerDependencies.sort().forEach(pckName => {
        peerDependenciesRequests.push(makeRequest(pckName));
      });
      Promise.all(peerDependenciesRequests).then(responses => {
        responses.forEach(response => {
          if (response) {
            peerDependenciesMarkdown += `| ${response.name} | ${response.description} |\n`;
          }
        });
      }).then(() => {
        const markdownContent =
          '# Package.json\n\n' +
          '## Dependencies\n\n' +
          '| Name | Description|\n' +
          '| ---- |:-----------|\n' +
          dependenciesMarkdown + '\n' +
          '## Dev dependencies\n\n' +
          '| Name | Description|\n' +
          '| ---- |:-----------|\n' +
          devDependenciesMarkdown + '\n' +
          '## Peer dependencies\n\n' +
          '| Name | Description|\n' +
          '| ---- |:-----------|\n' +
          peerDependenciesMarkdown
        const workspaceFolder: string = getWorkspaceFolder();
        writeFileAndOpen(path.join(workspaceFolder, 'ReadMe-PackagesJson.md'), markdownContent);
      });
    });
  });
}

function makeRequest(pckName: string): Promise<{ name: string, description: string }> {
  const uri = 'https://api.npms.io/v2/search?q=' + pckName + '%20not:deprecated,insecure,unstable';
  const request = fetch(uri).then((res: any) => res.json())
    .then((json: any) => {
      if (json.results[0] && json.results[0].package) {
        const packageName = json.results[0].package.name;
        const packageDescription = json.results[0].package.description;
        return { name: packageName, description: packageDescription };
      } else {
        console.log('Package not found: ' + pckName);
      }
    });
  return request;
}

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
