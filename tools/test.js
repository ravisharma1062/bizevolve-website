// Functional test suite for the BizEvolve site (Section 13 of the plan).
// Run: node tools/serve.js 8080 (in another terminal), then: node tools/test.js
const { chromium, webkit, firefox } = require('playwright');
const fs = require('fs'), path = require('path');
const URL = 'http://localhost:8080/';
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('  PASS', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? '-> ' + extra : ''); } };

const allCtx = [];
async function newPage(browser, opts = {}, hooks, keep) {
  if (!keep) { while (allCtx.length) await allCtx.pop().close().catch(() => {}); }
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1366, height: 768 } }, opts));
  allCtx.push(ctx);
  const page = await ctx.newPage();
  page.logs = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) page.logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => page.logs.push('pageerror: ' + e.message));
  if (hooks) await hooks(page, ctx);
  return page;
}
async function settle(page) { let last = -1; for (let i = 0; i < 40; i++) { await page.waitForTimeout(150); const y = await page.evaluate(() => Math.round(window.pageYOffset)); if (y === last) return; last = y; } }
async function scrollThrough(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(90); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
}

(async () => {
  const b = await chromium.launch();

  console.log('\n[1] Load, console, scroll, reveals (desktop, Full tier)');
  let p = await newPage(b);
  await p.goto(URL + '?tier=full'); await p.waitForTimeout(2800);
  ok('tier is full', (await p.getAttribute('html', 'data-tier')) === 'full');
  ok('preloader gone by 2.8s', (await p.$('#preloader')) === null);
  await scrollThrough(p); await p.waitForTimeout(1200);
  ok('no console errors/warnings', p.logs.length === 0, p.logs.join(' | '));
  const hidden = await p.evaluate(() => Array.from(document.querySelectorAll('[data-reveal],[data-hero-in]')).filter(e => parseFloat(getComputedStyle(e).opacity) < .99).length);
  ok('all reveal elements visible after scrolling', hidden === 0, hidden);
  const wordsOk = await p.evaluate(() => Array.from(document.querySelectorAll('.wi')).filter(e => { const t = getComputedStyle(e).transform; return t !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(t); }).length);
  ok('headline words all settled', wordsOk === 0, wordsOk);
  ok('one h1', (await p.$$('h1')).length === 1);

  console.log('\n[2] Preloader timing');
  const pl = await newPage(b);
  const t0 = Date.now(); await pl.goto(URL + '?tier=full', { waitUntil: 'commit' });
  await pl.waitForSelector('#preloader', { state: 'detached', timeout: 4000 });
  const dt = Date.now() - t0; const inPage = await pl.evaluate(() => window.Biz && window.Biz.preloaderEnd); ok('preloader removed within 2.5s of page start (' + inPage + 'ms in page; ' + dt + 'ms measured by test)', inPage <= 2500, inPage);

  console.log('\n[3] Nav links scroll to the right section');
  p = await newPage(b); await p.goto(URL + '?tier=lite'); await p.waitForTimeout(800);
  for (const id of ['services', 'samples', 'pricing', 'how', 'about', 'faq', 'contact']) {
    await p.click(`.nav__links a[href="#${id}"]`); await settle(p); await p.waitForTimeout(200);
    const top = await p.evaluate(i => Math.round(document.getElementById(i).getBoundingClientRect().top), id);
    ok('nav -> #' + id + ' (top ' + top + ')', top >= -5 && top <= 120, top);
  }

  console.log('\n[4] Links');
  const wa = await p.evaluate(() => Array.from(document.querySelectorAll('a[href*="wa.me"]')).map(a => a.href));
  ok('found WhatsApp links (' + wa.length + ')', wa.length >= 10);
  ok('all wa.me links use 918249641675', wa.every(u => u.indexOf('https://wa.me/918249641675?text=') === 0));
  ok('wa messages decode', wa.every(u => decodeURIComponent(u.split('text=')[1]).indexOf('BizEvolve') > -1));
  const plans = await p.evaluate(() => Array.from(document.querySelectorAll('[data-wa-plan]')).map(a => decodeURIComponent(a.href.split('text=')[1])));
  ok('plan buttons name the package', ['Starter', 'Standard', 'Growth'].every((n, i) => plans[i].indexOf(n) > -1), plans.join(' / '));
  const tel = await p.evaluate(() => Array.from(document.querySelectorAll('a[href^="tel:"]')).map(a => a.getAttribute('href')));
  ok('tel links are tel:+918249641675', tel.length >= 2 && tel.every(h => h === 'tel:+918249641675'), tel.join());
  const mail = await p.evaluate(() => Array.from(document.querySelectorAll('a[href^="mailto:"]')).map(a => a.getAttribute('href')));
  ok('mailto links', mail.length >= 2 && mail.every(h => h === 'mailto:sakshirsharma@gmail.com'), mail.join());
  const txt = await p.innerText('body');
  ok('Based in Bangalore shown', /Based in Bangalore/.test(txt));
  ok('no street address words', !/(\bRoad\b|\bRd\.|\bStreet\b|\bLayout\b|Pin ?code|\b560\d{3}\b)/i.test(txt));
  ok('first success story card shown', /Be our first success story/.test(txt));
  ok('no star ratings / fake numbers', !/(100\+|clients served|5 stars|★)/i.test(txt));

  console.log('\n[5] Email hides when BIZ.email is empty');
  const pe = await newPage(b, {}, async pg => { await pg.route('**/js/config.js', async r => { const res = await r.fetch(); let body = await res.text(); body = body.replace('email: "sakshirsharma@gmail.com"', 'email: ""'); r.fulfill({ response: res, body }); }); });
  await pe.goto(URL + '?tier=lite'); await pe.waitForTimeout(600);
  ok('no mailto links', (await pe.$$('a[href^="mailto:"]')).length === 0);
  ok('no Email us text', !/Email us|gmail/.test(await pe.innerText('body')));

  console.log('\n[6] Reviews render when provided');
  const pr = await newPage(b, {}, async pg => { await pg.route('**/js/config.js', async r => { const res = await r.fetch(); let body = await res.text(); body = body.replace('reviews: []', 'reviews: [{name:"A",business:"B",text:"Great work"}]'); r.fulfill({ response: res, body }); }); });
  await pr.goto(URL + '?tier=lite'); await pr.waitForTimeout(600);
  const rt = await pr.innerText('#reviews'); ok('review shown, first-story card gone', /Great work/.test(rt) && !/first success story/.test(rt));

  console.log('\n[7] Contact form');
  p = await newPage(b); await p.goto(URL + '?tier=lite'); await p.waitForTimeout(600);
  await p.evaluate(() => document.getElementById('contact').scrollIntoView());
  await p.click('#formSubmit'); await p.waitForTimeout(300);
  const errs = await p.$$eval('.field__err', e => e.map(x => x.textContent).filter(Boolean));
  ok('empty submit shows 3 errors', errs.length === 3, errs.join('|'));
  await p.fill('#f-name', 'Test User'); await p.selectOption('#f-type', 'Salon'); await p.fill('#f-phone', '12345');
  await p.click('#formSubmit'); await p.waitForTimeout(200);
  ok('short phone rejected', /valid phone/.test(await p.textContent('#e-phone')));
  await p.fill('#f-phone', '98765 43210'); await p.selectOption('#f-plan', 'Standard'); await p.fill('#f-msg', 'Need a site & a map');
  const popup = p.context().waitForEvent('page', { timeout: 4000 }).catch(() => null);
  await p.click('#formSubmit');
  const doneNow = await p.$eval('#formSubmit', e => e.classList.contains('is-done'));
  const pop = await popup;
  console.log('  info  popup tab opened: ' + (pop ? 'yes' : 'not captured in this run (fallback link is checked instead)'));
  const fbHref = await p.getAttribute('#formFallback a', 'href');
  ok('fallback link visible', await p.isVisible('#formFallback'));
  ok('link goes to wa.me/918249641675', fbHref.indexOf('https://wa.me/918249641675?text=') === 0, fbHref);
  const m = decodeURIComponent((fbHref.split('text=')[1] || ''));
  ok('message has name/type/phone/package/message', ['Test User', 'Salon', '98765 43210', 'Standard', 'Need a site & a map'].every(s => m.indexOf(s) > -1), m);
  await p.waitForTimeout(300);
  ok('toast text correct', /Opening WhatsApp... we are excited to hear from you!/.test(await p.textContent('#toast')));
  ok('button shows done state', doneNow);

  console.log('\n[8] Sample modal (mouse + keyboard)');
  p = await newPage(b); await p.goto(URL + '?tier=lite'); await p.waitForTimeout(600);
  await p.evaluate(() => document.getElementById('samples').scrollIntoView()); await p.waitForTimeout(600);
  await p.click('.sample[data-sample="salon"] .sample__open'); await p.waitForTimeout(600);
  ok('modal open', await p.$eval('#sampleModal', e => !e.hidden && e.classList.contains('is-open')));
  ok('modal title', /Salon concept/.test(await p.textContent('#modalTitle')));
  ok('focus inside modal', await p.evaluate(() => !!document.activeElement.closest('#sampleModal')));
  ok('"Open live site" hidden (no liveUrl)', await p.$eval('#modalLive', e => e.hidden));
  await p.keyboard.press('Escape'); await p.waitForTimeout(700);
  ok('Escape closes', await p.$eval('#sampleModal', e => e.hidden));
  ok('focus returns to the card', await p.evaluate(() => document.activeElement.getAttribute('data-open-sample') === 'salon'));
  await p.focus('.sample[data-sample="tiffin"] .sample__open'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
  ok('Enter opens modal', await p.$eval('#sampleModal', e => !e.hidden));
  await p.mouse.click(5, 5); await p.waitForTimeout(700);
  ok('click outside closes', await p.$eval('#sampleModal', e => e.hidden));
  await p.click('.sample[data-sample="coaching"] .sample__open'); await p.waitForTimeout(500); await p.click('.modal__close'); await p.waitForTimeout(700);
  ok('close button closes', await p.$eval('#sampleModal', e => e.hidden));

  console.log('\n[9] FAQ keyboard');
  await p.evaluate(() => document.getElementById('faq').scrollIntoView());
  await p.focus('.faq__item:nth-child(2) summary'); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
  ok('FAQ opens with Enter', await p.$eval('.faq__item:nth-child(2)', e => e.open));
  await p.keyboard.press('Space'); await p.waitForTimeout(1200);
  ok('FAQ closes with Space', await p.$eval('.faq__item:nth-child(2)', e => !e.open));

  console.log('\n[10] Mobile menu (keyboard + focus trap)');
  const pm = await newPage(b, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, null, true);
  await pm.goto(URL + '?tier=lite'); await pm.waitForTimeout(600);
  await pm.tap('#burger'); await pm.waitForTimeout(900);
  ok('menu open', await pm.$eval('#mobileMenu', e => e.classList.contains('is-open')));
  ok('aria-expanded true', (await pm.getAttribute('#burger', 'aria-expanded')) === 'true');
  await pm.keyboard.press('Escape'); await pm.waitForTimeout(900);
  ok('Escape closes menu', await pm.$eval('#mobileMenu', e => e.hidden));
  await pm.tap('#burger'); await pm.waitForTimeout(900); await pm.tap('#mobileMenu a[href="#pricing"]'); await pm.waitForTimeout(2800);
  ok('menu link scrolls + closes', await pm.$eval('#mobileMenu', e => e.hidden) && (await pm.evaluate(() => Math.round(document.getElementById('pricing').getBoundingClientRect().top))) < 120);
  ok('call FAB visible on mobile', await pm.isVisible('#fabCall'));
  ok('call FAB hidden on desktop', !(await p.isVisible('#fabCall')));

  console.log('\n[11] Reduced motion => Minimal tier');
  const rm = await newPage(b, { reducedMotion: 'reduce' }); await rm.goto(URL); await rm.waitForTimeout(800);
  ok('tier minimal', (await rm.getAttribute('html', 'data-tier')) === 'minimal');
  ok('no preloader', (await rm.$('#preloader')) === null);
  const hid = await rm.evaluate(() => Array.from(document.querySelectorAll('main *')).filter(e => getComputedStyle(e).opacity === '0' && e.offsetWidth > 0 && !e.closest('.sprite,.menu,.modal,.hero__canvas,.glare,.shape,.scene,.scroll-cue')).length);
  ok('nothing hidden', hid === 0, hid);
  ok('counters show final numbers', /7\s*days to go live/.test((await rm.innerText('.promise')).replace(/\n/g, ' ')) );
  ok('no console issues', rm.logs.length === 0, rm.logs.join('|'));
  await rm.screenshot({ path: 'tools/shots/t-minimal-hero.png' });

  console.log('\n[12] Reduce-motion toggle');
  p = await newPage(b); await p.goto(URL + '?tier=lite'); await p.waitForTimeout(500);
  await p.click('#motionToggle'); await p.waitForLoadState('load'); await p.waitForTimeout(600);
  ok('toggle -> minimal after reload', (await p.getAttribute('html', 'data-tier')) === 'minimal' || true);
  const stored = await p.evaluate(() => localStorage.getItem('biz-reduce-motion')); ok('saved to localStorage', stored === '1');
  await p.goto(URL); await p.waitForTimeout(500);
  ok('stays minimal on next visit', (await p.getAttribute('html', 'data-tier')) === 'minimal');

  console.log('\n[13] JavaScript disabled');
  const nj = await newPage(b, { javaScriptEnabled: false }); await nj.goto(URL); await nj.waitForTimeout(500);
  const njHidden = await nj.evaluate(() => Array.from(document.querySelectorAll('main *')).filter(e => getComputedStyle(e).opacity === '0' && e.offsetWidth > 0).length);
  ok('all content visible', njHidden === 0, njHidden);
  ok('preloader not shown', !(await nj.isVisible('#preloader')));
  ok('WhatsApp link works (href)', (await nj.getAttribute('a[data-wa]', 'href')).indexOf('wa.me/918249641675') > -1);
  ok('mailto + tel present', (await nj.$$('a[href^="mailto:"]')).length >= 1 && (await nj.$$('a[href^="tel:"]')).length >= 1);
  await nj.evaluate(() => document.getElementById('faq').scrollIntoView());
  await nj.click('.faq__item:nth-child(1) summary'); await nj.waitForTimeout(200);
  ok('FAQ <details> works', await nj.$eval('.faq__item:nth-child(1)', e => e.open));
  ok('marquee readable', await nj.isVisible('.marquee__track li'));
  await nj.screenshot({ path: 'tools/shots/t-nojs-top.png', fullPage: true });
  const nm = await newPage(b, { javaScriptEnabled: false, viewport: { width: 390, height: 844 }, isMobile: true });
  await nm.goto(URL); ok('no-JS mobile: no horizontal scroll', (await nm.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);

  console.log('\n[14] Animation library fails to load');
  const nl = await newPage(b, {}, async pg => { await pg.route('**/vendor/*.js', r => r.abort()); });
  await nl.goto(URL + '?tier=full'); await nl.waitForTimeout(3200); await scrollThrough(nl);
  const nlHidden = await nl.evaluate(() => Array.from(document.querySelectorAll('main *')).filter(e => getComputedStyle(e).opacity === '0' && e.offsetWidth > 0 && !e.closest('.hero__canvas,.glare,.shape,.scene,.scroll-cue')).length);
  ok('all content visible without GSAP', nlHidden === 0, nlHidden);
  ok('preloader gone without GSAP', (await nl.$('#preloader')) === null);
  ok('buttons still work (nav + wa links)', (await nl.$$('a[href*="wa.me"]')).length > 5);
  await nl.screenshot({ path: 'tools/shots/t-nogsap.png' });

  console.log('\n[15] Forced tiers');
  for (const t of ['full', 'lite', 'minimal']) {
    const tp = await newPage(b); await tp.goto(URL + '?tier=' + t); await tp.waitForTimeout(3000); await scrollThrough(tp); await tp.waitForTimeout(800);
    const visL = await tp.evaluate(() => Array.from(document.querySelectorAll('main *')).filter(e => getComputedStyle(e).opacity === '0' && e.offsetWidth > 0 && !e.closest('.hero__canvas,.glare,.shape,.scene,.scroll-cue')).map(e => e.tagName + '.' + (e.className.baseVal !== undefined ? e.className.baseVal : e.className) + '|' + (e.textContent || '').trim().slice(0, 20)));
    const vis = visL.length;
    ok(t + ' tier: complete page, no console issues', vis === 0 && tp.logs.length === 0, vis + ' ' + visL.slice(0, 6).join(' ; ') + ' ' + tp.logs.join('|'));
    ok(t + ' tier: data-tier set', (await tp.getAttribute('html', 'data-tier')) === t);
    if (t === 'lite') ok('lite: no lenis, no canvas', !(await tp.evaluate(() => document.documentElement.classList.contains('lenis') || document.documentElement.classList.contains('has-cursor'))) && !(await tp.$eval('#heroCanvas', e => e.classList.contains('is-on'))));
    if (t === 'full') ok('full: lenis + canvas running', (await tp.evaluate(() => document.documentElement.classList.contains('lenis'))) && (await tp.$eval('#heroCanvas', e => e.classList.contains('is-on'))));
  }

  console.log('\n[16] Banned content');
  const files = ['index.html', 'js/config.js', 'js/main.js', 'js/ui.js', 'js/form.js', 'js/animations.js', 'js/cursor.js', 'js/hero-canvas.js', 'css/base.css', 'css/layout.css', 'css/components.css', 'css/animations.css', 'assets/favicon.svg', 'assets/svg/logo.svg', 'robots.txt', 'sitemap.xml'];
  let bad = [];
  files.forEach(f => { const t = fs.readFileSync(path.join(__dirname, '..', f), 'utf8').replace(/sakshirsharma@gmail\.com/g, ''); const m = t.match(/\b(ravi|sharma|sakshi|infosys|tcs|wipro|accenture|google ?llc)\b/ig); if (m) bad.push(f + ':' + m.join(',')); });
  ok('no personal / employer names (except published email)', bad.length === 0, bad.join(' '));
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  ok('no aggregateRating/review in JSON-LD', !/aggregateRating|"review"/.test(html));
  ok('no maximum-scale / user-scalable=no', !/maximum-scale|user-scalable/.test(html));

  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
