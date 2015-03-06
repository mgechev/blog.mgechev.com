---
title: Persistent State of ReactJS Component
author: minko_gechev
layout: post
categories:
  - JavaScript
  - ReactJS
  - Persistence
tags:
  - localStorage
  - ReactJS
  - JavaScript
---

ReactJS is a framework, by facebook, which adds some well known concepts into the UI development. Each UI could be represented as a state machine but when the state of this state machine could be changed from a lot of places everything gets quite messy, complex and buggy. Given view may be rendered differently with the same model passed as parameter if it depends on some global data. A properly implemented ReactJS component, will be rendered the same way when the same "input parameters" are passed to it. This is based on the well known idea of the [pure functions](https://en.wikipedia.org/wiki/Pure_function) (to be more precise the idea is similar but not the same, because each component may have its own state, which can change).

The code from this article could be found [at GitHub](https://github.com/mgechev/react-pstate).

## State

Each ReactJS component may have a state. It also accepts properties passed by its ancestors. Based on the state of the component and the properties passed by its ancestors the component knows how to render itself. For example:

{% highlight javascript %}
var Ticker = React.createClass({
  componentDidMount: function () {
    var self = this;
    setInterval(function () {
      self.setState({
        ticks: self.state.ticks + 1
      });
    }, 1000);
  },
  getInitialState: function () {
    return { ticks: 0 };
  },
  render: function () {
    return (
      <span>{this.state.ticks}</span>
    );
  }
});
{% endhighlight %}

The `Ticker` has a state, which represents the number of ticks passed. The ticks count is being incremented each second and rendered into a span element.
If we want to use this component somewhere onto the page we can:

{% highlight javascript %}
React.render(<Ticker></Ticker>, document.getElementById('container'));
{% endhighlight %}

The snippet above will render the component in a container with id `container`. Once the `Ticker` has been rendered the ticking will begin.

Another example for component state could be the position (left and top) of a dialog on the screen, boolean flag, which indicates whether given dialog is open or closed, etc.

## Persistence

The state of each component is a JavaScript object, which is stored into the main memory. This means that each component's state may mutate until page refresh/close of the browser. After that, on page load the component will be initialized with its initial state (in our `Ticker` example this state will be `{ ticks: 0 }`).

But what if we want our `Ticker` to keep ticking from the same value, which it reached before the page refresh? Or if we want the dialog to remain on the same page position as it was before the page was closed?

We have one "correct" way to do this - we can use the [Flux](https://facebook.github.io/flux/docs/overview.html) architecture and save each component's state into a Store. We can then save the Store's value into a persistent storage. So now, on each `mousemove` event we are going to go through the whole flux process of saving data...We can do better by saving the data on specific events, for example in our drag & drop case we can save the dialog's position on `mouseup`.

But do we have to create a new database entry for each drop of the dialog? Isn't it much more suitable to keep this state object into cookies or `localStorage`? Yes, it is! So now we should have two types of stores:

- Persistent Stores
- Cookie/Local storage Stores

Doesn't it gets a bit messy? There is easier way of doing this which doesn't violates the component's "pureness" that much.

What we can do is:

{% highlight javascript %}
var Ticker = React.createClass({
  getInitialState: function () {
    return JSON.parse(localStorage.getItem('ticker') || '{}');
  },
  componentDidMount: function () {
    var self = this;
    setInterval(function () {
      this.setState({
        ticks: this.state.ticks + 1
      });
      localStorage.setItem('ticker', JSON.stringify(this.state));
    }, 1000);
  },
  render: function () {
    return (
      <span>{this.state.ticks}</span>
    );
  }
});
{% endhighlight %}

Okay, this seems to work but we should duplicate the same code for each new element, which state we want to save...There are also some issues with the "transactional" behavior. What if the `localStorage` is full and it throws an error? We won't have the state saved persistently so we will have inconsistency between the state in the RAM memory and the one on the disk

## Mixins

ReactJS uses one more well known idea for code reuse called mixin. The mixin is basically a piece of code, which provides functionality and could be plugged into a component (class, package, component, whatever...). This is something in-between inheritance and delegation. We can't state that component using given mixin is a subclass of the mixin but it can be considered as subtype of it, since it implements it's interface (we can think of duck typing here - "When I see a bird that walks like a duck and swims like a duck and quacks like a duck, I call that bird a duck."). Mixins are usually used in dynamically typed languages such as JavaScript, Ruby, Perl but can also be useful in statically typed languages as well (for example Java, where we implement the mixins as abstract classes or [interfaces in Java 8](https://kerflyn.wordpress.com/2012/07/09/java-8-now-you-have-mixins/)).

So we can implement the `localStorage.setItem` and `localStorage.getItem` thing into a mixin. But we won't have a big value by this...What about if we want to have different types of persistent storages? We want to dynamically change the storage from cookies to `localStorage` or why not even a RESTful API? If we want to make RESTful calls we need to better have asynchronous API, although `localStorage` accesses the disk synchronously. So obviously we need an [adapter](https://en.wikipedia.org/wiki/Adapter_pattern).

## react-pstate

A few days ago I wrote the `react-pstate` mixin, which does exactly this - it allows persistence of the state of ReactJS components, through pluggable storage. For example lets take a look at the following example:

{% highlight javascript %}
var Ticker = React.createClass({
  getInitialState: function () {
    return { ticks: 0 };
  },
  componentDidMount: function () {
    this.setPStorage(this.localStorage);
    this.setPId('ticker');
    this.restorePState();
    var self = this;
    setInterval(function () {
      this.setPState({
        ticks: this.state.ticks + 1
      });
    }, 1000);
  },
  render: function () {
    return (
      <span>{this.state.ticks}</span>
    );
  }
});
{% endhighlight %}

This code looks a little bit simpler. We don't use any globals but only instance methods instead. The magic happens in these three lines of code:

{% highlight javascript %}
this.setPStorage(this.localStorage);
this.setPId('ticker');
this.restorePState();
{% endhighlight %}

Initially we set the persistent storage we are going to use by `this.setPState(this.localStorage)`, later we set a unique identifier of the component `this.setPId('ticker')` and after that we restore the component's state if there is such by calling `this.restorePState`.

In order to save the component's state persistently you can use `this.setPState`, which has exactly the same interface as `this.setState`, as first argument it accepts the new state and as second a callback, which will be invoked once the state is set.

But how to change the storage from `localStorage` to XHR for example? We simply need to pass to `setPStorage` an object, which implements the following interface:

- `get(id) : Promise`
- `set(id, state) : Promise`
- `remove(id) : Promise`

Since we want to have standardized interface for each storage and having asynchronous APIs of the stores, each of these methods should return an ECMAScript 6 promise object. Since not all browsers support it you can use the [polyfill by Jake Archibald](https://github.com/jakearchibald/es6-promise).

You can find this module at my [GitHub account](https://github.com/mgechev/react-pstate).

## Conclusion

The mixin seems quite useful. However, it doesn't solve all the problems you might have for persistently storing the state of a component. For example saving the state of a dialog on `mousemove`, isn't the best thing you can do. This will lead to disk access/HTTP request each few milliseconds. In this case a better way of using `react-pstate` is by saving it on drag stop. However, it provides you primitives which prevent having code duplication.
