---
author: minko_gechev
categories:
- Immediately Invoked Function Expression
- JavaScript
- Patterns
date: 2012-08-29T00:00:00Z
tags:
- IIFE
- Immediately Invoked Function Expression
- JavaScript
- patterns
title: Self-invoking functions in JavaScript (or Immediately Invoked Function Expressions)
url: /2012/08/29/self-invoking-functions-in-javascript-or-immediately-invoked-function-expression/
---

JavaScript is a bit of a strange language, sometimes doing strange things if you don&#8217;t follow best practices and if you&#8217;re not familiar with the ECMA standard. There are numerous strange things in the JavaScript syntax, one of those being the self-executing (self-invoking) functions. Here&#8217;s the syntax:

{{< highlight JavaScript >}}
(function () {
    //body of the function
}());
{{< / highlight >}}

The main idea is that the anonymous function above is being invoked right after it has been defined. The benefit of self-invoking functions is that it enables you to execute code once without cluttering the global namespace (without declaring any globals).  
For example, if you had a web page that you needed to attach event listeners to and do some layout work in, self-invoking functions would work great for that job.

What actually happens?

Since the function is defined anonymously, there are no global or even loval variables declared here (except for the variables declared inside the function body). We do not keep reference to the function, not even to it's return value. After the function has been initialized, it is immediately invoked.
As you see it&#8217;s very useful for the initialization mentioned above. If we attach events at initialization we can do it only once because we loose the reference to the function.

There few small (but important) syntax variations. Douglas Crockford&#8217;s JSLint offers the correct declaration for self-invoking functions as:

{{< highlight JavaScript >}}(function () {
    //body
}());
{{< / highlight >}}

An alternative syntax, which Crockford calls &#8220;dog balls&#8221;, is declared as follows:

{{< highlight JavaScript >}}(function () {
    //body
})();
{{< / highlight >}}

I presonally find the second variant to be more clear.

You can also pass parameters to the self-invoking functions. It is a commonly used practice to have references to different global objects:

{{< highlight JavaScript >}}(function (w, d, $) {
   //body
}(window, document, jQuery));
{{< / highlight >}}

It is not recommended too have many arguments (aka. more than 3-4) because when the function becomes larger, you will have to scroll every time you forget a parameter name, and with a lot of arguments that will happen often. Even if the arguments&#8217; names are easy for you to remember, if your code is read by other developers, it will be difficult for them to figure out what is going on.

Usually the use of self-invoking functions is in the module pattern. It happens when we keep the reference to the function&#8217;s return value. Exactly the return value is the public API of the defined module:

{{< highlight JavaScript >}}var module = (function () {
    //private
    return {
    //public
    }
}());
{{< / highlight >}}

Since there are a lot of articles about the module pattern, I will not go into detail about it.

A self-invoking function is function which invokes itself &#8211; we already have a name for that and it is recursion. That is the reason Ben Alman gave them a new name: [Immediately Invoked Function Expression (IIFE).][1] It is recommended to use te IIFE term as it is far more semantically correct and clear.

Edited by: [Brayden Aimar][2]

 [1]: http://benalman.com/news/2010/11/immediately-invoked-function-expression/
 [2]: https://github.com/braydenaimar
