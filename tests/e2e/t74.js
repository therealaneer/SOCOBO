const { chromium } = require('playwright'); const L=require('./lib.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const h1 = async()=> (await p.locator('section:visible h1').first().innerText()).replace(/\s+/g,' ');
  const vis = async()=> await p.locator('button.back:visible').count();
  await L.nav(p,'clients'); await p.locator('#view-clients tbody tr').first().click(); await p.waitForTimeout(250); console.log('fiche', await h1(), 'inner visible', await vis(), 'disabled', await p.locator('#nav-back').isDisabled());
  await p.click('#nav-back'); await p.waitForTimeout(250); console.log('back ->', await h1());
  await L.nav(p,'stock','Gasoil'); await p.click('[data-mgfiche]'); await p.waitForTimeout(200); console.log('mag fiche', await h1(), 'inner', await vis());
  await p.click('#nav-back'); await p.waitForTimeout(200); console.log('back ->', await h1());
  await L.nav(p,'machines'); await p.locator('#view-machines tbody tr').first().click(); await p.waitForTimeout(250); console.log('mach', await vis()); await p.click('#nav-back'); await p.waitForTimeout(200); console.log('back ->', await h1());
  // inner-only case: reload and open Magasin item with empty history via role switch
  await p.click('#role-chip'); await p.locator('[data-setrole="compta"]:visible').first().click(); await p.waitForTimeout(300);
  await L.nav(p,'personnel','Employés'); await p.locator('[data-pfiche]').first().click(); await p.waitForTimeout(250); console.log('perso fiche inner', await vis(), 'disabled', await p.locator('#nav-back').isDisabled());
  await p.click('#nav-back'); await p.waitForTimeout(200); console.log('back ->', await h1());
  await b.close();
})();
