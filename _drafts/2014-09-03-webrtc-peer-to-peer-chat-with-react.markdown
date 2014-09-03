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

In the beginning of the blog post I mentioned that React.js application contains a finite count of React.js components composed together. In this subsection I'll illustrate what are the different components and how are they composed together. The diagram bellow isn't following strictly the UML standard, it only tries to illustrate as clearly as possible our micro-architecture.

![Micro-architecture](/images/react-p2p.png "Micro-architecture")

