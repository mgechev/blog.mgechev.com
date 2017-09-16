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

Lets divide the code into parts and look into each one step by step.

## Node Types

```javascript
const Op = Symbol('op');
const Num = Symbol('num');
```

First we define the different node types that we are going to have in the AST. We'll have only numbers and operations. The number node `42` will look like this:

```javascript
{
  type: Num,
  val: 42
}
```

The operator `sum`, applied to `2`, `3`, `4` will look like this:

```javascript
{
  type: Op,
  val: 'sum',
  expr: [2, 3, 4]
}
```

That's how simple is that!

## The Parser

After we declare the node types, we define a function called `parse` which accepts a single argument called `tokens`. Inside of it we define five more functions:

- `cur` - returns the element of `tokens` associated with the current value of the `c` local variable.
- `next` - returns the element of `tokens` associated with the current value of the `c` local variable and increments `c`.
- `parseNum` - gets the current token (i.e. invokes `cur()`), parses it to a natural number and returns a new number token.
- `parseOp` - we'll explore in a little bit.
- `parseExpr` - checks of the current token matches the regular expression `/\d/` (i.e. is a number) and invokes `parseNum` if the match was successful, otherwise returns `parseOp`.

### Parsing Operations

The `parseOp` is maybe the most complicated function from the parser above. That's the case because of the loop and the indirect recursion that we have. Here's its definition one more time in order to explain it line by line:

```javascript
const parseOp = () => {
  const node = { val: next(), type: Op, expr: [] };
  while (cur()) node.expr.push(parseExpr());
  return node;
};
```

Since `parseOp` has been invoked by `parseExpr` when the value of `cur()` is not a number we know that it is an operator so we create a new operation node. Note that we don't perform any further validation, however, in a real-world programming language we'd want to do that and eventually throw a syntax error in case of unexpected token.

Anyhow, in the node declaration we set the list of "sub-expressions" to be the empty list (i.e. `[]`), the operation name to the value of `cur()` and the type of the node to `Op`. Later, while we don't reach the end of the program, we loop over all tokens by pushing the currently parsed expression to the list of "sub-expressions` of the given node. Finally, we return the node.

Keep in mind that `while (cur()) node.expr.push(parseExpr());` performs an indirect recursion. In case we have the expression:

```
sum sum 2
```

This will

- First, invoke `parseExpr`, which will find that the current token (i.e. `tokens[0]`) is not a number (it's `sum`) so it'll invoke `parseOp`.
- After that `parseOp` will create the operation node and because of the `next()` call, increment the value of `c`.
- Next `parseOp` will iterate over the nodes, and for `tokens[c]`, where `c` now equals `1` will invoke `parseExpr`.
- `parseExpr` will find that the current node is not a number so it'll invoke `parseOp`.
- `parseOp` will create another operation node and increment `c` and will start looping over all the tokens again.
- `parseOp` will invoke `parseExpr` where `c` will not equal `2`.
- Since `tokens[2] === "2"`, `parseExpr` will invoke `parseNum` which will create a number node, incrementing the `c` variable.
- `parseNum` will return the number node and it will be pushed into the `expr` array of the last operation node produced by the latest `parseOp` invocation.
- The last `parseOp` invocation will return the operation node since `cur()` will return `undefined` (`parseNum` has incremented `c` to `3` and `tokens[3] === undefined`).
- The node returned by the last invocation of `parseOp` will be returned to the outermost invocation of `parseOp` which will return its operation node as well.
- Finally, `parseExpr` will return the root operation node.

The produced AST will look like:

```javascript
{
  type: "Op",
  val: "sum",
  expr: [{
    type: "Op",
    val: "sum",
    expr: [{
      type: "Num",
      val: 2
    }]
  }]
}
```

...and that's it! The final step is to traverse this tree and produce JavaScript!


#
