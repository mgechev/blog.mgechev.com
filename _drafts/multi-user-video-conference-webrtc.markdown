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
