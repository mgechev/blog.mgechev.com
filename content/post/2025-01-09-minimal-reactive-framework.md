---
author: minko_gechev
categories:
- Reactivity
- Web development
- Web frameworks
date: 2025-01-09T00:00:00Z
draft: false
tags:
- Reactivity
- Web development
- Web frameworks
title: Reactive framework on ~100 lines of code
og_image: /images/managing-angular/gradient.webp
url: /2025/01/09/minimal-reactive-framework
---

One of my current projects is [converging Angular and Wiz](https://blog.angular.dev/angular-and-wiz-are-better-together-91e633d8cd5a) into the same framework. This is a complex projects that involves a lot of work and many people. It also got me thinking about different client-side rendering models. In this blog post I'll show a very simple library that enables you to develop components with fine-grained reactivity. To make it easier to talk about this library, I called it "revolt."

You can find the implementation [in my repo on GitHub](https://github.com/mgechev/revolt).

<div style="padding: 20px; border-radius: 5px; background-color: #fff4da">
This prototype is just meant to be a fun experiment and nothing more!
</div>

## Component model

Each component in revolt is a function which returns a view. The view is represented by nested objects which correspond to DOM elements and text nodes that we'd render on the page. For each DOM element we can specify event listeners and attributes.

Here's how a "Hello, world!" component in revolt:

```typescript
const HelloWorld = () => {
  return 'Hello, world!';
};
```

Here's how a timer would look like:

```typescript
const Timer = () => {
  const timer = signal(0);
  setInterval(() => timer.set(timer() + 1), 1000);
  return () => `Timer: ${timer()}`;
};
```

And here's a basic todo app:

```typescript
const TodoApp = (): View => {
  const todos = signal<string[]>(["Buy milk", "Create a framework"]);
  let inputElement: HTMLInputElement | undefined;

  const addTodo = () => {
    if (!inputElement) {
      return;
    }
    todos.set([...todos(), inputElement.value]);
    inputElement.value = "";
  };

  return [
    {
      name: "input",
      attributes: {
        type: "text",
      },
      ref(input: Element) {
        inputElement = input as HTMLInputElement;
      },
      events: {
        keydown(e: Event) {
          const event = e as KeyboardEvent;
          if (event.code === "Enter") {
            addTodo();
          }
        }
      },
    },
    {
      name: "ul",
      children: {
        collection: todos,
        items(item: string) {
          return {
            name: "li",
            children: item,
            events: {
              click() {
                todos.set(todos().filter((t) => t !== item));
              },
            },
          };
        },
      }
    },
  ];
};
```

A couple of things to observe:

* Each component is a function which returns a structure of nested objects that represents the view
* We declare the state of each component with signals within the function body
* There's a way to get a reference to a particular DOM node that's inspired by React's `ref`
* We have "fine-grained reactivity" in a sense that we can bind an attribute or a text node to a particular signal

<div style="padding: 20px; border-radius: 5px; background-color: #fff4da">
This implementation uses functions for convenience. I know that many people feel strongly about the abstractions that enable component definition (e.g. classes vs functions vs sfc). As an Angular team member, I feel obligated to share that this prototype does not represent mine or the team's vision for the future of Angular's authoring.
</div>

We can render a component using:

```typescript
render(Component(), document.body);
```

I decided to use nested objects instead of JSX or templating language to simplify the build and use fewer abstractions.

## View model

Let's look at the type definitions of the view:

```typescript
export type Binding = string | ReadableSignal<string>;
export type EventListener = <K extends keyof GlobalEventHandlersEventMap>(event: GlobalEventHandlersEventMap[K]) => void;

export interface When {
  condition: ReadableSignal<boolean>;
  then: View;
  else?: View;
}

export interface For<T, I extends Iterable<T> = T[]> {
  collection: ReadableSignal<T>;
  items: (item: T, index: number) => ViewNode;
}

export interface ElementConfig {
  name: keyof HTMLElementTagNameMap;
  attributes?: Record<string, string|ReadableSignal<string|false>;
  children?: View;
  events?: {[key in keyof GlobalEventHandlersEventMap]?: EventListener};
  ref?: (node: Element) => void;
}

export type ViewNode = Binding | ElementConfig | When | For<any>;

export type View = ViewNode | View[];
```

When writing these types, it's fun to see how similar they look to a [grammar of a programming language](https://en.wikipedia.org/wiki/Formal_grammar). Templating languages are pretty much programming languages that render DOM.

Each view is a composition of nodes which could be:

* Text or a text binding
* DOM elements
* Control flow (when, for)

It's interesting to notice that revolt does not have the concept of a "[host element](https://angular.dev/guide/components/host-elements)" - a component can produce any number of root nodes including zero if we just render a text node.

Also notice that both `When` and `For` accept a readable signal and they rerender when the value of the signal changes. Similarly, we can get a sense how we implement fine-grained reactivity in text and attribute bindings - both could be either strings or `ReadableSignal`s.

## Signals

Our reactive framework will use a minimal signal implementation that I reused from the post ["Building a Reactive Library from Scratch"](https://dev.to/ryansolid/building-a-reactive-library-from-scratch-1i0p). The library exports three abstractions `ReadableSignal<T>`, `WritableSignal<T>` and `Effect`:

```typescript
export type ReadableSignal<T> = () => T;

export interface WritableSignal<T> extends ReadableSignal<T> {
  set(value: T): void;
}

export type Effect = () => void;
```

Here's how you can use them:

```typescript
const counter = signal(0);

effect(() => {
  console.log('Current value', counter());
});

counter.set(1);
```

The code above will output `"Current value 0"` and `"Current value 1"`. If you're interested in how the signals library works, have a look at its [implementation](https://github.com/mgechev/revolt/blob/c989a107945d23595493453c2c53b95fb2cba922/lib/signal.ts) or Ryan's [blog post](https://dev.to/ryansolid/building-a-reactive-library-from-scratch-1i0p).

## Rendering

We already have the view and the signal library. The only thing left is the renderer! Let's look at the `render` function:

```typescript
export const render = (view: View, root: Element): Node | Node[] => {
  if (isConditional(view)) {
    return renderCondition(view, root);
  }
  if (isIterator(view)) {
    return renderIterator(view, root);
  }
  if (view instanceof Array) {
    return renderViewList(view, root);
  }
  if (typeof view === "string") {
    return renderTextNode(view, root);
  }
  if (typeof view === "function") {
    return renderDynamicText(view, root);
  }
  return renderElement(view, root);
};
```

Pretty straightforward and very similar to a parser. Now let's look at the implementation of `isIterator` to see how we use signals:

```typescript
const renderIterator = (view: For<any>, root: Element) => {
  let collection;
  let result: Node | Node[] | undefined;
  effect(() => {
    collection = view.collection();
    if (result) {
      destroy(result);
    }
    result = render(collection.map(view.items), root);
  });
  return result ?? [];
};
```

That's it!

Inside an `effect` we read the signal representing the collection, after that we destroy the DOM from the previous value of the signal, and we render the new collection. Here we take advantage of the synchronous `effect` implementation.

<div style="padding: 20px; border-radius: 5px; background-color: #fff4da">
Keep in mind that's an oversimplified implementation. All modern frameworks will have diffing logic that will rerender only the changed items to optimize the runtime.
</div>

In a similar way we implement other signal bindings:

```typescript
const renderElement = (view: ElementConfig, root: Element) => {
  const element = document.createElement(view.name);
  for (const attribute in view.attributes) {
    const binding = view.attributes[attribute];
    if (!isDynamicBinding(binding)) {
      element.setAttribute(attribute, binding);
      continue;
    }
    effect(() => {
      const value = binding();
      if (value === false) {
        element.removeAttribute(attribute);
        return;
      }
      element.setAttribute(attribute, value);
    });
  }
  // ...
};
```

Here we create an `effect` for attribute bindings that are signals. Each time we receive a new value for the signal, we manually update the attribute.

You can see the entire implementation [on GitHub](https://github.com/mgechev/revolt).

## Other approaches

Angular and React use very different approaches. Virtual DOM relies on pruning parts of the component tree that have not changed. Its elegance comes from functional programming, but could also cause extra rendering.

Similarly to the approach in revolt, Angular separates creation from update, but differently. The Angular compiler generates two rendering code paths:

* One for initial render of the component
* Another which contains only the dynamic parts of the view

Signals notify the framework that something in the dynamic part of the view has changed, which causes Angular to schedule change detection and update it.

## That's all folks

That was pretty much everything. Revolt is a tiny library that allows exploration of different concepts from web frameworks such as fine-grained reactivity, host elements, references, server-side rendering, etc.

In this write up we focused primarily on rendering and fine-grained reactivity, but I'll be happy to drill more in other topics. Let me know what you'd be interested in learning about!
