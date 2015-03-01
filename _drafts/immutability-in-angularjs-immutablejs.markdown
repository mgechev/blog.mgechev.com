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

```
```
