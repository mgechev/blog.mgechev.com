---
title: Color animation plugin for jQuery
author: minko_gechev
layout: post
permalink: /2012/01/16/color-animation-plugin-for-jquery/
categories:
  - Algorithms
  - Internet
  - JavaScript
  - jQuery
  - OpenSource
  - Programming
tags:
  - JavaScript
  - jQuery
---

Hi! I haven&#8217;t wrote since a long time but there&#8217;s so much code and so little time&#8230;It&#8217;s bad that the biggest part of the code is not open source but what can we do&#8230;Last few hours I developed a JavaScript plugin for color animation. Of course for few hours I cant make something with great quality so it&#8217;s a little bit unstable (I think) but it works and it&#8217;s also valid for the JSLint standards. It uses easy algorithm. I think of the RGB color representation as a three dimensional space with coordinates in the range [0, 255]. The user is sets object with specific color (doesn&#8217;t matter background, font&#8230;btw that&#8217;s still not fully tested) which is actually a point in this three dimensional space. The target is another point in the 3D space so I just move from the first to the second point. I spoke enough. Let&#8217;s look at the code:

<pre lang="JavaScript">(function ($) {
    'use strict';
    $.fn.colorAnimation = function (userOptions) {

        var element = this,
            options = {
                property: 'background-color',
                color: '#00ff00',
                interval: 300
            },
            sysVars = {
                rgbColor: {},
                rgbTargetColor: {},
                timeout: null,
                currentInterval: 0,
                animationStep: 10
            };

        $.extend(options, userOptions);

        function getFromHex(hex) {
            var rgb = {};
            if (hex.indexOf('#') >= 0) {
                hex = hex.substr(1, hex.length - 1);
            }
            if (hex.length === 3) {
                hex += hex;
            }
            rgb.red = { value: parseInt(hex.substr(0, 2), 16) };
            rgb.green = { value: parseInt(hex.substr(2, 2), 16) };
            rgb.blue = { value: parseInt(hex.substr(4, 2), 16) };
            return rgb;
        }

        function getFromRGB(rgb) {
            var returnValue = {};
            if (rgb.indexOf('rgba(') >= 0) {
                rgb = rgb.replace('rgba(', '');
            } else {
                rgb = rgb.replace('rgb(', '');
            }
            rgb = rgb.replace(')', '').replace(/ /g, '').split(',');
            returnValue.red = { value: parseInt(rgb[0], 10) };
            returnValue.green = { value: parseInt(rgb[1], 10) };
            returnValue.blue = { value: parseInt(rgb[2], 10) };
            return returnValue;
        }

        function getColor(color) {
            var rgb = {};
            if (color.indexOf('#') >= 0) {
                return getFromHex(color);
            } else {
                return getFromRGB(color);
            }
        }

        function getHex(dec) {
            var hex = Math.round(dec).toString(16);
            if (hex.length &lt; 2) {
                hex = '0' + hex;
            }
            return hex;
        }

        function getHexColor(rgb) {
            var red = getHex(rgb.red.value),
                green = getHex(rgb.green.value),
                blue = getHex(rgb.blue.value);
            return '#' + red + green + blue;
        }

        function getSteps() {
            var interval = options.interval,
                rgb = sysVars.rgbColor,
                rgbTarget = sysVars.rgbTargetColor;
            rgb.red.step = 10 * (rgbTarget.red.value - rgb.red.value) / interval;
            rgb.green.step = 10 * (rgbTarget.green.value - rgb.green.value) / interval;
            rgb.blue.step = 10 * (rgbTarget.blue.value - rgb.blue.value) / interval;
        }

        function startAnimation(element) {
            var rgb = sysVars.rgbColor;
            sysVars.timeout = setTimeout(function () {
                if (sysVars.currentInterval >= options.interval) {
                    clearTimeout(sysVars.timeout);
                    return;
                }
                sysVars.currentInterval += sysVars.animationStep;
                rgb.red.value += rgb.red.step;
                rgb.green.value += rgb.green.step;
                rgb.blue.value += rgb.blue.step;
                element.css(options.property, getHexColor(rgb));
                startAnimation(element);
            }, sysVars.animationStep);
        }

        return (function (userOptions) {
            $.extend(options, userOptions);
            sysVars.rgbTargetColor = getColor(options.color);
            sysVars.rgbColor = getColor(element.css(options.property));
            getSteps();
            startAnimation(element);
        }());
    };
}(jQuery));
</pre>

The whole project you can see in my github repository: <a href="https://github.com/mgechev/jquery-color-animation-plugin" target="_blank" title="GitHub">GitHub</a>