(function () {
  function highlightNode(node) {
    var filter = 'filter:url(#dropshadow);';
    return {
      do: function () {
        var text = node.getAttribute('style') || '';
        node.setAttribute('style', filter + text);
      },
      undo: function () {
        var text = node.getAttribute('style') || '';
        node.setAttribute('style', text.replace(filter, ''));
      }
    };
  }

  function downloadNode(node, timeout) {
    var stroke = 'stroke:black;stroke-width:5;';
    return {
      do: function () {
        setTimeout(function () {
          var text = node.getAttribute('style') || '';
          node.setAttribute('style', stroke + text);
        }, timeout);
      },
      undo: function () {
        var text = node.getAttribute('style') || '';
        node.setAttribute('style', text.replace(stroke, ''));
      },
      undoReset: true
    };
  }

  function highlightRow(node) {
    return {
      do: function () {
        node.classList.add('current-row');
      },
      undo: function () {
        node.classList.remove('current-row');
      }
    };
  }

  function addActivity(text) {
    var list = $('activity-list');
    return {
      do: function () {
        var node = document.createElement('li');
        node.innerText = text;
        list.appendChild(node);
      },
      undo: function () { }
    };
  }

  function $(id) {
    return document.getElementById(id);
  }

  var downloadTimeout = 500;

  var commandList = [
    [
      highlightNode($('root')),
      highlightRow($('root-row')),
      addActivity('Download b.bundle.js'),
      downloadNode($('root'), downloadTimeout)
    ],
    [
      highlightNode($('b')),
      highlightRow($('b-row')),
      addActivity('No action'),
      downloadNode($('b'), downloadTimeout),
      downloadNode($('b-a'), downloadTimeout)
    ],
    [
      highlightNode($('b-a')),
      highlightRow($('b-a-row')),
      addActivity('Download a.bundle.js'),
      downloadNode($('root'), downloadTimeout),
      downloadNode($('a'), downloadTimeout),
      downloadNode($('a-a'), downloadTimeout),
      downloadNode($('a-b'), downloadTimeout)
    ]
  ];

  var currentIndex = 0;
  var max = 3;
  var timeout = 2500;

  function execute() {
    if (currentIndex >= 3) {
      reset();
      return;
    }
    if (currentIndex > 0) {
      commandList[currentIndex - 1].forEach(function (c) {
        if (!c.undoReset) {
          c.undo();
        }
      });
    }
    commandList[currentIndex].forEach(function (c) {
      c.do();
    });
    setTimeout(function () {
      execute();
    }, timeout);
    currentIndex += 1;
  }

  function reset() {
    currentIndex = 0;
    commandList.forEach(function (row) {
      row.forEach(function (c) {
        c.undo();
      });
    });
    $('activity-list').innerHTML = '';
    setTimeout(function () {
      execute();
    }, timeout);
  }

  reset();
})();
