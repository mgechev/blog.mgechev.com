---
title: Implementing a Simple Compiler on 25 Lines of JavaScript
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

I already wrote a couple of essays related to the development of programming languages that I was extremely excited about! For instance, in "[Static Code Analysis of Angular 2 and TypeScript Projects](http://blog.mgechev.com/2016/02/29/static-code-analysis-angular-typescript/)"<sup>[1]</sup> I explored the basics of the front-end of the compilers, explaining the phases of lexical analysis, syntax analysis and abstract-syntax trees.

Recently I published "[Developing Statically Typed Programming Language](http://blog.mgechev.com/2017/08/05/typed-lambda-calculus-create-type-checker-transpiler-compiler-javascript/)"<sup>[2]</sup>. This post shown a simple, statically typed, functional programming language inspired by lambda calculus. There I outsourced the front-end part of the compiler development to a parser generator and focused on the back-end in the faces of a module for type checking and one for code generation.

In this blog post we'll cover the basics from end-to-end! We'll develop an extremely simple compiler on 25 lines of JavaScript! Our compiler will have:

- Module for lexical analysis
- Module for syntax analysis
- Code generator

The language that we're going to explore is not particularly useful for developing meaningful software programs but it can be easily extended to one.

[The entire implementation can be found at my GitHub profile](https://github.com/mgechev/tiny-compiler)<sup>[3]</sup>.

<img src="/images/simple-compiler/simple.jpg" alt="Simplicity"  style="display: block; margin: auto;">

# Introducing a Simple Prefix Language

Here's how a sample expression in our language is going to look like:

```
mul 3 sub 2 sum 1 3 4
```

By the end of this article we'll be able to transpile these expressions to JavaScript by going through phases typical for any compiler!

For simplicity, there are a few rules we need to follow:

- We have only the functions: `mul`, `sub`, `sum`, `div`.
- Each individual string token is surrounded by whitespace.
- We support only natural numbers.

In order to explore the semantics behind the expression above lets define a few JavaScript functions:

```javascript
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

Now, after we have understanding of the semantics, lets start with the front-end of the compiler!


_**Note**: Similar prefix expressions can be simply evaluated with a stack-based algorithm, however, in this case we'll focus on concepts rather than implementation._

# Developing Compiler's Front End

The front end of any compiler usually has the modules for [Lexical Analysis](https://en.wikibooks.org/wiki/Compiler_Construction/Lexical_analysis)<sup>[4]</sup> and [Syntax Analysis](https://en.wikibooks.org/wiki/Compiler_Construction/Syntax_Analysis)<sup>[5]</sup>. In this section we'll build both modules in a few lines of JavaScript!

## Developing a Lexical Analyzer

The phase of lexical analysis is responsible for dividing the input string (or stream of characters) of the program into smaller pieces called **tokens**. The tokens usually carries information about their type (if they are numbers, operators, keywords, identifiers, etc), the substring of the program they represent and their position in the program. The position is usually used for reporting user friendly errors in case of invalid syntactical constructs.

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

We'll keep our lexical analyzer as simple as possible. In fact, we'll implement it on a single line of JavaScript:

```javascript
const lex = str => str.split(' ').map(s => s.trim()).filter(s => s.length);
```

Here we split the string by a single space, we map the produced substrings to their trimmed version and filter the empty strings.

Invoking the lexer with an expression will produce an array of strings:

```javascript
lex('mul 3 sub 2 sum 1 3 4')

// ["mul", "3", "sub", "2", "sum", "1", "3", "4"]
```

This is completely enough for our purpose!

Now lets go to the phase of syntax analysis!

# Developing a Parser

The syntax analyzer (often know as parser) is the module of a compiler which out of a list (or stream) of tokens produces an [Abstract Syntax Tree](https://en.wikibooks.org/wiki/Compiler_Construction/Case_Study_1B#Abstract_Syntax_Trees)<sup>[6]</sup> (or in short an AST). Along the process, the syntax analyzer may also produce syntax errors in case of invalid programs.

<img src="/images/simple-compiler/tree.jpg" alt="Nature Tree"  style="display: block; margin: auto;">

Usually, the parser is implemented base on a [grammar](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form)<sup>[7]</sup>. Here's the grammar of our language:

```
digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
num = digit+
op = sum | sub | mul | div
expr = num | op expr+
```

This basically means that we have digits which composed together can form numbers (`num`). We have 4 operations and an expression can be either a `num`ber, or `op`eration, followed by one or more `expr`essions. We'll refer to the individual definitions in the grammar (for instance to `num` and `op`) as rules.

This is the so called [EBNF grammar](https://en.wikipedia.org/wiki/Extended_Backus–Naur_form)<sup>[6]</sup>. Look at the grammar for a bit, try to understand it, and after that completely forget about it! We'll come back to the grammar after we explain the parser and you'll see how everything connects together!

As we mentioned, a parser is a tool which turns a list of tokens to an AST.

For instance, for our expression:

```
mul 3 sub 2 sum 1 3 4
```

The parser will produce the following AST, based on the grammar above:

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

First we define the different node types that we are going to have in the AST. We'll have only numbers and operations. For example, the number node `42` will look like this:

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

## Recursive Descent Parsing

Now lets related the individual functions to the grammar we defined above and see why having a grammar makes sense in general. Lets take a look at the rules in the EBNF grammar:

```
digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
num = digit+
op = sum | sub | mul | div
expr = num | op expr+
```

Now they may make a bit more sense? `expr` looks very much like `parseExpr`, where we parse either a `num`ber or an `op`eration. Similarly, `op expr+` looks very much like `parseOp` and `num` like `parseNum`. In fact, very often parsers are generated directly from the grammars since there's a direct connection between both with the [recursive descent parsing algorithm](https://en.wikipedia.org/wiki/Recursive_descent_parser)<sup>[8]</sup>.

And in fact, we just developed a simple recursive descent parser! Our parser was quite simple (well, we have only 4 **production rules** in the grammar) but you can imagine how complex the parser of a real-life programming language is.

It's extremely convenient to develop the grammar of a language before write the actual parser in order to observe a simplified model of it. The parser contains a lot of details (for instance a lot of syntax constructs of the language you're developing it with), in contrast to the grammar which is extremely simplified and minimalistic.

# Developing the Transpiler

In this part of the post we'll traverse the AST of the language and produce JavaScript. The entire transpiler is on 7 lines of JavaScript (literary!):

```javascript
const transpile = ast => {
  const opMap = { sum: '+', mul: '*', sub: '-', div: '/' };
  const transpileNode = ast => ast.type === Num ? transpileNum(ast) : transpileOp(ast);
  const transpileNum = ast => ast.val;
  const transpileOp = ast => `(${ast.expr.map(transpileNode).join(' ' + opMap[ast.val] + ' ')})`;
  return transpileNode(ast);
};
```

Lets explore the implementation line by line.

First we define a function called `transpile`. It accepts as argument the AST produced by the parser. After that in the `opMap` we define the mapping between arithmetic operations and the operators in the language. Basically, `sum` maps to `+`, `mul` to `*`, etc.

As next step, we define the function `transpileNode` which accepts an AST node. If the node is a number, we invoke the `transpileNum` function with the given node, otherwise, we invoke `transpileOp`.

Finally, we define the two functions for transpilation of the individual nodes:

- `transpileNum` - translates a number to a JavaScript number (simply by returning it).
- `transpileOp` - translates an operation to a JavaScript arithmetic operation. Notice that we have indirect recursion here (`transpileOp -> transpileNode -> transpileOp`). For each operation node, we want to transpile its sub-expressions first. We do that by invoking the `transpileNode` function.

On the last line of `transpile`'s body, we return the result of `transpileNode` applied to the root of the tree.

# Wiring Everything Together

Here's how we can wire everything together:

```
const program = 'mul 3 sub 2 sum 1 3 4';

transpile(parse(lex(program)));
```

We invoke `lex(program)`, which produces the list of tokens, after that we pass the tokens to the `parse` function, which produces the AST and finally, we `transpile` the AST to JavaScript!

<img src="/images/simple-compiler/wire.jpg" alt="Connecting"  style="display: block; margin: auto;">

# Conclusion

This article explained in details the development of a very simple compiler (or transpile) of a language with prefix expressions to JavaScript. Although this was explanation of only the very basics of the compiler development we were able to cover few very important concepts:

- Lexical analysis
- Syntax analysis
- Source code generation
- EBNF grammars
- Recursive Descent Parsing

If you're interested in further reading, I'd recommend you:

- [Developing Statically Typed Programming Language](http://blog.mgechev.com/2017/08/05/typed-lambda-calculus-create-type-checker-transpiler-compiler-javascript/)
- [Let’s Build A Simple Interpreter](https://ruslanspivak.com/lsbasi-part1/)
- [Compilers: Principles, Techniques, and Tools (2nd Edition) 2nd Edition](https://www.amazon.com/Compilers-Principles-Techniques-Tools-2nd/dp/0321486811)
- [Types and Programming Languages](https://www.amazon.com/Types-Programming-Languages-MIT-Press/dp/0262162091)

# References

1. [Static Code Analysis of Angular 2 and TypeScript Projects - http://blog.mgechev.com/2016/02/29/static-code-analysis-angular-typescript/](http://blog.mgechev.com/2016/02/29/static-code-analysis-angular-typescript/).
2. [Developing Statically Typed Programming Language - http://blog.mgechev.com/2017/08/05/typed-lambda-calculus-create-type-checker-transpiler-compiler-javascript/](http://blog.mgechev.com/2017/08/05/typed-lambda-calculus-create-type-checker-transpiler-compiler-javascript/)
3. [Tiny Compiler - https://github.com/mgechev/tiny-compiler](https://github.com/mgechev/tiny-compiler)
4. [Lexical Analysis - https://en.wikibooks.org/wiki/Compiler_Construction/Lexical_analysis](https://en.wikibooks.org/wiki/Compiler_Construction/Lexical_analysis)
5. [Syntax Analysis - https://en.wikibooks.org/wiki/Compiler_Construction/Syntax_Analysis](https://en.wikibooks.org/wiki/Compiler_Construction/Syntax_Analysis)
6. [Abstract Syntax Tree - https://en.wikibooks.org/wiki/Compiler_Construction/Case_Study_1B#Abstract_Syntax_Trees](https://en.wikibooks.org/wiki/Compiler_Construction/Case_Study_1B#Abstract_Syntax_Trees)
7. [EBNF grammar - https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form)
8. [Recursive Descent Parsing - https://en.wikipedia.org/wiki/Recursive_descent_parser](https://en.wikipedia.org/wiki/Recursive_descent_parser)
