const { chromium } = require('playwright'); const L=require('./lib.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const modal = async()=> (await p.locator('#modal').innerText()).replace(/\s+/g,' ');
  await p.click('#role-chip'); await p.click('[data-setrole="pdv"]'); await p.waitForTimeout(300);
  await p.mouse.move(1000,500);
  for (const pay of ['cash','credit']) {
    await p.click('[data-pcl="101"]'); await p.click('[data-ptr="48217-B-6"]'); await p.click('[data-pprod="sa"]'); await p.click('[data-padd="5000"]').catch(()=>{});
    await p.click('[data-pay="'+pay+'"]').catch(()=>{}); await p.waitForTimeout(100);
    await p.click('#pdv-go').catch(e=>console.log('go fail')); await p.waitForTimeout(300);
    console.log(pay, (await modal()).slice(0,160)); await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  }
  // receipt
  await p.click('#role-chip'); await p.click('[data-setrole="dg"]'); await p.waitForTimeout(300);
  await L.nav(p,'clients'); await p.locator('#view-clients tbody tr').first().click(); await p.waitForTimeout(300);
  console.log('Reçu btns', await p.locator('[data-recp]').count());
  await p.locator('[data-recp]').first().click(); await p.waitForTimeout(300); console.log((await modal()).slice(0,500));
  await p.click('#dm-close'); await p.waitForTimeout(200);
  await p.locator('#f-pay').click(); await p.waitForTimeout(250);
  await p.fill('#en-amt','1234,5'); await p.fill('#en-ref','7654321'); await p.click('#en-save'); await p.waitForTimeout(400);
  console.log('after enc:', (await modal()).slice(0,500));
  await b.close();
})();
