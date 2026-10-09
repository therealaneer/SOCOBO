/* v70 : Prix convenus suit le mode TVA du formulaire client */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  await L.nav(p, 'clients'); await p.click('#new-client'); await p.waitForTimeout(250); await p.click('#nc-addpx'); await p.waitForTimeout(200);
  const t = async () => (await p.locator('#modal').innerText()).replace(/\s+/g, ' ');
  ok(/Prix TTC \/ m³/.test(await t()) && /Prix normal TTC/.test(await t()) && /TTC · facultatif/.test(await t()), 'TVA 20 % : libellés TTC');
  await p.click('#nc-tva [data-tva="HT"]'); await p.waitForTimeout(200);
  ok(/Prix HT \/ m³/.test(await t()) && /Prix HT \/ t/.test(await t()) && /Prix normal HT/.test(await t()) && /HT · facultatif/.test(await t()) && !/Prix TTC/.test(await t()), 'HT : libellés HT automatiquement');
  await p.click('#nc-tva [data-tva="20"]'); await p.waitForTimeout(200);
  ok(/Prix TTC \/ m³/.test(await t()), 'retour à TVA 20 % : TTC');
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
