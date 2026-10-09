/* v64 : Supprimer une facture (numéro réutilisé), ordre des sections Agglos, Non attribué, produit archivé */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const txt = async s => (await p.locator(s).first().innerText()).replace(/\s+/g, ' ');
  const mk = async (q) => { if (!await p.locator('#fc-c').count()) await p.click('[data-fnew]'); await p.waitForTimeout(150); await p.selectOption('#fc-c', { index: 1 }); await p.fill('[data-fln="0|des"]', 'Brique 8 trous'); await p.fill('[data-fln="0|q"]', String(q)); await p.fill('[data-fln="0|pu"]', '1'); await p.click('[data-fgo="A"]'); await p.waitForTimeout(300); };
  await L.nav(p, 'facturation', 'Usine Agglos'); await p.waitForTimeout(250);
  const heads = await p.locator('#fa-body h3.sech').allInnerTexts(); ok(/ciment importées/i.test(heads[0]) && /Factures émises/.test(heads[1]), 'ordre : ciment importées puis émises (' + heads.join(' | ') + ')');
  await mk(10); await mk(20); await mk(30);
  const nos = async () => p.locator('#fa-body tr:has([data-finvprint]) td:first-child').allInnerTexts();
  ok((await nos()).join() === 'FC-2026-0001,FC-2026-0002,FC-2026-0003', 'trois factures : ' + (await nos()).join());
  ok(await p.locator('[data-finvdel]').count() === 3, 'bouton Supprimer sur chaque facture');
  // annuler 0003 → garde son numéro, a quand même Supprimer
  await p.locator('[data-finvann]').nth(2).click(); await p.waitForTimeout(200); await p.click('#fa-ok'); await p.waitForTimeout(300);
  ok(await p.locator('[data-finvdel]').count() === 3, 'Supprimer présent aussi sur la facture annulée');
  // supprimer la 0002 → le numéro est réutilisé
  await p.locator('[data-finvdel]').nth(1).click(); await p.waitForTimeout(250); ok(/irréversible/.test(await txt('#modal')), 'confirmation avant suppression');
  await p.locator('#modal .btn.danger, #modal button:has-text("Supprimer")').last().click(); await p.waitForTimeout(300);
  ok((await nos()).join() === 'FC-2026-0001,FC-2026-0003', 'après suppression : ' + (await nos()).join());
  await mk(5); ok((await nos()).join() === 'FC-2026-0001,FC-2026-0002,FC-2026-0003', 'la nouvelle facture reprend 0002 : ' + (await nos()).join());
  await mk(5); ok((await nos()).join() === 'FC-2026-0001,FC-2026-0002,FC-2026-0003,FC-2026-0004', 'puis 0004 (0003 annulée non réutilisée)');
  // Non attribué + archivage
  await p.click('[data-fci]'); await p.waitForTimeout(200); await p.click('#fci-b tr'); await p.waitForTimeout(200); await p.locator('[data-fcisel]').nth(0).check(); await p.selectOption('#fci-t', { index: 1 }); await p.click('#fci-ok'); await p.waitForTimeout(300);
  ok(await p.locator('#fa-body .kmini', { hasText: 'Brique 8 trous' }).count() === 1, 'carte fine du type attribué');
  await L.nav(p, 'pdv', 'Produits'); await p.waitForTimeout(250);
  const arch = p.locator('tr:has-text("Brique 8 trous") [data-arprod]').first(); await arch.click(); await p.waitForTimeout(250);
  await L.nav(p, 'facturation', 'Usine Agglos'); await p.waitForTimeout(250);
  ok(await p.locator('#fa-body .kmini', { hasText: 'Non attribué' }).count() === 1 && await p.locator('#fa-body .kmini', { hasText: 'Brique 8 trous' }).count() === 0, 'produit archivé : ses tonnes repassent en « Non attribué »');
  // Carrière : Supprimer une facture issue d'un BL remet le BL à facturer et libère le numéro
  await L.nav(p, 'facturation', 'Carrière'); await p.waitForTimeout(250); await p.click('[data-fimp]'); await p.waitForTimeout(250);
  const blBefore = await p.locator('[data-fone]').count(); await p.locator('[data-fone]').first().click(); await p.waitForTimeout(300);
  ok(await p.locator('[data-fone]').count() === blBefore - 1 && /FC-2026-0005/.test(await txt('#fa-body')), 'BL facturé → FC-2026-0005 (série unique)');
  await p.locator('[data-finvdel]').first().click(); await p.waitForTimeout(200); await p.locator('#modal button:has-text("Supprimer")').last().click(); await p.waitForTimeout(300);
  ok(await p.locator('[data-fone]').count() === blBefore && !/FC-2026-0005/.test(await txt('#fa-body')), 'facture supprimée : le BL redevient à facturer');
  await p.locator('[data-fone]').first().click(); await p.waitForTimeout(300); ok(/FC-2026-0005/.test(await txt('#fa-body')), 'numéro FC-2026-0005 réutilisé');
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
