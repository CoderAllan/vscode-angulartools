import * as vscode from 'vscode';
import * as fs from 'fs';
import { FileSystemUtils } from "../filesystemUtils";

export class ListAllImports {
  public static get commandName(): string { return 'listAllImports'; }

  public execute() {
    const fsUtils = new FileSystemUtils();
    var directoryPath: string = fsUtils.getWorkspaceFolder();
    const excludeDirectories = ['bin', 'obj', 'node_modules', 'dist', 'packages', '.git', '.vs', '.github'];
    const files = fsUtils.listFiles(directoryPath, excludeDirectories, this.isTypescriptFile);
    this.writeResult(directoryPath, files);
  }

  private isTypescriptFile(filename: string): boolean {
    return filename.endsWith('.ts') && !filename.endsWith('index.ts');
  }

  private writeResult(workspaceDirectory: string, results: string[]) {
    const imports: { [module: string]: number } = {};
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

    const angularToolsOutput = vscode.window.createOutputChannel("Angular Tools");
    angularToolsOutput.clear();
    angularToolsOutput.appendLine(`Imports for files in workspace: ${workspaceDirectory}`);
    angularToolsOutput.appendLine('The number following each import in the list is the number of occurrences of the package import.\n');
    for (const key of Object.keys(imports).sort()) {
      angularToolsOutput.appendLine(`${key}: ${imports[key]}`);
    }
    angularToolsOutput.show();
  };

}