---
author: minko_gechev
categories:
- AI
- LLMs
date: 2025-10-20T00:00:00Z
draft: false
tags:
- AI
- LLMs
title: Generative Development
url: /2025/10/20/generative-development
---

Historically in my blog I've been posting 10-20 page deep-dive explorations in [type theory](https://blog.mgechev.com/2017/08/05/typed-lambda-calculus-create-type-checker-transpiler-compiler-javascript/), [deep neural networks](https://blog.mgechev.com/2018/10/20/transfer-learning-tensorflow-js-data-augmentation-mobile-net/), [predictive prefetching](https://blog.mgechev.com/2018/03/18/machine-learning-data-driven-bundling-webpack-javascript-markov-chain-angular-react/), etc. Recently, I've been thinking of taking a new approach with short snippets based on my current thinking about a particular topic.

Today, I'll share high-level takes on developer workflows and how they can impact the tools we use.

## LLMs enable velocity

We can certainly speed up our developer velocity using GenAI. Lately, I've been consistently using Gemini CLI and Cursor. Currently, I feel resistance when I have to write a piece of trivial logic, like create a login form or a chat interface from scratch. Agentic tools have enabled me to quickly iterate and test hypothesis. In this phase of the development process I rarely need to look at source code, unless something went terribly wrong. My focus in such early stages of exploration is on the output of whatever I'm building. Whether I'm developing an agent, web UI, or a compiler, I'd create multiple prototypes using agentic tools and entirely focus on the output the prototypes without looking at the implementation. Based on the outputs, I decide which prototype I'd like to move forward with.

Agentic tools allow me to test way more robust implementations of multiple hypothesis compared to pre-agentic developer tooling.

### Focus on the output

This has been the main paradigm shift for me. Agentic tools allow me to rapidly prototype so the cost of source code scaffolding and modification is significantly lower compared to writing code by hand. This allows me to focus more on the output rather than making sure I make correct design decisions at the beginning - I can easily refactor the source code once I've picked the optimal solution.

In my opinion, the focus on the output is what will determine the future of developer tooling. An example for this are the [browser-first agents](https://www.linkedin.com/feed/update/urn:li:activity:7364665479522680833/) I've been playing with. As a web developer, I'd like to focus on the output - the UI that appears in the user's browser. This makes the browser the ideal IDE for me.

## Fine-tuning

When I'm generating the prototypes I'm often not focused on best practices and good architecture. I'd quickly scaffold something with my only goal being to test hypothesis and get a satisfying output.

Once I've picked a prototype I want to move forward with, I'd look into the source code and review the core implementation. I'd make sure that whatever I'm optimizing for is performing well. I'd also focus on the code abstractions and the overall architecture. I'd iterate on them while I get something that looks satisfying. Good agentic tools make this refactoring way less painless.

## Top-down shift

It's interesting to notice how the implementation process flips from being bottom-up to top-down. In traditional development workflows we'd author individual abstractions until we get a working system. We'd focus on the leaf nodes in the dependency tree. Using the generative workflow I described above, we observe the opposite - we get a working product and we iterate on it until we're satisfied with it.
