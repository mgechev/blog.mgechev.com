---
author: minko_gechev
categories:
- Computer science
- Functional programming
- Java
- JavaScript
- jQuery
- Patterns
- Programming
- Programming languages
date: 2013-01-21T00:00:00Z
tags:
- Anonymous functions
- Closure
- Computer science
- Currying
- Functional programming
- High-order functions
- JavaScript
- Lambda
- Monads
- Pattern matching
- Programming
- Recursion
- Schönfinkelization
title: Functional programming with JavaScript
url: /2013/01/21/functional-programming-with-javascript/
---

This article is about the functional concepts of JavaScript. Some of them are built-in the languages, others extra implemented but all of them are very common for purely functional languages like Haskell. First I want to tell what I mean with the term purely functional language. These languages are “safe”, they will not make side effect i.e. evaluating an expression won’t change something in the internal state and lead to different result of the same expression when called next time. It seems very strange and useless to “imperative” guys like me, but actually there’s a list of benefits:

1.  Concurrency. We won’t have deadlocks or race conditions simply because we won’t need locks – the data is immutable. It starts to look very promising...
2.  Unit testing. We can write unit tests without worry about the state simply because there’s no such thing. We should care only about the arguments of the functions we test.
3.  Debugging. Simple stack trace is absolutely enough.
4.  Solid theoretical base. Functional languages are based on the lambda calculus which is a formal system. This theoretical foundation makes the prove of correctness of the programs very straightforward (for example using induction).

I hope these arguments are enough for you to look at the next sections. Now I’ll describe the functional elements in JavaScript and also provide implementations of aspects which are not native but their implementation won’t cost us much.

## Anonymous functions

It seems that the functional programming becomes more and more popular. Even in Java 8 we’re going to have anonymous functions, in C# we have them since a long time. The anonymous function is a function which is defined without being bound to an identifier. JavaScript is familiar with this concept. If you’ve used JavaScript for more than simple exercises I’m sure that you’re familiar with them. When you use jQuery that’s probably one of the first things you type:

{{< highlight JavaScript >}}$(document).ready(function () {
    //do some stuff
});
{{< / highlight >}}

The function passed to $(document).ready is exactly an anonymous function. This concept give as great benefits some times especially when we want to keep things DRY.

More about passing functions in the next section...

## High-order functions

High-order functions are functions which accepts functions as arguments or returns functions. We can return and pass functions as arguments in C#, Java 8, Python, Perl, Ruby... The most popular language – JavaScript has these functional elements built-in for a long time. Here is a basic example:

{{< highlight JavaScript >}}function animate(property, duration, endCallback) {
    //Animation here...
    if (typeof endCallback === 'function') {
        endCallback.apply(null);
    }
}

animate('background-color', 5000, function () {
    console.log('Animation finished');
});
{{< / highlight >}}

In the code above we have function called animate. It accepts as arguments property which should be animated, duration and a callback which should be invoked when the animation is completed. We have this pattern also in jQuery. There are plenty of jQuery methods which accept functions as arguments, for example $.get:

{{< highlight JavaScript >}}$.get('http://example.com/test.json', function (data) {
    //processing of the data
});
{{< / highlight >}}

Callbacks are everywhere in JavaScript, they are just perfect for asynchronous programming like event handling, ajax requests, clients handling (Node.js) and so on. As I mentioned above you can avoid repeating yourself by using callbacks. They are extremely useful when you want a piece of your code to behave differently based on condition.

We have one more type of high-order functions – ones that return functions. There are many cases in JavaScript when returning a function is great approach. For example when we want to use caching:

{{< highlight JavaScript >}}/* From Asen Bozhilov's lz library */
lz.memo = function (fn) {
    var cache = {};
    return function () {
        var key = [].join.call(arguments, '§') + '§';
        if (key in cache) {
            return cache[key];
        }
        return cache[key] = fn.apply(this, arguments);
    };
};
{{< / highlight >}}

We have a variable cache defined in the local scope of the parent function. In each call first will be checked whether the function have been already called with these arguments, if so the result will be returned immediately, otherwise the result will be cached and returned. Even the suggestion that the function will return the same result if it’s called with the same arguments is extremely functional way of thinking...

Imagine we have this case:

{{< highlight JavaScript >}}var foo = 1;
function bar(baz) {
    return baz + foo;
}
var cached = lz.memo(bar);
cached(1); //2
foo += 1;
cached(1); //2
{{< / highlight >}}

We have function called bar which accepts a single argument – baz and returns the sum of baz and the global foo. When we use memo we make bar cacheable and save a reference to the cacheable copy in the variable cached. When we call cached for first time its being evaluated for first time with argument 1 so it’s body is invoked and the result is 2. After that we increment foo and call the cached again. Now we get the same result (as we must in the pure functional languages) but it’s not the correct one. That’s because we have some kind of state. The state is something which will be considered lately in the Monads section (not the same type of state). Now lets keep our focus on the high-order functions and especially these which return functions.

## Closures

Let’s look at memo again. We have variable called cache which is defined in the lexical scope of the function which returns the cacheable function. This variable is also accessible from the returned function because a closure is created. This is one more element from the functional programming. It’s very wide spread. One of the ways we can implement privacy in JavaScript is using closures:

{{< highlight JavaScript >}}var timeline = (function () {
    var articles = [];

    function sortArticles() {
        articles.sort(function (a, b) {
            return a.name - b.name;
        });
    }

    return {
        getArticles: function () {
            return articles;
        },
        setArticles: function (articleList) {
           articles = articleList;
           sortArticles();
        }
    };
}());
{{< / highlight >}}

In the example above we have object called timeline. It’s the result of the Immediately-Invoked Function Expression (IIFE) which returns an object with properties getArticles and setArticles which is the actual public interface of timeline. Inside of the lexical scope of the IIFE there’s definition of the articles array and sort function, which cannot be called directly using the timeline object.

I’ll end the topic about the high-order functions with ECMAScript 5. Along the years JavaScript gets even more functional elements. One of the things which appear first in our minds when we hear something about functional programming is the map function. It accept as arguments an anonymous function and a list. It applies the function to all elements from the list. map is officially part of ECMAScript 5.

Here is a basic usage of it:

{{< highlight JavaScript >}}[1,2,3,4].map(function (a) {
    return a * 2;
});
//[2,4,6,8]
{{< / highlight >}}

In the code above map doubles the array. map is not the only function which is so typical for the functional programming languages and added to ECMAScript 5, there are also filter and reduce.

## Recursion

Another element which is common for almost all modern programming languages is the recursion. It’s function which calls itself inside it’s body:

{{< highlight JavaScript >}}function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
{{< / highlight >}}

Above there’s a basic example which shows implementation of factorial using recursion. This concept is very popular so I’ll skip more detailed description.

## Managing the state (Monads)

Of course, as we saw in the example with memoization, JavaScript is not purely functional language (probably that’s one of the reasons that the language is so popular...) because it has mutable data and states. Usually the purely functional programming languages like Haskell manages states using monads. There are implementations of Monads in JavaScript. For example here’s one by Douglas Crockford:

{{< highlight JavaScript >}}/* Code by Douglas Crockford */
function MONAD(modifier) {
    'use strict';
    var prototype = Object.create(null);
    prototype.is_monad = true;
    function unit(value) {
        var monad = Object.create(prototype);
        monad.bind = function (func, args) {
            return func.apply(
                undefined,
                [value].concat(Array.prototype.slice.apply(args || []))
            );
        };
        if (typeof modifier === 'function') {
            modifier(monad, value);
        }
        return monad;
    }
    unit.method = function (name, func) {
        prototype[name] = func;
        return unit;
    };
    unit.lift_value = function (name, func) {
        prototype[name] = function () {
            return this.bind(func, arguments);
        };
        return unit;
    };
    unit.lift = function (name, func) {
        prototype[name] = function () {
            var result = this.bind(func, arguments);
            return result && result.is_monad === true ? result : unit(result);
        };
        return unit;
    };
    return unit;
}
{{< / highlight >}}

Here is a short demo which shows how we can create an I/O monad:

{{< highlight JavaScript >}}var monad = MONAD();
monad(prompt("Enter your name:")).bind(function (name) {
    alert('Hello ' + name + '!');
});
{{< / highlight >}}

Anyway, for me using monads in JavaScript looks more like academical exercise than really useful but if we want to work in purely functional manner we can use them.

## Schönfinkelization (or simply Curring)

Schönfinkelization is a functional transformation which allows as to fill function’s arguments step by step. When the function accept it’s last argument it returns a result. It was originated by Moses Schönfinkel and later re-discovered by Haskell Curry. Here is a sample implementation in JavaScript, by Stoyan Stefanov:

{{< highlight JavaScript >}}/* By Stoyan Stafanov */
function schonfinkelize(fn) {
    var slice = Array.prototype.slice,
        stored_args = slice.call(arguments, 1);
    return function () {
        var new_args = slice.call(arguments),
            args = stored_args.concat(new_args);
        return fn.apply(null, args);
    };
}
{{< / highlight >}}

This is basic example using function for solving a quadratic equation:

{{< highlight JavaScript >}}function quadraticEquation(a, b, c) {
    var d = b * b - 4 * a * c,
        x1, x2;
    if (d < 0) throw "No roots in R";
    x1 = (-b - Math.sqrt(d)) / (2 * a);
    x2 = (-b + Math.sqrt(d)) / (2 * a);
    return {
        x1: x1,
        x2: x2
    }
}
{{< / highlight >}}

If we want to fill the function’s arguments one by one we use:

{{< highlight JavaScript >}}var temp = schonfinkelize(quadraticEquation, 1);
temp = schonfinkelize(temp, -2);
temp(1); // { x1: 1, x2: 1 }
{{< / highlight >}}

If you want to use built in the language features instead of using the schonfinkelize function, you can use [Function.prototype.bind][1]. Since it’s defined in the prototype of the constructor function of all functions you can use it as method of each function. bind creates a new function with specific context and parameters. For example we may have the function:

{{< highlight JavaScript >}}var f = function (a, b, c) {
  console.log(this, arguments);
};{{< / highlight >}}

Now we apply bind to it:

{{< highlight JavaScript >}}var newF = f.bind(this, 1, 2);
newF(); //window, [1, 2]
newF = newF.bind(this, 3)
newF(); //window, [1,2,3]
newF(4); //window, [1,2,3,4]
{{< / highlight >}}

You have to be careful with bind because it’s not that spread supported. Based on [kagax ES5 compatibility table][2] IE9+ supports bind.

This has practical application in some cases. Imagine you have a session object. The session key can be generated using complex time-expensive algorithm, it’s generation is required once the user visit our web site. Our session object also should store some kind of information about the user, for example current skin of the web page chosen by the client. Using currying you can call the session generating function, with it’s parameters, once the page load, this will produce the key. After that we can call the function for the user skin. This will produce the session object after the user select a skin but we won’t have overhead because of the complex algorithm which have generated the session key generation (it won’t be sensible by the user).

## Pattern matching

One of the coolest things I’ve met in the functional programming is the pattern matching. Actually, if I have to be honest I’m not completely sure why I love it so much, probably because of it’s simplicity and the way it breaks the problem into smaller pieces. For example in Haskell you can define factorial like this:

{{< highlight JavaScript >}}factorial 0 = 1
factorial n = n * factorial (n - 1)
{{< / highlight >}}

It looks pretty cool. You divide a large task to smaller ones and make your solution simpler. When I started to write this article I’ve got an idea to implement something like this in JavaScript but I found out that it’s already implemented. Here is an example from [Bram Stein’s funcy][3]:

{{< highlight JavaScript >}}var $ = fun.parameter,
    fact = fun(
        [0, function ()  { return 1; }],
        [$, function (n) { return n * fact(n - 1); }]
    );
{{< / highlight >}}

We have special variable for parameters which is inside fun – fun.parameter. When we call fact with “ – function () { return 1; } will be called, otherwise function (n) { return n * fact(n – 1); }. So cool, right?

I hope that I showed you clear enough all the functional aspects of JavaScript and how beautiful and simple they could be.

 [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
 [2]: http://kangax.github.io/es5-compat-table/
 [3]: https://github.com/bramstein/funcy