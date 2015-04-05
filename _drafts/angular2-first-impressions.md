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

![JavaScript Dialects](/images/js-dialects-ven.png)

And here are some of the main advantages using TypeScript as statically typed language:

- Using statically typed language:
  - You get type errors **compile-time** and run-time. This way it'll be easier to debug your code and you will be more secure that what you've developed (in this case AngularJS 2.0) actually works. When it happens to develop a single-page application, bigger than 10k lines of code, the lack of compile-time checking leads to quite painful experience, even with big test coverage of your code.
  - You get better auto-completion by the text editors and IDEs. [WebStorm 10 supports TypeScript 1.5 + decorators and ES6 modules](https://www.jetbrains.com/webstorm/whatsnew/). For vim you can use the [typescript-tools](https://github.com/clausreinke/typescript-tools), which could be integrated with EMACS and SublimeText. You will get hints for method names, parameters, parameters types by your editor/IDE for each AngularJS method (yes, with Tern.js or Flow you can get the same experience but based on JSDoc or some very sophisticated decisions based on the AST of your code, now it'll be much less tricky).
  - The JavaScript VM is able to make better code optimizations. Since when we define that given property/variable has specific type we sign some kind of contract with the JavaScript VM, this way it is much easier for it to reason about the types of the variables, which are being used and to do better run-time optimizations ([for instance](https://github.com/sq/JSIL/wiki/Optimizing-dynamic-JavaScript-with-inline-caches)).
- About TypeScript:
  - TypeScript is superset of ES6, which is superset of ES5 (ES5 ⊆ ES6 ⊆ TypeScript ⊆ AtScript). AngularJS 2.0 production build is being transpiled to ES5 in order to be executable by the modern browsers. You also can chose whether you want to write your code in ES5, ES6, TypeScript or AtScript (of course if you chose ES6, TypeScript or AtScript your code should go through a process of compilation in order to be transpiled).
  - TypeScript is being one of the best languages, which are being transpiled to JavaScript, which has allows optional type checking.
  - TypeScript is developed and supported by Microsoft, which gives us stability that it is unlikely the support to be dropped unexpectedly.

### Quick FAQ:

*Does the run-time type checking lead to slower execution of your application?*<br>
Probably yes, but you can disable it when you plan to deploy your app in production.

*Shold I use TypeScript for my AngularJS 2.0 application?*<br>
It is not necessary but I'd recommend you to do so, because of all the benefits I mentioned above. Actually you even don't have to use ES6, but I'd even more strongly recommend you to do so.

*How can I take advantage of it? Should I use Visual Studio or something?*<br>
No. You can use the [traceur compiler](https://github.com/google/traceur-compiler) and a task runner, like gulp or grunt, with the corresponding plugins ([here](https://github.com/sindresorhus/gulp-traceur) and [here](https://github.com/aaronfrost/grunt-traceur)).

## AngularJS 2.0 has no Controllers

It seems it got modern for the JavaScript MVW frameworks to drop controllers from their components (starting from Backbone.js). Instead of using controllers, AngularJS 2.0 bet on component-based UI, similar to ReactJS. The core team dropped controllers but added...

## three different types of directives:

> - Component is a directive which uses shadow DOM to create encapsulate visual behavior. Components are typically used to create UI widgets or to break up the application into smaller components.
>   - Only one component can be present per DOM element.
>   - Component's CSS selectors usually trigger on element names. (Best practice)
>   - Component has its own shadow view which is attached to the element as a Shadow DOM.
>   - Shadow view context is the component instance. (i.e. template expressions are evaluated against the component instance.)
> - Viewport. According to the AngularJS docs, viewport is a directive which can control instantiation of child views which are then inserted into the DOM. (Examples are if and for.)
>   - Viewports can only be placed on <template> elements (or the short hand version which uses <element template> attribute.)
>   - Only one viewport can be present per DOM template element.
>   - The viewport is created over the template element. This is known as the ViewContainer.
> Viewport can insert child views into the ViewContainer. The child views show up as siblings of the Viewport in the DOM.
> - Decorator. According to the AngularJS docs (still incomplete) decorators are the simplest kind of directive is a decorator. Directives are usefull for encapsulating behavior.
>   - Multiple decorators can be placed on a single element.
>   - Decorators do not introduce new evaluation context.
>   - Decorators are registered through the @Decorator meta-data annotation.

### Quick FAQ:

*Similar to React? Does that mean that we have to inline our markup inside the directives we define?*<br>
You can but you don't have to. You can use inline templates or external files (just like using `template` and `templateUrl` in AngularJS 1.x.x).

*Does that mean that I need to change the design of the whole app, i.e. turn each controller to a directive of type component?*<br>
No, you don't have to change the design of your app. In order to make the transition even smoother you can use the ["Container component pattern"](http://jaysoo.ca/2015/03/30/container-component-pattern-in-angular-1/)

*Do I have to rewrite everything I already have?*<br>
Very likely, but if you've structured your application properly (i.e. followed my style guide), you'd be able to completely reuse at least your services.

## Now Two-Way data-binding

One of the things AngularJS 1.x was loved about was the two-way data-binding using `ng-model`. Well, it is dropped in v2.0. Initially it might seems a bit weird, crazy and frustrating but it is actually a really good thing, do not be heartbroken. Removing the two-way data-binding leads to:

- More explicit data-flow
- No circular dependencies between bindings (so no TTL of the `$digest`)
- Better performance
  - The digest loop could be run only once
  - We can create apps, which are friendly to immutable/observable models, which allows us to make further optimizations (for more information about immutable data take a look at [my talk at `ng-vegas`](http://www.ng-vegas.org/) or this great [post by Victor Savkin](http://victorsavkin.com/post/110170125256/change-detection-in-angular-2), a core member of the AngularJS team)

### Quick FAQ:

*Does that mean that we'll do a lot of manual work building forms?*<br>
No. AngularJS 2.0 has a great [forms module](http://angularjs.blogspot.com/2015/03/forms-in-angular-2.html).

*So AngularJS 2.0 is basically ReactJS implemented by Google?*<br>
No. The binding mechanism is completely different, it provides wider functionality than React (AngularJS 2.0 is lighter compared to AngularJS 1.x but still provides built-in directives, dependency injection, different components, etc.). This does not mean that you should drop using React and wait for AngularJS 2.0, for example in a project I started a few weeks ago I choose to use ReactJS instead. It completely depends on the application you are going to build and the business goals you have.

*Single directional data flow...We can use Flux then?*<br>
Yes you can! I'd even recommend to use Flux! Here is one more [great post by Victor Savkin about using Flux with AngularJS](http://victorsavkin.com/post/99998937651/building-angular-apps-using-flux-architecture).

## WebComponents

<blockquote class="twitter-tweet" lang="en"><p>Angular v2 doesn&#39;t seem like a &quot;framework&quot;, but more like a library that sits on top of the web standards. And this my friends, is awesome.</p>&mdash; Adam Bradley (@adamdbradley) <a href="https://twitter.com/adamdbradley/status/565518739056373763">February 11, 2015</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

What exactly is framework and what is a library? Lets take a look at AngularJS' docs:

>The impedance mismatch between dynamic applications and static documents is often solved with:
>a library - a collection of functions which are useful when writing web apps. Your code is in charge and it calls into the library when it sees fit. E.g., jQuery.
>frameworks - a particular implementation of a web application, where your code fills in the details. The framework is in charge and it calls into your code when it needs something app specific. E.g., durandal, ember, etc.

I wouldn't call AngularJS 2.0 a library but it is much closer to library rather than AngularJS 1.x. Anyway, what matters mostly is that it is on top of web standards. It uses shadow DOM for better encapsulation of the directives, takes advantage of other things web components provide like custom elements, etc.

### Quick FAQ:

*So I can't use AngularJS 2.0 in IE and any other browser which doesn't support Web Components?*<br>
You can. There are a lot of [polyfills](http://webcomponents.org/polyfills/), which handle the lack of support.

## Real Modules

During the AngularJS classes I led I had troubles explaining why AngularJS has modules, which must be loaded explicitly but there's no way to load them asynchronously, without hacky solutions. Well, AngularJS 2.0 uses the ES6 modules. Since they are not supported by the browsers yet, you can fallback to [SystemJS](https://github.com/systemjs/systemjs) and [ES6-module loader](https://github.com/ModuleLoader/es6-module-loader/), or transpile them to AMD, CommonJS or whatever you find [suitable for yourself](https://github.com/google/traceur-compiler/wiki/Options-for-Compiling#options-for-modules).

This allows creating bundles with the modules, which are required during the initial page load and loading all others on demand, asynchronously. That's one of the things I've always dreamed of and I'm kind of disappointed it is added at this late stage.

## No more $scope

There are a lot of statements the `$scope` was a tricky for explanation concept to the AngularJS beginners. Well, I had harder times explaining the module system, anyway, there's no such thing as `$scope` in AngularJS 2.0! There is no scope. Instead of binding to properties in the scope inside our templates, we directly bind to properties of our "components".

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
No scope at all! Awesome, isn't it? So far, so good. We do not have scope. But remember, we used to use `$scope.$apply` in order to force execution of the `$digest` loop and perform dirty checking? How are we going to do this now? Well, we cant.

*I like the scope, I was able to explicitly state what I want to expose to my templates. Are there any advantages removing the scope except of "hard to explain to beginners"?*<br>
Some of the biggest memory leaks I've ever had were caused by forgetting to destroy the `$scope` of given directive. Removing scope leads to less AngularJS components, so less bugs, lower complexity. A lot of people were doing things which sometimes looked like workarounds, when inheriting the scope (thinking they've inherited the controller), doing complex publish/subscribe messaging between parent and child scopes etc. All these things will not be required anymore.

## No more $scope.$apply

But how then AngularJS knows that anything outside it's execution context has taken a place? Lets think where the changes might come from:

- `setTimeout`
- `setInterval`
- `prompt` (yeah, there are people who still use it...)
- `XMLHttpRequest`
- `WebSockets`
- ...

![All The Things](/images/monkey-patch-all-the-things.png)

Basically a lot of browsers' APIs. How we can be notified when the user invokes method from any of these APIs? **Well...we can monkey patch all of them!** That's what Brian Ford explained in his [talk about `Zone.js` in ng-conf 2014](https://www.youtube.com/watch?v=3IqtmUscE_U).

I bet now you're thinking - "Oh God! Why I'd use something, which monkey patches all the browser APIs? This is just not right!". But why it isn't?

### Quick FAQ:

*Will patching the browser's APIs lead to huge amount of bugs?*<br>
Very smart people, who know what they are doing, work on making Zone.js patch the APIs without any issues. It also has [solid amount of tests](https://github.com/angular/zone.js/tree/master/test).

*Will using Zone.js slowdown the method executions?*<br>
According to the talk about [Zone.js](https://www.youtube.com/watch?v=3IqtmUscE_U), this is not the case.

## Errors in the Template Expressions

Another thing I didn't really like in AngularJS 1.x was the lack of errors when you make a mistake inside an expression used in a template. The errors, which you were supposed to get were omitted and you weren't aware that your code actually doesn't work. Well, in AngularJS 2.0 you will get runtime errors in such cases.

## i18n

`angular-translate` was the default choice when it used to came to internationalization and localization in AngularJS 1.x. It is a great tool, which allows you to define the different strings used inside your AngularJS application in json files and include them on the correct places using filters and directives. You are able to define different translations of these strings, using multiple json files for the languages you need. The language files are loaded on demand.

Since the AngularJS team has slightly broader vision for the way the i18n should be implemented they will add it as a project supported by Google. They will allow building the AngularJS templates with the correct strings embedded inside them. This will speedup the load time of your applications since you won't need to load external files. AngularJS 1.4 has support for plurals and gender (which may ease the transition), in AngularJS 2 will be implemented the string interpolation. For further information on the topic take a look at this video:

<iframe width="560" height="315" src="https://www.youtube.com/embed/iBBkCA1M-mc?list=PLOETEcp3DkCoNnlhE-7fovYvqwVPrRiY7" frameborder="0" allowfullscreen></iframe>

### Quick FAQ:

*Will `angular-translate` be still compatible with AngularJS 2.0?*<br>
Most likely, no. I'm not aware whether the `angular-translate` team have plans to port it to the new version of the framework.

## Ultra Fast Change Detection

**There is still no final version of the change detection. The underlaying implementation should not concern us, the AngularJS team will implement what is best possible way based on huge amount of benchmarks, on different devices in different environment. This section is only for fun, exploring some design decisions.**

Another completely innovative idea I found, digging inside AngularJS' source code was inside the `JITChangeDetector`. Mostly because of the inline-caches, the JavaScript VMs are capable of doing smarter optimizations in expressions like:

```javascript
this.value === oldValue;
```

The AngularJS team decided that they can generate JavaScript classes, which implement this change detection mechanism, instead of using method calls (take a look [at these benchmarks](http://jsperf.com/object-observe-polyfill-sandbox)). How does it work? According to my quick research:

- AngularJS tokenizes the registered ("watched") expressions
- AngularJS builds [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
- Using the [visitor pattern](https://en.wikipedia.org/wiki/Visitor_pattern) AngularJS ...
- [Based on a template](https://github.com/angular/angular/blob/master/modules/angular2/src/change_detection/change_detection_jit_generator.es6), AngularJS implements the "dummy" change detection for a specific component.

### Quick FAQ:

*Does it mean that the generation of source code will slowdown the execution of my app?*<br>
It is done when the bindings change, lazily. Probably it will perform better in most scenarios.

*Is it going to be hard for debugging?*<br>
We trust AngularJS that it is going to be implemented well and we won't need to touch it!

*Will it lead to any debugging complications (for example entering the change detection, generated class because of a breakpoint we're in)?*<br>
If you use your debugger properly you should not have any issues. Take a look at the [slides of Addy Osmani on the state of DevTools, 2015, jQuery London meetup](https://speakerdeck.com/addyosmani/devtools-state-of-the-union-2015?slide=109).

### Further reading

For more information you can take a look at the design docs ([here](https://docs.google.com/document/d/1QKTbyVNPyRW-otJJVauON4TFMHpl0zNBPkJcTcfPJWg/edit?usp=drive_web) and [here](https://docs.google.com/document/d/10W46qDNO8Dl0Uye3QX0oUDPYAwaPl0qNy73TVLjd1WI/edit?usp=drive_web)) and the [AngularJS' source code](https://github.com/angular/angular/tree/master/modules/angular2/src/change_detection).

## It is not production ready

The API of AngularJS 2.0 is still under development. There are a lot of things, which are still not clarified (like change detection, best API, forms API, etc.). You can play with the framework using the [quick start](https://angular.io/docs/js/latest/quickstart.html) or [my seed project](https://github.com/mgechev/angular2-seed)

## Conclusion

AngularJS 2.0 will be a new framework, which is not backward compatible with AngularJS 1.x. It is implemented in AtScript (superset of TypeScript) but you don't have to use it, if you don't want to. It implements some of the ideas from ReactJS, mostly the unidirectional data flow, which makes it work great with the [Flux architecture](https://facebook.github.io/react/docs/flux-overview.html). It is on top of web standards (which is a big bonus compared to ReactJS) and takes advantage of some of the web components' APIs. It will be much faster and lighter compared to AngularJS 1.x and will be supported by the modern browsers with polyfills for older ones (as far as I know the support for IE7 and IE8 will be dropped).

Should I use it in production? **No**, but you can experiment with it.
