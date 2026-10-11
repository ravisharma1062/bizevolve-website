const { chromium } = require('playwright');
(async () => {
  const lighthouse = (await import('lighthouse')).default;
  const b = await chromium.launch({ args: ['--remote-debugging-port=9333'] });
  const p = await b.newPage(); await p.goto('about:blank');
  for (const [name, flags] of [['desktop', { formFactor: 'desktop', screenEmulation: { disabled: true } }], ['mobile', {}]]) {
    const cfg = name === 'desktop' ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttlingMethod: 'provided' } } : { extends: 'lighthouse:default', settings: { throttlingMethod: 'provided' } };
    const r = await lighthouse('http://localhost:8080/?tier=lite', { port: 9333, output: 'json', onlyCategories: ['accessibility', 'seo', 'best-practices'], logLevel: 'error' }, cfg);
    const l = r.lhr;
    console.log(name, Object.values(l.categories).map(c => c.id + ':' + Math.round(c.score * 100)).join(' '));
    Object.values(l.audits).filter(a => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'manual' && a.scoreDisplayMode !== 'notApplicable').forEach(a => console.log('   -', a.id, '|', a.title, '|', ((a.details && a.details.items) || []).slice(0, 4).map(i => (i.node && (i.node.snippet || '').slice(0, 90)) || i.url || '').join(' ; ')));
  }
  await b.close();
})();
