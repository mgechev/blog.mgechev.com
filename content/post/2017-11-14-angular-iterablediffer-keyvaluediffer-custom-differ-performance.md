---
author: minko_gechev
categories:
- Angular
- Performance
date: 2017-11-14T00:00:00Z
tags:
- Angular
- IterableDiffer
- Performance
title: Understanding Differs in Angular and Developing a Custom IterableDiffer
draft: true
url: /2017/11/14/angular-iterablediffer-keyvaluediffer-custom-differ-performance/
---

In this article we'll take a look at what the differs in Angular are and how the framework uses them internally. After that, we'll take a look at how `NgForOf` works and design a custom data structure optimized for the directive. Finally, we'll develop a custom differ which will speed up the change detection mechanism of Angular when working with large collections.

