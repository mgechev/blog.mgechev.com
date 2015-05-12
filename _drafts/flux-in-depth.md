---
title: Flux in Depth
author: minko_gechev
layout: post
categories:
  - JavaScript
  - AngularJS
  - React
  - Flux
  - MVC
  - MVW
tags:
  - Flux
  - JavaScript
  - AngularJS
  - React
  - MVC
  - MVW
---

Flux is micro-architecture with unidirectional data flow for application development. It sounds quite abstract but thats what it is. It is technology agnostic, which means that it doesn't depend on ReactJS, although it was initially introduced by facebook. It is not coupled to a specific place in the stack where it should be used - you can build isomorphic JavaScript applications with flux, like Reza Akhavan [pointed out during one JavaScript breakfast](https://docs.google.com/presentation/d/1LdTKrxw0MdvH_VCkpWG2q5hS3pKvIA1IzbL3d3cZ1Ok/edit#slide=id.p). Flux is not even coupled to JavaScript. It just solves a few problems, which are common for MVC.

### Unidirectional Data Flow

Building MVW applications helps us to better structure our client-side code, make it more coherent and less coupled. We can easily isolate our business logic from the view, making our models independent from their representation. This decoupling is achieved using the observer pattern, which is quite handy; it helps us dispatch events in both directions - view to model and vice versa.

However, in complex single-page applications dispatching events in both directions may lead to cascading events, which introduces a tangled weave of data flow and unpredictable results. The flux architecture, initially described by facebook, helps us deal with the issues of MVW and allows us to build highly scalable single-page applications.

Following the unidirectional data flow is much easier since we know exactly where the data comes from and to which components it needs to be redirected next. But this is not the main benefit, according to me:

### Stateless Components


