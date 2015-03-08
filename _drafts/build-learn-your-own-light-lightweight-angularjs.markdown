---
title: Build Your Own AngularJS in 200 Lines of JavaScript
author: minko_gechev
layout: post
categories:
  - JavaScript
  - AngularJS
  - How-to
tags:
  - AngularJS
  - Lightweight
  - JavaScript
---

My practice proofed that there are two good/easy ways to learn a new technology:

- Re-implement it by your own
- See how the concepts you already know fit in it

In some cases the first approach is too big overhead. For instance, if you want to understand how the [kernel](https://github.com/torvalds/linux) works it is far too complex and slow to re-implement it. It might work to implement a light version of it (a model), which abstracts components that are not interesting for your learning purposes.

The second approach works pretty good, especially if you have previous experience with similar technologies. A proof for this is the paper I wrote - ["AngularJS in Patterns"](https://github.com/mgechev/angularjs-in-patterns). It seems that it is a great introduction to the framework for experienced developers.

However, building something from scratch and understanding the core underlying principles is always better. The whole AngularJS framework is above 20k lines of code and parts of it are quite tricky. Very smart developers have worked with months over it and building everything from an empty file is very ambitious task. However, in order to understand the core of the framework and the main design principles we can simplify the things a little bit - we can build a "model".

> Scientific modelling is a scientific activity, the aim of which is to make a particular part or feature of the world easier to understand, define, quantify, visualize, or simulate by referencing it to existing and usually commonly accepted knowledge. It requires selecting and identifying relevant aspects

We can achieve this simplification by:

- Simplifying the API
- Removing components, which are not essential for our understanding of the core concepts

This is what I did in my "Lightweight AngularJS" implementation, which is [hosted on GitHub](https://github.com/mgechev/light-angularjs). The code is with **only learn purpose and should not be used in production** otherwise a kitty somewhere will suffer. I used this method of explaining AngularJS in classes I taught at [HackBulgaria](http://hackbulgaria.com) and [Sofia University](http://fmi.uni-sofia.bg/en). You can also find slides from my talk "Lightweight AngularJS" in the bottom of the blog post.

Before reading the rest of the article I strongly recommend you first to get familiar with the basics of AngularJS. A good start could be this [short overview of AngularJS](http://blog.mgechev.com/2014/05/08/angularjs-in-patterns-part-1-overview-of-angularjs/).

So lets begin with our implementation!

## Main Components

Since we are not following the AngularJS implementation completely we will define a set of components and make references to their &&&&&&&& in the original implementation. Although we will not have 100% compatible implementation we will implement most of our framework in the same fashion as it is implemented in AngularJS but with simplified interface and a few missing features.

The AngularJS components we are going to be able to use are:

- Controllers
- Directives
- Services

In order to achieve this functionality we will need to implement the `$compile` service, which we will call `DOMCompiler`, the `$provider` and the `$injector`, grouped into our component called `Provider`. In order to have two-way data-binding we will implement the scope hierarchy.

This is how the relation between `Provider`, `Scope` and `DOMCompiler` will look like:

![](images/lightweight-ng/main-components.png)

### Provider

As mentioned above, our provider will union two components from the framework:

- `$provide`
- `$injector`

Its main responsibilities will be to:

- Register components (directives, services and controllers)
- Resolve components' dependencies
- Initialize components

### DOMCompiler

The `DOMCompiler` will traverse the DOM tree and find directives. We will support only directive, which could be defined as attributes. Once it finds given directive it will provide scope management (since given directive may require a new scope) and invoke the logic associated with it (in our case the `link` function). So the main responsibilities of this component will be:

- Compile the DOM
  - Traverse the DOM tree
  - Finds registered directives, used as attributes
  - Invoke the logic associated with them
  - Manages the scope

### Scope

And the last main component in our Lightweight AngularJS, will be the scope. In order to implement the data-binding logic we need to have `$scope` to attach properties to and add observers (watchers), which watch these properties or expressions, composed by composition of the properties.

Responsibilities:

- Watches the expressions
- Evaluates all watched expressions on each `$digest` loop, until stable
- Invokes all the observers, which are associated with the watched expression

## Theory

In order to have better understanding of the implementation, we need to dig a bit in theory. I'm doing this mostly for completeness, since we will need only basic graph algorithms. If you're familiar with the basic graph traversal algorithms (Depth-First Search and Breath-First Search) feel free to skip this section.

First of all, what actually graphs are? We can think of given graph as pair of two sets: `G = { V, E }, E ⊆ V x V`. This seems quite abstract, I believe. Lets make it a bit more understandable. We can think of the set `V` as different Tinder users and the set `E` as their matches. For example, if we have the users `V = (A, B, C, D)` and we have matches between `E = ((A, B), (A, C), (A, D), (B, D))`, this means not only that `A` swipes right everyone but also that the edges inside our graph are these matches. We have something like:

![](images/lightweight-ng/main-components.png)

This is an example for undirected graph, since both users like each other. If we have partial match (only one of the users like the other one), we have directed graph. In the case of directed graph, the connections between the nodes will be arrows, to show the direction (i.e. which is the user who is interested in the other one).

### Graph theory in AngularJS

But how we can apply graph theory in our AngularJS implementation? In AngularJS instead of users we have components (services, controllers, directives, filters). Each component may depend (use) another component. So the nodes in our AngularJS graph are the different components and the edges are the relations between them. For example, the graph of the dependencies of the `$resource` service, will look something like:

![](/images/lightweight-ng/resource-graph.png)

There are two more places we are going to use graphs - the DOM tree and the scope hierarchy. For example, if we turn the following HTML:

{% highlight html %}
<html>
  <head>
  </head>
  <body>
    <p></p>
    <div></div>
  </body>
</html>
{% endhighlight %}

into a tree, we will get:

![](/images/lightweight-ng/dom-tree.png)

For discovering all directives in the DOM tree, we need to visit each element and check whether there is registered directive associated with its attributes. How we can visit all nodes? Well, we can use the [depth-first search algorithm](https://en.wikipedia.org/wiki/Depth-first_search):

{% highlight %}
1  procedure DFS(G,v):
2      label v as discovered
3      for all edges from v to w in G.adjacentEdges(v) do
4          if vertex w is not labeled as discovered then
5              recursively call DFS(G,w)
{% endhighlight %}

## Implementation

Since we are done with theory, we can begin our implementation!

### Provider

As we said the `Provider` will:

- Register components (directives, services and controllers)
- Resolve components' dependencies
- Initialize components

So it will has the following interface:

- `get(name, locals)` - returns service by its name and local dependencies
- `invoke(fn, locals)` - initializes service by its factory and local dependencies
- `directive(name, fn)` - registers a directive by name and factory
- `controller(name, fn)` - registers a controller by name and factory
- `service(name, fn)` - registers a service by name and factory
- `annotate(fn)` - returns an array of the names of the dependencies of given service

#### Registration of components

{% highlight javascript %}
```javascript
var Provider = {
  _providers: {},
  directive: function (name, fn) {
    this._register(name + Provider.DIRECTIVES_SUFFIX, fn);
  },
  controller: function (name, fn) {
    this._register(name + Provider.CONTROLLERS_SUFFIX, function () {
      return fn;
    });
  },
  service: function (name, fn) {
    this._register(name, fn);
  },
  _register: function (name, factory) {
    this._providers[name] = factory;
  }
  //...
};
Provider.DIRECTIVES_SUFFIX = 'Directive';
Provider.CONTROLLERS_SUFFIX = 'Controller';
```
{% endhighlight %}

The code above provides a simple implementation for registration of components. We define the "private" object called `_providers`, which contains all constructor functions of the registered directives, controllers and services. We also define the methods `directive`, `service` and `controller`, which simple delegate their call to `_register`. In `controller` we wrap the passed controller inside a function for simplicity, since we want to be able to invoke the controller multiple times, without caching the value it returns. The only methods left are:

- `invoke`
- `get`
- `annotate`

{% highlight javascript %}
```javascript
var Provider = {
  // ...
  get: function (name, locals) {
    if (this._cache[name]) {
      return this._cache[name];
    }
    var provider = this._providers[name];
    if (!provider || typeof provider !== 'function') {
      return null;
    }
    return (this._cache[name] = this.invoke(provider, locals));
  },
  annotate: function (fn) {
    var res = fn.toString()
        .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '')
        .match(/\((.*?)\)/);
    if (res && res[1]) {
      return res[1].split(',').map(function (d) {
        return d.trim();
      });
    }
    return [];
  },
  invoke: function (fn, locals) {
    locals = locals || {};
    var deps = this.annotate(fn).map(function (s) {
      return locals[s] || this.get(s, locals);
    }, this);
    return fn.apply(null, deps);
  },
  _cache: { $rootScope: new Scope() }
};
```
{% endhighlight %}

We have have a little bit more logic here so lets start with `get`. In `get` we initially check whether we have this component already cached in the `_cache` object. If it is cached we simply return it (see [singleton](https://github.com/mgechev/angularjs-in-patterns/#singleton)). `$rootScope` is cached by default since we want only one instance for it and we need it once the application is bootstrapped. If we don't find the component in the cache we get its provider (factory) and invoke it using the `invoke` method, by passing its provider and local dependencies.

In `invoke` the first thing we do is to assign an empty object to `locals` if there are no local dependencies. What are the local dependencies?

##### Local Dependencies

In AngularJS we can think of two types of dependencies:

- Local dependencies
- Global dependencies

The global dependencies are all the components we register using `factory`, `service`, `filter` etc. They are accessible by each other component in the application. But how about the `$scope`? For each controller we want a new scope, the `$scope` object is not a global dependency registered the same way as lets say `$http` or `$resource`. The same for `$delegate` when we create a decorator. `$scope` and `$delegate` are local dependencies, specific for given component.

Lets go back to the `invoke` implementation. After taking care of `null` or `undefined` for `locals` value, we get the names of all dependencies of the current component. Note that we support only resolving dependency names, defined as property names:

{% highlight javascript %}
```javascript
function Controller($scope, $http) {
  // ...
}
```
{% endhighlight %}

Once we turn `Controller` into string we will get the string corresponding to the controllers definition. After that we can simply take all the dependencies names using the regular expression defined in `annotate`. But what if we have comments in the `Controller`'s definition:

{% highlight javascript %}
```javascript
function Controller($scope /* only local scope, for the component */, $http) {
  // ...
}
```
{% endhighlight %}

Using simple regular expression will break, because invoking `Controller.toString()` will return the comments as well, so that's why we initially strip them by using `.replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '')`.

Once we get the names of all dependencies we need to instantiate them so that's why we have the `map`, which loops over all the dependencies and calls `this.get`. Do you notice a problem here? What if we have component `A`, which depends on `B` and `C` and lets say `C` depends on `A`? In this case we are going to have infinite loop or so called `Circular dependency`. In this implementation we don't handle such problems but you can simply take care of them using [topological sort](https://en.wikipedia.org/wiki/Topological_sorting) or marking the visited "nodes" (dependencies).

And that's our provider's implementation! Now we can register components like this:

{% highlight javascript %}
```javascript
Provider.service('RestfulService', function () {
  return function (url) {
    // make restful call & return promise
  };
});

Provider.controller('MainCtrl', function (RestfulService) {
  RestfulService(url)
  .then(function (data) {
    alert(data);
  });
});
```
{% endhighlight %}

And later we can invoke `MainCtrl` by:

{% highlight javascript %}
```
var ctrl = Provider.get('MainCtrl' + Provider.CONTROLLERS_SUFFIX);
Provider.invoke(ctrl);
```
{% endhighlight %}

Pretty cool, ah? And that's how we have 1/4 of our Lightweight AngularJS implementation!

### DOMCompiler

The main responsibility of the `DOMCompiler` is to:

- Compile the DOM
  - Traverse the DOM tree
  - Finds registered directives, used as attributes
  - Invoke the logic associated with them
  - Manages the scope

The following API is enough:

- `bootstra()` - bootstraps the application (similar to `angular.bootstrap` but always uses the root HTML element).
- `compile(el, scope)` - invokes the logic of all directives associated to given element (`el`) and calls itself recursively for each child element of the given element. We need to have scope associated with the current element. Since each directive may create different scope, we need to pass the current scope in the recursive call.

And here is the implementation:

{% highlight javascript %}
```javascript
var DOMCompiler = {
  bootstrap: function () {
    this.compile(document.children[0],
      Provider.get('$rootScope'));
  },
  compile: function (el, scope) {
    var dirs = this._getElDirectives(el);
    var dir;
    var scopeCreated;
    dirs.forEach(function (d) {
      dir = Provider.get(d.name + Provider.DIRECTIVES_SUFFIX);
      if (dir.scope && !scopeCreated) {
        scope = scope.$new();
        scopeCreated = true;
      }
      dir.link(el, scope, d.value);
    });
    var children = Array.prototype.slice.call(el.children).map(function (c) {
      return c;
    });
    children.forEach(function (c) {
      this.compile(c, scope);
    }, this);
  },
  // ...
};

```
{% endhighlight %}

The implementation of `bootstrap` is trivial. It delegates its call to `compile` with the root HTML element. What happens in `compile` is far more interesting.
Initially we use a helper method, which gets all directives associated to the given element. We will take a look at `_getElDirectives` later. Once we have the list of all directives we loop over them and get the provider for each directive. After that we check whether the given directive requires creation of a new scope, if it does and we haven't already instantiated any other scope for the given element we simply invoke `scope.$new()`, which creates a new scope, which prototypically inherits from the current `scope`. After that we simply invoke the link function of the directive, with the appropriate parameters. What follows after that is the recursive call. Since `el.children` is a `NodeList` we cast it to an array by using `Array.prototype.slice.call`, which is followed by recursive call with the child element and the current scope. What does this algorithm reminds you of? Doesn't it look just like DFS - yes, that's what it is. So here the graphs came handy as well!

Now lets take a quick look at `_getElDirectives`:


{% highlight javascript %}
```javascript
  // ...
  _getElDirectives: function (el) {
    'use strict';
    var attrs = el.attributes,
        result = [];
    for (var i = 0; i < attrs.length; i += 1) {
      if (Provider.get(attrs[i].name + Provider.DIRECTIVES_SUFFIX)) {
        result.push({
          name: attrs[i].name,
          value: attrs[i].value
        });
      }
    }
    return result;
  }
  // ...
```
{% endhighlight %}

This method iterates over all attributes of `el`, once it finds an attribute, which is already registered as directive it pushes its name and value in the result list.

Alright! We're done with the `DOMCompiler`. Lets go to our last component:

### Scope

This might be the trickiest part of the implementation because of the dirty checking functionality. In AngularJS we have the so called `$digest` loop. Basically the whole data-binding mechanism happens because of watched expressions, which the `$digest` loop evaluates. Once this loop is called it runs over all the watched expressions and checks whether the last value we have for the expression differs from the current result of the expression's evaluation. If AngularJS finds that they are not equal, it invokes all the watchers associated to the given expression. A watcher could be a function, which receives the new value of the expression and sets it as `innerHTML` of given element for example (what `ng-bind` does).

The scope in our implementation has the following methods:

- `$watch(expr, fn)` - watches the expression `expr`. Once we detect change in the `expr` value we invoke `fn` with the new value.
- `$destroy()` - removes the current scope.
- `$eval(expr)` - evaluates the expression `expr` in the context of the current scope.
- `$new()` - creates a new scope, which prototypically inherits from the target of the call.
- `$digest()` - runs the dirty checking loop.

So lets dig deeper the scope's implementation:


{% highlight javascript %}
```javascript
function Scope(parent, id) {
  this.$$watchers = [];
  this.$$children = [];
  this.$parent = parent;
  this.$id = id || 0;
}
Scope.counter = 0;
```
{% endhighlight %}

We simplify the scope significantly. What we have is a list of watchers, a list of child scopes, a parent scope and an id for the current scope. We add the "static" property counter only in order to keep track of the last scope created and provide a unique identifier of the next scope we create.

Lets add the `$watch` method:

{% highlight javascript %}
```javascript
Scope.prototype.$watch = function (exp, fn) {
  this.$$watchers.push({
    exp: exp,
    fn: fn,
    last: Utils.clone(this.$eval(exp))
  });
};
```
{% endhighlight %}

In the `$watch` method all we do is to append a new element to the `$$watchers` list. The new element contains a watched expression, a watcher (observer or callback) and the last value of the expression. Since the returned value by `this.$eval` could be an object (referent type) we need to clone it.

Now lets see how we create and destroy scopes!

{% highlight javascript %}
```javascript
Scope.prototype.$new = function () {
  Scope.counter += 1;
  var obj = new Scope(this, Scope.counter);
  Object.setPrototypeOf(obj, this);
  this.$$children.push(obj);
  return obj;
};

Scope.prototype.$destroy = function () {
  var pc = this.$parent.$$children;
  pc.splice(pc.indexOf(this), 1);
};
```
{% endhighlight %}

What we do in `$new` is to create a new scope, with unique identifier and set its prototype to be the current scope. After that we append the newly created scope to the list of child scopes of the current scope. In destroy, what we do is to remove the current scope from the list of its parent's children.

Now lets take a look at the legendary `$digest`:

{% highlight javascript %}
```javascript
Scope.prototype.$digest = function () {
  'use strict';
  var dirty = false,
      watcher, current, i;
  do {
    dirty = false;
    for (i = 0; i < this.$$watchers.length; i += 1) {
      watcher = this.$$watchers[i];
      current = this.$eval(watcher.exp);
      if (!Utils.equals(watcher.last, current)) {
        watcher.last = Utils.clone(current);
        dirty = true;
        watcher.fn(current);
      }
    }
  } while (dirty);
  for (i = 0; i < this.$$children.length; i += 1) {
    this.$$children[i].$digest();
  }
};
```
{% endhighlight %}
