---
title: AngularJS Inheritance Patterns
author: Minko Gechev
layout: post
permalink: /2013/12/18/inheritance-services-controllers-in-angularjs/
categories:
  - AngularJS
  - JavaScript
  - Object-Oriented Programming
  - Patterns
  - Programming
tags:
  - AngularJS
  - Programming
---
<!-- Kudos 1.1.1-->

<div class="kudo-box kudo-c_tr" style="margin:0px px 30px 30px;">
  <figure class="kudo kudoable" data-id="595"> <a class="kudo-object"> <div class="kudo-opening">
    <div class="kudo-circle">
      &nbsp;
    </div>
  </div></a> 
  
  <div class="kudo-meta kudo-meta-595">
    <div class="kudo-meta-alpha kudo-hideonhover">
      <span class="kudo-count">3</span> <span class="kudo-text">Kudos</span>
    </div>
    
    <div class="kudo-meta-beta kudo-dontmove">
      <span>Don't<br />move!</span>
    </div>
  </div></figure>
</div>

Since AngularJS does not provide any built-in features for using inheritance, in this blog post I&#8217;ll describe how the general JavaScript inheritance patterns can be applied to AngularJS components.

## Controllers inheritance

First, lets talk about controllers. Actually it is very unlikely to inherit from parent controller. This is the case because by implementation the scope in the child controller will inherit prototypically from the scope of its parent. So when you need to reuse functionality from the parent controller, all you need to do is add the required methods to the parent scope. By doing this the child controller will have access to all these methods through the prototype of its scope i.e.:

<pre lang="javascript">myModule.controller('ParentCtrl', function ($scope) {
  $scope.parentMethod = function () {
    //body...
  };
});

myModule.controller('ChildCtrl', function ($scope) {
  $scope.parentMethod(); //it'll work
});
</pre>

Of course, the inheritance creates very strong coupling but only in single direction (i.e. the child is strongly coupled to its parent), so you can&#8217;t directly call children methods from your parent controller. For doing this you need to use event dispatching:

<pre lang="javascript">myModule.controller('ParentCtrl', function ($scope) {
  $scope.$broadcast('event', args);
  $scope.$on('event-response', function (result) {
  });
});

myModule.controller('ChildCtrl', function ($scope) {
  $scope.$on('event', function (args) {
    var result;
    //body...
    $scope.$emit('event-response', result);
  });
});
</pre>

I&#8217;m providing this snippet only informative, if you need to call children methods from your parent controller there might be something wrong in your code.

OK, but now let&#8217;s imagine you have two pages with almost the same functionality, lets say the intersection between the functionality of the pages is more than 50%. They might have totally different views but the logic behind these views could be quite similar. In such case you can create a base controller which to encapsulate the common logic, and two children controllers which to inherit from it. The base controller is not necessary to be implemented as AngularJS controller component you can use simple constructor function:

<pre lang="javascript">function BaseCtrl($scope, $location, ...) {
  $scope.commonScopeMethod = function () {
    //body
  };
  $scope.commonVar = 42;
}
BaseCtrl.prototype.commonMethod1 = function () {
  //body
};
BaseCtrl.prototype.commonMethod2 = function () {
  //body
};
</pre>

Now the children controllers can easily inherit from the base controller by:

<pre lang="javascript">function ChildCtrl1($scope, $location, ...) {
  BaseCtrl.call(this, $scope, $location, ...);
  $scope.childScopeMethod = function () {
  };
}

ChildCtrl1.prototype = Object.create(BaseCtrl.prototype);

ChildCtrl1.prototype.childMethod1 = function () {
  this.commonMethod1();
};

//Register ChildCtrl1 as AngularJS controller
myModule.controller('ChildCtrl1', ChildCtrl1);

</pre>

As you see we directly apply the &#8220;Klassical&#8221; inheritance pattern. We can do the same for the second child controller. You can check example [right here][1].

## Services inheritance

As you know there are two ways to create injectable (through DI) AngularJS services:

*   module.factory(name, factoryFn)
*   module.service(name, factoryFn)

### module.factory

In `module.factory` the `factoryFn` returns object literal which is the actual service. Behind the scene AngularJS calls the `factory` function called inside the [injector definition][2]

If you need inheritance between services which are instantiated through `module.factory` the prototype inheritance pattern through `Object.create` fits just great!

Lets create the base service:

<pre lang="javascript">var BaseService = (function () {
  var privateVar = 0;
  return {
    someAwesomeStuff: function () {
      if (privateVar === 42) {
        alert('You reached the answer!');
      }
      privateVar += 1;
    };
  };
}());
</pre>

and here is the child service:

<pre lang="javascript">var ChildService = Object.create(BaseService);
ChildService.someMoreAwesomeStuff = function () {
  //body...
};

module.factory('ChildService', function () {
  return ChildService;
});
</pre>

Now you can inject `ChildService` in different component and reuse the inherited from `BaseService` functionality.

<pre lang="javascript">function MyCtrl(ChildService) {
  ChildService.someAwesomeStuff();
}
</pre>

You can check example [right here][3].

#### Inject the parent {#inject-the-parent}

One more pattern for inheritance with services is injecting the parent through dependency injection and creating new object, which inherits from the parent prototypically:

<pre lang="javascript">module.factory('ParentService', function ($q, $http) {
  return {
    //public API
  };
});

module.factory('ChildService', function (ParentService, $sce) {
  var child = Object.create(ParentService);
  child.childMethod = function () {
    //extending the parent
  };
  return child;
});
</pre>

This pattern is definitely much more useful when you need to inject some dependencies to the parent service.

### module.service

Usually I call the variables attached to my scope View Models and some special services &#8211; Models. I implement these services with something close to the [Active Record Pattern][4]. My models are usually responsible for talking to the server, sometimes directly but usually through a [Gateway][5]. For the creation of these models I prefer to use `module.service` method. Internally these services are created through the `instantiate` [method][6].

Why I prefer using service instead of factory? Well, may be I&#8217;m a confused developer who don&#8217;t understand the true power of the prototypal inheritance used with pure object literals but I prefer to use the classical style for my models. By using it I can create a set of constructor functions which model my domain pretty well. Who knows for large project I may decide to use MDD and generate all my models from some fancy UML diagrams&#8230;

Here is an example of how you can take advantage of the Klassical inheritance pattern for AngularJS services created with `module.service`:

<pre lang="javascript">function Human(name) {
  this.name = name;
}
Human.prototype.talk = function () {
  return 'My name is ' + this.name;
};
Human.$inject = ['name'];

function Superhero(name, abilities) {
  Human.call(this, name);
  this.abilities = abilities;
}
Superhero.prototype = Object.create(Human.prototype);
Superhero.prototype.saveTheWorld = function () {
  return 'Saving the world with ' + this.abilities.join(', ');
};
Superhero.$inject = ['name', 'AbilitiesCollection'];

angular.module('demo').service('Human', Human);
angular.module('demo').service('Superhero', Superhero);
angular.module('demo').value('name', 'Super Dev');
angular.module('demo').value('AbilitiesCollection', ['C++', 'JavaScript']);
</pre>

You can check this related [exercise from ng-tutorial][7].

 [1]: http://jsbin.com/oLawajuL/2/edit
 [2]: https://github.com/angular/angular.js/blob/master/src/auto/injector.js#L654
 [3]: http://jsbin.com/idIVAWO/2/edit
 [4]: http://www.martinfowler.com/eaaCatalog/activeRecord.html
 [5]: http://www.martinfowler.com/eaaCatalog/gateway.html
 [6]: https://github.com/angular/angular.js/blob/master/src/auto/injector.js#L777
 [7]: http://ng-tutorial.mgechev.com/#?tutorial=controllers-communication&#038;step=invoke-methods