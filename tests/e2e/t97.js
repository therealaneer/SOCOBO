/* v75 : recherche Magasin, N° de pièce, Bon de sortie, facture fournisseur à lignes sans destination */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const txt = async s => (await p.locator(s).first().innerText()).replace(/\s+/g, ' ');
  const rowsN = () => p.locator('#mag-main tbody tr').count();
  // --- DG : pièces
  await L.nav(p, 'stock', 'Pièces de rechange'); await p.waitForTimeout(300);
  ok(await p.locator('#mag-q').count() === 1, 'barre de recherche au-dessus du tableau');
  const th = await p.evaluate(() => [...document.querySelectorAll('#mag-main thead th')].map(x => x.textContent.trim()).join('|')); ok(/N° de pièce/.test(th), 'colonne N° de pièce (' + th + ')');
  const n0 = await rowsN();
  await p.fill('#mag-q', 'courroie'); await p.waitForTimeout(250); const n1 = await rowsN(); ok(n1 > 0 && n1 < n0, 'recherche par nom (' + n0 + '→' + n1 + ')');
  await p.fill('#mag-q', 'PR-003'); await p.waitForTimeout(250); ok(await rowsN() === 1, 'recherche par numéro');
  const mach = await p.evaluate(() => { const t = document.querySelector('[data-mgtab="out"]'); return null; });
  await p.fill('#mag-q', ''); await p.click('[data-mgtab="out"]'); await p.waitForTimeout(250);
  const m1 = await p.evaluate(() => document.querySelector('#mag-main tbody tr td:nth-child(3)').textContent.trim());
  await p.fill('#mag-q', m1.split(' ')[0]); await p.waitForTimeout(250); ok(await rowsN() >= 1 && /./.test(await txt('#mag-main tbody')), 'recherche par machine (' + m1 + ')');
  await p.fill('#mag-q', ''); await p.click('[data-mgtab="stock"]'); await p.waitForTimeout(200);
  // --- sortie + bon (DG)
  await p.click('[data-mgout]'); await p.waitForTimeout(250);
  ok(await p.locator('#mo-f').count() === 1 && await p.locator('#mo-s').count() === 1, 'champs Pour et Imputé à');
  await p.fill('#mo-q', '1'); await p.fill('#mo-w', 'Karim Mécano'); await p.fill('#mo-f', 'Hassan chauffeur');
  const opt = await p.evaluate(() => [...document.querySelectorAll('#mo-m option')].map(o => o.value || o.textContent).filter(x => x && x !== '__none' && !/Choisir/.test(x))[0]);
  await p.selectOption('#mo-m', opt); await p.waitForTimeout(100);
  const site = await p.inputValue('#mo-s'); ok(!!site, 'site proposé selon la machine (' + opt + ' → ' + site + ')');
  await p.click('#mg-save'); await p.waitForTimeout(350);
  const bon = await txt('.paper'); ok(/BON DE SORTIE MAGASIN BS-2026-/.test(bon) && /Karim Mécano/.test(bon) && /Hassan chauffeur/.test(bon) && /Magasinier/.test(bon) && /Mécanicien/.test(bon) && /Bénéficiaire/.test(bon), 'bon de sortie avec 3 signatures');
  ok(!/\d\s?MAD|Prix|Coût/.test(bon), 'bon sans prix');
  await p.screenshot({ path: 's97a.png' }); await p.click('#dm-print').catch(() => {}); await p.waitForTimeout(150); await p.click('#dm-close'); await p.waitForTimeout(200);
  await p.click('[data-mgtab="out"]'); await p.waitForTimeout(200); await p.locator('[data-mgbon]').last().click(); await p.waitForTimeout(250);
  ok(/DUPLICATA/.test(await txt('.paper')), 'réimpression : DUPLICATA'); await p.click('#dm-close'); await p.waitForTimeout(200);
  // --- facture fournisseur
  await L.nav(p, 'fournisseurs'); await p.locator('#view-fournisseurs tbody tr').first().click(); await p.waitForTimeout(350);
  await p.click('#f-buy'); await p.waitForTimeout(250);
  ok(await p.locator('#bm-dest').count() === 0, 'plus de champ Destination de l’achat');
  ok(await p.locator('#bm-ll select').count() === 1, 'lignes de facture toujours présentes');
  const opts = await p.evaluate(() => [...document.querySelectorAll('#bm-ll select optgroup')].map(o => o.label).join(',')); ok(/Pièces/.test(opts) && /Huiles/.test(opts) && /Gasoil/.test(opts), 'articles : ' + opts);
  const q0 = await p.evaluate(() => 0);
  await p.selectOption('#bm-ll select', { index: 1 }); await p.waitForTimeout(150); await p.fill('[data-lq="0"]', '5'); await p.waitForTimeout(100);
  await p.click('#bm-save'); await p.waitForTimeout(400);
  ok(/Achat enregistré/.test(await p.evaluate(() => document.body.innerText)), 'facture enregistrée');
  // --- Caisse : recherche + bon
  await p.click('#role-chip'); await p.click('[data-setrole="pdv"]'); await p.waitForTimeout(300);
  await L.nav(p, 'stock', 'Pièces de rechange'); await p.waitForTimeout(300);
  ok(await p.locator('#mag-q').count() === 1, 'Caisse : barre de recherche'); await p.fill('#mag-q', 'filtre'); await p.waitForTimeout(200); ok(await rowsN() >= 1, 'Caisse : recherche');
  await p.fill('#mag-q', ''); await p.click('[data-mgtab="mine"]'); await p.waitForTimeout(200); ok(await p.locator('[data-mgbon]').count() > 0, 'Caisse : bouton Bon dans Sorties récentes');
  await p.screenshot({ path: 's97b.png' });
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
