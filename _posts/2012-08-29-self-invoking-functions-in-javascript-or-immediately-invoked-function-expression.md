---
title: Self-invoking functions in JavaScript (or Immediately Invoked Function Expressions)
author: minko_gechev
layout: post
permalink: /2012/08/29/self-invoking-functions-in-javascript-or-immediately-invoked-function-expression/
categories:
  - Immediately Invoked Function Expression
  - JavaScript
  - Patterns
tags:
  - IIFE
  - Immediately Invoked Function Expression
  - JavaScript
  - patterns
---
JavaScript is a bit strange language, doing strange (some times) things if you don&#8217;t follow best practices and if you&#8217;re not familiar with the ECMA standard. There&#8217;re are different strange things in the syntax and the semantics. One &#8220;strange&#8221; think (actually a syntax sugar) are the self-executing (invoking) functions. Here&#8217;s the syntax:

<pre lang="JavaScript">
(function () {
    //body of the function
}());
</pre>

The main idea is that the anonymous function above is being invoked right after it have been defined. The benefit from the self-invoking functions is when you need do execute a code once and you want to save the &#8220;global environment&#8221; (to not declare any globals).  
For example, for a little web page you may need to attach event listeners and do any layout stuff. Self-invoking functions are great for that job.

What actually happens?

As you see we define an anonymous function. So there&#8217;re no any global, even local variables declared here (except these in the function body, if any). We don&#8217;t keep reference to that function, not even to it&#8217;s return value. After the function have been initialized it&#8217;s immediately invoked.  
As you see it&#8217;s very useful for the initialization mentioned above. If we attach events at initialization we can do it only once because we loose the reference to the function.

There few different syntax variations. Actually the difference is small. As Douglas Crockford&#8217;s JSLint offers the right declaration for self-invoking functions is:

<pre lang="JavaScript">(function () {
    //body
}());
</pre>

Alternative syntax is, which Crockford calls &#8220;dog balls&#8221;&#8230;:

<pre lang="JavaScript">(function () {
    //body
})();
</pre>

May be the second variant is a bit more clear (by my opinion, not Crockford&#8217;s).

You can also pass parameters to the self-invoking functions. It&#8217;s commonly used practice to have references to different global objects:

<pre lang="JavaScript">(function (w, d, $) {
   //body
}(window, document, jQuery));
</pre>

It&#8217;s not recommended to have many arguments (for example more than 3-4) because when the function became bigger you have to scroll each time you forgot a parameter name and with a lot of arguments it&#8217;ll be often. Even if the arguments&#8217; names are easy to remember by you, probably, your code will be read by other developers so be merciful for all of them too :).

Usual use of self-invoking functions is in the module pattern. It happens when we keep the reference to the function&#8217;s return value. Exactly the return value is the public API of the defined module:

<pre lang="JavaScript">var module = (function () {
    //private
    return {
    //public
    }
}());
</pre>

There&#8217;re a lot of articles about the module pattern so I won&#8217;t stop on it.

Self-invoking function mean function which invokes itself &#8211; we already have a name for that and it is recursion. That&#8217;s why since few years Ben Alman gave them a new name: [Immediately Invoked Function Expression (IIFE).][1]. For sure it&#8217;s better to use that one because it&#8217;s far more semantically corrected and clear.

 [1]: http://benalman.com/news/2010/11/immediately-invoked-function-expression/