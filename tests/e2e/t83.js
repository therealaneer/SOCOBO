/* Parcours de tous les onglets de chaque écran : aucune erreur de page */
const { chromium } = require('playwright'); const L = require('./lib.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1300 } });
  let errs = 0; p.on('pageerror', e => { errs++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  let tabs = 0;
  for (const r of ['dg', 'compta', 'ctrl', 'pdv']) {
    if (r !== 'dg') { await p.click('#role-chip'); await p.click('[data-setrole="' + r + '"]'); await p.waitForTimeout(250); }
    const items = await p.evaluate(() => [...document.querySelectorAll('#nav [data-k]')].map(b => [b.dataset.k, b.dataset.s || '']));
    for (const [k, s] of items) { await L.nav(p, k, s || undefined); await p.waitForTimeout(80);
      const n = await p.locator('section:visible [role="tab"]:visible, section:visible .tabs button:visible').count();
      for (let i = 0; i < Math.min(n, 12); i++) { const t = p.locator('section:visible [role="tab"]:visible, section:visible .tabs button:visible').nth(i); try { await t.click({ timeout: 2000 }); tabs++; await p.waitForTimeout(60); } catch (e) {} }
      await L.nav(p, k, s || undefined); }
  }
  console.log('tabs clicked', tabs, 'errors', errs); await b.close();
})();
