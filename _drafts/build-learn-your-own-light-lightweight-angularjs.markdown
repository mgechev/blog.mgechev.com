---
title: Build Your Own AngularJS in 200 Lines of JavaScript
author: minko_gechev
layout: post
categories:
  - JavaScript
  - AngularJS
  - How-to
tags:
  - AngularJS
  - Lightweight
  - JavaScript
---

My experience proofs that there are two good ways to learn a new technology:

- Build it by your own
- See how the concepts you already know fit in it

In some cases the first approach is too big overhead. For instance, if you want to understand how the kernel works it is far too complex to re-implement it. It might work to implement a light version of it (a model), which abstracts components, which are not interesting for your learning purposes.

The second approach works pretty good, especially if you have previous experience with similar technologies. A proof for this is the paper I wrote - "AngularJS in Patterns". It seems that it is a good introduction to the framework for experienced developers.

However, building something from scratch and understanding the core underlying principles is always better. In the case of AngularJS some of the main selling points are:

- Dependency Injection
- Separation of Concerns
- Data-Binding

Although the whole framework is above 20k lines of code, we can abstract the components we don't need by:

- Simplifying the API
- Removing components, which are not essential for our understanding of the core concepts

This is what I did in my "Lightweight AngularJS" implementation, which is [hosted on GitHub](https://github.com/mgechev/light-angularjs). The code is with **only learn purpose and should not be used in production** otherwise a kitty somewhere will suffer.

So lets begin with our implementation!
