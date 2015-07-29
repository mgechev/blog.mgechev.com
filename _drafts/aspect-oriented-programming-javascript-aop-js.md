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

What we can do in order to handle all these duplications?
