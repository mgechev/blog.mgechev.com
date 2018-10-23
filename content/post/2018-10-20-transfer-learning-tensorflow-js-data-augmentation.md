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

While experimenting with enhancements of the prediction model of [Guess.js](https://guessjs.com), I started looking at deep learning. I've been mostly focused on recurrent neural networks (RNNs), specifically LSTM because of their ["unreasonable effectiveness"](https://karpathy.github.io/2015/05/21/rnn-effectiveness/) in the domain of Guess.js. In the same time, I started looking at convolutional neural networks (CNNs), which although less traditionally, are also often used for time series. CNNs are usually used for image classification, recognition, and detection.

<img src="/images/tfjs-cnn/rnn.svg" alt="Recurrent Neural Network" style="display: block; margin: auto; margin-top: 20px;">
<div style="text-align: center; display: block; margin: auto; font-size: 0.8em; margin-bottom: 20px;">Recurrent neural network</div>

After playing around with CNNs, I remembered an [experiment I did](https://www.youtube.com/watch?v=0_yfU_iNUYo) a few years ago, when the browser vendors introduced the `getUserMedia` API. In this experiment, I used the user's camera as a controller for playing a small JavaScript clone of Mortal Kombat 3. You can find the game at my [GitHub account](https://github.com/mgechev/mk.js). As part of the experiment, I implemented a very basic posture detection algorithm which classifies an image into the following classes:

- Upper punch with the left and right hands
- Kick with the left and right legs
- Walking left and right
- Squatting
- None of the above

The algorithm is so simple, that I'd be able to explain it in a few sentences:

>The algorithm takes a snapshot of the background behind the user. Once the user enters the scene, the algorithm was finding the difference between the original, background frame, and the current frame with the user inside of it. This way, it's able to detect where the user's body is. As next step, the algorithm renders the user's body with white on a black canvas. As next step, it builds a vertical and a horizontal histograms summing the values for each pixel. Based on the aggregated calculation, the algorithm detects what is the current user posture.

You can find demo of the implementation in the video below. The source code is at my [GitHub account](https://github.com/mgechev/movement.js).

<iframe style="width: 100%; height: 400px;" src="https://www.youtube.com/embed/0_yfU_iNUYo" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

Although I had success with controlling my tiny MK clone, the algorithm was far from perfect. It requires a frame with the background behind the user. For the detection procedure to work properly, the background frame needs to be with the same color over the course of execution of the program. This means that changes in the light, shadows, etc., would introduce disturbance and inaccurate results. Finally, the algorithm does not recognize actions - based on a background frame, it classifies another frame as a posture from a predefined set.

Now, given the advancements in the Web platform APIs, and more specifically WebGL, I decided to give the problem another shot by using TensorFlow.js.

## Introduction

In this blog post, I'll share my experience on building a posture classification algorithm using TensorFlow.js and MobileNet. In the process, we'll look at the following topics:

- Collecting training data for image classification
- Performing data augmentation using [imgaug](https://github.com/aleju/imgaug)
- Transfer learning with MobileNet
- Binary classification and n-ary classification
- Training an image classification TensorFlow.js model in Node.js and using it in the browser
- Action classification with LSTM

For the purposes of this article, we'll relax the problem to posture detection based on a single frame, in contrast to recognizing an action from a sequence of frames. We'll develop a **supervised deep learning model**, which based on an image from the user's laptop camera, indicates if on this image the user is punching, kicking, or not doing the first two.

By the end of the article, we'd be able to use our model for playing [MK.js](https://github.com/mgechev/mk.js):

<img src="/images/tfjs-cnn/demo.gif" alt="MK.js with TensorFlow.js" style="display: block; margin: auto; margin-top: 20px;">

**As a prerequirement, the reader should have a familiarity with fundamental concepts from the software engineering and JavaScript. No background in deep learning is required.**

In the next section, we'll make a brief, informal introduction to deep learning and neural networks. Feel free to skip this section if you're already familiar with the concepts model, test data, backpropagation, and optimization algorithms. The introduction below would be high-level, practical focused, without going into the theoretical foundations of the topic.

</div>
<section class="zippy" data-title="Introduction to Deep Learning & TensorFlow.js">

## Deep Learning For Software Engineers

To give an intuition on how neural networks work, I'd want to make an analogy with the test-driven development (or TDD).

In TDD, we start by writing tests for a function, even before we've implemented it. With the tests, we encapsulate our knowledge for the function's specification. Later, when we run the tests and they fail, we can adjust/alter the function's implementation so that we can estimate the expected result with higher precision. We repeat this process until we reach the function's desired behavior. In TDD there's also heavily involved process of constant refactoring, which we can ignore for simplicity.

Initially we have a dummy function implementation. Over time it evolves, approximating the specification of the desired functionality with higher precision, until we reach satisfactory precision. Notice that writing tests doesn't necessary guarantee that our function does what we expect it to do for all the possible arguments, even if we have <a href="https://www.stickyminds.com/article/100-percent-unit-test-coverage-not-enough">100% test coverage</a>.

Believe me or not, but this is a close high-level, abstract analogy of how we can solve a problem using deep learning. In deep learning, instead of developing a function, we're working on a <strong>model</strong> which approximates a function. Instead of specifying the function's behavior with test cases, in supervised learning, we use pairs - an input and an expected output. We will call these pairs <strong>test data</strong>.

The implementation of the model starts by using our intuition for the problem in order to implement a generic model that <i>may show good results</i> for this specific problem's domain. After that, we pass our training data through the model, we get the calculated output and compare it with the expected result. Given the difference between them, the model calculates a <strong>gradient</strong> and propagates it backwards. This way the model adjusts itself to produce more precise results next time and approximate the ideal solution with closer proximity.

### Why Do We Need Deep Learning?

As software engineers we often write functions with a very well defined specification. For example, there are very well defined rules on how to produce the monthly bank statement for a given client. The problem's specification can be easily translated to code. Such problems usually depend on a small number of variables (1, 100, or 100,000); it's easy to hardcode rules which transform them into the actual solution.

In contrast, deep learning can work with many more variables which have much larger domain. Using neural networks, we take a huge leap - we know what the algorithm should produce when we pass a given input but we have no idea how. Since coming up with an algorithm could be extremely hard, we build a model and let it figure out the algorithm itself.

The model figures the algorithm out by finding patterns in our data called <strong>features</strong>. Since we give to the model the expected result that it needs to produce, it can adjust itself internally so that it can produce a closer approximation of the function which solves given problem. This process is known as <strong>training</strong> and is achieved using an <strong>optimization algorithm</strong>.

### Feed-Forward Architecture

Each introduction to deep learning starts with an explanation of <strong>feed-forward neural networks</strong>, also known as <strong>multilayer perceptron</strong>. The neural network below accepts a single input, has two hidden layers, and produces a single output. The hidden and the output layers have <strong>parameters</strong> associated with them, which are <strong>tensors</strong> with different ranks. We can think of the tensors as data structures which contain a bunch of numbers and we can perform a set of operations over them.

<img src="/images/tfjs-cnn/feed-forward.svg" alt="Feed-Forward Network" style="display: block; margin: auto; margin-top: 20px;">

When we pass an input to our neural network, it'll perform a <strong>sequential</strong> computation - it'll pass the input to the first layer, the model will perform a bunch of calculations, pass the output to the second layer, etc. Since the computation is sequential, this is a sequence model which we can define with TensorFlow.js as shown below:

```javascript
import * as tf from '@tensorflow/tfjs';

const model = tf.sequential();
model.add(tf.layers.inputLayer({ inputShape: [1] }));
model.add(tf.layers.dense({ units: 3, activation: 'relu' }));
model.add(tf.layers.dense({ units: 2, activation: 'relu' }));
model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
```

The snippet above shows how we can apply the [builder design pattern](https://en.wikipedia.org/wiki/Builder_pattern#Overview) for creating a deep learning model. We create sequential model and after that we add a bunch of layers to it.

The first layer has an input shape `1`. This means that we'll pass a single value. If we were going to pass an `64x64` image, the input would have been `[64, 64, 3]`, 64 rows, 64 columns and three channels for [RGB](https://en.wikipedia.org/wiki/RGB_color_model). After that we add a <strong>dense</strong> layer. Adding a dense layer with 3 units simply means that we want to add 3 nodes and connect each one of them with the input. This way, the calculation that the model performs would be propagated from the input neuron to the 3 neurons from the next layer.

As next step we define one more hidden dense layer with 2 neurons. Finally, we add one more layer with a single neuron. This is going to be our output layer.

Notice that with each layer we also introduce an `activation` property. In this case, it's either [`relu`](https://en.wikipedia.org/wiki/Rectifier_(neural_networks)) or [`sigmoid`](https://en.wikipedia.org/wiki/Sigmoid_function). These activations are functions which perform an operation over the layers' parameters. `relu` is usually [preferred over `sigmoid`](https://en.wikipedia.org/wiki/Rectifier_(neural_networks)#Advantages) because it has much better performance and other characteristics which contribute to bigger efficiency during training.

### Training a Deep Neural Network

Once we've defined the TensorFlow.js model, we have to "compile" it. We can compile a model by using the `compile` method:

```javascript
model.compile({
  optimizer: tf.train.adam(10e-6),
  loss: tf.losses.sigmoidCrossEntropy,
  metrics: ['accuracy']
})
```

The `compile` accepts a configuration object where we can specify a bunch of properties, important of which are:

- `optimizer` - the algorithm to be used for training the neural network. The algorithm we specify may have an enormous impact on how long it takes to train a model. The `adam` and `adamax` are known to perform well in most cases
- `loss` - the `loss` property specifies the function which should be used for calculating the "difference" between the expected output and the one produced by the neural network. Difference is not an accurate term but it gives a good intuition what `loss` is used for. It's important to pick a `loss` function which will not make the [gradient stuck in a local minima](https://en.wikipedia.org/wiki/Gradient_descent#Description)
- `metrics` - here we list the metrics based on which we want to judge how well our model performs

### Developing a Simple Model

Now let's develop a simple multilayer perceptron for guessing which is the current season based on the data of the year as an input.

For the purpose, we'll first generate dataset. For each season, we'll generate *`n`* days and associate a vector corresponding to the given month. For the summer we'll use the vector `[1, 0, 0, 0]`, for the spring `[0, 1, 0, 0]`, for the fall `[0, 0, 1, 0]`, and for the winter `[0, 0, 0, 1]`. The days will be relative to 1st of January, so for example, the winter day 2st of January we can represent with the tuple: `[1, [0, 0, 0, 1]]`. Vectors with *`n`* elements which have all zeroes and a single `1` are called <strong>one hot vectors</strong>.

Here's the algorithm which will generate the dataset:

```javascript
const data = [
  { start: summerStart,
    end: summerEnd,
    value: [1, 0, 0, 0] },
  { start: springStart,
    end: springEnd,
    value: [0, 1, 0, 0] },
  { start: fallStart,
    end: fallEnd,
    value: [0, 0, 1, 0] },
  { start: winterStart,
    end: winterEnd,
    value: [0, 0, 0, 1] }
];

const generateData = () => {
  for (let s = 0; s < data.length; s++) {
    const firstDate = new Date(`1/1/${data[s].start.getFullYear()}`).getTime();
    const picked = {};
    for (let i = 0; i < TotalItems; i++) {
      const { start, end, value } = data[s];
      const startDay = toDay(start.getTime() - firstDate);
      const endDay = toDay(end.getTime() - firstDate);
      let day = Math.ceil(Math.random() * (endDay - startDay) + startDay);
      while (picked[day]) {
        day = Math.ceil(Math.random() * (endDay - startDay) + startDay);
      }
      picked[day] = true;
      result.push([day, value]);
    }
  }
  return result;
};
```

Later, once we have our dataset, we can define our model:

```javascript
const createModel = async () => {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [1], units: 7, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 10, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));
  await model.compile({
    optimizer: tf.train.adam(0.2),
    loss: tf.losses.softmaxCrossEntropy,
    metrics: ['accuracy']
  });
  return model;
};
```

We create a sequential model and add a few layers. Notice the differences from the last time:

- In the output layer we use a `softmax` activation
- The optimizer uses `softmaxCrossEntropy` loss function

### `softmax` vs `sigmoid`/`relu`

The main difference between these two groups of activation functions is in the number of results they produce. For example, for binary classification (i.e., when we have only two choices), we'd want to use a `sigmoid` or a `relu`. On the other hand, when we have `n` classes of objects (i.e., we're performing n-ary classification), we should use a `softmax`. The `softmax` activation function has one interesting property, the sum of the elements of the vector that it'll produces will equal to `1`.

### Training the Model

Now let's train the model! From the previous sections you may remember that we train the model by showing it input and output tuples. Later, the model calculates an output based on the input we've passed, compares it with the correct answer and adjust its parameters using the optimization algorithm that we've provided.

TensorFlow.js allows us to train given model using only a few lines of code!

```javascript
const train = async (model, data) => {
  const xs = tf.tensor1d(data.map(d => d[0] / 365));
  const ys = tf.stack(data.map(d => d[1]));
  await model.fit(xs, ys, {
    batchSize: Math.floor(0.4 * data.length),
    epochs: 200,
    callbacks: {
      onEpochEnd: async (_, logs) => {
        console.log('Cost: %s, accuracy: %s', logs.loss.toFixed(5), logs.acc.toFixed(5));
        await tf.nextFrame();
      }
    }
  });
};
```

The `train` function accepts the model that we created in `createModel` above, and part of the dataset that we generated with `generateData`. Let us remember the shape of the array produced by `generateData`:

```json
[
  [1, [0, 0, 0, 1]],
  [200, [1, 0, 0, 0]],
]
```

The array above contains two training examples, one for the 2nd day of the year, and one for the 201st. The second day of the year is winter and the 201st is summer.

As next step, we create two tensors:

- `xs` - an one dimensional tensor which contains the dates for each training example. We're going to use `xs` as input of the model
- `ys` - contains the one-hot vectors corresponding to the days. These are going to be the outputs that we're going to pass to the model, so that it can adjust it parameters with the optimization algorithm

Finally, we invoke the `fit` method, passing the inputs (`xs`), outputs `ys`, and a configuration object.

Let's take a look at the `batchSize` and `epochs` properties of the configuration object. The value of `batchSize` is 40% of the number of elements in our training set. This means that TensorFlow.js will train our model on steps, where on each step it'll take 40% of the elements from the training set. For example, in the first step TensorFlow.js will invoke the model with the first 40% of the elements, on the second step, with the second 40% of the elements, and on the third step, with the remaining 20%. After each step, the model will adjust its parameters by using the optimization algorithm.

This triple of steps (i.e., invoking the model for the first 40%, second 40%, and last 20%), we'll call an epoch. In the example, we've set the number of epochs to 200.

In the end of each epoch we log the current accuracy (i.e., the ratio of the number of times our model has returned the expected input over the total invocations) and the loss. Remember that the loss indicates the "difference" between the produced output and the expected output.

Now after we invoke the script, we'll get output similar to:

```
Epoch 1 / 200
eta=0.0 ==>- acc=0.57 loss=1.20
91ms 337us/step - acc=0.39 loss=1.31
Cost: 1.31161, accuracy: 0.39259
Epoch 2 / 200
eta=0.0 ==>- acc=0.59 loss=1.17
48ms 177us/step - acc=0.53 loss=1.20
Cost: 1.20253, accuracy: 0.52963
Epoch 3 / 200
eta=0.0 ==>- acc=0.74 loss=1.02
39ms 145us/step - acc=0.70 loss=1.12
Cost: 1.12104, accuracy: 0.69630
Epoch 4 / 200
eta=0.0 ==>- acc=0.74 loss=1.01
39ms 146us/step - acc=0.75 loss=1.02
Cost: 1.01902, accuracy: 0.74815
Epoch 5 / 200
eta=0.0 =>-- acc=0.87 loss=0.91
44ms 162us/step - acc=0.81 loss=0.95
Cost: 0.95307, accuracy: 0.81111
```

Notice how over time the accuracy increases, and the loss decreases. As a rule of thumb, if the loss stops decreasing for a few epochs, the model would probably not achieve higher accuracy so we should stop training and tune our parameters.

### Other Model Architectures

The multilayer perceptron is just one example for a neural network architecture. There are more advanced models, which are more appropriate for solving some problems.

For example, for performing image recognition, detection, or classifications, the convolutional neural networks are known to perform well. For natural language processing, on the other hand, researchers are using recurrent neural networks. We'll stop on convolutional neural networks in a later section of this article.

</section>

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

<div class="zippy" data-title="Convolutional Neural Networks">
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
        <div class="btn">
          <i class="fa fa-camera"></i>
        </div>
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
        <div class="btn">
          <i class="fa fa-camera"></i>
        </div>
        <video autoplay></video>
      </div>
    </div>
  </div>
</div>

More text

<div class="image-widget" id="n-ary-class">
  <div class="prediction">
  </div>
  <div class="tab" id="n-ary-class-tab">
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
        <div class="btn">
          <i class="fa fa-camera"></i>
        </div>
        <video autoplay></video>
      </div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@0.11.7"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@0.1.1"></script>
<script src="/assets/js/tfjs/ui.js"></script>
<link rel="stylesheet" href="/assets/css/tfjs/ui.css">
