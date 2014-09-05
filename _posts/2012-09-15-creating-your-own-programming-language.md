---
title: ELang
author: minko_gechev
layout: post
permalink: /2012/09/15/creating-your-own-programming-language/
categories:
  - Development
  - Java
  - Programming
  - Programming languages
tags:
  - elang
  - java
  - Programming
  - programming languages
---
And one more blog post by me! It&#8217;s going to be in brand new topic than the others. For about an year and a half I&#8217;ve got an idea which I wanted to accomplish&#8230;To create my own simple programming language. Actually it&#8217;s very useful task and quite interesting. Creating it you can get better understanding how the compilers and interpreters work and probably write better code. Unfortunately there were two problems&#8230;I didn&#8217;t have enough time for such task and&#8230;I&#8217;ve not studied formal grammars (and as I mentioned I don&#8217;t have enough time to study them&#8230;there are just so much more interesting things to read about :-P ). Last weekend I wasn&#8217;t in very good health condition. I think that I have a tradition to make different cool stuffs when I don&#8217;t feel very well :-)&#8230;Soo for two days I&#8217;ve wrote about forty Java classes which actually were ELang.

I opened my Java IDE (I decided to not write the language in JavaScript) and I created few different classes&#8230;Actually I had idea to create something very basic, just variables, if, while, number expressions and boolean expressions. Oh&#8230;I almost forgot to tell that my language is interpreted so that&#8217;s why I decided to have three different stages in the execution process: lexing, parsing and interpreting. The lexing process was straight-forward so there&#8217;s nothing interesting about it&#8230;I&#8217;ve just created different tokens from the long string which is the actual program. Here&#8217;s more information about that <https://en.wikipedia.org/wiki/Tokenization>. After I finished with the lexing&#8230;ahh after that&#8230;it was the Parsing&#8230;Actually that was the process which has been scaring me :-). I&#8217;ve created an interface IStatement which was something that has a void method called &#8220;execute&#8221;. Here&#8217;s the interface:

{% highlight Java %}public interface IStatement {
    void execute();
}{% endhighlight %}

<div>
</div>

<div>
  Another key part is the interface IExpression which was something similar but:
</div>

<div>
</div>

<div>
  {% highlight Java %}public interface IExpression {
    Value evaluate();
}{% endhighlight %}
</div>

<div>
</div>

<div>
  As you might guess Value is a terminal which is a class defined by myself. The statement actually is a list of IStatement-s (Composite). Well it&#8217;s not exactly accurate because the if statement, for example, which also implements IStatement has a list of  IStatements and a condition which is actually an IExpression :-). Depending on the current token I make decisions what kind of statement (or expression) should I create. Very important moment is that the variables must be variables in the statements even after the statement is evaluated! Why? Because there&#8217;s a while statement. The statements inside the while statement are executed multiple times so if we substitute the variable with it&#8217;s value we will loose our statement and possibly create an infinite loop. All expressions are parsed into a <a href="https://en.wikipedia.org/wiki/Reverse_Polish_notation">reverse polish notation</a>. This is an easy algorithm which can be found just everywhere&#8230;Expressions are lists of symbols. A single symbol could be &#8211; variable, value (boolean/string/number) or an operator. After an expression is created it can be evaluated with it&#8217;s method evaluate (implemented because of the implementation of IExpression). Evaluating expressions in reverse polish notation is quite easy.
</div>

<div>
</div>

<div>
  With this construction the interpreting process is extremely simple:
</div>

<div>
</div>

{% highlight Java %}public void interpret() {
    Iterator iter = this.statements.iterator();
    IStatement current;
    while (iter.hasNext()) {
        current = iter.next();
        current.execute();
    }
}{% endhighlight %}

I also want to have interaction with the user. So there are also implementations of read and print methods. That&#8217;s why I&#8217;ve created special kind of IExpression (actually there&#8217;s nothing special but just separated in different package :-) ). The print function is a list of IExpressions. After the list is evaluated everything is just put on the user&#8217;s screen&#8230;Here is the implementation:

{% highlight Java %}public Value evaluate() {
    Value result = this.toPrint.evaluate();
    System.out.print(result.getValue());
    return result;
}{% endhighlight %}

Easy, right? With this kind of language I&#8217;ve achieved programs like that:

{% highlight text %}def fibonacci(n)
    if n >= 0:
        a1 = 0;
        a2 = 1;
        current = 0;
        while n > current:
            temp = a2;
            a2 = a1 + a2;
            a1 = temp;
            current = current + 1;
        endwhile;
        result = a1;
    else: 
        result = 0;
    endif;
    return result;
enddef;

def factorial(n)
    result = 1;
    current = 1;
    while current <= n:
        result = result * current;
        current = current + 1;
    endwhile;
    return result;
enddef;

print 'Enter n for fibonacci number: ';
n = read;
print 'The result for the fibonacci number entered is: ';
print fibonacci(n);
print '\n';

print 'Enter n for factorial: ';
n = read;
print 'The result for the number you entered for factorial is: ';
print factorial(n);
print '\n';
{% endhighlight %}

It also allows recursion:

{% highlight text %}def recursiveFibonacci(n)
    if n == 0:
        return 0;
    endif;
    if n == 1:
        return 1;
    endif;
    return recursiveFibonacci(n - 1) + recursiveFibonacci(n - 2);
enddef;
{% endhighlight %}

The github repository can be found here: <https://github.com/mgechev/ELang/>

After I finished with that I have a desire to improve it a little...Including feature for importing external files will be very useful and may make the language even useful :D. The language can be extended to object-oriented easy by adding hash. If the hash values can be primitives, other hashes and methods this extension can be accomplished without much troubles.

Actually now ELang is quite useful for writing simple programs and teaching beginner programmers how to write different basic constructs but it's potential ends very quickly after these programmers learn how to use if, while, print, read and declare different functions. :-).