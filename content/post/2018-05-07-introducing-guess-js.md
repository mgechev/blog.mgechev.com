---
author: minko_gechev
categories:
- JavaScript
- React
- Angular
- Tooling
- Webpack
- Machine Learning
- Guess.js
date: 2018-05-09T00:00:00Z
draft: false
tags:
- JavaScript
- React
- Angular
- Tooling
- Webpack
- Machine Learning
- Guess.js
title: Introducing Guess.js - a toolkit for enabling data-driven user-experiences on the Web
og_image: /images/intro-guess-js/guess.png
url: /2018/05/09/introducing-guess-js-data-driven-user-experiences-web
---

About two months ago I published my [initial research](https://blog.mgechev.com/2018/03/18/machine-learning-data-driven-bundling-webpack-javascript-markov-chain-angular-react/)<sup>[1]</sup> on data-driven bundling. A few weeks after that, I had the opportunity to present my work on [RenderConf](https://2018.render-conf.com/) in Oxford, UK in my talk ["Teach Your Bundler Users' Habits"](https://www.youtube.com/watch?v=L5tPWCB7jX0)<sup>[2]</sup>.

The original goal of the article was to show **how data can help in improving the user-perceived page load performance** by using [predictive analysis](https://en.wikipedia.org/wiki/Predictive_analytics)<sup>[3]</sup>. The artifacts from the article were executable node modules which can be used for predictive pre-fetching & data-driven clustering of JavaScript chunks.

In the meantime, I talked to [Addy Osmani](https://twitter.com/addyosmani) who turned out to be exploring data-driven approach for predictive [pre-fetching of web pages](https://github.com/addyosmani/predictive-fetching). After a few conversations, we saw that there's a big intersection between what we were doing so we decided to merge everything under the hat of the project [Guess.js](https://github.com/guess-js)<sup>[4]</sup>!

# Introducing Guess.js

Guess.js is a collection of libraries & tools for enabling data-driven user-experience on the web.

<img src="/images/intro-guess-js/guess.png" alt="Logo of Guess.js" style="width: 350px; display: block; margin: auto">

With Guess.js we want to explore the application of data-analytics driven approach to user experience in:

- Single-page applications
- Framework-based static sites
- Static content sites
- Enterprise sites

You can watch the official announcement of Guess.js by Addy Osmani and Ewa Gasperowicz from Google I/O 2018 below:

<div style="margin-top: 20px; margin-bottom: 20px; margin-top: 20px; margin-bottom: 20px; position:relative;height:0;padding-bottom:56.25%"><iframe width="560" height="315" src="https://www.youtube.com/embed/Mv-l3-tJgGk?start=2093" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="position:absolute;width:100%;height:100%;left:0"></iframe></div>

Now let's discuss the first three bullet points from above.

## Single-Page Applications

The SPA support of Guess.js is currently in **alpha** and can be tested with the following technologies:

- Angular projects using either Angular CLI or custom layout with the cost of extra configuration
- React projects using either [create-react-app](https://github.com/facebook/create-react-app)<sup>[5]</sup> or custom layout with the cost of extra configuration. Because of the fragmented mechanism for creating multi-route React application, currently, Guess.js supports only JSX or TSX with [restricted syntax constructs for route definition](https://github.com/guess-js/guess/tree/master/packages/parser#react)<sup>[6]</sup>

Our goal with Guess.js is to minimize your bundle layout configuration, make it data-driven, and much more accurate! In the end, you should lazy load all your routes and Guess.js will figure out which bundles to be combined together and what pre-fetching mechanism to be used! All this in less than 5 minutes setup time.

In order to help everyone to apply a data-driven approach to their tooling, we developed the `GuessPlugin` for webpack! Although the techniques explained in ["Machine Learning-Driven Bundling. The Future of JavaScript Tooling"](https://blog.mgechev.com/2018/03/18/machine-learning-data-driven-bundling-webpack-javascript-markov-chain-angular-react/)<sup>[6]</sup> are tooling agnostic, webpack is a good starting point which will let a lot of people make their applications load faster & smarter.

In order to use data-driven pre-fetching in your Angular CLI or Create React App project you should first install `guess-webpack`:

```bash
npm i guess-webpack --save-dev
```

...and after that add the following two lines of code to your webpack configuration:

```javascript
const { GuessPlugin } = require('guess-webpack');

// Add the GuessPlugin in the end of your
// webpack plugin configuration
GuessPlugin({ GA: 'GA_VIEW_ID' })
```

The end result will look like:

<img src="/images/intro-guess-js/guess-plugin-demo.gif" alt="Guess.js Plugin Demo" style="display: block; margin: auto">

During the build process, the `GuessPlugin` will fetch report from Google Analytics, build a model used for predictive pre-fetching and add a small runtime to the main bundle of your application.

On route change, the runtime will query the generated model for the pages that are likely to be visited next and pre-fetch the associated with them JavaScript bundles.

How many pages will pre-fetched depends on the user's network speed. On slow 2G network, we're going to pre-fetch fewer bundles compared to fast LTE.

The main modules used by the `GuessPlugin` are:

- `guess-ga` - fetches structured data from Google Analytics
- `guess-parser` - parses an application in order to create the mapping between routes and JavaScript bundles
- `guess-webpack` - webpack plugin which automates the process of applying data-driven bundling & pre-fetching in React & Angular applications

Compared to my original research, the Guess.js modules provide simplified API which aims to reduce the configuration overhead to the minimum. Also, in Guess.js clustering is temporarily disabled but it's on its way back!

### Notes

Keep in mind that the tool is still in alpha. We'd love to get feedback and/or contributions from you in the [Guess.js monorepo](https://github.com/guess-js/guess)<sup>[7]</sup>.

Also, acknowledge the following points:

- You will need to eject your application in order to be able to edit your webpack config file in both Angular CLI and Create React App
- In case you're using Angular CLI version 6 you may need to downgrade to version 1.7 because currently, Angular CLI does not allow ejection
- In React you need to make sure you're following the currently [supported route definition syntax](https://github.com/guess-js/guess/tree/master/packages/parser#react)<sup>[7]</sup>

In case you want to get familiar with the internals of the Guess.js webpack plugin, you can take a look at the article "[Machine Learning-Driven Bundling. The Future of JavaScript Tooling](https://blog.mgechev.com/2018/03/18/machine-learning-data-driven-bundling-webpack-javascript-markov-chain-angular-react/)<sup>[7]</sup>"

## Framework-based static sites

The brilliant static site generator [Gatsby](https://www.gatsbyjs.org/)<sup>[8]</sup> uses a smart pre-fetching strategy where it considers all the local links on the current page. Based on their visibility in the viewport, Gatsby pre-fetches the associated content.

This approach is very powerful and often provides an instantaneous user experience. In order to reduce the over-fetching, the next step to improve the current algorithm is to look at data and consider only the links which are most likely to be visited next!

Together with [Kyle Mathews](https://github.com/KyleAMathews) we collaborated on introducing [Guess.js plugin to Gatsby](https://github.com/guess-js/gatsby-guess)<sup>[9]</sup>. The Gatsby plugin uses lower-level APIs of Guess.js which we're going to take a look at later in this article.

<img src="/images/intro-guess-js/pages-probability.png" alt="Guess.js Gatsby" style="display: block; margin: auto">

On the image above, all the visible links in the viewport are highlighted. Depending on the probability the user to visit any of them, they are colored in:

- <span style="background-color: #FEA19B; width: 15px; height: 15px; display: inline-block; position: relative; top: 2px;"></span> high probability
- <span style="background-color: #EDCAFE; width: 15px; height: 15px; display: inline-block; position: relative; top: 2px;"></span> mild probability
- <span style="background-color: #A2FEFF; width: 15px; height: 15px; display: inline-block; position: relative; top: 2px;"></span> low probability

Gatsby's Guess plugin can reduce the amount of pre-fetch operations by considering the likelihood given link to be visited by the user. This can minimize the bandwidth consumption on devices using mobile data dramatically.

**You can find a demo of Guess.js + Gatsby on [this Wikipedia clone](https://guess-gatsby-wikipedia.firebaseapp.com/)<sup>[10]</sup>.** If you want to see which links are likely to be visited next press "h" to toggle highlighting.

## Static content sites

Together with [Addy](https://github.com/addyosmani) and [Kyle](https://github.com/KyleAMathews), we also had the opportunity to work with [Katie Hempenius](https://github.com/khempenius). She focused on a workflow for **predictive pre-fetching for static content sites**.

The predictive pre-fetching for static sites uses client-server architecture. The backend fetches a Google Analytics report and builds a model which can be later used to determine which pages are likely to be visited next.

On navigation, the client component asks the server which are the URLs of the most probable pages to be visited and pre-fetches them using `<link rel="prefetch">`.

You can find more details and the implementation of this workflow in the [guess-js/guess monorepo](https://github.com/guess-js/guess)<sup>[10]</sup>.

## Lower level API

**Plugin and/or library maintainers can also leverage the data-driven prediction capabilities of Guess.js by using the lower level API** it provides.

Currently, the `gatsby-plugin-guess-js` uses the `GuessPlugin` for webpack in order to be able to query the model at runtime which links are likely to be visited next. If you have similar requirements, you can get this functionality for free with the following `GuessPlugin` config:

```javascript
new GuessPlugin({
  // GA view ID.
  GA: GAViewID,

  // Hints Guess to not perform pre-fetching and delegate this logic to
  // its consumer.
  runtime: {
    delegate: true,
  },

  // Since Gatsby already has the required metadata for pre-fetching,
  // Guess does not have to collect the routes and the corresponding
  // bundle entry points.
  routeProvider: false,

  // Optional argument. It takes the data for the last year if not
  // specified.
  period: period ? period : undefined,
})
```

Let me explain the individual properties set to the configuration object literal passed to the `GuessPlugin` call:

- `GA` - the view ID from Google Analytics
- `runtime` - configures the runtime of the `GuessPlugin`. In this case, the `delegate` property means that the Guess.js will not handle route changes
- `routeProvider` - the route provider is the module responsible for establishing the actual mapping between pages from the Google Analytics report and the JavaScript bundles of the application. Since Gatsby already has this information, the provider is not required
- `period` - the period for the Google Analytics report that will be fetched

Keep in mind that establishing the mapping between the JavaScript bundles of the application and the individual URLs from the Google Analytics report, is the most fragile part of the entire process. This is mostly due to the highly fragmented syntax for route definition in the individual frameworks.

In case you're developing a plugin and you already have the bundle to URL mapping, you can either set the `routeProvider` to `false` or provide a custom `routeProvider` which directly returns an array with the individual routing modules in the following format:

```javascript
export interface RoutingModule {
  // Entry point of the bundle associated with
  // the given route
  modulePath: string;

  // Entry point of the parent bundle
  parentModulePath: string | null;

  path: string;
  lazy: boolean;
}
```

If you have any questions, do not hesitate to contact us or [open an issue](https://github.com/guess-js/guess/issues)<sup>[11]</sup>.

## Summary

Guess.js' goal is to make the web faster and smarter by replacing the manual decision making with an automated data-driven approach.

Here are few of the areas of focus of Guess.js:

- Single-page applications - initially targeting popular frameworks because of already established conventions which make static analysis possible
- Static content sites - will let people using WordPress, Ghost, and many other platforms to leverage the smart pre-fetching of Guess.js
- Framework-based static sites - Gatsby and many others, can use the lower level APIs of the `GuessPlugin` in order to pre-fetch content that the user will need in near future

Performance is not the only area where data can bring improvements to the web. Automating our decision making and ensuring it's data-driven can positively impact many other areas of user experience but making our web applications faster is a good start!

## References

1. Machine Learning-Driven Bundling. The Future of JavaScript Tooling.
 https://blog.mgechev.com/2018/03/18/machine-learning-data-driven-bundling-webpack-javascript-markov-chain-angular-react/
2. Teach Your Bundler Users' Habits https://www.youtube.com/watch?v=L5tPWCB7jX0
3. Predictive Analysis https://en.wikipedia.org/wiki/Predictive_analytics
4. Guess.js organization on GitHub https://github.com/guess-js
5. Create React App https://github.com/facebook/create-react-app
6. Guess.js Route Parser https://github.com/guess-js/guess/tree/master/packages/parser#react
7. Guess.js on GitHub https://github.com/guess-js/guess
8. Gatsby.js https://www.gatsbyjs.org/
9. Guess.js plugin for Gatsby https://github.com/guess-js/gatsby-guess
10. Demo of Gatsby.js using Guess.js https://guess-gatsby-wikipedia.firebaseapp.com/
11. Guess.js issues on GitHub https://github.com/guess-js/guess/issues
