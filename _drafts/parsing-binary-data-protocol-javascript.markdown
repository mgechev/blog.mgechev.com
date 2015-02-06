---
title: Parsing Binary Data with Client-Side JavaScript
author: minko_gechev
layout: post
categories:
  - JavaScript
  - Binary Data
  - Blob
  - TCP
  - WebSockets
tags:
  - Blob
  - JavaScript
  - Binary Data
---

Last couple of weeks I'm trying to build high-performance consumption of binary protocol through the browser. The protocol is running over TCP. In the perfect world I'd be talking with the remote TCP server, through TCP sockets, connecting directly from the front-end and consuming the received binary data.

Because of limitations of the client-side API, JavaScript doesn't has access to plain TCP sockets, there's no full happiness. The second best option would be to use intermediate proxy, which:

- Establishes connection with the client (our front-end JavaScript)
- Establishes TCP connection with the remote TCP server
- Forwards each message from the client to the TCP server and vice versa

### History

#### Dark Ages

Before the era of the duplex network communication in JavaScript (i.e. before WebSockets, I don't consider long polling as solution), the flow would be something like:

- Make XMLHttpRequest to a back-end service (our proxy)
- Translate the request in the back-end service from textual data to binary data, if required
- Forward the request to the target TCP server
- Receive a response by the target server
- Translates the response to textual data, if required
- Response to the XMLHttpRequest

Which wasn't fun, at all. You initiate new POST/GET request for each client request and in case "Keep-Alive" is not set you might need to open TCP socket for each HTTP connection.

#### Renaissance

After the era of the WebSockets, but without binary data support we would:

- Send textual data to the remote WebSocket
- Translate the received data by the proxy
- Forward the data to the TCP server
- Receive a response by the remote TCP server
- Translate the response to textual data, if required
- Response to the client's message

I haven't included the initial WebSocket handshake, since there isn't any significant overhead by it, because it is initiated only a single time.

The performance of the second case is much better by a few reasons:

- You don't need to send additional HTTP headers, which in some cases are huge
- You reuse a single TCP socket for each message by the client
- You have duplex connection, which allows you to receive push notifications

Anyway, there's still a way of improvement. In the perfect case we want to talk directly to the remote TCP server, without any translation of the protocol required, remember?

Nowadays, most browsers (even IE10), support transfer of binary data over WebSockets. This allows us to skip two more steps (translate the message sent by the client and response received by the TCP server) and reduce the bandwidth usage (since encoding to Base64 will increase the size with around 30%).

Using this strategy we got something like:

- Send binary data to the proxy's WebSocket
- Forward the data to the TCP server
- Receive response by the TCP server
- Forward the data to our client

In the last case our proxy will look something like:

{% highlight JavaScript %}
'use strict';

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 8081 });
var net = require('net');

wss.on('connection', function (ws) {
  var client;
  ws.on('message', function (msg) {
    console.log('Message received');
    try {
      msg = JSON.parse(msg);
    } catch (e) {
      if (client) {
        client.write(msg);
      }
    }
    if (msg.type === 'handshake') {
      client = net.createConnection(msg.port, msg.host, function () {
        console.log('Connected');
        ws.send(JSON.stringify({
          type: 'handshake',
          status: 'success'
        }));
      });
      client.on('data', function (data) {
        console.log('data');
        ws.send(data, { binary: true });
      });
      client.on('end', function () {
        console.log('end');
        ws.close();
      });
    }
  });
  ws.on('close', function () {
    if (client) {
      client.end();
    }
  });
});

console.log('Listening on', 8081);
{% endhighlight %}

There's a place for improvements in the code above but you get the basic idea - receive binary data and forward it to the remote TCP server, after the handshake was initiated.

### Handling binary data in JavaScript

There're a few primitives we're going to use: [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray), [Blob](https://developer.mozilla.org/en/docs/Web/API/Blob).

> The ArrayBuffer object is used to represent a generic, fixed-length raw binary data buffer. You can not directly manipulate the contents of an ArrayBuffer; instead, you create one of the typed array objects or a DataView object which represents the buffer in a specific format, and use that to read and write the contents of the buffer.

The TypedArrays allow us to process individual words (8, 16, 32 bit) in order to handle the binary messages received by the server. In order to tell the WebSockets connection, we want to talk in binary with the proxy we need to:

{% highlight JavaScript %}
var connection = new WebSocket('ws://127.0.0.1:8081');
connection.binaryType = 'arraybuffer';
{% endhighlight %}

The two possible values for `binaryType` are `arraybuffer` and `blob`. In most cases `arraybuffer` will be the one, which allows faster processing since it can be used with the synchronous API of the `DataView`. In case of large pieces of binary data I'd prefer usage of `blob`.

So how would we process the following example:

{% highlight text %}
2      U16      framebuffer-width
2      U16      framebuffer-height
16 PIXEL_FORMAT server-pixel-format
4      U32      name-length
{% endhighlight %}
