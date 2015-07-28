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

Object-oriented programming is powerful. When we design OO system all we do is decomosing the problem domain and following some basic principles concerning the communication between the different components. The process is logical; it involves logical thinking, understanding of the domain and predictions for the future evolution of the system. Often we're trying to keep our code DRY ([not always](https://twitter.com/BonzoESC/status/442003113910603776/photo/1)), highly coherent and loosely coupled. However, in some cases this just can't happen. There are some code snippets we're just blindly copying and pasting all around our code base.

## Cross-cutting Concerns

Lets say we have ES2015 class, which implements client-side [active record](https://en.wikipedia.org/wiki/Active_record_pattern):

```javascript
class ArticleCollection {
  getArticleById(id) {
    return fetch(`/articles/${id}`)
      .then(res => {
        return res.json()
      });
  }
  getSpecialArticleById(id, token) {
    return fetch(`/special_articles/${token}/${id}`)
      .then(res => {
        return res.json();
      });
  }
  removeArticle(id) {
    return fetch(`/articles/${id}`, {
        method: 'delete'
      }).then(res => {
        return res.json();
      });
  }
  removeSpecialArticle(id, token) {
    return fetch(`/special_articles`, {
        method: 'delete'
      }).then(res => {
        return res.json();
      });
  }
}
```

We have `ArticleCollection`, which provides methods for fetching new articles and removing already existing ones. There are two "special" methods (`getSpecialArticleById` and `removeSpecialArticle`), which are responsible for dealing with articles, which require authorized access.

In a typical scenario, during our development process we may want to add logging when given method is called and when its execution is completed.
