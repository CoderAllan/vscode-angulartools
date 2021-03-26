import { Component } from "@src";

export class DGMLManager {
  
  public createNewDirectedGraph(domImpl: DOMImplementation, direction: string, layout: string, zoomLevel: string) {
    let xmlDoc: Document = domImpl.createDocument('', null, null);
    const root = xmlDoc.createElement("DirectedGraph");
    root.setAttribute("GraphDirection", direction);
    root.setAttribute("Layout", layout);
    root.setAttribute("ZoomLevel", zoomLevel);
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

  public addNodesAndLinks(xmlDoc: Document, componentHash: { [selector: string]: Component; }) {
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

  public addCategory(xmlDoc: Document, id: string, label: string, backgroundColor: string) {
    const categoriesElement = this.addNodeToRoot(xmlDoc, "Categories");
    const categoryElement = xmlDoc.createElement("Category");
    categoryElement.setAttribute("Id", id);
    categoryElement.setAttribute("Label", label);
    categoryElement.setAttribute("Background", backgroundColor);
    categoryElement.setAttribute("IsTag", "True");
    this.addNode(categoriesElement, categoryElement);
  }

  public addProperties(xmlDoc: Document) {
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

  public addStyles(xmlDoc: Document) {
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