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

Maintaining the [`angular-seed`](https://github.com/mgechev/angular-seed), I found out that the most common problem for developers using the project is:

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

Although both scripts throw an error, `tsc` throws the error **compile-time**, compared to `node`, which throws the error **runtime**.

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

The main purpose of the ambient type definitions is that they allow text editors and IDEs to perform advanced static analysis over libraries and frameworks written in JavaScript. This is a great benefit since we are able to get compile-time errors and IntelliSense during development! It is much less likely to hit runtime errors caused by misspelling a property name or just passing an object of an incorrect type to a function.

### Managing Ambient Type Definitions

It is quite likely to use the ambient type definitions for some of the most popular libraries written in JavaScript such, as jQuery, AngularJS 1.x, React, etc.

A few years back, from [DefinitelyTyped](https://github.com/DefinitelyTyped/), created a CLI (Command-Line Interface) manager called `tsd`.

Later this tool was deprecated and replaced by the more advanced one - [`typings`](https://github.com/typings/typings). Typings allows us to download the ambient type definitions of the libraries we use.

As part of the released of TypeScript 2, Microsoft [announced a way](https://blogs.msdn.microsoft.com/typescript/2016/06/15/the-future-of-declaration-files/) to manage the TypeScript external type definitions with the `npm` registry (so we can use both `npm` and `yarn`).

By default as part of `tsconfig.json`'s `compilerOptions` you can include the `lib` property. It contains a list of library files, with their corresponding type definitions. This means that if your compilation target is ES5, and you're building for the browser you should include: `es5` and `dom`, if you're using ES6 features, than you should include `es6` and so on. This will automatically include definitions for ES6 features such as `Map`, `Set`, etc. and the corresponding type definitions. More about the `lib` property can be found [here](https://www.typescriptlang.org/docs/handbook/compiler-options.html).

In order to install the ambient type definitions of jQuery using `npm` you can use:

```
$ npm i @types/jquery --save-dev
```

Note that you usually want to use the `--save-dev` flag instead of `--save` since most likely you don't want the users of your `npm` package to install the type definitions of your third-party dependencies.

### Using Ambient Type Definitions

So far so good, but now how to use the provided type definition?

In the same directory where we installed jQuery's ambient type definitions, lets create the following file:

```ts
// jquery-demo.ts

/// <reference path="./node_modules/@types/jquery/index.d.ts"/>
let height = $('.foo').height();
```

Although this works, it is not quite flexible. If we change the location of the definition file or the location of any file using the definitions we need to change the value of the `path` attribute. `tsconfig.json` allows us to have further flexibility:

### `tsconfig.json`

TypeScript defines a configuration file called `tsconfig.json`. In this file you can provide configuration for the TypeScript compiler. Here is a sample such file:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "es6"],
    "typeRoots": [
      "./node_modules/@types"
    ]
  },
  "exclude": [
    "node_modules",
    "dist"
  ],
  "compileOnSave": false
}
```

In order to hint `tsc` where to look for the installed external type definitions you can use the `typeRoots` array, part of `compilerOptions` of your `tsconfig.json`.

In this file we've set that we want to use `es5` as target language and that we want to **exclude** the directories `node_modules` and `dist`.

Let's also install `@types/core-js` in order to have type definitions for the ES6 APIs that we'll use:

```shell
$ npm i @types/core-js
```

In the end our directory structure should look like:

```
.
├── jquery-demo.js
├── jquery-demo.ts
├── tsconfig.json
└── node_modules
    └── @types
        ├── jquery
        │   ├── package.json
        │   │── types-metadata.json
        │   └── index.d.ts
        └── core-js
            ├── package.json
            │── types-metadata.json
            └── index.d.ts
```

Thanks to the `tsconfig.json` we can compile our `jquery-demo.ts` using:

```shell
$ tsc
```

And...we will get all these errors:

```
./../.npm-packages/lib/node_modules/typescript/lib/lib.es2015.core.d.ts(17,14): error TS2300: Duplicate identifier 'PropertyKey'.
node_modules/@types/core-js/index.d.ts(21,14): error TS2300: Duplicate identifier 'PropertyKey'.
node_modules/@types/core-js/index.d.ts(85,5): error TS2687: All declarations of 'name' must have identical modifiers.
node_modules/@types/core-js/index.d.ts(145,5): error TS2403: Subsequent variable declarations must have the same type.  Variable '[Symbol.unscopables]' must be of type '{ copyWithin: boolean; entries: boolean; fill: boolean; find: boolean; findIndex: boolean; keys: ...', but here has type 'any'.
node_modules/@types/core-js/index.d.ts(262,5): error TS2687: All declarations of 'flags' must have identical modifiers.
```

This is caused by multiple versions of the same type definitions. In `tsconfig.json` we have `es6` as part of the `lib` array but we also have `core-js` in `node_modules/@types`. In order to fix this problem we have two options:

- Change `es6` to `es5` in `compilerOptions`'s `lib` property. This way TypeScript won't include ES6 type definitions.
- Remove `core-js` from `node_modules`. This way TypeScript will use only its internal ES6 type definitions.

Since the ES6 type definitions which come with TypeScript are more reliable by using third-party ones, lets drop `node_modules/@types/core-js`.

If we run `tsc` again, we'll get the compiled `jquery-demo.js` file.

We can even remove the `<reference/>` tag from `jquery-demo.ts` and everything is still going to work! The behaviour of `tsc` in this case will be: "Take **all** the files and **all** the type definitions from the current directory and all of its subdirectories, **except the ones declared in the 'exclude'** array".

Another option of `tsconfig.json` that we can use is the `files` property. If we set it, `tsc` will consider **only the files listed there plus all the referenced files within them**.

### No Namespacing of Type Definitions

You might be wondering why would we have the same type definitions in both `compilerOptions`'s `lib` and `core-js`? The ambient type definitions in **TypeScript cannot be namespaced**. Why not? Well, if we use jQuery in our project and we cannot include two different sets of ambient type definitions since we have a single global `jQuery` object, so only a single interface.

## Recap

In recap:

- TypeScript is statically typed language, which is great since we can catch the errors we do before the users of our software!
- TypeScript adds type definitions through type annotations which help the compiler to perform advanced static code analysis.
- We can take advantage of static typing with non-TypeScript library by using **ambient type definitions** with and install them with `npm` or `yarn`.
- The ambient type definitions are not namespaced, they are always global!
- Fix `Duplicate *` error in TypeScript by using `tsconfig.json`'s **exclude** section and add there the redundant type definitions.
- Using `<reference/>` is considered a bad practice.
