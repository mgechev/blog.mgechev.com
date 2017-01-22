---
title: Distributing an Angular Library - The Brief Guide
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

In this post I'll quickly explain the minimum you need to know in order to publish an Angular component to npm. By the end of the post you'll know how your module to:

- Be platform independent (i.e. run in Web Workers, Universal).
- Should be bundled and distributed.
- Work with the Angular's Ahead-of-Time compiler.
- Play well with TypeScript by allowing autocompletion and compile-time type checking.

*If you're only interested in a quick checklist of things you need to consider for distributing your Angular library, go directly to the "[Distributing an Angular Library - Checklist](#checklist)" section.*

Note that this article doesn't aim to provide complete guidelines for developing an npm module. If you're looking for this, I can recommend you:

- [Creating Node.js modules](https://docs.npmjs.com/getting-started/creating-node-modules)
- [module best practices](https://github.com/mattdesl/module-best-practices)
- [How to build and publish an Angular module](https://medium.com/@cyrilletuzi/how-to-build-and-publish-an-angular-module-7ad19c0b4464)

Along the way, I'll provide examples from a module I recently released called [`ngresizable`](https://github.com/mgechev/ngresizable). [`ngresizable`](https://github.com/mgechev/ngresizable) is a simple component which can make a DOM element resizable.

*If you find anything important missing, please don't hesitate to comment below.*

# Writing platform independent components

One of the greatest strengths of Angular is that the framework is platform agnostic. Basically, all the modules which have to interact with the underlaying platform depend on an abstraction. This is the abstract `Renderer`. The code you write should also depend on an abstraction, instead of a concrete platform APIs (see the [dependency inversion principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)). In short, if you're building your library for the Web, you should not touch the DOM directly because this will make it unable to work in Web Workers and on the server and most developers need that!

<img src="/images/ng-lib/decouple.jpg" alt="Decouple package" style="display: block; margin: auto">

Lets take a look at an example:

```ts
// ANTI-PATTERN

{% raw %}
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
{% endraw %}
```

This snippet is quite coupled to the underlaying platform, and contains plenty of other anti-patterns, for instance we:

1. Direclty interact with the `header` DOM element by invoking it's method `addEventListener`.
2. Do not clear the event listener we add to the `header` element.
3. Access the `classList` property of the native `header` element.
4. Access property of the global object `document`, however, `document` is not available on other platforms.

Lets refactor the code, in order to make it platform agnostic:

```ts
// Alright...

{% raw %}
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
{% endraw %}
```

The code above looks better. It'll work on multiple platforms because we use the [`Renderer`](https://angular.io/docs/ts/latest/api/core/index/Renderer-class.html) instead of directly manipulating the DOM and accessing globals.

Although it works, we can do a bit better. We do a lot of manual things, for instance, imperatively listening for the `click` event and after that removing the listener:


```ts
// Best

{% raw %}
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
{% endraw %}
```

The code above contains a better implementation, which is platform agnostic and also testable (we toggle the visibility of the content in the method `toggleZippy` so we can write tests for this easier).

# Distributing the components

The components' distribution is not a trivial problem. Even Angular went through several different structures of their npm modules. The things we need to consider for our packages are:

1. They should be tree-shakable. Tree-shaking is exclusively used for producing a production bundle, because it allows us to drop unused exports.
2. Developers should be able to use them as easy as possible in development mode, i.e. no transpilation of any kind should be required.
3. We need to keep the package lean to save network bandwidth and download time.

<img src="/images/ng-lib/package.jpg" alt="Distribute package" style="display: block; margin: auto">

In order to keep the module tree-shakable, we need to distribute it in a way that it uses ES2015 modules (also known as `esm`). By having it in this format bundlers, such as [Rollup](http://rollupjs.org/) and [Webpack](https://webpack.github.io/), will be able to get rid of unused exports.

For this purpose we can use `tsc` so our `tsconfig.json` should look something like:

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

This is a configuration file copied from [`ngresizable`](https://github.com/mgechev/ngresizable).

If we want to make the life of people who are using our package easier, we should also provide ES5 version of it. Here are two options to be considered:

- Distribute it in two directories - `esm` and `es5` which respectively contain two different versions of our module's JavaScript files:
  - `esm` - contains an ES5 version that uses ES2015 modules.
  - `es5` - contains an ES5 version of the package which doesn't use any ES2015 syntax (i.e. the modules are in commonjs, amd, system or UMD format).
- Distribute the packages with `esm` and also provide ES5 UMD (Universal Module Definition) bundle.

The second approach has a few advantages:

- We don't bloat the package with additional files - we have only the `esm` version of our package and a single bundle which contains everything else.
- When developers use our package in development with SystemJS their browser can load the entire library with only a single request to the UMD bundle. In contrast, if we distribute the package without bundling the module but providing it as individual files instead, SystemJS will send request for each file. Once your project grows this can become inconvenient by slowing down each page refresh dramatically.

It doesn't matter much which tool we'd choose for producing the UMD ES5 bundle. Google, for instance, [uses rollup for bundling Angular](https://github.com/angular/angular/blob/master/modules/%40angular/core/rollup.config.js), which is also the case for [ngresizable](https://github.com/mgechev/ngresizable/blob/master/rollup.config.js).

In the end, since we don't have to complicate the directory structure of the package additionally, we can simply output both, the `esm` version of our code and the UMD bundle, in the root of directory of the distribution.

## Configuring the package

So, now we have two different versions of our code `esm` and ES5 UMD bundle. The question is what entry file in `package.json` should we provide? We want bundlers which understand `esm` to use the ES2015 modules, and bundles which don't know how to use ES2015 modules to use the UMD bundle instead.

In order to do this we can:

- Set the value of the `main` property of `package.json` to point to the ES5 UMD bundle.
- Set the value of the `module` property to point to the entry file of the `esm` version of the library. `module` is a field in `package.json` where bundlers such as rollup and webpack 2 expect to find a reference to the ES2015 version of the code. Note that some older versions of the bundlers use `jsnext:main` instead of `module` so we need to set both properties.

Our final [`package.json`](https://github.com/mgechev/ngresizable) should look something like:

```js
{
  ...
  "main": "ngresizable.bundle.js",
  "module": "ngresizable.module.js",
  "jsnext:main": "ngresizable.module.js",
  ...
}
``` 

So far so good, but that's not all!

## Providing type definitions

Since most likely the users of the package will use TypeScript, we need to provide type definitions to them. To do this, we need to enable the `declaration` flag in `tsconfig.json` and set the `types` field of our `package.json`.

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
  "module": "ngresizable.module.js",
  "jsnext:main": "ngresizable.module.js",
  "types": "ngresizable.module.d.ts",
  ...
}
```

# Compatibility with Angular's AoT Compiler

Ahead-of-Time compilation is a great feature and we need to develop & distribute our modules compatible with the compiler.

<img src="/images/ng-lib/compatible.jpg" alt="Compatible with compiler" style="display: block; margin: auto">

If we distribute our module as JavaScript without any additional metadata, users who depend on our package will not be able to compile their Angular application. But how can we provide metadata to `ngc`? Well, we can include the TypeScript version of our modules as well...but it's not required.

Instead, we should precompile our module with `ngc` and enable the `skipTemplateCodegen` flag in `tsconfig.json`'s `angularCompilerOptions`. After the last update our `tsconfig.json` will look like:

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
  ],
  "angularCompilerOptions": {
    "skipTemplateCodegen": true
  }
}
```

By default `ngc` generates ngfactories for the components and modules. By using `skipTemplateCodegen` flag we can skip this and only get `*.metadata.json` files.

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

<div style="padding: 20px; background-color: #E3F8FF;">

<h1 id="checklist">Distributing an Angular Library - Checklist</h1>

In this section we'll wrap things up, by briefly mentioning each point you need to consider:

<ul>
  <li>Try not to directly access DOM APIs (i.e. follow the dependency inversion principle).</li>
  <li>Provide <code>esm</code> version of your library in order to allow tree-shaking.
    <ul>
      <li>Reference the <code>esm</code> version under the <code>module</code> and <code>jsnext:main</code> properties in <code>package.json</code>.</li>
    </ul>
  </li>
  <li>Provide ES5 bundle of your library.
    <ul>
      <li>Reference the bundle under the <code>main</code> property of your <code>package.json</code>.</li>
    </ul>
  </li>
  <li>Provide the type definitions of your library by generating them with <code>tsc</code> with the <code>declaration</code> flag set to <code>true</code>.
    <ul>
      <li>Reference the type definitions corresponding to the main module of your package in the <code>types</code> property in your <code>package.json</code>.</li>
    </ul>
  </li>
  <li>Compile your library with <code>ngc</code> and include the generated <code>*.metadata.json</code> files in your package. The <code>tsconfig.json</code> used by <code>ngc</code> should have <code>skipTemplateCodegen</code> set to true, under <code>angularCompilerOptions</code>.</li>
</ul>

</div>

# Conclusion

In this blog post we explained briefly the most important things you need to consider when it comes to distribute your Angular library.

We explained how to keep the library decoupled from the underlaying platform. After that we went to distributing your code in a way that it's tree-shakable and has minimum overhead over the user. As next section we described how to make the library friendly to the Angular's Ahead-of-Time compiler.

Finally, we summarized all the practices in a short list which can serve you as a checklist.

