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

