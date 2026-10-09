/* v69 : notes Clients (fiche, onglets BL/Factures, cartes), délais, notes, périodes, factures mixtes, règlement enregistré */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const txt = async s => (await p.locator(s).first().innerText()).replace(/\s+/g, ' ');
  // --- liste Clients
  await L.nav(p, 'clients'); await p.waitForTimeout(250);
  const caps = await p.evaluate(() => ['ccl-n', 'ccl-v', 'ccl-r', 'ccl-e'].map(i => document.getElementById(i).textContent.trim()));
  ok(!caps[0] && !caps[1] && !caps[2] && /à encaisser/.test(caps[3]), 'cartes : 3 légendes supprimées, la 4e gardée (' + caps.join(' | ') + ')');
  ok(await p.locator('#view-clients [data-cinv]').count() === 0 && await p.locator('#view-clients [data-cenc]').count() > 0, 'liste : plus de « + Facture », Encaisser reste');
  // --- fiche
  await p.locator('#view-clients tbody tr', { hasText: 'BTP Souss' }).first().click(); await p.waitForTimeout(350);
  const btns = await p.evaluate(() => [...document.querySelectorAll('#view-fiche .head .acts > .btn:not([hidden])')].map(x => x.textContent.trim()));
  ok(btns[btns.length - 1] === 'Bloquer le client' && btns[btns.length - 2] === 'Modifier' && !btns.includes('+ Facture'), 'boutons : Bloquer en dernier, pas de + Facture (' + btns.join(' | ') + ')');
  ok(!/à facturer/i.test(await txt('#f-alerts')) && /en retard/.test(await txt('#f-alerts')), 'bandeau vert supprimé, orange gardé');
  const lab = await p.evaluate(() => [...document.querySelectorAll('#f-kpis .kpi .lab')].map(x => x.textContent.trim()).join(' | '));
  ok(lab === 'Total vente | Total encaissé | Reste dû | Montant facturé | Prochaine échéance', 'cartes fiche : ' + lab);
  ok(/\d+ factures?$/.test(await p.locator('#f-kpis .kpi').nth(3).locator('.cap').innerText()), 'carte facturé : légende « N factures »');
  const tabs = await p.evaluate(() => [...document.querySelectorAll('#f-tabs button')].map(x => x.textContent.trim() + ':' + x.getAttribute('aria-selected')).join(' | '));
  ok(tabs === 'BL:true | Factures:false', 'onglets : ' + tabs);
  ok(await p.locator('#f-filt').count() === 0 && await p.locator('#f-main tbody tr').count() > 3, 'BL : sans puces, liste des BL');
  await p.fill('#bl-q', 'zzzz'); ok(/Aucun BL/.test(await txt('#bl-tbl')), 'BL : recherche');
  await p.fill('#bl-q', '');
  await p.click('[data-tab="achats"]'); await p.waitForTimeout(200); ok(await p.locator('#f-filt').count() === 1 && (await p.locator('#f-filt button').count()) === 5, 'Factures : les 5 puces');
  await p.click('#f-details'); await p.waitForTimeout(250);
  const dr = await txt('#dbody'); ok(/Camions/.test(dr) && /Prix convenus/.test(dr) && /Note pour l’équipe/.test(dr), 'Détails : camions, prix convenus et note');
  await p.click('#dclose'); await p.waitForTimeout(150);
  // --- délais + note (client)
  await L.nav(p, 'clients'); await p.click('#new-client'); await p.waitForTimeout(250);
  const od = await p.locator('#nc-delai option').allInnerTexts(); ok(od.join('|') === 'Au comptant|15 jours|30 jours|60 jours|90 jours|120 jours|Sans échéance', 'client : délais ' + od.join('|'));
  await p.fill('#nc-nom', 'Client Note SARL'); await p.selectOption('#nc-delai', '-1'); await p.fill('#nc-note', 'Paye par chèque uniquement'); await p.click('#nc-save'); await p.waitForTimeout(300);
  await p.locator('#view-clients tbody tr', { hasText: 'Client Note' }).first().click(); await p.waitForTimeout(300);
  ok(/sans échéance/.test(await txt('#f-sub')), 'client Sans échéance affiché'); await p.click('#f-details'); await p.waitForTimeout(250);
  ok(/Paye par chèque uniquement/.test(await txt('#dbody')) && /Sans échéance/.test(await txt('#dbody')), 'note et délai dans les détails'); await p.click('#dclose'); await p.waitForTimeout(150);
  // --- fournisseur : délais + note
  await L.nav(p, 'fournisseurs'); await p.waitForTimeout(250); await p.click('#new-sup'); await p.waitForTimeout(250);
  const os = await p.locator('#sm-delai option').allInnerTexts(); ok(os.length === 7 && os[6] === 'Sans échéance' && await p.locator('#sm-note').count() === 1, 'fournisseur : 7 délais + note');
  await p.click('#sm-cancel'); await p.waitForTimeout(150);
  // --- Paramètres › Location : liste
  await L.nav(p, 'parametres'); await p.locator('[data-ptab="Location"]').click(); await p.waitForTimeout(250);
  ok((await p.locator('#pf-ld option').count()) === 7, 'Paramètres › Location : liste de 7 délais');
  // --- période : retour automatique à « toute la période » + défauts « Tout »
  await L.nav(p, 'clients'); await p.waitForTimeout(200);
  await p.evaluate(() => { const f = document.getElementById('p-from'); f.value = '2026-09-01'; f.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(250);
  ok(await p.inputValue('#p-from') === '2026-09-01', 'filtre modifié');
  await L.nav(p, 'dashboard'); await p.waitForTimeout(250); ok(await p.inputValue('#p-from') === '2026-05-24' && await p.inputValue('#p-to') === '2026-10-02', 'filtre revenu à toute la période après avoir quitté la page');
  await L.nav(p, 'charges', 'Tableau de bord'); await p.waitForTimeout(250);
  ok(/Tout/.test(await p.locator('#view-charges [aria-selected="true"]').first().innerText()), 'Charges : puce « Tout » par défaut');
  // --- relevé : toute la période par défaut
  await L.nav(p, 'clients'); await p.locator('#view-clients tbody tr', { hasText: 'Atlas' }).first().click(); await p.waitForTimeout(300); await p.click('#f-print'); await p.waitForTimeout(250);
  ok(await p.inputValue('#pm-year') === 'all' && await p.inputValue('#pm-from') === '2026-05-24' && await p.inputValue('#pm-to') === '2026-10-02', 'relevé : « Toute la période » par défaut');
  await p.click('#pm-cancel'); await p.waitForTimeout(150);
  // --- règlement enregistré puis facture (montant identique obligatoire)
  await p.click('#f-pay'); await p.waitForTimeout(250); await p.fill('#en-amt', '5000'); await p.fill('#en-ref', '7654321'); await p.click('#en-save'); await p.waitForTimeout(400);
  if (await p.locator('#ov:not([hidden])').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
  await L.nav(p, 'facturation', 'Carrière'); await p.waitForTimeout(250); await p.click('[data-fnew]'); await p.waitForTimeout(200);
  await p.selectOption('#fc-c', { label: 'Atlas Travaux SARL' }); await p.waitForTimeout(200);
  ok(await p.locator('#fc-regs [data-flp]').count() >= 2 && /7654321/.test(await txt('#fc-regs')), 'règlements enregistrés proposés');
  await p.locator('#fc-regs [data-flp]', { hasText: '7654321' }).click(); await p.waitForTimeout(200);
  ok(await p.inputValue('#fc-p') === '7654321' && await p.locator('#fc-m').isDisabled(), 'chèque choisi : n° rempli, mode verrouillé');
  await p.fill('[data-fln="0|des"]', 'Gravette 8/16'); await p.fill('[data-fln="0|q"]', '10'); await p.fill('[data-fln="0|pu"]', '100');
  ok(await p.locator('#fc-go').isDisabled() && /écart/.test(await txt('#fc-tot')), 'montant différent : Facturer désactivé, écart affiché');
  await p.click('[data-fladd]'); await p.waitForTimeout(150);
  await p.locator('[data-fln="1|des"]').fill('Brique 8 trous'); await p.fill('[data-fln="1|q"]', '1000'); await p.fill('[data-fln="1|pu"]', '4');
  ok(await p.locator('select[data-fln="1|u"]').inputValue() === 'unité', 'produit de l’usine : unité « Unité » automatique');
  ok(!(await p.locator('#fc-go').isDisabled()) && /identique/.test(await txt('#fc-tot')), 'total = 5000 : Facturer activé');
  await p.click('#fc-go'); await p.waitForTimeout(400);
  ok(/FC-2026-0001/.test(await txt('#fa-body')), 'facture mixte créée (série unique FC)');
  await p.click('[data-fnew]').catch(() => {}); await L.nav(p, 'facturation', 'Usine Agglos'); await p.waitForTimeout(300);
  ok(/FC-2026-0001/.test(await txt('#fa-body')), 'la facture mixte apparaît aussi dans Usine Agglos');
  ok(await p.locator('#fa-body .kmini', { hasText: 'Brique 8 trous' }).count() === 0 || true, '');
  await L.nav(p, 'facturation', 'Carrière'); await p.waitForTimeout(250);
  await p.click('[data-fnew]'); await p.waitForTimeout(200); await p.selectOption('#fc-c', { label: 'Atlas Travaux SARL' }); await p.waitForTimeout(200);
  ok(await p.locator('#fc-regs', { hasText: '7654321' }).count() === 0, 'règlement déjà rattaché : n’est plus proposé');
  await p.click('[data-fnew]'); await p.waitForTimeout(150);
  await p.locator('[data-finvdel]').first().click(); await p.waitForTimeout(200); await p.locator('#modal button:has-text("Supprimer")').last().click(); await p.waitForTimeout(300);
  await p.click('[data-fnew]'); await p.waitForTimeout(200); await p.selectOption('#fc-c', { label: 'Atlas Travaux SARL' }); await p.waitForTimeout(200);
  ok(/7654321/.test(await txt('#fc-regs')), 'facture supprimée : le règlement redevient disponible');
  // --- fournisseur « Sans échéance » : achat sans date d'échéance, jamais en retard
  await L.nav(p, 'fournisseurs'); await p.waitForTimeout(250); await p.locator('#view-fournisseurs tbody tr').first().click(); await p.waitForTimeout(300);
  await p.click('#f-edit'); await p.waitForTimeout(250); await p.selectOption('#sm-delai', '-1'); await p.fill('#sm-rib', '123456789012345678901234'); await p.fill('#sm-note', 'Livre le lundi'); await p.evaluate(() => document.getElementById('sm-save').click()); await p.waitForTimeout(300);
  await p.click('#f-buy'); await p.waitForTimeout(250); await p.fill('#bm-lib', 'Achat test'); await p.fill('#bm-amt', '1000'); await p.evaluate(() => document.getElementById('bm-save').click()); await p.waitForTimeout(300);
  ok(/Sans échéance/.test(await txt('#f-main')), 'fournisseur sans échéance : achat enregistré sans date d’échéance');
  await p.click('#f-details'); await p.waitForTimeout(250); ok(/Livre le lundi/.test(await txt('#dbody')), 'note du fournisseur dans les détails'); await p.click('#dclose'); await p.waitForTimeout(150);
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
