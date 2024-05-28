---
author: minko_gechev
categories:
- AGI
- Math
- AI
- LLM
date: 2024-05-28T00:00:00Z
draft: false
tags:
- AGI
- Math
- AI
- LLM
title: Are LLMs going to replace us?
url: /2024/05/28/are-llms-going-to-replace-us
---

Over the past few years, I have published most of my posts on [blog.angular.dev](https://blog.angular.dev), but my blog has received little attention. Today, I decided to interrupt this unintentional pause by sharing a thought in my mind lately. It's provoked by a mixture of one of the most memorable moments from my degree at Sofia University and the recent boom of AI. I've been getting inspiration from the theory of computation to answer the question, "Are we going to be replaced by AI?"

If I were a YouTuber, I'd have said, "Make sure you read the article until the end to find the answer...Also, make sure you like and subscribe." Luckily, I'm not a YouTuber, and I don't want to lose your time, so if you're looking for an answer, you better stop reading here. If you'd enjoy my brief rambling incorporating some of my limited understanding of mathematics and philosophy, please spend the next 3 minutes reading through.

A popular theorem shows that computers cannot solve all the problems. I'd not dig into a formal proof, but it pretty much goes like this:

* **The set of all the programs is at most [countable](https://en.wikipedia.org/wiki/Countable_set)**. Since every computer program is represented by a finite list of characters, we can create a bidirectional mapping between each computer program and the set of natural numbers. We call sets with bidirectional mapping to the natural numbers countable.
* **The set of all the problems is [uncountable](https://en.wikipedia.org/wiki/Uncountable_set)**. We can think of the problems as functions over real numbers because each real number would theoretically correspond to a solution. There are more real numbers than integers - for example, between 0 and 1, there's an infinite set of real numbers. We can call the set of all the problems uncountable.
* **Therefore, there are more problems than programs...**

All machine learning models operate on a classical [von Neumann architecture](https://en.wikipedia.org/wiki/Von_Neumann_architecture) based on the [Turing machine](https://en.wikipedia.org/wiki/Turing_machine). Even with a Turing machine with an infinite tape, we'll be able to develop, at most, a countable number of programs; thus, even with a theoretical supercomputer based on this model, we'd not be able to solve all the problems. In practice, things are even more challenging since modern computers have finite memory.

You probably already see the connection with the question, "Are humans replaceable by AI?" What I love about math is that it's very versatile, so we can create abstract models that are still helpful for specific use cases. To compare humans to AI, we can define a human as a function that receives an input and produces an output. My current hypothesis is that whether AI will replace humans depends on this function's type signature. Does it operate over an uncountable or a countable set? Does it produce results from an uncountable or a countable set?

Just for simplicity, let's refer to countable sets as N and uncountable as R. We can define four functions:

```
f(x) -> y, where x, y ∈ N, for short f(N) -> N
f(x) -> y, where x, y ∈ R, for short f(R) -> R
f(x) -> y, where x ∈ N, y ∈ R, for short f(N) -> R
f(x) -> y, where x ∈ R, y ∈ N, for short f(R) -> N
```

AI is `f(N) -> N`, and it could replace us if we're also `f(N) -> N`.

To a large extent, our society operates under the assumption that we are indeed `f(N) -> N`. We believe we have a countable number of senses, we're very much oriented to knowing a countable number of facts, and we read instructional books that help us act in a countable number of ways in a countable number of situations.

I wrote a book about Angular a few years ago, so I produced a countable number of characters. We can define a function that writes the optimal book based on humans' collective understanding of an optimal book at a given time. If we are countable, our collective understanding would also be countable. The book's content is countable by definition, meaning AI could replace book authors.
Does that mean that we have just a few generations of book authors left, and after that, everything will be produced by AI? It depends if humans are `f(R) -> N` or `f(R) -> R`. The first means that AI will have to simplify the input in order to process it, and the second means that we're limiting ourselves by expressing ideas in writing. Limiting ourselves in writing is probably the beauty of it because our imagination can fill the gaps.

Many individuals believe humans are `f(R) -> R`. It is the foundation of many spiritual beliefs and religions. If we are `f(R) -> R` indeed, then the output produced by AI would sometimes feel dissatisfying because it'll be imprecise compared to the expectations of a human. Does this make AI impractical or a lost cause? I think that it does not. An output from a countable set is still large enough to provide an accurate estimation that is helpful to humans.

In conclusion, it's hard to say if AI will replace humans or which humans, but I can take a shot at guessing what kind of function would best model us. Imagine having AI as a friend or partner. It would likely be reliable and more deterministic than humans, but likely dissatisfying. Over time, AI and robotics researchers may increase the spectrum of the AI's inputs and outputs to make it an even closer approximation of a human. Still, my intuition says that's already a sign that we might be working over uncountable sets.
