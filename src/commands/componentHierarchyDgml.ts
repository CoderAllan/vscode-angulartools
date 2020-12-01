import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FileSystemUtils } from "../filesystemUtils";
import * as xmldom from 'xmldom';
const prettifyXml = require('prettify-xml');
const xmlSerializer = require('xmlserializer');

class Component {

  constructor(tsFilename: string, templateFilename: string, selector: string, subComponents: Component[], isRoot: boolean) {
    this.tsFilename = tsFilename;
    this.templateFilename = templateFilename;
    this.selector = selector;
    this.subComponents = subComponents;
    this.isRoot = isRoot;
  }
  public tsFilename: string;
  public templateFilename: string;
  public selector: string;
  public subComponents: Component[];
  public isRoot: boolean;
}

export class ComponentHierarchyDgml {

  public static get commandName(): string { return 'componentHierarchyDgml'; }

  public execute() {
    const fsUtils = new FileSystemUtils();
    var directoryPath: string = fsUtils.getWorkspaceFolder();
    const excludeDirectories = ['bin', 'obj', 'node_modules', 'dist', 'packages', '.git', '.vs', '.github'];
    const componentFilenames = fsUtils.listFiles(directoryPath, excludeDirectories, this.isComponentFile);
    const components = this.findComponents(componentFilenames);
    this.scanComponentTemplates(components);

    const graphFilename = 'ReadMe-ProjectStructure.dgml';
    const domImpl = new xmldom.DOMImplementation();
    const documentParser = new xmldom.DOMParser();
    let xmlDocument: Document;
    let root: Element;

    try {
      // if the graph file already exists, then read it and parse it into a xml document object
      if (fs.existsSync(graphFilename)) {
        try {
          const content = fs.readFileSync(graphFilename).toString();
          xmlDocument = documentParser.parseFromString(content, 'text/xml');
        } catch {
          xmlDocument = this.createNewDirectedGraph(domImpl);
        }
      } else {
        xmlDocument = this.createNewDirectedGraph(domImpl);
      }
      this.addNodesAndLinks(xmlDocument, components);
      this.addCategories(xmlDocument);
      this.addProperties(xmlDocument);
      this.addStyles(xmlDocument);

      // Serialize the xml into a string
      const xmlAsString = xmlSerializer.serializeToString(xmlDocument.documentElement);
      let fileContent = prettifyXml(xmlAsString);
      fileContent = fileContent.replace('HasCategory(&apos;RootComponent&apos;)', "HasCategory('RootComponent')");

      // Write the prettified xml string to the ReadMe-ProjectStructure.dgml file.
      const fsUtils = new FileSystemUtils();
      fsUtils.writeFile(path.join(directoryPath, graphFilename), fileContent, () => {
        vscode.window.showInformationMessage('The project structure has been analyzed and a Directed Graph Markup Language (dgml) file has been created\nThe ReadMe-ProjectStructure.dgml file can now be viewed in Visual Studio');
      });
    } catch (ex) {
      console.log('exception:' + ex);
    }
  }

  private isComponentFile(filename: string): boolean {
    return filename.endsWith('.component.ts');
  }

  private findComponents(componentFilenames: string[]) {
    const compHash: { [selector: string]: Component; } = {};
    const componentRegex = /@Component\({/ig;
    const templateUrlRegex = /.*templateUrl:.+\/(.+)\'/i;
    const selectorRegex = /.*selector:.+\'(.+)\'/i;
    const endBracketRegex = /}\)/i;
    componentFilenames.forEach((componentFilename) => {
      let componentDefinitionFound = false;
      let currentComponent = new Component(componentFilename, "", "", [], true);
      const content = fs.readFileSync(componentFilename, 'utf8');
      const lines: string[] = content.split('\n');
      for (let i: number = 0; i < lines.length; i++) {
        let line = lines[i];
        let match = componentRegex.exec(line);
        if (match) {
          componentDefinitionFound = true;
        }
        if (componentDefinitionFound) {
          match = templateUrlRegex.exec(line);
          if (match) {
            currentComponent.templateFilename = path.join(path.dirname(componentFilename), match[1]);
          }
          match = selectorRegex.exec(line);
          if (match) {
            let currentSelector = match[1];
            currentSelector = currentSelector.replace("[", "");
            currentSelector = currentSelector.replace("]", "");
            currentComponent.selector = currentSelector;
          }
          match = endBracketRegex.exec(line);
          if (match) {
            break;
          }
        }
      }
      compHash[currentComponent.selector] = currentComponent;
    });
    return compHash;
  }

  private scanComponentTemplates(componentHash: { [selector: string]: Component; }) {
    for (let selector1 in componentHash) {
      if (fs.existsSync(componentHash[selector1].templateFilename)) {
        const template = fs.readFileSync(componentHash[selector1].templateFilename); // We read the entire template file
        for (let selector2 in componentHash) {  // then we check if the template contains each of the selectors we found in the components
          let pattern = `</${selector2}>`;
          let index = template.indexOf(pattern);
          if (index >= 0) {
            componentHash[selector1].subComponents = componentHash[selector1].subComponents.concat(componentHash[selector2]);
            // If selector2 has been found in a template then it is not root
            componentHash[selector2].isRoot = false;
          }
          else {
            pattern = ` ${selector2}`;
            index = template.indexOf(pattern);
            if (index >= 0) {
              componentHash[selector1].subComponents = componentHash[selector1].subComponents.concat(componentHash[selector2]);
              // If selector2 has been found in a template then it is not root
              componentHash[selector2].isRoot = false;
            }
          }
        }
      }
    }
  }

  private createNewDirectedGraph(domImpl: DOMImplementation) {
    let xmlDoc: Document = domImpl.createDocument('', null, null);
    const root = xmlDoc.createElement("DirectedGraph");
    root.setAttribute("GraphDirection", "LeftToRight");
    root.setAttribute("Layout", "Sugiyama");
    root.setAttribute("ZoomLevel", "-1");
    root.setAttribute("xmlns", "http://schemas.microsoft.com/vs/2009/dgml");
    xmlDoc.appendChild(root);
    return xmlDoc;
  }

  private addNodeToRoot(xmlDoc: Document, tagName: string): Element | null {
    const root = xmlDoc.documentElement;
    const elements = root.getElementsByTagName(tagName);
    let nodeElement: Element;
    if (elements.length === 0) {
      nodeElement = xmlDoc.createElement(tagName);
      root.appendChild(nodeElement);
      return nodeElement;
    }
    else {
      const exitingNode = elements.item(0);
      return exitingNode;
    }
  }

  private addNode(element: Element | null, nodeElement: Element, attribute: string = 'Id') {
    if (element !== null) {
      let nodeAlreadyAdded = false;
      if (element.childNodes.length > 0) {
        for (let i = 0; i < element.childNodes.length; i++) {
          let node = element.childNodes[i];
          if (node.nodeType === 1 && (node as Element).hasAttribute(attribute) &&
            (node as Element).getAttribute(attribute)?.toLowerCase() === nodeElement.getAttribute(attribute)?.toLowerCase()) {
            nodeAlreadyAdded = true;
          }
        };
      }
      if (!nodeAlreadyAdded) {
        element.appendChild(nodeElement);
      }
    }
  }

  private addLinkNode(xmlDoc: Document, element: Element | null, source: string, target: string) {
    if (element !== null) {
      let nodeAlreadyAdded = false;
      if (element.childNodes.length > 0) {
        for (let i = 0; i < element.childNodes.length; i++) {
          let node = element.childNodes[i];
          if (node.nodeType === 1 &&
            (node as Element).hasAttribute("Source") &&
            (node as Element).hasAttribute("Target") &&
            (node as Element).getAttribute("Source")?.toLowerCase() === source.toLowerCase() &&
            (node as Element).getAttribute("Target")?.toLowerCase() === target.toLowerCase()) {
            nodeAlreadyAdded = true;
          }
        }
      }
      if (!nodeAlreadyAdded) {
        const linkElement = xmlDoc.createElement("Link");
        linkElement.setAttribute("Source", source);
        linkElement.setAttribute("Target", target);
        element.appendChild(linkElement);
      }
    }
  }

  private addNodesAndLinks(xmlDoc: Document, componentHash: { [selector: string]: Component; }) {
    const nodesElement = this.addNodeToRoot(xmlDoc, "Nodes");
    const linksElement = this.addNodeToRoot(xmlDoc, "Links");
    for (let selector in componentHash) {
      const component = componentHash[selector];
      if (component.isRoot) {
        this.generateDirectedGraphNodesXml(xmlDoc, component.subComponents, component, true, nodesElement);
        this.generateDirectedGraphLinksXml(xmlDoc, component.subComponents, selector, "", linksElement);
      }
    }
  }

  private generateDirectedGraphNodesXml(xmlDoc: Document, components: Component[], component: Component, isRoot: boolean, nodesElement: Element | null) {
    const nodeElement = xmlDoc.createElement("Node");
    nodeElement.setAttribute("ComponentFilename", component.tsFilename);
    nodeElement.setAttribute("Label", component.selector);
    nodeElement.setAttribute("Id", component.selector);
    if (isRoot) {
      nodeElement.setAttribute("Category", "RootComponent");
    }
    this.addNode(nodesElement, nodeElement);
    if (components.length > 0) {
      components.forEach((subComponent) => {
        this.generateDirectedGraphNodesXml(xmlDoc, subComponent.subComponents, subComponent, subComponent.isRoot, nodesElement);
      });
    }
  }

  private generateDirectedGraphLinksXml(xmlDoc: Document, subComponents: Component[], displayName: string, parentDisplayName: string, linksElement: Element | null) {
    if (parentDisplayName.length > 0) {
      this.addLinkNode(xmlDoc, linksElement, parentDisplayName, displayName);
    }
    if (subComponents.length > 0) {
      subComponents.forEach((subComponent) => {
        this.generateDirectedGraphLinksXml(xmlDoc, subComponent.subComponents, subComponent.selector, displayName, linksElement);
      });
    }
  }

  private addCategories(xmlDoc: Document) {
    const categoriesElement = this.addNodeToRoot(xmlDoc, "Categories");
    const categoryElement = xmlDoc.createElement("Category");
    categoryElement.setAttribute("Id", "RootComponent");
    categoryElement.setAttribute("Label", "Root component");
    categoryElement.setAttribute("Background", "#FF00AA00");
    categoryElement.setAttribute("IsTag", "True");
    this.addNode(categoriesElement, categoryElement);
  }

  private addProperties(xmlDoc: Document) {
    const propertiesElement = this.addNodeToRoot(xmlDoc, "Properties");
    this.addProperty(xmlDoc, propertiesElement, "ComponentFilename", "System.String");
    this.addProperty(xmlDoc, propertiesElement, "Background", "System.Windows.Media.Brush");
    this.addProperty(xmlDoc, propertiesElement, "GraphDirection", "Microsoft.VisualStudio.Diagrams.Layout.LayoutOrientation");
    this.addProperty(xmlDoc, propertiesElement, "GroupLabel", "System.String");
    this.addProperty(xmlDoc, propertiesElement, "IsTag", "System.Boolean");
    this.addProperty(xmlDoc, propertiesElement, "Label", "System.String");
    this.addProperty(xmlDoc, propertiesElement, "Layout", "System.String");
    this.addProperty(xmlDoc, propertiesElement, "TargetType", "System.String");
    this.addProperty(xmlDoc, propertiesElement, "ValueLabel", "System.String");
    this.addProperty(xmlDoc, propertiesElement, "ZoomLevel", "System.String");
    this.addProperty(xmlDoc, propertiesElement, "Expression", "System.String");
  }

  private addProperty(xmlDoc: Document, propertiesElement: Element | null, idValue: string, datatypeValue: string) {
    const propertyElement = xmlDoc.createElement("Property");
    propertyElement.setAttribute("Id", idValue);
    propertyElement.setAttribute("DataType", datatypeValue);
    this.addNode(propertiesElement, propertyElement);
  }

  private addStyles(xmlDoc: Document) {
    const stylesElement = this.addNodeToRoot(xmlDoc, "Styles");
    const styleElement = xmlDoc.createElement("Style");
    styleElement.setAttribute("TargetType", "Node");
    styleElement.setAttribute("GroupLabel", "Root component");
    styleElement.setAttribute("ValueLabel", "Has category");
    const conditionElement = xmlDoc.createElement("Condition");
    conditionElement.setAttribute("Expression", "HasCategory('RootComponent')");
    styleElement.appendChild(conditionElement);
    const setterElement = xmlDoc.createElement("Setter");
    setterElement.setAttribute("Property", "Background");
    setterElement.setAttribute("Property", "#FF00AA00");
    styleElement.appendChild(setterElement);
    this.addNode(stylesElement, styleElement, "GroupLabel");
  }
}
