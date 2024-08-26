---
author: minko_gechev
categories:
- Angular
- Web development
- Open source
date: 2024-08-25T00:00:00Z
draft: false
tags:
- Angular
- Web development
- Open source
title: Managing Angular
og_image: /images/managing-angular/gradient.webp
url: /2024/08/25/managing-angular
---

Over the past couple of years, I've been the product lead for Angular. In this article, I'd like to share how we've been managing the framework. Keep in mind this content lives on my personal blog for a reason - it represents my point of view and doesn't share a complete picture of all the processes within the team, such as people management, program management, etc. Also, that's the second time I'm writing this article. The first time, I wanted to be as descriptive as possible and stopped writing at about thirty pages, after which I deleted the content and decided to start over. Today, I'll keep it short with the caveat that I'll skip some important details and keep it on a high level.

## Vision

When I think of building a product, I often see it as a sequence of small steps that reach a certain global maximum. The global maximum represents the perfect product we want to build. The global maximum is a myth, though. You can think about it as a form in [Plato's Theory of Forms](https://en.wikipedia.org/wiki/Theory_of_forms) - there's a perfect product that we're aiming to approximate in the real world. To get there, we can either try to build the perfect thing with a single shot or approach the problem iteratively.

In engineering, there's often this [myth of the genius programmer](https://www.youtube.com/watch?v=0SARbwvhupQ). These 10x coders open their laptops and don't talk to anyone; they just write code for a couple of years, and the result is the perfect product that everyone wants to use. The real world doesn't always work this way, especially if we want to grow and keep a product reliable and stable over time. Software is complex and is built by teams. Team members need to communicate with each other. In addition to that, we're building software for our customers. If we don't talk to them, our vision will quickly become obsolete. By the time we're done, the market will have changed; thus, this perfect product will look different.

Our approach with Angular is to focus on a North Star—we want to enable developers to build web apps with confidence. The web framework that allows developers to build web apps confidently also varies over time. In the past ten years, we underwent many transformations, which means that we had to make adjustments while heading to this goal and update the goal itself. We make these adjustments in a constant feedback loop with developers, other framework authors, and product teams. More about requirements in the next section.

<img src="/images/managing-angular/gradient.webp" style="display: block; margin: auto;">
<p style="text-align: center;">Iterative approach to building a product</p>

We incorporate this iterative approach in our planning:

- We have documents that focus on the long-term vision - the next 3-5 years, and we use them as our North Star
- We have an annual strategy to make sure we focus on strategic work
- We have quarterly objectives in which we reevaluate what we're working on every three months

The way we think about our long-term vision document is an abstract representation of the perfect framework with our current understanding of the world. We use it as a North Star to guide us towards the framework that *enables developers to build web apps with confidence*. The vision is a living document because things change over time. Assumptions we're very confident about this quarter can change quickly. Significant disruptions, such as GenAI, also require reevaluating this strategy.

## Gathering requirements

People make decisions based on data or feelings. Most frequently, it's a combination of both. When we make decisions based on feelings, ego also comes into play. There are strong personalities who have an idea of what's good for the product. Research has shown that usually does not work<sup>[<a href="https://www.amazon.com/Good-Great-Some-Companies-Others/dp/0066620996">1</a>]</sup><sup>[<a href="https://www.amazon.com/Think-Again-Power-Knowing-What/dp/1984878107">2</a>]</sup>.

In Angular, we care about making web developers successful, so we listen, prioritize, and execute. It sounds simple, but it quickly gets complicated because of the dozens of requirements sources. Millions of developers constantly provide us feedback on GitHub, Discord, Reddit, HackerNews, X/Twitter, conversations at conferences, chats with GDEs, RFCs, developer surveys, industry trends and surveys, etc.

With this overwhelming amount of requirements sources, we try to distill what would be the most impactful for developers. There are lots of challenges here:

- How do we synthesize essential information and avoid getting lost in noise?
- How do we ensure we don't over-index certain developer populations?

A challenge that is often not obvious and hard to solve is ensuring we don't over-index specific developer populations. On average, the Angular team members have over ten years of experience in software development, so it comes naturally to us to target a more technical audience with the resources we provide. A different manifestation of this bias is only addressing issues reported on GitHub or X/Twitter. Mostly developers who are passionate about technology use these platforms, which could influence us in building a solution for this developer segment. This way we can ignore the hundreds of thousands of developers who just want to be productive at their jobs and don't participate in the same communities.

To ensure a more balanced perspective, we work on developing awareness of such biases and balance the developer audiences. For example, explicitly reach out to underrepresented groups and get their feedback. These could be educators, beginners, people from other engineering markets, etc. Other techniques we use are:

- Developer surveys with tens of thousands of participants. We analyze the open-ended answers with data analytics techniques or read them manually if we're interested in a particular topic. Depending on the distribution channels, these surveys could be less biased and allow us to validate assumptions.
- Working on developer studies that target a particular developer population. While working on a feature, we hire developers to complete an assignment that helps us validate approaches we're taking towards solving a certain problem.

## Alignment and decision making

We're consistently working on building alignment. The strategy documents above provide a sense of the team's common direction. We want to ensure a shared vision for Angular and its developer audience.

This doesn't necessarily mean every team member should see Angular from the same angle. That's unnecessary and could be counterproductive. For example, we have experts in tooling and others proficient in building UI components. Each of us is focused on a particular part of the product. All groups, though, should be aligned on who they are building for and the team's top priorities. For example, if the components team is unaware that server-side rendering is a priority, they wouldn't consider hydration in their implementation. When a team grows, it gets harder to maintain this alignment, so there need to be some intentional efforts.

That's why we also have folks operating on a higher abstraction level. Instead of being specialists in a particular aspect of the framework, they focus on overseeing the entire product and work on ensuring alignment. This structure doesn't necessarily imply any direction of the communication - I found it very important for the communication to be bi-directional. Engineers specializing in a particular aspect of the framework provide a crucial perspective that helps shape the product roadmap, People operating on a higher level of abstraction ensure the team is moving in a consistent direction and work on removing blind spots.

## Wrapping up

In this post we explored what managing Angular looks like from a bird's-eye view. A few important points are that evolving the product is an iterative process involving small steps toward a North Star. We adjust the position of the North Star frequently based on developer feedback, ensuring we get the least biased sample of requirements possible. We work on consistent alignment across the team to ensure we deliver a coherent product and move towards the North Star.

Keeping this article short, I skipped many other interesting points such as metrics, collaboration with partner teams, managing the product backlog, developing a long-term strategy, etc. If you're interested in any particular aspect of how we manage Angular, let me know in the comments. I'll share something here or on blog.angular.dev.

Until next time, and happy coding!
