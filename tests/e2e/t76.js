const { chromium } = require('playwright'); const L=require('./lib.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const body = async()=> (await p.locator('#fa-body').innerText()).replace(/\s+/g,' ');
  const modal = async()=> (await p.locator('#modal').innerText()).replace(/\s+/g,' ');
  // Chèque
  await L.nav(p,'facturation','Chèque');
  await p.selectOption('[data-ff="cid"]', {index:1}); await p.waitForTimeout(150);
  await p.fill('[data-fln="0|des"]','Gravette 8/15'); await p.fill('[data-fln="0|q"]','10'); await p.fill('[data-fln="0|pu"]','120');
  await p.fill('[data-ff="piece"]','1234567'); await p.waitForTimeout(100);
  console.log('tot', (await p.locator('#fc-tot').innerText()).replace(/\s+/g,' '));
  await p.click('[data-fgo="C"]'); await p.waitForTimeout(400);
  console.log('err', await p.locator('#fc-err:visible').count() ? await p.locator('#fc-err').innerText() : 'none');
  console.log('print:', (await modal()).slice(0,120)); await p.click('#dm-close'); await p.waitForTimeout(300);
  console.log('list:', (await body()).slice(-300));
  // Edit -> v2
  await p.locator('[data-finvedit]').first().click(); await p.waitForTimeout(250);
  await p.fill('[data-fi="0|pu"]','130'); await p.waitForTimeout(100);
  await p.click('#fi-ok'); await p.waitForTimeout(300);
  console.log('after edit modal', await p.locator('#ov:visible').count(), (await modal()).slice(0,150));
  if (await p.locator('#dm-close').count()) { await p.click('#dm-close'); await p.waitForTimeout(250); }
  console.log('list2:', (await body()).slice(-260), '| hist btn', await p.locator('[data-finvhist]').count());
  // CHR created?
  await L.nav(p,'banque','Chèques reçus').catch(()=>{}); await p.waitForTimeout(300);
  console.log('CHR has 1234567:', (await p.locator('body').innerText()).includes('1234567'));
  // Agglos
  await L.nav(p,'facturation','Usine Agglos');
  await p.selectOption('[data-ff="cid"]', {index:1});
  await p.fill('[data-fln="0|des"]','Hourdis 12/20'); await p.fill('[data-fln="0|q"]','500'); await p.fill('[data-fln="0|pu"]','4,5');
  await p.click('[data-fgo="A"]'); await p.waitForTimeout(300); console.log('A:', (await modal()).slice(0,100)); await p.click('#dm-close'); await p.waitForTimeout(250);
  console.log('A list:', (await body()).slice(-200));
  // Annuler
  await p.locator('[data-finvann]').first().click(); await p.waitForTimeout(200); await p.fill('#modal textarea, #modal input','test'); await p.locator('#modal button.primary, #modal .btn.danger, #modal [id$="ok"]').last().click(); await p.waitForTimeout(300);
  console.log('A after ann:', (await body()).slice(-200));
  // roles
  for (const r of ['compta','ctrl','pdv']) { await p.click('#role-chip'); await p.locator('[data-setrole="'+r+'"]:visible').first().click(); await p.waitForTimeout(300);
    const vis = await p.locator('#nav [data-g="facturation"], #nav [data-k="facturation"]').count(); console.log(r,'menu facturation', vis);
    if (vis) { await L.nav(p,'facturation','Chèque'); console.log(r,'edit btns', await p.locator('[data-finvedit]').count(), 'hist', await p.locator('[data-finvhist]').count(), 'form', await p.locator('[data-fgo]').count()); } }
  await b.close();
})();
