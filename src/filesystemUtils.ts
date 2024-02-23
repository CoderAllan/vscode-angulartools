/**
 * Methods for accessing the filesystem
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Settings } from '@model';
import { Config } from '@src';

export class FileSystemUtils {

    public static readonly localSettingsFilename = '.vscodeangulartools';

    public listFiles(
        dir: string,
        settings: Settings,
        isMatchingFile: (filename: string) => boolean
    ): string[] {
        const directories = this.listDirectories(dir, settings);
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

    public fileExists(filename: string): boolean {
        try {
            return fs.lstatSync(filename).isFile();
        } catch {
            return false;
        }
    }

    public static componentFileExtension = '.component.ts';
    public static isComponentFile(filename: string): boolean {
        return filename.toLowerCase().endsWith(FileSystemUtils.componentFileExtension);
    }
    public static isModuleFile(filename: string): boolean {
        return filename.toLowerCase().endsWith('.module.ts');
    }
    public static routingModuleFileExtension = '-routing.module.ts';
    public static isRoutingModuleFile(filename: string): boolean {
        return filename.toLowerCase().endsWith(FileSystemUtils.routingModuleFileExtension);
    }

    private isDirectory(directoryName: any): boolean {
        return fs.lstatSync(directoryName).isDirectory();
    }
    public listDirectories(
        dir: string,
        settings: Settings,
    ): string[] {
        if (settings.excludeDirectories.includes(path.basename(dir))) {
            return [];
        }
        const directories = fs.readdirSync(dir).map(name => path.join(dir, name)).filter(this.isDirectory);
        let result: string[] = [];
        if (directories && directories.length > 0) {
            directories.forEach(directory => {
                if (!settings.excludeDirectories.includes(path.basename(directory))) {
                    let excludeDirectory = false;
                    for (let i = 0; i < settings.excludeDirectories.length; i++) {
                        let excludeDir = settings.excludeDirectories[i];
                        if (directory.indexOf(excludeDir) >= 0) {
                            excludeDirectory = true;
                            break;
                        }
                    }
                    if (!excludeDirectory) {
                        if (settings.includeDirectories.length > 0) {
                            if (settings.includeDirectories.includes(path.basename(directory)) || settings.includeDirectories.includes(directory)) {
                                result.push(directory);
                            } else {
                                for (let i = 0; i < settings.includeDirectories.length; i++) {
                                    let includeDir = settings.includeDirectories[i];
                                    if (directory.indexOf(includeDir) >= 0) {
                                        result.push(directory);
                                    }
                                }
                            }
                        } else {
                            result.push(directory);
                        }
                        const subDirectories = this.listDirectories(directory, settings);
                        if (subDirectories.length > 0) {
                            result = result.concat(subDirectories.filter(element => { return !(settings.excludeDirectories.includes(path.basename(element))); }));
                        }
                    }
                }
            });
        }
        return result;
    }

    public getWorkspaceFolder(): string {
        var folder = vscode.workspace.workspaceFolders;
        var directoryPath: string = '';
        if (folder !== null && folder !== undefined) {
            directoryPath = folder[0].uri.fsPath;
        }
        return directoryPath;
    }

    public writeFile(filename: string, content: string | Uint8Array, callback: () => void) {
        fs.writeFile(filename, content, function (err) {
            if (err) {
                return console.error(err);
            }
            callback();
        });
    }

    public writeFileAndOpen(filename: string, content: string) {
        this.writeFile(filename, content, () => {
            var openPath = vscode.Uri.parse("file:///" + filename);
            vscode.workspace.openTextDocument(openPath).then(doc => {
                vscode.window.showTextDocument(doc);
            });
        });
    }

    public readProjectSettings(config: Config): Settings {
        let settings: Settings = new Settings();
        const fsUtils = new FileSystemUtils();
        const settingsFilename = path.join(fsUtils.getWorkspaceFolder(), FileSystemUtils.localSettingsFilename);
        if (fsUtils.fileExists(settingsFilename)) {
            const fileContents = fs.readFileSync(settingsFilename).toString();
            const jsonContents = JSON.parse(fileContents);
            settings = new Settings();
            const includeFoldersParameter = 'includeFolders';
            if (Object.prototype.hasOwnProperty.call(jsonContents, includeFoldersParameter)) {
                const parameterValue = jsonContents[includeFoldersParameter];
                if (parameterValue !== '') {
                    settings.includeDirectories = parameterValue.split(';');
                }
                if (settings.includeDirectories.length > 0) { // Remove duplicates
                    settings.includeDirectories.filter((value, index) => settings.includeDirectories.indexOf(value) === index);
                }
            }
            const excludeFoldersParameter = 'excludeFolders';
            if (Object.prototype.hasOwnProperty.call(jsonContents, excludeFoldersParameter)) {
                const parameterValue = jsonContents[excludeFoldersParameter];
                if (parameterValue !== '') {
                    settings.excludeDirectories = parameterValue.split(';');
                }
                if (config.excludeDirectories.length > 0) {
                    settings.excludeDirectories = config.excludeDirectories.concat(settings.excludeDirectories);
                }
                if (settings.excludeDirectories.length > 0) { // Remove duplicates
                    settings.excludeDirectories.filter((value, index) => settings.excludeDirectories.indexOf(value) === index);
                }
            }
        }
        return settings;
    }
}