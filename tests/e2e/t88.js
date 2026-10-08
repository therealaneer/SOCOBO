/* v59 : la saisie clavier d'une date ne perd jamais le focus (barre du haut, période personnalisée, filtre Facturation) */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const type = async (sel, keys) => { const bx = await p.locator(sel).first().boundingBox(); await p.mouse.click(bx.x + 14, bx.y + bx.height / 2);
    for (const k of keys) { await p.keyboard.press(k); await p.waitForTimeout(150); }
    return p.evaluate(s => { const e = document.querySelector(s); return [e.value, document.activeElement === e]; }, sel); };
  for (const [k, s, id] of [['personnel', 'Présences', '#pe-date'], ['agglos', 'Saisie du jour', '#sj-date'], ['controle', undefined, '#co-date'], ['pdv', 'Dépense', '#dp-date']]) {
    await L.nav(p, k, s); await p.waitForTimeout(250);
    const r = await type(id, '09152026'); ok(r[0] === '2026-09-15' && r[1], id + ' : saisie complète ' + r.join(' ')); }
  await L.nav(p, 'facturation', 'Carrière'); await p.waitForTimeout(250);
  let r = await type('#f-day', '09152026'); ok(r[0] === '2026-09-15' && r[1], '#f-day ' + r.join(' '));
  await L.nav(p, 'charges', 'Tableau de bord'); await p.getByRole('button', { name: 'Personnalisé' }).first().click(); await p.waitForTimeout(250);
  r = await type('[data-cust=from]', '09012026'); ok(r[0] === '2026-09-01' && r[1], 'période personnalisée : saisie ' + r.join(' '));
  await p.waitForTimeout(1300); ok(await p.locator('[data-cust=from]').first().inputValue() === '2026-09-01', 'période appliquée après la saisie');
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
