---
title: Type Checker for Extended Simply Typed Lambda Calculus
author: minko_gechev
layout: post
categories:
  - Angular
  - TypeScript
  - React
tags:
  - Angular
  - React
  - TypeScript
---

In this blog post we'll go through a sample implementation of a type checker, interpreter and a transpiler for a primitive purely functional programming language, which is based on the lambda calculus. The article is inspired by the book "[Types and Programming Languages](https://www.cis.upenn.edu/~bcpierce/tapl/)".

# Syntax

The syntax of the language is going to be quite simple.

We will have two types:

```
T ::= Int | Bool
```

As you can see we don't ave a syntactical construct for declaring type of a function (like we do in Haskell - `T1 -> T2`, for instance). This is because we're going to apply basic type inference based on the type of the function's argument and body.

Our programs should belong to the language declared by the following grammar:

```
t ::=
  x   # variable
  λ x: T → t   # abstraction
  t t   # application
  true   # true literal
  false   # false literal
  if t then t else t   # conditional expression
  succ t   # returns the next natural number when applied to `t`
  prev t   # returns the previous natural number when applied to `t`
  num   # a natural number
```

Where `num ∈ ℕ, num ≥ 0`.

# Semantics

Before going any further, lets show a few samples of the programming language that we're going to develop.

```
(λ a: Int → succ succ a) 0
```

In the example above we declare an anonymous function which accepts a single argument called `a` of type `Int`. In the body of the function we apply twice the predefined function `succ` to `a`. The anonymous function we apply to `0`, which is going to produce `2` as final result.

The equivalent of this program in JavaScript will be:

```
(a => succ(succ(a)))(0)
```

Where `succ` is defined as:

```
succ = a => a + 1
```

A more complicated program in our programming language will look like this:

```
succ (
  λ f: Int →
    (λ g: Int → g) 0
) 0
```

Lets explain the evaluation step by step:

1. Apply the `succ` predefined function to the result of the evaluation of the code within the parenthesis. The semantics of this code is:
2. Define an anonymous function which accepts a single argument of type `Int`, called `f`, and returns another anonymous function.
3. The second anonymous function has a single argument called `g` of type `Int`.
4. Apply `0` to the innermost function, which as result is going to produce `0`.
5. Pass `0` as argument to the outer function which will return `0` as result of the computation (the body of the outermost function evaluates to `0`).
6. Increment `0` and get `1`.

Formally, we can show the small-step semantics of our language in the following way:

TBD

# Type Relations

TBD

# Lexer and Parser

Although the implementation of a lexer and parser for this tiny language will be quite simple, we're going to generate them using PEG.js.

Here's the Peg grammar:

```
Application = l:ExprAbs r:Application* {
  if (!r || !r.length) {
    return l;
  } else {
    r = r.pop();
    return { type: 'application', left: l, right: r};
  }
};

ExprAbs = Expr / Abstraction;

Abstraction = _ '('? _ 'λ' _ id:Identifier ':' t:Type '→' f:Application _ ')'? _ {
  return { type: 'abstraction', arg: { type: t, id: id }, body: f };
}

Expr = IfThen / IsZeroCheck / ArithmeticOperation / Zero / True / False / Identifier / ParanExpression

ArithmeticOperation = o:Operator e:Application {
  return { type: 'arithmetic', operator: o, expression: e };
};

IsZeroCheck = IsZero e:Application {
  return { type: 'is_zero', expression: e };
}

Operator = Succ / Pred

IfThen = If expr:Application Then then:Application Else el:Application {
  return { type: 'conditional_expression', condition: expr, then: then, el: el };
}

Type =  Int / Bool

_  = [ \t\r\n]*

__ = [ \t\r\n]+

Identifier = !ReservedWord _ id:[a-z]+ _ {
  return { name: id.join(''), type: 'identifier' };
}

ParanExpression = _'('_ expr:Expr _')'_ {
  return expr;
}

True = _ 'true' _ {
  return { type: 'literal', value: true };
}

False = _ 'false' _ {
  return { type: 'literal', value: false };
}

Zero = _ '0' _ {
  return { type: 'literal', value: 0 };
}

ReservedWord = If / Then / Else / Pred / Succ / Int / Bool / IsZero / False

If = _'if'_

Then = _'then'_

Else = _'else'_

Pred = _'pred'_ {
  return 'pred';
}

Succ = _'succ'_ {
  return 'succ';
}

Int = _'Int'_ {
  return 'Int';
}

Bool = _'Bool'_ {
  return 'Bool';
}

IsZero = _'iszero'_ {
  return 'iszero';
}
```

Lets take a look at some specific terms:


### Application

```
Application = l:ExprAbs r:Application* {
  if (!r || !r.length) {
    return l;
  } else {
    r = r.pop();
    return { type: 'application', left: l, right: r};
  }
};
```

The function application `t t` from above can be expressed with this Peg rule. In general, we can have one expression or abstraction followed by 0 or more other applications.

We name the left term `l` and the right one `r`, after that, in case of a match, we return an object (AST node) with type `abstraction`, `left` and `right` branches.

Another interesting term is the abstraction:

```
Abstraction = _ '('? _ 'λ' _ id:Identifier ':' t:Type '→' f:Application _ ')'? _ {
  return { type: 'abstraction', arg: { type: t, id: id }, body: f };
}
```

We can see that it starts with an optional opening parenthesis, after that we have the lambda (`λ`) symbol, followed by the parameter declaration and its type. After that, we have arrow (`→`) and the abstraction's body, which is an application.

# Developing a Type Checker

# Developing an Interpreter

# Developing a Transpiler

# Conclusion

