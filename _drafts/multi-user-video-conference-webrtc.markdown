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

This blog post is a tutorial for how to implement a multi-user video conference with WebRTC, AngularJS and Yeoman.
Why I chose Yeoman and AngularJS?

Yeoman's generators very quickly handled all the boilerpates required for my application. Yeoman created a Gruntjs build configuration, which allowed me to deploy well optimized app on heroku with only a few lines of code:

{% highlight bash %}
grunt build
git remote add heroku git@uri
git push heroku master
{% endhighlight %}


Why AngularJS? Well, AngularJS comes with out-of-the-box router, if you use the dependency `angular-route`, with well defined components, which enforce the separation of concerns principle and nice data-binding.

Can I use something else, instead of AngularJS? Yes, sure you can. For such single-page applications with highly intensive DOM manipulations and limited amount of views (which I call vertical), I'd recommend React.js or WebComponents, but in this case I simply used the `generator-angular`.

## WebRTC intro

In my blog post ["WebRTC chat with React.js"](http://blog.mgechev.com/2014/09/03/webrtc-peer-to-peer-chat-with-react/) I already did a brief introduction about what WebRTC is and how it works:

> RTC stands for Real-Time Communication. Until browsers implemented WebRTC our only way to provide communication between several browsers was to proxy the messages via a server between them (using WebSockets or HTTP). WebRTC makes the peer-to-peer communication between browsers possible. Using the NAT traversal framework - ICE, we are able find the most appropriate route between the browsers and make them communicate without mediator. Since 1st of July 2014, v1.0 of the WebRTC browser APIs standard is [already published](http://dev.w3.org/2011/webrtc/editor/webrtc.html) by W3C.

Let me explain in a little bit deeper details how a session is being established between two peers using WebRTC. If you're not interested into deep technical details you can skip this section and go to the server's implementation, directly.

### How WebRTC works?

Now let's take a look at the following diagram:

!["Sequence diagram"](/images/yeoman-angular-webrtc/sequence-webrtc.png "WebRTC Sequence Diagram")

In the sequence diagram above we're following how Alice establishes peer connection with Bob, through our application server in the middle.

1. Initially Alice calls Bob, through the application server (Web App), for example by invoking a RESTful method (POST /call/bob).
2. Through push notification the application server tells Bob that Alice is calling him. The Web App may use WebSockets here and send a notification to Bob about Alice's call.
3. Bob response to the push notification and states that he wants to talk with Alice.
4. The Web App redirects Bob's response to Alice.
5. Once Alice knows that Bob accepted her call, she starts the `ICE candidates gathering process`. We'll take a look at it further in the section bellow.
6. Once Alice has a set of ICE candidates (we can think of them as pairs - host:port, for example 127.0.0.1:5545, 192.168.0.112:6642, 94.23.24.56:6655), she prepares a SDP offer, which includes the ICE candidates and some additional information (like supported video/audio codecs, etc.). Alice sends this offer to Bob, via the Web App.
7. The Web App redirects Alice's offer to Bob.
8. Bob gathers his own ICE candidates.
9. Bob prepares SDP answer (similar to the SDP offer of Alice) and sends it to Alice, via the Web App (note that Alice and Bob still cannot establish p2p data channel).
10. Web App redirects Bob's response to Alice.
11. Alice and Bob try to establish p2p connection through the ICE candidates they already have. During this phase more ICE candidates may come up.

If Alice and Bob are not able to establish p2p connection using the ICE candidates they already have it is very likely they both to be behind [symmetric NATs](http://think-like-a-computer.com/2011/09/19/symmetric-nat/). In this case, if we have provided a TURN server, the video/audio connection will be relayed through it, otherwise they won't be able to initiate connection between each other.

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
