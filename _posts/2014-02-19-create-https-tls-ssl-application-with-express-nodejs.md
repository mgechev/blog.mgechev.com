---
title: Express over HTTPS
author: Minko Gechev
layout: post
permalink: /2014/02/19/create-https-tls-ssl-application-with-express-nodejs/
categories:
  - Express
  - Http
  - JavaScript
  - Node.js
  - Programming
  - Security
  - Web development
tags:
  - Express
  - HTTPS
  - Node.js
  - SSL
  - TLS
---
<!-- Kudos 1.1.1-->

<div class="kudo-box kudo-c_tr" style="margin:0px px 30px 30px;">
  <figure class="kudo kudoable" data-id="674"> <a class="kudo-object"> <div class="kudo-opening">
    <div class="kudo-circle">
      &nbsp;
    </div>
  </div></a> 
  
  <div class="kudo-meta kudo-meta-674">
    <div class="kudo-meta-alpha kudo-hideonhover">
      <span class="kudo-count">1</span> <span class="kudo-text">Kudos</span>
    </div>
    
    <div class="kudo-meta-beta kudo-dontmove">
      <span>Don't<br />move!</span>
    </div>
  </div></figure>
</div>

Sometimes you want to test your application in environment closer to the real world. In such cases you might need to run it over TLS.

Here are two simple steps, which can be used to achieve this result:

1.  ### Generate self-signed certificate
    
    If you don&#8217;t already have certificate you need to generate one:
    
    <pre lang="bash">$ openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365
</pre>
    
    You will be asked a couple of questions&#8230;  
    [<img src="http://blog.mgechev.com/wp-content/uploads/2014/02/Screen-Shot-2014-02-19-at-10.05.55.png" alt="Certificate generation" width="831" height="375" class="aligncenter size-full wp-image-675" />][1]  
    In this case we generated a self-signed certificate for 365 days. </li> 
    *   ### Use Express with HTTPS
        
        <pre lang="javascript">var fs = require('fs'),
    https = require('https'),
    express = require('express'),
    app = express();

https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app).listen(55555);

app.get('/', function (req, res) {
  res.header('Content-type', 'text/html');
  return res.end('<h1>
  Hello, Secure World!
</h1>');
});
</pre>
        
        This script will create Express application running over HTTPs.  
        Run the application:
        
        <pre lang="bash">$ node index.js
</pre>
        
        Enter the passphrase you entered during the creation of the certificate&#8230;
        
        Now open your browser: <https://localhost:55555/>.  
        After trusting the certificate you&#8217;d be done!
        
        [<img src="http://blog.mgechev.com/wp-content/uploads/2014/02/Screen-Shot-2014-02-19-at-10.14.40.png" alt="Https with Express" width="558" height="465" class="aligncenter size-full wp-image-676" />][2] </li> </ol>

 [1]: http://blog.mgechev.com/wp-content/uploads/2014/02/Screen-Shot-2014-02-19-at-10.05.55.png
 [2]: http://blog.mgechev.com/wp-content/uploads/2014/02/Screen-Shot-2014-02-19-at-10.14.40.png