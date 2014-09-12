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
Generators (a.k.a. semicoroutines) will play quite important role after they are being officially released. They could be used to simplify the asynchronous control flow of any JavaScript program (look at [co](https://github.com/visionmedia/co)). Another important role is using them for creating iterators.

In this blog post we are going to take a look at how could be implemented iterator of binary search tree using the ES6 generators.

Initially I'm going to tell a few words about how generators could be used, after that we will look at the iterator design patterns and last, but not least we are going to take a look at the BST (binary search tree) iterator implementation.

## Getting started

### ES6 generators

In JavaScript we can define generator by using the following syntax:

{% highlight javascript %}
function* generator() {
  // body
}
{% endhighlight %}

Once we have defined given generator, we can instantiate it (more preciously we create an [iterator](http://en.wikipedia.org/wiki/Generator_(computer_programming)#Uses)) by simply invoking it like a function:

{% highlight javascript %}
var gen = generator();
{% endhighlight %}

Ok, so far we know how to define generators and instantiate them. The interesting part comes when we include the keyword `yield` into the game. With `yield` we can suspend the execution of the current generator and change the control flow:

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

Initially we create a new instance of the generator and pass Pi as parameter. Later with `yield 42` we suspend the execution of the generator. By calling the `next` method we restore the execution from the last suspension point. By passing argument to `next` we can get value from the outside of the generator (like in `var returnRes = yield param`).

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

The iterator pattern belongs to the behavioral design patterns. It is used with collections of objects and its main aim is separation of the logic for traversing given collection, from the actual collection's implementation.

!["Iterator"](/images/patterns/behavioral/iterator.svg "Iterator")

Big advantage of this design pattern is that the abstract `Iterator` class provides common interface, which could be later implemented by multiple `ConcreteIterators`. This way we can traverse different collections (BSTs, linked lists, hash maps, etc.) using the same interface provided by the collection's iterator.

## Implementation

In this section we'll take a look at the actual implementation of our BST iterator. Since the logic behind the data structure is not in the scope of this blog post, you can take a look at my repository - [javascript-algorithms](https://github.com/mgechev/javascript-algorithms/blob/master/src/data-structures/binary-search-tree.js) for additional details.
In this article we are going to extend the BST's API by adding a method called `getIterator`.
Here is its implementation:

{% highlight javascript %}

BinaryTree.prototype.getIterator = function () {
  return new BinarySearchTreeIterator(this).next(this._root);
};

{% endhighlight %}

In the snippet above, we create new instance of `BinarySearchTreeIterator` by passing the current BST instance and after that invoking it's `next` method. The `next` method of the iterator will return the next element of the collection. Initially, during the creation of the iterator, we need to call it because the `next` method is actually a generator, so by invoking it we return new instance of the generator.

Here is the implementation of the iterator:

{% highlight javascript %}
function BinarySearchTreeIterator(tree) {
  this._tree = tree;
}

BinarySearchTreeIterator.prototype.next = function* (current) {
  if (current === undefined)
    current = this._tree._root;
  if (current === null)
    return;
  yield* this.next(current._left);
  yield current.value;
  yield* this.next(current._right);
};
{% endhighlight %}

You can see that the only difference between the in-order traverse of the BST using iterator and the [one implemented in the BST](https://github.com/mgechev/javascript-algorithms/blob/master/src/data-structures/binary-search-tree.js#L65-L72), is that the iterator uses `yield`. Different `yield` syntax is used depending on whether we want to suspend the execution or to "redirect" it to different generator instead.

Here is how our iterator could be used:

{% highlight javascript %}
var tree = new BinaryTree();

tree.insert(5);
tree.insert(1);
tree.insert(6);
tree.insert(0);

var i = tree.iterator();
var current;
while (!(current = i.next()).done) {
  console.log(current.value);
}
// 0 1 5 6
{% endhighlight %}
