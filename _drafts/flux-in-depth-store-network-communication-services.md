---
title: Flux in Depth. Store and Communication with Services.
author: minko_gechev
layout: post
categories:
  - JavaScript
  - AngularJS
  - React
  - Flux
  - MVC
  - MVW
tags:
  - Flux
  - JavaScript
  - AngularJS
  - React
  - MVC
  - MVW
---

This is the second, and probably be the last, blog post of the series "Flux in Depth". In first post we did a quick overview of flux, took a look at the stateless, pure components, immutable data structures and component communication. This time, we're going to introduce the store and how we can communicate with services through the network via HTTP, WebSocket or WebRTC. Since flux architecture doesn't define a way of communication with external services, here you can find may way of dealing with network communication. If you have any suggestions or opinions, do not hesitate to leave a comment.

## Store

As we said, the UI is built of pure components, which are not holding any state. However, our application can't be completely stateless. We have at least business data, UI state and an application configuration. The store is the place, which keeps this data.

Lets peek at the flux data flow once again:

![High-Level Overview](/images/overview-components/flux-overview.png)

As we can see from the diagram above, the data flow starts in the view, goes to an action, which invokes the dispatcher, after that the store catches dispatcher's event and in the end the data arrives in the view again. Alright, so the store is responsible for providing the data to the view. So far so good. How we can make the store deliver the required by the view data? Well, it can trigger an event! Recently observables are getting quite popular. For good or bad, they are going to be included in the JavaScript standard. If this makes you angry because you have to learn new things and the language is getting fatter, you can find the guy who stays behind all of this here:

<iframe width="560" height="315" src="https://www.youtube.com/embed/lil4YCCXRYc" frameborder="0" allowfullscreen></iframe>

Observables are good way of building our store. If the view is able to observe the store for changes, it can update itself once the store changes. However, since we want to describe how things are actually happening in low level, we can implement a basic observable object. But before that we need to define a design pattern (yeah, my friends already noticed I'm talking about design patterns constantly and did an intervention for me but didn't help).

![Intervention](/images/intervention.jpg)

### Chain of Responsibility

This is a design pattern, which is exclusively used in the event-driven programming. Lets change the context and talk about DOM for a while. I bet you know that you can listen for any event on the document, once a user clicks on a button the event will propagate to the root of the DOM tree (eventually) and be caught by your listener:

```javascript
document.addEventListener('click', e => {
  alert(`You actually clicked on element with #${e.target.getAttribute('id')}, not on document`);
  alert(e.currentTarget === document)
}, false);
```
```html
<button id="awesome-button">Click me</button>
```

<a class="jsbin-embed" href="http://jsbin.com/hezizi/embed?output">JS Bin on jsbin.com</a><script src="http://static.jsbin.com/js/embed.min.js?3.34.0"></script>

If you click on the `awesome-button`, you'll see two alert boxes: "You actually clicked on element with #awesome-button, not on document" and "true". If you change the third parameter of `addEventListener` to `true`, the event will propagate in the opposite direction (i.e. from top to bottom).

Why I said all of this? Well, this is the pattern Chain of Responsibility:

> In object-oriented design, the chain-of-responsibility pattern is a design pattern consisting of a source of command objects and a series of processing objects. Each processing object contains logic that defines the types of command objects that it can handle; the rest are passed to the next processing object in the chain. A mechanism also exists for adding new processing objects to the end of this chain.

Or if you're have more enterprise taste, here is the UML class diagram of this design pattern:

![Chain of Responsibility](/images/patterns/behavioral/chain-of-responsibilities.svg)

Why we need it? Well, our store is a tree of objects, once a property in an internal node in the tree changes, we'll propagate this change to the root. The root component in the view will listen for events triggered by the store object. Once it detects a change it'll set its state. I'm sure it sounds weird and obfuscated, lets take a look at a diagram, which illustrates a simple chat application:

## Store to the View

Lets take a look at the following diagram, it illustrates the initial setup of our application:

![Initial Setup](/images/store-services/initial-config.png)

The tree on the left hand-side is the store, which serialized to JSON looks the following way:

```json
{
  "users": [
    { "name": "foo", "id": 1 },
    { "name": "bar", "id": 2 }
  ],
  "messages": [
    { "text": "Hey foo", "by": 2, "timestamp": 1437147880686}
  ]
}
```

The tree on the right hand-side is the component tree. We already described the component trees in the previous part. Here is a snippet, which shows the relation between the `Chat` store and the `ChatBox` component:

```javascript
import React from 'react';
import Chat from '../store/Chat';

class ChatBox extends React.Component {
  constructor(props) {
    super(props);
    Chat.on('change', c => {
      this.setState(c);
    });
  }
  render() {
    return (
      <div>
        <MessagesList messages={this.state.messages}/>
        <MessageInput/>
      </div>
    );
  }
}
```

Basically, the root component (`ChatBox`) is subscribed to the `change` event of the `Chat`. When the `Chat` emits a `change` event, the `ChatBox` sets its state to be the current store and passes the store's content down the component tree. That's it.

What happens if something change our store?

![Change of store](/images/store-services/message-change.png)

On the diagram above something changed the first message in the `Chat` store (lets say the `text` property was changed). Once a property in a `message` changes, the message emits an event and propagates it to the parent (step `1`) and the event reaches the `messages` collection. The `messages` collection triggers change event and propagates the event to the `chat` (root object, step `2`). The `chat` object emits a change event, which is being caught by the `ChatBox`, which set its state with the content of the store. That's it...

In the next section, we're going to take a look how the view can modify the store using Actions.

## View to the Store

Now lets suppose the user enter a message and send it. Inside the `sendHandler`, defined in `MessageInput` we invoke an action (peek at the flux overview diagram above), which respectively is the `addMessage(text, user)` message in our `MessageActions`. The `MessageActions` explicitly invokes the `Dispatcher`, which throws an event. This event is being handled by the `Messages` component, which adds the message to the list of messages and triggers a `change` event. Now we're going in the previous case - "Store to View". All of this is better illustrated in the following diagram:

![Component updates store](/images/store-services/component-update-store.png)
