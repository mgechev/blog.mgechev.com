---
author: minko_gechev
categories:
- Android
- Debian
- Linux
- VNC
date: 2012-07-08T00:00:00Z
tags:
- android
- debian
- linux
- vnc
title: Debian Squeeze + LXDE on Google Nexus S (or having some fun while suffering)
url: /2012/07/08/debian-squeeze-lxde-on-google-nexus-s-or-having-some-fun-while-suffering/
---

I’m here again, after a long pause. For a while I’ve got problems with my health and I’m nailed at home...so I’ve go a lot of free time. Last night I’ve decided to root my Google Nexus S.  
I use Ubuntu

[<img class="alignleft size-medium wp-image-152" style="margin: 10px;" title="Debian Squeeze with LXDE on Android 4.1" src="/images/legacy/uploads2012/07/547127_487402781271330_2093254846_n-300x180.jpg" alt="" width="300" height="180" />][1]

12.04 on my home machine so I put on it Oracle Java and Android SDK. I also installed few packages from the SDK (platform-tools). I created few udev rules, because my computer wasn’t able to know what to do when I plug-in my Nexus with a fastboot mode. In the next step I unlocked my Nexus (the reason for that was because my warranty is over...otherwise I would think a bit more before I go to the next step). Having the Android SDK, the unlock procedure is quite easy:

     #./android-sdk-linux/platform-tools/fastboot oem unlock 

The next step was to install TWRP recovery. I chose that one because all the things I read ensured me that it’s the last generation recovery...Soo I went to the http://teamw.in/project/twrp2 page and downloaded the last version for my device. With the SDK I flashed it:

     # ./android-sdk-linux/platform-tools/fastboot flash recovery openrecovery-twrp-crespo-2.1.1.img 

...the final step was to root my Nexus S. I downloaded few files from http://androidsu.com/superuser/ and I put it’s content into my phone’s root folder. After I restarted my phone using fastboot, with few taps on the TWRP’s interface, mounting the Nexus’s storage and taping on Eject, my phone was almost flashed...the final sub-step was to restart the device and choose Install...after that to select my superuser-archive...

After I restarted my phone and my root privileges were granted. And here comes the most easy and interesting part – Installing Debian and LXDE.

There’s easy Linux Installer for Android. Changing few settings will make your linux storage big enough. After you install the system (which is done by few clicks...) you’ve got to install some kind of terminal for your Android. I’ve choose Android terminal emulator. 

Install LXDE:

     # apt-get install lxde 

Install a VNC server:

     # apt-get install tightvncserver 

You can export your user as root...

     # export USER=root 

To start your VNC server at start-up add the following lines to .bashrc:

     export USER=root 

     cd / 

     rm -r -f tmp 

     mkdir tmp 

     cd / 

     vncserver -geometry 800x480 #resolution for my Nexus S 

&nbsp;

And you’re done – just use your favorite VNC client to connect your phone to the Debian’s GUI.

 [1]: /images/legacy/uploads2012/07/547127_487402781271330_2093254846_n.jpg