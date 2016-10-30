---
title: Ahead-of-Time Compilation in Angular 2
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

Recently I added Ahead-of-Time (AoT) compilation support to [angular-seed](https://github.com/mgechev/angular-seed) and got a lot of questions about the new feature. In order to answer most of them, we will start from the beginning by explaining the following topics:

- Why we need compilation in Angular?
- What needs to be compiled?
- How it gets compiled?
- When the compilation takes place? Just-in-Time (JiT) vs Ahead-of-Time AoT.
- What we get from AoT?
- How the AoT compilation works?
- Do we loose anything from using AoT vs JiT?

## Why we need compilation in Angular?

The short answer of this question is - **We need compilation for achieving higher level of efficiency of our Angular applications.** By efficiency I mostly mean performance improvements but also energy and bandwidth consumption.

AngularJS 1.x had quite a dynamic approach for both rendering and change detection. For instance, the AngularJS 1.x compiler is quite generic. It is supposed to work for any template by performing a set of dynamic computations. Although this works great in the general case, the JavaScript Virtual Machines (VM) [struggles with optimizing the calculations on lower level](http://mrale.ph/blog/2012/06/03/explaining-js-vms-in-js-inline-caches.html) because of their dynamic nature. **Since the VM doesn't know the shapes of the objects which provide context for the dirty-checking logic (i.e. the so called scope), it's inline caches get a lot of misses which slows the execution down.**

Angular 2 took different approach. Instead of developing one generic compiler (and respectively change detector) and let it work with any component, the framework **generates** VM-friendly code at runtime. **This allows the JavaScript virtual machine to perform property access caching and execute the code much faster.**

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

This snippet is copied from my [lightweight AngularJS 1.x implementation](https://github.com/mgechev/light-angularjs/blob/master/lib/DOMCompiler.js#L10-L25). Above we perform a Depth-First-Search over the entire DOM tree, trying to find directives and invoking their `link` functions. This approach works in the general case, which is great because we have to write code only once and it will work for any directive. However, using the code above to render the template:

```javascript
<ul>
  <li *ngFor="let name of names">{{name}}</li>
</ul>
```

...is much slower compared to:

```javascript
// ...
this._el_11 = this.renderer.createElement(parentRenderNode, 'ul', null);
this._text_12 = this.renderer.createText(this._el_11, '\n  ', null);
this._anchor_13 = this.renderer.createTemplateAnchor(this._el_11, null);
this._appEl_13 = new import2.AppElement(13, 11, this, this._anchor_13);
this._TemplateRef_13_5 = new import17.TemplateRef_(this._appEl_13, viewFactory_HomeComponent1);
this._NgFor_13_6 = new import15.NgFor(this._appEl_13.vcRef, this._TemplateRef_13_5, this.parentInjector.get(import18.IterableDiffers), this.ref);
// ...
```

The snippet above contains a piece of the implementation of the generated `createInternal` method of a compiled component from the [angular-seed project](https://github.com/mgechev/angular-seed). This code is "obviously fast" since it directly instantiates the individual components/directives (`new import15.NgFor...`) and creates the declared by the template elements.

Behind the hood, the JavaScript virtual machine will find that only a single instance of the renderer is used in the entire application and will be able to replace the `this.renderer.createElement` calls with `document.createElement`, which will make our application even faster.

## What gets compiled?

By answering the question "Why we need compilation?" we answered the question "What needs to be compiled?" as well. We want to compile the templates of the components to JavaScript classes. These classes have methods that contain logic for detecting changes in the bindings and rendering the user interface. This way we are not coupled to the underlying platform (except the markup format). In other words, by having a different implementation of the renderer we can use the same AoT compiled component and render it without any changes in the code. So the component above could be rendered in NativeScript, for instance, as soon as the renderer understands the passed arguments.

## Just-in-Time (JiT) vs Ahead-of-Time AoT.

<img src="/images/aot-angular/timing.jpg" style="display: block; margin: auto;">

This section contains answer of the question:

- *When the compilation takes place?*.

The cool thing about the Angular's compiler is that it can be either invoked runtime (i.e. in the user's browser) or build-time (as part of the build process). This is due to the portability property of Angular 2 - we can run the framework on any platform with JavaScript VM so why to not make the Angular compiler run both in browser and node?

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

As you can see the third step is missing which means faster/better UX and on top of that tools like [angular-seed](https://github.com/mgechev/angular-seed) and [angular-cli](https://github.com/angular/angular-cli) will automate the build process dramatically.

## Ahead-of-Time Compilation in Depth

<img src="/images/aot-angular/mechanics.jpg" style="display: block; margin: auto;">

This section answers the questions:

- *What artifacts the AoT compiler produces?*
- *What the context of the produced artifacts is?*
- *How to develop both AoT friendly and well encapsulated code?*

We will go quickly through the compilation because there's no point to explain the entire `@angular/compiler` line-by-line. If you're interested in the process of lexing, parsing and code generation, you can take a look at the talk ["The Angular 2 Compiler" by Tobias Bosch](https://www.youtube.com/watch?v=kW9cJsvcsGo) or this [slide deck](https://speakerdeck.com/mgechev/angular-toolset-support?slide=69).

The Angular template compiler receives as an input a component and a context (we can think of the context as a position in the component tree) and produces the following files:

- `*.ngfactory.ts` - we'll take a look at this file in the next section.
- `*.css.shim.ts` - scoped CSS file based on the `ViewEncapsulation` mode of the component.
- `*.metadata.json` - metadata associated with the current component (or `NgModule`).

`*` is a placeholder for the file's name. For `hero.component.ts`, the compiler will produce: `hero.component.ngfactory.ts`, `hero.component.css.shim.ts`, and `hero.component.metadata.json`.

`*.css.shim.ts` is not very interesting for the purpose of our discussion so we won't describe it in details. If you what to know more about `*.metadata.json` you can take a look at the section: "AoT and third-party modules".

### Inside `*.ngfactory.ts`.

The file `*.ngfactory.ts` contains the following definitions:

- `_View_{COMPONENT}_Host{COUNTER}` - we call this an **"internal host component"**.
- `_View_{COMPONENT}{COUNTER}` - we call this an **"internal component"**.

...and two functions:

- `viewFactory_{COMPONENT}_Host{COUNTER}`
- `viewFactory_{COMPONENT}{COUNTER}`

Above `{COMPONENT}` is the name of the component's controller and `{COUNTER}` is an unsigned integer.

Both classes extend `AppView` and implement the following methods:

- `createInternal` - renders the component.
- `destroyInternal` - performs clean-up (removes event listeners, etc.).
- `detectChangesInternal` - detects changes with method implementation optimized for inline caching.

The factory functions above are only responsible for instantiation of the generated `AppViews`. In short, "compilation" in the context of Angular means that based on a declarative HTML-like template Angular generates imperative JavaScript or TypeScript code. We already mentioned why it is so powerful in terms of rendering but it is also quite powerful in terms of change detection!

As I mentioned above, the `detectChangesInternal` contains VM friendly code. Let's take a look at the compiled version of the template:

```html
<div>{{newName}}</div>
<input type="text" [(ngModel)]="newName">
```

The `detectChangesInternal` method going to look something like:

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

Let's suppose that `currVal_6` has value `3` and `this_expr_6` has value `1`, and now lets trace the method's execution:

For call like: `import4.checkBinding(1, 3)`, in production mode, `checkBinding` perform the following check:

```javascript
1 === 3 || typeof 1 === 'number' && typeof 3 === 'number' && isNaN(1) && isNaN(3);
```

The expression above will return `false`, so we're going to store the change and update the `model` value of the `NgModel` directive instance. Right after that the `detectContentChildrenChanges` will be invoked which will invoke the `detectChangesInternal` method for all the content children. Once the `NgModel` directive finds out about the changed value of the `model` property, it'll update the corresponding element by (almost) directly calling the renderer.

Nothing unusual and terribly complicated so far.

### The `context` property

Maybe you've noticed that within the **internal component** we're accessing the property `this.context`. The `context` of the internal component is the instasnce of the component's controller itself. So for instance:

```javascript
@Component({
  selector: 'hero-app',
  template: '<h1>{{ hero.name }}</h1>'
})
class HeroComponent {
  hero: Hero;
}
```

...`this.context` will be equal to `new HeroComponent()`. This means that in `detectChangesInternal` we have to access `this.context.name`. Here comes a problem. **If we want to emit TypeScript as output of the AoT compilation process we must make sure we access only public fields in the templates of our components.** Why is that? As we already mentioned the compiler can generate both TypeScript and JavaScript. Since TypeScript has access modifiers, and enforces access only to public properties outside the inheritance chain, inside the internal component we cannot access any private properties part of the context object, so both:

```javascript
@Component({
  selector: 'hero-app',
  template: '<h1>{{ hero.name }}</h1>'
})
class HeroComponent {
  private hero: Hero;
}
```

...and...

```javascript
class Hero {
  private name: string;
}

@Component({
  selector: 'hero-app',
  template: '<h1>{{ hero.name }}</h1>'
})
class HeroComponent {
  hero: Hero;
}
```

will throw a compile time error in the generated `*.ngfactory.ts`. In the first example the internal component cannot access `hero` since it's private within `HeroComponent`, and in the second case the internal component won't be able to access `hero.name`, since `name` is private inside `Hero`.

### AoT and encapsulation

Alright, we'll bind only to public properties and invoke only public methods inside of the templates but what happens with the component encapsulation? This may doesn't seem like a big problem at first, but imagine the following scenario:

```javascript
// component.ts
@Component({
  selector: 'third-party',
  template: `
    {{ _initials }}
  `
})
class ThirdPartyComponent {
  private _initials: string;
  private _name: string;

  @Input()
  set name(name: string) {
    if (name) {
      this._initials = name.split(' ').map(n => n[0]).join('. ') + '.';
      this._name = name;
    }
  }
}
```

The component above has a single input - `name`. Inside of the `name` setter it calculates the value of the `_initials` property. We can use the component as follows:

```javascript
@Component({
  template: '<third-party [name]="name"></third-party>'
  // ...
})
// ...
```

Since in JiT mode, the Angular compiler generates JavaScript, this works perfect! Each time the value of the `name` expression changes and equals to truthy value, the `_initials` property will be recomputed. However, the implementation of `ThirdPartyComponent` is not AoT-friendly (to make sure you access only public properties in your templates you can use [codelyzer](https://github.com/mgechev/codelyzer). If we want to do so we have to change it to:

```javascript
// component.ts
@Component({
  selector: 'third-party',
  template: `
    {{ initials }}
  `
})
class ThirdPartyComponent {
  initials: string;
  private _name: string;

  @Input()
  set name(name: string) {...}
}
```

And thus something like this will be possible:

```javascript
@Component({
  template: '<third-party [name]="name"></third-party>'
  // ...
})
class Consumer {
  @ViewChild(ThirdPartyComponent) cmp: ThirdPartyComponent;
  name = 'Foo Bar';

  ngAfterViewInit() {
    this.cmp.initials = 'M. D.';
  }
}
```

...which will leave the `ThirdPartyComponent` component in an inconsistent state. The value of the `_name` property of the `ThirdPartyComponent`'s instance will be `Foo Bar` but the value of `initials` will be `M. D.`.

The answer of how to solve this issue is rooted in the [Angular's code](https://github.com/angular/angular/blob/14ee75924b6ae770115f7f260d720efa8bfb576a/modules/%40angular/common/testing/mock_location_strategy.ts#L26). In case we want to make our code AoT-friendly (i.e. bind only to public properties and methods in our templates), and in the same time keep encapsulation, we can use the TypeScript annotation `/** @internal */`:

```javascript
// component.ts
@Component({
  selector: 'third-party',
  template: `
    {{ initials }}
  `
})
class ThirdPartyComponent {
  /** @internal */
  initials: string;
  private _name: string;

  @Input()
  set name(name: string) {...}
}
```

The `initials` property will be public but if we compile our third-party library with `tsc` and the `--stripInternal` and `--declarations` flags set, the `initials` property will be omitted from the type definition file for `ThirdPartyComponent`. This way we will be able to access it within the bounderies of our library but it won't be accessible by its consumers.

#### Summary

Now lets make a quick recap of what's going on behind the scene! Lets suppose we have the `HeroComponent` from the example above. For this component, the Angular compiler will generate two classes:

- `_View_HeroComponent_Host1` - the **internal host component**.
- `_View_HeroComponent1` - the **internal component**.

`_View_HeroComponent1` will be responsible for rendering the template of `HeroComponent` and also, performing change detection. When performing change detection `_View_HeroComponent1` will compare the current value of `this.context.hero.name` with the previous stored value. In case the values are different, the `<h1/>` element will be updated. This means that we need to make sure that `this.context.hero` and `hero.name` are both public. This can be verified by using [codelyzer](https://github.com/mgechev/codelyzer).

On the other hand, `_View_HeroComponent_Host1` will be responsible for rendering `<hero-app></hero-app>` (the host element), and `_View_HeroComponent1` itself.

You can find the entire example summarized on the diagram below:

![AoT Summary](/images/aot-angular/aot-summary.png)

## AoT compilation process compared to JiT

This section answers the question:

- *What implications does AoT has for us - third-party component developers?*

We already described how the Angular compiler works and most of the artifacts it produces. Although the AoT compilation differs from JiT compilation only by the time it's performed there are slight complications.

In JiT once we bootstrap the application we already have our root injector and all the directives available to the root component (they are included in `BrowserModule`). This metadata will be passed to the compiler for the process of compilation of the template of the root component. Once the compiler generates the code with JiT, it has all the metadata which should be used for the generation of the code for all children components. It can generate the code for all of them since it already knows not only which providers are available at this level of the component tree but also which directives are visible there.

This will make the compiler know what to do when it finds an element in the template. For instance, the element `<bar-baz></bar-baz>` can be interpreted in two different ways depending on whether there's a directive with selector `bar-baz` available or not. Whether the compiler will only create an element `bar-baz` or also instantiate the component associated with the selector `bar-baz` depends on the metadata at the current phase of the compilation process (on the current state).

Here comes the problem. How at build time we would know what directives are accessible on all levels of the component tree? Thanks to the great design of Angular we can perform a static-code analysis and find this out! [Chuck Jazdzewski](https://github.com/chuckjaz) and [Alex Eagle](https://github.com/alexeagle) did amazing job in this direction by developing the [`MetadataCollector`](https://github.com/angular/angular/blob/156a52e390256b00ae7c1fe1f80281cb1d1fe773/tools/%40angular/tsc-wrapped/src/collector.ts) and other [related modules](https://github.com/angular/angular/tree/156a52e390256b00ae7c1fe1f80281cb1d1fe773/tools/%40angular/tsc-wrapped). What the collector does is to walk the component tree and extract the metadata for each individual component. This involves some awesome techniques which unfortunately are out of the scope of this blog post.

### AoT and third-party modules

Alright, so the compiler needs metadata for the components in order to compile their templates. Lets suppose that in our application we use a thrid-party component library. How does the Angular AoT compiler knows the metadata of the components defined there if they are distributed as plain JavaScript? It oesn't. **In order to be able to compile ahead-of-time an application, referencing an external Angular library, the library needs to be distributed with the `*.metadata.json` produced by the compiler.**

For further reading on how to use the Angular compiler, you can take a look at the [following link](https://angular.io/docs/ts/latest/cookbook/aot-compiler.html).

## What we get from AoT?

As you might have already guessed, from AoT we get performance. The **initial rendering performance** of each Angular applications we develop with AoT will be much faster compared to a JiT one since the JavaScript Virtual Machine needs to perform much less computations. We compile the templates to JavaScript only once as part of our development process, after that the user gets compiled templates for free!

On the image below you can see how much time it takes to perform the initial rendering with JiT:

<img src="/images/aot-angular/jit.png" style="display: block; margin: auto;">

On the image below you can see how much time it takes to perform the initial rendering with AoT:

<img src="/images/aot-angular/aot.png" style="display: block; margin: auto;">

Another awesome thing about the Angular compiler is that it can emit not only JavaScript but TypeScript as well. This allows us to perform **type checking in templates**!

Since the templates of the application are pure JavaScript/TypeScript, we know exactly what and where is used. This allows us to perform **effective tree-shaking** and drop all the directives/modules which are not used by the application out of the production bundle! On top of that we don't need to include the `@angular/compiler` module in the application bundle since we don't need to perform compilation at runtime!

> **Note that for large to medium size applications the bundle produced after performing AoT compilation will most likely be bigger** compared to same application using JiT compilation. This is because the VM friendly JavaScript produced by `ngc` is more verbose compared to the HTML-like templates, and also includes dirty-checking logic. In case you want to drop the size of the app you can perform lazy loading which is supported natively by the Angular router!

**In some cases, JiT compilation cannot be performed at all**. Since JiT both generates and evaluates code in the browser it uses `eval`. [CSP](https://developer.chrome.com/extensions/contentSecurityPolicy) and some specific environments will not allow us to dynamically evaluate the generated source code.

Last but not least, **energy efficiency**! We already mentioned that by using AoT compilation we drop the bundle sizes of our applications by performing effective tree-shaking (take a look at [this blog post to see what are the actual results and implications](http://blog.mgechev.com/2016/07/21/even-smaller-angular2-applications-closure-tree-shaking/)). The user devices need to perform even less calculations since they don't have to perform JiT. All this reduces battery consumption but how much? Here are the results of a some funny calculations I did :-):

Based on findings by the research "Who Killed My Battery: Analyzing Mobile Browser Energy Consumption" (by N. Thiagarajan, G. Aggarwal, A. Nicoara, D. Boneh, and J. Singh), the process of downloading and parsing jQuery when visiting Wikipedia takes about 4 Joules of energy. Since the paper doesn't mention specific version of jQuery, based on the date when it was published I assume it's talking about v1.8.x. Since Wikipedia uses gzip for compressing their static content this means that the bundle size of jQuery 1.8.3 will be 33K. The gzipped + minified version of `@angular/compiler` is 103K. This means that it'll cost us about 12.5J to download the compiler, process it with JavaScript Virtual Machine, etc. (we're ignoring the fact that we are not performing JiT, which will additionally reduce the processor usage. We do this because in both cases - jQuery and `@angular/compiler` we're opening only a single TCP connection, which is the biggest consumer of energy).

iPhone 6s has a battery which is 6.9Wh which is 24840J. Based on the monthly visits of the official page of AngularJS 1.x there will be at least 1m developers who have built on average 5 Angular 2 applications. Each application have ~100 users per day. `5 apps * 1m * 100 users = 500m`. In case we perform JiT and we download the `@angular/compiler` it'll cost to the Earth `500m * 12.5J = 6250000000J`, which is 1736.111111111KWh. According to Google, 1KWh = ~12 cents in the USA, which means that **we'll spend about $210 for recovering the consumed energy for a day**. Notice that we even didn't take the further optimization that we'll get by applying tree-shaking, which may allow us to drop the size of our application at least twice! :-)

<img src="/images/aot-angular/better-place.jpg" style="display: block; margin: auto;">

## Conclusion

The Angular's compiler improves the performance of our applications dramatically by taking advantage of the inline caching mechanism of the JavaScript Virtual Machines. On top of that we can perform it as part of our build process which solves problems such as forbidden `eval`, allows us to perform more efficient tree-shaking, improves the initial rendering time, and also - **it makes the world a better place** :-).

Do we loose anything by not performing the compilation at runtime? In some very limited cases we may need to generate the templates of the components on demand. This will require us to load non-compiled components and perform the compilation process in the browser, in such cases we'd need to include the `@angular/compiler` module as part of our application bundle. Another potential drawback of AoT compiled large to medium applications is the increase in their bundle size. Since the produced JavaScript for the components' templates has bigger size compared to the templates themselves, this will most likely lead to bigger final bundle.

In general, the AoT compilation is a good technique which is already integrated as part of the [angular-seed](https://github.com/mgechev/angular-seed) and `angular-cli`, so you can take advantage of it today!

## References

- [Inline Caches](http://mrale.ph/blog/2012/06/03/explaining-js-vms-in-js-inline-caches.html)
- [2.5X Smaller Angular 2 Applications with Google Closure Compiler](http://blog.mgechev.com/2016/07/21/even-smaller-angular2-applications-closure-tree-shaking/)
- [Who Killed My Battery: Analyzing Mobile Browser Energy Consumption](https://crypto.stanford.edu/~dabo/pubs/abstracts/browserpower.html)
- [Angular's Source Code](https://github.com/angular/angular)
