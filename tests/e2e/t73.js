const { chromium } = require('playwright'); const L=require('./lib.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1300, height: 700 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  await L.nav(p,'carriere','Ancien Machine'); await p.waitForTimeout(200); await p.evaluate(()=>window.scrollTo(0,0)); await p.click('[data-casaisie]'); await p.waitForTimeout(300);
  const hid = await p.locator('#ov').isHidden(); console.log('modal open', !hid, 'html class', await p.evaluate(()=>document.documentElement.className));
  await p.mouse.move(650,350); for (let i=0;i<12;i++) await p.mouse.wheel(0,400); await p.waitForTimeout(200);
  console.log('page scrollY', await p.evaluate(()=>window.scrollY), 'modal scrollTop', await p.evaluate(()=>document.querySelector('#modal').scrollTop));
  await p.keyboard.press('Escape'); await p.waitForTimeout(100); await p.evaluate(()=>{document.getElementById('modal') && 0}); 
  await b.close();
})();
