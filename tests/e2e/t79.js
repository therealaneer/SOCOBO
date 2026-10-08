const { chromium } = require('playwright'); const L=require('./lib.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const body = async()=> (await p.locator('#fa-body').innerText()).replace(/\s+/g,' ');
  const modal = async()=> (await p.locator('#modal').innerText()).replace(/\s+/g,' ');
  await L.nav(p,'facturation','Espèces');
  console.log('empty rows', await p.locator('[data-fsel]').count(), (await body()).match(/Cliquez[^.]*\./));
  await p.click('[data-fimp]'); await p.waitForTimeout(300); const n=await p.locator('[data-fone]').count(); console.log('imported', n);
  await p.screenshot({path:'fb1.png'});
  // re-import: no dup
  await p.click('[data-fimp]'); await p.waitForTimeout(200); console.log('after reimport', await p.locator('[data-fone]').count());
  // edit one BL price
  await p.locator('[data-fed]').first().click(); await p.fill('[data-fl="0|pu"]','100'); await p.click('[data-fesave]'); await p.waitForTimeout(200);
  // delete all, reimport
  while (await p.locator('[data-fdel]').count()) { await p.locator('[data-fdel]').first().click(); await p.waitForTimeout(80); }
  console.log('all deleted', await p.locator('[data-fone]').count());
  await p.click('[data-fimp]'); await p.waitForTimeout(250); console.log('reimported', await p.locator('[data-fone]').count());
  // row facturer
  await p.locator('[data-fone]').first().click(); await p.waitForTimeout(250); console.log('one:', (await modal()).slice(0,260));
  await p.click('#fm-ok'); await p.waitForTimeout(300); await p.click('#dm-close'); await p.waitForTimeout(250);
  // tout facturer
  await p.click('[data-fall]'); await p.waitForTimeout(250); console.log('all:', (await modal()).slice(0,420));
  await p.click('#fm-ok'); await p.waitForTimeout(300);
  console.log('left todo', await p.locator('[data-fone]').count(), (await body()).match(/Factures émises \d+/)[0]);
  // free invoice
  await p.click('[data-fnew]'); await p.waitForTimeout(200);
  console.log('mode field', await p.locator('[data-ff="mode"]').count(), 'piece', await p.locator('[data-ff="piece"]').count());
  await p.selectOption('[data-ff="cid"]', {index:1}); await p.fill('[data-fln="0|des"]','Sable 0/4'); await p.fill('[data-fln="0|q"]','5'); await p.fill('[data-fln="0|pu"]','95');
  await p.click('[data-fgo="E"]'); await p.waitForTimeout(300); console.log('free:', (await modal()).slice(0,120)); await p.click('#dm-close'); await p.waitForTimeout(250);
  console.log('list tail:', (await body()).slice(-250));
  // period
  await p.click('[data-fmode="periode"]'); await p.waitForTimeout(200); console.log('period inputs', await p.locator('#f-from').count(), await p.locator('#f-to').count());
  await b.close();
})();
