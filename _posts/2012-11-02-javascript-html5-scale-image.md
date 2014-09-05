---
title: JavaScript image scaling
author: minko_gechev
layout: post
permalink: /2012/11/02/javascript-html5-scale-image/
categories:
  - Browsers
  - FileReader
  - HTML5
  - Image processing
  - JavaScript
  - Programming
  - Webkit
tags:
  - Development
  - FileReader
  - HTML5
  - Internet
  - JavaScript
  - Programming
  - webkit
---
I haven&#8217;t wrote here for a while so I decided to write about something more practical. Actually the idea for the post come from one my response in <a title="StackOverflow" href="http://stackoverflow.com/questions/13177698/select-an-image-and-manipulate-it-in-javascript-no-form-submission/13178084#13178084" target="_blank">stackoverflow</a>. The post is connected with pure client side image scaling. While you&#8217;re reading the example I hope that you&#8217;ll see how powerful is the HTML5 API and how with few lines of code you can do something which in other technologies is much more complex.  
So firstly I&#8217;ll post the source code with the example in JSFiddle, after that I&#8217;m going to explain everything step by step.

**The HTML form**

{% highlight html %}<input id="picture" type="file" name="picture" />
<table>
  
  <tr>
    <td>
      Width
    </td>
    
    
    <td>
      <input id="width" style="margin-left: 20px; width: 30px;" type="text" value="200" />px
    </td>
    
  </tr>
  
  
  <tr>
    <td>
      Height
    </td>
    
    
    <td>
      <input id="height" style="margin-left: 20px; width: 30px;" type="text" value="200" />px
    </td>
    
  </tr>
  
  
</table>
<canvas width="200" height="200" style="border: 1px solid black;" id="canvas"></canvas>


<button id="saveButton">Save</button>{% endhighlight %}

**JavaScript (the actual code)**

{% highlight javascript %}(function () {

    (function () {
        document.getElementById('picture').addEventListener('change', handleFileSelect, false);
        document.getElementById('width').addEventListener('keyup', handleSizeChanged, false);
        document.getElementById('height').addEventListener('keyup', handleSizeChanged, false);
        document.getElementById('saveButton').addEventListener('click', saveImage, false);
    }());

    var currentImage,
        canvas = document.getElementById('canvas');

    function saveImage() {
        document.location = canvas.toDataURL();
    }

    function handleSizeChanged() {
        var value = this.value,
            dimension = this.id;                
        if (!/(width|height)/.test(dimension)) {
            return;
        }
        if (/^\d+$/.test(value)) {
            canvas[dimension] = this.value;
            renderImage();
        }
    }

    function handleFileSelect(evt) {
        var file = evt.target.files[0];
            if (!file.type.match('image.*')) {
                console.error('Unknown format!');
            }
        var reader = new FileReader();

        reader.onload = function(e) {
            currentImage = e.target.result;            
            renderImage();
        };

        reader.readAsDataURL(file);
     }

    function renderImage() {
        var data = currentImage,
            img = document.createElement('img');
        img.src = data;
        img.onload = function () {
            var can = canvas,
                ctx = can.getContext('2d');
                ctx.drawImage(this, 0, 0, can.width, can.height);
        };
    }
}());{% endhighlight %}



So let's begin with the HTML. I've created a simple form with a file input, a table which contains two fields required for setting the size of the image, a canvas used for the image scaling and a save button. I don't think that there's something more to explain here...

Now let's look at the JavaScript. The script is relatively simple and actually we don't need any framework for it. We don't even need to create any globals (cool, ah?). I've wrapped the whole stuff into a self-invoking function. In the function we have one more self-invoking function which sets the event handlers. I decided to make it <a href="http://blog.mgechev.com/2012/08/29/self-invoking-functions-in-javascript/" target="_blank">self-invoking</a> anonymous because in that way I'll be sure that it'll be called just once. In the initialization I simply add an event listener on the file input, which waits for value change. On keyup there're two event listeners - listening for width/height change of the text inputs. And the last event listener will be executed when an event is triggered by click on the "Save" button. Nothing so special...(actually the whole idea is to show you how simple is that :-)).  
Let's first look at the *handleFileSelect*. When a file is selected I get the file (

{% highlight javascript %}var file = evt.target.files[0];{% endhighlight %}

) and check for it's type (actually I check it's mime type). If the file is not an image I simply log an error and stop the function execution. Otherwise (if the file is an image) I create *new FileReader*. As you might guess from it's name it's responsible for reading the file. With the line:

{% highlight javascript %}reader.readAsDataURL(file);{% endhighlight %}

I read the file. Here the file won't be read in binary but in base64 encoding instead. Because the file loading is asynchronous (imagine we want to load 1 GB file and the loading was synchronous, our application would block until the file is completely loaded...) that's why I've added callback which will be invoked when the file is being read. In this callback I set the *currentImage* to the loaded image and call the *renderImage* method.  
Now let's look into the *renderImage*. The *renderImage* method already has access to the *currentImage* so it just creates new *img* element (that's because the *drawImage* method accepts as first argument *img* element) with *src* the base64 encoded image. On load of the created *img* element I render it on the canvas, using it's 2d context.

Now let's look at the *handleSizeChanged*. This method changes the size of the canvas on change of any of the text inputs. On *keyup* of a text input *handleSizeChanged* is being fired. In *handleSizeChanged* I first get the input id (because I'm lazy aand I don't want to look at two cases - width/height). After that I validate the input id - it's valid only if it's value is width or height (who knows may be someone has changed the element's id). After that if the value of the field is a text (with the regex

{% highlight javascript %}/^\d+$/{% endhighlight %}

I check that) I set the size of the canvas.

The save of the image is that simple:

{% highlight javascript %}document.location = canvas.toDataURL();{% endhighlight %}

And that's all. Simple isn't it?

I hope that this post was funny and useful. The next post I plan is going to be much more exited and cool...just wait for it...