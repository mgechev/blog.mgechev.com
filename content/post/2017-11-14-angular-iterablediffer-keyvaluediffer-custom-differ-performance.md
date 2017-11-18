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
url: /2017/11/14/angular-iterablediffer-keyvaluediffer-custom-differ-track-by-fn-performance/
---

In this article we'll take a look at another Angular abstraction - the **differs** and more specifically the **`IterableDiffer`**; we'll explain what the differs are and how the framework uses them internally. After that, we'll take a look at how `NgForOf` works and design a custom data structure optimized for the directive. Finally, we'll develop a custom differ which will speed up the change detection mechanism of Angular when working with large collections.

If you're interested on higher level performance practices you can take a look at:

- ["Faster Angular Applications - Part 1"](/2017/11/11/faster-angular-applications-onpush-change-detection-immutable-part-1/)
- ["Faster Angular Applications - Part 2"](/2017/11/12/faster-angular-applications-pure-pipes-memoization-pure-functions-part-2/)

The code from this article can be found at:

- ["Purely Fast"](https://github.com/mgechev/purely-fast)
- ["Purely Fast - Benchmarks"](https://github.com/mgechev/purely-fast-benchmarks)

# Angular's Change Detection

There are a lot of articles written on this topic so we will just quickly provide some background which will help us understand how differs work and how the framework uses them internally.

Angular uses **dirty-checking mechanism** in order to detect changes in the registered inside of the templates' expressions. Lets suppose we have the following template:

```html
<ul>
  <li *ngFor="let item of items">
    {{ item }}
  </li>
<ul>
```

The snippet above will produce an unordered list of items. The list can change if the `items` collection we're iterating over changes. Once Angular has to render the template above for first time it'll simply get the `items` property from the controller of the component associated with this template and render the list items.

After that, **on special events Angular will check whether the value of `items` property has changed**. What are these special events? Well, basically almost any asynchronous event which happens in the browser. In fact, by default the framework is going to check if any of the bindings in any of the templates in any of the instances of any of the components in our application has changed. Although this sounds slow it's not because of the numerous optimizations that Angular performs. Although that's an interesting topic, it's part of another discussion. Check [this article](http://blog.mgechev.com/2016/08/14/ahead-of-time-compilation-angular-offline-precompilation/) for more details.

In short, **by default, after each task from the queue, Angular is going to perform dirty checking, i.e. check whether the value of any of the expressions in the templates has changed and update the view**.

## Life-Cycle Hooks

On top of that when Angular performs change detection in the context of given component it will invoke its `ngDoCheck` life-cycle hook. This means that `ngDoCheck` is the perfect place to add custom piece of logic for detecting changes in the state of our components!

<img src="/images/differs/lifecycle.jpg" alt="Life-Cycle"  style="display: block; margin: auto;">

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

I have omitted parts of the implementation which are not essential for our discussion. There are three important points to discuss:

- `ngOnChanges` - `NgForOf` implements the `OnChanges` life-cycle hook which is going to be invoked when Angular detects changes in any of the bindings in the template for given component or directive. In the context of the code above, Angular will check if the `ngForOf` input has changed (i.e. the collection we iterate over). If it has changed, we get its `currentValue` and find an appropriate differ in case we haven't picked one yet. We'll explain what the purpose of the differ is and how we pick it later in this article.
- `ngDoCheck` - `NgForOf` also implements the `DoCheck` life-cycle hook which is invoked once the change detection mechanism gets executed. In this life-cycle hook we check whether we have a differ assigned to the private `_differ` property and if we do, we invoke its `diff` method with the current value of `ngForOf` (i.e. the collection). **The method `diff` of the differ is going to return a list of changes which have happened in the collection since the last check**.
- `_applyChanges` - once we have the list of changes, all we need to do is visualize them. That's what the purpose of `_applyChanges` is; it receives a list of changes and updates the collection by optionally applying animations.

# The `IterableDiffer`

As the bullet points above mention, the `IterableDiffer` will be used to compare two collections and produce a list of changes in the form of `IterableChanges` collection. Later we pass this collection to `_applyChanges` in order to visualize the update. Why is it called `IterableDiffer`? It compares iterable collections - collections we can iterate over. This includes any collection which has an [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators) associated with it.

The `IterableChanges` interface allows us to iterate over the changes in different ways, for instance:

- Iterate over the added items.
- Iterate over the removed items.
- Iterate over the items which have changed their position.
- Iterate over all the changes.
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
- There's a new item added to `a` with value `4` and index `2`.

In recap, we can say that internally `NgForOf` uses the life-cycle hooks `ngOnChanges` and `ngDoCheck`. `ngOnChanges` the directive uses in order to pick a differ based on the type of the current collection using the `find` method of an instance of the `IterableDiffers` collection. `ngDoCheck` is used to apply the differ over the current value of the collection. The **differ is going to compare the collection with its previous value and return the list of changes**.

It's interesting how the differ compares the individual values in the collection. In particular, what properties of the values it uses in order to distinguish them. For this purpose we need to take a look at the `TrackByFunction` interface:

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

The differ will compare `a` with `b` and find out that `1` and `2` has changed their positions because it'll check the items with equality check using `===`.

In some cases, however, a simple equality check between the values is not enough. We may want to track the values between a specific feature they have instead of tracking them by their reference. Lets suppose we have two instances of given reference type which represent the same business entity:

```ts
const Employee1 = { id: 1, name: 'Minko' };
const Employee2 = { id: 1, name: 'Minko' };
const Employee3 = { id: 2, name: 'John' };

const a = [Employee1, Employee3];
const b = [Employee2, Employee3];
```

In this case, `Employee1` and `Employee2` represent the same business entity so we should consider the collections equivalent. However, if we use `IterableDiffer` with the default `TrackByFunction` we'll get a result of changes indicating that the first element from `a` has been removed and replaced with `Employee2`, which is incorrect. To get a correct result, we should provide the following `TrackByFunction`:

```ts
const trackById = (index: number, item: any) => item.id;
```

Notice that comparing two items from the collections will always happen in `O(1)` time, independently from the `TrackByFunction`. **For every two values returned by two invocations of the `TrackByFunction` Angular will always apply `===` check.**

# Encapsulation versus Performance

Now we know what the purpose of the `IterableDiffer` is and how it compares the individual values from the collection. The only thing we're not familiar with is the comparison algorithm. In fact, it's not trivial at all since the Angular team tried to optimized as much as possible since `NgForOf` is frequently used directive and often it has to work with big data sets.

<img src="/images/differs/encapsulation.jpg" alt="Life-Cycle"  style="display: block; margin: auto;">

Lets take a brief look at the `DefaultIterableDiffer`. It is a concrete implementation of the `IterableDiffer` interface which Angular uses by default for comparing iterable collections:

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

That's pretty much enough in order to find out potential ways to improve the differ. It's interesting that the `DefaultIterableDiffer` implements two interfaces `IterableDiffer` and `IterableChanges`. We already took a look at both abstractions - the first one implements a differ for collections we can iterate over and the `IterableChanges` encapsulates the changes which the differ has found.

Obviously this abstraction violates the [SRP](https://en.wikipedia.org/wiki/Single_responsibility_principle) but why? For efficiency. Keeping the state of `IterableChanges` and the functionality of `IterableDiffer` in one place we can have both - well encapsulated and efficient abstraction. The differ can reuse the internal state of the `IterableChanges` without having to specify a contract for accessing it and/or using inefficient calls to do so.

Now take a look at the `check` method. We can clearly see that the `DefaultIterableDiffer` iterates over the collection in order to check what has changed inside of its state compared to the last check. Treating the collection as a black box automatically introduces `O(n)` time complexity.

This has pros and cons. The pros is that the differ is just a consumer of the collection so it relies that the collection is an array or has iterator implementation. This makes the `DefaultIterableDiffer` reusable since it'll work with most built-in collections and external libraries. The cons is that we need to iterate over the entire collection in order to find whether and what has changed inside of it.

# Improving the Performance of `IterableDiffer`

Although the `IterableDiffer` can find whether given collection has changed, the collection knows this best. A possible way to optimize the change detection is to move the logic for keeping track of the changes that have happened in given collection to the collection itself. This way detecting a change will give us `O(1)` complexity same as getting all the changes that have happened in some specific interval of time. This however, is only possible if we can afford to use a custom data structure in our application.

## Introducing `DifferableList`

In computer science there's the concept of **persistent data structures**. The instances of these data structures allow us to preserve their previous versions when modified. Fully persistent data structures allow us to do some fancy time travelling, forking of universes and other crazy stuff.

I got inspired by this concept in order to develop a collection optimized for the Angular's change detection mechanism which I called `DifferableList`. It decorates the `List` from [immutable.js](https://facebook.github.io/immutable-js/) and provides a way to keep track of the changes happening inside of it by using a linked list. Here are few pieces of its implementation:

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

This is a classical implementation of the [decorator design pattern](https://en.wikipedia.org/wiki/Decorator_pattern) where the decorated component is the immutable `List`. Lets take a look at the `set` method's implementation:

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

In the constructor of the `DifferableList` we create a new instance of the immutable `List` if a value of the first argument is not set. Right after that, in the `set` method we get the current value associated with index `idx`. We create a new instance of the `DifferableList` way by passing an argument to the constructor - the immutable list with the `set` operation applied to it. In case we have value for the index `idx` in the initial list we push a change - removed value from index `idx` with previous value equal to `prev`. Right after that we push another change to the list - a value `item` has been added to index `idx`.

This way with constant complexity we can keep track of all the modifications which has happened in the list in given period of time!

Notice also that in order to make the `DifferableList` play well with JavaScript and respectively `NgForOf` we need to implement the [iterator design pattern](https://en.wikipedia.org/wiki/Iterator_pattern) for it (i.e. make the collection iterable).

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

We keep track of the index we're currently in and return objects containing the values:

- `done` - indicating whether we've reached the end of the collection.
- `value` - the current value for the given index.

Notice how for the purpose we use only the public interface of the collection so we don't have leak of any implementation details.

## Implementing a custom `IterableDiffer`

Although this collection will work with the `DefaultIterableDiffer` if we use it we'll loose all the optimizations we did so far since the differ will iterate over items in instances of the `DifferableList` to compare them instead of just accessing their `changes` property.

In order to boost the performance of our application we can introduce a `DifferableListDiffer` (yes, [sounds silly](https://martinfowler.com/bliki/TwoHardThings.html)).

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

Notice how in `diff` we just get the current collection, access its `changes` property and based on its size we either preserve its value, set it to an empty list and return the current instance, or return `null`. We return the current instance of the `DifferableListDiffer` because it implements the `IterableChanges` interface which the `_applyChanges` method of `NgForOf` uses.

## Implementing `IterableDifferFactory`

Finally, we just need to plug our custom iterable differ in order to let Angular choose it for diffing `DifferableList`s. For the purpose we need to implement an `IterableDifferFactory`:

```ts
@Injectable()
export class DifferableListDifferFactory<V> implements IterableDifferFactory {
  supports(objects: any): boolean {
    return objects instanceof DifferableList;
  }

  create(trackByFn?: TrackByFunction<V>): IterableDiffer<V> {
    return new DifferableListDiffer<V>();
  }
}
```

That's pretty much all. We have two methods:

- `supports` - check whether the differ instantiated with this factory supports given collection.
- `create` - instantiates the differ.

Now we need to plug our factory as a provider:

```ts
@Component({
  providers: [IterableDiffers.extend([new DifferableListDifferFactory()])],
  // ...
})
export class EmployeeListComponent {
  // ...
}
```

`IterableDiffers` will pick the correct differ for given collection; if we have multiple differs which support the collection the `IterableDiffers` will invoke the `create` method of the factory for the first match.

## Performance Benchmarks

On top of the [application "Purely Fast"](https://github.com/mgechev/purely-fast) I run few benchmarks showing what performance boost do I get when removing and adding items to a collection and iterating over it with `NgForOf`. Here are the results:

<img src="/images/differs/custom-differ.png" style="border: 1px solid #ccc;">

With 1k items the time for adding and removing an item dropped from 33.03ms to 19.9ms which is a significant improvement!

The e2e test and the benchmarks can be found [here](https://github.com/mgechev/purely-fast-benchmarks).

# Conclusion

In this article we explained the basics of how Angular's change detection works. We covered details of how `NgForOf` uses implementations of the `IterableDiffer` abstraction in order to find all the changes which has happened between two consecutive ticks of the change detection.

This was followed by explaining in details how the differs use functions subtypes of the `TrackByFunction` interface.

After that we discussed how the `DefaultIterableDiffer` works and the pros and cons for the violation of the SRP in its implementation.

Inspired by the section "Encapsulation versus Performance" and persistent data structures we implemented a data structure optimized for Angular which keeps track of its changes. In order to take advantage it we built a simple `IterableDiffer` and a factory for it. After that we explained how the `IterableDiffers` will pick the right differ for given collection.

Finally, we looked at benchmarks which show the performance boost we got from the optimization.

# Resources

- ["Faster Angular Applications - Part 1"](/2017/11/11/faster-angular-applications-onpush-change-detection-immutable-part-1/)
- ["Faster Angular Applications - Part 2"](/2017/11/12/faster-angular-applications-pure-pipes-memoization-pure-functions-part-2/)
- ["Purely Fast" application](https://github.com/mgechev/purely-fast)
- ["Purely Fast" benchmarks](https://github.com/mgechev/purely-fast-benchmarks)
- [Persistent data structures](https://en.wikipedia.org/wiki/Persistent_data_structure)
- [Immutable.js](https://facebook.github.io/immutable-js/)
- [Ahead-of-Time compilation in Angular](http://blog.mgechev.com/2016/08/14/ahead-of-time-compilation-angular-offline-precompilation/)
- [Iterators and Generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)
- [Single-Responsibility Principle](https://en.wikipedia.org/wiki/Single_responsibility_principle)