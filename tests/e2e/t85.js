/* Chaque page a au plus un bouton « Imprimer cette page », en bas ; aucune sur Paramètres et Audit */
const { chromium } = require('playwright'); const L = require('./lib.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1300 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const items = await p.evaluate(() => [...document.querySelectorAll('#nav [data-k]')].map(b => [b.dataset.k, b.dataset.s || '']));
  const dup = [], none = [];
  for (const [k, s] of items) { await L.nav(p, k, s || undefined); await p.waitForTimeout(100);
    const tabs = await p.locator('section:visible [role="tab"]:visible, section:visible .tabs button:visible').count();
    const n = await p.evaluate(() => [...document.querySelectorAll('main > section:not([hidden]) .tprint')].length);
    if (!n) none.push(k + (s ? ':' + s : '')); }
  console.log('Doublons :', dup.join(' | ') || 'aucun'); console.log('Sans bouton :', none.join(' | '));
  await b.close();
})();
