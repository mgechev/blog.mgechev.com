"use strict";(()=>{var m=Object.defineProperty;var G=Object.getOwnPropertyDescriptor;var L=Object.getOwnPropertyNames;var M=Object.prototype.hasOwnProperty;var u=(e,n)=>()=>(e&&(n=e(e=0)),n);var D=(e,n)=>()=>(n||e((n={exports:{}}).exports,n),n.exports),H=(e,n)=>{for(var t in n)m(e,t,{get:n[t],enumerable:!0})},q=(e,n,t,r)=>{if(n&&typeof n=="object"||typeof n=="function")for(let o of L(n))!M.call(e,o)&&o!==t&&m(e,o,{get:()=>n[o],enumerable:!(r=G(n,o))||r.enumerable});return e};var z=e=>q(m({},"__esModule",{value:!0}),e);function h(e){let n=new Set,t=()=>{let o=p[p.length-1];return o&&(n.add(o),o.dependencies.add(n)),e},r=o=>{e=o;for(let i of[...n])i.execute()};return t.set=r,t}function K(e){for(let n of e.dependencies)n.delete(e);e.dependencies.clear()}function d(e){let n=()=>{K(t),p.push(t);try{e()}finally{p.pop()}},t={execute:n,dependencies:new Set};n()}var p,x=u(()=>{p=[]});var v,S,E,T=u(()=>{v=e=>typeof e=="function",S=e=>e.condition!==void 0,E=e=>e.collection!==void 0});var s,j,O,P,X,g,k=u(()=>{x();T();s=(e,n)=>{if(S(e))return O(e,n);if(E(e))return P(e,n);if(e instanceof Array){let t=[];for(let r of e)t.push(s(r,n));return t}if(typeof e=="string"){let t=document.createTextNode(e);return n.append(t),t}return typeof e=="function"?j(e,n):X(e,n)},j=(e,n)=>{let t=document.createTextNode(e());return d(()=>{let r=e();t.textContent=r}),n.append(t),t},O=(e,n)=>{let t;return d(()=>{let r=e.condition();t&&g(t),r?t=s(e.then,n):e.else&&(t=s(e.else,n))}),t??[]},P=(e,n)=>{let t,r;return d(()=>{t=e.collection(),r&&g(r),r=s(t.map(e.items),n)}),r??[]},X=(e,n)=>{let t=document.createElement(e.name);for(let r in e.attributes){let o=e.attributes[r];if(!v(o)){t.setAttribute(r,o);continue}d(()=>{let i=o();if(i===!1){t.removeAttribute(r);return}t.setAttribute(r,i)})}for(let r in e.events)t.addEventListener(r,e.events[r]);return t.view=e,n.append(t),e.children&&s(e.children,t),e.ref&&e.ref(t),t},g=e=>{if(e instanceof Array)for(let n of e)g(n);else{e.parentElement?.removeChild(e);let n=e?.view;if(!n)return;for(let t in n.events)e.removeEventListener(t,n.events[t])}}});var N={};H(N,{effect:()=>d,render:()=>s,signal:()=>h});var A=u(()=>{x();k()});var U=D(c=>{var J=c&&c.__read||function(e,n){var t=typeof Symbol=="function"&&e[Symbol.iterator];if(!t)return e;var r=t.call(e),o,i=[],f;try{for(;(n===void 0||n-- >0)&&!(o=r.next()).done;)i.push(o.value)}catch(y){f={error:y}}finally{try{o&&!o.done&&(t=r.return)&&t.call(r)}finally{if(f)throw f.error}}return i},C=c&&c.__spreadArray||function(e,n,t){if(t||arguments.length===2)for(var r=0,o=n.length,i;r<o;r++)(i||!(r in n))&&(i||(i=Array.prototype.slice.call(n,0,r)),i[r]=n[r]);return e.concat(i||Array.prototype.slice.call(n))};Object.defineProperty(c,"__esModule",{value:!0});var R=(A(),z(N)),Q=function(){var e=(0,R.signal)([{label:"Buy milk",done:!1},{label:"Get oatmeal",done:!1}]),n,t=function(){!n||!n.value.trim()||(e.set(C(C([],J(e()),!1),[{label:n.value.trim(),done:!1}],!1)),n.value="",r())},r=function(){var a=e().sort(function(l,b){return l.done===b.done?0:l.done?1:-1});e.set(a)},o=`
    max-width: 600px;
    font-family: Arial, sans-serif;
    width: 400px;
    margin: 30px auto;
    background-color: #f8f8f8;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  `,i=`
    text-align: center;
    color: #333;
    margin-bottom: 20px;
    font-family: Roboto;
  `,f=`
    display: flex;
    margin-bottom: 20px;
  `,y=`
    flex-grow: 1;
    padding: 10px;
    margin-right: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
  `,V=`
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  `,_=`
    padding: 0;
  `,W=`
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    background-color: white;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  `,w=`
    margin-right: 10px;
  `,B=function(a){return`
    flex-grow: 1;
    text-decoration: `.concat(a?"line-through":"none",`;
    color: `).concat(a?"#999":"#333",`;
  `)},I=`
    margin-left: 10px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
  `,F=`
    width: 100%;
  `;return[{name:"div",attributes:{style:o},children:[{name:"h1",children:"Grocery list",attributes:{style:i}},{name:"div",attributes:{style:f},children:[{name:"input",attributes:{style:y,type:"text",placeholder:"Add a todo..."},ref:function(a){n=a},events:{keydown:function(a){var l=a;l.code==="Enter"&&t()}}},{name:"button",children:"Add",attributes:{style:V},events:{click:t}}]},{name:"ul",attributes:{style:_},children:{collection:e,items:function(a){return{name:"li",attributes:{style:W},children:[{name:"label",attributes:{style:F},children:[{name:"input",attributes:{style:w,type:"checkbox",checked:function(){return a.done?"checked":!1}},events:{change:function(l){var b=l.target;a.done=b.checked,r()}}},{name:"span",children:a.label,attributes:{style:B(a.done)}}]},{name:"button",attributes:{style:I},events:{click:function(){e.set(e().filter(function(l){return l.label!==a.label}))}},children:"X"}]}}}}]}]};(0,R.render)(Q(),document.querySelector("#app-demo"))});U();})();
