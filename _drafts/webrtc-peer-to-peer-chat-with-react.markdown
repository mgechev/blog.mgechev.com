---
title: WebRTC Peer to Peer chat with React.js
author: Minko Gechev
layout: post
permalink: /2014/09/03/webrtc-peer-to-peer-chat-with-react/
categories:
  - Development
  - JavaScript
  - React
  - WebRTC
  - Architecture
tags:
  - React.js
  - JavaScript
  - WebRTC
  - p2p
  - Peer to Peer
---


# Introduction

In this blog post I'm going to illustrate how could be built WebRTC chat with React.js. Before we continue lets describe briefly what React.js and WebRTC are.

### React.js

React.js is [reactive](https://en.wikipedia.org/wiki/Reactive_programming) JavaScript framework, which helps you to build user interface. Facebook states that we can think of react as the "V" in MVC. React's main aspect is the state. When the state of the application changes this automatically propagates through the application's components. A React component is a self-container module, which is composed by one or more other components. Usually the component depends on state, which is being provided by a parent component. May be the explanation seems quite abstract now but during the tutorial the picture will get much more clear.

### WebRTC

RTC stands for Real-Time Communication. Until browsers implemented WebRTC our only way to provide communication between several browsers was to proxy the messages via a server (using WebSockets or HTTP). WebRTC makes the peer-to-peer communication between browsers possible. Using the NAT traversal framework - ICE we are able find the most appropriate route between the browsers and make them communicate without mediator in the middle. Since 1st of July 2014, v1.0 of the WebRTC browser APIs standard is [already out](http://dev.w3.org/2011/webrtc/editor/webrtc.html) by W3C.

### NAT

Before continue lets say few sentences about what NAT is. NAT stands for Network Address Translation. It is quite common way of translating internal (private) IP addresses into public and vice verse. A lot of ISP providers with limited capacity of public IP addresses uses this way of scaling using private IP addresses in their internal networks and translating them to public addresses visible by the outside world. More about NAT and the different types of NAT could be read in [this wiki article](https://en.wikipedia.org/wiki/Network_address_translation).

Now lets get started with the actual implementation of our WebRTC based chat.

# Architecture

## High-level overview

Since I'm kind of traditionalist I'll start by providing a basic, high-level overview of the architecture of our p2p chat.

![Architecture](/images/architecture.png "Architecture")

The dashed arrows indicate signaling WebSocket connections. As you see each client initiates such connection with the server. With these connections each client aims to register itself to the server and use the server as a proxy during the NAT traversal procedures.

The solid arrow stands for peer-to-peer TCP or UDP (TCP in our case) data channel between the peers. As you see we use full mesh, which scales bad especially when we use video or audio streaming. For the purpose of our chat full mesh is appropriate.


## Lower level overview

In the beginning of the blog post I mentioned that React.js application contains a finite count of React.js components composed together. In this subsection I'll illustrate what are the different components and how are they composed together. The diagram bellow isn't following strictly the UML standard, it only illustrate, as clearly as possible, our micro-architecture.

![Micro-architecture](/images/react-p2p.png "Micro-architecture")

Lets concentrate into the left part of the diagram. As you see we have a set of nested components. The most outer component (the rectangle, which contains all other rectagles), which is not named is the `ChatBox` component. In its left side is positioned the `MessagesList` component, which is a composition of `ChatMessage` components. Each `ChatMessage` component contains a different chat message, which has author, date when published and content. On the right hand side of the `ChatBox` is positioned the `UsersList` component. This component lists all users, which are currently connected to the chat. The last component is the `MessageInput` component. The message input component is a simple text input, which once detects press of the Enter key triggers an event.

The `ChatBox` component uses `ChatProxy`. The chat proxy is responsible for registering the current client to the server and talking with the other peers. For simplicity I've used [Peer.js](http://peerjs.com/), which provides nice high-level API to the browser's WebRTC API.

# Implementation

Now lets start with our implementation.

## Server side

We have a few lines of Node.js which are required for signaling and establishing p2p connection between the peers.

```JavaScript
var PeerServer = require('peer').PeerServer,
    express = require('express'),
    Topics = require('./public/src/Topics.js'),
    app = express(),
    port = process.env.PORT || 3001;

app.use(express.static(__dirname + '/public'));

var expressServer = app.listen(port);
var io = require('socket.io').listen(expressServer);


console.log('Listening on port', port);

var peerServer = new PeerServer({ port: 9000, path: '/chat' });

peerServer.on('connection', function (id) {
  io.emit(Topics.USER_CONNECTED, id);
  console.log('User connected with #', id);
});

peerServer.on('disconnect', function (id) {
  io.emit(Topics.USER_DISCONNECTED, id);
  console.log('User disconnected with #', id);
});
```

We create a simple express server, which servers static files from the directory `/public` in our root. After that we create a `PeerServer`, which on the other hand is responsible for handling the signaling between the different peers. In our case we can think of the `PeerServer` and the protocol, which it implements as alternative of [SIP](https://en.wikipedia.org/wiki/Session_Initiation_Protocol) or [XMPP Jingle](https://en.wikipedia.org/wiki/Jingle_(protocol)).

Once our `PeerServer` detects that a peer has connected to it, it triggers the event `USER_CONNECTED` to all peers. Once a client disconnects to the `PeerServer` we trigger `USER_DISCONNECTED`. These two events are very important for handling the list of currently available users.

The biggest advantage of putting the logic for p2p communication and signaling out of the react components is achieving separation of concerns. This way we have highly coherent components, which are reusable and testable.
