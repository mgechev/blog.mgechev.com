---
title: Aspect-oriented Programming in JavaScript
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

The object-oriented programming paradigm is powerful. We design an OO system by decomposition of the problem domain, following guiding principles concerning the decomposition and the communication between the different components. The process is structured; it involves logical thinking, understanding of the domain and eventual predictions for the future evolution of the system. Often we're trying to keep our code DRY ([not always](https://twitter.com/BonzoESC/status/442003113910603776/photo/1)), highly coherent and loosely coupled. However, in some cases this is just impossible. There are some code snippets we're just blindly copying and pasting all around our code base.

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

We have `ArticleCollection`, which provides methods for fetching new articles, removing and updating already existing ones. In a typical scenario, during our development process we may want to add logging when given method is called and when its execution is completed:

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

Cool...looks quite messy? How about having 20 more similar classes were we need to copy-paste the same code for logging? Do you notice a pattern in the snippets?

- In the beginning of the method's invocation we log message in the format: `Invoked METHOD_NAME with arguments: ARG1, ARG2, ..., ARG3`.
- On success we log: `The invocation of METHOD_NAME completed successfully`
- On error we log: `Error during the invocation of METHOD_NAME`

What we can do in order to handle all these duplications? Create decorator of the class? Yeah, probably it is going to work. However, there's more elegant way to deal with these duplications. Lets say we define something called `LoggerAspect`:

```javascript
class LoggerAspect {
  @before(/.*/, /Article/)
  beforeLogger(args) {
    console.log(`Invoked ${args.methodName} with arguments: `);
  }
  @afterResolve(/.*/, /Article/)
  afterResolveLogger(m) {
    console.log('The invocation of ');
  }
  @afterReject(/.*/, /Article/) {
    console.log('Error during the invocation of ___');
  }
}
```
In this snippet we said that we want:

- Before all methods, which names match the regular expression `/Article/` inside classes, which names match the regular expression: `/.*/`, we want to invoke the `beforeLogger` method's body
- After the promise returned by any methods, which match the regular expressions passed as arguments to the `afterResolve` decorator, is resolved we want to invoke the `afterResolveLogger`'s body
- After rejection of the promise returned by all methods, which match the criteria.

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

That's it. We replaced the entire 56 lines `ArticleCollection` definition with the 20 lines definition here. However, the lack of code duplications here is not our biggest win! We were able to isolate the logging into separate module, called aspect.

## Conclusions

### Future Development
