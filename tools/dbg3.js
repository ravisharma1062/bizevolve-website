const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(let i=0;i<5;i++){
const ctx=await b.newContext({viewport:{width:1366,height:768}});const p=await ctx.newPage();
await p.goto('http://localhost:8080/?tier=lite');await p.waitForTimeout(600);
await p.evaluate(()=>document.getElementById('contact').scrollIntoView());
await p.click('#formSubmit');await p.waitForTimeout(300);
await p.fill('#f-name','Test User');await p.selectOption('#f-type','Salon');await p.fill('#f-phone','12345');
await p.click('#formSubmit');await p.waitForTimeout(200);
await p.fill('#f-phone','98765 43210');await p.selectOption('#f-plan','Standard');await p.fill('#f-msg','Need a site & a map');
const popup=ctx.waitForEvent('page',{timeout:5000}).catch(()=>null);
await p.click('#formSubmit');
const pop=await popup;
let url=pop?pop.url():'';
if(pop){for(let k=0;k<20&&url==='about:blank';k++){await p.waitForTimeout(150);url=pop.url();}}
await p.waitForTimeout(300);
console.log(i,'popup',!!pop,url.slice(0,60),'done',await p.$eval('#formSubmit',e=>e.className),'errs',await p.$$eval('.field__err',e=>e.map(x=>x.textContent)));
await ctx.close();}
await b.close()})()
