import * as fs from 'fs';
import * as vscode from 'vscode';

import { ArrayUtils, Config, FileSystemUtils } from '@src';
import { CommandBase } from '@commands';

export class ListAllImports extends CommandBase {
  private config = new Config();
  public static get commandName(): string { return 'listAllImports'; }

  public execute() {
    this.checkForOpenWorkspace();
    const fsUtils = new FileSystemUtils();
    var directoryPath: string = fsUtils.getWorkspaceFolder();
    const files = fsUtils.listFiles(directoryPath, this.config.excludeDirectories, this.isTypescriptFile);
    this.writeResult(directoryPath, files);
  }

  private writeResult(workspaceDirectory: string, results: string[]) {
    const imports: { [module: string]: number } = {};
    if (!results) { return; }
    for (let i = 0; i < results.length; i++) {
      var file = results[i];
      const regexImports: RegExp = new RegExp('.*?\\s+from\\s+[\'"](.+)[\'"]', 'ig');
      const regexRequires: RegExp = new RegExp('.*?\\s+require\\s*\\(\\s*[\'"](.+)[\'"]\\s*\\)', 'ig');
      const content = fs.readFileSync(file, 'utf8');
      const lines: string[] = content.split('\n');
      lines.forEach(line => {
        const matchImports = regexImports.exec(line);
        const matchRequires = regexRequires.exec(line);
        if (matchImports || matchRequires) {
          let key: string = '';
          if (matchImports) {
            key = matchImports[1];
          }
          if (matchRequires) {
            key = matchRequires[1];
          }
          if (imports.hasOwnProperty(key)) {
            imports[key] = imports[key] + 1;
          } else {
            imports[key] = 1;
          }
        }
      });
    }

    const angularToolsOutput = vscode.window.createOutputChannel(this.config.angularToolsOutputChannel);
    angularToolsOutput.clear();
    angularToolsOutput.appendLine(`Imports for files in workspace: ${workspaceDirectory}`);
    angularToolsOutput.appendLine('The number following each import in the list is the number of occurrences of the package import.\n');
    for (const key of Object.keys(imports).sort(ArrayUtils.sortStrings)) {
      angularToolsOutput.appendLine(`${key}: ${imports[key]}`);
    }
    angularToolsOutput.show();
  };

}