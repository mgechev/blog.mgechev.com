---
author: minko_gechev
categories:
- Design patterns
- Open-source
- Software engineering
date: 2021-01-18T00:00:00Z
draft: false
tags:
- Design patterns
- Open-source
- Software engineering
title: Design Patterns in Open Source Projects - Part I
og_image: /images/oss-design-patterns-i/hero.png
url: /2021/01/18/design-pattens-in-open-source-projects-part-i
---

I see two common frustrations around design patterns:
1. It's easy to memorize patterns but hard to figure out where and how to use them
2. OOP is lame, and design patterns suck

If the second bullet point resonates with you, this blog post is probably not a good use of your time.

Now let's focus on the first point. It's not easy to understand design patterns just by reading the [gang of four book](https://www.amazon.com/Design-Patterns-Object-Oriented-Addison-Wesley-Professional-ebook/dp/B000SEIBB8) or dummy examples on Wikipedia. That's why I want to share a couple of real-world applications in open source projects that you can see and run yourself.

I plan to start the series with content for how [ngrev](https://github.com/mgechev/ngrev) uses State, Composite, and Memento. Today we're going to focus on the State pattern.

<img src="/images/oss-design-patterns-i/hero.png" style="display: block; margin: auto;">

## Project Overview

[ngrev](https://github.com/mgechev/ngrev) is an open-source application for reverse engineering of Angular apps. I developed it originally for my talk "[Mad Science with the Angular Compiler](https://www.youtube.com/watch?v=tBV4IQwPssU)" for ng-conf 2017, but kept maintaining it over the years. Later on, the Angular team released Ivy and introduced a brand new compiler, which broke the parsing infrastructure of ngrev. Recently, however, [François](https://github.com/GrandSchtroumpf) and [Viktor](https://github.com/vik-13) helped me to revive the project.

To get a better idea of the features of ngrev, I'd recommend you to have a look at this short video:

<div style="display: block; margin: auto; width: 640px; padding-bottom:56.25%"><iframe width="640" height="360" src="https://www.youtube.com/embed/vmdVRErKot4" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

### High-Level Architecture

ngrev is an Electron app, so it has its main process, referenced as User Interface (UI) on the diagram below, and Render Process. Additionally, the Render Process also starts a Background Process used for heavy computations to keep the Render Process responsive to the UI queries.

<img src="/images/oss-design-patterns-i/ngrev-architecture.svg" style="display: block; margin: auto;">

All the communication within the processes of the application is happening via IPC (Inter-Process Communication) via [message passing](https://en.wikipedia.org/wiki/Message_passing).

### Implementation Overview

Let us look at how the app works, to get a better idea of where the state pattern fits in the picture.

When you open ngrev, the UI sends a message to the Render Process to return the current theme. After that the UI applies it and allows the user to select a project. In the meantime, the Render Process creates the Background child Process and establishes a communication channel.

Once the user selects a project, the UI sends a message to the Render Process, which forwards it to the Background Process. The Background Process uses [ngast](https://github.com/ng-ast/ngast), a wrapper around the Angular compiler, to parse the specified application and return the project symbols to the Render Process. From there, the Render Process returns them to the UI, which shows them as a graph.

It gets interesting when folks navigate from one node to another - for example, when the user double clicks on a module to explore its declaration graph. Such action will trigger a message to the Render Process, which will talk to the stateful Background Process. The Background Process will use the Angular incremental compiler to parse the module's declaration graph and return it to the UI. Finally, the UI will transition to the new view.

Here comes the first design pattern we'll talk about - [the State pattern](https://en.wikipedia.org/wiki/State_pattern).

## The State Pattern

>The state pattern is a behavioral software design pattern that allows an object to alter its behavior when its internal state changes. This pattern is close to the concept of finite-state machines. The state pattern can be interpreted as a strategy pattern, which is able to switch a strategy through invocations of methods defined in the pattern's interface.

<img src="/images/oss-design-patterns-i/state.svg" style="display: block; margin: auto;">

The Background Process represents each view with an instance of a concrete implementation of the `State` class:

```js
export abstract class State {
  abstract getData(): VisualizationConfig<any>;
  abstract getMetadata(id: string): Metadata | null;
  abstract nextState(id: string): State | null;
  destroy(): void {}
}
```

The `State`'s interface allows you to:
- Get data for a particular view (`getData`). This method will return all the nodes and their relationships. The `VisualizationConfig` has a list of nodes and a list of edges, where each edge contains the nodes it connects and the direction of their relationship
- Get metadata for a particular symbol. For example, if the state object represents a template view, the `getMetadata` will return metadata for the specified node of the template (its attributes, associated directives, and references)
- Transition to a new state. That's the essence of the state pattern - it implements a [state machine](https://en.wikipedia.org/wiki/Finite-state_machine), so you can transition from one state to another. The method accepts a symbol ID. The ID could be the identifier of any component, directive, etc., which has a node associated with it in the current state object. After that, the `nextState` method will check the identifier's type and perform the state transition
- Finally, we can also destroy a state. Imagine the state object allocated memory or set event listeners. The destroy method allows us to perform a cleanup

### Using States

Let us now look at how ngrev uses states! On the UML class diagram above, the consumer of the state object is the `Context` class. In ngrev the context is the Background Process.

If we look into the Background Process' implementation we'll find where it responds to state transition messages:

```js
this.parentProcess.on(Message.DirectStateTransition, (data: DirectStateTransitionRequest, responder: Responder) => {
  const nextState: State | null = lastState.nextState(data.id);
  if (nextState) {
    this.states.push(nextState);
    responder({
      topic: Message.DirectStateTransition,
      available: true
    });
    return;
  }
  responder({
    topic: Message.DirectStateTransition,
    available: false
  });
});
```

This is a bit simplified implementation, but it should give us a good idea how to perform state transitions. First, we get the current state (`lastState`) and after that invoke its `nextState` method, passing the symbol we want to navigate to. As an example, `lastState` could be representing the module declarations view and the `data.id` could be an identifier of a component symbol. When we call `nextState` passing this identifier, we'll get a new `ComponentState` object.

Let us track the instantiation of the next state! For the purpose, let us explore the `nextState` implementation of the `TemplateState` class:

```js
nextState(nodeId: string): State | null {
  if (nodeId === this.symbolId) {
    return null;
  }
  const data = this.symbols[nodeId].data;
  if (!data) {
    return null;
  }
  if (data.symbol instanceof DirectiveSymbol || data.symbol instanceof ComponentSymbol) {
    return new DirectiveState(this.context, data.symbol);
  } else if (data.symbol instanceof InjectableSymbol) {
    return new ProviderState(this.context, data.symbol);
  } else if (data.symbol instanceof PipeSymbol) {
    return new PipeState(this.context, data.symbol);
  }
  return null;
}
```

We first check if we're trying to navigate to the same symbol or a non-existing one. If we hit any of these branches, we directly return `null` without performing a state transition.

If the user has selected a directive or a component we navigate to the `DirectiveState`. ngrev uses the `DirectiveState` class for both components and directives because they have a lot of shared logic. We do the same for providers and pipes respectively.

## Use Cases

Generally, when you notice a patterns in your app that remind you of a state machine, there might be a good use case for the state design pattern.

Over the years, I found the state pattern to be a very convenient way for managing stateful transitions. Often we have different data visualizations that share similar interfaces or shapes, and we can navigate from one such visualization to another. The state pattern is a clean way to manage this process.

It's important to not force using state if there's a more simple solution. Especially when first learning object-oriented design, developers often try to fit patterns everywhere. This mindset leads to over engineered solutions which don't scale well nor respond to changing business requirements.

## What's Next?

As the next step I'd recommend you to clone [ngrev](https://github.com/mgechev/ngrev) and try to make sense of everything we talked about.

Reading about code is an important part of the story, but practice is where you find how all ideas fit together.
