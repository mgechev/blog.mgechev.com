---
author: minko_gechev
categories:
- Career
- Google
date: 2018-10-02T00:00:00Z
draft: true
tags:
- Career
- Google
title: Joining Google
og_image: /images/google/logo.png
url: /2018/10/02/joining-google
---

The past five years I've been heavily involved in the startup space, both, here in the Silicon Valley and Bulgaria. My focus was EdTech, working on different educational products, starting with an app for kids, to a platform for online education, marketing, and sales demos which provides access to a virtual environment in the browser. In the second company called [Rhyme](https://rhyme.com), which is particularly exciting and technically challenging, I had the opportunity to join as a co-founder.

![Silicon Valley](/images/google/silicon-valley.jpg)

It was an incredible journey. I had the opportunity to drive the foundational architectural, design, and technological choices. I learned a lot about technology, business, marketing, building a team, introducing quality processes for maintaining high standards, and much more. Managing the balance between the dynamic business requirements and keeping the technical dept to the minimum was probably the biggest challenge. In a startup with less than 20 people every decision that each team member takes has a significant impact on the direction of the entire company.

This work was driving some of my open source effort over the years. The original [AngularJS style guide](https://github.com/mgechev/angularjs-style-guide), for example, I wrote because of Brownie Points - an educational application for kids that I developed with AngularJS. For the second version of Brownie Points, we used Angular together with [angular-seed](https://github.com/mgechev/angular-seed) and [codelyzer](https://github.com/mgechev/codeyzer). Brownie Points also led to my article for [lazy-prefetching of templates](https://blog.mgechev.com/2013/10/01/angularjs-partials-lazy-prefetching-strategy-weighted-directed-graph/), which inspired my work on [predictive prefetching for JavaScript](https://blog.mgechev.com/2018/03/18/machine-learning-data-driven-bundling-webpack-javascript-markov-chain-angular-react/). In Rhyme, we decided to use React with Go on the backend. I saw that there's a place for improvement around the tooling for static code analysis, and in my spare time published [revive](https://github.com/mgechev/revive); we later introduced it to Rhyme's monorepo.

![Open source](/images/google/coding.jpg)

Reflecting on this, I realized that more and more frequently I was looking for an opportunities to work on tools for development productivity. The reason for this is my belief that the software development process nowadays is primitive and error-prone. Even for the development of a straightforward program, we need to consider tens of corner cases, trace mutable state, and verify our work by coming up with test cases. In the same time, we can hardly keep more than [seven things at once in our minds](https://en.wikipedia.org/wiki/Working_memory#Capacity) and as authors of our programs not finding test cases which break them does not mean that they are correct.

Probably formal verification and machine learning can help, but there is no apparent solution. Most likely the universe in which every program we write has guaranteed correctness uses different programming languages, maybe even different computational paradigms.

![Quantum Computing](/images/google/q.jpg)

What we can do now is to abstract the answers to common issues and provide frameworks that we can reuse over time. A good framework will evolve, expanding its core with the best practices discovered in the wild. It will also be opinionated, allowing developers to build advanced tooling on top for a great experience, development productivity, and software quality.


Another thing I firmly believe in is open source. Open source connects people around the world to share ideas, knowledge, and inspiration. The open source software specifically, provides a base of a very highly concentrated knowledge and a collaborative environment in which anyone, anywhere in the world can work with some of the best experts in the industry. That's my primary motivation to start contributing to open source a few years ago, and it's one of the main driving forces to keep my efforts.

Today, I'm excited to share that I'm joining Google to keep working on open source software full-time. As part of the Angular team, I'll be working on making the development process faster, smarter, and more accessible.

![Google](/images/google/googleplex.jpg)

