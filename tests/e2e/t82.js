/* Impression en bas des pages (sauf Paramètres et Audit) ; ordre du plus ancien au plus récent */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1300 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const items = await p.evaluate(() => [...document.querySelectorAll('#nav [data-k]')].map(b => [b.dataset.k, b.dataset.s || '']));
  const miss = [], extra = [];
  for (const [k, s] of items) { await L.nav(p, k, s || undefined); await p.waitForTimeout(120);
    const n = await p.locator('main .tprint:visible').count(); if (await p.locator('.printbar').count()) ok(false, 'printbar de page présent : ' + k);
    if (await p.locator('#print-view').count()) ok(false, 'bouton du haut présent');
    if (k === 'parametres' || k === 'audit') { if (n) extra.push(k); } else if (!n) miss.push(k + (s ? ':' + s : '')); }
  /* pages sans tableau à totaux ni statistiques : pas de bouton attendu */
  ok(extra.length === 0, 'Paramètres et Audit sans bouton Imprimer : ' + extra.join(','));
  console.log('Sans Imprimer en bas :', miss.join(' | ') || 'aucun');
  // ordre : relevé d’un fournisseur du plus ancien au plus récent
  await L.nav(p, 'fournisseurs'); await p.locator('#view-fournisseurs tbody tr').first().click(); await p.waitForTimeout(300);
  const dates = await p.locator('#view-fiche tbody tr td:first-child').allInnerTexts();
  const iso = d => d.split('/').reverse().join('-'); const ds = dates.filter(x => /^\d\d\/\d\d\/\d{4}$/.test(x)).map(iso);
  ok(ds.length > 2 && ds.join() === ds.slice().sort().join(), 'fiche fournisseur : dates croissantes (' + ds.length + ')');
  await L.nav(p, 'audit'); const a = await p.locator('#soon-box tbody tr td:first-child').allInnerTexts(); console.log('audit rows', a.length);
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
