/* v71 : bouton « Relevé de compte » ; situations journalière et détaillée de la fiche client */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const txt = async s => (await p.locator(s).first().innerText()).replace(/\s+/g, ' ');
  await L.nav(p, 'clients'); await p.locator('#view-clients tbody tr', { hasText: 'Atlas' }).first().click(); await p.waitForTimeout(350);
  ok(/Relevé de compte/.test(await txt('#f-print')) && !/Imprimer/.test(await txt('#f-print')), 'bouton « Relevé de compte »');
  await p.click('#f-print'); await p.waitForTimeout(200); ok(/Relevé de compte/.test(await txt('#modal h2')) && await p.inputValue('#pm-year') === 'all', 'fenêtre « Relevé de compte »'); await p.click('#pm-cancel'); await p.waitForTimeout(150);
  const bs = await p.evaluate(() => [...document.querySelectorAll('#f-tabx [data-blsit]')].map(x => x.textContent.trim()));
  ok(bs.join('|') === 'Imprimer situation journalière|Imprimer situation détaillée', 'deux boutons dans l’onglet BL');
  await p.click('[data-tab="achats"]'); await p.waitForTimeout(150); ok(await p.locator('[data-blsit]').count() === 0, 'pas de boutons dans Factures'); await p.click('[data-tab="bl"]'); await p.waitForTimeout(150);
  const geo = await p.evaluate(() => { const tb = document.querySelector('#f-tabs').getBoundingClientRect(), bx = document.querySelector('#f-tabx').getBoundingClientRect(), sr = document.querySelector('#bl-q').getBoundingClientRect(), tbl = document.querySelector('#bl-tbl').getBoundingClientRect(); return [bx.left > tb.right, Math.abs(bx.top - tb.top) < 40, sr.top > tb.bottom, sr.bottom <= tbl.top + 1]; });
  ok(geo.every(Boolean), 'boutons à droite des onglets, recherche seule au-dessus du tableau (' + geo.join(',') + ')');
  // journalière
  await p.click('[data-blsit="day"]'); await p.waitForTimeout(200); ok(/Situation journalière/.test(await txt('#modal h2')), 'fenêtre de période : Situation journalière');
  await p.click('#pm-go'); await p.waitForTimeout(300);
  const dayTxt = await txt('.paper'); const ths = await p.evaluate(() => [...document.querySelectorAll('.paper .inv-tb thead th')].map(x => x.textContent.trim()).join('|'));
  ok(ths === 'Date|Nombre de BL|Total BL|Paiements|Reste cumulé' && /SITUATION JOURNALIÈRE/.test(dayTxt) && /Atlas Travaux SARL/.test(dayTxt), 'situation journalière : colonnes (' + ths + ')');
  const rest = await p.evaluate(() => { const r = [...document.querySelectorAll('.paper .inv-tb tfoot td')].map(x => x.innerText.replace(/\s/g, '')); return r[r.length - 1]; });
  const solde = await p.evaluate(() => document.querySelector('.paper .inv-dl dd').innerText.replace(/\s/g, ''));
  ok(rest === solde, 'reste cumulé final = reste dû actuel (' + rest + ')');
  await p.screenshot({ path: 's73a.png' }); await p.click('#dm-close'); await p.waitForTimeout(200);
  // détaillée
  await p.click('[data-blsit="det"]'); await p.waitForTimeout(200); await p.click('#pm-go'); await p.waitForTimeout(300);
  const dt = await txt('.paper'); ok(/SITUATION DÉTAILLÉE/.test(dt) && /BL-2026-/.test(dt) && /Reste dû/.test(dt), 'situation détaillée : BL du jour avec leurs lignes');
  await p.screenshot({ path: 's73b.png' });
  await p.emulateMedia({ media: 'print' }); await p.pdf({ path: 's73.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
