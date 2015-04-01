---
title: AngularJS 2: First Impressions
author: minko_gechev
layout: post
categories:
  - JavaScript
  - AngularJS
  - AngularJS 2
  - Introduction
tags:
  - AngularJS
  - AngularJS 2
  - JavaScript
---

[18th of September 2014](https://github.com/angular/angular/commits/master?page=24) the initial commit of version 2.0 of the AngularJS framework was pushed. A few weeks ago Google published AngularJS' 2.0 [website](https://angular.io/) and gave a couple of talks on [ng-conf](https://www.youtube.com/watch?list=PLOETEcp3DkCoNnlhE-7fovYvqwVPrRiY7&v=QHulaj5ZxbI) about their new router, change detection, templating and so on. Since I'm passionate about the AngularJS framework since its early versions I decided to dig a little bit using the [quick start](https://angular.io/docs/js/latest/quickstart.html) and also built an [angular2-seed](https://github.com/mgechev/angular2-seed) for my test, dummy projects. I also had great time reading some of the code in their repository, which is one of the most well written and smartest pieces of software I've ever read. So soon I'll expand my paper ["AngularJS in Patterns"](https://github.com/mgechev/angularjs-in-patterns) with design patterns used inside AngularJS 2.0.

In this blog post I'll share my first impressions of the framework and I'll try to keep them as less subjective as possible. I'll start with the general changes and after that keep going into details.

## Written in TypeScript

As we already know, [AngularJS 2.0 is written in extended version of TypeScript, called AtScript](http://blogs.msdn.com/b/typescript/archive/2015/03/05/angular-2-0-built-on-typescript.aspx). There are a couple of advantages using strongly typed language and a couple of more advantages using exactly TypeScript. By "extended version of TypeScript" I mean, TypeScript with added annotations (similar to the annotations in Java).

And here are some of the main advantages:

- Using strongly typed language:
  - You get type errors compile-time and run-time. This way it'll be easier to debug the software and will be more secure that what you've developed (in this case AngularJS 2.0) actually works.
  - You get better auto-completion by the text editors and IDEs. [WebStorm 10 supports TypeScript 1.5 + decorators and ES6 modules](https://www.jetbrains.com/webstorm/whatsnew/). For vim you can use the [typescript-tools](https://github.com/clausreinke/typescript-tools), which could be integrated with EMACS and SublimeText.
  - The JavaScript VM is able to make better code optimizations. Since when we define that given property/variable has specific type we sign some kind of contract, it is much easier for the JavaScript VM to reason about the types of the variables, which are being used and to do better run-time optimizations ([for instance](https://github.com/sq/JSIL/wiki/Optimizing-dynamic-JavaScript-with-inline-caches)).
- About TypeScript:
  - TypeScript is superset of ES6, which is superset of ES5 (ES5 ⊆ ES6 ⊆ TypeScript ⊆ AtScript). AngularJS 2.0 production build is being transpiled to ES5 in order to be executable by the modern browsers. You also can chose whether you want to write your code in ES5, ES6, TypeScript or AtScript (of course if you chose ES6, TypeScript or AtScript your code should go through a process of compilation in order to be transpiled).
  - TypeScript is being one of the best languages, which are being transpiled to JavaScript, which has allows optional type checking.
  - TypeScript is developed and supported by Microsoft, which gives us stability that it is unlikely the support to be dropped unexpectedly.

## AngularJS 2.0 has No Controllers

It seems it got modern for the JavaScript MVW frameworks to drop controllers from their components (starting from Backbone.js). Instead of using controllers, AngularJS 2.0 bet on component-based UI, similar to ReactJS.
