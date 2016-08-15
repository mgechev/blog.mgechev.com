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

## When the compilation takes a place?

The cool thing about the Angular's renderer is that it can be either invoked runtime (i.e. in the user's browser) or build-time (as part of our build process).

## What we get from AoT?

## How the AoT compilation works?

## Conclusion

- What needs to be compiled?
- How it gets compiled?
- Why it needs to get compiled?
- When the compilation needs to be performed?
  - JiT cs AoT.
- What we get from the compilation?
  - Type checking
  - Energy:
    - Parse large amount of JS.
    - A lot of calculations performed on each visit for each client.
- How the compilation works?
- Do we loose anything from AoT vs JiT?
- Conclusion.

## References

- [Inline Caches](http://mrale.ph/blog/2012/06/03/explaining-js-vms-in-js-inline-caches.html)
