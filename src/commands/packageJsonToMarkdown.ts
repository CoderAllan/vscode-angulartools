import * as fs from 'fs';
import * as path from 'path';

import { ArrayUtils, Config, FileSystemUtils } from '@src';
import { CommandBase } from '@commands';

const fetch = require('npm-registry-fetch');

export class PackageJsonToMarkdown extends CommandBase {
    private config = new Config();
    public static get commandName(): string { return 'packageJsonToMarkdown'; }

    public execute() {
        this.checkForOpenWorkspace();
        const fsUtils = new FileSystemUtils();
        const directoryPath: string = fsUtils.getWorkspaceFolder();
        const projectSettings = fsUtils.readProjectSettings(this.config);
        const isPackageJson = (filename: string): boolean => filename.toLowerCase().endsWith('package.json');
        const files = fsUtils.listFiles(directoryPath, projectSettings, isPackageJson);
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
        const dependenciesRequests: Promise<{ name: string, version: string, description: string, license: string }>[] = [];
        dependencies.sort(ArrayUtils.sortStrings).forEach(pckName => {
            dependenciesRequests.push(this.fetchPackageInformation(pckName, workspaceDirectory));
        });
        Promise.all(dependenciesRequests).then(responses => {
            dependenciesMarkdown = this.updateMarkdownRow(responses, localPackages);
        }).then(() => {
            const devDependenciesRequests: Promise<{ name: string, version: string, description: string, license: string }>[] = [];
            devDependencies.sort(ArrayUtils.sortStrings).forEach(pckName => {
                devDependenciesRequests.push(this.fetchPackageInformation(pckName, workspaceDirectory));
            });
            Promise.all(devDependenciesRequests).then(responses => {
                devDependenciesMarkdown = this.updateMarkdownRow(responses, localPackages);
            }).then(() => {
                const peerDependenciesRequests: Promise<{ name: string, version: string, description: string, license: string }>[] = [];
                peerDependencies.sort(ArrayUtils.sortStrings).forEach(pckName => {
                    peerDependenciesRequests.push(this.fetchPackageInformation(pckName, workspaceDirectory));
                });
                Promise.all(peerDependenciesRequests).then(responses => {
                    peerDependenciesMarkdown = this.updateMarkdownRow(responses, localPackages);
                }).then(() => {
                    if (dependenciesMarkdown === '') {
                        dependenciesMarkdown = 'No dependencies specified.';
                    } else {
                        dependenciesMarkdown =
                            '| Name | Local version | Latest Version | License | Description|\n' +
                            '| ---- | ---- | ---- | ---- |:-----------|\n' +
                            dependenciesMarkdown;
                    }
                    if (devDependenciesMarkdown === '') {
                        devDependenciesMarkdown = 'No dev dependencies specified.';
                    } else {
                        devDependenciesMarkdown =
                            '| Name | Local version | Latest Version | License | Description|\n' +
                            '| ---- | ---- | ---- | ---- |:-----------|\n' +
                            devDependenciesMarkdown;
                    }
                    if (peerDependenciesMarkdown === '') {
                        peerDependenciesMarkdown = 'No peer dependencies specified.';
                    } else {
                        peerDependenciesMarkdown =
                            '| Name | Local version | Latest Version | License | Description|\n' +
                            '| ---- | ---- | ---- | ---- |:-----------|\n' +
                            peerDependenciesMarkdown;
                    }
                    const markdownContent =
                        '# Package.json\n\n' +
                        '## Dependencies\n\n' +
                        dependenciesMarkdown + '\n' +
                        '## Dev dependencies\n\n' +
                        devDependenciesMarkdown + '\n' +
                        '## Peer dependencies\n\n' +
                        peerDependenciesMarkdown + '\n';
                    const fsUtils = new FileSystemUtils();
                    fsUtils.writeFileAndOpen(path.join(workspaceDirectory, this.config.packageJsonMarkdownFilename), markdownContent);
                });
            });
        });
    }

    private updateMarkdownRow(responses: { name: string; version: string; description: string; license: string }[], localPackages: { [pkgName: string]: string; }): string {
        let markdownStr: string = '';
        responses.sort((first, second) => (first.name.replace('@', '') < second.name.replace('@', '') ? -1 : 1)).forEach(response => {
            if (response) {
                const localVersion = localPackages[response.name];
                markdownStr += `| ${response.name} | ${localVersion} | ${response.version} | ${response.license} | ${response.description} |\n`;
            }
        });
        return markdownStr;
    }

    private updateLocalPackagesDictionary(dict: { [pkgName: string]: string; }, localPackages: { [pkgName: string]: string; }) {
        Object.entries(dict).forEach(([pkgName, version]) => {
            if (localPackages[pkgName] !== undefined) {
                if (!localPackages[pkgName].includes(String(version))) {
                    localPackages[pkgName] += ', ' + String(version);
                }
            } else {
                localPackages[pkgName] = String(version);
            }
        });
    }

    private fetchPackageInformation(pckName: string, workspaceDirectory: string): Promise<{ name: string, version: string, description: string, license: string }> {
        const uri = `/${pckName}`;
        const license = this.getLicenseInformationFromNodeModulesFolder(workspaceDirectory, pckName);
        const result = fetch.json(uri)
            .then((json: any) => {
                let packageName = json.name;
                packageName = packageName?.replace('|', '&#124;');
                let packageDescription = json.description;
                packageDescription = packageDescription?.replace('|', '&#124;');
                let packageVersion = json['dist-tags'].latest;
                packageVersion = packageVersion?.replace('|', '&#124;');
                return { name: packageName, description: packageDescription, version: packageVersion, license: license };
            })
            .catch(() => {
                return { name: pckName, description: 'N/A', version: 'N/A', license: license };
            });
        return result;
    }

    private getLicenseInformationFromNodeModulesFolder(workspaceDirectory: string, pckName: string): string {
        const pckFolder = path.join(workspaceDirectory, 'node_modules', pckName);
        const packageJsonFile = path.join(pckFolder, 'package.json');
        let packageJson = undefined;
        try {
            const contents = fs.readFileSync(packageJsonFile).toString('utf8');
            packageJson = JSON.parse(contents);
        }
        catch {
            packageJson = undefined;
        }
        if (packageJson !== undefined && packageJson.license) {
            return packageJson.license;
        } else {
            return 'N/A';
        }
    }
}