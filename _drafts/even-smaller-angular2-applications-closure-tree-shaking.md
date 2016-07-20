---
title: Building an Angular 2 Application for Production
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

In the blog post "[Building an Angular 2 Application for Production](http://blog.mgechev.com/2016/06/26/tree-shaking-angular2-production-build-rollup-javascript/)" we explored how we can decrease the bundle size of an Angular 2 application to 49K! We did this by using the following techniques:

- Using the Angular offline template compiler in order to generate tree-shakable code.
- Tree-shaking of JavaScript that uses ES2015 modules with rollup.
- Bundling of the application.
- Minification with uglifyjs.
- Compression with gzip.

Although we achieved impressive results we can do even better! In this post I'll show some of the work done by [Alex Eagle](https://twitter.com/Jakeherringbone) and [Jeff Cross](https://twitter.com/jeffbcross) from the Angular core team.

<div class="warning-box">
  <strong>Disclaimer</strong>: This article explains very early stage, experimental tools which **WILL** change in near future. **Do not** use anything described here in production.
</div>

## Closure Compiler

For our purpose we'll use the Google Closure Compiler:

> The Closure Compiler is a tool for making JavaScript download and run faster. Instead of compiling from a source language to machine code, it compiles from JavaScript to better JavaScript. It parses your JavaScript, analyzes it, removes dead code and rewrites and minimizes what's left. It also checks syntax, variable references, and types, and warns about common JavaScript pitfalls.

The steps that we are going to go through this time are going to be much simplified since Closure Compiler can do most of the work for us, such as tree-shaking, minification and bundling! This help us reduce the tools from our tool-chain to only ngc, Closure Compiler!

## Efficient Building

Since all the obstacles are well described by Alex Eagle in [this comment](https://github.com/angular/angular/issues/8550#issuecomment-218908407), and [this document](https://docs.google.com/document/d/17m1GwzXraKgbCkCmH1JnY9IZzPy4cqlpCFVhvlZnOys/edit#). In general, in order to be able to bundle our application with Closure and apply tree-shaking, we need to have a custom build of Angular and its dependencies. This is due the reason that Closure Compiler doesn't really like ES2015 modules.

- We need a custom build of Angular and its dependencies because Google Closure Compiler doesn't support ES2015 modules.
  - The build of Angular goes through ngc and [tsickle](https://github.com/angular/tsickle) (TypeScript to Closure Annotator).

