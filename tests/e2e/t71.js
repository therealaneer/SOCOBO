const { chromium } = require('playwright'); const L=require('./lib.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  await L.nav(p,'personnel','Présences'); await p.waitForTimeout(200);
  console.log((await p.locator('#pe-body thead').innerText()).replace(/\s+/g,' '));
  console.log('dest options', await p.locator('[data-pf="dest"]').first().locator('option').allInnerTexts());
  await p.locator('[data-pf="dest"]').first().selectOption('Atelier'); await p.waitForTimeout(200);
  await p.locator('[data-pf="hw"]').nth(1).fill('10'); await p.locator('[data-pf="hs"]').nth(1).fill('2');
  console.log((await p.locator('#pe-body .kpis').innerText()).replace(/\n/g,' | '));
  await p.screenshot({path:'sh71.png'});
  await p.click('#pe-save'); await p.waitForTimeout(250); console.log('toast', await p.locator('#toast').innerText());
  await L.nav(p,'personnel','Paie'); console.log((await p.locator('#pe-body').innerText()).includes('NaN'));
  await L.nav(p,'charges','Coûts globaux'); console.log((await p.locator('#view-charges').innerText()).includes('NaN'));
  await b.close();
})();
