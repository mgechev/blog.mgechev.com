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

[On 18th of September 2014](https://github.com/angular/angular/commits/master?page=24) was pushed the initial commit of version 2.0 of the AngularJS framework. A few weeks ago the core team at Google, published AngularJS' 2.0 [website](https://angular.io/) and gave a couple of talks on [ng-conf](https://www.youtube.com/watch?list=PLOETEcp3DkCoNnlhE-7fovYvqwVPrRiY7&v=QHulaj5ZxbI) about their new router, change detection, templating, etc. Since I'm passionate about AngularJS since its early versions I decided give it a try using the [quick start](https://angular.io/docs/js/latest/quickstart.html). In the meantime I and also created an [angular2-seed project](https://github.com/mgechev/angular2-seed) for my test, dummy projects. In order to have a better understanding of what is going on (and handle the lack of documentation) I dug inside their source code. I had great time doing this, what I saw was one of the most well written and smartest pieces of software I've ever read. Soon I'm planning to expand my paper ["AngularJS in Patterns"](https://github.com/mgechev/angularjs-in-patterns) with design patterns used inside AngularJS 2.0.

In this blog post I'll share my first impressions of the framework and I'll try to keep them as less subjective as possible, although my affinity to AngularJS. I'll start with the general changes and after that keep going into details.

## Written in TypeScript

As Microsoft already published, [AngularJS 2.0 is written in extended version of TypeScript, called AtScript](http://blogs.msdn.com/b/typescript/archive/2015/03/05/angular-2-0-built-on-typescript.aspx). There are a couple of advantages using strongly typed language and a couple of more advantages using exactly TypeScript. By "extended version of TypeScript" I mean, TypeScript with added annotations (similar to the annotations in Java).

And here are some of the main advantages using TypeScript as statically typed language:

- Using statically typed language:
  - You get type errors **compile-time** and run-time. This way it'll be easier to debug your code and you will be more secure that what you've developed (in this case AngularJS 2.0) actually works. When it happens to develop a single-page application, bigger than 10k lines of code, the lack of compile-time checking leads to quite painful experience, even with big test coverage of your code.
  - You get better auto-completion by the text editors and IDEs. [WebStorm 10 supports TypeScript 1.5 + decorators and ES6 modules](https://www.jetbrains.com/webstorm/whatsnew/). For vim you can use the [typescript-tools](https://github.com/clausreinke/typescript-tools), which could be integrated with EMACS and SublimeText. You will get hints for method names, parameters, parameters types by your editor/IDE for each AngularJS method (yes, with Tern.js or Flow you can get the same experience but based on JSDoc or some very sophisticated decisions based on the AST of your code, now it'll be much less tricky).
  - The JavaScript VM is able to make better code optimizations. Since when we define that given property/variable has specific type we sign some kind of contract with the JavaScript VM, this way it is much easier for it to reason about the types of the variables, which are being used and to do better run-time optimizations ([for instance](https://github.com/sq/JSIL/wiki/Optimizing-dynamic-JavaScript-with-inline-caches)).
- About TypeScript:
  - TypeScript is superset of ES6, which is superset of ES5 (ES5 ⊆ ES6 ⊆ TypeScript ⊆ AtScript). AngularJS 2.0 production build is being transpiled to ES5 in order to be executable by the modern browsers. You also can chose whether you want to write your code in ES5, ES6, TypeScript or AtScript (of course if you chose ES6, TypeScript or AtScript your code should go through a process of compilation in order to be transpiled).
  - TypeScript is being one of the best languages, which are being transpiled to JavaScript, which has allows optional type checking.
  - TypeScript is developed and supported by Microsoft, which gives us stability that it is unlikely the support to be dropped unexpectedly.

Does the run-time type checking lead to slower execution of your application? Probably yes, but you can disable it when you plan to deploy your app in production.

## AngularJS 2.0 has No Controllers

It seems it got modern for the JavaScript MVW frameworks to drop controllers from their components (starting from Backbone.js). Instead of using controllers, AngularJS 2.0 bet on component-based UI, similar to ReactJS. The core team dropped controllers but added three different types of directives:

- Components - which are supposed to be high-level UI components, which include some business logic as well (i.e. directive + controller). In order to make your transition from 1.x to 2.0 there are [some suggestions](http://jaysoo.ca/2015/03/30/container-component-pattern-in-angular-1/) of using directives, which simulate the behavior of the components, instead of using controllers.
- Viewports
- ---------

## Now Two-Way data-binding

One of the things AngularJS 1.x was loved about was the two-way data-binding using `ng-model`. Well, it is dropped in v2.0. Initially it might seems a bit weird, crazy and frustrating but it is actually a really good thing. Removing the two-way data-binding leads to:

- More explicit data-flow
- No circular dependencies between bindings (so no TTL of the `$digest`)
- Performance
  - The digest loop could be run only once
  - We can create apps, which are friendly to immutable data, which allows us to make further optimizations (for more information take a look at my talk at `ng-vegas`)

## WebComponents

In the core of AngularJS 2.0 are embedded the web standards. The "new directives" have their own shadow-root. I'm one of the fens of the Shadow DOM, mostly because of the encapsulation it provides.

## Real Modules

During the AngularJS classes I led I had troubles explaining why AngularJS has modules, which must be loaded explicitly but there's now way to load them asynchronously, without hacky solutions. Well, AngularJS 2.0 uses the ES6 modules. Since they are not supported by the browsers yet, you can fallback to [SystemJS](https://github.com/systemjs/systemjs) and [ES6-module loader](https://github.com/ModuleLoader/es6-module-loader/), or transpile them to AMD, CommonJS or whatever you find [suitable for yourself](https://github.com/google/traceur-compiler/wiki/Options-for-Compiling#options-for-modules).

This allows creating bundles with the modules, which are required during the initial page load and loading all others on demand, asynchronously. That's one of the things I've always dreamed of and I'm kind of disappointed it is added at this late stage.

## No more $scope

There are a lot of statements the `$scope` was tricky for explanation concept of the AngularJS application to beginners in the framework. Well, I had harder times explaining the module system, anyway, `$scope` now do not exists! Yeah, we have no scope anymore. Instead of binding to properties in the scope inside our templates, we directly bind to properties of our "components".

For example, the component bellow has selector `sample-app` (i.e. we can use it as `<sample-app></sample-app>`) and template located inside `./templates/sample-app.html` (you can find the whole source code at my [GitHub repository](https://github.com/mgechev/angular2-seed)).

```javascript
@Component({
  selector: 'sample-app',
  componentServices: [
    NameList
  ]
})
@Template({
  url: './templates/sample-app.html',
  directives: [Foreach]
})
class SampleApp {
  constructor() {
    this.names = NameList.get();
    this.newName = '';
  }
  addName(newname) {
    this.names.push(newname.value);
    newname.value = '';
  }
}
```
We can directly bind to `this.names` inside our template, like this:

```html
...
<ul>
  <li *foreach="#name in names">{{name}}</li>
</ul>
...
```
No scope at all! Awesome, isn't it? So far, so good. We do not have scope. But remember, we used to use `$scope.$apply` in order to force execution of the `$digest` loop? How are we going to do this now? Well, we cant.

## No more $scope.$apply

But how then AngularJS knows that anything outside it's execution concept has taken a place? Lets think where the changes might come from:

- `setTimeout`
- `setInterval`
- `prompt` (yeah, there are people who still use it...)
- `XMLHttpRequest`
- `WebSockets`
- ...

Basically a lot of browsers' APIs. How we can be notified when the user invokes method from any of the browsers' APIs? **Well...we can monkey patch all of them!** That's what Brian Ford explained in his [talk about `Zone.js` in ng-conf 2014](https://www.youtube.com/watch?v=3IqtmUscE_U).

I bet now you're thinking - "Oh God! Why I'd use something, which monkey patches all the browser APIs? This is just not right!". But why it isn't?

- Might create additional bugs of the methods are not patched properly. Very smart people work on making Zone.js patch the APIs without any issues and it has [solid amount of tests](https://github.com/angular/zone.js/tree/master/test).
- May slowdown the method executions. It turned out it is not such a big issue if you wrap a function execution inside another function. --------------

## Errors in the Template Expressions

Another thing I didn't really like in AngularJS 1.x was the lack of errors when you make a mistake inside an expression used in a template. The errors, which you were supposed to get were omitted and you weren't aware that your code actually doesn't work. Well, in AngularJS 2.0 you will get runtime errors in such cases.

## Ultra Fast Change Detection

It is still not clarified how the change detection will be actually implemented. The AngularJS team is still making tests and running benchmarks in order to decide what are the appropriate change detection strategies in specific cases. Another completely innovative idea I found, digging inside their source code was inside the `JITChangeDetector`. Since, mostly because of the inline-caches, the JavaScript VMs are capable of doing smarter optimizations in expressions like:

```javascript
this.value === oldValue;
```

The AngularJS team decided that they can generate JavaScript classes, which implement this change detection behavior, instead of using method calls (take a look [at these benchmarks](http://jsperf.com/object-observe-polyfill-sandbox)).
