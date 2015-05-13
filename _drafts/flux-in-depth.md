---
title: Flux in Depth - Part 1
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

In flux the user interface is a composition of **stateless** UI components. The components do not depend on any external mutable state. The user interface they produce is entirely determined by the input they receive by their parent component. Although (like most things) it seems like a brand new innovative idea, this is well known concept, which comes from the world of the functional programming.

It is much easier to think of a function as a black box, which accepts in input and gives an output:

![Pure function]()

Rather than as something, which does its job by using external (may be) global mutable resources in order to return its output:

![Impure function]()

I won't add any examples here, you can find plenty of them if you Google that.

According to Wikipedia a pure function is:

>In computer programming, a function may be described as a pure function if both these statements about the function hold:
>1. The function always evaluates the same result value given the same argument value(s). The function result value cannot depend on any hidden information or state that may change as program execution proceeds or between different executions of the program, nor can it depend on any external input from I/O devices (usually—see below).
>2. Evaluation of the result does not cause any semantically observable side effect or output, such as mutation of mutable objects or output to I/O devices (usually—see below).

How we can make our components pure? Definitely they should not use any global variables because their result (rendered component), should not depend on anything else except the properties it accepts. But that's not all. If the data passed to the components in the component tree is mutable given component may change the data used by another component. For example, we can have the following component tree:

![Component tree]()

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

If we call the root object `user`, in a flux-like architecture the data will be distributed across the components in the following way:

![Flux data distribution]()

In the `User` component we can have the following code:

{% highlight javascript %}
user.todos = user.todos.filter(u => !u.completed);
{% endhighlight %}

It definitely looks elegant, because we're applying the high-order function `filter` on the user's todo items. However, we're making completely impure component since it produces side-effect, i.e. changes data, which is used by another component.

#### Immutable Data

How we can deal with such side effects? We can use something called immutable data, which according to Wikipedia is defined as:

>In object-oriented and functional programming, an immutable object is an object whose state cannot be modified after it is created.

You can checkout my talk on using immutable data in Angular [here](https://www.youtube.com/watch?v=zeChCjj-tbY).

In order to produce introduce the immutability in our application we have two options:

- Use wrappers around the standard JavaScript primitives, which makes the data immutable (for example with library like Immutable.js)
- Use ES5 `Object.freeze`

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

![Immutable data structure with mutable items]()

We can simply access any of the mutable items inside the immutable data structure...:

![Access mutable item]()

...and change it:

![Change mutable item]()

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

Which means that `Object.freeze` doesn't do deep freeze of the object.

What we can do is to:

- Use Immutable.js for a nice, fancy wrapper around the standard mutable collections (+ implementation of a few more very handy collections)
- Deep freeze our data

Is it necessary to use immutable data? It is not, it may eventually lead to some performance slowdowns but it will make your debugging experience even easier since your components won't produce any side effect if you've already stopped touching the global things!
