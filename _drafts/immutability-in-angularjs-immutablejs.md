---
title: Boost the Performance of an AngularJS Application Using Immutable Data - Part 2
author: minko_gechev
layout: post
categories:
  - JavaScript
  - AngularJS
  - Immutability
  - Functional Programming
  - Performance
  - Benchpress
tags:
  - Immutable.js
  - JavaScript
  - AngularJS
  - Benchpress
---

A few weeks ago I posted the article ["Boost the Performance of an AngularJS Application Using Immutable Data"](http://blog.mgechev.com/2015/03/02/immutability-in-angularjs-immutablejs/). It shows how to speedup your AngularJS application when you have bindings to big data collections. The idea behind the optimization is quite simple - create a new collection when the data changes. This way you can reduce the watchers execution from `O(n)` to `O(1)`.

In the post I did simple profiling using `Date` but it didn't give enough information in exactly which cases it is more suitable to use immutable data and when you should bet on the standard collections. It also didn't include any information about the garbage collection, although we know that using immutable collections will eventually lead to highly intensive memory management.

On ng-conf 2015, [Jeff Cross, gave a talk about Benchpress](https://www.youtube.com/watch?v=x1PJn5qMUT4), which fits perfectly for my profiling purposes. Basically, benchpress uses the WebDriver for Selenium, through protractor to profile your application. It can runs multiple samples in order to take the mean and give you a meaningful result. It also includes a few output values, most useful in my case were:

- `scriptTime` - the execution time of your script
- `gcTime` - time required for garbage collection of given sample

Benchpress can render the output of the bencharks as table, printed onto the `stdout` or save it into json files.


## Benchmarks

With collections you can have the following primitive operations:

- **C**reate a data collection
- **R**ead collection
- **U**pdate collection
- **D**elete collection

We can read the collection inside JavaScript or render it inside the templates. If we get new collection each time we need to perform an action over the stored data, we have immutable collection. We need to compare the current reference with the previous reference. If the references are not equal this means the collection has changed.
### Side note

*But what if we have:

{% highlight javascript %}

var a = [1, 2, 3];
function changeA() {
  a = [1, 2, 3];
}
var oldA = a;
changeA();
console.log(a === oldA); // false
console.log(angular.equals(a, oldA)); // true

{% endhighlight %}

So, if we strictly want to perform given action **only** when the structure of the collection or the data inside it have changed (not only the reference) we will need to loop over both collections (old one and new one) and check whether they contains the same data.*

If we delete, update or create additional entries inside the collection, this is considered as update. If we use immutable data, a new collection will be returned on each such manipulation:

{% highlight javascript %}
let list = Immutable.List([1, 2, 3]);

// update
let list1 = list.set(1, 42);
console.log(list === list1); // false
console.log(list.toJS()); // [ 1, 2, 3 ]
console.log(list1.toJS()); // [ 1, 42, 3 ]

// remove
let list2 = list.delete(0);
console.log(list === list2); // false
console.log(list.toJS()); // [ 1, 2, 3 ]
console.log(list2.toJS()); // [ 2, 3 ]

// insert (create entry)
let list3 = list.push(4);
console.log(list === list3); // false
console.log(list.toJS()); // [ 1, 2, 3 ]
console.log(list3.toJS()); // [ 1, 2, 3, 4 ]

{% endhighlight %}


