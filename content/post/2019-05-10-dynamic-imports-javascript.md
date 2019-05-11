---
author: minko_gechev
categories:
- Tooling
- JavaScript
date: 2019-05-10T00:00:00Z
draft: true
tags:
- Tooling
- JavaScript
title: Dynamic imports are good, right?
og_image: /images/5-cli-features/cli.png
url: /2019/05/10/dynamic-imports-javascript
---

As engineers, we often have the perception that `dynamic == good`. With the statically typed languages, such as TypeScript, this has shifted over the years. Because to compile-time checking, more folks started appreciating what tooling can give us, if we provide more statically analyzable information at build time.

In the past, I've heard a lot of complains around the static imports in JavaScript:

>Why does JavaScript restricts us to use only string literals when specifying the module in ES2015 imports?

To see what are the benefits of this, let's look at an example:

```js
import { foo } from './bar';
```

Above we have the `import` keyword, import specifier, `from` keyword, followed by the `./bar` string literal. There are two great things about this construct:

- Statically we can determine what symbols we import
- Statically we can determine from which module we import

## Static vs Dynamic Analysis

It's essential to understand what I mean by saying *statically*. In practice, any correct program can be partially executed at build time (for example, by webpack, prepack, etc.) and potentially fully executed at runtime. Look at this example:

```js
const fib = n => n === 1 || n === 2 ? 1 : fib(n - 1) + fib(n - 2);

console.log(fib(5));
```

If we add prepack plugin to our webpack build, the final bundle will look something like this:

```js
console.log(5);
```

Which means that our users will directly see `5` in the console, without having to execute the `fib` function. This is only possible because our program does not use data which is only available at runtime. What could be this data? Well, for example:

```js
const fib = n => n === 1 || n === 2 ? 1 : fib(n - 1) + fib(n - 2);

console.log(fib(window.num));
```

The evaluation of the snippet above would be impossible at build time because we don't know what's the value of `window.num` (imagine if a Chrome extension has set this value and we rely on it).

How does this related to ES2015 imports? It relates in at least two different ways. With ES2015 imports we can:

- Statically analyze the import specifier when the imported symbols are explicitly listed
- Statically analyze the path because it's a string literal

Let's suppose for a second that this is a valid syntax:

```js
import { foo } from getPath();
```

The implementation of `getPath` could involve information which is only available at runtime, for example, we can read a property from `localStorage`, send a sync XHR, etc. The ECMAScript standard allows only string literals so that the bundler or the browser, can now the exact location of the module we're importing from.

Now, let's look at another example:

```js
import * as foo from './foo';
```

This is all good, right? We specify the path as a string literal. Well, this way, the bundler needs to do *magic* in order to understand what parts of `./foo` we are using in the current module. Imagine we have the following snippet:

```js
// foo.js
export const a = 42;
export const b = 1.618;
export const c = a + b;

// bar.js
import * as foo from './foo';

console.log(foo.a);
console.log(foo[localStorage.get('bar')]);
```

If we invoke the bundler by specifying `bar.js` as an entry point, statically we can determine that `bar.js` uses `a` but we have no idea if `b` and `c` are going to be needed at runtime, we don't know what the value of `localStorage.get('bar')` is. This way we won't be able to get rid of the unused symbols, since we don't know what is unused.

That's why I often discourage people to use wildcard imports, since they could block the bundler from tree-shaking effectively.

## What about dynamic imports

Originally, I started writing this blog post to explain why dynamic imports are not great from tooling perspective.
