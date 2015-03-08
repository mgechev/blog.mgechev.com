---
title: Asynchronous calls with ES6 generators
author: minko_gechev
layout: post
categories:
  - ES6
  - ES7
  - JavaScript
  - Programming
tags:
  - ES6
  - ES7
  - JavaScript
---

ES6 generators have landed in Chrome 39 Beta on 9th of October and are already available in the stable version.
This means that brand new development practices are already applicable, although for supporting older browsers you might need to fallback to the traceroute compiler.

A cool module, which [TJ](https://github.com/tj) developed, called <a href="https://github.com/tj/co">`co`</a>, is available for quite a while (his initial commit in the `co` repository was on 6th of June 2013).

A few months ago Jake Archibald wrote an [article](http://jakearchibald.com/2014/es7-async-functions/) about the awesomeness of the `async` functions in ES7 and how we can "emulate" them using ES6's generators, using his `spawn` function, which has subset of the features of `co`.

In this blog post we'll take a look at standard ways of handling asynchronous calls and how we can improve the readability of our code using generators. We'll also take a further look at the implementation of `spawn`, since there are few tricky moments there.

The code from the demo is at my [GitHub](https://github.com/mgechev/generators-async-demo).

## Prerequisites

You must be familiar with how JavaScript promises work. You can read this amazing [HTML5 rocks article](http://www.html5rocks.com/en/tutorials/es6/promises/) about them and take a look at my [Light Q implementation](https://github.com/mgechev/light-q) for the underlaying details.

You should be also familiar with how generators work. For some initial, quick background I can recommend you ["Binary Tree iterator with ES6 generators"](http://blog.mgechev.com/2014/09/11/binary-tree-iterator-with-es6-generators/).

## Getting started

In this section we're going to take a look at simple example, which handles asynchronous function calls with callbacks, promises and generators (we can think them as [semi-coroutines](https://en.wikipedia.org/wiki/Coroutine)).

We'll use the most common example for this - AJAX calls.

### Sample data set

Let's suppose we have the following data, which should be resolved using XHR (XMLHttpRequests):

**users.json**
{% highlight json %}
{
  "group": "admins",
  "users_list": ["user1.json", "user2.json"]
}
{% endhighlight %}

Where in each JSON file, corresponding to given user we have:

**userx.json**
{% highlight json %}
{
  "username": "foobar",
  "avatar": "photox.png"
}
{% endhighlight %}

All we want to do is get the list of users with GET XHR, log the group name and after that get the users one by one (or at once if possible).

### Callback solution

Let's implement the `getJSON` method:

{% highlight javascript %}
function getJSON(url, success, error) {
  'use strict';
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        success(JSON.parse(xhr.responseText));
      } else {
        error(xhr.responseText);
      }
    }
  };
  xhr.open('GET', url);
  xhr.send();
}
{% endhighlight %}

Our `loadUsers` function would look like this:

{% highlight javascript %}
function loadUsers() {
  getJSON('users.json', function (users) {
    console.log(users.group);
    users.users_list.forEach(function (u) {
      getJSON(u, function (user) {
        console.log(user);
      }, function (error) {
        console.error(error);
      });
    });
  }, function (error) {
    console.error(error);
  });
}
{% endhighlight %}

This looks...alright, I guess.
What we do is to fetch the `users.json` and later, in the success callback, fetch each user in the `users_list` array. Excluding the ugliness of the code (plenty of nested callbacks), the functionality is not that bad because we can fetch up-to 6 users simultaneously (that's the limit in Chrome).

### Promises solution

We can modify slightly `getJSON` in order to make it return a promise:

{% highlight javascript %}
function getJSON(url) {
  'use strict';
  var xhr = new XMLHttpRequest();
  var d = Promise.defer();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        d.resolve(JSON.parse(xhr.responseText));
      } else {
        d.reject(xhr.responseText);
      }
    }
  };
  xhr.open('GET', url);
  xhr.send();
  return d.promise;
}
{% endhighlight %}

Now `loadUsers` will look like this:

{% highlight javascript %}
function loadUsers() {
  getJSON('users.json')
  .then(function (data) {
    console.log(data.group);
    Promise.all(data.users_list.map(getJSON))
    .then(function (users) {
      console.log(users);
    });
  });
}
{% endhighlight %}

I believe, the code looks a little bit more compact. We still fetch up-to 6 users simultaneously, because of the call `data.users_list.map(getJSON)`.

### Solution with generators

Since `async` functions are still not implemented in the modern browsers, as Jake suggests, we can use generators as something akin to them. Let's leave our `getJSON` implementation untouched and implement `loadUsers` using a generator:

{% highlight javascript %}
function loadUsers() {
  spawn(function * () {
    var users = yield getJSON('users.json');
    for (var user of users.users_list.map(getJSON)) {
      console.log(yield user);
    }
  });
}
{% endhighlight %}

Looks much more elegant, doesn't it? Now lets trace what is actually going on under the hood. Let's try to implement `spawn`.

First of all, we should be aware of the fact that it accepts a generator function, so we should use it like:

{% highlight javascript %}
function spawn(genFunc) {
  var generator = genFunc();
  // ...
}
{% endhighlight %}

After the first invocation of our generator we will receive a promise:

{% highlight javascript %}
function spawn(genFunc) {
  var generator = genFunc();
  generator.next().value
  .then(function (users) {
    //...
  });
}
{% endhighlight %}

This snippet will invoke `getJSON` and will receive the returned promise (as `generator.next().value`). On resolve of the promise, the callback will be invoked with JavaScript object, equals to the parsed JSON we just fetched from `users.json`.

As next step we need to invoke the generator with the received object, this way the local variable `users` (inside `loadUsers`) will hold the correct value and we will have access to the `users_list` property, over which we need to iterate with `map`:

{% highlight javascript %}
function spawn(genFunc) {
  var generator = genFunc();
  generator.next().value
  .then(function (users) {
    generator.next(users).value
    .then(function (user1) {
      //...
    })
  });
}
{% endhighlight %}

Once we invoke the generator with the `users` object we continue the execution of the generator and enter the loop (`for...of`) where we invoke `yield` with the first promise. Once the promise is resolved we enter the `then` callback and we can request the second user:

{% highlight javascript %}
function spawn(genFunc) {
  var generator = genFunc();
  generator.next().value
  .then(function (users) {
    generator.next(users).value
    .then(function (user1) {
      generator.next(users).value
      .then(function (user2) {
        // Done!
      });
    })
  });
}
{% endhighlight %}
As you see we have a series of nested promise calls. We can generalize them into the following implementation of `spawn`:

{% highlight javascript %}
function spawn(genFunc) {
  var generator = genFunc();
  function co(type, arg) {
    var res;
    try {
      res = generator[type](arg);
    } catch (e) {
      return Promise.reject(e);
    }
    if (res.done) {
      if (type === 'throw') {
        return arg;
      } else {
        return res.value;
      }
    } else {
      return Promise.resolve(res.value)
      .then(function (val) {
        return co('next', val);
      }, function (err) {
        return co('throw', err);
      });
    }
  }
  co('next');
}
{% endhighlight %}

`Promise.resolve` has the same functionality as `Q.when`, everything else is quite straightforward.

Note that the following code fetches all users one by one in contrast to the callback and the pure promise solution, where we fetch the users simultaneously.
