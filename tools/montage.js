// node montage.js out.png file1 file2 ...   -> side-by-side contact sheet of screenshots in tools/shots
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, ...files] = process.argv.slice(2);
  const H = +(process.env.H || 700), W = +(process.env.W || 1900);
  const imgs = files.map(f => '<img src="http://localhost:8080/tools/shots/' + f + '" style="height:' + H + 'px">').join('');
  const html = '<body style="margin:0;background:#888;display:flex;gap:8px;align-items:flex-start;padding:8px">' + imgs + '</body>';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H + 16 } });
  require('fs').writeFileSync(path.resolve(__dirname, 'shots', 'montage.html'), html);
  await p.goto('http://localhost:8080/tools/shots/montage.html');
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.resolve(__dirname, 'shots', out), fullPage: true });
  await b.close();
})();
