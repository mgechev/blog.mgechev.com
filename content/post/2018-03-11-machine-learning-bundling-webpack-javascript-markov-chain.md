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
date: 2018-03-18T00:00:00Z
draft: false
tags:
- TypeScript
- JavaScript
- React
- Angular
- Tooling
- Webpack
- Machine Learning
title: Machine Learning-Driven Bundling. The Future of JavaScript Tooling.
url: /2018/03/18/machine-learning-data-driven-bundling-webpack-javascript-markov-chain-angular-react
---

In this article, I'll introduce the early implementation of a few tools which based on techniques from the machine learning allow us to perform data-driven chunk clustering and pre-fetching for single-page applications. **The purpose is to provide a zero-configuration mechanism which based on data from Google Analytics for the users' behavior performs the most optimal build.** We're also going to introduce a **webpack plugin which works with Angular CLI and Create React App**.

**Such tool can improve the user-perceived page load performance by making the build process of our applications data-driven!** The final result is achieved by combining and/or pre-fetching JavaScript chunks which are most likely to be requested together in the same user session.

*I want to thank [Addy Osmani](https://twitter.com/addyosmani) for the review and his feedback of the early drafts of this post and the described tools!*

<section style="background: #eee; padding: 15px;">
If you're only interested in the practical applications of the described packages, you can read the "Introduction" and the "Tooling Introduction" sections. In case you want to know more about the implementation details, you can focus on the sections "Definitions" and "Technical Details".
</section>

# Introduction

Over the past a couple of years, we started shipping web apps which provide a user experience comparable to the native applications. This wouldn't be possible without all the advancements in the web platform. We have hundreds of new APIs which allow us to do what we've never thought would possible to achieve with JavaScript in the browser.

Of course, everything comes at a price. The complexity of the single-page applications is growing exponentially! Together with it is also growing the number of assets that we need to transfer over the network. There is a [lot](https://www.thinkwithgoogle.com/marketing-resources/experience-design/mobile-page-speed-load-time/)<sup>[1]</sup> of [research](https://blog.hubspot.com/marketing/page-load-time-conversion-rates)<sup>[2]</sup> proving that the load time of our apps directly impacts the conversion rate and therefore our revenue.

It's also clear that some assets are more [expensive than others](https://medium.com/dev-channel/the-cost-of-javascript-84009f51e99e)<sup>[3]</sup>. JavaScript compared to images, for instance, is much more expensive because of its non-trivial processing mechanism (parsing, compilation, and execution).

Well, slow pages are also stressful:

<center>
<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Waiting for slow web pages to load is as stressful as watching a horror movie: <a href="https://t.co/spwEC1P9ct">https://t.co/spwEC1P9ct</a> <a href="https://twitter.com/hashtag/perfmatters?src=hash&amp;ref_src=twsrc%5Etfw">#perfmatters</a> <a href="https://t.co/3JmcGPZij2">pic.twitter.com/3JmcGPZij2</a></p>&mdash; Addy Osmani (@addyosmani) <a href="https://twitter.com/addyosmani/status/711330814827569152?ref_src=twsrc%5Etfw">March 19, 2016</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</center>

## JavaScript Bundling

A common practice for dealing with a large amount of JavaScript is dividing it into multiple chunks and loading them on demand. There are two main approaches we can apply:

- **Route-based code-splitting** - the given JavaScript chunks correspond to one or more pages in the app. While the user navigates in the application they trigger network requests which download the chunk associated with the target route.
- **Component-based code-splitting** - imagine one of the pages contains a heavy widget which is not very likely to be used. We can simply move the associated JavaScript outside of the route chunk and download it on demand when the user intends to interact with the widget. This can be considered as a superset of the "route-based code-splitting" category but, as I'll mention below, it's convenient to put it into a different category.

There are brilliant tools, such as [webpagetest](https://www.webpagetest.org/)<sup>[4]</sup> and [Lighthouse](https://developers.google.com/web/tools/lighthouse/)<sup>[5]</sup>, which tell us when we've done a poor job with the production build of our apps. After they give us a bunch of pointers, it's our responsibility to fix the mess. One of the common warnings we get from Lighthouse, for instance, is that the JavaScript we include during the initial page load is too much. The logical approach is to apply either component- or route-based code-splitting, in order to delay the request for code which is not essential for the user's initial interaction with the application.

Taking this approach, an interesting question to consider is: how do we decide which features and/or pages should be moved to their own chunks? Often, this decision is based on a completely subjective judgment. We subjectively decide that it's unlikely the user to open a given page or interact with a given feature so we move it to its own chunk and download it lazily. There's no point explaining how such a subjective judgment call could be completely irrelevant. Our users often behave in a way we don't expect them to.

**A better approach is to choose our chunk layout based on data.** There are different platforms which provide us an insight into how the users behave. Google Analytics is a great example. Looking at a Google Analytics report, we can decide which pages should be grouped together and what we can load lazily. This way we can make the route-based code-splitting data-driven and respectively less error-prone.

For example, let's suppose that the graph below represents data collected from Google Analytics. We can think of the nodes as the pages and of the edges as the transitions between them. The thicker given edge is, the more likely is the user to perform given transition. It makes logical sense to group the JavaScript from pages `/a`, `/a/a`, and `/a/b` into one chunk, the JavaScript from the pages `/b` and `/b/a` into another chunk, and leave the root into a third chunk.

<img src="/images/mlx/ga-graph.svg" style="display: block; margin: auto; margin-top: 30px; margin-bottom: 30px;">

We talked about grouping chunks (i.e. **chunk clustering**). Now let's discuss pre-fetching.

## Chunk Pre-Fetching

A few years ago I posted [an article](https://blog.mgechev.com/2013/10/01/angularjs-partials-lazy-prefetching-strategy-weighted-directed-graph/)<sup>[6]</sup> on how we can consider our page as a state machine. Based on the transitions that the user performs while navigating in this state machine, we can decide which pages are likely to be visited next, so we can pre-fetch them. In my article, the priorities of the pages were arbitrary, based on my subjective judgment. Fortunately, with tools such as Google Analytics, we can set priorities much more accurately.

With this in mind, I decided to go one step further and based on an existing report, to **develop a machine learning model for chunk pre-fetching**. My idea was validated, got more accurate, and polished after going through the summary article for [predictive fetching](https://github.com/addyosmani/predictive-fetching)<sup>[7]</sup>

## Thinking About What Matters

Obviously, data-driven chunk clustering and pre-fetching are both quite useful. The process of implementing them at the moment is manual and error-prone. On the other hand, computers are good in analyzing data based on models. Computers are also good in static analysis of code - it's just a graph traversal. Let's leave the **bundler to decide what's the best possible chunk layout and pre-fetching strategy based on the data we get from Google Analytics and the structure of our application! This way we can completely automate our data-driven build process and focus on what really matters.**

In this blog post, I'll demonstrate how combining a few tools we can automate the process of data-driven chunk clustering and data-driven pre-fetching. The [packages](https://github.com/mgechev/mlx)<sup>[8]</sup> and the [code](https://github.com/mgechev/ng-dd-bundled)<sup>[9]</sup> [samples](https://github.com/mgechev/react-dd-bundled)<sup>[10]</sup> can be found at my [GitHub profile](https://github.com/mgechev).

In the first a couple of sections, we'll cover the individual tools from the [`mlx`](https://github.com/mgechev/mlx) monorepo and explain how they work together. After that, we'll dig into implementation details starting with an optional, theoretical introduction to the mathematical foundation of the project. Although, saying "mathematical foundation" may sound a bit frustrating, the covered topics are essential and it's very likely you're already familiar with them. We're going to mention few algorithms from the graph theory and one popular machine learning model. Right after that, we're going to define few concepts in order to make sure we speak the same language. Finally, in details, we'll discuss how everything from `@mlx` works together.

# Tooling Introduction

**Disclaimer**: the packages that we're going to cover are in a very early stage of their development. It's very likely that they are incompatible with your projects. Keep in mind that their APIs are not finalized. Over time their implementation will mature and get more robust.

The examples with the article use two identical Angular and React applications. The routing trees of these apps are the same as the routing tree of a production application that I've worked on in the past. The Google Analytics data used for the data-driven build is based on the original application.

The Angular application which uses the `mlx` package can be found [here](https://github.com/mgechev/ng-dd-bundled)<sup>[9]</sup> and the React one [here](https://github.com/mgechev/react-dd-bundled)<sup>[10]</sup>. Both projects are ejected from the official CLI tools of the corresponding framework.

Let's take a look at how we can use the tools in the contexts of both React and Angular.

First, clone the example of your choice:

```bash
# Angular example
git clone https://github.com/mgechev/ng-dd-bundled demo
# React example
git clone https://github.com/mgechev/react-dd-bundled demo
```

After that, install the dependencies of the project:

```bash
cd demo && npm i
```

As next step, let's build the project:

```bash
npm run build
```

The last step is going to produce a non-minified build of the application. All we need to do now is serve the static assets. For the purpose, we can use the npm package `serve`. You can install it with:

```bash
npm i -g serve
```

Now run:

```bash
# For Angular
serve -s dist
# For React
serve -s build
```

When you open [http://localhost:5000](http://localhost:5000), you should see a screen similar to the gif below:

![Demo](/images/mlx/demo.gif)

**Notice that we have only lazy-loaded route definitions in both demos**. This means that the browser will send a request over the network for each chunk corresponding to the route that the user navigates to. The build from the gif above is using the automated data-driven clustering and pre-fetching from mlx.

Notice that when the user navigates from "Parent" to "Settings" the browser doesn't send an extra HTTP request to load the chunk associated with the "Settings" route. This is because the webpack plugin combined the "Settings" and the "Parent" chunks based on the Google Analytics data which we provided. Another interesting observation is that when we navigate to "Settings", the application pre-fetches the "FAQ" module, together with the "Intro" module. Again, this is based on the data we got from Google Analytics which hints the tooling that after the user goes to "Settings" they will most likely visit "FAQ" or "Intro".

Now, let's look at the extra configuration that we've provided on top of the default Angular CLI/Create React App setup. Look at `webpack.config.js` for Angular CLI, and `config/webpack.config.prod.js` for the React project. You'll notice the following lines:

```ts
...
const { MLPlugin } = require('@mlx/webpack');
const data = require('./data.json');
...
  new MLPlugin({ data })
...
```

Here `data` is a configuration property which contains processed data from Google Analytics. This data is extracted using `@mlx/ga`. A working example of the data extraction can be found [here](https://github.com/mgechev/mlx-ga-demo)<sup>[11]</sup>.

I'd encourage you to play with the examples. Keep in mind that the React one will work properly only if you follow strictly the route definition convention in the project. We'll talk more about the limitations of the current React route parser in the `@mlx/parser` section of the project.

We're going to dig in implementation details and what happens under the hood but before that, we'll continue with the explanation of the mathematical foundation of the project.

# Mathematical Background

You can expand this section to get familiar with the mathematical foundations of this article. Here we're going to cover:

- Graphs, trees, weighted graphs, and connected components
- Probabilities and Markov chains

<div style="cursor: pointer; color: #5694f1;" id="expand">Expand &#9658;</div>
<div style="cursor: pointer; display: none; color: #5694f1;" id="collapse">Collapse &#9660;</div>
<section class="zippy hidden" id="zippy">

## Basics of Graph Theory

A graph in graph theory is represented as the tuple **`G = (E, V)`** where `E` is a set of edges and `V` is a set of vertices (nodes). In this article, we're often going to mention the term "dependency graph". This is a graph which represents the dependencies between entities (source files, people, chunks, etc.). The individual entities of the problem domain are represented with the nodes of the graph and the dependencies between them are represented with the edges. For example:

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

<img src="/images/mlx/simple.svg" style="display: block; margin: auto; margin-top: 30px; margin-bottom: 30px;">

Notice that we have an arrow pointing from `bar.ts` to `foo.ts`. This is because `bar.ts` depends on `foo.ts`. Mathematically this graph looks like:

```text
G = ([('bar.ts', 'foo.ts')], ['bar.ts', 'foo.ts'])
```

Or in other words, we have the nodes `foo.ts` and `bar.ts` and one edge from `bar.ts` to `foo.ts`. Graphs with edges which point from one node to another are called **directed** graphs, otherwise, if there's a path in both directions, we call the graph **undirected**. In directed graphs, the edges are ordered tuples, in undirected graphs the edges are unordered tuples.

Let's now suppose we have the following graph:

<img src="/images/mlx/dependencies.svg" style="display: block; margin: auto; margin-top: 30px; margin-bottom: 30px;">

In our program, we can represent it in different ways. For our purposes, we'll often use a **list of neighbors** representation:

```ts
const graph = {
  'foo.js': ['bar.js', 'baz.js'],
  'baz.js': ['foo.js'],
  'bar.js': ['baz.js']
};
```

The object above has three keys - one for each node of the graph. Each of the keys has an associated array which lists the neighbors of the current node.

Often we have a numeric value associated with an edge between two nodes. For example, if we have a Google Analytics report, we can represent the pages as nodes and the transitions between them as edges. The numeric values from the report which represent the number of visits from page `A` to page `B`, we can associate with the edges and call them **weights**. A graph which has weights associated with its edges we are going to call a **weighted graph**. Here's the data structure we can use for representing the Google Analytics report in our program:

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

<img src="/images/mlx/connected-components.svg" style="display: block; margin: auto; margin-top: 30px; margin-bottom: 30px;">

We can see that the entire graph consists of two smaller graphs: one which has the nodes `/a`, `/b`, and another one, with the nodes `/c`, `/d`, `/e`. Such "sub-graphs" in our graph are called **connected components**. In fact, **it's convenient to think of the lazy-loaded chunks of our applications as the connected component of the dependency graph of our JavaScript**.

### Trees

Trees are special kind of graphs:

>...tree is an undirected graph in which any two vertices are connected by exactly one path...

In other words, trees are **acyclic connected graph**.

For example, we may have the following *routing tree* in our application:

<img src="/images/mlx/tree.svg" style="display: block; margin: auto; margin-top: 30px; margin-bottom: 30px;">

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
  },
  '/c': {
    '/a': 1,
    '/b': 8
  }
};
```

We can notice that when the user is at page `/a`, `10` out of `13` visits they are going to go to `/b` (we're ignoring the cases when the user leaves the page). This means that `10/13` is the **probability** the user to go from `/a` to `/b` and `3/13` is the probability the user to go from `/a` to `/c`. The probability of an event is a number between 0 and 1 (i.e. in the interval `[0, 1]`).

Now, based on the probabilities for all the pages, we can form a matrix:

|        |  /a | /b    | /c   |
|--------|:---:|-------|------|
| **/a** | 0   | 10/13 | 3/13 |
| **/b** | 4/4 | 0     | 0    |
| **/c** | 1/9 | 8/9   | 0    |

From the matrix, we can conclude that:

- There's `0` probability the user to go from `/a` to `/a`.
- There's `10/13` probability the user to go from `/a` to `/b`.
- There's `3/13` probability the user to go from `/a` to `/c`.
- There's `4/4` probability (or `1`) the user to go from `/b` to `/a`.
- There's `1/9` probability the user to go from `/c` to `/a`.
- There's `8/9` probability the user to go from `/c` to `/b`.

A matrix like this, which describes a sequence of possible events in which the probability of each event depends only on the state attained in the previous event, we're going to call a **Markov chain**. This is the basic machine learning model that we're going to use for page pre-fetching.

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

To make sure we're all on the same page with the concepts that we're going to discuss, I want to start with a few definitions. The only pre-requirement for now is that each of the routes of the application will be lazy-loaded unless specified otherwise. This is just for simplicity, it's not a restriction of the algorithms that we're going to apply.

Let's suppose we have an application with the pages `/a`, `/a/a`, `/a/b`, `/b`, and `/c`, with the following transitions between them:

<img src="/images/mlx/navigation-graph.svg" style="display: block; margin: auto; margin-top: 30px; margin-bottom: 30px;">

## Navigation Graph

The graph above we'll call **navigation graph**. The individual nodes in the navigation graph are the pages of our application and the edges between them represent the transitions from one page to another. It's important to mention that the **navigation graph is directed**. Usually, the edges between the individual nodes are represented by links in our application. This means that if we have an edge between `/a` and `/b`, we most likely have a link between these two pages. Of course, another way the user to navigate between `/a` and `/b` is by directly using the address bar of the browser. The navigation graph encapsulates both types of transitions.

We're going to build the navigation graph from a Google Analytics report using the package `@mlx/ga`. We'll cover this tool later in the article.

## Page Graph

Although the navigation graph looks pretty handy, it's not usable for our purposes because often our applications' routes are parametrized. For example, let's suppose we have the routes:

```text
/a
/a/:id
/b
/c
```

In this case, if we're interested in analyzing the application we most likely want to think of both `/a/a` and `/a/b` as `/a/:id`. The navigation graph, which contains aggregated information based on the routes of the application we'll call a **page graph**, or a **route graph**. The navigation graph from above, translated to a page graph will look like:

<img src="/images/mlx/page-graph.svg" style="display: block; margin: auto; margin-top: 30px; margin-bottom: 30px;">

## Routing Tree

The declarations of the routes of the application form a tree-like structure. For example, we have the root route `/`, which has three children routes `/a`, `/b`, and `/c`. The route `/a` has a single child route `/a/:id`. This tree we're going to call a **routing tree**.

<img src="/images/mlx/routing-tree.svg" style="display: block; margin: auto; margin-top: 30px; margin-bottom: 30px;">

## Bundle Routing Tree

If we suppose that all the routes in the application are associated with entry points of chunks then our bundle tree's shape matches the routing tree. The only difference is that the routing tree's nodes will be named after the routes and the bundle routing tree's nodes are going to be named after the entry points of the chunks.

Now let's suppose we have the following route declarations:

```ts
// React
// app.tsx
<Route path="/a" component={AsyncComponent(() => import('./com'))} />
<Route path="/b" component={AsyncComponent(() => import('./com'))} />
<Route path="/c" component={AsyncComponent(() => import('./c'))} />
```

or in Angular:

```ts
// Angular
// app.ts
export const appRoutes: Routes = [
  {
    loadChildren: './com#A',
    path: 'a'
  },
  {
    loadChildren: './com#B',
    path: 'b'
  },
  {
    loadChildren: './c#C',
    path: 'c'
  }
];
```

In this case, the routing tree will differ from the bundle routing tree:

- The routing tree will have a single root node called `/` with three children: `/a`, `/b`, and `/c`.
- The bundle routing tree will have root node named after the file which contains the routes' definitions  (`app.ts` for Angular and `app.tsx` for React), and two children (for Angular - `./com` and `./c`, and for React - `./com.tsx` and `./c.tsx`). In this case, the routing tree and the bundle routing tree differ because two routes point to the same chunk entry point.

<img src="/images/mlx/bundle-routing-tree.svg" style="display: block; margin: auto; margin-top: 30px; margin-bottom: 30px;">

## Bundle Page Graph

We already defined the page graph as the navigation graph which we got from given source with aggregated routes (Google Analytics, let's say). If instead of the routes, we get the entry points of their corresponding chunks, we'll get the **bundle page graph**.

Keep in mind that we may not have a one-to-one correspondence between chunk entry point and a route. This is possible in the case when not all the routes are loaded lazily. In such case, we need to combine several nodes from the page graph. If we form the bundle page graph from a weighted page graph, the bundle page graph will be weighted as well. The difference is that the weights of the edges going from a given chunk entry point will equal to the sum of the corresponding edges of the merged nodes from the page graph.

# Technical Details

Now we understand all the mathematics behind the tool and we defined all the concepts. Let's dig into some technical details!

If you look at the [`mlx` monorepo](https://github.com/mgechev/mlx)<sup>[8]</sup>, you will find the following four packages:

- [`@mlx/ga`](https://github.com/mgechev/mlx/tree/720822fbf92729da0c0df28877838b4e2958fd28/packages/ga) - a module used to fetch structured information from Google Analytics. Keep in mind that the information coming from Google Analytics is not aware of our application parametrized routes, i.e. **we get a navigation graph which we need to translate to a page graph**. `@mlx/ga` can do this automatically for us, if we provide a list of all the paths in the application.
- [`@mlx/parser`](https://github.com/mgechev/mlx/tree/720822fbf92729da0c0df28877838b4e2958fd28/packages/parser) - a module which extracts the routes of our application, finds the associated chunk entry points of the lazy-loaded routes and builds the routing bundle tree. In other words, once we parse the application with the `@mlx/parser`, we'll get an array with all the routes, their corresponding chunk entry points, and their parent chunk entry points.
- [`@mlx/cluster`](https://github.com/mgechev/mlx/tree/720822fbf92729da0c0df28877838b4e2958fd28/packages/cluster) - a module which performs a clustering algorithm based on the data from Google Analytics and the bundle routing tree, which we got from `@mlx/parser`.
- [`@mlx/webpack`](https://github.com/mgechev/mlx/tree/720822fbf92729da0c0df28877838b4e2958fd28/packages/webpack) - a set of webpack plugins which use `@mlx/parser` and `@mlx/cluster` in order to produce data-driven bundle layout for our application, and generate code for data-driven pre-fetching.

Let's first explain how we can use `@mlx/ga` and how it works internally.

## `@mlx/ga`

In the repository [mlx-ga-demo](https://github.com/mgechev/mlx-ga-demo)<sup>[11]</sup>, there's an example which shows how this module can be used. Here's the main file which illustrates the module's API:

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

fetch({
  key,
  viewId,
  period: {
    startDate: new Date('YYYY-MM-DD'),
    endDate: new Date('YYYY-MM-DD')
  },
  formatter: r => r.replace('/app', ''),
  routes: applicationRoutes.map(f => f.path),
  expression: 'ga:sessions'
})
.then(g => writeFileSync('data.json', JSON.stringify(g, null, 2)));
```

In the snippet above we import `fetch` from `@mlx/ga`. That's the only exported symbol from the package. The `fetch` method accepts an object holding the following data:

- Key for access to the Google Analytics API (you can find how to get it [here](http://2ality.com/2015/10/google-analytics-api.html)<sup>[12]</sup>).
- Google Analytics View ID <sup>[12]</sup> for our application.
- Start and end dates for the Google Analytics report.
- Optional URL formatter. The URL formatter is a function which accepts the individual URLs coming from Google Analytics and performs manipulation over them. In the example above, it removes the `/app` prefix from all of them.
- Optional list of route names from our application. We can either provide them as an array, which we have manually collected or we can use `@mlx/parser` in order to extract them automatically. This array is essential in order to allow `@mlx/ga` to map the navigation graph to a page graph.
- Google Analytics expression to be used for the weights of the navigation/page graph.

Internally, **`@mlx/ga` will build the weighted page graph of the application**. In case we don't provide a list of the routes, the result of the invocation will be the weighted navigation graph. Internally, the tool will query Google Analytics' API and get the previous page for each visited page, together with the number of visits (i.e. the variable associated with the provided expression). This way, in the end, we'll have a graph similar to this one:

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

This is stripped version of the graph that I used for developing the two examples for [Angular](https://github.com/mgechev/ng-dd-bundled)<sup>[9]</sup> and [React](https://github.com/mgechev/react-dd-bundled)<sup>[10]</sup>. Here's an interactive visualization of the entire aggregated data:

<div style="height: 600px; width: 100%; background-color: #23283B;" id="canvas"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.2.9/cytoscape.js"></script>
<script src="/assets/js/mlx/graph.js"></script>

The thicker given edge is, the more likely it is the user to perform the corresponding transition. The graph from the visualization is intentionally undirected to make the diagram less noisy.

You can find demo of this module [here](https://github.com/mgechev/mlx-ga-demo)<sup>[11]</sup>. As prerequirement, download your private key from the Google Developer Console, place it in `credentials.json` and replace the [view ID with the one of your web app](http://2ality.com/2015/10/google-analytics-api.html)<sup>[12]</sup>.

## `@mlx/webpack`

Now, once we have collected the data from Google Analytics, we can plug `@mlx/webpack` in our build process. For the purpose, we should eject the Angular CLI application (or `create-react-app` one) and in `webpack.config.js` add the following lines:

```ts
const { MLPlugin } = require('@mlx/webpack');

plugins: [
  // ...
  new MLPlugin({ data: require('./path/to/data.json') })
  // ...
]
```

...and that's it! Our application now will be bundled according to the data gotten from Google Analytics. There are a couple of magical things going on but before explaining them, let's take a look at the detailed configuration of the `MLPlugin`:

```ts
// Configuration of the MLPlugin
export interface MLPluginConfig {
  debug?: boolean;
  data: Graph;
  routeProvider?: RouteProvider;
  runtime?: false | RuntimeConfig;
  build?: false | BuildConfig;
}

// Configuration of the RuntimePrefetchPlugin
export interface RuntimeConfig {
  basePath?: string;
  prefetchConfig?: PrefetchConfig;
}

// Configuration of the ClusterChunksPlugin
export interface BuildConfig {
  minChunks?: number;
  algorithm?: ClusteringAlgorithm;
}

export type Neighbors = { [key: string]: number };

// Represents the probability threshold for the different
// effective connection types.
export interface PrefetchConfig {
  '4g': number;
  '3g': number;
  '2g': number;
  'slow-2g': number;
}

export interface Graph {
  [key: string]: Neighbors;
}
```

- `debug` indicates if the plugin's verbose logging should be enabled.
- `data` is the page graph gotten from Google Analytics.
- `routeProvider` is a function which returns the mapping between routes and chunk entry points. If a `routeProvider` is not specified, `@mlx/webpack` will use the default route provider implementation from `@mlx/parser`. This is **extremely powerful configuration property**. If you have a React application and the default `routeProvider` doesn't work you can provide a custom function which returns the metadata:
  ```ts
  new MLPlugin({ data, routeProvider: () => [{...}, {...}] })
  ```
- `runtime` configures the plugin for data-driven bundle pre-fetching. With this property, we can either specify an optional `basePath` and/or `prefetchConfig` or disable the pre-fetching completely.
- `build` is the part of the `@mlx/webpack` plugin which by default groups the webpack chunks based on the clustering algorithm performed by `@mlx/cluster`. We can think of it as an algorithm which tries to reason from the provided data from Google Analytics which pages will be visited in the same session. Based on this information the plugin may group (integrate) some chunks together.

Keep in mind that **the plugin will not do any code splitting**. It relies that all your routes are loaded lazily and it may only group some of the corresponding chunks together depending on the provided data.

### Custom Route Provider

As I mentioned, if `routeProvider` is not passed to the plugin configuration object, the default one will be used. The default route provider will return an array of objects in the following format:

```ts
interface RoutingModule {
  path: string;
  lazy: boolean;
  modulePath: string;
  parentModulePath: string;
}
```

In case the default route provider doesn't work for you, you can implement a function which parses your application and returns the routes in the specified format. If an entire parser seems like an overhead for your application, you can even collect the metadata manually and return it as the result of a constant function:

```ts
const routeProvider = () => [
  { path: 'foo', lazy: true, modulePath: '/foo', parentModulePath: null },
  { path: 'bar', lazy: true, modulePath: '/bar', parentModulePath: '/foo' }
];
```

My recommendation would be to implement a parser in order to keep your application as the single source of truth (SSOT). You can find implementations of Angular and React parsers in the `@mlx/parser` package.

### Performed Algorithm

Once the line `new MLPlugin({ data: require('./path/to/data.json') })` gets evaluated, few steps will happen:

- `MLPlugin` will check for a `routeProvider`. If it doesn't discover such, it'll try to guess your application type (i.e. Angular or React) by looking at `package.json` and try to discover the `tsconfig.json` file of the project.
- If it succeeds, it'll invoke the `@mlx/parser` and collect all the routes, the associated with them chunk entry points, and their parent chunk entry point.
- It'll initialize the `ClusterChunksPlugin` and `RuntimePrefetchPlugin`.

**`ClusterChunksPlugin` is used for combining chunks** and **`RuntimePrefetchPlugin` is used for** injecting a small piece of code which will make our application **pre-fetch chunks based on the user's behavior, the provided data from Google Analytics, and the user's connection speed**.

In other words, **`RuntimePrefetchPlugin` performs predictive and adaptive pre-fetching**.

### Runtime Pre-Fetching

The `RuntimePrefetchPlugin` will generate a [Markov Chain](https://en.wikipedia.org/wiki/Markov_chain)<sup>[14]</sup> model based on the generated weighted bundle page graph. For each route in the application, we'll get a row from the matrix. For example:

```ts
{
  '/': [
    { chunk: 'b.js', probability: 0.7 },
    { chunk: 'a.js', probability: 0.3 }
  ],
  '/a': [
    { chunk: 'b.js', probability: 0.1 },
  ]
  '/a/:id': []
  '/b': [],
  '/b/a': [
    { chunk: 'a.js', probability: 1 },
  ],
}
```

In the example above, we can see that when the user is in page `/` there's `0.7` probability the chunk `b.js` to be required next and `0.3` probability for the bundle `a.js`. Notice also that `RuntimePrefetchPlugin` gets the chunks in a sorted order by probability. Another feature of the plugin is that it's going to have a different probability threshold depending on the user's connection speed. For example, if the user has effective speed `4g`, we'll download all chunks which probability is over `0.15`, if the user is with `3g` we will download only chunks with probability over `0.3`, etc.

`RuntimePrefetchPlugin` can be configured with the following options:

```ts
export interface PrefetchConfig {
  '4g': number;
  '3g': number;
  '2g': number;
  'slow-2g': number;
}

export interface RuntimePrefetchConfig {
  debug?: boolean;
  data: Graph;
  basePath?: string;
  prefetchConfig?: PrefetchConfig;
  routes: RoutingModule[];
}
```

The `graph` passed here is the Google Analytics graph we got from `@mlx/ga` (i.e., either a navigation or a page graph). The `routes` array contains one object per route. Each object has a `modulePath` of the chunk entry point associated with the given route, `parentModulePath` which equals the path of the entry point of the parent module, and a `path` which equals to the route that this object represents.

`prefetchConfig` is also configurable! It contains the pre-fetching thresholds depending on the value of `window.navigator.connection.effectiveType`. Since `connection.effectiveType` is currently supported only by Chrome, the plugin will use the `3g` thresholds by default.

### How Pre-Fetching Works

Currently, when given chunk needs to be pre-fetched, the plugin will create a new `link` element with [`rel="prefetch"`](https://medium.com/reloading/preload-prefetch-and-priorities-in-chrome-776165961bbf)<sup>[13]</sup> and `href` attribute equal to the path to the chunk. This element will be added as child element to the `head` element, or the parent of the first `script` item in the page in case the `head` doesn't exist. Using this technique allows the browser to prioritize the pre-fetching process.

In order to get a better understanding of the process, let's quickly look at the animation below.

The shadow around a node represents the current page the user is at. The black border represents the nodes which are downloaded and available in the browser's cache. For the purpose of the example, we suppose that we have three chunks `root.js` (for the assets in `/`), `a.js` (for the assets in `/a`, `/a/:id`), and `b.js` (for `/b`, `/b/a`). Our second assumption in the example is that the probability threshold is `0.5`.

Here's the flow of events:

- First, the user visits the `/` page. The algorithm will look at the Markov chain and iterate over the elements. The algorithm will discover that `b.js` has `0.7` probability to be needed next, so it'll insert a `link[rel="prefetch"]` with `href="b.js"` to the page.
- After that, the user navigates to `/b`. Since `/b` and `/b/a` are already in the same bundle, and there are no other edges going from `/b`, nothing is going to happen.
- When the user navigates to `/b/a`, the algorithm will look at the last row of the matrix and find that chunk `a.js` has `1` probability to be downloaded. This will trigger the pre-fetching process for `a.js` which contains the assets from `/a` and `/a/:id`.

Keep in mind that we're ignoring the page leaves.

<style>
  .current-row td {
    background-color: #90CAF9 !important;
  }
  .diagram-wrapper {
    display: flex;
    justify-content: space-around;
  }
  .diagram-wrapper section {
    width: 30%;
  }
  @media (max-width: 660px) { 
    .diagram-wrapper {
      display: block;
    }
    .diagram-wrapper section {
      width: 100%;
      height: 120px;
    }
  }
</style>
<div class="diagram-wrapper">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="350px" height="310px" version="1.1">
  <defs/>
<filter id="dropshadow" height="130%">
  <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
  <feOffset dx="0" dy="0" result="offsetblur"/>
  <feComponentTransfer>
    <feFuncA type="linear" slope="0.9"/>
  </feComponentTransfer>
  <feMerge> 
    <feMergeNode/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>
  <g transform="translate(10,10)">
    <path d="M 163.24 69.73 L 135.02 101.09" fill="none" stroke="#434678" stroke-width="3" stroke-miterlimit="10" pointer-events="none"/>
    <path d="M 129 107.78 L 132.79 99.08 L 137.25 103.09 Z" fill="#434678" stroke="#434678" stroke-width="3" stroke-miterlimit="10" pointer-events="none"/>
    <path d="M 218.28 68.28 L 254.76 104.76" fill="none" stroke="#434678" stroke-width="5" stroke-miterlimit="10" pointer-events="none"/>
    <path d="M 260.42 110.42 L 252.88 106.65 L 256.65 102.88 Z" fill="#434678" stroke="#434678" stroke-width="5" stroke-miterlimit="10" pointer-events="none"/>
    <ellipse id="root" cx="190" cy="40" rx="40" ry="40" fill="#434678" stroke="10" stroke-color pointer-events="none"/>
    <g transform="translate(185.5,30.5)">
        <switch>
          <foreignObject style="overflow:visible;" pointer-events="all" width="8" height="19" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility">
              <div xmlns="http://www.w3.org/1999/xhtml" style="display: inline-block; font-size: 18px; font-family: Verdana; color: rgb(255, 255, 255); line-height: 1.2; vertical-align: top; width: 10px; white-space: nowrap; word-wrap: normal; text-align: center;">
                <div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block;text-align:inherit;text-decoration:inherit;">/</div>
              </div>
          </foreignObject>
          <text x="4" y="19" fill="#FFFFFF" text-anchor="middle" font-size="18px" font-family="Verdana">/</text>
        </switch>
    </g>
    <ellipse id="a" cx="40" cy="250" rx="40" ry="40" fill="#2ba57b" stroke="none" pointer-events="none"/>
    <g transform="translate(20.5,240.5)">
        <switch>
          <foreignObject style="overflow:visible;" pointer-events="all" width="38" height="19" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility">
              <div xmlns="http://www.w3.org/1999/xhtml" style="display: inline-block; font-size: 18px; font-family: Verdana; color: rgb(255, 255, 255); line-height: 1.2; vertical-align: top; width: 38px; white-space: nowrap; word-wrap: normal; text-align: center;">
                <div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block;text-align:inherit;text-decoration:inherit;">/a/a</div>
              </div>
          </foreignObject>
          <text x="19" y="19" fill="#FFFFFF" text-anchor="middle" font-size="18px" font-family="Verdana">/a/a</text>
        </switch>
    </g>
    <path d="M 80.98 175.19 L 68.17 198.49" fill="none" stroke="#2ba57b" stroke-width="6" stroke-miterlimit="10" pointer-events="none"/>
    <path d="M 62.39 209.01 L 64.66 196.56 L 71.67 200.42 Z" fill="#2ba57b" stroke="#2ba57b" stroke-width="6" stroke-miterlimit="10" pointer-events="none"/>
    <path d="M 140 140 L 233.41 140" fill="none" stroke="#3da47c" stroke-width="5" stroke-miterlimit="10" pointer-events="none"/>
    <path d="M 244.41 140 L 233.41 143.67 L 233.41 136.33 Z" fill="#3da47c" stroke="#3da47c" stroke-width="5" stroke-miterlimit="10" pointer-events="none"/>
    <path d="M 114.54 177.26 L 123.66 200.63" fill="none" stroke="#2ba57b" stroke-width="8" stroke-miterlimit="10" pointer-events="none"/>
    <path d="M 128.75 213.67 L 119.31 202.32 L 128.01 198.93 Z" fill="#2ba57b" stroke="#2ba57b" stroke-width="8" stroke-miterlimit="10" pointer-events="none"/>
    <ellipse id="a-a" cx="100" cy="140" rx="40" ry="40" fill="#2ba57b" stroke="none" pointer-events="none"/>
    <g transform="translate(90.5,130.5)">
        <switch>
          <foreignObject style="overflow:visible;" pointer-events="all" width="18" height="19" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility">
              <div xmlns="http://www.w3.org/1999/xhtml" style="display: inline-block; font-size: 18px; font-family: Verdana; color: rgb(255, 255, 255); line-height: 1.2; vertical-align: top; width: 20px; white-space: nowrap; word-wrap: normal; text-align: center;">
                <div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block;text-align:inherit;text-decoration:inherit;">/a</div>
              </div>
          </foreignObject>
          <text x="9" y="19" fill="#FFFFFF" text-anchor="middle" font-size="18px" font-family="Verdana">/a</text>
        </switch>
    </g>
    <path d="M 145.46 212.74 L 134.03 183.45" fill="none" stroke="#2ba57b" stroke-width="5" stroke-miterlimit="10" pointer-events="none"/>
    <path d="M 130.03 173.21 L 137.45 182.12 L 130.62 184.79 Z" fill="#2ba57b" stroke="#2ba57b" stroke-width="5" stroke-miterlimit="10" pointer-events="none"/>
    <ellipse id="a-b" cx="160" cy="250" rx="40" ry="40" fill="#2ba57b" stroke="none" pointer-events="none"/>
    <g transform="translate(140.5,240.5)">
        <switch>
          <foreignObject style="overflow:visible;" pointer-events="all" width="38" height="19" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility">
              <div xmlns="http://www.w3.org/1999/xhtml" style="display: inline-block; font-size: 18px; font-family: Verdana; color: rgb(255, 255, 255); line-height: 1.2; vertical-align: top; width: 40px; white-space: nowrap; word-wrap: normal; text-align: center;">
                <div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block;text-align:inherit;text-decoration:inherit;">/a/b</div>
              </div>
          </foreignObject>
          <text x="19" y="19" fill="#FFFFFF" text-anchor="middle" font-size="18px" font-family="Verdana">/a/b</text>
        </switch>
    </g>
    <path d="M 290 180 L 290 193.41" fill="none" stroke="#fc9022" stroke-width="5" stroke-miterlimit="10" pointer-events="none"/>
    <path d="M 290 204.41 L 286.33 193.41 L 293.67 193.41 Z" fill="#fc9022" stroke="#fc9022" stroke-width="5" stroke-miterlimit="10" pointer-events="none"/>
    <ellipse id="b" cx="290" cy="140" rx="40" ry="40" fill="#fc9022" stroke="none" pointer-events="none"/>
    <g transform="translate(279.5,130.5)">
        <switch>
          <foreignObject style="overflow:visible;" pointer-events="all" width="20" height="19" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility">
              <div xmlns="http://www.w3.org/1999/xhtml" style="display: inline-block; font-size: 18px; font-family: Verdana; color: rgb(255, 255, 255); line-height: 1.2; vertical-align: top; width: 20px; white-space: nowrap; word-wrap: normal; text-align: center;">
                <div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block;text-align:inherit;text-decoration:inherit;">/b</div>
              </div>
          </foreignObject>
          <text x="10" y="19" fill="#FFFFFF" text-anchor="middle" font-size="18px" font-family="Verdana">/b</text>
        </switch>
    </g>
    <path d="M 255.31 230.08 L 145.3 166.24" fill="none" stroke="#fc9022" stroke-width="3" stroke-miterlimit="10" pointer-events="none"/>
    <path d="M 137.52 161.72 L 146.81 163.65 L 143.8 168.84 Z" fill="#fc9022" stroke="#fc9022" stroke-width="3" stroke-miterlimit="10" pointer-events="none"/>
    <ellipse id="b-a" cx="290" cy="250" rx="40" ry="40" fill="#fc9022" stroke="none" pointer-events="none"/>
    <g transform="translate(270.5,240.5)">
        <switch>
          <foreignObject style="overflow:visible;" pointer-events="all" width="38" height="19" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility">
              <div xmlns="http://www.w3.org/1999/xhtml" style="display: inline-block; font-size: 18px; font-family: Verdana; color: rgb(255, 255, 255); line-height: 1.2; vertical-align: top; width: 40px; white-space: nowrap; word-wrap: normal; text-align: center;">
                <div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block;text-align:inherit;text-decoration:inherit;">/b/a</div>
              </div>
          </foreignObject>
          <text x="19" y="19" fill="#FFFFFF" text-anchor="middle" font-size="18px" font-family="Verdana">/b/a</text>
        </switch>
    </g>
  </g>
</svg>
<section>
  <h2>Activity:</h2>
  <ul id="activity-list">
  </ul>
</section>
</div>
<table>
  <tr>
    <td>
    </td>
    <td>
      <strong>/</strong>
    </td>
    <td>
      <strong>/a</strong>
    </td>
    <td>
      <strong>/a/:id</strong>
    </td>
    <td>
      <strong>/b</strong>
    </td>
    <td>
      <strong>/b/a</strong>
    </td>
  </tr>
  <tr id="root-row">
    <td>
      <strong>/</strong>
    </td>
    <td>
      0
    </td>
    <td>
      0.3
    </td>
    <td>
      0
    </td>
    <td>
      0.7
    </td>
    <td>
      0
    </td>
  </tr>
  <tr>
    <td>
      <strong>/a</strong>
    </td>
    <td>
      0
    </td>
    <td>
      0
    </td>
    <td>
      0.9
    </td>
    <td>
      0.1
    </td>
    <td>
      0
    </td>
  </tr>
  <tr>
    <td>
      <strong>/a/:id</strong>
    </td>
    <td>
      0
    </td>
    <td>
      1
    </td>
    <td>
      0
    </td>
    <td>
      0
    </td>
    <td>
      0
    </td>
  </tr>
  <tr id="b-row">
    <td>
      <strong>/b</strong>
    </td>
    <td>
      0
    </td>
    <td>
      0
    </td>
    <td>
      0
    </td>
    <td>
      0
    </td>
    <td>
      1
    </td>
  </tr>
  <tr id="b-a-row">
    <td>
      <strong>/b/a</strong>
    </td>
    <td>
      0
    </td>
    <td>
      1
    </td>
    <td>
      0
    </td>
    <td>
      0
    </td>
    <td>
      0
    </td>
  </tr>
</table>
<script src="/assets/js/mlx/prefetch.js"></script>

The module that we're going to take a look at next is `@mlx/parser`.

## `@mlx/parser`

This package is optional for both - `@mlx/webpack` and `@mlx/ga` but it's also quite convenient. The parser does two key things:

1. Finds the route declarations in our application. This allows us to aggregate the navigation graph that we get from Google Analytics and transform it into a page graph.
2. Finds the entry points of the routing bundles and their parent modules.

Although we can do this manually, it's still much more convenient to use `@mlx/parser` because your application's source code will always be the single source of truth.

The second point is crucial for the work of `@mlx/webpack` and `@mlx/cluster`. Once we provide a project type and a `tsconfig.json` file to `@mlx/parser`'s `parseRoutes` method, it'll automatically extract all the metadata and populate it into a JavaScript array of the form:

```js
[
  {
    path: '/main',
    modulePath: '/home/foo/Projects/ng-dd-bundled/src/app/main/main.module.ts',
    lazy: true,
    parentModulePath: '/home/foo/Projects/ng-dd-bundled/src/app/app.module.ts'
  },
  {
    path: '/main/parent',
    modulePath: '/home/foo/Projects/ng-dd-bundled/src/app/main/parent/parent.module.ts',
    lazy: true,
    parentModulePath: '/home/foo/Projects/ng-dd-bundled/src/app/main/main.module.ts'
  },
  {
    path: '/intro/parent/reward/:id',
    modulePath: '/home/foo/Projects/ng-dd-bundled/src/app/intro/intro-parent/intro-reward/intro-reward.module.ts',
    lazy: true,
    parentModulePath: '/home/foo/Projects/ng-dd-bundled/src/app/intro/intro-parent/intro-parent.module.ts'
  }
  // ...
]
```

This is stripped version of the array produced after parsing the [sample Angular project](https://github.com/mgechev/ng-dd-bundled)<sup>[9]</sup>. There are several important things to notice:

- The array contains the routes from our definitions. This means that the parameterized routes look the way we define them in the source code.
- Each array element has a `modulePath` property which points to the entry point of the JavaScript chunk which will be loaded when the user navigates to the given `path`.
- Each element also has a `parentModulePath`. This is the entry point of the chunk which contains the actual route definition. For non-lazy routes, the `modulePath` will have the same value as the `parentModulePath`.

You can find the Angular and the React parsers of `@mlx/parser` [here](https://github.com/mgechev/mlx/tree/master/packages/parser)<sup>[15]</sup>.

Both parsers perform static analysis. The Angular parser uses an abstraction on top of the Angular compiler - [ngast](https://github.com/mgechev/ngast)<sup>[16]</sup>. For now, the React parser relies on a lot of syntactical conventions. It's built on top of TypeScript.

## `@mlx/cluster`

The final package that we're going to cover is the clustering algorithm. As input, it accepts:

- `bundleGraph: Graph` - a weighted bundle page graph which is the result of the transformation of the weighed page graph.
- `modules: Module[]` - since the `bundleGraph` can represent only a partial part of the entire application (because of limited information from Google Analytics, for example), we need the entry points of the lazy-loaded chunks and their parents to be provided separately. This is the bundle page graph that we defined above.
- `n: number` - `n` is the minimum number of chunks that we want to get at the end of the clustering algorithm.

Once this information is available, the clustering algorithm will:

1. Try to find the connected components in the `bundleGraph`.
2. In case the connected components are more than the minimum, the algorithm will return them.
3. In case the connected components are less than the minimum, the algorithm will find the edge with the smallest weight, and subtract it from all other edges.
4. After that the algorithm will go back to step 1. and repeat the procedure until it finds a clustering of the graph satisfying `n`.

For finding the connected components in the graph, the current implementation uses [Tarjan's algorithm](https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm)<sup>[17]</sup>.

# Conclusion

In this blog post, we introduced the idea of data-driven chunk clustering and pre-fetching. We explained how we can apply it by consuming aggregated data from one of the most popular services for web application analysis - Google Analytics.

After that, we did a brief introduction to graph theory and the probability theory. As next step, we defined a common terminology for the variety of graphs used in the `@mlx` packages. Stepping on this solid foundation we explained the implementation of data-driven clustering and pre-fetching at `@mlx`.

As mentioned previously, the demonstrated packages are still in early stage of their development. The list of short-term goals include:

- More robust and generic parser for React router
- Improvement of the clustering heuristics (for example, do not combine chunks over given size threshold)
- Reduced chunk over fetching
- Estimation of proper probability thresholds for the different effective connection types

The future goals of the project include more personalized bundle pre-fetching and clustering. For example, different pre-fetching strategies depending on features of the users (geolocation, navigation history, etc). This will require the development of a more sophisticated machine learning model based on [hidden Markov chains](https://en.wikipedia.org/wiki/Hidden_Markov_model)<sup>[18]</sup>.

Regarding clustering of the chunks, it might not be practical to provide a personalized build of the application for each individual user. This will require a lot of computational resources and storage. On the other hand, performing clustering of the users (using [k-means](https://en.wikipedia.org/wiki/K-means_clustering)<sup>[19]</sup>, for example) based on their features and providing a personalized build to each group (or the highly valued groups) is realistic.

# References

1. Why marketers should care about mobile page speed - https://mgv.io/load-time-impact
2. How Page Load Time Affects Conversion Rates: 12 Case Studies - https://mgv.io/conversion-rates
3. The Cost Of JavaScript - https://mgv.io/cost-of-js
4. WebPageTest - https://mgv.io/webpagetest
5. Lighthouse - https://mgv.io/lighthouse
6. Lazy prefetching of AngularJS partials - https://mgv.io/angularjs-prefetching
7. Predictive Fetching - https://mgv.io/predictive-fetching
8. mlx - https://mgv.io/mlx
9. mlx Angular demo - https://mgv.io/ng-mlx
10. mlx React demo - https://mgv.io/react-mlx
11. mlx Google Analytics demo - https://mgv.io/ga-mlx
12. Using the Google Analytics Core Reporting API from Node.js - https://mgv.io/ga-api
13. Preload, Prefetch And Priorities in Chrome - https://mgv.io/prefetch-preload
14. Markov Chains - https://mgv.io/markov
15. mlx parser - https://mgv.io/parser-mlx
16. ngast - https://mgv.io/ngast
17. Tarjan's strongly connected components algorithm - https://mgv.io/tarjan
18. Hidden Markov Chains - https://mgv.io/hidden-markov
19. k-means clustering - https://mgv.io/k-means
