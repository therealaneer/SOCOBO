const { chromium } = require('playwright'); const L=require('./lib.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const body = async()=> (await p.locator('#fa-body').innerText()).replace(/\s+/g,' ');
  const modal = async()=> (await p.locator('#modal').innerText()).replace(/\s+/g,' ');
  const sv = async()=> p.locator('#ov:visible').count();
  // Espèces
  await L.nav(p,'facturation','Espèces');
  await p.locator('[data-fsel]').nth(0).check(); await p.locator('[data-fsel]').nth(1).check();
  await p.locator('[data-fmk]').first().click(); await p.waitForTimeout(300);
  console.log('mk:', (await modal()).slice(0,200));
  await p.click('#fm-ok'); await p.waitForTimeout(300); console.log('print modal:', (await modal()).slice(0,300));
  await p.click('#dm-close'); await p.waitForTimeout(300);
  console.log('E list:', (await body()).slice(-600));
  // edit BL
  await p.locator('[data-fed]').first().click(); await p.waitForTimeout(200); console.log('edit inputs', await p.locator('[data-fl]').count());
  await p.locator('[data-fecancel]').first().click();
  // delete BL
  const n0 = await p.locator('[data-fdel]').count(); await p.locator('[data-fdel]').first().click(); await p.waitForTimeout(200); console.log('del', n0, '->', await p.locator('[data-fdel]').count(), 'hid btn', await p.locator('[data-fhid]').count());
  // invoice edit/annul (Espèces list invoices)
  console.log('inv btns', await p.locator('[data-finvedit]').count(), await p.locator('[data-finvann]').count(), await p.locator('[data-finvhist]').count());
  await p.locator('[data-finvann]').first().click(); await p.waitForTimeout(300); console.log('ann modal:', (await modal()).slice(0,200));
  await p.screenshot({path:'fa3.png'});
  const mid = await p.locator('#modal textarea, #modal input').count(); console.log('modal inputs', mid);
  await b.close();
})();
