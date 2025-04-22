---
author: minko_gechev
categories:
- Reactivity
- LLMs
- Web frameworks
date: 2025-04-19T00:00:00Z
draft: false
tags:
- Reactivity
- LLMs
- Web frameworks
title: LLM-first Web Framework
og_image: /images/revolt-llm/banner.jpg
url: /2025/04/19/llm-first-web-framework
---

<div style="padding: 15px; border-radius: 5px; background-color: #fff4da; border: 1px solid #ffe88c;">
The opinions stated here are my own, not necessarily those of my employer.
</div>

Over the past few weeks I've been thinking about how we can make a framework easier for AI. In particular I've been *only* focused on building user interface. When we add a backend, database, and communication protocol across the backend and the frontend, we get another set of problems that could be a good fit for another post and exploration.

Looking at the current landscape of platforms for "vibe coding" I see two main problems:

- Mismatch of API versions. Often the LLM will generate code that uses deprecated or missing APIs from previous versions. I see that across the board with all frameworks since they all use versions and deprecate APIs.
- Lack of substantial training data. If you're using a framework that's not as popular or has new APIs that the LLM is not familiar with yet, you will likely get a dissatisfactory output. Frameworks such as Angular and React often are not too impacted here due to abundance of training data. You can still see this manifest for new APIs that are not widely used and documented yet.

<div style="padding: 15px; border-radius: 5px; background-color:rgb(241 255 240); border: 1px solid #e9e9e9;">
You can find the code from this experiment <a href="https://github.com/mgechev/revolt-llm">on GitHub</a>.
</div>

There are a variety of solutions to these problems. For example:

- We can use the context window to provide relevant examples of the latest APIs
- We can also use RAG to augment the output with the latest documentation
- If we have money redundancy...we can fine-tune the model

I decided to solve these problems by building a framework!

## Design decisions

The LLM-first framework I created has the following design:

- **Minimal versus expressive syntax**. It has orthogonal APIs that complement each other and there's a single way of doing things. This could potentially make building apps with it more verbose, but there's less for the LLM to "learn" and "know."
- **Familiar versus novel**. Decided to use very basic syntax, hoping to leverage the LLM's preexisting training data. For example, templating uses JavaScript object literals. There are a lot of them on GitHub and they have structural similarity to JSON.
- **Fine-grained reactivity**. Why not enable generation of fast apps by default!

I based this LLM-first framework on [Revolt](https://blog.mgechev.com/2025/01/09/minimal-reactive-framework/) with one major change - the framework gets all text node and attribute values by invoking a getter function. This way, the framework accesses reactive and static values in the same way.

For example instead of specifying the value of the text node and the style attribute as text values, I'd use functions.

```typescript
const HelloWorld = () => {
  return {
    name: "div",
    children: () => "Hello, World!",
    attributes: {
      style: () => "color: red;"
    }
  };
};
```

This makes it easier for the LLM to produce working code. It doesn't have to "understand" the difference between a static and reactive value.

## Revolt LLM

I had a few spare hours and built a "vibe coding" platform that generates Revolt apps.

You can find the source [code on GitHub](https://github.com/mgechev/revolt-llm/tree/main).

Here's a quick demo video:

<iframe width="100%" height="400" src="https://www.youtube.com/embed/hphNsJkfrSM?si=DmBTC8RNkrtCV7H1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

The first (and only) draft of the system prompt I came up with:

```txt
You are a senior web developer who is expert in using signals in JavaScript. Create an application
based on a user prompt. For the purpose, use the framework and the examples of apps implemented in
this framework below:

// Framework implementation

// A couple of basic component examples

// Todo example, intentionally skipped

// Tetris example, intentionally skipped

Output the application as syntactically correct and executable JavaScript and will render the app on the screen.
All the styles of the application should be inlined under the style attribute of each element.
Use a dark theme for all the applications you generate.

Give your output in the format:
<revolt-response>
<revolt-explanation>
Explanation in up to 3 sentences and without any newlines
</revolt-explanation>
<revolt-code>
The code
</revolt-code>
</revolt-response>

For example:
<revolt-response>
<revolt-explanation>
Here is a simple hello world app
</revolt-explanation>
<revolt-code>
const HelloWorld = () => {
  return {
    name: "div",
    children: () => "Hello, World!",
    attributes: {
        style: () => "color: red;"
    }
  };
};
render(HelloWorld(), document.body);
</revolt-code>
</revolt-response>

All future prompts will be from the user in the format:
User prompt: <prompt>
```

In Revolt LLM, I decided to keep chat history for the past two prompts and responses to provide a little extra context to the LLM. This works well for flows such as:

```txt
> User: Create a todo app
> LLM: [output]
> User: Change the color of the delete button to red
> LLM: [output]
```

In the example above, in addition to the "Change the color..." prompt, the LLM will also receive the previous prompt and output it produced.

As a quick recap: Revolt LLM solves the API version consistency issue in LLM-based code generation by providing a small-enough framework that we can pass in the context window.

That's not the solution I'd recommend for a few reasons, for example the lack of interop with the existing ecosystem. I can see how this approach can benefit minimalistic frameworks such as Preact which also have an interop layer with React.

That's all I had for today. Let me know if you have any thoughts in the comments :).
