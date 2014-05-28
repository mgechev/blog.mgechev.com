---
title: HTML5 image editor
author: Minko Gechev
layout: post
permalink: /2012/04/25/html5-image-editor/
categories:
  - Development
  - HTML5
  - Image processing
  - Internet
  - JavaScript
  - Programming
tags:
  - Ajax
  - Development
  - HTML5
  - Image processing
  - Internet
  - JavaScript
  - Programming
  - Projects
---

[<img class="alignleft size-medium wp-image-122" title="html5editor" src="http://blog.mgechev.com/wp-content/uploads/2012/04/html5editor-300x190.png" alt="" width="300" height="190" />][1]As you see HTML5 is everywhere (of course I exclude IE&#8230;or just before version 10). Web site used for quick image composition or edition is something very useful for the &#8220;modern web person&#8221;. There are few such services. Most of them use Flash. Nothing against it but&#8230;it&#8217;s too heavy for me&#8230;unnecessarily heavy. For all that stuff you can use HTML5 canvas. I also found some HTML5 image editors but their functionality was very limited. There is a feature which is very important and you cant find it in any of them. It&#8217;s frequently used in Adobe Photoshop and that&#8217;s why I decided to implement editor with that functionality &#8211; multiple layers. With multiple layers you can do whatever you want. You can combine different images change their color balances, contrast, blur&#8230;etc. I&#8217;ve started this editor a few weeks ago and I&#8217;m almost ready with it&#8217;s base functionality (layers manipulations). It&#8217;s open source, of course. Distributed under the terms of the General Public License. As you may be noticed in my older blog posts I&#8217;m fan of jQuery. Of course my use of jQuery is limited because I&#8217;m looking for best performance. More detailed look at the editor can be made in it&#8217;s [GitHub repository][2].

For it&#8217;s core architecture I considered use of the Command pattern because of the undo/redo functionality needed. Another thing that makes the editor flexible is it&#8217;s easy for extension core. It&#8217;s necessary because it&#8217;s core is coming just with the command encapsulation, layers logical reordering, some getters and setters. Everything else is achieved (or can be achieved) with different modules with an &#8220;init&#8221;, &#8220;execute&#8221; and &#8220;undo&#8221; methods. For adding extensions I use a single method called &#8220;extend&#8221; which is makes a shallow copy of the extension (module). The public API of the editor gives two methods used for command execution. The first one encapsulates the command into a stack (used for possible undo) and the second one is used for execution the commands without encapsulation. The second one is useful because of commands like &#8220;loadImage&#8221;, &#8220;saveImage&#8221;&#8230;etc. which don&#8217;t need undo functionality.

Basic functionality of the editor can be saw here: <http://mgechev.com/canvas-editor>.

I hope that in two/three months it&#8217;s full functionality will be implemented and ready for use. If you want to subscribe my development process you can follow me in [GitHub][3], [Twitter][4] or read my blog from time to time :-).

 [1]: http://blog.mgechev.com/wp-content/uploads/2012/04/html5editor.png
 [2]: https://github.com/mgechev/image-editor "Image editor"
 [3]: https://github.com/mgechev
 [4]: http://twitter.com/mgechev