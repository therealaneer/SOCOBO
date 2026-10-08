const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  let errs = 0; p.on('pageerror', e => { errs++; console.log('PAGEERR', e.message, e.stack.split('\n')[1]); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(700);
  for (const r of ['ctrl','compta','pdv','dg']) {
    await p.click('#role-chip'); await p.click('[data-setrole="'+r+'"]'); await p.waitForTimeout(300);
    const items = await p.evaluate(() => [...document.querySelectorAll('#nav [data-k]')].map(b => [b.dataset.k, b.dataset.s || '']));
    let n = 0;
    for (const [k, s] of items) {
      await p.hover('#nav');
      if (s) { const g = p.locator('#nav [data-g="'+k+'"]'); if (!(await p.locator('#nav [data-k="'+k+'"][data-s="'+s+'"]').isVisible())) await g.click(); await p.locator('#nav [data-k="'+k+'"][data-s="'+s+'"]').click(); }
      else await p.locator('#nav [data-k="'+k+'"]').first().click();
      await p.waitForTimeout(120); n++;
    }
    console.log(r, 'screens visited', n, 'errors so far', errs);
  }
  await b.close();
})();
