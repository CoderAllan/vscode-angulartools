import { ArrowType, BoundingBox, Category, Edge, NetworkNode, Node, NodeType, Position } from "@model";
import * as xmldom from '@xmldom/xmldom';

export class DgmlManager {

  public createNewDirectedGraph(domImpl: xmldom.DOMImplementation, direction: string, layout: string, zoomLevel: string): xmldom.Document {
    let xmlDoc: xmldom.Document = domImpl.createDocument('', '', null);
    const root = xmlDoc.createElement("DirectedGraph");
    if (direction.length > 0) {
      root.setAttribute("GraphDirection", direction);
    }
    root.setAttribute("Layout", layout);
    root.setAttribute("ZoomLevel", zoomLevel);
    root.setAttribute("xmlns", "http://schemas.microsoft.com/vs/2009/dgml");
    xmlDoc.appendChild(root);
    return xmlDoc;
  }

  private addNodeToRoot(xmlDoc: xmldom.Document, tagName: string): xmldom.Element | undefined | null {
    const root = xmlDoc.documentElement;
    const elements = root?.getElementsByTagName(tagName);
    let nodeElement: xmldom.Element;
    if (elements?.length === 0) {
      nodeElement = xmlDoc.createElement(tagName);
      root?.appendChild(nodeElement);
      return nodeElement;
    }
    else {
      const exitingNode = elements?.item(0);
      return exitingNode;
    }
  }

  private addNode(element: xmldom.Element | undefined | null, nodeElement: xmldom.Element, attribute: string = 'Id') {
    if (element !== null) {
      let nodeAlreadyAdded = false;
      if (element != undefined && element.childNodes.length > 0) {
        for (let i = 0; i < element.childNodes.length; i++) {
          let node = element.childNodes[i];
          if (node.nodeType === 1 && (node as xmldom.Element).hasAttribute(attribute) &&
            (node as xmldom.Element).getAttribute(attribute)?.toLowerCase() === nodeElement.getAttribute(attribute)?.toLowerCase()) {
            nodeAlreadyAdded = true;
          }
        }
      }
      if (!nodeAlreadyAdded) {
        element?.appendChild(nodeElement);
      }
    }
  }

  private addLinkNode(xmlDoc: xmldom.Document, element: xmldom.Element | undefined | null, source: string, target: string, categoryId: string, label: string | undefined) {
    if (element !== null) {
      let nodeAlreadyAdded = false;
      if (element != undefined && element.childNodes.length > 0) {
        for (let i = 0; i < element?.childNodes.length; i++) {
          let node = element?.childNodes[i];
          if (node.nodeType === 1 &&
            (node as xmldom.Element).hasAttribute("Source") &&
            (node as xmldom.Element).hasAttribute("Target") &&
            (node as xmldom.Element).getAttribute("Source")?.toLowerCase() === source.toLowerCase() &&
            (node as xmldom.Element).getAttribute("Target")?.toLowerCase() === target.toLowerCase()) {
            nodeAlreadyAdded = true;
          }
        }
      }
      if (!nodeAlreadyAdded) {
        const linkElement = xmlDoc.createElement("Link");
        linkElement.setAttribute("Source", source);
        linkElement.setAttribute("Target", target);
        linkElement.setAttribute("Category", categoryId);
        if (label !== undefined) {
            linkElement.setAttribute("Label", label);
        }
        element?.appendChild(linkElement);
      }
    }
  }

  public addNodesAndLinks(xmlDoc: xmldom.Document, nodes: Node[], nodeInfoDictionary: { [id: string]: NetworkNode }, edges: Edge[]) {
    const nodesElement = this.addNodeToRoot(xmlDoc, "Nodes");
    const linksElement = this.addNodeToRoot(xmlDoc, "Links");
    const categoryDictionary: { [nodeType: string]: Category } = {};
    nodes.forEach(node => {
      if (node.id in nodeInfoDictionary) {
        this.enrichNode(node, nodeInfoDictionary[node.id]);
      }
      this.generateDirectedGraphNodesXml(xmlDoc, node, nodesElement);
      const categoryId = NodeType[node.nodeType];
      if (!(categoryId in categoryDictionary)) {
        categoryDictionary[categoryId] = new Category(categoryId, node.getNodeTypeTitle(), node.getNodeTypeColor(node.nodeType), '', '');
      }
      if (!('File' in categoryDictionary)) {
        categoryDictionary['File'] = new Category('File', '', '', '', 'File');
      }
    });
    edges.forEach(edge => {
      const categoryId = ArrowType[edge.arrowType];
      if (!(categoryId in categoryDictionary)) {
        categoryDictionary[categoryId] = new Category(categoryId, categoryId, '', edge.getEdgeTypeColor(edge.arrowType), '');
      }
      this.generateDirectedGraphLinksXml(xmlDoc, edge, linksElement);
    });
    this.addCategoriesAndStyles(xmlDoc, categoryDictionary);
    this.addProperties(xmlDoc);
  }

  private enrichNode(node: Node, networkNode: NetworkNode) {
    if (networkNode.label) {
      node.name = networkNode.label;
    }
    if (networkNode.position) {
      node.position = networkNode.position;
    }
    if (networkNode.boundingBox) {
      node.boundingBox = networkNode.boundingBox;
    }
  }

  private generateDirectedGraphNodesXml(xmlDoc: xmldom.Document, node: Node, nodesElement: xmldom.Element | undefined |null) {
    const nodeElement = xmlDoc.createElement("Node");
    nodeElement.setAttribute("Label", node.name);
    nodeElement.setAttribute("Id", node.id);
    if (node.boundingBox !== undefined && node.position !== undefined) {
      nodeElement.setAttribute("Bounds", this.calculateBounds(node.position, node.boundingBox));
      nodeElement.setAttribute("UseManualLocation", "True");
    }
    nodeElement.setAttribute("Category", NodeType[node.nodeType]);
    if (node.attributes && node.attributes.length > 0) {
      node.attributes.forEach(attribute => {
        nodeElement.setAttribute(attribute.name, attribute.value);
      });
    }
    if (node.tsFilename) {
      nodeElement.setAttribute("TypescriptFilepath", node.tsFilename);
    }
    this.addCategoryRef(xmlDoc, nodeElement, 'File');
    this.addNode(nodesElement, nodeElement);
  }

  private calculateBounds(position: Position, boundingBox: BoundingBox): string {
    const width = boundingBox.right - boundingBox.left;
    const height = boundingBox.bottom - boundingBox.top;
    return `${position.x},${position.y},${width},${height}`;
  }

  private generateDirectedGraphLinksXml(xmlDoc: xmldom.Document, edge: Edge, linksElement: xmldom.Element | undefined | null) {
    const categoryId = ArrowType[edge.arrowType];
    this.addLinkNode(xmlDoc, linksElement, edge.source, edge.target, categoryId, edge.getEdgeTitle());
  }

  private addCategoryRef(xmlDoc: xmldom.Document, node: xmldom.Element, categoryRef: string) {
    const categoryElement = xmlDoc.createElement("Category");
    categoryElement.setAttribute("Ref", categoryRef);
    node.appendChild(categoryElement);
  }

  private addCategory(xmlDoc: xmldom.Document, categoriesElement: xmldom.Element | undefined | null, category: Category) {
    if (categoriesElement !== null && (category.backgroundColor || category.stroke || category.icon)) {
      const categoryElement = xmlDoc.createElement("Category");
      categoryElement.setAttribute("Id", category.id);
      if (category.label) {
        categoryElement.setAttribute("Label", category.label);
      }
      if (category.backgroundColor) {
        categoryElement.setAttribute("Background", category.backgroundColor);
      }
      if (category.stroke) {
        categoryElement.setAttribute("Stroke", category.stroke);
      }
      if (category.icon) {
        categoryElement.setAttribute("Icon", category.icon);
      }
      categoryElement.setAttribute("IsTag", "True");
      this.addNode(categoriesElement, categoryElement);
    }
  }

  private addCategoriesAndStyles(xmlDoc: xmldom.Document, categories: { [nodeType: string]: Category }) {
    const categoriesElement = this.addNodeToRoot(xmlDoc, "Categories");
    Object.keys(categories).forEach(nodeType => {
      this.addCategory(xmlDoc, categoriesElement, categories[nodeType]);
    });
  }

  private addProperties(xmlDoc: xmldom.Document) {
    const propertiesElement = this.addNodeToRoot(xmlDoc, "Properties");
    this.addProperty(xmlDoc, propertiesElement, "TypescriptFilepath", "System.String", "Typescript filepath", true);
    this.addProperty(xmlDoc, propertiesElement, "Background", "System.Windows.Media.Brush");
    this.addProperty(xmlDoc, propertiesElement, "GraphDirection", "Microsoft.VisualStudio.Diagrams.Layout.LayoutOrientation");
    this.addProperty(xmlDoc, propertiesElement, "UseManualLocation", "System.Boolean");
    this.addProperty(xmlDoc, propertiesElement, "Label", "System.String");
    this.addProperty(xmlDoc, propertiesElement, "Layout", "System.String");
    this.addProperty(xmlDoc, propertiesElement, "ZoomLevel", "System.String");
    this.addProperty(xmlDoc, propertiesElement, "Bounds", "System.Windows.Rect");
  }

  private addProperty(xmlDoc: xmldom.Document, propertiesElement: xmldom.Element | undefined | null, idValue: string, datatypeValue: string, label: string | undefined = undefined, isReference: boolean | undefined = undefined) {
    const propertyElement = xmlDoc.createElement("Property");
    propertyElement.setAttribute("Id", idValue);
    propertyElement.setAttribute("DataType", datatypeValue);
    if (label !== undefined && label.length > 0) {
      propertyElement.setAttribute("Label", label);
    }
    if (isReference !== undefined && isReference) {
      propertyElement.setAttribute("IsReference", isReference.toString());
    }
    this.addNode(propertiesElement, propertyElement);
  }
}
