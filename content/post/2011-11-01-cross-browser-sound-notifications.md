---
author: minko_gechev
categories:
- Any
- Browsers
- Development
- HTML5
- Internet
- JavaScript
- Programming
date: 2011-11-01T00:00:00Z
tags:
- Development
- Internet
- JavaScript
- Programming
title: Sound notification in web page
url: /2011/11/01/cross-browser-sound-notifications/
---

Few days ago I was creating a system in which it was necessary to implement a sound notification feature. Well it’s not very hard task but of course you have to be careful with the browser compatibility. At first my source was something like that:

{{< highlight JavaScript >}}playSound: function () {
	this.config.soundNotify.html('<embed src="' + this.config.soundFile + '.wav" hidden=true autostart=true loop=false>');
}
{{< / highlight >}}

Actually in my Linux it was working pretty well (I tried it mainly in Chrome).  
After that I decided to try it in a different environment (OS, browser...). Well I started the app in Google Chrome installed on Windows 7. It was working again :). After that...IE...and yes it wasn’t working (the browser asked me to start an add-on but this stinks...). Well IE has a tag for background sound. So I added:

{{< highlight HTML >}}<bgsound id="sound">
{{< / highlight >}}

In the JS I’ve added:

{{< highlight JavaScript >}}if ($.browser.msie) {
	document.all.sound.src = this.config.soundFile + '.wav';
}
{{< / highlight >}}

I tried the script in Firefox...It asked me if I want to install Quick time plugin...I refused and there wasn’t any sound. Great, isn’t it? I tried it in Safari...no sound...  
As you know in HTML5 you have an audio tag. If you use new browser you can use this tag and I think that it’s the best way for sound notification here is it:

{{< highlight JavaScript >}}if (this.config.audioSupported) {
	var soundElement = '<audio style="display:none; width: 0px; height: 0px;" id="audioNotifier" src="' + this.config.soundFile + '.wav" controls preload="auto" autobuffer></audio>';
	this.config.soundNotify.html(soundElement);
	$('#audioNotifier')[0].play();
}
{{< / highlight >}}

The audioSupported property is the result of the:

{{< highlight JavaScript >}}!!document.createElement('audio').canPlayType;
{{< / highlight >}}

But if the browser is too old it don’t have html5 implemented so...you need something else. Well almost all users have a Flash player. So it’s a good idea to use it for our goal (here you need *.swf copy of the sound file):

{{< highlight JavaScript >}}if (this.config.hasFlash) {
	var flashMovie = '';
	this.config.soundNotify.html(flashMovie);
	var embed = $('#swfAudio').children('embed');
	embed.play();
{{< / highlight >}}

You can check whether there is a flash player installed with:

{{< highlight JavaScript >}}flashSupported: function () {
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
{{< / highlight >}}

Here is the result:

{{< highlight JavaScript >}}playSound: function () {
	if ($.browser.msie) {
		document.all.sound.src = this.config.soundFile + '.wav';
	} else {
		if (this.config.audioSupported) {
			var soundElement = '<audio style="display:none; width: 0px; height: 0px;" id="audioNotifier" src="' + this.config.soundFile + '.wav" controls preload="auto" autobuffer></audio>';
			this.config.soundNotify.html(soundElement);
			$('#audioNotifier')[0].play();
		} else if (this.config.hasFlash) {
			var flashMovie = '';
			this.config.soundNotify.html(flashMovie);
			var embed = $('#swfAudio').children('embed');
			embed.play();
		} else {
			this.config.soundNotify.html('<embed src="' + this.config.soundFile + '.wav" hidden=true autostart=true loop=false>');
		}
	}
}
{{< / highlight >}}

Of course if the user use old version of firefox, don’t have a flash player and quick time player plugin installed this method is going to fail :). So it’s under development but it’s quite good way of notifying with sound.