// Device matrix (Section 13). Usage: node matrix.js [filter]
const { chromium, webkit, firefox } = require('playwright');
const engines = { chromium, webkit, firefox };
const M = [
  ['android-320', 'chromium', 320, 568, true], ['android-320-land', 'chromium', 568, 320, true],
  ['iphoneSE', 'webkit', 375, 667, true], ['iphoneSE-land', 'webkit', 667, 375, true],
  ['iphone14', 'webkit', 390, 844, true], ['iphone14-land', 'webkit', 844, 390, true],
  ['pixel5', 'chromium', 393, 851, true], ['pixel5-land', 'chromium', 851, 393, true],
  ['ipad', 'webkit', 810, 1080, true], ['ipad-land', 'webkit', 1080, 810, true],
  ['tablet', 'chromium', 800, 1280, true], ['tablet-land', 'chromium', 1280, 800, true],
  ['laptop-chromium', 'chromium', 1366, 768, false], ['laptop-firefox', 'firefox', 1366, 768, false], ['laptop-webkit', 'webkit', 1366, 768, false],
  ['desktop-1920', 'chromium', 1920, 1080, false], ['monitor-2560', 'chromium', 2560, 1440, false]
];
const filter = process.argv[2];
(async () => {
  const browsers = {};
  for (const [name, eng, w, h, mobile] of M) {
    if (filter && filter.indexOf('engine:') === 0 ? eng !== filter.slice(7) : (filter && name.indexOf(filter) < 0)) continue;
    browsers[eng] = browsers[eng] || await engines[eng].launch();
    const ctxOpts = { viewport: { width: w, height: h } };
    if (mobile && eng !== 'firefox') { ctxOpts.isMobile = true; ctxOpts.hasTouch = true; }
    const ctx = await browsers[eng].newContext(ctxOpts);
    const p = await ctx.newPage(); const logs = [];
    p.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(m.text()); });
    p.on('pageerror', e => logs.push('pageerror ' + e.message));
    p.setDefaultTimeout(60000); await p.goto('http://localhost:8080/?tier=full', { timeout: 60000 }); await p.waitForTimeout(2800);
    await p.screenshot({ path: `shots/mx-${name}-1hero.png` });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 400) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(70); }
    let i = 2;
    for (const id of ['samples', 'pricing', 'how', 'contact']) {
      await p.evaluate(i => { const e = document.getElementById(i); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 20); }, id);
      await p.waitForTimeout(1500);
      await p.screenshot({ path: `shots/mx-${name}-${i++}${id}.png` });
    }
    const r = await p.evaluate(() => {
      const de = document.documentElement, vw = de.clientWidth;
      const over = de.scrollWidth - vw;
      const offenders = Array.from(document.querySelectorAll('body *')).filter(e => {
        if (e.closest('.marquee,.samples__viewport,.orbit,.shapes,.scene,.sprite,.menu,.modal,.footer__giant,.hero__aurora,.first-story__glow,.confetti,.cursor,.cursor-ring,.preloader,.bg-glow,.fab__tip,.skip-link,.hero__canvas')) return false;
        const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > vw + 1 || b.left < -1);
      }).slice(0, 5).map(e => e.tagName + '.' + (e.className && e.className.baseVal === undefined ? e.className : '') + ' ' + Math.round(e.getBoundingClientRect().left) + '..' + Math.round(e.getBoundingClientRect().right));
      const small = Array.from(document.querySelectorAll('a[href],button,summary,input,select,textarea')).filter(e => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && cs.visibility !== 'hidden' && (b.height < 43.5 || b.width < 43.5) && !e.closest('.menu,.modal,.skip-link'); }).slice(0, 6).map(e => (e.getAttribute('href') || e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
      return { over, offenders, small, tier: de.getAttribute('data-tier') };
    });
    console.log(name.padEnd(18), 'tier', r.tier, '| overflowX', r.over, '| logs', logs.length, '| offenders', JSON.stringify(r.offenders), '| small targets', JSON.stringify(r.small));
    logs.slice(0, 3).forEach(l => console.log('    log:', l));
    await ctx.close();
  }
  for (const b of Object.values(browsers)) await b.close();
})();
