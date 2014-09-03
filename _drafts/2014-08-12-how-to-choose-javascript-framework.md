---
title: How to choose JavaScript MV* framework
author: Minko Gechev
layout: post
permalink: /2014/08/12/how-to-choose-javascript-framework/
categories:
  - Development
  - JavaScript
  - Object-Oriented Programming
  - Architecture
tags:
  - Design patterns
  - JavaScript
  - Singleton
  - MVC
  - MVVM
  - MVW
  - MVP
---

## Introduction

Few years back we were using JavaScript for only tiny scripts, which were making our page a bit more interactive. Later we thought that we were pushing the limits of the language by building front-end form validation. In 1998, after the Outlook Web App team implemented the first XMLHTTP by client script, this was the beginning of a new era! We started playing gods while sending forms without page reloads through AJAX, building AJAX chat boxes with long polling, even asynchronously loading page partials! If you were doing all these tricks in the first years of the 21st century you were considered as a kind of dark magician or weirdo, because you already had Flex, Java Applets or any other particularly-dead-technologies.

Now days the things stay a little bit differently. If you want to build an application with rich user experience you need to include all these "hacks" from the past in your daily life. Of course, every magic comes with a price - huge amount of boilerplates, low coherent and highly coupled components, spaghetti and unreachable pursuit of happiness. With good knowledge in object-oriented design and with a lot of believes that JavaScript is actually an Object-Oriented language (a fact), you might be able to create a simple architecture but if you are new to the language. If you are well experienced JavaScript developer you can develop something yourself but it will be still better to use something, which is well tested and proven that works in some situations.

By solving the common problem of bootstrapping and building a foundation for large-scale JavaScript applications the community born different ideas. Everything was around event handling, because of the nature of the language. The first more noticable large-scale JavaScript application architecture, I'm aware of, is the one proposed by Nicholas Zakas. In his architecture every part of the application were considered as a module. The different modules communicate together by using publish/subscribe. Modules are defined by the module pattern and are almost completely decoupled. Addy Osmani implemented a framework called [Aura](https://github.com/aurajs), inspired by this architecture.

Last a couple of years a lot of frameworks were born. Most of them implement well known patterns such as MVP, MVC, MVP, so most of them are MVW(hatever). Most Microsoft related developers started using Knockout.js, because of its MVVM nature. Most people with RoR background were attracted by Ember or Backbone. The "new" (not as technology but as affinity) big thing in the MVW world is AngularJS. Most of the decisions what type of MVW framework we want to use were based on some subjective factor like:

- Am I familiar with the patterns used behind this framework?
- Have I heard for this framework by my friends?
- Do I like the name of the framework?

But not realistic like:

- Is this framework going to scale well?
- Is this framework appropriate for the application I want to build?
- Is the framework testable?
- Can I create reusable components?

In this blog post I'm going to put a basic classification on the modern JavaScript Single-Page Applications and try put some of the most famous frameworks in these specific categories.

## Classification

### Application type

In my practice I've noticed three main types of JavaScript applications:

- CRUD applications (horizontal applications) - applications, which has a lot of views, data validation and interaction. Such as news websites, enterprise applications, applications for the public administration, etc.
- Complex UI (vertical applications) - applications with complex UI, composed by multiple components. These applications usually have a lot of **state** and it is hard to think about all the ways this complex UI could be used. In this category I'd also include the WebGL games.
- Mixture - a mixture between the categories above.

#### Horizontal SPAs

Things specific for the horizontal applications are:

- Data binding
- Data validation
- Usage of RESTful API
- Lazy loading of templates

Usually in the horizontal applications, we don't have complex UI, composed by many components so the DOM manipulations are not that complex. The most important things we should care of are:

- Data consistency
- Lazy (incremental) loading of data and templates
- Ease of horizontal scaling (adding more views/logic)

#### Vertical SPAs

In the vertical Single-Page applications we have:

- Coherent components with **state**
- Easy composable components
- Fast DOM manipulations
- *Lazy loading of components*

It is quite important to be able to create coherent components, since you might need to compose them in different way if the requirements change. All these components has some internal state, so you should control the state as easy as possible in order to keep it valid. Usually in the vertical applications the UI gets very complex, there are a lot of components and you risk to have slow DOM manipulations because of the complex DOM tree. If your vertical application ha some horizontal elements (like a few views), it'd be helpful if you can load your components asynchronously.

#### Mixture

Here everything is not that straightforward. You can combine all the characteristics of the horizontal and the vertical applications above in different ways and have different requirements. Usually in this case you might need to combine frameworks, depending on their strength.


### Application size

By application size we can classify the applications in these categories:

- Small
- Medium
- Large

Usually this categorization means different things for the different people 












