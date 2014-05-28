---
title: AngularJS in Patterns (Part 1). Overview of AngularJS
author: Minko Gechev
layout: post
permalink: /2014/05/08/angularjs-in-patterns-part-1-overview-of-angularjs/
categories:
  - AngularJS
  - JavaScript
  - Object-Oriented Programming
  - OpenSource
  - Patterns
  - Programming
  - Web development
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
---
<!-- Kudos 1.1.1-->

<div class="kudo-box kudo-c_tr" style="margin:0px px 30px 30px;">
  <figure class="kudo kudoable" data-id="719"> <a class="kudo-object"> <div class="kudo-opening">
    <div class="kudo-circle">
      &nbsp;
    </div>
  </div></a> 
  
  <div class="kudo-meta kudo-meta-719">
    <div class="kudo-meta-alpha kudo-hideonhover">
      <span class="kudo-count">21</span> <span class="kudo-text">Kudos</span>
    </div>
    
    <div class="kudo-meta-beta kudo-dontmove">
      <span>Don't<br />move!</span>
    </div>
  </div></figure>
</div>

In this series of blog posts I&#8217;m going to cover the paper I&#8217;m writing at [GitHub][1].

It aims to provide a bit more theoretical overview of some of the AngularJS components in order to show you how the things you are already familiar with (like different Object-Oriented Design Patterns) fit in the picture.

Part one includes only a high level overview of AngularJS, enjoy it.

# AngularJS overview

AngularJS is JavaScript framework developed by Google. It intents to provide solid base for the development of CRUD Single-Page Applications (SPA). SPA is web application, which once loaded, does not require full page reload when the user performs any actions with it. This means that all application resources (data, templates, scripts, styles) should be loaded with the initial request or better &#8211; the information and resources should be loaded on demand. Since most of the CRUD applications has common characteristics and requirements, AngularJS intents to provide the optimal set of them out-of-the-box. Few important features of AngularJS are:

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

These components can be grouped inside different modules, which helps to achieve higher level of abstraction and handle complexity. Each of the components encapsulates specific piece of the application&#8217;s logic.

## Partials

The partials are HTML strings. They may contain AngularJS expressions inside the elements or their attributes. One of the distinctions between AngularJS and the others frameworks is the fact that AngularJS&#8217; templates are not in an intermediate format, which needs to be turned into HTML (which is the case with mustache.js and handlebars, for example).

Initially each SPA loads index.html file. In the case of AngularJS this file contains a set of standard and custom HTML attributes, elements and comments, which configure and bootstrap the application. Each sub-sequenced user action requires only load of another partial or change of the state of the application, for example through the data binding provided by the framework.

Sample partial

<pre lang="html">&lt;html ng-app&gt;
 &lt;!-- Body tag augmented with ngController directive  --&gt;
 &lt;body ng-controller="MyController"&gt;
   &lt;input ng-model="foo" value="bar"&gt;
   &lt;!-- Button tag with ng-click directive, and
          string expression 'buttonText'
          wrapped in "{{ }}" markup --&gt;
   &lt;button ng-click="changeFoo()"&gt;{{buttonText}}&lt;/button&gt;
   &lt;script src="angular.js"&gt;&lt;/script&gt;
 &lt;/body&gt;
&lt;/html&gt;
</pre>

With AngularJS expressions partials define what kind of actions should be performed for handling different user interactions. In the example above the value of the attribute ng-click states that the method changeFoo of the current scope will be invoked.

## Controllers

The AngularJS controllers are JavaScript functions, which help handling the user interactions with the web application (for example mouse events, keyboard events, etc.), by attaching methods to the scope. All required external, for the controllers, components are provided through the Dependency Injection mechanism of AngularJS. The controllers are also responsible for providing the model to the partials by attaching data to the scope. We can think of this data as view model.

<pre lang="javascript">function MyController($scope) {

  $scope.buttonText = 'Click me to change foo!';
  $scope.foo = 42;

  $scope.changeFoo = function () {
    $scope.foo += 1;
    alert('Foo changed');
  };
}
</pre>

For example, if we wire the sample controller above with the partial provided in the previous section the user will be able to interact with the application in few different ways.

Change the value of foo by typing in the input box. This will immediately reflect the value of foo because of the two-way data binding.  
Change the value of foo by clicking the button, which will be labeled Click me to change foo!.  
All the custom elements, attributes, comments or classes could be recognized as AngularJS directives if they are previously defined as ones.

## Scope

In AngularJS scope is JavaScript object, which is exposed to the partials. The scope could contains different properties &#8211; primitives, objects or methods. All methods attached to the scope could be invoked by evaluation of AngularJS expression inside the partials associated with the given scope or direct call of the method by any component, which keeps reference to the scope. By using appropriate directives, the data attached to the scope could be binded to the view in such way that each change in the partial will reflect a scope property and each change of a scope property will reflect the partial.

Another important characteristics of the scopes of any AngularJS application is that they are connected into a prototypical chain (except scopes, which are explicitly stated as isolated). This way any child scope will be able to invoke methods of its parents since they are properties of its direct or indirect prototype.

Scope inheritance is illustrated in the following example:

<pre lang="html">&lt;div ng-controller="BaseCtrl"&gt;
  &lt;div id="child" ng-controller="ChildCtrl"&gt;
    &lt;button id="parent-method" ng-click="foo()"&gt;Parent method&lt;/button&gt;
    &lt;button ng-click="bar()"&gt;Child method&lt;/button&gt;
  &lt;/div&gt;
&lt;/div&gt;
</pre>

<pre lang="javascript">function BaseCtrl($scope) {
  $scope.foo = function () {
    alert('Base foo');
  };
}

function ChildCtrl($scope) {
  $scope.bar = function () {
    alert('Child bar');
  };
}
</pre>

With div#child is associated ChildCtrl but since the scope injected inside ChildCtrl inherits prototypically from its parent scope (i.e. the one injected inside BaseCtrl) the method foo is accessible by button#parent-method.

## Directives

In AngularJS the directives are the place where all DOM manipulations should be placed. As a rule of thumb, when you have DOM manipulations in your controller you should create a new direcrive or consider refactoring of already existing one, which could handle the required DOM manipulations.  
Each directive has a name and logic associated with it. In the simplest case the directive contains only name and definition of \*postLink\* function, which encapsulates all the logic required for the directive. In more complex cases the directive could contain a lot of properties such as:

*   template
*   compile function
*   link function
*   etc&#8230;

By citing the name of the directives they can be used inside the declarative partials.

Example:

<pre lang="javascript">myModule.directive('alertButton', function () {
  return {
    template: '&lt;button ng-transclude&gt;&lt;/button&gt;',
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
</pre>

<pre lang="html">&lt;alert-button content="42"&gt;Click me&lt;/alert-button&gt;
</pre>

In the example above the tag <alert-button></alert-button> will be replaced button element. When the user clicks on the button the string 42 will be alerted.

Since the intent of this paper is not to explain the complete API of AngularJS, we will stop with the directives here.

## Filters

The filters in AngularJS are responsible for encapsulating logic required for formatting data. Usually filters are used inside the partials but they are also accessible in the controllers, directives, services and other filters through Dependency Injection.

Here is definition of a sample filter, which turns given string to uppercase:

<pre lang="javascript">myModule.filter('uppercase', function () {
  return function (str) {
    return (str || '').toUpperCase();
  };
});
</pre>

Inside a partial this filter could be used using the Unix&#8217;s piping syntax:

<pre lang="html">&lt;div&gt;{{ name | uppercase }}&lt;/div&gt;
</pre>

Inside a controller the filter could be used as follows:

<pre lang="javascript">function MyCtrl(uppercaseFilter) {
  $scope.name = uppercaseFilter('foo'); //FOO
}
</pre>

## Services

Every piece of logic, which doesn&#8217;t belong to the components described above should be placed inside a service. Usually services encapsulate the domain specific logic, persistence logic, XHR, WebSockets, etc. When the controllers in the application became too &#8220;fat&#8221; the repetitive code should be placed inside a service.

<pre lang="javascript">myModule.service('Developer', function () {
  this.name = 'Foo';
  this.motherLanguage = 'JavaScript';
  this.live = function () {
    while (true) {
      this.code();
    }
  };
});
</pre>

The service could be injected inside any component, which supports dependency injection (controllers, other services, filters, directives).

<pre lang="javascript">function MyCtrl(developer) {
  var developer = new Developer();
  developer.live();
}
</pre>

 [1]: https://github.com/mgechev/angularjs-in-patterns