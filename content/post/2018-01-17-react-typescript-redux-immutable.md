---
author: minko_gechev
categories:
- React
- TypeScript
- Redux
date: 2018-01-17T00:00:00Z
draft: true
tags:
- React
- TypeScript
- Redux
title: Using React & Redux with TypeScript
url: /2018/01/17/react-typescript-redux-immutable
---

In this post I'll show you a few tricks which can make your life using React with TypeScript easier. All the practices are inspired by my recent work on the project [Rhyme.com](https://rhyme.com). The article is mostly focused on using React specifically with Redux with Immutable.js

# Immutable Statically Typed Records

Let's start with the definition of our store. For the purpose I prefer to use Immutable [records](https://facebook.github.io/immutable-js/docs/#/Record).

Now let's suppose we have the domain object `VirtualMachine`. We can define a well typed record using the following definition:

```typescript
export interface IVirtualMachine {
  id: string;
  state: VMState;
  connection: Connection;
  screenshot: string;
}

const virtualMachine = RecordFactory<IVirtualMachine>({
  id: '',
  state: VMState.Pending,
  connection: new Connection({}),
  screenshot: '',
});

export class VirtualMachine extends virtualMachine implements IVirtualMachine {
  id: string;
  state: VMState;
  connection: Connection;
  screenshot: string;
  constructor(config: Partial<IVirtualMachine>) {
    super(config);
  }
}
```

Notice a few things:

- We define the interface `IVirtualMachine`.
- We define a `virtualMachine` record invoking `RecordFactory` with a single type parameter `IVirtualMachine`.
- We define a class called `VirtualMachine` which extends the record and accepts a single property of type `Partial<IVirtualMachine>` in its constructor.

Notice that we export `IVirtualMachine` and `VirtualMachine` but keep the `virtualMachine` record encapsulated inside the current module.

This way we can already instantiate a new `VirtualMachine` object and configure it using an object literal:

```typescript
const vm = new VirtualMachine({ id: '123', state: VMState.Running });
```

Since the `config` parameter of the constructor is of type `Partial<IVirtualMachine>` we do not have to set all the properties of the `IVirtualMachine` interface. Of course, the drawback of this is that by mistake we can skip a configuration property and get the default value instead, which might not be the intended behavior. In this specific case, I prefer convenience over security.

In order to get a better idea of why the definition above is safer than a regular record, let's take a look at the `RecordFactory` function:

```typescript
interface Constructable<T> {
  new (...args: any[]): T;
}

interface StaticallyTypedRecord<T> extends Constructable<T> {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T, V extends T[K]>(key: K, value: V);
  withMutations(cb: (r: StaticallyTypedRecord<T>) => StaticallyTypedRecord<T>);
  setIn<K1 extends keyof T, V extends T[K1]>(keys: [K1], val: V);
  setIn<K1 extends keyof T, K2 extends keyof T[K1], V extends T[K1][K2]>(keys: [K1, K2], val: V);
  setIn<K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2], V extends T[K1][K2][K3]>(
    keys: [K1, K2, K3],
    val: V
  );
  toJS(): T;
}

export const RecordFactory = <T>(seed: T): StaticallyTypedRecord<T> => {
  return (Record(seed) as any) as StaticallyTypedRecord<T>;
};
```

Here we have three definitions:

- `Constructable<T>` is a generic interface which defines a type for a family of objects which can be instantiated with the operator `new`.
- `StaticallyTypedRecord<T>` is another generic interface which extends the `Constructable<T>` interface and declares a bunch of methods. These are all methods in the prototype of the `Immutable.Record` abstraction.
- `RecordFactory` is a generic function which accepts a `seed` of type `T` and returns an object of type `StaticallyTypedRecord<T>` by invoking `Immutable.Record(seed)` and ascribing it to the corresponding type.

What's the win here?

Well, let's suppose we have our VM:

```typescript
const vm = new VirtualMachine({ id: '123', screenshot: '...' });
```

Now if we want to access the VM properties we can:

```typescript
vm.id;
vm.get('id');

// [ts] Argument of type '"ID"' is not assignable to
// parameter of type '"id" | "state" | "connection" | "screenshot" | "templateId"'.
vm.get('ID');

// [ts] Property 'ID' does not exist on type 'VirtualMachine'. Did you mean 'id'?
vm.ID;
```

We are also going to get compile-time errors when trying to set a missing property:

```typescript
// [ts] Argument of type '"scrnshot"' is not assignable to
// parameter of type '"id" | "state" | "connection" | "screenshot" | "templateId"'.
vm.set('scrnshot');
```

This way we're able to catch mistakes caused by misspelling of a property name much sooner.

Even further, now let's suppose the `Connection` abstraction has an `ipAddress` field of type `string`. If we want to set it using the `setIn` method of the `VirtualMachine` record and we misspell it we're going to get a compile-time error again!

```typescript
// [ts]
// Argument of type '["connection", "ipaddress"]' is not assignable to parameter of type '["connection", "id" | "connectionId" | "type" | "get" | "set" | "withMu...'.
//   Types of property '1' are incompatible.
//     Type '"ipaddress"' is not assignable to type '"id" | "connectionId" | "ipAddress" | "get" | "set" | "withMutations" | "set...'.
vm.setIn(['connection', 'ipaddress'], '192.168.0.102');
```

Notice that currently we support no more than three levels of nesting with `setIn`, this is due to the explicit definition above. A random level of nesting will be possible once the [variadic types](https://github.com/Microsoft/TypeScript/issues/5453) proposal gets introduced into the language.

# Action Creators

Alright, we now have solid foundation for our store. Now, we can define the actions in our application. First, we can define an enum which contains all the action types:

```typescript
enum ActionType {
  AddVirtualMachine = 'AddVM',
  RemoveVirtualMachine = 'RemoveVM'
}
```

As next step, we can define an interface for each action:

```typescript
interface AddVirtualMachine {
  type: ActionType.AddVirtualMachine;
  vm: VirtualMachine;
}

interface RemoveVirtualMachine {
  type: ActionType.RemoveVirtualMachine;
  id: string;
}

type Action = AddVirtualMachine | RemoveVirtualMachine;
```

Notice that in the end we also define the type `Action` as intersection between the `AddVirtualMachine` and `RemoveVirtualMachine`. This allows us to have very convenient support from the type checker in our reducers:

```typescript
const virtualMachinesReducer = (action: Action, state: List<VirtualMachine> = initialState) {
  switch (a.type) {
    case ActionType.AddVirtualMachine:
    return state.push(action.vm);
    case ActionType.RemoveVirtualMachine:
    return state.delete(state.findIndex((v: VirtualMachine) => v.id === action.id));
    break;
  }
}
```

In this case the type checker will know exactly what the type of the `action` argument will be in any of the branches of the `switch` statement, so we will get a great type checking support and auto-completion.

## Interface vs Factory

In this specific case we do not need a factory since it'll be redundant. In case we have a dispatch function which accepts an object with type `Action` we will get a compile-time error in case we pass a literal with inappropriate shape. This makes the usage of factory functions or classes redundant.


