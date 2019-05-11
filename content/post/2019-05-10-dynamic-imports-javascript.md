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

As engineers, we often have the perception that `dynamic == good`. With the statically typed languages, such as TypeScript, this has shifted over the years. Thanks to compile-time checking, more folks started appreciating what tooling can give us, if we provide more analyzable information at build time. From tooling perspective, this is strongly related to what I observe around dynamic imports recently.

In the past, I've heard a lot of complains around the static imports: "Why does JavaScript restricts us to use only string literals when specifying the module in ES2015 imports?":

In other words, why does JavaScript allows this:

```js
import { foo } from './foo';
```

dut disallows this:

```js
import { foo } from getPath();
```

The reason for this is that the imports this way could be **statically analyzable**. What does static analysis give us? Well, thanks to statically analyzing the dependency graph of our application we can drop unused symbols from modules. That's one of many advantages that this syntax provides. What's the difference then with the dynamic imports?

Well, there are a bunch of differences of course. The first one is the synchronous resolution, but another interesting point from a tooling perspective is that the dynamic `import` accepts an expression as an argument. This means that this is a valid:

```js
import(getPath()).then(...)
```
