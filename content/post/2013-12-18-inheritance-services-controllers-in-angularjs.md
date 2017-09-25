---
author: minko_gechev
categories:
- AngularJS
- JavaScript
- Object-Oriented Programming
- Patterns
- Programming
date: 2013-12-18T00:00:00Z
tags:
- AngularJS
- Programming
title: AngularJS Inheritance Patterns
url: /2013/12/18/inheritance-services-controllers-in-angularjs/
---

Since AngularJS does not provide any built-in features for using inheritance, in this blog post I’ll describe how the general JavaScript inheritance patterns can be applied to AngularJS components.

## Controllers inheritance

First, lets talk about controllers. Actually it is very unlikely to inherit from parent controller (except when you're using the controller as syntax, see below). This is the case because by implementation the scope in the child controller will inherit prototypically from its parent scope. So when you need to reuse functionality from the parent controller, all you need to do is add the required methods to the parent scope. By doing this the child controller will have access to all these methods through the prototype of its scope i.e.:

{{< highlight javascript >}}myModule.controller('ParentCtrl', function ($scope) {
  $scope.parentMethod = function () {
    //body...
  };
});

myModule.controller('ChildCtrl', function ($scope) {
  $scope.parentMethod(); //it'll work
});
{{< / highlight >}}

Of course, the inheritance creates very strong coupling but only in a single direction (i.e. the child is strongly coupled to its parent), so you can’t directly call children methods from your parent controller. For doing this you need to use event dispatching:

{{< highlight javascript >}}myModule.controller('ParentCtrl', function ($scope) {
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
{{< / highlight >}}

I’m providing this snippet with only informative purpose, if you need to call children methods from your parent controller, you might be doing something wrong.

OK, but now let’s imagine you have two pages with almost the same functionality, lets say the intersection between the functionality of the pages is more than 50%. They might have totally different views but the logic behind these views could be quite similar. In such case you can create a base controller which encapsulates the common logic, and two children controllers which inherit from it. The base controller is not necessary to be implemented as AngularJS controller component you can use simple constructor function:

{{< highlight javascript >}}function BaseCtrl($scope, $location, ...) {
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
{{< / highlight >}}

Now the children controllers can easily inherit from the base controller by:

{{< highlight javascript >}}function ChildCtrl1($scope, $location, ...) {
  BaseCtrl.call(this, $scope, $location, ...);
  $scope.childScopeMethod = function () {
    this.commonMethod2();
  };
}

ChildCtrl1.prototype = Object.create(BaseCtrl.prototype);

ChildCtrl1.prototype.childMethod1 = function () {
  this.commonMethod1();
};

//Register ChildCtrl1 as AngularJS controller
myModule.controller('ChildCtrl1', ChildCtrl1);

{{< / highlight >}}

As you can see we directly apply the “Klassical” inheritance pattern. We can do the same for the second child controller. You can check example [right here][1].

### Controller as syntax

AngularJS 1.2 added the controller as syntax. Basically it allows us to create aliases for our controllers, for example using the `ng-controller` directive we can:

{{< highlight html >}}
<div ng-controller="MainCtrl as main">
  {{ main.name }}
  <button ng-click="main.clicked()">Click</button>
</div>
{{< / highlight >}}

with the following controller:

{{< highlight javascript >}}
function MainCtrl() {
  this.name = 'Foobar';
}
MainCtrl.prototype.clicked = function () {
  alert('You clicked me!');
};
{{< / highlight >}}

There are [number of benefits, which come along with this syntax](https://github.com/mgechev/angularjs-style-guide#controllers) one of them is the way we can take advantage of the "klassical" JavaScript inheritance:

{{< highlight javascript >}}
function BaseCtrl() {
  this.name = 'foobar';
}
BaseCtrl.prototype.parentMethod = function () {
  //body
};

function ChildCtrl() {
  BaseCtrl.call(this);
  this.name = 'baz';
}
ChildCtrl.prototype = Object.create(BaseCtrl.prototype);
ChildCtrl.prototype.childMethod = function () {
  this.parentMethod();
  //body
};

app.controller('BaseCtrl', BaseCtrl);
app.controller('ChildCtrl', ChildCtrl);
{{< / highlight >}}

which can be used with the following markup:

{{< highlight html >}}
<div ng-controller="BaseCtrl as base">
  <button ng-click="base.method()">Invoke parent</button>
  <div ng-controller="ChildCtrl as child">
    <button ng-click="child.childMethod()">Invoke child</button>
  </div>
</div>
{{< / highlight >}}

When the user press the button with label "Invoke parent" the `parentMethod` defined in `BaseCtrl` will be invoked. If the user press "Invoke child" the `childMethod` will be invoked. Notice that in its body it invokes `parentMethod` as well.

## Services inheritance

As you know there are two ways to create injectable (through DI) AngularJS services:

* module.factory(name, factoryFn)
* module.service(name, factoryFn)

### module.factory

In `module.factory` the `factoryFn` returns object literal which is the actual service. Behind the scene AngularJS calls the `factory` function inside the [injector definition][2]

If you need inheritance in services which are instantiated through `module.factory` the prototype inheritance pattern through `Object.create` fits just great!

Lets create the base service:

{{< highlight javascript >}}var BaseService = (function () {
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
{{< / highlight >}}

and here is the child service:

{{< highlight javascript >}}var ChildService = Object.create(BaseService);
ChildService.someMoreAwesomeStuff = function () {
  //body...
};

module.factory('ChildService', function () {
  return ChildService;
});
{{< / highlight >}}

Now you can inject `ChildService` in different component and reuse the inherited from `BaseService` functionality.

{{< highlight javascript >}}function MyCtrl(ChildService) {
  ChildService.someAwesomeStuff();
}
{{< / highlight >}}

You can find an example [right here][3].

#### Inject the parent {#inject-the-parent}

One more pattern for inheritance with services is injecting the parent through dependency injection and creating new object, which inherits from the parent prototypically:

{{< highlight javascript >}}module.factory('ParentService', function ($q, $http) {
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
{{< / highlight >}}

This pattern is definitely much more useful when you need to inject some dependencies to the parent service before inheriting it.

### module.service

Usually I call the variables attached to my scope View Models and the special services, which encapsulate the business logic – Models. I implement these services with something close to the [Active Record Pattern][4]. My models are usually responsible for talking to the server, sometimes directly but usually through a [Gateway][5]. For the creation of these models I prefer to use `module.service` method. Internally these services are created through the `instantiate` [method][6].

Why I prefer using service instead of factory? Well, may be I’m a confused developer who doesn’t understand the true power of the prototypal inheritance used with object literals, however I prefer to use the classical one for my models. By using it I can create a set of constructor functions which model my domain pretty well. One day I may decide to use MDD and generate all my models from some fancy UML diagrams...

Here is an example of how you can take advantage of the Klassical inheritance pattern for AngularJS services created with `module.service`:

{{< highlight javascript >}}function Human(name) {
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
{{< / highlight >}}

Here is a talk on this topic I gave on Angular Berlin:

<script async class="speakerdeck-embed" data-id="bb495a56254b4881a2b423c460398b5e" data-ratio="1.33333333333333" src="//speakerdeck.com/assets/embed.js"></script>

 [1]: http://jsbin.com/oLawajuL/2/edit
 [2]: https://github.com/angular/angular.js/blob/v1.4.0-rc.0/src/auto/injector.js#L686-L690
 [3]: http://jsbin.com/idIVAWO/2/edit
 [4]: http://www.martinfowler.com/eaaCatalog/activeRecord.html
 [5]: http://www.martinfowler.com/eaaCatalog/gateway.html
 [6]: https://github.com/angular/angular.js/blob/master/src/auto/injector.js#L777
