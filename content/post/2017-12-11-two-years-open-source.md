---
author: minko_gechev
categories:
- Open source
- People
- Technology
date: 2017-12-11T00:00:00Z
draft: true
tags:
- Open source
- People
- Technology
title: Two Years Open Source.
url: /2017/12/11/two-years-open-source/
---

This time I'll violate my principle to write only about purely technical topics in my blog. In the next a couple of paragraphs I'll talk about open source software from a very personal perspective. I'll explain why I love doing open source and why I'd recommend more people to contribute to already existing projects or start their own.

I'll start by explaining what open source software is and after that I'll discuss it's bright sides and dark corners...

I'll then discuss what's the impact of the open source projects on a more global level. For each section, I'll give concrete examples from my own career to support my statements.

*Keep in mind that you don't need any technical background to continue reading this article. All the concepts are (should be) well explained. If anything sounds unfamiliar to you, this is my mistake and I will fix it as soon as possible. To let me know, please comment below or drop me an email.*

# Introduction

What is open source software? There are numerous of definitions online. For instance, here's one:

>Open-source software (OSS) is computer software with its source code made available with a license in which the copyright holder provides the rights to study, change, and distribute the software to anyone and for any purpose.

In this specific article, I'll discus open source into the context of the one of the least restrictive licenses out there - the MIT license.

In short, open source software means a program or a module which is publicly available. You provide it to the world for free. You release not only the software itself but also its source code. You can think of the source code as the list of instructions which you've typed in your text editor in order to make the computer do something. This will allow everyone else with some technical knowledge to copy this software, to modify it, to distribute it by their own, to build it, to use it, to sell it (yes, that's possible), to teach people how to use it...It allows everyone to do anything they want with your software! With your work.

## Giving your work for free...

*In the beginning I mentioned that I'd want to encourage people to contribute to open source software. Well, unfortunately open source, just like anything else, is not all sunshines and rainbows. In the next paragraphs I'll discuss some of the disappointment that I've faced over the years. I think that it'll be easier to set the right mindset, expectations and balance if you're familiar with some of the dark sides from the beginning.*

Giving your work for free. I know this sounds very absurd to a lot of people. Work requires resources, like time, food, water, etc. and these resources are not given to you for free. Why would you waste them for doing work which in the end won't provide equivalent or higher financial outcome? Why would you give your work for free? This is a mind gap that a lot of people cannot cross.

And the truth is that although there are some open source projects out there which are making money, in the general case, if you are a developer working only on open source, you won't make anything. Again, there are exceptions such as a handful of people working on the Linux Kernel, people working on .NET, or Angular, or VSCode, or TypeScript, etc. However, if you're a developer who spends their time only in maintaining open source projects and creating such, without an organization supporting them, the chances are that you're going to starve.

On the other hand, there are a lot of developers and corporations who are using a lot of open source software and they are making money out of that. In the end, the open source is coming for free, isn't it? Anyone can use it. Then why a corporation should pay their developers to work on something when it already exists?

## Guilt and Burnouts

I already mentioned that when you're doing open source in your spare time you're generally working for free. In fact, not only working for free but making money for companies using your projects!

Well, that's not the worst. **You're not only giving your spare time without getting paid but also everyone who's using your projects thinks that you're obligated to do so!**

I've had a lot of angry people using my projects who have shouted at me because I haven't solved their work problem during my weekend. I've gotten a lot of anger and a lot of hatred through open source...and this is definitely stressful. A lot of engineers doing open source have discussed this problem and shared their stories. A lot of very smart engineers have completely left the open source world because of that.

**Often getting pressured from people, you feel obligated to solve their problems. You feel guilty if you don't.** You feel guilty if you don't work on your open source software over the weekend, because there are people who want more features or who have found a bug.

There's no easy cure for this. My only suggestion would be [this](https://www.youtube.com/watch?v=9v99hclktVA).

This way, at some point, you feel yourself into a magical circle. You're spinning like a hamster, constantly trying to catch up and make people happy. At some point working on your toy projects are not fun anymore. You just fight with issues and everyday, little by little, your enthusiasm dies.

This is how you **burnout**.

People often state that burnouts happen when you take more work that you can handle. I'm not certain that this statement is correct. I burnout when I face similar problems over and over again and I don't feel like I am doing any progress. I've experienced this with a few of my work and open source projects. **The best solution for burnouts that I have found is to start something new. Something fun!**

These were some of the negatives of working on open source projects. Did I melt even the tiniest enthusiasm you had to start something by your own? Well, do not give up yet. There are also a lot of benefits. Not only personal but also global! Bear with me for a little while!

# Professional Development

Now lets focus on the positive aspects behind the open source software. There are hundreds, maybe thousands of engineers involved in open source projects, so obviously, there should be such!

## Learning Experience

There are millions of open source projects out there. Thousands of them are very high quality and they are on variety of topics - starting from simple documents with collections of useful resources, to components for user interface, compilers, neural networks, renderers for virtual reality, etc. All of this is out there, open source. **You can dig into the source code and explore this concentrated knowledge**! There's so much wisdom there, staying a few clicks away from you! I've read the source code of hundreds of projects, from components for user interface to compilers and source code optimizers.

In fact, I got passionate about compilers after I read the implementation of the expression evaluator of AngularJS. After that, I wrote my publication "[AngularJS in Patterns](https://github.com/mgechev/angularjs-in-patterns)" which got a lot of popularity in the community and got translated to Chinese, Japanese, Russian and French. Later, I learned more about type systems from the TypeScript's type checker.

A lot of people learn best when they see the abstract theoretical concepts applied in practice. Well, good news. Everything you've studied in your computer science degree has already been applied in projects which source code is published on GitHub!

## Practical Working Experience

The code is already out there so you can read it but not only...A lot of open source licenses are very open! You can not only read the code - you can download it, play with it, modify it...even release similar product with improvements or changed functionality, or even better, contribute back!

Contributing back to the open source community is maybe the best thing one can do. It's extremely convenient for beginners. This way you don't get pressure from the people using the project. You just contribute whenever you find time.

How does the contribution work? Well, imagine you find open source project and you're really interested in the problem that it solves. You find an issue in the project, or you open its issue tracker and find already reported one. Since you're interested in the problem domain, you can go through the project's source code and find out how it works and fix the issue. This is not necessarily easy, it strongly depends on the project and the problem it solves.

In case we want to get involved into a mature and technically complicated project, the reality is that we'll have to dig into its source code for days, maybe even weeks until we figure out how it works. The good news is that if you don't have that time you can contribute to the project's documentation instead. Trust me, such contribution will be greatly appreciated. A lot of the beginners in the open source community have started exactly with documentation. If, however, you want to get involved into something technically challenging **do not get afraid to ask questions and to get your hands a little dirty**. Do not think that everyone else contributing to the project's codebase is a genius. These people just have a lot of domain knowledge which helps them to advance easier. Keep in mind that these people are almost always willing to assist new comers who want to help!

This way, by contributing to already existing projects you get a lot of working experience. But why does it matter? Don't you get the same in your daily job? Well, the difference is that in open source you can choose with who you want to work, on what projects you want to work. For instance, if you're a developer you've most likely heard about the book "Design Patterns - Elements of Reusable Object-Oriented Software". Did you  know that the team lead of VSCode is [Erich Gamma](https://en.wikipedia.org/wiki/Erich_Gamma)? Yes, you have the chance to work together with a legend by contributing to VSCode! There are plenty of other similar examples out there...[Anders Hejlsberg](https://en.wikipedia.org/wiki/Anders_Hejlsberg), the lead architect of C#, is working on TypeScript. One of the creators of Unix, [Ken Thompson](https://en.wikipedia.org/wiki/Ken_Thompson), is working on Go. And yes, [Linus Torvalds](https://en.wikipedia.org/wiki/Linus_Torvalds) is still very actively involved with Linux.

You and the guy who has created Unix working on the same project! Have you ever thought it's possible? Well, open source can give you this opportunity.

Imagine how much things you can learn by getting a code review from Ken Thompson or any other of the guys from the Go team at Google! And you get this knowledge for free! You are sacrificing your time to help the open source maintainers with their project...and they help you back! This is how powerful open source software is!

I've had similar struggles. Because of my active contributions to the AngularJS community, I was invited to write a book about Angular (a new framework inspired by AngularJS). At that time Angular was still work in progress. The only source for my book was the framework's source code. This is how I started contributing to Angular. There I had the chance to work with a lot of very smart people with very strong technical experience.

I had the opportunity to get technical reviews from Miško Hevery, the creator of AngularJS and Angular, and other engineers from the Angular team. Later, I had the privilidge to get technical review from him for my book - "[Switching to Angular](https://www.amazon.com/Switching-Angular-version-Googles-long-term/dp/1788620704)".

## Popularity and Reputation

We already made it clear that open source can be a great source of wisdom. Having the chance to work with the best software engineers out there, [Turing Award](https://en.wikipedia.org/wiki/Turing_Award) winners, etc. That's not the only direction the open source software could be helpful, though. It can also increase your recognition and reputation in your community.

As I mentioned, corporations often use open source projects because they usually come for free and save a portion of the budget. Imagine you're one of the contributors to a popular technology. You're *one of the people working on this library*. You know the roadmap, you know every corner case in the codebase. You're definitely a domain expert. If the project's popularity grows, your reputation and popularity grows as well.

Over the past 2-3 of years I've been contributing to a lot of open source projects, mostly Angular related. For this time, my followers on GitHub grew from below 100 to over 3.7k! I got tens of thousands of stars on projects I created. Some of my open source projects have over 1.3 million downloads per month! Over the past 2-3 years I've given over 45 technical talks on worldwide conferences in locations such as: Las Vegas, Germany, UK, The Bahamas, Salt Lake City, Russia and many others. Over the past 2 years, I've flown over 200,000 km.

I've had a job interview where my interviewers told me - "Hey, do you know that we're using your Angular seed project in production? Also, we run codelyzer in our CI!". That was pretty cool. I'll give more such examples in the last section of the post.

## Friendship

I've heard a lot of people saying: "**It's not about the software, it's about the people.**".

It really is. I've found some of my best friendships around open source projects that I've either developed or contributed to. One of the best communities I've been in is the one around the Angular project. This community is always welcoming, positive, with a lot of bright people you can share ideas with.

In the over 45 conferences I've spoken on in the last 2 years, I met hundreds of people and made friends from tens of countries, including but not limited to: Germany, Russia, Bulgaria, UK, USA, Canada, China, Japan, Taiwan, Spain, Colombia, Brazil, France, Serbia, Greece, Italy, Sweden, Netherlands, etc.

## Finding your Dream Job!

A lot of open source projects are maintained by very attractive companies. For example, Google has a bunch of open source projects in a lot of domains - from user interface to machine learning. Facebook is pretty much the same, together with Microsoft and many others.

Have you ever wanted to have a job in any of these companies? Well, contributing to their open source projects can provide you such opportunity! Of course these companies will prefer to hire a person they have worked with, person who has shown that has the knowledge and skills to do a job, compared to a random candidate who the HR department has found on LinkedIn.

Contributing to Angular and developing tools for developers around the framework I got the opportunity to join the team remotely and work from Bulgaria. I cannot explain the excitement I felt when I got the offer. I had the opportunity to work with some of the most talented engineers in a project which has enormous social impact!

Thanks to the open source contributions I've gotten other dream job offers. I'd be happy to clone myself a few times to be able to enjoy all of them.

In my current professional venture, I'm co-founder and CTO at rhyme.com. I met the CEO of the company thanks to my blog, where I was open sourcing my knowledge. He messaged me because he found an article I wrote about functional programming with JavaScript. Our engineering team is almost entirely built from people I know from the open source community, people I've worked indirectly with.

# Why your contributions matters?

I cannot think of many other ways where your work can have such a global impact so quickly. The duration between you, pushing your fix to an open source project, to your contribution affecting millions of people can be in the range of a couple of minutes!

There are very popular projects out there. Projects with millions of downloads per day. Imagine you take a popular open source project and make it more efficient. The chances are that this project runs in millions of computers all around the world. Since the execution of the software would have gotten more efficient the users will have more satisfying experience and even the energy consumption of the user's device will drop!

This may sound a bit artificial though. We cannot realistically measure the global impact we get with our open source projects sometimes. It's just hard to imagine.

Often, however, I get more personal experience with people using my projects. Of course, I mentioned the negativity from time to time. Fortunatley, the negativity is an exception. I've gotten hundreds of messages from people thanking me for making their life easier, or happier with my projects. The feeling after such message, it's unique. You feel that your work, even your existence actually matter.

Jim Carrey had an [amazing speech](https://www.mum.edu/whats-happening/graduation-2014/full-jim-carrey-address-video-and-transcript/) in which he said:

> How will you serve the world? What do they need that your talent can provide? That’s all you have to figure out. As someone who has done what you are about to go do, I can tell you from experience, the effect you have on others is the most valuable currency there is.

# Recognitions

Although the knowledge, experience and personal satisfaction that you get when helping others while doing what you love is hard to describe, it's even better when you get recognized from your peers.

I've had the honor to receive the Google's Peer Bonus for my open source contributions to valuable projects. Earlier this year, the President of the Republic of Bulgaria gave me two awards:

- Diploma "John Atanasoff" for my active contributions in the areas of software engineering and computer science, my public lectures, publications and others.
- Diploma "John Atanasoff" for a project with big social impact.

As the only laureate with two awards in the history of the the "John Atanasoff" award, for me this was a dream coming true.

# Conclusions


