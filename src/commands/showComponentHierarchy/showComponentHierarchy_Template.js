(function () {
  var nodes = new vis.DataSet([]);

  var rootNodes = [];
  rootNodes.forEach(nodeId => {
    nodes.get(nodeId).color = {
      background: "#00FF00"
    };
  });

  var arrowAttr = {
    to: {
      enabled: true,
      type: "triangle"
    }
  };
  var edges = new vis.DataSet([]);

  var data = {
    nodes: nodes,
    edges: edges
  };
  var options = {};
  var container = document.getElementById('network');
  var network = new vis.Network(container, data, options);

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

  // add button event listeners
  const saveAsPngButton = document.getElementById('saveAsPngButton');
  saveAsPngButton.addEventListener('click', saveAsPng);
  const saveSelectionAsPngButton = document.getElementById('saveSelectionAsPngButton');
  saveSelectionAsPngButton.addEventListener('click', saveSelectionAsPng);
  const copyToClipboardButton = document.getElementById('copyToClipboardButton');
  copyToClipboardButton.addEventListener('click', copyToClipboard);
  copyToClipboardButton.style['display'] = 'none'; // TODO: Remove when copyToClipboard is implemented

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
    if(mouseX > -1) {
      ctx.moveTo(mouseX, 0);
      ctx.lineTo(mouseX, selectionCanvas.height);
    } else if (mouseY > -1) {
      ctx.moveTo(0, mouseY);
      ctx.lineTo(selectionCanvas.width, mouseY);
    }
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function showGuideLines() {
    var tmpSelectionCanvasContext = selectionCanvas.getContext("2d");
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
    selectionLayer.addEventListener("mousedown", mouseDownEventListener , true);
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
    finalSelectionCanvasContext.drawImage(graphCanvas, boundingBox.top , boundingBox.left , boundingBox.width, boundingBox.height , 0, 0, boundingBox.width, boundingBox.height);

    // Call back to the extension context to save the image of the graph to the workspace folder.
    vscode.postMessage({
      command: 'saveAsPng',
      text: finalSelectionCanvas.toDataURL()
    });

    // Remove the temporary canvas
    finalSelectionCanvas.remove();
  }

  function getBoundingBox() {
    var ctx = graphCanvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, graphCanvas.width, graphCanvas.height);
    var bytesPerPixels = 4;
    var cWidth = graphCanvas.width * bytesPerPixels;
    var cHeight = graphCanvas.height;
    var minY = minX = maxY = maxX = -1;
    for (var y = cHeight; y > 0  && maxY === -1; y--) {
      for (var x = 0; x < cWidth; x += bytesPerPixels) {
        var arrayPos = x + y * cWidth;
        if (imgData.data[arrayPos + 3] > 0 && maxY === -1) {
          maxY = y;
          break;
        }
      }
    }
    for (var x = cWidth; x >= 0 && maxX === -1; x -= bytesPerPixels) {
      for (var y = 0; y < maxY; y++) {
        var arrayPos = x + y * cWidth;
        if (imgData.data[arrayPos + 3] > 0 && maxX === -1) {
          maxX = x / bytesPerPixels;
          break;
        }
      }
    }
    for (var x = 0; x < maxX * bytesPerPixels && minX === -1; x += bytesPerPixels) {
      for (var y = 0; y < maxY; y++) {
        var arrayPos = x + y * cWidth;
        if (imgData.data[arrayPos + 3] > 0 && minX === -1) {
          minX = x / bytesPerPixels;
          break;
        }
      }
    }
    for (var y = 0; y < maxY && minY === -1; y++) {
      for (var x = minX * bytesPerPixels; x < maxX * bytesPerPixels; x += bytesPerPixels) {
        var arrayPos = x + y * cWidth;
        if (imgData.data[arrayPos + 3] > 0 && minY === -1) {
          minY = y;
          break;
        }
      }
    }
    return {
      'top': minX,
      'left': minY,
      'width': maxX-minX,
      'height': maxY-minY
    };
  }

  function copyToClipboard() {
    console.log('Not implemented yet...');
  }
  
}());