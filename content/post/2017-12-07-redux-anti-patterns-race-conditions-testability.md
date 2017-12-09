---
author: minko_gechev
categories:
- React
- Redux
- Architecture
date: 2017-12-07T00:00:00Z
draft: true
tags:
- React
- Redux
- Architecture
title: Anti-Patterns in Redux - Part 1
url: /2017/12/07/redux-anti-patterns-race-conditions-state-management-duplication/
---

For the past year I've been working on the project which uses React with TypeScript and Redux. In a few blog posts I'm planning to share lessons learned while combining these technologies. In the first article I'm planning to share a few anti-patterns related to state management that I noticed in the development process. In the second article I'll focus on testability.

Some of the practices I'll mention are opinionated and related to my prior experience. All of the anti-patterns are structured starting with introduction, following by problem definition and sharing a solution.

# State Duplication

Sometimes we have instances of same business entity used in a different contexts. In such cases, instead of keeping them under the same store property we treat them differently.

## Problem

For example, lets suppose we have tutoring sessions. A tutor can schedule sessions and also, once the time for given session comes, the tutor can join it. Lets model the session with the following interface:

```typescript
interface Session {
  id: string;
  title: string;
  start: Date;
  end: Date;
}
```

In the scheduler we want to allow the guide to schedule multiple sessions, however, once we join a session we're interested only in itself particularly. This may cause us to develop the store in the following way:

```typescript
interface Store {
  sessions: Session[];
  currentSession: Session;
}
```

This is incorrect because it introduces state duplication. We can schedule a session:

```typescript
const session = {
  id: 1,
  title: 'Introduction to Go',
  start: startTime,
  end: endTime
};
```

...and have it both, in the `sessions` array and as value of `currentSession`. This way we will have two additional procedures in order to keep the state consistent:

- If we modify the current session, we need to update the `sessions` array and `currentSession`.
- If we switch between sessions we need to clean the `currentSession`.

# Solution

The solution is to keep a reference to the current session. For instance, we can point to it by using its `id`:

```typescript
interface Store {
  sessions: Session[];
  currentSession: number;
}
```

This has an implication - we need to be able to select the correct session from the "master" property. In this specific case, it'll take `O(n)` time to do that, and often this is good enough because we work with small collections. If we had, however, a few thousands of sessions selecting the correct session would cause slowdowns in our application. In such case, we can modify the `Store` interface to:

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

This anti-pattern is somehow related to the next one.

# Incorrect Information Expert

There's a collection of practices called GRASP, which stands for General Responsibility Assignment Practices (or Principle). The principles are well described in the book "Applying UML and Patterns". One of them is the so called "Information Expert". The book describes this practice as:

> Assign a responsibility to the information expert class that has the information necessary to fulfill the responsibility.
 
At first this doesn't seem applicable to the functional approach of redux (too object-orienty?). On the other hand, we can think of the information expert as the component which holds the state for given component sub-tree.

Keep in mind that the information expert for the entire redux application is the store itself. On the other hand, often we have local state which is shared only among the components belonging to given component sub-tree.

The local state in redux is well discussed in multiple sources. In general, it's often UI state which can be preserved in given component instead of moved to the store. This reduces boilerplates and often increase development productivity.

## Problem

Anti-pattern that I have noticed is that often local state is not hold by the correct component in the hierarchy. Commonly multiple child components hold copy of shared, local state.

This has serious implications - when the state need to be mutated, it often gets changed only in one of the components which makes it inconsistent.

## Solution

The solution usually is quite simple - move the state to the closest common parent of the components sharing the state and pass the state as properties to the children.

Sometimes, it makes more sense to move the state directly to the store and use more systematic mechanism for mutating it (through actions and reducers).

This has some implications:

### Coupling

Often the state needs to be passed to indirect successors. Unfortunately, this couples all the parent components of the state consumers to the shape of the state. One can argue that we can just use the spread operator and pass whatever properties the parent component has passed. This is true, however, this doesn't allow any static verification through a type system.

Take a look at the next figure:

<img src="/images/redux-anti-patterns/cmp.png" style="display: block; margin: auto" alt="Component tree">

If component `A` holds the state that `C` and `D` consume then `B` should also be aware of it. This is a concern often mentioned about the redux architecture, however, in practice I haven't experienced any serious issue while developing applications above 30k SLOC.

### Mutation

The mutation of the state now should happen through the parent component (on the diagram above `A`). This can be achieved by passing callbacks. Often in such cases, I'd prefer to move the local state to the store instead introducing a complicated mutation mechanism.

# Race Conditions

Talking about race conditions in the context of a single threaded language may sound weird, however, they are fact.

## Problem

Lets suppose that our redux project uses immutable.js and we have record with the `Session` interface from above and for each session we have a guide:

```typescript
interface Session {
  id: string;
  title: string;
  start: Date;
  end: Date;
  guide: User;
}
```

Now, lets suppose we have the following actions:

```typescript
const updateSessionAction = (session: Session) => ({ type: UpdateSession, session });

const updateSession = (session: Session) => (dispatch, getStore) =>
  fetch(`/session/${session.id}`, {
      method: 'put',
      body: JSON.stringify(session.toJS()),
      headers: {
        'content-type': 'application/json'
      }
    })
    .then(r => r.json())
    .then(s => dispatch(updateSessionAction(s)));

const setGuide = (session: Session) => (dispatch, getStore) =>
  fetch(`/session/${session.id}/guide`, {
      method: 'put'
    })
    .then(r => r.json())
    .then(guide => updateSession(session.set('guide', new User(guide))));
```

And now, somewhere in the component tree we want to update the session title and get the associated guide:

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

1. We assign reference to the `session` property to the constant `session`.
2. We update the title of the session by invoking the set method of the `set` record.
3. This creates a new session record which we pass to `updateSession`.
4. Update session sends a network request and updates the session in the database.
5. Update session pessimistically updates the session in the store (i.e. we have the session with its new title).
6. We invoke the `setGuide` action, passing the `session` constant as argument.
7. In the action we get the guide, set it to the `guide` property and update the store.

Notice that at step `6.` we pass reference to the old `session` object where we still have the old title. This way the reducer will override the session in the store and replace it with an object with the old `title` and the `guide` property set.

## Solutions

There are several simple solutions to this problem.

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

This way we will make sure that we always get the latest session.

### Using Resolve Parameter

If we modify `setGuide` in a different way:

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

Now we can refactor the component to:

```typescript
...
createSession() {
  this.props.dispatch(updateSession(this.props.session.set('title', 'Advanced Go')))
    .then(s => this.props.dispatch(setGuide(s)));
}
...
```

Although last two solutions work, they look a bit more imperative with the extra constant assignment. We can also approach differently:

### Updated Props


```typescript
...
createSession() {
  this.props.dispatch(updateSession(this.props.session.set('title', 'Advanced Go')))
    .then(() => this.props.dispatch(setGuide(this.props.session)));
}
...
```

We know that the promise API is asynchronous and it will push a new micro-task into the queue. Even if in the body of `updateSession` we have:

```typescript
const updateSession = (session: Session) => (dispatch, getStore) => {
  dispatch(updateSessionAction(session));
  return Promise.resolve(session);
};

```

...we know that `this.props.session` would have the updated value of `session`.

# Conclusion

In this blog post we explored three state management anti-patterns when using React with Redux. We discussed consequences and solutions for dealing with:

- State duplication
- Wrong information expert
- Race conditions

In the next post I'll share a few lessons I learned about testing.
