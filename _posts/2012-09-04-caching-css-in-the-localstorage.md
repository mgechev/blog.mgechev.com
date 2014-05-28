---
title: Caching CSS with localStorage
author: Minko Gechev
layout: post
permalink: /2012/09/04/caching-css-in-the-localstorage/
categories:
  - HTML5
  - Http
  - JavaScript
  - localStorage
  - Performance
tags:
  - HTML5
  - HTTP
  - JavaScript
  - localStorage
  - performance
---
<!-- Kudos 1.1.1-->

<div class="kudo-box kudo-c_tr" style="margin:0px px 30px 30px;">
  <figure class="kudo kudoable" data-id="167"> <a class="kudo-object"> <div class="kudo-opening">
    <div class="kudo-circle">
      &nbsp;
    </div>
  </div></a> 
  
  <div class="kudo-meta kudo-meta-167">
    <div class="kudo-meta-alpha kudo-hideonhover">
      <span class="kudo-count"></span> <span class="kudo-text">Kudos</span>
    </div>
    
    <div class="kudo-meta-beta kudo-dontmove">
      <span>Don't<br />move!</span>
    </div>
  </div></figure>
</div>

Since HTML5 became wide supported the most popular aspects I hear about were it&#8217;s canvas, WebSockets and localStorage. I&#8217;ve got very close experience with the first two of the mentioned but the localStorage was somehow unknown for me since a month. I&#8217;ve researched the topic. Actually it&#8217;s quite interesting and useful as you might guess. Using localStorage you can save different kinds of data locally into key-value pairs. The data lives on your local machine until it&#8217;s deleted (cleared). The localStorage allows you to use more storage than cookies and have no expiration interval (the expiration completely depends on the user). As you might guess again the data stored into the localStorage is saved on the hard drive. May be you know that it&#8217;s very expensive to take data from the hard drive because of the mechanical movements required for buffering the data. The localStorage size depends on the implementation. In Chrome, Firefox, Opera and Safari you can use 5 MBs. Actually it&#8217;s enough for caching all the CSS and JavaScript of your webpage (I really hope so).

Here comes the topic about the inline and referential CSS. As you know the inline CSS prevents you from many HTTP requests to the server but also prevents from caching. Which is the &#8220;bigger evil&#8221;? It depends on how big is your website, CSS and JavaScript. For bigger websites it&#8217;s not recommended to inline your CSS because you throw away the browser&#8217;s caching which very often is your biggest friend (when you&#8217;re looking for performance).

But what happens when the browser cache is empty, all your content isn&#8217;t cached and everything should be downloaded again? Well definitely an impact on the performance. How can be prevented? As you will see the localStorage is a sample solution. Of course you&#8217;ve got to be careful with the impact of the slower hard drives (slower than the memory) so you have to take as much data as possible with a single localStorage.getItem &#8220;request&#8221;. Browser&#8217;s cache is cleverer than our use of the localStorage but anyway. But how much can this feature of HTML5 can improve our performance? The line chart bellow is shows the time required for downloading all resources from an empty page with just six CSS files included.

The test is made using Google Chrome Version 20.0.1132.57.

<div id="attachment_174" style="width: 725px" class="wp-caption alignnone">
  <a href="http://blog.mgechev.com/wp-content/uploads/2012/09/loading.png"><img class="size-full wp-image-174 " title="Downloading required data" src="http://blog.mgechev.com/wp-content/uploads/2012/09/loading.png" alt="" width="715" height="320" /></a><p class="wp-caption-text">
    With the blue line is the variant using localStorage. The red line is using referential CSS (not inline).
  </p>
</div>

For the localStorage caching I&#8217;ve wrote a simple script that checks whether the mentioned file is already into the localStorage, if it is it&#8217;s content is put inside a style element and added into the DOM tree (actually all CSS files are added into one step because of improving the performance). If the file is not into the localStorage, using XMLHttp request, it&#8217;s content is loaded and cached. The thing that isn&#8217;t considered here: multiple localStorage.getItem calls which are not preferable because of the hard drive latency.

As you see the difference is big enough. The average time required to load the page using localStorage cache is 4.47 ms versus 14 ms required for loading the page without localStorage cache.

The most critical stage for our local storage caching is when the page is loaded for first time. There&#8217;s a big overhead because of the XMLHttp requests which get the CSS.

This is just the half of the most exiting part. The impact on the time required for onload event to be fired is shown on the chart bellow.

The X-axis is the test ID and the Y-axis is the time required in ms. As you see here the browser&#8217;s caching wins. The average score for the localStorage is 42.19 versus 29.81.

<div id="attachment_175" style="width: 725px" class="wp-caption alignnone">
  <a href="http://blog.mgechev.com/wp-content/uploads/2012/09/onload2.png"><img class="size-full wp-image-175 " title="Time required for onload event to be fired. X axis is the test ID and the Y axis time in ms. " src="http://blog.mgechev.com/wp-content/uploads/2012/09/onload2.png" alt="" width="715" height="320" /></a><p class="wp-caption-text">
    Time required for onload event to be fired. X axis is the test ID and the Y axis time in ms.
  </p>
</div>

As conclusion I can said that it&#8217;s a matter of choice and need which approach will be chosen. If use a lot of CSS files may be reducing the HTTP requests will be preferable but also collecting all the files as different key value pairs into the localStorage, like in the example above, is not very recommended because of the hard drive latency. In any case your choice should be well considered and tested because the performance impact may be critical.