/* Facturation · Usine Agglos : cartes, formulaire à la demande, import des factures de ciment */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1300 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  await L.nav(p, 'facturation', 'Usine Agglos');
  ok((await p.locator('#fa-body .kpi .lab').allInnerTexts()).join('|') === 'Total facturé|Total ciment acheté', 'cartes Agglos');
  ok((await p.locator('#fa-a').innerText()).includes('Créer une facture') && await p.locator('#fc-c').count() === 0, 'bouton en haut, formulaire fermé');
  await p.click('[data-fnew]'); await p.waitForTimeout(200); ok(await p.locator('#fc-c').count() === 1 && await p.locator('#fc-m').count() === 0, 'formulaire sans mode de règlement');
  await p.selectOption('#fc-c', { index: 1 }); await p.fill('[data-fln="0|des"]', 'Hourdis 16'); await p.fill('[data-fln="0|q"]', '500'); await p.fill('[data-fln="0|pu"]', '4,5');
  await p.click('[data-fgo]'); await p.waitForTimeout(250); ok(await p.locator('#ov').isHidden() && /FA-2026-0001/.test(await p.locator('#toast').innerText()), 'facture FA-2026-0001 sans aperçu');
  const tot = (await p.locator('#fa-body .kpi .pill').first().innerText()).replace(/\s/g, ''); ok(tot !== '0,00', 'Total facturé = ' + tot);
  // import du ciment
  ok(await p.locator('[data-fcirm]').count() === 0, 'aucune facture de ciment au départ');
  await p.click('[data-fci]'); await p.waitForTimeout(250); await p.click('#fci-b tr'); await p.waitForTimeout(200); const c = await p.locator('[data-fcisel]').count(); ok(c > 0, c + ' factures de ciment à importer');
  ok(await p.locator('#fci-ok').isDisabled(), 'Importer désactivé sans sélection');
  await p.locator('[data-fcisel]').nth(0).check(); await p.locator('[data-fcisel]').nth(1).check(); await p.click('#fci-ok'); await p.waitForTimeout(300);
  ok(await p.locator('[data-fcirm]').count() === 2, '2 factures importées');
  const ci = (await p.locator('#fa-body .kpi .pill').nth(1).innerText()).replace(/\s/g, ''); ok(ci === '129010,00', 'Total ciment acheté TTC = ' + ci);
  await p.click('[data-fci]'); await p.waitForTimeout(250); await p.click('#fci-b tr'); await p.waitForTimeout(200); ok(await p.locator('[data-fcisel]').count() === c - 2, 'pas de double import'); await p.click('#fci-x'); await p.waitForTimeout(150);
  await p.locator('[data-fcirm]').first().click(); await p.waitForTimeout(200); ok(await p.locator('[data-fcirm]').count() === 1, 'Retirer');
  // la facture reste chez le fournisseur
  await L.nav(p, 'fournisseurs'); ok((await p.locator('#view-fournisseurs').innerText()).includes('Ciments du Sud'), 'le fournisseur de ciment existe dans Fournisseurs');
  for (const r of ['compta', 'ctrl']) { await p.click('#role-chip'); await p.click('[data-setrole="' + r + '"]'); await p.waitForTimeout(250); await L.nav(p, 'facturation', 'Usine Agglos');
    ok(/Factures de ciment importées/.test(await p.locator('#fa-body').innerText()), r + ' voit le tableau du ciment');
    ok((await p.locator('[data-fci]').count()) === (r === 'compta' ? 1 : 0), r + ' : bouton Importer ' + (r === 'compta' ? 'visible' : 'masqué')); }
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
