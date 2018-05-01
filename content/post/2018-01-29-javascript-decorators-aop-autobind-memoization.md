---
author: minko_gechev
categories:
- TypeScript
- JavaScript
- Decorators
date: 2018-01-29T00:00:00Z
draft: false
tags:
- TypeScript
- JavaScript
- Decorators
title: JavaScript Decorators for Declarative and Readable Code
url: /2018/01/29/javascript-decorators-aop-autobind-memoization
---

Decorators in JavaScript are now in [stage 2](https://github.com/tc39/proposals). They allow us to alter the definition of a class, method, or a property. There are already a few neat libraries which provide decorators and make our life easier by allowing us to write more declarative code with better performance characteristics.

In this blog post I'll share a few decorators which I'm using on a daily basis. We'll take a look at:

- How to write more efficient React components with `@autobind`
- How to cache results of computations using `@memo`
- Improving separation of concerns and cohesion with `aspect.js`'s `@beforeMethod` and `@afterMethod`
- Developing more decoupled code using Angular's dependency injection with `injection-js`

## Autobind

Autobind is a decorator which allows given method to be automatically bound to a class instance. For example:

```typescript
class Superhero {
  constructor(name) {
    this.name = name;
  }

  @autobind
  getName() {
    return this.name;
  }
}

const superman = new Superhero('Superman');
const batman = new Superhero('Batman');

const supermanNameGetter = superman.getName;
const batmanNameGetter = batman.getName;

console.log(supermanNameGetter()); // Superman
console.log(batmanNameGetter()); // Batman
```

From the example above we can see that the `getName` method got automatically bound to a specific instance of the class. In case we didn't use `@autobind` we'd have gotten the error:

>Error: Cannot read property 'name' of undefined

This decorator has a few quite useful applications.

<img src="/images/decorators/bind.jpg" style="display: block; margin: auto" alt="Bind">

### React Event Handlers

Firstly, it's quite handy to use `@autobind` with React in order to not create new functions for the event handlers each time when the `render` method gets invoked. For instance:

```typescript
class Component extends React.Component {
  prop = 'Hello there!';

  clickHandler() {
    alert(this.prop);
  }

  render() {
    return <button onClick={() => this.clickHandler()}></button>
  }
}
```

This code will create a new arrow function each time when `render` gets invoked. Another alternative is:

```typescript
// ...
render() {
  return <button onClick={this.clickHandler.bind(this)}></button>
}
// ...
```

...which suffers from the same problem, because `bind` will create a new instance of the `clickHandler` bound to `this`.

With `@autobind` we can refactor the code to:

```typescript
class Component extends React.Component {
  prop = 'Hello there!';

  @autobind
  clickHandler() {
    alert(this.prop);
  }

  render() {
    return <button onClick={this.clickHandler}></button>
  }
}
```

### Keeping a Reference to an Event Handler

Secondly, we can use `@autobind` to keep a reference to an event handler that we've attached to given DOM element. For example, take a look at the following Angular component:

```typescript
@Component({...})
class DraggableComponent {
  private _documentMove: Function;

  ngOnInit() {
    document.addEventListener('mousemove', this._documentMove = e => {
      this.x = e.pageX;
      this.y = e.pageY;
      // More logic...
    });
  }

  ngOnDestroy() {
    // Perform clean up
    document.removeEventListener('mousemove', this._documentMove);
  }
}
```

This is a commonly used pattern for keeping a reference to an event handler so we can easily clean the subscription once the component gets destroyed. It works well, however, we can be achieved the same in a more elegant way:

```typescript
@Component({...})
class DragHandlerComponent {
  ngOnInit() {
    document.addEventListener('mousemove', this._documentMove);
  }

  ngOnDestroy() {
    // Perform clean up
    document.removeEventListener('mousemove', this._documentMove);
  }

  @autobind
  private _documentMove(e) {
    this.x = e.pageX;
    this.y = e.pageY;
    // More logic...
  }
}
```

This way we no longer need the arrow function to preserve the context because `@autobind` would have bound the `_documentMove` method to the proper value of `this`.

### How to use it?

You can use `@autobind` from either [`core-decorators`](https://www.npmjs.com/package/core-decorators) on npm or [`autobind-decorator`](https://www.npmjs.com/package/autobind-decorator) if that's the only decorator you need.

## memo

Often we have pure methods in our classes. Such methods always:

- Return the same result when invoked with the same set of arguments.
- Do not perform side effects.

In such cases it makes sense to perform memoization over them!

Recently I released the decorator `memo-decorator` which does exactly that! For example, let's suppose we have:

```typescript
class Superhero {
  calculateAge(n) {
    if (n < 1) {
      throw new Error('Invalid argument');
    }
    if (n === 1 || n === 2) {
      return 1;
    }
    return this.calculateAge(n - 1) + this.calculateAge(n - 2);
  }
}
```

Now when we invoke `calculateAge` with given `n`, we're always going to get the same result:

```typescript
const hero = new Superhero();

hero.calculateAge(5); // 5
hero.calculateAge(5); // 5

hero.calculateAge(15); // 610
hero.calculateAge(15); // 610
hero.calculateAge(15); // 610
```

An obvious idea for an optimization is to cache the result and directly return it once calculated instead of going through the same computation. A simple way to perform caching is to use a `Map` with keys the arguments of the `calculateAge` method and values the results the method produces. That's exactly what `memo-decorator` does!

```typescript
class Superhero {
  @memo()
  calculateAge(n) {
    console.log('Calculating');
    if (n < 1) {
      throw new Error('Invalid argument');
    }
    if (n === 1 || n === 2) {
      return 1;
    }
    return this.calculateAge(n - 1) + this.calculateAge(n - 2);
  }
}
```

Notice the `console.log` statement that I added in the method. Here's what the current behavior would be:

```typescript
const hero = new Superhero();

hero.calculateAge(5); // return 5 and log 'Calculating'
hero.calculateAge(5); // return 5, does not log 'Calculating' since we get the result from the cache.

hero.calculateAge(15); // return 610 and log 'Calculating'
hero.calculateAge(15); // return 610, does not log 'Calculating' since we get the result from the cache.
hero.calculateAge(15); // return 610, does not log 'Calculating' since we get the result from the cache.
```

But what about methods which have multiple arguments?

In such cases we can provide a custom "resolver" which for given set of arguments returns the key to be used for caching:

```typescript
class Superhero {
  @memo((n, a) => n + '-' + a)
  calculateAge(n, a) {
    console.log('Calculating');
    if (n < 1) {
      throw new Error('Invalid argument');
    }
    if (n === 1 || n === 2) {
      return 1;
    }
    return this.calculateAge(n - 1, a) + this.calculateAge(n - 2, a);
  }
}
```

As we can see from the snippet above, `@memo` receives a single, optional argument - a function. This function receives all the arguments passed to the decorated method. By default the implementation of the key resolver is the identity function:

```typescript
const resolve = a => a;
```

### How to use?

You can use the `@memo` decorator from the [`memo-decorator`](https://npmjs.com/package/memo-decorator) package on npm.

## aspect.js

So far we discussed different JavaScript decorators. Now we'll briefly show an entire paradigm!

Let's suppose we have a class called `DataMapper` which sends requests over the network to a RESTful API. This abstraction is supposed to create, update, and delete users and their payment information:

```typescript
class DataMapper {
  saveUser(user) {
    return fetch(...)
  }

  deleteUser(user) {
    return fetch(...)
  }

  updateUser(user) {
    return fetch(...)
  }

  saveUserPayment(user) {
    return fetch(...)
  }

  deleteUserPayment(user) {
    return fetch(...)
  }

  updateUserPayment(user) {
    return fetch(...)
  }
}
```

Now, for debugging purposes we want to add logging for all of these methods. Going over each individual method and adding a log statement will be quite annoying, and what if we want to drop the log statements for our production build?

A better approach would be to use Aspect-Oriented Programming (AOP), which can help us to resolve this issue by just:

```typescript
@Wove()
class DataMapper {
  // ...
}

class DataMapperAspect {
  @beforeMethod({
    classNamePattern: /DataMapper/,
    methodNamePattern: /.*/
  })
  log(m: Metadata) {
    console.log(`Method ${m.method.name} called with ${m.method.args.join(', ')}`);
  }
}
```

The semantics of this snippet is:

>Invoke `log` before the invocation of each method from a class which name matches the pattern `/DataMapper/`.

As value of the property `methodNamePattern` that we pass as an argument to the `@beforeMethod` decorator we specify another pattern. If we want, we can get more restrictive:

```typescript
@Wove()
class DataMapper {
  // ...
}

class DataMapperAspect {
  @beforeMethod({
    classNamePattern: /DataMapper/,
    methodNamePattern: /^save.*/
  })
  log(m: Metadata) {
    console.log(`Method ${m.method.name} called with ${m.method.args.join(', ')}`);
  }
}
```

This way the `log` method will be called only before the invocation of methods with `save` prefix.

<img src="/images/decorators/ocd.jpg" style="display: block; margin: auto" alt="Separation of Concerns">

### What else `aspect.js` provides?

The aspect-oriented paradigm is extremely powerful. With `aspect.js` we can achieve the effect of any of the decorators listed above...and do much more!

You can find more about AOP [here](https://blog.mgechev.com/2015/07/29/aspect-oriented-programming-javascript-aop-js/).

### How to use?

[`aspect.js`](https://npmjs.org/package/aspect.js) can be found on npm.

## injection-js

Another extremely convenient use case for the JavaScript decorators is for dependency injection (DI)! Angular already takes advantage of this technique in order to provide a flexible way to wire up the dependencies in our application. I am sure I don't have to convince you how useful the DI pattern is for helping us to write more testable and coherent code.

Did you know that you don't necessary need Angular in order to use its dependency injection mechanism? That's right, you can use the DI independently from the framework with the package [injection-js](https://npmjs.org/package/injection-js)!

Injection-js can be use with TypeScript, ES5, ES2016, ES2017, etc, however, it looks most natural with TypeScript because of its type annotations.

Here's an example with TypeScript:

```typescript
import 'reflect-metadata';
import { ReflectiveInjector, Injectable, Injector } from 'injection-js';

class Http {}

@Injectable()
class Service {
  constructor(private http: Http) {}
}

const injector = ReflectiveInjector.resolveAndCreate([
  Service,
  Http
]);

console.log(injector.get(Service) instanceof Service);
```

Once we invoke the `get` method of the `injector` instance, the injector will automatically figure out that `Service` depends on `Http` so it'll create an instance of `Http` and pass it to the constructor of `Service`.

...and here's an equivalent example with plain JavaScript, with parameter decorators support:

```typescript
import { ReflectiveInjector, Injectable, Injector, Inject } from 'injection-js';

class Http {}

@Injectable()
class Service {
  constructor(@Inject(Http) private http) {}
}

const injector = ReflectiveInjector.resolveAndCreate([
  Service,
  Http
]);

console.log(injector.get(Service) instanceof Service);
```

Notice that since in JavaScript we do not have type annotations we had to specify the type of the dependency of `Service` by using `@Inject`.

Also, keep in mind that at the moment both snippets can be compiled only with TypeScript, since babel does not have [parameter decorator support yet](https://github.com/babel/proposals/issues/13).

### How to use?

Just install [`injection-js`](https://npmjs.com/package/injection-js). For further instructions on how to use the DI in your Vue, React, Node.js application you can just [follow the Angular documentation](https://angular.io/guide/dependency-injection-pattern). Also, here's how I introduced `injection-js` support in my React app, [sometime back](https://blog.mgechev.com/2017/01/30/implementing-dependency-injection-react-angular-element-injectors/).

## Conclusion

JavaScript decorators are on it's way to the ECMAScript standard. There are a lot of libraries and frameworks out there taking advantage of them!

In this article we made a quick overview of only a few - `@autobind`, `@memo`, a few decorators from `aspect.js`, and `injection-js`.

We saw how we can develop more efficient React components and how to elegantly preserve a reference to event listeners by using `@autobind`. After that we saw how we can use the `@memo` decorator for applying memoization to pure methods. Our next stop was `aspect.js` package which implements the Aspect-Oriented Programming paradigm by using ES decorators! Finally, we took a look at `injection-js` which allows us to use the DI pattern for our Node, Vue, and React applications!
