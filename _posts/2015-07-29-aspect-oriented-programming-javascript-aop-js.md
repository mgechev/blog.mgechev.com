---
title: Aspect-Oriented Programming in JavaScript
author: minko_gechev
layout: post
categories:
  - JavaScript
  - AOP
  - OOP
tags:
  - JavaScript
  - AOP
  - OOP
  - Aspects
---

*Note: The following blog post is based on the library [aspect.js]((https://github.com/mgechev/aspect.js)), which can be [found here](https://github.com/mgechev/aspect.js).*

The object-oriented programming paradigm is powerful. We design an OO system by decomposition of the problem domain, following guiding principles concerning the decomposition and the communication between the different modules. The process is structured; it involves logical thinking, understanding of the domain and eventual predictions for the future evolution of the system. Often we're trying to keep our code DRY ([not always](https://twitter.com/BonzoESC/status/442003113910603776/photo/1)), highly coherent and loosely coupled. However, in some cases this is just impossible. There are some code snippets we're just blindly copying and pasting all around our code base.

## Cross-cutting Concerns

Lets say we have ES2015 class, which implements client-side [active record](https://en.wikipedia.org/wiki/Active_record_pattern):

```javascript
class ArticleCollection {
  getArticleById(id) {
    return fetch(`/articles/${id}`);
      .then(res => {
        return res.json()
      });
  }
  getArticles() {
    return fetch('/articles');
  }
  removeArticleById(id) {
    return fetch(`/articles/${id}`, {
        method: 'delete'
      });
  }
  updateArticle(id, article) {
    return fetch(`/articles/${id}`, {
        method: 'put'
      });
  }
}
```

We define the class `ArticleCollection`, which provides methods for fetching new articles, removing and updating already existing ones. In a typical scenario, during our development process we may want to add logging when given method is called and when its execution is completed:

```javascript
class ArticleCollection {
  getArticleById(id) {
    console.log(`Invoked getArticleById with arguments: ${id}`);
    return fetch(`/articles/${id}`);
      .then(res => {
        return res.json()
      })
      .then(article => {
        console.log('The invocation of getArticleById completed succssfully');
        return article;
      })
      .catch(e => {
        console.log('Error during the invocation of getArticleById');
        return e;
      });
  }
  getArticles() {
    console.log('Invoked getArticles with no arguments');
    return fetch('/articles')
      .then(res => {
        console.log('The invocation of getArticles completed succssfully');
        return res;
      })
      .catch(e => {
        console.log('Error during the invocation of getArticles');
        return e;
      });
  }
  removeArticleById(id) {
    console.log(`Invoked removeArticleById with arguments: ${id}`);
    return fetch(`/articles/${id}`, {
        method: 'delete'
      })
      .then(res => {
        console.log('The invocation of removeArticleById completed succssfully');
        return res;
      })
      .catch(e => {
        console.log('Error during the invocation of removeArticleById');
        return e;
      });
  }
  updateArticle(id, article) {
    console.log(`Invoked updateArticle with arguments: ${id}, ${article}`);
    return fetch(`/articles/${id}`, {
        method: 'put'
      })
      .then(res => {
        console.log('The invocation of updateArticle completed succssfully');
        return res;
      })
      .catch(e => {
        console.log('Error during the invocation of updateArticle');
        return e;
      });
  }
}
```

Cool...looks quite messy? How about having 20 more similar domain classes where we need to have the same logging logic? Lets look at the snippets and find some patterns:

- In the beginning of the method's invocation we log message in the format: `Invoked METHOD_NAME with arguments: ARG1, ARG2, ..., ARG3`.
- On success we log: `The invocation of METHOD_NAME completed successfully`
- On error we log: `Error during the invocation of METHOD_NAME`

What can we do in order to modularize these duplications? Create decorator of the class? Yeah, probably it is going to work. However, there's more elegant way to deal with this. Lets say, we define something called `LoggerAspect` and take advantage of the [ES2016 decorators declarative](https://medium.com/google-developers/exploring-es7-decorators-76ecb65fb841) syntax:

```javascript
class LoggerAspect {
  @before(/.*/, /Article/)
  beforeLogger(meta, ...args) {
    console.log(`Invoked ${meta.name} with arguments: ${args.join(', ')}`);
  }
  @afterResolve(/.*/, /Article/)
  afterResolveLogger(meta) {
    console.log(`The invocation of ${meta.name}`);
  }
  @afterReject(/.*/, /Article/)
  afterRejectLogger(meta) {
    console.log(`Error during the invocation of ${meta.name}`);
  }
}
```

Lets translate this step-by-step to human language:

```javascript
// ...
@before(/.*/, /Article/)
beforeLogger(args) {
  console.log(`Invoked ${meta.name} with arguments: ${args.join(', ')}`);
}
// ...
```

- Before the execution of all methods, which names match the regular expression `/Article/` defined inside classes, which names match the regular expression: `/.*/` - invoke the `beforeLogger` method's body. So, this definition is going to wrap all matched methods inside a function, which will call `beforeLogger` and after that will invoke the target method.

How about this:

```javascript
@afterResolve(/.*/, /Article/)
afterResolveLogger(m) {
  console.log(`The invocation of ${meta.name}`);
}
```
- After the resolution of promise returned any method, which name matches the regular expression `/Article/`, defined within class, which name matches the regular expression `/.*/` invoke the body of `afterResolveLogger`. This means that for all matched methods will be created a wrapper, which invokes the method and on resolve of the returned promise calls the `afterResolveLogger`.

Okay, sounds good...How about `afterReject`?

```javascript
@afterReject(/.*/, /Article/)
afterRejectLogger {
  console.log(`Error during the invocation of ${meta.name}`);
}
```

- After the rejection of promise returned any method, which name matches the regular expression `/Article/`, defined within class, which name matches the regular expression `/.*/` invoke the body of `afterRejectLogger`. This means that for all matched methods will be created a wrapper, which invokes the method and on reject of the returned promise calls the `afterResolveLogger`.

How we can apply this "aspect" to our `ArticleCollection`?

```javascript
@Wove
class ArticleCollection {
  getArticleById(id) {
    return fetch(`/articles/${id}`);
      .then(res => {
        return res.json()
      });
  }
  getArticles() {
    return fetch('/articles');
  }
  removeArticleById(id) {
    return fetch(`/articles/${id}`, {
        method: 'delete'
      });
  }
  updateArticle(id, article) {
    return fetch(`/articles/${id}`, {
        method: 'put'
      });
  }
}
```

That's it. We replaced all the 56 lines of the `ArticleCollection` definition with the 20 lines definition by taking advantage of the module called `LoggerAspect`. However, the lack of code duplications here is not our biggest win. We were able to isolate the logging code into separate module, called aspect. The same strategy is applicable in many different scenarios:

- Transactions
- Authorization
- Formatting data
- Attaching observers
- etc.

## Conclusions

The post illustrated a typical use case for Aspect-Oriented Programming. In the past there were a few libraries implementing proxy-based AOP in JavaScript, however the syntax wasn't getting even close to already known solutions (for example the AOP implementation in Spring). ES2016 introduced the decorators syntax, which is in the core of the Dependency Injection of Angular 2. It is here to stay and implementing AOP with it is quite handy.

### Future Development

The examples above are based on a library I developed, called [`aspect.js`](https://github.com/mgechev/aspect.js). It is still under active development, so a lot of changes are going to be introduced. You can play with the framework using the instructions in the project's [README](https://github.com/mgechev/aspect.js/blob/master/README.md#demo). For comments and recommendations you can use the [GitHub issue tracker of the project](https://github.com/mgechev/aspect.js/issues) or the comment section below.
