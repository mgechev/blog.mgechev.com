---
title: VNC client on 200 lines of JavaScript
author: minko_gechev
layout: post
permalink: /2013/08/30/vnc-javascript-nodejs/
categories:
  - Browsers
  - Canvas
  - Computer science
  - CSS3
  - Development
  - HTML5
  - Immediately Invoked Function Expression
  - JavaScript
  - Node.js
  - OpenSource
  - Programming
  - VNC
tags:
  - Computer science
  - Development
  - HTML5
  - HTTP
  - JavaScript
  - Node.js
  - OpenSource
  - vnc
---

In this quick blog post I&#8217;ll show you how to create a simple VNC client in about 200 lines of JavaScript.  
For our goal we&#8217;re going to use only HTML5 and JavaScript (client and server side).  
The end result will be something like this:

[<img src="http://blog.mgechev.com/wp-content/uploads/2013/08/js-vnc-1024x946.png" alt="js-vnc" width="600" height="554" class="alignnone size-large wp-image-500" />][1]

So, let&#8217;s begin!

Our application will have very simple architecture &#8211; a proxy server written in Node.js and a client in HTML5 and JavaScript. The Node.js server will stay between the browser and the VNC server. We need it because the client-side JavaScript does not supports TCP sockets so we can&#8217;t connect directly to the VNC server. The HTML5 client will have a canvas on which we will draw the frames we receive from the server.  
For VNC server you can use the free version of [RealVNC][2].

First lets start with the server. Make sure you have node.js installed. We will use four node modules: [rfb2][3], [connect][4], [socket.io][5] and [node-png][6].

Enter the following commands in your terminal:

<pre lang="bash">cd ~
mkdir js-vnc
cd js-vnc
npm init</pre>

Now you should have folder called &#8220;js-vnc&#8221; with file named &#8220;package.json&#8221; in it.  
Use the following lines of code to install almost all the dependencies:

<pre lang="bash">npm install rfb2 -save
npm install connect --save
npm install socket.io --save</pre>

Unfortunately node-png is not in the npm registry and we have to build it from source.  
Use:

<pre lang="bash">sudo npm install -g node-gyp
cd node_modules
git clone git@github.com:pkrumins/node-png.git
cd node-png
node-gyp configure build</pre>

and that was all&#8230;Now we can start creating our server.  
Let&#8217;s include all the required modules and initialize an array which will contains all the connected clients. Create a file called &#8220;server.js&#8221; in your project base directory and add the following content in it:

<pre lang="javascript">var rfb = require('rfb2'),
    socketio = require('socket.io').listen(8091, { log: false }),
    Png = require('./node_modules/node-png/build/Release/png').Png,
    connect = require('connect'),
    clients = [];</pre>

and now let&#8217;s create a static directory for our static resources:

<pre lang="bash">mkdir static</pre>

now we can set the static directory of the connect server:

<pre lang="bash">//creating new HTTP server. It will serve static files from the directory "./static" and will listen on 8090 port
connect.createServer(connect.static('./static')).listen(8090);</pre>

Now you can execute the following lines of code:

<pre lang="bash">echo "Hello, world!" > ./static/index.html
node server.js
</pre>

Now open: <http://localhost:8091/index.html>. If everything went well you should see the text: &#8220;Hello, world!&#8221;.

So far, so good! Now lets create a socket.io server.  
We want the client to connect to our proxy server and exchange data through socket.io with it. When the client is connected (i.e. the connection is established) it sends &#8220;init&#8221; message which contains the data required for the proxy server to connect to the VNC server &#8211; host, port and password.  
So let&#8217;s handle these events:

<pre lang="javascript">socketio.sockets.on('connection', function (socket) {
  socket.on('init', function (config) {
    var r = createRfbConnection(config, socket);
    socket.on('mouse', function (evnt) {
      r.pointerEvent(evnt.x, evnt.y, evnt.button);
    });
    socket.on('keyboard', function (evnt) {
      r.keyEvent(evnt.keyCode, evnt.isDown);
    });
    socket.on('disconnect', function () {
      disconnectClient(socket);
    });
  });
});
</pre>

We already listen for incoming connections with socket.io on port 8091 so now we just subscribe to the &#8220;connection&#8221; event. When the client connects to our socket.io server we subscribe the server to the &#8220;init&#8221; event. It&#8217;s the message I told about earlier. Its parameters will contains data required for the proxy server to connect to the VNC server. In the callback associated with the &#8220;init&#8221; event we first create new RFB (remote framebuffer) connection. This method will return a RFB handler, we can use it to exchange data with the VNC server. After initialising the RFB connection we subscribe to three more events: &#8220;mouse&#8221;, &#8220;keyboard&#8221; and &#8220;disconnect&#8221;. The mouse event has parameter containing the position of the cursor and button state (1 for mouse down 0 for mouse up). For this demo we will support only the first mouse button. The keyboard event accepts as parameters the key code of the button which have triggered the event and flag which indicates whether the button is down or up. When the disconnect event happens we disconnect from the VNC server and release all the data for the current connection.

Here is posted the function createRfbConnection:

<pre lang="javascript">function createRfbConnection(config, socket) {
  var r = rfb.createConnection({
    host: config.host,
    port: config.port,
    password: config.password
  });
  addEventHandlers(r, socket);
  return r;
}
</pre>

In the method &#8220;addEventHandlers&#8221; we add event handlers to the RFB handler we received from the &#8220;createConnection&#8221; method:

<pre lang="javascript">function addEventHandlers(r, socket) {
  r.on('connect', function () {
    socket.emit('init', {
      width: r.width,
      height: r.height
    });
    clients.push({
      socket: socket,
      rfb: r
    });
  });
  r.on('rect', function (rect) {
    handleFrame(socket, rect, r);
  });
}
</pre>

When the RFB connection is established we send &#8220;init&#8221; event to the client (our browser) with the size of the screen. For simplicity we won&#8217;t scale the screen in the browser.  
After sending the &#8220;init&#8221; event to the browser we add the client to our connected clients and subscribe to the event &#8220;rect&#8221;. The &#8220;rect&#8221; event will trigger when there is a screen update. For extra simplicity we will use raw encoding.

The last method from our Node.js proxy we will look at is the &#8220;handleFrame&#8221; method.

<pre lang="javascript">function handleFrame(socket, rect, r) {
  var rgb = new Buffer(rect.width * rect.height * 3, 'binary'),
    offset = 0;

  for (var i = 0; i &lt; rect.data.length; i += 4) {
    rgb[offset++] = rect.data[i + 2];
    rgb[offset++] = rect.data[i + 1];
    rgb[offset++] = rect.data[i];
  }

  var image = new Png(rgb, r.width, r.height, 'rgb');
  image = image.encodeSync();
  socket.emit('frame', {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    image: image.toString('base64')
  });
}
</pre>

We create new binary buffer with size "rect.width \* rect.height \* 3" and process the received pixmap. After that we create new PNG image from it by specifying its width, height and format (rgb). We encode the image and emit the event "frame" with parameters the coordinates of the image, its size and the actual image in base64 format.

And we're done with our server! There's one detail which I missed with purpose. In this version we don't use all the advantages of the RFB protocol. It has incremental frame transmitting which I've omitted. RFB implementation with excluded incremental transmission can be downloaded from [here][7].

And now our simple client!

Edit the content of the file ./static/index.html with the following content:

<pre lang="html">&lt;!DOCTYPE html&gt;
&lt;html&gt;
    &lt;head&gt;
        &lt;link rel="stylesheet" href="./css/bootstrap.min.css" /&gt;
        &lt;link rel="stylesheet" href="./css/styles.css" /&gt;
    &lt;/head&gt;
    &lt;body&gt;
        &lt;div class="form-wrapper" id="form-wrapper"&gt;
            &lt;form class="form-horizontal" onsubmit="return false"&gt;
              &lt;div class="control-group"&gt;
                &lt;label class="control-label" for="host"&gt;Host:&lt;/label&gt;
                &lt;div class="controls"&gt;
                  &lt;input type="text" id="host" name="host" value="192.168.100.6" /&gt;&lt;br /&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;div class="control-group"&gt;
                &lt;label class="control-label" for="port"&gt;Port:&lt;/label&gt;
                &lt;div class="controls"&gt;
                  &lt;input type="text" id="port" name="port" value="5900" /&gt;&lt;br /&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;div class="control-group"&gt;
                &lt;label class="control-label" for="port"&gt;Port:&lt;/label&gt;
                &lt;div class="controls"&gt;
                  &lt;input type="password" id="password" name="password" value="paralaks" /&gt;&lt;br /&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;div class="control-group"&gt;
                &lt;div class="controls"&gt;
                  &lt;button class="btn" id="loginBtn"&gt;Log in&lt;/button&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/form&gt;
        &lt;/div&gt;
        &lt;canvas id="screen"&gt;
        &lt;/canvas&gt;
        &lt;script src="http://localhost:8091/socket.io/socket.io.js"&gt;&lt;/script&gt;
        &lt;script src="./js/client.js"&gt;&lt;/script&gt;
    &lt;/body&gt;
&lt;/html&gt;
</pre>

We've added simple bootstrap form and a canvas. Now create sub-directory of our project base directory: "./static/js" and create the file "client.js" in it.

We will wrap the whole code in an IIFE to omit any globals. Let's create a simple object which will hold our settings:

<pre lang="javascript">(function () {
  var Config = {
    URL: 'http://localhost:8091'
  };
  //..more code here
}());
</pre>

Now lets add some code for initialisation after the "Config" declaration:

<pre lang="javascript">document.getElementById('loginBtn').addEventListener('click', function () {
    var screen = new Screen(document.getElementById('screen')),
      client = new Client(screen);

    client.connect({
      host: document.getElementById('host').value,
      port: parseInt(document.getElementById('port').value, 10),
      password: document.getElementById('password').value,
      callback: function () {
        document.getElementById('form-wrapper').classList.add('form-wrapper-hidden');
      }
    });
  }, false);
</pre>

We simply add event handler on click of the button with id "loginBtn". In the callback we initialise new "Screen" object with our canvas as argument of the constructor function and create new "Client" with the Screen object as parameter. We call the connect method of the client with the specified parameters - host, port, password and a callback which will be invoked when the client is being connected.

This is the definition of the connect method:

<pre lang="javascript">Client.prototype.connect = function (config) {
    var self = this;
    this._socket = io.connect(Config.URL);
    this._socket.emit('init', {
      host: config.host,
      port: config.port,
      password: config.password
    });
    this._addHandlers(config.callback);
    this._initEventListeners();
  };
</pre>

It creates new socket.io connection with the server's socket.io server host name and port and emits the "init" event we already talked about (contains data required for connection to the VNC server). After that we add handlers which will listen for events coming from the server - the "init" and "rect" event. Since the "rect" event is a bit more interesting we will look in its handling:

<pre lang="javascript">this._socket.on('frame', function (frame) {
    that._screen.drawRect(frame);
  });
</pre>

As you see we simply delegate the drawing to the screen and pass it the frame as argument.  
And here is the actual drawing on the canvas:

<pre lang="javascript">Screen.prototype.drawRect = function (rect) {
    var img = new Image(),
      that = this;
    img.width = rect.width;
    img.height = rect.height;
    img.src = 'data:image/png;base64,' + rect.image;
    img.onload = function () {
      that._context.drawImage(this, rect.x, rect.y, rect.width, rect.height);
    };
  };
</pre>

We create new image with the frame's width and height as dimensions and we set image's src to be equal to the frame's base64 image. After that, when the image is loaded we draw it onto the canvas.

The last interesting moment is the handling of the mouse and keyboard events.  
Of course we delegate it to the screen object:

<pre lang="javascript">Client.prototype._initEventListeners = function () {
    var self = this;
    this._screen.addMouseHandler(function (x, y, button) {
      self._socket.emit('mouse', {
        x: x,
        y: y,
        button: button
      });
    });
    this._screen.addKeyboardHandlers(function (code, isDown) {
      self._socket.emit('keyboard', {
        keyCode: code,
        isDown: isDown
      });
    });
  };
</pre>

As you see we add the mouse and keyboard event handlers and in the event callbacks we simply emit new socket.io events, respectively: "mouse" and "keyboard", with their arguments. For simplicity our canvas is absolutely positioned and has coordinates (0, 0).

And...well...thats all! We have ready to go VNC client in just few lines of JavaScript!  
  
<span style="font-size: 1.2em;">The <strong><a href="https://github.com/mgechev/js-vnc-demo-project">source code</a></strong> from this article can be found in my <a href="https://github.com/mgechev/js-vnc-demo-project">GitHub account</a></span>.  
  
Quick video demo

 [1]: http://blog.mgechev.com/wp-content/uploads/2013/08/js-vnc.png
 [2]: http://www.realvnc.com/
 [3]: https://github.com/sidorares/node-rfb2
 [4]: https://npmjs.org/package/connect
 [5]: http://socket.io/
 [6]: https://github.com/pkrumins/node-png
 [7]: https://github.com/mgechev/node-rfb2