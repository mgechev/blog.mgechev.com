---
author: minko_gechev
categories:
- Machine learning
- TensorFlow
- CNN
date: 2018-10-20T00:00:00Z
draft: true
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

While experimenting with enhancements of the prediction model of [Guess.js](https://guessjs.com), I started looking at deep learning. I've been mostly focused on recurrent neural networks (RNNs), specifically LSTM because of their ["unreasonable effectiveness"](https://karpathy.github.io/2015/05/21/rnn-effectiveness/) in the domain of Guess.js. In the same time, I started looking at convolutional neural networks (CNNs), which although less traditionally, are also often used for time series. CNNs are often used for image classification, recognition, and detection. I remembered and [experiment I did](https://www.youtube.com/watch?v=0_yfU_iNUYo) a few years ago, when the browser vendors introduced the `getUserMedia` API.

In this experiment, I used the user's camera as a controller for playing a JavaScript clone of Mortal Kombat 3. You can find the game at my [GitHub account](https://github.com/mgechev/mk.js). As part of the experiment, I implemented a very basic posture detection algorithm which recognizes:

- Upper punch with the left and right hands
- Kick with the left and right legs
- Walking left and right
- Squatting

In short, the algorithm was taking a snapshot of the background behind the user. Once the user enters the scene, the algorithm was finding the difference between the original, background frame, and the current frame with the user inside of it. This way, I was able to detect where the user's body. As next step, the algorithm renders the user's body with white on a black canvas. This way, I was building vertical and horizontal histograms, and based on their values, detecting what the user is up to. You can find demo of the implementation below and the source code, at my [GitHub account](https://github.com/mgechev/movement.js).

<iframe width="560" height="315" src="https://www.youtube.com/embed/0_yfU_iNUYo" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

Although I did have success with controlling my tiny MK clone, the algorithm was far from perfect.

Now, give the advancements in the Web platform APIs, and more specifically WebGL, I decided to give the problem another shot by using TensorFlow.js.

## Introduction

In this blog post, I'll share my experience on building a posture classification algorithm using TensorFlow.js and MobileNet. In the process, we'll look at the following topics:

- Collect training data for image classification
- Perform data augmentation by using [imgaug](https://github.com/aleju/imgaug)
- Transfer learning with MobileNet
- Binary classification and n-ary classification
- Training an image classification model in Node.js and using it in the browser
- Improving the model
- Action classification with LSTM


