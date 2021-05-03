(function () {
  const nodes = new vis.DataSet([]);

  const rootNodes = [];
  rootNodes.forEach(nodeId => {
    nodes.get(nodeId).color = {
      background: "#00FF00" // rootNode background color
    };
  });

  const arrowAttr = {
    to: {
      enabled: true,
      type: "triangle" // edge arrow to type
    }
  };
  const edges = new vis.DataSet([]);

  const data = {
    nodes: nodes,
    edges: edges
  };
  let options = {
    edges: {
      smooth: false // Make edges straight lines.
    },
    nodes: {
      font: { multi: 'html' },
      shape: 'box' // The shape of the nodes.
    }
  };
  setRandomLayout();
  const container = document.getElementById('network');
  let network = new vis.Network(container, data, options);
  let seed = network.getSeed();
  
  network.on("stabilizationIterationsDone", function () {
    network.setOptions({
      physics: false
    });
    unfixNodes();
    postGraphState();
  });
  network.on('dragEnd', postGraphState);

  const vscode = acquireVsCodeApi();
  const helpTextDiv = document.getElementById('helpText');
  let lastMouseX = lastMouseY = 0;
  let mouseX = mouseY = 0;
  let selection;
  // get the vis.js canvas
  const graphDiv = document.getElementById('network');
  const visDiv = graphDiv.firstElementChild;
  const graphCanvas = visDiv.firstElementChild;
  const selectionLayer = document.getElementById('selectionLayer');
  const selectionCanvas = selectionLayer.firstElementChild;
  let selectionCanvasContext;

  const hierarchicalOptionsDirectionSelect = document.getElementById('direction');

  // add button event listeners
  const saveAsPngButton = document.getElementById('saveAsPngButton');
  saveAsPngButton.addEventListener('click', saveAsPng);
  const saveAsDgmlButton = document.getElementById('saveAsDgmlButton');
  saveAsDgmlButton.addEventListener('click', saveAsDgml);
  const saveAsDotButton = document.getElementById('saveAsDotButton');
  saveAsDotButton.addEventListener('click', saveAsDot);
  const regenerateGraphButton = document.getElementById('regenerateGraphButton');
  regenerateGraphButton.addEventListener('click', regenerateGraph);
  const saveSelectionAsPngButton = document.getElementById('saveSelectionAsPngButton');
  saveSelectionAsPngButton.addEventListener('click', saveSelectionAsPng);
  const showHierarchicalOptionsCheckbox = document.getElementById('showHierarchicalOptions');
  showHierarchicalOptionsCheckbox.addEventListener('click', showHierarchicalOptions);
  const hierarchicalDirectionSelect = document.getElementById('direction');
  hierarchicalDirectionSelect.addEventListener('change', setNetworkLayout);
  const hierarchicalSortMethodSelect = document.getElementById('sortMethod');
  hierarchicalSortMethodSelect.addEventListener('change', setNetworkLayout);
  const hierarchicalOptionsSortMethodSelect = document.getElementById('sortMethod');
  const hierarchicalOptionsDirection = document.getElementById('hierarchicalOptions_direction');
  const hierarchicalOptionsSortMethod = document.getElementById('hierarchicalOptions_sortmethod');

  function mouseUpEventListener(event) {
    // Convert the canvas to image data that can be saved
    const aspectRatioX = graphCanvas.width / selectionCanvas.width;
    const aspectRatioY = graphCanvas.height / selectionCanvas.height;
    const finalSelectionCanvas = document.createElement('canvas');
    finalSelectionCanvas.width = selection.width;
    finalSelectionCanvas.height = selection.height;
    const finalSelectionCanvasContext = finalSelectionCanvas.getContext('2d');
    finalSelectionCanvasContext.drawImage(graphCanvas, selection.top * aspectRatioX, selection.left * aspectRatioY, selection.width * aspectRatioX, selection.height * aspectRatioY, 0, 0, selection.width, selection.height);

    // Call back to the extension context to save the selected image to the workspace folder.
    vscode.postMessage({
      command: 'saveAsPng',
      text: finalSelectionCanvas.toDataURL()
    });
    // Remove the temporary canvas
    finalSelectionCanvas.remove();
    // Reset the state variables
    selectionCanvasContext = undefined;
    selection = {};
    // hide the help text
    helpTextDiv.style['display'] = 'none';
    // hide selection layer and remove event listeners
    selectionLayer.removeEventListener('mouseup', mouseUpEventListener);
    selectionLayer.removeEventListener('mousedown', mouseDownEventListener);
    selectionLayer.removeEventListener('mousemove', mouseMoveEventListener);
    selectionLayer.style['display'] = 'none';
  }

  function mouseDownEventListener(event) {
    lastMouseX = parseInt(event.clientX - selectionCanvas.offsetLeft);
    lastMouseY = parseInt(event.clientY - selectionCanvas.offsetTop);
    selectionCanvasContext = selectionCanvas.getContext("2d");
  }

  function drawGuideLine(ctx, mouseX, mouseY) {
    ctx.beginPath();
    ctx.setLineDash([3, 7]);
    if (mouseX > -1) {
      ctx.moveTo(mouseX, 0);
      ctx.lineTo(mouseX, selectionCanvas.height);
    } else if (mouseY > -1) {
      ctx.moveTo(0, mouseY);
      ctx.lineTo(selectionCanvas.width, mouseY);
    }
    ctx.strokeStyle = 'blue'; // graph selection guideline color
    ctx.lineWidth = 1; // graph selection guideline width
    ctx.stroke();
  }

  function showGuideLines() {
    const tmpSelectionCanvasContext = selectionCanvas.getContext("2d");
    tmpSelectionCanvasContext.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    drawGuideLine(tmpSelectionCanvasContext, mouseX, -1);
    drawGuideLine(tmpSelectionCanvasContext, -1, mouseY);
  }

  function mouseMoveEventListener(event) {
    mouseX = parseInt(event.clientX - selectionCanvas.offsetLeft);
    mouseY = parseInt(event.clientY - selectionCanvas.offsetTop);
    showGuideLines();
    if (selectionCanvasContext != undefined) {
      selectionCanvasContext.beginPath();
      selectionCanvasContext.setLineDash([]);
      const width = mouseX - lastMouseX;
      const height = mouseY - lastMouseY;
      selectionCanvasContext.rect(lastMouseX, lastMouseY, width, height);
      selection = { // Save the current position and size to be used when the mouseup event is fired
        'top': lastMouseX,
        'left': lastMouseY,
        'height': height,
        'width': width
      };
      selectionCanvasContext.strokeStyle = 'red';
      selectionCanvasContext.lineWidth = 2;
      selectionCanvasContext.stroke();
    }
  }

  function saveSelectionAsPng() {
    // show the help text
    helpTextDiv.style['display'] = 'block';

    // show the selection layer
    selectionLayer.style['display'] = 'block';

    // make sure the selection canvas covers the whole screen
    selectionCanvas.width = window.innerWidth;
    selectionCanvas.height = window.innerHeight;
    // reset the current context and selection
    selectionCanvasContext = undefined;
    selection = {};

    selectionLayer.addEventListener("mouseup", mouseUpEventListener, true);
    selectionLayer.addEventListener("mousedown", mouseDownEventListener, true);
    selectionLayer.addEventListener("mousemove", mouseMoveEventListener, true);
  }

  function saveAsPng() {
    // Calculate the bounding box of all the elements on the canvas
    const boundingBox = getBoundingBox();

    // copy the imagedata within the bounding box
    const finalSelectionCanvas = document.createElement('canvas');
    finalSelectionCanvas.width = boundingBox.width;
    finalSelectionCanvas.height = boundingBox.height;
    const finalSelectionCanvasContext = finalSelectionCanvas.getContext('2d');
    finalSelectionCanvasContext.drawImage(graphCanvas, boundingBox.top, boundingBox.left, boundingBox.width, boundingBox.height, 0, 0, boundingBox.width, boundingBox.height);

    // Call back to the extension context to save the image of the graph to the workspace folder.
    vscode.postMessage({
      command: 'saveAsPng',
      text: finalSelectionCanvas.toDataURL()
    });

    // Remove the temporary canvas
    finalSelectionCanvas.remove();
  }

  function getBoundingBox() {
    const ctx = graphCanvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, graphCanvas.width, graphCanvas.height);
    const bytesPerPixels = 4;
    const cWidth = graphCanvas.width * bytesPerPixels;
    const cHeight = graphCanvas.height;
    let minY = minX = maxY = maxX = -1;
    for (let y = cHeight; y > 0 && maxY === -1; y--) {
      for (let x = 0; x < cWidth; x += bytesPerPixels) {
        const arrayPos = x + y * cWidth;
        if (imgData.data[arrayPos + 3] > 0 && maxY === -1) {
          maxY = y;
          break;
        }
      }
    }
    for (let x = cWidth; x >= 0 && maxX === -1; x -= bytesPerPixels) {
      for (let y = 0; y < maxY; y++) {
        const arrayPos = x + y * cWidth;
        if (imgData.data[arrayPos + 3] > 0 && maxX === -1) {
          maxX = x / bytesPerPixels;
          break;
        }
      }
    }
    for (let x = 0; x < maxX * bytesPerPixels && minX === -1; x += bytesPerPixels) {
      for (let y = 0; y < maxY; y++) {
        const arrayPos = x + y * cWidth;
        if (imgData.data[arrayPos + 3] > 0 && minX === -1) {
          minX = x / bytesPerPixels;
          break;
        }
      }
    }
    for (let y = 0; y < maxY && minY === -1; y++) {
      for (let x = minX * bytesPerPixels; x < maxX * bytesPerPixels; x += bytesPerPixels) {
        const arrayPos = x + y * cWidth;
        if (imgData.data[arrayPos + 3] > 0 && minY === -1) {
          minY = y;
          break;
        }
      }
    }
    return {
      'top': minX,
      'left': minY,
      'width': maxX - minX,
      'height': maxY - minY
    };
  }

  function saveAsDgml() {
    postSaveAsCommand('saveAsDgml');
  }

  function saveAsDot() {
    postSaveAsCommand('saveAsDot');
  }

  function postSaveAsCommand(command) {
    const nodeExport = {};
    nodes.forEach(node => {
      nodeExport[node.id] = {
        id: node.id,
        label: command === 'saveAsDgml' ? cleanLabelDgml(node.label) : cleanLabelDot(node.label),
        position: network.getPosition(node.id),
        boundingBox: network.getBoundingBox(node.id)
      };
    });
    const direction = hierarchicalOptionsDirectionSelect.value ? hierarchicalOptionsDirectionSelect.value : 'UD';
    vscode.postMessage({
      command: command,
      text: JSON.stringify({
        nodes: nodeExport,
        direction: direction
      })
    });
  }

  function cleanLabelDgml(label) {
    let cleanedLabel = removeHtmlTags(label);
    cleanedLabel = removeNewlines(cleanedLabel);
    return cleanedLabel;
  }

  function cleanLabelDot(label) {
    let cleanedLabel = convertNewlinesToDotNewlines(label);
    return cleanedLabel;
  }

  function removeHtmlTags(label) {
    let cleanedLabel = label.replace(/(<([^>]+)>)/ig, '');
    return cleanedLabel;
  }

  function removeNewlines(label) {
    let cleanedLabel = label.replace(/\s+/g, '');
    return cleanedLabel;
  }

  function convertNewlinesToDotNewlines(label) {
    let cleanedLabel = label.replace(/\n/g, '<br align="left"/>');
    return cleanedLabel;
  }

  function regenerateGraph() {
    seed = Math.random();
    removeNodePositions();
    setNetworkLayout();
  }

  function setRandomLayout() {
    options.layout = {
      hierarchical: {
        enabled: false
      }
    };
    options.physics = {
      enabled: true,
      barnesHut: {
        springConstant: 0,
        avoidOverlap: 0.8
      }
    };
  }

  function setHierarchicalLayout(direction, sortMethod) {
    options.layout = {
      hierarchical: {
        enabled: true,
        levelSeparation: 200,
        nodeSpacing: 200,
        direction: direction,
        sortMethod: sortMethod
      }
    };
    options.physics = {
      enabled: true,
      hierarchicalRepulsion: {
        springConstant: 0,
        avoidOverlap: 0.2
      }
    };
  }

  function showHierarchicalOptions(){
    if (showHierarchicalOptionsCheckbox.checked) {
      hierarchicalOptionsDirection.style['display'] = 'block';
      hierarchicalOptionsSortMethod.style['display'] = 'block';
      if (hierarchicalOptionsDirectionSelect.value && hierarchicalOptionsDirectionSelect.value === 'Random') {
        regenerateGraphButton.style['display'] = 'block';
      } else {
        regenerateGraphButton.style['display'] = 'none';
      }
    } else {
      hierarchicalOptionsDirection.style['display'] = 'none';
      hierarchicalOptionsSortMethod.style['display'] = 'none';
      regenerateGraphButton.style['display'] = 'block';
    }
  }

  function setNetworkLayout() {
    if (showHierarchicalOptionsCheckbox.checked) {
      if (hierarchicalOptionsDirectionSelect.value && hierarchicalOptionsDirectionSelect.value === 'Random') {
        setRandomLayout();
        seed = Math.random();
        removeNodePositions();
        regenerateGraphButton.style['display'] = 'block';
      } else {
        const direction = hierarchicalOptionsDirectionSelect.value ? hierarchicalOptionsDirectionSelect.value : 'UD';
        const sortMethod = hierarchicalOptionsSortMethodSelect.value ? hierarchicalOptionsSortMethodSelect.value : 'hubsize';
        setHierarchicalLayout(direction, sortMethod);
        regenerateGraphButton.style['display'] = 'none';
      }
    } else {
      options.layout = {};
      regenerateGraphButton.style['display'] = 'block';
    }
    options.layout.randomSeed = seed;
    network = new vis.Network(container, data, options);
    network.on("stabilizationIterationsDone", function () {
      network.setOptions({
        physics: false
      });
      unfixNodes();
      postGraphState();
    });
    network.on('dragEnd', postGraphState);
    postGraphState();
  }

  function postGraphState() {
    const message = JSON.stringify({
      networkSeed: seed,
      graphDirection: showHierarchicalOptionsCheckbox.checked ? hierarchicalOptionsDirectionSelect.value : undefined,
      graphLayout: showHierarchicalOptionsCheckbox.checked ? hierarchicalOptionsSortMethodSelect.value : undefined,
      showHierarchicalOptions: showHierarchicalOptionsCheckbox.checked,
      nodePositions: getNodePositions()
    });
    vscode.postMessage({
      command: 'setGraphState',
      text: message
    });
  }

  function getNodePositions() {
    const nodePositions = {};
    nodes.forEach(node => {
      const position = network.getPosition(node.id);
      nodePositions[node.id] = {
        x: position.x,
        y: position.y
      };
    });
    return nodePositions;
  }

  function unfixNodes() {
    nodes.forEach(function (node) {
      nodes.update({
        id: node.id,
        fixed: false
      });
    });
  }

  function removeNodePositions() {
    nodes.forEach(function (node) {
      nodes.update({
        id: node.id,
        fixed: false,
        x: undefined,
        y: undefined
      });
    });
  }

}());