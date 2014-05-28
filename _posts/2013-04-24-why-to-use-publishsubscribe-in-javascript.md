---
title: Why I should use publish/subscribe in JavaScript
author: Minko Gechev
layout: post
permalink: /2013/04/24/why-to-use-publishsubscribe-in-javascript/
categories:
  - JavaScript
  - Object-Oriented Programming
  - Patterns
  - Programming
tags:
  - Application architecture
  - Design patterns
  - JavaScript
  - Modules
  - 'MV*'
  - MVC
  - MVP
  - MVVM
  - Programming
  - Publish/Subscribe
---

This post is inspired by <a href="http://stackoverflow.com/questions/13512949/why-would-one-use-the-publish-subscribe-pattern-in-js-jquery/13513915#13513915" target="_blank">my answer at StackOverflow</a>.

So why we should use publish/subscribe? Why it is useful? Is it making our work harder or it makes our application better?

And the answer&#8230;

It&#8217;s all about loose coupling and single responsibility, which goes hand to hand with MV* (MVC/MVP/MVVM) patterns in JavaScript which are very modern in the last few years.

<a href="https://en.wikipedia.org/wiki/Loose_coupling" target="_blank">Loose coupling</a> is an Object-oriented principle in which each component of the system knows it&#8217;s responsibility and don&#8217;t care about the other components (or at least tries to not care about them as much as possible). Loosing coupling is a good thing because you can easily reuse the different modules. You&#8217;re not coupled with the interfaces of other modules. Using publish/subscribe you&#8217;re only coupled with the publish/subscribe interface which is not a big deal &#8211; just two methods. So if you decide to reuse a module in different project you can just copy and paste it and it&#8217;ll probably work or at least you won&#8217;t need much effort to make it work.

As talking about loose coupling we should mention the <a href="https://en.wikipedia.org/wiki/Separation_of_concerns" target="_blank">separation of concerns</a>. If you&#8217;re building an application using MV* architectural pattern you have always a Model(s) and a View(s). The Model is the business part of the application. You can reuse it in different applications, so it&#8217;s not a good idea to couple it with the View of a single application, where you want to show it, because usually in the different applications you have different views. So it&#8217;s a good idea to use publish/subscribe for the Model-View communication. When your Model changes it publish an event, the View catch it and update itself. You don&#8217;t have any overhead from the publish/subscribe, it helps you for the decoupling. In the same manner you can keep your application logic into the Controller for example (MVVM, MVP it&#8217;s not exactly a Controller) and keep the View as simple as possible. When your View changes (or the user click on something, for example) it just publish a new event, the Controller catch it and decides what to do. If you are familiar with the <a href="https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller" target="_blank">MVC</a> pattern or with <a href="https://en.wikipedia.org/wiki/MVVM" target="_blank">MVVM</a> in the Microsoft technologies (WPF/Silverlight) you can think for the publish/subscribe like the <a href="https://en.wikipedia.org/wiki/Observer_pattern" target="_blank">Observer pattern</a>. This approach is used in frameworks like Backbone.js, Knockout.js (MVVM).

Here is an example:

<pre lang="JavaScript">//Model
function Book(name, isbn) {
    this.name = name;
    this.isbn = isbn;
}
   
function BookCollection(books) {
    this.books = books;
}
    
BookCollection.prototype.addBook = function (book) {
    this.books.push(book);
    $.publish('book-added', book);
    return book;
}
    
BookCollection.prototype.removeBook = function (book) {
   var removed;
   if (typeof book === 'number') {
       removed = this.books.splice(book, 1);
   }
   for (var i = 0; i &lt; this.books.length; i += 1) {
      if (this.books[i] === book) {
          removed = this.books.splice(i, 1);
      }
   }
   $.publish('book-removed', removed);
   return removed;
}
    
//View
var BookListView = (function () {
 
   function removeBook(book) {
      $('#' + book.isbn).remove();
   }
 
   function addBook(book) {
      $('#bookList').append('<div id="' + book.isbn + '">
  ' + book.name + '
</div>');
   }
  
   return {
      init: function () {
         $.subscribe('book-removed', function (book) {
             removeBook(book);
         });
         $.subscribe('book-aded', function (book) {
             addBook(book);
         });
      }
   }
}());
</pre>

Another example. If you don&#8217;t like the MV* approach you can use something a little different (there&#8217;s an intersection between the one I&#8217;ll describe next and the last mentioned). Just structure your application in different modules. For example look at Twitter.

<img src="http://blog.mgechev.com/slides/javascript-patterns/images/twitter.png" width="650" class="aligncenter" />

If you look at the interface you simply have different boxes. You can think of each box as different module. For example you can post a tweet. This action requires update of few modules. Firstly it has to update your profile data (upper left box) but it also has to update your timeline. Of course, you can keep references to both modules and update them separately using their public interface but it&#8217;s easier (and better) to just publish an event. This will make the modification of your application easier because of loosing coupling. If you develop new module which depends on new tweets you can just subscribe to the &#8220;publish-tweet&#8221; event and handle it. This approach is very useful and can make your application very decoupled. You can reuse your modules very easy.

Here is a basic example of the last approach (this is not original twitter code it&#8217;s just a sample by me):

<pre lang="JavaScript">var Twitter.Timeline = (function () {
   var tweets = [];
   function publishTweet(tweet) {
      tweets.push(tweet);
      //publishing the tweet
   };
   return {
      init: function () {
         $.subscribe('tweet-posted', function (data) {
             publishTweet(data);
         });
      }
   };
}());

var Twitter.TweetPoster = (function () {
   return {
       init: function () {
           $('#postTweet').bind('click', function () {
              var tweet = $('#tweetInput').val();
               $.publish('tweet-posted', tweet);
           });
       }
   };
}());
</pre>

For this approach there&#8217;s very good talk by <a href="http://www.nczonline.net/" target="_blank">Nicholas Zakas</a>. For the first MV* approach the best articles and books, I know, are published by <a href=" http://addyosmani.com/blog/" target="_blank">Addy Osmani</a>.

Drawbacks. You have to be careful about the excessive use of publish/subscribe. If you&#8217;ve got hundreds of events it can become very confusing to manage all of them. You may also have collisions if you&#8217;re not using namespacing (or not using it in the right way). An advanced implementation of mediator which looks much like an publish/subscribe can be found here https://github.com/ajacksified/Mediator.js. It has namespacing and feature like event &#8220;bubbling&#8221; which, of course, can be interrupted. Another drawback of the publish/subscribe is the hard unit testing, it may become difficult to isolate the different functions in the modules and test them independently.