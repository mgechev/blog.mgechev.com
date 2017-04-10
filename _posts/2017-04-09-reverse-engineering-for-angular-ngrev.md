---
title: Announcing ngrev - Reverse Engineering for Angular
author: minko_gechev
layout: post
categories:
  - Angular
  - TypeScript
  - Tooling
tags:
  - Angular
  - TypeScript
  - Tooling
---

Have you ever been hired to work on a huge legacy Angular project with thousands of NgModules, components, directives, pipes and services? Neither do I. Angular (2 and above) is still relatively new framework and there are not many enormous projects out there. On the other hand, Angular is powerful and in combination with TypeScript we can build big, enterprise applications.

# Exploring an Application

It's hard to start digging into a large codebase without being aware of the overall structure of the project. We can very easily get trapped and start digging into details without first getting familiar with the core abstractions of the application.

In the past, when I had to deal with Java code Visual Paradigm was my favorite tool to start with. It can generate diagrams from our source code. Navigating through these diagrams we can jump between different levels of abstractions and explore the individual components on each layer. This way we can get the overall picture much easier since most of the details at this point are well abstracted - each class is represented as a box. In contrast, when we start reading each individual source file, we need to deal with a lot of details - properties, decorators, comments, methods...

# Performance Analysis

**Deeply understanding our codebase** can help us optimize our application in terms of bundle size or even runtime performance. Imagine we have a huge Angular app encapsulated in a large bundle.

It'll be very obvious where the different split points of the lazy loaded modules should be once we represent the structure of the individual symbols graphically. This way we can explore on different levels of abstraction how the modules relate and depend on each other, and respectively find out how we can introduce the minimal functionality required by the initial bootstrap. Later, recursively, we can apply the same strategy for the rest of the module tree.

Now let's suppose that the runtime performance of our application suffers. Clustering the bindings by component and representing them graphically can make it **so obvious** what's wrong and where we should spend extra effort in optimizations.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://t.co/gqqMjqn4up">https://t.co/gqqMjqn4up</a> <a href="https://twitter.com/mgechev">@mgechev</a> this is just amazing 😲 deeply *understanding* applications is going to enable deep deep perf optimizations</p>&mdash; Rob Wormald (@robwormald) <a href="https://twitter.com/robwormald/status/850880843329359873">April 9, 2017</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

# Introducing ngrev

For a while, I've been doing [static code analysis](http://blog.mgechev.com/2016/02/29/static-code-analysis-angular-typescript/) for Angular apps. My purpose for the last a couple of months was style checking with [codelyzer](https://github.com/mgechev/codelyzer). A few weeks ago, I decided to reuse some of the modules I already built and developed a project which provides visualization and navigation through the structure of a project.

This is how ended up developing [ngrev](https://github.com/mgechev/ngrev). [ngrev](https://github.com/mgechev/ngrev) is an Electron application which uses the tooling I built around codelyzer on top of the Angular compiler. In case your application is compatible with Angular's Ahead-of-Time compiler [ngast](https://github.com/mgechev/ngast) can parse your entire codebase and return an abstract representation of it. Later, [ngrev](https://github.com/mgechev/ngrev) will render this abstract representation onto the screen, letting you to navigate between the different levels of abstraction of your project. This can be on level modules, providers, components, templates, etc.

"A picture is worth a thousand words", right? Then a 65 seconds video running with 60 fps is worth 3,900,000 words. Instead of keep talking about what [ngrev](https://github.com/mgechev/ngrev) is and how it works, you can just take a look at the video below:

<div style="position:relative;height:0;padding-bottom:56.25%"><iframe src="https://www.youtube.com/embed/sKdsxdeLWjM?ecver=2" width="640" height="360" frameborder="0" style="position:absolute;width:100%;height:100%;left:0" allowfullscreen></iframe></div>

## Core Features

Some of the core features of the project are:

- Visual presentation of the modules of the application and their relations.
- Representation of the individual directives, components, providers, pipes and their dependencies.
- Visualization of the components' templates.
- "Peek at the code" feature which allows you to open the source file where given symbol is declared in our favorite editor.
- etc.

The project right now has some limitations which are not show stoppers and are relatively easy to overcome:

- No support for lazy loaded modules ([ngast](https://github.com/mgechev/ngast) has support for them so the implementation will be trivial).
- No support for navigation through the components' `providers and `viewProviders`.

# How to get involved?

There's place for plenty of additional features that we can introduce including (but not limited to):

- Visual suggestions for runtime optimizations.
- Visual suggestions for split points.
- Highlighting of complex templates.
- etc...

I'd love to chat about how to make this project even more useful! In the "About" section you can find my email and reach me out.

# How to use?

## macOS

1. Go to the [releases page](https://github.com/mgechev/ngrev/releases).
2. Download the latest `.dmg` file.
3. Install the application.

## Windows & Linux

The build currently does not produce binaries for Windows and Linux; [PRs are welcome](https://github.com/mgechev/ngrev/issues/4). In order to run the application you need to:

1. Clone the repo - `git clone https://github.com/mgechev/ngrev`.
2. Install the npm dependencies - `cd ngrev && npm i`.
3. Start the application - `npm start`.

## Application Requirements

In order to be graphically represented, your application needs to be compatible with the Angular's AoT compiler (i.e. you should be able to compile it with `ngc`).

## Using with Angular CLI

1. Open the Angular's application directory.
2. Make sure the dependencies are installed.
3. Open `ngrev`.
4. Click on `Select Project` and select `[YOUR_CLI_APP]/src/tsconfig.app.json`.

## Using with Angular Seed

1. Open the Angular's application directory.
2. Make sure the dependencies are installed.
3. Open `ngrev`.
4. Click on `Select Project` and select `[YOUR_CLI_APP]/src/client/tsconfig.json`.

# Conclusion

Thanks to the fact that Angular is developed with tooling in mind we can build amazing development tools which can dramatically improve our experience and help us build more performant & smaller applications faster!

This blog post was introduction to only one such tool which illustrates this practically. There're plenty of other projects out there which are showing where we can go with the design of the framework and this is just the beginning!

For further information you can take a look at my ng-conf talk "Mad Science with the Angular Compiler" (you can directly skip to 7 min to see the actual tools):

<div style="position:relative;height:0;padding-bottom:56.25%"><iframe src="https://www.youtube.com/embed/tBV4IQwPssU?ecver=2" width="640" height="360" frameborder="0" style="position:absolute;width:100%;height:100%;left:0" allowfullscreen></iframe></div>

Or if you prefer to dug into the existing tools taking advantage of static analysis:

- [angular-cli](https://github.com/angular/angular-cli)
- [codelyer](http://codelyzer.com/)
- [ngmigrate](https://github.com/mgechev/ngmigrate)
- [ngworld](https://github.com/mgechev/world)
- [ngd](https://github.com/compodoc/ngd)
- [compodoc](https://github.com/compodoc/compodoc)

