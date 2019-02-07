---
author: minko_gechev
categories:
- Preloading
- Performance
- Router
- Angular
date: 2018-12-24T00:00:00Z
draft: false
tags:
- Preloading
- Performance
- Router
- Angular
title: Angular quicklink Preloading Strategy
og_image: /images/ngx-quicklink/logo.png
url: /2018/12/24/quicklink-angular-prefetching-preloading-strategy
---

A few months ago I posted an article about [Guess.js](https://blog.mgechev.com/2018/05/09/introducing-guess-js-data-driven-user-experiences-web/). [Guess.js](https://github.com/guess-js/guess) is a powerful library for predictive prefetching of JavaScript based on analytics data for a website. The library consumes reports from an analytics source (by default Google Analytics) and builds a basic machine learning model. When a user visits the site, based on the model Guess.js prefetches resources which are likely to be needed next. Thanks to the data-driven approach, Guess.js offers many benefits - reduces over fetching, does not perform aggressive prefetching on slow networks, etc.

In this blog post we're going to look at another prefetching approach, which takes advantage of two heuristics:

- Users are likely to visit links which are visible on the page
- We do not want to prefetch aggressively if the user is using a poor data plan
- We want to prefetch only when the browser is idle

## Prefetching with quicklink

[GatsbyJS](https://www.gatsbyjs.org/) is a static site generator which is famous for producing high-speed progressive web applications. To get even faster, Gatsby uses aggressive [link](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-link?sa=D&ust=1522637949841000) prefetching.

When a link is visible on the screen, Gatsby prefetches the content associated with it. This is achieved with an [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), using the mapping between a link and the related resource, that is available at build time.

A potential drawback of this approach is over fetching which can cause extra bandwidth consumption. Another minor problem is related to navigation to pages which are not directly linked on the page. This scenario is possible when the user updates the URL in the address bar manually, for instance. Guess.js handles both problems quite well, and fortunately, there's a Guess.js plugin for Gatsby. To use Guess.js, however, one needs to have an analytics source. A good compromise which does not require any analytics is to prefetch resources only when the user uses a fast data plan.

<img src="/images/ngx-quicklink/quicklink.png" style="display: block; margin: auto">

`quicklink` is a project which implements this algorithm! The library prefetches the content associated with all links currently visible on the page, in case the user is on a fast network. `quicklink` does not perform any prefetching if they are on a 2G network or slower. To detect the user's network, Guess.js and `quicklink` use `navigator.connection.effectiveType`.

## quicklink in Angular

`quicklink` is a script which you drop on the page and it does its job. Unfortunately, that's not the case for frameworks which manage their own routing, creating indirection between a URL and content. Examples are Angular, React with React Router, etc.

Let's take a look at an Angular example:

```ts
import { Routes } from "@angular/router";

export const routes: Routes = [{
  path: 'about',
  loadChildren: './about/about.module#AboutModule'
}, {
  path: 'contact',
  loadChildren: './contact/contact.module#ContactModule'
}, {
  path: '',
  redirectTo: '',
  pathMatch: 'full'
}];
```

With the following routing definition, we can link to the page that the `AboutModule` is going to render using `routerLink`:

```html
<a routerLink="/about">About</a>
```

`quicklink` will find all the `a` elements on the page at idle time and prefetch the page associated with their `href` attribute. Given the template above, this is not going to work as expected. `quicklink` will not be able to find the bundle associated with the `/about` page.

## Introducing ngx-quicklink

To let all Angular developers take advantage of the powerful prefetching strategy that `quicklink` provides, I developed [`ngx-quicklink`](https://github.com/mgechev/ngx-quicklink).

<img src="/images/ngx-quicklink/logo.png" style="display: block; margin: auto">

### How to use

`ngx-quicklink` has two main pieces:

1. `QuicklinkModule` - includes a few internal services and a directive that first finds all the router links, and after that detects when they are visible on the screen.
1. `PreloadingStrategy` - implementation of the `PreloadingStrategy` interface exposed by the `@angular/router`. It provides an abstraction for a service that decides if given route needs to be prefetched at given point.

You can read more about module preloading and the Angular's `PreloadingStrategy` [here](https://vsavkin.com/angular-router-preloading-modules-ba3c75e424cb).

To use `ngx-quicklink`, first, make sure you install the package:

```bash
npm i ngx-quicklink --save
```

Here's how you can integrate the `QuicklinkModule` with your existing application:

```ts
import { QuicklinkModule } from 'ngx-quicklink';
...

@NgModule({
  imports: [QuicklinkModule],
  declarations: [...],
  exports: [QuicklinkModule]
})
export class SharedModule {}
```

The snippet above adds the `QuicklinkModule` to the list of `imports` and `exports` of a `SharedModule`. This module should be later imported in your `AppModule` and all the lazy-loaded modules. You don't have to create a new shared module if you already have one.

Next, in your routing module set the preloading strategy:

```ts
import { QuicklinkStrategy } from 'ngx-quicklink';
...

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: QuicklinkStrategy
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

On [this link](https://github.com/mgechev/angular-realworld-example-app-qucklink/commit/33ea101c7d84bb5ca086f107148bbc958659f83f), you can find an integration of `ngx-quicklink` with the `angular-realworld-example-app`.

### How it works

Here are the key features of `ngx-quicklink`:

* **Detects `routerLink`s within the viewport** (using [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API))
* **Waits until the browser is idle** (using [requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback))
* **Checks if the user isn't on a slow connection** (using `navigator.connection.effectiveType`) or has data-saver enabled (using `navigator.connection.saveData`)
* **Prefetches the lazy loaded modules** using Angular's prefetching strategy)

There are three main differences between the original `quicklink` implementation and `ngx-quicklink`:

1. `quicklink` prefetches resources with `link[rel="prefetch"]` if available and fallbacks to `XMLHttpRequest`. `ngx-quicklink` uses only `XMLHttpRequest` because of the current module preloading mechanism of the Angular router. Although `link[rel="prefetch"]` is a better alternative, also used by Guess.js, most likely your users will not notice a difference.
1. `ngx-quicklink` not only downloads the associated JavaScript bundles but also parses and evaluates the content. This will allow even further performance boost when the user changes the page.
1. `ngx-quicklink` will download all parent modules of the requested module to prefetch.

Let us take a look at the last point. Suppose that we have the following routing definition:

```ts
export const routes: Routes = [{
  path: 'about',
  loadChildren: './about/about.module#AboutModule'
},
...
];
```

In the `AboutModule` we have the following route:

```ts
export const routes: Routes = [{
  path: 'team',
  loadChildren: './team/team.module#TeamModule'
},
...
];
```

If on the page there's a `routerLink="/about/team"`, `ngx-quicklink` will first download the `AboutModule` and after that will proceed with the `TeamModule`.

## Conclusion

In this article, we talked about prefetching in web applications. We discussed the `quicklink` prefetching strategy and where it originates from. After that, we discussed what's the difference between predictive prefetching and `quicklink`.

In the next section, we put `quicklink` into the context of Angular, and discussed the limitations of the original implementation. Combining Angular's `routerLink` directive with the framework's `PreloadingStrategy`, we introduced `ngx-quicklink` - `quicklink` implementation for Angular.
