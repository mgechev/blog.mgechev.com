---
title: 7 Angular Tools that You Should Use
author: minko_gechev
layout: post
categories:
  - Angular
  - TypeScript
  - Tooling
tags:
  - Angular
  - TypeScript
  - Tooling
---

In this article we're going to briefly explore 7 Angular development tools which can make your life easier. The purpose of the list is to not be opinionated architecture wise, so we're not going to discuss tooling which will have impact over your application state management, data layer, etc. For instance, although packages like ngrx/store devtools, universal, and others are amazing once we've chosen a specific architectural approach, we're going to keep them out of this article because they assume you're using a specific way of state management or application rendering.

The software below can improve our productivity as developers by providing scaffolding, static code analysis, code generation, code visualization and debugging support!

# Angular CLI

Number one tool for Angular which provides well encapsulated build and scaffolding is [Angular CLI](https://github.com/angular/angular-cli).

![Angular CLI](/images/ng-tools/angular-cli.png)

Angular CLI is a tool developed by Google and allows us to quickly bootstrap projects by automatically providing our build configuration, testing configuration (unit with karma & jasmine and e2e with protractor), and more. The CLI is based on webpack which means that by default it can take advantage of the different webpack loaders developed by community and performs tree-shaking for producing small bundles.

The Angular CLI is developed by the Angular team which means smooth integration with other projects such as, Angular Core, Angular Material, Angular Mobile Toolkit, etc. For instance, soon Angular CLI will run the development build our applications with ngc which will unify the production and development builds, reducing the learning curve and allowing developers to have predictable compilation behavior across different environments.

In case you're just getting started with Angular, **you should start your project with Angular CLI**. This will dramatically improve your productivity and optimize the learning experience of the entire ecosystem. In case you have very deep understanding of the required tooling and you want to ... with a custom solution you can always `ng eject` your application out of the CLI, or use an [Angular starter project](https://github.com/mgechev/angular-seed).

Thanks to the guys helping to make the CLI awesome, including (but not limited to) [Hans](https://twitter.com/hanslatwork), [Mike](https://twitter.com/Brocco), [Filipe](https://twitter.com/filipematossilv).

# Language Service

![Language Service](/images/ng-tools/language-service.gif)

The language service of Angular provides the same type checking and auto completion, that we're used to from TypeScript, in inline and external templates! Very common mistakes that developers using a dynamic language (such as JavaScript) do is to misspell a method or a property name. TypeScript already can warn us about this thanks to tsc and it's type system, however, this wasn't possible within the strings representing our components' templates.

The Angular core team developed a language service which provides the same type checking and auto completion behavior within our favorite text editor or IDE. It be already used in VSCode, Sublime Text and WebStorm.

Behind the scene the language service uses the Angular compiler for parsing our application and producing diagnostics. After that it decorates the TypeScript language service in order to reuse logic. The most awesome thing about the language service is that it is not coupled to a specific Angular version and can be used in **any text editor and IDE** as soon as there's an available plugin. More about the language service can be found in the ng-conf talk by Chuck Jazdzewski (the creator of the language service) ["Using the Angular Template Language Service"](https://www.youtube.com/watch?v=ez3R0Gi4z5A).

# Compodoc & ngd

Have you ever worked on an application where you had to automatically generate the API documentation? For JavaScript we have tools like [ESDoc](https://esdoc.org/) which take the JSDoc annotations and automatically generate documentation for us, looking something like [this](https://mgechev.github.io/ngast/).

This is already great for most projects but Angular provides some extra metadata on top that can make our documentation richer. For instance, we may want to produce the list of the all different components, pipes, etc. in our application. With Angular, we can just grab all the classes decorated with `@Component`, `@Pipe`, for instance. Well, compodoc already does this for us!

![Compodoc](/images/ng-tools/compodoc.gif)

Compodoc has support of JSDoc light, generates search, table of content, has variety of good looking themes and is open source, [available on GitHub](https://github.com/compodoc/compodoc)!

Behind the scene compodoc uses [ngd](https://github.com/compodoc/compodoc) for parsing our Angular applications by using the TypeScript parser.

Thanks to the compodoc team, including [Vincent Ogloblinsky](https://twitter.com/vogloblinsky) and [Wassim Chegham](https://twitter.com/manekinekko).

# codelyzer

I started codelyzer over a year ago in order to provide Angular-specific linting. Initially the project started as a couple of rules on top of tslint which based on the [Angular Style Guide](https://angular.io/styleguide) were validating the selectors of our components, implementation of life-cycle hook interfaces that we use, etc.

![codelyzer](/images/ng-tools/codelyzer.gif)

Since then, the scope of codelyzer has grown! Now it uses the Angular template and CSS parser in order to provide deep analysis of our application. On top of verifying that our project follows the style guide, codelyzer can also detect misspelled variables in our templates, find dead styles and even [automatically migrate a project between breaking changes & deprecation across Angular versions](https://twitter.com/mgechev/status/848008010630705152)!

If you're using Angular CLI, by running `ng lint` you're already getting diagnostics by codelyzer which makes sure your code is following best practices!

Behind the scene, codelyzer provides either flat (per file) or deep (per project) static analysis of your project. The diagnostics that codelyzer will produce includes:

- Validity of the directive and component selectors according to the style guide.
- Best practices related to declaring the metadata of our projects.
- Proper implementation of life-cycle hooks.
- Proper component and directive naming.
- Compatibility with ngc.
- Detection of dead CSS.
- etc.

# Snippets for VSCode

Are you tired of all the boilerplates when declaring a new Angular component, directive or a service? The process is manual, slow and with the tooling available, not necessary!

![Snippets](/images/ng-tools/snippets.gif)

[John Papa](https://twitter.com/John_Papa) created snippets for VSCode which improves our productivity by reducing the amount of boring work that we need to perform when:

- Bootstrapping an Angular application.
- Declaring a new component.
- Declaring guards.
- Declaring directive.
- Declaring a route.
- Declaring a service.
- etc.

You can take advantage of the snippets by installing the VSCode extension available [here](https://marketplace.visualstudio.com/items?itemName=johnpapa.Angular2).

# Augury

Debugging an Angular application may get tricky. Fortunately, expecting the component state does not have to be always related to setting break point or a `debugger` statement within the body of its constructor. In order to explore the dependencies of given component or a service, we don't have to always dig into our codebase.

![Augury](/images/ng-tools/augury.png)

Augury is a Chrome extension which will plug into your Chrome DevTools. Once loaded, it will help you explore the relations between the individual components in your application which are visible on the page. You can trace the component state and modify it from the provided inputs, you can manually trigger events, directly jump to the source code of a specific symbol and much more!

You can install Augury [here](https://chrome.google.com/webstore/detail/augury/elgalmkoelokbchhkhacckoklkejnhcd).

# ngrev

# Conclusion
