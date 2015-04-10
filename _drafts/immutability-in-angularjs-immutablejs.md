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

