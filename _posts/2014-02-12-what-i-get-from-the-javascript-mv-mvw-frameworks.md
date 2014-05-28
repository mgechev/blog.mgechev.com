---
title: 'What I get from the JavaScript MV* frameworks'
author: Minko Gechev
layout: post
permalink: /2014/02/12/what-i-get-from-the-javascript-mv-mvw-frameworks/
categories:
  - JavaScript
  - Object-Oriented Programming
  - Programming
  - Web development
tags:
  - Angular
  - Backbone.js
  - Ember.js
  - JavaScript
  - Object-Oriented Design
  - Object-Oriented Programming
  - Programming
---
<!-- Kudos 1.1.1-->

<div class="kudo-box kudo-c_tr" style="margin:0px px 30px 30px;">
  <figure class="kudo kudoable" data-id="660"> <a class="kudo-object"> <div class="kudo-opening">
    <div class="kudo-circle">
      &nbsp;
    </div>
  </div></a> 
  
  <div class="kudo-meta kudo-meta-660">
    <div class="kudo-meta-alpha kudo-hideonhover">
      <span class="kudo-count"></span> <span class="kudo-text">Kudos</span>
    </div>
    
    <div class="kudo-meta-beta kudo-dontmove">
      <span>Don't<br />move!</span>
    </div>
  </div></figure>
</div>

Why should I use JavaScript MVC, MVVM, MVP or simply MV**W**(**hatever works for you**)?

When I talk with people, who are beginners/intermediate in JavaScript I&#8217;m often asked this question. They are usually people who, until now, have used JavaScript only for making their website &#8220;fancier&#8221; &#8211; adding client-side form validation, creating carousel, checking whether a user already exists with simple Ajax request. When you start building something bigger (+10k lines of JavaScript) I truly believe that there are a few benefits from using such micro-architectural frameworks.

# Reusability

Each of the frameworks provides you two types of code reuse:

#### Boilerplates

Alright, jQuery takes care of some boilerplates as well, but these boilerplates are usually DOM/Ajax oriented. There&#8217;s nothing in the core of jQuery, which provides you two-way data-binding, for example. When you develop Single-Page web application you see that there are a lot of cases where you need to explicitly set the content of given DOM elements, or recompile template when some data changes. Frameworks like Ember.js and AngularJS do this for you!

#### Reuse of your own code

You have out-of-the-box Separation of Concerns. In each MV* framework you have Model and View. They both have their own responsibilities &#8211; the model is responsible for encapsulating your domain specific models (in case of twitter &#8211; Tweet, User), on the other hand the view is responsible for showing the model (and eventually handling events, it depends on the framework). This means that your model is not coupled with its representation and eventually can be easily reuse it in different project. In this type of code reuse, usually you cannot reuse as much source code, across your projects, as in the case of boilerplates but you still have it, without any extra work.

# Level of abstraction

Each framework provides you a higher level of abstraction, which allows you to handle more complex applications. Try to build something large without any framework and you will find yourself dividing the code into different coherent modules, trying to decouple them as much as possible. Probably you will end up with something like [this module architecture][1]. Of course, if you don&#8217;t follow any guidelines for good OO design (explicitly or implicitly), it is very likely to end up with large bunch of spaghetti.

# Testability

Most of the MV* frameworks are build with testing in mind. For example, in AngularJS you have Dependency Injection, which allows you to mock given service quite easily. You don&#8217;t need monkey patching anymore! One of the drawbacks of the module architecture, which was referred above, is its hard testability.

# Implicit conventions

JavaScript is weird. It doesn&#8217;t tell you how you should write your code. You can use functional style, procedural style, OO style. There&#8217;s a lack of many of the tools available in languages like Java and C#. You don&#8217;t have namespaces, you even don&#8217;t have a single way for creating objects. You can create object by using the object literal:

<pre lang="javascript">var obj = { foo: 42 };
</pre>

or the module pattern

<pre lang="javascript">var obj = (function () {
  var bar = 42;
  return {
    foo: bar
  };
}());
</pre>

or constructor function

<pre lang="javascript">function Foo() {
  this.foo = 42;
}
var obj = new Foo();
</pre>

&#8230;If you have team with 15 JavaScript developers and each of them has his own opinion how JavaScript should be used you are in big troubles. MV* frameworks give you strict guidelines for how you should organize your code. Each of the developers will be forced to use &#8220;the Angular way&#8221;, &#8220;the Backbone way&#8221;, or whatever way your project uses.

# Conclusion

Why not to create a custom framework and build my applications with it? First, you already have pretty good solutions, which are build by great developers and tested by hundreds others. Second, if your team is dynamic you will increase the learning curve for the new developers who are joining your team. Each of them should spend time studying your problem domain, your proprietary framework and your existing code base.

 [1]: http://www.slideshare.net/nzakas/scalable-javascript-application-architecture