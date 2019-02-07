---
author: minko_gechev
categories:
- Angular
- Angular CLI
- Productivity
date: 2019-02-06T00:00:00Z
draft: false
tags:
- Angular
- Angular CLI
- Productivity
title: 5 Angular CLI Features
og_image: /images/ngx-quicklink/logo.png
url: /2019/02/06/5-angular-cli-features
---

I've been using Angular for years, not only the framework itself but the entire development platform, including the CLI. Since I joined the Angular team, however, I started noticing features in the CLI that I've never used before. In this blog post I want to share some of them, which may make your work life easier and more enjoyable.

## Conditional Polyfill Serving

In the development of Angular we're using TypeScript with a lot of modern JavaScript features. Not all of them are supported by the users' browsers so that's why as part of the production build we ship a file called `polyfills.js`, which provides the missing features such as `Map`, `Set`, zones.js, etc.

Over the past a couple of years, browser vendors started implementing a lot of these features. The chances are that a user who's on the latest version of Chrome will not need any of the ES2015 polyfills that we ship as part of `polyfills.js`. Instead, they can run the native implementation of these features directly in the browser. This makes large portion of the content of `polyfills.js` obsolete and unnecessary.

That's why we introduced conditional polyfill loading! As part of the default build process, Angular CLI will produce two bundles `polyfills.js` and `es2015-polyfills.js`. Users who're using newer browsers will only download `polyfills.js` which include limited amount of polyfills, such as zone.js, but no such that the user's browser already support (for example, `Map`, and `Set`). This way, users who're on newer browsers will get fewer bytes of JavaScript and respectively, have better experience since their applications will run faster.

You might be wondering, alright, all my users are on browsers which already support ES2015, why would I have to wait for the CLI to produce `es2015-polyfills.js` that will never be in use? If you're really wondering this, then you're a happy developer and we have a solution for you. Build your application by running:

```
ng build --es5BrowserSupport=false
```

By setting the `--es5BrowserSupport` flag to `false`, Angular CLI will produce only `polyfills.js` which contains the polyfills for newer browsers which already have ES2015 features up and running!

<div style="padding: 20px; border-radius: 5px; background-color: #fff4da">
This feature is only available in Angular CLI 7.3.0 and above.
</div>

## "Hidden" Source Maps

## Looking up the Documentation

## Profiling the Build
