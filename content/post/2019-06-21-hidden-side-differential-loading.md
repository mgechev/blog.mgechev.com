---
author: minko_gechev
categories:
- Performance
- JavaScript
date: 2019-06-21T00:00:00Z
draft: true
tags:
- Performance
- JavaScript
title: The Hidden Side of Differential Loading
og_image: /images/dynamic-imports/imports.png
url: /2019/06/21/hidden-side-differential-loading
---

As part of Angular CLI version 8 we shipped [differential loading](https://dev.to/lacolaco/differential-loading-a-new-feature-of-angular-cli-v8-4jl) support that we enabled by default for everyone. This is an exciting feature that let's us provide modern JavaScript to users using modern browsers. The modern JavaScript we provide to evergreen browsers is smaller since it doesn't need ES2015 polyfills and uses more expressive syntax.

In this post, I want to mention some of the edge cases that folks can hit using differential loading the way it's possible today.

First, I want to make a distinguishment between differential loading and differential serving. In differential loading, the browser receives a list of options for JavaScript files it can bootstrap the page with. From there, it can pick one depending on different heuristics. With differential serving, the browser requests a script file and as part of the request headers, it provides its user agent (UA) string. The server can parse the UA and ships the latest version of JavaScript the browser supports.

Both approaches have their pros and cons. A huge benfit of differential loading is it's serving infrastructure simplicity. We need a static file server to implement it, so from the start it works with any CDN.

## How Does Differential Loading Work

Currently, given the state of the modern standards, to implement differential loading we provide two script files in the `index.html`:

```html
<script nomodule src="app-es5.js"></script>
<script type="module" src="app-es2015.js"></script>
```
From here there are few questions:

1. What's the difference between script with type `module` and no type?
1. What's the purpose of `nomodule`?
1. Can we use differential loading between other JavaScript versions?
1. Can we use differential loading with more than 2 JavaScript versions?

Let's explore these one by one.

### Script type

In HTML5 the `script` attribute is optional. If not specified the browser defaults to `text/javascript` ([W3](https://www.w3.org/TR/html5/scripting-1.html#attr-script-type)). Script with attribute `type="module"` will treat the JavaScript as ECMAScript module. There are few important differences between modules and scripts.
