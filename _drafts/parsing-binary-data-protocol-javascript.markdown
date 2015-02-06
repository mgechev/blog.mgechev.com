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

There are a few primitives we're going to use: [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) and [Blob](https://developer.mozilla.org/en/docs/Web/API/Blob).

> The ArrayBuffer object is used to represent a generic, fixed-length raw binary data buffer. You can not directly manipulate the contents of an ArrayBuffer; instead, you create one of the typed array objects or a DataView object which represents the buffer in a specific format, and use that to read and write the contents of the buffer.

The TypedArrays allow us to process individual words (8, 16, 32 bit) in order to handle the binary messages received by the server. In order to tell the WebSockets connection, we want to talk in binary with the proxy we need to:

{% highlight JavaScript %}
var connection = new WebSocket('ws://127.0.0.1:8081');
connection.binaryType = 'arraybuffer';
{% endhighlight %}

The two possible values for `binaryType`, of the WebSocket, are `arraybuffer` and `blob`. In most cases `arraybuffer` will be the one, which allows faster processing since it can be used with the synchronous API of the `DataView`. In case of large pieces of binary data I'd prefer the usage of `blob`.

So how would we process the following example, using `DataView` and `arraybuffer` binary type:

{% highlight text %}
2      U16      framebuffer-width
2      U16      framebuffer-height
16 PIXEL_FORMAT server-pixel-format
4      U32      name-length
{% endhighlight %}

{% highlight JavaScript %}
connection.onmessage = function (e) {
  var data = e.data;
  var dv = new DataView(data);
  var width = dv.getUint16(0);
  var height = dv.getUint16(2);
  var format = getPixelFormat(dv);
  var len = dv.getUint32(20);
  console.log('We have width: ' + width +
      'px, height: ' +
      height + 'px, name length: ' + len);
};
{% endhighlight %}

`DataView` provides a nice interface, which allows us to read specific data type by providing given offset.

##### Handling endianness

Endianness refer to the convention used to interpret the bytes making up a data word when those bytes are stored in computer memory. For the one-byte data types we don't have any issues handling the byte order, for 16, 32 and 64 we need to do some additional work.

The `TypedArray`'s standard doesn't refer to specific endianness used in them, everything depends on the underlaying machine.

{% highlight JavaScript %}
function getEndianness() {
  var a = new ArrayBuffer(4);
  var b = new Uint8Array(a);
  var c = new Uint32Array(a);
  b[0] = 0xa1;
  b[1] = 0xb2;
  b[2] = 0xc3;
  b[3] = 0xd4;
  if (c[0] === 0xd4c3b2a1) {
    return BlobReader.ENDIANNESS.LITTLE_ENDIAN;
  }
  if (c[0] === 0xa1b2c3d4) {
    return BlobReader.ENDIANNESS.BIG_ENDIAN;
  } else {
    throw new Error('Unrecognized endianness');
  }
}
{% endhighlight %}

This snippet is used in my [`BlobReader` implementation, which you can find at GitHub](https://github.com/mgechev/blobreader). `DataView` handles the endianness by specifying the second argument in it's `get`-methods. Value `true` as second argument, indicates that the data, which should be read is in little endian encoding.

### Reading blobs

As I mentioned above, when you have to deal with huge amount of data, it is much more appropriate to use `Blob` data instead of `ArayBuffer`. `Blob`s could be read using the `FileReader` API, which is asynchronous by default, in the main execution thread. `Blob`s can be used synchronously when used inside `Workers`.

[For ease I created a library, which provides simple interface for reading `Blob`s.](https://github.com/mgechev/blobreader).

`BlobReader` allows you to read blobs in the following fashion:

{% highlight JavaScript %}
// Blob definition
var uint8 = new Uint8Array([1, 2]);
var uint16 = new Uint16Array([3]);
var uint82 = new Uint8Array([4, 3]);
var uint32 = new Uint32Array([8]);
var blob = new Blob([uint8, uint16, uint82, uint32]);

// Reading the blob
BlobReader(blob)
.readUint8('uint8', 2)
.readUint16('uint16')
.readUint8('uint82')
.skip()
.readUint32('uint32')
.commit(function (data) {
  expect(data.uint8[0]).toBe(1);
  expect(data.uint8[1]).toBe(2);
  expect(data.uint16).toBe(3);
  expect(typeof data.uint82).toBe('number');
  expect(data.uint82).toBe(4);
  expect(data.uint32).toBe(8);
});
{% endhighlight %}

There are shortcut methods for reading the main data types, each of the methods accepts name of the property to be read, number of words (8, 16 or 32 bit) and format (little or big endian). Using the property name you can access the read data as property of the object passed in the `commit` callback. `skip` allows you to skip padding.

You can lookup the whole API of the library [here](https://github.com/mgechev/blobreader/tree/master/docs).
