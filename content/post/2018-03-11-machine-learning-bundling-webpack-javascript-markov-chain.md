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
draft: true
tags:
- TypeScript
- JavaScript
- React
- Angular
- Tooling
- Webpack
- Machine Learning
title: Machine Learning-Driven Bundling. The Future of JavaScript Tooling.
url: /2018/03/11/machine-learning-bundling-webpack-javascript-markov-chain-angular-react
---

In this article, I'll introduce the early implementation of a few tools which based on techniques from the machine-learning allow us to perform data-driven chunk clusterization and pre-fetching for our single-page applications. **The purpose of the project is to provide a zero-configuration mechanism which based on data from Google Analytics performs the most optimal build for our users.** We're also going to introduce a **webpack plugin which works with Angular CLI and Create React App**.

# Introduction

Over the past a couple of years, we started shipping web applications which provide a user experience comparable to the native applications. This wouldn't be possible without all the advancements in the web platform. We have hundreds of new APIs which allow us to do what we've never thought would possible to achieve with JavaScript in the browser.

Of course, everything comes at a cost. The complexity of the single-page applications is growing exponentially! Together with the complexity is also growing the number of assets that we need to transfer over the network. There is a [lot](https://www.thinkwithgoogle.com/marketing-resources/experience-design/mobile-page-speed-load-time/)<sup>[1]</sup> of [research](https://blog.hubspot.com/marketing/page-load-time-conversion-rates)<sup>[2]</sup> proving that the load time of our apps directly impacts the conversion rate and therefore our revenue.

It's also clear that some assets are more [expensive than others](https://medium.com/dev-channel/the-cost-of-javascript-84009f51e99e)<sup>[3]</sup>. JavaScript compared to images, for instance, is much more expensive because of its non-trivial processing mechanism (parsing, compilation, and execution).

Well, slow pages are also stressful:

<center>
<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Waiting for slow web pages to load is as stressful as watching a horror movie: <a href="https://t.co/spwEC1P9ct">https://t.co/spwEC1P9ct</a> <a href="https://twitter.com/hashtag/perfmatters?src=hash&amp;ref_src=twsrc%5Etfw">#perfmatters</a> <a href="https://t.co/3JmcGPZij2">pic.twitter.com/3JmcGPZij2</a></p>&mdash; Addy Osmani (@addyosmani) <a href="https://twitter.com/addyosmani/status/711330814827569152?ref_src=twsrc%5Etfw">March 19, 2016</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</center>

## JavaScript Bundling

A common practice for dealing with a large amount of JavaScript is dividing it into multiple chunks and loading them on demand. There are two main approaches we can apply:

- **Page level chunking** - the given JavaScript chunks correspond to one or more pages in the app. While the user navigates through the pages of the application they trigger network requests which download the associated with the target page chunk.
- **Feature level chunking** - imagine one of the pages contains a heavy widget which is not very likely to be used by the user. We can simply move the JavaScript for this widget outside of the page chunk and download it on demand when the user intends to interact with the widget. This can be considered as a superset of the "page level chunking" category but, as I'll mention below, it's convenient to put it into a different category.

There are brilliant tools, such as [webpagetest](https://www.webpagetest.org/)<sup>[4]</sup> and [Lighthouse](https://developers.google.com/web/tools/lighthouse/)<sup>[5]</sup>, which tell us when we've done a poor job with the production build of our apps. Once they give us a bunch of pointers, it's our responsibility to fix the mess. One of the common warnings we get from Lighthouse, for instance, is that the JavaScript we include during the initial page load is too much. The logical approach, of course, is to apply either a feature level or a page level chunking.

Taking this approach, an interesting question to consider is: how do we decide which features and/or pages should be moved to their own chunks, in order to improve our app? Often, this decision is based on a completely subjective judgment. We subjectively decide that it's unlikely the user to open a given page or interact with a given feature so we move it to its own chunk and download it lazily. There's no point explaining how such a subjective judgment call could be completely irrelevant. Our users often behave in a way we don't expect them to.

**A better approach is to choose our chunk layout based on data.** There are different platforms which provide us an insight into how the users use our application. Google Analytics is a great example. Looking at the data which Google Analytics provide, we can decide which pages should be grouped together and what we can load lazily. This way we can make our "page-level" chunking data-driven, and respectively, less error-prone. For example, let's suppose that the graph below represents data gathered from Google Analytics. We can think of the nodes as the pages in the app and of the edges as the transitions between them. The thicker given edge is, the most likely is the user to perform given transition. It makes logical sense to group the JavaScript from pages `/a`, `/a/a`, and `/a/b` into one chunk, the JavaScript from the pages `/b` and `/b/b` into another chunk, and leave the root into a third chunk.

<img src="/static/images/mlx/ga-graph.svg" style="display: block; margin: auto; margin-top: 55px; margin-bottom: 55px; transform: scale(1.2);">

We talked about grouping chunks (i.e. chunk clusterization). Now let's say a few words about pre-fetching!

## Chunk Clusterization

A few years ago I posted [an article](http://blog.mgechev.com/2013/10/01/angularjs-partials-lazy-prefetching-strategy-weighted-directed-graph/) on how we can consider our page as a state machine. Based on the transitions that the user performs while navigating in this state machine, we can decide which pages are likely to be visited next, so we can pre-fetch them. In my article, the priorities of the pages were arbitrary, based on my subjective judgment. Fortunately, with tools such as Google Analytics, we can make such decisions more accurately.

## Thinking About What Matters

So, data-driven chunk clusterization and pre-fetching could be useful but why should we do it manually? Computers are good in analyzing data based on models. Computers are also good in static analysis of code, it's just a graph traversal in the end. Let's leave the **bundler to decide what's the best possible chunk layout and pre-fetching strategy based on the data we get from Google Analytics and the structure of our application**!

In this blog post, I'll demonstrate how combining a few tools we can automate the process of data-driven chunk clusterization and data-driven pre-fetching. All code examples can be found at my [GitHub profile](https://github.com/mgechev/mlx).

In the first a couple of sections, we'll cover the individual tools from the [`mlx`](https://github.com/mgechev/mlx) monorepo and explain how they work together. After that, we'll dig into implementation details starting with an optional, theoretical introduction to the mathematical foundation of the project. Although, saying "mathematical foundation" may sound a bit frustrating, the covered topics are essential and it's very likely you're already familiar with them. We're going to mention few algorithms from the graph theory and one popular machine learning model. Right after that, we're going to define few concepts in order to make sure we speak the same language. Finally, in details, we'll discuss how everything from `@mlx` works together.

# Tooling Introduction

**Disclaimer**: the packages that we're going to cover are in a very early stage of their development. It's very likely that they are incompatible with your projects. Keep in mind that their APIs are not finalized. Over time their implementation will mature and get more robust.

The examples with the article use two identical, simple Angular and React applications. The routing trees of these apps are the same as the routing tree of a production application that I've worked on in the past. The Google Analytics data used for the data-driven build is based on the original application.

The Angular application which uses the `mlx` package can be found [here](https://github.com/mgechev/ng-dd-bundled)<sup>[6]</sup> and the React one [here](https://github.com/mgechev/react-dd-bundled)<sup>[7]</sup>. Both applications are ejected from the official CLI tools of the framework. The only addition to their webpack configuration is:

```ts
...
const { MLPlugin } = require('@mlx/webpack');
...
new MLPlugin({ data })
...
```

Here `data` is a configuration property which contains processed data from Google Analytics. This data is extracted using `@mlx/ga`. A working example of data extraction can be found [here](https://github.com/mgechev/mlx-ga-demo)<sup>[8]</sup>.

For both, the Angular and the React application, once you run `npm build` the following is going to happen:

- Based on the extracted Google Analytics data logically connected chunks will be grouped together.
- The `MLPlugin` will inject some JavaScript in the main chunk of your application. This code will track the user's navigation and pre-fetch the chunks associated with the pages which the user is likely to visit.

I'd encourage you to play with the examples. Keep in mind that the React one will work properly only if you follow strictly the route definition convention in the project.

Now, we'll continue with the mathematical foundation of the project, right after which we'll dig into some technical details how everything works together.

# Mathematical Background

You can expand this section to get familiar with the mathematical foundations of this article. Here we're going to cover:

- Graphs, trees, weighted graphs, and connected components
- Probability and Markov chains

<div style="cursor: pointer; color: #5694f1;" id="expand">Expand &#9658;</div>
<div style="cursor: pointer; display: none; color: #5694f1;" id="collapse">Collapse &#9660;</div>
<section class="zippy hidden" id="zippy">

## Basics of Graph Theory

A graph in graph theory is represented as the tuple **`G = (E, V)`** where `E` is a set of edges and `V` is a set of vertices (nodes). In this article, we're often going to mention the term "dependency graph". This is just a graph which represents the dependencies between something. The individual entities of the problem domain are represented with the nodes of the graph and the dependencies between them are represented with the edges. For example:

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

<img src="/static/images/mlx/simple.svg" style="display: block; margin: auto; margin-top: 25px; margin-bottom: 25px; transform: scale(1.2);">

Notice that we have an arrow pointing from `bar.ts` to `foo.ts`. This is because `bar.ts` depends on `foo.ts`. Mathematically this graph looks like:

```text
G = ([('bar.ts', 'foo.ts')], ['bar.ts', 'foo.ts'])
```

Or in other words, we have the vertices `foo.ts` and `bar.ts` and one edge from `bar.ts` to `foo.ts`. Graphs with edges which point from one vertex to another are called **directed** graphs, otherwise, if there's path in both directions, we call the graph **undirected**. In directed graphs, the edges are ordered tuples, in undirected graphs the edges are unordered tuples.

Let's now suppose we have the following graph:

<img src="/static/images/mlx/dependencies.svg" style="display: block; margin: auto; margin-top: 45px; margin-bottom: 45px; transform: scale(1.2);">

In our program, we can represent this graph in different ways. For our purposes, we'll often use a **list of neighbors** representation:

```ts
const graph = {
  'foo.js': ['bar.js', 'baz.js'],
  'baz.js': ['foo.js'],
  'bar.js': ['baz.js']
};
```

The object above has three keys - one for each node of the graph. Each of the keys has an associated array which lists the neighbors of the current node.

Often we have a numeric value associated with the edge between two nodes. For example, in our Google Analytics case, this numeric value may represent the number of visits from page `A` to page `B`. In such case, we can model the data as a **weighted graph**. Here's how we can represent the Google Analytics data with JavaScript:

```ts
const graph = {
  '/a': {
    '/b': 10,
    '/c': 3
  },
  '/b': {
    '/a': 4
  }
};
```

From the graph, above we can see that there are `10` visits from page `/a` to page `/b`, `3` visits from `/a` to `/c`, and `4` visits from `/b` to `/a`.

### Connected Components

Often, however, users visit different modules of our application independently. For example, let's suppose that the following graph represents Google Analytics data:

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
    '/d': 5
  }
};
```

Let's look at the graphical representation of this graph:

<img src="/static/images/mlx/connected-components.svg" style="display: block; margin: auto; margin-top: 45px; margin-bottom: 45px; transform: scale(1.2);">

We can see that the entire graph consists of two smaller graphs: one which has the nodes `/a`, `/b`, and another one, with the nodes `/c`, `/d`, `/e`. Such "sub-graphs" in our graph are called **connected components**. In fact, it's convenient to think of the lazy-loaded chunks of our applications as the connected component of the dependency graph of our JavaScript.

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

We can see that we have path from `/a -> /b -> /c -> /a`, so basically, starting from `/a` we can reach `/a` again. In such case, we say that our graph has a cycle.

Often, we want to sort the vertices of our graph based on the dependencies they have. For example, let's say that we have the following dependencies between three JavaScript files:

```ts
// foo.js
export const foo = 42;
```

```ts
// bar.js
import { foo } from './foo';

export const bar = foo + 1.617;
```

```ts
// baz.js
import { foo } from './foo';
import { bar } from './bar';

console.log(foo);
```

This program will form the following dependency graph:

```ts
const graph = {
  'foo.js': [],
  'bar.js': ['foo.js'],
  'baz.js': ['foo.js', 'bar.js']
};
```

Now our bundler needs to figure out which is the entry point in the application in order to bundle all the files together. The bundler can do this, using the topological sorting algorithm. In this algorithm:

- We'll first find the file which has no dependencies, which in our case will be `foo.js`, and add it to the result list.
- After that, we'll remove `foo.js` from the graph, together with all edges pointing to it.
- As next step, we'll find the next node without dependencies. This is going to be `bar.js` since it no longer points to `foo.js` (this file is not in the graph anymore).
- We'll remove `bar.js` from the graph, add it to the result list and keep going.
- Finally, we'll find `baz.js` - the only node left in the graph. We'll add it to the result list and remove it from the graph.

This way the topological order of the graph will be `['foo.js', 'bar.js', 'baz.js']`. The bundler now can use `baz.js` as the entry point of the chunk. It turns out that topological sorting is very convenient for detecting cycles in the graph. If at a given point we cannot find a node without a dependency, this means that we have a cycle.

### Trees

Trees are graphs. A special kind of graphs:

>...tree is an undirected graph in which any two vertices are connected by exactly one path...

In other words, trees are **acyclic connected graph**.

For example, we may have the following *routing tree* in our application:

<img src="/static/images/mlx/tree.svg" style="display: block; margin: auto; margin-top: 45px; margin-bottom: 45px; transform: scale(1.2);">

As we can see, the root of the tree is `/`, its children are `/a` and `/b`, where `/a` has children `/a/a` and `/a/b`. From the diagram above, we can see that the **lowest-common ancestor (or LCA)** of `/a/a` and `/a/b` is `/a`.

## Basics Probability Theory

Let's take a look at this aggregated data from Google Analytics:

```ts
const graph = {
  '/a': {
    '/b': 10,
    '/c': 3
  },
  '/b': {
    '/a': 4
  }
};
```

We can notice that when the user is at page `/a`, `10` out of `13` visits they are going to go to `/b` (we're ignoring the cases when the user leaves the page). This means that `10/13` is the **probability** the user to go from `/a` to `/b` and `3/13` is the probability the user to go from `/a` to `/c`. Probability of an event is a number between 0 and 1 (i.e. in the interval `[0, 1]`).

Now, based on the probabilities for all the pages, we can form a matrix:

|        |  /a | /b    | /c   |
|--------|:---:|-------|------|
| **/a** | 0   | 10/13 | 3/13 |
| **/b** | 4/4 | 0     | 0    |
| **/c** | 0   | 0     | 0    |

From the matrix, we can conclude that:

- There's `0` probability the user to go from `/a` to `/a`.
- There's `10/13` probability the user to go from `/a` to `/b`.
- There's `3/13` probability the user to go from `/a` to `/c`.
- There's `4/4` probability (or `1`) the user to go from `/b` to `/a`.
- There's `0` probability for all other cases: `/b` to `/b`, `/b` to `/c`, `/c` to `/a`, `/c` to `/b`, and `/c` to `/c`.

A matrix like that, which describes a sequence of possible events in which the probability of each event depends only on the state attained in the previous event, we're going to call a **Markov Chain**. In fact, this is a machine learning model

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

To make sure we're all on the same page with the concepts that we're going to discuss, I want to start with a few definitions. The only pre-requirement for now is that each of the routes of the application will be lazy-loaded unless specified otherwise. This is just for simplicity, it's not a restriction of the algorithms that we're going to apply. Let's suppose we have the following page:

<img src="/static/images/mlx/navigation-graph.svg" style="display: block; margin: auto; margin-top: 25px; margin-bottom: 25px; transform: scale(1.2);">

## Navigation Graph

The graph above we'll call **navigation graph**. The individual nodes in the navigation graph are the pages of our application and the edges between them represent the transitions from one page to another. It's important to mention that the **navigation graph is directed**. Usually, the edges between the individual nodes are represented by links in our application. This means that if we have an edge between `/a` and `/b`, we most likely have a link between these two pages. Of course, another way the user to navigate between `/a` and `/b` is by directly using the address bar of the browser.

For our purposes, we're going to use the navigation graph from Google Analytics which we have extracted with `@mlx/ga`.

## Page Graph

Although the navigation graph looks pretty handy, it's not usable for our purposes because often our applications' routes are parametrized. For example, let's suppose we have the routes:

```text
/a
/a/:id
/b
/c
```

In this case, if we're interested in analyzing the application we most likely want to think of both `/a/a` and `/a/b` as `/a/:id`. The navigation graph, which contains aggregated information based on the routes of our application we'll call **page graph**. The navigation graph from above, translated to page graph will look like:

<img src="/static/images/mlx/page-graph.svg" style="display: block; margin: auto; margin-top: 25px; margin-bottom: 25px; transform: scale(1.2);">

## Routing Tree

The declarations of the routes of the application form a tree-like structure. For example, we have the root route `/`, which has three children routes `/a`, `/b`, and `/c`. The route `/a` has a single child route `/a/:id`. This tree we're going to call a **routing tree**.

## Bundle Routing Tree

If we suppose that all the routes in our application are associated with entry points of chunks then our bundle tree's shape matches the routing tree. The only difference is that the routing tree's nodes will be named after the routes and the bundle routing tree's nodes are going to be named after the entry points of the chunks.

Now let's suppose we have the following route declarations:

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

In this case, the routing tree will differ from the bundle routing tree:

- The routing tree will have a single root node called `/` with three children: `/intro`, `/main`, and `/about`.
- The bundle routing tree will have root node named after the file which contains the routes definitions (`app.routing-module.ts` for Angular and `App.tsx` for React), and two children (for Angular - `./main/main.module` and `./about/about.module`, and for React - `./Main.tsx` and `./About.tsx`). In this case, the routing tree and the bundle routing tree differ because two routes point to the same chunk entry point.

## Bundle Page Graph

We already defined the page graph as the navigation graph which we got from given source with aggregated routes (Google Analytics, let's say). If instead of the routes, we get the entry points of their corresponding chunks, we'll get the bundle page graph.

Keep in mind that we may not have 1:1 correspondence between chunk entry point and a route. This is possible in the case when not all the routes are loaded lazily. In such case, we need to combine several nodes from the page graph to one. If we form the bundle page graph from a weighted page graph, the bundle page graph will be weighted as well. The difference is that the weights of the edges going from a given chunk entry point will equal to the sum of the corresponding edges of the merged nodes from the page graph.

# Technical Details

Alright, now we understand all the mathematics behind the tool and we defined all the concepts. Let's dig into some technical details!

If you take a look at the [`mlx` monorepo](https://github.com/mgechev/mlx), you will find the following four packages:

- [`@mlx/ga`](https://github.com/mgechev/mlx/tree/01fb7db67efe30b6fed1623ea64d2ba190c4b316/packages/ga) - a module which is used to fetch structured information from Google Analytics. Keep in mind that the information coming from Google Analytics is not aware of our application parametrized routes, i.e. **we get a navigation graph which we need to translate to a page graph**. `@mlx/ga` can do this automatically for us, if we provide a list of all the paths in our application.
- [`@mlx/parser`](https://github.com/mgechev/mlx/tree/01fb7db67efe30b6fed1623ea64d2ba190c4b316/packages/parser) - a module which extracts the routes of our application, finds the associated chunk entry points of the lazy-loaded routes and builds the routing bundle tree.
- [`@mlx/clusterize`](https://github.com/mgechev/mlx/tree/01fb7db67efe30b6fed1623ea64d2ba190c4b316/packages/clusterize) - a module which performs a clusterization algorithm based on the data from Google Analytics and the bundle routing tree, which we got from `@mlx/parser`.
- [`@mlx/webpack`](https://github.com/mgechev/mlx/tree/01fb7db67efe30b6fed1623ea64d2ba190c4b316/packages/webpack) - a set of webpack plugins which use `@mlx/parser` and `@mlx/clusterize` in order to produce data-driven bundle layout for our application, and generate code for data-driven pre-fetching.

Let's first explain how we can use `@mlx/ga` and how it works internally.

## `@mlx/ga`

In the repository [mlx-ga-demo](https://github.com/mgechev/mlx-ga-demo), there's code which shows how this module can be used. Here's the main file which illustrates the module's API:

```ts
const { fetch } = require('@mlx/ga');
const { parseRoutes, ProjectType } = require('@mlx/parser');
const { writeFileSync } = require('fs');

// Credentials from the Google Console with access to the Google Analytics API
const key = require('./credentials.json');
// Google Analytics View ID
const viewId = '000000000';

const applicationRoutes = parseRoutes(
  '<Path_to_tsconfig.json>',
  ProjectType.Angular // or ProjectType.React
);

fetch(
  key,
  viewId,
  {
    startDate: new Date('2016-1-1'),
    endDate: new Date('2018-2-24')
  },
  r => r.replace('/app', ''),
  applicationRoutes.map(f => f.path)
).then(g => writeFileSync('data.json', JSON.stringify(g, null, 2)));
```

In the snippet above we import `fetch` from `@mlx/ga`. That's the only exported symbol from the package. The `fetch` method accepts:

- Key for access to the Google Analytics API <sup>[9]</sup>
- Google Analytics View ID <sup>[9]</sup>
- Start & end intervals for the Google Analytics report
- Optional URL formatter. The URL formatter is a function which accepts the individual URLs coming from Google Analytics and performs manipulation over them. In the example above, it drops the `/app` prefix.
- Optional list of route names from our application. We can either provide them as an array, which we have manually collected or we can use `@mlx/parser` in order to extract them automatically. This array is essential in order to allow `@mlx/ga` to map the navigation graph to a page graph.

Internally, **`@mlx/ga` will build the weighted page graph of the application**. The tool will query Google Analytics' API and will get the previous page for each visited page, together with the number of visits. This way, in the end, we'll have a graph similar to this one:

```js
{
  "": {
    "/intro/parent": 144,
    "/intro": 36,
    "/intro/parent/personalize": 23,
    "/main/kid/question/:standard/:question/:id": 25,
    "/main/kid/question/:standard/:question": 4,
    "/main/kid/reports": 2,
  },
  "/intro": {
    "": 69,
    "/intro/parent": 18,
    "/main/kid/question/:standard/:question": 7,
    "/main/kid/question/:standard/:question/:id": 20,
    "/main/parent/home": 1,
    "/main/parent/settings": 2
  },
  "/intro/parent": {
    "/intro": 28,
    "": 17,
    "/intro/parent/info": 7,
    "/main/kid/question/:standard/:question/:id": 10,
  },
  // ...
}
```

This is stripped version of the graph that I used for developing the two examples for [Angular](https://github.com/mgechev/ng-dd-bundled)<sup>[6]</sup> and [React](https://github.com/mgechev/react-dd-bundled)<sup>[7]</sup>. Here's an interactive visualization of the entire aggregated data:

<div style="height: 600px; width: 100%" id="canvas"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.2.9/cytoscape.js"></script>
<script src="/assets/js/mlx/graph.js"></script>

You can find demo of this module [here](https://github.com/mgechev/mlx-ga-demo)<sup>[8]</sup>. All you need to do is download your private key from the Google Developer Console, place it in `credentials.json` and replace the view ID with the one of your web app.

## `@mlx/webpack`

Now, once we have collected the data from Google Analytics, we can plug `@mlx/webpack` in our build process. For the purpose, we should eject our Angular CLI application (or `create-react-app` one) and in `webpack.config.js` add the following lines:

```ts
const { MLPlugin } = require('@mlx/webpack');

plugins: [
  // ...
  new MLPlugin({ data: require('./path/to/data.json') })
  // ...
]
```

...and that's it! Our application now will be bundled according to the data gotten from Google Analytics. There are a couple of magical things going on but before explaining them, let's take a look at the detailed configuration of `MLPlugin`:

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

- `debug` indicates if the plugin's verbose logging should be enabled.
- `data` is the data gathered from Google Analytics.
- `routeProvider` is a function which returns the mapping between routes and chunk entry points. If a `routeProvider` is not specified, `@mlx/webpack` will use the default route provider implementation from `@mlx/parser`. This is **extremely powerful configuration property**. If you have a React application and the default `routeProvider` doesn't work (which is very likely) you can provide a custom function which returns them:
  ```ts
  new MLPlugin({ data, routeProvider: () => [{...}, {...}] })
  ```
- `runtime` configures the plugin for data-driven bundle pre-fetching. With this property, we can either specify an optional `basePath` or disable the pre-fetching completely.
- `build` is the part of the `@mlx/webpack` plugin which by default groups the webpack chunks based on the clusterization algorithm performed by `@mlx/clusterize`. This may sound a bit abstract at first. We can think of it as a piece of code which tries to reason from the provided data from Google Analytics which pages will be visited in the same session. Based on this information the plugin may group (integrate) some chunks together.

Keep in mind that **the plugin will not do any code splitting**. It relies that all your routes are loaded lazily and it may only group some of the corresponding chunks together depending on the provided data.

### Performed Algorithm

Once the line `new MLPlugin({ data: require('./path/to/data.json') })` gets evaluated, few important things will happen:

- `MLPlugin` will check for a `routeProvider`. If it doesn't discover such, it'll try to guess your application type (i.e. Angular or React) and discover the `tsconfig.json` file of the project.
- If it succeeds, it'll invoke the `@mlx/parser` and collect all the routes, the associated with them chunk entry points, and their parent chunk entry point.
- It'll initialize the `ClusterizeChunksPlugin` and `RuntimePrefetchPlugin`.

As you might have already guessed, **`ClusterizeChunksPlugin` is used for combining chunks** and **`RuntimePrefetchPlugin` is used for** injecting some small piece of code which will make our application **pre-fetch bundles based on the user's behavior, the provided data from Google Analytics, and network speed**!

### Runtime Pre-fetching

The `RuntimePrefetchPlugin` will generate a Markov Chain based on the generated weighted bundle page graph. For each route in the application, we'll get a row from the matrix. For example:

```ts
{
  '/a': [
    { chunk: 'b.js', probability: 0.6 },
    { chunk: 'c.js', probability: 0.3 },
    { chunk: 'd.js', probability: 0.1 },
  ],
  '/b': [
    { chunk: 'a.js', probability: 1 },
  ]
}
```

In the example above, we can see that when the user is in page `/a` there's `0.6` probability the bundle `b.js` to be required next, `0.3` probability for the bundle `c.js`, and `0.1` for the bundle `d.js`. You can also notice that `RuntimePrefetchPlugin` sorts the chunks based on their probability. Another feature of the plugin is that it's going to have different probability threshold depending on the user's network speed. For example, if the user is with effective speed `4g`, we'll download all chunks which probability is over `0.15`, if the user is with `3g` we will download only chunks with probability to be needed `0.3`.

The module that we're going to take a look at is `@mlx/parser`.

## `@mlx/parser`

This package is optional for both - `@mlx/webpack` and `@mlx/ga` but it's also quite convenient. The parser does two key things:

- Finds the route declarations in our application. This allows us to aggregate the navigation graph that we get from Google Analytics and transform it to a page graph.
- Finds the entry points of the routing bundles, and their parent modules. Although we can do this manually as well, and provide information for where your bundles are defined and which routes are associated to them, it's still much more convenient to use `@mlx/parser`.

The second point is crucial for the work of `@mlx/webpack` and `@mlx/clusterize`. Once we provide a project type and a `tsconfig.json` file to `@mlx/parser`'s `parseRoutes` method, it'll automatically extract all the metadata and populate it into a JavaScript array of the form:

```js
[
  {
    path: '/main',
    modulePath: '/Users/mgechev/Projects/ng-dd-bundled/src/app/main/main.module.ts',
    lazy: true,
    parentModulePath: '/Users/mgechev/Projects/ng-dd-bundled/src/app/app.module.ts'
  },
  {
    path: '/main/parent',
    modulePath: '/Users/mgechev/Projects/ng-dd-bundled/src/app/main/parent/parent.module.ts',
    lazy: true,
    parentModulePath: '/Users/mgechev/Projects/ng-dd-bundled/src/app/main/main.module.ts'
  },
  {
    path: '/intro/parent/reward/:id',
    modulePath: '/Users/mgechev/Projects/ng-dd-bundled/src/app/intro/intro-parent/intro-reward/intro-reward.module.ts',
    lazy: true,
    parentModulePath: '/Users/mgechev/Projects/ng-dd-bundled/src/app/intro/intro-parent/intro-parent.module.ts'
  }
  // ...
]
```

This is stripped version of the array produced after parsing the [sample Angular project](https://github.com/mgechev/ng-dd-bundled). There are several important things to notice:

- The array contains the routes from our definitions. This means that the parameterized routes look the way we define them in the source code.
- Each array element has a `modulePath` property which points to the entry point of the JavaScript chunk which will be loaded when the user navigates to the given `path`.
- Each element also has a `parentModulePath`. This is the entry point of the chunk which contains the actual route definition. For non-lazy routes, the `modulePath` will have the same value as the `parentModulePath`.

You can find the Angular and the React parsers of `@mlx/parser` [here](https://github.com/mgechev/mlx/tree/master/packages/parser) <sup>[10]</sup>.

Both parsers perform static analysis. The Angular parser uses an abstraction on top of the Angular compiler - [ngast](https://github.com/mgechev/ngast) <sup>[11]</sup>. For now, the React parser relies on a lot of conventions. It's built on top of TypeScript.

## `@mlx/clusterize`

The final package that we're going to cover is the clusterization algorithm. As input, it accepts:

- `bundleGraph: Graph` - a weighted bundle page graph which is the result of the transformation of the weighed page graph.
- `modules: Module[]` - since the `bundleGraph` can represent only a partial part of the entire application (because of limited information from Google Analytics, for example), we need the entry points of the lazy-loaded chunks and their parents to be provided separately. That's the `modules` argument.
- `n: number` - `n` is the minimum number of chunks that we want to get at the end of the clusterization algorithm.

Once this information is available, the clusterization algorithm will:

1. Try to find the connected components in the `bundleGraph`.
2. In case the connected components are more than the minimum, the algorithm will return them.
3. In case the connected components are less than the minimum, the algorithm will find the edge with the smallest weight, and subtract it from all other edges.
4. After that the algorithm will go back to step 1. and repeat the procedure until it finds a clusterization of the graph satisfying `n`.

For finding the connected components in the graph, the current implementation uses [Tarjan's algorithm](https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm)<sup>[12]</sup>.

# Conclusion

In this blog post, we introduced the idea of data-driven chunk clusterization and pre-fetching. We explained how we can apply it by consuming aggregated data from one of the most popular services for web application analysis - Google Analytics.

After we looked at a brief introduction to graph theory and the probability theory, we introduced a few concepts, including navigation graph, page graph, and bundle page graph. Stepping on this solid foundation we explained the implementation of data-driven clusterization at `@mlx`.

# References

1. https://www.thinkwithgoogle.com/marketing-resources/experience-design/mobile-page-speed-load-time/
2. https://blog.hubspot.com/marketing/page-load-time-conversion-rates
3. https://medium.com/dev-channel/the-cost-of-javascript-84009f51e99e
4. https://www.webpagetest.org/
5. https://developers.google.com/web/tools/lighthouse/
6. https://github.com/mgechev/ng-dd-bundled
7. https://github.com/mgechev/react-dd-bundled
8. https://github.com/mgechev/mlx-ga-demo
9. http://2ality.com/2015/10/google-analytics-api.html
10. https://github.com/mgechev/mlx/tree/master/packages/parser
11. https://github.com/mgechev/ngast
12. https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm
