---
title: Talks
author: minko_gechev
layout: page
---

![Talks](/images/talks.jpg)

I like talking about software development. I've spoken in San Francisco, Las Vegas, London, Berlin, Kiev, etc. Here you can find links to some of my recent talks.

If you're looking for speakers for your next JavaScript, Angular, React, etc. related conference you can reach me at **minko at gechev dot io**.

<div class="talks-grid" id="talks-root">
</div>

<script>
(function () {
  var talks = [{
    "title": {
      "label": "“Angular Performance Checklist”",
      "link": "https://speakerdeck.com/mgechev/angular-performance-checklist-1"
    },
    "image": "/images/talks/ng-perf.png",
    "description": "<a href=\"https://angulardevsummit.com/\">Angular Dev Summit</a> (online, 11th of September, 2017)"
  },
  {
    "title": {
      "label": "“Angular Performance Checklist”",
      "link": "https://speakerdeck.com/mgechev/angular-performance-checklist-1"
    },
    "image": "/images/talks/ng-perf.png",
    "description": "ngHouston (online, 18th of August, 2017)"
  },
  {
    "title": {
      "label": "“Angular Unplugged” Q&A session",
      "link": "https://speakerdeck.com/mgechev/angular-unplugged"
    },
    "image": "/images/talks/unplugged.png",
    "description": "Q&amp;A session organized for the Bulgarian JavaScript community, <a href=\"https://speakerdeck.com/mgechev/angular-unplugged\">slides</a> (Sofia, Bulgaria, 13th of July, 2017)"
  },
  {
    "title": {
      "label": "“Mad Science with the Angular Compiler”",
      "link": "https://speakerdeck.com/mgechev/mad-science-with-the-angular-compiler"
    },
    "image": "/images/talks/compiler.png",
    "description": "<a href=\"https://speakerdeck.com/mgechev/mad-science-with-the-angular-compiler\">slides</a> (AngularUP, Tel Aviv, Israel, 25th of June, 2017)"
  },
  {
    "title": {
      "label": "“Angular Performance Checklist”",
      "link": "https://speakerdeck.com/mgechev/angular-performance-checklist-1"
    },
    "image": "/images/talks/ng-perf.png",
    "description": "ngcruise (cruise ship, Bahamas, 31st May, 2017)"
  },
  {
    "title": {
      "label": "“Mad Science with the Angular Compiler”",
      "link": "https://speakerdeck.com/mgechev/mad-science-with-the-angular-compiler"
    },
    "image": "/images/talks/compiler.png",
    "description": "Angular Bolivia (online, 30th of April, 2017)"
  },
  {
    "title": {
      "label": "“Mad Science with the Angular Compiler”",
      "link": "https://speakerdeck.com/mgechev/mad-science-with-the-angular-compiler"
    },
    "image": "/images/talks/compiler.png",
    "description": "<a href=\"https://www.youtube.com/watch?v=tBV4IQwPssU\">video (en)</a>, ng-conf (Salt Lake City, Utah, 5th of April, 2017)"
  },
  {
    "title": {
      "label": "“Linting Angular”",
      "link": "https://speakerdeck.com/mgechev/linting-angular-1"
    },
    "image": "/images/talks/linting-full.png",
    "description": "Modern Web (Mountain View, California, 9th of March 2017)"
  },
  {
    "title": {
      "label": "“Angular as Integrated Development Platform”",
      "link": "https://speakerdeck.com/mgechev/angular-as-integrated-development-platform"
    },
    "image": "/images/talks/integrated-platform.png",
    "description": "Angular Sofia (Sofia, Bulgaria, 12th of January 2017)"
  },
  {
    "title": {
      "label": "“Scalable Application Architecture”",
      "link": "https://speakerdeck.com/mgechev/scalable-application-architecture"
    },
    "image": "/images/talks/scalable-2.png",
    "description": "ng-be (Ghent, Belgium, 9th of December 2016)"
  },
  {
    "title": {
      "label": "“Building Angular App for Production”",
      "link": "https://speakerdeck.com/mgechev/building-an-angular-app-for-production"
    },
    "description": "Angular Orange County (Google, Orange County, 10th of November 2016), SoCal CodeCamp (USC, Los Angeles, 12th of November 2016)"
  },
  {
    "title": {
      "label": "“Angular Toolset Support”",
      "link": "https://speakerdeck.com/mgechev/angular-toolset-support"
    },
    "image": "/images/talks/toolset.png",
    "description": "Connect.Tech (Atlanta, Georgia, 22nd of October 2016)"
  },
  {
    "title": {
      "label": "“Angular Performance Checklist”",
      "link": "https://speakerdeck.com/mgechev/angular-performance-checklist"
    },
    "description": "Connect.Tech (Atlanta, Georgia, 21st of October 2016)"
  },
  {
    "title": {
      "label": "“Linting Angular”",
      "link": "https://speakerdeck.com/mgechev/linting-angular"
    },
    "image": "/images/talks/linting.png",
    "description": "South Bay JavaScript (Mountain View, California, 12th of October 2016)"
  },
  {
    "title": {
      "label": "“Angular 2 Toolset Support”",
      "link": "https://speakerdeck.com/mgechev/angular-2-toolset-support"
    },
    "image": "/images/talks/toolset.png",
    "description": "Capgemini Webinar (online, 26th of May, 2016)"
  },
  {
    "title": {
      "label": "“Integrated Web Stack with Angular 2”",
      "link": "https://speakerdeck.com/mgechev/integrated-web-stack-with-angular-2"
    },
    "description": "xlr8con (Sofia, Bulgaria, 14th of May, 2016)"
  },
  {
    "title": {
      "label": "“Automated Angular 2 Style Checking with Codelyzer”",
      "link": "https://youtu.be/bci-Z6nURgE"
    },
    "description": "ng-conf (Salt Lake City, Utah, United States, 6th of May, 2016)"
  },
  {
    "title": {
      "label": "“Scalable Angular 2 Application Architecture”",
      "link": "https://speakerdeck.com/mgechev/scalable-angular-2-application-architecture"
    },
    "description": "FDConf (Minsk, Belarus, 16th of April, 2016)"
  },
  {
    "title": {
      "label": "“Angular 2 - Quick Web Start”",
      "link": "https://speakerdeck.com/mgechev/angular-2-quick-web-start"
    },
    "description": "“Angular 2 ❤ NativeScript” (Sofia, Bulgaria, 10th of March, 2016)"
  },
  {
    "title": {
      "label": "“Building Universal Applications with Angular 2”",
      "link": "https://speakerdeck.com/mgechev/building-universal-applications-with-angular-2"
    },
    "description": "OpenFest 2015 (Sofia, Bulgaria), ITWeekend 2015 (Sofia, Bulgaria), JSTalks 2015 (Sofia, Bulgaria)."
  },
  {
    "title": {
      "label": "“Cutting Angular’s Crosscuts”",
      "link": "https://speakerdeck.com/mgechev/cutting-angulars-crosscuts"
    },
    "description": "<a href=\"https://www.youtube.com/watch?v=C6e6-31HD5A\">video (en)</a>, AngularConnect (London, United Kingdom, 21st of October, 2015)"
  },
  {
    "title": {
      "label": "“Immutable.js with Angular”",
      "link": "https://www.youtube.com/watch?v=gN1K1hE9v4g"
    },
    "description": "<a href=\"http://angular-air.com/\">AngularAir Podcast</a> (online, 22nd of September, 2015)"
  },
  {
    "title": {
      "label": "“Single-Page Applications: Challenges”",
      "link": "https://speakerdeck.com/mgechev/single-page-applications-challenges"
    },
    "description": "<a href=\"http://ukraine.itweekend.ua/en/\">IT Weekend</a> (Kiev, Ukraine, 12th of September, 2015)"
  },
  {
    "title": {
      "label": "“Bringing Immutability to Angular”",
      "link": "https://speakerdeck.com/mgechev/bringing-immutability-to-angular"
    },
    "description": "<a href=\"http://frontendweekend.uwcua.com/\">Front-end Weekend</a> (online, 16th of August, 2015)"
  },
  {
    "title": {
      "label": "“Immutability with Angular with Minko Gechev”",
      "link": "http://devchat.tv/adventures-in-angular/054-aia-immutability-with-angular-with-minko-gechev"
    },
    "description": "<a href=\"http://adventuresinangular.com/\">Adventures in Angular Podcast”</a> (online, 29th of July, 2015)"
  },
  {
    "title": {
      "label": "“Introduction to Angular 2”",
      "link": "https://speakerdeck.com/mgechev/introduction-to-angular-2"
    },
    "description": "Webloz Edge (Burgas, Bulgaria, 29th of June, 2015)"
  },
  {
    "title": {
      "label": "“Code Reusability in Angular”",
      "link": "https://speakerdeck.com/mgechev/code-reusability-in-angular"
    },
    "description": "Angular Berlin (Berlin, Germany, 10th of June, 2015)"
  },
  {
    "title": {
      "label": "“Bringing Immutability to Angular”",
      "link": "https://www.youtube.com/watch?v=zeChCjj-tbY"
    },
    "description": "ng-vegas (Las Vegas, USA, 7th of May, 2015)"
  },
  {
    "title": {
      "label": "“AngularJS in Patterns”",
      "link": "https://speakerdeck.com/mgechev/angularjs-in-patterns-lightning-talk"
    },
    "description": "AngularJS-SF user group (San Francisco, USA, 25th of February, 2015)"
  },
  {
    "title": {
      "label": "“Taking the web apps offline”",
      "link": "https://speakerdeck.com/mgechev/taking-the-web-apps-offline"
    },
    "description": "talk I did in ICN (Sofia, Bulgaria, 27th of January, 2015)"
  },
  {
    "title": {
      "label": "“Lightweight AngularJS”",
      "link": "https://speakerdeck.com/mgechev/lightweight-angularjs"
    },
    "description": "SoftServe’s IT Weekend (Sofia, Bulgaria, 29th of November, 2014). Blog post on this topic could be <a href=\"https://github.com/mgechev/light-angularjs\">found here</a>"
  },
  {
    "title": {
      "label": "“Introduction to JavaScript’s MVW with Backbone.js”",
      "link": "https://speakerdeck.com/mgechev/introduction-to-mvw-in-javascript"
    },
    "description": "HackBulgaria (Sofia, Bulgaria, 31st of July, 2014)"
  },
  {
    "title": {
      "label": "“Introduction to WebRTC”",
      "link": "https://github.com/mgechev/webrtc-slides-jsnext"
    },
    "description": "JSNext, (Sofia, Bulgaria, 24th of November, 2014)"
  },
  {
    "title": {
      "label": "“What can JavaScript do?”",
      "link": "https://github.com/mgechev/what-js-can-do-slides"
    },
    "description": "HackBulgaria (Sofia, Bulgaria, 31st of October, 2014)"
  },
  {
    "title": {
      "label": "“AngularJS in Patterns”",
      "link": "https://github.com/mgechev/angularjs-in-patterns-slides-plovdev"
    },
    "description": "PlovDev (Plovdiv, Bulgaria, 18th of October, 2014)"
  },
  {
    "title": {
      "label": "“Aspect-Oriented Programming with AngularJS”",
      "link": "https://github.com/mgechev/angular-aop-talk"
    },
    "description": "AngularJS-SF user group (San Francisco, USA, 5th of May, 2014)"
  },
  {
    "title": {
      "label": "“Single-Page Applications и AngularJS” (BG)",
      "link": "https://www.youtube.com/watch?v=G35xa-LuR8Q"
    },
    "description": "OpenFest (Sofia, Bulgaria, 9th of November, 2013)."
  },
  {
    "title": {
      "label": "“JavaScript Patterns” (BG)",
      "link": "https://www.youtube.com/watch?v=a23oYdqQVvM"
    },
    "description": "Telerik (Sofia, Bulgaria, 22nd of April, 2013)"
  }
];
function renderTalk(talk) {
  var el = document.createElement('a');
  el.classList.add('talk');
  el.setAttribute('href', talk.title.link);

  var header = document.createElement('h1');
  header.innerText = talk.title.label;

  var bg = document.createElement('div');
  bg.classList.add('talk-background');
  if (talk.image) {
    bg.style.backgroundImage = 'url(' + talk.image + ')';
  }

  el.appendChild(bg);
  var desc = document.createElement('section');
  desc.innerHTML = talk.description;

  el.appendChild(header);
  el.appendChild(desc);
  return el;
}
function renderRow() {
  var row = document.createElement('div');
  row.classList.add('talks-row');
  return row;
}
var row;
var talksRoot = document.getElementById('talks-root');
talks.forEach(function (talk, i) {
  if (i % 3 === 0) {
    if (row) {
      talksRoot.appendChild(row);
    }
    row = renderRow();
  }
  row.appendChild(renderTalk(talk))
  if (i === talks.length - 1 && i % 3 !== 0) {
    talksRoot.appendChild(row);
  }
});
}());
</script>
