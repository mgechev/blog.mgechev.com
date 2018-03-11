---
author: minko_gechev
categories:
- TypeScript
- JavaScript
- React
- Angular
- Tooling
- Webpack
- Machine Learning
date: 2018-03-11T00:00:00Z
draft: false
tags:
- TypeScript
- JavaScript
- React
- Angular
- Tooling
- Webpack
- Machine Learning
title: JavaScript Decorators for Declarative and Readable Code
url: /2018/03/11/machine-learning-bundling-webpack-javascript-markov-chain-angular-react
---

In this article I'll introduce the early implementation of a few tools which based on techniques from the machine-learning allow us to perform data-driven bundling and data-driven pre-fetching of our single-page applications. For the purpose, I'll explain how we can use data from Google Analytics, in order to automate the process of bundling of our assets based on the users' behavior.

# Introduction

Over the past a couple of years, we started shipping web applications which provide user experience close to the native applications. This wouldn't be possible without all the advancements in the web platform. We have hundreds of new APIs which allow us to do what we've never thought we'd be able to achieve with JavaScript in the browser.

The developers behind this amazing jump know that everything came with a cost. The complexity of our applications is growing exponentially! Together with the complexity is also growing the amount of assets that we need to transfer over the network. There are a [lot](https://www.thinkwithgoogle.com/marketing-resources/experience-design/mobile-page-speed-load-time/)[1] of [publications](https://www.thinkwithgoogle.com/marketing-resources/experience-design/mobile-page-speed-load-time/)[2] proving that how quickly our page loads can directly impacts the conversion rate and therefore the revenue.

It's also clear that some assets are more [expensive than others](https://medium.com/dev-channel/the-cost-of-javascript-84009f51e99e)[3]. JavaScript compared to image assets, for instance, is much more expensive because of it's non-trivial processing mechanism (parsing, compilation, and execution).

If this wasn't convinsing enough, well, slow pages are also stressful:

<center>
<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Waiting for slow web pages to load is as stressful as watching a horror movie: <a href="https://t.co/spwEC1P9ct">https://t.co/spwEC1P9ct</a> <a href="https://twitter.com/hashtag/perfmatters?src=hash&amp;ref_src=twsrc%5Etfw">#perfmatters</a> <a href="https://t.co/3JmcGPZij2">pic.twitter.com/3JmcGPZij2</a></p>&mdash; Addy Osmani (@addyosmani) <a href="https://twitter.com/addyosmani/status/711330814827569152?ref_src=twsrc%5Etfw">March 19, 2016</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</center>

## JavaScript Bundling

A common practice for dealing with large amounts of JavaScript is dividing it to multiple bundles and loading it on demand. There are two main practices for achieving this:

- Page level - the individual JavaScript bundles correspond to one or more pages. While the user navigates across the different pages of the application they also trigger network requests which download the required by given page bundle.
- Feature level - imagine one of the pages contains a heavy widget which is not very likely to be used by our application. We can simply move the JavaScript for this widget outside of the main bundle of the application and download it on demand, when the user intents to interract with the widget. This can be considered as subset of the "On page level" category but, as I'll mention below, it's convenient to consider it separate.

There are brilliant tools, such as [webpagetest](https://www.webpagetest.org/)[4] and [Lighthouse](https://developers.google.com/web/tools/lighthouse/)[5], which tell us when we haven't done a good job with the production build of our apps. Once they give us a bunch of pointers, it's our responsibility to fix the mess.

Interesting question to ask is: how do we decide which features and pages should be moved to their own bundles, in order to make Lighthouse happier. Often, this based on a completely subjective judgment. We subjectively decide that it's unlikely the user to open given page or interact with given feature, so we create a "split point" and download the corresponding JavaScript lazily. There's no point explaining how such a subjective judgment call could be completely irrelevant. Our users often behave in a way we don't expect them to.

A better approach is to chose our bundle layout based on data. There are different platforms which provide us an insight how the users use our application. Google Analytics is a great example. Looking at the data which Google Analytics provide, we can decide which pages should be grouped together and what we can load lazily. This way we can make our "page-level" bundling data-driven which will make our judgment less error-prone.

A few years ago I posted [an article](http://blog.mgechev.com/2013/10/01/angularjs-partials-lazy-prefetching-strategy-weighted-directed-graph/) on how we can consider our page as a state machine. Based on the transitions that the user does while navigating in this state machine, we can decide which pages it's likely the user to visit next, so we can pre-fetch them. In my article, the priority were completely based on my subjective judgment, however, with tools such as Google Analytics, we can make them data-driven, and respectively, more accurate.

**But why not load everything lazily and let our bundler decide what makes sense to be grouped bundled together and what not?** In this blog post, I'll demonstrate how combining a few tools which can be found at my [GitHub profile](https://github.com/mgechev/mlx), we can automate the process of data-driven bundling and data-driven pre-fetching.

In the first a couple of pages we'll cover the individual tools from [`mlx`](https://github.com/mgechev/mlx) and explain how they work together. After that we'll dig into implementation details starting with an optional, theoretical introduction to the mathematical foundation used in the project. Although, mathematical foundation may sound a bit frustrating, it's not. We're going to mention few algorithms from the graph theory and one popular machine learning model. Right after that, we're going to define few concepts in order to simplify the communication. For example, we'll cover what's Page Graph and how it differs from the Routing Bundle Tree. We'll finish our discussion by explaining how the different algorithms combined together form the entire system of packages.

# Tooling Introduction

**Disclaimer**: the packages that we're going to cover are in a very early stage of their development. Most likely at this phase, they will be incompatible with your projects. Over time their implementation will mature and get more robust.

In this section we'll cover the tools:

- `@mlx/ga` - a module which is used to fetch structured information from Google Analytics. Keep in mind that the information coming from Google Analytics is not aware of our application paremetrized routes. This means that even if we have `/a/:id`, Google Analytics will consider `/a/1` and `/a/2` as separate routes. In order to aggragate the data you can either provide an array of the routes in your application manually, or let the following module extract them for you:
- `@mlx/parser` - a module which extracts the routes of our application, finds the associated bundle entry points, and builds the routing bundle tree.
- `@mlx/clusterize` - a module which performs a clusterization algorithm based on the data from Google Analytics and the bundle routing tree.
- `@mlx/webpack` - a set of webpack plugins which use `@mlx/parser` and `@mlx/clusterize` in order to produce data-driven bundle layout for our application.

## Usage

The set of tools is as **framework agnostic** as possible. In fact, the only package which is framework dependent is `@mlx/parser` because with static analysis it extracts the routes of the application. Currently, `@mlx/parser` **works with both - Angular and React**. This means, that long-term, the data-driven bundling will be possible for **any framework**.

The Angular implementation of the route extractor is much more robust because of the standard way of route definition. Also, the Angular compiler, and the abstraction that I built in top [6], allows us to extract the routes of the application quite easily. The React implementation relys on a specific way of route definition:

```ts
class App extends React.Component {
  render() {
    return (
      <Router history={history}>
        <div className="App">
          <Link to="/intro">Intro</Link>
          <Link to="/main">Main</Link>
          <div>
            <Switch>
              <Redirect exact={true} from="/" to="/intro" />
              <Route path="/intro" component={AsyncComponent(() => import('./intro/Intro'))} />
              <Route path="/main" component={AsyncComponent(() => import('./main/Main'))} />
            </Switch>
          </div>
        </div>
      </Router>
    );
  }
}
```

Currently, you can use the `@mlx/webpack` package in your Angular CLI project after you eject it and add the following line in the end of the plugin configuration:

```ts
new MLPlugin({ data })
```

For React, you can find a working example [here](https://github.com/mgechev/react-ml-bundled/blob/master/config/webpack.config.prod.js#L329-L334)[7]. In general, the webpack configuration for React and Angular is identical. The `MLPlugin` internally recognizes the used framework based on `package.json` and applies different routing extractor.

In fact, the `MLPlugin` has more flexible API:

```ts
export type Neighbors = { [key: string]: number };

export interface Graph {
  [key: string]: Neighbors;
}

export interface BuildConfig {
  minChunks?: number;
  algorithm?: ClusterizationAlgorithm;
}

export interface RuntimeConfig {
  basePath: string;
}

export interface MLPluginConfig {
  debug?: boolean;
  data: Graph;
  routeProvider?: RouteProvider;
  runtime?: false | RuntimeConfig;
  build?: false | BuildConfig;
}
```

- `debug` indicates if you want to see a verbose output from the bundling process.
- `data` is the data gathered from Google Analytics. We'll stop in more details on this graph in later section.
- `routeProvider` is a function which returns the mapping between routes and bundle entry points. If a `routeProvider` is not specified, `@mlx/webpack` will use the default route provider implementation from `@mlx/parser`. This is **extremely powerful configuration property**. If you have a react application, and `@mlx/parser` is not able to discover the routes in it you can provide a custom function which returns them:

  ```ts
  new MLPlugin({ data, routeProvider: () => [{...}, {...}] })
  ```
- `runtime` configures the plugin for data-driven bundle pre-fetching. Basically, you can either specify an optional `basePath` or disable the prefetching.
- `build` is the part of the `@mlx/webpack` plugin which groups the webpack chunks based on a clusterization algorithm performed by `@mlx/clusterize`. This may sound a bit abstract at first. You can think of it as a piece of code which tries to reason from the provided data from Google Analytics which pages will be visited in the same session. Based on this information the plugin may group some chunks.

Keep in mind that **the plugin will not do any code splitting**. It relys that all your routes are loaded lazily and it may only group some of the corresponding chunks together depending on the provided data.

### Side note on feature-level bundling

So far we only discussed how we can group bundles together based on Google Analytics data. Athough that's what we need in most of the cases, often we have feature-level bundling where we lazy-load a feature which is part of given page. In order to decide if we want to introduce the lazy-loaded bundle as part of the page bundle we cannot use Google Analytics data because loading the feature-bundle is not related to page navigation.

For such cases, we can import `ClusterizeChunksPlugin` from `@mlx/webpack`. This plugin is used under the hood by `MLPlugin` for the data-driven bundling. `ClusterizeChunksPlugin` accepts as an argument a graph similar to the one that we pass to `MLPlugin`, however, in this case, instead of routes the individual nodes represent bundle entry fines.

How to collect such data? An easy way is to just monkey patch the `import` function and sent statistics to the backend once given bundle is requested. In order to form graph consumable by `ClusterizeChunksPlugin` all we need to aggregate is: which is the entry point of the bundle which requested the lazy-loaded bundle and how many times the lazy-loaded bundle got requested.

## High-Level Architecture

On this diagram you can see how the individual tools work with each other:

![]()

# Mathematical Background

You can expand this section to get familiar with the mathematica foundations between this article. Here we're going to cover:

- Graphs, trees, weighted graphs, and connected components
- Basics of theory of probability and Markov chains

<div style="cursor: pointer; color: #5694f1;" id="expand">Expand &#9658;</div>
<div style="cursor: pointer; display: none; color: #5694f1;" id="collapse">Collapse &#9660;</div>
<section class="zippy hidden" id="zippy">

## Basics of Graph Theory

Graph in graph theory is represented as the tuple **`G = (E, V)`** where `E` is a set of edges and `V` is a set of vertices. In this article we're often going to mention the term "dependency graph". This is just a graph which represents the dependencies between something. For example:

```ts
// foo.ts
export const foo = 42;
```

```ts
// bar.ts
import { foo } from './foo';

console.log(foo);
```

The program above can be represented with the following dependency graph:

![]()

Notice that we have an arrow pointing from `bar.ts` to `foo.ts`. This is because `bar.ts` depends on `foo.ts`. In this example, the graph looks like:

```text
G = ([('bar.ts', 'foo.ts')], ['bar.ts', 'foo.ts'])
```

Or in other words, we have the vertices `foo.ts` and `bar.ts` and one edge - from `bar.ts` to `foo.ts`. Graphs with edges which point from one vertex to another are called **directed** graphs, otherwise, if there's path in both directions, we call the graph **indirected**.

Let's now suppose we have the following graph:

![]()

In our program, we can represent this graph in different ways. For our purposes, we'll often use a **list of neighbors** representation:

```ts
const graph = {
  'foo.js': ['bar.js', 'baz.js'],
  'baz.js': ['foo.js],
  'bar.js': ['baz.js']
};
```

Often we have numeric value associated with the edge between two nodes. For example, in our Google Analytics case we may have number of visits from page `A` to page `B`. In this case, we can model this data as a **weighted graph**. Here's how we can represent the Google Analytics data with JavaScript:

```ts
const grpah = {
  '/a': {
    '/b': 10,
    '/c': 3
  },
  '/b': {
    '/a': 4
  }
};
```

From the graph above we can see that there are `10` visits from `/a` to page `/b`, `3` visits from `/a` to `/c`, and `4` visits from `/b` to `/a`.

### Connected Components

Often, however, users visit different parts of our application. For example, let's suppose that the following graph represents the navigation behavior:

```ts
const graph = {
  '/a': {
    '/b': 10,
  },
  '/b': {
    '/a': 4
  },
  '/c': {
    '/d': 3,
    '/e': 5
  },
  '/e': {
    '/c': 5
  }
};
```

Let's look at the graphical representation of this graph:

![]()

We can see that the entire graph consists of two smaller graphs: one which contains the nodes `/a`, `/b`, and another one, with the nodes `/c`, `/d`, `/e`. Such "sub-graphs" in our graph are called **connected components**.

### Cyclic Graphs and Topological Sorting

In some cases, the edges in a graph can form a cycle. For example:

```ts
const graph = {
  '/a': {
    '/b': 10,
  },
  '/b': {
    '/c': 4
  },
  '/c': {
    '/a': 6
  }
};
```

We can see that we have path from `/a -> /b -> /c -> /a`, so basically, starting from `/a` we can reach `/a` again. Often, in order to figure out the dependencies in a graph and if there's a cycle, we use the topological sorting algorithm.

For example, let's say that we have the following dependencies between our files:

```ts
// foo.js
export const foo = 42;
```

```ts
// bar.js
import {foo} from './foo';

export const bar = foo + 1.617;
```

```ts
// baz.js
import { bar } from './bar';

console.log(foo);
```

This program will form the following dependency graph:

```ts
const graph = {
  'foo.js': [],
  'bar.js': ['foo.js'],
  'baz.js': ['bar.js']
};
```

As we all know, our bundler needs to figure out which is the entry point in our application in order to bundle all the files together. Well, the bundler can figure this out if it uses the topological sorting algorithm. In this algorithm:

- We'll first find the file which has no dependencies, which in our case will be `foo.js`.
- After that we'll remove `foo.js` from the graph, together with all edges pointing to it.
- As next step we'll find the next node without dependencies. This is going to be `bar.js`, since it no longer points to `foo.js` (this file is not in the graph anymore).
- We'll remove `bar.js` from the graph and keep going.
- Finally, we'll find `baz.js` - the only node in the graph left.

This way, topologically sorted our graph will be transformed to the list `['foo.js', 'bar.js', 'baz.js']`. If the bundler now takes `baz.js` it can use it as entry point for our bundle.

### Trees

Trees are graphs. Special kind of graphs:

>...tree is an undirected graph in which any two vertices are connected by exactly one path...

In other words, trees are  **acyclic connected graph**.

For example, we may have the following routing tree in our application:

![]()

As you can see, the root of the tree is `/`, its children are `/a` and `/b`, where `/a` has children `/a/a` and `/a/b`. From the diagram above, we can see that the **lowest-common ancestor (or LCA)** of `/a/a` and `/a/b` is `/a`.

## Basics Probability Theory

Let's go back to our aggregated Google Analytics data from the example above:

```ts
const grpah = {
  '/a': {
    '/b': 10,
    '/c': 3
  },
  '/b': {
    '/a': 4
  }
};
```

We can see that 10 out of 13 visits the user goes from page `/a` to page `/b` (we're ignoring the cases when the user leaves the page). This means that `10/13` is the **probability** the user to go from `/a` to `/b` and `3/13` is the probability the user to go from `/a` to `/c`.

Now, based on the probabilities for all the pages, we can form a matrix:

|        |  /a | /b    | /c   |
|--------|:---:|-------|------|
| **/a** | 0   | 10/13 | 3/13 |
| **/b** | 4/4 | 0     | 0    |
| **/c** | 0   | 0     | 0    |

What we can conclude from the matrix is that:

- There's `0` probability the user to go from `/a` to `/a`.
- There's `10/13` probability the user to go from `/a` to `/b`.
- There's `3/13` probability the user to go from `/a` to `/c`.
- There's `4/4` probability (or `1`) the user to go from `/b` to `/a`.
- There's `0` probability for all other cases: `/b` to `/b`, `/b` to `/c`, `/c` to `/a`, `/c` to `/b`, and `/c` to `/c`.

A matrix like that, which describes a sequence of possible events in which the probability of each event depends only on the state attained in the previous event, we're going to call a **Markov Chain**.

That's it! That's all the math we need.

</section>

<script>
(function (){
var expand = document.getElementById('expand');
var collapse = document.getElementById('collapse');
var zippy = document.getElementById('zippy');
expand.onclick = function () {
  zippy.style.display = 'block';
  collapse.style.display = 'block';
  expand.style.display = 'none';
};
collapse.onclick = function () {
  zippy.style.display = 'none';
  expand.style.display = 'block';
  collapse.style.display = 'none';
};
}());
</script>

# Definitions

To make sure we're all on the same page with the concepts that we're going to discuss, I want to start with a few definitions. The only pre-requirement for now is that each of the routes of the application will be lazy-loaded, this is just for simplicity, it's not restriction of the algorithms that we're going to apply. Let's suppose we have the following page:

![]()

```txt
/a -> /b
/a -> /c
/a -> /a/b
/b -> /a
/b -> /a/a
```

## Navigation Graph

The graph above we'll call **navigation graph**. Why it's a graph? Because it has cycles. It's important to mention that the **navigation graph is directed**. Usually, the edges between the individual nodes are representsd by links in our application. This means that if we have an edge between `/a` and `/b`, we most likely have a link between these two pages. Of course, another way the user to navigate between `/a` and `/b` is by directly using the address bar of the browser.

For our purposes, we're going to use the navigation graph from Google Analytics which we have extracted with `@mlx/ga`.

## Page Graph

Although the navigation graph look pretty handy, it's not usable for our bundling purposes becase usually our applications have parametrized routes. For example, let's suppose we have the routes:

```text
/a
/a/:id
/b
/c
```

In this case, most likely, we want to think of both `/a/a` and `/a/b` as `/a/:id`. The navigation graph, which contains aggregated information based on the routes of our application we'll call **page graph**.

## Routing Tree

The routes of our application form a tree-like structure. For example, we have the root route `/`, which has three children routes `/a`, `/b`, and `/c`. The route `/a` has a single child route `/a/:id`. This tree we're going to call **routing tree**.

## Bundle Routing Tree

If we suppose that all the routes in our application are entry points of bundles in our application than our bundle tree matches the routing tree, in shape. The only difference is that the routing tree's nodes will be named after the routes and the bundle routing tree's nodes are going to be named after the entry points of the bundles.

In case, however, we have the following situation:

```ts
// React
// App.tsx
<Route path="/intro" component={AsyncComponent(() => import('./Main'))} />
<Route path="/main" component={AsyncComponent(() => import('./Main'))} />
<Route path="/about" component={AsyncComponent(() => import('./About'))} />
```

or in Angular:

```ts
// Angular
// app.routing-module.ts
export const appRoutes: Routes = [
  {
    loadChildren: './main/main.module#IntroModule',
    path: 'intro'
  },
  {
    loadChildren: './main/main.module#MainModule',
    path: 'main'
  },
  {
    loadChildren: './about/about.module#AboutModule',
    path: 'about'
  }
];
```

In this case tree routing tree will differ from the bundle routing tree:

- The routing tree will have a single root node called `/` with three children: `/intro`, `/main`, and `/about`.
- The bundle routing tree will have root node named after the file while the routes definition is (`app.routing-module.ts` for Angular and `App.tsx` for React), and two children (for Angular - `./main/main.module` and `./about/about.module`, and for React - `./Main.tsx` and `./About.tsx`).




