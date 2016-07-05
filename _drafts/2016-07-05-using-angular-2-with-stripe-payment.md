---
title: Using Angular 2 with Stripe
author: minko_gechev
layout: post
categories:
  - JavaScript
  - Angular 2
tags:
  - stripe
  - JavaScript
  - Angular 2
---

Stripe offer a set of APIs which allow businesses and individuals to easily accept and manage payments online. In a typical scenario you want your users to pay for a service that you're offering using Stripe as a mediator.

On the other hand, Angular 2 is gathering more and more popularity. A lot of developers are including the framework as part of their production applications.

In this blog post we will briefly describe what problems you may face using the Stripe APIs with Angular 2 and how you can solve them.

So lets begin!

## Sample Application

[---] GIF

This app is based on the [angular2-seed](https://github.com/mgechev/angular2-seed) project. The complete demo is [located here](https://github.com/mgechev/angular2-stripe-demo).

Above you can see two views:

- Default Stripe Form.
- Custom Stripe Form.

The first one demonstrates the default Stripe checkout mechanism and the second one gets the token for the entered credit card by using a custom form.

## Stripe Integration

The first step of the integration is to add the following script in your `index.html` file:

```html
<script type="text/javascript" src="https://js.stripe.com/v2/"></script>
```

Right after that you need to set your Stripe public key:

```html
<script type="text/javascript">
  Stripe.setPublishableKey('pk_test_oi0sKPJYLGjdvOXOM8tE8cMa');
</script>
```

### Custom Stripe Form

As next step lets take a look at the custom Stripe form. It is encapsulated in the `CustomFormComponent`:

```javascript
import { Component } from '@angular/core';
import { REACTIVE_FORM_DIRECTIVES } from '@angular/forms';

@Component({
  moduleId: module.id,
  selector: 'sd-custom-form',
  templateUrl: 'custom-form.component.html',
  styleUrls: ['custom-form.component.css'],
  directives: [REACTIVE_FORM_DIRECTIVES]
})
export class CustomFormComponent {...}
```

...with the following template:

```html
<h1>Custom Stripe Form</h1>

<form action="" method="POST" id="payment-form" (submit)="getToken()">
  <span class="payment-message">{{message}}</span>

  <div class="form-row">
    <label>
      <span>Card Number</span>
      <input [(ngModel)]="cardNumber" name="card-number" type="text" size="20" data-stripe="number">
    </label>
  </div>

  <div class="form-row">
    <label>
      <span>Expiration (MM/YY)</span>
      <input [(ngModel)]="expiryMonth" name="expiry-month" type="text" size="2" data-stripe="exp_month">
    </label>
    <span> / </span>
    <input [(ngModel)]="expiryYear" name="expiry-year" type="text" size="2" data-stripe="exp_year">
  </div>

  <div class="form-row">
    <label>
      <span>CVC</span>
      <input [(ngModel)]="cvc" name="cvc" type="text" size="4" data-stripe="cvc">
    </label>
  </div>

  <input type="submit" value="Submit Payment">
</form>

```

Notice that in our form we bind to the properties `cardNumber`, `expiryMonth`, `expiryYear`, `cvc`. Once the user fills the form, she can click on the `Submit Payment` button and the method `getToken()` will be invoked. Note that in order to use `[(ngModel)]` each input should have a name.

As next step, lets take a look at the `CustomFormComponent` class. The most straightforward implementation looks like:

```javascript
import { Component } from '@angular/core';
import { REACTIVE_FORM_DIRECTIVES } from '@angular/forms';

@Component({
  moduleId: module.id,
  selector: 'sd-custom-form',
  templateUrl: 'custom-form.component.html',
  styleUrls: ['custom-form.component.css'],
  directives: [REACTIVE_FORM_DIRECTIVES]
})
export class CustomFormComponent {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;

  message: string;

  getToken() {
    this.message = 'Loading...';

    (<any>window).Stripe.card.createToken({
      number: this.cardNumber,
      exp_month: this.expiryMonth,
      exp_year: this.expiryYear,
      cvc: this.cvc
    }, (status: number, response: any) => {
      if (status === 200) {
        this.message = `Success! Card token ${response.card.id}.`;
      } else {
        this.message = response.error.message;
      }
    });
  }
}
```

![](/images/stripe/stripe-bug.gif)

As can be seen from the video above, the form behaves weirdly. Once we submit the credit card only the `Loading...` label shows and after that we need to change value in the form in order to see the response gotten from Stripe, once the request completes.

What actually happens is that:

- We send request to Stripe and respectively update the `message` to value `Loading...`.
- The request gets processed and we receive a response.
- Once we change an input value, we trigger the change detection mechanism which renders the response on the screen.

But why the change detection doesn't get triggered after we get the response?

#### In the Zones...

The Angular Zones are monkey patching (almost) all asynchronous APIs, intercepting them and triggering the change detection on some special events. Zones take care of `XMLHttpRequests`, `fetch`, `setTimeout`, etc. but Stripe uses hidden `iframe` for establishing requests to its API:

![](images/stripe/stripe-hidden-iframe.png)

In order to workaround this issue, we need to run the callback in the context of the Angular Zone (or `NgZone`). In order to do this we need to inject `NgZone` in the `CustomFormComponent` and slightly change `getToken`:


```javascript
@Component(...)
export class CustomFormComponent {

  // Same properties declaration

  constructor(private _zone: NgZone) {}

  getToken() {
    this.message = 'Loading...';

    (<any>window).Stripe.card.createToken({
      number: this.cardNumber,
      exp_month: this.expiryMonth,
      exp_year: this.expiryYear,
      cvc: this.cvc
    }, (status: number, response: any) => {

      // Wrapping inside the Angular zone
      this._zone.run(() => {
        if (status === 200) {
          this.message = `Success! Card token ${response.card.id}.`;
        } else {
          this.message = response.error.message;
        }
      });
    });
  }
}

```

## Conclusion

In this short blog post we described how we can easily use Stripe with Angular 2. We went through the default Stripe checkout and building a custom form.

The biggest challenge in the default checkout was the injection of "unsafe" content. Which we solved.......

With the custom form we faced another issue related to not triggered Angular 2 change detection when performing an Ajax request using hidden `iframe`. The solution here was to wrap the Stripe response callback in `zone.run` call.


