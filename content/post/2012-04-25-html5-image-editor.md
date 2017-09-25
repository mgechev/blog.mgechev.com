---
author: minko_gechev
categories:
- Development
- HTML5
- Image processing
- Internet
- JavaScript
- Programming
date: 2012-04-25T00:00:00Z
tags:
- Ajax
- Development
- HTML5
- Image processing
- Internet
- JavaScript
- Programming
- Projects
title: HTML5 image editor
url: /2012/04/25/html5-image-editor/
---

[<img class="alignleft size-medium wp-image-122" title="html5editor" src="/images/legacy/uploads/2012/04/html5editor-300x190.png" alt="" width="300" height="190" />][1]As you see HTML5 is everywhere (of course I exclude IE...or just before version 10). Web site used for quick image composition or edition is something very useful for the “modern web person”. There are few such services. Most of them use Flash. Nothing against it but...it’s too heavy for me...unnecessarily heavy. For all that stuff you can use HTML5 canvas. I also found some HTML5 image editors but their functionality was very limited. There is a feature which is very important and you cant find it in any of them. It’s frequently used in Adobe Photoshop and that’s why I decided to implement editor with that functionality – multiple layers. With multiple layers you can do whatever you want. You can combine different images change their color balances, contrast, blur...etc. I’ve started this editor a few weeks ago and I’m almost ready with it’s base functionality (layers manipulations). It’s open source, of course. Distributed under the terms of the General Public License. As you may be noticed in my older blog posts I’m fan of jQuery. Of course my use of jQuery is limited because I’m looking for best performance. More detailed look at the editor can be made in it’s [GitHub repository][2].

For it’s core architecture I considered use of the Command pattern because of the undo/redo functionality needed. Another thing that makes the editor flexible is it’s easy for extension core. It’s necessary because it’s core is coming just with the command encapsulation, layers logical reordering, some getters and setters. Everything else is achieved (or can be achieved) with different modules with an “init”, “execute” and “undo” methods. For adding extensions I use a single method called “extend” which is makes a shallow copy of the extension (module). The public API of the editor gives two methods used for command execution. The first one encapsulates the command into a stack (used for possible undo) and the second one is used for execution the commands without encapsulation. The second one is useful because of commands like “loadImage”, “saveImage”...etc. which don’t need undo functionality.

Basic functionality of the editor can be saw here: <http://mgechev.com/canvas-editor>.

I hope that in two/three months it’s full functionality will be implemented and ready for use. If you want to subscribe my development process you can follow me in [GitHub][3], [Twitter][4] or read my blog from time to time :-).

 [1]: /images/legacy/uploads2012/04/html5editor.png
 [2]: https://github.com/mgechev/image-editor "Image editor"
 [3]: https://github.com/mgechev
 [4]: http://twitter.com/mgechev