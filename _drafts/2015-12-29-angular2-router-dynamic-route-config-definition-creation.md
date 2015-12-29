---
title: Adding Routes Dynamically in Angular 2
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

A couple of months ago I wrote ["Lazy Loading of Route Components in Angular 2"](http://blog.mgechev.com/2015/09/30/lazy-loading-components-routes-services-router-angular-2/), where I explained how we can take advantage of the `AsyncRoute`s and the [virtual proxy pattern](https://en.wikipedia.org/wiki/Proxy_pattern) in Angular 2.

## The Problem

This way we can cut the initial load time of our application by loading only the required for given view directives, services and pipes. Although this strategy works great we are coupled with the route's name:

```ts
@RouteConfig([
  { path: '/', component: Home, name: 'home' },
  new AsyncRoute({
    path: '/about',
    loader: () => System.import('./components/about/about').then(m => m.About),
    name: 'about'
  })
])
```

For instance in the snippet above we need to register the `AsyncRoute` and associate it with the name `about` in order to be able to reference it inside of the template with:

```html
<a [routeLink]="['/about']">About</a>
```

If we get the components that we need to load dynamically (for instance by a RESTful API) we need to generate fake route names which only goal is to stand as placeholders.

## The Solution

Lets see how we can dynamically add route entries!

### Rendering route links dynamically

First, explore how we can show links to the routes we want to add. Since Angular 2 will throw an error in case we reference to a route which is not defined we need to render the links dynamically as well, depending on the registered routes. We can define a component called `AppNav` which receives a list of objects of the type `{ name: "Route name", path: ['/Route', 'Path'] }` and renders it:

```ts
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

The component above has a single input called `routes` and uses the `ROUTER_DIRECTIVES`. Once the `routes` property changes its template will be populated with the passed value.

We can use the component the following way:

```html
<app-nav [routes]="[
  { name: 'Route 1', path: ['/Path1'] },
  { name: 'Route 2', path: ['/Path2'] }
]"></app-nav>
```

So far so good! Now lets see how we can get the list of registered routes and pass them to the directive!

### Getting the registered routes

Lets peek at the semantics of the `@RouteConfig` decorator. All it does is to add another item to the array of `annotations` stored as metadata associated to given component. This means that by using the `Reflect` API we can get all the registered routes.

In order to have better separation of concerns lets define a class called `DynamicRouteCreator`, which has the following API:

```ts
@Injectable()
class DynamicRouteCreator {
  constructor(private registry: RouteRegistry) {}
  // Gets the list of registered with @RouteConfig routes
  // associated to given `component`
  getRoutes(component: Type) {...}
  // Updates the metadata added by @RouteConfig associated
  // to given `component`
  updateRoutes(component: Type, routeConfig) {...}
  // Adds additional `route` to given `component`
  addRoute(component: Type, route) {...}
}
```

Now lets define a root component which uses the `AppNav` component and `DynamicRouteCreator` service we defined:

```ts
@Component({
  selector: 'app',
  viewProviders: [DynamicRouteCreator],
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
  constructor(private dynamicRouteCreator: DynamicRouteCreator) {...}
  private getAppRoutes(): string[][] {}
}
```

So far so good! Now lets explore the definition of `getRoutes`:

```ts
getRoutes(component: Type) {
  return Reflect.getMetadata('annotations', component)
    .filter(a => {
      return a.constructor.name === 'RouteConfig';
    }).pop();
}
```

Above we simply get all the `annotations` associated to the passed as argument component and get the `RouteConfig`.

The implementation of `updateRoutes` is quite simple as well:

```ts
updateRoutes(component: Type, routeConfig) {
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

We loop over all the `annotations` in order to find the index of the metadata added by the `@RouteConfig` decorator and when we find it, we update it. Right after that we update the annotations using `Reflect.defineMetadata(...)`.

### Populating the link list

We can populate the list with the routes links in the `AppNav` component by using the `DynamicRouteCreator` in the `AppCmp`'s constructor:

```ts
constructor(private dynamicRouteCreator: DynamicRouteCreator) {
  this.appRoutes = this.getAppRoutes();
}
```

Now lets try to asynchronously add another route! We can notice that the `DynamicRouteCreator` has a method called `addRoute` so we can take advantage of it and later take a detailed look at its implementation:

```ts
constructor(private dynamicRouteCreator: DynamicRouteCreator) {
  this.appRoutes = this.getAppRoutes();
  setTimeout(_ => {
    let route = { path: '/about', component: AboutCmp, as: 'About' };
    this.dynamicRouteCreator.addRoute(this.constructor, route);
    this.appRoutes = this.getAppRoutes();
  }, 1000);
}
```
All we do above is to set a timeout for 1 second, define the `About` route and add it to the `AppCmp` using the instance of the `DynamicRouteCreator`. As last step we update the value of the `appRoutes` which will be reflected by the `AppNav` component.

### Using the RouteRegistry

Now in order to get complete gasp on the entire implementation lets take a look at the implementation of the `addRoute` method defined within the `DynamicRouteCreator`:

```ts
addRoute(component: Type, route) {
  let routeConfig = this.getRoutes(component);
  routeConfig.configs.push(route);
  this.updateRoutes(component, routeConfig);
  this.registry.config(component, route);
}
```
As first step we get all the registered routes associated to the target component by using `getRoutes`, later we append one additional route and we invoke the `updateRoutes` method. As last step we register the new route in order to make the framework aware of it. We register it by using the instance of the `RouteRegister` passed as dependency via the DI mechanism of the framework.

## Conclusion

Registering routes dynamically is definitely not something that you are going to need to do in a typical SPA, however, by using public APIs provided by Angular 2 you can achieve it pretty simply.

Another point for future improvement of the `DynamicRouteCreator` is to allow further modification of the route configuration, such as deletion of existing routes. Although the `RouteRegistry` allows this functionality we'll need to touch private APIs (the `_routes` property of the `RouteRegistry` instances).
