---
title: Statically Typed Stack with TypeScript, Go and Swagger
author: minko_gechev
layout: post
categories:
  - TypeScript
  - Golang
  - Swagger
tags:
  - TypeScript
  - Static typing
  - Programming
---

For the last years I've been using variety of different programming languages, some of them statically typed, dynamically typed, strongly and weakly typed. I've written plenty of JavaScript code and one of my biggest fears was to have a typo somewhere: in a property access, function invocation, variable declaration, etc.

A way to get some high level of confidence that everything will work properly is by writing large amount of unit tests which cover all the different branches in the code. The risk of breaking my code has sometime even made me reconsider refactoring of codebase which definitely needs to be restructured.

# Languages

An obvious solution to these problem is transitioning to TypeScript. Of course, unit tests are not optional when I have a strict type system; the good news is that they can be used the way they are supposed to - for testing and catching logical errors, nothing else.

We can apply the same approach the back end. We can use a language which type system will guard us from common mistakes and will provide some basic correctness verification of our programs. However, the type system is not the only criteria for choosing a programming language.

Anyhow, at the moment it's easy to find a statically typed language in both front end and back end which covers most common requirements software project have.

In this essay, I'll describe the decisions we took in the project I'm working on for making sure we have static verification not only in front end and back end but also in the communication between the client and the server.

# Communication Contract

We can take a look at the protocol for communication from two different perspectives:

- Sending a network request with payload.
- Parsing a received from the network payload.

There are different protocols which solve these two issues. For instance, GraphQL does solve them, unfortunately it's not applicable for applications which as requirement has to provide a RESTful interface. Providing a statically typed communication protocol which allows data validation is commonly used since the days when SOAP was mainstream. The WSDL files were solving the exact same problem, however, nowadays they are considered very verbose and impractical.

That's why we considered Swagger. It was the intersection between strictness, expressiveness and brevity.

## Swagger

Swagger is based on the [OpenAPI](https://www.openapis.org/) specification. In general, it provides a way to describe a communication protocol in terms of YAML schema, which can be used as source for generation of end points for RESTful service and client. On top of that, OpenAPI has some features specific for HTTP:

- Declaration of response codes.
- Typed URL parameters.
- Encodings.
- etc.

# Workflow

In this section I'll describe where we introduced Swagger as part of our development workflow. Lets start with the back end.

## Go Code Generation

The best code generation tool for Swagger on the market at the moment is [go-swagger](https://github.com/go-swagger/go-swagger). It allows generation of the entire RESTful service with some default behavior. On top of that, the tool provides a way to plug into the default functionality and introduce custom logic, such as storing entities into the database, etc.

## TypeScript Code Generation

After Googling for a bit I found a popular code generator for TypeScript, part of the [swagger-codegen tool](https://github.com/swagger-api/swagger-codegen). After I run it with input our schema and target TypeScript Fetch I didn't get very satisfying results so I implemented the generator [swagger-typescript-fetch-api](https://github.com/mgechev/swagger-typescript-fetch-api). From a Swagger schema, this generator will produce large file containing all the individual RESTful calls. It is based on the original TypeScript Fetch generator with a few improvements, such as support for enums, limited number of dependencies, etc.


