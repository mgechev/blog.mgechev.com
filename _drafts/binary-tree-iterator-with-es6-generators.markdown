---
layout: post
title: "Binary Tree iterator with ES6 generators"
modified:
categories: 
excerpt:
tags: ['es6', 'harmony', 'generators', 'javascript', 'iterator']
comments: true
image:
  feature:
date: 2014-09-11T19:07:34+03:00
---

## Introduction

ES6 specification is being clarified every passed day! One of the key features of the new version of the language are the [generators](https://en.wikipedia.org/wiki/Generator_(computer_programming)).
Generators (a.k.a. semicoroutines) will play quite important role after they are being released. They could be used to simplify the asyn control flow of any JavaScript program (look at [co](https://github.com/visionmedia/co)). Another important role is using them for creating iterators.

In this blog post we are going to take a look how could be implemented iterator of binary search tree using the ES6 generators.

Initially I'm going to say a few words how generators could be used, after that we will look at the iterator design patterns and last, but not least we are going to take a look at the generators implementation.

## Getting started

### ES6 generators

In JavaScript we can define generator by using the following sytanx:

{% highlight javascript %}
function* generator() {
  // body
}
{% endhighlight %}

Once we have defined given generator, we can instantiate it by simply invoking it:

{% highlight javascript %}
var gen = generator();
{% endhighlight %}

Ok, so far we know how to define generators. The interesting part comes when we include the keyword `yield` into the game. With `yield` we can suspend the execution of the current generator and change the control flow:

{% highlight javascript %}
function* generator(param) {
  yield 42;
  var returnRes = yield param;
  return returnRes;
}

var gen = generator(3.1415926535);
gen.next(); // { value: 42, done: false }
gen.next(); // { value: 3.1415926535, done: false }
gen.next(1.618); // { value: 1.618, done: true }
{% endhighlight %}

Initially we create a new instance of the generator and pass Pi as parameter. Later with `yield 42` we suspend the execution of the generator. By calling the `.next` method we restore the execution from the last suspention point. By passing argument to `.next` we can get value from the outside of the generator (like in `var returnRes = yield param`).

So far so good, but some times we want to pass the execution to another generator. For this case we have a special syntax - `yield* generator(params)`:


{% highlight javascript %}
function* foo() {
  console.log('In foo');
  var c = yield* bar(1.618);
  console.log(c);
}

function* bar(param) {
  console.log('In bar');
  yield param;
  return 42;
}

var f = foo();
f.next();
f.next();
/**
  // In foo
  // In bar
  // 42
*/
{% endhighlight %}

### Iterator Design Pattern
