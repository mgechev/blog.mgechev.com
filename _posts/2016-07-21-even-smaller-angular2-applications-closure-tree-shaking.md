---
title: Even Smaller Angular 2 Applications - 20K Production Bundle
author: minko_gechev
layout: post
categories:
  - JavaScript
  - Angular 2
  - DevOps
tags:
  - rollup
  - tree-shaking
  - commonjs
---

In the post "[Building an Angular 2 Application for Production](http://blog.mgechev.com/2016/06/26/tree-shaking-angular2-production-build-rollup-javascript/)" we explored how we can decrease the bundle size of a "Hello world!" application to from about 1.6M (non-minified & uncompressed) to 49K! We did this by using the following techniques:

- Angular offline template compiler for generating tree-shakable code.
- Tree-shaking of ES2015 modules with rollup.
- Bundling of the application.
- Minification with uglifyjs.
- Compression with gzip.

Although we achieved impressive results we can do even better! In this post I'll show some of the work done by [Alex Eagle](https://twitter.com/Jakeherringbone) and [Jeff Cross](https://twitter.com/jeffbcross) from the Angular core team.

<div class="warning-box">
  <strong>Disclaimer</strong>: This article explains a research which uses experimental tools tools which <strong>WILL</strong> change in near future. <strong>Do not</strong> use anything described here in production.
</div>

## Closure Compiler

For our purpose we'll use the Google Closure Compiler:

> The Closure Compiler is a tool for making JavaScript download and run faster. Instead of compiling from a source language to machine code, it compiles from JavaScript to better JavaScript. It parses your JavaScript, analyzes it, removes dead code and rewrites and minimizes what's left. It also checks syntax, variable references, and types, and warns about common JavaScript pitfalls.

The steps that we are going to go through this time will be simplified since Closure Compiler can do most of the work for us, such as tree-shaking, minification and bundling! This will help us to reduce the tools from our tool-chain to only ngc and Closure Compiler!

Everything looks like a piece of cake at first, however, there are some complications:

## Obstacles - Incomplete ES2015 Module Support

Fortunately, Google Closure compiler [officially supports ES2015](https://www.reddit.com/r/javascript/comments/3pb750/ecmascript_6_is_now_officially_supported_by/), but unfortunately it supports only a subset of the module syntax. For instance:

**bar.js**

```javascript
export const bar = 42;
```

**index.js**

```javascript
export * from './bar';
```

**foo.js**

```javascript
import {bar} from './index';
console.log(bar);
```

...is not supported by Closure Compiler because of `export * from ./bar`.

## Solution - `goog.module`

An alternative module syntax that works well with the compiler is `goog.module`. Unfortunately the TypeScript compiler doesn't support transpilation to `goog.module`s. For this purpose we have to use `tsc` combined with the tool [`tsickle`](https://github.com/angular/tsickle) which allows us to hook in the `ngc` compilation process and emit Closure-friendly ES2015 instead.

In short, we need a custom build of Angular and all of its dependencies to `goog.module` modules. At this point this is achievable by going through a list of hacky solutions, however, soon the CLI and the [Angular starters](https://github.com/mgechev/angular2-seed) will automate this process completely and will eliminate all the boilerplates.

## Results

[Alex Eagle](https://github.com/alexeagle), posted his experiment [on GitHub](https://github.com/alexeagle/closure-compiler-angular-bundling) and shared all the details about the build process in [this document](https://docs.google.com/document/d/17m1GwzXraKgbCkCmH1JnY9IZzPy4cqlpCFVhvlZnOys/edit).

Lets run the build script and see what the bundle size of our Angular application will be!

Note that the build script below requires `brotli`. Brotli is a tool which implements the brotli general-purpose lossless compression algorithm. For further details visit [Brotli's GitHub](https://github.com/google/brotli) repository.

```
$ git clone https://github.com/mgechev/closure-compiler-angular-bundling
$ cd closure-compiler-angular-bundling
$ npm install
$ npm run build
```

Now if we go to `dist` we'll find:

```
$ cd dist
$ ls -lah
total 344
drwxr-xr-x   7 mgechev  staff   238B Jul 21 12:18 .
drwxr-xr-x  15 mgechev  staff   510B Jul 21 12:18 ..
-rw-r--r--   1 mgechev  staff    80K Jul 21 12:18 bundle.js
-rw-r--r--   1 mgechev  staff    20K Jul 21 12:18 bundle.js.brotli
-rw-r--r--   1 mgechev  staff    23K Jul 21 12:18 bundle.js.gz
-rw-r--r--   1 mgechev  staff   3.7K Jul 21 12:18 property_renaming_report
-rw-r--r--   1 mgechev  staff    32K Jul 21 12:18 variable_renaming_report
```

20K bundle! We have almost 150% improvement compared to our previous experiments!

In order to make sure that the application works run:

```
$ npm run serve
```

The code from above is hosted in my [GitHub account](https://github.com/mgechev/closure-compiler-angular-bundling).

### Comparison

On the diagram below you can find how the Google Closure Compiler + ngc bundle stays next to the other ones produced by the different bundling strategies explored in the [previous post](http://blog.mgechev.com/2016/06/26/tree-shaking-angular2-production-build-rollup-javascript/):

<a href="/images/ng2-build/ngc-closure-compiler-all.png">
  <img src="/images/ng2-build/ngc-closure-compiler-all.png" alt="ngc + Google Closure Compiler bundle comparison" width="500">
</a>

Since the size amplitude above is huge, the diagram below illustrates how the bundle produced in this post compares to the other compressed bundles from the previous post:

<a href="/images/ng2-build/ngc-closure-compiler-smaller.png">
  <img src="/images/ng2-build/ngc-closure-compiler-smaller.png" alt="ngc + Google Closure Compiler bundle comparison" width="500">
</a>

## Conclusion

With the advanced compression of Google Closure Compiler we are able to drop the bundle size of a "Hello world!" application to 20K! However, this came with the price of a few hacks - custom build of Angular and its dependencies to `goog.module`s. However, in near future the entire process will be completely abstracted and automated. This will allow us to apply advanced build techniques such as offline compilation, tree-shaking, transpilation, compression and minification with only a single command!

## References

For further reference take a look at the following resources:

- [Use Closure Compiler with offline template compiler](https://github.com/angular/angular/issues/8550)
- [Closure compiler for ng2 optimisation](https://docs.google.com/document/d/17m1GwzXraKgbCkCmH1JnY9IZzPy4cqlpCFVhvlZnOys/edit)
- [Docker for production build of Angular apps with Google Closure Compiler](https://github.com/lucidsoftware/closure-typescript-example)

