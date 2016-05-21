---
title: Dynamically Configuring the Angular's Router
author: minko_gechev
layout: post
categories:
  - JavaScript
  - Angular 2
  - Router
tags:
  - JavaScript
  - Angular 2
  - Router
---

For the last a couple of months I'm working on an Angular 2 based [PWA](https://developers.google.com/web/progressive-web-apps/). The more complex the application gets, the more I appreciate that our choice was Angular! For routing we're using the initial Angular 2 router that is now deprecated. For sure we will migrate to the newest one once it gets stable but until then we have some problems to solve.

One of the features that I miss most in both the new and the newest Angular 2 routes is the `resolve` functionality which the AngularJS 1.x router and the ui-router offer. In short, this functionality allows your application to load data on navigation event and render the routing component once the data has been successfully downloaded.

With the `router-deprecated` module we can get similar behavior by using `@CanActivate` decorator, unfortunately we cannot take advantage of the dependency injection mechanism without [any dirty hacks](https://stackoverflow.com/questions/33462532/using-resolve-in-angular2-routes).

In this article I'll explain what solution we use until the `resolve` functionality is supported.

<div class="warning-box">
  <strong>Disclaimer</strong>: This article is mostly for learning purposes. It uses already deprecated Angular 2 module and offers a custom solution.
</div>

## API Design

With the deprecated router our routes configuration looks like:

```typescript
@Component(...)
@RouteConfig([
  {
    path: '/',
    name: 'Home',
    component: HomeComponent
  },
  {
    path: '/about/:name',
    name: 'About',
    component: AboutComponent
  }
])
export class AppComponent {}
```

Our purpose is to be able to perform an asynchronous action on which given routing component depends, before the component gets rendered. For instance, we may want to load the profile of the user associated to the `:name` parameter in the `About` route, before the `AboutComponent` gets rendered.

Which means that we need to change the `RouteDefinition` to something like:

```typescript
@Component(...)
@RoslighlyuteConfig([
  {
    path: '/',
    name: 'Home',
    component: HomeComponent
  },
  {
    path: '/about/:name',
    name: 'About',
    component: AboutComponent,
    defer: () => {
      return User.loadUsers();
    }
  }
])
export class AppComponent {}
```
Once the user navigates to `/about/:monika` for instance, we will load all the users by using the `loadUsers` static method of the `User` service. This solution isn't much better than using `@CanActivate` because we're not taking advantage of the Angular 2's DI mechanism.

A better API will be:

```typescript
@Component(...)
@RouteConfig([
  {
    path: '/',
    name: 'Home',
    component: HomeComponent
  },
  {
    path: '/about/:name',
    name: 'About',
    component: AboutComponent,
    defer: {
      resolve: (model: User, params: RouteParams) => {
        return model.loadUser(params.get('name'));
      },
      deps: [User, RouteParams]
    }
  }
])
export class AppComponent {}
```route_config_normalizer.ts
Although the route definition above looks a bit more complex at first, it provides great flexibility! First, we have access to all the registered in our `Injector` dependencies, second, we have access to all the local dependencies associated with our route (`RouteParams`).

Once the user navigates to `/about/:monika`, the `resolve` method of the `defer` object will be invoked, but before that, all the dependencies passed to the `deps` array will be resolved in order to be passed to `resolve`. Based on the passed dependencies, the `resolve` method will call the `model`'s `loadUser` method with `monika` as argument. Once the promise returned by the `loadUser` method gets resolved, we the component `AboutComponent` will be rendered.

Why promise, why not observable instead? Observables will give us much greater flexibility (in case the `loadUser` method fails we can retry or we can just stop the request, etc, good discussion on this topic can be found [here](https://github.com/angular/angular/issues/5876)) but provide more complex API.

## Implementation

### Step 1

As first step I forked the `router-deprecated` module [located here](https://github.com/angular/angular/tree/master/modules/%40angular/router-deprecated) and removed all `*.dart` files.

Since we want to provide slightly different APIs for routes definition we need to modify the `route_definition.ts` file:

```typescript
export interface RouteDefinition {
  // All the properties we're familiar with...
  defer?: Defer;
}


/**
 * An object which needs to be resolved until we are able to render the route component.
 *
 * @example
 * const baz: Defer = { resolve: () => Promise.resolve(), deps: [] };
 */
export interface Defer {
  resolve: (...deps: any[]) => Promise<any>;
  deps?: any[];
}
```

The only new property we added here is called `defer`, and it is optional. The type of the `defer` property is the `Defer` interface, which means that we need to define a `resolve` function, which is supposed to return an instance of type `Promise`, and an optional `deps` property. It contains a list of dependencies that need to be passed to the `resolve` function.

Does this look familiar to factory provide definition?

```typescript

new Provider(String, { useFactory: (value) => { return "Value: " + value; },
                    deps: [Number] })
```


Hell yeah! We are going to use provider like this once we reach the point when we need to invoke the `resolve` function. The benefits we get here:

- We are able to inject dependencies associated to any token.
- After minification everything is going to work since we're passing tokens which are either direct references to the dependencies instances of which we want to invoke, or references to any other tokens which will not be influenced by minification.

### Step 2

Notice that in the `RouteDefinition` the `deps` property is optional. This means that our router can break in case the user doesn't provide it. That is why we need to normalize the route definition, in the `route_config_normalizer.ts`. This file provides a method called `normalizeRouteConfig` which accepts a `RouteDefinition` object and normalizes it depending on the properties it has. What we'd do here is:

```typescript
export function normalizeRouteConfig(config: RouteDefinition,
                                     registry: RouteRegistry): RouteDefinition {
  if (!config.defer) {
    config.defer = {
      resolve: () => Promise.resolve(),
      deps: []
    };
  } else if (!config.defer.deps) {
    config.defer.deps = [];
  }
  // ...
}
```
The `normalizeRouteConfig` method is also responsible for creating different route definition objects such as `AsyncRoute`s and `Route`s. In order to not loose the `defer` property from our `RouteDefinition` we need to pass it to the constructors of any `RouteDefinition` class:

```typescript
...
if (componentDefinitionObject.type == 'constructor') {
  return new Route({
    path: config.path,
    component:<Type>componentDefinitionObject.constructor,
    name: config.name,
    data: config.data,
    useAsDefault: config.useAsDefault,
    defer: config.defer
  });
} else if (componentDefinitionObject.type == 'loader') {
  return new AsyncRoute({
    path: config.path,
    loader: componentDefinitionObject.loader,
    name: config.name,
    data: config.data,
    useAsDefault: config.useAsDefault,
    defer: config.defer
  });
} else {
  throw new BaseException(
      `Invalid component type "${componentDefinitionObject.type}". Valid types are "constructor" and "loader".`);
}
...
```
Everything so far works fine, except that the `Route` and `AsyncRoute`'s constructors need to handle this `defer` property somehow.

### Step 3

There's an abstract class called `AbstractRoute` which defines the base functionality for all the different route types. In order to make this class keep a reference to the `defer` property we need to:

```typescript
export abstract class AbstractRoute implements RouteDefinition {
  name: string;
  useAsDefault: boolean;
  path: string;
  regex: string;
  serializer: RegexSerializer;
  data: {[key: string]: any};
  defer: Defer;

  constructor({name, useAsDefault, path, regex, serializer, data, defer}: RouteDefinition) {
    this.name = name;
    this.useAsDefault = useAsDefault;
    this.path = path;
    this.regex = regex;
    this.serializer = serializer;
    this.data = data;
    // It went through the normalizer
    this.defer = defer;
  }
}
```

The only three differences from the original implementation here are:

- We have one more property of the class called `defer`.
- In the destructuring in the `constructor` we get one more property from the passed object called `defer`.
- We assign the passed `defer` variable to the `defer` property.

The rest of the changes we need to make are in the `Route` and `AsyncRoute` classes, were we need to pass the `defer` property to the base constructor call.

### Step 4

Before being able to continue our implementation we need to take a look at how the router actually works:

![](/images/ng2-routing.png)

- First the user declares her routing configuration in the `@RouteConfig` decorator.
- After that the input goes through normalization (we already passed this stage).
- As next step the routing objects get translated to routing rules.
- On navigation the router creates different navigation instructions.
- In the end the `router-outlet` renders the target component by using a specific sequence of instructions.

This means that we're almost on the final line! Now lets modify the way we create routing rules in order to include our `defer` parameter.

First add a `_defer` property to the `RouteRule` class like this:


```typescript
export class RouteRule implements AbstractRule {
  // ...
  constructor(private _routePath: RoutePath, public handler: RouteHandler,
              private _routeName: string, private _defer: Defer) {
    this.specificity = this._routePath.specificity;
    this.hash = this._routePath.hash;
    this.terminal = this._routePath.terminal;
  }
  // ...
}
```

And now, in the `rule_set.ts` include the route's `defer` property in the `RouteRule` creation process:


```typescript
// ...
let newRule = new RouteRule(routePath, handler, config.name, config.defer);
// ...
```

### Step 5

The final, and the most interesting step is this one! In order to render the routing component once the associated data to it is resolved, we need to edit the `router-outlet` directive. Open the file `router_outlet.ts` and take a look at the `activate` method:


```typescript
// ...
activate(nextInstruction: ComponentInstruction): Promise<any> {
  var previousInstruction = this._currentInstruction;
  this._currentInstruction = nextInstruction;
  var componentType = nextInstruction.componentType;
  var childRouter = this._parentRouter.childRouter(componentType);

  var providers = ReflectiveInjector.resolve([
    provide(RouteData, {useValue: nextInstruction.routeData}),
    provide(RouteParams, {useValue: new RouteParams(nextInstruction.params)}),
    provide(routerMod.Router, {useValue: childRouter})
  ]);
  this._componentRef =
      this._loader.loadNextToLocation(componentType, this._viewContainerRef, providers);
  return this._componentRef.then((componentRef) => {
    this.activateEvents.emit(componentRef.instance);
    if (hasLifecycleHook(hookMod.routerOnActivate, componentType)) {
      return this._componentRef.then(
          (ref: ComponentRef<any>) =>
              (<OnActivate>ref.instance).routerOnActivate(nextInstruction, previousInstruction));
    } else {
      return componentRef;
    }
  });
}
// ...
```

The `activate` method accepts an instruction and renders the component associated with it once it gets available.

Notice that inside of the method is created a custom set of `providers` which include the `RouteData` associated to the given route, as well as `RouteParams` and the `Router`. After that the `activate` method loads the target component next to the `router-outlet` directive by taking all the defined above providers plus all the providers which reside in the `_viewContainerRef` (for a reference take a look [here](https://github.com/angular/angular/blob/bb8976608db93b9ff90a71187608a4390cbd7a07/modules/%40angular/core/src/linker/dynamic_component_loader.ts#L137-L139)). At this point in the `nextInstruction` we already have the `defer` property the user declared:

```typescript
const defer = nextInstruction.defer;
```

Now, in order to invoke the `resolve` method of the `defer` object in the context of the injector which includes providers for `RouteData` and `RouteParams` we can:

```typescript
var DEFER_INIT_TOKEN = new OpaqueToken('DeferInitToken');
var commonProviders = [
  provide(RouteData, {useValue: nextInstruction.routeData}),
  provide(RouteParams, {useValue: new RouteParams(nextInstruction.params)}),
  provide(routerMod.Router, {useValue: childRouter})
];
var providers = ReflectiveInjector.resolve(commonProviders.concat(
  provide(DEFER_INIT_TOKEN, {
    useFactory: function () {
      return defer.resolve.apply(null, arguments);
    }, deps: defer.deps
  })
));
var parentInjector = this._viewContainerRef.parentInjector;
var injector = ReflectiveInjector.fromResolvedProviders(providers, parentInjector);
```

This way we create an injector which has all providers from the `_viewContainerRef`, as well as all the local ones. In order to instantiate the provider associated to the `DEFER_INIT_TOKEN` we can:

```typescript
injector.get(DEFER_INIT_TOKEN);
```
...which will return a promise. Once the promise is invoked we are supposed to activate the component so in the end we'll have:

```typescript
// ...
return injector.get(DEFER_INIT_TOKEN).then((data) => {
  var deferResolvedProviders = ReflectiveInjector.resolve(commonProviders.concat(
    provide(DEFER, { useValue: data })
  ));
  this._componentRef =
      this._loader.loadNextToLocation(componentType, this._viewContainerRef, deferResolvedProviders);
  return this._componentRef.then((componentRef) => {
    this.activateEvents.emit(componentRef.instance);
    if (hasLifecycleHook(hookMod.routerOnActivate, componentType)) {
      return this._componentRef.then(
          (ref: ComponentRef<any>) =>
              (<OnActivate>ref.instance).routerOnActivate(nextInstruction, previousInstruction));
    } else {
      return componentRef;
    }
  });
}, (e) => {
  throw e;
});
```

If the promise gets rejected we throw the error from it. An important thing to notice is that we invoke the `loadNextToLocation` method with different set of providers. This time we don't include our `DEFER_INIT_TOKEN` because it is useless at this point - we don't want the users of our router to be able to inject the promise in the constructors of their components, but only the data that it was resolved with.

We associate the data to the token `DEFER`, which means that the data can be injected with:

```typescript
class AboutComponent {
  constructor(@Inject(DEFER) data: any) {
    // ...
  }
}
```

Here's demo of final result of our implementation:

![](/images/router-demo.gif)

## Conclusion


