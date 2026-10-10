/* v74 : page Règlement (Caisse), reçu, situation détaillée en m³, tableaux de feuilles */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const txt = async s => (await p.locator(s).first().innerText()).replace(/\s+/g, ' ');
  const navs = await p.evaluate(() => [...document.querySelectorAll('#nav button')].map(x => x.textContent.trim()));
  ok(navs.includes('Règlement'), 'menu : Règlement (' + navs.join(',') + ')');
  await L.nav(p, 'pdv', 'Règlement'); await p.waitForTimeout(300);
  ok(/Règlement/.test(await txt('#view-reglement h1')), 'page Règlement ouverte');
  const th = await p.evaluate(() => [...document.querySelector('#rg-body table').querySelectorAll('th')].map(x => x.textContent.trim()).join('|'));
  ok(th === 'Client|Catégorie|Reste dû|Action', 'colonnes (' + th + ')');
  const nb = await p.locator('[data-rgenc]').count(); const nc = await p.evaluate(() => clients ? 0 : 0).catch(() => 0); ok(nb > 5, 'liste des clients (' + nb + ')');
  await p.fill('#rg-q', 'Atlas'); await p.waitForTimeout(200); ok(await p.locator('[data-rgenc]').count() === 1, 'recherche');
  await p.click('[data-rgenc]'); await p.waitForTimeout(250);
  ok(/Atlas/.test(await txt('#modal')) , 'fenêtre Encaisser');
  await p.click('#en-modes [data-mode="Espèces"]'); await p.fill('#en-amt', '500'); await p.click('#en-save'); await p.waitForTimeout(400);
  ok(/Reçu REC-/.test(await txt('#modal h2, .paper, #dm-title').catch(() => '')) || /REC-2026/.test(await p.evaluate(() => document.body.innerText)), 'reçu affiché');
  await p.screenshot({ path: 's96a.png' });
  await p.keyboard.press('Escape'); await p.click('#dm-close').catch(() => {}); await p.waitForTimeout(300);
  const lines = await p.locator('[data-rgrec]').count(); ok(lines === 1, 'règlement du jour listé (' + lines + ')');
  await p.screenshot({ path: 's96b.png' });
  // situation détaillée en m3
  await L.nav(p, 'clients'); await p.locator('#view-clients tbody tr', { hasText: 'Atlas' }).first().click(); await p.waitForTimeout(350);
  await p.click('[data-blsit="det"]'); await p.waitForTimeout(200); await p.click('#pm-go'); await p.waitForTimeout(300);
  const q = await p.evaluate(() => [...document.querySelectorAll('.paper .inv-tb tbody tr td:nth-child(3)')].map(x => x.textContent.trim()));
  ok(q.filter(x => /\bt$/.test(x)).length === 0 && q.some(x => /m³/.test(x)), 'quantités en m³ (' + q.slice(0, 4).join(',') + ')');
  await p.screenshot({ path: 's96c.png' });
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
