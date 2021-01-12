import * as fs from 'fs';
import * as path from 'path';

import { ArrayUtils, Config, FileSystemUtils } from '@src';

const fetch = require('npm-registry-fetch');

export class PackageJsonToMarkdown {
  private config = new Config();
  public static get commandName(): string { return 'packageJsonToMarkdown'; }

  public execute() {
    const fsUtils = new FileSystemUtils();
    const directoryPath: string = fsUtils.getWorkspaceFolder();
    const isPackageJson = (filename: string): boolean => filename.toLowerCase().endsWith('package.json');
    const files = fsUtils.listFiles(directoryPath, this.config.excludeDirectories, isPackageJson);
    this.writeMarkdownFile(directoryPath, files);
  }

  private writeMarkdownFile(workspaceDirectory: string, packageJsonFiles: string[]) {
    let devDependencies: string[] = [];
    let dependencies: string[] = [];
    let peerDependencies: string[] = [];
    const localPackages: { [pkgName: string]: string; } = {};
    packageJsonFiles.forEach(packageJsonFile => {
      const contents = fs.readFileSync(packageJsonFile).toString('utf8');
      const packageJson = JSON.parse(contents);
      if (packageJson.devDependencies) {
        devDependencies = [...new Set([...devDependencies, ...Object.keys(packageJson.devDependencies)])];
        this.updateLocalPackagesDictionary(packageJson.devDependencies, localPackages);
      }
      if (packageJson.dependencies) {
        dependencies = [...new Set([...dependencies, ...Object.keys(packageJson.dependencies)])];
        this.updateLocalPackagesDictionary(packageJson.dependencies, localPackages);
      }
      if (packageJson.peerDependencies) {
        peerDependencies = [...new Set([...peerDependencies, ...Object.keys(packageJson.peerDependencies)])];
        this.updateLocalPackagesDictionary(packageJson.peerDependencies, localPackages);
      }
    });

    let dependenciesMarkdown = '';
    let devDependenciesMarkdown = '';
    let peerDependenciesMarkdown = '';
    const dependenciesRequests: Promise<{ name: string, version: string, description: string }>[] = [];
    dependencies.sort(ArrayUtils.sortStrings).forEach(pckName => {
      dependenciesRequests.push(this.makeRequest(pckName));
    });
    Promise.all(dependenciesRequests).then(responses => {
      dependenciesMarkdown = this.updateMarkdownRow(responses, localPackages);
    }).then(() => {
      const devDependenciesRequests: Promise<{ name: string, version: string, description: string }>[] = [];
      devDependencies.sort(ArrayUtils.sortStrings).forEach(pckName => {
        devDependenciesRequests.push(this.makeRequest(pckName));
      });
      Promise.all(devDependenciesRequests).then(responses => {
        devDependenciesMarkdown = this.updateMarkdownRow(responses, localPackages);
      }).then(() => {
        const peerDependenciesRequests: Promise<{ name: string, version: string, description: string }>[] = [];
        peerDependencies.sort(ArrayUtils.sortStrings).forEach(pckName => {
          peerDependenciesRequests.push(this.makeRequest(pckName));
        });
        Promise.all(peerDependenciesRequests).then(responses => {
          peerDependenciesMarkdown = this.updateMarkdownRow(responses, localPackages);
        }).then(() => {
          const markdownContent =
            '# Package.json\n\n' +
            '## Dependencies\n\n' +
            '| Name | Local version | Latest Version | Description|\n' +
            '| ---- | ---- | ---- |:-----------|\n' +
            dependenciesMarkdown + '\n' +
            '## Dev dependencies\n\n' +
            '| Name | Local version | Latest Version | Description|\n' +
            '| ---- | ---- | ---- |:-----------|\n' +
            devDependenciesMarkdown + '\n' +
            '## Peer dependencies\n\n' +
            '| Name | Local version | Latest Version | Description|\n' +
            '| ---- | ---- | ---- |:-----------|\n' +
            peerDependenciesMarkdown;
          const fsUtils = new FileSystemUtils();
          fsUtils.writeFileAndOpen(path.join(workspaceDirectory, this.config.packageJsonMarkdownFilename), markdownContent);
        });
      });
    });
  }

  private updateMarkdownRow(responses: { name: string; version: string; description: string; }[], localPackages: { [pkgName: string]: string; }): string {
    let markdownStr: string = '';
    responses.sort((first, second) => (first.name.replace('@','') < second.name.replace('@','') ? -1 : 1)).forEach(response => {
      if (response) {
        const localVersion = localPackages[response.name];
        markdownStr += `| ${response.name} | ${localVersion} | ${response.version} | ${response.description} |\n`;
      }
    });
    return markdownStr;
  }

  private updateLocalPackagesDictionary(dict: { [pkgName: string]: string; }, localPackages: { [pkgName: string]: string; }) {
    Object.entries(dict).forEach(([pkgName, version]) => {
      if (localPackages[pkgName] !== undefined) {
        if(!localPackages[pkgName].includes(String(version))) {
          localPackages[pkgName] += ', ' + String(version);
        }
      } else {
        localPackages[pkgName] = String(version);
      }
    });    
  }

  private makeRequest(pckName: string): Promise<{ name: string, version: string, description: string }> {
    const uri = `/${pckName}`;
    const request = fetch.json(uri)
      .then((json: any) => {
        let packageName = json.name;
        packageName = packageName?.replace('|', '&#124;');
        let packageDescription = json.description;
        packageDescription = packageDescription?.replace('|', '&#124;');
        let packageVersion = json['dist-tags'].latest;
        packageVersion = packageVersion?.replace('|', '&#124;');
        return { name: packageName, description: packageDescription, version: packageVersion };
      })
      .catch(() => {
        return { name: pckName, description: 'N/A', version: 'N/A' };
      });
    return request;
  }
}