---
title: High-Performant Angular 2 Tab
author: minko_gechev
layout: post
categories:
  - JavaScript
  - Angular 2
  - TypeScript
  - Parsers
tags:
  - JavaScript
  - Angular 2
  - TypeScript
  - Parsers
---

There are plenty of great tutorials on how to implement a tabs component with Angular 2. They provide a great start on how to use the core APIs of the framework. In this article I want to show a bit more advanced topics. Before going any further, lets define the following terminology:

We will call the entire component "tabs" or "tabs component". Its individual sections will be called "tab sections" or "tab" (or "tabs" in plural) in case the context allows us to call them in the same name as the component itself. Each "tab" will have a "content" section and a "title".

Alright, lets begin! By the end of the current blog post we will build a tabs component with the following features:

- Lazy instantiation of the content of the individual tabs.
- Not performing change detection over the content of tabs.
- Custom titles of the tabs.

Lets briefly discuss what are the core benefits of the above bullet points:

### Lazy Initialization

This means that we will instantiate given tab content only once it gets active, i.e. the user clicks on its corresponding title. In case of a complex tabs control which has heavy content, this approach can help us a lot! Imagine we have a tabs component with hundreds of tabs, each of which has some nested components. If we instantiate all the different tabs' contents during the component's instantiation we will make Angular perform plenty of unnecessary calculations for content, which is not yet visible by the user (and may never get).

### Not Performing Change Detection on Hidden Tabs

Change detection is being performed only on components which are attached to any view container in our application. At given moment there's only a single visible tab content. Do we need to make Angular perform change detection over hidden components?

### Custom Tab Section Titles

This one is quite important. We cannot build a reusable tabs component without providing an option to the end users to customize its appearance.

## Implementation

For the purpose of the following implementation I'm using the [angular2-seed project](https://github.com/mgechev/angular2-seed). You can find the end result at [my GitHub account](https://github.com/mgechev/high-performant-tabs-demo).



