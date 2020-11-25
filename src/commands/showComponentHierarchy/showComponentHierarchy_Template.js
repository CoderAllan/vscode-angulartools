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
    finalSelectionCanvas.remove();
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

  function mouseMoveEventListener(event) {
    mouseX = parseInt(event.clientX - selectionCanvas.offsetLeft);
    mouseY = parseInt(event.clientY - selectionCanvas.offsetTop);
    if (selectionCanvasContext != undefined) {
      selectionCanvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
      selectionCanvasContext.beginPath();
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

  function saveAsPng() {
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

  function copyToClipboard() {
    console.log('Not implemented yet...');
  }

}());