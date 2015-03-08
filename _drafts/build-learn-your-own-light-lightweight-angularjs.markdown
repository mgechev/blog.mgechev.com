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

My practice proofed that there are two good/easy ways to learn a new technology:

- Re-implement it by your own
- See how the concepts you already know fit in it

In some cases the first approach is too big overhead. For instance, if you want to understand how the [kernel](https://github.com/torvalds/linux) works it is far too complex and slow to re-implement it. It might work to implement a light version of it (a model), which abstracts components that are not interesting for your learning purposes.

The second approach works pretty good, especially if you have previous experience with similar technologies. A proof for this is the paper I wrote - ["AngularJS in Patterns"](https://github.com/mgechev/angularjs-in-patterns). It seems that it is a great introduction to the framework for experienced developers.

However, building something from scratch and understanding the core underlying principles is always better. The whole AngularJS framework is above 20k lines of code and parts of it are quite tricky. Very smart developers have worked with months over it and building everything from an empty file is very ambitious task. However, in order to understand the core of the framework and the main design principles we can simplify the things a little bit - we can build a "model".

> Scientific modelling is a scientific activity, the aim of which is to make a particular part or feature of the world easier to understand, define, quantify, visualize, or simulate by referencing it to existing and usually commonly accepted knowledge. It requires selecting and identifying relevant aspects

We can achieve this simplification by:

- Simplifying the API
- Removing components, which are not essential for our understanding of the core concepts

This is what I did in my "Lightweight AngularJS" implementation, which is [hosted on GitHub](https://github.com/mgechev/light-angularjs). The code is with **only learn purpose and should not be used in production** otherwise a kitty somewhere will suffer. I used this method of explaining AngularJS in classes I taught at [HackBulgaria](http://hackbulgaria.com) and [Sofia University](http://fmi.uni-sofia.bg/en). You can also find slides from my talk "Lightweight AngularJS" in the bottom of the blog post.

Before reading the rest of the article I strongly recommend you first to get familiar with the basics of AngularJS. A good start could be this [short overview of AngularJS](http://blog.mgechev.com/2014/05/08/angularjs-in-patterns-part-1-overview-of-angularjs/).

So lets begin with our implementation!

## Main Components

Since we are not following the AngularJS implementation completely we will define a set of components and make references to their &&&&&&&& in the original implementation. Although we will not have 100% compatible implementation we will implement most of our framework in the same fashion as it is implemented in AngularJS but with simplified interface and a few missing features.

The AngularJS components we are going to be able to use are:

- Controllers
- Directives
- Services

In order to achieve this functionality we will need to implement the `$compile` service, which we will call `DOMCompiler`, the `$provider` and the `$injector`, grouped into our component called `Provider`. In order to have two-way data-binding we will implement the scope hierarchy.

This is how the relation between `Provider`, `Scope` and `DOMCompiler` will look like:

![](images/lightweight-ng/main-components.png)

### Provider

As mentioned above, our provider will union two components from the framework:

- `$provide`
- `$injector`

Its main responsibilities will be to:

- Register components (directives, services and controllers)
- Resolve components' dependencies
- Initialize components
