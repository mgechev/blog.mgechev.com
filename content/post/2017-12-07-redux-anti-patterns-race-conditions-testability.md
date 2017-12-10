---
author: minko_gechev
categories:
- React
- Redux
- Architecture
date: 2017-12-07T00:00:00Z
tags:
- React
- Redux
- Architecture
title: Redux Anti-Patterns - Part 1. State Management.
url: /2017/12/07/redux-anti-patterns-race-conditions-state-management-duplication/
---

For the past year I've been working on a project which uses React with TypeScript and Redux. In a few blog posts I'm planning to share lessons learned while combining these technologies. In this article I'll share a few anti-patterns related to state management that I noticed in our development process. In the second article I'll focus on testability.

All of the anti-patterns below have the following structure:

- Introduction
- Problem definition
- Sample solutions with discussion of their pros and cons

# State Duplication

Sometimes we have instances of the same business entity used in different contexts. In such cases, instead of keeping the instances under the same store property we treat them differently.

<img src="/images/redux-anti-patterns/duplicate.jpg" style="display: block; margin: auto" alt="Duplication">

## Problem

For example, lets suppose we are developing an application which provides tutoring functionality. A tutor can schedule sessions and also, once the time for given session comes, the tutor can join it. Lets model the session with the following interface:

```typescript
interface Session {
  id: string;
  title: string;
  start: Date;
  end: Date;
}
```

In the scheduler we want to allow the guide to schedule multiple sessions, however, once they join a session we're only interested in the particular session itself. Following this logic we may declare the store in the following way:

```typescript
interface Store {
  sessions: Session[];
  currentSession: Session;
}
```

Although such shape of the store is logically correct, it introduces state duplication. For example, lets suppose the user schedules the following session and later joins it:

```typescript
const session = {
  id: 1,
  title: 'Introduction to Go',
  start: startTime,
  end: endTime
};
```

This way we'll have it in both: the `sessions` array and as value of `currentSession` property. Imagine the user navigates between the page with the scheduler and pages for different sessions. This will require two additional actions in order to keep the state consistent:

- If we modify the current session, we need to update the `sessions` array and `currentSession`.
- If we switch between sessions we need to clean the `currentSession` and replace it with the session corresponding to the page we've navigated to.

## Solution

The solution is to keep a value pointing to the current session in the `sessions` array as value of the `currentSession` property. For instance, we can use the `Session`'s `id` for the purpose:

```typescript
interface Store {
  sessions: Session[];
  currentSession: number;
}
```

This has an implication - we need to select the correct session from the "master" property. In this specific case, it'll take `O(n)` time to do that; often when we work with small collections this is good enough. If we have, however, a few thousands of sessions selecting the correct one would cause slowdowns in the application. In such case, we can modify the `Store` interface to:

```typescript
interface Store {
  sessions: {[key: number]: Session};
  currentSession: number;
}
```

This way we will be able to access the current session with constant complexity:

```typescript
store.sessions[store.currentSession];
```

# Incorrect Information Expert

There's a collection of patterns called [GRASP](https://en.wikipedia.org/wiki/GRASP_(object-oriented_design)), standing for General Responsibility Assignment Patterns (or Principle). The patterns are well described in the book "[Applying UML and Patterns](https://www.amazon.com/Applying-UML-Patterns-Introduction-Object-Oriented/dp/0131489062)". One of them is called "Information Expert". The book describes this practice as:

> Assign a responsibility to the information expert class that has the information necessary to fulfill the responsibility.

The pattern suggests that we should assign the responsibilities to given class based on the information it holds. At first this doesn't seem applicable to the functional approach of redux (sounds soo "object-orienty", doesn't it).

If we suppose that the pattern is symmetric, we can take a look at it the another angle:

> Keep the information in given component which helps it to fulfill its responsibilities.

Keep in mind that the information expert for the entire redux application is the store itself. On the other hand, often we have local state which is shared only among the components belonging to given component sub-tree.

Whether and how we should use local state in redux is already well discussed in multiple sources. In general, the local state often UI state which can be preserved in given component instead of moved to the store. This reduces boilerplates and often increase development productivity.

## Problem

An anti-pattern that I have noticed is that often the state is hold by an incorrect component in the hierarchy. Commonly multiple child components hold copy of shared, local state.

This has a serious implication - when the state need to be mutated, it often gets changed only in one of the components which breaks consistency.

## Solution

The solution usually is quite simple - move the state to the closest common parent of the components sharing the state and pass the state as properties to the components' children.

Sometimes, it makes more sense to move the state directly to the store and use more systematic mechanism for mutating it (through actions and reducers).

As result we get:

### Coupling

Often the state needs to be passed to indirect successors. Unfortunately, this couples all the parent components of the state consumers to the shape of the state. One can argue that we can just use the spread operator and pass whatever properties the parent component has. This doesn't allow any static verification through a type system or still requires declaration of the types of the properties given parent component passes to its children, so it's often is not good enough.

Take a look at the next figure:

<img src="/images/redux-anti-patterns/cmp.png" style="display: block; margin: auto" alt="Component tree">

If component `A` holds the state that `C` and `D` consume then `B` should also be aware of it as well. Although this coupling is often mentioned as a problem in the redux architecture, personally I haven't experienced any serious issues with it for medium sized applications (above 40k SLOC).

### Mutation

The mutation of the state now should happen through the parent component (on the diagram above `A`). This can be achieved by passing callbacks. When the callbacks need to be passed through several levels of children I often prefer to move the local state to the store.

# Implicit State Duplication

Often we have a piece of the state which can be computed from another. In such cases we have implicit state duplication.

## Problem

Lets suppose we have the following global store:

```typescript
interface State {
  sessions: {[key: number]: Session};
  totalSessions: number;
  currentSession: number;
}
```

Notice that there's implicit dependency between two of the `State`s properties: in the snippet above, the `totalSessions` property is a function of the `sessions` map. We can computed it using:

```typescript
Object.keys(sessions).length
```

<img src="/images/redux-anti-patterns/encapsulation.jpg" style="display: block; margin: auto" alt="Hidden dependencies">

## Solution

We should get rid of the properties which can be computed from another properties. This introduces additional calculations but they can be easily optimized since they are based on pure functions.

I find the usage of [`reselect`](https://github.com/reactjs/reselect) very appropriate for this particular case. Another alternative is definition of methods in a parent component which encapsulate the computations required for the given computed state property. Efficiency there can be achieved using memoization.

# Overwriting State Updates

In this section we'll take a look at another issue which is related to inconsistent state mutation.

## Problem

Lets suppose that our redux project uses immutable.js and we have a record for the `Session` model which has the following interface.

```typescript
interface Session {
  id: string;
  title: string;
  start: Date;
  end: Date;
  guide: User;
}
```

...and the following actions' definitions:

```typescript
const updateLocalSession = (session: Session) => ({ type: UpdateSession, session });

const updateSession = (session: Session) => (dispatch, getStore) =>
  fetch(`/session/${session.id}`, {
      method: 'put',
      body: JSON.stringify(session.toJS()),
      headers: {
        'content-type': 'application/json'
      }
    })
    .then(r => r.json())
    .then(s => dispatch(updateLocalSession(s)));

const setGuide = (session: Session) => (dispatch, getStore) =>
  fetch(`/session/${session.id}/guide`, {
      method: 'put'
    })
    .then(r => r.json())
    .then(guide => dispatch(updateLocalSession(session.set('guide', new User(guide)))));
```

And now, somewhere in the component tree we want to update the session title and get the associated to the session guide:

```typescript
...
createSession() {
  const session = this.props.session;
  this.props.dispatch(updateSession(session.set('title', 'Advanced Go')))
    .then(() => this.props.dispatch(setGuide(session)));
}
...
```

The code looks fine at first but lets trace what is actually going on:

1. We assign reference to the `session` property to the constant called `session`.
1. We update the title of the session by invoking the set method of the record.
1. This creates a new session record which is passed to `updateSession`.
1. Update session sends a network request and updates the session in the back-end.
1. Update session pessimistically updates the session in the store (i.e. in the store now we have the session with its new title).
1. We invoke the `setGuide` action, passing the `session` constant as argument.
1. In the action we get the guide from the network.
1. We update the `guide` property of the session and update the store with the returned by the `set` method value.

Notice that at step `6.` we pass reference to the old `session` object where we still have the old `title`. This way the reducer will overwrite the session in the store and replace it with an object with the old `title` and the `guide` property set.

With this simple example the problem looks obvious. In case when we have multiple asynchronous calls and the control flow gets less intuitive, the issue may get tricker.

## Solutions

There are several solutions to this problem; lets describe them one by one:

### Using `getState`

We can update `setGuide` to:

```typescript
const setGuide = (id: string) => (dispatch, getStore) => {
  const session = getStore().sessions[id];
  return fetch(`/session/${id}/guide`, {
      method: 'put'
    })
    .then(r => r.json())
    .then(guide => updateSession(session.set('guide', new User(guide))));
};
```

This way we can make sure that we always get the latest session inside of the `setGuide` async action.

### Using Resolve Argument

We can refactor `setGuide` in a different way:

```typescript
const setGuide = (session: Session) => (dispatch, getStore) => {
  return fetch(`/session/${session.id}/guide`, {
      method: 'put'
    })
    .then(r => r.json())
    .then(guide => {
      const s = session.set('guide', new User(guide));
      updateSession(s);
      return s;
    });
};
```

Respectively, we can update the component to:

```typescript
...
createSession() {
  this.props.dispatch(updateSession(this.props.session.set('title', 'Advanced Go')))
    .then(s => this.props.dispatch(setGuide(s)));
}
...
```

Although the last two solutions work, they look imperative because of the extra constant assignment. Third approach could be:

### Updated Props

```typescript
...
createSession() {
  this.props.dispatch(updateSession(this.props.session.set('title', 'Advanced Go')))
    .then(() => this.props.dispatch(setGuide(this.props.session)));
}
...
```

The promise API is always asynchronous; it will push a new micro-task into the queue. Even if in the implementation of `updateSession` looks like:

```typescript
const updateSession = (session: Session) => (dispatch, getStore) => {
  dispatch(updateLocalSession(session));
  return Promise.resolve(session);
};

```

...we know that `this.props.session` will have the updated value of `session` inside of the resolve callback of the promise returned by the first invocation of `dispatch`.

# Conclusion

In this blog post we explored four basic state management anti-patterns in Redux:

- State duplication
- Wrong information expert
- Implicit state duplication
- Overwriting state updates

We discussed their consequences and proposed sample solutions. In the next post I'll share a few lessons I learned about testing.
