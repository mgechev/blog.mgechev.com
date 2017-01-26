---
title: React loves Angular's Dependency Injection
author: minko_gechev
layout: post
categories:
  - Angular
  - TypeScript
  - React
tags:
  - Angular
  - React
  - TypeScript
---

Recently I've been blogging mostly about Angular and it's not by accident! Angular is an amazing framework, bringing a lot of innovation to the front-end technologies, with a great community behind it. In the same time, the projects that I'm working on have various of different requirements and sometimes I need to consider different options.

Another great framework that I've used in the past is React. I don't want to compare both technologies and I'm sure there are variety of cases when one of them fits better compared to the other and visa versa. I respect the philosophy of both Angular and React, and I love seeing how they move Web forward!

This blog post is related to a fun experiment I did recently - **use Angular's dependency injection mechanism with React**.

## Disclaimer

With the following post I'm not intending to imply that using Angular's DI in React is either a good or a bad idea, it completely depends on the style of programming you are used to and you like. The example here is not something I use in production, and I would not recommend you to do so because it is not well tested and directly modifies React's internals.

Finally, I'm not implying that the Angular's dependency injection is the only way we can write well designed code, or even that we need the object-oriented paradigm for that. We can write high-quality code in any paradigm and any framework, if we put enough effort in the design process.

This is based on a small experiment I did during my [rainy Saturday evening](https://www.wunderground.com/history/airport/KSFO/2017/1/21/DailyHistory.html?req_city=San+Francisco&req_state=CA&req_statename=California&reqdb.zip=94102&reqdb.magic=1&reqdb.wmo=99999). The post is with **learning purpose only**. It can help you understand how the dependency injection mechanism of Angular works, end eventually, give you some insight into the React's internals.

# Introduction to dependency injection

If you're already familiar with what dependency injection is and how it can be used, you can directly skip to <a href="#di-in-react">"Using Angular's DI in React"</a>

Dependency injection (DI) is a powerful tool which brings a [lot of benefits](https://softwareengineering.stackexchange.com/questions/19203/what-are-the-benefits-of-using-dependency-injection-and-ioc-containers). For instance, DI helps with following the [Single Responsibility Principle (SRP)](https://en.wikipedia.org/wiki/Single_responsibility_principle), by not coupling given entity with the instantiation of its dependencies. [Open/Closed Principle](https://en.wikipedia.org/wiki/Open/closed_principle) is another place where DI rocks! We can make given class depend on an abstract interface and by configuring its injector pass different implementations. This helps us to keep our code close to changes. This looks quite similar to the dependency inversion principle which states that:

> A. High-level modules should not depend on low-level modules. Both should depend on abstractions.<br>
> B. Abstractions should not depend on details. Details should depend on abstractions.

Although DI does not directly enforces it, it can predispose us to write code which follows the principle.

A few days ago I published a library called [`injection-js`](https://github.com/mgechev/injection-js). It is nothing more that just an extraction of the Angular's dependency injection mechanism. Thanks to the fact that [`injection-js`](https://github.com/mgechev/injection-js) comes from the Angular's source code, it's well tested and mature, so you can give it a try! Thanks to the Angular's MIT license, this extraction isn't a problem.

## Using dependency injection

Now, lets see how we can use dependency injection! But before that, lets get familiar with the main concepts. In the root of the dependency injection mechanism of [`injection-js`](https://github.com/mgechev/injection-js) (and respectively Angular) is the **injector**. It is responsible for holding different recipes for instantiation of the individual dependencies. These recipes are called **providers**. To each provider we have an associated **token**. We can think of the tokens as identifiers of the individual providers. We use the tokens when we ask the injector for an instance of given dependency.

Here's an example:

```ts
import { ReflectiveInjector, Injectable } from 'injection-js';

class Http {}

@Injectable()
class UserService {
  constructor(private http: Http) {}
}

const injector = ReflectiveInjector.resolveAndCreate([
  { provide: Http, useClass: Http },
  { provide: UserService, useClass: UserService },
]);

injector.get(UserService);
```

The following examples use [`injection-js`](https://github.com/mgechev/injection-js). Above we import `ReflectiveInjector` and `Injectable`. `ReflectiveInjector` has a factory method called `resolveAndCreate` which allows us to create an injector by passing a set of providers. In this case we pass providers for `Http` and `UserService`.

We provide a token for the injector, by setting the value of the `provide` property. The recipe for the instantiation of any of the classes, in this specific set of providers, is it's constructor. This means that, if we want to get an instance of `Http` the injector will invoke `new Http()`. If we want to instantiate the `UserService`, the injector will peek at its arguments and instantiate `Http` first. After that it can invoke the constructor of `UserService` with the already existing instance of `Http`.

Finally, the decorator `Injectable` doesn't do anything. It just forces TypeScript to generate some metadata regarding the types of the dependencies that `UserService` accepts.

Since the syntax above looks a bit redundant, we can use the following definition of the providers instead:

```ts
const injector = ReflectiveInjector.resolveAndCreate([
  Http, UserService
]);
```

In some cases, we don't own a direct reference to the constructor of the dependency we want to have a provider for. For instance, if we want to inject a constant we need to provide as a token something else. For such cases, we can use any other value (remember - the token is nothing more than an identifier):


```ts
const BUFFER_SIZE = 'buffer-size';

const injector = ReflectiveInjector.resolveAndCreate([
  Socket,
  { provide: BUFFER_SIZE, useValue: 42 }
]);
```

In the example above, we provide a recipe for getting the `BUFFER_SIZE` token. We say that once we require the token `BUFFER_SIZE` we want the injector to return the value `42`:

```ts
injector.get(BUFFER_SIZE); // 42
```

We can require such dependencies by using the `Inject` parameter decorator of Angular/[`injection-js`](https://github.com/mgechev/injection-js):

```ts
const BUFFER_SIZE = 'buffer-size';

class Socket {
  constructor(@Inject(BUFFER_SIZE) public size: number) {}
}

const injector = ReflectiveInjector.resolveAndCreate([
  Socket,
  { provide: BUFFER_SIZE, useValue: 42 }
]);

injector.get(Socket).size; // 42
```

## Hierarchy of injectors

A big improvement in the dependency injection mechanism of Angular 2 and above, is that we can build a hierarchical structure of injectors. For instance, lets take a look at the image below:

<img src="/images/react-di/injectors-hierarchy.png" alt="Dependency Injection Hierarchy" style="display: block; margin: auto;">

We have a root injector called `House`, which is parent of the injectors `Bathroom`, `Kitchen` and `Garage`. `Garage` is parent of `Car` and `Storage`. If we require the dependency with token `tire`, for instance from the injector `Storage`, `Storage` will try to find it in its list of registered providers. If it doesn't find it there, it'll look into `Garage`. If it is not there, `Garage` will look in `House`. In case `House` finds the dependency it will return it to `Garage` which will give it to `Storage`.

Does the tree above look familiar? Well, recently most frameworks for building user interface structure it as **tree of components**. This means that we can have a tree of injectors which are responsible for the instantiation of the individual components and their dependencies. Such injectors Angular calls **element injectors**.

## Element injectors

Lets take a brief look how this looks like in Angular. Suppose we have a game which has two modes:

- Single-player mode.
- Multi-player mode.

When the user plays the game in single-player, we want to send some metadata to our application server through Web Sockets. However, if our user plays against another player, we want to establish a WebRTC data channel between them. Of course, it makes sense to send data to the application server as well. With Angular/[`injection-js`](https://github.com/mgechev/injection-js) we can handle this with [multi-providers](https://blog.thoughtram.io/angular2/2015/11/23/multi-providers-in-angular-2.html), but for the sake of simplicity lets suppose we want only p2p connection in case of multi-player.

So, we have our `DataChannel`, which is an abstract class with a single method and an observable:

```ts
abstract class DataChannel {
  dataStream: Observable<string>;
  abstract send(data: string);
}
```

Later this abstract class could be implemented by `WebRTCDataChannel` and `WebSocketDataChannel`. Respectively, the `SinglePlayerGameComponent` can use the `WebSocketDataChannel` and `MultiPlayerGameComponent` can use the `WebRTCDataChannel`. But what about the `GameComponent`? `GameComponent` can depend only on `DataChannel`. This way, depending on the context we're using it in, the associated element injector can pass the correct implementation, configured by its parent component. We can take a look at how this looks in Angular, with the following snippet in pseudo code:

```ts
@Component({
  selector: 'game-cmp',
  template: '...'
})
class GameComponent {
  constructor(private channel: DataChannel) { ... }
  ...
}

@Component({
  selector: 'single-player',
  providers: [
    { provide: DataChannel, useClass: WebSocketDataChannel }
  ],
  template: '<game-cmp></game-cmp>'
})
class SinglePlayerGameComponent { ... }


@Component({
  selector: 'multi-player',
  providers: [
    { provide: DataChannel, useClass: WebRTCDataChannel }
  ],
  template: '<game-cmp></game-cmp>'
})
class MultiPlayerGameComponent { ... }
```

In the example above we have the declaration of the `GameComponent`, `SinglePlayerGameComponent` and `MultiPlayerGameComponent`. `GameComponent` has a single dependency of type `DataChannel`. Later in `SinglePlayerGameComponent` we associate the class `WebSocketDataChannel` to the token of the dependency that `GameComponent` accepts`.

What will happen behind the scene is shown on the image below:

<img src="/images/react-di/element-injectors.png" alt="Element Injectors" style="display: block; margin: auto;">

Both the element injectors of `SinglePlayerGameComponent` and `MultiPlayerGameComponent` will have as their parent injector some root injector, which is not interesting for our discussion. `SinglePlayerGameComponent` will register a provider which will associate the `DataChannel` token to the `WebSocketDataChannel` class. This provider, together with a provider for the `SinglePlayerGameComponent` component will be registered into the `single` injector from the diagram.
On the other hand, in the `multi` injector from the diagram we will have registration of a provider for the `MultiPlayerGameComponent` and a provider which associates `DataChannel` to `WebRTCDataChannel`.

Finally, we will have two `game` injectors. One in the context of the `SinglePlayerGameComponent` and one in the context of `MultiPlayerGameComponent`. When we require the `DataChannel` token from the `game` injector which as parent has the `single` injector, we'll get an instance of the `WebSocketDataChannel`. In case we require the `DataChannel` token from the `game` injector which as parent has the `multi` injector, we'll get `WebRTCDataChannel`.

That's it!

Now it's time to apply this knowledge into the context of React.

