---
title: Sound notification in web page
author: minko_gechev
layout: post
permalink: /2011/11/01/cross-browser-sound-notifications/
categories:
  - Any
  - Browsers
  - Development
  - HTML5
  - Internet
  - JavaScript
  - Programming
tags:
  - Development
  - Internet
  - JavaScript
  - Programming
---
Few days ago I was creating a system in which it was necessary to implement a sound notification feature. Well it&#8217;s not very hard task but of course you have to be careful with the browser compatibility. At first my source was something like that:

{% highlight JavaScript %}playSound: function () {
	this.config.soundNotify.html('&lt;embed src="' + this.config.soundFile + '.wav" hidden=true autostart=true loop=false>');
}
{% endhighlight %}

Actually in my Linux it was working pretty well (I tried it mainly in Chrome).  
After that I decided to try it in a different environment (OS, browser&#8230;). Well I started the app in Google Chrome installed on Windows 7. It was working again :). After that&#8230;IE&#8230;and yes it wasn&#8217;t working (the browser asked me to start an add-on but this stinks&#8230;). Well IE has a tag for background sound. So I added:

{% highlight HTML %}&lt;bgsound id="sound">
{% endhighlight %}

In the JS I&#8217;ve added:

{% highlight JavaScript %}if ($.browser.msie) {
	document.all.sound.src = this.config.soundFile + '.wav';
}
{% endhighlight %}

I tried the script in Firefox&#8230;It asked me if I want to install Quick time plugin&#8230;I refused and there wasn&#8217;t any sound. Great, isn&#8217;t it? I tried it in Safari&#8230;no sound&#8230;  
As you know in HTML5 you have an audio tag. If you use new browser you can use this tag and I think that it&#8217;s the best way for sound notification here is it:

{% highlight JavaScript %}if (this.config.audioSupported) {
	var soundElement = '&lt;audio style="display:none; width: 0px; height: 0px;" id="audioNotifier" src="' + this.config.soundFile + '.wav" controls preload="auto" autobuffer>&lt;/audio>';
	this.config.soundNotify.html(soundElement);
	$('#audioNotifier')[0].play();
}
{% endhighlight %}

The audioSupported property is the result of the:

{% highlight JavaScript %}!!document.createElement('audio').canPlayType;
{% endhighlight %}

But if the browser is too old it don&#8217;t have html5 implemented so&#8230;you need something else. Well almost all users have a Flash player. So it&#8217;s a good idea to use it for our goal (here you need *.swf copy of the sound file):

{% highlight JavaScript %}if (this.config.hasFlash) {
	var flashMovie = '';
	this.config.soundNotify.html(flashMovie);
	var embed = $('#swfAudio').children('embed');
	embed.play();
{% endhighlight %}

You can check whether there is a flash player installed with:

{% highlight JavaScript %}flashSupported: function () {
	var hasFlash = false;
	try {
		var flasObject = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
		if (flasObject) {
			hasFlash = true;
		}
	} catch(e) {
		if (navigator.mimeTypes ["application/x-shockwave-flash"] != undefined) {
			hasFlash = true;
		}
	}
	return hasFlash;			
}
{% endhighlight %}

Here is the result:

{% highlight JavaScript %}playSound: function () {
	if ($.browser.msie) {
		document.all.sound.src = this.config.soundFile + '.wav';
	} else {
		if (this.config.audioSupported) {
			var soundElement = '&lt;audio style="display:none; width: 0px; height: 0px;" id="audioNotifier" src="' + this.config.soundFile + '.wav" controls preload="auto" autobuffer>&lt;/audio>';
			this.config.soundNotify.html(soundElement);
			$('#audioNotifier')[0].play();
		} else if (this.config.hasFlash) {
			var flashMovie = '';
			this.config.soundNotify.html(flashMovie);
			var embed = $('#swfAudio').children('embed');
			embed.play();
		} else {
			this.config.soundNotify.html('&lt;embed src="' + this.config.soundFile + '.wav" hidden=true autostart=true loop=false>');
		}
	}
}
{% endhighlight %}

Of course if the user use old version of firefox, don&#8217;t have a flash player and quick time player plugin installed this method is going to fail :). So it&#8217;s under development but it&#8217;s quite good way of notifying with sound.