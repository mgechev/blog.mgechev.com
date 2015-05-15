---
title: Flux in Depth. Overview and Pure Components.
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

This is the first blog post of the series "Flux in Depth". Is this "yet the another flux tutorial"? What I have seen so far, while researching flux, were mostly "how-to" tutorials (usually with todo applications), which describe the main components of given flux application and the data flow between them. This is definitely useful for making a high-level overview of how everything works but in reality there are plenty of other things, which should be taken under consideration. In this series of posts I will try to wire theory with practice and state *my own solutions* of problem I face on daily basis. Since these solutions might not be perfect, I'd really appreciate discussing in the comments bellow.

## Introduction

Flux is micro-architecture for software application with unidirectional data flow. It sounds quite abstract but thats what it is. It is technology agnostic, which means that it doesn't depend on ReactJS, although it was initially introduced by facebook. It is not coupled to a specific place in the stack where it should be used - you can build isomorphic JavaScript applications with flux, like Reza Akhavan [pointed out during one JavaScript breakfast](https://docs.google.com/presentation/d/1LdTKrxw0MdvH_VCkpWG2q5hS3pKvIA1IzbL3d3cZ1Ok/edit#slide=id.p). Flux is not even coupled to JavaScript. It just solves a few problems, which are common for MVC.

Lets take a look at a diagram, which illustrates the data flow in a flux application:

## Flux High-Level Overview

![High-Level Overview](../images/overview-pure-components/flux-overview.png)

Lets describe what the boxes and the arrows above mean:

### View

The view is simply [composition of components](https://en.wikipedia.org/wiki/Composite_pattern). They might be stateless or stateful. We will talk more about components in the next sections. How exactly we need to compose them and on what level of granularity they should be completely depends on the UI of our application. Usually we have higher level components, which abstract lower level components by composing them. The data is passed from the root component to all its child components, which recursively pass the data used by their children and so on.

### Store

The store is *not necessary* the model of our application. The store simply contains the *state* of the UI. When we use stateful components parts of the state could be stored in them but we need to be careful with that.

What state could be kept in the store? We can think of two types of store:

- Model - domain specific data. For example, the todo items in our todo application.
- UI state - the state of our view, which is not relevant to the model. For example, which dialog is opened right now.

One common thing between MVC and flux is that the store *should not be aware* of its representation and it is better to be unaware of the way our application communicates with the back-end services! However, the store in flux is not equals to the model in MVC. Making the UI state external for the components help us create "pure components" (see bellow) and force the separation of concerns even further. Why this is so awesome? Well, our store is nothing more than a JavaScript object, which could be easily persisted! Imagine the world where you can make a "snapshot" of your UI and save it somewhere (database, localStorage, wherever). Later you can restore this "snapshot" quite easily!
The store knows only of the existence of:

### Dispatcher

A few years ago, Nicholas Zakas published his [large scale application architecture](https://www.youtube.com/watch?v=vXjVFPosQHw). In the core of the architecture there is a sandbox, which implements the publish/subscribe pattern. Publish/subscribe is nothing more than the [observer pattern](https://en.wikipedia.org/wiki/Observer_pattern) but since we have first-class functions in JavaScript, we can use them instead of observers. We can think of the publish/subscribe object as an event bus (which could be considered more or less as [mediator](https://en.wikipedia.org/wiki/Mediator_pattern)). The main difference between observer and publish/subscribe is that in the latest, it is not responsibility of the subject to keep list of observers, unlike in the classical observer pattern.

Okay, so I said this only in order to tell you that the Dispatcher is simply an event bus. It is a singleton, which owns a map of key-value pairs. The keys in this map are event (action) names and the values are lists of callbacks. The dispatcher has a method called `dispatch`, which once called with an event name, iterates over all callbacks associated with it and invokes them. Thats it. You can take a look at sample [implementation here](https://github.com/facebook/flux/blob/master/src/Dispatcher.js). In my projects I usually use this implementation as base class for my custom Dispatcher. So far I haven't needed anything it doesn't provide.

### Action

Actions are even simpler than the Dispatcher. What they do is to define methods, which will be called by the View. These methods accept arguments, which contain further instructions on how the View wants to change the Store. All these methods do is to delegate their call to the Dispatcher's `dispatch` method. This might seems like unnecessary level of indirection? Why would we need to call action from the View, which action immediately delegates its call to the Dispatcher's `dispatch` method? Why not simply call the dispatch method from the view?

$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

So from the diagram above we can notice that important characteristic of flux is the:

### Unidirectional Data Flow

Building MVW applications help us to better structure our client-side code, make it more coherent and less coupled. We can easily isolate our business logic from the view, making our models independent from their representation. This decoupling is achieved using the observer pattern, which is quite handy; it helps us dispatch events in both directions - view to model and vice versa.

However, in complex single-page applications dispatching events in both directions may lead to cascading events, which introduces a tangled weave of data flow and unpredictable results. Flux helps us deal with the issues of MVW and allows us to build highly scalable single-page applications.

It is much easier to follow the unidirectional data flow since we know exactly where the data comes from and to which components it needs to be redirected next. This definitely makes our applications easier for understanding but there is one more feature, which help us deal with complexity:

### Stateless Components

In flux the user interface is a composition of **stateless** UI components (they may keep some component-specific state but we will talk about this in a bit). The components do not depend on any external mutable state. The user interface they render is entirely determined by the received input by their parent component. May be it seems like a brand new, innovative idea, however it is a well known concept, which comes from the world of the functional programming.

It is much easier to think of the functions as black boxes, which accept input and return output:

![Pure function](/images/overview-pure-components/pure-function.png)

Rather than as something, which does its job by depending on external (may be) global mutable resources:

![Impure function](/images/overview-pure-components/impure-function.png)

According to Wikipedia a pure function is:

>In computer programming, a function may be described as a pure function if both these statements about the function hold:
>1. The function always evaluates the same result value given the same argument value(s). The function result value cannot depend on any hidden information or state that may change as program execution proceeds or between different executions of the program, nor can it depend on any external input from I/O devices (usually—see below).
>2. Evaluation of the result does not cause any semantically observable side effect or output, such as mutation of mutable objects or output to I/O devices (usually—see below).

How we can make our components pure? Definitely they should not use any global variables because their result (rendered UI), should not depend on anything else except the properties they accept. But that's not all. If the data passed to the component tree is mutable given component may change the data used by another component. For example, we can have the following component tree:

![Component tree](/images/overview-pure-components/component-tree.png)

And the following data applied to it:

{% highlight json %}
{
  photoUrl: "photo.png",
  firstName: "Foo",
  lastName: "Bar",
  age: 42,
  updated: 1429260707251,
  todos: [{
    title: "Save the Universe",
    updated: 1429260907251,
    completed: true
  }, {
    title: "Write tests",
    updated: 1429260917251,
    completed: false
  }]
}
{% endhighlight %}

If we call the object above `user`, in a flux-like architecture the data will be distributed across the components in the following way:

![Flux data distribution](/images/overview-pure-components/flux-like-data-distribution.png)

If the `User` component needs to display the number of pending todo items, we may have the following snippet in its implementation:

{% highlight javascript %}
user.todos = user.todos.filter(u => !u.completed);
{% endhighlight %}

It definitely looks elegant, we're applying the high-order function `filter` over the user's todo items. However, this way we're creating an impure component since it produces side-effect, i.e. changes data, which is used by another component.

#### Immutable Data

How we can deal with such side effects? We can use something called immutable data, which according to Wikipedia is defined as:

>In object-oriented and functional programming, an immutable object is an object whose state cannot be modified after it is created.

You can check out my talk on using immutable data in Angular [here](https://www.youtube.com/watch?v=zeChCjj-tbY).

In order to introduce the immutability in our application we have three options:

- Use wrappers around the standard JavaScript primitives, which makes the data immutable (for example with library like [Immutable.js](https://facebook.github.io/immutable-js/))
- Use ES5 `Object.freeze`
- Combination between both approaches

Lets create an immutable list using Immutable.js:

{% highlight javascript %}
let list = new Immutable.List([1, 2]);
let foo = {};
let newList = list.push(foo);
console.log(list.toString()); // List [ 1, 2 ]
console.log(newList.toString()); // List [ 1, 2, [object Object] ]
newList.get(2).baz = 42;
console.log(foo.baz); // 42
{% endhighlight %}

In the snippet above we can notice that:

- Each operation, which will eventually mutate the data structure returns a new immutable object (list in this case), so `list !== newList`
- The returned immutable object from the mutation operation is the same as the initial list but with the modification applied
- The list can contains heterogeneous data (numbers and objects)
- The list items are *note immutable*, we pushed the `foo` object inside the list and changed it right after that

It is not responsibility of Immutable.js to make the entries immutable. We can think of Immutable.js' list as a thin wrapper around the standard JavaScript array:

![Immutable data structure with mutable items](/images/overview-pure-components/immutable-collection-mutable-items.png)

We can simply access any of the mutable items inside the immutable data structure...:

![Access mutable item](/images/overview-pure-components/touch-mutable-item.png)

...and change it:

![Change mutable item](../images/overview-pure-components/change-mutable-item.png)

Which is not cool. In order to fix this behavior we can use `Object.freeze`.

If we use `Object.freeze`:

{% highlight javascript %}
let foo = { bar: {} }
Object.freeze(foo);
foo.baz = 'foobar';
console.log(foo.baz); // undefined
foo.bar.baz = 'foobar';
console.log(foo.bar.baz); // 'foobar'
{% endhighlight %}

Which means that `Object.freeze` doesn't do deep freeze of the objects.

What we can do is to:

- Use Immutable.js for our data structures
- Deep freeze our data

Is it necessary to use immutable data? No. It may eventually lead to some performance slowdowns but it will make your debugging experience even easier since your components won't produce any side effect if you've already stopped touching the global things! If you're using immutable data you will also make sure you've put some boundaries in your project. If new team members join they will be forced to use immutable data structures and you won't find someone trying to take cross cuts by changing the mutable state.

#### Stateful vs Stateless

It is recommended your flux components to be stateless, completely stateless! For example, look at the following mocks:

<img src="/images/flux-depth/page-chat.png" alt="Page Chat">
<img src="/images/flux-depth/page-profile.png" alt="Page Profile">
