---
title: Advanced JavaScript at Sofia University
author: Minko Gechev
layout: post
permalink: /2013/10/24/advanced-javascript-in-sofia-university/
categories:
  - Computer science
  - Education
  - FMI
  - JavaScript
  - Node.js
  - Programming
  - Talks
tags:
  - Ajax
  - Algorithms
  - AngularJS
  - Computer science
  - Development
  - Education
  - HTML5
  - Internet
  - JavaScript
  - localStorage
  - OpenSource
  - Programming
  - vnc
---

In this blog post I&#8217;ll tell few words about the course Advanced JavaScript which Georgi Penkov, Evgeni Kunev and me are leading this semester in <a href="http://fmi.uni-sofia.bg/" target="_blank">Sofia University</a>.

I was included as a lecturer in it after my project for Practical Programming with Perl (<a href="http://plainvm.mgechev.com/" target="_blank">plainvm</a>) which is created by Georgi Penkov. The idea behind the course is not to concentrate on the syntax of JavaScript but to introduce to the students different modern technologies. It is not concentrated only on the front-end development but there are also few planned lectures about Node.js. My role in this course is more as frontender than as Node.js ninja so I can tell few words about the front-end topics I plan to cover. The program for the course is a bit dynamical. Since we planned it a lot of things in the JavaScript world changed. The JavaScript landscape changes very fast so we should be able to response to these changes as quickly as possible.

Of course, we started with short introduction to the language. Most of the students had previous experience with Java/C++ so they weren&#8217;t familiar with prototypical language such as JavaScript. In the introduction lectures we talked about the functional scope, prototype inheritance, while giving examples with some relatively new features of the languages included in ECMAScript 5. For instance we talked about `Object.defineProperty`, `Object.create`, `Object.getPrototypeOf` and so on. Of course we mentioned Kangax&#8217;s ES5 (and 6) compatibility table(s). As contrast to the standard semantics of `var` we mentioned the keyword `let` from ES6&#8230;I think you got the main idea about our introduction.

After the intro I told few words about Class.js by John Resig. Here is my <a href="http://jsfiddle.net/mgechev/mqDzx/4/" target="_blank">example</a>. Most of the students were familiar with CSS so we directly implemented the CSS3 transitions in this fancy maze.

Next lectures were about HTML5. The HTML5 File API was covered and there were some examples. Since web workers is something which looks quite cool we made few examples with it too. For instance &#8211; simple graphical editor which uses web workers for the application of complex filters to the image.

After we finish with HTML5 and the front-end JS we are going to concentrate on Node.js. Demo I plan to make for this part of the course is my simple <a href="https://github.com/mgechev/js-vnc-demo-project" target="_blank">VNC implementation in 200 lines of code</a>. I think this is something which will be interesting to the students and make them try to use JavaScript for some not that trivial things.

I will keep the rest of the course in secret but as a hint &#8211; I have plans to cover tools and technologies like <a href="http://gruntjs.com/" target="_blank">Grunt.js</a>, <a href="http://yeoman.io/" target="_blank">Yeoman</a>, <a href="http://backbonejs.org/" target="_blank">Backbone.js</a> (AngularJS will take 1/3 of the course to be covered&#8230;).

Of course we cannot cover all of these cool things in depth, they&#8217;ll be shallowly explained. Anyway, even if we cover them deeply nobody will be able to remember the whole API of all of the new technologies which are being invented every day. Instead of spending our time in telling the whole API (which can be found in the documentation) we will mention when these technologies are useful, when you should choose one technology instead of another.

I hope the course will be as cool as we plan, during the whole semester! I also hope that the students will appreciate our efforts and enthusiasm and ask us tricky questions!