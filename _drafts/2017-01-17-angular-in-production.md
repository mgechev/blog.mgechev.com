---
title: Angular in Production
author: minko_gechev
layout: post
categories:
  - Angular
  - TypeScript
  - Case study
tags:
  - Angular
  - TypeScript
---

In this essey I'll go through my experience in using Angular (2 and above) in production.

Last April, together with a small team, we started working on an educational application; the second version of a product that I developed about 3 years ago using Angular 1.

The users of the original application were mostly young kids and their parents. The purpose of the product is to motivate kids to learn maths by earning rewards. The application had an iOS version with hundreds of thousands of users and we wanted to provide similar experience in the browser. We bet on mobile-first approach, since we were targeting kids playing on their tablets and phones.

In the end because of not enough market fit the project's development was discontinued.

# Choosing the tech stack

Once the entire team got familiar with the business goals and the requirements we had to choose the tech stack. Our main motivation behind it was to be:

- A good fit for the business goals.
- Help us to reuse previous experience we had.
- Fun to work with.

We had a great Rails developer so our technology for the backend was clear. We were considering GraphQL as a communication protocol between frontend and backend but in the end we decided to be a bit more conservative and bet on our  good old friend - REST. If I could go back, probably I'd have chosen GraphQL because I really enjoy its statically typed schema.

## Going statically typed

One of the biggest flaws we experienced in the first version of the product was caused by the use of dynamically typed language. Different typos were caught after the application has been deployed to staging which made us feel it quite fragile. This made is consider a statically typed language for the development of the new version.

Our choice was limited to either Flow or TypeScript. Although Elm sounds hot, it was going to limit our team's scalability.

## The framework...

I had a successful experience with React in a few past projects where I used flux and redux. On the other hand, at this time I was contributing to the Angular's core and a couple of other projects in the Angular organization. I was also working on angular-seed, codelyzer and writing a book about Angular. We also had one team member with Angular experience from a course I taught at Sofia University.

This way we were in front of a choice:

- To go safe and start working with an approach we had previous experience with, taking advantage of React with Flow or TypeScript.
- Take a riskier approach and bet on Angular which at this time was still not released.

Well, in the end we bet on Angular based on the following reasons:

- I already maintained one of the most popular Angular starters. It was going to be a good idea to use it internally and this way find eventual flaws in it that I can fix. Furthermore, the Angular Seed was still already quite mature thanks to the effort that a lot of people put in it.
- From our previous experience with Angular 1, we knew that the dependency injection mechanism of the framework is something that we're going to miss.
- Even being still immature, Google were providing everything we we need - router, DI, change detection, view encapsulation, rendering, etc.
- It was a new, fun technology we wanted to explore in real-life projects.

Although initially we weren't sure which statically typed dialect of JavaScript to use, Angular made the choice obvious and we bet on TypeScript. It's unsoundness was something we weren't really bothered about because it's quite limited and well thought out.

If at this time I wasn't familiar with the codebase of Angular most likely we were going to bet on React. During the implementation of our application we went through a few painful migrations and I had to fork and write custom functionality for the Angular's router. In the end, this is the risk you take when you start using a technology in a beta version.

# Architecture

Flux and redux, both, are approaches I was really satisfied with. On top of that, Angular plays really well with immutable data. Later, we found `@ngrx/store`. It's a micro library which provides a reactive state management inspired by redux and plays really well with Angular.

In short, with `@ngrx/store` we can think of the redux's store as a stream. Each time you emit an action which gets handled by a reducer, the new state will be emitted through a stream. The different streams can be filtered, merged, mapped, etc. in a very elegant way.

Based on a couple of other constraints, we came up with the ["Scalable Application Architecture"](http://blog.mgechev.com/2016/04/10/scalable-javascript-single-page-app-angular2-application-architecture/) that I talked about on a couple of conferences. Although even now it is has some edges that could be polished, the entire team was happy with it. We were able to scale the application to about 40k SLOC (source line of code) and didn't experience any issues with state inconsistencies, neither scalability and separation of concerns.

The only drawback we experienced was that the architecture was a bit verbose (for state mutation you need to define an action, action creator a model method, eventually store property). However, I'm not sure being explicit to this level is a bad thing.

Anther learned lesson from our implementation is that we weren't 100% reactive most of the time. Quite often we had code like:

```ts
this.userModel
  .getUser$()
  .map(u => u.name)
  .take(1)
  .toPromise(Promise);
```

Which is quite an imperative style of programming and doesn't always fit well in the FRP (Functional Reactive Paradigm) paradigm 

# Runtime performance

A serious issue that we met initially were a couple of **memory leaks**. Observables are awesome and you can write very elegant code with them but sometime you forget to clean after yourself. There's a bit of a learning curve until you get conscious and disciplined enough to start cleaning all of your subscriptions.

Some of the most painful and frustrating experiences I had was finding leaking global event handlers. The sure thing is that you're going to notice them. A few leaking click handlers can slow your application down dramatically. They will cause Angular to run it's chance detection mechanism over the entire component tree on each click as many times as leaking callbacks you have. This happens because zone.js monkey patches `addEventListener` and runs dirty checking over the entire user interface (if you haven't applied any advanced optimizations) for you.

Although it was a bit frustrating initially we were able to eliminate these problems. On top of that, both, Angular and rxjs do amazing job cleaning unused subscriptions. But it's still worth mentioning it one more time - **clean after yourself**.

## Optimize your bindings

Although the Angular's change detection is really well optimized, running VM-friendly code, in a very complex user interface you may fill lag. Imagine the following component:

```ts
@Component({
  selector: 'fancy-button',
  template: '<button (click)="n++">Totally {{n}} clicks</button>'
})
class FancyButtonComponent {}
```

And now imagine that this component is somewhere deep into your component tree. Each time you click the button Angular has to perform change detection over all rendered components. Again, the code which performs the change detection is generated by Angular and really well optimized but still, if you have bound to a computationally insensitive getter, for instance, you will feel slowdowns.

Now imagine, instead of a button we have the following input:

```ts
@Component({
  selector: 'name-input',
  template: '<input [(ngModel)]="name">'
})
class NameInputComponent {}
```

`[(ngModel)]` is the so-called **banana in a box syntax** and allows two-way data-binding.

It is really convenient to use it, however, each character you type will triggers multiple change detection checks. If somewhere in your component tree you have:

```html
<fib-cmp [n]="1e100"></fib-n>
```

```ts
@Component({
  selector: 'fib-cmp',
  template: '{{ fibonacci(n) }}'
})
class FibonacciComponent {
  @Input() n: number;

  // Unoptimized Fibonacci implementation
  fibonacci(n: number) {
    if (n === 1 || n === 2) {
      return 1;
    }
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
}
```

You'll feel a serious lag. Of course, we weren't computing the nth Fibonacci number but we had some other heavy computations.

As a learned lesson here - **optimize your bindings**.

## Immutability is your best friend

Sometimes bindings are just heavy and we weren't able to do anything about it. For instance, we had to show the progress for each kid, and compute it based on given formula. We hand to do this in a screen where we also had an input where we used `[(ngModel)]`. With 1 kid it was fine, but imagine how slow the typing into the input was with 4 kids and above.

![](/images/ng-prod/mastery-score.png)

We were calculating the progress for `n` questions, for each day of the week, for each kid and we were doing this a few times on each change of the input box.

But should we go through all these computations in case the kid's instance hasn't changed? Of course not, and for this can help us immutability.

Fortunately, our kids were [immutable records](https://facebook.github.io/immutable-js/docs/#/Record). Immutable records are something like sets but also allow us take advantage of the static typing in TypeScript. Although they are pretty cool, they are also quite verbose. For instance, our `Kid` domain class looks something like:

```ts
const kidRecord = Immutable.Record({
  id: null,
  name: null,
  gender: 0,
  grade: 0,
});

export interface IKid {
  id?: string;
  name?: string;
  gender?: number;
  grade?: number;
}

export class Kid extends kidRecord implements IKid {
  id: string;
  name: string;
  gender: number;
  grade: number;
  constructor(config: IKid) {
    super(config);
  }
}
```

This way:

- We define an immutable record with default values.
- Define a class which extends the immutable record and declares the properties that the kid has.
- Define an interface in order to be able to pass object literals as arguments to the `Kid`'s constructor.

In the end all we did in order to optimize the entire screen was:

```ts
@Component({
  selector: 'kid-statistics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
class KidStatisticsComponent {
  @Input() kid: Kid;
  ...
}
```

This way Angular will perform change detection in the component subtree with root `KidStatisticsComponent` only if it gets different reference to any of its inputs.

## When Immutability doesn't help

We applied this optimization strategy wherever we could. Unfortunately, sometimes Angular was still performing unnecessary checks.

![](/images/ng-prod/increment-bp.gif)

Imagine a kid in kindergarten is solving a test. Once it answers correctly we want to increase it's points with the result it got from the last answer. This looks something like:

```ts
@Component({
  selector: 'point-counter',
  template: '{{ boundPoints }}'
})
class PointCounterComponent implements OnChange {
  @Input() earnedPoints;
  ...

  ngOnChanges() {
    ...
    const increase = () => {
      if (currentPoints >= finalPoints) {
        this.boundPoints = finalPoints;
      } else {
        this.boundPoints += stepSize;
      }
      this.timeout = setTimeout(increase, 10);
    };
  }
}
```

Remember we mentioned zone.js? It monkey patches not only `addEventListener` but all the async APIs in the browser, including `setTimeout`. This means that Angular will perform change detection every 10ms and it should since we modify the `boundPoints` property to which we have bound in the template.

Fortunately, Angular provides us a solution. We can inject the `NgZone` and run the points animation outside the Angular's zone which won't trigger the change detection mechanism. However, note that in this case you have to manually manipulate the DOM:

```ts
@Component({
  selector: 'point-counter',
  template: '{{ boundPoints }}'
})
class PointCounterComponent implements OnChange {
  ...
  constructor(private zone: NgZone) {}

  ngOnChanges() {
    ...
    this.zone.runOutsideAngular(() => {
      this.animatePoints();
    });
  }
}
```

One more problem solved. Although we experienced some issues with runtime performance, it wasn't a big concern. Unfortunately, we noticed that huge percentage of our users didn't have enough patience to wait for the application to load.

# Network performance

Our initial production build process was to rsync the `dist/prod` directory produced by Angular Seed to our remote server. Although it was simple, it was far from optimal. nginx was using gzip to provide compressed content to the final users but our bundle size was still about 800k.

Later we migrated our code to RC.5 and took advantage of the **[Ahead-of-Time compilation](http://blog.mgechev.com/2016/08/14/ahead-of-time-compilation-angular-offline-precompilation/) which increased our bundle size** even further - now it was close to 1M. Loading the bundle is not the biggest issue, on low-end devices it's parsing can take up to a few seconds.

We took advantage of techniques such as:

- Bundling
- Minification
- Tree-shaking

And later I blogged about that in ["Building an Angular 2 Application for Production"](http://blog.mgechev.com/2016/06/26/tree-shaking-angular2-production-build-rollup-javascript/)

Although we applied everything from the list we still didn't have satisfying results.

We had a few more techniques in mind:

- Lazy-loading and prefetching.
- Service workers for caching/prefetching.
- Using a "static app".

## Lazy-loading

After we migrated to the Angular router from our custom fork of it's previous version, we tried to apply lazy loading. The technique sounds quite clear:

- Spread the functionality of the entire application among:
  - Main bundle which includes functionality used across the entire application.
  - Feature bundles which capture functionality from separate "bounded contexts".

Although the idea was clear, achieving it wasn't as simple as possible. One of the main reasons why I still haven't provided out-of-the-box solution for lazy loading in Angular Seed was the fact that it's hard to implement a solution which works for any application. Fortunately, in our team we are able to agree on specific constraints and implement a build process which relays that specific conditions are met.

In the end, after a day of struggle with suffix trees and other fun algorithms we came up with a solution which split our application into three bundles. We load the bundles with SystemJS which is the default module loader for Angular.

### Prefetching of bundles

One of the bundles represents the intro screen of the application and the sign-up flow, there's a bundle for the main functionality and finally, the core bundle which contains Angular and the common functionality among the first two.

![](/images/ng-prod/bundles.png)

In the prefect scenario we wanted to download the code required by the page once the user loads the application initially and after that prefetch the other bundles. We used similar strategy in the previous version of the application for [prefetching templates](http://blog.mgechev.com/2013/10/01/angularjs-partials-lazy-prefetching-strategy-weighted-directed-graph/).

Luckly, Angular provides this out of the box. All we had to do was:

```ts
let routes: Routes = [...];

export const appRoutes = RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules });
```

## Service workers

Service workers (SW) provide a new API which allows us to achieve advanced network control over all requests going from the browser to the network.

The Angular [mobile toolkit](https://github.com/angular/mobile-toolkit), a project I'm involved in, allows automatic management of service workers and generation of application shell. Thanks to the mobile toolkit we were able to generate a manifest file as part of our build process. Later the mobile toolkit reads this file and based on it's content configures a service worker for management of static assets.

A few of it's features allowed us to:

- Cache static assets in the SW's cache.
- Update only the assets which have changed.

The mobile toolkit helped us get additional performance boost for browsers which support the modern standards.

Unfortunately, our main bundle (`app` from the image above) was still too big and on 2G network our application was loaded for more than 20s.

## Static app

In the intro screen of the product we have two pages of static content which explain to the parents what the application is all about. It is completely unnecessary to make the users wait until the assets of the application has been downloaded to let them to read a few lines of text and decide if they want to sign-up or not.

What we decided to do was to take the templates of the components which represented these static pages and move them to a separate application which is not managed by Angular. We inlined the templates and wrote some custom JavaScript code which understands the basic routing directives, in particular `routerLink`.

Conceptually the "static app" sounds similar to the application shell with the difference that it is actually an executable application with static content. All the JavaScript, styles and templates for these static pages were 20K. 

What we did was to initially download the application's styles together with the static app. Once the static application gets rendered, in background we start prefetching the core and intro bundles. Once the bundles are ready and the user decides to continue, we just bootstrap the Angular application. In case the user is ready to register but the bundles are not yet downloaded, we show a loading indicator and ask the user to hold off for a second.

The best thing about the static application is that it doesn't change. This helped us to cache the bundle not only in service worker's cache but also aggressively in the browser's cache.

## Ahead-of-Time compilation

As I mentioned above, once Angular RC5 was released, we migrated the application and introduced AoT compilation as part of the build process. In short, the core benefits of AoT compilation are:

- We no longer need the Angular compiler as part of the production bundle. This reduces the size a bit.
- The code becomes tree-shakable since the templates are compiled to JavaScript with static imports.
- We don't have the runtime overhead of the Just-in-Time (JiT) compilation.

The first two points are quite self explanatory but the third point is the feature which has greatest impact over the user experience.

When using our "static app" approach we bootstrap the Angular application after the static one has been already rendered. This means that we perform JiT compilation after we already have something onto the screen. The images below demonstrate the delayed Angular bootstrap. The gif on the right shows the delayed bootstrap with JiT compilation enabled and the gif on the left demonstrates what happens when we've compiled the application as part of the build process.

<div style="display: flex; justify-content: space-around;">
  <div style="text-align: center;">
    <img src="/images/ng-prod/aot.gif"><br>
    <span>AoT</span>
  </div>
  <div style="text-align: center;">
    <img src="/images/ng-prod/jit.gif"><br>
    <span>JiT</span>
  <div>
</div>

Suppose the user had waited 10 seconds to get load our entire application. Right after that Angular will have to perform JiT compilation so the user will still see a blank screen. Once the code for the templates and DI has been generated by the compiler, the user still needs to wait since the code needs to be parsed and just then the view could be rendered. In some cases JiT compilation is even not possible since `eval` is not permitted.

It's definitely worth it to use AoT compilation in your application.

# Conclusion
