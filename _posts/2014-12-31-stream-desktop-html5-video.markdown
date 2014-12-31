---
title: Stream your Desktop to HTML5 Video Element
author: minko_gechev
layout: post
categories:
  - HTML5
  - VLC
  - Desktop Streaming
tags:
  - HTML5
  - VLC
  - Desktop
---

In this blog post I'll share how you can stream your desktop to HTML5 video element.

All you need is VLC video player and web browser, which supports HTML5.

## How to...

Open VLC and select *"Open Capture Device"*:

![](/images/desktop-stream-html5-video/capture-vlc.png "")


As next step chose *"Capture"* and from the drop down bellow select *"Screen"*. Adjust the frame rate and mark the checkbox *"Streaming/Saving:"*

![](/images/desktop-stream-html5-video/capture-cnfig-vlc.png "")


Click settings and select that you want to *"Stream"* the video (from the radio buttons), after that for stream type select *"HTTP"* and for *"Encapsulation Method"* *"OGG"*. Fill the address to be: *"127.0.0.1"* and from the *"Transcoding options"* chose *"Video"* and select *"theo"*. Select appropriate bitrate and scale:

![](/images/desktop-stream-html5-video/capture-stream-vlc.png "")

The last step is to write some markup...:

{% highlight html %}
<video width="700" src="http://127.0.0.1:1234" autoplay type="video/ogg; codecs=theora"></video>
{% endhighlight %}

Here is how my result looks like in JSBin:

![](/images/desktop-stream-html5-video/result.png "")

## Under the hood...

Coming soon :-).
