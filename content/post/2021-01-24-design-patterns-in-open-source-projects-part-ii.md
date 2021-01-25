---
author: minko_gechev
categories:
- Design patterns
- Open-source
- Software engineering
date: 2021-01-24T00:00:00Z
draft: false
tags:
- Design patterns
- Open-source
- Software engineering
title: Design Patterns in Open Source Projects - Part II
og_image: /images/oss-design-patterns-i/hero.png
url: /2021/01/24/design-pattens-in-open-source-projects-part-ii
---

This blog post introduces another design pattern into the context of [ngrev](https://github.com/mgechev/ngrev). If you're not yet familiar with the project, I'd strongly recommend reading the introduction and "Project Overview" sections in the [first part](https://blog.mgechev.com/2021/01/18/design-pattens-in-open-source-projects-part-i/) of the series.

If you did not take the time, [ngrev](https://github.com/mgechev/ngrev) is an Electron app that visualizes the structure of an [Angular](https://angular.io) app, showing the relationships between components, modules, and providers. The UI retrieves the data for each view using an instance of a [state](https://en.wikipedia.org/wiki/State_pattern) object. You can read more about the state pattern and its application in [ngrev](https://github.com/mgechev/ngrev) [here](https://blog.mgechev.com/2021/01/18/design-pattens-in-open-source-projects-part-i/).

[ngrev](https://github.com/mgechev/ngrev) is an Angular app developed with TypeScript. At the same time, however, **the post is conceptual, so even if you're not familiar with Angular, TypeScript, or Web development, you should be able to extract value.**

## Composite Pattern

>In software engineering, the composite pattern is a structural design pattern. The composite pattern describes a group of objects treated the same way as a single instance of the same type of object. A composite intends to "compose" objects into tree structures to represent part-whole hierarchies. Implementing the composite pattern lets clients treat individual objects and compositions uniformly.

<img src="/images/oss-design-patterns-ii/composite.svg" style="display: block; margin: auto;">

The composite pattern is arguably one of the most popular design patterns. You find its applications all over software engineering and computer science. For example, in file systems the leaves are the individual files and the composites are directories because they can contain other directories and files. In compiler design we can find the leaves being terminals and the composites being non-terminal [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) nodes.

In the case of [ngrev](https://github.com/mgechev/ngrev), both the composites and the leaves are instances of the state classes. The way we use the composite pattern here is attractive in at least two ways - the fact that we're using the pattern itself and the mechanism it interacts with the [state design pattern](https://en.wikipedia.org/wiki/State_pattern).

To understand why the composite design pattern helps us in [ngrev](https://github.com/mgechev/ngrev), let us look at two of the views in the application:

<div style="text-align: center; font-size: 0.9em; font-weight: bold;">Module Dependencies</div>
<img src="/images/oss-design-patterns-ii/module-dependencies.png" style="display: block; margin: auto;">

Each `NgModule` in Angular can depend on 0 or more other modules. This view shows the dependencies of the `AnnounceBarModule`. [ngrev](https://github.com/mgechev/ngrev) implements this functionality with the `ModuleTreeState` class.

<div style="text-align: center; font-size: 0.9em; font-weight: bold;">Module Declarations</div>
<img src="/images/oss-design-patterns-ii/module-declarations.png" style="display: block; margin: auto;">

Additionally, each module could have many declarations; for example, the `SharedModule` from the second image declares and exports `SearchResultComponent` and `SelectComponent`. In [ngrev](https://github.com/mgechev/ngrev), we implement this functionality with the `ModuleState` class.

Now let us look at the default view of [ngrev](https://github.com/mgechev/ngrev):

<div style="text-align: center; font-size: 0.9em; font-weight: bold;">App</div>
<img src="/images/oss-design-patterns-ii/app.png" style="display: block; margin: auto;">

This view shows a visualization of the dependencies between all the modules in our app and the declarations/exports for each one of them. Internally, [ngrev](https://github.com/mgechev/ngrev) implements it with the `AppState` class.

Even for a small apps like [angular.io](https://angular.io) this could get quite messy; that's why we have the more specific views from above. But also notice that there's an overlap between the 3 visualizations - the application view is a composition of the views showing module dependencies and module declarations.

What do I mean by composition? If we suppose that `ModuleState` and `ModuleTreeState` return sets of nodes and edges, their union will be a subset of the nodes and edges `AppState` returns.

Having noticed this relation, we can express it with code in the following way:

```javascript
export class AppState extends State {
  private states = [
    ...this.createModuleStates(),
    ...this.createModuleTreeStates()
  ];

  //...

  getData(): VisualizationConfig<any> {
    const data: VisualizationConfig<any> = {
      graph: {
        nodes: new Set(),
        edges: new Set()
      }
    };
    this.states.forEach((state: State) => {
      const { graph } = state.getData();
      graph.nodes.forEach((node: Node<any>) => data.graph.nodes.add(node));
      graph.edges.forEach((edge: Edge) => data.graph.edges.add(edge));
    });
    return data;
  }
}
```

In the snippet above, we first create the collection of states. `createModuleStates` and `createModuleTreeStates` instantiate state objects for each of the application modules. I haven't showed their implementation for simplicity.

After that, when the UI process requests the data for visualizing the application view, the background process will indirectly invoke `appState.getData()`. The method will invoke `getData` for each of the nested states in `states` and add the corresponding nodes and edges to the result sets.

That's it! This is entirely how the composite pattern implementation in [ngrev](https://github.com/mgechev/ngrev) works.

## Use Cases

The [gang of four book](https://en.wikipedia.org/wiki/Design_Patterns) explains [MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) as the interaction between the patterns [Strategy](https://en.wikipedia.org/wiki/Strategy_pattern), [Observer](https://en.wikipedia.org/wiki/Observer_pattern), and [Composite](https://en.wikipedia.org/wiki/Composite_pattern). MVC uses composite for the user interface.

Applications developed with modern Web frameworks and libraries such as Angular and React are expressed as compositions of components. In Angular, you could often think of directives and components with bare HTML nodes as "leaf" classes and components using directives or other components as "composite" classes.

The composite design pattern is also heavily used in compilers - especially during interpretation and source code generation. Each AST node is either a terminal (leaf) or a non-terminal (composite).

I'm spending most of my days thinking about developer tooling and frameworks, so that's why my examples probably look a bit niche. If you've recently used the composite design pattern in other contexts, please leave a comment below.

## What's Next?

It's great you decided to read this article, but this is just part of the story. To get a better idea of how the composite pattern works, I'd encourage you to read the [source code](https://github.com/mgechev/ngrev/blob/master/src/electron/states/app.state.ts) implementing it.

I hope you enjoyed this article! Until next time and happy coding!
