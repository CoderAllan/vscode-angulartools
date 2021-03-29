import { ArrowType, BoundingBox, Category, Edge, NetworkNode, Node, NodeType, Position } from "@model";

export class DgmlManager {

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

  private addLinkNode(xmlDoc: Document, element: Element | null, source: string, target: string, categoryId: string) {
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
        linkElement.setAttribute("Category", categoryId);
        element.appendChild(linkElement);
      }
    }
  }

  public addNodesAndLinks(xmlDoc: Document, nodes: Node[], nodeInfos: NetworkNode[], edges: Edge[]) {
    const nodeInfoDictionary = Object.assign({}, ...nodeInfos.map((nodeInfo) => ({ [nodeInfo.id]: nodeInfo })));
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
        categoryDictionary[categoryId] = new Category(categoryId, categoryId, node.getNodeTypeColor(node.nodeType), '');
      }
    });
    edges.forEach(edge => {
      const categoryId = ArrowType[edge.arrowType];
      if (!(categoryId in categoryDictionary)) {
        categoryDictionary[categoryId] = new Category(categoryId, categoryId, '', edge.getEdgeTypeColor(edge.arrowType));
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

  private generateDirectedGraphNodesXml(xmlDoc: Document, node: Node, nodesElement: Element | null) {
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
    this.addNode(nodesElement, nodeElement);
  }
  
  private calculateBounds(position: Position, boundingBox: BoundingBox): string {
    const width = boundingBox.right - boundingBox.left;
    const height = boundingBox.bottom - boundingBox.top;
    return `${position.x},${position.y},${width},${height}`;
  }

  private generateDirectedGraphLinksXml(xmlDoc: Document, edge: Edge, linksElement: Element | null) {
    const categoryId = ArrowType[edge.arrowType];
    this.addLinkNode(xmlDoc, linksElement, edge.source, edge.target, categoryId);
  }

  private addCategory(xmlDoc: Document, categoriesElement: Element | null, category: Category) {
    if (categoriesElement !== null && ( category.backgroundColor || category.stroke )) {
      const categoryElement = xmlDoc.createElement("Category");
      categoryElement.setAttribute("Id", category.id);
      categoryElement.setAttribute("Label", category.label);
      if (category.backgroundColor) {
        categoryElement.setAttribute("Background", category.backgroundColor);
      }
      if (category.stroke) {
        categoryElement.setAttribute("Stroke", category.stroke);
      }
      categoryElement.setAttribute("IsTag", "True");
      this.addNode(categoriesElement, categoryElement);
    }
  }

  private addCategoriesAndStyles(xmlDoc: Document, categories: { [nodeType: string]: Category }) {
    const categoriesElement = this.addNodeToRoot(xmlDoc, "Categories");
    Object.keys(categories).forEach(nodeType => {
      this.addCategory(xmlDoc, categoriesElement, categories[nodeType]);
    });
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
}