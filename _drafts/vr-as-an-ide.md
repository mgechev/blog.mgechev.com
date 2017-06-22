---
title: VR as an IDE
author: minko_gechev
layout: post
categories:
  - VR
  - WebVR
  - IDE
  - Angular
tags:
  - Source code visualization
  - VR
  - WebVR
  - IDE
---

In the first part of this blog post I've discussed the idea for using virtual reality for gamification of manual tasks in the software development process. I describe a demo project which allows source code visualization and manipulation in a generated virtual reality. The initial presentation of the demo project was on [ngconf 2017](https://ng-conf.org/), and its extension on [AngularUP 2017](https://angularup.com/) during my talk "Mad Science with the Angular Compiler"

The second part of the post describes a simple implementation of the VR-based source code manipulator.

## Background

The purpose of my "Mad Science with the Angular Compiler" talk is to demonstrate how the Angular's metadata collector and ASTs produced by the frontend of the TypeScript compiler, Angular template, expression and CSS parsers, can be used for source code analysis and visualization.

A few months ago, I created a wrapper around the Angular compiler, which provides higher-level API that by an entry point of a project (`tsconfig.json`), collects the metadata for all the components, pipes and providers. I called this library [ngast](https://github.com/mgechev/ngast), because on top of the metadata collection it also returns the ASTs of components' templates, styles, as well as the TypeScript AST nodes, corresponding to the individual symbols.

Based on [ngast](https://github.com/mgechev/ngast), I created a tool for reverse engineering of Angular applications called [ngrev](https://github.com/mgechev/ngrev). An Electron application which provides different views to the project, sorted by abstraction level.

[ngrev](https://github.com/mgechev/ngrev) is already useful, however, I wanted to go one step further and provide a more fun demo. That's why for [ngconf](https://ng-conf.org/), I developed an unconventional compiler which from an Angular application produces a WebVR, build with [aframe](https://aframe.org). The VR is produced by the following rules:

- The virtual world corresponds to the entire application, composed by the Angular modules.
- Each module is represented by a "garden".
- The trees in the gardens are the components of the application.
- Each tree has a crown which consists of blocks. Each block is a template element.
- The blocks have different colors depending on whether they represent an Angular component or a plain HTML element.

## Open questions

While I was building this demo, I had three questions:

- Can we make the visualization interactive and propagate changes in the virtual world to the application's source code?
- Can we use VR for meaningful source code visualization? Obviously, although fun, the demo application doesn't provide a lot of value.
- Can we solve real-life problems this way?

Since tree-shaking is a [big thing in the JavaScript world](LINK), and I already had the trees, for [AngularUP](https://angularup.com/) I introduced the shaking part. In order to make it more memorable, I created a lightweight server which accepts commands from the virtual reality and modifies the source code. For the purpose of the demo, we can tree-shake a tree and drop its leaves, one by one.

After one of the Angular SF meetups, I had a chat with [Shawn](LINK) who told me that after watching my talk, he thought about extending the demo and building a Minecraft-like IDE where one can plant trees (i.e. create components), create gardens, etc. Abstractly thinking, this can be considered as a gamification of the software development process. After chatting with Shawn I found that through gamification, in a week, was solved an NP-complete protein folding problem <a href=""><sup>[1]</sup></a>. Although the software development process involves some creativity and cannot be completely automated, there are still manual talks that we do every day. Is it possible to extract them and put them into some gamified environment.

Researching the topic further, I found that there was a published paper from the University of Michigan, related to visualization of object-oriented source code in the three dimensional space <a href=""><sup>[2]</sup></a>, and there's a startup working in this area <a href=""><sup>[2]</sup></a>.
