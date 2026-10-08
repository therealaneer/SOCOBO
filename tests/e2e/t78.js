const { chromium } = require('playwright'); const L=require('./lib.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const modal = async()=> (await p.locator('#modal').innerText()).replace(/\s+/g,' ');
  await L.nav(p,'clients'); await p.locator('#view-clients tbody tr').first().click(); await p.waitForTimeout(300);
  console.log('Reçu btns', await p.locator('[data-recp]').count());
  await p.locator('#f-pay').click(); await p.waitForTimeout(250);
  await p.fill('#en-amt','1234,5'); await p.fill('#en-ref','7654321'); await p.click('#en-save'); await p.waitForTimeout(400);
  console.log('after enc:', (await modal()).slice(0,700));
  await p.screenshot({path:'rec1.png'});
  await p.click('#dm-close'); await p.waitForTimeout(250);
  await p.locator('[data-recp]').first().click(); await p.waitForTimeout(300); console.log('reprint:', (await modal()).slice(0,200));
  await b.close();
})();
