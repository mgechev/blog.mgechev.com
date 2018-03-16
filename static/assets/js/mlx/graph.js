(function () {
  var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
      next: function () {
        if (o && i >= o.length) o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
  };
  var data = {
    "": {
      "/intro/parent": 144,
      "/intro": 36,
      "/intro/parent/personalize": 23,
      "/main/kid/home": 39,
      "/intro/parent/info": 15,
      "/main/kid/rewards/games": 5,
      "/main/kid/earn": 7,
      "/main/parent/home": 3,
      "/intro/login": 9,
      "/main/kid/question/:standard/:question/:id": 25,
      "/main/kid/question/:standard/:question": 4,
      "/main/kid/reports": 2,
      "/main/parent/settings": 10,
      "/main/parent/verify": 11,
      "/main/parent/faq": 1,
      "/intro/parent/reward": 2,
      "/main/kid/rewards/badges/:id": 1
    },
    "/intro": {
      "": 69,
      "/intro/parent": 18,
      "/main/kid/home": 16,
      "/main/kid/earn": 5,
      "/main/kid/rewards/games": 3,
      "/intro/parent/info": 2,
      "/intro/parent/personalize": 2,
      "/intro/login": 2,
      "/intro/parent/reward": 1,
      "/intro/parent/reward/:id": 1,
      "/main/kid/friends": 1,
      "/main/kid/question/:standard/:question": 7,
      "/main/kid/question/:standard/:question/:id": 20,
      "/main/kid/reports": 1,
      "/main/kid/rewards/games/:id": 1,
      "/main/parent/home": 1,
      "/main/parent/settings": 2
    },
    "/intro/parent": {
      "/intro": 28,
      "": 17,
      "/main/kid/home": 5,
      "/intro/parent/personalize": 9,
      "/intro/parent/info": 7,
      "/intro/parent/reward": 1,
      "/intro/parent/reward/:id": 1,
      "/main/kid/question/:standard/:question/:id": 10,
      "/main/parent/settings": 3,
      "/main/kid/question/:standard/:question": 1,
      "/main/kid/earn": 3,
      "/main/kid/rewards/badges": 1,
      "/main/kid/rewards/games": 1
    },
    "/main/kid/home": {
      "": 13,
      "/main/kid/earn": 7,
      "/intro/parent": 3,
      "/main/kid/rewards/games": 3,
      "/intro": 2,
      "/main/kid/friends": 2,
      "/main/kid/reports": 2,
      "/main/parent/home": 2,
      "/intro/parent/info": 1,
      "/intro/parent/reward/:id": 1,
      "/main/kid/question/:standard/:question": 2,
      "/main/kid/question/:standard/:question/:id": 8,
      "/main/kid/rewards/games/:id": 3,
      "/main/parent/settings": 1
    },
    "/intro/parent/info": {
      "/intro/parent/personalize": 5,
      "": 2,
      "/intro": 1,
      "/intro/parent/reward": 1
    },
    "/main/kid/earn": {
      "/main/kid/home": 4,
      "": 5,
      "/main/kid/question/:standard/:question/:id": 4
    },
    "/main/kid/rewards/games": {
      "/main/kid/home": 3,
      "/main/parent/home": 2,
      "": 2,
      "/intro/login": 1,
      "/main/kid/earn": 1,
      "/main/kid/friends": 1,
      "/main/kid/question/:standard/:question/:id": 1,
      "/main/kid/rewards/games/:id": 1,
      "/main/parent/settings": 1
    },
    "/intro/login": {
      "": 4,
      "/intro/parent": 1,
      "/main/kid/question/:standard/:question/:id": 1,
      "/main/kid/reports": 3
    },
    "/intro/parent/personalize": {
      "": 3,
      "/intro": 2,
      "/intro/parent/info": 2,
      "/main/kid/home": 2,
      "/intro/parent": 2,
      "/intro/parent/reward": 1,
      "/main/kid/question/:standard/:question/:id": 1
    },
    "/main/kid/rewards/badges": {
      "/main/kid/earn": 2
    },
    "/main/parent/home": {
      "/main/kid/home": 2,
      "/main/parent/faq": 2,
      "": 1,
      "/main/kid/rewards/badges": 1,
      "/main/kid/rewards/games/:id": 1
    },
    "/intro/parent/reward": {
      "": 1,
      "/intro/parent": 1,
      "/intro/parent/personalize": 1,
      "/main/kid/home": 1,
      "/main/parent/home": 1
    },
    "/main": {
      "": 1
    },
    "/main/kid/friends": {
      "": 1,
      "/main/kid/reports": 1
    },
    "/main/kid/question/:standard/:question/:id": {
      "/main/kid/question/:standard/:question": 6,
      "/intro/login": 2,
      "/main/kid/rewards/badges/:id": 1,
      "": 13,
      "/main/kid/home": 11,
      "/intro/parent/personalize": 1,
      "/main/kid/rewards/games": 2,
      "/intro/parent/reward/:id": 1,
      "/intro": 1,
      "/main/kid/rewards/games/:id": 3,
      "/main": 1,
      "/main/kid/earn": 2,
      "/intro/parent": 1
    },
    "/main/kid/question/:standard/:question": {
      "/intro": 1,
      "/main/kid/question/:standard/:question/:id": 8,
      "/main/kid/rewards/games": 1,
      "/main/kid/home": 1,
      "": 1
    },
    "/main/kid/reports": {
      "": 7,
      "/main/kid/earn": 1,
      "/main/parent/settings": 1,
      "/intro/parent": 1,
      "/intro": 2,
      "/main/kid/rewards/badges": 1,
      "/intro/login": 1
    },
    "/main/kid/rewards/badges/:id": {
      "/main/kid/rewards/games/:id": 1,
      "/main/kid/rewards/games": 1
    },
    "/main/kid/rewards/games/:id": {
      "/main/kid/home": 3,
      "/intro": 1
    },
    "/main/parent/faq": {
      "": 1,
      "/main/kid/home": 1
    },
    "/main/parent/settings": {
      "/main/kid/rewards/games": 1,
      "": 16,
      "/intro": 2
    },
    "/main/parent/verify": {
      "": 11,
      "/intro/parent": 1
    }
  }

  function normalizeElements(graph) {
    var calculateNodeStrength = function (graph, n) {
      var sum = 0;
      Object.keys(graph[n] || {}).forEach(function (k) {
        sum += graph[n][k] || 0;
      });
      Object.keys(graph)
        .filter(function (k) { return k !== n; })
        .forEach(function (k) {
          sum += graph[k][n] || 0;
        });
      return sum;
    };
    var nodeSet = Object.keys(graph).reduce(function (a, c) {
      a.add(c);
      Object.keys(graph[c]).forEach(function (n) { return a.add(n); });
      return a;
    }, new Set());
    var nodes = [];
    try {
      for (var nodeSet_1 = __values(nodeSet), nodeSet_1_1 = nodeSet_1.next(); !nodeSet_1_1.done; nodeSet_1_1 = nodeSet_1.next()) {
        var n = nodeSet_1_1.value;
        var nodeStrength = calculateNodeStrength(graph, n);
        nodes.push({
          data: {
            id: n,
            name: n,
            width: Math.max(nodeStrength * 0.8, 30)
          }
        });
      }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
      try {
        if (nodeSet_1_1 && !nodeSet_1_1.done && (_a = nodeSet_1.return)) _a.call(nodeSet_1);
      }
      finally { if (e_1) throw e_1.error; }
    }
    var edges = [];
    Object.keys(graph).forEach(function (k) {
      Object.keys(graph[k]).forEach(function (n) {
        edges.push({
          data: {
            id: k + '-' + n,
            source: k,
            target: n,
            weight: graph[k][n]
          }
        });
      });
    });
    return {
      nodes: nodes,
      edges: edges
    };
    var e_1, _a;
  }
  function render(graph) {
    cytoscape({
      layout: {
        name: 'cose',
        idealEdgeLength: 100,
        nodeOverlap: 100,
        refresh: 20,
        fit: true,
        padding: 10,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 4000000,
        edgeElasticity: 100000,
        nestingFactor: 5,
        gravity: 100,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      },
      style: cytoscape
        .stylesheet()
        .selector('edge')
        .style({
          width: function (n) {
            return n.data().weight;
          },
          'line-color': function (n) {
            var w = n.data().weight;
            console.log(w);
            if (w > 19) {
              return '#F5AB35';
            } else if (w > 10) {
              return '#ED8F3B';
            }
            return '#D46455';
          }
        })
        .selector('node')
        .style({
          width: function (n) {
            return n.data().width / 2;
          },
          'background-color': function (n) {
            var w = n.data().width / 2;
            if (w > 90) {
              return '#F5AB35';
            } else if (w > 40) {
              return '#ED8F3B';
            }
            return '#D46455';
          },
          height: function (n) {
            return n.data().width / 2;
          },
          label: function (n) {
            return n.data().name;
          },
          color: function () {
            return '#ccc';
          },
          'font-size': function () {
            return 35;
          }
        }),
      container: document.getElementById('canvas'),
      elements: normalizeElements(graph),
      ready: function () {
        window.cy = this;
      }
    });
  }

  render(data);

}());