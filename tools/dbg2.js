const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
let p=await (await b.newContext({viewport:{width:1366,height:768}})).newPage();
await p.goto('http://localhost:8080/?tier=lite');await p.waitForTimeout(800);
await p.click('.nav__links a[href="#about"]');await p.waitForTimeout(1500);
await p.click('.nav__links a[href="#faq"]');
for(const t of [500,1000,1500,2500]){await p.waitForTimeout(t===500?500:500);console.log(t,await p.evaluate(()=>[Math.round(document.getElementById('faq').getBoundingClientRect().top),scrollY,document.documentElement.scrollHeight]));}
// FAQ space
await p.evaluate(()=>document.getElementById('faq').scrollIntoView());
await p.focus('.faq__item:nth-child(2) summary');await p.keyboard.press('Enter');await p.waitForTimeout(700);
console.log('after enter',await p.$eval('.faq__item:nth-child(2)',e=>e.open));
await p.keyboard.press('Space');await p.waitForTimeout(700);
console.log('after space',await p.$eval('.faq__item:nth-child(2)',e=>e.open));
// menu
const m=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
await m.goto('http://localhost:8080/?tier=lite');await m.waitForTimeout(600);
await m.tap('#burger');await m.waitForTimeout(900);await m.tap('#mobileMenu a[href="#pricing"]');await m.waitForTimeout(1800);
console.log('menu',await m.evaluate(()=>[document.getElementById('mobileMenu').hidden,Math.round(document.getElementById('pricing').getBoundingClientRect().top),scrollY]));
await b.close()})()
