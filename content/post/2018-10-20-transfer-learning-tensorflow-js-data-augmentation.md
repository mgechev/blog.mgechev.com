---
author: minko_gechev
categories:
- Machine learning
- TensorFlow
- CNN
date: 2018-10-20T00:00:00Z
draft: false
tags:
- Machine learning
- TensorFlow
- CNN
- Transfer learning
- Data augmentation
- ML
title: Playing Mortal Kombat with TensorFlow.js. Transfer learning and data augmentation
og_image: /images/tf-mk/cover.png
url: /2018/10/20/transfer-learning-tensorflow-js-data-augmentation
---

While experimenting with enhancements of the prediction model of [Guess.js](https://guessjs.com), I started looking at deep learning. I've been mostly focused on recurrent neural networks (RNNs), specifically LSTM because of their ["unreasonable effectiveness"](https://karpathy.github.io/2015/05/21/rnn-effectiveness/) in the domain of Guess.js. In the same time, I started looking at convolutional neural networks (CNNs), which although less traditionally, are also often used for time series. CNNs are often used for image classification, recognition, and detection.
Then I remembered an [experiment I did](https://www.youtube.com/watch?v=0_yfU_iNUYo) a few years ago, when the browser vendors introduced the `getUserMedia` API. In this experiment, I used the user's camera as a controller for playing a JavaScript clone of Mortal Kombat 3. You can find the game at my [GitHub account](https://github.com/mgechev/mk.js). As part of the experiment, I implemented a very basic posture detection algorithm which recognizes:

- Upper punch with the left and right hands
- Kick with the left and right legs
- Walking left and right
- Squatting

The algorithm is so simple, that I'd be able to explain it in a few sentences:

>The algorithm takes a snapshot of the background behind the user. Once the user enters the scene, the algorithm was finding the difference between the original, background frame, and the current frame with the user inside of it. This way, it's able to detect where the user's body is. As next step, the algorithm renders the user's body with white on a black canvas. As next step, it builds a vertical and a horizontal histograms summing the values for each pixel. Based on the aggregated calculation, the algorithm detects what is the current user posture.

You can find demo of the implementation in the video below. The source code is at my [GitHub account](https://github.com/mgechev/movement.js).

<iframe width="560" height="315" src="https://www.youtube.com/embed/0_yfU_iNUYo" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

Although I had success with controlling my tiny MK clone, the algorithm was far from perfect. It requires a background frame, without the user inside of it. The background frame needs to be with the same color over the course of execution of the program so that the detection procedure to work properly. This means that changes in the light, shadows, etc., would introduce disturbance and inaccurate results. Finally, the algorithm does not recognize actions - based on a background frame, it classifies another frame as a posture from a predefined set.

Now, given the advancements in the Web platform APIs, and more specifically WebGL, I decided to give the problem another shot by using TensorFlow.js.

## Introduction

In this blog post, I'll share my experience on building a posture classification algorithm using TensorFlow.js and MobileNet. In the process, we'll look at the following topics:

- Collecting training data for image classification
- Performing data augmentation by using [imgaug](https://github.com/aleju/imgaug)
- Transfer learning with MobileNet
- Binary classification and n-ary classification
- Training an image classification TensorFlow.js model in Node.js and using it in the browser
- Improving the model
- Action classification with LSTM

For the purposes of this article, we'll relax the problem to posture detection based on a single frame, in contrast to recognizing an action from a sequence of frames.

In this blog post, we'll develop a **supervised deep learning model**, which based on an image from the user's laptop camera, indicates if on this image the user is punching, kicking, or not doing the first two.

**As a prerequirement, the reader should have a familiarity with software engineering and JavaScript. No background in deep learning is required.**

In the next section, we'll make a brief introduction to deep learning and neural networks. Feel free to skip this section if you're already familiar with the concepts model, test data, backpropagation, optimization algorithm.

<div class="zippy">
  <div>Header</div>

## Deep Learning for Software Engineers

To give an intuition on how neural networks work, I'd want to make an analogy with the test-driven development (or TDD).

In TDD, we start by writing tests for a function, even before we've implemented it. With the tests, we encapsulate our knowledge for the function's specification. Later, when we run the tests and they fail, we can adjust/alter the function's implementation so that we can estimate the expected result with higher precision. We repeat this process until we reach the desired function behavior. In TDD there's also heavily involved process of constant refactoring, which we can ignore for simplicity.

Believe me or not, but this is a very accurate high-level, abstract analogy of how we can solve a problem using deep learning. In deep learning, instead of developing a function, we're working on a **model** which estimates a function. Instead of specifying the function's behavior with test cases, we use pairs - an input and an expected output. We will call these pairs **test data**. Initially, using our intuition for the problem that we're solving, we start by implementing a generic model which *may show good results* for the problem that we want to solve. After that, we pass our training data through the model, we get the calculated output and compare it with the expected result. Given the difference between them, we propagate it backwards, so that we can adjust the model to give a more precise result next time, which better approximates our ideal solution. This process is known as **backpropagation** and is quite similar to the TDD phase in which we're tuning our function by adding different statements.

As software engineers we often write functions with a very well defined specification. For example, there are very well defined rules on how to produce the monthly bank statement for given client. There are well defined algorithms for this which can be easily translate to code. These problems usually depend on some small number of variables (1, 100, or 100,000) which have finite domain of values. It's easy to hardcode rules which transform them into the actual solution.

In contrast, deep learning can work with many more variables which have much larger domain. Using neural networks, we take a huge leap - we know what the algorithm should produce when we pass a given input but we have no idea how. Since coming up with an algorithm could be extremely hard, we build a model and let it figure out the algorithm itself. The model figures the algorithm out by finding patterns in our data called **features**. Since we give to the model the expected result that it needs to produce, it can adjust itself internally so that it can produce a closer approximation of the function which solves the general problem. This process is known as **training** and is achieved through many back propagations using an **optimization algorithm**.

### Feed-forward architecture

  Feed forward
</div>

## Collecting data

The accuracy of our algorithm depends to a very high extent on the quality of the training data. The bigger the variety of our training data is, the higher the accuracy of the model will be.

Our model should be able to recognize punches and kicks. This means that we should collect images from three different categories:

- Punches
- Kicks
- Others

For the purpose of this experiment, I collected these samples with two other volunteers ([@lili_vs](https://twitter.com/lili_vs) and [@gsamokovarov](https://twitter.com/gsamokovarov)). We recorded 5 videos with QuickTime on my MacBook Pro, each of which contained 2-4 punches and 2-4 kicks.

Now, since we have `mov` videos, we can use `ffmpeg`, to extract the individual frames and stored them as jpg images:

```shell
ffmpeg -i video.mov $filename%03d.jpg
```

At this step we have a bunch of images of three people performing actions. If we want to be able to train our model, we have to provide inputs and their corresponding outputs. This means that we have to categorize the frames from the videos that we extracted in the three categories above - punches, kicks, others. For each category we can create a separate directory and move all the corresponding images there.

This way, in each directory we should have roughly about 200 images, similar to the ones below:

![Image samples](/images/tfjs-cnn/all.jpg)

Notice that in directory "Others" we may have many more images. It'd be best if we reduce the number of other images to about 200 as well, otherwise, we risk to make our model biased towards the "Others" images.

As you can imagine, 600 photos taken in the same environment, with the same people, having the same movements would not make our algorithm very accurate and it may not perform great in the general case. To extract as much value as possible from our data, we can generate some extra samples by using **data augmentation**.

## Data Augmentation

Data augmentation means, increasing the number of data points by synthesizing new ones from the existing dataset. Usually, we use data augmentation for increasing the size and variety of our training set. In our case, we'd want to pass the original images to a set of transformations which produce new images. The new images should be categorized the same way by the neural network as the original ones, to make sure our training data contains only valid data points.

For example, valid transformations over our images would be rotation under 180 degrees, inverting the colors, blurring the images, etc. There are amazing open source tools for image data augmentation available online. For generating more data, I used [imgaug](https://github.com/aleju/imgaug). It contains a set of augmenters that can be applied probabilistically. The tool is written in Python. Currently, there's not rich enough alternative for JavaScript.

Here's the data augmentation logic that I applied:

```python3
np.random.seed(44)
ia.seed(44)

def main():
    for i in range(1, 190):
        draw_single_sequential_images(str(i), "others", "others-aug")
    for i in range(1, 190):
        draw_single_sequential_images(str(i), "hits", "hits-aug")
    for i in range(1, 190):
        draw_single_sequential_images(str(i), "kicks", "kicks-aug")

def draw_single_sequential_images(filename, path, aug_path):
    image = misc.imresize(ndimage.imread(path + "/" + filename + ".jpg"), (56, 100))
    sometimes = lambda aug: iaa.Sometimes(0.5, aug)
    seq = iaa.Sequential(
        [
            iaa.Fliplr(0.5), # horizontally flip 50% of all images
            # crop images by -5% to 10% of their height/width
            sometimes(iaa.CropAndPad(
                percent=(-0.05, 0.1),
                pad_mode=ia.ALL,
                pad_cval=(0, 255)
            )),
            sometimes(iaa.Affine(
                scale={"x": (0.8, 1.2), "y": (0.8, 1.2)}, # scale images to 80-120% of their size, individually per axis
                translate_percent={"x": (-0.1, 0.1), "y": (-0.1, 0.1)}, # translate by -10 to +10 percent (per axis)
                rotate=(-5, 5),
                shear=(-5, 5), # shear by -5 to +5 degrees
                order=[0, 1], # use nearest neighbour or bilinear interpolation (fast)
                cval=(0, 255), # if mode is constant, use a cval between 0 and 255
                mode=ia.ALL # use any of scikit-image's warping modes (see 2nd image from the top for examples)
            )),
            iaa.Grayscale(alpha=(0.0, 1.0)),
            iaa.Invert(0.05, per_channel=False), # invert color channels
            # execute 0 to 5 of the following (less important) augmenters per image
            # don't execute all of them, as that would often be way too strong
            iaa.SomeOf((0, 5),
                [
                    iaa.OneOf([
                        iaa.GaussianBlur((0, 2.0)), # blur images with a sigma between 0 and 2.0
                        iaa.AverageBlur(k=(2, 5)), # blur image using local means with kernel sizes between 2 and 5
                        iaa.MedianBlur(k=(3, 5)), # blur image using local medians with kernel sizes between 3 and 5
                    ]),
                    iaa.Sharpen(alpha=(0, 1.0), lightness=(0.75, 1.5)), # sharpen images
                    iaa.Emboss(alpha=(0, 1.0), strength=(0, 2.0)), # emboss images
                    iaa.AdditiveGaussianNoise(loc=0, scale=(0.0, 0.01*255), per_channel=0.5), # add gaussian noise to images
                    iaa.Add((-10, 10), per_channel=0.5), # change brightness of images (by -10 to 10 of original value)
                    iaa.AddToHueAndSaturation((-20, 20)), # change hue and saturation
                    # either change the brightness of the whole image (sometimes
                    # per channel) or change the brightness of subareas
                    iaa.OneOf([
                        iaa.Multiply((0.9, 1.1), per_channel=0.5),
                        iaa.FrequencyNoiseAlpha(
                            exponent=(-2, 0),
                            first=iaa.Multiply((0.9, 1.1), per_channel=True),
                            second=iaa.ContrastNormalization((0.9, 1.1))
                        )
                    ]),
                    iaa.ContrastNormalization((0.5, 2.0), per_channel=0.5), # improve or worsen the contrast
                ],
                random_order=True
            )
        ],
        random_order=True
    )

    im = np.zeros((16, 56, 100, 3), dtype=np.uint8)
    for c in range(0, 16):
        im[c] = image

    for im in range(len(grid)):
        misc.imsave(aug_path + "/" + filename + "_" + str(im) + ".jpg", grid[im])
```

For each image above, the images will produce 16 other images with applied different transforms on top. Here's an example for how the augmented images would look like:

[![Grid with augmented images](/images/tfjs-cnn/aug.jpg)](/images/tfjs-cnn/aug.jpg)

Notice that in the script above, we also scale the images to `100x56` pixel. We do this to reduce the amount of pixels, and respectively the amount of computations which our model would have to perform.

## Building the Model

Now let's build the model that we're going to use for classification!

Since we're dealing with images, we're going to use a convolutional neural network (CNN). This network architecture is known to be good for image recognition, detection, and classification.

If you're interested in reading more about CNNs, you can expand the section below. Otherwise, feel free to skip the theory and get directly to practice!

<div class="zippy">
  <div>Header</div>
  CNNs
</div>

### Transfer Learning

The figure below shows VGG-16, a popular CNN which is used for classification of images.

<img src="/images/tfjs-cnn/vgg-16.svg" style="display: block; margin: auto;">

The VGG-16 network recognizes 1000 classes of images. It has 16 layers (we don't count the output and the pooling layers). Such a large network will be very hard to train in practice. It'll require a large dataset and many hours of training.

As we mentioned in the CNN section above, the hidden layers in a CNN recognize different features of an image, starting from edges, going to more advanced features, such as shapes and so on.

Transfer learning allows us to reuse an already existing and trained network. We can take the output from any of the layers of the existing network and feed it as an input to a new neural network. This way, by using backpropagation, over time we can train the newly created neural network to recognize new higher level features and properly classify our images.

<img src="/images/tfjs-cnn/transfer.svg" style="display: block; margin: auto; margin-top: 20px; margin-bottom: 20px;">

For our purposes, we'll use the MobileNet neural network, from the [@tensorflow-models/mobilenet](https://www.npmjs.com/package/@tensorflow-models/mobilenet) package. MobileNet is as powerful as VGG-16 but it's also much smaller which makes its forward propagation much faster. MobileNet has been trained on the [ILSVRC-2012-CLS](http://www.image-net.org/challenges/LSVRC/2012/) image classification dataset.

You can give MobileNet a try in the widget below. Feel free to select an image from your file system or use the camera as an input:

<div class="image-widget" id="mobile-net">
  <div class="prediction"></div>
  <div class="tab" id="mobile-net-tab">
    <ul>
      <li>Upload</li>
      <li>Camera</li>
    </ul>
    <div class="content">
      <div class="upload">
        <input type="file">
        <h1>Drag & Drop file here</h1>
        <img class="image-preview">
      </div>
      <div class="cam">
        video
        <video autoplay></video>
      </div>
    </div>
  </div>
</div>

Few of the choices that we have when we develop a model with transfer learning are:

- The output from which layer of the source model are we going to use as an input for the target model
- How many layers from the target model do we want to train, if any

For our purposes, we're not going to train any layers from MobileNet. We're directly going to pick the output from `global_average_pooling2d_1` and pass it to our tiny neural network.

### Defining the Model

Let us first solve a smaller problem - detect if the user is punching on a frame or not. This is a typical binary classification problem. For the purpose, we can define the following model:

```typescript
import * as tf from '@tensorflow/tfjs';

const model = tf.sequential();
model.add(tf.layers.inputLayer({ inputShape: [1024] }));
model.add(tf.layers.dense({ units: 1024, activation: 'relu' }));
model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
model.compile({
  optimizer: tf.train.adam(10e-5),
  loss: tf.losses.sigmoidCrossEntropy,
  metrics: ['accuracy']
});
```

This snippet defines a simple model with a layer with 1024 units with ReLU activation and one output unit which goes through a sigmoid function. The sigmoid will produce a number between 0 and 1, depending on the probability the user to be punching at the given frame.

The `compile` method, compiles the layers together, preparing the model for training and evaluation. Here we declare that we want to use `adam` for optimization. We also declare that we want to compute the loss with sigmoid cross entropy and we specify that we want to evaluate the model in terms of accuracy.

If we want to apply transfer learning, we need to first load MobileNet. Because it wouldn't be practical to train our model with over 3k images in the browser, we'll load it in Node.js, from a file:

```typescript
export const loadModel = async () => {
  const mn = new mobilenet.MobileNet(1, 1);
  mn.path = `file://${ModelPath}`;
  await mn.load();
  return (input): tf.Tensor1D =>
      mn.infer(input, 'global_average_pooling2d_1')
        .reshape([1024]);
};
```

Notice that in the `loadModel` method we return a function, which accepts a single dimensional tensor as an input and returns `mn.infer(input, Layer)`. The `infer` method of MobileNet accepts as argument an input and a layer. The layer specifies the output from which hidden layer we'd want to get the output from.

Now, in order to train this model, we'll have to create our training set. For the purpose, we'll have to pass each one of our images through the `infer` method of MobileNet and associate a label with it - 1 for images which contain a punch, and 0 for images without a punch:

```javascript
const punches = require('fs')
  .readdirSync(Punches)
  .filter(f => f.endsWith('.jpg'))
  .map(f => `${Punches}/${f}`);

const others = require('fs')
  .readdirSync(Others)
  .filter(f => f.endsWith('.jpg'))
  .map(f => `${Others}/${f}`);

const ys = tf.tensor1d(
  new Array(punches.length).fill(1)
    .concat(new Array(others.length).fill(0)));

const xs: tf.Tensor2D = tf.stack(
  punches
    .map((path: string) => mobileNet(readInput(path)))
    .concat(others.map((path: string) => mobileNet(readInput(path))))
) as tf.Tensor2D;
```

In the snippet above, first we read the files in the directory containing pictures of punches, and the one with other samples. After that, we define a one dimensional tensor with shape `[TotalImages]`. The tensor will start with `1` which count equals to the numbers of images with a punch followed with `0` with count equals to the number of other images.

In `xs` we stack the results from the invocation of the `infer` method of MobileNet for the individual images. Finally, for each `i` from `0` to `TotalImages`, we should have `ys[i]` is `1` if `xs[i]` corresponds to an image with a punch, and `0` otherwise.

## Training the Model

Now, the only thing left is to train the model! For the purpose, invoke the method `fit` of the model's instance:

```typescript
await model.fit(xs, ys, {
  epochs: Epochs,
  batchSize: parseInt(((punches.length + others.length) * BatchSize).toFixed(0)),
  callbacks: {
    onBatchEnd: async (_, logs) => {
      console.log('Cost: %s, accuracy: %s', logs.loss.toFixed(5), logs.acc.toFixed(5));
      await tf.nextFrame();
    }
  }
});
```

The code above, invokes `fit` with three arguments - `xs`, `ys`, and a configuration object. In the configuration object we've set for how many epochs we want to train the model, we've provided a batch size, and a callback which will be invoked after each batch.

The batch size determines how large subset of `xs` and `ys` we'll train our model with in one epoch. For each epoch, TensorFlow.js will pick a subset of `xs` and the corresponding elements from `ys`, it'll perform forward propagation, get the output from our `sigmoid` layer and after that, based on the loss, it'll perform optimization using the `adam` algorithm.

<div class="image-widget" id="binary-class">
  <div class="prediction">
  </div>
  <div class="tab" id="binary-class-tab">
    <ul>
      <li>Upload</li>
      <li>Camera</li>
    </ul>
    <div class="content">
      <div class="upload">
        <input type="file">
        <h1>Drag & Drop file here</h1>
        <img class="image-preview">
      </div>
      <div class="cam">
        video
        <video autoplay></video>
      </div>
    </div>
  </div>
</div>

<style>
.image-widget {
  border-radius: 5px;
}

.prediction {
  text-align: center;
  margin-bottom: 10px;
}

.prediction table {
  margin-bottom: 0px;
  margin-top: 5px;
}

.tab ul {
  width: 140px;
  display: block;
  margin: auto;
  margin-bottom: 10px !important;
}

.tab li {
  display: inline-block;
  padding: 9px;
  padding-top: 3px;
  padding-bottom: 3px;
  cursor: pointer;
  margin: 0;
  border-radius: 25px;
  font-size: 0.9em;
}

.tab li.selected {
  background-color: #eee;
}

.upload {
  height: 200px;
  border: 5px dashed #eee;
  position: relative;
  overflow: hidden;
}

.upload img {
  margin: auto;
  display: block;
}

.upload input[type="file"] {
  position: absolute;
  top: 0px;
  left: 0px;
  height: 100%;
  width: 100%;
  opacity: 0;
  z-index: 3;
  cursor: pointer;
}

.upload.highlight {
  border: 5px dashed #ccc;
}

.upload h1 {
  position: absolute;
  top: 50px;
  font-family: Verdana;
  left: calc(50% - 181px);
  color: #eee;
  font-weight: 600;
  font-size: 32px !important;
  text-align: center;
}

.upload.highlight h1 {
  color: #ccc;
}

.upload.filled {
  border: 5px dashed transparent;
  height: auto;
}

.upload.filled h1 {
  display: none;
}


/************** Spinner *************/

.spinner {
  margin: auto;
  margin-right: 11px;
  display: inline-block;
  width: 20px;
  height: 20px;
  position: relative;
  text-align: center;

  -webkit-animation: sk-rotate 2.0s infinite linear;
  animation: sk-rotate 2.0s infinite linear;
}

.dot1, .dot2 {
  width: 60%;
  height: 60%;
  display: inline-block;
  position: absolute;
  top: 0;
  background-color: #EE9D27;
  border-radius: 100%;

  -webkit-animation: sk-bounce 1.0s infinite ease-in-out;
  animation: sk-bounce 1.0s infinite ease-in-out;
}

.dot2 {
  top: auto;
  bottom: 0;
  -webkit-animation-delay: -0.5s;
  animation-delay: -0.5s;
  background-color: #CD2E28;
}

@-webkit-keyframes sk-rotate { 100% { -webkit-transform: rotate(360deg) }}
@keyframes sk-rotate { 100% { transform: rotate(360deg); -webkit-transform: rotate(360deg) }}

@-webkit-keyframes sk-bounce {
  0%, 100% { -webkit-transform: scale(0.0) }
  50% { -webkit-transform: scale(1.0) }
}

@keyframes sk-bounce {
  0%, 100% {
    transform: scale(0.0);
    -webkit-transform: scale(0.0);
  } 50% {
    transform: scale(1.0);
    -webkit-transform: scale(1.0);
  }
}

</style>

<canvas id="crop" width="100" height="56" style="display: none"></canvas>

<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@0.11.7"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@0.1.1"></script>
<script>
  var crop = document.getElementById('crop');
  var tab = function (el) {
    var nav = el.getElementsByTagName('ul')[0];
    var panel = el.getElementsByClassName('content')[0];
    var tabs = [].slice.call(nav.getElementsByTagName('li'));
    var panels = [].slice.call(el.querySelectorAll('.content > div'));
    panels.forEach(function (p) {
      p.style.display = 'none';
    });
    tabs.forEach(function (el, idx) {
      el.addEventListener('click', function (e) {
        panels.forEach(function (e) {
          e.style.display = 'none';
        });
        panels[idx].style.display = 'block';
        tabs.forEach(function (e) {
          e.className = '';
        });
        el.className = 'selected';
      });
    });
    tabs[0].className = 'selected';
    panels[0].style.display = 'block';
  };

  var dropArea = function (el, onDrop) {
    var dropArea = el;

    dropArea.querySelector('input[type="file"]').onchange = function (event) {
      if (this.files && this.files[0]) {
        previewFile(this.files[0]);
      }
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (eventName) {
      dropArea.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });

    ;['dragenter', 'dragover'].forEach(function (eventName) {
      dropArea.addEventListener(eventName, highlight, false);
    })

    ;['dragleave', 'drop'].forEach(function (eventName) {
      dropArea.addEventListener(eventName, unhighlight, false)
    })

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false)

    function preventDefaults (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    function highlight(e) {
      dropArea.classList.add('highlight')
    }

    function unhighlight(e) {
      dropArea.classList.remove('highlight')
    }

    function fill(e) {
      dropArea.classList.add('filled')
    }

    function handleDrop(e) {
      previewFile(e.dataTransfer.files[0]);
    }

    function previewFile(file) {
      var reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = function() {
        var img = dropArea.querySelector('.image-preview');
        img.src = reader.result;
        fill(dropArea);
        img.onload = function () {
          var canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext('2d').drawImage(img, 0, 0);
          onDrop(canvas);
        };
      };
    }
  }

  var scale = function (canvas) {
    crop
      .getContext('2d')
      .drawImage(
        canvas,
        0,
        0,
        canvas.width,
        canvas.width / (100 / 56),
        0,
        0,
        100,
        56
      );
    return crop;
  };

  var grayscale = function (canvas) {
    var imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
    canvas.getContext('2d').putImageData(imageData, 0, 0);
  };

  var renderTable = function (conf) {
    var headers = conf.headers;
    var rows = conf.rows;
    var table = document.createElement('table');
    var header = document.createElement('thead');
    var headerTr = document.createElement('tr');
    headers.forEach(function (h) {
      var th = document.createElement('th');
      th.innerText = h;
      headerTr.appendChild(th);
    })
    header.appendChild(headerTr);
    table.appendChild(header);
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      row.forEach(function (cell) {
        var td = document.createElement('td');
        td.innerText = cell;
        tr.appendChild(td);
      })
      table.appendChild(tr);
    })
    return table;
  }

  var renderSpinner = function () {
    return '<div class="spinner"><div class="dot1"></div><div class="dot2"></div></div>';
  };

  var mobileNet = null;
  var punchModel = null;

  function predict(img) {
    img = scale(img)
    grayscale(img);
    var result = document.querySelector('#binary-class > .prediction')
    result.innerHTML = renderSpinner();
    Promise.all([
      mobileNet ? Promise.resolve(mobileNet) : mobilenet.load(),
      punchModel ? Promise.resolve(punchModel) : tf.loadModel('/assets/js/tfjs/punch/model.json')
    ])
    .then(function (models) {
      mobileNet = models[0];
      punchModel = models[1];
      var output = punchModel.predict(mobileNet.infer(img, 'global_average_pooling2d_1')).dataSync();
      var table = renderTable({
        headers: ['Action', 'Probability'],
        rows: [['Punch', parseFloat(output).toFixed(5)]]
      })
      result.innerHTML = 'Prediction <span class="prediction">'+ output +'</span>';
      result.innerHTML = '';
      result.appendChild(table);
    });
  }

  function mobileNetPredict(img) {
    var result = document.querySelector('#mobile-net > .prediction')
    result.innerHTML = renderSpinner();
    (mobileNet ? Promise.resolve(mobileNet) : mobilenet.load())
    .then(function (model) {
      mobileNet = model;
      var output = mobileNet.classify(img)
      .then(function (predictions) {
        result.innerHTML = '';
        var table = renderTable({
          headers: ['Object', 'Probability'],
          rows: predictions.map(function (p) {
            return [p.className, p.probability.toFixed(5)];
          })
        })
        result.appendChild(table);
      })
    });
  }

  tab(document.getElementById('mobile-net-tab'))
  dropArea(document.querySelectorAll('.upload')[0], mobileNetPredict);

  tab(document.getElementById('binary-class-tab'))
  dropArea(document.querySelectorAll('.upload')[1], predict);
</script>
