---
title: Express over HTTPS
author: minko_gechev
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

Sometimes you want to test your application in environment closer to the real world. In such cases you might need to run it over TLS.

Here are two simple steps, which can be used to achieve this result:

1.  ### Generate self-signed certificate

    If you don&#8217;t already have certificate you need to generate one:

{% highlight bash %}

  $ openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365

{% endhighlight %}

    
You will be asked a couple of questions&#8230;  
<img src="http://blog.mgechev.com/wp-content/uploads/2014/02/Screen-Shot-2014-02-19-at-10.05.55.png" alt="Certificate generation" width="831" height="375" class="aligncenter size-full wp-image-675" />

In this case we generated a self-signed certificate for 365 days.

### Use Express with HTTPS

{% highlight JavaScript %}

    var fs = require('fs'),
    https = require('https'),
    express = require('express'),
    app = express();

    https.createServer({
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem')
    }, app).listen(55555);

    app.get('/', function (req, res) {
      res.header('Content-type', 'text/html');
      return res.end('<h1>Hello, Secure World!</h1>');
    });

{% endhighlight %}

This script will create Express application running over HTTPs.  
Run the application:

{% highlight bash %}
    $ node index.js
{% endhighlight %}

Enter the passphrase you entered during the creation of the certificate&#8230;

Now open your browser: <https://localhost:55555/>.  
After trusting the certificate you&#8217;d be done!

<img src="http://blog.mgechev.com/wp-content/uploads/2014/02/Screen-Shot-2014-02-19-at-10.14.40.png" alt="Https with Express" width="558" height="465" class="aligncenter size-full wp-image-676" />