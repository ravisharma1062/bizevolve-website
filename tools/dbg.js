const {chromium}=require('playwright');
const desc=e=>e.tagName+'.'+(e.className&&e.className.baseVal===undefined?e.className:'')+' '+(e.textContent||'').trim().slice(0,30);
(async()=>{const b=await chromium.launch();
for (const [label,opts,url] of [['lite',{},'?tier=lite']]){
 const p=await (await b.newContext(Object.assign({viewport:{width:1366,height:768}},opts))).newPage();
 await p.goto('http://localhost:8080/'+url);await p.waitForTimeout(2800);
 if(label!=='nojs'){const h=await p.evaluate(()=>document.documentElement.scrollHeight);for(let y=0;y<h;y+=500){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(90)}await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(1500);}
 const r=await p.evaluate(()=>Array.from(document.querySelectorAll('main *')).filter(e=>getComputedStyle(e).opacity==='0'&&e.offsetWidth>0&&!e.closest('.hero__canvas,.glare,.shape')).map(e=>e.tagName+'.'+String(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className)+' | '+(e.textContent||'').trim().slice(0,25)));
 console.log(label,r.length,r.slice(0,8));
}
await b.close()})()
