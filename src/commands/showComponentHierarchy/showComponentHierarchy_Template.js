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

}());