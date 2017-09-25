---
author: minko_gechev
categories:
- AngularJS
- Aspect-Oriented Programming
- Computer science
- Development
- Internet
- JavaScript
- Object-Oriented Programming
- Patterns
- Programming
- Programming languages
date: 2013-08-07T00:00:00Z
tags:
- AngularJS
- aop
- aspect-oriented programming
- Computer science
- Development
- Internet
- JavaScript
- Programming
- programming languages
- Projects
title: Aspect-Oriented Programming with AngularJS
url: /2013/08/07/aspect-oriented-programming-with-javascript-angularjs/
---

In the following blog post I&#8217;ll write few words about what is Aspect-Oriented Programming, why I think it will be useful in AngularJS and I&#8217;m also going to give you a short tutorial for using a <a title="GitHub" href="https://github.com/mgechev/angular-aop" target="_blank">simple AOP framework I&#8217;ve developed</a>.

First things first. What is AOP? As we all know OOP is awesome! It gives us many tools for making our development process simpler. Its core principles are Abstraction, Encapsulation, Inheritance and Polymorphism.

Abstraction helps us build complex applications without thinking for all details. We just &#8220;find&#8221; the correct level of abstraction for the current phase of development and use it until it&#8217;s useful for us. For example when we develop complex OS the first (or one of the first) levels of abstraction, I guess, will include creating a facade for all different hardware platforms but after that the hardware differences wont matter for us and we&#8217;ll use higher level interface.

Encapsulation and abstraction are complementary concepts. Encapsulation gives us more details about the implementation behind the visible interface which is our abstraction of the given class or object.

Inheritance gives us code reuse, and polymorphism gives us a common way of handling different instances of different classes in the same hierarchy (and few more things but let&#8217;s stop here).

But what we don&#8217;t have?

Let&#8217;s define the concept of cross-cutting concern:

<blockquote cite="https://en.wikipedia.org/wiki/Cross-cutting_concern">
  <p>
    In computer science, cross-cutting concerns are aspects of a program that affect other concerns. These concerns often cannot be cleanly decomposed from the rest of the system in both the design and implementation, and can result in either scattering (code duplication), tangling (significant dependencies between systems), or both.
  </p>
</blockquote>

The most common examples for cross-cutting concerns are logging, authentication and transactions.  
Let&#8217;s focus in logging. We may need to log different informations when different methods are called. That means we should have things like:

{{< highlight javascript >}}function foo() {
  Logger.log('log before');
  //body
  Logger.log('log after');
}{{< / highlight >}}

If we change the interface of our logger we should change it everywhere, this may affect hundreds of different files.  
The situation can become even more complex if we add authentication:

{{< highlight javascript >}}function foo() {
  try {
    Authotization.isAuthorized();
    //body
  } catch (e) {
    //handle the error
  }
}{{< / highlight >}}

It may look ok for one or few functions/methods but if their count increase you can shoot yourself in the foot with so many duplicates.  
OOP don&#8217;t gives us tools for handling such problems. It may suggest to create few helper classes and just copy and paste pieces of code from one place to another.

In AOP we have few more concepts: joint-point &#8211; this is place where something happen. For example call of procedure, return of result by a function, throw of exception, call of constructor, etc.

We have also pointcuts. Pointscuts help us describe one or more joint-points. The last concept I&#8217;ll define are the advices. They are pieces of code which will be executed in given moment (when joint-points is encountered during the program runs).

To show you how AOP can be useful in AngularJS let me introduce you <a title="GitHub" href="https://github.com/mgechev/angular-aop" target="_blank">AngularAOP</a>.

## AngularAOP

You can define the cross-cutting concerns in separate services. For example here is a definition of logging service which logs the method calls and thrown exceptions:

{{< highlight javascript >}}DemoApp.factory('Logger', function () {
    return function (args) {
        if (args.exception) {
            console.log('%cException: ' + args.exception.message + '. '
                + args.method + ' called before proper authorization.',
                'color: red; text-weight: bold; font-size: 1.2em;');
        }
        var throwData = (args.exception) ? ' and threw: ' + args.exception.message : '';
        console.log('Method: ' + args.method + ', Pointcut: ' + args.when + ', with arguments: ' +
                    angular.toJson(args.args) + throwData);
    };
});{{< / highlight >}}

The definition of that service doesn&#8217;t differ from the usual service definition.  
Here is definition of one more service which can cause problems with the code maintenance because it is a cross-cutting concern:

{{< highlight javascript >}}DemoApp.factory('Authorization', function (User) {
    return function () {
        if (User.getUsername() !== 'foo' &#038;&#038;
            User.getPassword() !== 'bar') {
            throw new Error('Not authorized');
        }
    };
});{{< / highlight >}}

The given service just checks whether user&#8217;s user name and password are equal respectively to &#8220;foo&#8221; and &#8220;bar&#8221;, if they are not equal to these values the service throws an Error(&#8216;Not authorized&#8217;).

We may want to apply authorization for reading news:

{{< highlight javascript >}}DemoApp.service('ArticlesCollection', function ($q, $timeout, execute, Logger, Authorization) {

    var sampleArticles = [
            { id: 0, title: 'Title 1', content: 'Content 1' },
            { id: 1, title: 'Title 2', content: 'Content 2' },
            { id: 2, title: 'Title 3', content: 'Content 3' }
        ],
        privateArticles = [
            { id: 3, title: 'Title 4', content: 'Content 4' },
            { id: 4, title: 'Title 5', content: 'Content 5' }
        ],
        api = {
            loadArticles: function () {
                var deferred = $q.defer();
                $timeout(function () {
                    deferred.resolve(sampleArticles);
                }, 1000);
                return deferred.promise;
            },
            getArticleById: function (id) {
                for (var i = 0; i < sampleArticles.length; i += 1) {
                    if (sampleArticles[i].id === id)  {
                        return sampleArticles[i];
                    }
                }
                return undefined;
            },
            getPrivateArticles: function () {
                return privateArticles;
            }
        };
    return api;
});{{< / highlight >}}

This is simple service which contains two kinds of articles (simple object literals): sampleArticles and privateArticles. The api object is the actual service public interface.

We may want to apply authorization to the private articles, before the getPrivateArticles method return its result. The usual way to do it is:

{{< highlight javascript >}}getPrivateArticles: function () {
    Authorization();
    return privateArticles;
}{{< / highlight >}}

We may also want to apply authorization to the getArticleById method, so:

{{< highlight javascript >}}getArticleById: function (id) {
    Authorization();
    for (var i = 0; i < sampleArticles.length; i += 1) {
        if (sampleArticles[i].id === id)  {
            return sampleArticles[i];
        }
    }
    return undefined;
}{{< / highlight >}}

We have two duplicate lines of code. At this moment it&#8217;s not a big deal but we may want to add logging and see special error message in the console when Error is thrown:

{{< highlight javascript >}}//...
getPrivateArticles: function () {
    try {
        Authorization();
        return privateArticles;
    } catch (e) {
        console.log('%cException: ' + e.message + '. getPrivateArticles called before proper authorization.',
            'color: red; text-weight: bold; font-size: 1.2em;');
    }
},
getArticleById: function (id) {
    try {
        Authorization();
        for (var i = 0; i < sampleArticles.length; i += 1) {
            if (sampleArticles[i].id === id)  {
                return sampleArticles[i];
            }
        }
    } catch (e) {
        console.log('%cException: ' + e.message + '. getArticleById called before proper authorization.',
            'color: red; text-weight: bold; font-size: 1.2em;');
    }
    return undefined;
}
//...{{< / highlight >}}

Now we have a lot of duplicates and if we want to change something in the code which authorises the user and logs the error we should change it in both places. We may have service with large interface which requires logging and authorisation (or something else) in all of its methods or big part of them. In this case we need something more powerful and the Aspect-Oriented Programming gives us the tools for that.

We can achieve the same effect as in the code above just by applying Authorization and Logger service to the api object:

{{< highlight javascript >}}return execute(Logger).onThrowOf(execute(Authorization).before(api, {
    methodPattern: /Special|getArticleById/
}));{{< / highlight >}}

This code will invoke the Authorization service before executing the methods which match the pattern: /Special|getArticleById/ when an Error is thrown the Logger will log it with detailed information. Notice that onThrowOf, before and all the methods listed below return object with the same methods so chaining is possible. We can also match the methods not only by their names but also by their arguments:

{{< highlight javascript >}}return execute(Logger).onThrowOf(execute(Authorization).before(api, {
    methodPattern: /Special|getArticleById/,
    argsPatterns: [/^user$, /^[Ii]d(_num)?$/]
}));{{< / highlight >}}

Now the aspects will be applied only to the methods which match both the methodPattern and argsPatterns rules.

Currently execute supports the following pointcuts:

*   before &#8211; executes given service before the matched methods are invoked.
*   after &#8211; executes given service after the matched methods are invoked.
*   around &#8211; executes given service before and after the matched methods are invoked.
*   onThrowOf &#8211; executes when an Error is thrown by method from the given set of matched methods.
*   onResolveOf &#8211; executes after promise returned by a method from the given set of matched methods is resolved but before the resolve callback is invoked.
*   afterResolveOf &#8211; executes after promise returned by a method from the given set of matched methods is resolved but after the resolve callback is invoked.
*   onRejectOf &#8211; executes after promise returned by a method from the given set of matched methods is rejected.

Aspects can be applied not only to objects but also to functions:

{{< highlight javascript >}}DemoApp.factory('ArticlesCollection', function ($q, $timeout, execute, Logger, Authorization) {
    return execute(Logger).before(function () {
        //body
    });
});{{< / highlight >}}

<a title="GitHub" href="https://github.com/mgechev/angular-aop" target="_blank">AngularAOP</a> can be found at: <a title="GitHub" href="https://github.com/mgechev/angular-aop" target="_blank">GitHub</a>
