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

This is a tutorial for how to implement a multi-user video conference with [WebRTC](http://webrtc.org), [AngularJS](http://angularjs.org) and [Yeoman](http://yeoman.io/). It also includes a detailed explanation of how WebRTC works, how the peer to peer connections are being established and how the [ICE (Interactive-Connectivity Establishment) framework](https://en.wikipedia.org/wiki/Interactive_Connectivity_Establishment) is used for NAT traversal.

You can find deployed version of the project, we're going to take a look at in this tutorial, at [Heroku](https://mgechev-webrtc.herokuapp.com), the source code can be found [at GitHub](https://github.com/mgechev/angular-webrtc).

Why I chose Yeoman and AngularJS?

Yeoman's generators can handle very quickly all the boilerpates required for the application. Yeoman creates a Grunt build configuration, which allows you to deploy well optimized application with only a few lines of bash:

{% highlight bash %}
grunt build
git remote add heroku git@uri
git push heroku master
{% endhighlight %}


Why AngularJS? Well, AngularJS comes with out-of-the-box router (if you use the module `angular-route`), with well defined components, which enforce the separation of concerns principle and nice data-binding mechanism.

Can I use something else, instead of AngularJS? Yes, sure you can. For such single-page applications, with highly intensive DOM manipulations and limited amount of views (which I call vertical single-page applications), I'd recommend React.js or WebComponents.

![Yeoman and WebRTC](/images/yeoman-angular-webrtc/webrtc-yeoman.png)

## WebRTC intro

In my blog post ["WebRTC chat with React.js"](http://blog.mgechev.com/2014/09/03/webrtc-peer-to-peer-chat-with-react/) I already did a brief introduction about what WebRTC is and how it works:

> RTC stands for Real-Time Communication. Until browsers implemented WebRTC our only way to provide communication between several browsers was to proxy the messages via a server between them (using WebSockets or HTTP). WebRTC makes the peer-to-peer communication between browsers possible. Using the NAT traversal framework - ICE, we are able find the most appropriate route between the browsers and make them communicate without mediator. Since 1st of July 2014, v1.0 of the WebRTC browser APIs standard is [already published](http://dev.w3.org/2011/webrtc/editor/webrtc.html) by W3C.

In the previous article we used Peer.js in order to open data channel between the peers, who participate in the chat room.

This time we'll use the plain browser WebRTC API and I'll explain in a little bit deeper details how a WebRTC session is being established. If you don't aim deep technical understanding you can skip this section and go directly to the server's implementation.

### How WebRTC works?

Now let's take a look at the following UML sequence diagram:

[!["Sequence diagram"](/images/yeoman-angular-webrtc/sequence-webrtc.png "WebRTC Sequence Diagram")](/images/yeoman-angular-webrtc/sequence-webrtc.png)

In the sequence diagram above we're following how `Alice` establishes peer connection with `Bob`, through the application server in the middle (`Web App`).

1. Initially `Alice` calls `Bob`, through the application server (`Web App`), for example by invoking a RESTful method (`POST /call/Bob`).
2. Through a push notification the application server tells `Bob` that `Alice` is calling him. The `Web App` may use WebSockets and send a notification to `Bob` about `Alice`'s call.
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

So why we would need the STUN servers and what actually are they? Before answering these questions lets answer another one "How we can understand whether we're behind a NAT or not?".

Let's suppose we're behind a NAT and we want to reach a remote service. If we make a request to the service and the service response us with the source address of the request we can compare it with the address of our machine. If they differ we're obviously behind a NAT. Note that the service must be located outside of our local network(s).

How we can be sure whether the received address by the service's response is the one of the NAT directly above us? We can't. In case of nested NATs we might be behind a few NATs but basically the NAT traversal procedure of ICE remains the same.

The service, which response us with the address of the source of the request is what STUN does. Now when we have the IP address of the NAT we can use a new ICE candidate called reflexive ICE candidate, with value the IP address and port, which the NAT server used in the network address translation.

## Implementation

As next step lets take a look at our sample application's implementation. The application has two main components:

- back-end - the application server, which is responsible for the communication between the different peers until a p2p connection is established (the `Web App` from the sequence diagram above)
- web app - the AngularJS application, which is the actual multi-user video chat (`Alice` and `Bob` from the sequence diagram above are two different instances of this application)

You can try the application at [Heroku](https://mgechev-webrtc.herokuapp.com).

## Back-end

In this section we will implement our back-end. The back-end is the `Web App` component from the sequence diagram above. Basically it's main functionality is to provide static files (htmls, js, css) and to redirect requests by the peers.

This component will maintain a collection of rooms, to each room we will have associated collection of `socket.io` sockets of the peers connected to the given room.

In order to implement the whole functionality of our WebRTC application with JavaScript we can use Node.js for our back-end.

So let's begin!

{% highlight bash %}
mkdir webrtc-app && cd webrtc-app
# initialize the app
npm init
mkdir lib
touch index.js
{% endhighlight %}

Inside the file called `index.js` in the root add the following content:

{% highlight javascript %}
var config = require('./config/config.json'),
    server = require('./lib/server');

// In case the port is set using an environment variable (Heroku)
config.PORT = process.env.PORT || config.PORT;

server.run(config);
{% endhighlight %}

Inside the root of your app, invoke the following commands, in order to install the required dependencies:

{% highlight bash %}
npm install express --save
npm install socket.io --save
npm install node-uuid --save
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
    uuid = require('node-uuid'),
    rooms = {},
    userIds = {};

expressApp.use(express.static(__dirname + '/../public/dist/'));

exports.run = function (config) {

  server.listen(config.PORT);
  console.log('Listening on', config.PORT);
  socketio.listen(server, { log: false })
  .on('connection', function (socket) {

    var currentRoom, id;

    socket.on('init', function (data, fn) {
      currentRoom = (data || {}).room || uuid.v4();
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
      delete rooms[currentRoom][rooms[currentRoom].indexOf(socket)];
      rooms[currentRoom].forEach(function (socket) {
        if (socket) {
          socket.emit('peer.disconnected', { id: id });
        }
      });
    });
  });
};
{% endhighlight %}

Now let's take a look at the code above step-by-step:

{% highlight javascript %}
var express = require('express'),
    expressApp = express(),
    socketio = require('socket.io'),
    http = require('http'),
    server = http.createServer(expressApp),
    uuid = require('node-uuid'),
    rooms = {},
    userIds = {};

expressApp.use(express.static(__dirname + '/../public/dist/'));
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

We start the HTTP server and attach `socket.io` to it (decorate it with `socket.io`). The `connection` event in `socket.io` means that client has connected to our server. Once we have such connection established we need to attach the corresponding event handlers:

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

These are the three events we're going to handle. The `init` event is used for initialization of given room. If the room is already created we join the current client to the room by adding its socket to the collection of sockets associated to the given room (`rooms[room_id]` is an array of sockets). If the room is not created we create the room and add the current client to it. We generate room randomly using [`node-uuid` module](https://github.com/broofa/node-uuid#getting-started):

{% highlight javascript %}
currentRoom = (data || {}).room || uuid.v4();
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
delete rooms[currentRoom][rooms[currentRoom].indexOf(socket)];
rooms[currentRoom].forEach(function (socket) {
  if (socket) {
    socket.emit('peer.disconnected', { id: id });
  }
});
{% endhighlight %}

Once given peer disconnects from the server (for example the user close his or her browser or refresh the page), we remove its socket from the collection of sockets associated with the given room (the delete operator usage). After that we emit `peer.disconnected` event to all other peers in the room, with the `id` of the disconnected peer. This way all peers connected to the disconnected peer will be able to remove the video element associated with the disconnected client.

The last part of the back-end is the configuration. Inside the root create a directory called config:

{% highlight bash %}
cd .. # if you're inside the lib directory
mkdir config && cd config
{% endhighlight %}

Create a file called `config.json` and set the following content:

{% highlight json %}
{
  "PORT": 5555
}
{% endhighlight %}

## Web client

### Setup

In order to create a new application using AngularJS' Yeoman generator you can follow these steps:

{% highlight bash %}
npm install -g yeoman
npm install -g generator-angular
# if you're inside config
cd ..
mkdir public && cd public
yo angular
{% endhighlight %}

You'll be asked a few questions, answer them as follows:

![Setup](/images/yeoman-angular-webrtc/setup.png "Setup")

Basically, we only need `angular-route` as dependency and since we want our application to look relatively well designed with little amount of effort we require Bootstrap as well.

### Implementation

As first step, we need to handle some browser inconsistencies. Inside `public/app/scripts`, create a file called `adapter.js` and add the following content inside it:

{% highlight javascript %}
window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
window.URL = window.URL || window.mozURL || window.webkitURL;
window.navigator.getUserMedia = window.navigator.getUserMedia || window.navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia;
{% endhighlight %}

Since Firefox and Chrome still support the WebRTC API with `moz` and `webkit` prefixes, we need to take care of it.

Great! So far our future app will work on Chrome and Firefox!

Now lets create a service, called `VideoStream`, which is responsible for providing us a media stream to the other components in the application:

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

`VideoStream` uses `$q` in order to provide a video stream using `getUserMedia`. Once we invoke `getUserMedia` the browser will ask the user for permissions over his/her microphone and web cam:

![](/images/yeoman-angular-webrtc/webcam-permissions.png "Permissions for using the camera and microphone")

After we gain access to the video stream we cache it inside the `stream` variable, in order to not ask the user for web camera permissions each time we want to access it.

#### Application configuration

Now it's time to configure the routes in our application. Edit`public/app/scripts/app.js` and add the following route definition:

{% highlight javascript %}
angular
  .module('publicApp', [
    'ngRoute'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/room/:roomId', {
        templateUrl: 'views/room.html',
        controller: 'RoomCtrl'
      })
      .when('/room', {
        templateUrl: 'views/room.html',
        controller: 'RoomCtrl'
      })
      .otherwise({
        redirectTo: '/room'
      });
  });
{% endhighlight %}

Here we define two routes:

- `/room` - for users accessing the application for first time (without having link to a specific room). They will visit `/room` and after allowing access to their web cam (because of logic inside `RoomCtrl`), they will automatically create a new room and will be redirected to another URL (`/room/:roomId`). Once they are redirected to this URL they can share it with other users they want to talk with.
- `/room/:roomId` - users who have already created room can share their URL with other users, who can join the video call.

Of course, if you guess the URL of another users' session you can join their video call without much effort, for the sake of simplicity we've used this simple (and not secure) mechanism. Be polite and do not violate other users' privacy. :-)

Add this constant definition in the bottom of `app.js`:

{% highlight javascript %}
angular.module('publicApp')
  .constant('config', {
      // Change it for your app URL
      SIGNALIG_SERVER_URL: YOUR_APP_URL
  });
{% endhighlight %}

We will use this constant in order connect `socket.io` client with the server.

#### Io

Now lets create one more service called `Io`.

{% highlight bash %}
yo angular:factory Io
{% endhighlight %}

Inside `/public/app/scripts/services/io.js` set the following content:

{% highlight javascript %}
angular.module('publicApp')
  .factory('Io', function () {
    if (typeof io === 'undefined') {
      throw new Error('Socket.io required');
    }
    return io;
  });
{% endhighlight %}

Basically here we wrap `io` inside a service, in order to allow the users to inject it, instead of using the global `io`. This will allow us to mock `io` easily instead of monkey patching it, when we want to write tests.

#### RoomCtrl

Now lets create a new controller, called `RoomCtrl`:

{% highlight bash %}
yo angular:controller Room
{% endhighlight %}

Edit `/public/app/scripts/controllers/room.js`:

{% highlight javascript %}
angular.module('publicApp')
  .controller('RoomCtrl', function ($sce, VideoStream, $location, $routeParams, $scope, Room) {

    if (!window.RTCPeerConnection || !navigator.getUserMedia) {
      $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
      return;
    }

    var stream;

    VideoStream.get()
    .then(function (s) {
      stream = s;
      Room.init(stream);
      stream = URL.createObjectURL(stream);
      if (!$routeParams.roomId) {
        Room.createRoom()
        .then(function (roomId) {
          $location.path('/room/' + roomId);
        });
      } else {
        Room.joinRoom($routeParams.roomId);
      }
    }, function () {
      $scope.error = 'No audio/video permissions. Please refresh your browser and allow the audio/video capturing.';
    });
    $scope.peers = [];
    Room.on('peer.stream', function (peer) {
      console.log('Client connected, adding new stream');
      $scope.peers.push({
        id: peer.id,
        stream: URL.createObjectURL(peer.stream)
      });
    });
    Room.on('peer.disconnected', function (peer) {
      console.log('Client disconnected, removing stream');
      $scope.peers = $scope.peers.filter(function (p) {
        return p.id !== peer.id;
      });
    });

    $scope.getLocalVideo = function () {
      return $sce.trustAsResourceUrl(stream);
    };
  });
{% endhighlight %}

Now lets look at the code step-by-step:

`RoomCtrl` accepts as dependencies the following components:

- `$sce` - used for setting the source of the video elements
- `VideoStream` - used for getting the video stream from the user's camera
- `$location` - used for redirecting the user to the room's URL
- `$routeParams` - used for getting the room id
- `$scope` - used for attaching data to it in order to achieve data-binding with the view
- `Room` - service which we are going to define next. It is used for managing the peer connections.

{% highlight javascript %}
if (!window.RTCPeerConnection || !navigator.getUserMedia) {
  $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
  return;
}
{% endhighlight %}

In the snippet above we check whether WebRTC is supported. If it isn't we simply set content of the `$scope.error` property and stop the controller execution.

{% highlight javascript %}
var stream;
VideoStream.get()
.then(function (s) {
  stream = s;
  Room.init(stream);
  stream = URL.createObjectURL(stream);
  if (!$routeParams.roomId) {
    Room.createRoom()
    .then(function (roomId) {
      $location.path('/room/' + roomId);
    });
  } else {
    Room.joinRoom($routeParams.roomId);
  }
}, function () {
  $scope.error = 'No audio/video permissions. Please refresh your browser and allow the audio/video capturing.';
});
{% endhighlight %}

`VideoStream.get()` returns a promise, which once resolved gives us the media stream of the user. When the promise is resolved we initialize the `Room` passing the stream as argument. In order to visualize the video captured by our web cam we use `URL.createObjectURL`, to be able to set it as `src` of a video element in our HTML.

As next step we check whether the `roomId` is provided. If it is provided we simply join the room with the associated `roomId`: `Room.joinRoom($routeParams.roomId);`, otherwise we create a new room. Once the room is created we redirect the user to the room's URL.

The rest of the `RoomCtrl` is handling two events:

{% highlight javascript %}
Room.on('peer.stream', function (peer) {
  console.log('Client connected, adding new stream');
  $scope.peers.push({
    id: peer.id,
    stream: URL.createObjectURL(peer.stream)
  });
});
Room.on('peer.disconnected', function (peer) {
  console.log('Client disconnected, removing stream');
  $scope.peers = $scope.peers.filter(function (p) {
    return p.id !== peer.id;
  });
});
{% endhighlight %}

- `peer.stream` - a peer stream is received. Once we receive a new peer stream we add it to the array `$scope.peers`, which is visualized on the page. The markup on the page maps each `stream` to a video element.
- `peer.disconnected` - once a peer disconnects the `peer.disconnected` event is being fired. When we receive this event we can simply remove the disconnected peer from the collection.

#### Room service

The last component from our application is the `Room` service:

{% highlight bash %}
yo angular:factory Room
{% endhighlight %}

Edit the file `/public/app/scripts/services/room.js` and set the following content:

{% highlight javascript %}
angular.module('publicApp')
  .factory('Room', function ($rootScope, $q, Io, config) {

    var iceConfig = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]},
        peerConnections = {},
        currentId, roomId,
        stream;

    function getPeerConnection(id) {
      if (peerConnections[id]) {
        return peerConnections[id];
      }
      var pc = new RTCPeerConnection(iceConfig);
      peerConnections[id] = pc;
      pc.addStream(stream);
      pc.onicecandidate = function (evnt) {
        socket.emit('msg', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
      };
      pc.onaddstream = function (evnt) {
        console.log('Received new stream');
        api.trigger('peer.stream', [{
          id: id,
          stream: evnt.stream
        }]);
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
      };
      return pc;
    }

    function makeOffer(id) {
      var pc = getPeerConnection(id);
      pc.createOffer(function (sdp) {
        pc.setLocalDescription(sdp);
        console.log('Creating an offer for', id);
        socket.emit('msg', { by: currentId, to: id, sdp: sdp, type: 'sdp-offer' });
      }, function (e) {
        console.log(e);
      },
      { mandatory: { OfferToReceiveVideo: true, OfferToReceiveAudio: true }});
    }

    function handleMessage(data) {
      var pc = getPeerConnection(data.by);
      switch (data.type) {
        case 'sdp-offer':
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            console.log('Setting remote description by offer');
            pc.createAnswer(function (sdp) {
              pc.setLocalDescription(sdp);
              socket.emit('msg', { by: currentId, to: data.by, sdp: sdp, type: 'sdp-answer' });
            });
          });
          break;
        case 'sdp-answer':
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            console.log('Setting remote description by answer');
          }, function (e) {
            console.error(e);
          });
          break;
        case 'ice':
          if (data.ice) {
            console.log('Adding ice candidates');
            pc.addIceCandidate(new RTCIceCandidate(data.ice));
          }
          break;
      }
    }

    var socket = Io.connect(config.SIGNALIG_SERVER_URL),
        connected = false;

    function addHandlers(socket) {
      socket.on('peer.connected', function (params) {
        makeOffer(params.id);
      });
      socket.on('peer.disconnected', function (data) {
        api.trigger('peer.disconnected', [data]);
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
      });
      socket.on('msg', function (data) {
        handleMessage(data);
      });
    }

    var api = {
      joinRoom: function (r) {
        if (!connected) {
          socket.emit('init', { room: r }, function (roomid, id) {
            currentId = id;
            roomId = roomid;
          });
          connected = true;
        }
      },
      createRoom: function () {
        var d = $q.defer();
        socket.emit('init', null, function (roomid, id) {
          d.resolve(roomid);
          roomId = roomid;
          currentId = id;
          connected = true;
        });
        return d.promise;
      },
      init: function (s) {
        stream = s;
      }
    };
    EventEmitter.call(api);
    Object.setPrototypeOf(api, EventEmitter.prototype);

    addHandlers(socket);
    return api;
  });
{% endhighlight %}

`Room` accepts the following dependencies:

- `$rootScope` - it is used in order to invoke the `$digest` loop, once `socket.io` event is received. Since the `socket.io` event handlers are not wrapped inside `$scope.$appy` we need to invoke `$digest` manually.
- `$q` - in order to provide promise based interface
- `Io` - the wrapped `socket.io` global function
- `config` - the configuration constant we defined in `app.js`.

`Room` provides the following public API:

{% highlight javascript %}
var api = {
  joinRoom: function (r) {
    if (!connected) {
      socket.emit('init', { room: r }, function (roomid, id) {
        currentId = id;
        roomId = roomid;
      });
      connected = true;
    }
  },
  createRoom: function () {
    var d = $q.defer();
    socket.emit('init', null, function (roomid, id) {
      d.resolve(roomid);
      roomId = roomid;
      currentId = id;
      connected = true;
    });
    return d.promise;
  },
  init: function (s) {
    stream = s;
  }
};
{% endhighlight %}

As described above `joinRoom` is used for joining already existing rooms, `createRoom` is used for creating new rooms and `init` is used for initializing the `Room` service.

The `socket.io` events handled in this service are:

- `peer.connected` - fired when new peer joins the room. Once this event is fired we initiate new SDP offer to this peer
- `peer.disconnected` - fired when peer disconnects
- `msg` - fired when new SDP offer/answer or ICE candidate are received

Lets take a look at how new offer is being initiated, when a peer connects the room:

{% highlight javascript %}
function makeOffer(id) {
  var pc = getPeerConnection(id);
  pc.createOffer(function (sdp) {
    pc.setLocalDescription(sdp);
    console.log('Creating an offer for', id);
    socket.emit('msg', { by: currentId, to: id, sdp: sdp, type: 'sdp-offer' });
  }, function (e) {
    console.log(e);
  },
  { mandatory: { OfferToReceiveVideo: true, OfferToReceiveAudio: true }});
}
{% endhighlight %}

Once new peer joins the room `makeOffer` is invoked with the peer's id. The first thing we do is to `getPeerConnection`. If connection with the specified peer id already exists `getPeerConnection` will return it, otherwise it will create a new `RTCPeerConnection` and attach the required event handlers to it. After we have the peer connection we invoke the `createOffer` method. This method will make a new request to the provided STUN server in the `RTCPeerConnection` configuration and will gather the ICE candidates. Based on the ICE candidates and the supported codecs, etc. it will create a new SDP offer, which we will send to the server. As we saw above the server will redirect the offer to the peer pointed by the property `to` of the event object.

Now lets take a look at the handler of the `msg` message:

{% highlight javascript %}
socket.on('msg', function (data) {
  handleMessage(data);
});
{% endhighlight %}

Here we directly invoke `handleMessage`, so lets trace the function's implementation:

{% highlight javascript %}
function handleMessage(data) {
  var pc = getPeerConnection(data.by);
  switch (data.type) {
    case 'sdp-offer':
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
        console.log('Setting remote description by offer');
        pc.createAnswer(function (sdp) {
          pc.setLocalDescription(sdp);
          socket.emit('msg', { by: currentId, to: data.by, sdp: sdp, type: 'sdp-answer' });
        });
      });
      break;
    case 'sdp-answer':
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
        console.log('Setting remote description by answer');
      }, function (e) {
        console.error(e);
      });
      break;
    case 'ice':
      if (data.ice) {
        console.log('Adding ice candidates');
        pc.addIceCandidate(new RTCIceCandidate(data.ice));
      }
      break;
  }
}
{% endhighlight %}

In the first line we get the peer connection with the peer with id pointed by the `by` property. Once we get the connection we switch through the different message types:

- `sdp-offer` - if we receive this message, this means that we have just connected to the room and the rest of the peers inside this room want to initiate new peer connection with us. In order to answer them with our ICE candidates, video codecs, etc. we create a new answer using `createAnswer` but before that we `setRemoteDescription` (the description of the remote peer). Once we prepare the SDP answer we send it to the appropriate peer via the server.
- `sdp-answer` - if we receive SDP answer by given peer, this means that we have already sent SDN offer to this peer. We set the remote description and we hope that we'll successfully initiate the media connection between us (we hope we're not both behind symmetric NATs).
- `ice` - if in the process of negotiation new ICE candidates are being discovered the `RTCPeerConnection` instance will trigger `onicecandidate` event, which will redirect new `msg` message to the peer with whom we're currently negotiating. We simply add the ICE candidate to the appropriate peer connection using the `addIceCandidate` method.

The last method we're going to take a look at, in this tutorial, is `getPeerConnection`:

{% highlight javascript %}
var peerConnections = {};

function getPeerConnection(id) {
  if (peerConnections[id]) {
    return peerConnections[id];
  }
  var pc = new RTCPeerConnection(iceConfig);
  peerConnections[id] = pc;
  pc.addStream(stream);
  pc.onicecandidate = function (evnt) {
    socket.emit('msg', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
  };
  pc.onaddstream = function (evnt) {
    console.log('Received new stream');
    api.trigger('peer.stream', [{
      id: id,
      stream: evnt.stream
    }]);
    if (!$rootScope.$$digest) {
      $rootScope.$apply();
    }
  };
  return pc;
}
{% endhighlight %}

This method uses `peerConnections` object, which creates a mapping between peer id and `RTCPeerConnection` object. Initially we check whether we have associated peer connection to the given id, if we do we simply return it. If we don't have such peer connection we create a new one, we add the event handlers `onicecandidate` and `onaddstream`, we cache it and we return it.

Once `onaddstream` is triggered, this means that the connection was successfully initiated. We can trigger `peer.stream` event and later visualize it in a video element on the page.

#### videoPlayer

This is the last component in our application. Create it using:

{% highlight bash %}
yo angular:directive videoPlayer
{% endhighlight %}

Inside `public/app/scripts/directives/videoplayer.js` set the following content:

{% highlight javascript %}
angular.module('publicApp')
  .directive('videoPlayer', function ($sce) {
    return {
      template: '<div><video ng-src="{{trustSrc()}}" autoplay></video></div>',
      restrict: 'E',
      replace: true,
      scope: {
        vidSrc: '@'
      },
      link: function (scope) {
        console.log('Initializing video-player');
        scope.trustSrc = function () {
          if (!scope.vidSrc) {
            return undefined;
          }
          return $sce.trustAsResourceUrl(scope.vidSrc);
        };
      }
    };
  });
{% endhighlight %}

## Conclusion

Now lets make a retrospective of the solution provided above.

### Full-mesh limitations

As you can experience from the tutorial's demo, the application works effectively with less than 10 users (or even 5, depending on your network bandwidth capacity and CPU).

This is limitation of the full-mesh topology. When we have session with `n` peers each of these `n` peers should establish `n-1` `RTCPeerConnection` with the other peers in the room. This means that his video stream will be encoded `n-1` times and will be sent `n-1` times through the network. This is very inefficient and is almost impractical in production, when communication between multiple parties is required. Solution for this problem is the usage of WebRTC gateway. There are a few open-source projects which solve this issue:

- [Jitsi Videobridge](https://jitsi.org/Projects/JitsiVideobridge) - Jitsi's team have build a WebRTC compatible video bridge, which uses XMPP Jingle for signaling and Colibri (XMPP extension created by the Jitsi's team) for establishment of connection with the bridge. The bridge provides audio mixing with very high quality and only forwards the video, which makes it very effective when using a cheap hardware with low computational power.
- [licode](http://lynckia.com/licode/) - another open-source project, which provides video and audio mixing and custom JSON based protocol for signaling. The last time I tried to use it, its mixing wasn't with very high quality, in case of background sound the audio connection was almost impossible to use.

### Signaling protocol

In this tutorial we used custom JSON protocol for signaling. Better choice will be to use standardized protocol, such as XMPP Jingle or SIP. This will allow you better flexibility in case you need to integrate your service with other, already existing services.

### More

There are a plenty of other topics we didn't cover but they are unfortunately outside the scope of this tutorial. If you're interested in further reading you can check out the resources bellow or ping me for additional information.

## Resources

- [HTML5 Rocks WebRTC intro](http://www.html5rocks.com/en/tutorials/webrtc/basics/)
- [HTML5 Rocks, WebRTC infrastructure](http://www.html5rocks.com/en/tutorials/webrtc/infrastructure/)
- [HTML5 Rocks, WebRTC data channel](http://www.html5rocks.com/en/tutorials/webrtc/datachannels/)
- [WebRTC.org](http://www.webrtc.org/)
- [WebRTC hacks](https://webrtchacks.com/)


