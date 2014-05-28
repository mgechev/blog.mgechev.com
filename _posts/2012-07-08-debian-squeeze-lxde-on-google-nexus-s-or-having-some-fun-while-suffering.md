---
title: Debian Squeeze + LXDE on Google Nexus S (or having some fun while suffering)
author: Minko Gechev
layout: post
permalink: /2012/07/08/debian-squeeze-lxde-on-google-nexus-s-or-having-some-fun-while-suffering/
categories:
  - Android
  - Debian
  - Linux
  - VNC
tags:
  - android
  - debian
  - linux
  - vnc
---
<!-- Kudos 1.1.1-->

<div class="kudo-box kudo-c_tr" style="margin:0px px 30px 30px;">
  <figure class="kudo kudoable" data-id="126"> <a class="kudo-object"> <div class="kudo-opening">
    <div class="kudo-circle">
      &nbsp;
    </div>
  </div></a> 
  
  <div class="kudo-meta kudo-meta-126">
    <div class="kudo-meta-alpha kudo-hideonhover">
      <span class="kudo-count"></span> <span class="kudo-text">Kudos</span>
    </div>
    
    <div class="kudo-meta-beta kudo-dontmove">
      <span>Don't<br />move!</span>
    </div>
  </div></figure>
</div>

I&#8217;m here again, after a long pause. For a while I&#8217;ve got problems with my health and I&#8217;m nailed at home&#8230;so I&#8217;ve go a lot of free time. Last night I&#8217;ve decided to root my Google Nexus S.  
I use Ubuntu

[<img class="alignleft size-medium wp-image-152" style="margin: 10px;" title="Debian Squeeze with LXDE on Android 4.1" src="http://blog.mgechev.com/wp-content/uploads/2012/07/547127_487402781271330_2093254846_n-300x180.jpg" alt="" width="300" height="180" />][1]

12.04 on my home machine so I put on it Oracle Java and Android SDK. I also installed few packages from the SDK (platform-tools). I created few udev rules, because my computer wasn&#8217;t able to know what to do when I plug-in my Nexus with a fastboot mode. In the next step I unlocked my Nexus (the reason for that was because my warranty is over&#8230;otherwise I would think a bit more before I go to the next step). Having the Android SDK, the unlock procedure is quite easy:

     #./android-sdk-linux/platform-tools/fastboot oem unlock 

The next step was to install TWRP recovery. I chose that one because all the things I read ensured me that it&#8217;s the last generation recovery&#8230;Soo I went to the http://teamw.in/project/twrp2 page and downloaded the last version for my device. With the SDK I flashed it:

     # ./android-sdk-linux/platform-tools/fastboot flash recovery openrecovery-twrp-crespo-2.1.1.img 

&#8230;the final step was to root my Nexus S. I downloaded few files from http://androidsu.com/superuser/ and I put it&#8217;s content into my phone&#8217;s root folder. After I restarted my phone using fastboot, with few taps on the TWRP&#8217;s interface, mounting the Nexus&#8217;s storage and taping on Eject, my phone was almost flashed&#8230;the final sub-step was to restart the device and choose Install&#8230;after that to select my superuser-archive&#8230;

After I restarted my phone and my root privileges were granted. And here comes the most easy and interesting part &#8211; Installing Debian and LXDE.

There&#8217;s easy Linux Installer for Android. Changing few settings will make your linux storage big enough. After you install the system (which is done by few clicks&#8230;) you&#8217;ve got to install some kind of terminal for your Android. I&#8217;ve choose Android terminal emulator. 

Install LXDE:

     # apt-get install lxde 

Install a VNC server:

     # apt-get install tightvncserver 

You can export your user as root&#8230;

     # export USER=root 

To start your VNC server at start-up add the following lines to .bashrc:

     export USER=root 

     cd / 

     rm -r -f tmp 

     mkdir tmp 

     cd / 

     vncserver -geometry 800x480 #resolution for my Nexus S 

&nbsp;

And you&#8217;re done &#8211; just use your favorite VNC client to connect your phone to the Debian&#8217;s GUI.

 [1]: http://blog.mgechev.com/wp-content/uploads/2012/07/547127_487402781271330_2093254846_n.jpg