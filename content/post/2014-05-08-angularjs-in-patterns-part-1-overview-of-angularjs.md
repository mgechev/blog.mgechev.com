---
author: minko_gechev
categories:
- AngularJS
- JavaScript
- Object-Oriented Programming
- OpenSource
- Patterns
- Programming
- Web development
date: 2014-05-08T00:00:00Z
tags:
- AngularJS
- AngularJS overview
- Design patterns
- Development
- JavaScript
- Object-Oriented Programming
- patterns
- Programming
- Software engineering
- web application
title: AngularJS in Patterns (Part 1). Overview of AngularJS
url: /2014/05/08/angularjs-in-patterns-part-1-overview-of-angularjs/
---

In this series of blog posts I’m going to cover the paper I’m writing at [GitHub][1].

It aims to provide a bit more theoretical overview of some of the AngularJS components in order to show you how the things you are already familiar with (like different Object-Oriented Design Patterns) fit in the picture.

Part one includes only a high level overview of AngularJS, enjoy it.

# AngularJS overview

AngularJS is JavaScript framework developed by Google. It intends to provide a solid base for the development of CRUD Single-Page Applications (SPA). SPA is a web application, which once loaded, does not require a full page reload when the user performs any actions with it. This means that all application resources (data, templates, scripts, styles) should be loaded with the initial request or better – the information and resources should be loaded on demand. Since most of the CRUD applications have common characteristics and requirements, AngularJS intends to provide the optimal set of them out-of-the-box. A few important features of AngularJS are:

*   two-way data binding
*   dependency injection
*   separation of concerns
*   testability
*   abstraction

The separation of concerns is achieved by dividing each AngularJS application into separate components, such as:

*   partials
*   controllers
*   directives
*   services
*   filters

These components can be grouped inside different modules, which helps achieve a higher level of abstraction and handle complexity. Each of the components encapsulates a specific piece of the application’s logic.

## Partials

Partials are HTML strings. They may contain AngularJS expressions inside the elements or their attributes. One of the distinctions between AngularJS and others frameworks is the fact that AngularJS templates are not in an intermediate format, which need to be turned into HTML (which is the case with mustache.js and handlebars, for example).

Initially each SPA loads an index.html file. In the case of AngularJS, this file contains a set of standard and custom HTML attributes, elements and comments, which configure and bootstrap the application. Each sub-sequenced user action only requires loading another partial or change of the state of the application, for example through the data binding provided by the framework.

Sample partial

{{< highlight html >}}<html ng-app>
 <!-- Body tag augmented with ngController directive  -->
 <body ng-controller="MyController">
   <input ng-model="foo" value="bar">
   <!-- Button tag with ng-click directive, and
          string expression 'buttonText'
          wrapped in "{{"{{ "}}}}" markup -->
   <button ng-click="changeFoo()">{{"{{buttonText"}}}}</button>
   <script src="angular.js"></script>
 </body>
</html>
{{< / highlight >}}

With AngularJS expressions, partials define what kind of actions should be performed for handling different user interactions. In the example above the value of the attribute ng-click states that the method changeFoo of the current scope will be invoked.

## Controllers

AngularJS controllers are JavaScript functions, which help handle user interactions with the web application (for example mouse events, keyboard events, etc.), by attaching methods to the scope. All required external dependencies for the controllers and components are provided through the Dependency Injection mechanism of AngularJS. The controllers are also responsible for providing the model to partials by attaching data to the scope. We can think of this data as view model.

{{< highlight javascript >}}function MyController($scope) {

  $scope.buttonText = 'Click me to change foo!';
  $scope.foo = 42;

  $scope.changeFoo = function () {
    $scope.foo += 1;
    alert('Foo changed');
  };
}
{{< / highlight >}}

For example, if we wire the sample controller above with the partial provided in the previous section, the user will be able to interact with the application in few different ways.

Change the value of foo by typing in the input box. This will immediately reflect the value of foo because of two-way data binding.
Change the value of foo by clicking the button, which will be labeled "Click me to change foo!".  
All of the custom elements, attributes, comments or classes could be recognized as AngularJS directives if they are previously defined as such.

## Scope

In AngularJS, scope is a JavaScript object, which is exposed to partials. The scope could contain different properties – primitives, objects or methods. All methods attached to scope can be invoked by evaluation of AngularJS expression inside partials associated with the given scope or a direct call of the method by any component, which keeps a reference to the scope. By using appropriate directives, the data attached to the scope could be bound to the view in such way that each change in the partial will reflect a scope property and each change of a scope property will reflect the partial.

Another important characteristic of the scopes of any AngularJS application is that they are connected into a prototypical chain (except scopes, which are explicitly stated as isolated). This way any child scope will be able to invoke the methods of its parents since they are properties of its direct or indirect prototype.

Scope inheritance is illustrated in the following example:

{{< highlight html >}}<div ng-controller="BaseCtrl">
  <div id="child" ng-controller="ChildCtrl">
    <button id="parent-method" ng-click="foo()">Parent method</button>
    <button ng-click="bar()">Child method</button>
  </div>
</div>
{{< / highlight >}}

{{< highlight javascript >}}function BaseCtrl($scope) {
  $scope.foo = function () {
    alert('Base foo');
  };
}

function ChildCtrl($scope) {
  $scope.bar = function () {
    alert('Child bar');
  };
}
{{< / highlight >}}

div#child is associated with ChildCtrl, but since the scope injected inside ChildCtrl inherits prototypically from its parent scope (i.e. the one injected inside BaseCtrl), the method foo is accessible by button#parent-method.

## Directives

In AngularJS, directives are the place where all DOM manipulations should be placed. As a rule of thumb, when you have DOM manipulations in your controller, you should create a new directive or consider refactoring the already existing one, which could handle the required DOM manipulations.  
Each directive has a name and logic associated with it. In the simplest case the directive contains only the name and definition of \*postLink\* function, which encapsulates all the logic required for the directive. In more complex cases the directive could contain a lot of properties such as:

*   template
*   compile function
*   link function
*   etc...

By citing the name of the directives they can be used inside the declarative partials.

Example:

{{< highlight javascript >}}myModule.directive('alertButton', function () {
  return {
    template: '<button ng-transclude></button>',
    scope: {
      content: '@'
    },
    replace: true,
    restrict: 'E',
    transclude: true,
    link: function (scope, el) {
      el.click(function () {
        alert(scope.content);
      });
    }
  };
});
{{< / highlight >}}

{{< highlight html >}}<alert-button content="42">Click me</alert-button>
{{< / highlight >}}

In the example above the tag <alert-button></alert-button> will be replaced by a button element. When the user clicks on the button, the string 42 will be alerted.

Since the intent of this paper is not to explain the complete API of AngularJS, we will stop with directives here.

## Filters

Filters in AngularJS are responsible for encapsulating logic required for formatting data. Usually filters are used inside partials but they are also accessible in controllers, directives, services and other filters through Dependency Injection.

Here is definition of a sample filter, which turns a given string to uppercase:

{{< highlight javascript >}}myModule.filter('uppercase', function () {
  return function (str) {
    return (str || '').toUpperCase();
  };
});
{{< / highlight >}}

Inside a partial this filter could be used using the Unix’s piping syntax:

{{< highlight html >}}<div>{{ "{{ name | uppercase " }}}}</div>
{{< / highlight >}}

Inside a controller the filter could be used as follows:

{{< highlight javascript >}}function MyCtrl(uppercaseFilter) {
  $scope.name = uppercaseFilter('foo'); //FOO
}
{{< / highlight >}}

## Services

Every piece of logic which doesn’t belong to the components described above should be placed inside a service. Usually services encapsulate the domain specific logic, persistence logic, XHR, WebSockets, etc. When the controllers in the application became too “fat”, repetitive code should be placed inside a service.

{{< highlight javascript >}}myModule.service('Developer', function () {
  this.name = 'Foo';
  this.motherLanguage = 'JavaScript';
  this.live = function () {
    while (true) {
      this.code();
    }
  };
});
{{< / highlight >}}

The service could be injected inside any component, which supports dependency injection (controllers, other services, filters, directives).

{{< highlight javascript >}}function MyCtrl(developer) {
  var developer = new Developer();
  developer.live();
}
{{< / highlight >}}

 [1]: https://github.com/mgechev/angularjs-in-patterns
