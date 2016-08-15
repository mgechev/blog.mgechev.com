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

Recently I added Ahead-of-Time (AoT) compilation support to [angular2-seed](https://github.com/mgechev/angular2-seed) and received a lot of questions about it. In this post we're going to explore in depth the Angular 2 AoT compilation. We will start from the beginning by answering the following questions:

- Why we need compilation?
- What needs to be compiled?
- How it gets compiled?
- When the compilation takes place, Just-in-Time, (JiT) vs AoT?
- What we get from AoT?
- How the AoT compilation works?
- Do we loose anything from using AoT vs JiT?

## Why we need compilation?

The short answer of this question is - **We need compilation for achieving higher level of efficiency of our applications.** By efficiency I mean performance, energy and bandwidth consumption.

AngularJS 1.x had quite a dynamic approach for both rendering and change detection. For instance, the AngularJS 1.x compiler is quite generic. It is supposed to work for any template by performing a set of dynamic computations. Although this works great in the general case, the JavaScript Virtual Machines (VM) [struggles with optimizing the calculations on lower level](http://mrale.ph/blog/2012/06/03/explaining-js-vms-in-js-inline-caches.html) because of their dynamic nature.

Angular 2 took different approach. Instead of developing one generic compiler (and respectively change detector) and let it work with any component, the framework **generates** VM-friendly code runtime. This allows the JavaScript virtual machine to perform property access caching and execute the code much faster.

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

The code above is copied from my [lightweight AngularJS 1.x implementation](https://github.com/mgechev/light-angularjs/blob/master/lib/DOMCompiler.js#L10-L25). Above we perform a Depth-First-Search over the entire DOM tree, trying to find directives and invoking their `link` functions. This approach works in the general case, which is nice because we have to write code only once and it will work for any directive. However, using the code above to render the template:

```javascript
<ul>
  <li *ngFor="let name of names">{{name}}</li>
</ul>
```

...is much slower compared to:

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

Behind the hood, the JavaScript virtual machine will see that only a single instance of the renderer is used in the entire application and will be able to replace the `this.renderer.createElement` calls with `document.createElement`, which will make our application even faster.

## What needs to be compiled?

By answering the question "Why we need compilation?" we answered the question "What needs to be compiled?" as well. In general we want to compile the templates of the components to JavaScript classes. These classes have methods that contain logic for detecting chances in the bindings and rendering the UI. This way we are not coupled to the underlying platform (except markup format). In other words, by having a different implementation of the renderer we can use the same AoT compiled component and render it without any changes in the code. So the component above could be rendered with NativeScript, for instance, as soon as the renderer understands the passed arguments.

## How templates get compiled?

<img src="/images/aot-angular/mechanics.jpg" style="display: block; margin: auto;">

We will go quickly through the process of compilation because there's no point to explain the entire `@angular/compiler` line-by-line. The Angular template compiler receives as an input a component and context (we can think of the context as a position in the component tree) and returns the source code of two classes:

- `_View_{COMPONENT}_Host{COUNTER}`
- `_View_{COMPONENT}{COUNTER}`

...and two functions:

- `viewFactory_{COMPONENT}_Host{COUNTER}`
- `viewFactory_{COMPONENT}{COUNTER}`

Above `{COMPONENT}` is the name of the component's controller and `{COUNTER}` is an unsigned integer.

Both classes extend `AppView` and implement the following methods:

- `createInternal` - renders the component.
- `destroyInternal` - performs clean-up.
- `detectChangesInternal` - detects changes with method implementation optimized for inline caching.

The factory methods above are only responsible for instantiation of the generated `AppViews`. In short, based on a declarative HTML-like template we generate JavaScript/TypeScript. We already mentioned why it is so powerful in terms of rendering but it is also quite powerful in terms of change detection!

As I mentioned above, the `detectChangesInternal` contains VM friendly code. Lets take a look at the compiled version of the template:

```html
<div>{{newName}}</div>
<input type="text" [(ngModel)]="newName">
```

The `detectChangesInternal` method for the compiled version of the template above is going to look something like:

```javascript
// ...
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
// ...
```

Lets trace the method's execution.
.
For call like: `import4.checkBinding(1, 3)`, in production mode, `checkBinding` will perform something like:

```javascript
1 === 3 || typeof 1 === 'number' && typeof 3 === 'number' && isNaN(1) && isNaN(3);
```

The expression above will return `false`, so we're going to store the change and update the `model` value of the `NgModel` directive instance. Right after that the `detectContentChildrenChanges` will be invoked which will invoke the `detectChangesInternal` method for all the content children. Once the `NgModel` directive finds out about the changed value of the `model` property it'll update the corresponding element by (almost) directly calling the renderer.

Nothing unusual and terribly complicated so far.

## When the compilation takes place?

<img src="/images/aot-angular/timing.jpg" style="display: block; margin: auto;">

The cool thing about the Angular's compiler is that it can be either invoked runtime (i.e. in the user's browser) or build-time (as part of our build process). This is due the portability property of Angular 2 - we can run the framework on any platform with JavaScript VM so why to not make the Angular compiler run both in browser and node?

### Flow of events with Just-in-Time Compilation

Lets trace the typical development flow without AoT:

- Development of Angular 2 application with TypeScript.
- Compilation of the application with `tsc`.
- Bundling.
- Minification.
- Deployment.

Once we've deployed the app and the user opens her browser, she will go through the following steps (without strict CSP):

- Download all the JavaScript assets.
- Angular bootstraps.
- Angular goes through the JiT compilation process described above.
- The application gets rendered.

### Flow of events with Ahead-of-Time Compilation

In contrast, with AoT we get through the following steps:

- Development of Angular 2 application with TypeScript.
- Compilation of the application with [`ngc`](https://npmjs.com/package/@angular/compiler-cli).
  - Performs compilation of the templates with the Angular compiler to TypeScript.
  - Compilation of the TypeScript code to JavaScript.
- Bundling.
- Minification.
- Deployment.

Although the above process seems lightly more complicated the user goes only through the steps:

- Download all the assets.
- Angular bootstraps.
- The application gets rendered.

As you can see the third step is missing which means faster/better UX and on top of that tools like [angular2-seed](https://github.com/mgechev/angular2-seed) and [angular-cli](https://github.com/angular/angular-cli) will automate the build process dramatically.

## How the AoT compilation works?

We already described how the Angular compiler works and what artifacts it produces. Although the AoT compilation differs from JiT compilation only by the time the it's performed there are slight complications.

In JiT once we bootstrap the application we already have our root injector and all the directives available to the root component (they are included in `BrowserModule`). This metadata will be passed to the compiler for the process of compilation of the template of the root component. Once the compiler generates the code with JiT, it has all the metadata which can be should be used for the generation of the code for all children components. It can generate the code for all of them since it already knows not only which providers are available at this level of the component tree but also which directives are visible there.

This will make the compiler know what to do when it finds an element in the template. For instance, the element `<bar-baz></bar-baz>` can be interpreted in two different ways depending on whether there's a directive with selector `bar-baz` available or not. Whether the compiler will only create an element `bar-baz` or also instantiate the component associated with the selector `bar-baz` depends on the metadata at the current phase of the compilation process (on the current state).

Here comes the problem. How at build time we would know what directives are accessible on all levels of the component tree? Thanks to the great design of Angular we can perform a static-code analysis and find this out! [Chuck Jazdzewski](https://github.com/chuckjaz) and [Alex Eagle](https://github.com/alexeagle) did amazing work in this direction by developing the [MetadataCollector](https://github.com/angular/angular/blob/156a52e390256b00ae7c1fe1f80281cb1d1fe773/tools/%40angular/tsc-wrapped/src/collector.ts) and other [related modules](https://github.com/angular/angular/tree/156a52e390256b00ae7c1fe1f80281cb1d1fe773/tools/%40angular/tsc-wrapped). What the collector does is to walk the component tree and extract the metadata for each individual component. This involves some awesome techniques which unfortunately are out of the scope of this blog post.

## What we get from AoT?

As you might have already guessed, from AoT we get performance. The **initial rendering performance** of each Angular applications we develop with AoT will be much faster compared to a JiT one since the JavaScript Virtual Machine needs to perform much less computations. We compile the templates to JavaScript only once as part of our development process, after that the user gets compiled templates for free!

On the image below you can see how much time it takes to perform the initial rendering with JiT:

<img src="/images/aot-angular/jit.png" style="display: block; margin: auto;">

On the image below you can see how much time it takes to perform the initial rendering with AoT:

<img src="/images/aot-angular/aot.png" style="display: block; margin: auto;">

Another awesome thing about the Angular compiler is that it can emit not only JavaScript but TypeScript as well. This allows us to perform **type checking in templates**!

Since the templates of the application are pure JavaScript/TypeScript, we know exactly what and where is used. This allows us to perform **effective tree-shaking** and drop all the directives/modules which are not used by the application out of the production bundle! On top of that we don't need to include the `@angular/compiler` module in the application bundle since we don't need to perform compilation at runtime!

**In some cases, JiT compilation cannot be performed at all**. Since JiT both generates and evaluates code in the browser it uses `eval`. [CSP](https://developer.chrome.com/extensions/contentSecurityPolicy) and some specific environments will not allow us to dynamically evaluate the generated source code.

Last but not least, **energy efficiency**! We already mentioned that by using AoT compilation we drop the bundle sizes of our applications by performing effective tree-shaking (take a look at [this blog post to see what are the actual results and implications](http://blog.mgechev.com/2016/07/21/even-smaller-angular2-applications-closure-tree-shaking/)). The user devices need to perform even less calculations since they don't have to perform JiT. All this reduces battery consumption but how much?

Based on findings by the research "Who Killed My Battery: Analyzing Mobile Browser Energy Consumption" (by N. Thiagarajan, G. Aggarwal, A. Nicoara, D. Boneh, and J. Singh), the process of downloading and parsing jQuery when visiting Wikipedia takes about 4 Joules of energy. Since the paper doesn't mention specific version of jQuery, based on the date when it was published I assume it's talking about v1.8.x. Since Wikipedia uses gzip for compressing their static content this means that the bundle size of jQuery 1.8.3 will be 33K. The gzipped + minified version of `@angular/compiler` is 103K. This means that it'll cost us about 12.5J to download the compiler, process it with JavaScript Virtual Machine, etc. (we're ignoring the fact that we are not performing JiT, which will additionally reduce the processor usage. We do this because in both cases - jQuery and `@angular/compiler` we're opening only a single TCP connection, which is the biggest consumer of energy).

iPhone 6s has a battery which is 6.9Wh which is 24840J. Based on the monthly visits of the official page of AngularJS 1.x there will be at least 1m developers who have built on average 5 Angular 2 applications. Each application have ~100 users per day. `5 apps * 1m * 100 users = 500m`. In case we perform JiT and we download the `@angular/compiler` it'll cost to the Earth `500m * 12.5J = 6250000000J`, which is 1736.111111111KWh. According to Google, 1KWh = ~12 cents in the USA, which means that **we'll spend about $210 for recovering the consumed energy for a day**. Notice that we even didn't took the further optimization that we'll get by applying tree-shaking, which may allow us to drop the size of our application at least twice! :-)

<img src="/images/aot-angular/better-place.jpg" style="display: block; margin: auto;">

## Conclusion

The Angular's compiler improves the performance of our applications dramatically by taking advantage of the inline caching mechanism of the JavaScript Virtual Machines. On top of that we can perform it as part of our build process which solves problems such as forbidden `eval`, allows us to perform more efficient tree-shaking, improves the initial rendering time, and also - **it makes the world a better place** :-).

Do we loose anything by not performing the compilation at runtime? In some very limited cases we may need to generate the templates of the components on demand. This will require us to load non-compiled components and perform the compilation process in the browser, in such cases we'd need to include the `@angular/compiler` module as part of our application bundle.

In general, the AoT compilation is a good strategy which is already integrated as part of the [angular2-seed](https://github.com/mgechev/angular2-seed) and you can take advantage of! Soon it will be included in `angular-cli` and be even more widely available!

## References

- [Inline Caches](http://mrale.ph/blog/2012/06/03/explaining-js-vms-in-js-inline-caches.html)
- [2.5X Smaller Angular 2 Applications with Google Closure Compiler](http://blog.mgechev.com/2016/07/21/even-smaller-angular2-applications-closure-tree-shaking/)
- [Who Killed My Battery: Analyzing Mobile Browser Energy Consumption](https://crypto.stanford.edu/~dabo/pubs/abstracts/browserpower.html)
- [Angular's Source Code](https://github.com/angular/angular)

