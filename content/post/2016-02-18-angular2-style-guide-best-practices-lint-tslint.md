---
author: minko_gechev
categories:
- JavaScript
- Angular 2
- Style Guide
date: 2016-02-18T00:00:00Z
tags:
- JavaScript
- Angular 2
- Style Guide
title: Enforcing Best Practices with Static Code Analysis of Angular 2 Projects
url: /2016/02/18/angular2-style-guide-best-practices-lint-tslint/
---

About two weeks ago I published the initial draft of a [Community-driven Angular 2 Style Guide](https://github.com/mgechev/angular2-style-guide). It was based on:

- Patterns I noticed in the Angular 2 source code while contributing to the framework.
- Suggestions by Miško Hevery during his technical review of my book "[Switching to Angular 2](https://www.packtpub.com/web-development/switching-angular-2)".
- My own development experience with Angular 2.
- AngularJS 1.x common practices which could be applied to Angular 2 applications keeping the transition process smoother.

![](/images/ngsg.png)

At the time of the first push of the document I got a quick feedback by the manager of Angular Brad Green:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/mgechev">@mgechev</a> Love the start and the great explanations. And a smashing logo to boot! :) <a href="https://t.co/7dPVQPvhQa">pic.twitter.com/7dPVQPvhQa</a></p>&mdash; Brad Green (@bradlygreen) <a href="https://twitter.com/bradlygreen/status/694954284161462272">February 3, 2016</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

As you might guess the initial draft was a bit misshaped and based only on my personal perspective. Although the great ideas I got from Miško Hevery, everything went through my own prism. That was the main idea to publish it on this early stage of the Angular's life-cycle - to gather feedback from other great, experienced developers.

We had great discussions on the [directory structure](https://github.com/mgechev/angular2-style-guide/issues/5) that we all agreed upon. We achieved balance between suggestions by [@e-oz](https://github.com/e-oz) for by-type division, [@evanplaice](https://github.com/evanplaice), [@nareshbhatia](https://github.com/nareshbhatia), [@d3viant0ne](https://github.com/d3viant0ne) and all other great ideas proposed during the discussion. Of course, that is only a small fraction of all the brainstorming. You can take a look at the [issues of the project for more](https://github.com/mgechev/angular2-style-guide/issues).

What are the biggest benefits I found working in such an open environment?

### Diverse Experience

The best practices went through the perspective of different developers with diverse experience. Showing everyone's point of views and agreeing upon common, generic practices that can work for most of us is priceless.

Another great benefit is that one extra pair of eyes can find and help fixing [mistakes](https://github.com/mgechev/angular2-style-guide/issues/13) and deliver everything into a [more consistent way](https://github.com/mgechev/angular2-style-guide/issues/16).

### Rediscovering Best Practices

We rediscovered already existing best practices and patterns from the software engineering such as:

- [Bounded context](http://martinfowler.com/bliki/BoundedContext.html) a concept from the Domain-Driven Development that helps us divide our code units in the most balanced way.
- [Façade pattern](https://en.wikipedia.org/wiki/Facade_pattern) a design pattern, initially introduced by the Gang of Four which fits perfectly in providing a high-level interface for a larger body of code.

Facing same problems solved decades ago and using the same terms helps us communicate easier. In the end, that is one of the core purposes of the design patterns - to ease the communication across developers.

### Learning new Things

Definitely, it is worth mentioning that everyone expressing his thoughts and opinion on given topic can extend our knowledge.

I believe these are only a few of the benefits from the open source ideology.

## Going a bit further!

Building a complete set of best practices which puts most of the Angular 2 projects under a common shape is quite important. There is no point explaining why it is worth following a common guidelines that are pointing the correct path.

But what is the process we use to enforce these practices? Code review. This means that one human being writes code, trying to follow all the practices listed in a huge document and another human being needs to verify that these practices are followed properly.

There's one sure thing - this is quite an error-prone mission!

During the last a couple of days I'm working on a static code analyzer which makes sure we're following the best practices. Since its main goal is to be configurable, I'm planning to make it compatible with the [community-driven style guide](https://github.com/mgechev/angular2-style-guide) we are working on, as well as the John Papa's style guide which should be released in the next a couple of months.

I called the project [ng2lint](https://github.com/mgechev/ng2lint) and at this moment it is based on tslint.

### How does ng2lint work?

What ng2lint does is to take the abstract-syntax tree (AST) generated by the TypeScript compiler based on the source code of our application and analyze it. If you have further interest on the topic I strongly recommend you to take a look at "[Modern Compiler Design 2nd ed.](http://www.amazon.com/Modern-Compiler-Design-Dick-Grune/dp/1461446988)".

### Future plans...

TypeScript builds a great intermediate representation of the code we write, which is perfect for analysis. However, such an intermediate representation for an Angular 2 project could be considered as a superset of what TypeScript provides us. For instance, in Angular 2 each component has a template. In order to verify that all used inside this template directives are declared in the `directives` property of the target component or any other parent component, we need to parse the template as well.

And what about file naming conventions? Well, we'll need to verify all the naming is following common conventions as well!

Given all this a more sophisticated tool will be required. Since I'm working on this linter in my spare time I cannot guarantee full style guide coverage in the next a couple of months but you can [follow my progress here](https://github.com/mgechev/ng2lint#roadmap).

