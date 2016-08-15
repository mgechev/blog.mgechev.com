---
title: Ahead of Time Compilation in Angular 2
author: minko_gechev
layout: post
categories:
  - JavaScript
  - Angular 2
  - TypeScript
  - Compilers
tags:
  - JavaScript
  - Angular 2
  - TypeScript
---

In this post we're going to explore in depth the Angular 2 Ahead of Time (AoT) compilation. We will start from the beginning by exploring:

- Why the compilation is needed?
- How everything gets compiled?
- Why we need AoT?
- What is the difference between the current way of compilation (Just in Time, JiT) and AoT?
- What we get from AoT?
- How the compilation works?
- Do we loose anything from using AoT?

## Why we need compilation?

The short answer of this question is - **We need compilation for higher level of efficiency.** By efficiency I mean performance, energy and bandwidth consumption.

AngularJS 1.x had quite a dynamic approach for both rendering and change detection. For instance, the AngularJS 1.x compiler is quite generic. It is supposed to work for any template by performing a set of dynamic computations. Although this works great in the general case, the JavaScript virtual machines [struggles with optimizing the calculations on lower level](http://mrale.ph/blog/2012/06/03/explaining-js-vms-in-js-inline-caches.html) because of their dynamic nature.

Angular 2 took different approach. Instead of developing one generic compiler (and respectively change detector) and let it work with any component, the framework **generates** code runtime which accesses the same properties of the instantiated component over time. This allows the JavaScript virtual machine to cache these property access invocations and perform them much faster.

For instance, take a look at the following example:

```javascript
// ...
compile: function (el, scope) {
  var dirs = this._getElDirectives(el);
  var dir;
  var scopeCreated;
  dirs.forEach(function (d) {
    dir = Provider.get(d.name + Provider.DIRECTIVES_SUFFIX);
    if (dir.scope && !scopeCreated) {
      scope = scope.$new();
      scopeCreated = true;
    }
    dir.link(el, scope, d.value);
  });
  Array.prototype.slice.call(el.children).forEach(function (c) {
    this.compile(c, scope);
  }, this);
},
// ...
```

The code above is copied from my [lightweight AngularJS 1.x implementation](https://github.com/mgechev/light-angularjs/blob/master/lib/DOMCompiler.js#L10-L25). Above we perform a Depth-First-Search over the entire DOM tree, trying to find directives and invoking their link functions. This approach works in the general case, which is amazing! We have to write code only once and it will work for any directive. However, it is also obviously compared to:

```javascript
// ...
this._text_9 = this.renderer.createText(this._el_3, '\n', null);
this._text_10 = this.renderer.createText(parentRenderNode, '\n\n', null);
this._el_11 = this.renderer.createElement(parentRenderNode, 'ul', null);
this._text_12 = this.renderer.createText(this._el_11, '\n  ', null);
this._anchor_13 = this.renderer.createTemplateAnchor(this._el_11, null);
this._appEl_13 = new import2.AppElement(13, 11, this, this._anchor_13);
this._TemplateRef_13_5 = new import17.TemplateRef_(this._appEl_13, viewFactory_HomeComponent1);
this._NgFor_13_6 = new import15.NgFor(this._appEl_13.vcRef, this._TemplateRef_13_5, this.parentInjector.get(import18.IterableDiffers), this.ref);
// ...
```

The snippet above contains a piece of the implementation of the generated `createInternal` method of pre-compiled (AoT) component from the [angular2-seed project](https://github.com/mgechev/angular2-seed). This code is "obviously fast" since it directly instantiates the individual components/directives (`import15.NgFor...`) and creates the declared by the template elements.

Behind the hood, the JavaScript virtual machine will see that only a single instance of the renderer is being used and will be able to replace the `this.renderer.createElement` calls with `document.createElement`, which will make our application fly.

## What needs to be compiled?

By answering the question "Why we need compilation?" we answered the question "What needs to be compiled?" as well. In general we want to compile our templates to direct JavaScript calls. This way we are not coupled to the underlying platform. In other words, by having a different implementation of the renderer we can have the same AoT compiled template work without any changes in the code.

## How it gets compiled?

We will go quickly through the process of compilation because there's no point to explain each line of the `@angular/compiler` line-by-line. The Angular template compiler receives as an input a component and context (we can think of the context as a position in the component tree) and returns the source code of two classes:

- `_View_{COMPONENT}_Host{COUNTER}`
- `_View_{COMPONENT}{COUNTER}`

...and two functions:

- `viewFactory_{COMPONENT}_Host{COUNTER}`
- `viewFactory_{COMPONENT}{COUNTER}`

Both classes extend `AppView` and implement the following methods:

- `createInternal` - renders the component.
- `destroyInternal` - performs clean-up.
- `detectChangesInternal` - detect changes with a method optimized for inline caching.

The factory methods above are only responsible for instantiating the generated `AppViews`. Alright, so based on a declarative HTML-like template we generate JavaScript. We already mentioned why it is so powerful in terms of rendering but it is also quite powerful in terms of change detection!

As I mentioned above, the `detectChangesInternal` contains VM friendly code. Lets take a look at the compiled version of the template:

```html
<div>{{name}}</div>
<input type="text" [(ngModel)]="name">
```

We already said how the `createInternal` method is going to look, the `detectChangesInternal` is going to be something like:

```javascipt
var currVal_6 = this.context.newName;
if (import4.checkBinding(throwOnChange, this._expr_6, currVal_6)) {
    this._NgModel_5_5.model = currVal_6;
    if ((changes === null)) {
        (changes = {});
    }
    changes['model'] = new import7.SimpleChange(this._expr_6, currVal_6);
    this._expr_6 = currVal_6;
}
this.detectContentChildrenChanges(throwOnChange);
```

For call like: `checkBinding(1, 3)`, in production mode, `checkBinding` will perform something like:

```javascript
1 === 3 || typeof 1 === 'number' && typeof 3 === 'number' && isNaN(1) && isNaN(3);
```

Once we find out that the values are not equal we're going to store the change and update the `model` value of the `NgModel` directive instance. Right after that the `detectContentChildrenChanges` will be invoked which will invoke the `detectChangesInternal` method for all the content children. Once the NgModel directive finds out about the changed value of the `model` property it'll update the corresponding element by (almost) directly calling the renderer.

Nothing unusual and terribly complicated so far.

## When the compilation takes place?

The cool thing about the Angular's renderer is that it can be either invoked runtime (i.e. in the user's browser) or build-time (as part of our build process). This is due the portability property of Angular 2, we can run it on any platform so why to not make the Angular compiler run both in browser and node?

### Flow of events in Just-in-Time Compilation

Lets trace the typical development flow without AoT:

- Development of TypeScript application.
- Transpilation of the app.
- Bundling.
- Minification.
- Deployment.

Once we've deployed the app and the user opens her browser, she goes through the following steps (without strict CSP):

- Download all the assets.
- Angular bootstraps.
- Angular goes through the compilation process described above.
- The application gets rendered.

### Flow of events with Ahead-of-Time Compilation

In contrast, with AoT we get through the following steps:

- Development of the TypeScript app.
- Compilation of the application with `ngc`:
  - Performs compilation of the templates with the Angular compiler.
  - Performs transpilation of the TypeScript code to JavaScript.
- Bundling.
- Minification.
- Deployment.

Although the above process seems lightly more complicated the user goes only through the steps:

- Download all the assets.
- Angular bootstraps.
- The application gets rendered.

As you can see the third step is missing which means faster/better UX.

## How the AoT compilation works?

We already described how the Angular compiler works and what artifacts it produces. Although the AoT compilation differs from JiT compilation only by the time the it's performed there are slight complications.

In JiT once we bootstrap the application we already have our root injector and all the directives available by the root component (they are declared in `BrowserModule`). This metadata can be passed to the compiler once it generates code for the root component of the application. Once we generate the code with JiT for the root component, we have all the metadata which can be used for generation of the code for all children components. Now we can generate the TypeScript for all the children components since we know not only which providers are available at this level of the component tree but also which directives are accessible.

This will make the compiler know what to do when it finds an element in the template. For instance, the element `<bar-baz></bar-baz>` can be interpreted in two different ways depending on whether there's a directive available with selector `bar-baz` or not. Whether the compiler will only create an element `bar-baz` or also instantiate the component associated with the selector `bar-baz` depends on the metadata at the current phase of compilation (on the current state).

Here comes a problem. How at build time we would know what directives are accessible on all levels of the component tree? Thanks to the great design of Angular we can perform a static code analysis and find this out! [Chuck Jazdzewski](https://github.com/chuckjaz) and [Alex Eagle](https://github.com/alexeagle) did amazing work in this direction by developing the [MetadataCollector](https://github.com/angular/angular/blob/156a52e390256b00ae7c1fe1f80281cb1d1fe773/tools/%40angular/tsc-wrapped/src/collector.ts) and other [related modules](https://github.com/angular/angular/tree/156a52e390256b00ae7c1fe1f80281cb1d1fe773/tools/%40angular/tsc-wrapped). What the collector does is to walk the component tree and extract the metadata for each individual component. This involves some awesome techniques which unfortunately are out of the scope of this blog post.

## What we get from AoT?

As you might have already guessed, from AoT we get performance. The **initial rendering performance** of the Angular applications we develop with AoT will be much faster compared to JiT since the JavaScript virtual machine needs to perform much less computations, i.e. we compile the templates to JavaScript only once as part of our development process.

Another awesome thing about the Angular compiler is that it can emit not only JavaScript but TypeScript as well. This allows us to perform **type checking in templates**!

Since the templates of our application are pure JavaScript/TypeScript, we know exactly what and where is used. This allows us to perform **effective tree-shaking** and drop all the directives/modules which are not used in our application out of the production bundle!

JiT compilation cannot be performed in some cases. Since JiT both generates and evaluates code in the browser it uses `eval`. [CSP](https://developer.chrome.com/extensions/contentSecurityPolicy) and some specific environments will not allow us to dynamically evaluate the generated source code.

Last but not least, **energy efficiency**! We already mentioned that by using AoT compilation we drop the bundle sizes of our applications by performing effective tree-shaking (take a look at [this blog post to see what are the actual results and implications](http://blog.mgechev.com/2016/07/21/even-smaller-angular2-applications-closure-tree-shaking/)). The user devices need to perform even less calculations since they don't have to perform JiT. All this reduces battery consumption but how much?

Based on findings by the research "Who Killed My Battery: Analyzing Mobile Browser Energy Consumption" (by N. Thiagarajan, G. Aggarwal, A. Nicoara, D. Boneh, and J. Singh), the process of downloading and parsing jQuery in Wikipedia takes about 4 Joules. Since the paper doesn't mention specific version of jQuery, based on the data when it was published I assume we're talking about ~1.8. Since wikipedia uses gzip for their static content this means that the bundle size is 33K. The gzipped + minified version of `@angular/compiler` is 103K. This means that it'll cost us 12.5J to download the compiler, process it with JavaScript virtual machine, etc. (we're ignoring the fact that we are not performing JiT which will additionally reduce the processor usage because in both cases - jQuery and `@angular/compiler` we're opening only a single TCP which is the biggest consumer of energy).

iPhone 6s has a battery which is 6.9 Wh which is 24840J. Lets suppose there are 1m developers who have built 5 Angular applications on average. Each application has ~100 users per day. `5 apps * 1m * 100 users = 500m`. In case we perform JiT and we download the `@angular/compiler` it'll cost to the Earth `500m * 12.5J = 6250000000J`, which is 1736.111111111 KWh. According to Google, 1Kwh ~ 12 cents, which means that **we'll spend about $210 for recovering the consumed energy**. Notice that we even didn't took the further optimization that we'll get by applying tree-shaking, which may allow us to drop the size of our application at least twice!

## Conclusion

The Angular's compiler improves the performance of our applications dramatically by taking advantage of the inline caching mechanism of the JavaScript virtual machines. On top of that we can perform it as part of our build process which solves problems such as forbidden `eval`, allows us to perform more efficient tree-shaking, improves the initial rendering time, and also - **it makes the world a better place** :-).

Do we loose anything by not performing the compilation runtime? In some very limited cases (when we generate the templates of the components on demand for instance) we may want to load non-compiled components runtime and perform the compilation in the browser, in such cases we'd need to include the `@angular/compiler` module as part of our application bundle.

In general, the AoT compilation is a good strategy which is already integrated as part of the `angular2-seed` and you can take advantage of! Soon it will be included in `angular-cli` and be even more widely available!

## References

- [Inline Caches](http://mrale.ph/blog/2012/06/03/explaining-js-vms-in-js-inline-caches.html)
- [2.5X Smaller Angular 2 Applications with Google Closure Compiler](http://blog.mgechev.com/2016/07/21/even-smaller-angular2-applications-closure-tree-shaking/)
- [Who Killed My Battery: Analyzing Mobile Browser Energy Consumption](https://crypto.stanford.edu/~dabo/pubs/abstracts/browserpower.html)

