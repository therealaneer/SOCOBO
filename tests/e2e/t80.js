/* Facturation · Carrière : import des BL, facturation directe, tous les modes de règlement, numérotation sans trou, cartes */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1300 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const subs = await p.locator('#nav [data-k="facturation"][data-s]').allInnerTexts();
  ok(subs.join('|') === 'Carrière|Usine Agglos', 'sous-menu Facturation : Carrière | Usine Agglos');
  await L.nav(p, 'facturation', 'Carrière');
  ok(await p.locator('#print-view').count() === 0, 'plus de bouton Imprimer en haut');
  ok(await p.locator('#view-fact .printbar').count() === 0 && await p.locator('#view-fact .tprint').count() >= 1, 'boutons Imprimer sous les tableaux, pas de bouton de page');
  ok((await p.locator('#fa-a').innerText()).includes('Créer une facture'), 'bouton Créer une facture en haut');
  ok(await p.locator('#fc-c').count() === 0, 'formulaire fermé par défaut');
  const cards = (await p.locator('#fa-body .kpi .lab').allInnerTexts()).join('|');
  ok(cards === 'Total facturé|Total espèces facturé|Total chèque facturé|Total virement facturé', 'cartes : ' + cards);
  ok(await p.locator('[data-fmk]').count() === 0 && await p.locator('[data-fall]').count() === 0, 'boutons de facturation masqués tant que le tableau est vide');
  await p.click('[data-fimp]'); await p.waitForTimeout(300);
  const n = await p.locator('[data-fone]').count(); ok(n === 4, 'import : ' + n + ' BL');
  ok(await p.locator('[data-fmk]').count() === 1 && await p.locator('[data-fall]').count() === 1, 'boutons visibles après import');
  ok(await p.locator('[data-fmk]').isDisabled(), 'Facturer la sélection désactivé sans sélection');
  await p.locator('[data-fone]').first().click(); await p.waitForTimeout(250);
  ok(await p.locator('#ov').isHidden(), 'Facturer : aucune fenêtre');
  const t1 = await p.locator('#toast').innerText(); ok(/FC-2026-0001/.test(t1), 'première facture ' + t1);
  await p.locator('[data-fsel]').nth(0).check(); await p.waitForTimeout(150);
  await p.click('[data-fmk]'); await p.waitForTimeout(250);
  ok(await p.locator('#ov').isHidden() && /FC-2026-0002/.test(await p.locator('#toast').innerText()), 'Facturer la sélection : direct, numéro 0002');
  await p.click('[data-fall]'); await p.waitForTimeout(250);
  ok(await p.locator('#ov').isVisible() && /Tout facturer/.test(await p.locator('#ov h2').innerText()), 'Tout facturer : confirmation');
  await p.click('#fm-ok'); await p.waitForTimeout(300);
  ok(await p.locator('#ov').isHidden() && /FC-2026-0003 → FC-2026-0004/.test(await p.locator('#toast').innerText()), 'Tout facturer : 0003 → 0004, sans aperçu');
  ok(await p.locator('[data-fmk]').count() === 0 && await p.locator('[data-fall]').count() === 0, 'boutons masqués quand tout est facturé');
  // création : chèque, effet, virement, espèces ; numérotation sans trou
  await p.click('[data-fnew]'); await p.waitForTimeout(200);
  ok(await p.locator('#fc-c').count() === 1, 'le formulaire s’ouvre');
  const fill = async (mode, piece, q, pu) => {
    await p.selectOption('#fc-m', mode); await p.waitForTimeout(100);
    await p.selectOption('#fc-c', { index: 1 }); if (piece) await p.fill('#fc-p', piece);
    await p.fill('[data-fln="0|des"]', 'Grave 0/31,5'); await p.fill('[data-fln="0|q"]', q); await p.fill('[data-fln="0|pu"]', pu);
    await p.click('[data-fgo]'); await p.waitForTimeout(250);
  };
  await fill('Chèque', '1234567', '10', '50'); ok(/FC-2026-0005/.test(await p.locator('#toast').innerText()), 'chèque : 0005');
  ok(await p.locator('#fc-c').count() === 1 && (await p.locator('#fc-p').inputValue()) === '' && (await p.locator('[data-fln="0|des"]').inputValue()) === '', 'le formulaire reste ouvert et vidé (client, date et mode conservés)');
  await fill('Effet', '2345678', '4', '100'); ok(/FC-2026-0006/.test(await p.locator('#toast').innerText()), 'effet : 0006');
  await fill('Virement', 'VIR-77', '4', '100'); ok(/FC-2026-0007/.test(await p.locator('#toast').innerText()), 'virement : 0007');
  await fill('Espèces', '', '2', '100'); ok(/FC-2026-0008/.test(await p.locator('#toast').innerText()), 'espèces : 0008');
  // chèque dupliqué refusé sans consommer de numéro
  await fill('Chèque', '1234567', '1', '10'); ok(await p.locator('#fc-err:visible').count() === 1, 'chèque déjà enregistré refusé');
  await fill('Espèces', '', '1', '10'); ok(/FC-2026-0009/.test(await p.locator('#toast').innerText()), 'après un refus la numérotation continue sans trou : 0009');
  const nos = (await p.locator('#view-fact tbody td.mono b').allInnerTexts()).filter(x => /^FC-/.test(x));
  ok(nos.join(',') === nos.slice().sort().join(',') && nos[0] === 'FC-2026-0001', 'factures émises de la plus ancienne à la plus récente : ' + nos.length);
  const cs = (await p.locator('#fa-body .kpi .pill').allInnerTexts()).map(s => s.replace(/\s/g, ''));
  ok(cs[3] === '400,00' && cs[2] === '900,00', 'cartes chèque (chèque + effet) et virement : ' + cs.join(' '));
  // vider ferme le formulaire
  await p.click('[data-fclear]'); await p.waitForTimeout(150); ok(await p.locator('#fc-c').count() === 1, 'Vider garde le formulaire ouvert'); await p.click('[data-fclose]'); await p.waitForTimeout(150);
  // client de passage : espèces uniquement
  await p.click('[data-fnew]'); await p.selectOption('#fc-m', 'Chèque'); await p.waitForTimeout(100);
  ok(!(await p.locator('#fc-c option').allInnerTexts()).includes('Client de passage'), 'client de passage absent pour un chèque');
  await p.click('[data-fclose]'); await p.waitForTimeout(100);
  // annulation : le numéro reste, le suivant continue
  await p.locator('[data-finvann]').first().click(); await p.waitForTimeout(200); await p.click('#fa-ok'); await p.waitForTimeout(250);
  ok(await p.locator('#view-fact .st.mute:text("Annulée")').count() === 1, 'facture annulée conservée');
  await p.click('[data-fnew]'); await p.waitForTimeout(150); await fill('Espèces', '', '1', '10');
  ok(/FC-2026-0010/.test(await p.locator('#toast').innerText()), 'après annulation : 0010');
  // modification (prix HT)
  await p.locator('[data-finvedit]').first().click(); await p.waitForTimeout(250); ok(/Prix unitaire TTC/.test(await p.locator('#modal').innerText()), 'édition en TTC');
  await p.click('#fi-x'); await p.waitForTimeout(150);
  // le chèque est dans Banque
  await L.nav(p, 'banque', 'Chèques reçus'); ok((await p.locator('body').innerText()).includes('1234567'), 'chèque créé dans Chèques reçus');
  // rôles
  for (const r of ['compta', 'ctrl']) { await p.click('#role-chip'); await p.click('[data-setrole="' + r + '"]'); await p.waitForTimeout(250); await L.nav(p, 'facturation', 'Carrière');
    const w = await p.locator('[data-fnew]').count(); ok(r === 'compta' ? w === 1 : w === 0, r + ' : bouton Créer une facture ' + (w ? 'visible' : 'masqué')); }
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
