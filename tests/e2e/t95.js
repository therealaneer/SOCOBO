/* v73 : Relevé 3 cartes, Situation détaillée, Solde à l'ouverture */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const txt = async s => (await p.locator(s).first().innerText()).replace(/\s+/g, ' ');
  const ths = s => p.evaluate(s => [...document.querySelectorAll(s)].map(x => x.textContent.trim()).join('|'), s);
  await L.nav(p, 'clients'); await p.locator('#view-clients tbody tr', { hasText: 'Atlas' }).first().click(); await p.waitForTimeout(350);
  await p.click('#f-print'); await p.waitForTimeout(200); await p.click('#pm-go'); await p.waitForTimeout(300);
  const cards = await p.evaluate(() => [...document.querySelectorAll('#modal .psum > *')].map(x => x.innerText.replace(/\s+/g, ' ').trim()));
  console.log(cards);
  ok(cards.length === 3 && /Chiffre d.affaires/.test(cards[0]) && /Total encaissé/.test(cards[1]) && /Reste dû/.test(cards[2]), '3 cartes client');
  const h = await ths('#modal table:first-of-type thead th'); ok(h === 'Date|Pièce|Montant|Réglé|Solde dû', 'colonnes relevé (' + h + ')');
  await p.screenshot({ path: 's95a.png' }); await p.click('#pv-close'); await p.waitForTimeout(200);
  await p.click('[data-blsit="det"]'); await p.waitForTimeout(200); await p.click('#pm-go'); await p.waitForTimeout(300);
  const h2 = await ths('.paper .inv-tb thead th'); ok(h2 === 'Date|N° BL|Qté|Désignation|Prix|Total|Total général', 'colonnes détaillée (' + h2 + ')');
  const np = await p.locator('.paper .inv-pay').count(); ok(np > 0, 'lignes de paiement vertes (' + np + ')');
  ok(/Solde à l.ouverture de la période/.test(await txt('.paper')), 'ligne ouverture');
  const lastc = await p.evaluate(() => { const r = [...document.querySelectorAll('.paper .inv-tb tfoot td')].map(x => x.innerText.replace(/\s/g, '')); return r[r.length - 1]; });
  const solde = await p.evaluate(() => document.querySelector('.paper .inv-dl dd').innerText.replace(/\s/g, ''));
  ok(lastc === solde, 'total général final = reste dû (' + lastc + ' / ' + solde + ')');
  await p.screenshot({ path: 's95b.png' }); await p.click('#dm-close'); await p.waitForTimeout(200);
  // solde à l'ouverture
  await L.nav(p, 'clients'); await p.click('text=Nouveau client').catch(() => {}); await p.waitForTimeout(300);
  ok(await p.locator('#nc-ouv').count() === 1, 'champ #nc-ouv');
  await p.click('#nc-cancel'); await p.waitForTimeout(200);
  await L.nav(p, 'clients'); await p.locator('#view-clients tbody tr', { hasText: 'Atlas' }).first().click(); await p.waitForTimeout(350);
  const rd = async () => { await p.click('#f-print'); await p.waitForTimeout(200); await p.click('#pm-go'); await p.waitForTimeout(300); const v = await p.evaluate(() => document.querySelector('#modal .psum .pk b').innerText.replace(/\s/g,'')); await p.click('#pv-close'); await p.waitForTimeout(200); return v; };
  const before = await rd();
  await p.click('#f-edit'); await p.waitForTimeout(250); await p.fill('#nc-ouv', '1000'); await p.click('#nc-save'); await p.waitForTimeout(400);
  const after = await rd();
  console.log(before, '=>', after); ok(before === '781734,42' && after === '782734,42', 'solde à l’ouverture +1000 sur le Reste dû');
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
