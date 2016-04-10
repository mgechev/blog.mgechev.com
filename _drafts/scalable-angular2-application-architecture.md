---
title: Scalable Single-Page Application Architecture
author: minko_gechev
layout: post
categories:
  - JavaScript
  - Angular 2
  - TypeScript
  - Architecture
tags:
  - JavaScript
  - Angular 2
  - TypeScript
  - redux
  - flux
  - dependency injection
---

A couple of months ago I started working on a single-page  application with some interesting business requirements. As in most modern applications we have a fat client which encapsulates decent amount of business logic and state.

## Requirements

The application is the core product of a startup I am working on and has quite dynamic requirements because of the early stage of its development and the competitive business environment.

### Scalable Communication Layer

We have relatively stable domain, however, there are could be several external actors which may mutate the state of the application. We have the usual:

- User of the application.
- RESTful API.

On top of that we may (or may not) have the following:

- Other parties who have established p2p connection with the current user.
- Real-time communication with another application service.

Given the multiple communication protocols (HTTP, WebSocket, UDP via WebRTC) we need different package formats:

- JSON-based for HTTP and/or WebSocket
- [JSON-RPC](http://jsonrpc.org) for WebSocket
- [BERT or BERT-RTC](http://bert-rpc.org/) for WebRTC and/or WebSocket

The BERT protocol is essential for efficient p2p communication, especially when transferring binary data, such as images or any other which textual representation is generally redundant and inefficient.

Given all these services that we need to communicate with, RxJS seems like a perfect fit for organization of all the asynchronous events that our application needs to handle. We can multiplex several data streams over the same communication channel using hot-observers and declaratively filter, transform, process them.

### Predictable State Management

In the above scenario there are multiple sources of mutation. The user is the most obvious one, the push notifications that we will get from the real-time services is another and the other peers we communicate with using WebRTC are a third source. Having a predictable state management is quite essential.

There are many patterns which help us achieve predictable state management. Currently the most popular one is [redux](http://redux.js.org/). Although some may argue that empowering purely functional language will make us reduce the side effects inside of our applications even further and enforce the predictable state management even further **our team will need to scale**.

I am a big fan of the functional paradigm myself, however, with the current demand of software engineers on the market it is hard to find suitable specialists. we'd be limiting the circle even further if I set as requirements "experience in Elm and ClojureScript", for instance.

For us, the golden mean between purity and scalable team is redux with TypeScript. Redux helps us with the predictable state management and TypeScript helps us with type checking and easier refactoring.

Talking about team...

### Modular Design

As mentioned, the team will scale. The level of experience of team members will differ. This means that multiple people with different level of expertise need to work together on the same project. In the perfect scenario, the most junior team members could be completely unfamiliar with the functional paradigm and only use some high-level abstractions which makes them feel they are using an imperative style of programming.

The layered diagram below shows the core modules of the architecture we stopped on:

![](/images/scalable-app/layers.png)

The top layer includes the UI components that the user is going to directly interact with, for instance, dialogs, forms, etc.

The facade below the UI components' layer represents "a set of objects that provide a simplified interface to a larger body of code". Basically, the main purpose of this layer is to provide a set of classes that allow us to trigger application specific actions that will augment the reducers' calls. The reducers and the state correspond to the standard concepts we are familiar with from redux.

From now on, for simplicity lets call our facades **models**. For instance, if we have are developing a game, inside of our `GameComponent` we will use the `GameModel` which abstracts the store mutation, as well as the async services.

Another core role of the facades is to invoke the **Async Services** with these application specific actions. Once given action is being triggered, it will be passed to an async service and it will handle it if it provides such functionality. Why they are called async services instead of remote services for instance? Under the hood of the async services are all the APIs with asynchronous interface, including WebRTC, WebSocket, as well as, IndexDB.

Notice that given facade should not be coupled to any specific communication channel, neither an async service. This means that the facade should invoke specific set of async services depending on the context it is used in.

#### Context Dependent Implementations

The context of the facades in our application is going to be determined by the components they are used into. For instance, lets suppose we are developing a game which allows multi-player and single-player modes. In case of single-player we want to send some metadata to the game server, in case of multi-player we want to send metadata between players as well as to the server.

This means that inside of the `SinglePlayerComponent` we want our `GameModel` to have access to the `GameServer` async service; inside of `MultiPlayerComponent` the `GameModel` should use `GameServer` as well as `P2PGameService`.

Having such context dependent dependency instantiation is a perfect candidate for using **Dependency Injection**.

### Lazy-loading

The application can grow a lot. It may become more than 50k lines of JavaScript, which means that lazy-loading of the individual [bounded contexts](http://martinfowler.com/bliki/BoundedContext.html) is essential.

If we think in terms of the game we mentioned earlier, we want to have the following directory structure:

```
.
└── src
    ├── multi-player
    │   ├── commands
    │   ├── components
    │   └── gateways
    ├── single-player
    │   └── components
    ├── home
    │   └── components
    └── shared
```

Once the user opens the home screen we want to load the entire `home` directory, together with the `shared` directory. If right after that the user navigates to the single-player page we want to download only the content of the `single-player` directory, etc.

## Technology Stack

After we gathered the requirements and thought about several scenarios of the variation of the initial idea of the application we considered different technologies. Our prime candidates were React and Angular 2. We have previous successful experience with React and a redux-like architecture. Everything there went perfectly but we struggled with lazy-loading and context dependent dependency instantiation. The [react-router](https://github.com/reactjs/react-router) supports lazy-loading, however, we still miss the lack of dependency injection and WebWorkers support.

Our final tech stack is as follow:

- [Angular 2](https://github.com/angular/angular)
- [RxJS](https://github.com/Reactive-Extensions/RxJS/)
- [ngrx](https://github.com/ngrx)

Now lets explore the architecture in the context of Angular 2. As sample application I've posted [scalable-architecture-demo](https://github.com/mgechev/scalable-architecture-demo) where you can see a basic implementation of the architecture from this blog post.

- Modular design, enforcing lazy-loading
- Isolated application state
- Predictable state management
- Testability
- Open-closed
- Scalalble-communication layer
