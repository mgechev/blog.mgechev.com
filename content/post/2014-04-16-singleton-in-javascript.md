---
author: minko_gechev
categories:
- Development
- JavaScript
- Object-Oriented Programming
- Patterns
date: 2014-04-16T00:00:00Z
tags:
- Design patterns
- JavaScript
- Singleton
title: Singleton in JavaScript
url: /2014/04/16/singleton-in-javascript/
---

Wikipedia describes the singleton design pattern as:

> The singleton pattern is a design pattern that restricts the instantiation of a class to one object. This is useful when exactly one object is needed to coordinate actions across the system. The concept is sometimes generalized to systems that operate more efficiently when only one object exists, or that restrict the instantiation to a certain number of objects. The term comes from the mathematical concept of a singleton. 

<div id="attachment_708" style="width: 231px" class="wp-caption aligncenter">
  <a href="/images/legacy/uploads2014/04/singleton.png"><img src="/images/legacy/uploads2014/04/singleton-221x300.png" alt="Singleton" width="221" height="300" class="size-medium wp-image-708" /></a><p class="wp-caption-text">
    Singleton
  </p>
</div>

Singleton is one of the most well known and also hated design patterns, all the time. It is very easy to implement a basic version of the singleton pattern so that’s the reason it is that well known. But if we look deeper into different details, there are plenty of problems, which may happen because of poor implementation:

*   Instantiating multiple singletons because of concurrent access to the `getInstance` method of the singleton.
*   Instantiating multiple singletons because of serialization/deserialization
*   Inheriting from a singleton object
*   etc...

Thanks God we don’t have to consider all these corner cases in JavaScript.

The simplest singleton implementation in JavaScript is:

{{< highlight javascript >}}var Singleton = {};
{{< / highlight >}}

And yes – this is singleton!

Addy Osmani suggests the following implementation at his book [“Learning JavaScript Design Patterns”][1]:

{{< highlight javascript >}}var mySingleton = (function () {
  // Instance stores a reference to the Singleton
  var instance;
  function init() {
    // Singleton
    // Private methods and variables
    function privateMethod(){
        console.log( "I am private" );
    }
    var privateVariable = "Im also private";
    var privateRandomNumber = Math.random();
    return {
      // Public methods and variables
      publicMethod: function () {
        console.log( "The public can see me!" );
      },
      publicProperty: "I am also public",
      getRandomNumber: function() {
        return privateRandomNumber;
      }
    };
  };
  return {
    // Get the Singleton instance if one exists
    // or create one if it doesn't
    getInstance: function () {
      if ( !instance ) {
        instance = init();
      }
      return instance;
    }
  };
})();
{{< / highlight >}}

This implementation is based on the module pattern. The module pattern is applied two times – the first application aims to provide the actual singleton and keeps the private data/behavior inside a closure. The second usage of the module pattern aims to provide the public interface used for getting the singleton object, which is kept inside a closure.

It is absolutely valid and useful implementation:

*   It instantiates only a single object
*   It is safe – it keeps the reference to the singleton inside a variable, which lives inside a lexical closure, so it is not accessible by the outside world
*   It allows privacy – you can define all private methods of your singleton inside the lexical closure of the first module pattern

As drawback I can point the lack of specific “type” of the singleton (i.e. more specific than object), which won’t allow you to use the operator `instanceof`. I can argue that the definition of the `private` members can lead to poor unit testing, but if they are private, they are not intended for testing anyway.

Another implementation of singleton, which I found in the network is [“The best Singleton pattern”][2]:

{{< highlight javascript >}}(function(global) {
  "use strict";
  var MySingletonClass = function() {

    if ( MySingletonClass.prototype._singletonInstance ) {
      return MySingletonClass.prototype._singletonInstance;
    }
    MySingletonClass.prototype._singletonInstance = this;

    this.Foo = function() {
      // ...
    };
  };

var a = new MySingletonClass();
var b = MySingletonClass();
//a === b
global.MySingleton = a; //or b

}(window));
{{< / highlight >}}

Here are the main advantages of this implementation:

*   It instantiates only a single object
*   You can use the `instanceof` operator

As drawback I can state the fact that you can easy change the prototype property `_singletonInstance` of your singleton. This way, when `MySingleton` is called once again, it will create a new object:

{{< highlight javascript >}}Object.getPrototypeOf(MySingleton)._singletonInstance = null;
{{< / highlight >}}

Implementation I use is formed by combining both approaches from above:

{{< highlight javascript >}}var MySingleton = (function () {

  var INSTANCE;

  function MySingleton(foo) {
    if (!(this instanceof MySingleton)) {
      return new MySingleton(foo);
    }
    this.foo = foo;
  }
  MySingleton.prototype.bar = function () {
    //do something;
  };

  return {
    init: function () {
      if (!INSTANCE) {
        return INSTANCE = MySingleton.apply(null, arguments);
      }
      return INSTANCE;
    },
    getInstance: function () {
      if (!INSTANCE) {
        return this.init.apply(this, arguments);
      }
      return INSTANCE;
    }
  };

}());
{{< / highlight >}}

In this example we use the module pattern once again, in order to enclose the singleton implementation into a lexical closure and provide a public interface for getting its instance.

Sometimes you need to pass arguments when initializing a singleton for first time. This is easy achieved using the method `init`. The `init` method is not aware of the arguments required by the singleton – all it does is to forward the call to the internal `MySingleton` function with context `null`. Inside the implementation of the `MySingleton` constructor function we make a check whether the current context – `this` is of type `MySingleton`, if it isn’t, then this means that `MySingleton` is not called with the `new` operator, so we recursively call `new MySingleton` with the required parameters.

What are the benefits we get from this implementation:

*   It instantiates only a single object
*   It is safe – it keeps the reference to the singleton inside a variable, which lives inside a lexical closure and is not accessible by the outside world
*   It allows you to initialize the singleton with some arguments. The module pattern, which wraps the singleton is not aware of the initialization arguments – it simply forwards the call with `apply`
*   You can use the `instanceof` operator

As drawback, I can state that I feel unnatural for this implementation to use “private” data/behavior – but yes, it is possible if you define them in the lexical closure of the module pattern.

 [1]: http://addyosmani.com/resources/essentialjsdesignpatterns/book/#singletonpatternjavascript
 [2]: http://stackoverflow.com/a/6733919/1106382