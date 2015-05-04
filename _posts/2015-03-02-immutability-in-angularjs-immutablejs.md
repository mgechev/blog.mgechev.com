---
title: Boost the Performance of an AngularJS Application Using Immutable Data
author: minko_gechev
layout: post
categories:
  - JavaScript
  - AngularJS
  - Immutability
  - Functional Programming
  - Performance
tags:
  - Immutable.js
  - JavaScript
  - AngularJS
---

I have affinity to functional programming since my first year in college. During my initial contact with a purely functional programming language (Haskell in my case) I didn't really understand all the advantages it provides, everything was reduced to just writing a cool recursive functions and solving algorithmic problems.

Later, when my code was used in production, I started appreciating things like high-order functions, closures, currying, etc. I even wrote a blog post on topic ["Functional programming with JavaScript"](http://blog.mgechev.com/2013/01/21/functional-programming-with-javascript/).

Last couple of years I had the hard task to write a complex UI. A lot of user inputs, which can change the model from different places and potentially lead to inconsistent state of the application, a lot of bugs, which are hard to debug and find. Later ReactJS was released and I noticed the concept of the ["pure functions"](https://en.wikipedia.org/wiki/Pure_function) in their UI components. A react component gets rendered the same way when it receives the same input parameters and it has the same state (if you implement it properly). React even provides the [PureRenderMixin](https://facebook.github.io/react/docs/pure-render-mixin.html), which can make the "pure component" rendering even faster!

React is awesome, there are no two opinions. I'm also huge AngularJS fan. A few years ago I wrote the first [AngularJS Style Guide](https://github.com/mgechev/angularjs-style-guide), ["AngularJS in Patterns"](https://github.com/mgechev/angularjs-in-patterns), [AngularAOP](https://github.com/mgechev/angular-aop) and a few other AngularJS modules/components/examples, which got popular. So I started wondering whether I can use the same idea of immutability of the model in AngularJS, at least for accelerating the data-binding watchers.

## Immutable.js

On 28 of May, 2014, the first commit of [Immutable.js](https://github.com/facebook/immutable-js) was pushed in the facebook's organization on GitHub. Immutable.js is a set of immutable data structures (List, Set, Map, etc.) implemented in JavaScript. What exactly is an immutable data structure? Well it is a data structure, which can't change. Each action, which intends to change the collection creates a new one.

{% highlight JavaScript %}
let list = Immutable.List([1, 2, 3]);
let changed = list.push(4);
list.toString();    // List [ 1, 2, 3 ]
changed.toString(); // List [ 1, 2, 3, 4 ]
list === changed    // false
{% endhighlight %}

Compared to the mutable JavaScript lists:

{% highlight JavaScript %}
let list = [1, 2, 3];
list.push(4);
console.log(list); // [1, 2, 3, 4]
{% endhighlight %}

## AngularJS data-binding

There are a lot of posts about how the AngularJS data-binding and dirty checking works. I even created a light AngularJS implementation in order [to illustrate it](https://github.com/mgechev/light-angularjs/blob/master/src/Scope.js#L61-L80) better. Basically it involves a lot of evaluations and comparisons of the watched expression and their results. For example:

{% highlight JavaScript %}
$scope.collection = generateHugeCollection();
$scope.$watchCollection('collection', function (val) {
  // do some stuff with the changed value
});
{% endhighlight %}

Once we register watcher, which watches the expression `'collection'`, the expression gets evaluated at least once on each `$digest` loop and its current value gets compared to the previous value on each evaluation. The evaluation of this expression is with constant complexity (`O(1)`), since it only involves lookup of the property `collection`, but the equality check has a linear complexity (`O(n)`) (in case `$watchCollection` is used, otherwise it could be worst).

Now imagine we have a few watchers of the same collection - in a directive, service and controller. This happens quite often, for example if you have a few bindings in the UI to the same value. This means that on each `$digest` loop we will need to:

- evaluate the expression
- **compare** the result with the previous value of the evaluation of the same expression

At least `n` times for `n` bindings.

## How can Immutable.js help?

Since each immutable data-structure creates a new instance of itself on change, we basically get different references when we add or remove elements. This drops the complexity of `$watch` to `O(1)`, since now we don't need to loop over the entire collection in order to find the difference with the previous value. We simple compare the reference of the current collection with the previous one:

{% highlight JavaScript %}
previous === current // O(1)
{% endhighlight %}

## Immutable.js and AngularJS

Lets create a simple example in which we bind with `ng-repeat` to immutable list and render it in our HTML page:

{% highlight JavaScript %}
var app = angular.module('sampleApp', []);

let SampleCtrl = ($scope) => {
  $scope.list = Immutable.List([1, 2, 3]);
};

app.controller('SampleCtrl', SampleCtrl);
{% endhighlight %}

{% highlight html %}
<!DOCTYPE html>
<html lang="en">
<head>
  <title></title>
</head>
<body ng-app="sampleApp" ng-controller="SampleCtrl">
  <ul>
    <li ng-repeat="item in list" ng-bind="item"></li>
  </ul>
</body>
</html>
{% endhighlight %}

### Result:

* false
* &nbsp;
* &nbsp;
* 3
* 5
* 0
* &nbsp;
* [object Object]
* 3

Not exactly what we wanted, right? What Immutable.js does is to wrap the plain JavaScript collection in a proxy. So using the code above we don't iterate over the collection's elements but over the Immutable.js' object properties instead. Each immutable collection has a method called `toJS`, which returns the JavaScript representation of the immutable data structure.

What we can do now? Well, we can simply watch `$scope.list.toJS()` instead of only `$scope.list`. Anyway, this will be far from effective:

{% highlight JavaScript %}
let list = Immutable.List([1, 2, 3]);
let jsList = list.toJS();
list.toJS() === jsList // false
{% endhighlight %}

This mean that Immutable.js creates a new JavaScript object for each call of `toJS`. Another thing we can do is to watch the inner collection, which is inside the immutable wrapper:

{% highlight JavaScript %}
$scope.$watchCollection(function () {
  return $scope.list._tail.array;
}, function (val) {
  // do something with the changed value
});
{% endhighlight %}

Each time you watch a private property a kitty, somewhere, suffer! There are two reasons this is a bad choice:

* This is a private property...The underlaying implementation of Immutable.js may change so your code will break.
* This is a private property...There's a property with different name for each immutable data collection (Map, Set, List...).

So we definitely need to watch the immutable collection, this way we will:

* Take advantage of its immutability by checking whether it has changed with a constant complexity (comparing the references).
* Use the public API, so we won't make any kitties suffer!

## Angular Immutable

In order to deal with this issue, I created a simple filter, which allows binding to Immutable.js collections. It's called `angular-immutable` and could be found in my [GitHub account](https://github.com/mgechev/angular-immutable) (also published as a bower module `angular-immutable`).

Lets take a look at the code example, which uses `angular-immutable`:

{% highlight JavaScript %}
var app = angular.module('sampleApp', ['immutable']);

let SampleCtrl = ($scope) => {
  $scope.list = Immutable.List([1, 2, 3]);
};

app.controller('SampleCtrl', SampleCtrl);
{% endhighlight %}

{% highlight html %}
<!DOCTYPE html>
<html lang="en">
<head>
  <title></title>
</head>
<body ng-app="sampleApp" ng-controller="SampleCtrl">
  <ul>
    <li ng-repeat="item in list | immutable" ng-bind="item"></li>
  </ul>
</body>
</html>
{% endhighlight %}

### Result:

* 1
* 2
* 3

With only two slight changes we made it work! All we did was:

* Include the module `immutable` as dependency
* Add the filter `immutable`, which provides `ng-repeat` a plain JavaScript collection

## Angular Immutable Implementation

Since the whole library is implemented in only a few lines of code lets take a look at the `immutable` filter's source code:

{% highlight JavaScript %}
/* global angular, Immutable */

var immutableFilter = () => {
  return (val) => {
    if (val instanceof Immutable.Collection) {
      return val.toJS();
    }
    return val;
  };
};

angular.module('immutable', [])
  .filter('immutable', immutableFilter);
{% endhighlight %}

`immutableFilter` simply checks if the input is an instance of `Immutable.Collection` (an "abstract class", base for all immutable collections in Immutable.js). If the input is an immutable collection it returns its JavaScript representation, otherwise it returns the input itself.

This way we:

* Take advantage of the immutability of the property by improving the runtime of the `$watch` function
* Do not change the implementation of already existing software (do not change `ng-repeat` neither Immutable.js), so we follow the Open-Closed principle
* We don't use any private properties

This approach has some limitations. For example, if the immutable value is result of some complex expression we can't do anything.

## Benchmarks

[![](/images/unicorn.jpg)](/images/unicorn.jpg)

Using immutable data structures seems exciting and amazing! Anyway, it has some drawbacks. The `$watch` expressions became extremely fast but there's a big overhead of creating a new data structure once we add or remove items. This gets even slower when we have a complex nested composition.

So we have:

- Fast change detection
- Slow insertions and deletions

Definitely, this approach will be useful when we have a lot of watchers for a huge data-structure, which rarely changes. But how huge and how fast it can get?

In the benchmarks bellow I tried to find these answers.

## Test cases

I run 24 tests - 12 using immutable list and 12 using plain JavaScript array. Since the biggest factors in this benchmark are the number of bindings and the collection size I did the cross product between:

#### Bindings
- 1
- 5
- 10
- 20

#### Collection Size

- 100
- 1k
- 10k

The code I run is:

{% highlight JavaScript %}
function SampleCtrl($scope, $timeout) {
  'use strict';
  // Current runs count
  var runs = 0;

  // Defines the amount of changes of the array
  var TOTAL = 500;
  var start = Date.now();
  $scope.$watchCollection('list', function () {});

  // Generates a random collection
  $scope.list = buildCollection(SIZE);
  function changeCollection() {
    if (runs >= TOTAL) {
      console.log('%cDone!',
          'font-size: 50px; color: blue;' +
          'font-weight: bold; font-family: impact;');
      console.log('%c' + ((Date.now() - start) / 1000) +
          ' seconds required.', 'font-size: 30px; color: red;');
      return;
    }
    $timeout(function () {
      // Changes random index of the array
      var idx = Math.floor(Math.random() * (SIZE - 1));
      $scope.list[idx] = Math.random();
      runs += 1;
      changeCollection();
    }, 0);
  }
  changeCollection();
}
{% endhighlight %}

The code for Immutable.js is similar except that the body of `$timeout` looks like:

{% highlight JavaScript %}
var idx = Math.floor(Math.random() * (SIZE - 1));
$scope.list = $scope.list.set(idx, Math.random());
{% endhighlight %}

And here is the markup, which I used:

{% highlight html %}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>
</head>
<body ng-app="sampleApp" ng-controller="SampleCtrl">
<script src="/scripts/all.js"></script>
</body>
</html>
{% endhighlight %}

### Results

#### Plain JavaScript array

Here are the results I got from running the benchmark with plain JavaScript array:

|       | 1     | 5     | 10    | 20    |
|-------|-------|-------|-------|-------|
| 100   | 2.517 | 2.56  | 2.573 | 2.58  |
| 1000  | 2.555 | 2.675 | 2.747 | 2.853 |
| 10000 | 2.861 | 4.025 | 7.736 | 15.68 |

When the collection gets bigger the test case running time gets slower. When we increase the bindings (watchers), everything gets even slower because of the additional iterations performed by `$watchCollection`.

#### Immutable JavaScript list

Here are the results running the same code with immutable list:

|       | 1     | 5     | 10    | 20    |
|-------|-------|-------|-------|-------|
| 100   | 2.696 | 2.507 | 2.562 | 2.569 |
| 1000  | 2.715 | 2.54  | 2.569 | 2.49  |
| 10000 | 2.832 | 2.538 | 2.599 | 2.708 |


We see how much better performance the Immutable.js collection has. Once we increase the collection size and the number of watchers the running time of the `Plain JavaScript array` test case grows exponentially. In the case of immutable data the running time stays stable.

On the other hand, since when using immutable list, the watcher runs with a constant complexity we have only the simple overhead caused by creating a new data-structure on each change.

### DOM rendering

Lets explore what will happen if we render the collection we used for profiling. For testing the immutable list I used this markup:

{% highlight html %}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>
</head>
<body ng-app="sampleApp" ng-controller="SampleCtrl">
<ul>
  <li immutable="list" ng-repeat="item in list track by $index" ng-bind="item"></li>
</ul>
<script src="/scripts/all.js"></script>
</body>
</html>
{% endhighlight %}

And for testing the plain JavaScript array I used the same markup with the `immutable` attribute removed. I changed the parameters of these test cases to:

#### Collection Size

- 10k

#### Bindings count

- 1
- 5
- 15
- 25
- 30

The watcher added by `ng-repeat` is being ignored for now.

And here are the results:

|           | 1      | 5      | 15     | 25     | 30     |
|-----------|--------|--------|--------|--------|--------|
| Immutable | 14.714 | 14.296 | 14.8   | 14.489 | 14.331 |
| Plain     | 13.308 | 15.689 | 23.415 | 19.986 | 27.526 |


Here is a chart for better understanding of the benchmark:

[![](/images/immutable-angular/immutable-angular-1.png)](/images/immutable-angular/immutable-angular-1.png)

Initially the plain JavaScript array does better but once we increase the number of bindings the performance decreases dramatically.

But lets go a little bit further...Lets do CPU profiling for the test cases, which runs with immutable collection and 30 watchers.

[![](/images/immutable-angular/cpu-profile.png)](/images/immutable-angular/cpu-profile.png)

The biggest slowdown comes from the watcher added by `ng-repeat`. Lets dig into AngularJS's source code and change that watcher to a simple `$watch` instead of `$watchCollection` (**do not do this in AngularJS copy you are going to use in production otherwise `ng-repeat`'s binding will not work with mutable data structures**) and see what will happen...

[![](/images/immutable-angular/immutable-watch.png)](/images/immutable-angular/immutable-watch.png)

After running the 30 bindings benchmark with the immutable list with changed `ng-repeat`'s implementation, we got almost 1 second improvement!

### Heap Profiling

In order to make this performance test complete, lets profile the memory usage!

When running the Chrome DevTools Heap Profiler, in the test case with 30 watchers and plain JavaScript object, we get pretty low memory usage:

[![](/images/immutable-angular/plain-memory.png)](/images/immutable-angular/plain-memory.png)

As expected, when using Immutable.js the memory usage is a bit higher because of the overhead of creating new data structure on change.

[![](/images/immutable-angular/immutable-memory.png)](/images/immutable-angular/immutable-memory.png)

## Conclusion

The benchmarks I did aren't using the best profiling APIs available nowadays, probably a better idea would be to use [benchpress](https://github.com/angular/angular/tree/master/modules/benchpress) instead but they still give quite accurate perspective of when it is reasonable to use immutable data structures in an AngularJS application.

The main content of the blog post clearly shows that, when dealing with a big data set with a lot of bindings it is definitely a good idea to make it immutable, especially if it changes rarely. Model's immutability boost the performance of the watchers, checking for change, by allowing them to use simple equality check instead of linear algorithm.

On the other hand, we noticed that we have a little overhead by the creation of the immutable data on change. We also have a slightly bigger memory usage, which when dealing with enormous amount data might be a deal breaker.

### Place for improvement

In the package [`angular-immutable`](https://github.com/mgechev/angular-immutable) I implemented a filter, which allows iterating over immutable data structures and binding to them (using `ng-repeat`, `ng-bind`, for example). Unfortunately, this filter allows only one-way data-binding. Two places for improvements are:

- Allow two-way data-binding to immutable data
- Implement optimized version of `ng-repeat`, which uses `$watch` instead of `$watchCollection`, for increasing the watcher's speed.

## Parts of the series:

- [Boost the Performance of an AngularJS Application Using Immutable Data - Part 1](http://blog.mgechev.com/2015/03/02/immutability-in-angularjs-immutablejs/)
- [Boost the Performance of an AngularJS Application Using Immutable Data - Part 2](http://blog.mgechev.com/2015/04/11/immutability-in-angularjs-immutablejs-part-2/)
- [Even Faster AngularJS Data Structures](http://blog.mgechev.com/2015/04/20/fast-angular-data-structures-versionable/)

