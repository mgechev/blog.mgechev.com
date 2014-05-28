---
title: Интересен webkit feature
author: Minko Gechev
layout: post
permalink: /2011/08/06/%d0%b8%d0%bd%d1%82%d0%b5%d1%80%d0%b5%d1%81%d0%b5%d0%bd-webkit-feature/
categories:
  - Browsers
  - HTML5
  - Internet
  - JavaScript
  - Programming
  - Webkit
tags:
  - input
  - JavaScript
  - Programming
  - speech
  - webkit
---
<!-- Kudos 1.1.1-->

<div class="kudo-box kudo-c_tr" style="margin:0px px 30px 30px;">
  <figure class="kudo kudoable" data-id="3"> <a class="kudo-object"> <div class="kudo-opening">
    <div class="kudo-circle">
      &nbsp;
    </div>
  </div></a> 
  
  <div class="kudo-meta kudo-meta-3">
    <div class="kudo-meta-alpha kudo-hideonhover">
      <span class="kudo-count"></span> <span class="kudo-text">Kudos</span>
    </div>
    
    <div class="kudo-meta-beta kudo-dontmove">
      <span>Don't<br />move!</span>
    </div>
  </div></figure>
</div>

В статията ще разгледам интересна функционалност предоставена от webkit браузърите (това означава, че е най-добре да я разглеждате с Chrome). Последно време все по-често започна да се появява speech input. Още от малък си спомням гласовото набиране на телефоните. В Windows Vista даден потребител можеше да упражнява що-годе добър гласов контрол върху компютъра си. Това явление се пренася и в Web. То разбира се може да бъде постигнато и посредством Flash, Silverlight&#8230;но е имплементирано и от самите браузъри. Всеки може да го използва чрез тага  


<pre lang="html"><input x-webkit-speech /> 
</pre>

И това е всичко :). Piece of cake!  
Тази възможност е за стандартно текстово поле, но същото нещо може да бъде постигнато и с textarea. Като добавим малко CSS и няколко реда JavaScript получаваме [следното нещо][1]  
  
Ето и самият код:

<pre lang="CSS"></pre>

<pre lang="JavaScript"></pre>

<pre lang="HTML"><div>
  Кажи нещо:<br />
  <input x-webkit-speech />
  
</div>



<div style="width:230px">
  Кликни върху микрофона и ми кажи нещо на английски. Обещавам, че ще го запиша:<br />
  <textarea id="speechTextArea"></textarea>
  <input x-webkit-speech id="speechInput" />
  
</div>
</pre>

 [1]: http://blog.mgechev.com/examples/speechinput.htm