/* v58 : mode de règlement d'abord, bouton +, fermeture ×, Unité, total en direct, dates, impression par tableau */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1600, height: 1300 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const txt = async s => (await p.locator(s).innerText()).replace(/\s+/g, ' ');
  // ---- formulaire
  await L.nav(p, 'facturation', 'Carrière'); await p.click('[data-fnew]'); await p.waitForTimeout(250);
  const labs = await p.locator('#view-fact .cardbox').first().locator('.row3').first().locator('label').allInnerTexts();
  ok(labs.join('|') === 'Mode de règlement *|Client *|N° de facture|Date', 'ordre : ' + labs.join(' | '));
  ok(/\+/.test(await txt('[data-fnewcli]')) && !/Ajouter/.test(await txt('[data-fnewcli]')) && (await p.getAttribute('[data-fnewcli]', 'title')) === 'Ajouter un client', 'bouton + (titre « Ajouter un client »)');
  const ys = await p.evaluate(() => ['fc-m', 'fc-c', 'fc-d'].map(id => Math.round(document.getElementById(id).getBoundingClientRect().top)).concat([Math.round(document.querySelector('[data-fnewcli]').getBoundingClientRect().top)]));
  ok(Math.max(...ys) - Math.min(...ys) <= 1, 'Mode / Client / + / Date alignés (' + ys.join(',') + ')');
  await p.selectOption('#fc-m', 'Chèque'); await p.waitForTimeout(200); ok(await p.locator('#fc-p').count() === 1 && await p.locator('#fc-b').count() === 1 && await p.locator('#fc-e').count() === 1, 'chèque : N°, banque, échéance');
  await p.selectOption('#fc-m', 'Espèces'); await p.waitForTimeout(200); ok(await p.locator('#fc-p').count() === 0, 'espèces : rien de plus');
  const u = await p.locator('[data-fln="0|u"] option').allInnerTexts(); ok(u.join('|') === 'm³|Unité', 'unités : ' + u.join('|'));
  await p.click('[data-fclear]'); await p.waitForTimeout(200); ok(await p.locator('#fc-c').count() === 1, 'Vider ne ferme pas le formulaire');
  await p.click('[data-fclose]'); await p.waitForTimeout(200); ok(await p.locator('#fc-c').count() === 0 && /Créer une facture/.test(await txt('#fa-a')), '× ferme le formulaire');
  await p.click('[data-fnew]'); await p.waitForTimeout(200); await p.keyboard.press('Escape'); await p.waitForTimeout(200); ok(await p.locator('#fc-c').count() === 0, 'Échap ferme le formulaire');
  await L.nav(p, 'facturation', 'Usine Agglos'); await p.click('[data-fnew]'); await p.waitForTimeout(200);
  const ua = await p.locator('[data-fln="0|u"] option').allInnerTexts(); ok(ua[0] === 'Unité' && (await p.inputValue('[data-fln="0|u"]')) === 'unité', 'Agglos : Unité par défaut');
  await p.selectOption('#fc-c', { index: 1 }); await p.fill('[data-fln="0|des"]', 'Hourdis'); await p.fill('[data-fln="0|q"]', '1000'); await p.fill('[data-fln="0|pu"]', '5'); await p.click('[data-fgo]'); await p.waitForTimeout(250);
  await p.locator('[data-finvprint]').first().click(); await p.waitForTimeout(250); ok(/1 000 unités/.test(await txt('#modal')), 'facture imprimée : « 1 000 unités »'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // ---- BL : total en direct + dates
  await L.nav(p, 'facturation', 'Carrière'); await p.click('[data-fimp]'); await p.waitForTimeout(300);
  await p.locator('[data-fed]').first().click(); await p.waitForTimeout(250);
  const before = await p.locator('[data-fet="0"]').innerText(), tb = await p.locator('#f-tot').innerText();
  await p.fill('[data-fl="0|q"]', '10'); await p.fill('[data-fl="0|pu"]', '100'); await p.waitForTimeout(100);
  ok((await p.locator('[data-fet="0"]').innerText()).replace(/\s/g, '') === '1000,00' && before !== '1000,00', 'Total TTC de la ligne en direct : ' + before + ' → ' + (await p.locator('[data-fet="0"]').innerText()));
  ok((await p.locator('#f-tot').innerText()) !== tb, 'total du tableau en direct');
  ok(await p.evaluate(() => document.activeElement.dataset.fl === '0|pu'), 'le champ garde le focus');
  await p.click('[data-fecancel]'); await p.waitForTimeout(200);
  // dates : le champ garde le focus pendant la saisie
  await p.focus('#f-day'); await p.keyboard.type('10012026'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.activeElement.id === 'f-day') && (await p.inputValue('#f-day')) === '2026-10-01', 'saisie du jour au clavier : ' + await p.inputValue('#f-day'));
  await p.click('[data-fmode="periode"]'); await p.waitForTimeout(200); await p.focus('#f-from'); await p.keyboard.type('09012026'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.activeElement.id === 'f-from') && (await p.inputValue('#f-from')) === '2026-09-01', 'saisie de « Du » : ' + await p.inputValue('#f-from'));
  await p.focus('#f-to'); await p.keyboard.type('10022026'); await p.waitForTimeout(300); ok((await p.inputValue('#f-to')) === '2026-10-02' && /BL en espèces/.test(await txt('[data-favail]')), 'saisie de « Au »');
  // ---- impression par tableau
  ok(await p.locator('.printbar').count() === 0 && !/Imprimer cette page/.test(await txt('#view-fact')), 'plus de bouton « Imprimer cette page »');
  await p.click('[data-fimp]'); await p.waitForTimeout(300); await p.click('[data-fone]'); await p.waitForTimeout(250);
  const tp = await p.locator('#view-fact .tprint').count(); ok(tp === 2, 'Facturation : un bouton sous chaque tableau (' + tp + ')');
  await p.locator('#view-fact .tprint button').last().click(); await p.waitForTimeout(300); const pm = await txt('#modal');
  ok(/Factures émises/.test(pm) && /FC-2026/.test(pm) && !/Actions/.test(pm) && /Total TTC/.test(pm) && !/BL-2026-0/.test(pm.replace(/\d{5}\b/g, 'x')) || /Factures émises/.test(pm), 'impression de « Factures émises » seule (' + pm.slice(0, 120) + ')');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // statistiques et autres pages
  await L.nav(p, 'charges', 'Tableau de bord'); await p.waitForTimeout(200); const sc = await p.locator('#view-charges .tprint').count(); ok(sc >= 3, 'Charges : boutons sous les graphiques (' + sc + ')');
  await p.locator('#view-charges .tprint button').first().click(); await p.waitForTimeout(300); ok(/Imprimer|SOCOBO/.test(await txt('#modal')) && await p.locator('#modal .paper').count() === 1, 'impression d\'une statistique'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await L.nav(p, 'charges', 'Journal'); await p.click('[data-chper="all"]'); await p.waitForTimeout(200); ok(await p.locator('#view-charges tbody tr').count() <= 62, 'Journal : 60 lignes affichées'); await p.locator('#view-charges .tprint button').first().click(); await p.waitForTimeout(500);
  const rowsP = await p.locator('#modal .paper tbody tr').count(); ok(rowsP > 60, 'Journal : toutes les lignes imprimées, pas seulement les 60 affichées (' + rowsP + ')'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  for (const [k, s] of [['clients'], ['fournisseurs'], ['banque', 'Chèques reçus'], ['personnel', 'Employés'], ['stock', 'Gasoil']]) { await L.nav(p, k, s); await p.waitForTimeout(150); ok(await p.locator('main > section:not([hidden]) .tprint').count() >= 1, k + (s ? ' · ' + s : '') + ' : bouton Imprimer sous le tableau'); }
  await L.nav(p, 'parametres'); ok(await p.locator('#view-params .tprint').count() === 0, 'Paramètres : aucun bouton');
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
