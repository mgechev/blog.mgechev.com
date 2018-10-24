---
author: minko_gechev
categories:
- Machine learning
- TensorFlow
date: 2018-10-25T00:00:00Z
draft: true
tags:
- Machine learning
- TensorFlow
- ML
title: Introduction to TensorFlow.js for Software Engineers
og_image: /images/tf-mk/cover.png
url: /2018/10/25/introduction-to-tensorflow-js
---

To give an intuition on how neural networks work, I'd want to make an analogy with the test-driven development (TDD).

In TDD, we start by writing tests for a function, even before we've implemented it. With the tests, we encapsulate our knowledge for the function's specification. Later, when we run the tests and they fail, we adjust the function's implementation by altering or modifying statements so that we can estimate the expected result with higher precision. We repeat this process until we reach the function's desired behavior. In TDD there's also heavily involved process of constant refactoring, which we will ignore for simplicity.

Notice that initially we have a dummy function implementation. Over time it evolves, approximating the specification of the desired functionality with higher precision, until we reach satisfactory precision. Writing tests doesn't necessary guarantee that our function complies with its desired specification for all the possible arguments, even if we have <a href="https://www.stickyminds.com/article/100-percent-unit-test-coverage-not-enough">100% test coverage</a>. As Dijkstra said:

>Program testing can be used to show the presence of bugs, but never to show their absence!

TDD is in fact a close high-level, abstract analogy of how we can solve a problem using deep learning. In deep learning, instead of developing a function, we're working on a <strong>model</strong> which approximates a function (in fact, in software development, the function that we've developed often only approximates the desired specification). Instead of specifying the function's behavior with test cases, in supervised learning, we use pairs - an input and an expected output. We will call these pairs <strong>training data</strong>.

The implementation of the model starts by using our intuition for the problem in order to implement a generic model that <i>may show good results</i> for this specific problem's domain. After that, we pass our training data through the model, we get the calculated output and compare it with the expected result. Given the difference between them, the model calculates a <strong>gradient</strong> and propagates it backwards. This way the model adjusts itself to produce more precise results next time and approximate the ideal solution with closer proximity. We repeat this process until we get a satisfying approximation or we realize that we haven't picked an optimal model.

Although not too accurate, I hope the analogy from above provides a good intuition on how we build a deep learning model.

### Why Do We Need Deep Learning?

As software engineers we often write functions with a very well defined specification. For example, there are very well defined rules on how to produce the monthly bank statement for a given client. The problem's specification can be easily translated to code. Such problems usually depend on a small number of variables (1, 100, or 100,000); it's easy to hardcode rules which transform them into the actual solution.

In contrast, deep learning can work with many more variables which have much larger domain. Using neural networks, we take a huge leap - we know what the algorithm should produce when we pass a given input but we don't know how. Since coming up with an algorithm could be extremely hard, we build a model and let it figure out the algorithm itself.

The model figures the algorithm out by finding patterns in our data called <strong>features</strong>. Since we give to the model the expected result that it needs to produce, it can adjust itself internally so that it can produce a closer approximation of the function which solves given problem. This process is known as <strong>training</strong> and is achieved using an <strong>optimization algorithm</strong>.

### Feed-Forward Architecture

Each introduction to deep learning starts with an explanation of the <strong>feed-forward neural network</strong>, also known as the <strong>multilayer perceptron</strong>. The neural network below accepts a single input, has two hidden layers, and produces a single output. The hidden and the output layers have <strong>parameters</strong> associated with them, which are <strong>tensors</strong> with different ranks. We can think of the tensors as data structures which contain a bunch of numbers and we can perform a set of operations over them.

<img src="/images/tfjs-cnn/feed-forward.svg" alt="Feed-Forward Network" style="display: block; margin: auto; margin-top: 20px;">

When we pass an input to our neural network, it'll perform a <strong>sequential</strong> computation - it'll pass the input to the first layer, the model will perform a bunch of calculations, pass the output to the second layer, etc. Since we perform a sequential computation, this type of model is called sequential. In TensorFlow.js we can define it as shown below:

```typescript
import * as tf from '@tensorflow/tfjs';

const model = tf.sequential();
model.add(tf.layers.inputLayer({ inputShape: [1] }));
model.add(tf.layers.dense({ units: 3, activation: 'relu' }));
model.add(tf.layers.dense({ units: 2, activation: 'relu' }));
model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
```

The snippet above shows how we can apply the [builder design pattern](https://en.wikipedia.org/wiki/Builder_pattern#Overview) for creating a deep learning model. We create sequential model and after that we add a bunch of layers to it.

The first layer has an input with shape `1`. This means that it accepts a single value. If we wanted to pass as an input an image with dimensions `64x64`, the input would have been `[64, 64, 3]`, 64 rows, 64 columns and three channels for [RGB](https://en.wikipedia.org/wiki/RGB_color_model). After that we add a <strong>dense</strong> layer. Adding a dense layer with 3 units simply means that we want to add 3 nodes and connect each one of them with the input. This way, the calculation that the model performs would be propagated from the input neuron to the 3 neurons from the next layer.

As next step we define one more hidden dense layer with 2 neurons. Finally, we add one more layer with a single neuron. This is going to be our output layer.

Notice that with each layer we also introduce an `activation` property. In this example, the activation is either a [`relu`](https://en.wikipedia.org/wiki/Rectifier_(neural_networks)) or a [`sigmoid`](https://en.wikipedia.org/wiki/Sigmoid_function). These activations are functions which perform an operation over the layers' parameters. `relu` is usually [preferred over the `sigmoid`](https://en.wikipedia.org/wiki/Rectifier_(neural_networks)#Advantages) because it has much better performance and other characteristics which contribute to bigger efficiency during training.

### Training a Deep Neural Network

Once we've defined the TensorFlow.js model, we have to "compile" it. We can compile a model by using the `compile` method:

```typescript
model.compile({
  optimizer: tf.train.adam(1e-6),
  loss: tf.losses.sigmoidCrossEntropy,
  metrics: ['accuracy']
})
```

The `compile` accepts a configuration object where we can specify a bunch of properties, important of which are:

- `optimizer` - the algorithm to be used for training the neural network. The algorithm we specify may have an enormous impact on how long it takes to train a model. The `adam` and `adamax` are known to perform well in most cases. The optimizer accepts a decimal number called <strong>learning rate</strong>. The learning rate is a number that the optimization algorithm will use in the process of adjusting the values of the parameters.
- `loss` - the `loss` property specifies the function which should be used for calculating the "difference" between the expected output and the one produced by the neural network. It's important to pick a `loss` function which will not make the [optimization algorithm get stuck in a local minima](https://en.wikipedia.org/wiki/Gradient_descent#Description)
- `metrics` - here we list the metrics based on which we want to judge how well our model performs

### Developing a Simple Model

Now let's develop a simple multilayer perceptron for guessing which is the current season based on the data of the year as an input. As you can may think, we don't really need a neural network to solve this problem; we can just use a few conditional statements in order to check if the date belongs to a given range. This example has only an illustrative purpose so that we can get an understanding of how to develop a simple model with TensorFlow.js.

We'll first generate a dataset. For each season, we'll generate *`n`* days and associate a vector corresponding to the given season. For the summer we'll use the vector `[1, 0, 0, 0]`, for the spring `[0, 1, 0, 0]`, for the fall `[0, 0, 1, 0]`, and for the winter `[0, 0, 0, 1]`. The days will be relative to 1st of January, so for example, the winter day 2st of January we can represent with the tuple: `[1, [0, 0, 0, 1]]`. Vectors with *`m`* elements which have all zeroes and a single `1` are called <strong>one-hot vectors</strong>.

Here's the algorithm which generates the dataset:

```typescript
const data = [
  {
    start: summerStart,
    end: summerEnd,
    value: [1, 0, 0, 0]
  }, {
    start: springStart,
    end: springEnd,
    value: [0, 1, 0, 0]
  }, {
    start: fallStart,
    end: fallEnd,
    value: [0, 0, 1, 0]
  }, {
    start: winterStart,
    end: winterEnd,
    value: [0, 0, 0, 1]
  }
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

Now, after we have the dataset, we can define the model:

```typescript
const createModel = async () => {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [1], units: 7, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 10, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));
  await model.compile({
    optimizer: tf.train.adam(0.01),
    loss: tf.losses.softmaxCrossEntropy,
    metrics: ['accuracy']
  });
  return model;
};
```

We create a sequential model and add a few layers. Notice the differences from the last time:

- We don't have an explicit input layer, instead, we set the `inputShape` property to the first layer
- In the output layer we use a `softmax` activation
- The optimizer uses `softmaxCrossEntropy` loss function

In the model above, we're using adam optimization algorithm with learning rate `0.01`.

### Binary vs N-ary Classification

The main difference between these two types of activation functions is in the number of results they produce. Often, when we're solving a classification problem, we have to classify the results either in two classes, also known as **binary classification**, or `n` classes, known as **n-ary classification**.

For example, if we have a set of photos and we want to put them in two categories - photos with dogs and photos without dogs, we can use binary classification. If, however, we have photos with cats, dogs, and landscapes and we want to put these photos into 3 categories - photos with cats, photos with dogs, and photos with landscapes, we'll be solving an n-ary classification problem.

For binary classification, we'd want to use a `sigmoid` or a `relu`. On the other hand, when we have `n` classes of objects (i.e., we're performing n-ary classification), we should use a `softmax`. The `softmax` activation function has one interesting property, the sum of the elements of the vector that it produces will equal `1`.

### Training the Model

Now let's train the model! In the previous sections we explained that we train a model by showing it inputs and the corresponding expected outputs. Later, the model calculates an output based on the input we've passed, compares it with the expected one and adjust its **parameters** using the optimization algorithm that we've provided. Since the model does the output calculation by performing operations over its parameters, the more well trained they are, the more accurate is going to be the output.

TensorFlow.js allows us to train given model using only a few lines of code!

```typescript
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

The `train` function accepts the model that we created in `createModel` and the training set. The training set is subset of the elements we generated in `generateData`. We take only subset of the shuffled array produced by `generateData` so that we can use the remaining elements to evaluate our model. Let us take a peek at the shape of the array produced by `generateData`:

```json
[
  [1, [0, 0, 0, 1]],
  [205, [1, 0, 0, 0]],
]
```

The array above contains two training examples, one for the 2nd day of the year, and one for the 206th. The second day of the year is winter and the 206th is summer.

As next step, we create two tensors:

- `xs` - an one dimensional tensor which contains the days for each training example. We're going to use `xs` as an input of the model
- `ys` - contains the one-hot vectors corresponding to the days. These are going to be the outputs that we'll to pass to the model, so that it can adjust it parameters with the optimization algorithm

**Notice that the values from `xs` we scale to a number between 0 and 1.** Normalizing the inputs of a neural network is quite important because it lets us speed learning up.

Finally, we invoke the `fit` method, passing the inputs (`xs`), outputs `ys`, and a configuration object.

Let's take a look at the `batchSize` and `epochs` properties of the configuration object. The value of `batchSize` is 40% of the number of elements in our training set. This means that TensorFlow.js will train our model in few steps, where on each step it'll take 40% of the elements from the training set. For example, in the first step TensorFlow.js will invoke the model with the first 40% of the elements, on the second step, with the second 40% of the elements, and on the third step, with the remaining 20%. After each step, the model will adjust its parameters by using the optimization algorithm.

This list of steps, we'll call an epoch. In the example, we've set the number of epochs to 200.

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

### Hyperparameters

In the last a couple of sections we mentioned a few values:

- Learning rate
- Number of layers
- Number of units in each layer
- Batch size
- Number of epochs

All these parameters are called **hyperparameters** and they determine very important characteristic of a neural network which has direct impact on its performance. The process of development of a neural network is related to tunning of these parameters so that we can extract as high precision out of it as possible.

### Evaluating the Model

Finally, let us take a look at how we can evaluate the model that we just developed!

In the training section we picked a subset of the dataset that we generated. The remaining entries from the dataset, we're going to use to evaluate our model. The model abstraction that TensorFlow.js provides has a method call `evaluate`.

Based on the metrics that we've passed to the `compile` method, `evaluate` outputs how well the model performs on a **test set**. It's very important to pick the test set from the same data distribution as the training set, and as the data that we expect our model to be used with. It's also essential to not have intersection between the test set and the training set, otherwise, the `evaluate` method would return biased results.

Here's how we can evaluate the model that we just developed:

```typescript
const evaluate = async (model, data) => {
  const xs = tf.tensor2d(data.map(d => [d[0] / 365]));
  const ys = tf.stack(data.map(d => d[1]));
  return await model.evaluate(xs, ys);
};
```

...and that's pretty much all of it! Now let us put everything together in the next section!

### Putting Everything Together

In the snippet below, we read the generated data from a file called `data.json`. After that we shuffle it and take 80% of the items as part of the training set. The remaining 20% go to the test set that we're going to use for evaluating our model.

Often 80% for training set and 20% for test set is not idea. When we have millions of items in our dataset, it's much more reasonable to have ratio 95% for training and 5% for test, or even 98% for training and 2% for test. Since we don't have that many items in this specific example, 80% for training and 20% for test is good enough.

```typescript
const result = shuffle(JSON.parse(fs.readFileSync('data.json').toString()));
const training = result.slice(0, Math.floor(result.length * 0.8));
const test = result.slice(Math.floor(result.length * 0.8), result.length);

createModel().then(async model => {
  await train(model, training);
  console.log('Evaluating:');
  await evaluate(model, test);
  return model;
});

const shuffle = array => {
  const size = array.length;
  for (let i = 0; i < size; i += 1) {
    const rand = Math.floor(i + Math.random() * (size - i));
    [array[rand], array[i]] = [array[i], array[rand]];
  }
  return array;
}
```

### Other Model Architectures

The multilayer perceptron is just one example for a neural network architecture. There are more advanced models, which are more appropriate for solving some problems.

For example, for performing image recognition, detection, or classifications, the convolutional neural networks are known to perform well. For natural language processing, on the other hand, researchers are using recurrent neural networks. We'll stop on convolutional neural networks in a later section of this article.
