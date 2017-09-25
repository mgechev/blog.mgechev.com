---
author: minko_gechev
categories:
- Ajax
- Http
- Internet
- JavaScript
- Programming
date: 2011-07-21T00:00:00Z
tags:
- Ajax
- JavaScript
- Programming
title: Ajax without jQuery for beginners
url: /2011/07/21/ajax-jquery-beginners/
---

Before years I was writing all the code by my own, without additional libraries (including jQuery). For beginner developer it&#8217;s a good strategy. When you use **$.ajax** it&#8217;s all that easy:

{{< highlight JavaScript >}}$.ajax({
  url: "any/url/for/the/request",
  type: "get",
  success: function(data){
    alert(data);
  }
});{{< / highlight >}}

But you can&#8217;t get the main idea.  
Many developers don&#8217;t have an idea how to write this without a library. In their opinion AJAX without library a hard, near impossible task. Well the truth is that it&#8217;s not so hard&#8230;there are just some incompatibilities between the different browsers but you can deal with all of them in few lines of code. First for creating the HTTP request you have to create new XMLHttpRequest (for most browsers). Of course, in Internet Explorer you have to do something slightly different&#8230;In Internet Explorer under version 7 you have to create special kind of ActiveX Object which has different versions &#8211; MSXML2.XMLHttp.5.0, MSXML2.XMLHttp.4.0, MSXML2.XMLHttp.3.0, MSXML2.XMLHttp, Microsoft.XMLHttp. For our goals we want to use the newest version of the XMLHttp object. Here is a function which creates object which we can use for out request:

{{< highlight JavaScript >}}function createXMLHttp() {
  //If XMLHttpRequest is available then using it
  if (typeof XMLHttpRequest !== undefined) {
    return new XMLHttpRequest;
  //if window.ActiveXObject is available than the user is using IE...so we have to create the newest version XMLHttp object
  } else if (window.ActiveXObject) {
    var ieXMLHttpVersions = ['MSXML2.XMLHttp.5.0', 'MSXML2.XMLHttp.4.0', 'MSXML2.XMLHttp.3.0', 'MSXML2.XMLHttp', 'Microsoft.XMLHttp'],
        xmlHttp;
    //In this array we are starting from the first element (newest version) and trying to create it. If there is an
    //exception thrown we are handling it (and doing nothing ^^)
    for (var i = 0; i < ieXMLHttpVersions.length; i++) {
      try {
        xmlHttp = new ActiveXObject(ieXMLHttpVersions[i]);
        return xmlHttp;
      } catch (e) {
      }
    }
  }
}{{< / highlight >}}

Actually function similar to this one was published by **Nicholas C. Zakas, Jeremy McPeak, Joe Fawcett** ([link to Amazon][1]).  
And we're done with the first step.  
Now we have to send the request and process the result.  
Here we're going to make a simple "get" request:

{{< highlight JavaScript >}}function getData() {
  var xmlHttp = createXMLHttp(success, error);
  xmlHttp.open('get', 'http://localhost/ajaxTest.txt', true);
  xmlHttp.send(null);
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState === 4) {
      if (xmlHttp.status === 200) {
        success.call(null, xmlHttp.responseText);
      } else {
        error.call(null, xmlHttp.responseText);
      }
    } else {
      //still processing
    }
  };
}{{< / highlight >}}

I think that this is even simpler. Firstly we get the xmlhttp object. After that start a request. In this situation the request was with method 'get' and the url was 'http://localhost/ajaxTest.txt'. The third parameter indicates if the request is going to be synchronous or asynchronous. If it's synchronous then the browser is going to freeze until the request is ready. If it's asynchronous then the request is gong to be executed in background.  
When you use 'post' you've to add this line:

{{< highlight JavaScript >}}xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");{{< / highlight >}}

And you've to change this line:

{{< highlight JavaScript >}}xmlHttp.send(null);{{< / highlight >}}

to this one:

{{< highlight JavaScript >}}xmlHttp.send(data);{{< / highlight >}}

This data have to be structured like url. You can the function below:

{{< highlight JavaScript >}}function insinfo(sendForm) {
   var dataArray = [];
   //Getting the data from all elements in the form
   for (var i = 0; i < sendForm.elements.length; i++) {
     var encodedData = encodeURIComponent(sendForm.elements[i].name);
     encodedData += "=";
     encodedData += encodeURIComponent(sendForm.elements[i].value);
     dataArray.push(ProM);
   }
   return dataArray.join("&#038;");
 }{{< / highlight >}}

And just:

{{< highlight JavaScript >}}var data = insinfo(form);{{< / highlight >}}

Of course using jQuery's $.ajax is shorter, easier, well tested, optimised but with this article I think that you saw that the "native" way of using Ajax is't that hard too. May be this post will be your first step of creating your own library.

Greetings!  
Minko.

 [1]: http://www.amazon.com/Professional-Ajax-2nd-Programmer/dp/0470109491 "link to Amazon"
