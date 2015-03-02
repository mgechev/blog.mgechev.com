---
title: Immutability in AngularJS
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

I have affinity to functional programming since my first year in college. During my first contact with a purely functional programming language (Haskell in my case) I didn't really understand all the advantages it provides, everything was just writing a cool recursive functions and solving algorithmic problems.

Later, when I started writing code, which was getting into production I started appreciating things like high-order functions, closures, curring, etc. I even wrote a blog post on topic ["Functional programming with JavaScript"](http://blog.mgechev.com/2013/01/21/functional-programming-with-javascript/).

Last a couple of years I had the hard task to write a complex UI. A lot of user inputs, which can change the model from different places, which potentially leads to inconsistent state of the application, a lot of bugs, which are hard to debug and find. Later ReactJS was released and I noticed the concept of the ["pure functions"](https://en.wikipedia.org/wiki/Pure_function). A react component gets rendered the same way when it receives the same input parameters and it has the same state. React even provides you the [PureRenderMixin](https://facebook.github.io/react/docs/pure-render-mixin.html), which can make the "pure component" rendering even faster!

React is awesome, there are no two opinions. I'm also a huge AngularJS fan. I few years ago I wrote the first [AngularJS Style Guide](https://github.com/mgechev/angularjs-style-guide), ["AngularJS in Patterns"](https://github.com/mgechev/angularjs-in-patterns), [AngularAOP](https://github.com/mgechev/angular-aop) and a few other AngularJS modules/components/examples, which got popular. So I started wondering whether I can use the same idea of immutability of the model in AngularJS, at least for accelerating the data-binding watchers.

## Immutable.js

On 28 of May, 2014, the first commit of [Immutable.js](https://github.com/facebook/immutable-js) was pushed in the facebook's organization on GitHub. Immutable.js is a set of immutable data structures (List, Set, Map, etc.) implemented in JavaScript. What exactly is an immutable data structure? Well it is a data structure, which can't change. Each action, which intends to change the collection creates a new one.

```javascript
let list = Immutable.List([1, 2, 3]);
let changed = list.push(4);
list.toString();    // List [ 1, 2, 3 ]
changed.toString(); // List [ 1, 2, 3, 4 ]
list === changed    // false
```

Compared to the mutable JavaScript lists:

```javascript
let list = [1, 2, 3];
list.push(4);
console.log(list); // [1, 2, 3, 4]
```

## AngularJS data-binding

There are a lot of posts about how the AngularJS data-binding and dirty checking works. I even created a light AngularJS implementation in order [to illustrate it](https://github.com/mgechev/light-angularjs/blob/master/src/Scope.js#L61-L80) better. Basically it involves a lot of evaluations and comparisons of the watched expression. For example:

```javascript
$scope.collection = generateHugeCollection();
$scope.$watchCollection('collection', function (val) {
  // do some stuff with the changed value
});
```

Once we register watcher, which watches the expression `'collection'`, the expression gets evaluated on each `$digest` loop at least once and its current value gets compared to the previous value on each evaluation. The evaluation of the expression is with constant complexity (`O(1)`), since it only involves lookup of the property `collection`, but the equality check has a linear complexity (`O(n)`) (in case `$watchCollection` is used, otherwise it could be worst).

Now imagine we have a few watchers of the same collection - in a directive, service and controller. This means that on each `$digest` loop we will need to do:

- evaluation of the expression
- **comparison** with the previous value

At least 3 times.


## How Immutable.js can help?

Since each immutable data-structure creates a new instance of itself on change we basically get different references when we add or remove elements. This drops the complexity of `$watchCollection` to `O(1)`, since now we don't need to loop over the entire collection in order to find the difference with the previous value. We simple compare the reference of the current collection with the previous one:

```javascript
previous === current // O(1)
```

## Immutable.js and AngularJS

Lets look at an example:

```javascript
var app = angular.module('sampleApp', []);

let SampleCtrl = ($scope) => {
  $scope.list = Immutable.List([1, 2, 3]);
};

app.controller('SampleCtrl', SampleCtrl);
```

```html
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
```

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

Not exactly what we wanted, right? What Immutable.js does it to wrap the plain JavaScript collection. So using the code above we don't iterate over the collection's elements but over the Immutable.js object properties instead. Each immutable collection has a method called `toJS`, which returns the JavaScript representation of the immutable data structure.

What we can do now? Well, we can simply watch `$scope.list.toJS()` instead of only `$scope.list`. Anyway, this will be far from effective:

```javascript
let list = Immutable.List([1, 2, 3]);
let jsList = list.toJS();
list.toJS() === jsList // false
```

This mean that Immutable.js creates a new JavaScript object for each call. Another thing we can do is to watch the inner collection, which is inside the immutable wrapper:

```javascript
$scope.$watchCollection(function () {
  return $scope.list._tail.array;
}, function (val) {
  // do something with the changed value
});
```

Each time you watch a private property a kitty, somewhere, suffer! There are two reasons this is a bad choice:

* This is a private property...The underlaying implementation may change so your code will break.
* This is a private property...There's different property for each immutable data collection.

So we need to definitely watch the immutable collection, this way we will:

* Take advantage of its immutability by checking whether it has changed with a constant complexity
* Use the public API, so we won't make any kitties suffer!

## Angular Immutable

In order to deal with this issue, I created a simple directive, which allows binding to Immutable.js collections. It's called `angular-immutable` and could be found in my [GitHub account](https://github.com/mgechev/angular-immutable).

Lets take a look at the code example, which uses `angular-immutable`:

```javascript
var app = angular.module('sampleApp', ['immutable']);

let SampleCtrl = ($scope) => {
  $scope.list = Immutable.List([1, 2, 3]);
};

app.controller('SampleCtrl', SampleCtrl);
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title></title>
</head>
<body ng-app="sampleApp" ng-controller="SampleCtrl">
  <ul>
    <li immutable="list" ng-repeat="item in list" ng-bind="item"></li>
  </ul>
</body>
</html>
```

### Result:

* 1
* 2
* 3

With only two slight changes we made it work! All we did was:

* Including the module `immutable` as dependency
* Adding the directive `immutable="list"`, which points the immutable data structure used.

## Angular Immutable Implementation

Since the whole library is implemented in only a few lines of code lets take a look at the `immutable` directive's implementation:

```javascript
/* global angular */

var immutableDirective = () => {
  let priority = 2000;
  let scope = true;
  let link = (scope, el, attrs) => {
    var expr = attrs.immutable;
    if (!(/^[a-zA-Z0-9_$]+$/).test(expr)) {
      return;
    }
    if (!scope[expr]) {
      console.warn('No ' + expr + ' property found.');
    }
    scope.$watch(() => {
      return scope.$parent[expr];
    }, (val) => {
      scope[expr] = val.toJS();
    });
  };
  return { priority, scope, link };
};

angular.module('immutable', [])
  .directive('immutable', immutableDirective);
```

`immutableDirective` is a directive, which has higher priority than `ng-repeat`. It creates a new scope, which prototypically inherits from the parent scope and defines a link function. Inside the link function, we make sure the value of the `immutable` attribute is a simple property (no expressions allowed), if it is we simply add a watcher to the `$parent`'s immutable property. Once the reference change we set the value of the property of the current state, named the same way as the parent's immutable one.

This way we:

* Take advantage of the immutability of the property by improving the runtime of the `$watch` function
* Do not change the implementation of already existing software (do not change `ng-repeat` neither Immutable.js), so we follow the Open-Closed principle
* We don't use any private properties

This approach has some limitations. For example, if the immutable value is result of some complex expression we watch we can't do anything.

## Benchmarks

![/images/unicorn.jpg]()

Using immutable data structures seems exciting and amazing! Anyway, it has some drawbacks. The `$watch` expressions became extremely fast but there's a big overhead of creating a new data structure once we add or remove items. This gets even slower when we have a complex nested composition.

So we have:

- Fast change detection
- Slow insertions and deletions

Definitely, this approach will be useful when we have a lot of watchers for a huge data-structure, which rarely changes. But how huge and how fast it can get?

In the benchmarks bellow I tried to find these answers.

## Test cases

I tried total 24 test cases - 12 for using immutable list and 12 for using plain JavaScript array. Since the biggest factors in this benchmark are the bindings count and the collection size I did a cross product between:

#### Bindings
- 1
- 5
- 10
- 20

#### Collection Size

- 100
- 1k
- 10k

### Plain JavaScript array

Here are the results I got from running the benchmark with plain JavaScript array:

|       | 1     | 5     | 10    | 20    |
|-------|-------|-------|-------|-------|
| 100   | 2.517 | 2.56  | 2.573 | 2.58  |
| 1000  | 2.555 | 2.675 | 2.747 | 2.853 |
| 10000 | 2.861 | 4.025 | 7.736 | 15.68 |

As you see when the collection gets bigger everything gets slower. When we increase the bindings (watchers), everything gets even slower because of the additional iterations.

### Immutable JavaScript list

These are the results running the same code with immutable data structure:

|       | 1     | 5     | 10    | 20    |
|-------|-------|-------|-------|-------|
| 100   | 2.81  | 2.675 | 2.899 | 2.658 |
| 1000  | 2.688 | 2.673 | 2.795 | 2.667 |
| 10000 | 2.864 | 2.676 | 2.92  | 2.708 |

Here the amount of bindings almost doesn't affects the performance of our application, since the complexity grow depends on the binding size, compared to the previous case where it depends on the both parameters.

The only expensive operation here is copying the immutable data structure on change.
