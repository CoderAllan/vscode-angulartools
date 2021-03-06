import { CommandBase } from '@commands';
import { Component, ComponentManager, Config, FileSystemUtils } from '@src';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as xmldom from 'xmldom';

const prettifyXml = require('prettify-xml');
const xmlSerializer = require('xmlserializer');

export class ComponentHierarchyDgml extends CommandBase {
  private config = new Config();
  public static get commandName(): string { return 'componentHierarchyDgml'; }

  public execute() {
    this.checkForOpenWorkspace();
    const fsUtils = new FileSystemUtils();
    var directoryPath: string = fsUtils.getWorkspaceFolder();
    const components = ComponentManager.findComponents(directoryPath);

    const domImpl = new xmldom.DOMImplementation();
    const documentParser = new xmldom.DOMParser();
    let xmlDocument: Document;

    try {
      // if the graph file already exists, then read it and parse it into a xml document object
      console.log('this.config.dgmlGraphFilename', this.config.dgmlGraphFilename);
      if (fs.existsSync(this.config.dgmlGraphFilename)) {
        try {
          const content = fs.readFileSync(this.config.dgmlGraphFilename).toString();
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
      fsUtils.writeFile(path.join(directoryPath, this.config.dgmlGraphFilename), fileContent, () => {
        vscode.window.showInformationMessage('The project structure has been analyzed and a Directed Graph Markup Language (dgml) file has been created\nThe ReadMe-ProjectStructure.dgml file can now be viewed in Visual Studio');
      });
    } catch (ex) {
      console.log('exception:' + ex);
    }
  }

  private createNewDirectedGraph(domImpl: DOMImplementation) {
    let xmlDoc: Document = domImpl.createDocument('', null, null);
    const root = xmlDoc.createElement("DirectedGraph");
    root.setAttribute("GraphDirection", this.config.dgmlGraphDirection);
    root.setAttribute("Layout", this.config.dgmlGraphLayout);
    root.setAttribute("ZoomLevel", this.config.dgmlZoomLevel);
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
    categoryElement.setAttribute("Background", this.config.rootNodeBackgroundColor);
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
