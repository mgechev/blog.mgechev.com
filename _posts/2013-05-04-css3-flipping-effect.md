---
title: CSS3 flipping effect
author: minko_gechev
layout: post
permalink: /2013/05/04/css3-flipping-effect/
categories:
  - Browsers
  - CSS3
  - Development
  - Internet
tags:
  - CSS3
  - CSS3 flipping effect
  - flipping
  - HTML5
---

As you know because of the SIMD nature of the GPU it&#8217;s extremely good for graphical calculations. Since HTML5 and CSS3 are here we have a couple of ways for efficient and smooth animations one of them are the CSS3 transitions.

Before few days I needed a CSS3 flipping effect which should works at least in IE10, Chrome 25+ and Firefox. I tried different demos which I found in the web but there were couple of issues with them. The lack of support of **preserve-3d** in IE10 was one major thing, issues with **backface-visibility** in Chrome were also a bit frustrating. It looks like Firefox was the champion in the CSS3 flipping effects because most of the demos were failing in IE10 or Chrome but working on Firefox.

Anyway <a href="http://jsfiddle.net/mgechev/GpK25/16/" target="_blank">here is demo</a> of the example I wrote.

Here is the CSS:

{% highlight CSS %}.panel {
    width: 300px;
    height: 300px;
    margin: auto;
    position: relative;
}

.card {
    width: 100%;
    height: 100%;
    -o-transition: all .5s;
    -ms-transition: all .5s;
    -moz-transition: all .5s;
    -webkit-transition: all .5s;
    transition: all .5s;
    -webkit-backface-visibility: hidden;
    -ms-backface-visibility: hidden;
    -moz-backface-visibility: hidden;
    backface-visibility: hidden;
    position: absolute;
    top: 0px;
    left: 0px;
}

.front {
    z-index: 2;
    background-image: url(http://img.afreecodec.com/images/v3/wp-content/uploads/2011/05/00_chrome_icon.jpg);
}

.back {
    z-index: 1;
    -webkit-transform: rotateX(-180deg);
    -ms-transform: rotateX(-180deg);
    -moz-transform: rotateX(-180deg);  
    transform: rotateX(-180deg);  
    background-image: url(http://www.digitaltrends.com/wp-content/uploads/2011/03/ie-9-icon.jpg);
}

.panel:hover .front {
    z-index: 1;
    -webkit-transform: rotateX(180deg);
    -ms-transform: rotateX(180deg);
    -moz-transform: rotateX(180deg);
    transform: rotateX(180deg);
}

.panel:hover .back {
    z-index: 2;   
    -webkit-transform: rotateX(0deg);
    -ms-transform: rotateX(0deg);
    -moz-transform: rotateX(0deg);
    transform: rotateX(0deg);
}
{% endhighlight %}

You can see that it&#8217;s extremely simple &#8211; just rotating the front and back panes with difference 180 degrees when the user hover the panel.

The HTML is even simpler:

{% highlight html %}<div class="panel">
  <div class="front card">
    
  </div>
      
  
  <div class="back card">
    
  </div>
  
</div>
{% endhighlight %}

And of course, there&#8217;s no JavaScript. You just don&#8217;t need it.

I hope that it was useful.