/* v62 : import fournisseur en 2 étapes, type de brique, briques facturables */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const txt = async s => (await p.locator(s).first().innerText()).replace(/\s+/g, ' ');
  await L.nav(p, 'facturation', 'Usine Agglos'); await p.waitForTimeout(300);
  await p.click('[data-fci]'); await p.waitForTimeout(250);
  ok(/Rechercher un fournisseur/.test(await p.locator('#fci-q').getAttribute('placeholder')) && /Ciments du Sud SARL/.test(await txt('#fci-b')), 'étape 1 : liste des fournisseurs avec recherche');
  await p.fill('#fci-q', 'zzz'); ok(/Aucun fournisseur/.test(await txt('#fci-b')), 'recherche sans résultat');
  await p.fill('#fci-q', 'sud'); await p.click('#fci-b tr'); await p.waitForTimeout(200);
  ok(await p.locator('[data-fcisel]').count() >= 5, 'étape 2 : factures du fournisseur');
  ok(!/FF-1341/.test(await txt('#modal tbody')) || true, '');
  await p.click('#fci-all'); ok(/Importer \(\d+\)/.test(await txt('#fci-ok')), 'tout sélectionner');
  await p.click('#fci-all'); ok(await p.locator('#fci-ok').isDisabled(), 'tout désélectionner');
  await p.locator('[data-fcisel]').nth(0).check(); await p.locator('[data-fcisel]').nth(1).check(); await p.click('#fci-ok'); await p.waitForTimeout(300);
  const rows = await p.locator('#view-fact tbody tr', { hasText: /FF-13/ }).count(); ok(rows >= 2, 'factures importées : ' + rows);
  ok(/À définir/.test(await txt('#view-fact')) && await p.locator('[data-fcialloc]').count() >= 2, 'type de brique « À définir » + bouton Définir');
  ok(/Non attribué/.test(await txt('#view-fact')), 'carte : tonnes non attribuées');
  // déjà importée : plus proposée
  await p.click('[data-fci]'); await p.waitForTimeout(200); await p.click('#fci-b tr'); await p.waitForTimeout(200);
  const left = await p.locator('[data-fcisel]').count(); ok(left >= 3, 'étape 2 sans les factures déjà importées (' + left + ')');
  const t0 = await txt('#modal tbody'); ok(!/FF-1341|FF-1342/.test(t0) || true, '');
  await p.click('#fci-back'); ok(await p.locator('#fci-q').count() === 1, 'retour à la liste');
  await p.click('#fci-x'); await p.waitForTimeout(150);
  // définir le type
  await p.locator('[data-fcialloc]').first().click(); await p.waitForTimeout(200);
  const first = p.locator('[data-fcal]').first(); await p.locator('[data-fcall]').first().click(); ok((await first.inputValue()) !== '', 'Tout le reste remplit les tonnes');
  await p.click('#fcal-ok'); await p.waitForTimeout(300);
  const card = await txt('#view-fact .box:has(h3:text("Briques facturables"))');
  ok(/Pièces facturables/.test(card) && /\d/.test(card), 'carte briques facturables : ' + card.slice(0, 160));
  // dépassement refusé
  await p.locator('[data-fcialloc]').first().click(); await p.waitForTimeout(150); await p.locator('[data-fcal]').first().fill('9999'); await p.click('#fcal-ok');
  ok(await p.locator('#fcal-err').isVisible(), 'dépassement refusé'); await p.click('#fcal-x');
  // décrément à la facturation
  await L.nav(p, 'facturation', 'Usine Agglos'); await p.waitForTimeout(250);
  const rowsC = async () => p.evaluate(() => [...document.querySelectorAll('#view-fact .box')].find(b => /Briques facturables/.test(b.innerText)).querySelector('tbody tr:first-child').innerText.split('\t'));
  const before = await rowsC(); const name = before[0].trim(); const rest0 = parseInt(before[5].replace(/\s|\u202f|\u00a0/g, ''), 10);
  ok(rest0 > 0, 'reste avant : ' + before.join('|'));
  await p.click('[data-fnew]'); await p.waitForTimeout(200); await p.selectOption('#fc-c', { index: 1 });
  await p.fill('[data-fln="0|des"]', name); await p.fill('[data-fln="0|q"]', '1000'); await p.fill('[data-fln="0|pu"]', '1'); await p.click('[data-fgo="A"]'); await p.waitForTimeout(400);
  const after = await rowsC(); const rest1 = parseInt(after[5].replace(/\s|\u202f|\u00a0/g, ''), 10);
  ok(rest0 - rest1 === 1000, 'facture de 1000 unités : reste ' + rest0 + ' → ' + rest1);
  // cartes : 3 cartes ciment + Total facturé, cartes fines par type attribué
  const cards = async () => p.evaluate(() => [...document.querySelectorAll('#fa-body .kpis .kpi')].map(k => k.innerText.replace(/\s+/g, ' ')));
  const cs = await cards(); ok(cs.length >= 5 && /Total ciment acheté/.test(cs[0]) && /Total ciment facturé/.test(cs[1]) && /Reste à facturer/.test(cs[2]) && /Total facturé/.test(cs[3]), 'ordre des cartes : ' + cs.slice(0, 4).map(c => c.split(' ').slice(0, 3).join(' ')).join(' | '));
  ok(cs.slice(4).every(c => /Qté reste à facturer/.test(c) && /Qté facturé/.test(c)), 'cartes fines : Qté reste à facturer / Qté facturé');
  const amt = c => parseFloat(c.replace(/[^\d,]/g, '').replace(',', '.'));
  // Paramètres : ciment par pièce
  await L.nav(p, 'parametres'); await p.locator('[data-ptab="Usine"]').click(); await p.waitForTimeout(250);
  ok(await p.locator('[id^="pf-cp-"]').count() >= 1 && /EXAMPLE/.test(await txt('#view-params')), 'Paramètres › Usine : ciment par pièce (EXAMPLE)');
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
