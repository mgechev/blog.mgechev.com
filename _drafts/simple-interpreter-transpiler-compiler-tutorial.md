---
title: Implementing a Simple Compiler on 50 Lines of JavaScript
author: minko_gechev
layout: post
categories:
  - Compilers
  - Lexical Analysis
  - Syntax Analysis
  - Computer Science
tags:
  - Compilers
  - Lexical Analysis
  - Syntax Analysis
  - Computer Science
---

I already wrote a couple of essays related to the development of programming languages that I was extremely excited about! For instance, in "[Static Code Analysis of Angular 2 and TypeScript Projects](http://blog.mgechev.com/2016/02/29/static-code-analysis-angular-typescript/)" I explored the basics of the front-end of the compilers, explaining the phases of lexical analysis, syntax analysis and abstract-syntax trees.

Recently I published "[Developing Statically Typed Programming Language](http://blog.mgechev.com/2017/08/05/typed-lambda-calculus-create-type-checker-transpiler-compiler-javascript/)". This blog post shown a simple, statically typed, functional programming language inspired by lambda calculus. There I outsourced the front-end part of the compiler development to a parser generator and focused on the back-end in the face of a type checker and code generator.

In this blog post I'll cover the basics from end-to-end! I'll develop an extremely simple interpreter and compiler on 50 lines of JavaScript! The language that we're going to explore is not a fully functional programming language but it can be easily extended to one.

# 

Here's how a sample expression in our language is going to look like:

```
mul 3 sub 2 sum 1 3 4
```

There are a few rules we need to follow:

- We have only the functions: `mul`, `sub`, `sum`, `div`.
- Each individual string token is surrounded by whitespace.

In order to explore the semantics behind the expression above lets define a few JavaScript functions:

```
const mul = (...operands) => operands.reduce((a, c) => a * c, 1);
const sub = (...operands) => operands.reduce((a, c) => a - c);
const sum = (...operands) => operands.reduce((a, c) => a + c, 0);
```

`mul` accepts multiple operands, passed with the spread operator. The function just multiplies all of them, so for instance `mul(2, 3, 4) === 24`. `sub` respectively subtracts the passed arguments and `sum` sums them.

The expression above can be translated to the following JavaScript expression:

```
mul(3, sub(2, sum(1, 3, 4)))
```

or...

```
3 * (2 - (1 + 3 + 4))
```

After we understand the semantics, lets start with the front-end of the compiler!

# Developing Compiler's Front End

The front end of any compiler usually has the modules for [Lexical Analysis](https://en.wikibooks.org/wiki/Compiler_Construction/Lexical_analysis)<sup></sup> and [Syntax Analysis](https://en.wikibooks.org/wiki/Compiler_Construction/Syntax_Analysis)<sup></sup>. In this section we'll build both modules in a few lines of JavaScript!

## Developing a Lexical Analyzer

The phase of lexical analysis is responsible for dividing the input string (or stream of strings) of the program into a small pieces called **tokens**. The tokens usually have information about their type (numbers, operators, keywords, identifiers, etc), the substring of the program they represent and their position in the program. The last information is usually used for reporting user friendly errors in case of invalid syntactical constructs.

For instance, if we have the JavaScript program:

```javascript
if (foo) {
  bar();
}
```

A sample lexical analyzer for JavaScript will produce the output:

```javascript
[
  {
    lexeme: 'if',
    type: 'keyword',
    position: {
      row: 0,
      col: 0
    }
  },
  {
    lexeme: '(',
    type: 'open_paran',
    position: {
      row: 0,
      col: 3
    }
  },
  {
    lexeme: 'foo',
    type: 'identifier',
    position: {
      row: 0,
      col: 4
    }
  },
  ...
]
```

We'll keep our lexical analyzer simple. In fact, we'll implement it on a single line of JavaScript:

```javascript
const lex = str => str.split(' ').map(s => s.trim()).filter(s => s.length);
```

Invoking the lexer with our expression will produce an array of strings:

```javascript
lex('mul 3 sub 2 sum 1 3 4')

// ["mul", "3", "sub", "2", "sum", "1", "3", "4"]
```

This is completely enough for our purposes!

Now lets go to the phase of syntax analysis!

# Developing a Parser

The syntax analyzer (or often sometimes called only parser) is the module of the program which performs syntax validation and out of a list (or stream) of tokens produces an [Abstract Syntax Tree](https://en.wikibooks.org/wiki/Compiler_Construction/Case_Study_1B#Abstract_Syntax_Trees)<sup></sup> (or in short an AST).

For instance, for our expression:

```
mul 3 sub 2 sum 1 3 4
```

Will be turned into the following AST:

<div style="width: 300px; height: 300px; display: block; margin: auto;">
  <img src="/images/simple-compiler/ast.svg">
</div>

Lets explore the algorithm for this!

```javascript
const Op = Symbol('op');
const Num = Symbol('num');

const parse = tokens => {

  let c = 0;

  const cur = () => tokens[c];
  const next = () => tokens[c++];

  const parseNum = () => ({ val: parseInt(next()), type: Num });

  const parseOp = () => {
    const node = { val: next(), type: Op, expr: [] };
    while (cur()) node.expr.push(parseExpr());
    return node;
  };

  const parseExpr = () => /\d/.test(cur()) ? parseNum() : parseOp();

  return parseExpr();
};
```

The bad news is that there are a lot of things going on. The good news is that this is the most complicated part of the compiler!

#
