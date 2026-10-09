/* v68 : pas de DUPLICATA sur la facture réimprimée ; colonne « Total vente » dans Clients */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  await L.nav(p, 'clients'); await p.waitForTimeout(250);
  const th = await p.locator('#view-clients thead').first().innerText(); ok(/Total vente/i.test(th) && !/Montant factur/i.test(th), 'Clients : colonne « Total vente » (' + th.replace(/\s+/g, ' ') + ')');
  await L.nav(p, 'facturation', 'Carrière'); await p.click('[data-fimp]'); await p.waitForTimeout(250); await p.locator('[data-fone]').first().click(); await p.waitForTimeout(300);
  for (let i = 0; i < 3; i++) { await p.locator('[data-finvprint]').first().click(); await p.waitForTimeout(200); await p.click('#dm-print'); await p.waitForTimeout(200); const t = await p.locator('.paper').innerText(); ok(!/DUPLICATA/i.test(t), 'impression n° ' + (i + 1) + ' : pas de DUPLICATA'); await p.click('#dm-close'); await p.waitForTimeout(200); }
  await p.locator('[data-finvann]').first().click(); await p.waitForTimeout(200); await p.click('#fa-ok'); await p.waitForTimeout(300);
  await p.locator('[data-finvprint]').first().click(); await p.waitForTimeout(250); ok(/FACTURE ANNULÉE/.test(await p.locator('.paper').innerText()), 'facture annulée : mention FACTURE ANNULÉE conservée');
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
