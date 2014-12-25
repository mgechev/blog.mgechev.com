---
title: Multi-User Video Conference with WebRTC
author: minko_gechev
layout: post
categories:
  - JavaScript
  - WebRTC
  - AngularJS
  - Yeoman
  - Video
  - RTC
  - Networks
  - Programming
tags:
  - JavaScript
  - WebRTC
  - AngularJS
  - Yeoman
  - Video
  - RTC
  - Networks
  - Programming
---

This is a tutorial for how to implement a multi-user video conference with WebRTC, AngularJS and Yeoman. It also includes a detailed explanation of how WebRTC works, how the peer to peer connections are being established and how the [ICE (Interactive-Connectivity Establishment) framework](https://en.wikipedia.org/wiki/Interactive_Connectivity_Establishment) is used for NAT traversal.

You can find deployed version of the project, we're going to take a look at in this tutorial at [Heroku](https://mgechev-webrtc.herokuapp.com), the source code can be found [at GitHub](https://github.com/mgechev/angular-webrtc).

Why I chose Yeoman and AngularJS?

Yeoman's generators can handle very quickly all the boilerpates required for the application. Yeoman creates a Grunt build configuration, which allows you to deploy well optimized application with only a few lines of bash:

{% highlight bash %}
grunt build
git remote add heroku git@uri
git push heroku master
{% endhighlight %}


Why AngularJS? Well, AngularJS comes with out-of-the-box router (if you use the module `angular-route`), with well defined components, which enforce the separation of concerns principle and nice data-binding mechanism.

Can I use something else, instead of AngularJS? Yes, sure you can. For such single-page applications, with highly intensive DOM manipulations and limited amount of views (which I call vertical single-page application), I'd recommend React.js or WebComponents.

## WebRTC intro

In my blog post ["WebRTC chat with React.js"](http://blog.mgechev.com/2014/09/03/webrtc-peer-to-peer-chat-with-react/) I already did a brief introduction about what WebRTC is and how it works:

> RTC stands for Real-Time Communication. Until browsers implemented WebRTC our only way to provide communication between several browsers was to proxy the messages via a server between them (using WebSockets or HTTP). WebRTC makes the peer-to-peer communication between browsers possible. Using the NAT traversal framework - ICE, we are able find the most appropriate route between the browsers and make them communicate without mediator. Since 1st of July 2014, v1.0 of the WebRTC browser APIs standard is [already published](http://dev.w3.org/2011/webrtc/editor/webrtc.html) by W3C.

Now I'll explain in a little bit deeper details how a WebRTC session is being established. If you don't aim deep technical understanding you can skip this section and go directly to the server's implementation.

### How WebRTC works?

Now let's take a look at the following UML sequence diagram:

!["Sequence diagram"](/images/yeoman-angular-webrtc/sequence-webrtc.png "WebRTC Sequence Diagram")

In the sequence diagram above we're following how `Alice` establishes peer connection with `Bob`, through our application server in the middle (`Web App`).

1. Initially `Alice` calls `Bob`, through the application server (`Web App`), for example by invoking a RESTful method (POST /call/`Bob`).
2. Through push notification the application server tells `Bob` that `Alice` is calling him. The `Web App` may use WebSockets and send a notification to `Bob` about `Alice`'s call.
3. `Bob` response to the push notification and states that he wants to talk with `Alice`.
4. The `Web App` redirects `Bob`'s response to `Alice`.
5. Once `Alice` knows that `Bob` accepted her call, she starts the `ICE candidates gathering process`. We'll take a further look at it in the section bellow.
6. Once `Alice` has a set of ICE candidates (we can think of them as pairs - host:port, for example 127.0.0.1:5545, 192.168.0.112:6642, 94.23.24.56:6655, more accurately `a=candidate:1 1 UDP 2130706431 192.168.1.102 1816 typ host`), she prepares a SDP offer, which includes the ICE candidates and some additional information (like supported video/audio codecs, etc.). `Alice` sends this offer to `Bob`, via the `Web App`.
7. The `Web App` redirects `Alice`'s offer to `Bob`.
8. `Bob` gathers his own ICE candidates.
9. `Bob` prepares SDP answer (similar to the SDP offer by `Alice`) and sends it back to `Alice`, via the `Web App` (note that `Alice` and `Bob` still cannot establish p2p connection).
10. `Web App` redirects `Bob`'s response to `Alice`.
11. `Alice` and `Bob` try to establish p2p connection through the ICE candidates they already have. During this phase more ICE candidates may come up.
  - `Alice` and `Bob` make the Cartesian product of the ICE candidates they already have, i.e. `Bob` combines all the candidates he have received by `Alice` with his own candidates, prioritize them and tries to establish connection between them.

If `Alice` and `Bob` are not able to establish p2p connection using the ICE candidates they already have, it is very likely they both to be behind [symmetric NATs](http://think-like-a-computer.com/2011/09/19/symmetric-nat/). In this case, if we have provided a TURN server, the video/audio connection will be relayed through it, otherwise they won't be able to initiate connection between each other.

#### ICE gathering process

When we use the browser's WebRTC API for creating a new `RTCPeerConnection`, we provide a config object. It contains a set of `STUN` and `TURN` servers: `new RTCPeerConnection({ 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]})`.

In order to understand how we use `STUN`, you first have to be aware of why we need it. First, lets take a look at what `NAT` is:

##### NAT

Before we continue with the tutorial, lets say a few words about what NAT is. NAT stands for Network Address Translation. It is quite common way for translating internal (private) IP addresses to public ones and vice verse. A lot of ISP providers with limited capacity of public IP addresses uses this way of scaling using private IP addresses in their internal networks and translating them to public addresses visible to the outside world. More about NAT and the different types of NAT could be read in [this wiki article](https://en.wikipedia.org/wiki/Network_address_translation).

When given host is behind NAT it doesn't has a public IP address. This means that its IP address looks something [like `192.168.0.102`](https://en.wikipedia.org/wiki/Private_network). When given host wants to reach a service, outside the local network, it makes a request through the NAT server. The NAT server "translates" the request by changing the source address to the IP address of the NAT server and redirects the request to the destination. The NAT also creates a mapping in the NAT table, which maps the source address (host name and port) to the translated address (host name of the NAT and port assigned for the given request). Once the NAT receives a response by the remote service it uses the NAT table to find the initial source of the request and redirects the response to it.

##### STUN

So why we would need the STUN servers? Before answering this question lets answer another one "How we can understand whether we're behind a NAT or not?".

Let's suppose we're behind a NAT and we want to reach a remote service. If we make a request to the service and the service response us with the source address of the request we can compare it with the address of our machine. If they differ we're obviously behind a NAT. Note that the service must be located outside of our local network(s).

How we can be sure whether the received address by the service's response is the one of the NAT directly above us? We can't. In case of nested NATs we might be behind a few NATs but basically the NAT traversal procedure of ICE remains the same.

The service, which response us with the address of the source of the request is what STUN does. Now when we have the IP address of the NAT we can use a new ICE candidate called reflexive ICE candidate, with value the IP address and port, which the NAT server used in the network address translation.

## Backend

In this section we will implement our backend. The backend is the `Web App` component from the sequence diagram above. Basically it's main functionality is to provide static files (htmls, js, css) and to redirect requests by the peers.

This component will maintain a collection of rooms, to each room we will have associated collection of `socket.io` sockets of the peers connected to the given room.

In order to implement the whole functionality of our WebRTC application with JavaScript we can use Node.js for our backend.

So let's begin!

{% highlight bash %}
mkdir webrtc-app && cd webrtc-app
npm init # initialize the app
mkdir lib
{% endhighlight %}

Inside file called `index.js` in the root add the following content:

{% highlight javascript %}
var config = require('./config/config.json'),
    server = require('./lib/server');

config.PORT = process.env.PORT || config.PORT;

server.run(config);
{% endhighlight %}

Inside the root of your app, invoke the following commands, in order to install the required dependencies:

{% highlight bash %}
npm install express --save
npm install socket.io --save
{% endhighlight %}

Now go to `lib`:

{% highlight text %}
cd lib
{% endhighlight %}

And create a file called `server.js`. It should has the following content:

{% highlight javascript %}
var express = require('express'),
    expressApp = express(),
    socketio = require('socket.io'),
    http = require('http'),
    server = http.createServer(expressApp),
    rooms = {},
    roomId = 1,
    userIds = {};

expressApp.use(express.static(\_\_dirname + '/../public/dist/'));

exports.run = function (config) {

  server.listen(config.PORT);
  console.log('Listening on', config.PORT);
  socketio.listen(server, { log: false })
  .on('connection', function (socket) {

    var currentRoom, id;

    socket.on('init', function (data, fn) {
      currentRoom = (data || {}).room || roomId++;
      var room = rooms[currentRoom];
      if (!data) {
        rooms[currentRoom] = [socket];
        id = userIds[currentRoom] = 0;
        fn(currentRoom, id);
        console.log('Room created, with #', currentRoom);
      } else {
        if (!room) {
          return;
        }
        userIds[currentRoom] += 1;
        id = userIds[currentRoom];
        fn(currentRoom, id);
        room.forEach(function (s) {
          s.emit('peer.connected', { id: id });
        });
        room[id] = socket;
        console.log('Peer connected to room', currentRoom, 'with #', id);
      }
    });

    socket.on('msg', function (data) {
      var to = parseInt(data.to, 10);
      if (rooms[currentRoom] && rooms[currentRoom][to]) {
        console.log('Redirecting message to', to, 'by', data.by);
        rooms[currentRoom][to].emit('msg', data);
      } else {
        console.warn('Invalid user');
      }
    });

    socket.on('disconnect', function () {
      if (!currentRoom || !rooms[currentRoom]) {
        return;
      }
      rooms[currentRoom] = rooms[currentRoom].filter(function (s) {
        return s !== socket;
      });
      rooms[currentRoom].forEach(function (socket) {
        socket.emit('peer.disconnected', { id: id });
      });
    });
  });
};
{% endhighlight %}

Now let's take a look at its content step-by-step:

{% highlight javascript %}
var express = require('express'),
    expressApp = express(),
    socketio = require('socket.io'),
    http = require('http'),
    server = http.createServer(expressApp),
    rooms = {},
    roomId = 1,
    userIds = {};

expressApp.use(express.static(\_\_dirname + '/../public/dist/'));
{% endhighlight %}

In the snippet above we require all dependencies and configure the created express app to use a directory for providing static files. This directory is located inside a directory called `public`, which is in the root of our app.

{% highlight javascript %}
server.listen(config.PORT);
console.log('Listening on', config.PORT);
socketio.listen(server, { log: false })
.on('connection', function (socket) {

  // Additional logic

});
{% endhighlight %}

We start the HTTP server and attach `socket.io` to it. The `connection` event in `socket.io` means that client has connected to our server. Once we have such connection established we need to attach the corresponding event handlers:

{% highlight javascript %}
var currentRoom, id;

socket.on('init', function (data, fn) {
  // Handle init message
});

socket.on('msg', function (data) {
  // Handle message
});

socket.on('disconnect', function () {
  // Handle disconnect event
});
{% endhighlight %}

These are the three events we're going to handle. The `init` event is used for initialization of given room. If the room is already created we join the current client to the room by adding its socket to the collection of sockets associated to the given room (`rooms[room_id]` is an array of sockets). If the room is not created we create the room and add the current client to it:

{% highlight javascript %}
currentRoom = (data || {}).room || roomId++;
var room = rooms[currentRoom];
if (!data) {
  rooms[currentRoom] = [socket];
  id = userIds[currentRoom] = 0;
  fn(currentRoom, id);
  console.log('Room created, with #', currentRoom);
} else {
  if (!room) {
    return;
  }
  userIds[currentRoom] += 1;
  id = userIds[currentRoom];
  fn(currentRoom, id);
  room.forEach(function (s) {
    s.emit('peer.connected', { id: id });
  });
  room[id] = socket;
  console.log('Peer connected to room', currentRoom, 'with #', id);
}
{% endhighlight %}

One more detail is that when a client connects to given room we notify all other peers associated to the room about the newly connected peer.

We also have a callback (`fn`), which we invoke with the client's ID and the room's id, once the client has successfully connected.

The `msg` event is an `SDP` message or `ICE` candidate, which should be redirected from specific peer to another peer:

{% highlight javascript %}
var to = parseInt(data.to, 10);
if (rooms[currentRoom] && rooms[currentRoom][to]) {
  console.log('Redirecting message to', to, 'by', data.by);
  rooms[currentRoom][to].emit('msg', data);
} else {
  console.warn('Invalid user');
}
{% endhighlight %}

The id of given peer is always an integer so that's why we parse it as first line of the event handler. After that we emit the message to the specified peer in the `to` property of the event data object.

The last event handler (and last part of the server) is the disconnect handler:

{% highlight javascript %}
if (!currentRoom || !rooms[currentRoom]) {
  return;
}
rooms[currentRoom] = rooms[currentRoom].filter(function (s) {
  return s !== socket;
});
rooms[currentRoom].forEach(function (socket) {
  socket.emit('peer.disconnected', { id: id });
});
{% endhighlight %}

Once given peer disconnects from the server (for example the user close his or her browser or refresh it), we remove its socket from the collection of sockets associated for the given room (the `filter` call). After that we emit `peer.disconnected` event to all other peers, with the `id` of the disconnected peer. This way all peers connected to the disconnected peer will be able to remove the video element associated with the disconnected client.

## Web client

### Setup

In order to create a new application using AngularJS' Yeoman generator you can follow these steps:

{% highlight bash %}
npm install -g yeoman
npm install -g generator-angular
cd .. # if you're inside the lib directory
mkdir public && cd public
yo angular
{% endhighlight %}

You'll be asked a few questions, answer them as follows:

![Setup](/images/yeoman-angular-webrtc/setup.png "Setup")

Basically, we only need `angular-route` as dependency and since we want our application to look relatively well with little amount of effort we require Bootstrap as well.

### Implementation

As first step, we need to handle some browser inconsistencies. Inside `public/app/scripts`, create a file called `adapter.js` and add the following content:

{% highlight javascript %}
window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
window.URL = window.URL || window.mozURL || window.webkitURL;
window.navigator.getUserMedia = window.navigator.getUserMedia || window.navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia;
{% endhighlight %}

Since Firefox and Chrome still support the WebRTC API with `moz` and `webkit` prefixes, we need to handle these inconsistencies.

Now lets create a service, called `VideoStream`, which is responsible for providing us a media stream:

{% highlight bash %}
yo angular:factory VideoStream
{% endhighlight %}

And lets edit its content:

{% highlight javascript %}
angular.module('publicApp')
  .factory('VideoStream', function ($q) {
    var stream;
    return {
      get: function () {
        if (stream) {
          return $q.when(stream);
        } else {
          var d = $q.defer();
          navigator.getUserMedia({
            video: true,
            audio: true
          }, function (s) {
            stream = s;
            d.resolve(stream);
          }, function (e) {
            d.reject(e);
          });
          return d.promise;
        }
      }
    };
  });
{% endhighlight %}

Our service uses `$q` in order to provide a video stream using `getUserMedia`. Once we invoke `getUserMedia` the browser will ask the user for permissions over his/her microphone and web cam:

![](/images/yeoman-angular-webrtc/webcam-permissions.png)

After we gain access to the video stream we cache it inside the `stream` variable, in order to not ask the user for web camera permissions each time we want to access it.

Now lets create a new controller, called `RoomCtrl`:

{% highlight bash %}
yo angular:controller Room
{% endhighlight %}



{% highlight text %}
├── LICENSE
├── Procfile
├── README.md
├── config
│   └── config.json
├── index.js
├── lib
│   └── server.js
├── package.json
└── public
{% endhighlight %}

Inside `index.js` in the root add:

