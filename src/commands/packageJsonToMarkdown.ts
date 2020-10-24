import { FileSystemUtils } from '../filesystemUtils';
import * as path from 'path';
import * as fs from 'fs';
const fetch = require('node-fetch');

export class PackageJsonToMarkdown {
  public static get commandName(): string { return 'packageJsonToMarkdown'; }

  public execute() {
    const fsUtils = new FileSystemUtils();
    const directoryPath: string = fsUtils.getWorkspaceFolder();
    const excludeDirectories = ['bin', 'obj', 'node_modules', 'dist', 'packages', '.git', '.vs', '.github'];
    const isPackageJson = (filename: string): boolean => filename.toLowerCase().endsWith('package.json');
    const files = fsUtils.listFiles(directoryPath, excludeDirectories, isPackageJson);
    this.writeMarkdownFile(directoryPath, files);
  }

  private writeMarkdownFile(workspaceDirectory: string, packageJsonFiles: string[]) {
    let devDependencies: string[] = [];
    let dependencies: string[] = [];
    let peerDependencies: string[] = [];
    packageJsonFiles.forEach(packageJsonFile => {
      const contents = fs.readFileSync(packageJsonFile).toString('utf8');
      const packageJson = JSON.parse(contents);
      if (packageJson.devDependencies) {
        devDependencies = [...new Set([...devDependencies, ...Object.keys(packageJson.devDependencies)])];
      }
      if (packageJson.dependencies) {
        dependencies = [...new Set([...dependencies, ...Object.keys(packageJson.dependencies)])];
      }
      if (packageJson.peerDependencies) {
        peerDependencies = [...new Set([...peerDependencies, ...Object.keys(packageJson.peerDependencies)])];
      }
    });

    let dependenciesMarkdown = '';
    let devDependenciesMarkdown = '';
    let peerDependenciesMarkdown = '';
    const dependenciesRequests: Promise<{ name: string, description: string }>[] = [];
    dependencies.sort().forEach(pckName => {
      dependenciesRequests.push(this.makeRequest(pckName));
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
        devDependenciesRequests.push(this.makeRequest(pckName));
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
          peerDependenciesRequests.push(this.makeRequest(pckName));
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
            peerDependenciesMarkdown;
          const fsUtils = new FileSystemUtils();
          fsUtils.writeFileAndOpen(path.join(workspaceDirectory, 'ReadMe-PackagesJson.md'), markdownContent);
        });
      });
    });
  }

  private makeRequest(pckName: string): Promise<{ name: string, description: string }> {
    const uri = 'https://api.npms.io/v2/search?q=' + pckName + '%20not:deprecated,insecure,unstable';
    const request = fetch(uri).then((res: any) => res.json())
      .then((json: any) => {
        if (json.results[0] && json.results[0].package) {
          let packageName = json.results[0].package.name;
          packageName = packageName?.replace('|', '&#124;');
          let packageDescription = json.results[0].package.description;
          packageDescription = packageDescription?.replace('|', '&#124;');
          return { name: packageName, description: packageDescription };
        } else {
          console.log('Package not found: ' + pckName);
        }
      });
    return request;
  }
}