---
title: Blogger image resize
author: Minko Gechev
layout: post
permalink: /2011/07/17/blogger-image-resize/
categories:
  - Blogger
  - JavaScript
  - Programming
tags:
  - blogger
  - JavaScript
  - Programming
---
<!-- Kudos 1.1.1-->

<div class="kudo-box kudo-c_tr" style="margin:0px px 30px 30px;">
  <figure class="kudo kudoable" data-id="8"> <a class="kudo-object"> <div class="kudo-opening">
    <div class="kudo-circle">
      &nbsp;
    </div>
  </div></a> 
  
  <div class="kudo-meta kudo-meta-8">
    <div class="kudo-meta-alpha kudo-hideonhover">
      <span class="kudo-count"></span> <span class="kudo-text">Kudos</span>
    </div>
    
    <div class="kudo-meta-beta kudo-dontmove">
      <span>Don't<br />move!</span>
    </div>
  </div></figure>
</div>

That&#8217;s my second post here and the first one which is going to have any sense. Today a friend of mine was fighting with Google&#8217;s blog system&#8230;He was posting some data with images in it. When he was setting width and height of images in the html editor they were being resized later after he post the article. When he tried to put any CSS restriction about picture&#8217;s width the effect was &#8211; picture flattened (because blogger was setting the picture height). I looked at the source for few minutes, stopped the JavaScript because I thought that it is the problem but there was no result&#8230;So I wrote a tiny script which deals with the problem. And here is it:

<pre lang="JavaScript">   
/*
    Blogger image resize script Copyright (C) 2011  Minko Gechev (http://mgechev.com)
    This program comes with ABSOLUTELY NO WARRANTY; for details type http://www.gnu.org/licenses/gpl-3.0.html.
    This is free software, and you are welcome to redistribute it
    under certain conditions; type http://www.gnu.org/licenses/gpl-3.0.html for details.
*/

$(document).ready(function() {

    //Picture's maximum width
    var maxImageWidth = 500;

    //Posts content is in div with post-body class so I'm performing resize for the pictures
    //which are in all divs from this kind
    (function performResize() {
        var container = $('.post-body');
        for (var i = 0; i &lt; container.length; i++) {
            getImages(container[i]);
        }
    })();

    //Recursively taking all images. I'm using recursion because there might be any 'a', 'span'...etc tag where is
    //the image. If I find any image tag then I'm comparing image's width with the max width and if it's more resizing it.
    function getImages(container) {
        if (container.tagName === 'IMG') {
            if (parseInt($(container).width()) > maxImageWidth) {
                resizeImage($(container));
                return;
            }
        } else {
            if ($(container).children().length > 0) {
                for (var i = 0; i &lt; $(container).children().length; i++) {
                    getImages($(container).children().get(i));
                }
            } else {
                return;
            }
        }    
    }

    //Calculating maxImageWidth in percents.
    function resizeImage(image) {
        var maxSizeInPercents = maxImageWidth / parseInt(image.width());
        var newHeight = maxSizeInPercents * parseInt(image.height());
        image.width(maxImageWidth);
        image.height(newHeight);
    }    
});
</pre>

I hope that it's going to be helpful for some of you.  
Greetings!