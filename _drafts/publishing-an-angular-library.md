---
title: Developing an Angular Library - The Definitive Guide
author: minko_gechev
layout: post
categories:
  - Angular
  - TypeScript
  - Case study
tags:
  - Angular
  - TypeScript
---

In this post I'll quickly explain everything you need to know in order to publish an Angular component to npm. By the end of the post you'll know how your module to:

- Be platform independent (i.e. run in Web Workers, Universal).
- Should be bundled and distributed.
- Work with the Angular's Ahead-of-Time compiler.

Along the way, I'll provide examples from a module I recently released called [`ngresizable`](https://github.com/mgechev/ngresizable). [`ngresizable`](https://github.com/mgechev/ngresizable) is a simple component which can make a DOM element resizable.

*If you find anything missing, please don't hesitate to comment below.*

# Writing platform independent components

One of the greatest strengths of Angular is that the framework is platform agnostic. Basically, all the modules which has to interact with the underlaying platform depend on an abstraction. This is the abstract `Renderer`. The code you write should also depend on an abstraction, instead of a concrete platform APIs. In short, this means that if you're building your library for the web, you should not touch the DOM directly!

<img src="/images/ng-lib/decouple.jpg" alt="Decouple package" style="display: block; margin: auto">

Lets take a look at an example:

```ts
// ANTI-PATTERN

@Component({
  selector: 'my-zippy',
  template: `
    <section class="zippy">
      <header #header class="zippy-header">{{ title }}</header>
      <section class="zippy-content" id="zippy-content">
        <ng-content></ng-content>
      </section>
    </section>
  `
})
class ZippyComponent {
  @Input() title = '';
  @Input() toggle = true;
  @ViewChild('header') header: ElementRef;

  ngAfterViewInit() {
    this.header.nativeElement.addEventListener('click', () => {
      this.toggle = !this.toggle;
      document.querySelector('#zippy-content').hidden = !this.toggle;
      if (this.toggle) {
        this.header.nativeElement.classList.add('toggled');
      } else {
        this.header.nativeElement.classList.remove('toggled');
      }
    });
  }
}
```

This snippet is quite coupled to the underlaying platform, and contains plenty of other anti-patterns, for instance we:

1. Direclty interact with the header DOM element by invoking it's method `addEventListener`.
2. Do not clear the event listener we add to the header element.
3. Access the `classList` property of the native header element.
4. Access property of the global object `document` which is not available in Web Workers, for instance.

Lets refactor it, in order to make it platform agnostic:

```ts
// Alright...

@Component({
  selector: 'my-zippy',
  template: `
    <section class="zippy">
      <header #header class="zippy-header">{{ title }}</header>
      <section #content class="zippy-content" id="zippy-content">
        <ng-content></ng-content>
      </section>
    </section>
  `
})
class ZippyComponent implements AfterViewInit, OnDestroy {
  @ViewChild('header') header: ElementRef;
  @ViewChild('content') content: ElementRef;
  @Input() title = '';
  @Input() toggle = true;
  
  private cleanCallback: any;

  constructor(private renderer: Renderer) {}

  ngAfterViewInit() {
    this.cleanCallback = this.renderer.listen(this.header.nativeElement, 'click', () => {
      this.toggle = !this.toggle;
      this.renderer.setElementProperty(this.content.nativeElement, 'hidden', !this.toggle);
      this.renderer.setElementClass(this.header.nativeElement, 'toggled', this.toggle);
    });
  }

  ngOnDestroy() {
    if (typeof this.cleanCallback === 'function')
      this.cleanCallback();
  }
}
```

The code above looks better. It'll work on multiple platforms because we use the [`Renderer`](https://angular.io/docs/ts/latest/api/core/index/Renderer-class.html) instead of directly manipulating the DOM and accessing globals.

Although it works, we can do a bit better. We do a lot of manual things, for instance, imperatively listening for the `click` event and after that removing the listener:


```ts
// Best

@Component({
  selector: 'my-zippy',
  template: `
    <section class="zippy">
      <header (click)="toggleZippy()" [class.toggled]="toggle"
        class="zippy-header">{{ title }}</header>
      <section class="zippy-content" [hidden]="!toggle">
        <ng-content></ng-content>
      </section>
    </section>
  `
})
class ZippyComponent implements AfterViewInit, OnDestroy {
  @Input() title = '';
  @Input() toggle = true;

  toggleZippy() {
    this.toggle = !this.toggle;
  }
}
```

The code above contains a better implementation, which is platform agnostic and also testable (we toggle the value of `this.toggle` in the method `toggleZippy` so we can write a test for the method).

# Distributing the components

The components' distribution is not a trivial problem. Even Angular went through several different structures of their npm modules. The things we need to consider for our packages are:

1. They should be tree-shakable for in the production build.
2. Developers should be able to use them as easy as possible in development mode, i.e. no transpilation of any kind should be required.
3. We need to keep the lean to save network bandwidth and time.

<img src="/images/ng-lib/package.jpg" alt="Distribute package" style="display: block; margin: auto">

In order to keep the module tree-shakable, we need to distribute it in a way that it uses ES2015 modules. By having it in this format bundlers, such as [Rollup](http://rollupjs.org/) and [Webpack](https://webpack.github.io/), will be able to get rid of unused exports.

We can use `tsc` for this purpose and our `tsconfig.json` should look something like:

```js
{
  "compilerOptions": {
    "target": "es5",
    "module": "es2015",
    "sourceMap": true,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "outDir": "./dist",
    "lib": ["es2015", "dom"]
  },
  "files": [
    "./lib/ngresizable.module.ts"
  ]
}
```

This is a configuration file copied from `[ngresizable](https://github.com/mgechev/ngresizable)`.

If we want to make the life of people who are using our package easier, we should also provide ES5 version of it. Here we have two options:

- Distribute it in two directories - `esm` and `es5` which respectively contain two different versions of our package:
  - `esm` - contains the ES5 version that uses ES2015 modules.
  - `es5` - contains ES5 version of the package which uses commonjs, for instance.
- Distribute the packages with `esm` and also provide ES5 UMD (Universal Module Definition) bundle.

The second approach has a few advantages:

- We don't bloat the package with additional files - we have only the `esm` version of our package and a single bundle which contains everything else.
- When developers use our package in development with SystemJS their browser can load the entire package with only a single request to the UMD bundle. In contrast, if we distribute the package without bundling the modules but providing them in individual files instead, SystemJS will send request for each file. Once your project grows this can become unpleasant by slowing down each page refresh dramatically.

## Configuring the package

So, now we have two different versons of our code `esm` and ES5 UMD bundle. The question is what entry file in `package.json` should we provide. We want bundlers which understand `esm` to use the ES2015 modules, and bundles which don't know how to use ES2015 modules to use the UMD bundle.

In order to do this we can:

- Set the value of `main` to the ES5 UMD bundle.
- Set the value of `jsnext:main` to the entry file of the `esm` version of the app.

In the end our [`package.json`](https://github.com/mgechev/ngresizable) can look something like:

```js
{
  ...
  "main": "ngresizable.bundle.js",
  "jsnext:main": "ngresizable.module.js",
  ...
}
``` 

So far so good, but that's not all!

## Providing type definitions

Since most likely the users of the package will use TypeScript, we need to provide type definitions for them. To do this, we need to enable the `declaration` flag in `tsconfig.json` and set the `types` field of our `package.json`.

`tsconfig.json` should look like:

```js
{
  "compilerOptions": {
    "target": "es5",
    "module": "es2015",
    "sourceMap": true,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "declaration": true,
    "outDir": "./dist",
    "lib": ["es2015", "dom"]
  },
  "files": [
    "./lib/ngresizable.module.ts"
  ]
}
```

...and respectively `package.json`:

```js
{
  ...
  "main": "ngresizable.bundle.js",
  "jsnext:main": "ngresizable.module.js",
  "types": "ngresizable.module.d.ts",
  ...
}
```

# Compatibility with Angular's AoT Compiler

Ahead-of-Time compilation is a great feature and we need to develop & distribute our modules compatible with the compiler.

<img src="/images/ng-lib/compatible.jpg" alt="Compatible with compiler" style="display: block; margin: auto">

If we distribute our module as JavaScript without any additional metadata, users who depend on our package will not be able to compile their application. But how can we provide metadata to `ngc`? Well, we can include the TypeScript version of our modules as well...but it's not required.

Instead, we can precompile our module with `ngc` and enable the `"skipTemplateCodegen": true` option in `tsconfig.json`, our `tsconfig.json` can look like:

```js
{
  "compilerOptions": {
    "target": "es5",
    "module": "es2015",
    "sourceMap": true,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "outDir": "./dist",
    "lib": ["es2015", "dom"]
  },
  "files": [
    "./lib/ngresizable.module.ts"
  ],
  "angularCompilerOptions": {
    "skipTemplateCodegen": true
  }
}
```

By default `ngc` generates ngfactories for our components and modules. By using `skipTemplateCodegen` we can skip this code generation and only get `*.metadata.json` files.

# Recap

After applying all these build steps, the final structure of the [`ngresizable`](https://github.com/mgechev/ngresizable) module will look like:

```
.
├── README.md
├── ngresizable.actions.d.ts
├── ngresizable.actions.js
├── ngresizable.actions.js.map
├── ngresizable.actions.metadata.json
├── ngresizable.bundle.js
├── ngresizable.component.d.ts
├── ngresizable.component.js
├── ngresizable.component.js.map
├── ngresizable.component.metadata.json
├── ngresizable.module.d.ts
├── ngresizable.module.js
├── ngresizable.module.js.map
├── ngresizable.module.metadata.json
├── ngresizable.reducer.d.ts
├── ngresizable.reducer.js
├── ngresizable.reducer.js.map
├── ngresizable.reducer.metadata.json
├── ngresizable.store.d.ts
├── ngresizable.store.js
├── ngresizable.store.js.map
├── ngresizable.store.metadata.json
├── ngresizable.utils.d.ts
├── ngresizable.utils.js
├── ngresizable.utils.js.map
├── ngresizable.utils.metadata.json
└── package.json
```

As recap, notice that in the final package we have:

- `ngresizable.bundle.js` - an ES5 UMD bundle of the module.
- `esm` ES5 version of our code - which allows tree-shaking.
- `*.js.map` - source map files for easier debugging.
- `*.metadata.json` - metadata required for ngc to do its job.
- `*.d.ts` - type definitions which allow TypeScript to perform compile-time type checking and allow intellisense for our library.

# Other topics

Very important topic that needs to be considered is related to following the style guide. Your modules should follow best practices especially when with given practice you can impact a dependent project. For further information visit [angular.io/styleguide](https://angular.io/styleguide).

For instance, the ngresizable component violates a practice from the styleguide:

- It uses component as an attribute. This is a practice which violation is acceptable in this specific case because of implementation details of the component.

*Note that using `ng` as prefix of selector for your directives/components is not recommended because of possible collisions with components coming from Google.*
