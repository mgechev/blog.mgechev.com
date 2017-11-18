---
author: minko_gechev
categories:
- Angular
- Performance
date: 2017-11-17T00:00:00Z
tags:
- Angular
- IterableDiffer
- Performance
draft: true
title: Understanding Differs in Angular and Developing a Custom IterableDiffer
url: /2017/11/14/angular-iterablediffer-keyvaluediffer-custom-differ-performance/
---

In this article we'll take a look at another Angular abstraction - the **differs** and more specifically the **`IterableDiffer`**; we'll explain what the differs are and how the framework uses them internally. After that, we'll take a look at how `NgForOf` works and design a custom data structure optimized for the directive. Finally, we'll develop a custom differ which will speed up the change detection mechanism of Angular when working with large collections.

# Angular's Change Detection

There are a lot of articles written on this topic so we won't go in depth here. There are few important details to mention in order to get a better background for what the differs are, how they can be used and we we can implement a custom one.

Angular uses **dirty-checking mechanism** in order to detect changes in the registered inside of the templates' expressions. Lets suppose we have the following template:

```html
<ul>
  <li *ngFor="let item of items">
    {{ item }}
  </li>
<ul>
```

The snippet above will produce an unordered list of items. The list can change if the `items` collection we're iterating over change. Once Angular has to render the template above it'll get the `items` property from the controller of the component associated with this template and render the list items.

After that, **on special events Angular will check whether the value of `items` has changed**. What are these special events? Well, basically almost any asynchronous event which happens in the browser. In fact, by default the framework is going to check if any of the bindings in any of the templates, in any of the instances of any of the components in our application has changed. Although this sounds slow, Angular performs quite better because of numerous of optimizations that the framework performs which are topic of another discussion. You can check [this article](http://blog.mgechev.com/2016/08/14/ahead-of-time-compilation-angular-offline-precompilation/) for further details.

In short, by default after each task from the queue, Angular is going to perform dirty checking, i.e. check whether the value of any of the expressions in the templates has changed.

## Life-Cycle Hooks

On top of that when Angular performs change detection in the context of given component it will invoke its `ngDoCheck` life-cycle hook. This means that `ngDoCheck` is a perfect place to place custom piece of logic for detecting changes in the state of our components!

Lets take a look at the implementation of `NgForOf` to see how this actually works:

```ts
@Directive({selector: '[ngFor][ngForOf]'})
export class NgForOf<T> implements DoCheck, OnChanges {
  ngOnChanges(changes: SimpleChanges): void {
    if ('ngForOf' in changes) {
      // React on ngForOf changes only once all inputs have been initialized
      const value = changes['ngForOf'].currentValue;
      if (!this._differ && value) {
        // ...
        this._differ = this._differs.find(value).create(this.ngForTrackBy);
        // ...
      }
    }
  }

  ngDoCheck(): void {
    if (this._differ) {
      const changes = this._differ.diff(this.ngForOf);
      if (changes) this._applyChanges(changes);
    }
  }

  private _applyChanges(changes: IterableChanges<T>) {
    // ...
  }

  // ...
}
```

I have omitted parts of the implementation which are not essential for our discussion. However, there are three important things:

- `ngOnChanges` - `NgForOf` implements the `OnChanges` life-cycle hook which is going to be invoked when Angular detects changes in any of the bindings in the template for given component. In the context of the code above, we check if the `ngForOf` input has changed (i.e. the collection we iterate over) and if it has, we get its `currentValue` and pick a `differ` in case we don't have one already. We'll explain what the purpose of this differ is and how we pick it in a moment.
- `ngDoCheck` - `NgForOf` also implements `DoCheck` life-cycle hook which is being invoked once the change detection mechanism gets executed. In this life-cycle hook we check whether we have a differ assigned to the private `_differ` property and if we do, we invoke its `diff` method with the current value of `ngForOf` (i.e. the collection). **The method `diff` of the differ is going to return a list of changes which have happened in the collection since the last check**.
- `_applyChanges` - once we have the list of changes, all we need to do is visualize them. That's what the purpose of `_applyChanges` is, it receives a list of changes and updates the collection by optionally applying animations.

# The `IterableDiffer`

As the bullet points above mention, the `IterableDiffer` will be used to compare two collections and produce a list of changes in the form of `IterableChanges` collection. Later we pass this collection to `_applyChanges` in order to visualize the update.

The `IterableChanges` interface allows us to iterate over the changes in different ways, for instance:

- Iterate over the added items.
- Iterate over the removed items.
- Iterate over the items which have changed their position.
- etc.

For instance:

```ts
const a = [2, 1, 3];
const b = [1, 2, 4];
```

`IterableChanges` will contain the following list of updates:

- The item with index `0` from `a` has changed it's position to index `1`.
- The item with index `1` from `a` has changed it's position to index `0`.
- The item with index `2` from `a` has been removed.
- We have added a new item to `a` with value `4` and to index `2`.

As recap, we can say that internally `NgForOf` uses the life-cycle hooks `ngOnChanges` and `ngDoCheck`. `ngOnChanges` the directive uses in order to pick a differ based on the type of the current collection. `ngDoCheck` is being used in order to apply the differ over the current value of the collection. The **differ is going to compare the collection with its previous value and return the list of modifications**.

It's interesting, however, how the differ compares the individual values. In particular, what properties of the values it uses in order to compare them. For this purpose we need to take a look at the `TrackByFunction`:

## The `TrackByFunction`

Here's the interface of the function:

```ts
export interface TrackByFunction<T> { (index: number, item: T): any; }
```

By default, Angular is going to track the values by their identity with the following track-by function:

```ts
const trackByIdentity = (index: number, item: any) => item;
```

The differ will use the result from the track-by function to compare the value from a specific index in the iterable collection with its previous value. So in the following example:

```ts
const a = [2, 1, 3];
const b = [1, 2, 3];
```

The differ will compare `a` with `b` and find out that `1` and `2` has changed their positions because it'll compare the items with equality check using `===`, so this way the framework will determine that `1 !== 2`.

However, in some cases a simple equality check between the values may not work. We may want to track the values between another feature they have. Lets suppose we have two instances of given reference type which represent the same business entity:

```ts
const Employee1 = { id: 1, name: 'Minko' };
const Employee2 = { id: 1, name: 'Minko' };
const Employee3 = { id: 2, name: 'John' };

const a = [Employee1, Employee3];
const b = [Employee2, Employee3];
```

In this case, `Employee1` and `Employee2` represent the same business entity so we should consider the collections equivalent. However, if we use `IterableDiffer` with the default `TrackByFunction` we'll get a result of changes indicating that the first element from `a` has been removed and replaced with `Employee2`, which is incorrect. For this purpose, we should provide the following `TrackByFunction`:

```ts
const trackById = (index: number, item: any) => item.id;
```

Notice that in all cases the comparison between two items in the collections will be with `O(1)` (constant complexity) since Angular will use `===`.

# Encapsulation versus Performance

Now we know what the purpose of the `IterableDiffer` is and how it compares the individual values from the collection. The only thing we're not familiar with is the comparison algorithm. In fact, it's not trivial at all since the Angular team tried to optimized it quite a lot since `NgForOf` is frequently used directive and often it visualizes big data sets.

Lets just take a brief look at the `DefaultIterableDiffer` which Angular uses by default for comparing iterable collections:

```ts
export class DefaultIterableDiffer<V> implements IterableDiffer<V>, IterableChanges<V> {
  // ...

  diff(collection: NgIterable<V>): DefaultIterableDiffer<V>|null {
    // ...
  }

  check(collection: NgIterable<V>): boolean {
    if (Array.isArray(collection)) {
      (this as{length: number}).length = collection.length;

      for (let index = 0; index < this.length; index++) {
        // ...
      }
    } else {
      iterateListLike(collection, (item: V) => {
        // ...
      });
    }
    return this.isDirty;
  }

  // ...
}
```

That's pretty much enough in order to find out potential ways to improve the differ. It's interesting that the `DefaultIterableDiffer` implements two interfaces `IterableDiffer` and `IterableChanges`. We already took a look at both abstractions - the first one implements a differ for collections we can iterate over, the `IterableChanges` encapsulates the changes which the differ has found.

Why does this abstraction violates the [SRP](https://en.wikipedia.org/wiki/Single_responsibility_principle)? Well, for efficiency. This way we can have both well encapsulated and efficient abstraction. The differ can reuse the internal state of the `IterableChanges` without having to specify a contract for accessing it and/or using inefficient calls to do so.

But now take a look at the `check` method. We can clearly see that the `DefaultIterableDiffer` iterates over the collection in order to check what has changed inside of its state compared to the last check. Treating the collection as a black box this way automatically introduces `O(n)` (linear) complexity.

This has pros and cons. The pros is that the differ is just a consumer of the collection so it relays that the collection is an array or has iterator implementation. This makes the `DefaultIterableDiffer` reusable since it'll work with most built-in collections and external libraries. The cons is that we need to iterate over the entire collection in order to find whether and what has changed inside of it.

# Improving the Performance of `IterableDiffer`

Although the `IterableDiffer` can find whether given collection has changed, the collection knows this best. A possible way to optimize the change detection is to move the logic of keeping track of the changes that have happened in given collection to the collection itself. This way detecting a change will have `O(1)` complexity same as getting all the changes that have happened in some specific interval of time.

## Introducing `DifferableList`

In computer science there's the concept of **persistent data structures**. They allow us to preserve their previous versions when modified. Fully persistent data structures allow us to do some fancy time travelling, forking of universes and other crazy stuff.

I got inspired by this concept in order to develop a collection optimized for the Angular's change detection mechanism which I called `DifferableList`. It decorates the `List` from immutable.js and provides a way to keep track of the changes which happen inside of it by using a linked list. Here are few pieces of its implementation:

```ts
export class DifferableList<T> {
  /** @internal */
  changes = new LinkedList<IterableChangeRecord<T>>();

  constructor(private data = List<T>([])) {}

  pop(): DifferableList<T> {
    // ...
  }

  set(idx: number, item: T) {
    // ...
  }

  get size() {
    return this.data.size;
  }

  get(idx: number) {
    return this.data.get(idx);
  }

  indexOf(item: T) {
    return this.data.indexOf(item);
  }

  [Symbol.iterator]() {
    return new DifferableListIterator<T>(this);
  }

  // ...
}
```

This is a classical implementation of the [Decorator design pattern](https://en.wikipedia.org/wiki/Decorator_pattern) where the decorated component is the immutable `List`. Lets take a look at the `set` method:

```ts
export class DifferableList<T> {
  // ...

  constructor(private data = List<T>([])) {}

  set(idx: number, item: T) {
    const prev = this.data.get(idx);
    const result = new DifferableList<T>(this.data.set(idx, item));
    if (prev) {
      result.changes.add({
        currentIndex: null,
        previousIndex: idx,
        item: prev,
        trackById: trackByIdentity
      });
    }
    result.changes.add({
      currentIndex: idx,
      previousIndex: null,
      item: item,
      trackById: trackByIdentity
    });
    return result;
  }

  // ...
}
```

First, in the constructor of the `DifferableList` we create a new instance of the immutable `List`. Right after that, in the `set` method we get the previous value associated with index `idx`. We create a new instance of the `DifferableList` this way by passing an argument to the constructor - the immutable list with the `set` operation applied to it. In case we have value for the index `idx` we push a change - removed value from index `idx` with previous value equal to `prev`. Right after that we push another change to the list - a value `item` has been added to index `idx`.

This way with constant complexity we can keep track of all the modifications which has happened in the list in given period of time!

Notice also that in order to make the `DifferableList` play well with JavaScript and respectively `NgForOf` we need to implement the [iterator design pattern](https://en.wikipedia.org/wiki/Iterator_pattern) (i.e. make the collection iterable).

## Implementing an Iterator

The iterator itself is quite simple:

```ts
class DifferableListIterator<T> implements Iterator<T> {
  private current = 0;

  constructor(private collection: DifferableList<T>) {}

  next(): IteratorResult<T> {
    if (this.current < this.collection.size) {
      return {
        done: false,
        value: this.collection.get(this.current++)
      };
    } else {
      return { done: true, value: null };
    }
  }
}
```

We keep track of the index we're currently in and return object containing the values:

- `done` - indicating whether we've reached the end of the collection.
- `value` - the current value for the given index.

Notice how for the purpose we use only the public interface of the collection so we don't have leak of implementation details.

## Implementing a custom `IterableDiffer`

Although this collection will work with the `DefaultIterableDiffer` we'll loose all the optimizations we did so far since it'll iterate over the instances of our `DifferableList` in order to compare them instead of just accessing their `changes` property.

In order to boost the performance of our application we can introduce a `DifferableListDiffer` (yeah, [sounds silly](https://martinfowler.com/bliki/TwoHardThings.html)).

Here are the basics of the implementation of the `DefaultIterableDiffer`:

```ts
export class DifferableListDiffer<V> implements IterableDiffer<V>, IterableChanges<V> {
  forEachAddedItem(fn: (record: IterableChangeRecord<V>) => void) {
    let fst = this._changes.firstNode;
    while (fst) {
      const record = fst.element;
      if (record.previousIndex === null) {
        fn(record);
      }
      fst = fst.next;
    }
  }

  // ...

  diff(collection: NgIterable<V>): DifferableListDiffer<V> | null {
    this._data = collection as DifferableList<V>;
    const changes = this._data.changes;
    this._changes = changes;
    if (changes.size() > 0) {
      this._data.changes = new LinkedList<IterableChangeRecord<V>>();
      return this;
    } else {
      return null;
    }
  }
}
```

See how in `diff` we just get the current collection, access its `changes` property and based on this size we either reinitialize it to an empty list and return the current instance, or return `null`. We can return the current instance because the `DifferableListDiffer` implements the `IterableChanges` interface which the `_applyChanges` method of `NgForOf` uses.

## How much faster?

On top of the [application "Purely Fast"](https://github.com/mgechev/purely-fast) I run few benchmarks showing what performance boost do I get when removing and adding items to an collection and iterating over it with `NgForOf`. Here are the results:

<img src="/images/differs/custom-differ.png" style="border: 1px solid #ccc;">

