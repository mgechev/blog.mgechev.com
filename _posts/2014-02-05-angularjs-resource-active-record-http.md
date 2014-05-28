---
title: The magic of $resource (or simply a client-side Active Record)
author: Minko Gechev
layout: post
permalink: /2014/02/05/angularjs-resource-active-record-http/
categories:
  - AngularJS
  - Development
  - Http
  - JavaScript
  - Node.js
  - Object-Oriented Programming
  - Patterns
  - Programming
  - Web development
tags:
  - active record
  - AngularJS
  - Design patterns
  - Development
  - JavaScript
---

At first sight AngularJS seems like a magical framework, which does some weird but awesome things like dependency injection, data binding only by setting a single property to the magical object named $scope and many other things.

If you look at the source code of Angular you&#8217;ll see a lot of smart and simple solutions for these magical problems. In this blog post I&#8217;ll describe the magic which stays behind `$resource`. I decided to write this blog post because of my recent experience in StackOverflow. One of the most misunderstood components of AngularJS was exactly the `$resource` service. `$resource` is two levels of abstraction above the XMLHttpRequest object (ok, may be three if we count `$httpBackend`). I&#8217;ve illustrated the usage of `$resource` through example which can be found at [GitHub][1].

Before continuing with `$resource` I&#8217;m going to explain few important concepts. The first one is:

### Active Record

This is architectural pattern named by Martin Fowler. The Active Record object is an object, which carries both data and behavior. Usually most of the data in these objects is persistent, responsibility of the Active Record object is to take care of the communication with the database in order to create, update, retrieve or delete the data. It may delegate this responsibility to lower level classes but calls to instance or static methods of the active record object cause the database communication.

For example:

<pre lang="javascript">function User(name, age) {
  this.id = null;
  this.name = name;
  this.age = age;
}

User.prototype.save = function () {
  var self = this;
  return db.process('INSERT INTO User (name, age) VALUES (' + this.name + ', ' + this.age + ')')
    .then(function (user) {
      self.id = user.id;
      return self;
    });
};

User.query = function () {
   return db.process('SELECT * FROM User');
};
</pre>

In the example above we have `User` constructor function, which also has methods `query` and `save`. We can use it by:

<pre lang="javascript">var user = new User('foo', 42);
user.save()
.then(function () {
  //user.id is now available
});

User.query()
.then(function () {
  //all users
});
</pre>

In the client-side JavaScript everything is a little bit different but the concepts are the same. What are the problems of this pattern? Well, in the relational databases we work with relations, which are represented as tables. We don&#8217;t have the standard OO concepts such as inheritance or association. Of course, we can emulate them by using tables but this leads to a problem &#8211; we don&#8217;t have 1:1 mapping between our tables and classes. Thats why sometimes for ORM is preferred the pattern [Data Mapper][2], but topic is out of the scope of the current post. Fortunately, in the Single-Page Applications, usually we have back-end, which probably uses ORM framework and provides us a nice JSON API, so we don&#8217;t have to worry about complex mapping, we can just use client-side Active Record.

### Lexical functional scope

This is very basic JavaScript concept but also one used in `$resource`. As you see in the `save` method, in example above, we keep reference to `this` in `self`. This reference is visible in the callback we pass to the promise returned by `db.process`. When the promise is resolved we just populate the missing data (in this case `id`) and return the object.

We can do something similar in `query`

<pre lang="javascript">User.query = function () {
   var users = [];
   users.$promise = db.process('SELECT * FROM User')
     .then(function (collection) {
        collection.forEach(function (user) {
          users.push(user);
        });
      });
   return users;
};
</pre>

In this case when `User.query()` is called it immediately returns an empty array with property `$promise`. When the promise is resolved (i.e. database request successfully completed), we just push each of the users into our array `users`. Note that the user of our code already has reference to this variable, so when we populate it he will be able to use all the data immediately.

### $digest loop

The last thing we will look at before continuing with `$resource` is AngularJS&#8217;s `$digest` loop. Probably you&#8217;re aware that when AngularJS finds some &#8220;special&#8221; directives in our templates it automatically registers watchers for the expressions used in these directives. Such &#8220;special&#8221; directives are `{{ }}`, `ng-model`, `ng-bind`. When something cause call of the digest loop AngularJS iterates over all watched expressions and calculates their values until there are no more changes (when we have wider support of `Object.observe`, probably the `$digest` loop will be more smarter and efficient).

So if we have:

<pre lang="javascript">function MainCtrl($scope) {
  $scope.users = [];
}
</pre>

with the following markup:

<pre lang="html">&lt;ul ng-controller="MainCtrl"&gt;
  &lt;li ng-repeat="user in users"&gt;{{user.name}}&lt;/li&gt;
&lt;/ul&gt;
</pre>

Now if somewhere else, something keeps the reference to the `users` array it can simply:

<pre lang="javascript">$scope.$apply(function () {
  users.push({
    name: 'foo'
  });
});
</pre>

which will cause rendering of a single list item with the value `"foo"`.

# $resource

We won&#8217;t cover the whole API of `$resource` but we will look at how we can implement our model (**not** view model) with it. First of all, lets suppose we have a nice RESTful API for creating, retrieving, updating and deleting users:

<pre lang="markdown">POST   /users
POST   /users/:id # We won't use PUT, but we can
DELETE /users/:id
GET    /users
GET    /users/:id
</pre>

Now we can create our model by:

<pre lang="javascript">var User = $resource('/users/:id');
</pre>

`$resource` will create a constructor function for our model instances. Each of the model instances will have methods, which could be used for the different CRUD operation&#8230;and that&#8217;s all?! We implemented the communication with the back-end by invoking `$resource` with a single parameter!

But how about custom actions like `login`, for example? The `$resource` API allows us to [include them][3] explicitly.

I would recommend you to wrap the constructor function produced by `$resource` in a service. You will be able to reuse it across the application, mock it easier when writing tests and extend its functionality without modifying additional code (we follow the open-closed principle):

<pre lang="javascript">module.factory('User', function ($resource) {
  return $resource('/users/:id');
});
</pre>

Now let&#8217;s get all users:

<pre lang="javascript">resourceDemo.controller('MainCtrl', function ($scope, User) {
  $scope.users = User.query();
});
</pre>

And now visualize all users&#8230;:

<pre lang="javascript">&lt;table&gt;
  &lt;tr ng-repeat="user in users"&gt;
    &lt;td&gt;{{user.id}}&lt;/td&gt;
    &lt;td&gt;&lt;a ng-href="#/users/{{user.id}}"&gt;{{user.name}}&lt;/a&gt;&lt;/td&gt;
    &lt;td&gt;{{user.job}}&lt;/td&gt;
  &lt;/tr&gt;
&lt;/table&gt;
</pre>

You might think that the operation `query` is synchronous because of the way we set the value of `$scope.users`. This will be very bad, right? Well, it is asynchronous, `MainCtrl` simply uses two of the concepts we discussed above: functional lexical scope, `$digest` loop.  
When the `query` method is invoked it returns a reference to an empty array, the array has just a single property called `$promise`, you can use it if you want to manipulate the users after the request was successful, or not. When the request completes AngularJS populates the array with all users and calls the `$digest` loop. The `query` action will make a GET request to `/users`.

There is something cool in AngularJS&#8217;s route definition, which allows us to change the current page once all dependencies of the next page are resolved &#8211; the `resolve` hash. This feature is very helpful especially if we want to open a page with single user view:

<pre lang="javascript">//...
.when('/users/:userid', {
  templateUrl: 'partials/user.html',
  controller: 'UserCtrl',
  resolve: {
    user: function ($route, User) {
      return User.get({ userid: $route.current.params.userid }).$promise;
    }
  }
});
//...
</pre>

As I mentioned above, when we invoke &#8220;static&#8221; method of the constructor function, it returns an empty object with property `$promise`, which will be resolved once the request is completed. This way we make sure the user will see the page once the user with id `$route.current.params.userid` is available.

And this is our `User` controller:

<pre lang="javascript">resourceDemo.controller('UserCtrl', function ($scope, user) {
  $scope.user = user;
});
</pre>

You may noticed the `setTimeout` which is added in the express web app. It cause slower response, only to illustrate how useful could be our next enhancement &#8211; cache. We can cache some requests by passing additional parameters to the `$resource` function. For example:

<pre lang="javascript">resourceDemo.factory('User', function ($cacheFactory, $resource) {
  var User = $resource('/users/:userid', {}, {
    get: { cache: true, method: 'get' }
  });
  return User;
})
</pre>

The example above will make each call of the `get` method cachable (it won&#8217;t affect the `query` method). After adding this line you&#8217;ll notice that, after the first time, on each subsequent click on somebody&#8217;s name you&#8217;ll be immediately redirected to the user&#8217;s view, you won&#8217;t have to wait the request to complete because AngularJS does not make any requests &#8211; it takes the value from the cache.

Most of these methods also accept callbacks, but I would recommend you to stick to the promisee usage.

Once again &#8211; you can grab the [sample application here][1].

## Conclusion

`$resource` allows us to use Active Record like pattern of communication with our RESTful service. It will definitely save you a lot of lines of code, if your back-end provides proper API. It gives you features like caching, interceptors, specifying response type and timeout, it even provides flag &#8220;[with credentials][4]&#8220;.

However, when you have more complex/custom back-end API, you may consider to implement all the communication by your own since, otherwise, you&#8217;ll need to override most of the methods of `$resource`, anyway.

 [1]: https://github.com/mgechev/angularjs-resource
 [2]: http://www.martinfowler.com/eaaCatalog/dataMapper.html
 [3]: http://docs.angularjs.org/api/ngResource.$resource
 [4]: https://developer.mozilla.org/en-US/docs/HTTP/Access_control_CORS?redirectlocale=en-US&#038;redirectslug=HTTP_access_control#Requests_with_credentials