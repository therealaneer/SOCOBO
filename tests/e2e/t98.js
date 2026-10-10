/* v77 : nouveau menu latéral */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const secs = await p.evaluate(() => [...document.querySelectorAll('#nav .nsec')].map(x => x.textContent.trim()));
  ok(secs.join('|') === 'Pilotage|Ventes et achats|Finance|Production|Magasin|Société|Système', 'sections : ' + secs.join(' | '));
  ok(await p.locator('#side-user').count() === 1 && /DG|Direction/.test(await p.locator('#side-user').innerText()), 'fiche utilisateur');
  await p.click('#side-user', { force: true }); await p.waitForTimeout(250); ok(/Changer de poste/.test(await p.locator('#modal h2').first().innerText()), 'la fiche ouvre « Changer de poste »');
  await p.click('[data-setrole="pdv"]'); await p.waitForTimeout(300);
  const secs2 = await p.evaluate(() => [...document.querySelectorAll('#nav .nsec')].map(x => x.textContent.trim())); ok(secs2.join('|') === 'Pilotage|Ventes et achats|Magasin', 'Caisse : sections ' + secs2.join(' | '));
  ok(/Point de vente/.test(await p.locator('#side-user').innerText()), 'fiche : poste Caisse');
  await L.nav(p, 'pdv', 'Règlement'); await p.waitForTimeout(250); ok(await p.locator('#nav .sbtn.on').innerText().then(x => x.trim()) === 'Règlement', 'sous-menu actif');
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
