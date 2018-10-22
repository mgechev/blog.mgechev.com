(function() {
  var crop = document.createElement('canvas');
  crop.width = 100;
  crop.height = 56;

  var tab = function(el, onChange) {
    var nav = el.getElementsByTagName('ul')[0];
    var tabs = [].slice.call(nav.getElementsByTagName('li'));
    var panels = [].slice.call(el.querySelectorAll('.content > div'));
    panels.forEach(function(p) {
      p.style.display = 'none';
    });
    tabs.forEach(function(el, idx) {
      el.addEventListener('click', function() {
        if (el.classList.contains('selected')) {
          return;
        }
        panels.forEach(function(e) {
          e.style.display = 'none';
        });
        panels[idx].style.display = 'grid';
        tabs.forEach(function(e) {
          e.className = '';
        });
        el.className = 'selected';
        if (typeof onChange === 'function') {
          onChange(el, panels[idx]);
        }
      });
    });
    tabs[0].className = 'selected';
    panels[0].style.display = 'grid';
  };

  var dropArea = function(el, onDrop) {
    var dropArea = el;

    dropArea.querySelector('input[type="file"]').onchange = function(event) {
      if (this.files && this.files[0]) {
        previewFile(this.files[0]);
      }
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
      dropArea.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(function(eventName) {
      dropArea.addEventListener(eventName, highlight, false);
    });
    ['dragleave', 'drop'].forEach(function(eventName) {
      dropArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    function highlight(e) {
      dropArea.classList.add('highlight');
    }

    function unhighlight(e) {
      dropArea.classList.remove('highlight');
    }

    function fill(e) {
      dropArea.classList.add('filled');
    }

    function handleDrop(e) {
      previewFile(e.dataTransfer.files[0]);
    }

    function previewFile(file) {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = function() {
        var img = dropArea.querySelector('.image-preview');
        img.src = reader.result;
        fill(dropArea);
        img.onload = function() {
          var canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext('2d').drawImage(img, 0, 0);
          onDrop(canvas);
        };
      };
    }
  };

  var scale = function(canvas) {
    crop.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.width / (100 / 56), 0, 0, 100, 56);
    return crop;
  };

  var grayscale = function(canvas) {
    var imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
    canvas.getContext('2d').putImageData(imageData, 0, 0);
  };

  var renderTable = function(conf) {
    var headers = conf.headers;
    var rows = conf.rows;
    var table = document.createElement('table');
    var header = document.createElement('thead');
    var headerTr = document.createElement('tr');
    headers.forEach(function(h) {
      var th = document.createElement('th');
      th.innerText = h;
      headerTr.appendChild(th);
    });
    header.appendChild(headerTr);
    table.appendChild(header);
    rows.forEach(function(row) {
      var tr = document.createElement('tr');
      row.forEach(function(cell) {
        var td = document.createElement('td');
        td.innerText = cell;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    return table;
  };

  var renderSpinner = function() {
    return '<div class="spinner"><div class="dot1"></div><div class="dot2"></div></div>';
  };

  var mobileNet = null;
  var punchModel = null;

  function punchPredict(img) {
    img = scale(img);
    grayscale(img);
    var result = document.querySelector('#binary-class > .prediction');
    result.innerHTML = renderSpinner();
    Promise.all([
      mobileNet ? Promise.resolve(mobileNet) : mobilenet.load(),
      punchModel ? Promise.resolve(punchModel) : tf.loadModel('/assets/js/tfjs/punch/model.json')
    ]).then(function(models) {
      mobileNet = models[0];
      punchModel = models[1];
      var output = punchModel.predict(mobileNet.infer(img, 'global_average_pooling2d_1')).dataSync();
      var table = renderTable({
        headers: ['Action', 'Probability'],
        rows: [['Punch', parseFloat(output).toFixed(5)]]
      });
      result.innerHTML = '';
      result.appendChild(table);
    });
  }

  var punchKickModel = null;
  function punchKickPredict(img) {
    img = scale(img);
    grayscale(img);
    var result = document.querySelector('#n-ary-class > .prediction');
    result.innerHTML = renderSpinner();
    Promise.all([
      mobileNet ? Promise.resolve(mobileNet) : mobilenet.load(),
      punchKickModel ? Promise.resolve(punchKickModel) : tf.loadModel('/assets/js/tfjs/punch-kick/model.json')
    ]).then(function(models) {
      mobileNet = models[0];
      punchKickModel = models[1];
      var output = Array.from(punchKickModel.predict(mobileNet.infer(img, 'global_average_pooling2d_1')).dataSync());
      var table = renderTable({
        headers: ['Action', 'Probability'],
        rows: [['Punch', parseFloat(output[0]).toFixed(5)], ['Kick', parseFloat(output[1]).toFixed(5)]]
      });
      result.innerHTML = '';
      result.appendChild(table);
    });
  }

  function mobileNetPredict(img) {
    var result = document.querySelector('#mobile-net > .prediction');
    result.innerHTML = renderSpinner();
    (mobileNet ? Promise.resolve(mobileNet) : mobilenet.load()).then(function(model) {
      mobileNet = model;
      mobileNet.classify(img).then(function(predictions) {
        result.innerHTML = '';
        var table = renderTable({
          headers: ['Object', 'Probability'],
          rows: predictions.map(function(p) {
            return [p.className, p.probability.toFixed(5)];
          })
        });
        result.appendChild(table);
      });
    });
  }

  var videoStream = null;
  var camTabs = 0;

  function onTabChange(tab, content) {
    if (tab.innerText !== 'Camera') {
      camTabs--;
      if (videoStream && camTabs === 0) {
        videoStream.getTracks()[0].stop();
        videoStream = null;
      }
      return;
    }
    camTabs++;
    var video = content.querySelector('video');
    var promise = null;
    if (videoStream) {
      promise = Promise.resolve(videoStream);
    } else {
      promise = navigator.mediaDevices.getUserMedia({
        video: true
      });
    }
    return promise.then(function(stream) {
      videoStream = stream;
      video.srcObject = stream;
    });
  }

  function cameraArea(el, onCaption) {
    var capture = false;
    el.querySelector('.btn').addEventListener('click', function() {
      var video = el.querySelector('video');
      if (!capture) {
        if (typeof onCaption === 'function') {
          var canvas = document.createElement('canvas');
          canvas.width = video.clientWidth;
          canvas.height = video.clientHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          onCaption(canvas);
        }
      }
      capture = !capture;
      if (capture) {
        el.querySelector('.fa').classList.remove('fa-camera');
        el.querySelector('.fa').classList.add('fa-trash');
        video.pause();
      } else {
        el.querySelector('.fa').classList.remove('fa-trash');
        el.querySelector('.fa').classList.add('fa-camera');
        video.play();
      }
    });
  }

  tab(document.getElementById('mobile-net-tab'), onTabChange);
  dropArea(document.querySelector('#mobile-net-tab .upload'), mobileNetPredict);
  cameraArea(document.querySelector('#mobile-net-tab .cam'), mobileNetPredict);

  tab(document.getElementById('binary-class-tab'), onTabChange);
  dropArea(document.querySelector('#binary-class-tab .upload'), punchPredict);
  cameraArea(document.querySelector('#binary-class-tab .cam'), punchPredict);

  tab(document.getElementById('n-ary-class-tab'), onTabChange);
  dropArea(document.querySelector('#n-ary-class-tab .upload'), punchKickPredict);
  cameraArea(document.querySelector('#n-ary-class-tab .cam'), punchKickPredict);

  [].slice.call(document.querySelectorAll('.zippy')).forEach(function(z) {
    var title = z.getAttribute('data-title');
    var titleTab = document.createElement('div');
    var img = document.createElement('li');
    img.className = 'fa fa-plus';
    img.style.marginLeft = 0;
    img.style.marginRight = '10px';
    titleTab.appendChild(img);
    titleTab.appendChild(document.createTextNode(title));
    img.parentElement.style.cursor = 'pointer';
    img.parentElement.style.color = '#999';
    img.parentElement.style.paddingTop = '10px';
    img.parentElement.style.paddingBottom = '10px';
    z.parentNode.insertBefore(titleTab, z);
    var visible = false;
    z.style.display = 'none';
    titleTab.addEventListener('click', function() {
      visible = !visible;
      z.style.display = visible ? 'block' : 'none';
      if (visible) {
        img.classList.remove('fa-plus');
        img.classList.add('fa-minus');
      } else {
        img.classList.remove('fa-minus');
        img.classList.add('fa-plus');
      }
    });
  });
})();
