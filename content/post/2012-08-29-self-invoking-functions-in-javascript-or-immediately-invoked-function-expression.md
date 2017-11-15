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

There are a lot of interesting things in the syntax of JavaScript, one of which is the definition of self-executing (self-invoking) functions. Here's how we can defined such function:

{{< highlight JavaScript >}}
(function () {
    //body of the function
}());
{{< / highlight >}}

The anonymous function above will be invoked right after it has been defined. The benefit of self-invoking functions is that they enable us to execute code once without cluttering the global namespace (without declaring any globals).
For example, if we have a web page in which we want to attach event listeners to DOM elements and other initialization work, self-invoking functions would be the best tool for the job!

How they actually work?

Since the function is defined anonymously, there are leaked global nor even local variables except, of course, the variables declared inside the function's body. We do not keep reference to the function, not even to its return value. After the function has been initialized, it is being immediately invoked.

As we already mentioned, this is very convenient for executing initialization logic. Using self-invoking functions we will perform the initialization work only once because after the execution we'll loose the reference to the function.

There few small (but important) syntax variations. Douglas Crockford’s JSLint offers the correct declaration for self-invoking functions as:

{{< highlight JavaScript >}}(function () {
    //body
}());
{{< / highlight >}}

An alternative syntax, which Crockford calls “dog balls”, is as follows:

{{< highlight JavaScript >}}(function () {
    //body
})();
{{< / highlight >}}

I personally find the second variant to be more clear.

You can also pass parameters to the self-invoking functions. It is a commonly used practice to pass references to global objects:

{{< highlight JavaScript >}}(function (w, d, $) {
   //body
}(window, document, jQuery));
{{< / highlight >}}

It is not recommended to pass too many arguments (for instance, more than 3-4) because when the function becomes larger, we will have to scroll every time you forget a parameter name, and with a lot of arguments that will happen often. Even if the arguments’ names are easy to remember, if the code is read by other developers, it will be difficult for them to figure out what is going on.

Usually the module pattern is implemented using self-invoking functions. In the module pattern, we keep the reference to the function’s returned object. In such case we consider the return value as the public API of the module:

{{< highlight JavaScript >}}var module = (function () {
  // private
  return {
    // public
  };
}());
{{< / highlight >}}

Since there are a lot of articles about the module pattern, we skip the details.

**Important note**

In programming we usually call functions which invoke themselves recursive functions. That is the reason Ben Alman gave self-invoking functions a new name: [Immediately Invoked Function Expression (IIFE).][1] It is recommended to use the term IIFE since it's semantically correct and more clear.

Edited by: [Brayden Aimar][2]

 [1]: http://benalman.com/news/2010/11/immediately-invoked-function-expression/
 [2]: https://github.com/braydenaimar
