// Extra runs: 4x CPU, Slow 4G, 200% zoom (halved CSS width), forced dark, landscape phone, JS off
const { chromium } = require('playwright');
const logsOf = p => { const l = []; p.on('console', m => { if (['error', 'warning'].includes(m.type())) l.push(m.text()); }); p.on('pageerror', e => l.push(e.message)); return l; };
(async () => {
  const b = await chromium.launch();
  const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, desk = { viewport: { width: 1366, height: 768 } };
  // 1. 4x CPU + Slow 4G
  for (const [label, o] of [['phone', phone], ['desktop', desk]]) {
    const ctx = await b.newContext(o); const p = await ctx.newPage(); const logs = logsOf(p);
    const c = await ctx.newCDPSession(p);
    await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await c.send('Network.enable'); await c.send('Network.emulateNetworkConditions', { offline: false, latency: 562, downloadThroughput: 1.6 * 1024 * 1024 / 8 * .9, uploadThroughput: 750 * 1024 / 8 * .9 });
    const t0 = Date.now();
    await p.goto('http://localhost:8080/', { waitUntil: 'commit' });
    await p.waitForSelector('h1', { timeout: 60000 }); const tText = Date.now() - t0;
    await p.waitForLoadState('load', { timeout: 90000 }); const tLoad = Date.now() - t0;
    await p.waitForTimeout(3500);
    const st = await p.evaluate(() => ({ tier: document.documentElement.getAttribute('data-tier'), pre: !!document.getElementById('preloader'), h1op: getComputedStyle(document.querySelector('.hero__line1')).opacity }));
    await p.screenshot({ path: `shots/ex-slow-${label}.png` });
    // buttons usable
    const href = await p.getAttribute('a[data-wa]', 'href');
    console.log(`4xCPU+Slow4G ${label}: h1 in DOM ${tText}ms, load ${tLoad}ms, tier=${st.tier}, preloader=${st.pre}, logs=${logs.length}, wa href ok=${/wa\.me\/918249641675/.test(href)}`);
    await ctx.close();
  }
  // 2. 200% zoom
  for (const [label, w, h] of [['phone', 195, 422], ['desktop', 683, 384], ['phone-land', 334, 195]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < 400, hasTouch: w < 400 }); const p = await ctx.newPage(); const logs = logsOf(p);
    await p.goto('http://localhost:8080/?tier=full'); await p.waitForTimeout(2800);
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 300) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(40); }
    const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);
    await p.screenshot({ path: `shots/ex-zoom200-${label}.png` });
    await p.evaluate(() => document.getElementById('pricing').scrollIntoView()); await p.waitForTimeout(1500); await p.screenshot({ path: `shots/ex-zoom200-${label}-pricing.png` });
    console.log(`200% zoom ${label} (${w}x${h} css px): overflowX=${over}, logs=${logs.length}`);
    await ctx.close();
  }
  // 3. forced dark (Chromium force-dark simulates Android "force dark")
  const bd = await chromium.launch({ args: ['--enable-features=WebContentsForceDark', '--force-dark-mode'] });
  for (const [label, o] of [['phone', phone], ['desktop', desk]]) {
    const ctx = await bd.newContext(Object.assign({ colorScheme: 'dark' }, o)); const p = await ctx.newPage();
    await p.goto('http://localhost:8080/?tier=lite'); await p.waitForTimeout(1500);
    await p.evaluate(() => document.getElementById('why').scrollIntoView()); await p.waitForTimeout(1500);
    const bg = await p.evaluate(() => getComputedStyle(document.getElementById('why')).backgroundColor + ' / body ' + getComputedStyle(document.body).backgroundColor + ' / scheme ' + getComputedStyle(document.documentElement).colorScheme);
    await p.screenshot({ path: `shots/ex-dark-${label}.png` });
    console.log('forced dark', label, bg);
    await ctx.close();
  }
  await bd.close();
  await b.close();
})();
