---
author: minko_gechev
categories:
- JavaScript
- Angular 2
- Router
date: 2015-12-30T00:00:00Z
tags:
- JavaScript
- Angular 2
- Router
title: Dynamically Configuring the Angular's Router
url: /2015/12/30/angular2-router-dynamic-route-config-definition-creation/
---

<div class="error-box">
  <strong>Warning</strong>: This version of the Angular 2 router is now deprecated! This means that soon the used below APIs will no longer be available.
</div>

A couple of months ago I wrote ["Lazy Loading of Route Components in Angular 2"](http://blog.mgechev.com/2015/09/30/lazy-loading-components-routes-services-router-angular-2/), where I explained how we can take advantage of the `AsyncRoute`s and the [virtual proxy pattern](https://en.wikipedia.org/wiki/Proxy_pattern) in Angular 2.

This way we can incrementally load the entire application by only requesting the resources required for the individual views. As result we will decrease the initial load time, which will dramatically improve the user's experience.

The code for this article is available at [my GitHub account](https://github.com/mgechev/dynamic-route-creator/blob/master/app/components/app/app.ts).

## Problem

This strategy works great! The only things that we need to provide to the `AsyncRoute` definition are `name`, `path` and a `loader`.

Inside of the `loader` function we can have whatever custom logic we want to. The only contract that we sign with the framework is that the `loader` needs to return a promise:

```typescript
@RouteConfig([
  { path: '/', component: Home, name: 'home' },
  new AsyncRoute({
    path: '/about',
    loader: () => System.import('./components/about/about').then(m => m.About),
    name: 'about'
  })
])
```

But what if we receive the routes definitions from a remote service and we don't have them during initialization time?

Well, in such case we need to solve the following three problems:

### Referencing not registered routes inside of a template

If we want to reference to a route which is not declared within `@RouteConfig` by using:

```html
<a [routeLink]="['/not-registered']">Not registered</a>
```

We will get a runtime error. This means that we need to implement a behavior in which we can list the available at given point of time routes.

### Updating the `@RouteConfig`'s metadata

This is required for consistency. Since the way we register routes in Angular 2 is by using `@RouteConfig`, we need to make sure that it's always up-to-date, with all the routes available.

### Dynamically registering routes

We need to make the framework aware of the new route definition that we received from the remote service. For this purpose we need to play with the router's internals, in order to provide the instructions for loading the new route.

## Solution

Lets start by exploring the solution of the first problem:

### Dynamically rendering the application's navigation

We can define a component called `AppNav` which receives a list of objects of the type `{ name: "Route name", path: ['/Route', 'Path'] }` and renders the navigation:

```typescript
@Component({
  selector: 'app-nav',
  directives: [ROUTER_DIRECTIVES],
  template: `
    <nav>
      <a *ngFor="#route of routes"
        [routerLink]="route.path">
        {{route.name}}
      </a>
    </nav>
  `
})
export class AppNav {
  @Input()
  routes: string[];
}
```

The component above has a single `@Input` called `routes` and uses the `ROUTER_DIRECTIVES` because of the `routerLink` directive. Once the `routes` property changes its template will be populated with the passed value.

We can use this component in the following way:

```html
<app-nav [routes]="[
  { name: 'Route 1', path: ['/Path1'] },
  { name: 'Route 2', path: ['/Path2'] }
]"></app-nav>
```

So far so good! Now lets see how we can get the list of registered routes and pass them to the directive!

### Messing around with the `@RouteConfig`'s metadata

Lets peek at the semantics of the `@RouteConfig` decorator. All it does is to add another item to the array of `annotations` stored as metadata associated with given component. This means that by using the `Reflect` API we can get all the registered routes!

In order to have better separation of concerns we can isolate the logic for configuring the dynamic routes into a separate class.
Lets define a class called `DynamicRouteConfigurator`, which has the following API:

```typescript
@Injectable()
class DynamicRouteConfigurator {
  constructor(private registry: RouteRegistry) {}
  // Gets the list of registered with @RouteConfig routes
  // associated with given `component`
  getRoutes(component: Type) {...}
  // Updates the metadata added by @RouteConfig associated
  // with given `component`
  updateRouteConfig(component: Type, routeConfig) {...}
  // Adds additional `route` to given `component`
  addRoute(component: Type, route) {...}
}
```

Now lets define a root component which uses the `AppNav` component and `DynamicRouteConfigurator` service we defined:

```typescript
@Component({
  selector: 'app',
  viewProviders: [DynamicRouteConfigurator],
  templateUrl: './components/app/app.html',
  styleUrls: ['./components/app/app.css'],
  encapsulation: ViewEncapsulation.None,
  directives: [AppNav, ROUTER_DIRECTIVES]
})
@RouteConfig([
  { path: '/', component: HomeCmp, as: 'Home' }
])
export class AppCmp {
  appRoutes: string[][];
  constructor(private dynamicRouteConfigurator: DynamicRouteConfigurator) {...}
  private getAppRoutes(): string[][] {}
}
```

Now lets explore the definition of `getRoutes`:

#### Getting the registered routes

```typescript
getRoutes(component: Type) {
  return Reflect.getMetadata('annotations', component)
    .filter(a => {
      return a.constructor.name === 'RouteConfig';
    }).pop();
}
```

Above we simply get all the `annotations` associated with the passed as argument component and extract the declared routes.

#### Updating the registered routes

The implementation of `updateRouteConfig` is quite simple as well:

```typescript
updateRouteConfig(component: Type, routeConfig) {
  let annotations = Reflect.getMetadata('annotations', component);
  let routeConfigIndex = -1;
  for (let i = 0; i < annotations.length; i += 1) {
    if (annotations[i].constructor.name === 'RouteConfig') {
      routeConfigIndex = i;
      break;
    }
  }
  if (routeConfigIndex < 0) {
    throw new Error('No route metadata attached to the component');
  }
  annotations[routeConfigIndex] = routeConfig;
  Reflect.defineMetadata('annotations', annotations, AppCmp);
}
```

We loop over all the `annotations` in order to find the index of the metadata added by the `@RouteConfig` decorator and when we find it, we update its value. Right after that we update the annotations using `Reflect.defineMetadata(...)`.

#### Updating the navigation

We already have the definition of the `AppNav` component! Now we can get the registered with `@RouteConfig` routes  and render links to all of them.

We can populate the list with the links to the routes using the `AppNav` component, by setting the `appRoutes`' value:

```typescript
constructor(private dynamicRouteConfigurator: DynamicRouteConfigurator) {
  this.appRoutes = this.getAppRoutes();
  // ...
}
```

### Dynamically registering new routes

Now lets try to asynchronously add another route! We can notice that the `DynamicRouteConfigurator` has a method called `addRoute`, so lets use it:

```typescript
constructor(private dynamicRouteConfigurator: DynamicRouteConfigurator) {
  this.appRoutes = this.getAppRoutes();
  setTimeout(_ => {
    let route = { path: '/about', component: AboutCmp, as: 'About' };
    this.dynamicRouteConfigurator.addRoute(this.constructor, route);
    this.appRoutes = this.getAppRoutes();
  }, 1000);
}
```
All we do above is to set a timeout for 1 second, define the `About` route and add it to the `AppCmp` using the injected instance of the `DynamicRouteConfigurator`. As last step we update the value of the `appRoutes` which will be reflected by the `AppNav` component.

#### Using the RouteRegistry

Now in order to get complete clarity of the entire implementation lets take a look at the `addRoute` method defined within the `DynamicRouteConfigurator`:

```typescript
addRoute(component: Type, route) {
  let routeConfig = this.getRoutes(component);
  routeConfig.configs.push(route);
  this.updateRoutes(component, routeConfig);
  this.registry.config(component, route);
}
```
As first step we get all the registered routes associated with the target component by using `getRoutes`, later we append one additional route and we invoke the `updateRouteConfig` method. As last step we register the new route in order to make the framework aware of it. We register it by using the instance of the `RouteRegister` passed as dependency via the DI mechanism of the framework.

## Conclusion

Another point for future improvement of the `DynamicRouteConfigurator` is to allow further modification of the route configuration, such as deletion of existing routes. Although the `RouteRegistry` allows this functionality we'll need to touch private APIs (the `_routes` property of the `RouteRegistry` instances).
