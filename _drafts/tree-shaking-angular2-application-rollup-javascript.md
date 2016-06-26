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

Progressive Web Applications help us build native-like web apps, thanks to amazing tools such as Service Workers, IndexDB, App Shell etc. Once the browser downloads all the static assets required by our app, the active Service Worker can cache all of them locally.

This means that the user may experience slowdown during the initial page load, but once the page has been successfully loaded for first time, each next time the load will be instant!

In order to help developers take advantage of the technologies behind the PWA as easy as possible, the Angular team is working on the Angular [mobile-toolkit](https://github.com/angular/mobile-toolkit). However, a big concern for Angular is the framework size itself. For instance, a simple "Hello world!" Angular 2 application, bundled with [browserify](http://browserify.org/) is 1.6MB!

![](/images/not-optimized.png)

This is definitely a lot, and is one of the main things Angular is criticized for. During the keynote of [ng-conf](http://ng-conf.org/), [Brad Green](https://twitter.com/bradlygreen) (manager of the Angular team) mentioned that the core team managed to drop the size of the application above to **less than 50K**!

In this blog post we'll explain all the steps we need to go through in order to achieve such results!

## Sample Application

In order to get a better understanding of the optimizations explained below, lets first describe the sample application that we're going to apply them on.

Our application is going to consist the following two files:

```javascript
// app.component.ts

import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  template: 'Hello world!'
})
export class AppComponent {}
```

..and

```javascript
// main.ts

import { AppComponent } from './app.component';
import { bootstrap } from '@angular/platform-browser-dynamic';

bootstrap(AppComponent);
```

In `app.component.ts` we have a single component with a template which is going to render the text `"Hello world!"`. On the other hand, `main.ts` is responsible for bootstrapping the application, by using the `@angular/platform-browser-dynamic` package.

Our `index.html` page will look like:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>
</head>
<body>
  <my-app></my-app>
  <script src="/node_modules/zone.js/dist/zone.js"></script>
  <script src="/node_modules/reflect-metadata/Reflect.js"></script>
  <script src="dist/bundle.js"></script>
</body>
</html>
```

And here's the directory layout:

```
.
├── app
│   ├── app.component.ts
│   └── main.ts
├── dist
├── index.html
├── package.json
├── tsconfig.json
├── node_modules
├── typings
│   ├── globals
│   │   └── es6-shim
│   └── index.d.ts
└── typings.json
```

`dist` is where the output is going to live (i.e. application bundles), we're using typings and npm in order to manage, respectively, the typings and the dependencies of our application.

## Step 1 - Minification and Compression

The two most obvious optimizations that we can apply are minification and compression. You can find the example explained in this section [here](https://github.com/mgechev/angular2-simple-build). I'd recommend you to clone the repository and run:

```bash
npm install
```

Now we can explore the build process by taking a look at `package.json`:

```json
...
"scripts": {
  "clean": "rm -rf dist",
  "typings": "typings install",
  "serve": "http-server . -p 5556",
  "postinstall": "npm run typings",
  "build": "npm run clean && tsc",
  "build_prod": "npm run build && browserify -s main dist/main.js > dist/bundle.js && npm run minify",
  "minify": "uglifyjs dist/bundle.js --screw-ie8 --compress --mangle --output dist/bundle.min.js"
}
...
```

We have a simple `clean` command which does nothing more than just to remove the `dist` directory. In order to install all the required typings once the `npm install` command has completed, we run `typings install` as `postinstall` script.

Our `build` script first cleans the `dist` directory and after that compiles our application by using the TypeScript compiler. This will produce two files - `main.js` and `app.component.js`, in the `dist` directory.

By using SystemJS we can already use our application in browsers that support SystemJS, but since we want to reduce the number of HTTP requests made by the browser in the process of loading the app, we can bundle it. This is what we do in `build_prod`:

```bash
npm run build && browserify -s main dist/main.js > dist/bundle.js && npm run minify
```

In the script above, first we run the TypeScript compiler, once the app has been compiled, all we need to do is to create a "standalone" bundle with entry point the `dist/main.js` file, and output the bundles content to `bundle.js` within the `dist` directory.

In order to try the app you can use:

```
npm run build_prod
npm run serve
open http://localhost:5556
```

Now lets see what is the bundle size:

```
$ ls -lah bundle.js
-rw-r--r--  1 mgechev  staff   1.6M Jun 26 12:01 bundle.js
```
Wow...so we reached the disastrous point we described above. The bundle contains a bunch of useless content:

- Unused functions, variables...
- A lot of whitespace.
- Comments.
- Non-mangled variables.

In order to reduce the size of the bundle we can now use the `minify` script:

```bash
uglifyjs dist/bundle.js --screw-ie8 --compress --mangle --output dist/bundle.min.js
```

It takes the `bundle.js` file, and optimizes it. The output is now produced in `dist/bundle.min.js`, and its size is:

```bash
$ ls -lah bundle.min.js
-rw-r--r--  1 mgechev  staff   702K Jun 26 12:01 bundle.min.js
```

So, we reduced the size of the bundle to 702K only by applying a simple minification.

Most HTTP servers support compression of the content, with gzip. The requested by the browser resources are compressed by the web server and sent through the network. Responsibility of the client is to decompress them.

Lets find out what is the size of the compressed bundle:

```
$ gzip bundle.min.js
$ ls -lah bundle.min.js.gz
-rw-r--r--   1 mgechev  staff   152K Jun 26 12:01 bundle.min.js.gz
```

We reduced the size of the bundle with another ~78% only by applying gzip. But we can do better!

## Step 2 - Tree-Shaking

In this section we'll use very important property of the ES2015 modules - they are tree-shakable!

<img src="/images/tree-shaking-frame.jpg" id="tree" style="cursor: pointer">
<script>
document.getElementById('tree').onclick = function () {
  this.src = '/images/tree-shaking.gif';
};
</script>

What does tree-shaking mean:

> Tree-shaking, excluding unused exports from bundles.

Because the ES2015 modules are static, by performing a static code analysis over them we can decide which exports are used and which are not used in our application. In contrast, CommonJS modules are not always tree-shakable because of the dynamic nature of JavaScript.

For instance:

```javascript
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Algorithm you want to use for sorting the numbers? ', answer => {
  const sort = require(answer);
  sort([42, 1.618, 4]);
});
```

It is impossible by performing a static code analysis to guess which algorithm will be chosen by the user.
With ES2015 we can do something like:

```javascript
import {Graphs} from './graphs';
import {Algorithms} from './algorithms';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Algorithm you want to use for sorting the numbers? ', answer => {
  const sort = Algorithms[answer];
  sort([42, 1.618, 4]);
});
```

In this way, we will be able to perform tree-shaking and remove the `./graphs` import, since we're not using `Graphs` anywhere. On the other hand, we need to import all sorting algorithms because we have a level of non-determinism - we're not sure what the input of the user is going to be so we can't get rid of anything from `Algorithms`.

### Applying Tree-Shaking with Rollup

Rollup.js is a module bundler which is optimized for ES2015 modules. It is a great, pluggable tool which allows us to perform tree-shaking over ES2015 and CommonJS (by using a plugin).

We're going to integrate Rollup in the example above, trying to achieve even smaller bundle size! The example from this section is [available here](https://github.com/mgechev/angular2-rollup-build).

Now, lets take a look at the `scripts` section in our `package.json` in order to explore the build process:

```json
"scripts": {
  "clean": "rm -rf dist",
  "typings": "typings install",
  "serve": "http-server . -p 5557",
  "postinstall": "npm run typings",
  "build": "tsc -p tsconfig.json",
  "rollup": "rollup -f iife -c -o dist/bundle.es2015.js",
  "es5": "tsc --target es5 --allowJs dist/bundle.es2015.js --out dist/bundle.js",
  "minify": "uglifyjs dist/bundle.js --screw-ie8 --compress --mangle --output dist/bundle.min.js",
  "build_prod": "npm run clean && npm run build && npm run rollup && npm run es5 && npm run minify"
}
```

We have the same `clean`, `typings`, `serve`, `postinstall`, `minify` and `build` scripts like above. The new things here are `rollup`, `es5`, `build_prod`.

`rollup` will be responsible for bundling our app by performing tree-shaking.

TypeScript supports ES2015 modules, which means that we can apply tree-shaking directly over our non-transpiled app. This is further simplified by the [TypeScript plugin for Rollup](https://github.com/rollup/rollup-plugin-typescript) which allows us to perform the transpilation as the part of the bundling. This would work great if the dependencies of our applications were distributed as TypeScript as well. However, Angular 2 is distributed as ES5 and ES2015 (within the `esm` directory), and RxJS is distributed as ES5 and ES2015 (in the `rxjs-es` package).

Since we can't apply tree-shaking directly over the TypeScript of our app, we'll first need to transpile itto TypeScript, after that bundle it to ES2015 bundle by using rollup, and in the end transpile it to ES5.

Because of this there's a very important difference between the `tsconfig.json` presented in the example above, and the one used in this section:

```json
{
  "compilerOptions": {
    "target": "es2015",
    "module": "es2015",
    // ...
  },
  "compileOnSave": false,
  "files": [
    "app/main.ts"
  ]
}
```

Our target version here is `es2015` in order to allow us to transpile our TypeScript application to ES2015 modules.

Now we can explore the `rollup` script:

```
rollup -f iife -c -o dist/bundle.es2015.js
```

Above we tell to `rollup` to bundle the modules as IIFE (Immediately-Invoked Function Expression), use the configuration file provided in the root of the project (`rollup.config.js`) and output the bundle as `bundle.es2015.js` in `dist`.

Now lets explain the `rollup.config.js` file:

```javascript
import nodeResolve from 'rollup-plugin-node-resolve';

class RollupNG2 {
  constructor(options){
    this.options = options;
  }
  resolveId(id, from){
    if (id.startsWith('rxjs/')){
      return `${__dirname}/node_modules/rxjs-es/${id.replace('rxjs/', '')}.js`;
    }
  }
}

const rollupNG2 = (config) => new RollupNG2(config);

export default {
  entry: 'dist/main.js',
  sourceMap: true,
  moduleName: 'main',
  plugins: [
    rollupNG2(),
    nodeResolve({
      jsnext: true, main: true
    })
  ]
};
```

The best thing here is that the file is plain JavaScript! We export the configuration object, and declare inside of it the `entry` point of the application, the `module` name (required if we use IIFE bundle), we declare that we want to have `sourceMap`, and the set of plugins that we want to use.

This is the last tricky part of the configuration! We use the `nodeResovle` plugin for rollup in order to hint the bundler that we want to use node-like module resolution. Once the bundle finds import like `@angular/core`, it'll go to `node_modules/@angular/core` and read the `package.json` file. Once it finds property clled `main:jsnext`, the bundler will use the file pointed as value of it. If such property is not found, the bundler will use the file pointed by `main`.

The problem comes that RxJS is distributed as ES5 by default. In order to handle this problem, for bundling the required RxJS operations we'll use the package `rxjs-es`, which is already [available in `package.json`](https://github.com/mgechev/angular2-rollup-build/blob/master/package.json#L38). After installing this module, we need to make sure that the module bundler will use `rxjs-es` instead of `rxjs` in `node_modules`. This is exactly what the purpose of the `rollupNG2` plugin is - to translate all the `rxjs/*` imports to `rxjs-es/*` ones.

Alright, now if we run:

```bash
npm run clean && npm run build && npm run rollup
```

We'll get the bundle `bundle.es2015.js`. Although Chrome already has 100% ES2015 support, it still doesn't support ES2015 modules, so we'll need to transpile this bundle to ES5.

This can be easily achieved by using the `es5` script:

```bash
tsc --target es5 --allowJs dist/bundle.es2015.js --out dist/bundle.js
```

We use the TypeScript compiler and output the ES5 bundle to `dist/bundle.js` (note that this script may throw an error for `Duplicate identifier _subscribe`).

Now in order to get our final bundle we need to invoke `npm run minify`. To preview the result use:

```bash
npm run serve
```

### Analysis

Lets find out what is the size of our ES5 bundle:

```bash
$ ls -lah bundle.js
-rw-r--r--  1 mgechev  staff   1.4M Jun 26 13:00 bundle.js
```

Great! This is 200K less than the previous section! Now lets see what the bundle size will be after minification:

```bash
$ ls -lah bundle.min.js
-rw-r--r--  1 mgechev  staff   484K Jun 26 13:01 bundle.min.js
```

702K to 484K...not bad at all! After gzipping we get:

```bash
$ ls -lah bundle.min.js.gz
-rw-r--r--  1 mgechev  staff   115K Jun 26 13:01 bundle.min.js.gz
```

About 25% reduction of the bundle size! But I'm sure we can do even better!

*Credits: Igor Minar published similar experiments in the official Angular 2 repository. They can be found [here](https://github.com/angular/angular/tree/a01a54c180470610dc359f1ab8c4503e51e440fa/modules/rollup-test).*

## Using ngc

As [static-analysis enthusiast](https://www.youtube.com/watch?v=bci-Z6nURgE), I'm following the progress around the Angular compiler (**ngc**). The basic idea of ngc is to process the templates of the components in our application and [generate VM friendly, tree-shakable code](http://mrale.ph/blog/2012/06/03/explaining-js-vms-in-js-inline-caches.html). This can happen either run-time or build-time, but since in run-time compilation the application is already loaded in the browser we can't take advantage of tree-shaking. The project is [located here](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli).

Although in the previous example we already applied decent tree-shaking we still can do better! Why? Well, having an HTML template we're not completely sure what parts of Angular we can get rid of from our final bundle since HTML is not something that rollup can analyze statically. That's why we can:

- Compile our application (including templates) to TypeScript with ngc.
- Perform tree-shaking with rollup (this way we will get *at least* as small bundle as above).
- Transpile the bundle to ES5.
- Minify the bundle.
- Gzip it.

Alright, lets begin! The code explained in the paragraphs below can be [found here](https://github.com/mgechev/angular2-ngc-rollup-build).

Lets take a look at the scripts in `package.json`:

```bash
"scripts": {
  "typings": "typings install",
  "serve": "http-server . -p 5558",
  "postinstall": "npm i -f @angular/tsc-wrapped@latest && rm -rf node_modules/@angular/compiler-cli/node_modules && npm run typings",
  "clean": "rm -rf dist && rm -rf app/*.ngfactory.ts && cd compiled && ls | grep -v main-ngc.ts | xargs rm && cd ..",
  "build": "tsc -p tsconfig-tsc.json",
  "rollup": "rollup -f iife -c -o dist/bundle.es2015.js",
  "es5": "tsc --target es5 --allowJs dist/bundle.es2015.js --out dist/bundle.js",
  "minify": "uglifyjs dist/bundle.js --screw-ie8 --compress --mangle --output dist/bundle.min.js",
  "ngc": "ngc -p . && cp app/* compiled",
  "build_prod": "npm run clean && npm run ngc && npm run build && npm run rollup && npm run es5 && npm run minify"
}
```

`build_prod` just confirms the order into which the individual actions need to be performed. Lets take a look at the clean method, since it looks quite complex this time.

```
rm -rf dist && rm -rf app/*.ngfactory.ts && cd compiled && ls | grep -v main-ngc.ts | xargs rm && cd ..
```

What we do here is to remove the `dist` directory, all files which match `app/*.ngfactory.ts` and also everything except `main-ngc.ts` from the `compiled` directory. ngc produces `*.ngfactory.ts` files. Since they are artifacts from the build process we'd want to remove them before the next build. But why we remove everything except `main-ngc.ts` from the `compiled` directory? Lets take a look at the file's content:

```javascript
import {ComponentResolver, ReflectiveInjector, coreBootstrap} from '@angular/core';
import {BROWSER_APP_PROVIDERS, browserPlatform} from '@angular/platform-browser';

import {AppComponentNgFactory} from './app.component.ngfactory';

const appInjector = ReflectiveInjector.resolveAndCreate(BROWSER_APP_PROVIDERS, browserPlatform().injector);
coreBootstrap(AppComponentNgFactory, appInjector);
```

This is how we can bootstrap a precompiled app at the moment of writing. Notice that we bootstrap the app by using `AppComponentNgFactory`, and import it from `app.component.ngfactory`, i.e. a generated file. So, once we compile our app with `ngc` we want to move everything in the `compiled` directory, and after that invoke the TypeScript compiler, in order to make it produce ES2015 code. That is why our `tsconfig.json` is slightly changed as well:

**tsconfig-tsc.json**
```json
{
  "compilerOptions": {
    "target": "es2015",
    "module": "es2015",
    "moduleResolution": "node",
    "declaration": false,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "sourceMap": true,
    "pretty": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitUseStrict": false,
    "noFallthroughCasesInSwitch": true,
    "outDir": "./dist",
    "rootDir": "./compiled"
  },
  "compileOnSave": false,
  "files": [
    "compiled/main-ngc.ts"
  ]
}
```

We are using `compiled/main-ngc.ts` as entry file. Also notice that we have two `tsconfig` files: one for ngc and one for tsc.

Alright...now lets run `npm run ngc`. Once the scripts completes its execution, here's the directory structure of the app:

```
.
├── README.md
├── app
│   ├── app.component.ngfactory.ts
│   ├── app.component.ts
│   └── main.ts
├── compiled
│   ├── app.component.ngfactory.ts
│   ├── app.component.ts
│   ├── main-ngc.ts
│   └── main.ts
├── dist
├── index.html
├── package.json
├── rollup.config.js
├── tsconfig-tsc.json
├── tsconfig.json
├── typings
│   ├── globals
│   │   └── es6-shim
│   └── index.d.ts
└── typings.json
```

Now we can transpile the application to ES2015:

```bash
npm run build
```

At this point we already have the ES2015 version of our app located in `dist`. The only two steps left are:

- Tree-shaking.
- Transpilation from ES2015 to ES5.
- Minification.
- Gzipping.

This is process we're already familiar with so lets invoke the individual scripts one by one without providing further explanation:

```bash
# Bundle the app
npm run rollup

# Notice that this command may fail with "Duplicate _identifier"
# This will not have any impact over the end result.
npm run es5

# Minify the app
npm run minify
```

In order to make sure that everything works you can use:

```bash
npm run serve
```

### Analysis

Lets see how big is our precompiled, tree-shaked app!

```
$ ls -lah bundle.min.js
-rw-r--r--  1 mgechev  staff   210K Jun 26 14:22 bundle.min.js
```

The application got more that twice smaller that it was without ngc!

If we gzip it, we'll get the following results:

```bash
$ ls -lah bundle.min.js.gz
-rw-r--r--  1 mgechev  staff    49K Jun 26 14:22 bundle.min.js.gz
```

The final result is 49K!

*Credits: Rob Wormald who did some experiments with [ngc here](https://github.com/robwormald/ng2-compiler-test2).*

## Conclusion

![](/images/bundle-size-chart.png)

As we can see from the chart above, by applying a set of optimizations over our production bundle we can reduce the size of our application up to 33 times!

This is thanks to a couple of factors:

- Static code analysis, more specifically tree-shaking.
- Minification (including mangling).
- Compression with gzip.

