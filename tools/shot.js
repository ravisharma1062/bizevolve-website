// usage: node shot.js <out-name> <width> <height> [--full] [--nocss] [--sel=#id] [--engine=chromium|webkit|firefox] [--query=?tier=lite]
const { chromium, webkit, firefox } = require('playwright');
(async () => {
  const [name, w, h] = process.argv.slice(2, 5);
  const a = process.argv.slice(5);
  const opt = k => (a.find(x => x.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=');
  const eng = { chromium, webkit, firefox }[opt('engine') || 'chromium'];
  const b = await eng.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, hasTouch: a.includes('--touch'), isMobile: a.includes('--mobile') });
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => logs.push('pageerror: ' + e.message));
  if (a.includes('--nocss')) await p.route('**/*.css', r => r.abort());
  await p.goto('http://localhost:8080/' + (opt('query') || ''), { waitUntil: 'load' });
  await p.waitForTimeout(+(opt('wait') || 800));
  if (opt('sel')) { const el = await p.$(opt('sel')); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(+(opt('wait2') || 1200)); await el.screenshot({ path: `shots/${name}.png` }); }
  else await p.screenshot({ path: `shots/${name}.png`, fullPage: a.includes('--full') });
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log('overflowX:', overflow); logs.forEach(l => console.log(l));
  await b.close();
})();
