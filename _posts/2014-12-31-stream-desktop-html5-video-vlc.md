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

!["VLC option"](/images/desktop-stream-html5-video/capture-vlc.png)


As next step chose *"Capture"* and from the drop down below select *"Screen"*. Adjust the frame rate and mark the checkbox *"Streaming/Saving:"*

!["VLC capture config"](/images/desktop-stream-html5-video/capture-config-vlc.png)


Click settings and select that you want to *"Stream"* the video (from the radio buttons), after that for stream type select *"HTTP"* and for *"Encapsulation Method"* *"OGG"*. Fill the address to be: *"127.0.0.1"* and from the *"Transcoding options"* chose *"Video"* and select *"theo"*. Select appropriate bitrate and scale:

!["VLC stream config"](/images/desktop-stream-html5-video/capture-stream-vlc.png)

The last step is to write some markup...:

{% highlight html %}
<video width="700" src="http://127.0.0.1:1234" autoplay type="video/ogg; codecs=theora"></video>
{% endhighlight %}

Here is how my result looks like in JSBin:

[!["Result"](/images/desktop-stream-html5-video/result.png)](/images/desktop-stream-html5-video/result.png)

## Under the hood...

As you saw from the tutorial, it is very easy to create HTTP VLC video stream through HTML5 video tag but what exactly happens under the hood?

Initially VLC starts [HLS](https://en.wikipedia.org/wiki/HTTP_Live_Streaming) (HTTP Live Streaming) server. We can connect to this server by specifying the `src` attribute of the video element.

Once the streaming server is started, VLC can start the screen capturing. Basically, for the screen capturing VLC creates screen shots (each `x` ms) and encodes them with the specified video codec. The way VLC implements the screen capturing is a platform specific thing, for example you can take a look at the source code for Mac OS X [here](https://github.com/videolan/vlc/blob/d36bc0a71a7a69afd085c8b2754ecfbc5876fd2b/modules/access/screen/mac.c#L147-L236).

Once the video is encoded it can be sent though the HLS stream.
