import { CommandBase } from '@commands';
import { Config, DgmlManager, FileSystemUtils } from '@src';
import { Edge, Node } from '@model';
import { Base64 } from 'js-base64';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as xmldom from 'xmldom';

const prettifyXml = require('prettify-xml');
const xmlSerializer = require('xmlserializer');

export class ShowHierarchyBase extends CommandBase {
  protected fsUtils: FileSystemUtils = new FileSystemUtils();
  protected config = new Config();
  protected extensionContext: vscode.ExtensionContext;
  protected nodes: Node[] = [];
  protected edges: Edge[] = [];
  protected templateJsFilename: string = 'showHierarchy_Template.js';
  protected templateHtmlFilename: string = 'showHierarchy_Template.html';
  protected showComponentHierarchyJsFilename: string = 'showComponentHierarchy.js';
  protected showModuleHierarchyJsFilename: string = 'showModuleHierarchy.js';
  protected showHierarchyCssFilename: string = 'showHierarchy.css';
  protected workspaceDirectory = this.fsUtils.getWorkspaceFolder();

  constructor(context: vscode.ExtensionContext) {
    super();
    this.extensionContext = context;
  }
  protected appendNodes = (nodeList: Node[]) => {
    nodeList.forEach(newNode => {
      if (!this.nodes.some(node => node.id === newNode.id)) {
        this.nodes.push(newNode);
      }
      else {
        const existingNode = this.nodes.find(node => node.id === newNode.id);
        if (existingNode && (!existingNode.tsFilename || existingNode.tsFilename?.length === 0) && newNode.tsFilename && newNode.tsFilename.length > 0) {
          existingNode.tsFilename = newNode.tsFilename;
        }
      }
    });
  };
  protected appendEdges = (edgeList: Edge[]) => {
    edgeList.forEach(newEdge => {
      if (!this.edges.some(edge => edge.source === newEdge.source && edge.target === newEdge.target)) {
        this.edges.push(newEdge);
      }
    });
  };

  protected getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  protected saveAsPng(pngFilename: string, messageText: string) {
    const dataUrl = messageText.split(',');
    if (dataUrl.length > 0) {
      const u8arr = Base64.toUint8Array(dataUrl[1]);

      const newFilePath = path.join(this.workspaceDirectory, pngFilename);
      this.fsUtils.writeFile(newFilePath, u8arr, () => { });

      vscode.window.setStatusBarMessage(`The file ${pngFilename} has been created in the root of the workspace.`);
    }
  }

  protected saveAsDgml(dgmlGraphFilename: string, messageText: string, popMessageText: string) {
    const message = JSON.parse(messageText);
    const direction = message.direction;
    const domImpl = new xmldom.DOMImplementation();
    const dgmlManager = new DgmlManager();
    const xmlDocument = dgmlManager.createNewDirectedGraph(domImpl, this.fixGraphDirection(direction), "Sugiyama", "-1");
    dgmlManager.addNodesAndLinks(xmlDocument, this.nodes, message.nodes, this.edges);
    // Serialize the xml into a string
    const xmlAsString = xmlSerializer.serializeToString(xmlDocument.documentElement);
    let fileContent = prettifyXml(xmlAsString);
    const xmlProlog = '<?xml version="1.0" encoding="utf-8"?>\n';
    fileContent = xmlProlog + fileContent.replace('HasCategory(&apos;RootComponent&apos;)', "HasCategory('RootComponent')");

    // Write the prettified xml string to the ReadMe-ProjectStructure.dgml file.
    var directoryPath: string = this.fsUtils.getWorkspaceFolder();
    this.fsUtils.writeFile(path.join(directoryPath, dgmlGraphFilename), fileContent, () => {
      vscode.window.setStatusBarMessage(popMessageText, 10000);
    });
  }

  private fixGraphDirection(direction: string): string {
    let fixedDirection: string;
    switch (direction) {
      case 'UD':
        fixedDirection = 'TopToBottom';
        break;
      case 'DU':
        fixedDirection = 'BottomToTop';
        break;
      case 'LR':
        fixedDirection = 'LeftToRight';
        break;
      case 'RL':
        fixedDirection = 'RightToLeft';
        break;
      default:
        fixedDirection = '';
        break;
    }
    return fixedDirection;
  }

  protected generateHtmlContent(webview: vscode.Webview, outputJsFilename: string): string {
    let htmlContent = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', this.templateHtmlFilename)), 'utf8');

    const visPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'javascript', 'vis-network.min.js');
    const visUri = webview.asWebviewUri(visPath);
    htmlContent = htmlContent.replace('vis-network.min.js', visUri.toString());

    const cssPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'stylesheet', this.showHierarchyCssFilename);
    const cssUri = webview.asWebviewUri(cssPath);
    htmlContent = htmlContent.replace(this.showHierarchyCssFilename, cssUri.toString());

    const nonce = this.getNonce();
    htmlContent = htmlContent.replace('nonce-nonce', `nonce-${nonce}`);
    htmlContent = htmlContent.replace(/<script /g, `<script nonce="${nonce}" `);
    htmlContent = htmlContent.replace('cspSource', webview.cspSource);

    const jsPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, outputJsFilename);
    const jsUri = webview.asWebviewUri(jsPath);
    htmlContent = htmlContent.replace('showHierarchy.js', jsUri.toString());
    return htmlContent;
  }

  protected showErrors(errors: string[], errorMessage: string) {
    const angularToolsOutput = vscode.window.createOutputChannel(this.config.angularToolsOutputChannel);
    angularToolsOutput.clear();
    angularToolsOutput.appendLine(errorMessage);
    angularToolsOutput.appendLine('Below is a list of the errors.');
    angularToolsOutput.appendLine(errors.join('\n'));
    angularToolsOutput.show();
  }
}