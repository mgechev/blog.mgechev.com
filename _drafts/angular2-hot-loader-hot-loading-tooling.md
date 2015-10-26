---
title: Angular 2 Hot Loader
author: minko_gechev
layout: post
categories:
  - JavaScript
  - Angular 2
  - Tooling
tags:
  - JavaScript
  - Angular 2
  - Tooling
  - Performance
---

A couple of months ago I watched a few talks from [ReactEurope](https://www.react-europe.org/). I was truly impressed by a few of them and especially by the one by Dan Abramov on redux and his [hot loader](https://github.com/gaearon/react-hot-loader). The tool he shown helps you do something similar to [live-reload](http://livereload.com/); when you change the code of any of the components in your react application, the new version of the component is send to the application itself where all its instances are patched so the changes you did to be visible. This way the new, changed implementation of the component is rendered on the screen with all the attached functionality to it. In contrast to live-reload, your application does not need to be refreshed when you make a change in your code. This way the current state of the application (selected page/view, fields of your models/store) can be preserved across updates. Although this looks amazingly awesome, the idea and the implementation behind the hot loading is quite clear, especially after Dan's talk. We will take a look at the basic idea in the implementation below.

Last week I [gave a talk](https://www.youtube.com/watch?v=C6e6-31HD5A) on [AngularConnect](http://angularconnect.com/) (the alternative of ReactEurope for the Angular's community) on [aspect-oriented programming with ES2016 decorators](https://github.com/mgechev/aspect.js). The environment and the organization of the conference were amazing! I met a lot of smart people who motivated me a lot! So in order to show how awesome Angular 2 is, last Sunday I did a quick (and super dirty!) prototype of a hot loader in Angular 2.

## Demo

Here is a sample demo of the prototype I built:

<iframe width="420" height="315" src="https://www.youtube.com/embed/S9pKbi3WrCM" frameborder="0" allowfullscreen></iframe>

The code for the demo could be found at my [GitHub profile](https://github.com/mgechev/angular2-hot-loader-demo). In the next a couple of sections I'll describe how it works and what are its pros and cons.

## Basic Architecture

![]()

In order to detect all the changes in the components in our application, we need to watch them. For this purpose I've used the [watch](https://www.npmjs.com/package/watch) package in npm. Once we detect a change in any of the components we need to send its updated version to application. For this purpose I've implemented a super basic JSON based protocol via WebSockets, which is responsible for sending updates to the front-end which are basically the ES5 + CommonJS version of the changed components.

In the front-end of our application, we need to include the hot-loader scripts, which basically accepts the changed components and updates all their instances in the rendered application.

## Handling the State

The tricky part here is to preserve the state of the application itself although we need to rerender the changed component(s). This is an easy task with dumb components (pure components) because they don't hold any state so you can freely rerender them and just populate them with the data stored somewhere in the rest of your app. In react this can be achieved by using a flux-like architecture where the state of your application is decoupled from the UI in a module called store. We can approach the exact same way in Angular 2 by taking advantage of flux/redux/whatever. However, in Angular we also have out-of-the-box dependency injection, which can makes our life even easier.

Here is an example of how we can preserve the state of the application by using singleton services:

```ts
@Component({
  selector: 'app',
  providers: [bind(NameList).toValue(new NameList())],
  // ...
})
@RouteConfig([
  // ...
])
export class AppCmp {}
```
Basically we define a root component called `AppCmp`, which has a single provider - binding of the `NameList` services to an instance of the class itself. Since this is a singleton if we are required to rerender our application, even if we need to re-instantiate all the components in our application, they accept as arguments the same instances of all their dependencies they owned before the rerendering was required. This allows them to render the new version of themselves based on the same state.

You may ask, but what if I hold the sate in my component instead? For example, what if I have the following component and I change its `_foo` field by an input:

```ts
@Component({
})
export class Foobar {
  _foo: string;
  set foo(value) {
    this._foo = value;
  }
}
```
Well, when new version of any component is delivered to the application your state will be lost. React-hot-loader solves this issue by patching the component without re-instantiating them, however, I wasn't able to find a clean way to do this in Angular so far. Does this mean that react is better in sense of hot loading? I wouldn't say so. I might have not considered all the different options for patching the components (I'm not completely familiar with Angular 2's code base) and still..since react's components are only being patched, no change in the constructor of the component will be applied to the patched component in the front-end. This means that the state of given component can be initialized only ONCE when the component is loaded for first time. Both of these Angular 2 and React related issues could be handled by using pure components and externalizing your state, which generally is considered as good practice.

## Current limitations

Since I worked on the hot loader for a couple of hours on Sunday I wasn't able to make it as well functional as I'd want to. The work is still in progress but here are a few things which work pretty well:

- Patching all instances of existing components, including:
  - Patching changed templates
  - Patching of the component's prototype (all methods)
- Defining new components in existing files
- Using new components which are defined in existing files

### Limitations

- Works only with TypeScript components and your application build to ES5 & CommonJS (i.e. you can try [angular2-seed](https://github.com/mgechev/angular2-seed)
- Does not work with components which are annotated with `@RouteConfig` (easy to fix)
- Does not update the constructor of the existing component if it is changed (easy to fix)
- Does not work with `AsyncRoute` components (easy to fix)
- Does not work with services & pipes (and probably will never work for services since they need to preserve the state)

## Conclusion

Although hot loading seems super amazing it looks like a hacky solution to a real problem to me. For sure there's much more work to be done in both react-hot-loader and angular2-hot-loader but for sure we're going in the right direction!

The Angular 2 hot loader is pretty much work in progress so be tunned! Meanwhile, take a look at the book I'm working on ["Switching to Angular 2"](https://www.packtpub.com/web-development/switching-angular-2).


