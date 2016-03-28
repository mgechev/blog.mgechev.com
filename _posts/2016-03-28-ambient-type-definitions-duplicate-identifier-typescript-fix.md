---
title: Managing ambient type definitions and dealing with the "Duplicate identifier" TypeScript error
author: minko_gechev
layout: post
categories:
  - TypeScript
  - Tutorial
  - Basic
tags:
  - TypeScript
  - Tutorial
  - Basic
---

Maintaining the [`angular2-seed`](https://github.com/mgechev/angular2-seed), I found out that the most common problem for developers using the project is:

```
 Duplicate identifier 'export='. (2300)
```

compilation error.

In this quick tutorial I'll show discuss what does this error mean and how you can fix it. In order to get better understanding of the problem we'll discuss the differences between TypeScript and JavaScript, as well as ambient type definitions and typings.

## Intro

Before getting any further we need to tell a few words about the ambient type definitions of TypeScript.

If you are familiar with the differences between TypeScript and JavaScript, you can skip this section.

TypeScript is a statically typed language which is a superset of JavaScript. Being statically typed means that once we write our program it needs to go through a phase of compilation. During this phase the compiler performs type checking in order to verify correctness to some extent. For instance:

```
// person-hero.ts

class Person {
  talk() {
    // ...
  }
}

class Superhero extends Person {
  fly() {
    // ...
  }
}

let bar = new Person();

bar.fly();

```

If we try to compile the above file, the TypeScript compiler will throw the following error:

```
$ tsc person-human.ts
Property 'fly' does not exists on type 'Person'.
```
In contrast, if we run the following file with JavaScript:

```
$ node person-human.js
Uncaught TypeError: bar.fly is not a function
```

Although both scripts throw an error, `tsc` throws the error **compile-time**, compared to `node`, which throws the error **run-time**.

Compile-time errors are easy to handle by developers because they are based on a static code analysis performed over their code. This means that the compiler is able to notify the developers about eventual mistakes **before the code reaches the users**.

On the other hand, in case we use **dynamic typing** with JavaScript, we may not find all the errors that we have made. The code of the dynamically typed languages is harder (even impossible in most cases) for advanced static code analysis so it is quite likely to not find the possible issue in our code base even after we deploy it to production.

### Ambient Type Definitions

Although TypeScript is superset of JavaScript we want to be able to use programs written with TypeScript together with such written in JavaScript. For instance, lets suppose we want to use Angular 2, a framework written in TypeScript, together with jQuery.

TypeScript compiles to JavaScript, which is great. This means that once the TypeScript code has been compiled it can communicate with code written in JavaScript but how to use jQuery within our TypeScript code? Lets take a look at the following example:

```ts
// jquery-demo.ts
let a = $('.foo');
```
We invoke the `$` function with a selector. The code above will produce the following compile-time error:

```
$ tsc jquery-demo.ts
Cannot find name '$'.
```
This is due the fact that TypeScript is much stricter compared to JavaScript. It cannot relay on the fact that we may have included a reference to jQuery somewhere in our page. TypeScript needs to have **declaration** of `$`.

That is why the **ambient type definitions** appeared. In order to declare that we have a global function called `$` what we can do is:

```ts
// jquery-definition.ts
declare var $: Function;

let a = $('.foo');
```

Now if we run:

```
$ tsc jquery-definition.ts

# Will output the file jquery-definition.js
```

Notice that `declare var $: Function` is not a definition of the `$` function but only a **declaration**. In case we run `node jquery-definition.js` we will still get a run-time error because `$` is not defined.

#### Why Ambient Type Definitions?

The main purpose of the ambient type definitions is that they allow text editors and IDEs to perform advanced static analysis over libraries and frameworks written in JavaScript. This is a great benefit since we are able to get compile-time errors and IntelliSense during development! It is much less likely to hit run-time errors caused by misspelling a property name or just passing an object of an incorrect type to a function.

### Managing Ambient Type Definitions

If you are already familiar with typings and tsd you can skip this section.

It is quite likely to use the ambient type definitions for some of the most popular libraries written in JavaScript such, as jQuery, AngularJS 1.x, React, etc.

A few years back, from [DefinitelyTyped](https://github.com/DefinitelyTyped/), created a CLI (Command-Line Interface) manager called `tsd`.

Later this tool was deprecated and replaced by the more advanced one - [`typings`](https://github.com/typings/typings). Typings allows us to download the ambient type definitions of the libraries we use.

You can install `typings` with:

```
$ npm i -g typings
```
In order to install the ambient type definitions of jQuery using `typings` you can use:

```
$ typings install jquery --ambient
```

The code above will produce the following directory structure:

```
.
└── typings
    ├── browser
    │   └── ambient
    │       └── jquery
    │           └── index.d.ts
    ├── browser.d.ts
    ├── main
    │   └── ambient
    │       └── jquery
    │           └── index.d.ts
    └── main.d.ts

7 directories, 4 files
```

### Using Ambient Type Definitions

So far so good, but now how to use the provided type definition?

In the same directory where we installed jQuery's ambient type definitions, lets create the following file:

```ts
// jquery-demo.ts

/// <reference path="./typings/browser/ambient/jquery/index.d.ts"/>
let height = $('.foo').height();
```
Instead of in-lining the type definition inside `jquery-demo.ts` we used the `<reference/>` element.

We can make this even shorter by:

```ts
// jquery-demo.ts

/// <reference path="./typings/browser/browser.d.ts"/>
let height = $('.foo').height();
```

Although this works, it is not quite flexible. If we change the location of the definition file or the location of any file using the definitions we need to change the value of the `path` attribute. `tsconfig.json` allows us to have further flexibility:

### `tsconfig.json`

TypeScript defines a configuration file called `tsconfig.json`. In this file you can provide configuration for the TypeScript compiler. Here is a sample such file:

```json
{
  "compilerOptions": {
    "target": "es5"
  },
  "exclude": [
    "node_modules",
    "dist"
  ],
  "compileOnSave": false
}
```

In this file we've set that we want to use `es5` as target language and that we want to **exclude** the directories `node_modules` and `dist`. Now lets add this file to the directory where we installed the jQuery's ambient type definition.

In the end our directory structure should look like:

```
.
├── jquery-demo.js
├── jquery-demo.ts
├── tsconfig.json
└── typings
    ├── browser
    │   └── ambient
    │       └── jquery
    │           └── index.d.ts
    ├── browser.d.ts
    ├── main
    │   └── ambient
    │       └── jquery
    │           └── index.d.ts
    └── main.d.ts

7 directories, 7 files
```
Thanks to the `tsconfig.json` we can compile our `jquery-demo.ts` using:

```
$ tsc
```

This way `tsc` will pick its configuration from the `tsconfig.json` file.

After running the command...we get plenty of:

```
# ...
typings/main/ambient/jquery/index.d.ts(2829,5): error TS2300: Duplicate identifier 'length'.
typings/main/ambient/jquery/index.d.ts(2834,5): error TS2300: Duplicate identifier 'selector'.
typings/main/ambient/jquery/index.d.ts(2835,5): error TS2374: Duplicate string index signature.
typings/main/ambient/jquery/index.d.ts(2836,5): error TS2375: Duplicate number index signature.
typings/main/ambient/jquery/index.d.ts(3209,5): error TS2300: Duplicate identifier 'export='.
```

This is due the reason that:

- `typings/browser/ambient/jquery/index.d.ts`
- `typings/main/ambient/jquery/index.d.ts`

Contain the **same** definitions! In order to fix the error we should take advantage of the **exclude** section of `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es5"
  },
  "exclude": [
    "node_modules",
    "dist",
    "typings/main",
    "typings/main.d.ts"
  ],
  "compileOnSave": false
}
```
Now when we run:

```
$ tsc
```

We can even remove the `<reference/>` tag from `jquery-demo.ts` and everything is still going to work! The behaviour of `tsc` in this case will be: "Take **all** the files and **all** the type definitions from the current directory and all of its subdirectories, except the ones declared in the 'exclude' array".

### No Namespacing of Type Definitions

You might be wondering why would we have the same type definitions in both `main` and `browser`? The ambient type definitions in **TypeScript cannot be namespaced**. Why not? Well, if we use jQuery in our project and we cannot include two different sets of ambient type definitions since we have a single global `jQuery` object, so only a single interface.

For this purpose `typings` uses two different sets of type definitions - for the front-end of our application and for its back-end/build/whatever.

## Recap

In recap:

- TypeScript is statically typed language, which is great since we can catch the errors we do before the users of our software!
- TypeScript adds type definitions through type annotations which help the compiler to perform advanced static code analysis.
- We can take advantage of static typing with non-TypeScript library by using **ambient type definitions** with tools like [typings](https://github.com/typings/typings).
- The ambient type definitions are not namespaced, they are always global!
- Fix `Duplicate *` error in TypeScript by using `tsconfig.json`'s **exclude** section and add there the redundant type definitions.
- Using `<reference/>` is considered a bad practice.

