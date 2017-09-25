---
author: minko_gechev
categories:
- HTML5
- Http
- JavaScript
- localStorage
- Performance
date: 2012-09-04T00:00:00Z
tags:
- HTML5
- HTTP
- JavaScript
- localStorage
- performance
title: Caching CSS with localStorage
url: /2012/09/04/caching-css-in-the-localstorage/
---

Since HTML5 became wide supported the most popular aspects I hear about were it’s canvas, WebSockets and localStorage. I’ve got very close experience with the first two of the mentioned but the localStorage was somehow unknown for me since a month. I’ve researched the topic. Actually it’s quite interesting and useful as you might guess. Using localStorage you can save different kinds of data locally into key-value pairs. The data lives on your local machine until it’s deleted (cleared). The localStorage allows you to use more storage than cookies and have no expiration interval (the expiration completely depends on the user). As you might guess again the data stored into the localStorage is saved on the hard drive. May be you know that it’s very expensive to take data from the hard drive because of the mechanical movements required for buffering the data. The localStorage size depends on the implementation. In Chrome, Firefox, Opera and Safari you can use 5 MBs. Actually it’s enough for caching all the CSS and JavaScript of your webpage (I really hope so).

Here comes the topic about the inline and referential CSS. As you know the inline CSS prevents you from many HTTP requests to the server but also prevents from caching. Which is the “bigger evil”? It depends on how big is your website, CSS and JavaScript. For bigger websites it’s not recommended to inline your CSS because you throw away the browser’s caching which very often is your biggest friend (when you’re looking for performance).

But what happens when the browser cache is empty, all your content isn’t cached and everything should be downloaded again? Well definitely an impact on the performance. How can be prevented? As you will see the localStorage is a sample solution. Of course you’ve got to be careful with the impact of the slower hard drives (slower than the memory) so you have to take as much data as possible with a single localStorage.getItem “request”. Browser’s cache is cleverer than our use of the localStorage but anyway. But how much can this feature of HTML5 can improve our performance? The line chart below is shows the time required for downloading all resources from an empty page with just six CSS files included.

The test is made using Google Chrome Version 20.0.1132.57.

<div id="attachment_174" style="width: 725px" class="wp-caption alignnone">
  <a href="/images/legacy/uploads2012/09/loading.png"><img class="size-full wp-image-174 " title="Downloading required data" src="/images/legacy/uploads2012/09/loading.png" alt="" width="715" height="320" /></a><p class="wp-caption-text">
    With the blue line is the variant using localStorage. The red line is using referential CSS (not inline).
  </p>
</div>

For the localStorage caching I’ve wrote a simple script that checks whether the mentioned file is already into the localStorage, if it is it’s content is put inside a style element and added into the DOM tree (actually all CSS files are added into one step because of improving the performance). If the file is not into the localStorage, using XMLHttp request, it’s content is loaded and cached. The thing that isn’t considered here: multiple localStorage.getItem calls which are not preferable because of the hard drive latency.

As you see the difference is big enough. The average time required to load the page using localStorage cache is 4.47 ms versus 14 ms required for loading the page without localStorage cache.

The most critical stage for our local storage caching is when the page is loaded for first time. There’s a big overhead because of the XMLHttp requests which get the CSS.

This is just the half of the most exiting part. The impact on the time required for onload event to be fired is shown on the chart below.

The X-axis is the test ID and the Y-axis is the time required in ms. As you see here the browser’s caching wins. The average score for the localStorage is 42.19 versus 29.81.

<div id="attachment_175" style="width: 725px" class="wp-caption alignnone">
  <a href="/images/legacy/uploads2012/09/onload2.png"><img class="size-full wp-image-175 " title="Time required for onload event to be fired. X axis is the test ID and the Y axis time in ms. " src="/images/legacy/uploads2012/09/onload2.png" alt="" width="715" height="320" /></a><p class="wp-caption-text">
    Time required for onload event to be fired. X axis is the test ID and the Y axis time in ms.
  </p>
</div>

As conclusion I can said that it’s a matter of choice and need which approach will be chosen. If use a lot of CSS files may be reducing the HTTP requests will be preferable but also collecting all the files as different key value pairs into the localStorage, like in the example above, is not very recommended because of the hard drive latency. In any case your choice should be well considered and tested because the performance impact may be critical.
