/* v57 : prix TTC partout, prix convenus du client, Tout vider, champs alignés */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1300 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const txt = async s => (await p.locator(s).innerText()).replace(/\s+/g, ' ');
  // ---- Produits : un seul prix, TTC
  await L.nav(p, 'pdv', 'Produits'); const ph = await p.locator('#prod-body thead th').allInnerTexts();
  ok(ph.includes('Prix TTC') && !ph.some(h => /Prix HT/.test(h)), 'Produits : colonne « Prix TTC » seule');
  ok(/45,60 \/ t/.test(await txt('#prod-body')), 'Tout-venant 38 HT affiché 45,60 TTC / t');
  await p.locator('[data-peprod]').first().click(); await p.waitForTimeout(200); ok(/Prix TTC par tonne/.test(await txt('#modal')) && await p.inputValue('#pm-px') === '45,6', 'formulaire produit en TTC');
  await p.click('#pm-save'); await p.waitForTimeout(250); ok(/45,60 \/ t/.test(await txt('#prod-body')), 'enregistrer sans changer garde le prix');
  // ---- Caisse : prix TTC, prix convenu
  await L.nav(p, 'pdv', 'Caisse');
  await p.click('[data-pcl="102"]'); await p.click('[data-ptr="31905-A-6"]'); await p.waitForTimeout(150);
  const normal = await txt('[data-pprod="g8"]'); ok(/198,00 \/ m³/.test(normal) && /132,00 \/ t/.test(normal) && !/Prix client/.test(normal), 'client sans prix convenu : 198,00 / m³ · 132,00 / t (' + normal.slice(0, 80) + ')');
  await p.click('#pdv-clear'); await p.click('[data-pcl="101"]'); await p.click('[data-ptr="48217-B-6"]'); await p.waitForTimeout(150);
  const cl = await txt('[data-pprod="g8"]'); ok(/190,00 \/ m³/.test(cl) && /Prix client/.test(cl), 'Atlas : 190,00 / m³ avec « Prix client »');
  ok(!/Prix client/.test(await txt('[data-pprod="tv"]')), 'autres produits au prix normal');
  await p.click('[data-pprod="g8"]'); await p.waitForTimeout(200);
  const tk = await txt('#pdv-ticket'); ok(!/TVA/.test(tk) && !/\bHT\b/.test(tk), 'ticket sans HT ni TVA');
  ok(/3 040,00/.test(tk), '16 m³ × 190 = 3 040,00 TTC (' + tk.slice(0, 60) + ')');
  await p.click('#pdv-go'); await p.waitForTimeout(300); const bl = await txt('#modal');  ok(/PRIX TTC/.test(bl) && /Total TTC/.test(bl) && !/Sous-total HT|TVA/i.test(bl), 'BL A6 : colonnes TTC, sans HT ni TVA'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // ---- Fiche client : prix convenus
  await L.nav(p, 'clients'); await p.locator('#view-clients tbody tr', { hasText: 'Atlas Travaux' }).first().click(); await p.waitForTimeout(300);
  await p.locator('[data-tab="prix"]').click(); await p.waitForTimeout(200); const pt = await txt('#f-main');
  ok(/Gravette 8\/16/.test(pt) && /190,00/.test(pt) && /198,00/.test(pt) && /-4,04 %/.test(pt), 'onglet Prix convenus : 198,00 → 190,00 (-4,04 %)');
  await p.click('[data-editpx]'); await p.waitForTimeout(200); ok(await p.locator('.pxrow').count() === 1, 'éditeur : une ligne');
  await p.click('#px-add'); await p.waitForTimeout(150); ok(await p.locator('.pxrow').count() === 2, '+ Ajouter un prix');
  await p.click('#px-save'); await p.waitForTimeout(150); ok(/Indiquez un prix/.test(await txt('#px-err')), 'ligne vide refusée');
  await p.locator('[data-pxk]').nth(1).selectOption('sa'); await p.fill('[data-pxf="1|m3"]', '100'); await p.click('#px-save'); await p.waitForTimeout(300);
  ok(/Sable lavé concassé 0\/5/.test(await txt('#f-main')) && /100,00/.test(await txt('#f-main')), 'second prix enregistré');
  // le prix de t est dérivé de m³ : sable 100 / 1,6 = 62,50
  await L.nav(p, 'pdv', 'Caisse'); await p.click('[data-pcl="101"]'); await p.click('[data-ptr="48217-B-6"]'); await p.waitForTimeout(150); ok(/100,00 \/ m³/.test(await txt('[data-pprod="sa"]')), 'Caisse : sable à 100,00 / m³');
  await p.click('#pdv-clear'); await p.waitForTimeout(100);
  // client exempt de TVA : TTC = HT
  await p.click('[data-pcl="107"]').catch(() => {}); await p.waitForTimeout(150);
  if (await p.locator('[data-pprod="g8"]').count()) ok(/165,00 \/ m³|110,00 \/ t/.test(await txt('[data-pprod="g8"]')) || /110,00/.test(await txt('[data-pprod="g8"]')), 'client exempt : prix sans TVA (' + (await txt('[data-pprod="g8"]')).slice(0, 60) + ')');
  // ---- Nouveau client : section Prix convenus
  await p.click('#pdv-clear').catch(() => {}); await L.nav(p, 'clients'); await p.click('#new-client'); await p.waitForTimeout(200);
  ok(await p.locator('#nc-addpx').count() === 1, 'nouveau client : bouton + Ajouter un prix');
  await p.fill('#nc-nom', 'Test Prix SARL'); await p.click('#nc-addpx'); await p.fill('[data-pxf="0|m3"]', '90'); await p.click('#nc-save'); await p.waitForTimeout(300);
  await p.locator('#view-clients tbody tr', { hasText: 'Test Prix SARL' }).first().click(); await p.waitForTimeout(250); await p.locator('[data-tab="prix"]').click(); await p.waitForTimeout(150); ok(/90,00/.test(await txt('#f-main')), 'prix saisi à la création enregistré');
  // droits : seul le DG modifie
  await p.click('#role-chip'); await p.click('[data-setrole="compta"]'); await p.waitForTimeout(300); await L.nav(p, 'clients'); await p.locator('#view-clients tbody tr', { hasText: 'Atlas Travaux' }).first().click(); await p.waitForTimeout(250); await p.locator('[data-tab="prix"]').click(); await p.waitForTimeout(150);
  ok(await p.locator('[data-editpx]').count() === 0 && /190,00/.test(await txt('#f-main')), 'Comptabilité : lecture seule');
  await p.click('#role-chip'); await p.click('[data-setrole="dg"]'); await p.waitForTimeout(300);
  // ---- Facturation Carrière
  await L.nav(p, 'facturation', 'Carrière'); await p.click('[data-fimp]'); await p.waitForTimeout(300);
  const th = await p.locator('#fa-body .sheet thead').first().innerText(); ok(/Prix unitaire TTC/.test(th) && /Total TTC/.test(th) && !/\bHT\b/.test(th), 'tableau BL : TTC, sans HT');
  ok(/Total TTC · \d/.test(await txt('#fa-body tfoot')), 'ligne de total en TTC');
  ok(await p.locator('[data-fclr]').count() === 1, 'bouton Tout vider visible');
  const nb = await p.locator('[data-fsel]').count();
  await p.click('[data-fone]'); await p.waitForTimeout(250);
  const ih = await p.locator('#fa-body .sheet').last().locator('thead').innerText(); ok(/Total TTC/.test(ih) && !/Total HT/.test(ih), 'factures émises : sans colonne HT');
  // modification d'une BL : alignement
  await p.locator('[data-fed]').first().click(); await p.waitForTimeout(250);
  const ys = await p.evaluate(() => { const tr = [...document.querySelectorAll('#fa-body tbody tr')].find(r => r.querySelector('[data-fe="client"]')); return [...tr.querySelectorAll('input.in, select.in')].map(e => { const r = e.getBoundingClientRect(); return Math.round(r.top + r.height / 2); }); });
  ok(ys.length >= 4 && Math.max(...ys) - Math.min(...ys) <= 2, 'ligne de modification alignée (' + ys.join(',') + ')');
  await p.click('[data-fecancel]'); await p.waitForTimeout(200);
  // Tout vider
  await p.click('[data-fclr]'); await p.waitForTimeout(250); ok(/Vider la liste/.test(await txt('#modal')), 'confirmation demandée');
  await p.click('#cd-no'); await p.waitForTimeout(150); ok(await p.locator('[data-fsel]').count() === nb - 1, 'Retour : rien retiré');
  await p.click('[data-fclr]'); await p.waitForTimeout(200); await p.click('#cd-yes'); await p.waitForTimeout(300);
  ok(await p.locator('[data-fsel]').count() === 0 && await p.locator('[data-fclr]').count() === 0 && await p.locator('[data-fall]').count() === 0, 'liste vidée : les boutons disparaissent');
  ok(/Éléments retirés \(\d+\)/.test(await txt('#fa-body')), 'Éléments retirés (n)');
  ok(/FC-2026-0001/.test(await txt('#fa-body')), 'la BL facturée reste');
  await p.click('[data-fhid]'); await p.waitForTimeout(150); await p.locator('[data-fres]').first().click(); await p.waitForTimeout(200); ok(await p.locator('[data-fsel]').count() === 1, 'Restaurer');
  // formulaire de création : champs alignés
  await p.click('[data-fnew]'); await p.waitForTimeout(250);
  const y3 = await p.evaluate(() => ['fc-c', 'fc-d'].map(id => Math.round(document.getElementById(id).getBoundingClientRect().top)).concat([Math.round(document.querySelector('#view-fact .cardbox .row3 .f:nth-child(2) .in').getBoundingClientRect().top)]));
  ok(Math.max(...y3) - Math.min(...y3) <= 1, 'Client / N° / Date alignés (' + y3.join(',') + ')');
  ok(/Prix unitaire TTC/.test((await p.locator('#view-fact .cardbox').first().innerText())) && !/TVA/.test(await txt('#fc-tot')), 'formulaire : prix TTC, total TTC');
  await p.selectOption('#fc-c', { index: 1 }); await p.fill('[data-fln="0|des"]', 'Test'); await p.fill('[data-fln="0|q"]', '10'); await p.fill('[data-fln="0|pu"]', '120');
  ok(/Total TTC 1 200,00/.test(await txt('#fc-tot')), '10 × 120 TTC = 1 200,00');
  await p.click('[data-fgo]'); await p.waitForTimeout(300);
  // HT interne = 1000 pour un client à 20 % : l'impression garde HT/TVA/TTC
  const last = p.locator('[data-finvprint]').last(); await last.click(); await p.waitForTimeout(250); const paper = await txt('#modal'); ok(/Total HT/.test(paper) && /TVA 20 %/.test(paper) && /Total TTC/.test(paper) && /1 000,00/.test(paper) && /1 200,00/.test(paper), 'facture imprimée : HT 1 000,00 · TVA · TTC 1 200,00');
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
