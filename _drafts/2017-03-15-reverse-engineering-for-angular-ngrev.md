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

Have you ever been hired to work on a huge legacy Angular project with thousands of NgModules, components, directives, pipes and services? Neither do I. Angular (2 and above) is still relatively new framework and there are not many enourmouse projects out there. On the other hand, Angular is powerful and in combination with TypeScript we can build big, enterprise applications.

# The Problem

It's hard to start digging into a large codebase without being aware of the overall structure of the project. You can very easily be trapped and start digging into details without first getting familiar with the core abstractions of the application.

In the past, when I had to deal with Java code Visual Paradigm was my favorite tool to start with. It can generate diagrams from your source code. Navigating through these diagrams you can jump between different levels of abstractions and explore the individual components on each layer. This way you can get the overall picture much easier since most of the details at this point are well abstracted - each class is represented as a box. In contrast, when you start reading each individual source file, you need to deal with a lot of details - properties, decorators, comments, methods...

# Introducing ngrev

For a while, I've been doing [static code analysis](http://blog.mgechev.com/2016/02/29/static-code-analysis-angular-typescript/) for Angular apps. My purpose for the last a couple of months was style checking with [codelyzer](https://github.com/mgechev/codelyzer). About a week ago, I decided to reuse some of the modules I built and develop a project which provides visualization and navigation thourgh the structure of a project.

This is how ended up developing [ngrev](https://github.com/mgechev/ngrev). [ngrev](https://github.com/mgechev/ngrev) is an Electron application which uses the tooling I built around codelyzer on top of the Angular compiler. In case your application is compatible with Angular's Ahead-of-Time compiler [ngast](https://github.com/mgechev/ngast) can parse your entire codebase and return an abstract representation of it. Later, [ngrev](https://github.com/mgechev/ngrev) will render this abstract representation onto the screen, letting you to navigate between the different levels of abstraction of your project.

"A picture is worth a thousand words", right? Then a 40 seconds video running with 60 fps is worth is worth 2,400,000 words. Instead of keep talking about what [ngrev](https://github.com/mgechev/ngrev) is and how it works, you can just take a look at the video below:

## Core Features

Some of the core features of the project are:

- Visual presentation of the modules of the application and their relations.
- Representation of the individual directives, components, providers, pipes and their dependencies.
- Visualization of the components' templates.
- "Peek at the code" feature which allows you to open the source file where given component is declared.
- etc.

The project right now has some limitations which are not show stoppers and are relatively easy to overcome:

- No support for lazy loaded modules.
- No support for navigation through the components' `providers and `viewProviders`.

# How to use it?

If you're on macOS, you can
