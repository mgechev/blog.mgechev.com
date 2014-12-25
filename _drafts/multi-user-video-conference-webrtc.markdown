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

This blog post is a tutorial for how to implement a multi-user video conference with WebRTC, AngularJS and Yeoman. It also includes a detailed explanation of how WebRTC works, how the peer to peer connections are being established and how ICE is used for NAT traversal.
Why I chose Yeoman and AngularJS?

Yeoman's generators can handle very quickly all the boilerpates required for the application. Yeoman creates a Gruntjs build configuration, which allows you to deploy well optimized application with only a few lines of bash:

{% highlight bash %}
grunt build
git remote add heroku git@uri
git push heroku master
{% endhighlight %}


Why AngularJS? Well, AngularJS comes with out-of-the-box router (if you use the module `angular-route`), with well defined components, which enforce the separation of concerns principle and nice data-binding mechanism.

Can I use something else, instead of AngularJS? Yes, sure you can. For such single-page applications with highly intensive DOM manipulations and limited amount of views (which I call vertical single-page application), I'd recommend React.js or WebComponents.

## WebRTC intro

In my blog post ["WebRTC chat with React.js"](http://blog.mgechev.com/2014/09/03/webrtc-peer-to-peer-chat-with-react/) I already did a brief introduction about what WebRTC is and how it works:

> RTC stands for Real-Time Communication. Until browsers implemented WebRTC our only way to provide communication between several browsers was to proxy the messages via a server between them (using WebSockets or HTTP). WebRTC makes the peer-to-peer communication between browsers possible. Using the NAT traversal framework - ICE, we are able find the most appropriate route between the browsers and make them communicate without mediator. Since 1st of July 2014, v1.0 of the WebRTC browser APIs standard is [already published](http://dev.w3.org/2011/webrtc/editor/webrtc.html) by W3C.

Now I'll explain in a little bit deeper details how a WebRTC session is being established. If you're not interested into deep technical details you can skip this section and go directly to the server's implementation.

### How WebRTC works?

Now let's take a look at the following diagram:

!["Sequence diagram"](/images/yeoman-angular-webrtc/sequence-webrtc.png "WebRTC Sequence Diagram")

In the sequence diagram above we're following how Alice establishes peer connection with Bob, through our application server in the middle (Web App).

1. Initially Alice calls Bob, through the application server (Web App), for example by invoking a RESTful method (POST /call/bob).
2. Through push notification the application server tells Bob that Alice is calling him. The Web App may use WebSockets and send a notification to Bob about Alice's call.
3. Bob response to the push notification and states that he wants to talk with Alice.
4. The Web App redirects Bob's response to Alice.
5. Once Alice knows that Bob accepted her call, she starts the `ICE candidates gathering process`. We'll take a look at it further in the section bellow.
6. Once Alice has a set of ICE candidates (we can think of them as pairs - host:port, for example 127.0.0.1:5545, 192.168.0.112:6642, 94.23.24.56:6655, more accurately `a=candidate:1 1 UDP 2130706431 192.168.1.102 1816 typ host`), she prepares a SDP offer, which includes the ICE candidates and some additional information (like supported video/audio codecs, etc.). Alice sends this offer to Bob, via the Web App.
7. The Web App redirects Alice's offer to Bob.
8. Bob gathers his own ICE candidates.
9. Bob prepares SDP answer (similar to the SDP offer of Alice) and sends it back to Alice, via the Web App (note that Alice and Bob still cannot establish p2p connection).
10. Web App redirects Bob's response to Alice.
11. Alice and Bob try to establish p2p connection through the ICE candidates they already have. During this phase more ICE candidates may come up.

If Alice and Bob are not able to establish p2p connection using the ICE candidates they already have it is very likely they both to be behind [symmetric NATs](http://think-like-a-computer.com/2011/09/19/symmetric-nat/). In this case, if we have provided a TURN server, the video/audio connection will be relayed through it, otherwise they won't be able to initiate connection between each other.

#### ICE gathering process

When we use the browser's WebRTC API for creating a new `RTCPeerConnection`, we provide a config object. It contains a set of `STUN` and `TURN` servers: `new RTCPeerConnection({ 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]})`.

In order to understand how we use `STUN`, you first have to be aware of why we need it. Let's take a look at what `NAT` is:

##### NAT

Before we continue with the tutorial, lets say a few words about what NAT is. NAT stands for Network Address Translation. It is quite common way for translating internal (private) IP addresses to public ones and vice verse. A lot of ISP providers with limited capacity of public IP addresses uses this way of scaling using private IP addresses in their internal networks and translating them to public addresses visible to the outside world. More about NAT and the different types of NAT could be read in [this wiki article](https://en.wikipedia.org/wiki/Network_address_translation).

When given host is behind NAT it doesn't has a public IP address. This means that it's IP address looks something like `192.168.0.102`. When the host wants to reach service, outside the local network, it makes a request through the NAT server. The NAT server "translates" the request by changing the source address to the IP address of the NAT server and redirects the request to the destination. The NAT also creates a mapping in the NAT table, which maps the source address (host name and port) to the translated address (host name of the NAT and port assigned for the given request). Once the NAT receives a response by the remote service it uses the NAT table to find the initial source of the request and redirects the response to it.

##### STUN

So why we would need the STUN servers? Before answering this question lets answer another one "How we can understand whether we're behind a NAT?".

Let's suppose we're behind a NAT and we want to reach a remote service. If we make a request to the service and the service response us with the source address of the request we can compare it with the address of our machine. If they differ we're obviously behind a NAT. Note that the service must be located outside of our local network.

How we can be sure whether the received address by the service's response is the one of the NAT directly above us? We can't. In case of nested NATs we might be behind a few NATs but basically the NAT traversal procedure of ICE remains the same.

The service, which response us with the address of the source is what STUN does.

## Backend

## Setup

In order to create a new application using AngularJS' Yeoman generator you can follow these steps:

{% highlight bash %}
npm install -g yeoman
npm install -g generator-angular
mkdir webrtc-app && cd webrtc-app
mkdir public && cd public
yo angular
{% endhighlight %}

You'll be asked a few questions, answer them as follow:

![Setup](/images/yeoman-angular-webrtc/setup.png "Setup")

Basically, we only need `angular-route` as dependency and since we want our application to look relatively well with little amount of effort we require Bootstrap as well.
