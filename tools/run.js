// usage: node run.js  -> loads page in chromium, scrolls whole page, prints console errors, takes section shots
const { chromium } = require('playwright');
(async () => {
  const w = +process.argv[2] || 1440, h = +process.argv[3] || 900, tag = process.argv[4] || 'd';
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700 });
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => logs.push('pageerror: ' + e.message));
  await p.goto('http://localhost:8080/'+(process.argv[5]||'?tier=full'), { waitUntil: 'load' });
  await p.waitForTimeout(2800);
  console.log('tier:', await p.evaluate(() => document.documentElement.getAttribute('data-tier')), 'preloader:', await p.evaluate(() => !!document.getElementById('preloader')));
  await p.screenshot({ path: `shots/${tag}-hero.png` });
  const ids = ['why', 'services', 'samples', 'pricing', 'how', 'about', 'reviews', 'faq', 'contact'];
  for (const id of ids) {
    await p.evaluate(i => { const e = document.getElementById(i); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 40); }, id);
    await p.waitForTimeout(1800);
    await p.screenshot({ path: `shots/${tag}-${id}.png` });
  }
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(1200);
  await p.screenshot({ path: `shots/${tag}-footer.png` });
  console.log('overflowX:', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  logs.forEach(l => console.log(l));
  await b.close();
})();
