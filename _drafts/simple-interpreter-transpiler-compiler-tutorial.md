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
<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="103.21598815917969 62.472843170166016 298.3213806152344 272.5173645019531" xmlns="http://www.w3.org/2000/svg">
<line x1="145.18" x2="200.18" y1="156.34" y2="102.02" fill="#00a6ff" stroke="#00a6ff" stroke-width="4"/>
<line x1="307.71" x2="237.09" y1="217.82" y2="297.27" stroke="#00a6ff" stroke-width="4"/>
<line x1="200.86" x2="264.7" y1="103.38" y2="173.32" stroke="#00a6ff" stroke-width="4"/>
<line x1="237.24" x2="303.78" y1="144.12" y2="224.25" stroke="#00a6ff" stroke-width="4"/>
<line x1="301.89" x2="363.01" y1="225.61" y2="297.59" stroke="#00a6ff" stroke-width="4"/>
<line x1="302.42" x2="301.74" y1="225.61" y2="294.87" stroke="#00a6ff" stroke-width="4"/>
<line x1="202.6" x2="254.89" y1="218.14" y2="162.46" stroke="#00a6ff" stroke-width="4"/>
<ellipse transform="matrix(-.65294 .75741 -.75741 -.65294 462.37 -3.3372)" cx="251.63" cy="131.03" rx="24.96" ry="24.96" fill="#00a6ff">
<title>mul</title>
</ellipse>
<text x="182.53" y="109.517" fill="rgb(255, 255, 255)" font-family="sans-serif" font-size="20px" style="white-space:pre">mul</text>
<ellipse transform="matrix(-.65294 .75741 -.75741 -.65294 407.82 53.378)" cx="251.63" cy="131.03" rx="24.96" ry="24.96" fill="#00a6ff">
<title>mul</title>
</ellipse>
<text x="138.068" y="166.232" fill="rgb(255, 255, 255)" font-family="sans-serif" font-size="20px" style="white-space:pre">3</text>
<ellipse transform="matrix(-.65294 .75741 -.75741 -.65294 520.09 54.682)" cx="251.63" cy="131.03" rx="24.96" ry="24.96" fill="#00a6ff">
<title>mul</title>
</ellipse>
<ellipse transform="matrix(-.65294 .75741 -.75741 -.65294 466.24 116.92)" cx="251.63" cy="131.03" rx="24.96" ry="24.96" fill="#00a6ff">
<title>mul</title>
</ellipse>
<ellipse transform="matrix(-.65294 .75741 -.75741 -.65294 564.74 118.57)" cx="251.63" cy="131.03" rx="24.96" ry="24.96" fill="#00a6ff">
<title>mul</title>
</ellipse>
<ellipse transform="matrix(-.65294 .75741 -.75741 -.65294 504.74 190.17)" cx="251.63" cy="131.03" rx="24.96" ry="24.96" fill="#00a6ff">
<title>mul</title>
</ellipse>
<ellipse transform="matrix(.75741 .65294 -.65294 .75741 196.17 31.661)" cx="251.63" cy="131.03" rx="24.96" ry="24.96" fill="#00a6ff">
<title>mul</title>
</ellipse>
<ellipse transform="matrix(-.65294 .75741 -.75741 -.65294 625.74 190.17)" cx="251.63" cy="131.03" rx="24.96" ry="24.96" fill="#00a6ff">
<title>mul</title>
</ellipse>
<text x="241.03" y="166.787" fill="rgb(255, 255, 255)" font-family="sans-serif" font-size="20px" style="white-space:pre">sub</text>
<text x="197.403" y="229.687" fill="rgb(255, 255, 255)" font-family="sans-serif" font-size="20px" style="white-space:pre">2</text>
<text x="282.643" y="230.045" fill="rgb(255, 255, 255)" font-family="sans-serif" font-size="20px" style="white-space:pre">sum</text>
<text x="235.305" y="303.89" fill="rgb(255, 255, 255)" font-family="sans-serif" font-size="20px" style="white-space:pre">1</text>
<text x="295.359" y="302.173" fill="rgb(255, 255, 255)" font-family="sans-serif" font-size="20px" style="white-space:pre">3</text>
<text x="355.696" y="302.569" fill="rgb(255, 255, 255)" font-family="sans-serif" font-size="20px" style="white-space:pre">4</text>
</svg>
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
