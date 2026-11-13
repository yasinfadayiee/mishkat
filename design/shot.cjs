const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const k of ['a','b','c']) {
    const p = await b.newPage({ viewport: { width: 900, height: 920 }, deviceScaleFactor: 2 });
    await p.goto('file://' + __dirname + `/mockups/dir-${k}.html`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.locator('body').screenshot({ path: __dirname + `/mockups/dir-${k}.png` });
  }
  await b.close();
})();
